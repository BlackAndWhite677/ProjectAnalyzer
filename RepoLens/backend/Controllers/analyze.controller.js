const Analysis = require('../models/Analysis');
const fetchGitHubUrl = require('../utils/githubFetch');
const unzipFile = require('../utils/unZip');
const detectLanguages = require('../utils/langDetect');
const cleanupPath = require('../utils/cleanup');
const { buildProjectContext } = require('../services/repoAnalyzer.service');
const { analyzeProjectWithLLM } = require('../services/llm.service');
const path = require('path');
const os = require('os');

/**
 * Parse GitHub URL to extract owner/repo
 */
function parseGitHubUrl(url) {
    try {
        const u = new URL(url);
        if (u.hostname !== 'github.com') return null;
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        return {
            owner: parts[0],
            repo: parts[1].replace(/\.git$/, '')
        };
    } catch {
        return null;
    }
}

/**
 * POST /api/analyze
 * Accepts { githubUrl } and returns full project analysis
 */
exports.analyze = async (req, res) => {
    const { githubUrl } = req.body;

    // --- Validation ---
    if (!githubUrl || typeof githubUrl !== 'string' || !githubUrl.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a GitHub repository URL.'
        });
    }

    const parsed = parseGitHubUrl(githubUrl.trim());
    if (!parsed) {
        return res.status(400).json({
            success: false,
            message: 'Invalid GitHub URL. Please enter a valid URL like https://github.com/owner/repo'
        });
    }

    const repoName = `${parsed.owner}/${parsed.repo}`;
    let zipPath = null;
    let extractedDir = null;

    try {
        console.log(`[analyze] Starting analysis for: ${repoName}`);

        // 1. Download ZIP from GitHub
        try {
            zipPath = await fetchGitHubUrl(githubUrl.trim());
        } catch (err) {
            console.error('[analyze] Download failed:', err.message);
            if (err.message.includes('404') || err.message.includes('Failed to download')) {
                return res.status(404).json({
                    success: false,
                    message: `Repository not found. Please check that the URL is correct and the repository is public.`
                });
            }
            throw err;
        }

        // 2. Extract ZIP to temp folder
        extractedDir = await unzipFile(zipPath);
        console.log(`[analyze] Extracted to: ${extractedDir}`);

        // 3. Detect languages from extracted files
        const languageStats = detectLanguages(extractedDir);

        // 4. Build project context (tree, readme, package files, entry points)
        const context = buildProjectContext(extractedDir);
        context.languageStats = languageStats;

        // 5. Call LLM for analysis
        console.log(`[analyze] Sending to LLM...`);
        let aiResult;
        try {
            aiResult = await analyzeProjectWithLLM(context);
        } catch (llmErr) {
            console.error('[analyze] LLM error:', llmErr.message);
            return res.status(502).json({
                success: false,
                message: `AI analysis failed: ${llmErr.message}. Please check your OPENAI_API_KEY and OPENAI_URL configuration.`
            });
        }

        // 6. Build the final response object
        const result = {
            projectName: aiResult.projectName || parsed.repo,
            summary: aiResult.summary || '',
            technologies: aiResult.technologies || {},
            structure: context.tree || aiResult.structure || '',
            modules: Array.isArray(aiResult.modules) ? aiResult.modules : [],
            workflow: aiResult.workflow || '',
            suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [],
            languageStats,
            repoName,
            githubUrl: githubUrl.trim()
        };

        // 7. Save to MongoDB
        const saved = await Analysis.create(result);

        console.log(`[analyze] Analysis complete for ${repoName}`);

        return res.status(200).json({
            success: true,
            analysisId: saved._id,
            ...result
        });

    } catch (err) {
        console.error('[analyze] Unexpected error:', err);
        return res.status(500).json({
            success: false,
            message: 'An unexpected server error occurred. Please try again.'
        });
    } finally {
        // 8. Always cleanup temp files
        if (zipPath) await cleanupPath(zipPath);
        if (extractedDir) await cleanupPath(extractedDir);
    }
};

/**
 * GET /api/analyses
 * Returns analysis history sorted by newest first
 */
exports.getHistory = async (req, res) => {
    try {
        const analyses = await Analysis.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .select('githubUrl repoName projectName summary languageStats createdAt')
            .lean();

        return res.status(200).json({
            success: true,
            analyses
        });
    } catch (err) {
        console.error('[getHistory] error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch analysis history.'
        });
    }
};

/**
 * GET /api/analyses/:id
 * Returns a single full analysis by ID
 */
exports.getAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const analysis = await Analysis.findById(id).lean();

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found.'
            });
        }

        return res.status(200).json({
            success: true,
            ...analysis
        });
    } catch (err) {
        console.error('[getAnalysis] error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch analysis.'
        });
    }
};
