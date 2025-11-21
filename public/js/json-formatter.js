/**
 * JSON/XML Formatter - Phase 4
 * Format and validate JSON and XML
 */

class JSONFormatter {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.setupFormatterDialog();
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ JSON Formatter initialized');
    }

    setupFormatterDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'formatter-dialog';
        dialog.className = 'modal';
        dialog.style.display = 'none';
        dialog.setAttribute('role', 'dialog');
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 80vh;">
                <div class="modal-header">
                    <h2>🔧 JSON/XML Formatter</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div class="formatter-panel">
                        <div class="formatter-toolbar">
                            <select id="formatter-type" class="select-sm">
                                <option value="json">JSON</option>
                                <option value="xml">XML</option>
                            </select>
                            <button class="btn btn-sm" id="format-btn-formatter">✨ Format</button>
                            <button class="btn btn-sm" id="minify-btn-formatter">📦 Minify</button>
                            <button class="btn btn-sm" id="validate-btn-formatter">✓ Validate</button>
                            <button class="btn btn-sm" id="copy-output-btn">📋 Copy</button>
                            <button class="btn btn-sm" id="clear-formatter-btn">🗑️ Clear</button>
                        </div>
                        <div class="formatter-content">
                            <div class="formatter-input">
                                <div class="formatter-label">INPUT</div>
                                <textarea id="formatter-input" class="formatter-textarea" placeholder="Paste your JSON or XML here..."></textarea>
                            </div>
                            <div class="formatter-output">
                                <div class="formatter-label">OUTPUT</div>
                                <textarea id="formatter-output" class="formatter-textarea" readonly placeholder="Formatted output will appear here..."></textarea>
                                <div id="formatter-error" class="formatter-error" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    setupEventListeners() {
        // Modal close
        const modal = document.getElementById('formatter-dialog');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });

        // Format button
        document.getElementById('format-btn-formatter').addEventListener('click', () => this.format());

        // Minify button
        document.getElementById('minify-btn-formatter').addEventListener('click', () => this.minify());

        // Validate button
        document.getElementById('validate-btn-formatter').addEventListener('click', () => this.validate());

        // Copy button
        document.getElementById('copy-output-btn').addEventListener('click', () => this.copyOutput());

        // Clear button
        document.getElementById('clear-formatter-btn').addEventListener('click', () => this.clear());

        // Type change
        document.getElementById('formatter-type').addEventListener('change', () => this.clear());
    }

    format() {
        const input = document.getElementById('formatter-input').value;
        const output = document.getElementById('formatter-output');
        const errorDiv = document.getElementById('formatter-error');
        const type = document.getElementById('formatter-type').value;

        errorDiv.style.display = 'none';

        try {
            if (type === 'json') {
                const parsed = JSON.parse(input);
                output.value = JSON.stringify(parsed, null, 2);
            } else if (type === 'xml') {
                output.value = this.formatXML(input);
            }

            if (window.showNotification) {
                window.showNotification('Formatted successfully!', 'success');
            }
        } catch (error) {
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
            output.value = '';
        }
    }

    minify() {
        const input = document.getElementById('formatter-input').value;
        const output = document.getElementById('formatter-output');
        const errorDiv = document.getElementById('formatter-error');
        const type = document.getElementById('formatter-type').value;

        errorDiv.style.display = 'none';

        try {
            if (type === 'json') {
                const parsed = JSON.parse(input);
                output.value = JSON.stringify(parsed);
            } else if (type === 'xml') {
                output.value = input.replace(/>\s+</g, '><').trim();
            }

            if (window.showNotification) {
                window.showNotification('Minified successfully!', 'success');
            }
        } catch (error) {
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
            output.value = '';
        }
    }

    validate() {
        const input = document.getElementById('formatter-input').value;
        const errorDiv = document.getElementById('formatter-error');
        const type = document.getElementById('formatter-type').value;

        errorDiv.style.display = 'none';

        try {
            if (type === 'json') {
                JSON.parse(input);
            } else if (type === 'xml') {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(input, 'text/xml');
                const parseError = xmlDoc.getElementsByTagName('parsererror');
                if (parseError.length > 0) {
                    throw new Error('Invalid XML');
                }
            }

            if (window.showNotification) {
                window.showNotification('✓ Valid ' + type.toUpperCase(), 'success');
            }
        } catch (error) {
            errorDiv.textContent = `Validation Error: ${error.message}`;
            errorDiv.style.display = 'block';

            if (window.showNotification) {
                window.showNotification('Invalid ' + type.toUpperCase(), 'error');
            }
        }
    }

    formatXML(xml) {
        const PADDING = '  ';
        const reg = /(>)(<)(\/*)/g;
        let pad = 0;

        xml = xml.replace(reg, '$1\r\n$2$3');

        return xml.split('\r\n').map((node) => {
            let indent = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad !== 0) {
                    pad -= 1;
                }
            } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }

            const padding = PADDING.repeat(pad);
            pad += indent;

            return padding + node;
        }).join('\r\n');
    }

    copyOutput() {
        const output = document.getElementById('formatter-output');
        output.select();
        document.execCommand('copy');

        if (window.showNotification) {
            window.showNotification('Copied to clipboard!', 'success');
        }
    }

    clear() {
        document.getElementById('formatter-input').value = '';
        document.getElementById('formatter-output').value = '';
        document.getElementById('formatter-error').style.display = 'none';
    }

    show(content, type = 'json') {
        const modal = document.getElementById('formatter-dialog');
        modal.style.display = 'flex';

        if (content) {
            document.getElementById('formatter-input').value = content;
            document.getElementById('formatter-type').value = type;
            this.format();
        }
    }

    hide() {
        const modal = document.getElementById('formatter-dialog');
        modal.style.display = 'none';
    }
}

window.JSONFormatter = JSONFormatter;
