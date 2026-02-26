const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

// ─── GET /api/questions/next ────────────────────────────────────────
// Serve the next unseen question for a user (anti-repetition logic)
router.get('/next', requireAuth, async (req, res) => {
    try {
        const { sdgId, difficulty, type } = req.query;
        if (!sdgId) return res.status(400).json({ error: 'sdgId is required' });

        // Fetch user's seen question list for this SDG
        const user = await User.findById(req.user.userId).select('seenQuestions').lean();
        const seenForSDG = user?.seenQuestions?.[sdgId] || [];

        const filter = {
            'metadata.reviewStatus': 'approved',
            sdgId,
            questionId: { $nin: seenForSDG },  // exclude already-seen questions
        };
        if (difficulty) filter.difficulty = Number(difficulty);
        if (type) filter.type = type;

        // Get total count to enable random selection
        const count = await Question.countDocuments(filter);

        if (count === 0) {
            // All questions seen — reset that SDG's history and re-fetch
            await User.findByIdAndUpdate(req.user.userId, {
                $unset: { [`seenQuestions.${sdgId}`]: '' }
            });
            const freshCount = await Question.countDocuments({ 'metadata.reviewStatus': 'approved', sdgId });
            if (freshCount === 0) return res.status(404).json({ error: 'No questions found for this SDG' });
            const q = await Question.findOne({ 'metadata.reviewStatus': 'approved', sdgId })
                .skip(Math.floor(Math.random() * freshCount)).lean();
            return res.json({ question: q, seenReset: true });
        }

        // Random skip to select a pseudo-random unseen question
        const question = await Question.findOne(filter)
            .skip(Math.floor(Math.random() * count))
            .lean();

        // Mark as seen (non-blocking)
        User.findByIdAndUpdate(req.user.userId, {
            $addToSet: { [`seenQuestions.${sdgId}`]: question.questionId }
        }).catch(() => { });

        res.json({ question });
    } catch (err) {
        res.status(500).json({ error: 'Question fetch failed' });
    }
});

// ─── GET /api/questions/quiz ────────────────────────────────────────
// Returns N random questions for a quiz (with correctIndex exposed for client scoring)
router.get('/quiz', requireAuth, async (req, res) => {
    try {
        const { sdgId, count = 15 } = req.query;
        if (!sdgId) return res.status(400).json({ error: 'sdgId is required' });

        const n = Math.min(Number(count), 20);
        const total = await Question.countDocuments({ 'metadata.reviewStatus': 'approved', sdgId });

        if (total === 0) {
            // No questions in DB — return empty so frontend can handle gracefully
            return res.json({ questions: [], total: 0 });
        }

        // Random sample using aggregation
        const questions = await Question.aggregate([
            { $match: { 'metadata.reviewStatus': 'approved', sdgId } },
            { $sample: { size: n } },
            {
                $project: {
                    questionId: 1,
                    sdgId: 1,
                    content: 1,
                    correctIndex: 1,
                    difficulty: 1,
                }
            },
        ]);

        res.json({ questions, total: questions.length });
    } catch (err) {
        console.error('[questions/quiz]', err);
        res.status(500).json({ error: 'Quiz questions fetch failed' });
    }
});


// ─── POST /api/questions/seen ───────────────────────────────────────
// Manually mark a question as seen (for knowledge-gate questions served inline)
router.post('/seen', requireAuth, async (req, res) => {
    try {
        const { sdgId, questionId } = req.body;
        if (!sdgId || !questionId) return res.status(400).json({ error: 'sdgId and questionId required' });
        await User.findByIdAndUpdate(req.user.userId, {
            $addToSet: { [`seenQuestions.${sdgId}`]: questionId }
        });
        res.json({ recorded: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to record seen question' });
    }
});

// ─── GET /api/questions ─────────────────────────────────────────────
// Fetch questions for a given SDG (used by teachers to preview pool)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { sdgId, difficulty, type, limit = 20 } = req.query;
        const filter = { 'metadata.reviewStatus': 'approved' };
        if (sdgId) filter.sdgId = sdgId;
        if (difficulty) filter.difficulty = Number(difficulty);
        if (type) filter.type = type;

        const questions = await Question.find(filter)
            .limit(Number(limit))
            .select('-content.choices.isCorrect') // hide answers from this endpoint
            .lean();

        res.json({ total: questions.length, questions });
    } catch (err) {
        res.status(500).json({ error: 'Question fetch failed' });
    }
});

// ─── POST /api/questions ────────────────────────────────────────────
// Create a question (admin/teacher only)
router.post('/', requireAuth, requireRole('teacher', 'ngo_admin'), async (req, res) => {
    try {
        const q = await Question.create(req.body);
        res.status(201).json({ question: q });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ─── POST /api/questions/verify ─────────────────────────────────────
// Check if an answer is correct (server-authoritative)
router.post('/verify', requireAuth, async (req, res) => {
    try {
        const { questionId, choiceId } = req.body;
        const q = await Question.findOne({ questionId }).lean();
        if (!q) return res.status(404).json({ error: 'Question not found' });

        const correct = q.content.choices.find(c => c.isCorrect);
        const isCorrect = correct?.id === choiceId;
        res.json({
            isCorrect,
            correctChoiceId: correct?.id,
            feedback: q.content.choices.find(c => c.id === choiceId)?.feedback || '',
            explanation: q.content.explanation || '',
        });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

module.exports = router;
