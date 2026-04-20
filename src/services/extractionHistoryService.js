/**
 * Extraction History Service
 * Manages reversible history for manuscript intelligence extractions
 * Enables undo/revert functionality for applied suggestions
 */

import db from './database';

class ExtractionHistoryService {
  constructor() {
    this.currentSession = null;
  }

  /**
   * Start a new extraction session
   */
  async startSession(chapterId, sourceType = 'text', sourceName = '') {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      chapterId,
      sourceType, // 'text' | 'file' | 'realtime' | 'document'
      sourceName,
      status: 'active',
      entriesCount: 0,
      suggestions: [],
      reviewStatus: {},
      appliedActions: {},
      wizardState: {},
      documentText: '',
      lastSaved: Date.now()
    };
    
    try {
      await db.add('extractionSessions', session);
    } catch (e) {
      // Update if exists
      await db.update('extractionSessions', session);
    }
    this.currentSession = session;
    return session;
  }

  /**
   * Save wizard state to session
   * @param {string} sessionId - Session ID
   * @param {Object} wizardState - Wizard state to save
   */
  async saveWizardState(sessionId, wizardState) {
    try {
      const session = await db.get('extractionSessions', sessionId);
      if (session) {
        session.wizardState = wizardState;
        session.lastSaved = Date.now();
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.error('Error saving wizard state:', error);
    }
  }

  /**
   * Save suggestions to session
   * @param {string} sessionId - Session ID
   * @param {Array} suggestions - Suggestions array
   */
  async saveSuggestions(sessionId, suggestions) {
    try {
      const session = await db.get('extractionSessions', sessionId);
      if (session) {
        session.suggestions = suggestions;
        session.lastSaved = Date.now();
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.error('Error saving suggestions:', error);
    }
  }

  /**
   * Save review status to session
   * @param {string} sessionId - Session ID
   * @param {Object} reviewStatus - Review status object
   */
  async saveReviewStatus(sessionId, reviewStatus) {
    try {
      const session = await db.get('extractionSessions', sessionId);
      if (session) {
        session.reviewStatus = reviewStatus;
        session.lastSaved = Date.now();
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.error('Error saving review status:', error);
    }
  }

  /**
   * Save document text to session
   * @param {string} sessionId - Session ID
   * @param {string} documentText - Document text
   */
  async saveDocumentText(sessionId, documentText) {
    try {
      const session = await db.get('extractionSessions', sessionId);
      if (session) {
        session.documentText = documentText;
        session.lastSaved = Date.now();
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.error('Error saving document text:', error);
    }
  }

  /**
   * Get session with full wizard state
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session with wizard state
   */
  async getSessionWithState(sessionId) {
    try {
      const session = await db.get('extractionSessions', sessionId);
      return session;
    } catch (error) {
      console.error('Error getting session with state:', error);
      return null;
    }
  }

  /**
   * End current session
   */
  async endSession() {
    if (this.currentSession) {
      this.currentSession.status = 'completed';
      this.currentSession.completedAt = Date.now();
      await db.update('extractionSessions', this.currentSession);
      this.currentSession = null;
    }
  }

  /**
   * Record an extraction action
   */
  async recordExtraction(params) {
    const {
      entityType,
      action, // 'create' | 'update' | 'merge' | 'delete' | 'inventory_add' | 'inventory_remove' | 'stat_change'
      entityId,
      entityName,
      previousState,
      newState,
      targetActorId = null,
      targetActorName = null,
      chapterId,
      sourceContext = '',
      confidence = 1.0
    } = params;

    const entry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      extractionId: this.currentSession?.id || `standalone_${Date.now()}`,
      timestamp: Date.now(),
      chapterId,
      entityType,
      action,
      entityId,
      entityName,
      previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
      newState: newState ? JSON.parse(JSON.stringify(newState)) : null,
      targetActorId,
      targetActorName,
      sourceContext,
      confidence,
      reverted: false,
      revertedAt: null
    };

    await db.add('extractionHistory', entry);

    // Update session count
    if (this.currentSession) {
      this.currentSession.entriesCount++;
      await db.update('extractionSessions', this.currentSession);
    }

    return entry;
  }

  /**
   * Get extraction history with filters
   */
  async getHistory(filters = {}) {
    const { chapterId, entityType, extractionId, limit = 100, includeReverted = false } = filters;
    
    let history = await db.getAll('extractionHistory');

    // Apply filters
    if (chapterId) {
      history = history.filter(h => h.chapterId === chapterId);
    }
    if (entityType) {
      history = history.filter(h => h.entityType === entityType);
    }
    if (extractionId) {
      history = history.filter(h => h.extractionId === extractionId);
    }
    if (!includeReverted) {
      history = history.filter(h => !h.reverted);
    }

    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp - a.timestamp);

    return history.slice(0, limit);
  }

  /**
   * Get all extraction sessions
   */
  async getSessions(limit = 50) {
    const sessions = await db.getAll('extractionSessions');
    return sessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Revert a single extraction
   */
  async revertExtraction(historyId) {
    const entry = await db.get('extractionHistory', historyId);
    if (!entry) {
      throw new Error('History entry not found');
    }
    if (entry.reverted) {
      throw new Error('Entry already reverted');
    }

    // Perform the revert based on action type
    await this._performRevert(entry);

    // Mark as reverted
    entry.reverted = true;
    entry.revertedAt = Date.now();
    await db.update('extractionHistory', entry);

    return entry;
  }

  /**
   * Revert all extractions from a session
   */
  async revertSession(sessionId) {
    const history = await this.getHistory({ extractionId: sessionId, includeReverted: false });
    
    // Revert in reverse order (newest first)
    const results = [];
    for (const entry of history) {
      try {
        await this.revertExtraction(entry.id);
        results.push({ id: entry.id, success: true });
      } catch (error) {
        results.push({ id: entry.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Perform the actual revert operation
   */
  async _performRevert(entry) {
    const { entityType, action, entityId, previousState, targetActorId } = entry;

    switch (action) {
      case 'create':
        // Delete the created entity
        await this._deleteEntity(entityType, entityId);
        break;

      case 'update':
      case 'merge':
        // Restore previous state
        if (previousState) {
          await this._updateEntity(entityType, entityId, previousState);
        }
        break;

      case 'delete':
        // Re-create the deleted entity
        if (previousState) {
          await this._createEntity(entityType, previousState);
        }
        break;

      case 'inventory_add':
        // Remove item from actor inventory
        if (targetActorId && entityId) {
          await this._removeFromInventory(targetActorId, entityId);
        }
        break;

      case 'inventory_remove':
        // Add item back to actor inventory
        if (targetActorId && entityId) {
          await this._addToInventory(targetActorId, entityId);
        }
        break;

      case 'stat_change':
        // Revert stat change on actor
        if (targetActorId && previousState) {
          const actor = await db.get('actors', targetActorId);
          if (actor) {
            // Restore previous stats
            actor.baseStats = previousState.baseStats || actor.baseStats;
            actor.additionalStats = previousState.additionalStats || actor.additionalStats;
            await db.update('actors', actor);
          }
        }
        break;

      case 'skill_assign':
        // Remove skill from actor
        if (targetActorId && entityId) {
          const actor = await db.get('actors', targetActorId);
          if (actor) {
            actor.activeSkills = (actor.activeSkills || []).filter(id => id !== entityId);
            await db.update('actors', actor);
          }
        }
        break;

      case 'location_update':
        // Revert location change
        if (targetActorId && previousState?.location) {
          const actor = await db.get('actors', targetActorId);
          if (actor) {
            actor.currentLocation = previousState.location;
            await db.update('actors', actor);
          }
        }
        break;

      default:
        console.warn(`Unknown action type for revert: ${action}`);
    }
  }

  async _deleteEntity(entityType, entityId) {
    const storeMap = {
      'item': 'itemBank',
      'skill': 'skillBank',
      'actor': 'actors',
      'relationship': 'relationships',
      'wiki': 'wikiEntries',
      'location': 'wikiEntries',
      'event': 'wikiEntries'
    };
    
    const storeName = storeMap[entityType];
    if (storeName) {
      await db.delete(storeName, entityId);
    }
  }

  async _updateEntity(entityType, entityId, data) {
    const storeMap = {
      'item': 'itemBank',
      'skill': 'skillBank',
      'actor': 'actors',
      'relationship': 'relationships',
      'wiki': 'wikiEntries'
    };
    
    const storeName = storeMap[entityType];
    if (storeName) {
      await db.update(storeName, { ...data, id: entityId });
    }
  }

  async _createEntity(entityType, data) {
    const storeMap = {
      'item': 'itemBank',
      'skill': 'skillBank',
      'actor': 'actors',
      'relationship': 'relationships',
      'wiki': 'wikiEntries'
    };
    
    const storeName = storeMap[entityType];
    if (storeName) {
      await db.add(storeName, data);
    }
  }

  async _removeFromInventory(actorId, itemId) {
    const actor = await db.get('actors', actorId);
    if (actor) {
      actor.inventory = (actor.inventory || []).filter(id => id !== itemId);
      await db.update('actors', actor);
    }
  }

  async _addToInventory(actorId, itemId) {
    const actor = await db.get('actors', actorId);
    if (actor) {
      if (!actor.inventory) actor.inventory = [];
      if (!actor.inventory.includes(itemId)) {
        actor.inventory.push(itemId);
      }
      await db.update('actors', actor);
    }
  }

  /**
   * Get summary statistics for history
   */
  async getStats() {
    const history = await db.getAll('extractionHistory');
    const sessions = await db.getAll('extractionSessions');

    const stats = {
      totalExtractions: history.length,
      totalSessions: sessions.length,
      revertedCount: history.filter(h => h.reverted).length,
      byEntityType: {},
      byAction: {},
      recentSessions: sessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
    };

    history.forEach(entry => {
      stats.byEntityType[entry.entityType] = (stats.byEntityType[entry.entityType] || 0) + 1;
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear old history entries (older than specified days)
   */
  async clearOldHistory(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const history = await db.getAll('extractionHistory');
    
    const toDelete = history.filter(h => h.timestamp < cutoff && h.reverted);
    
    for (const entry of toDelete) {
      await db.delete('extractionHistory', entry.id);
    }

    return toDelete.length;
  }
}

const extractionHistoryService = new ExtractionHistoryService();
export default extractionHistoryService;
