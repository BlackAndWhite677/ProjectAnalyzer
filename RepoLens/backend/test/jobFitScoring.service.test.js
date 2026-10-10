const test = require('node:test');
const assert = require('node:assert/strict');
const {
    JobFitValidationError,
    validateAndScoreJobFit
} = require('../services/jobFitScoring.service');

const projectProfile = {
    technologies: {
        frontend: ['React'],
        backend: ['Node.js']
    },
    modules: [
        { name: 'api', description: 'Node.js API service' }
    ],
    summary: 'A React application with a Node.js backend.',
    workflow: 'Browser -> Node.js API -> response',
    structure: 'src/\n  components/',
    languageStats: { javascript: 1200 }
};

test('calculates a weighted score and ignores an LLM-provided score', () => {
    const result = validateAndScoreJobFit({
        score: 100,
        requirements: [
            {
                skill: 'React',
                priority: 'required',
                classification: 'demonstrated',
                evidence: [{ source: 'technologies', excerpt: 'React' }]
            },
            {
                skill: 'Docker',
                priority: 'preferred',
                classification: 'demonstrated',
                evidence: []
            }
        ]
    }, projectProfile);

    assert.equal(result.score, 75);
    assert.equal(result.scoring.totalWeight, 4);
    assert.equal(result.scoring.demonstratedWeight, 3);
    assert.equal(result.scoring.unverifiedWeight, 1);
    assert.equal(
        result.scoring.totalWeight,
        result.scoring.demonstratedWeight +
        result.scoring.unverifiedWeight +
        result.scoring.demonstrablyMissingWeight
    );
    assert.equal(result.requirements.find((item) => item.skill === 'Docker').status, 'unverified');
});

test('merges duplicate requirements and retains the stronger priority', () => {
    const result = validateAndScoreJobFit({
        requirements: [
            {
                skill: 'React',
                priority: 'preferred',
                evidence: [{ source: 'technologies', excerpt: 'React' }]
            },
            {
                skill: 'React.js',
                priority: 'required',
                evidence: [{ source: 'summary', excerpt: 'React' }]
            }
        ]
    }, projectProfile);

    assert.equal(result.requirements.length, 1);
    assert.equal(result.requirements[0].priority, 'required');
    assert.equal(result.score, 100);
    assert.equal(result.scoring.totalWeight, 3);
});

test('invalid or unsupported evidence is unverified and never missing', () => {
    const result = validateAndScoreJobFit({
        requirements: [
            {
                skill: 'Kubernetes',
                priority: 'required',
                classification: 'missing',
                evidence: [{ source: 'technologies', excerpt: 'Kubernetes' }]
            }
        ]
    }, projectProfile);

    assert.equal(result.score, 0);
    assert.equal(result.requirements[0].status, 'unverified');
    assert.equal(result.scoring.demonstrablyMissingWeight, 0);
});

test('rejects an LLM result with no assessable requirements', () => {
    assert.throws(
        () => validateAndScoreJobFit({ requirements: [] }, projectProfile),
        JobFitValidationError
    );
});
