const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const MissionSession = require('../models/MissionSession');
const Question = require('../models/Question');
const User = require('../models/User');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { requireAuth } = require('../middleware/auth');

// ── SDG Archetypes library ──────────────────────────────────────────
const SDG_ARCHETYPES = {
    SDG_01: ['resource_allocation', 'poverty_map', 'policy_sim', 'microfinance', 'disaster_recovery'],
    SDG_02: ['supply_chain', 'drought_response', 'urban_food_market', 'seed_bank', 'aid_logistics'],
    SDG_03: ['epidemic_control', 'hospital_mgmt', 'vaccine_campaign', 'mental_health', 'water_access'],
    SDG_04: ['rural_school', 'special_needs', 'digital_classroom', 'teacher_training', 'literacy_drive'],
    SDG_05: ['workplace_policy', 'legal_reform', 'community_advocacy', 'equal_pay', 'political_participation'],
    SDG_06: ['well_contamination', 'urban_pipeline', 'sanitation_design', 'rainwater', 'river_restoration'],
    SDG_07: ['solar_rollout', 'blackout_emergency', 'village_electrification', 'carbon_transition', 'energy_storage'],
    SDG_08: ['factory_audit', 'youth_unemployment', 'gig_regulation', 'minimum_wage', 'refugee_employment'],
    SDG_09: ['rural_connectivity', 'industrial_upgrade', 'smart_city', 'bridge_to_market', 'internet_access'],
    SDG_10: ['tax_reform', 'safety_net', 'wealth_cap', 'regional_disparity', 'immigration_integration'],
    SDG_11: ['transit_redesign', 'slum_upgrading', 'flood_planning', 'heritage', 'urban_heat'],
    SDG_12: ['ewaste_audit', 'food_chain', 'fast_fashion', 'circular_economy', 'carbon_footprint'],
    SDG_13: ['paris_pledges', 'coastal_adaptation', 'carbon_market', 'reforestation', 'green_transport'],
    SDG_14: ['overfishing_crisis', 'coral_restoration', 'plastic_cleanup', 'mpa_design', 'mining_regulation'],
    SDG_15: ['deforestation_crisis', 'rewilding', 'fire_management', 'invasive_species', 'land_rights'],
    SDG_16: ['corruption_drive', 'justice_reform', 'refugee_rights', 'transparency', 'childrens_rights'],
    SDG_17: ['aid_coordination', 'public_private', 'tech_transfer', 'global_fund', 'south_south'],
};

// Seeded pseudorandom helper
function seededRandom(seed) {
    let s = parseInt(seed.slice(0, 8), 16) || 1;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}


// ─── POST /api/missions/generate ──────────────────────────────────
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { sdgId, difficulty = 1 } = req.body;
        const userId = req.user.userId;

        if (!SDG_ARCHETYPES[sdgId])
            return res.status(400).json({ error: `Unknown SDG: ${sdgId}` });

        // Generate cryptographic seed
        const seed = crypto.randomBytes(8).toString('hex');
        const rng = seededRandom(seed);

        // Pick archetype (exclude last seen — simple rolling exclusion)
        const archetypes = SDG_ARCHETYPES[sdgId];
        const archetypeId = archetypes[Math.floor(rng() * archetypes.length)];

        // Select questions from pool (exclude recently seen ones)
        const recentSessions = await MissionSession.find(
            { userId, sdgId, status: 'completed' },
            { questionAttempts: 1 }
        ).sort({ createdAt: -1 }).limit(5).lean();

        const seenQIds = new Set(
            recentSessions.flatMap(s => s.questionAttempts.map(q => q.questionId))
        );

        const allQuestions = await Question.find({
            sdgId,
            difficulty,
            'metadata.reviewStatus': 'approved',
            questionId: { $nin: Array.from(seenQIds) },
        }).lean();

        // Shuffle and pick up to 5 questions
        const shuffled = allQuestions.sort(() => rng() - 0.5).slice(0, 5);

        // Generate unique mission ID
        const missionId = `${sdgId}_${userId.toString().slice(-6)}_${Date.now()}`;

        // Persist session as 'active'
        await MissionSession.create({
            userId,
            sdgId,
            missionId,
            archetypeId,
            seed,
            difficulty,
            status: 'active',
        });

        // Fire analytics event
        await AnalyticsEvent.create({
            eventType: 'mission.started',
            userId,
            sdgId,
            missionId,
            payload: { archetypeId, difficulty },
        }).catch(() => { }); // non-critical

        res.json({
            missionId,
            sdgId,
            archetypeId,
            seed,
            difficulty,
            questions: shuffled.map(q => ({
                questionId: q.questionId,
                type: q.type,
                stem: q.content.stem,
                choices: q.content.choices.map(c => ({ id: c.id, text: c.text })), // no isCorrect to client!
                imageUrl: q.content.imageUrl,
            })),
        });
    } catch (err) {
        console.error('[mission/generate]', err);
        res.status(500).json({ error: 'Mission generation failed' });
    }
});

