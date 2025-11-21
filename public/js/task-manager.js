/**
 * Task Manager - Phase 4
 * TODO/Task management system
 */

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.setupDialog();
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ Task Manager initialized');
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('grok-ide-tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('grok-ide-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    setupDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'task-manager-dialog';
        dialog.className = 'modal';
        dialog.style.display = 'none';
        dialog.innerHTML = `
            <div class="modal-content task-manager-panel">
                <div class="modal-header">
                    <h2>✓ Task Manager</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-sm" id="clear-completed-btn">Clear Completed</button>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div class="task-list" id="task-list">
                        <div class="text-sm text-tertiary" style="padding: 16px;">No tasks yet. Add one below!</div>
                    </div>
                    <div class="task-input-area">
                        <input type="text" id="task-input" class="task-input" placeholder="Add a new task...">
                        <select id="task-priority" class="select-sm">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                        <button class="btn btn-primary" id="add-task-btn">Add Task</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    setupEventListeners() {
        const modal = document.getElementById('task-manager-dialog');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });

        // Add task
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());

        // Enter to add task
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Clear completed
        document.getElementById('clear-completed-btn').addEventListener('click', () => this.clearCompleted());
    }

    addTask() {
        const input = document.getElementById('task-input');
        const priority = document.getElementById('task-priority').value;
        const title = input.value.trim();

        if (!title) return;

        const task = {
            id: Date.now(),
            title,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();

        input.value = '';
        input.focus();

        if (window.showNotification) {
            window.showNotification('Task added!', 'success');
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();

        if (window.showNotification) {
            window.showNotification('Task deleted!', 'info');
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.renderTasks();

        if (window.showNotification && completedCount > 0) {
            window.showNotification(`${completedCount} completed task(s) cleared!`, 'success');
        }
    }

    renderTasks() {
        const listContainer = document.getElementById('task-list');

        if (this.tasks.length === 0) {
            listContainer.innerHTML = '<div class="text-sm text-tertiary" style="padding: 16px;">No tasks yet. Add one below!</div>';
            return;
        }

        listContainer.innerHTML = '';

        this.tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = `task-item ${task.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                        <span>${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-icon btn-xs" data-delete-task="${task.id}" title="Delete">
                        🗑️
                    </button>
                </div>
            `;

            // Checkbox event
            const checkbox = item.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            // Delete event
            const deleteBtn = item.querySelector('[data-delete-task]');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            listContainer.appendChild(item);
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    show() {
        const modal = document.getElementById('task-manager-dialog');
        modal.style.display = 'flex';
        this.renderTasks();
        document.getElementById('task-input').focus();
    }

    hide() {
        const modal = document.getElementById('task-manager-dialog');
        modal.style.display = 'none';
    }

    getTaskCount() {
        return {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            pending: this.tasks.filter(t => !t.completed).length
        };
    }
}

window.TaskManager = TaskManager;
