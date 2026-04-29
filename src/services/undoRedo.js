/**
 * Undo/Redo System for Claimwise Omniscience
 * Tracks state changes across the app for undo/redo functionality
 */

class UndoRedoManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
    this.isUndoing = false;
  }

  /**
   * Save a state snapshot
   */
  saveState(state, action = 'Action') {
    // Don't save if we're in the middle of an undo/redo
    if (this.isUndoing) return;

    // Remove any "future" history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.history.push({
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      action,
      timestamp: Date.now()
    });

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Undo - go back one step
   */
  undo() {
    if (this.canUndo()) {
      this.isUndoing = true;
      this.currentIndex--;
      const previousState = this.history[this.currentIndex];
      this.isUndoing = false;
      return previousState ? previousState.state : null;
    }
    return null;
  }

  /**
   * Redo - go forward one step
   */
  redo() {
    if (this.canRedo()) {
      this.isUndoing = true;
      this.currentIndex++;
      const nextState = this.history[this.currentIndex];
      this.isUndoing = false;
      return nextState ? nextState.state : null;
    }
    return null;
  }

  /**
   * Check if undo is possible
   */
  canUndo() {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState() {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].state;
    }
    return null;
  }

  /**
   * Clear history
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history info
   */
  getHistoryInfo() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalHistory: this.history.length,
      currentAction: this.history[this.currentIndex]?.action || 'No action'
    };
  }
}

// Create singleton instance
const undoRedoManager = new UndoRedoManager();

export default undoRedoManager;

