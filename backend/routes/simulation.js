const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const SimulationState = require('../models/SimulationState');
const MissionSession = require('../models/MissionSession');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');
const { getEngine, SUPPORTED_SDGS } = require('../engines');
const { checkAndAwardBadges } = require('../utils/badges');

// ─── POST /api/sim/start ────────────────────────────────────────────────────
// Initialise a new simulation session for a given SDG + difficulty.
router.post('/start', requireAuth, async (req, res) => {
    try {
        const { sdgId, difficulty = 1, missionId } = req.body;
        if (!sdgId) return res.status(400).json({ error: 'sdgId is required' });
        if (!SUPPORTED_SDGS.includes(sdgId))
            return res.status(400).json({ error: `Unsupported SDG: ${sdgId}`, supported: SUPPORTED_SDGS });

        const engine = getEngine(sdgId);
        const seed = uuidv4().replace(/-/g, '').slice(0, 16);
        const worldState = engine.init(difficulty, seed);

        const sessionId = missionId || `SIM_${sdgId}_${req.user.userId}_${Date.now()}`;

        // Remove any stale running session for this user+SDG
        await SimulationState.deleteOne({ userId: req.user.userId, sdgId, status: 'running' });

        const sim = await SimulationState.create({
            sessionId,
            missionId: sessionId,
            userId: req.user.userId,
            sdgId,
            difficulty,
            seed,
            worldState,
            maxTurns: worldState.maxTurns || 10,
            status: 'running',
        });

        // Log analytics event (non-blocking)
        AnalyticsEvent.create({
            userId: req.user.userId,
            sdgId,
            eventType: 'mission.started',
            payload: { sessionId, difficulty, simulationType: 'simulation' },
        }).catch(() => { });

        res.json({
            sessionId: sim.sessionId,
            sdgId,
            difficulty,
            seed,
            worldState: sim.worldState,
            turn: sim.turn,
            maxTurns: sim.maxTurns,
            availableActions: engine.availableActions(sim.worldState),
        });
    } catch (err) {
        console.error('sim/start error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/sim/action ───────────────────────────────────────────────────
// Player submits a decision → server applies consequences, returns new state.
router.post('/action', requireAuth, async (req, res) => {
    try {
        const { sessionId, actionId, params = {} } = req.body;
        if (!sessionId || !actionId)
            return res.status(400).json({ error: 'sessionId and actionId are required' });

        const sim = await SimulationState.findOne({ sessionId, userId: req.user.userId });
        if (!sim) return res.status(404).json({ error: 'Simulation session not found' });
        if (sim.status !== 'running')
            return res.status(409).json({ error: `Session already ${sim.status}` });

        const engine = getEngine(sim.sdgId);
        if (!engine) return res.status(500).json({ error: 'Engine not found for SDG' });

        // Validate action is in the available list
        const available = engine.availableActions(sim.worldState).map(a => a.id);
        if (!available.includes(actionId))
            return res.status(400).json({ error: `Action '${actionId}' is not available in current state`, available });

        // Apply the action
        const { newState, consequences, events } = engine.applyAction(sim.worldState, actionId, params);

        // Check terminal condition
        const terminal = engine.isTerminal(newState);
        const finalScore = terminal.done ? engine.computeScore(newState) : null;
        const newStatus = terminal.done ? terminal.outcome : 'running';

        // Persist
        sim.worldState = newState;
        sim.turn = newState.turn;
        sim.status = newStatus;
        if (finalScore !== null) sim.finalScore = finalScore;
        sim.lastActionAt = new Date();

        sim.eventLog.push({
            turn: newState.turn,
            actionId,
            params,
            consequences,
            events,
        });
        await sim.save();

        let newBadges = [];
        if (terminal.done) {
            await _finalizeMissionSession(sim, finalScore);
            newBadges = await checkAndAwardBadges(req.user.userId, User, MissionSession);
        }

        // Analytics event (non-blocking)
        AnalyticsEvent.create({
            userId: req.user.userId,
            sdgId: sim.sdgId,
            eventType: terminal.done ? 'mission.completed' : 'action.taken',
            payload: { sessionId, actionId, turn: newState.turn, consequences, finalScore },
        }).catch(() => { });

        res.json({
            sessionId,
            worldState: newState,
            turn: newState.turn,
            consequences,
            events,
            availableActions: terminal.done ? [] : engine.availableActions(newState),
            isTerminal: terminal.done,
            outcome: terminal.outcome || null,
            finalScore,
            xpEarned: sim._xpEarned || 0,
            newBadges: newBadges.map(b => ({ id: b.id, label: b.label, icon: b.icon })),
            // No gate questions — simulation is play-first
        });
    } catch (err) {
        console.error('sim/action error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/sim/tick ─────────────────────────────────────────────────────
// Advance simulation by one turn without a player action (environment tick).
router.post('/tick', requireAuth, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const sim = await SimulationState.findOne({ sessionId, userId: req.user.userId });
        if (!sim) return res.status(404).json({ error: 'Session not found' });
        if (sim.status !== 'running') return res.status(409).json({ error: `Session ${sim.status}` });

        const engine = getEngine(sim.sdgId);
        const { newState, events } = engine.tick(sim.worldState);
        const terminal = engine.isTerminal(newState);

        sim.worldState = newState;
        sim.turn = newState.turn;
        sim.lastActionAt = new Date();
        if (terminal.done) {
            sim.status = terminal.outcome;
            sim.finalScore = engine.computeScore(newState);
            await _finalizeMissionSession(sim, sim.finalScore);
        }
        sim.eventLog.push({ turn: newState.turn, actionId: '__tick__', params: {}, consequences: [], events });
        await sim.save();

        res.json({
            sessionId,
            worldState: newState,
            turn: newState.turn,
            events,
            isTerminal: terminal.done,
            outcome: terminal.outcome || null,
            finalScore: sim.finalScore || null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/sim/state/:sessionId ──────────────────────────────────────────
// Fetch current world state (for reconnection / resume).
router.get('/state/:sessionId', requireAuth, async (req, res) => {
    try {
        const sim = await SimulationState.findOne({
            sessionId: req.params.sessionId,
            userId: req.user.userId,
        });
        if (!sim) return res.status(404).json({ error: 'Session not found' });

        const engine = getEngine(sim.sdgId);
        res.json({
            sessionId: sim.sessionId,
            sdgId: sim.sdgId,
            difficulty: sim.difficulty,
            worldState: sim.worldState,
            turn: sim.turn,
            maxTurns: sim.maxTurns,
            status: sim.status,
            finalScore: sim.finalScore,
            availableActions: sim.status === 'running' ? engine.availableActions(sim.worldState) : [],
            gateQuestion: sim.gateQuestion || null,
            eventLog: sim.eventLog.slice(-5),  // last 5 events for context
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/sim/end ──────────────────────────────────────────────────────
// Force-end a session (player quits early).
router.post('/end', requireAuth, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const sim = await SimulationState.findOne({ sessionId, userId: req.user.userId });
        if (!sim) return res.status(404).json({ error: 'Session not found' });
        if (sim.status !== 'running')
            return res.status(409).json({ error: `Already ${sim.status}` });

        const engine = getEngine(sim.sdgId);
        const score = engine.computeScore(sim.worldState);
        sim.status = 'abandoned';
        sim.finalScore = score;
        await sim.save();
        await _finalizeMissionSession(sim, score);

        res.json({ sessionId, status: 'abandoned', finalScore: score });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Helper: sync simulation outcome to MissionSession ─────────────────────
async function _finalizeMissionSession(sim, score) {
    try {
        await MissionSession.findOneAndUpdate(
            { missionId: sim.sessionId },
            {
                $set: {
                    status: sim.status === 'won' ? 'completed' : sim.status,
                    'score.normalized': score,
                    duration: Math.round((Date.now() - sim.startedAt.getTime()) / 1000),
                    completedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        // Award XP on completion (won = full, lost = partial)
        if (sim.status === 'won' || sim.status === 'lost') {
            const xpEarned = sim.status === 'won'
                ? Math.max(10, Math.round(score * 2))
                : Math.max(5, Math.round(score * 0.5));
            sim._xpEarned = xpEarned;

            // Update SDG progress and totalXP
            await User.findByIdAndUpdate(sim.userId, {
                $inc: { totalXP: xpEarned, [`sdgProgress.${sim.sdgId}.missionsCompleted`]: sim.status === 'won' ? 1 : 0 },
                $max: { [`sdgProgress.${sim.sdgId}.highScore`]: score },
                $set: { [`sdgProgress.${sim.sdgId}.lastPlayedAt`]: new Date() },
            });
        }
    } catch (err) {
        console.error('[_finalizeMissionSession]', err.message);
    }
}

module.exports = router;
