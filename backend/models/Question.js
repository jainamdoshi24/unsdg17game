const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    questionId: { type: String, required: true, unique: true },
    sdgId: { type: String, required: true },   // "SDG_01"
    archetypeIds: [String],
    tags: [String],
    variantGroup: String,
    difficulty: { type: Number, min: 1, max: 3, default: 1 },
    type: { type: String, enum: ['mcq', 'scenario', 'drag_drop', 'simulation_choice'], default: 'mcq' },
    locale: { type: String, default: 'en' },

    content: {
        stem: { type: String, required: true },
        choices: [{
            id: String,
            text: String,
            isCorrect: Boolean,
            feedback: String,
        }],
        explanation: String,
        imageUrl: String,
    },

    metadata: {
        reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
        reportCount: { type: Number, default: 0 },
    },
}, { timestamps: true });

QuestionSchema.index({ sdgId: 1, difficulty: 1, type: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ sdgId: 1, variantGroup: 1 });

module.exports = mongoose.model('Question', QuestionSchema);
