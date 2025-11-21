/**
 * Monaco Editor Integration Module
 * Phase 3 - Advanced Code Editor with IntelliSense
 */

(function() {
    'use strict';

    class MonacoIntegration {
        constructor() {
            this.editor = null;
            this.currentFile = null;
            this.models = new Map();
            this.decorations = [];
            this.theme = 'vs-dark';
        }

        /**
         * Initialize Monaco Editor
         */
        async initialize() {
            return new Promise((resolve, reject) => {
                require.config({
                    paths: {
                        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
                    }
                });

                require(['vs/editor/editor.main'], () => {
                    try {
                        this.createEditor();
                        this.setupEventListeners();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }

        /**
         * Create Monaco Editor instance
         */
        createEditor() {
            const container = document.getElementById('monaco-editor');
            if (!container) {
                throw new Error('Monaco editor container not found');
            }

            this.editor = monaco.editor.create(container, {
                value: this.getWelcomeContent(),
                language: 'markdown',
                theme: this.theme,
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 4,
                glyphMargin: true,
                fixedOverflowWidgets: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: true,
                parameterHints: { enabled: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                formatOnPaste: true,
                formatOnType: true,
                renderLineHighlight: 'all',
                highlightActiveIndentGuide: true,
                bracketPairColorization: { enabled: true },
                codeLens: true,
                contextmenu: true,
                mouseWheelZoom: true,
            });

            // Save welcome model
            this.models.set('welcome', this.editor.getModel());
        }

        /**
         * Get welcome content
         */
        getWelcomeContent() {
            return `╔═══════════════════════════════════════════════════════════════╗
║            WELCOME TO GROK IDE v3.0 - PHASE 3                 ║
║                  Core Features Enhancement                     ║
╚═══════════════════════════════════════════════════════════════╝

## 🚀 NEW PHASE 3 FEATURES

### 💻 Advanced Code Editor (Monaco)
- ✅ **IntelliSense**: Intelligent code completion
- ✅ **Multi-cursor editing**: Edit multiple locations at once
- ✅ **Code folding**: Collapse/expand code blocks
- ✅ **Bracket matching**: Automatic bracket pair colorization
- ✅ **Code formatting**: Format with Prettier
- ✅ **Linting**: Real-time error detection
- ✅ **Minimap**: Bird's eye view of your code
- ✅ **Find & Replace**: Powerful search with regex support

### 🤖 Enhanced AI Integration
- ✅ **Streaming responses**: Real-time AI output
- ✅ **Conversation history**: Save and search past conversations
- ✅ **AI context management**: Track tokens and cost
- ✅ **AI presets**: Custom prompts for common tasks
- ✅ **Multi-file context**: Include multiple files in AI requests
- ✅ **Code review**: AI-powered code analysis
- ✅ **Bug detection**: Automatic issue identification

### 📁 Advanced File Management
- ✅ **Drag-and-drop**: Reorganize files easily
- ✅ **Fuzzy search**: Quick file switcher (Ctrl+P)
- ✅ **Recent files**: Access recently opened files
- ✅ **Favorites**: Mark important files
- ✅ **File templates**: Create files from templates

### 🔍 Search & Navigation
- ✅ **Global search**: Search across all files
- ✅ **Regex support**: Advanced pattern matching
- ✅ **Search results panel**: Preview matches before opening
- ✅ **Replace in multiple files**: Bulk text replacement

### 🔀 Git Integration
- ✅ **Repository status**: View changed files
- ✅ **Commit operations**: Stage, commit, push
- ✅ **Branch management**: Create, switch, merge branches
- ✅ **Visual diff viewer**: See changes side by side
- ✅ **Git history**: Browse commit history

## ⌨️ NEW KEYBOARD SHORTCUTS

- **Ctrl+P**: Quick file switcher (fuzzy search)
- **Ctrl+Shift+F**: Search in files
- **Ctrl+F**: Find in current file
- **Ctrl+H**: Replace in current file
- **Shift+Alt+F**: Format document
- **Ctrl+/**: Toggle line comment
- **Alt+Up/Down**: Move line up/down
- **Ctrl+D**: Add next occurrence to selection
- **Ctrl+Shift+L**: Select all occurrences
- **Alt+Click**: Add cursor at click position

## 🎨 MONACO EDITOR FEATURES

**Multi-Cursor Editing:**
Try pressing Alt+Click to add multiple cursors!

**Code Folding:**
Click the arrows next to line numbers to fold code blocks.

**IntelliSense:**
Start typing to see intelligent code suggestions.

**Command Palette:**
Press F1 or Ctrl+Shift+P to access all editor commands.

═══════════════════════════════════════════════════════════════

## 📝 TRY IT OUT!

1. **Open a folder** to start editing files
2. **Ask the AI** to review your code or explain concepts
3. **Use Ctrl+P** to quickly switch between files
4. **Try multi-cursor** editing with Alt+Click
5. **Search globally** with Ctrl+Shift+F

═══════════════════════════════════════════════════════════════

Ready to code? Let's build something amazing! 🚀`;
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Content change
            this.editor.onDidChangeModelContent(() => {
                this.updateStatus();
                this.markFileDirty();
            });

            // Cursor position change
            this.editor.onDidChangeCursorPosition((e) => {
                this.updateCursorPosition(e.position);
            });

            // Selection change
            this.editor.onDidChangeCursorSelection(() => {
                this.updateTokenCount();
            });
        }

        /**
         * Load file content into editor
         */
        loadFile(filePath, content, language) {
            const uri = monaco.Uri.file(filePath);
            let model = this.models.get(filePath);

            if (!model) {
                model = monaco.editor.createModel(content, language, uri);
                this.models.set(filePath, model);
            } else {
                model.setValue(content);
            }

            this.editor.setModel(model);
            this.currentFile = filePath;
            this.updateBreadcrumb(filePath);
        }

        /**
         * Get current editor content
         */
        getValue() {
            return this.editor.getValue();
        }

        /**
         * Get selected text
         */
        getSelectedText() {
            const selection = this.editor.getSelection();
            return this.editor.getModel().getValueInRange(selection);
        }

        /**
         * Insert text at cursor position
         */
        insertText(text) {
            const selection = this.editor.getSelection();
            this.editor.executeEdits('', [{
                range: selection,
                text: text,
                forceMoveMarkers: true
            }]);
        }

        /**
         * Format document
         */
        async formatDocument() {
            await this.editor.getAction('editor.action.formatDocument').run();
        }

        /**
         * Show find widget
         */
        showFind() {
            this.editor.getAction('actions.find').run();
        }

        /**
         * Show replace widget
         */
        showReplace() {
            this.editor.getAction('editor.action.startFindReplaceAction').run();
        }

        /**
         * Update cursor position display
         */
        updateCursorPosition(position) {
            const statusPosition = document.getElementById('status-position');
            const editorInfo = document.getElementById('editor-info');

            const text = `Ln ${position.lineNumber}, Col ${position.column}`;

            if (statusPosition) {
                statusPosition.textContent = text;
            }
            if (editorInfo) {
                const model = this.editor.getModel();
                const language = model.getLanguageId();
                editorInfo.textContent = `${language.toUpperCase()} | ${text}`;
            }
        }

        /**
         * Update status
         */
        updateStatus() {
            // Dispatch custom event for app to handle
            window.dispatchEvent(new CustomEvent('editor:contentChanged', {
                detail: {
                    file: this.currentFile,
                    content: this.getValue()
                }
            }));
        }

        /**
         * Mark file as dirty
         */
        markFileDirty() {
            if (this.currentFile && this.currentFile !== 'welcome') {
                window.dispatchEvent(new CustomEvent('file:modified', {
                    detail: { file: this.currentFile }
                }));
            }
        }

        /**
         * Update breadcrumb
         */
        updateBreadcrumb(filePath) {
            const breadcrumb = document.getElementById('breadcrumb-text');
            if (breadcrumb) {
                breadcrumb.textContent = filePath === 'welcome' ? 'Welcome' : filePath;
            }
        }

        /**
         * Update token count for AI context
         */
        updateTokenCount() {
            const selection = this.getSelectedText();
            const text = selection || this.getValue();
            // Rough estimation: ~4 characters per token
            const estimatedTokens = Math.ceil(text.length / 4);

            const tokenCountEl = document.getElementById('token-count');
            if (tokenCountEl) {
                tokenCountEl.textContent = `~${estimatedTokens} tokens`;
            }
        }

        /**
         * Set theme
         */
        setTheme(theme) {
            // Map Grok IDE themes to Monaco themes
            const themeMap = {
                'metal-gear': 'vs-dark',
                'cyberpunk': 'vs-dark',
                'matrix': 'vs-dark',
                'nord': 'vs-dark',
                'dracula': 'vs-dark',
                'light': 'vs'
            };

            this.theme = themeMap[theme] || 'vs-dark';
            monaco.editor.setTheme(this.theme);
        }

        /**
         * Get language from file extension
         */
        getLanguageFromPath(filePath) {
            const ext = filePath.split('.').pop().toLowerCase();
            const languageMap = {
                'js': 'javascript',
                'jsx': 'javascript',
                'ts': 'typescript',
                'tsx': 'typescript',
                'json': 'json',
                'html': 'html',
                'css': 'css',
                'scss': 'scss',
                'py': 'python',
                'java': 'java',
                'cpp': 'cpp',
                'c': 'c',
                'cs': 'csharp',
                'go': 'go',
                'rs': 'rust',
                'php': 'php',
                'rb': 'ruby',
                'sql': 'sql',
                'sh': 'shell',
                'md': 'markdown',
                'xml': 'xml',
                'yaml': 'yaml',
                'yml': 'yaml',
            };

            return languageMap[ext] || 'plaintext';
        }

        /**
         * Dispose editor
         */
        dispose() {
            if (this.editor) {
                this.editor.dispose();
            }
            this.models.forEach(model => model.dispose());
            this.models.clear();
        }
    }

    // Export globally
    window.MonacoIntegration = MonacoIntegration;
})();
