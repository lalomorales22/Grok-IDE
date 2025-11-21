/**
 * Grok IDE - Main Application
 * Phase 2: UI/UX Enhancement & Design System
 */

class GrokIDEApp {
    constructor() {
        // Core managers
        this.themeManager = null;
        this.settingsManager = null;
        this.notificationSystem = null;
        this.commandPalette = null;
        this.keyboardHandler = null;

        // UI state
        this.zenMode = false;
        this.sidebarVisible = true;
        this.aiPanelVisible = true;

        // Initialize
        this.init();
    }

    async init() {
        console.log('🚀 Grok IDE initializing (Phase 2)...');

        // Initialize managers
        this.initializeManagers();

        // Setup UI
        this.setupUI();

        // Show welcome notification
        this.showWelcomeNotification();

        console.log('✅ Grok IDE initialized successfully');
    }

    initializeManagers() {
        // Theme Manager
        this.themeManager = new ThemeManager();
        console.log('✓ Theme Manager initialized');

        // Settings Manager
        this.settingsManager = new SettingsManager();
        console.log('✓ Settings Manager initialized');

        // Notification System
        this.notificationSystem = new NotificationSystem();
        console.log('✓ Notification System initialized');

        // Command Palette
        this.commandPalette = new CommandPalette(this);
        console.log('✓ Command Palette initialized');

        // Keyboard Handler
        this.keyboardHandler = new KeyboardHandler(this);
        console.log('✓ Keyboard Handler initialized');

        // Make globally accessible for debugging
        window.grokIDE = this;
    }

    setupUI() {
        // Apply saved settings
        this.applySavedSettings();

        // Setup theme switcher button
        this.setupThemeSwitcher();

        // Setup sidebar/AI panel toggles
        this.setupPanelToggles();

        // Setup accessibility features
        this.setupAccessibility();

        // Setup status bar info
        this.updateStatusBar();
    }

