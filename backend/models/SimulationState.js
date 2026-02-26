const mongoose = require('mongoose');

const SimulationStateSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    missionId: { type: String },   // optional, defaults to sessionId in route
    userId: { type: String, required: true },  // stored as string from JWT
    sdgId: { type: String, required: true },
    difficulty: { type: Number, min: 1, max: 3, default: 1 },
    seed: String,

    // The complete world state — dynamic per SDG
    worldState: { type: mongoose.Schema.Types.Mixed, required: true },

    turn: { type: Number, default: 0 },
    maxTurns: { type: Number, default: 10 },
    status: { type: String, enum: ['running', 'won', 'lost', 'abandoned'], default: 'running' },

    // Ordered log of all player actions and consequences
    eventLog: [{
        turn: Number,
        actionId: String,
        params: mongoose.Schema.Types.Mixed,
        consequences: [String],
        events: [String],
        timestamp: { type: Date, default: Date.now },
    }],

    // Optional question gate tracking
    pendingGate: { type: Boolean, default: false },
    gateQuestion: mongoose.Schema.Types.Mixed,

    finalScore: Number,
    startedAt: { type: Date, default: Date.now },
    lastActionAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-expire abandoned simulations after 2 hours of inactivity
SimulationStateSchema.index({ lastActionAt: 1 }, { expireAfterSeconds: 7200 });
SimulationStateSchema.index({ userId: 1, sdgId: 1, status: 1 });

module.exports = mongoose.model('SimulationState', SimulationStateSchema);
