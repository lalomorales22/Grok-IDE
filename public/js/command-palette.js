/**
 * Command Palette
 * Quick command/action search and execution
 */

class CommandPalette {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.commands = [];
        this.filteredCommands = [];
        this.selectedIndex = 0;
        this.overlay = null;
        this.paletteEl = null;
        this.inputEl = null;
        this.resultsEl = null;
        this.init();
    }

    init() {
        this.registerDefaultCommands();
        this.setupKeyboardShortcut();
    }

    registerDefaultCommands() {
        this.commands = [
            {
                id: 'file.new',
                title: 'New File',
                description: 'Create a new file',
                category: 'File',
                icon: '📄',
                shortcut: 'Ctrl+N',
                action: () => this.app.createNewFile?.()
            },
            {
                id: 'file.save',
                title: 'Save File',
                description: 'Save the current file',
                category: 'File',
                icon: '💾',
                shortcut: 'Ctrl+S',
                action: () => this.app.saveCurrentFile?.()
            },
            {
                id: 'file.saveAll',
                title: 'Save All Files',
                description: 'Save all open files',
                category: 'File',
                icon: '💾',
                shortcut: 'Ctrl+Shift+S',
                action: () => this.app.saveAllFiles?.()
            },
            {
                id: 'folder.open',
                title: 'Open Folder',
                description: 'Open a folder for editing',
                category: 'Folder',
                icon: '📁',
                shortcut: 'Ctrl+O',
                action: () => this.app.openFolder?.()
            },
            {
                id: 'theme.switch',
                title: 'Switch Theme',
                description: 'Change the current theme',
                category: 'View',
                icon: '🎨',
                shortcut: 'Ctrl+T',
                action: () => this.app.themeManager?.nextTheme()
            },
            {
                id: 'view.zen',
                title: 'Toggle Zen Mode',
                description: 'Toggle distraction-free zen mode',
                category: 'View',
                icon: '🧘',
                shortcut: 'F11',
                action: () => this.app.toggleZenMode?.()
            },
            {
                id: 'view.sidebar',
                title: 'Toggle Sidebar',
                description: 'Show/hide sidebar',
                category: 'View',
                icon: '📋',
                shortcut: 'Ctrl+B',
                action: () => this.app.toggleSidebar?.()
            },
            {
                id: 'view.ai',
                title: 'Toggle AI Panel',
                description: 'Show/hide AI assistant panel',
                category: 'View',
                icon: '🤖',
                shortcut: 'Ctrl+I',
                action: () => this.app.toggleAIPanel?.()
            },
            {
                id: 'settings.open',
                title: 'Open Settings',
                description: 'Open settings panel',
                category: 'Settings',
                icon: '⚙️',
                shortcut: 'Ctrl+,',
                action: () => this.app.openSettings?.()
            },
            {
                id: 'shortcuts.show',
                title: 'Show Keyboard Shortcuts',
                description: 'Display all keyboard shortcuts',
                category: 'Help',
                icon: '⌨️',
                shortcut: 'Ctrl+/',
                action: () => this.app.showKeyboardShortcuts?.()
            },
            {
                id: 'ai.clear',
                title: 'Clear AI Chat',
                description: 'Clear AI conversation history',
                category: 'AI',
                icon: '🗑️',
                shortcut: '',
                action: () => this.app.clearAIChat?.()
            }
        ];
    }

    registerCommand(command) {
        this.commands.push(command);
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // CMD+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.createPaletteUI();
        this.updateResults('');
        this.inputEl.focus();

        // Add to DOM with animation
        document.body.appendChild(this.overlay);
        requestAnimationFrame(() => {
            this.overlay.classList.add('modal-backdrop-enter');
            this.paletteEl.classList.add('modal-content-enter');
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        // Animate out
        this.overlay.classList.remove('modal-backdrop-enter');
        this.overlay.classList.add('modal-backdrop-exit');
        this.paletteEl.classList.remove('modal-content-enter');
        this.paletteEl.classList.add('modal-content-exit');

        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.cleanupEventListeners();
        }, 300);
    }

    createPaletteUI() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'command-palette-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-label', 'Command Palette');

        // Palette container
        this.paletteEl = document.createElement('div');
        this.paletteEl.className = 'command-palette';

        // Input
        this.inputEl = document.createElement('input');
        this.inputEl.type = 'text';
        this.inputEl.className = 'command-palette-input';
        this.inputEl.placeholder = 'Type a command...';
        this.inputEl.setAttribute('aria-label', 'Search commands');
        this.paletteEl.appendChild(this.inputEl);

        // Results
        this.resultsEl = document.createElement('div');
        this.resultsEl.className = 'command-palette-results';
        this.resultsEl.setAttribute('role', 'listbox');
        this.paletteEl.appendChild(this.resultsEl);

        this.overlay.appendChild(this.paletteEl);
    }

    setupEventListeners() {
        this.handleInput = (e) => {
            this.updateResults(e.target.value);
        };

        this.handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.executeSelected();
                    break;
            }
        };

        this.handleOverlayClick = (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        };

        this.inputEl.addEventListener('input', this.handleInput);
        this.inputEl.addEventListener('keydown', this.handleKeyDown);
        this.overlay.addEventListener('click', this.handleOverlayClick);
    }

    cleanupEventListeners() {
        if (this.inputEl) {
            this.inputEl.removeEventListener('input', this.handleInput);
            this.inputEl.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.overlay) {
            this.overlay.removeEventListener('click', this.handleOverlayClick);
        }
    }

    updateResults(query) {
        query = query.toLowerCase().trim();

        if (!query) {
            this.filteredCommands = [...this.commands];
        } else {
            this.filteredCommands = this.commands.filter(cmd => {
                const searchText = `${cmd.title} ${cmd.description} ${cmd.category}`.toLowerCase();
                return searchText.includes(query);
            });
        }

        this.selectedIndex = 0;
        this.renderResults();
    }

    renderResults() {
        this.resultsEl.innerHTML = '';

        if (this.filteredCommands.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'command-palette-empty';
            empty.textContent = 'No commands found';
            this.resultsEl.appendChild(empty);
            return;
        }

        this.filteredCommands.forEach((cmd, index) => {
            const item = this.createCommandItem(cmd, index);
            this.resultsEl.appendChild(item);
        });
    }

    createCommandItem(cmd, index) {
        const item = document.createElement('div');
        item.className = 'command-palette-item';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', index === this.selectedIndex);

        if (index === this.selectedIndex) {
            item.classList.add('selected');
        }

        // Icon
        if (cmd.icon) {
            const icon = document.createElement('span');
            icon.className = 'command-palette-icon';
            icon.textContent = cmd.icon;
            item.appendChild(icon);
        }

        // Content
        const content = document.createElement('div');
        content.className = 'command-palette-content';

        const title = document.createElement('div');
        title.className = 'command-palette-title';
        title.textContent = cmd.title;
        content.appendChild(title);

        if (cmd.description) {
            const desc = document.createElement('div');
            desc.className = 'command-palette-description';
            desc.textContent = cmd.description;
            content.appendChild(desc);
        }

        item.appendChild(content);

        // Shortcut
        if (cmd.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = 'command-palette-shortcut';
            shortcut.textContent = cmd.shortcut;
            item.appendChild(shortcut);
        }

        // Click handler
        item.onclick = () => {
            this.selectedIndex = index;
            this.executeSelected();
        };

        return item;
    }

    selectNext() {
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
        this.renderResults();
        this.scrollToSelected();
    }

    selectPrevious() {
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
        this.renderResults();
        this.scrollToSelected();
    }

    scrollToSelected() {
        const items = this.resultsEl.querySelectorAll('.command-palette-item');
        const selected = items[this.selectedIndex];
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }

    executeSelected() {
        const cmd = this.filteredCommands[this.selectedIndex];
        if (cmd && cmd.action) {
            this.close();
            setTimeout(() => {
                try {
                    cmd.action();
                } catch (error) {
                    console.error('Error executing command:', error);
                    this.app.notify?.error('Error', `Failed to execute command: ${cmd.title}`);
                }
            }, 100);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandPalette;
}
