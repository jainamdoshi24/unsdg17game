const mongoose = require('mongoose');

const QuestionAttemptSchema = new mongoose.Schema({
    questionId: String,
    choiceId: String,
    isCorrect: Boolean,
    timeTakenSec: Number,
    attemptNum: { type: Number, default: 1 },
}, { _id: false });

const MissionSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sdgId: { type: String, required: true },   // "SDG_01" … "SDG_17"
    missionId: { type: String, required: true },
    archetypeId: String,
    seed: String,
    difficulty: { type: Number, min: 1, max: 3, default: 1 },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },

    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    durationSec: Number,

    score: {
        raw: { type: Number, default: 0 },
        normalized: { type: Number, default: 0 }, // 0–100
    },

    questionAttempts: [QuestionAttemptSchema],
    narrativePath: [String],
    deviceType: { type: String, enum: ['web', 'android', 'ios', 'desktop'], default: 'web' },
}, { timestamps: true });

MissionSessionSchema.index({ userId: 1, sdgId: 1, createdAt: -1 });
MissionSessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('MissionSession', MissionSessionSchema);
