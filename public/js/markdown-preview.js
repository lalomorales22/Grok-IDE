/**
 * Markdown Preview - Phase 4
 * Live Markdown rendering with marked.js
 */

class MarkdownPreview {
    constructor() {
        this.isVisible = false;
        this.currentFile = null;
        this.autoRefresh = true;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        // Load marked.js library
        await this.loadMarkedLibrary();

        this.setupPreviewPanel();
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ Markdown Preview initialized');
    }

    async loadMarkedLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js';
            script.onload = () => {
                // Configure marked options
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: true,
                    mangle: false
                });
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupPreviewPanel() {
        // Create markdown preview panel (hidden by default)
        const editorSection = document.querySelector('.editor');
        if (!editorSection) return;

        const previewPanel = document.createElement('div');
        previewPanel.id = 'markdown-preview-panel';
        previewPanel.className = 'markdown-preview-panel';
        previewPanel.style.display = 'none';
        previewPanel.style.width = '50%';
        previewPanel.innerHTML = `
            <div class="markdown-preview-header">
                <span>📄 Markdown Preview</span>
                <div class="flex gap-2">
                    <button class="btn btn-icon btn-xs" id="md-refresh-btn" title="Refresh">
                        🔄
                    </button>
                    <button class="btn btn-icon btn-xs" id="md-auto-refresh-btn" title="Auto Refresh">
                        ⚡
                    </button>
                    <button class="btn btn-icon btn-xs" id="md-close-btn" title="Close Preview">
                        ✕
                    </button>
                </div>
            </div>
            <div class="markdown-content" id="markdown-content">
                <p class="text-tertiary">No markdown content to preview</p>
            </div>
        `;

        editorSection.parentElement.appendChild(previewPanel);
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('md-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        const autoRefreshBtn = document.getElementById('md-auto-refresh-btn');
        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => this.toggleAutoRefresh());
        }

        const closeBtn = document.getElementById('md-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
    }

    render(markdown) {
        try {
            const html = marked.parse(markdown);
            const content = document.getElementById('markdown-content');
            if (content) {
                content.innerHTML = html;
            }
        } catch (error) {
            console.error('Markdown rendering error:', error);
            const content = document.getElementById('markdown-content');
            if (content) {
                content.innerHTML = `<div class="formatter-error">Error rendering markdown: ${error.message}</div>`;
            }
        }
    }

    refresh() {
        if (window.monacoEditor) {
            const content = window.monacoEditor.getValue();
            this.render(content);
        }
    }

    show(content) {
        const panel = document.getElementById('markdown-preview-panel');
        if (panel) {
            panel.style.display = 'flex';
            this.isVisible = true;

            // Adjust editor width
            const editor = document.querySelector('.editor');
            if (editor) {
                editor.style.width = '50%';
            }

            if (content) {
                this.render(content);
            } else {
                this.refresh();
            }
        }
    }

    hide() {
        const panel = document.getElementById('markdown-preview-panel');
        if (panel) {
            panel.style.display = 'none';
            this.isVisible = false;

            // Reset editor width
            const editor = document.querySelector('.editor');
            if (editor) {
                editor.style.width = '';
            }
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        const btn = document.getElementById('md-auto-refresh-btn');
        if (btn) {
            btn.style.background = this.autoRefresh ? 'var(--primary)' : '';
        }

        if (window.showNotification) {
            window.showNotification(
                this.autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled',
                'info'
            );
        }
    }

    onEditorChange() {
        if (this.autoRefresh && this.isVisible) {
            this.refresh();
        }
    }
}

window.MarkdownPreview = MarkdownPreview;
