/**
 * Settings Manager
 * Manages user preferences and settings persistence
 */


// Accessibility prefs
const A11Y_KEY = "grokide:a11y";

function loadA11yPrefs() {
  try { return JSON.parse(localStorage.getItem(A11Y_KEY) || "{}"); }
  catch { return {}; }
}

function applyA11yPrefs(prefs) {
  const fontScale = Number(prefs.fontScale ?? 1.0);
  const contrast = (prefs.contrast ?? "normal"); // "normal" | "high"

  document.documentElement.style.fontSize = `${Math.round(fontScale * 100)}%`;
  document.documentElement.dataset.contrast = contrast;
}

// Apply once on load
applyA11yPrefs(loadA11yPrefs());
// Accessibility prefs (font scale + contrast)
const A11Y_STORAGE_KEY = "grokide:a11y";

function loadA11yPrefs() {
  try {
    return JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function applyA11yPrefs(prefs) {
  const fontScale = Number(prefs.fontScale ?? 1.0);
  const contrast = (prefs.contrast ?? "normal"); // "normal" | "high"

  document.documentElement.style.fontSize = `${Math.round(fontScale * 100)}%`;
  document.documentElement.dataset.contrast = contrast;
}

// Call on startup (once)
applyA11yPrefs(loadA11yPrefs());
class SettingsManager {
    constructor() {
        this.settings = {};
        this.defaults = this.getDefaultSettings();
        this.listeners = new Map();
        this.storageKey = 'grok-ide-settings';
        this.init();
    }

    init() {
        this.loadSettings();
    }

    getDefaultSettings() {
        return {
            // Theme settings
            theme: 'metal-gear',
            autoTheme: false,

            // Editor settings
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, Courier New, monospace',
            tabSize: 4,
            wordWrap: true,
            lineNumbers: true,
            autoSave: true,
            autoSaveDelay: 2000,

            // UI settings
            sidebarWidth: 250,
            aiColumnWidth: 350,
            showStatusBar: true,
            showBreadcrumbs: true,

            // AI settings
            aiMode: 'code',
            includeFileContext: true,
            maxAIHistory: 50,

            // Accessibility
            reducedMotion: false,
            highContrast: false,
            screenReaderMode: false,

            // Keyboard shortcuts
            shortcuts: {
                'newFile': 'Ctrl+N',
                'saveFile': 'Ctrl+S',
                'saveAll': 'Ctrl+Shift+S',
                'openFolder': 'Ctrl+O',
                'commandPalette': 'Ctrl+K',
                'toggleZen': 'F11',
                'toggleSidebar': 'Ctrl+B',
                'toggleAI': 'Ctrl+I',
                'settings': 'Ctrl+,',
                'shortcuts': 'Ctrl+/',
            },

            // Workspace
            lastOpenedFolder: null,
            openTabs: [],
            activeTab: null,
            workspaceLayouts: {},
        };
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = this.mergeWithDefaults(parsed);
            } else {
                this.settings = { ...this.defaults };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { ...this.defaults };
        }
    }

    /**
     * Save settings to storage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Merge loaded settings with defaults to ensure all keys exist
     */
    mergeWithDefaults(loaded) {
        const merged = { ...this.defaults };

        for (const key in loaded) {
            if (typeof loaded[key] === 'object' && !Array.isArray(loaded[key])) {
                merged[key] = { ...merged[key], ...loaded[key] };
            } else {
                merged[key] = loaded[key];
            }
        }

        return merged;
    }

    /**
     * Get a setting value
     */
    get(key, defaultValue = undefined) {
        const keys = key.split('.');
        let value = this.settings;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue !== undefined ? defaultValue : this.getDefault(key);
            }
        }

        return value;
    }

    /**
     * Set a setting value
     */
    set(key, value) {
        const keys = key.split('.');
        let target = this.settings;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in target) || typeof target[k] !== 'object') {
                target[k] = {};
            }
            target = target[k];
        }

        const lastKey = keys[keys.length - 1];
        const oldValue = target[lastKey];
        target[lastKey] = value;

        this.saveSettings();
        this.notifyListeners(key, value, oldValue);
    }

    /**
     * Get default value for a key
     */
    getDefault(key) {
        const keys = key.split('.');
        let value = this.defaults;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Reset a setting to default
     */
    reset(key) {
        const defaultValue = this.getDefault(key);
        if (defaultValue !== undefined) {
            this.set(key, defaultValue);
        }
    }

    /**
     * Reset all settings to defaults
     */
    resetAll() {
        this.settings = { ...this.defaults };
        this.saveSettings();
        this.notifyListeners('*', this.settings, {});
    }

    /**
     * Listen for setting changes
     */
    onChange(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify listeners of changes
     */
    notifyListeners(key, newValue, oldValue) {
        // Notify specific key listeners
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(newValue, oldValue, key);
                } catch (error) {
                    console.error('Error in settings listener:', error);
                }
            });
        }

        // Notify wildcard listeners
        const wildcardCallbacks = this.listeners.get('*');
        if (wildcardCallbacks) {
            wildcardCallbacks.forEach(cb => {
                try {
                    cb(newValue, oldValue, key);
                } catch (error) {
                    console.error('Error in settings listener:', error);
                }
            });
        }
    }

    /**
     * Export settings as JSON
     */
    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Import settings from JSON
     */
    import(json) {
        try {
            const imported = JSON.parse(json);
            this.settings = this.mergeWithDefaults(imported);
            this.saveSettings();
            this.notifyListeners('*', this.settings, {});
            return true;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }

    /**
     * Get all settings
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Update multiple settings at once
     */
    updateMany(updates) {
        for (const [key, value] of Object.entries(updates)) {
            const keys = key.split('.');
            let target = this.settings;

            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!(k in target) || typeof target[k] !== 'object') {
                    target[k] = {};
                }
                target = target[k];
            }

            const lastKey = keys[keys.length - 1];
            target[lastKey] = value;
        }

        this.saveSettings();

        // Notify all listeners
        for (const [key, value] of Object.entries(updates)) {
            this.notifyListeners(key, value, undefined);
        }
    }

    /**
     * Save workspace layout
     */
    saveWorkspaceLayout(name, layout) {
        if (!this.settings.workspaceLayouts) {
            this.settings.workspaceLayouts = {};
        }
        this.settings.workspaceLayouts[name] = {
            ...layout,
            savedAt: Date.now()
        };
        this.saveSettings();
    }

    /**
     * Load workspace layout
     */
    loadWorkspaceLayout(name) {
        return this.settings.workspaceLayouts?.[name] || null;
    }

    /**
     * Delete workspace layout
     */
    deleteWorkspaceLayout(name) {
        if (this.settings.workspaceLayouts?.[name]) {
            delete this.settings.workspaceLayouts[name];
            this.saveSettings();
        }
    }

    /**
     * Get all workspace layouts
     */
    getWorkspaceLayouts() {
        return { ...this.settings.workspaceLayouts };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}
