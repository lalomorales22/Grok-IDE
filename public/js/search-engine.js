/**
 * Search Engine Module
 * Phase 3 - Global search across files with regex support
 */

(function() {
    'use strict';

    class SearchEngine {
        constructor() {
            this.searchResults = [];
            this.currentQuery = '';
        }

        /**
         * Initialize search engine
         */
        initialize() {
            this.setupSearchButtons();
            this.setupSearchDialog();
        }

        /**
         * Setup search buttons
         */
        setupSearchButtons() {
            const searchFilesBtn = document.getElementById('search-files-btn');
            const searchInFilesBtn = document.getElementById('search-in-files-btn');

            searchFilesBtn?.addEventListener('click', () => this.showQuickOpen());
            searchInFilesBtn?.addEventListener('click', () => this.showSearchDialog());
        }

        /**
         * Setup search dialog
         */
        setupSearchDialog() {
            const dialog = document.getElementById('search-dialog');
            if (!dialog) return;

            // Close button
            const closeBtn = dialog.querySelector('.modal-close');
            closeBtn?.addEventListener('click', () => this.closeSearchDialog());

            // Search input
            const searchInput = document.getElementById('search-query');
            searchInput?.addEventListener('input', (e) => {
                this.debounce(() => this.performSearch(e.target.value), 300);
            });

            // Close on background click
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    this.closeSearchDialog();
                }
            });

            // Keyboard shortcut
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.showSearchDialog();
                }
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    this.showQuickOpen();
                }
            });
        }

        /**
         * Show search dialog
         */
        showSearchDialog() {
            const dialog = document.getElementById('search-dialog');
            if (!dialog) return;

            dialog.style.display = 'flex';
            const searchInput = document.getElementById('search-query');
            searchInput?.focus();
        }

        /**
         * Close search dialog
         */
        closeSearchDialog() {
            const dialog = document.getElementById('search-dialog');
            if (dialog) {
                dialog.style.display = 'none';
            }
        }

        /**
         * Show quick open (fuzzy file search)
         */
        showQuickOpen() {
            if (window.commandPalette) {
                window.commandPalette.toggle();
            } else {
                if (window.notify) {
                    window.notify.info('Quick Open', 'Press Ctrl+K for command palette');
                }
            }
        }

        /**
         * Perform search
         */
        async performSearch(query) {
            if (!query.trim()) {
                this.renderResults([]);
                return;
            }

            this.currentQuery = query;

            const regex = document.getElementById('search-regex')?.checked;
            const caseSensitive = document.getElementById('search-case-sensitive')?.checked;
            const wholeWord = document.getElementById('search-whole-word')?.checked;

            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query,
                        regex,
                        caseSensitive,
                        wholeWord
                    })
                });

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const results = await response.json();
                this.searchResults = results;
                this.renderResults(results);

            } catch (error) {
                console.error('Search error:', error);
                if (window.notify) {
                    window.notify.error('Search Error', error.message);
                }
            }
        }

        /**
         * Render search results
         */
        renderResults(results) {
            const resultsContainer = document.getElementById('search-results');
            if (!resultsContainer) return;

            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="text-sm text-tertiary" style="padding: 16px;">No results found</div>';
                return;
            }

            resultsContainer.innerHTML = results.map(result => `
                <div class="search-result-item" onclick="window.searchEngine.openResult('${result.file}', ${result.line})">
                    <div class="search-result-file">
                        📄 ${result.file}
                    </div>
                    <div class="search-result-line">
                        <span class="text-tertiary">Line ${result.line}:</span>
                        ${this.highlightMatch(result.text, this.currentQuery)}
                    </div>
                </div>
            `).join('');
        }

        /**
         * Highlight search match
         */
        highlightMatch(text, query) {
            const caseSensitive = document.getElementById('search-case-sensitive')?.checked;
            const flags = caseSensitive ? 'g' : 'gi';

            try {
                const regex = new RegExp(`(${this.escapeRegex(query)})`, flags);
                return this.escapeHtml(text).replace(regex, '<span class="search-result-match">$1</span>');
            } catch (e) {
                return this.escapeHtml(text);
            }
        }

        /**
         * Open search result
         */
        async openResult(file, line) {
            this.closeSearchDialog();

            // Trigger file open event
            window.dispatchEvent(new CustomEvent('file:openRequest', {
                detail: { file, line }
            }));

            if (window.notify) {
                window.notify.success('Opened', `${file}:${line}`);
            }
        }

        /**
         * Debounce function
         */
        debounce(func, wait) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(func, wait);
        }

        /**
         * Escape regex special characters
         */
        escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    window.SearchEngine = SearchEngine;
})();
