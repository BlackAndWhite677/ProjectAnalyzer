const test = require('node:test');
const assert = require('node:assert/strict');
const JobFit = require('../models/JobFit');
const {
    JobFitInputError,
    buildProjectProfile,
    validateJobDescription
} = require('../services/jobFit.service');

test('validates job-description input without retaining the raw value in a project profile', () => {
    assert.throws(() => validateJobDescription('too short'), JobFitInputError);
    assert.throws(() => validateJobDescription(null), JobFitInputError);
    assert.throws(() => validateJobDescription('x'.repeat(12001)), JobFitInputError);

    const description = 'Build accessible React interfaces and collaborate with an API team.';
    assert.equal(validateJobDescription(`  ${description}  `), description);

    const profile = buildProjectProfile({
        projectName: 'Example Project',
        repoName: 'owner/example',
        summary: 'React application',
        technologies: { frontend: ['React'] },
        modules: [],
        workflow: '',
        structure: '',
        languageStats: {},
        jobDescription: description
    });

    assert.equal(JSON.stringify(profile).includes(description), false);
});

test('strict JobFit documents exclude a raw jobDescription field', () => {
    const jobFit = new JobFit({
        analysisId: '507f1f77bcf86cd799439011',
        score: 0,
        scoring: {
            totalWeight: 3,
            demonstratedWeight: 0,
            unverifiedWeight: 3,
            demonstrablyMissingWeight: 0
        },
        requirements: [{
            skill: 'React',
            priority: 'required',
            status: 'unverified',
            evidence: []
        }],
        jobDescription: 'This must never be stored.'
    });

    assert.equal(jobFit.get('jobDescription'), undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(jobFit.toObject(), 'jobDescription'), false);
});
