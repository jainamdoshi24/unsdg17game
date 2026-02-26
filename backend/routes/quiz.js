const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');
const MissionSession = require('../models/MissionSession');
const { requireAuth } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../utils/badges');

// ─── POST /api/quiz/submit ──────────────────────────────────────────────────
// Score a quiz, award XP, check badges
router.post('/submit', requireAuth, async (req, res) => {
    try {
        const { sdgId, answers } = req.body;
        if (!sdgId || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'sdgId and answers[] are required' });
        }

        // Fetch all questions answered
        const questionIds = answers.map(a => a.questionId);
        const questions = await Question.find({ questionId: { $in: questionIds } }).lean();
        const qMap = Object.fromEntries(questions.map(q => [q.questionId, q]));

        // Score
        let correct = 0;
        const results = answers.map(a => {
            const q = qMap[a.questionId];
            if (!q) return { questionId: a.questionId, correct: false };
            const isCorrect = q.correctIndex === a.selectedIndex;
            if (isCorrect) correct++;
            return { questionId: a.questionId, correct: isCorrect, correctIndex: q.correctIndex };
        });

        const total = answers.length;
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

        // XP calculation
        let xpEarned = 10;
        if (pct >= 80) xpEarned = 100;
        else if (pct >= 60) xpEarned = 60;
        else if (pct >= 40) xpEarned = 30;

        // Anti-farm: only award XP if this beats the user's previous best quiz score for this SDG
        const user = await User.findById(req.user.userId)
            .select('quizBests totalXP')
            .lean();
        const prevBest = user?.quizBests?.[sdgId] ?? 0;
        const scoreImproved = pct > prevBest;
        const actualXp = scoreImproved ? xpEarned : 0;

        // Update user
        const updateOps = {};
        if (scoreImproved) {
            updateOps.$inc = { totalXP: actualXp };
            updateOps.$set = { [`quizBests.${sdgId}`]: pct };
        }

        if (Object.keys(updateOps).length > 0) {
            await User.findByIdAndUpdate(req.user.userId, updateOps);
        }

        // Badge check (pass quiz pct so knowledge_master can trigger)
        const newBadges = await checkAndAwardBadges(
            req.user.userId, User, MissionSession, pct
        );

        res.json({
            score: correct,
            total,
            pct,
            xpEarned: actualXp,
            scoreImproved,
            prevBest,
            results,
            newBadges: newBadges.map(b => ({ id: b.id, label: b.label, icon: b.icon })),
        });
    } catch (err) {
        console.error('[quiz/submit]', err);
        res.status(500).json({ error: 'Quiz submission failed' });
    }
});

// ─── GET /api/quiz/best ─────────────────────────────────────────────────────
// Returns user's best quiz scores per SDG
router.get('/best', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('quizBests').lean();
        res.json({ quizBests: user?.quizBests || {} });
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch quiz bests' });
    }
});

module.exports = router;
