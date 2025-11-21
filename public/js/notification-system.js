/**
 * Notification System
 * Manages toast notifications and alerts
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.defaultDuration = 5000; // 5 seconds
        this.maxNotifications = 5;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-label', 'Notifications');
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification
     * @param {Object} options - Notification options
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {string} options.type - Type: success, error, warning, info
     * @param {number} options.duration - Duration in ms (0 for persistent)
     * @param {Function} options.onClick - Click callback
     */
    show(options) {
        const {
            title = '',
            message = '',
            type = 'info',
            duration = this.defaultDuration,
            onClick = null
        } = options;

        const id = `notification-${Date.now()}-${Math.random()}`;

        // Remove oldest if at max capacity
        if (this.notifications.size >= this.maxNotifications) {
            const firstId = this.notifications.keys().next().value;
            this.dismiss(firstId);
        }

        const notification = this.createNotificationElement(id, title, message, type, onClick);

        // Add to container with animation
        this.container.appendChild(notification);
        requestAnimationFrame(() => {
            notification.classList.add('notification-enter');
        });

        // Store notification
        const notificationData = {
            id,
            element: notification,
            timer: null
        };

        // Set auto-dismiss timer if duration > 0
        if (duration > 0) {
            notificationData.timer = setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        this.notifications.set(id, notificationData);

        return id;
    }

    createNotificationElement(id, title, message, type, onClick) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = id;
        notification.setAttribute('role', 'alert');

        // Icon
        const icon = document.createElement('span');
        icon.className = 'notification-icon';
        icon.innerHTML = this.getIconForType(type);
        notification.appendChild(icon);

        // Content
        const content = document.createElement('div');
        content.className = 'notification-content';

        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'notification-title';
            titleEl.textContent = title;
            content.appendChild(titleEl);
        }

        if (message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'notification-message';
            messageEl.textContent = message;
            content.appendChild(messageEl);
        }

        notification.appendChild(content);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.onclick = () => this.dismiss(id);
        notification.appendChild(closeBtn);

        // Click handler
        if (onClick) {
            notification.style.cursor = 'pointer';
            notification.onclick = (e) => {
                if (e.target !== closeBtn) {
                    onClick();
                    this.dismiss(id);
                }
            };
        }

        return notification;
    }

    getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Dismiss a notification
     */
    dismiss(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const { element, timer } = notificationData;

        // Clear timer if exists
        if (timer) {
            clearTimeout(timer);
        }

        // Animate out
        element.classList.remove('notification-enter');
        element.classList.add('notification-exit');

        // Remove after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        for (const [id] of this.notifications) {
            this.dismiss(id);
        }
    }

    /**
     * Convenience methods
     */
    success(title, message, duration) {
        return this.show({ title, message, type: 'success', duration });
    }

    error(title, message, duration) {
        return this.show({ title, message, type: 'error', duration });
    }

    warning(title, message, duration) {
        return this.show({ title, message, type: 'warning', duration });
    }

    info(title, message, duration) {
        return this.show({ title, message, type: 'info', duration });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
