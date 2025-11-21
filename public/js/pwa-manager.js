// Grok IDE - PWA Manager
// Handles service worker registration, app installation, and updates

class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.deferredPrompt = null;
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupUpdateHandler();
    }
  }

  async registerServiceWorker() {
    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', this.registration.scope);

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // Auto-update check every hour
      setInterval(() => {
        this.registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
      console.log('[PWA] Install prompt ready');
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.showNotification('Grok IDE installed successfully!', 'success');
    });
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log('[PWA] User choice:', outcome);
    this.deferredPrompt = null;

    if (outcome === 'dismissed') {
      this.showNotification('You can install Grok IDE later from your browser menu', 'info');
    }
  }

  setupUpdateHandler() {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.className = 'pwa-install-button';
    installBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1l-4 4h2.5v5h3V5H12L8 1zm-6 11v3h12v-3h-1v2H3v-2H1z"/>
      </svg>
      Install Grok IDE
    `;
    installBtn.onclick = () => this.promptInstall();

    // Add to navbar or create floating button
    const navbar = document.querySelector('.navbar') || document.body;
    navbar.appendChild(installBtn);
  }

  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.remove();
    }
  }

  showUpdateNotification() {
    const updateBtn = document.createElement('div');
    updateBtn.className = 'pwa-update-notification';
    updateBtn.innerHTML = `
      <div class="update-content">
        <p>🚀 A new version of Grok IDE is available!</p>
        <button onclick="window.pwaManager.activateUpdate()">Update Now</button>
        <button onclick="this.parentElement.parentElement.remove()">Later</button>
      </div>
    `;

    document.body.appendChild(updateBtn);
  }

  activateUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async clearCache() {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
      console.log('[PWA] Cache cleared');
      this.showNotification('Cache cleared successfully', 'success');
    }
  }

  async checkOnlineStatus() {
    return navigator.onLine;
  }

  setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.showNotification('Back online! Syncing changes...', 'success');
      this.syncOfflineChanges();
    });

    window.addEventListener('offline', () => {
      this.showNotification('You are offline. Changes will be saved locally.', 'warning');
    });
  }

  async syncOfflineChanges() {
    // TODO: Implement offline changes sync
    console.log('[PWA] Syncing offline changes...');
  }

  showNotification(message, type = 'info') {
    // Use existing notification system if available
    if (window.notificationSystem) {
      window.notificationSystem.show(message, type);
    } else {
      console.log(`[PWA] ${type.toUpperCase()}: ${message}`);
    }
  }

  // PWA Installation detection
  static isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Get installation stats
  getInstallationInfo() {
    return {
      isInstalled: PWAManager.isInstalled(),
      canInstall: !!this.deferredPrompt,
      hasServiceWorker: !!this.registration,
      isOnline: navigator.onLine,
      updateAvailable: this.updateAvailable
    };
  }
}

// Initialize PWA Manager
window.pwaManager = new PWAManager();

// Setup online/offline handlers
window.pwaManager.setupOnlineOfflineHandlers();

// Export for use in other modules
export default PWAManager;
