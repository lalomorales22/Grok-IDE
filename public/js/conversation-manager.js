/**
 * Conversation Manager Module
 * Phase 3 - Manage conversation history with search and export
 */

(function() {
    'use strict';

    class ConversationManager {
        constructor() {
            this.conversations = [];
            this.currentConversation = null;
            this.storageKey = 'grok-ide-conversations';
            this.loadFromStorage();
        }

        /**
         * Initialize conversation manager
         */
        initialize() {
            this.setupHistoryButton();
            this.setupHistoryDialog();
        }

        /**
         * Setup history button
         */
        setupHistoryButton() {
            const historyBtn = document.getElementById('ai-history-btn');
            historyBtn?.addEventListener('click', () => this.showHistory());
        }

        /**
         * Setup history dialog
         */
        setupHistoryDialog() {
            const dialog = document.getElementById('ai-history-dialog');
            if (!dialog) return;

            // Close button
            const closeBtn = dialog.querySelector('.modal-close');
            closeBtn?.addEventListener('click', () => this.closeHistory());

            // Search input
            const searchInput = document.getElementById('history-search');
            searchInput?.addEventListener('input', (e) => this.searchHistory(e.target.value));

            // Close on background click
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    this.closeHistory();
                }
            });
        }

        /**
         * Save conversation
         */
        saveConversation(userMessage, aiResponse) {
            const conversation = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                userMessage,
                aiResponse,
                preview: userMessage.substring(0, 100)
            };

            this.conversations.unshift(conversation);

            // Keep only last 100 conversations
            if (this.conversations.length > 100) {
                this.conversations = this.conversations.slice(0, 100);
            }

            this.saveToStorage();
        }

        /**
         * Load conversations from storage
         */
        loadFromStorage() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.conversations = JSON.parse(stored);
                }
            } catch (error) {
                console.error('Error loading conversations:', error);
            }
        }

        /**
         * Save conversations to storage
         */
        saveToStorage() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.conversations));
            } catch (error) {
                console.error('Error saving conversations:', error);
            }
        }

        /**
         * Show history dialog
         */
        showHistory() {
            const dialog = document.getElementById('ai-history-dialog');
            if (!dialog) return;

            this.renderHistoryList();
            dialog.style.display = 'flex';
        }

        /**
         * Close history dialog
         */
        closeHistory() {
            const dialog = document.getElementById('ai-history-dialog');
            if (dialog) {
                dialog.style.display = 'none';
            }
        }

        /**
         * Render history list
         */
        renderHistoryList(conversations = this.conversations) {
            const historyList = document.getElementById('history-list');
            if (!historyList) return;

            if (conversations.length === 0) {
                historyList.innerHTML = '<div class="text-sm text-tertiary" style="padding: 16px;">No conversation history yet</div>';
                return;
            }

            historyList.innerHTML = conversations.map(conv => `
                <div class="history-item" data-id="${conv.id}">
                    <div class="history-item-header">
                        <div class="history-item-title">${this.escapeHtml(conv.preview)}</div>
                        <div class="history-item-date">${this.formatDate(conv.timestamp)}</div>
                    </div>
                    <div class="history-item-preview">
                        ${this.escapeHtml(conv.aiResponse.substring(0, 150))}...
                    </div>
                    <div class="message-actions" style="margin-top: 8px;">
                        <button class="btn btn-xs" onclick="window.conversationManager.loadConversation('${conv.id}')">
                            📂 Load
                        </button>
                        <button class="btn btn-xs" onclick="window.conversationManager.exportConversation('${conv.id}')">
                            💾 Export
                        </button>
                        <button class="btn btn-xs" onclick="window.conversationManager.deleteConversation('${conv.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }

        /**
         * Search history
         */
        searchHistory(query) {
            if (!query.trim()) {
                this.renderHistoryList();
                return;
            }

            const lowerQuery = query.toLowerCase();
            const filtered = this.conversations.filter(conv =>
                conv.userMessage.toLowerCase().includes(lowerQuery) ||
                conv.aiResponse.toLowerCase().includes(lowerQuery)
            );

            this.renderHistoryList(filtered);
        }

        /**
         * Load conversation
         */
        loadConversation(id) {
            const conversation = this.conversations.find(c => c.id === id);
            if (!conversation) return;

            // Add to chat
            if (window.aiStreaming) {
                const aiContent = document.getElementById('ai-content');
                if (aiContent) {
                    aiContent.innerHTML = '';
                }

                window.aiStreaming.addMessage('user', conversation.userMessage);
                window.aiStreaming.addMessage('assistant', conversation.aiResponse);

                if (window.notify) {
                    window.notify.success('Loaded', 'Conversation loaded');
                }
            }

            this.closeHistory();
        }

        /**
         * Export conversation
         */
        exportConversation(id) {
            const conversation = this.conversations.find(c => c.id === id);
            if (!conversation) return;

            const content = `# Grok IDE Conversation Export
Date: ${new Date(conversation.timestamp).toLocaleString()}

## User Message
${conversation.userMessage}

## AI Response
${conversation.aiResponse}
`;

            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${conversation.id}.md`;
            a.click();
            URL.revokeObjectURL(url);

            if (window.notify) {
                window.notify.success('Exported', 'Conversation exported as markdown');
            }
        }

        /**
         * Export all conversations
         */
        exportAllConversations() {
            const content = this.conversations.map(conv => `
═══════════════════════════════════════════════════════════════
Date: ${new Date(conv.timestamp).toLocaleString()}

User: ${conv.userMessage}

AI: ${conv.aiResponse}
`).join('\n\n');

            const blob = new Blob([`# Grok IDE - All Conversations\n\n${content}`], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'all-conversations.md';
            a.click();
            URL.revokeObjectURL(url);

            if (window.notify) {
                window.notify.success('Exported', `${this.conversations.length} conversations exported`);
            }
        }

        /**
         * Delete conversation
         */
        deleteConversation(id) {
            if (!confirm('Delete this conversation?')) return;

            this.conversations = this.conversations.filter(c => c.id !== id);
            this.saveToStorage();
            this.renderHistoryList();

            if (window.notify) {
                window.notify.success('Deleted', 'Conversation deleted');
            }
        }

        /**
         * Clear all history
         */
        clearAllHistory() {
            if (!confirm('Delete all conversation history? This cannot be undone.')) return;

            this.conversations = [];
            this.saveToStorage();
            this.renderHistoryList();

            if (window.notify) {
                window.notify.success('Cleared', 'All conversations deleted');
            }
        }

        /**
         * Format date
         */
        formatDate(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;

            // Less than 1 hour
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return `${minutes}m ago`;
            }

            // Less than 1 day
            if (diff < 86400000) {
                const hours = Math.floor(diff / 3600000);
                return `${hours}h ago`;
            }

            // Less than 7 days
            if (diff < 604800000) {
                const days = Math.floor(diff / 86400000);
                return `${days}d ago`;
            }

            // Otherwise show date
            return date.toLocaleDateString();
        }

        /**
         * Escape HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Export globally
    window.ConversationManager = ConversationManager;
})();
