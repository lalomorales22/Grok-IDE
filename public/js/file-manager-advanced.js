/**
 * Advanced File Manager Module
 * Phase 3 - Drag-and-drop, recent files, favorites, templates
 */

(function() {
    'use strict';

    class FileManagerAdvanced {
        constructor() {
            this.recentFiles = [];
            this.favorites = [];
            this.maxRecentFiles = 10;
            this.storageKey = 'grok-ide-recent-files';
            this.favoritesKey = 'grok-ide-favorites';
            this.loadFromStorage();
        }

        /**
         * Initialize file manager
         */
        initialize() {
            this.setupRecentFiles();
            this.setupDragAndDrop();
            this.renderRecentFiles();
        }

        /**
         * Setup recent files
         */
        setupRecentFiles() {
            const clearBtn = document.getElementById('clear-recent-btn');
            clearBtn?.addEventListener('click', () => this.clearRecentFiles());

            // Listen for file open events
            window.addEventListener('file:opened', (e) => {
                this.addToRecent(e.detail.file);
            });
        }

        /**
         * Setup drag and drop
         */
        setupDragAndDrop() {
            const fileExplorer = document.getElementById('file-explorer');
            if (!fileExplorer) return;

            fileExplorer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileExplorer.classList.add('drag-over');
            });

            fileExplorer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileExplorer.classList.remove('drag-over');
            });

            fileExplorer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileExplorer.classList.remove('drag-over');

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleDroppedFiles(files);
                }
            });
        }

        /**
         * Handle dropped files
         */
        async handleDroppedFiles(files) {
            for (const file of files) {
                try {
                    const content = await this.readFile(file);

                    // Trigger file opened event
                    window.dispatchEvent(new CustomEvent('file:droppedAndOpened', {
                        detail: {
                            file: file.name,
                            content,
                            type: file.type
                        }
                    }));

                    if (window.notify) {
                        window.notify.success('File Opened', file.name);
                    }

                } catch (error) {
                    console.error('Error reading file:', error);
                    if (window.notify) {
                        window.notify.error('Error', `Failed to read ${file.name}`);
                    }
                }
            }
        }

        /**
         * Read file content
         */
        readFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }

        /**
         * Add to recent files
         */
        addToRecent(filePath) {
            // Remove if already exists
            this.recentFiles = this.recentFiles.filter(f => f.path !== filePath);

            // Add to beginning
            this.recentFiles.unshift({
                path: filePath,
                timestamp: Date.now(),
                name: this.getFileName(filePath)
            });

            // Keep only maxRecentFiles
            if (this.recentFiles.length > this.maxRecentFiles) {
                this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);
            }

            this.saveToStorage();
            this.renderRecentFiles();
        }

        /**
         * Render recent files
         */
        renderRecentFiles() {
            const recentList = document.getElementById('recent-files-list');
            if (!recentList) return;

            if (this.recentFiles.length === 0) {
                recentList.innerHTML = '<div class="text-sm text-tertiary" style="padding: 8px;">No recent files</div>';
                return;
            }

            recentList.innerHTML = this.recentFiles.map(file => `
                <div class="recent-file-item" onclick="window.fileManagerAdvanced.openRecentFile('${file.path}')" title="${file.path}">
                    <span class="recent-file-icon">${this.getFileIcon(file.path)}</span>
                    <span class="recent-file-name">${file.name}</span>
                </div>
            `).join('');
        }

        /**
         * Open recent file
         */
        openRecentFile(filePath) {
            window.dispatchEvent(new CustomEvent('file:openRequest', {
                detail: { file: filePath }
            }));
        }

        /**
         * Clear recent files
         */
        clearRecentFiles() {
            if (!confirm('Clear recent files list?')) return;

            this.recentFiles = [];
            this.saveToStorage();
            this.renderRecentFiles();

            if (window.notify) {
                window.notify.success('Cleared', 'Recent files list cleared');
            }
        }

        /**
         * Add to favorites
         */
        addToFavorites(filePath) {
            if (this.favorites.includes(filePath)) {
                if (window.notify) {
                    window.notify.info('Favorite', 'Already in favorites');
                }
                return;
            }

            this.favorites.push(filePath);
            this.saveFavoritesToStorage();

            if (window.notify) {
                window.notify.success('Favorite', 'Added to favorites');
            }
        }

        /**
         * Remove from favorites
         */
        removeFromFavorites(filePath) {
            this.favorites = this.favorites.filter(f => f !== filePath);
            this.saveFavoritesToStorage();

            if (window.notify) {
                window.notify.success('Favorite', 'Removed from favorites');
            }
        }

        /**
         * Check if file is favorite
         */
        isFavorite(filePath) {
            return this.favorites.includes(filePath);
        }

        /**
         * Get file name from path
         */
        getFileName(filePath) {
            return filePath.split('/').pop() || filePath;
        }

        /**
         * Get file icon
         */
        getFileIcon(filePath) {
            const ext = filePath.split('.').pop().toLowerCase();
            const iconMap = {
                'js': '📜',
                'jsx': '⚛️',
                'ts': '📘',
                'tsx': '⚛️',
                'json': '📋',
                'html': '🌐',
                'css': '🎨',
                'scss': '🎨',
                'py': '🐍',
                'java': '☕',
                'cpp': '⚙️',
                'c': '⚙️',
                'go': '🐹',
                'rs': '🦀',
                'php': '🐘',
                'rb': '💎',
                'md': '📝',
                'txt': '📄',
                'xml': '📰',
                'yaml': '⚙️',
                'yml': '⚙️',
            };

            return iconMap[ext] || '📄';
        }

        /**
         * Create file from template
         */
        async createFromTemplate(templateName) {
            const templates = {
                'html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

</body>
</html>`,
                'react-component': `import React from 'react';

const Component = () => {
    return (
        <div>
            {/* Your component content */}
        </div>
    );
};

export default Component;`,
                'express-route': `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Hello World' });
});

module.exports = router;`,
                'readme': `# Project Title

## Description

Add your project description here.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## License

MIT`,
            };

            const content = templates[templateName];
            if (!content) {
                if (window.notify) {
                    window.notify.error('Error', 'Template not found');
                }
                return;
            }

            // Create file with template content
            window.dispatchEvent(new CustomEvent('file:createFromTemplate', {
                detail: { template: templateName, content }
            }));

            if (window.notify) {
                window.notify.success('Created', `File created from ${templateName} template`);
            }
        }

        /**
         * Load from storage
         */
        loadFromStorage() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.recentFiles = JSON.parse(stored);
                }

                const storedFavorites = localStorage.getItem(this.favoritesKey);
                if (storedFavorites) {
                    this.favorites = JSON.parse(storedFavorites);
                }
            } catch (error) {
                console.error('Error loading from storage:', error);
            }
        }

        /**
         * Save to storage
         */
        saveToStorage() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.recentFiles));
            } catch (error) {
                console.error('Error saving to storage:', error);
            }
        }

        /**
         * Save favorites to storage
         */
        saveFavoritesToStorage() {
            try {
                localStorage.setItem(this.favoritesKey, JSON.stringify(this.favorites));
            } catch (error) {
                console.error('Error saving favorites:', error);
            }
        }
    }

    // Export globally
    window.FileManagerAdvanced = FileManagerAdvanced;
})();
