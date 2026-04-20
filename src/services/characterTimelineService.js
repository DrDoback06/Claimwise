/**
 * Character Timeline Service
 * Tracks character changes over time (skills, items, mood, relationships, events)
 * Auto-updates when entities change
 */

import db from './database';

class CharacterTimelineService {
  /**
   * Add timeline event for a character
   */
  async addTimelineEvent(actorId, eventType, data, chapterId = null) {
    try {
      const event = {
        id: `timeline_${actorId}_${Date.now()}`,
        actorId,
        chapterId,
        eventType, // 'skill_acquired', 'item_gained', 'item_lost', 'mood_change', 'relationship_change', 'stat_change', 'event'
        data, // Event-specific data
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };

      await db.add('characterTimelines', event);
      return event;
    } catch (error) {
      console.error('Error adding timeline event:', error);
      throw error;
    }
  }

  /**
   * Get timeline for a character
   */
  async getCharacterTimeline(actorId) {
    try {
      const allEvents = await db.getAll('characterTimelines');
      return allEvents
        .filter(event => event.actorId === actorId)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } catch (error) {
      console.error('Error getting character timeline:', error);
      return [];
    }
  }

  /**
   * Track skill acquisition
   */
  async trackSkillAcquisition(actorId, skillId, skillName, chapterId = null) {
    return this.addTimelineEvent(actorId, 'skill_acquired', {
      skillId,
      skillName,
      description: `Acquired skill: ${skillName}`
    }, chapterId);
  }

  /**
   * Track item change
   */
  async trackItemChange(actorId, itemId, itemName, changeType, chapterId = null) {
    return this.addTimelineEvent(actorId, changeType === 'gained' ? 'item_gained' : 'item_lost', {
      itemId,
      itemName,
      changeType,
      description: `${changeType === 'gained' ? 'Gained' : 'Lost'} item: ${itemName}`
    }, chapterId);
  }

  /**
   * Track stat change
   */
  async trackStatChange(actorId, statName, oldValue, newValue, chapterId = null) {
    return this.addTimelineEvent(actorId, 'stat_change', {
      statName,
      oldValue,
      newValue,
      description: `${statName}: ${oldValue} → ${newValue}`
    }, chapterId);
  }

  /**
   * Track relationship change
   */
  async trackRelationshipChange(actorId, otherActorId, otherActorName, relationshipType, chapterId = null) {
    return this.addTimelineEvent(actorId, 'relationship_change', {
      otherActorId,
      otherActorName,
      relationshipType,
      description: `Relationship with ${otherActorName}: ${relationshipType}`
    }, chapterId);
  }

  /**
   * Track custom event
   */
  async trackEvent(actorId, description, eventData = {}, chapterId = null) {
    return this.addTimelineEvent(actorId, 'event', {
      description,
      ...eventData
    }, chapterId);
  }

  /**
   * Get timeline summary for character (last N events)
   */
  async getTimelineSummary(actorId, limit = 10) {
    const timeline = await this.getCharacterTimeline(actorId);
    return timeline.slice(-limit);
  }
}

export default new CharacterTimelineService();
