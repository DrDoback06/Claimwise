/**
 * Background Processing Service for Manuscript Intelligence
 * Handles processing that continues even when React components unmount
 */

import db from './database';
import aiService from './aiService';
import manuscriptIntelligenceService from './manuscriptIntelligenceService';
import extractionHistoryService from './extractionHistoryService';
import backgroundNotificationService from './backgroundNotificationService';

class ManuscriptProcessingService {
  constructor() {
    this.activeProcesses = new Map(); // sessionId -> processInfo
    this.eventListeners = new Map(); // sessionId -> Set of listeners
    this.checkpointInterval = null;
  }

  /**
   * Start background processing
   * @param {string} sessionId - Session ID
   * @param {string} docText - Document text to process
   * @param {Object} worldState - World state
   * @param {Object} options - Processing options
   * @returns {Promise<void>}
   */
  async startBackgroundProcessing(sessionId, docText, worldState, options = {}) {
    const {
      buzzWords = [],
      onProgress = null,
      useCompleteDocument = false
    } = options;

    // Check if already processing
    if (this.activeProcesses.has(sessionId)) {
      throw new Error(`Session ${sessionId} is already processing`);
    }

    // Initialize process info
    const processInfo = {
      sessionId,
      status: 'processing',
      progress: { current: 0, status: 'Initializing...', liveSuggestions: [] },
      startTime: Date.now(),
      lastCheckpoint: 0,
      checkpoint: null,
      error: null
    };

    this.activeProcesses.set(sessionId, processInfo);

    // Update session status in database
    try {
      const session = await extractionHistoryService.getSession(sessionId);
      if (session) {
        session.status = 'processing';
        session.processingStartTime = Date.now();
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.warn('Error updating session status:', error);
    }

    // Start processing in background (don't await)
    this._processInBackground(sessionId, docText, worldState, {
      buzzWords,
      onProgress,
      useCompleteDocument
    }).catch(error => {
      console.error('Background processing error:', error);
      processInfo.status = 'failed';
      processInfo.error = error.message;
      this._emitEvent(sessionId, 'error', { error: error.message });
      this.activeProcesses.delete(sessionId);
    });

    return processInfo;
  }

  /**
   * Process in background (async, doesn't block)
   */
  async _processInBackground(sessionId, docText, worldState, options) {
    const processInfo = this.activeProcesses.get(sessionId);
    if (!processInfo) return;

    try {
      const { buzzWords, onProgress, useCompleteDocument } = options;

      // Save checkpoint every 10%
      const saveCheckpoint = async (progress, checkpointData) => {
        if (progress.current - processInfo.lastCheckpoint >= 10) {
          processInfo.lastCheckpoint = progress.current;
          processInfo.checkpoint = {
            progress,
            data: checkpointData,
            timestamp: Date.now()
          };

          // Save to database
          try {
            const session = await extractionHistoryService.getSession(sessionId);
            if (session) {
              session.processingCheckpoint = processInfo.checkpoint;
              await db.update('extractionSessions', session);
            }
          } catch (error) {
            console.warn('Error saving checkpoint:', error);
          }
        }
      };

      // Progress callback wrapper
      const progressCallback = (progress) => {
        processInfo.progress = progress;
        this._emitEvent(sessionId, 'progress', progress);
        if (onProgress) {
          onProgress(progress);
        }
        saveCheckpoint(progress, null);
        
        // Show progress notification at milestones
        if (progress.current % 25 === 0 || progress.current === 100) {
          backgroundNotificationService.showProcessingProgress(
            sessionId,
            progress.current,
            progress.status
          );
        }
      };

      let result;

      if (useCompleteDocument) {
        // Use complete document processing
        result = await manuscriptIntelligenceService.processCompleteDocument(
          docText,
          worldState,
          progressCallback,
          sessionId
        );
      } else {
        // Use standard manuscript intelligence processing
        result = await aiService.processManuscriptIntelligence(
          docText,
          worldState,
          buzzWords,
          progressCallback
        );
      }

      // Processing complete
      processInfo.status = 'completed';
      processInfo.progress = { current: 100, status: 'Complete!', liveSuggestions: result.suggestions || [] };

      // Save final results
      try {
        const session = await extractionHistoryService.getSession(sessionId);
        if (session) {
          session.status = 'completed';
          session.processingEndTime = Date.now();
          session.extractionResults = result;
          if (result.suggestions) {
            await extractionHistoryService.saveSuggestions(sessionId, result.suggestions);
          }
          await db.update('extractionSessions', session);
        }
      } catch (error) {
        console.warn('Error saving final results:', error);
      }

      this._emitEvent(sessionId, 'complete', result);
      this.activeProcesses.delete(sessionId);

      // Send notification
      this._sendNotification(sessionId, 'Processing complete!', {
        body: `Found ${result.suggestions?.length || 0} suggestions`,
        tag: `manuscript-${sessionId}`
      });

    } catch (error) {
      processInfo.status = 'failed';
      processInfo.error = error.message;
      this._emitEvent(sessionId, 'error', { error: error.message });

      // Update session
      try {
        const session = await extractionHistoryService.getSession(sessionId);
        if (session) {
          session.status = 'failed';
          session.error = error.message;
          await db.update('extractionSessions', session);
        }
      } catch (e) {
        console.warn('Error updating failed session:', e);
      }

      this.activeProcesses.delete(sessionId);
      throw error;
    }
  }

  /**
   * Get processing status
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Process info or null
   */
  getProcessingStatus(sessionId) {
    return this.activeProcesses.get(sessionId) || null;
  }

  /**
   * Pause processing (not fully implemented - would require worker)
   * @param {string} sessionId - Session ID
   */
  async pauseProcessing(sessionId) {
    const processInfo = this.activeProcesses.get(sessionId);
    if (!processInfo) {
      throw new Error(`No active process for session ${sessionId}`);
    }

    // Note: Full pause would require Web Workers
    // For now, we just mark it as paused in the database
    processInfo.status = 'paused';
    
    try {
      const session = await extractionHistoryService.getSession(sessionId);
      if (session) {
        session.status = 'paused';
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.warn('Error pausing session:', error);
    }

    this._emitEvent(sessionId, 'paused', null);
  }

  /**
   * Resume processing from checkpoint
   * @param {string} sessionId - Session ID
   * @param {string} docText - Document text
   * @param {Object} worldState - World state
   * @param {Object} options - Processing options
   */
  async resumeProcessing(sessionId, docText, worldState, options = {}) {
    // Load checkpoint from database
    try {
      const session = await extractionHistoryService.getSession(sessionId);
      if (session?.processingCheckpoint) {
        const checkpoint = session.processingCheckpoint;
        // Resume from checkpoint (simplified - would need more logic for full resume)
        options.startFromCheckpoint = checkpoint;
      }
    } catch (error) {
      console.warn('Error loading checkpoint:', error);
    }

    return this.startBackgroundProcessing(sessionId, docText, worldState, options);
  }

  /**
   * Cancel processing
   * @param {string} sessionId - Session ID
   */
  async cancelProcessing(sessionId) {
    const processInfo = this.activeProcesses.get(sessionId);
    if (!processInfo) {
      return; // Already stopped
    }

    processInfo.status = 'cancelled';
    
    try {
      const session = await extractionHistoryService.getSession(sessionId);
      if (session) {
        session.status = 'cancelled';
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.warn('Error cancelling session:', error);
    }

    this.activeProcesses.delete(sessionId);
    this._emitEvent(sessionId, 'cancelled', null);
  }

  /**
   * Add event listener for processing events
   * @param {string} sessionId - Session ID
   * @param {Function} listener - Event listener function
   */
  addEventListener(sessionId, listener) {
    if (!this.eventListeners.has(sessionId)) {
      this.eventListeners.set(sessionId, new Set());
    }
    this.eventListeners.get(sessionId).add(listener);
  }

  /**
   * Remove event listener
   * @param {string} sessionId - Session ID
   * @param {Function} listener - Event listener function
   */
  removeEventListener(sessionId, listener) {
    const listeners = this.eventListeners.get(sessionId);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} sessionId - Session ID
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  _emitEvent(sessionId, eventType, data) {
    const listeners = this.eventListeners.get(sessionId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener({ type: eventType, data, sessionId });
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }


  /**
   * Get all active processing sessions
   * @returns {Array} Array of active process info
   */
  getActiveProcesses() {
    return Array.from(this.activeProcesses.values());
  }

  /**
   * Restore processing sessions from database on app start
   */
  async restoreActiveSessions() {
    try {
      const sessions = await db.getAll('extractionSessions');
      const activeSessions = sessions.filter(s => 
        s.status === 'processing' || s.status === 'paused'
      );

      for (const session of activeSessions) {
        // Mark as paused (user can resume manually)
        session.status = 'paused';
        await db.update('extractionSessions', session);
      }

      return activeSessions;
    } catch (error) {
      console.error('Error restoring active sessions:', error);
      return [];
    }
  }
}

// Create singleton instance
const manuscriptProcessingService = new ManuscriptProcessingService();

export default manuscriptProcessingService;
