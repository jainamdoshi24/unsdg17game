const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: [
            'mission.started', 'mission.completed', 'mission.abandoned',
            'question.answered', 'question.attempt', 'question.skipped',
            'difficulty.scaled_up', 'difficulty.scaled_down',
            'narrative.choice', 'achievement.unlocked',
            'session.login', 'session.logout',
        ],
    },
    userId: { type: String, required: true },  // string from JWT payload
    sessionId: String,
    sdgId: String,
    missionId: String,
    payload: mongoose.Schema.Types.Mixed,
    deviceType: String,
    appVersion: { type: String, default: '1.0.0' },
    serverTimestamp: { type: Date, default: Date.now },
}, { timestamps: false });

// Auto-delete raw events after 90 days
AnalyticsEventSchema.index({ serverTimestamp: 1 }, { expireAfterSeconds: 7_776_000 });
AnalyticsEventSchema.index({ userId: 1, eventType: 1, serverTimestamp: -1 });
AnalyticsEventSchema.index({ sdgId: 1, eventType: 1, serverTimestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
