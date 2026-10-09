const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    githubUrl: {
        type: String,
        required: true,
    },
    repoName: {
        type: String,
        required: true,
    },
    projectName: {
        type: String,
        default: ''
    },
    summary: {
        type: String,
        default: ''
    },
    technologies: {
        type: Object,
        default: {}
    },
    structure: {
        type: String,
        default: ''
    },
    modules: {
        type: Array,
        default: []
    },
    workflow: {
        type: String,
        default: ''
    },
    suggestions: {
        type: Array,
        default: []
    },
    languageStats: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analysis', analysisSchema);
