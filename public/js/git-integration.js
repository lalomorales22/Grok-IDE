/**
 * Git Integration Module
 * Phase 3 - Git operations with visual interface
 */

(function() {
    'use strict';

    class GitIntegration {
        constructor() {
            this.currentBranch = 'main';
            this.changes = [];
            this.refreshInterval = null;
        }

        /**
         * Initialize git integration
         */
        initialize() {
            this.setupGitButtons();
            this.setupGitDialog();
            this.startAutoRefresh();
        }

        /**
         * Setup git buttons
         */
        setupGitButtons() {
            const gitStatusBtn = document.getElementById('git-status-btn');
            gitStatusBtn?.addEventListener('click', () => this.showGitDialog());
        }

        /**
         * Setup git dialog
         */
        setupGitDialog() {
            const dialog = document.getElementById('git-dialog');
            if (!dialog) return;

            // Close button
            const closeBtn = dialog.querySelector('.modal-close');
            closeBtn?.addEventListener('click', () => this.closeGitDialog());

            // Tab buttons
            const tabButtons = dialog.querySelectorAll('.git-tab');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tab = button.dataset.tab;
                    this.switchTab(tab);

                    // Update active state
                    tabButtons.forEach(b => b.classList.remove('active'));
                    button.classList.add('active');
                });
            });

            // Close on background click
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    this.closeGitDialog();
                }
            });
        }

        /**
         * Show git dialog
         */
        async showGitDialog() {
            const dialog = document.getElementById('git-dialog');
            if (!dialog) return;

            dialog.style.display = 'flex';
            await this.loadGitStatus();
        }

        /**
         * Close git dialog
         */
        closeGitDialog() {
            const dialog = document.getElementById('git-dialog');
            if (dialog) {
                dialog.style.display = 'none';
            }
        }

        /**
         * Switch tab
         */
        async switchTab(tab) {
            switch (tab) {
                case 'status':
                    await this.loadGitStatus();
                    break;
                case 'commit':
                    await this.showCommitTab();
                    break;
                case 'branches':
                    await this.showBranchesTab();
                    break;
                case 'history':
                    await this.showHistoryTab();
                    break;
            }
        }

        /**
         * Load git status
         */
        async loadGitStatus() {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            gitContent.innerHTML = '<div class="text-sm text-tertiary">Loading...</div>';

            try {
                const response = await fetch('/api/git/status');
                if (!response.ok) throw new Error('Failed to load git status');

                const data = await response.json();
                this.currentBranch = data.branch || 'main';
                this.changes = data.changes || [];

                this.renderGitStatus(data);
                this.updateGitIndicators();

            } catch (error) {
                console.error('Git status error:', error);
                gitContent.innerHTML = `<div class="text-sm text-tertiary">${error.message}</div>`;
            }
        }

        /**
         * Render git status
         */
        renderGitStatus(data) {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            if (!data.changes || data.changes.length === 0) {
                gitContent.innerHTML = `
                    <div class="text-sm">
                        <p class="text-accent">✓ Working tree clean</p>
                        <p class="text-tertiary">Branch: ${data.branch}</p>
                    </div>
                `;
                return;
            }

            const changesHtml = data.changes.map(change => {
                const statusClass = {
                    'modified': 'git-status-modified',
                    'added': 'git-status-added',
                    'deleted': 'git-status-deleted'
                }[change.status] || 'git-status-modified';

                return `
                    <div class="git-file-item">
                        <div>
                            <span class="git-status-badge ${statusClass}">${change.status.toUpperCase()}</span>
                            <span style="margin-left: 8px;">${change.file}</span>
                        </div>
                        <div>
                            <button class="btn btn-xs" onclick="window.gitIntegration.viewDiff('${change.file}')">
                                👁️ View
                            </button>
                            <button class="btn btn-xs" onclick="window.gitIntegration.stageFile('${change.file}')">
                                ➕ Stage
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            gitContent.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <strong>Branch:</strong> ${data.branch}<br>
                    <strong>Changes:</strong> ${data.changes.length} file(s)
                </div>
                <div style="margin-bottom: 16px;">
                    <button class="btn btn-sm btn-primary" onclick="window.gitIntegration.switchTab('commit')">
                        📝 Commit Changes
                    </button>
                    <button class="btn btn-sm" onclick="window.gitIntegration.stageAll()">
                        ➕ Stage All
                    </button>
                    <button class="btn btn-sm" onclick="window.gitIntegration.refresh()">
                        🔄 Refresh
                    </button>
                </div>
                <div>${changesHtml}</div>
            `;
        }

        /**
         * Show commit tab
         */
        showCommitTab() {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            gitContent.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <strong>Commit Changes</strong>
                </div>
                <div class="form-group">
                    <label>Commit Message</label>
                    <textarea id="commit-message" rows="4" class="input" placeholder="Enter commit message..."></textarea>
                </div>
                <div style="margin-top: 16px;">
                    <button class="btn btn-primary" onclick="window.gitIntegration.commit()">
                        ✓ Commit
                    </button>
                    <button class="btn" onclick="window.gitIntegration.switchTab('status')">
                        ← Back to Status
                    </button>
                </div>
            `;
        }

        /**
         * Show branches tab
         */
        async showBranchesTab() {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            gitContent.innerHTML = '<div class="text-sm text-tertiary">Loading branches...</div>';

            try {
                const response = await fetch('/api/git/branches');
                if (!response.ok) throw new Error('Failed to load branches');

                const data = await response.json();
                this.renderBranches(data.branches);

            } catch (error) {
                console.error('Git branches error:', error);
                gitContent.innerHTML = `<div class="text-sm text-tertiary">${error.message}</div>`;
            }
        }

        /**
         * Render branches
         */
        renderBranches(branches) {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            const branchesHtml = branches.map(branch => {
                const isCurrent = branch.current;
                return `
                    <div class="git-file-item" style="background: ${isCurrent ? 'var(--bg-tertiary)' : 'transparent'}">
                        <div>
                            ${isCurrent ? '✓' : '○'} <strong>${branch.name}</strong>
                        </div>
                        ${!isCurrent ? `
                            <button class="btn btn-xs" onclick="window.gitIntegration.checkoutBranch('${branch.name}')">
                                🔀 Switch
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('');

            gitContent.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <strong>Branches</strong>
                </div>
                <div style="margin-bottom: 16px;">
                    <button class="btn btn-sm btn-primary" onclick="window.gitIntegration.createBranch()">
                        ➕ New Branch
                    </button>
                </div>
                <div>${branchesHtml}</div>
            `;
        }

        /**
         * Show history tab
         */
        async showHistoryTab() {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            gitContent.innerHTML = '<div class="text-sm text-tertiary">Loading history...</div>';

            try {
                const response = await fetch('/api/git/history');
                if (!response.ok) throw new Error('Failed to load history');

                const data = await response.json();
                this.renderHistory(data.commits);

            } catch (error) {
                console.error('Git history error:', error);
                gitContent.innerHTML = `<div class="text-sm text-tertiary">${error.message}</div>`;
            }
        }

        /**
         * Render history
         */
        renderHistory(commits) {
            const gitContent = document.getElementById('git-content');
            if (!gitContent) return;

            if (!commits || commits.length === 0) {
                gitContent.innerHTML = '<div class="text-sm text-tertiary">No commit history</div>';
                return;
            }

            const commitsHtml = commits.map(commit => `
                <div class="git-file-item">
                    <div>
                        <div><strong>${commit.message}</strong></div>
                        <div class="text-xs text-tertiary">
                            ${commit.author} • ${commit.date}
                        </div>
                    </div>
                    <div class="text-xs text-tertiary">${commit.hash.substring(0, 7)}</div>
                </div>
            `).join('');

            gitContent.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <strong>Commit History</strong>
                </div>
                <div>${commitsHtml}</div>
            `;
        }

        /**
         * Commit changes
         */
        async commit() {
            const message = document.getElementById('commit-message')?.value.trim();
            if (!message) {
                if (window.notify) {
                    window.notify.error('Error', 'Please enter a commit message');
                }
                return;
            }

            try {
                const response = await fetch('/api/git/commit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });

                if (!response.ok) throw new Error('Commit failed');

                if (window.notify) {
                    window.notify.success('Success', 'Changes committed');
                }

                await this.loadGitStatus();
                this.switchTab('status');

            } catch (error) {
                console.error('Commit error:', error);
                if (window.notify) {
                    window.notify.error('Error', error.message);
                }
            }
        }

        /**
         * Stage file
         */
        async stageFile(file) {
            try {
                const response = await fetch('/api/git/stage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file })
                });

                if (!response.ok) throw new Error('Stage failed');

                if (window.notify) {
                    window.notify.success('Staged', file);
                }

                await this.loadGitStatus();

            } catch (error) {
                console.error('Stage error:', error);
                if (window.notify) {
                    window.notify.error('Error', error.message);
                }
            }
        }

        /**
         * Stage all files
         */
        async stageAll() {
            await this.stageFile('.');
        }

        /**
         * View diff
         */
        async viewDiff(file) {
            if (window.notify) {
                window.notify.info('Diff', 'Visual diff viewer coming soon!');
            }
        }

        /**
         * Checkout branch
         */
        async checkoutBranch(branch) {
            try {
                const response = await fetch('/api/git/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ branch })
                });

                if (!response.ok) throw new Error('Checkout failed');

                if (window.notify) {
                    window.notify.success('Success', `Switched to ${branch}`);
                }

                await this.loadGitStatus();
                this.switchTab('status');

            } catch (error) {
                console.error('Checkout error:', error);
                if (window.notify) {
                    window.notify.error('Error', error.message);
                }
            }
        }

        /**
         * Create branch
         */
        async createBranch() {
            const name = prompt('Enter new branch name:');
            if (!name) return;

            try {
                const response = await fetch('/api/git/branch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });

                if (!response.ok) throw new Error('Create branch failed');

                if (window.notify) {
                    window.notify.success('Success', `Created branch ${name}`);
                }

                await this.showBranchesTab();

            } catch (error) {
                console.error('Create branch error:', error);
                if (window.notify) {
                    window.notify.error('Error', error.message);
                }
            }
        }

        /**
         * Update git indicators in UI
         */
        updateGitIndicators() {
            // Update branch display
            const branchElements = document.querySelectorAll('#git-branch, #git-branch-indicator');
            branchElements.forEach(el => {
                el.textContent = `🔀 ${this.currentBranch}`;
            });

            // Update changes indicator
            const changesEl = document.getElementById('git-changes');
            if (changesEl) {
                changesEl.textContent = this.changes.length > 0 ? '●' : '';
                changesEl.style.color = this.changes.length > 0 ? '#f59e0b' : 'inherit';
            }
        }

        /**
         * Start auto-refresh
         */
        startAutoRefresh() {
            // Refresh git status every 30 seconds
            this.refreshInterval = setInterval(() => {
                this.refresh();
            }, 30000);
        }

        /**
         * Refresh git status
         */
        async refresh() {
            try {
                const response = await fetch('/api/git/status');
                if (response.ok) {
                    const data = await response.json();
                    this.currentBranch = data.branch || 'main';
                    this.changes = data.changes || [];
                    this.updateGitIndicators();
                }
            } catch (error) {
                // Silently fail for background refresh
            }
        }

        /**
         * Stop auto-refresh
         */
        stopAutoRefresh() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
        }
    }

    // Export globally
    window.GitIntegration = GitIntegration;
})();
