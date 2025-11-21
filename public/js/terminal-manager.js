/**
 * Terminal Manager - Phase 4
 * Integrated terminal using xterm.js
 */

class TerminalManager {
    constructor() {
        this.terminals = new Map();
        this.activeTerminalId = null;
        this.terminalCounter = 0;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        // Load xterm.js and addons from CDN
        await this.loadXtermLibraries();

        this.setupTerminalPanel();
        this.createTerminal(); // Create first terminal
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ Terminal Manager initialized');
    }

    async loadXtermLibraries() {
        return new Promise((resolve, reject) => {
            // Load xterm.js CSS
            const xtermCSS = document.createElement('link');
            xtermCSS.rel = 'stylesheet';
            xtermCSS.href = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css';
            document.head.appendChild(xtermCSS);

            // Load xterm.js and addons
            const xtermScript = document.createElement('script');
            xtermScript.src = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js';
            xtermScript.onload = () => {
                // Load fit addon
                const fitAddon = document.createElement('script');
                fitAddon.src = 'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js';
                fitAddon.onload = () => {
                    // Load web links addon
                    const webLinksAddon = document.createElement('script');
                    webLinksAddon.src = 'https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.js';
                    webLinksAddon.onload = resolve;
                    webLinksAddon.onerror = reject;
                    document.head.appendChild(webLinksAddon);
                };
                fitAddon.onerror = reject;
                document.head.appendChild(fitAddon);
            };
            xtermScript.onerror = reject;
            document.head.appendChild(xtermScript);
        });
    }

    setupTerminalPanel() {
        const bottomPanel = document.getElementById('bottom-panel');
        if (!bottomPanel) return;

        // Find or create terminal tab content
        let terminalContent = document.getElementById('terminal-content');
        if (!terminalContent) {
            terminalContent = document.createElement('div');
            terminalContent.id = 'terminal-content';
            terminalContent.className = 'terminal-panel';
            terminalContent.style.display = 'none';
            terminalContent.innerHTML = `
                <div class="terminal-header">
                    <div class="terminal-tabs" id="terminal-tabs"></div>
                    <div class="terminal-actions">
                        <button class="btn btn-icon btn-xs" id="new-terminal-btn" title="New Terminal (Ctrl+Shift+\`)">
                            ➕
                        </button>
                        <button class="btn btn-icon btn-xs" id="split-terminal-btn" title="Split Terminal">
                            ⬌
                        </button>
                        <button class="btn btn-icon btn-xs" id="clear-terminal-btn" title="Clear Terminal">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="terminal-container" id="terminal-container"></div>
            `;

            const panelContent = bottomPanel.querySelector('.bottom-panel-content');
            if (panelContent) {
                panelContent.appendChild(terminalContent);
            }
        }
    }

    setupEventListeners() {
        // New terminal button
        const newTerminalBtn = document.getElementById('new-terminal-btn');
        if (newTerminalBtn) {
            newTerminalBtn.addEventListener('click', () => this.createTerminal());
        }

        // Clear terminal button
        const clearTerminalBtn = document.getElementById('clear-terminal-btn');
        if (clearTerminalBtn) {
            clearTerminalBtn.addEventListener('click', () => this.clearActiveTerminal());
        }

        // Split terminal button
        const splitTerminalBtn = document.getElementById('split-terminal-btn');
        if (splitTerminalBtn) {
            splitTerminalBtn.addEventListener('click', () => this.createTerminal());
        }
    }

