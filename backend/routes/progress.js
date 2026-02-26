const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MissionSession = require('../models/MissionSession');
const { requireAuth } = require('../middleware/auth');

const ALL_SDGS = Array.from({ length: 17 }, (_, i) => `SDG_${String(i + 1).padStart(2, '0')}`);

// ─── GET /api/progress/overview ────────────────────────────────────
// Returns the logged-in user's complete SDG progress overview
router.get('/overview', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('displayName totalXP badges sdgProgress skillRating')
            .lean();

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Enrich each SDG entry with session counts
        const sdgStats = {};
        for (const sdgId of ALL_SDGS) {
            const prog = user.sdgProgress?.[sdgId] || {};
            sdgStats[sdgId] = {
                missionsCompleted: prog.missionsCompleted || 0,
                highScore: prog.highScore || 0,
                totalTimeSec: prog.totalTimeSec || 0,
                lastPlayedAt: prog.lastPlayedAt || null,
                difficultyUnlocked: prog.difficultyUnlocked || 1,
            };
        }

        const totalMissions = Object.values(sdgStats).reduce((s, v) => s + v.missionsCompleted, 0);
        const sdgsStarted = Object.values(sdgStats).filter(v => v.missionsCompleted > 0).length;

        res.json({
            displayName: user.displayName,
            totalXP: user.totalXP,
            skillRating: user.skillRating,
            badges: user.badges,
            totalMissions,
            sdgsStarted,
            sdgsCompleted: Object.values(sdgStats).filter(v => v.missionsCompleted >= 3).length,
            sdgProgress: sdgStats,
        });
    } catch (err) {
        console.error('[progress/overview]', err);
        res.status(500).json({ error: 'Progress fetch failed' });
    }
});

// ─── GET /api/progress/sdg/:sdgId ──────────────────────────────────
// Detailed progress for a single SDG
router.get('/sdg/:sdgId', requireAuth, async (req, res) => {
    try {
        const { sdgId } = req.params;
        const userId = req.user.userId;

        const sessions = await MissionSession.find({ userId, sdgId, status: 'completed' })
            .sort({ createdAt: -1 }).limit(20).lean();

        const scores = sessions.map(s => s.score?.normalized || 0);
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const bestScore = scores.length ? Math.max(...scores) : 0;
        const totalTime = sessions.reduce((s, v) => s + (v.durationSec || 0), 0);

        // Learning delta = improvement from first to last score
        const learningDelta = scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0;

        res.json({
            sdgId,
            missionsCompleted: sessions.length,
            avgScore,
            bestScore,
            totalTimeSec: totalTime,
            learningDelta,
            recentSessions: sessions.slice(0, 5).map(s => ({
                missionId: s.missionId,
                archetypeId: s.archetypeId,
                score: s.score?.normalized,
                durationSec: s.durationSec,
                completedAt: s.completedAt,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: 'SDG progress fetch failed' });
    }
});

// ─── GET /api/progress/me ────────────────────────────────────────────
// Alias used by progressService.ts — returns the logged-in user's progress
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('displayName totalXP badges sdgProgress skillRating')
            .lean();

        if (!user) return res.status(404).json({ error: 'User not found' });

        const ALL_SDG_IDS = Array.from({ length: 17 }, (_, i) => `SDG_${String(i + 1).padStart(2, '0')}`);
        const sdgProgress = {};
        for (const sdgId of ALL_SDG_IDS) {
            const prog = user.sdgProgress?.[sdgId] || {};
            sdgProgress[sdgId] = {
                completions: prog.missionsCompleted || 0,
                bestScore: prog.highScore || 0,
                totalXP: Math.round((prog.highScore || 0) * 10),
                lastPlayedAt: prog.lastPlayedAt || null,
            };
        }

        res.json({
            displayName: user.displayName,
            totalXP: user.totalXP || 0,
            skillRating: user.skillRating || 1000,
            badges: user.badges || [],
            sdgProgress,
        });
    } catch (err) {
        console.error('[progress/me]', err);
        res.status(500).json({ error: 'Progress fetch failed' });
    }
});

module.exports = router;
