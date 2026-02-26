const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/leaderboard/global ───────────────────────────────────
router.get('/global', requireAuth, async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const top = await User.find({ role: 'student' })
            .sort({ totalXP: -1 })
            .limit(Number(limit))
            .select('displayName totalXP badges grade sdgProgress')
            .lean();

        const entries = top.map((u, i) => ({
            rank: i + 1,
            displayName: u.displayName,
            userId: u._id,
            totalXP: u.totalXP,
            grade: u.grade,
            sdgsCompleted: Object.values(u.sdgProgress || {}).filter(p => p.missionsCompleted >= 3).length,
            badges: (u.badges || []).slice(0, 3),
        }));

        // Include requesting user's rank
        const myRankEntry = await User.findById(req.user.userId).select('totalXP').lean();
        const myRank = myRankEntry
            ? await User.countDocuments({ totalXP: { $gt: myRankEntry.totalXP } }) + 1
            : null;

        res.json({ entries, myRank });
    } catch (err) {
        res.status(500).json({ error: 'Leaderboard fetch failed' });
    }
});

// ─── GET /api/leaderboard/sdg/:sdgId ──────────────────────────────
router.get('/sdg/:sdgId', requireAuth, async (req, res) => {
    try {
        const { sdgId } = req.params;
        const { limit = 50 } = req.query;

        // Use aggregation to sort by SDG-specific high score
        const top = await User.aggregate([
            { $match: { [`sdgProgress.${sdgId}`]: { $exists: true } } },
            {
                $project: {
                    displayName: 1,
                    grade: 1,
                    highScore: `$sdgProgress.${sdgId}.highScore`,
                    missionsCompleted: `$sdgProgress.${sdgId}.missionsCompleted`,
                }
            },
            { $sort: { highScore: -1 } },
            { $limit: Number(limit) },
        ]);

        const entries = top.map((u, i) => ({ rank: i + 1, ...u }));
        res.json({ sdgId, entries });
    } catch (err) {
        res.status(500).json({ error: 'SDG leaderboard fetch failed' });
    }
});

module.exports = router;
