/**
 * Search Controller
 * Handles global search across files
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Search in files
 */
exports.searchFiles = async (req, res) => {
    try {
        const { query, regex, caseSensitive, wholeWord } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const cwd = process.cwd();
        const results = [];

        // Search recursively
        await searchDirectory(cwd, query, {
            regex,
            caseSensitive,
            wholeWord,
            results,
            maxResults: 100
        });

        res.json(results);

    } catch (error) {
        logger.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};

/**
 * Search directory recursively
 */
async function searchDirectory(dir, query, options) {
    const { regex, caseSensitive, wholeWord, results, maxResults } = options;

    // Skip common directories
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];
    const baseName = path.basename(dir);
    if (skipDirs.includes(baseName)) {
        return;
    }

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (results.length >= maxResults) {
                return;
            }

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await searchDirectory(fullPath, query, options);
            } else if (entry.isFile()) {
                // Only search text files
                if (isTextFile(entry.name)) {
                    await searchFile(fullPath, query, options);
                }
            }
        }
    } catch (error) {
        // Silently skip directories we can't read
        logger.debug(`Cannot read directory: ${dir}`);
    }
}

/**
 * Search in a single file
 */
async function searchFile(filePath, query, options) {
    const { regex, caseSensitive, wholeWord, results, maxResults } = options;

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        let searchRegex;
        if (regex) {
            const flags = caseSensitive ? 'g' : 'gi';
            searchRegex = new RegExp(query, flags);
        } else {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
            const flags = caseSensitive ? 'g' : 'gi';
            searchRegex = new RegExp(pattern, flags);
        }

        lines.forEach((line, index) => {
            if (results.length >= maxResults) {
                return;
            }

            if (searchRegex.test(line)) {
                results.push({
                    file: path.relative(process.cwd(), filePath),
                    line: index + 1,
                    text: line.trim()
                });
            }
        });

    } catch (error) {
        // Silently skip files we can't read
        logger.debug(`Cannot read file: ${filePath}`);
    }
}

/**
 * Check if file is a text file
 */
function isTextFile(filename) {
    const textExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss',
        '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb',
        '.md', '.txt', '.xml', '.yaml', '.yml', '.sh', '.bash', '.sql',
        '.vue', '.svelte', '.astro', '.env', '.gitignore', '.config'
    ];

    const ext = path.extname(filename).toLowerCase();
    return textExtensions.includes(ext);
}