    applySavedSettings() {
        // Apply theme
        const theme = this.settingsManager.get('theme');
        this.themeManager.applyTheme(theme);

        // Apply reduced motion if set
        if (this.settingsManager.get('reducedMotion')) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-base', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');
        }
    }

    setupThemeSwitcher() {
        const themeSwitcher = document.getElementById('theme-switcher');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', () => {
                this.themeManager.nextTheme();
                this.notificationSystem.info(
                    'Theme Changed',
                    `Switched to ${this.themeManager.getCurrentTheme()} theme`,
                    2000
                );
            });
        }
    }

    setupPanelToggles() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // AI panel toggle
        const aiToggle = document.getElementById('ai-toggle');
        if (aiToggle) {
            aiToggle.addEventListener('click', () => this.toggleAIPanel());
        }
    }

    setupAccessibility() {
        // Setup skip link
        const skipLink = document.querySelector('.skip-link');
        if (!skipLink) {
            const link = document.createElement('a');
            link.href = '#editor';
            link.className = 'skip-link';
            link.textContent = 'Skip to main content';
            document.body.insertBefore(link, document.body.firstChild);
        }

        // Setup focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    updateStatusBar() {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const themeInfo = document.getElementById('status-theme');
            if (themeInfo) {
                themeInfo.textContent = this.themeManager.getCurrentTheme();
            }
        }

        // Listen for theme changes
        window.addEventListener('themechange', (e) => {
            const themeInfo = document.getElementById('status-theme');
            if (themeInfo) {
                themeInfo.textContent = e.detail.theme;
            }
        });
    }

    showWelcomeNotification() {
        setTimeout(() => {
            this.notificationSystem.success(
                'Welcome to Grok IDE v2.0',
                'Phase 2: Enhanced UI/UX is now active! Press Ctrl+K for commands.',
                5000
            );
        }, 500);
    }

    // ===== Public API Methods =====

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            this.sidebarVisible = !this.sidebarVisible;
            sidebar.classList.toggle('collapsed');
            this.notificationSystem.info(
                'Sidebar',
                this.sidebarVisible ? 'Shown' : 'Hidden',
                1000
            );
        }
    }

    toggleAIPanel() {
        const aiPanel = document.querySelector('.ai-column');
        if (aiPanel) {
            this.aiPanelVisible = !this.aiPanelVisible;
            aiPanel.classList.toggle('collapsed');
            this.notificationSystem.info(
                'AI Panel',
                this.aiPanelVisible ? 'Shown' : 'Hidden',
                1000
            );
        }
    }

    toggleZenMode() {
        this.zenMode = !this.zenMode;
        document.body.classList.toggle('zen-mode', this.zenMode);

        if (this.zenMode) {
            this.notificationSystem.info('Zen Mode', 'Enabled - Press F11 to exit', 2000);
        } else {
            this.notificationSystem.info('Zen Mode', 'Disabled', 1000);
        }
    }

    openSettings() {
        // Create settings modal
        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay modal-backdrop-enter';

        const panel = document.createElement('div');
        panel.className = 'settings-panel modal-content-enter';

        // Header
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.innerHTML = `
            <h2 class="settings-title">Settings</h2>
            <button class="btn btn-icon" id="close-settings" aria-label="Close settings">✕</button>
        `;

        // Content (simplified for demo)
        const body = document.createElement('div');
        body.className = 'settings-body';
        body.innerHTML = `
            <div class="settings-sidebar">
                <div class="settings-nav-item active">Appearance</div>
                <div class="settings-nav-item">Editor</div>
                <div class="settings-nav-item">Keyboard</div>
                <div class="settings-nav-item">AI</div>
            </div>
            <div class="settings-content">
                <div class="settings-section">
                    <h3 class="settings-section-title">Theme</h3>
                    <div class="theme-grid">
                        ${this.themeManager.getAvailableThemes().map(theme => `
                            <div class="theme-card ${this.themeManager.getCurrentTheme() === theme ? 'active' : ''}" data-theme="${theme}">
                                <div class="theme-preview">
                                    <div class="theme-preview-color" style="background: var(--color-bg-primary)"></div>
                                    <div class="theme-preview-color" style="background: var(--color-text-accent)"></div>
                                </div>
                                <div class="theme-name">${theme}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="settings-section">
                    <h3 class="settings-section-title">Accessibility</h3>
                    <div class="settings-group">
                        <label class="settings-label">
                            <input type="checkbox" class="settings-checkbox" id="reduced-motion">
                            Reduced Motion
                        </label>
                        <p class="settings-description">Minimize animations and transitions</p>
                    </div>
                </div>
            </div>
        `;

        // Footer
        const footer = document.createElement('div');
        footer.className = 'settings-footer';
        footer.innerHTML = `
            <button class="btn" id="reset-settings">Reset to Defaults</button>
            <button class="btn btn-primary" id="save-settings">Save</button>
        `;

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('close-settings').onclick = () => this.closeSettings(overlay);
        document.getElementById('save-settings').onclick = () => {
            this.notificationSystem.success('Settings', 'Saved successfully');
            this.closeSettings(overlay);
        };

        // Theme selection
        document.querySelectorAll('.theme-card').forEach(card => {
            card.onclick = () => {
                const theme = card.dataset.theme;
                this.themeManager.applyTheme(theme);
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            };
        });

        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeSettings(overlay);
        };
    }

    closeSettings(overlay) {
        overlay.classList.remove('modal-backdrop-enter');
        overlay.classList.add('modal-backdrop-exit');
        overlay.querySelector('.settings-panel').classList.remove('modal-content-enter');
        overlay.querySelector('.settings-panel').classList.add('modal-content-exit');

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }

    showKeyboardShortcuts() {
        const shortcuts = this.keyboardHandler.getShortcutsByCategory();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay modal-backdrop-enter';

        const modal = document.createElement('div');
        modal.className = 'modal modal-content-enter';

        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">Keyboard Shortcuts</h2>
                <button class="btn btn-icon" id="close-shortcuts">✕</button>
            </div>
            <div class="modal-body">
                <div class="shortcuts-viewer">
                    ${Object.entries(shortcuts).map(([category, items]) => {
                        if (items.length === 0) return '';
                        return `
                            <div class="shortcuts-category">
                                <h3 class="shortcuts-category-title">${category}</h3>
                                ${items.map(shortcut => `
                                    <div class="shortcut-item">
                                        <span class="shortcut-description">${shortcut.description}</span>
                                        <span class="shortcut-key">${shortcut.originalCombo}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="close-shortcuts-btn">Close</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => {
            overlay.classList.add('modal-backdrop-exit');
            modal.classList.add('modal-content-exit');
            setTimeout(() => overlay.remove(), 300);
        };

        document.getElementById('close-shortcuts').onclick = close;
        document.getElementById('close-shortcuts-btn').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }

    handleEscape() {
        // Close any open modals or overlays
        const overlays = document.querySelectorAll('.command-palette-overlay, .modal-overlay, .settings-overlay');
        if (overlays.length > 0) {
            overlays[overlays.length - 1].click();
        }
    }

    // Notification helpers
    notify = {
        success: (title, message, duration) => this.notificationSystem.success(title, message, duration),
        error: (title, message, duration) => this.notificationSystem.error(title, message, duration),
        warning: (title, message, duration) => this.notificationSystem.warning(title, message, duration),
        info: (title, message, duration) => this.notificationSystem.info(title, message, duration)
    };
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new GrokIDEApp();
    });
} else {
    window.app = new GrokIDEApp();
}
