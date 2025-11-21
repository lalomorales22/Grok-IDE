/**
 * API Tester - Phase 4
 * REST API testing tool
 */

class APITester {
    constructor() {
        this.requestHistory = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.setupDialog();
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ API Tester initialized');
    }

    setupDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'api-tester-dialog';
        dialog.className = 'modal';
        dialog.style.display = 'none';
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 80vh;">
                <div class="modal-header">
                    <h2>🌐 API Tester</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div class="api-tester-panel">
                        <div class="api-request-builder">
                            <div class="api-method-url">
                                <select id="api-method" class="api-method-select">
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="PATCH">PATCH</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                                <input type="text" id="api-url" class="api-url-input" placeholder="https://api.example.com/endpoint">
                                <button class="btn btn-primary" id="send-request-btn">Send 🚀</button>
                            </div>
                            <div class="api-tabs">
                                <button class="api-tab active" data-tab="headers">Headers</button>
                                <button class="api-tab" data-tab="body">Body</button>
                                <button class="api-tab" data-tab="params">Params</button>
                            </div>
                            <div id="api-tab-content">
                                <div id="headers-tab" class="api-tab-content">
                                    <textarea id="api-headers" class="formatter-textarea" style="height: 100px;" placeholder='{"Content-Type": "application/json"}'></textarea>
                                </div>
                                <div id="body-tab" class="api-tab-content" style="display: none;">
                                    <textarea id="api-body" class="formatter-textarea" style="height: 100px;" placeholder='{"key": "value"}'></textarea>
                                </div>
                                <div id="params-tab" class="api-tab-content" style="display: none;">
                                    <textarea id="api-params" class="formatter-textarea" style="height: 100px;" placeholder='{"param1": "value1"}'></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="api-response-panel">
                            <div style="margin-bottom: 12px;">
                                <strong>Response:</strong>
                                <span id="response-time" class="text-tertiary text-sm"></span>
                            </div>
                            <div id="api-response-status"></div>
                            <div id="api-response-body" class="api-response-body">No response yet. Send a request to see the response.</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    setupEventListeners() {
        const modal = document.getElementById('api-tester-dialog');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });

        // Tab switching
        const tabs = modal.querySelectorAll('.api-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.api-tab-content').forEach(content => {
                    content.style.display = 'none';
                });

                const tabName = tab.dataset.tab;
                document.getElementById(`${tabName}-tab`).style.display = 'block';
            });
        });

        // Send request
        document.getElementById('send-request-btn').addEventListener('click', () => this.sendRequest());

        // Enter to send
        document.getElementById('api-url').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendRequest();
        });
    }

    async sendRequest() {
        const method = document.getElementById('api-method').value;
        const url = document.getElementById('api-url').value.trim();
        const headersText = document.getElementById('api-headers').value.trim();
        const bodyText = document.getElementById('api-body').value.trim();
        const paramsText = document.getElementById('api-params').value.trim();

        if (!url) {
            if (window.showNotification) {
                window.showNotification('Please enter a URL', 'error');
            }
            return;
        }

        // Parse headers
        let headers = {};
        if (headersText) {
            try {
                headers = JSON.parse(headersText);
            } catch (e) {
                if (window.showNotification) {
                    window.showNotification('Invalid JSON in headers', 'error');
                }
                return;
            }
        }

        // Parse params
        let params = {};
        if (paramsText) {
            try {
                params = JSON.parse(paramsText);
            } catch (e) {
                if (window.showNotification) {
                    window.showNotification('Invalid JSON in params', 'error');
                }
                return;
            }
        }

        // Build URL with params
        let finalUrl = url;
        if (Object.keys(params).length > 0) {
            const urlParams = new URLSearchParams(params);
            finalUrl += (url.includes('?') ? '&' : '?') + urlParams.toString();
        }

        // Parse body
        let body = null;
        if (bodyText && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            try {
                JSON.parse(bodyText); // Validate JSON
                body = bodyText;
            } catch (e) {
                if (window.showNotification) {
                    window.showNotification('Invalid JSON in body', 'error');
                }
                return;
            }
        }

        // Send request
        const startTime = Date.now();
        try {
            const options = {
                method,
                headers
            };

            if (body) {
                options.body = body;
            }

            const response = await fetch(finalUrl, options);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Parse response
            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                responseData = JSON.stringify(responseData, null, 2);
            } else {
                responseData = await response.text();
            }

            // Display response
            this.displayResponse(response.status, responseData, duration, response.ok);

        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            this.displayResponse(0, `Error: ${error.message}`, duration, false);
        }
    }

    displayResponse(status, body, duration, isSuccess) {
        const statusElement = document.getElementById('api-response-status');
        const bodyElement = document.getElementById('api-response-body');
        const timeElement = document.getElementById('response-time');

        // Status
        statusElement.innerHTML = `
            <span class="api-response-status ${isSuccess ? 'success' : 'error'}">
                ${status} ${this.getStatusText(status)}
            </span>
        `;

        // Time
        timeElement.textContent = `(${duration}ms)`;

        // Body
        bodyElement.textContent = body;
    }

    getStatusText(status) {
        const statusTexts = {
            200: 'OK',
            201: 'Created',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
            503: 'Service Unavailable'
        };
        return statusTexts[status] || '';
    }

    show() {
        const modal = document.getElementById('api-tester-dialog');
        modal.style.display = 'flex';
        document.getElementById('api-url').focus();
    }

    hide() {
        const modal = document.getElementById('api-tester-dialog');
        modal.style.display = 'none';
    }
}

window.APITester = APITester;
