/**
 * Grok IDE - Phase 4 Main Application
 * Advanced Features & Ecosystem
 */

// Global managers
let terminalManager;
let markdownPreview;
let jsonFormatter;
let codeSnippets;
let developerConsole;
let apiTester;
let taskManager;
let projectTemplates;

// Initialize Phase 4
async function initPhase4() {
    console.log('🚀 Initializing Phase 4...');

    // Setup bottom panel
    setupBottomPanel();

    // Initialize Phase 4 managers
    terminalManager = new TerminalManager();
    markdownPreview = new MarkdownPreview();
    jsonFormatter = new JSONFormatter();
    codeSnippets = new CodeSnippets();
    developerConsole = new DeveloperConsole();
    apiTester = new APITester();
    taskManager = new TaskManager();
    projectTemplates = new ProjectTemplates();

    // Initialize all managers
    await terminalManager.init();
    await markdownPreview.init();
    jsonFormatter.init();
    codeSnippets.init();
    developerConsole.init();
    apiTester.init();
    taskManager.init();
    projectTemplates.init();

    // Setup Phase 4 keyboard shortcuts
    setupPhase4Shortcuts();

    // Update command palette with Phase 4 commands
    updateCommandPalette();

    console.log('✅ Phase 4 initialized successfully!');
}

function setupBottomPanel() {
    const mainContainer = document.querySelector('.main-container');
    if (!mainContainer) return;

    // Create bottom panel
    const bottomPanel = document.createElement('div');
    bottomPanel.id = 'bottom-panel';
    bottomPanel.className = 'bottom-panel';
    bottomPanel.style.display = 'none';
    bottomPanel.innerHTML = `
        <div class="panel-resize-handle"></div>
        <div class="bottom-panel-tabs">
            <button class="bottom-panel-tab active" data-panel="terminal">
                💻 Terminal
            </button>
            <button class="bottom-panel-tab" data-panel="console">
                📝 Console
            </button>
            <button class="bottom-panel-tab" data-panel="tasks" style="position: relative;">
                ✓ Tasks
                <span id="task-badge" class="badge" style="display: none;"></span>
            </button>
            <div style="flex: 1;"></div>
            <button class="btn btn-icon btn-xs" id="close-bottom-panel" title="Close Panel">
                ✕
            </button>
        </div>
        <div class="bottom-panel-content"></div>
    `;

    // Insert before status bar
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        statusBar.parentElement.insertBefore(bottomPanel, statusBar);
    } else {
        mainContainer.parentElement.appendChild(bottomPanel);
    }

    // Setup bottom panel tabs
    const tabs = bottomPanel.querySelectorAll('.bottom-panel-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const panelName = tab.dataset.panel;
            switchBottomPanel(panelName);

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Close button
    document.getElementById('close-bottom-panel').addEventListener('click', () => {
        bottomPanel.style.display = 'none';
    });

    // Resize handle
    const resizeHandle = bottomPanel.querySelector('.panel-resize-handle');
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = bottomPanel.offsetHeight;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const delta = startY - e.clientY;
        const newHeight = Math.max(200, Math.min(600, startHeight + delta));
        bottomPanel.style.height = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
        }
    });
}

function switchBottomPanel(panelName) {
    // Hide all panels
    const terminalContent = document.getElementById('terminal-content');
    const consoleContent = document.getElementById('console-content');

    if (terminalContent) terminalContent.style.display = 'none';
    if (consoleContent) consoleContent.style.display = 'none';

    // Show selected panel
    if (panelName === 'terminal' && terminalManager) {
        terminalManager.show();
    } else if (panelName === 'console' && developerConsole) {
        developerConsole.show();
    } else if (panelName === 'tasks' && taskManager) {
        taskManager.show();
    }

    // Show bottom panel
    const bottomPanel = document.getElementById('bottom-panel');
    if (bottomPanel) {
        bottomPanel.style.display = 'block';
    }
}

