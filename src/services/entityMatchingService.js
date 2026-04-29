/**
 * Entity Matching Service
 * Provides fuzzy matching for entities (actors, items, skills, stats) to prevent duplicates
 */

class EntityMatchingService {
  /**
   * Calculate similarity between two strings (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Levenshtein distance-based similarity
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - (distance / maxLen);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Find best matching actor
   */
  findMatchingActor(entityName, actors, threshold = 0.7) {
    if (!entityName || !actors || actors.length === 0) return null;

    let bestMatch = null;
    let bestScore = threshold;

    for (const actor of actors) {
      // Check exact name match
      if (actor.name?.toLowerCase() === entityName.toLowerCase()) {
        return { actor, confidence: 1.0, matchType: 'exact' };
      }

      // Check nickname matches
      if (actor.nicknames && Array.isArray(actor.nicknames)) {
        for (const nickname of actor.nicknames) {
          if (nickname.toLowerCase() === entityName.toLowerCase()) {
            return { actor, confidence: 0.95, matchType: 'nickname' };
          }
        }
      }

      // Calculate similarity
      const score = this.calculateSimilarity(entityName, actor.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { actor, confidence: score, matchType: 'fuzzy' };
      }
    }

    return bestMatch;
  }

  /**
   * Find best matching item
   */
  findMatchingItem(entityName, items, threshold = 0.7) {
    if (!entityName || !items || items.length === 0) return null;

    let bestMatch = null;
    let bestScore = threshold;

    for (const item of items) {
      // Check exact name match
      if (item.name?.toLowerCase() === entityName.toLowerCase()) {
        return { item, confidence: 1.0, matchType: 'exact' };
      }

      // Calculate similarity
      const score = this.calculateSimilarity(entityName, item.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { item, confidence: score, matchType: 'fuzzy' };
      }
    }

    return bestMatch;
  }

  /**
   * Find best matching skill
   */
  findMatchingSkill(entityName, skills, threshold = 0.7) {
    if (!entityName || !skills || skills.length === 0) return null;

    let bestMatch = null;
    let bestScore = threshold;

    for (const skill of skills) {
      // Check exact name match
      if (skill.name?.toLowerCase() === entityName.toLowerCase()) {
        return { skill, confidence: 1.0, matchType: 'exact' };
      }

      // Calculate similarity
      const score = this.calculateSimilarity(entityName, skill.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { skill, confidence: score, matchType: 'fuzzy' };
      }
    }

    return bestMatch;
  }

  /**
   * Find matching stat by key
   */
  findMatchingStat(statKey, stats, threshold = 0.8) {
    if (!statKey || !stats || stats.length === 0) return null;

    const normalizedKey = statKey.toUpperCase().trim();

    for (const stat of stats) {
      if (stat.key?.toUpperCase() === normalizedKey) {
        return { stat, confidence: 1.0, matchType: 'exact' };
      }
    }

    return null;
  }

  /**
   * Match an entity to existing entities
   * @param {Object} entity - Entity to match {name, type, description}
   * @param {Object} worldState - {actors, items, skills, statRegistry}
   * @returns {Object|null} - {matchedEntity, confidence, matchType, entityType}
   */
  matchEntity(entity, worldState) {
    if (!entity || !entity.name || !entity.type) return null;

    const { actors = [], items = [], skills = [], statRegistry = [] } = worldState;
    const entityName = entity.name.trim();

    switch (entity.type.toLowerCase()) {
      case 'actor':
      case 'character':
        const actorMatch = this.findMatchingActor(entityName, actors);
        if (actorMatch) {
          return {
            ...actorMatch,
            entityType: 'actor',
            matchedEntity: actorMatch.actor
          };
        }
        break;

      case 'item':
      case 'weapon':
      case 'armor':
      case 'equipment':
        const itemMatch = this.findMatchingItem(entityName, items);
        if (itemMatch) {
          return {
            ...itemMatch,
            entityType: 'item',
            matchedEntity: itemMatch.item
          };
        }
        break;

      case 'skill':
      case 'ability':
      case 'power':
        const skillMatch = this.findMatchingSkill(entityName, skills);
        if (skillMatch) {
          return {
            ...skillMatch,
            entityType: 'skill',
            matchedEntity: skillMatch.skill
          };
        }
        break;

      case 'stat':
        const statMatch = this.findMatchingStat(entityName, statRegistry);
        if (statMatch) {
          return {
            ...statMatch,
            entityType: 'stat',
            matchedEntity: statMatch.stat
          };
        }
        break;
    }

    return null;
  }

  /**
   * Detect if an entity represents an upgrade to an existing entity
   * @param {Object} entity - New entity data
   * @param {Object} existingEntity - Existing entity
   * @returns {Object|null} - Upgrade changes or null
   */
  detectUpgrade(entity, existingEntity) {
    if (!entity || !existingEntity) return null;

    const changes = {};
    let hasChanges = false;

    // Check for stat changes (for items/skills)
    if (entity.stats && existingEntity.stats) {
      const statChanges = {};
      for (const [stat, value] of Object.entries(entity.stats)) {
        const existingValue = existingEntity.stats[stat] || 0;
        if (value !== existingValue) {
          statChanges[stat] = value - existingValue;
          hasChanges = true;
        }
      }
      if (Object.keys(statChanges).length > 0) {
        changes.stats = statChanges;
      }
    }

    // Check for description changes
    if (entity.description && existingEntity.desc && 
        entity.description.toLowerCase() !== existingEntity.desc.toLowerCase()) {
      changes.description = entity.description;
      hasChanges = true;
    }

    // Check for type changes
    if (entity.type && existingEntity.type && entity.type !== existingEntity.type) {
      changes.type = entity.type;
      hasChanges = true;
    }

    // Check for rarity changes (items)
    if (entity.rarity && existingEntity.rarity && entity.rarity !== existingEntity.rarity) {
      changes.rarity = entity.rarity;
      hasChanges = true;
    }

    // Check for tier changes (skills)
    if (entity.tier && existingEntity.tier && entity.tier !== existingEntity.tier) {
      changes.tier = entity.tier;
      hasChanges = true;
    }

    return hasChanges ? changes : null;
  }
}

export default new EntityMatchingService();
