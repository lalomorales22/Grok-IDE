/**
 * Developer Console - Phase 4
 * Capture and display console output
 */

class DeveloperConsole {
    constructor() {
        this.logs = [];
        this.filters = {
            log: true,
            warn: true,
            error: true,
            info: true
        };
        this.initialized = false;
        this.originalConsole = {};
    }

    init() {
        if (this.initialized) return;

        this.setupConsolePanel();
        this.setupEventListeners();
        this.interceptConsole();

        this.initialized = true;
        console.log('✅ Developer Console initialized');
    }

    setupConsolePanel() {
        const bottomPanel = document.getElementById('bottom-panel');
        if (!bottomPanel) return;

        let consoleContent = document.getElementById('console-content');
        if (!consoleContent) {
            consoleContent = document.createElement('div');
            consoleContent.id = 'console-content';
            consoleContent.className = 'dev-console-panel';
            consoleContent.style.display = 'none';
            consoleContent.innerHTML = `
                <div class="dev-console-header">
                    <div class="console-filters">
                        <button class="console-filter-btn active" data-filter="log">Log</button>
                        <button class="console-filter-btn active" data-filter="warn">Warn</button>
                        <button class="console-filter-btn active" data-filter="error">Error</button>
                        <button class="console-filter-btn active" data-filter="info">Info</button>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-icon btn-xs" id="clear-console-btn" title="Clear Console">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="dev-console-content" id="dev-console-content">
                    <div class="console-entry info">
                        <span class="console-entry-icon">ℹ️</span>
                        <span class="console-entry-content">Developer Console ready</span>
                    </div>
                </div>
            `;

            const panelContent = bottomPanel.querySelector('.bottom-panel-content');
            if (panelContent) {
                panelContent.appendChild(consoleContent);
            }
        }
    }

    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.console-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filters[filter] = !this.filters[filter];
                btn.classList.toggle('active');
                this.render();
            });
        });

        // Clear button
        const clearBtn = document.getElementById('clear-console-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
    }

    interceptConsole() {
        // Store original console methods
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };

        // Override console methods
        console.log = (...args) => {
            this.addLog('log', args);
            this.originalConsole.log.apply(console, args);
        };

        console.warn = (...args) => {
            this.addLog('warn', args);
            this.originalConsole.warn.apply(console, args);
        };

        console.error = (...args) => {
            this.addLog('error', args);
            this.originalConsole.error.apply(console, args);
        };

        console.info = (...args) => {
            this.addLog('info', args);
            this.originalConsole.info.apply(console, args);
        };
    }

    addLog(type, args) {
        const entry = {
            type,
            message: args.map(arg => this.formatArg(arg)).join(' '),
            timestamp: new Date()
        };

        this.logs.push(entry);

        // Limit logs to 1000 entries
        if (this.logs.length > 1000) {
            this.logs.shift();
        }

        this.renderEntry(entry);
    }

    formatArg(arg) {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return String(arg);
            }
        }
        return String(arg);
    }

    renderEntry(entry) {
        if (!this.filters[entry.type]) return;

        const content = document.getElementById('dev-console-content');
        if (!content) return;

        const entryElement = document.createElement('div');
        entryElement.className = `console-entry ${entry.type}`;

        const icon = {
            log: '📝',
            warn: '⚠️',
            error: '❌',
            info: 'ℹ️'
        }[entry.type];

        entryElement.innerHTML = `
            <span class="console-entry-icon">${icon}</span>
            <span class="console-entry-content">${this.escapeHtml(entry.message)}</span>
        `;

        content.appendChild(entryElement);

        // Auto-scroll to bottom
        content.scrollTop = content.scrollHeight;
    }

    render() {
        const content = document.getElementById('dev-console-content');
        if (!content) return;

        content.innerHTML = '';

        this.logs.forEach(entry => {
            if (this.filters[entry.type]) {
                this.renderEntry(entry);
            }
        });
    }

    clear() {
        this.logs = [];
        const content = document.getElementById('dev-console-content');
        if (content) {
            content.innerHTML = '<div class="console-entry info"><span class="console-entry-icon">ℹ️</span><span class="console-entry-content">Console cleared</span></div>';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    show() {
        const content = document.getElementById('console-content');
        if (content) {
            content.style.display = 'flex';
        }
    }

    hide() {
        const content = document.getElementById('console-content');
        if (content) {
            content.style.display = 'none';
        }
    }
}

window.DeveloperConsole = DeveloperConsole;