function showBottomPanel(panelName = 'terminal') {
    const bottomPanel = document.getElementById('bottom-panel');
    if (!bottomPanel) return;

    bottomPanel.style.display = 'block';

    // Activate correct tab
    const tabs = bottomPanel.querySelectorAll('.bottom-panel-tab');
    tabs.forEach(tab => {
        if (tab.dataset.panel === panelName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    switchBottomPanel(panelName);
}

function setupPhase4Shortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + `  - Toggle Terminal
        if ((e.ctrlKey || e.metaKey) && e.key === '`') {
            e.preventDefault();
            const bottomPanel = document.getElementById('bottom-panel');
            if (bottomPanel && bottomPanel.style.display === 'block') {
                bottomPanel.style.display = 'none';
            } else {
                showBottomPanel('terminal');
            }
        }

        // Ctrl/Cmd + Shift + C - Toggle Console
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            showBottomPanel('console');
        }

        // Ctrl/Cmd + Shift + T - Toggle Tasks
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            if (taskManager) {
                taskManager.show();
            }
        }

        // Ctrl/Cmd + Shift + M - Toggle Markdown Preview
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            if (markdownPreview) {
                markdownPreview.toggle();
            }
        }

        // Ctrl/Cmd + Shift + J - JSON Formatter
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            if (jsonFormatter) {
                jsonFormatter.show();
            }
        }

        // Ctrl/Cmd + Shift + S - Code Snippets
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            if (codeSnippets) {
                codeSnippets.show();
            }
        }

        // Ctrl/Cmd + Shift + A - API Tester
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            if (apiTester) {
                apiTester.show();
            }
        }

        // Ctrl/Cmd + Shift + P - Project Templates
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            if (projectTemplates) {
                projectTemplates.show();
            }
        }
    });
}

function updateCommandPalette() {
    // Add Phase 4 commands to command palette
    if (window.commandPalette && window.commandPalette.addCommands) {
        window.commandPalette.addCommands([
            {
                name: 'Toggle Terminal',
                description: 'Show/hide integrated terminal',
                keywords: ['terminal', 'console', 'shell'],
                action: () => showBottomPanel('terminal')
            },
            {
                name: 'Toggle Developer Console',
                description: 'Show/hide developer console',
                keywords: ['console', 'debug', 'log'],
                action: () => showBottomPanel('console')
            },
            {
                name: 'Open Task Manager',
                description: 'Manage tasks and TODOs',
                keywords: ['tasks', 'todo', 'checklist'],
                action: () => taskManager.show()
            },
            {
                name: 'Preview Markdown',
                description: 'Toggle markdown preview',
                keywords: ['markdown', 'preview', 'md'],
                action: () => markdownPreview.toggle()
            },
            {
                name: 'Format JSON/XML',
                description: 'Open JSON/XML formatter',
                keywords: ['json', 'xml', 'format', 'prettify'],
                action: () => jsonFormatter.show()
            },
            {
                name: 'Insert Code Snippet',
                description: 'Browse and insert code snippets',
                keywords: ['snippet', 'template', 'code'],
                action: () => codeSnippets.show()
            },
            {
                name: 'Test API',
                description: 'Open REST API tester',
                keywords: ['api', 'rest', 'http', 'request'],
                action: () => apiTester.show()
            },
            {
                name: 'New Project from Template',
                description: 'Create project from template',
                keywords: ['template', 'scaffold', 'boilerplate'],
                action: () => projectTemplates.show()
            },
            {
                name: 'New Terminal',
                description: 'Create new terminal instance',
                keywords: ['terminal', 'new', 'shell'],
                action: () => {
                    if (terminalManager) {
                        showBottomPanel('terminal');
                        terminalManager.createTerminal();
                    }
                }
            }
        ]);
    }
}

// Update task badge
function updateTaskBadge() {
    if (!taskManager) return;

    const badge = document.getElementById('task-badge');
    const counts = taskManager.getTaskCount();

    if (counts.pending > 0) {
        badge.textContent = counts.pending;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// Monitor editor changes for markdown preview
if (window.monacoEditor) {
    window.monacoEditor.onDidChangeModelContent(() => {
        if (markdownPreview && markdownPreview.isVisible) {
            markdownPreview.onEditorChange();
        }
    });
}

// Auto-detect markdown files and show preview button
function checkMarkdownFile() {
    if (!window.monacoEditor) return;

    const model = window.monacoEditor.getModel();
    if (!model) return;

    const language = model.getLanguageId();
    const isMarkdown = language === 'markdown';

    // Show/hide markdown preview button based on file type
    // This could be expanded to add a button to the toolbar
}

// Initialize Phase 4 when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhase4);
} else {
    initPhase4();
}

// Update task badge periodically
setInterval(updateTaskBadge, 5000);

// Export for global access
window.phase4 = {
    terminalManager,
    markdownPreview,
    jsonFormatter,
    codeSnippets,
    developerConsole,
    apiTester,
    taskManager,
    projectTemplates,
    showBottomPanel,
    updateTaskBadge
};
