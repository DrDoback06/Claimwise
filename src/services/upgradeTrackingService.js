/**
 * Upgrade Tracking Service
 * Manages upgrade history for entities (items, skills, stats)
 */

import db from './database';

class UpgradeTrackingService {
  /**
   * Add an upgrade record to an entity
   * @param {string} entityId - Entity ID
   * @param {string} entityType - 'item', 'skill', or 'stat'
   * @param {number} chapterId - Chapter ID where upgrade occurred
   * @param {number} bookId - Book ID
   * @param {Object} changes - Object describing the changes
   * @param {string} sourceContext - Source text from chapter
   * @returns {Promise<Object>} - Upgrade record
   */
  async addUpgrade(entityId, entityType, chapterId, bookId, changes, sourceContext) {
    try {
      const upgradeRecord = {
        chapterId,
        bookId,
        changes,
        sourceContext: sourceContext || '',
        timestamp: Date.now()
      };

      // Get entity from appropriate store
      let entity;
      switch (entityType) {
        case 'item':
          entity = await db.get('itemBank', entityId);
          break;
        case 'skill':
          entity = await db.get('skillBank', entityId);
          break;
        case 'stat':
          entity = await db.get('statRegistry', entityId);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      // Initialize upgradeHistory if it doesn't exist
      if (!entity.upgradeHistory) {
        entity.upgradeHistory = [];
      }

      // Add upgrade record
      entity.upgradeHistory.push(upgradeRecord);

      // Sort by chapter/book order
      entity.upgradeHistory.sort((a, b) => {
        if (a.bookId !== b.bookId) return (a.bookId || 0) - (b.bookId || 0);
        return (a.chapterId || 0) - (b.chapterId || 0);
      });

      // Update entity in database
      switch (entityType) {
        case 'item':
          await db.update('itemBank', entity);
          break;
        case 'skill':
          await db.update('skillBank', entity);
          break;
        case 'stat':
          await db.update('statRegistry', entity);
          break;
      }

      return upgradeRecord;
    } catch (error) {
      console.error('Error adding upgrade:', error);
      throw error;
    }
  }

  /**
   * Get upgrade history for an entity
   * @param {string} entityId - Entity ID
   * @param {string} entityType - 'item', 'skill', or 'stat'
   * @returns {Promise<Array>} - Array of upgrade records
   */
  async getUpgradeHistory(entityId, entityType) {
    try {
      let entity;
      switch (entityType) {
        case 'item':
          entity = await db.get('itemBank', entityId);
          break;
        case 'skill':
          entity = await db.get('skillBank', entityId);
          break;
        case 'stat':
          entity = await db.get('statRegistry', entityId);
          break;
        default:
          return [];
      }

      return entity?.upgradeHistory || [];
    } catch (error) {
      console.error('Error getting upgrade history:', error);
      return [];
    }
  }

  /**
   * Format upgrade changes for display
   * @param {Object} changes - Changes object
   * @returns {string} - Formatted string
   */
  formatUpgradeChanges(changes) {
    const parts = [];

    if (changes.stats) {
      const statParts = [];
      for (const [stat, value] of Object.entries(changes.stats)) {
        const sign = value >= 0 ? '+' : '';
        statParts.push(`${sign}${value} ${stat}`);
      }
      if (statParts.length > 0) {
        parts.push(statParts.join(', '));
      }
    }

    if (changes.description) {
      parts.push('Description updated');
    }

    if (changes.type) {
      parts.push(`Type changed to ${changes.type}`);
    }

    if (changes.rarity) {
      parts.push(`Rarity changed to ${changes.rarity}`);
    }

    if (changes.tier) {
      parts.push(`Tier changed to ${changes.tier}`);
    }

    return parts.length > 0 ? parts.join('; ') : 'Changes detected';
  }

  /**
   * Get upgrade summary for display in entity properties
   * @param {string} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<Array>} - Array of formatted upgrade summaries
   */
  async getUpgradeSummary(entityId, entityType) {
    const history = await this.getUpgradeHistory(entityId, entityType);
    
    return history.map(upgrade => ({
      chapterId: upgrade.chapterId,
      bookId: upgrade.bookId,
      changes: this.formatUpgradeChanges(upgrade.changes),
      sourceContext: upgrade.sourceContext,
      timestamp: upgrade.timestamp
    }));
  }
}

export default new UpgradeTrackingService();