// ─── POST /api/missions/complete ──────────────────────────────────
router.post('/complete', requireAuth, async (req, res) => {
    try {
        const { missionId, sdgId, score, durationSec, questionAttempts, narrativePath } = req.body;
        const userId = req.user.userId;

        const session = await MissionSession.findOne({ missionId, userId });
        if (!session)
            return res.status(404).json({ error: 'Mission session not found' });

        if (session.status === 'completed')
            return res.json({ message: 'Already completed', score: session.score }); // idempotent

        // Verify answers and compute score on the server side
        const questionIds = (questionAttempts || []).map(a => a.questionId);
        const questions = await Question.find({ questionId: { $in: questionIds } }).lean();
        const qMap = Object.fromEntries(questions.map(q => [q.questionId, q]));

        let correctCount = 0;
        const verifiedAttempts = (questionAttempts || []).map(a => {
            const q = qMap[a.questionId];
            const correctChoice = q?.content?.choices?.find(c => c.isCorrect);
            const isCorrect = correctChoice?.id === a.choiceId;
            if (isCorrect) correctCount++;
            return { ...a, isCorrect };
        });

        const normalized = questionAttempts?.length
            ? Math.round((correctCount / questionAttempts.length) * 100)
            : Math.min(score || 0, 100);

        // Update session
        session.status = 'completed';
        session.completedAt = new Date();
        session.durationSec = durationSec || 0;
        session.score = { raw: score || 0, normalized };
        session.questionAttempts = verifiedAttempts;
        session.narrativePath = narrativePath || [];
        await session.save();

        // Update user's sdgProgress + totalXP
        const xpGained = normalized + Math.floor((score || 0) / 10);
        const progressUpdate = {
            [`sdgProgress.${sdgId}.missionsCompleted`]: 1,
            totalXP: xpGained,
        };

        const updatedUser = await User.findById(userId).lean();
        const prev = updatedUser?.sdgProgress?.get?.(sdgId) || {};
        if (!prev.highScore || normalized > prev.highScore) {
            progressUpdate[`sdgProgress.${sdgId}.highScore`] = normalized;
        }
        progressUpdate[`sdgProgress.${sdgId}.lastPlayedAt`] = new Date();
        progressUpdate[`sdgProgress.${sdgId}.totalTimeSec`] = durationSec || 0;

        await User.findByIdAndUpdate(userId, { $inc: progressUpdate });

        // Analytics
        await AnalyticsEvent.create({
            eventType: 'mission.completed',
            userId,
            sdgId,
            missionId,
            payload: { score: normalized, durationSec, correctCount },
        }).catch(() => { });

        res.json({
            message: 'Mission completed',
            missionId,
            score: { raw: score || 0, normalized },
            xpGained,
            correctCount,
            totalQuestions: verifiedAttempts.length,
        });
    } catch (err) {
        console.error('[mission/complete]', err);
        res.status(500).json({ error: 'Mission completion failed' });
    }
});

// ─── POST /api/missions/abandon ────────────────────────────────────
router.post('/abandon', requireAuth, async (req, res) => {
    try {
        const { missionId } = req.body;
        await MissionSession.findOneAndUpdate(
            { missionId, userId: req.user.userId, status: 'active' },
            { $set: { status: 'abandoned', completedAt: new Date() } }
        );
        res.json({ message: 'Mission abandoned' });
    } catch (err) {
        res.status(500).json({ error: 'Abandon failed' });
    }
});

// ─── GET /api/missions/history ─────────────────────────────────────
router.get('/history', requireAuth, async (req, res) => {
    try {
        const { sdgId, limit = 20 } = req.query;
        const filter = { userId: req.user.userId };
        if (sdgId) filter.sdgId = sdgId;

        const sessions = await MissionSession.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .select('missionId sdgId archetypeId difficulty status score durationSec completedAt createdAt')
            .lean();

        res.json({ sessions });
    } catch (err) {
        res.status(500).json({ error: 'History fetch failed' });
    }
});

module.exports = router;
