/**
 * Background Notification Service
 * Handles browser notifications for background processing
 */

class BackgroundNotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  /**
   * Check notification permission
   */
  async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'default') {
      this.permission = await Notification.requestPermission();
    } else {
      this.permission = Notification.permission;
    }

    return this.permission;
  }

  /**
   * Show notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   * @param {Function} onClick - Click handler
   * @returns {Notification|null} Notification object or null
   */
  showNotification(title, options = {}, onClick = null) {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return null;
    }

    if (Notification.permission !== 'granted') {
      // Try to request permission
      this.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification(title, options, onClick);
        }
      });
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'manuscript-intelligence',
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    if (onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        onClick(event);
        notification.close();
      };
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  }

  /**
   * Show processing complete notification
   * @param {string} sessionId - Session ID
   * @param {number} suggestionCount - Number of suggestions found
   * @param {Function} onClick - Click handler to restore view
   */
  showProcessingComplete(sessionId, suggestionCount, onClick = null) {
    return this.showNotification(
      'Manuscript Intelligence: Processing Complete!',
      {
        body: `Found ${suggestionCount} suggestions. Click to review.`,
        tag: `manuscript-${sessionId}`,
        requireInteraction: true
      },
      onClick
    );
  }

  /**
   * Show processing progress notification
   * @param {string} sessionId - Session ID
   * @param {number} progress - Progress percentage
   * @param {string} status - Status message
   */
  showProcessingProgress(sessionId, progress, status) {
    // Don't spam notifications for progress - only show at milestones
    if (progress % 25 !== 0 && progress !== 100) {
      return null;
    }

    return this.showNotification(
      'Manuscript Intelligence: Processing...',
      {
        body: `${status} (${progress}%)`,
        tag: `manuscript-${sessionId}-progress`,
        requireInteraction: false
      }
    );
  }

  /**
   * Show processing error notification
   * @param {string} sessionId - Session ID
   * @param {string} error - Error message
   */
  showProcessingError(sessionId, error) {
    return this.showNotification(
      'Manuscript Intelligence: Processing Failed',
      {
        body: error,
        tag: `manuscript-${sessionId}-error`,
        requireInteraction: true
      }
    );
  }

  /**
   * Close all notifications for a session
   * @param {string} sessionId - Session ID
   */
  closeSessionNotifications(sessionId) {
    // Notifications API doesn't provide a way to close specific notifications
    // They will auto-close or user can close manually
    // This is a placeholder for future enhancement
  }
}

// Create singleton instance
const backgroundNotificationService = new BackgroundNotificationService();

export default backgroundNotificationService;
