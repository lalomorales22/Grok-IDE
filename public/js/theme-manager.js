/**
 * Theme Manager
 * Handles theme switching and persistence
 */

class ThemeManager {
    constructor() {
        this.themes = ['metal-gear', 'cyberpunk', 'matrix', 'light', 'nord', 'dracula'];
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeListener();
    }

    /**
     * Load theme from localStorage or use default
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem('grok-ide-theme');
            return saved && this.themes.includes(saved) ? saved : 'metal-gear';
        } catch (error) {
            console.error('Error loading theme:', error);
            return 'metal-gear';
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('grok-ide-theme', theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn(`Unknown theme: ${theme}, falling back to metal-gear`);
            theme = 'metal-gear';
        }

        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme }
        }));
    }

    /**
     * Switch to next theme
     */
    nextTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex]);
    }

    /**
     * Switch to previous theme
     */
    previousTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const prevIndex = (currentIndex - 1 + this.themes.length) % this.themes.length;
        this.applyTheme(this.themes[prevIndex]);
    }

    /**
     * Get current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get all available themes
     */
    getAvailableThemes() {
        return [...this.themes];
    }

    /**
     * Setup system theme change listener
     */
    setupThemeListener() {
        // Listen for system preference changes
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            // Optionally auto-switch theme based on system preference
            if (localStorage.getItem('grok-ide-auto-theme') === 'true') {
                this.applyTheme(e.matches ? 'metal-gear' : 'light');
            }
        });
    }

    /**
     * Get theme metadata
     */
    getThemeMetadata(theme) {
        const metadata = {
            'metal-gear': {
                name: 'Metal Gear Solid',
                description: 'Classic black and white with turquoise accents',
                category: 'dark'
            },
            'cyberpunk': {
                name: 'Cyberpunk',
                description: 'Neon pinks, purples, and electric blues',
                category: 'dark'
            },
            'matrix': {
                name: 'Matrix',
                description: 'Classic green-on-black matrix aesthetic',
                category: 'dark'
            },
            'light': {
                name: 'Light',
                description: 'Clean light mode for daytime use',
                category: 'light'
            },
            'nord': {
                name: 'Nord',
                description: 'Cool arctic-inspired color palette',
                category: 'dark'
            },
            'dracula': {
                name: 'Dracula',
                description: 'Popular dark theme with purple accents',
                category: 'dark'
            }
        };

        return metadata[theme] || null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
