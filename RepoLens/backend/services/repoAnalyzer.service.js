const fs = require('fs');
const path = require('path');

// Directories/files to ignore during analysis
const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.venv', 'venv', '__pycache__',
    '.idea', '.vscode', 'build', 'dist', 'out', '.next',
    'coverage', '.cache', 'tmp', 'logs', 'target', '.gradle',
    '__mocks__', '.pytest_cache', '.mypy_cache'
]);

// Package/manifest files that reveal tech stack
const PACKAGE_FILES = [
    'package.json', 'requirements.txt', 'Pipfile', 'Pipfile.lock',
    'pom.xml', 'build.gradle', 'go.mod', 'Cargo.toml', 'composer.json',
    'Gemfile', 'pyproject.toml', 'setup.py', 'setup.cfg',
    'yarn.lock', 'pnpm-lock.yaml'
];

// Entry point files
const ENTRY_POINTS = [
    'index.js', 'server.js', 'app.js', 'main.js',
    'main.py', 'app.py', 'manage.py', 'run.py',
    'Main.java', 'Program.cs', 'main.go', 'src/main.rs',
    'index.ts', 'server.ts', 'app.ts'
];

// Config files
const CONFIG_FILES = [
    '.env.example', '.env.sample', 'docker-compose.yml', 'docker-compose.yaml',
    'Makefile', 'vite.config.js', 'vite.config.ts', 'webpack.config.js',
    'tsconfig.json', 'babel.config.js', '.eslintrc.js', 'jest.config.js',
    'nginx.conf', 'Dockerfile', '.github/workflows'
];

/**
 * Generate an ASCII directory tree (max depth)
 */
function buildTree(dir, prefix = '', depth = 0, maxDepth = 4) {
    if (depth > maxDepth) return '';

    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return '';
    }

    // Filter out ignored dirs and hidden files except important dots
    const filtered = entries.filter(e => {
        if (e.isDirectory() && IGNORED_DIRS.has(e.name)) return false;
        if (e.name.startsWith('.') && !['env.example', '.env.sample', '.github'].some(k => e.name.includes(k))) {
            // allow .github and other visible dotfiles  
            return false;
        }
        return true;
    }).slice(0, 20); // limit entries per level

    let result = '';
    filtered.forEach((entry, idx) => {
        const isLast = idx === filtered.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const childPrefix = isLast ? '    ' : '│   ';

        result += `${prefix}${connector}${entry.name}${entry.isDirectory() ? '/' : ''}\n`;

        if (entry.isDirectory()) {
            result += buildTree(
                path.join(dir, entry.name),
                prefix + childPrefix,
                depth + 1,
                maxDepth
            );
        }
    });

    return result;
}

/**
 * Safely read a file's content (with char limit)
 */
function readFileSafe(filePath, maxChars = 3000) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.slice(0, maxChars);
    } catch {
        return null;
    }
}

/**
 * Find the actual repo root (GitHub ZIPs extract into a subdirectory)
 */
function findRepoRoot(extractedDir) {
    try {
        const entries = fs.readdirSync(extractedDir, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory());
        // GitHub zips have one top-level folder like "owner-repo-branch"
        if (dirs.length === 1) {
            return path.join(extractedDir, dirs[0].name);
        }
        return extractedDir;
    } catch {
        return extractedDir;
    }
}

/**
 * Build a comprehensive project context for LLM analysis
 */
function buildProjectContext(extractedDir) {
    const repoRoot = findRepoRoot(extractedDir);

    const context = {
        tree: '',
        readme: '',
        packageFiles: [],
        entryPoints: [],
        configFiles: [],
        importantFiles: []
    };

    // 1. Generate directory tree
    const rootName = path.basename(repoRoot);
    context.tree = `${rootName}/\n` + buildTree(repoRoot, '', 0, 4);

    // 2. Read README
    const readmeVariants = ['README.md', 'README.txt', 'README.rst', 'readme.md', 'Readme.md'];
    for (const rFile of readmeVariants) {
        const rPath = path.join(repoRoot, rFile);
        const content = readFileSafe(rPath, 3000);
        if (content) {
            context.readme = content;
            break;
        }
    }

    // 3. Read package/manifest files
    for (const pkgFile of PACKAGE_FILES) {
        const pkgPath = path.join(repoRoot, pkgFile);
        const content = readFileSafe(pkgPath, 2000);
        if (content) {
            context.packageFiles.push({ name: pkgFile, content });
        }
    }

    // 4. Find entry points
    for (const ep of ENTRY_POINTS) {
        const epPath = path.join(repoRoot, ep);
        const content = readFileSafe(epPath, 2000);
        if (content) {
            context.entryPoints.push({ name: ep, content });
        }
    }

    // 5. Find config files
    for (const cfgFile of CONFIG_FILES) {
        const cfgPath = path.join(repoRoot, cfgFile);
        if (fs.existsSync(cfgPath)) {
            const content = readFileSafe(cfgPath, 1000);
            if (content) {
                context.configFiles.push({ name: cfgFile, content });
            }
        }
    }

    return context;
}

module.exports = { buildProjectContext, findRepoRoot };
