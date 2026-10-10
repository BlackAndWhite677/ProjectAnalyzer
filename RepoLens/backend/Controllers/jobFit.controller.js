const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const JobFit = require('../models/JobFit');
const {
    JobFitInputError,
    JobFitValidationError,
    validateJobDescription,
    createJobFitComparison
} = require('../services/jobFit.service');

function isValidAnalysisId(analysisId) {
    return mongoose.isValidObjectId(analysisId);
}

function serializeJobFit(jobFit) {
    return {
        _id: jobFit._id,
        analysisId: jobFit.analysisId,
        score: jobFit.score,
        scoring: jobFit.scoring,
        requirements: jobFit.requirements,
        createdAt: jobFit.createdAt
    };
}

async function findAnalysis(analysisId) {
    return Analysis.findById(analysisId)
        .select('projectName repoName summary technologies modules workflow structure languageStats')
        .lean();
}

exports.createJobFit = async (req, res) => {
    const { analysisId } = req.params;

    if (!isValidAnalysisId(analysisId)) {
        return res.status(400).json({ success: false, message: 'Invalid analysis ID.' });
    }

    try {
        validateJobDescription(req.body?.jobDescription);
    } catch (err) {
        if (err instanceof JobFitInputError) {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(400).json({ success: false, message: 'Invalid job description.' });
    }

    let analysis;
    try {
        analysis = await findAnalysis(analysisId);
    } catch (_) {
        console.error('[job-fit] failed to load analysis');
        return res.status(500).json({ success: false, message: 'Unable to load the project analysis.' });
    }

    if (!analysis) {
        return res.status(404).json({ success: false, message: 'Project analysis not found.' });
    }

    let comparison;
    try {
        comparison = await createJobFitComparison(analysis, req.body.jobDescription);
    } catch (err) {
        if (err instanceof JobFitValidationError) {
            return res.status(422).json({ success: false, message: 'No assessable job requirements were found.' });
        }
        console.error('[job-fit] comparison failed');
        return res.status(502).json({ success: false, message: 'Job Fit analysis is temporarily unavailable.' });
    }

    try {
        const jobFit = await JobFit.create({ analysisId, ...comparison });
        return res.status(201).json({ success: true, jobFit: serializeJobFit(jobFit) });
    } catch (_) {
        console.error('[job-fit] failed to save comparison');
        return res.status(500).json({ success: false, message: 'Unable to save the Job Fit comparison.' });
    }
};

exports.getJobFits = async (req, res) => {
    const { analysisId } = req.params;

    if (!isValidAnalysisId(analysisId)) {
        return res.status(400).json({ success: false, message: 'Invalid analysis ID.' });
    }

    try {
        const analysisExists = await Analysis.exists({ _id: analysisId });
        if (!analysisExists) {
            return res.status(404).json({ success: false, message: 'Project analysis not found.' });
        }

        const jobFits = await JobFit.find({ analysisId })
            .sort({ createdAt: -1 })
            .select('analysisId score scoring requirements createdAt')
            .lean();

        return res.status(200).json({
            success: true,
            jobFits: jobFits.map(serializeJobFit)
        });
    } catch (_) {
        console.error('[job-fit] failed to load comparisons');
        return res.status(500).json({ success: false, message: 'Unable to load Job Fit comparisons.' });
    }
};
