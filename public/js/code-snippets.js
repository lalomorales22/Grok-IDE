/**
 * Code Snippets Manager - Phase 4
 * Manage and insert code snippets
 */

class CodeSnippets {
    constructor() {
        this.snippets = this.getDefaultSnippets();
        this.customSnippets = this.loadCustomSnippets();
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.setupSnippetsDialog();
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ Code Snippets initialized');
    }

    getDefaultSnippets() {
        return {
            javascript: [
                {
                    name: 'Console Log',
                    trigger: 'log',
                    description: 'Console.log statement',
                    code: 'console.log(${1:message});'
                },
                {
                    name: 'Arrow Function',
                    trigger: 'afn',
                    description: 'Arrow function',
                    code: 'const ${1:name} = (${2:params}) => {\n  ${3:// code}\n};'
                },
                {
                    name: 'Async Function',
                    trigger: 'async',
                    description: 'Async/await function',
                    code: 'async function ${1:name}(${2:params}) {\n  try {\n    ${3:// code}\n  } catch (error) {\n    console.error(error);\n  }\n}'
                },
                {
                    name: 'Class',
                    trigger: 'class',
                    description: 'ES6 Class',
                    code: 'class ${1:ClassName} {\n  constructor(${2:params}) {\n    ${3:// code}\n  }\n\n  ${4:method}() {\n    ${5:// code}\n  }\n}'
                },
                {
                    name: 'Promise',
                    trigger: 'promise',
                    description: 'Promise template',
                    code: 'new Promise((resolve, reject) => {\n  ${1:// code}\n})'
                },
                {
                    name: 'Try-Catch',
                    trigger: 'try',
                    description: 'Try-catch block',
                    code: 'try {\n  ${1:// code}\n} catch (error) {\n  console.error(error);\n}'
                }
            ],
            react: [
                {
                    name: 'React Component',
                    trigger: 'rfc',
                    description: 'React functional component',
                    code: 'import React from \'react\';\n\nconst ${1:ComponentName} = () => {\n  return (\n    <div>\n      ${2:// JSX}\n    </div>\n  );\n};\n\nexport default ${1:ComponentName};'
                },
                {
                    name: 'useState Hook',
                    trigger: 'useState',
                    description: 'useState hook',
                    code: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});'
                },
                {
                    name: 'useEffect Hook',
                    trigger: 'useEffect',
                    description: 'useEffect hook',
                    code: 'useEffect(() => {\n  ${1:// effect}\n  return () => {\n    ${2:// cleanup}\n  };\n}, [${3:dependencies}]);'
                }
            ],
            html: [
                {
                    name: 'HTML5 Template',
                    trigger: 'html5',
                    description: 'Basic HTML5 template',
                    code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${1:Document}</title>\n</head>\n<body>\n  ${2:<!-- content -->}\n</body>\n</html>'
                },
                {
                    name: 'Link Tag',
                    trigger: 'link',
                    description: 'Link stylesheet',
                    code: '<link rel="stylesheet" href="${1:style.css}">'
                },
                {
                    name: 'Script Tag',
                    trigger: 'script',
                    description: 'Script tag',
                    code: '<script src="${1:script.js}"></script>'
                }
            ],
            css: [
                {
                    name: 'Flexbox Container',
                    trigger: 'flex',
                    description: 'Flexbox container',
                    code: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};'
                },
                {
                    name: 'Grid Container',
                    trigger: 'grid',
                    description: 'CSS Grid container',
                    code: 'display: grid;\ngrid-template-columns: ${1:repeat(3, 1fr)};\ngap: ${2:1rem};'
                },
                {
                    name: 'Media Query',
                    trigger: 'media',
                    description: 'Media query',
                    code: '@media (${1:max-width}: ${2:768px}) {\n  ${3:/* styles */}\n}'
                }
            ]
        };
    }

    loadCustomSnippets() {
        try {
            const saved = localStorage.getItem('grok-ide-custom-snippets');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading custom snippets:', error);
            return {};
        }
    }

    saveCustomSnippets() {
        try {
            localStorage.setItem('grok-ide-custom-snippets', JSON.stringify(this.customSnippets));
        } catch (error) {
            console.error('Error saving custom snippets:', error);
        }
    }

    setupSnippetsDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'snippets-dialog';
        dialog.className = 'modal';
        dialog.style.display = 'none';
        dialog.innerHTML = `
            <div class="modal-content snippets-panel">
                <div class="modal-header">
                    <h2>📝 Code Snippets</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div class="snippets-header">
                        <input type="text" id="snippets-search" class="snippets-search" placeholder="Search snippets...">
                        <select id="snippet-language" class="select-sm" style="margin-top: 8px;">
                            <option value="all">All Languages</option>
                            <option value="javascript">JavaScript</option>
                            <option value="react">React</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                        </select>
                    </div>
                    <div class="snippets-list" id="snippets-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    setupEventListeners() {
        const modal = document.getElementById('snippets-dialog');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });

        // Search
        document.getElementById('snippets-search').addEventListener('input', (e) => {
            this.filterSnippets(e.target.value);
        });

        // Language filter
        document.getElementById('snippet-language').addEventListener('change', () => {
            this.renderSnippets();
        });
    }

    renderSnippets() {
        const listContainer = document.getElementById('snippets-list');
        const language = document.getElementById('snippet-language').value;

        listContainer.innerHTML = '';

        const snippetsToRender = language === 'all'
            ? Object.entries(this.snippets).flatMap(([lang, snippets]) =>
                snippets.map(s => ({ ...s, language: lang }))
            )
            : (this.snippets[language] || []).map(s => ({ ...s, language }));

        if (snippetsToRender.length === 0) {
            listContainer.innerHTML = '<div class="text-sm text-tertiary" style="padding: 16px;">No snippets found</div>';
            return;
        }

        snippetsToRender.forEach(snippet => {
            const item = document.createElement('div');
            item.className = 'snippet-item';
            item.innerHTML = `
                <div class="snippet-name">${snippet.name}</div>
                <div class="snippet-trigger">Trigger: ${snippet.trigger}</div>
                <div class="snippet-description">${snippet.description}</div>
                <div class="snippet-preview"><code>${this.escapeHtml(snippet.code.substring(0, 100))}...</code></div>
            `;

            item.addEventListener('click', () => this.insertSnippet(snippet.code));

            listContainer.appendChild(item);
        });
    }

    filterSnippets(query) {
        const items = document.querySelectorAll('.snippet-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(lowerQuery) ? 'block' : 'none';
        });
    }

    insertSnippet(code) {
        if (window.monacoEditor) {
            const position = window.monacoEditor.getPosition();
            const selection = window.monacoEditor.getSelection();

            // Process snippet variables (simple version)
            let processedCode = code;

            // Remove ${n:text} markers and just use the text
            processedCode = processedCode.replace(/\$\{(\d+):([^}]+)\}/g, '$2');
            processedCode = processedCode.replace(/\$\{(\d+)\}/g, '');

            window.monacoEditor.executeEdits('snippet', [{
                range: selection,
                text: processedCode
            }]);

            window.monacoEditor.focus();

            if (window.showNotification) {
                window.showNotification('Snippet inserted!', 'success');
            }

            this.hide();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    show() {
        const modal = document.getElementById('snippets-dialog');
        modal.style.display = 'flex';
        this.renderSnippets();
        document.getElementById('snippets-search').focus();
    }

    hide() {
        const modal = document.getElementById('snippets-dialog');
        modal.style.display = 'none';
    }
}

window.CodeSnippets = CodeSnippets;
