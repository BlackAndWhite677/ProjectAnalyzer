function buildPrompt(chunk) {
    const systemPrompt = `
You are a senior software engineer performing a code review.
You are concise, practical, and precise.
You do not speculate beyond the given code.
If something cannot be inferred, say "Not enough context".
`;

    const userPrompt = `
Review the following code chunk.

Tasks:
1. Briefly summarize what this code does.
2. Identify potential bugs, code smells, or risks.
3. Suggest concrete improvements or best practices.

Rules:
- Only comment on the given code.
- Do not assume other files exist.
- Do not rewrite the entire file.
- Do not mention formatting unless harmful.
- Respond ONLY in valid JSON.

Required JSON format:
{
  "summary": "string",
  "issues": [
    {
      "type": "bug | smell | risk | improvement",
      "message": "string"
    }
  ],
  "suggestions": ["string"]
}

File: ${chunk.filePath}
Language: ${chunk.language}
Chunk: ${chunk.chunkIndex + 1} of ${chunk.totalChunks}

Code:
${chunk.content}
`;

    return {
        system: systemPrompt.trim(),
        user: userPrompt.trim()
    };
}

function buildAnalysisPrompt(context) {
    const systemPrompt = `
You are an expert software architect and technical writer.
You analyze GitHub repositories and produce clear, accurate, structured project summaries.
You ONLY identify technologies that are ACTUALLY present in the provided files.
You do NOT invent or guess technologies that are not evident in the code.
You respond ONLY in valid JSON with no markdown fences.
`.trim();

    const sections = [];

    if (context.readme) {
        sections.push(`=== README ===\n${context.readme}`);
    }

    if (context.packageFiles.length > 0) {
        for (const pkg of context.packageFiles) {
            sections.push(`=== ${pkg.name} ===\n${pkg.content}`);
        }
    }

    if (context.entryPoints.length > 0) {
        for (const ep of context.entryPoints.slice(0, 3)) {
            sections.push(`=== Entry Point: ${ep.name} ===\n${ep.content}`);
        }
    }

    if (context.configFiles.length > 0) {
        for (const cfg of context.configFiles.slice(0, 3)) {
            sections.push(`=== Config: ${cfg.name} ===\n${cfg.content}`);
        }
    }

    sections.push(`=== Directory Structure ===\n${context.tree}`);

    const userPrompt = `
Analyze the following GitHub repository information and return a structured JSON analysis.

${sections.join('\n\n')}

---

Return ONLY a valid JSON object (no markdown, no code fences) with EXACTLY this structure:

{
  "projectName": "short project name",
  "summary": "2-4 sentence overview of what the project does",
  "technologies": {
    "frontend": ["list of frontend frameworks/libraries found, empty array if none"],
    "backend": ["list of backend frameworks/libraries found, empty array if none"],
    "database": ["list of databases found, empty array if none"],
    "languages": ["list of programming languages found"],
    "tools": ["list of build tools, CI/CD, containers found, empty array if none"]
  },
  "structure": "the directory tree as a string (copy from the provided structure above)",
  "modules": [
    { "name": "folder or file name", "description": "1-2 sentence description of its responsibility" }
  ],
  "workflow": "A simple plain-text description of how the project works end-to-end. Use arrow notation like: User → Frontend → Backend API → Database → Response. 3-6 lines max.",
  "suggestions": [
    "Suggestion 1 for improvement",
    "Suggestion 2 for improvement",
    "Suggestion 3 for improvement",
    "Suggestion 4 for improvement",
    "Suggestion 5 for improvement"
  ]
}

Rules:
- Only list technologies actually present in the provided files.
- The modules array should have 3-8 entries covering the most important folders/files.
- Suggestions should be practical and specific to this project.
- Do not add any text outside the JSON object.
`.trim();

    return {
        system: systemPrompt,
        user: userPrompt
    };
}

module.exports = { buildPrompt, buildAnalysisPrompt };
