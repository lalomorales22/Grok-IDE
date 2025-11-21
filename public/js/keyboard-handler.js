/**
 * Keyboard Handler
 * Manages keyboard shortcuts and key bindings
 */

class KeyboardHandler {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.init();
    }

    init() {
        this.registerDefaultShortcuts();
        this.setupGlobalListener();
    }

    registerDefaultShortcuts() {
        // File operations
        this.register('Ctrl+N', () => this.app.createNewFile?.(), 'New File');
        this.register('Ctrl+S', () => this.app.saveCurrentFile?.(), 'Save File');
        this.register('Ctrl+Shift+S', () => this.app.saveAllFiles?.(), 'Save All Files');
        this.register('Ctrl+O', () => this.app.openFolder?.(), 'Open Folder');
        this.register('Ctrl+W', () => this.app.closeCurrentTab?.(), 'Close Tab');

        // Edit operations
        this.register('Ctrl+F', () => this.app.openFindDialog?.(), 'Find');
        this.register('Ctrl+H', () => this.app.openReplaceDialog?.(), 'Find and Replace');
        this.register('Ctrl+Z', () => this.app.undo?.(), 'Undo');
        this.register('Ctrl+Y', () => this.app.redo?.(), 'Redo');
        this.register('Ctrl+Shift+Y', () => this.app.redo?.(), 'Redo (Alt)');

        // View operations
        this.register('Ctrl+K', () => this.app.commandPalette?.toggle(), 'Command Palette');
        this.register('Ctrl+B', () => this.app.toggleSidebar?.(), 'Toggle Sidebar');
        this.register('Ctrl+I', () => this.app.toggleAIPanel?.(), 'Toggle AI Panel');
        this.register('F11', () => this.app.toggleZenMode?.(), 'Toggle Zen Mode');
        this.register('Ctrl+T', () => this.app.themeManager?.nextTheme(), 'Next Theme');
        this.register('Ctrl+Shift+T', () => this.app.themeManager?.previousTheme(), 'Previous Theme');

        // Navigation
        this.register('Ctrl+Tab', () => this.app.nextTab?.(), 'Next Tab');
        this.register('Ctrl+Shift+Tab', () => this.app.previousTab?.(), 'Previous Tab');
        this.register('Ctrl+1', () => this.app.switchToTab?.(0), 'Go to Tab 1');
        this.register('Ctrl+2', () => this.app.switchToTab?.(1), 'Go to Tab 2');
        this.register('Ctrl+3', () => this.app.switchToTab?.(2), 'Go to Tab 3');
        this.register('Ctrl+4', () => this.app.switchToTab?.(3), 'Go to Tab 4');
        this.register('Ctrl+5', () => this.app.switchToTab?.(4), 'Go to Tab 5');

        // Settings & Help
        this.register('Ctrl+,', () => this.app.openSettings?.(), 'Open Settings');
        this.register('Ctrl+/', () => this.app.showKeyboardShortcuts?.(), 'Show Shortcuts');

        // AI operations
        this.register('Ctrl+Enter', () => this.app.sendAIRequest?.(), 'Send AI Request');
        this.register('Ctrl+Shift+C', () => this.app.clearAIChat?.(), 'Clear AI Chat');

        // Misc
        this.register('Escape', () => this.app.handleEscape?.(), 'Cancel/Close');
    }

    /**
     * Register a keyboard shortcut
     * @param {string} combo - Key combination (e.g., 'Ctrl+S', 'Alt+Shift+F')
     * @param {Function} handler - Handler function
     * @param {string} description - Description of the shortcut
     */
    register(combo, handler, description = '') {
        const normalized = this.normalizeCombo(combo);
        this.shortcuts.set(normalized, {
            combo: normalized,
            originalCombo: combo,
            handler,
            description
        });
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(combo) {
        const normalized = this.normalizeCombo(combo);
        this.shortcuts.delete(normalized);
    }

    /**
     * Normalize key combination for consistent matching
     */
    normalizeCombo(combo) {
        const parts = combo.split('+').map(p => p.trim());
        const modifiers = [];
        let key = '';

        for (const part of parts) {
            const lower = part.toLowerCase();
            if (lower === 'ctrl' || lower === 'control') {
                modifiers.push('Ctrl');
            } else if (lower === 'alt') {
                modifiers.push('Alt');
            } else if (lower === 'shift') {
                modifiers.push('Shift');
            } else if (lower === 'meta' || lower === 'cmd' || lower === 'command') {
                modifiers.push('Meta');
            } else {
                key = part;
            }
        }

        // Sort modifiers for consistency
        modifiers.sort();

        return [...modifiers, key].join('+');
    }

    /**
     * Setup global keyboard listener
     */
    setupGlobalListener() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;

            const combo = this.getComboFromEvent(e);
            const shortcut = this.shortcuts.get(combo);

            if (shortcut) {
                // Check if we should prevent default behavior
                if (this.shouldPreventDefault(e, combo)) {
                    e.preventDefault();
                }

                try {
                    shortcut.handler(e);
                } catch (error) {
                    console.error('Error executing shortcut handler:', error);
                }
            }
        });
    }

    /**
     * Get key combination from keyboard event
     */
    getComboFromEvent(event) {
        const modifiers = [];
        let key = event.key;

        // Handle special keys
        const specialKeys = {
            'Escape': 'Escape',
            'Enter': 'Enter',
            'Tab': 'Tab',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight',
            'Home': 'Home',
            'End': 'End',
            'PageUp': 'PageUp',
            'PageDown': 'PageDown',
            ' ': 'Space',
        };

        if (event.key in specialKeys) {
            key = specialKeys[event.key];
        } else if (event.key.length === 1) {
            key = event.key.toUpperCase();
        } else if (event.key.startsWith('F') && event.key.length <= 3) {
            // Function keys (F1-F12)
            key = event.key;
        }

        // Add modifiers in consistent order
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.metaKey) modifiers.push('Meta');

        modifiers.sort();

        return [...modifiers, key].join('+');
    }

    /**
     * Determine if default behavior should be prevented
     */
    shouldPreventDefault(event, combo) {
        // Don't prevent default if user is typing in an input/textarea
        const target = event.target;
        const tagName = target.tagName.toLowerCase();

        if (['input', 'textarea', 'select'].includes(tagName)) {
            // Allow certain shortcuts even in input fields
            const allowedInInputs = ['Escape', 'Ctrl+A', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+Y'];
            return allowedInInputs.some(allowed => this.normalizeCombo(allowed) === combo);
        }

        return true;
    }

    /**
     * Get all registered shortcuts
     */
    getShortcuts() {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcuts by category
     */
    getShortcutsByCategory() {
        const shortcuts = this.getShortcuts();
        const categories = {
            'File': [],
            'Edit': [],
            'View': [],
            'Navigation': [],
            'AI': [],
            'Settings & Help': [],
            'Other': []
        };

        for (const shortcut of shortcuts) {
            const desc = shortcut.description.toLowerCase();

            if (desc.includes('file') || desc.includes('save') || desc.includes('open') || desc.includes('close') || desc.includes('new')) {
                categories['File'].push(shortcut);
            } else if (desc.includes('find') || desc.includes('replace') || desc.includes('undo') || desc.includes('redo')) {
                categories['Edit'].push(shortcut);
            } else if (desc.includes('toggle') || desc.includes('show') || desc.includes('theme') || desc.includes('zen')) {
                categories['View'].push(shortcut);
            } else if (desc.includes('tab') || desc.includes('go to')) {
                categories['Navigation'].push(shortcut);
            } else if (desc.includes('ai') || desc.includes('chat')) {
                categories['AI'].push(shortcut);
            } else if (desc.includes('settings') || desc.includes('help') || desc.includes('shortcuts')) {
                categories['Settings & Help'].push(shortcut);
            } else {
                categories['Other'].push(shortcut);
            }
        }

        return categories;
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.isEnabled = false;
    }

    /**
     * Check if handler is enabled
     */
    isHandlerEnabled() {
        return this.isEnabled;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardHandler;
}
