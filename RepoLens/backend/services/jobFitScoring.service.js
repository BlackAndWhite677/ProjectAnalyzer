const PRIORITY_WEIGHTS = Object.freeze({
    required: 3,
    preferred: 1
});

const ALLOWED_SOURCES = new Set([
    'technologies',
    'modules',
    'summary',
    'workflow',
    'structure',
    'languageStats'
]);

const SKILL_ALIASES = Object.freeze({
    reactjs: 'react',
    nodejs: 'node',
    node: 'node',
    typescript: 'typescript',
    ts: 'typescript',
    javascript: 'javascript',
    js: 'javascript',
    postgresql: 'postgres',
    postgres: 'postgres'
});

class JobFitValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'JobFitValidationError';
    }
}

function normalizeText(value) {
    return typeof value === 'string'
        ? value.replace(/\s+/g, ' ').trim()
        : '';
}

function normalizeSkill(value) {
    const compact = normalizeText(value).toLowerCase().replace(/[^a-z0-9+#]/g, '');
    return SKILL_ALIASES[compact] || compact;
}

function sourceTextsFromProfile(profile) {
    const technologies = Object.values(profile.technologies || {})
        .flatMap((items) => Array.isArray(items) ? items : [])
        .filter((item) => typeof item === 'string')
        .join('\n');

    const modules = (profile.modules || [])
        .map((module) => `${module.name || ''} ${module.description || ''}`.trim())
        .join('\n');

    const languageStats = Object.keys(profile.languageStats || {}).join('\n');

    return {
        technologies,
        modules,
        summary: profile.summary || '',
        workflow: profile.workflow || '',
        structure: profile.structure || '',
        languageStats
    };
}

function containsExcerpt(sourceText, excerpt) {
    return normalizeText(sourceText).toLowerCase().includes(normalizeText(excerpt).toLowerCase());
}

function evidenceMentionsSkill(excerpt, skill) {
    const normalizedExcerpt = normalizeSkill(excerpt);
    const normalizedSkill = normalizeSkill(skill);
    return Boolean(normalizedSkill) && normalizedExcerpt.includes(normalizedSkill);
}

function validateEvidence(evidenceItems, skill, sourceTexts) {
    if (!Array.isArray(evidenceItems)) return [];

    const uniqueEvidence = new Map();
    for (const evidence of evidenceItems.slice(0, 8)) {
        if (!evidence || !ALLOWED_SOURCES.has(evidence.source)) continue;

        const excerpt = normalizeText(evidence.excerpt);
        if (!excerpt || excerpt.length > 240) continue;

        const sourceText = sourceTexts[evidence.source];
        if (!containsExcerpt(sourceText, excerpt)) continue;
        if (!evidenceMentionsSkill(excerpt, skill)) continue;

        const key = `${evidence.source}:${excerpt.toLowerCase()}`;
        uniqueEvidence.set(key, { source: evidence.source, excerpt });
    }

    return [...uniqueEvidence.values()];
}

function validateAndScoreJobFit(llmResult, projectProfile) {
    if (!llmResult || !Array.isArray(llmResult.requirements)) {
        throw new JobFitValidationError('The AI response did not contain a requirements list.');
    }

    const sourceTexts = sourceTextsFromProfile(projectProfile || {});
    const requirementsBySkill = new Map();

    for (const candidate of llmResult.requirements.slice(0, 30)) {
        const skill = normalizeText(candidate?.skill);
        const skillKey = normalizeSkill(skill);
        const priority = candidate?.priority;

        if (!skill || skill.length > 80 || !skillKey || !PRIORITY_WEIGHTS[priority]) continue;

        const evidence = validateEvidence(candidate.evidence, skill, sourceTexts);
        const existing = requirementsBySkill.get(skillKey);

        if (!existing) {
            requirementsBySkill.set(skillKey, { skill, priority, evidence });
            continue;
        }

        if (priority === 'required') existing.priority = 'required';
        existing.evidence = [...existing.evidence, ...evidence]
            .filter((item, index, items) => items.findIndex((other) => (
                other.source === item.source && other.excerpt === item.excerpt
            )) === index)
            .slice(0, 8);
    }

    const requirements = [...requirementsBySkill.values()].map((requirement) => ({
        ...requirement,
        status: requirement.evidence.length > 0 ? 'demonstrated' : 'unverified'
    }));

    if (requirements.length === 0) {
        throw new JobFitValidationError('No assessable requirements were found.');
    }

    const totalWeight = requirements.reduce(
        (total, requirement) => total + PRIORITY_WEIGHTS[requirement.priority],
        0
    );
    const demonstratedWeight = requirements
        .filter((requirement) => requirement.status === 'demonstrated')
        .reduce((total, requirement) => total + PRIORITY_WEIGHTS[requirement.priority], 0);
    const unverifiedWeight = totalWeight - demonstratedWeight;
    const demonstrablyMissingWeight = 0;
    const score = Math.round((demonstratedWeight / totalWeight) * 100);

    return {
        score,
        scoring: {
            version: 'evidence-weighted-v1',
            weights: PRIORITY_WEIGHTS,
            totalWeight,
            demonstratedWeight,
            unverifiedWeight,
            demonstrablyMissingWeight
        },
        requirements
    };
}

module.exports = {
    PRIORITY_WEIGHTS,
    JobFitValidationError,
    validateAndScoreJobFit
};
