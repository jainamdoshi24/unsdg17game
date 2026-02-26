const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');
const MissionSession = require('../models/MissionSession');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

// ─── POST /api/analytics/event ─────────────────────────────────────
// Client fires events (question answered, narrative choice, etc.)
router.post('/event', requireAuth, async (req, res) => {
    try {
        const { eventType, sdgId, missionId, sessionId, payload, deviceType } = req.body;
        await AnalyticsEvent.create({
            eventType,
            userId: req.user.userId,
            sdgId,
            missionId,
            sessionId,
            payload,
            deviceType,
        });
        res.status(202).json({ received: true });
    } catch (err) {
        // Non-critical: don't fail gameplay on analytics error
        res.status(202).json({ received: false });
    }
});

// ─── GET /api/analytics/dashboard ──────────────────────────────────
// Teacher / NGO dashboard summary (role-gated)
router.get('/dashboard', requireAuth, requireRole('teacher', 'ngo_admin', 'super_admin'), async (req, res) => {
    try {
        const { from, to } = req.query;
        const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400 * 1000);
        const end = to ? new Date(to) : new Date();

        const [totalSessions, completedSessions, totalEvents] = await Promise.all([
            MissionSession.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            MissionSession.countDocuments({ status: 'completed', createdAt: { $gte: start, $lte: end } }),
            AnalyticsEvent.countDocuments({ serverTimestamp: { $gte: start, $lte: end } }),
        ]);

        // Average score
        const scoreAgg = await MissionSession.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, avgScore: { $avg: '$score.normalized' }, totalTime: { $sum: '$durationSec' } } },
        ]);

        // Breakdown per SDG
        const sdgBreakdown = await MissionSession.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: '$sdgId', count: { $sum: 1 }, avgScore: { $avg: '$score.normalized' } } },
            { $sort: { count: -1 } },
        ]);

        res.json({
            period: { from: start, to: end },
            totalSessions,
            completedSessions,
            completionRate: totalSessions ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0,
            avgScore: scoreAgg[0]?.avgScore?.toFixed(1) || 0,
            totalEventsLogged: totalEvents,
            totalPlaytimeSec: scoreAgg[0]?.totalTime || 0,
            sdgBreakdown: sdgBreakdown.map(r => ({
                sdgId: r._id,
                missionsCompleted: r.count,
                avgScore: r.avgScore?.toFixed(1),
            })),
        });
    } catch (err) {
        console.error('[analytics/dashboard]', err);
        res.status(500).json({ error: 'Dashboard fetch failed' });
    }
});

// ─── GET /api/analytics/engagement/:userId ─────────────────────────
// Per-student engagement score (teacher/admin only)
router.get('/engagement/:userId', requireAuth, requireRole('teacher', 'ngo_admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const weekAgo = new Date(Date.now() - 7 * 86400 * 1000);

        const sessions = await MissionSession.find({
            userId,
            createdAt: { $gte: weekAgo },
        }).lean();

        const completed = sessions.filter(s => s.status === 'completed');
        const scores = completed.map(s => s.score?.normalized || 0);
        const accuracy = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length / 100 : 0;

        const returnDays = new Set(
            sessions.map(s => new Date(s.createdAt).toDateString())
        ).size;

        const avgDuration = sessions.length
            ? sessions.reduce((s, v) => s + (v.durationSec || 0), 0) / sessions.length / 60
            : 0;

        // Engagement score (0–100)
        const sessFreq = Math.min(sessions.length / 5, 1) * 20;
        const sessDepth = Math.min(avgDuration / 30, 1) * 20;
        const completion = Math.min(completed.length / 3, 1) * 25;
        const accuracySc = accuracy * 20;
        const retention = Math.min(returnDays / 5, 1) * 15;
        const engagement = Math.round(sessFreq + sessDepth + completion + accuracySc + retention);

        res.json({
            userId,
            weeklyStats: { sessions: sessions.length, completed: completed.length, returnDays },
            engagementScore: engagement,
            riskLevel: engagement >= 70 ? 'healthy' : engagement >= 45 ? 'at_risk' : 'disengaged',
        });
    } catch (err) {
        res.status(500).json({ error: 'Engagement calculation failed' });
    }
});

// ─── GET /api/analytics/export ──────────────────────────────────
// Export NGO impact report as CSV — teacher/ngo_admin only
router.get('/export', requireAuth, requireRole('teacher', 'ngo_admin', 'super_admin'), async (req, res) => {
    try {
        const { from, to, sdgId, format: fmt = 'csv' } = req.query;
        const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400 * 1000);
        const end = to ? new Date(to) : new Date();

        const filter = {
            status: 'completed',
            createdAt: { $gte: start, $lte: end },
        };
        if (sdgId) filter.sdgId = sdgId;

        const sessions = await MissionSession.find(filter)
            .sort({ createdAt: -1 })
            .limit(5000) // cap at 5k rows to avoid memory issues
            .lean();

        // Enrich with displayName from User collection
        const userIds = [...new Set(sessions.map(s => s.userId))];
        const users = await User.find({ _id: { $in: userIds } }).select('displayName email grade role').lean();
        const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

        if (fmt === 'json') {
            return res.json({
                exportedAt: new Date().toISOString(),
                period: { from: start, to: end },
                totalRows: sessions.length,
                sessions: sessions.map(s => _sessionToRow(s, userMap)),
            });
        }

        // Default: CSV
        const rows = sessions.map(s => _sessionToRow(s, userMap));
        const headers = ['sessionId', 'userId', 'displayName', 'email', 'grade', 'role',
            'sdgId', 'difficulty', 'status', 'score', 'durationSec',
            'startedAt', 'completedAt'];

        const csvLines = [
            headers.join(','),
            ...rows.map(r => headers.map(h => _csvCell(r[h])).join(',')),
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition',
            `attachment; filename="sdg_quest_impact_${start.toISOString().slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.csv"`);
        res.send(csvLines.join('\n'));
    } catch (err) {
        console.error('[analytics/export]', err);
        res.status(500).json({ error: 'Export failed' });
    }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function _sessionToRow(session, userMap) {
    const user = userMap[session.userId?.toString()] || {};
    return {
        sessionId: session.missionId || session._id,
        userId: session.userId,
        displayName: user.displayName || '',
        email: user.email || '',
        grade: user.grade ?? '',
        role: user.role || '',
        sdgId: session.sdgId || '',
        difficulty: session.difficulty ?? '',
        status: session.status || '',
        score: session.score?.normalized ?? '',
        durationSec: session.durationSec ?? '',
        startedAt: session.createdAt ? new Date(session.createdAt).toISOString() : '',
        completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : '',
    };
}

function _csvCell(value) {
    if (value === undefined || value === null) return '';
    const str = String(value);
    // Wrap in quotes if contains comma, newline, or double-quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

module.exports = router;
