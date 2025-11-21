/**
 * Main Application Module - Phase 3
 * Integrates all Phase 3 features
 */

(function() {
    'use strict';

    class GrokIDEApp {
        constructor() {
            this.monacoEditor = null;
            this.aiStreaming = null;
            this.conversationManager = null;
            this.searchEngine = null;
            this.gitIntegration = null;
            this.fileManagerAdvanced = null;
            this.currentFolder = null;
            this.openFiles = new Map();
            this.isDarkTheme = true;
        }

        /**
         * Initialize application
         */
        async initialize() {
            try {
                // Initialize Monaco Editor
                this.monacoEditor = new window.MonacoIntegration();
                await this.monacoEditor.initialize();
                window.monacoEditor = this.monacoEditor;

                // Initialize Phase 3 modules
                this.aiStreaming = new window.AIStreaming();
                this.aiStreaming.initialize();
                window.aiStreaming = this.aiStreaming;

                this.conversationManager = new window.ConversationManager();
                this.conversationManager.initialize();
                window.conversationManager = this.conversationManager;

                this.searchEngine = new window.SearchEngine();
                this.searchEngine.initialize();
                window.searchEngine = this.searchEngine;

                this.gitIntegration = new window.GitIntegration();
                this.gitIntegration.initialize();
                window.gitIntegration = this.gitIntegration;

                this.fileManagerAdvanced = new window.FileManagerAdvanced();
                this.fileManagerAdvanced.initialize();
                window.fileManagerAdvanced = this.fileManagerAdvanced;

                // Setup event listeners
                this.setupEventListeners();

                // Initialize Phase 2 components (if available)
                this.initializePhase2Components();

                // Show welcome notification
                if (window.notify) {
                    window.notify.success('Welcome', 'Grok IDE v3.0 - Phase 3 ready!');
                }

                console.log('Grok IDE v3.0 initialized successfully');

            } catch (error) {
                console.error('Initialization error:', error);
                alert('Failed to initialize Grok IDE: ' + error.message);
            }
        }

        /**
         * Initialize Phase 2 components
         */
        initializePhase2Components() {
            // Theme manager from Phase 2
            if (window.ThemeManager) {
                const themeManager = new window.ThemeManager();
                themeManager.initialize();
                window.themeManager = themeManager;

                // Listen for theme changes
                window.addEventListener('themeChanged', (e) => {
                    this.monacoEditor?.setTheme(e.detail.theme);
                });
            }

            // Notification system from Phase 2
            if (window.NotificationSystem) {
                const notify = new window.NotificationSystem();
                notify.initialize();
                window.notify = notify;
            }

            // Command palette from Phase 2
            if (window.CommandPalette) {
                const commandPalette = new window.CommandPalette();
                commandPalette.initialize();
                window.commandPalette = commandPalette;
            }

            // Settings manager from Phase 2
            if (window.SettingsManager) {
                const settingsManager = new window.SettingsManager();
                settingsManager.initialize();
                window.settingsManager = settingsManager;
            }

            // Keyboard handler from Phase 2
            if (window.KeyboardHandler) {
                const keyboardHandler = new window.KeyboardHandler();
                keyboardHandler.initialize();
                window.keyboardHandler = keyboardHandler;

                // Add Phase 3 shortcuts
                this.registerPhase3Shortcuts(keyboardHandler);
            }
        }

        /**
         * Register Phase 3 keyboard shortcuts
         */
        registerPhase3Shortcuts(keyboardHandler) {
            const shortcuts = [
                {
                    key: 'Ctrl+P',
                    description: 'Quick file switcher',
                    action: () => this.searchEngine?.showQuickOpen()
                },
                {
                    key: 'Ctrl+Shift+F',
                    description: 'Search in files',
                    action: () => this.searchEngine?.showSearchDialog()
                },
                {
                    key: 'Shift+Alt+F',
                    description: 'Format document',
                    action: () => this.monacoEditor?.formatDocument()
                },
                {
                    key: 'Ctrl+F',
                    description: 'Find in file',
                    action: () => this.monacoEditor?.showFind()
                },
                {
                    key: 'Ctrl+H',
                    description: 'Replace in file',
                    action: () => this.monacoEditor?.showReplace()
                }
            ];

            shortcuts.forEach(shortcut => {
                keyboardHandler?.addShortcut?.(shortcut.key, shortcut.action, shortcut.description);
            });
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // File operations
            window.addEventListener('file:opened', (e) => this.handleFileOpened(e.detail));
            window.addEventListener('file:openRequest', (e) => this.handleFileOpenRequest(e.detail));
            window.addEventListener('file:droppedAndOpened', (e) => this.handleDroppedFile(e.detail));
            window.addEventListener('file:modified', (e) => this.handleFileModified(e.detail));

            // Editor operations
            window.addEventListener('editor:contentChanged', (e) => this.handleEditorChange(e.detail));

            // Sidebar toggle
            const sidebarToggle = document.getElementById('sidebar-toggle');
            sidebarToggle?.addEventListener('click', () => this.toggleSidebar());

            // AI toggle
            const aiToggle = document.getElementById('ai-toggle');
            aiToggle?.addEventListener('click', () => this.toggleAIPanel());

            // Clear AI button
            const clearAiBtn = document.getElementById('clear-ai-btn');
            clearAiBtn?.addEventListener('click', () => {
                this.aiStreaming?.clearConversation();
            });

            // Open folder button
            const openFolderBtn = document.getElementById('open-folder-btn');
            openFolderBtn?.addEventListener('click', () => this.openFolder());

            // New file button
            const newFileBtn = document.getElementById('new-file-btn');
            newFileBtn?.addEventListener('click', () => this.createNewFile());

            // Format button
            const formatBtn = document.getElementById('format-btn');
            formatBtn?.addEventListener('click', () => this.monacoEditor?.formatDocument());

            // Find button
            const findBtn = document.getElementById('find-btn');
            findBtn?.addEventListener('click', () => this.monacoEditor?.showFind());

            // Replace button
            const replaceBtn = document.getElementById('replace-btn');
            replaceBtn?.addEventListener('click', () => this.monacoEditor?.showReplace());

            // Tab clicks
            this.setupTabListeners();
        }

        /**
         * Setup tab listeners
         */
        setupTabListeners() {
            const tabsContainer = document.getElementById('tabs-container');
            tabsContainer?.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab');
                if (!tab) return;

                const closeBtn = e.target.closest('.tab-close');
                if (closeBtn) {
                    e.stopPropagation();
                    this.closeTab(tab.dataset.fileId);
                } else {
                    this.switchTab(tab.dataset.fileId);
                }
            });
        }

        /**
         * Handle file opened
         */
        handleFileOpened(detail) {
            const { file, content } = detail;
            this.fileManagerAdvanced?.addToRecent(file);
        }

        /**
         * Handle file open request
         */
        async handleFileOpenRequest(detail) {
            const { file, line } = detail;
            // In a real implementation, this would load the file from the file system
            // For now, just show a notification
            if (window.notify) {
                window.notify.info('Open File', `Opening ${file}${line ? `:${line}` : ''}`);
            }
        }

        /**
         * Handle dropped file
         */
        handleDroppedFile(detail) {
            const { file, content, type } = detail;

            // Determine language from file name
            const language = this.monacoEditor?.getLanguageFromPath(file) || 'plaintext';

            // Load into editor
            this.monacoEditor?.loadFile(file, content, language);

            // Add to open files
            this.openFiles.set(file, { content, language });

            // Add tab
            this.addTab(file);

            // Trigger file opened event
            window.dispatchEvent(new CustomEvent('file:opened', {
                detail: { file, content }
            }));
        }

        /**
         * Handle file modified
         */
        handleFileModified(detail) {
            const { file } = detail;
            const tab = document.querySelector(`.tab[data-file-id="${file}"]`);
            if (tab && !tab.classList.contains('modified')) {
                tab.classList.add('modified');
                const tabName = tab.querySelector('span:nth-child(2)');
                if (tabName && !tabName.textContent.endsWith(' •')) {
                    tabName.textContent += ' •';
                }
            }
        }

        /**
         * Handle editor change
         */
        handleEditorChange(detail) {
            const { file, content } = detail;
            if (file && this.openFiles.has(file)) {
                this.openFiles.get(file).content = content;
            }
        }

        /**
         * Open folder
         */
        async openFolder() {
            try {
                const dirHandle = await window.showDirectoryPicker();
                this.currentFolder = dirHandle;
                await this.loadFolderContents(dirHandle);

                if (window.notify) {
                    window.notify.success('Folder Opened', dirHandle.name);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error opening folder:', error);
                    if (window.notify) {
                        window.notify.error('Error', 'Failed to open folder');
                    }
                }
            }
        }

        /**
         * Load folder contents
         */
        async loadFolderContents(dirHandle) {
            const fileExplorer = document.getElementById('file-explorer');
            if (!fileExplorer) return;

            fileExplorer.innerHTML = '<div class="text-sm text-tertiary" style="padding: 8px;">Loading...</div>';

            try {
                const files = [];
                for await (const entry of dirHandle.values()) {
                    files.push({
                        name: entry.name,
                        kind: entry.kind,
                        handle: entry
                    });
                }

                // Sort: directories first, then files
                files.sort((a, b) => {
                    if (a.kind !== b.kind) {
                        return a.kind === 'directory' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                });

                // Render file tree
                fileExplorer.innerHTML = this.renderFileTree(files);

            } catch (error) {
                console.error('Error loading folder contents:', error);
                fileExplorer.innerHTML = '<div class="text-sm text-tertiary" style="padding: 8px;">Error loading folder</div>';
            }
        }

        /**
         * Render file tree
         */
        renderFileTree(files) {
            return files.map(file => {
                const icon = file.kind === 'directory' ? '📁' : this.fileManagerAdvanced?.getFileIcon(file.name) || '📄';
                return `
                    <div class="file-item" onclick="window.app.handleFileClick('${file.name}', '${file.kind}')">
                        ${icon} ${file.name}
                    </div>
                `;
            }).join('');
        }

        /**
         * Handle file click
         */
        async handleFileClick(name, kind) {
            if (kind === 'directory') {
                // TODO: Expand directory
                if (window.notify) {
                    window.notify.info('Directory', 'Directory navigation coming soon!');
                }
                return;
            }

            // Open file
            if (this.currentFolder) {
                try {
                    const fileHandle = await this.currentFolder.getFileHandle(name);
                    const file = await fileHandle.getFile();
                    const content = await file.text();

                    const language = this.monacoEditor?.getLanguageFromPath(name) || 'plaintext';
                    this.monacoEditor?.loadFile(name, content, language);

                    this.openFiles.set(name, { content, language, handle: fileHandle });
                    this.addTab(name);

                    window.dispatchEvent(new CustomEvent('file:opened', {
                        detail: { file: name, content }
                    }));

                } catch (error) {
                    console.error('Error opening file:', error);
                    if (window.notify) {
                        window.notify.error('Error', `Failed to open ${name}`);
                    }
                }
            }
        }

        /**
         * Create new file
         */
        createNewFile() {
            const name = prompt('Enter file name:');
            if (!name) return;

            const language = this.monacoEditor?.getLanguageFromPath(name) || 'plaintext';
            this.monacoEditor?.loadFile(name, '', language);

            this.openFiles.set(name, { content: '', language });
            this.addTab(name);

            if (window.notify) {
                window.notify.success('Created', `New file: ${name}`);
            }
        }

        /**
         * Add tab
         */
        addTab(fileId) {
            const tabsContainer = document.getElementById('tabs-container');
            if (!tabsContainer) return;

            // Check if tab already exists
            if (document.querySelector(`.tab[data-file-id="${fileId}"]`)) {
                this.switchTab(fileId);
                return;
            }

            const tab = document.createElement('button');
            tab.className = 'tab';
            tab.dataset.fileId = fileId;
            tab.setAttribute('role', 'tab');

            const icon = this.fileManagerAdvanced?.getFileIcon(fileId) || '📄';
            tab.innerHTML = `
                <span>${icon}</span>
                <span>${fileId}</span>
                <span class="tab-close">✕</span>
            `;

            tabsContainer.appendChild(tab);
            this.switchTab(fileId);
        }

        /**
         * Switch tab
         */
        switchTab(fileId) {
            // Update tab active state
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });

            const tab = document.querySelector(`.tab[data-file-id="${fileId}"]`);
            if (tab) {
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
            }

            // Load file content into editor
            const fileData = this.openFiles.get(fileId);
            if (fileData) {
                this.monacoEditor?.loadFile(fileId, fileData.content, fileData.language);
            }
        }

        /**
         * Close tab
         */
        closeTab(fileId) {
            const tab = document.querySelector(`.tab[data-file-id="${fileId}"]`);
            if (!tab) return;

            // Check if file is modified
            if (tab.classList.contains('modified')) {
                if (!confirm(`${fileId} has unsaved changes. Close anyway?`)) {
                    return;
                }
            }

            // Remove tab
            tab.remove();

            // Remove from open files
            this.openFiles.delete(fileId);

            // If this was the active tab, switch to another
            if (tab.classList.contains('active')) {
                const remainingTabs = document.querySelectorAll('.tab');
                if (remainingTabs.length > 0) {
                    const nextTab = remainingTabs[remainingTabs.length - 1];
                    this.switchTab(nextTab.dataset.fileId);
                }
            }
        }

        /**
         * Toggle sidebar
         */
        toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const toggle = document.getElementById('sidebar-toggle');

            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                if (toggle) toggle.textContent = '◀';
            } else {
                sidebar.classList.add('collapsed');
                if (toggle) toggle.textContent = '▶';
            }
        }

        /**
         * Toggle AI panel
         */
        toggleAIPanel() {
            const aiColumn = document.querySelector('.ai-column');
            const toggle = document.getElementById('ai-toggle');

            if (aiColumn.classList.contains('collapsed')) {
                aiColumn.classList.remove('collapsed');
                if (toggle) toggle.textContent = '▶';
            } else {
                aiColumn.classList.add('collapsed');
                if (toggle) toggle.textContent = '◀';
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new GrokIDEApp();
            window.app.initialize();
        });
    } else {
        window.app = new GrokIDEApp();
        window.app.initialize();
    }

    // Export globally
    window.GrokIDEApp = GrokIDEApp;
})();
