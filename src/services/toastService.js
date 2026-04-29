/**
 * Toast Notification Service
 * Manages toast notifications across the app
 */

class ToastService {
  constructor() {
    this.listeners = [];
    this.toasts = [];
    this.nextId = 0;
  }

  /**
   * Subscribe to toast updates
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  /**
   * Show a toast
   */
  show(message, type = 'info', duration = 3000) {
    const id = this.nextId++;
    const toast = { id, message, type, duration };
    this.toasts.push(toast);
    this.notify();
    return id;
  }

  /**
   * Remove a toast
   */
  remove(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  /**
   * Clear all toasts
   */
  clear() {
    this.toasts = [];
    this.notify();
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration || 5000);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

const toastService = new ToastService();
export default toastService;

