/**
 * Git Controller
 * Handles Git operations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

/**
 * Get git status
 */
exports.getStatus = async (req, res) => {
    try {
        const cwd = process.cwd();

        // Get current branch
        const { stdout: branch } = await execAsync('git branch --show-current', { cwd });

        // Get status
        const { stdout: status } = await execAsync('git status --porcelain', { cwd });

        // Parse status
        const changes = status.trim().split('\n').filter(Boolean).map(line => {
            const statusCode = line.substring(0, 2).trim();
            const file = line.substring(3);

            let status = 'modified';
            if (statusCode === 'A' || statusCode === '??') status = 'added';
            if (statusCode === 'D') status = 'deleted';

            return { file, status };
        });

        res.json({
            branch: branch.trim(),
            changes
        });

    } catch (error) {
        logger.error('Git status error:', error);
        res.status(500).json({ error: 'Failed to get git status' });
    }
};

/**
 * Get branches
 */
exports.getBranches = async (req, res) => {
    try {
        const { stdout } = await execAsync('git branch --all', { cwd: process.cwd() });

        const branches = stdout.trim().split('\n').map(line => {
            const current = line.startsWith('*');
            const name = line.replace('*', '').trim();
            return { name, current };
        });

        res.json({ branches });

    } catch (error) {
        logger.error('Git branches error:', error);
        res.status(500).json({ error: 'Failed to get branches' });
    }
};

/**
 * Get commit history
 */
exports.getHistory = async (req, res) => {
    try {
        const { stdout } = await execAsync(
            'git log --pretty=format:"%H|%an|%ar|%s" -n 20',
            { cwd: process.cwd() }
        );

        const commits = stdout.trim().split('\n').map(line => {
            const [hash, author, date, message] = line.split('|');
            return { hash, author, date, message };
        });

        res.json({ commits });

    } catch (error) {
        logger.error('Git history error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
};

/**
 * Stage file
 */
exports.stageFile = async (req, res) => {
    try {
        const { file } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'File path required' });
        }

        await execAsync(`git add "${file}"`, { cwd: process.cwd() });

        res.json({ success: true, message: `Staged ${file}` });

    } catch (error) {
        logger.error('Git stage error:', error);
        res.status(500).json({ error: 'Failed to stage file' });
    }
};

/**
 * Commit changes
 */
exports.commit = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Commit message required' });
        }

        // Escape message for shell
        const escapedMessage = message.replace(/"/g, '\\"');

        await execAsync(`git commit -m "${escapedMessage}"`, { cwd: process.cwd() });

        res.json({ success: true, message: 'Committed successfully' });

    } catch (error) {
        logger.error('Git commit error:', error);
        res.status(500).json({ error: 'Failed to commit' });
    }
};

/**
 * Checkout branch
 */
exports.checkout = async (req, res) => {
    try {
        const { branch } = req.body;

        if (!branch) {
            return res.status(400).json({ error: 'Branch name required' });
        }

        await execAsync(`git checkout "${branch}"`, { cwd: process.cwd() });

        res.json({ success: true, message: `Switched to ${branch}` });

    } catch (error) {
        logger.error('Git checkout error:', error);
        res.status(500).json({ error: 'Failed to checkout branch' });
    }
};

/**
 * Create branch
 */
exports.createBranch = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Branch name required' });
        }

        await execAsync(`git branch "${name}"`, { cwd: process.cwd() });

        res.json({ success: true, message: `Created branch ${name}` });

    } catch (error) {
        logger.error('Git create branch error:', error);
        res.status(500).json({ error: 'Failed to create branch' });
    }
};

/**
 * Push to remote
 */
exports.push = async (req, res) => {
    try {
        await execAsync('git push', { cwd: process.cwd() });

        res.json({ success: true, message: 'Pushed successfully' });

    } catch (error) {
        logger.error('Git push error:', error);
        res.status(500).json({ error: 'Failed to push' });
    }
};

/**
 * Pull from remote
 */
exports.pull = async (req, res) => {
    try {
        await execAsync('git pull', { cwd: process.cwd() });

        res.json({ success: true, message: 'Pulled successfully' });

    } catch (error) {
        logger.error('Git pull error:', error);
        res.status(500).json({ error: 'Failed to pull' });
    }
};
