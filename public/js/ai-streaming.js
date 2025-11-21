/**
 * AI Streaming Module
 * Phase 3 - Streaming AI responses with real-time output
 */

(function() {
    'use strict';

    class AIStreaming {
        constructor() {
            this.currentMode = 'code';
            this.isStreaming = false;
            this.abortController = null;
            this.conversationHistory = [];
        }

        /**
         * Initialize AI streaming
         */
        initialize() {
            this.setupModeButtons();
            this.setupSendButton();
            this.setupInputHandlers();
        }

        /**
         * Setup mode buttons
         */
        setupModeButtons() {
            const modeButtons = document.querySelectorAll('.ai-action-btn[data-mode]');
            modeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const mode = button.dataset.mode;
                    this.setMode(mode);

                    // Update active state
                    modeButtons.forEach(b => b.classList.remove('active'));
                    button.classList.add('active');
                });
            });
        }

        /**
         * Setup send button
         */
        setupSendButton() {
            const sendBtn = document.getElementById('ai-send-btn');
            sendBtn?.addEventListener('click', () => this.sendMessage());
        }

        /**
         * Setup input handlers
         */
        setupInputHandlers() {
            const input = document.getElementById('ai-input');
            input?.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        /**
         * Set AI mode
         */
        setMode(mode) {
            this.currentMode = mode;
            const input = document.getElementById('ai-input');
            if (input) {
                const placeholders = {
                    'code': 'Ask me to write, review, or explain code...',
                    'image': 'Describe an image to generate...',
                    'chat': 'Ask me anything...',
                    'review': 'I\'ll review your code for issues and improvements...'
                };
                input.placeholder = placeholders[mode] || 'Ask me anything...';
            }
        }

        /**
         * Send message to AI
         */
        async sendMessage() {
            const input = document.getElementById('ai-input');
            const message = input.value.trim();

            if (!message || this.isStreaming) return;

            // Get context
            const includeCurrentFile = document.getElementById('include-current-file')?.checked;
            const includeSelection = document.getElementById('include-selection')?.checked;

            let context = '';
            if (includeCurrentFile && window.monacoEditor) {
                if (includeSelection) {
                    context = window.monacoEditor.getSelectedText();
                } else {
                    context = window.monacoEditor.getValue();
                }
            }

            // Clear input
            input.value = '';

            // Add user message to chat
            this.addMessage('user', message);

            // Show AI status
            this.updateAIStatus('Thinking...');

            // Start streaming
            try {
                await this.streamResponse(message, context);
            } catch (error) {
                console.error('AI streaming error:', error);
                this.addMessage('assistant', `Error: ${error.message}`);
                this.updateAIStatus('Error');
            }
        }

        /**
         * Stream AI response
         */
        async streamResponse(message, context = '') {
            this.isStreaming = true;
            this.abortController = new AbortController();

            const model = document.getElementById('ai-model-select')?.value || 'grok-beta';

            // Create message container for streaming
            const messageDiv = this.createStreamingMessage();

            try {
                const response = await fetch('/api/completion-stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message,
                        context,
                        mode: this.currentMode,
                        model,
                        conversationHistory: this.conversationHistory.slice(-10) // Last 10 messages
                    }),
                    signal: this.abortController.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullResponse = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    fullResponse += parsed.content;
                                    this.updateStreamingMessage(messageDiv, fullResponse);
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }

                // Finalize message
                this.finalizeStreamingMessage(messageDiv, fullResponse);

                // Save to conversation history
                this.conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: fullResponse }
                );

                // Save to conversation manager
                if (window.conversationManager) {
                    window.conversationManager.saveConversation(message, fullResponse);
                }

                this.updateAIStatus('Ready');

            } catch (error) {
                if (error.name === 'AbortError') {
                    this.updateStreamingMessage(messageDiv, 'Response cancelled by user.');
                } else {
                    throw error;
                }
            } finally {
                this.isStreaming = false;
                this.abortController = null;
            }
        }

        /**
         * Add message to chat
         */
        addMessage(role, content) {
            const aiContent = document.getElementById('ai-content');
            if (!aiContent) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `ai-message ${role}`;

            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';

            const roleText = role === 'user' ? '👤 You' : '🤖 Grok AI';
            const timestamp = new Date().toLocaleTimeString();

            headerDiv.innerHTML = `
                <strong>${roleText}</strong>
                <span class="text-xs text-tertiary">${timestamp}</span>
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = this.formatMessage(content);

            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(contentDiv);

            if (role === 'assistant') {
                this.addMessageActions(messageDiv, content);
            }

            aiContent.appendChild(messageDiv);
            aiContent.scrollTop = aiContent.scrollHeight;
        }

        /**
         * Create streaming message placeholder
         */
        createStreamingMessage() {
            const aiContent = document.getElementById('ai-content');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'ai-message assistant streaming';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.innerHTML = `
                <strong>🤖 Grok AI</strong>
                <span class="text-xs text-tertiary">
                    <span class="ai-loading"></span> Streaming...
                </span>
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = '';

            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(contentDiv);
            aiContent.appendChild(messageDiv);
            aiContent.scrollTop = aiContent.scrollHeight;

            return messageDiv;
        }

        /**
         * Update streaming message
         */
        updateStreamingMessage(messageDiv, content) {
            const contentDiv = messageDiv.querySelector('.message-content');
            if (contentDiv) {
                contentDiv.innerHTML = this.formatMessage(content);
            }

            const aiContent = document.getElementById('ai-content');
            if (aiContent) {
                aiContent.scrollTop = aiContent.scrollHeight;
            }
        }

        /**
         * Finalize streaming message
         */
        finalizeStreamingMessage(messageDiv, content) {
            messageDiv.classList.remove('streaming');

            const header = messageDiv.querySelector('.message-header');
            const timestamp = header.querySelector('.text-tertiary');
            if (timestamp) {
                timestamp.innerHTML = new Date().toLocaleTimeString();
            }

            this.addMessageActions(messageDiv, content);
        }

        /**
         * Add message actions
         */
        addMessageActions(messageDiv, content) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = `
                <button class="btn btn-xs" onclick="window.aiStreaming.copyMessage(this)">
                    📋 Copy
                </button>
                <button class="btn btn-xs" onclick="window.aiStreaming.insertToEditor(this)">
                    ↓ Insert to Editor
                </button>
            `;

            actionsDiv.dataset.content = content;
            messageDiv.appendChild(actionsDiv);
        }

        /**
         * Format message with markdown-like syntax
         */
        formatMessage(content) {
            // Simple markdown-like formatting
            let formatted = content;

            // Code blocks
            formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(code)}</code></pre>`;
            });

            // Inline code
            formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

            // Bold
            formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // Line breaks
            formatted = formatted.replace(/\n/g, '<br>');

            return formatted;
        }

        /**
         * Escape HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Copy message content
         */
        copyMessage(button) {
            const actionsDiv = button.closest('.message-actions');
            const content = actionsDiv.dataset.content;

            navigator.clipboard.writeText(content).then(() => {
                if (window.notify) {
                    window.notify.success('Copied', 'Message copied to clipboard');
                }
            });
        }

        /**
         * Insert to editor
         */
        insertToEditor(button) {
            const actionsDiv = button.closest('.message-actions');
            const content = actionsDiv.dataset.content;

            if (window.monacoEditor) {
                // Extract code from code blocks if present
                const codeMatch = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
                const textToInsert = codeMatch ? codeMatch[1] : content;

                window.monacoEditor.insertText(textToInsert);

                if (window.notify) {
                    window.notify.success('Inserted', 'Content inserted to editor');
                }
            }
        }

        /**
         * Update AI status
         */
        updateAIStatus(status) {
            const aiStatus = document.getElementById('ai-status');
            if (aiStatus) {
                const icons = {
                    'Ready': '💭',
                    'Thinking...': '🤔',
                    'Error': '❌',
                    'Streaming...': '✨'
                };
                aiStatus.innerHTML = `${icons[status] || '💭'} ${status}`;
            }
        }

        /**
         * Clear conversation
         */
        clearConversation() {
            const aiContent = document.getElementById('ai-content');
            if (aiContent) {
                aiContent.innerHTML = '<div class="ai-message assistant">Conversation cleared.</div>';
            }
            this.conversationHistory = [];
        }

        /**
         * Stop streaming
         */
        stopStreaming() {
            if (this.abortController) {
                this.abortController.abort();
            }
        }
    }

    // Export globally
    window.AIStreaming = AIStreaming;
})();
