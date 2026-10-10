const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
    source: {
        type: String,
        enum: ['technologies', 'modules', 'summary', 'workflow', 'structure', 'languageStats'],
        required: true
    },
    excerpt: {
        type: String,
        required: true,
        maxlength: 240
    }
}, { _id: false });

const requirementSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true,
        maxlength: 80
    },
    priority: {
        type: String,
        enum: ['required', 'preferred'],
        required: true
    },
    status: {
        type: String,
        enum: ['demonstrated', 'unverified'],
        required: true
    },
    evidence: {
        type: [evidenceSchema],
        default: []
    }
}, { _id: false });

const scoringSchema = new mongoose.Schema({
    version: {
        type: String,
        default: 'evidence-weighted-v1'
    },
    weights: {
        required: { type: Number, default: 3 },
        preferred: { type: Number, default: 1 }
    },
    totalWeight: { type: Number, required: true, min: 0 },
    demonstratedWeight: { type: Number, required: true, min: 0 },
    unverifiedWeight: { type: Number, required: true, min: 0 },
    demonstrablyMissingWeight: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

const jobFitSchema = new mongoose.Schema({
    analysisId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Analysis',
        required: true,
        index: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    scoring: {
        type: scoringSchema,
        required: true
    },
    requirements: {
        type: [requirementSchema],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

jobFitSchema.index({ analysisId: 1, createdAt: -1 });

module.exports = mongoose.model('JobFit', jobFitSchema);
