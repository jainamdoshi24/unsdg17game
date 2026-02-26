const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SDGProgressSchema = new mongoose.Schema({
    missionsCompleted: { type: Number, default: 0 },
    highScore: { type: Number, default: 0 },
    totalTimeSec: { type: Number, default: 0 },
    lastPlayedAt: { type: Date },
    completionRate: { type: Number, default: 0 },
    difficultyUnlocked: { type: Number, default: 1 },
}, { _id: false });

const UserSchema = new mongoose.Schema({
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'teacher', 'ngo_admin'], default: 'student' },
    grade: { type: Number, min: 7, max: 12 },
    totalXP: { type: Number, default: 0 },
    badges: [String],

    // SDG progress map: key = "SDG_01" … "SDG_17"
    sdgProgress: {
        type: Map,
        of: SDGProgressSchema,
        default: {},
    },

    skillRating: { type: Number, default: 1000 },
    lastActiveAt: { type: Date },

    // Anti-repetition: tracks which questionIds user has seen per SDG
    // { "SDG_03": ["q_03_001", "q_03_002", ...], ... }
    seenQuestions: {
        type: Map,
        of: [String],
        default: {},
    },

    // Best quiz score (percentage 0–100) per SDG — used for anti-XP farming
    quizBests: {
        type: Map,
        of: Number,
        default: {},
    },
}, { timestamps: true });

// Hash password before save (Mongoose 7+ async pre-hook)
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Strip sensitive data from JSON output
UserSchema.methods.toPublicProfile = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

UserSchema.index({ totalXP: -1 });

module.exports = mongoose.model('User', UserSchema);