    createTerminal(name) {
        const terminalId = `terminal-${++this.terminalCounter}`;
        const terminalName = name || `Terminal ${this.terminalCounter}`;

        // Create terminal instance
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Courier New, monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff',
                cursor: '#00ff00',
                cursorAccent: '#000000',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#ff0000',
                green: '#00ff00',
                yellow: '#ffff00',
                blue: '#0000ff',
                magenta: '#ff00ff',
                cyan: '#00ffff',
                white: '#ffffff',
                brightBlack: '#808080',
                brightRed: '#ff8080',
                brightGreen: '#80ff80',
                brightYellow: '#ffff80',
                brightBlue: '#8080ff',
                brightMagenta: '#ff80ff',
                brightCyan: '#80ffff',
                brightWhite: '#ffffff'
            },
            cols: 80,
            rows: 24
        });

        // Add fit addon
        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);

        // Add web links addon
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        term.loadAddon(webLinksAddon);

        // Create terminal tab
        this.createTerminalTab(terminalId, terminalName);

        // Create terminal element
        const terminalElement = document.createElement('div');
        terminalElement.id = `${terminalId}-element`;
        terminalElement.style.display = 'none';
        terminalElement.style.width = '100%';
        terminalElement.style.height = '100%';

        const container = document.getElementById('terminal-container');
        if (container) {
            container.appendChild(terminalElement);
            term.open(terminalElement);
            fitAddon.fit();
        }

        // Store terminal data
        this.terminals.set(terminalId, {
            term,
            fitAddon,
            name: terminalName,
            element: terminalElement,
            history: [],
            currentLine: ''
        });

        // Setup terminal behavior
        this.setupTerminalBehavior(terminalId, term);

        // Switch to new terminal
        this.switchTerminal(terminalId);

        // Print welcome message
        term.writeln('🚀 Grok IDE Terminal v4.0');
        term.writeln('Type "help" for available commands\r\n');
        this.printPrompt(term);

        return terminalId;
    }

    createTerminalTab(terminalId, terminalName) {
        const tabsContainer = document.getElementById('terminal-tabs');
        if (!tabsContainer) return;

        const tab = document.createElement('div');
        tab.className = 'terminal-tab';
        tab.id = `${terminalId}-tab`;
        tab.innerHTML = `
            <span>${terminalName}</span>
            <span class="tab-close" data-terminal-id="${terminalId}">✕</span>
        `;

        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchTerminal(terminalId);
            }
        });

        tab.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTerminal(terminalId);
        });

        tabsContainer.appendChild(tab);
    }

    setupTerminalBehavior(terminalId, term) {
        const terminalData = this.terminals.get(terminalId);
        let commandHistory = [];
        let historyIndex = -1;

        term.onData(data => {
            const code = data.charCodeAt(0);

            // Handle special keys
            if (code === 13) { // Enter
                term.write('\r\n');
                const command = terminalData.currentLine.trim();

                if (command) {
                    commandHistory.push(command);
                    historyIndex = commandHistory.length;
                    this.executeCommand(terminalId, command);
                }

                terminalData.currentLine = '';
                this.printPrompt(term);
            } else if (code === 127) { // Backspace
                if (terminalData.currentLine.length > 0) {
                    terminalData.currentLine = terminalData.currentLine.slice(0, -1);
                    term.write('\b \b');
                }
            } else if (code === 27) { // Escape sequences (arrows, etc.)
                // Handle arrow keys for history
                if (data === '\x1b[A') { // Up arrow
                    if (historyIndex > 0) {
                        historyIndex--;
                        this.replaceCurrentLine(term, terminalData, commandHistory[historyIndex]);
                    }
                } else if (data === '\x1b[B') { // Down arrow
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        this.replaceCurrentLine(term, terminalData, commandHistory[historyIndex]);
                    } else {
                        historyIndex = commandHistory.length;
                        this.replaceCurrentLine(term, terminalData, '');
                    }
                }
            } else if (code >= 32 && code < 127) { // Printable characters
                terminalData.currentLine += data;
                term.write(data);
            }
        });
    }

    replaceCurrentLine(term, terminalData, newLine) {
        // Clear current line
        const clearLength = terminalData.currentLine.length;
        term.write('\b \b'.repeat(clearLength));

        // Write new line
        terminalData.currentLine = newLine;
        term.write(newLine);
    }

    executeCommand(terminalId, command) {
        const terminalData = this.terminals.get(terminalId);
        if (!terminalData) return;

        const term = terminalData.term;
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Built-in commands (simulated)
        switch (cmd) {
            case 'help':
                term.writeln('Available commands:');
                term.writeln('  help         - Show this help message');
                term.writeln('  clear        - Clear the terminal');
                term.writeln('  echo [text]  - Echo text to terminal');
                term.writeln('  date         - Show current date and time');
                term.writeln('  theme        - Show current theme');
                term.writeln('  cowsay [msg] - ASCII art cow says your message');
                term.writeln('  pwd          - Print working directory (simulated)');
                term.writeln('  ls           - List files (simulated)\r\n');
                break;

            case 'clear':
                term.clear();
                break;

            case 'echo':
                term.writeln(args.join(' ') + '\r');
                break;

            case 'date':
                term.writeln(new Date().toString() + '\r');
                break;

            case 'theme':
                const currentTheme = document.body.getAttribute('data-theme') || 'metal-gear';
                term.writeln(`Current theme: ${currentTheme}\r`);
                break;

            case 'pwd':
                term.writeln('/workspace/grok-ide\r');
                break;

            case 'ls':
                term.writeln('public/     src/     server.js     package.json     README.md\r');
                break;

            case 'cowsay':
                const message = args.join(' ') || 'Hello from Grok IDE!';
                this.cowsay(term, message);
                break;

            default:
                term.writeln(`\x1b[31mCommand not found: ${cmd}\x1b[0m`);
                term.writeln('Type "help" for available commands\r');
                break;
        }
    }

    cowsay(term, message) {
        const msgLength = message.length;
        const border = '-'.repeat(msgLength + 2);

        term.writeln(` ${border}`);
        term.writeln(`< ${message} >`);
        term.writeln(` ${border}`);
        term.writeln('        \\   ^__^');
        term.writeln('         \\  (oo)\\_______');
        term.writeln('            (__)\\       )\\/\\');
        term.writeln('                ||----w |');
        term.writeln('                ||     ||\r');
    }

    printPrompt(term) {
        term.write('\x1b[32m➜\x1b[0m \x1b[36m~\x1b[0m ');
    }

    switchTerminal(terminalId) {
        // Hide all terminals
        this.terminals.forEach((data, id) => {
            data.element.style.display = 'none';
            const tab = document.getElementById(`${id}-tab`);
            if (tab) tab.classList.remove('active');
        });

        // Show selected terminal
        const terminalData = this.terminals.get(terminalId);
        if (terminalData) {
            terminalData.element.style.display = 'block';
            const tab = document.getElementById(`${terminalId}-tab`);
            if (tab) tab.classList.add('active');

            this.activeTerminalId = terminalId;

            // Fit terminal to container
            setTimeout(() => {
                terminalData.fitAddon.fit();
            }, 100);
        }
    }

    clearActiveTerminal() {
        if (this.activeTerminalId) {
            const terminalData = this.terminals.get(this.activeTerminalId);
            if (terminalData) {
                terminalData.term.clear();
                this.printPrompt(terminalData.term);
            }
        }
    }

    closeTerminal(terminalId) {
        const terminalData = this.terminals.get(terminalId);
        if (!terminalData) return;

        // Dispose terminal
        terminalData.term.dispose();
        terminalData.element.remove();

        // Remove tab
        const tab = document.getElementById(`${terminalId}-tab`);
        if (tab) tab.remove();

        // Remove from map
        this.terminals.delete(terminalId);

        // If this was the active terminal, switch to another
        if (this.activeTerminalId === terminalId) {
            const remainingTerminals = Array.from(this.terminals.keys());
            if (remainingTerminals.length > 0) {
                this.switchTerminal(remainingTerminals[0]);
            } else {
                this.activeTerminalId = null;
            }
        }

        // If no terminals left, create a new one
        if (this.terminals.size === 0) {
            this.createTerminal();
        }
    }

    show() {
        const terminalContent = document.getElementById('terminal-content');
        if (terminalContent) {
            terminalContent.style.display = 'flex';

            // Fit active terminal
            if (this.activeTerminalId) {
                const terminalData = this.terminals.get(this.activeTerminalId);
                if (terminalData) {
                    setTimeout(() => {
                        terminalData.fitAddon.fit();
                    }, 100);
                }
            }
        }
    }

    hide() {
        const terminalContent = document.getElementById('terminal-content');
        if (terminalContent) {
            terminalContent.style.display = 'none';
        }
    }

    toggle() {
        const terminalContent = document.getElementById('terminal-content');
        if (terminalContent) {
            if (terminalContent.style.display === 'none') {
                this.show();
            } else {
                this.hide();
            }
        }
    }
}

// Export for use in other modules
window.TerminalManager = TerminalManager;
