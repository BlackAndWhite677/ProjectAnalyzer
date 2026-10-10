const { analyzeJobFitWithLLM } = require('./llm.service');
const {
    JobFitValidationError,
    validateAndScoreJobFit
} = require('./jobFitScoring.service');

const MIN_JOB_DESCRIPTION_LENGTH = 40;
const MAX_JOB_DESCRIPTION_LENGTH = 12000;

class JobFitInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'JobFitInputError';
    }
}

function limitedString(value, maxLength) {
    return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function validateJobDescription(value) {
    if (typeof value !== 'string') {
        throw new JobFitInputError('A job description is required.');
    }

    const jobDescription = value.trim();
    if (
        jobDescription.length < MIN_JOB_DESCRIPTION_LENGTH ||
        jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH
    ) {
        throw new JobFitInputError(
            `Job description must be between ${MIN_JOB_DESCRIPTION_LENGTH} and ${MAX_JOB_DESCRIPTION_LENGTH} characters.`
        );
    }

    return jobDescription;
}

function buildProjectProfile(analysis) {
    return {
        projectName: limitedString(analysis.projectName, 200),
        repoName: limitedString(analysis.repoName, 200),
        summary: limitedString(analysis.summary, 4000),
        technologies: analysis.technologies && typeof analysis.technologies === 'object'
            ? analysis.technologies
            : {},
        modules: Array.isArray(analysis.modules)
            ? analysis.modules.slice(0, 20).map((module) => ({
                name: limitedString(module?.name, 160),
                description: limitedString(module?.description, 500)
            }))
            : [],
        workflow: limitedString(analysis.workflow, 3000),
        structure: limitedString(analysis.structure, 6000),
        languageStats: analysis.languageStats && typeof analysis.languageStats === 'object'
            ? analysis.languageStats
            : {}
    };
}

async function createJobFitComparison(analysis, rawJobDescription) {
    const jobDescription = validateJobDescription(rawJobDescription);
    const projectProfile = buildProjectProfile(analysis);
    const llmResult = await analyzeJobFitWithLLM(projectProfile, jobDescription);

    return validateAndScoreJobFit(llmResult, projectProfile);
}

module.exports = {
    MIN_JOB_DESCRIPTION_LENGTH,
    MAX_JOB_DESCRIPTION_LENGTH,
    JobFitInputError,
    JobFitValidationError,
    validateJobDescription,
    buildProjectProfile,
    createJobFitComparison
};
