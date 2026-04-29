import chapterDataExtractionService from './chapterDataExtractionService';
import db from './database';
import aiService from './aiService';

/**
 * Personnel Analysis Service
 * 
 * @deprecated This service is deprecated. The app now uses timelineEvents table directly.
 * All components (Skill Tree, Relationship Tracker, Personnel) read from timelineEvents.
 * Event extraction is handled by chapterDataExtractionService.extractEventsFromChapter()
 * which is the same proven method used by Master Timeline.
 * 
 * This service is kept for backward compatibility but should not be used for new features.
 * 
 * Migration path:
 * - Use chapterDataExtractionService.extractEventsFromChapter() for event extraction
 * - Save events to timelineEvents table via dataConsistencyService.addTimelineEventSafe()
 * - Query timelineEvents directly in components (filter by type, actorIds, etc.)
 */
class PersonnelAnalysisService {
  constructor() {
    this.analysisCache = new Map();
  }

  /**
   * Analyze a chapter and update all mentioned actors' snapshots
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @param {Array} actors - All available actors
   * @param {string} chapterText - Chapter content
   * @param {Object} chapter - Chapter object (for metadata)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeChapter(bookId, chapterId, actors, chapterText, chapter = {}) {
if (!chapterText || chapterText.trim().length < 50) {
return {
        success: false,
        error: 'Chapter text too short for analysis',
        updatedActors: []
      };
    }

    try {
      // Use Master Timeline's proven extraction system (extractEventsFromChapter)
      // This is the same extraction that works perfectly in Master Timeline
      const timelineEvents = await chapterDataExtractionService.extractEventsFromChapter(
        chapterText,
        chapterId,
        bookId,
        actors
      );
// Convert timeline events to character data format for snapshot building
      const extractedData = this.convertEventsToCharacterData(timelineEvents, actors);
const updatedActors = [];
      const snapKey = `${bookId}_${chapterId}`;

      // Get all unique actors from events
      const actorsInChapter = new Set();
      timelineEvents.forEach(event => {
        if (event.actors && Array.isArray(event.actors)) {
          event.actors.forEach(actorName => {
            if (actorName && typeof actorName === 'string') {
              actorsInChapter.add(actorName);
            }
          });
        }
        if (event.actorIds && Array.isArray(event.actorIds)) {
          event.actorIds.forEach(actorId => {
            const actor = actors.find(a => a.id === actorId);
            if (actor) actorsInChapter.add(actor.name);
          });
        }
      });
// Process each actor mentioned in the chapter
      for (const actorName of actorsInChapter) {
        const actor = actors.find(a => 
          a.name.toLowerCase() === actorName.toLowerCase() ||
          (a.nicknames || []).some(n => n.toLowerCase() === actorName.toLowerCase())
        );

        if (!actor) continue;

        // Get actor's current state
        const currentActor = await db.get('actors', actor.id);
        if (!currentActor) continue;

        // Build snapshot data
        const snapshotData = await this.buildSnapshotData(
          currentActor,
          bookId,
          chapterId,
          extractedData,
          chapterText
        );

        // Update actor snapshot
        await this.updateActorSnapshot(currentActor.id, bookId, chapterId, snapshotData);
updatedActors.push({
          actorId: currentActor.id,
          actorName: currentActor.name,
          snapshot: snapshotData
        });
      }

      // Also process stat changes, skill changes, and relationship changes
      // for actors that might not have been in appearances but had changes
      await this.processStatChanges(extractedData.statChanges || [], actors, bookId, chapterId);
      await this.processSkillChanges(extractedData.skillChanges || [], actors, bookId, chapterId);
      await this.processRelationshipChanges(extractedData.relationshipChanges || [], actors, bookId, chapterId);

      return {
        success: true,
        updatedActors,
        extractedData,
        snapKey,
        timelineEvents // Include original events for reference
      };
    } catch (error) {
      console.error('Error analyzing chapter:', error);
      return {
        success: false,
        error: error.message,
        updatedActors: []
      };
    }
  }

  /**
   * Build snapshot data for an actor at a specific chapter
   * @param {Object} actor - Actor object
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @param {Object} extractedData - Extracted data from chapter
   * @param {string} chapterText - Chapter text
   * @returns {Promise<Object>} Snapshot data
   */
  async buildSnapshotData(actor, bookId, chapterId, extractedData, chapterText) {
    const snapKey = `${bookId}_${chapterId}`;
    const previousSnapshot = actor.snapshots?.[snapKey] || null;

    // Start with previous snapshot or current actor state
    const baseSnapshot = previousSnapshot ? { ...previousSnapshot } : {
      baseStats: { ...(actor.baseStats || {}) },
      additionalStats: { ...(actor.additionalStats || {}) },
      activeSkills: [...(actor.activeSkills || [])],
      inventory: [...(actor.inventory || [])],
      equipment: actor.equipment ? JSON.parse(JSON.stringify(actor.equipment)) : {
        helm: null, cape: null, amulet: null, armour: null,
        gloves: null, belt: null, boots: null,
        leftHand: null, rightHand: null,
        rings: [null, null, null, null, null, null, null],
        charms: [null, null, null, null]
      },
      relationships: {}
    };

    // Apply stat changes for this actor
    const actorStatChanges = (extractedData.statChanges || []).find(
      sc => sc.character?.toLowerCase() === actor.name.toLowerCase()
    );
    if (actorStatChanges && actorStatChanges.changes) {
      Object.entries(actorStatChanges.changes).forEach(([stat, change]) => {
        const value = typeof change === 'number' ? change : parseInt(change) || 0;
        baseSnapshot.baseStats[stat] = (baseSnapshot.baseStats[stat] || 0) + value;
      });
    }

    // Apply skill changes for this actor
    const actorSkillChanges = (extractedData.skillChanges || []).filter(
      sc => sc.character?.toLowerCase() === actor.name.toLowerCase()
    );
    
    for (const skillChange of actorSkillChanges) {
if (skillChange.action === 'gained' || skillChange.action === 'learned') {
        // Add new skill
        const skillId = await this.findSkillId(skillChange.skill);
if (skillId && !baseSnapshot.activeSkills.find(s => 
          (typeof s === 'string' ? s : s.id) === skillId
        )) {
          baseSnapshot.activeSkills.push({
            id: skillId,
            val: skillChange.level || 1
          });
}
      } else if (skillChange.action === 'improved' || skillChange.action === 'mastered') {
        // Upgrade existing skill
        const skillId = await this.findSkillId(skillChange.skill);
        if (skillId) {
          const skillIndex = baseSnapshot.activeSkills.findIndex(s => 
            (typeof s === 'string' ? s : s.id) === skillId
          );
          if (skillIndex >= 0) {
            const currentLevel = typeof baseSnapshot.activeSkills[skillIndex] === 'object' 
              ? baseSnapshot.activeSkills[skillIndex].val || 1
              : 1;
            baseSnapshot.activeSkills[skillIndex] = {
              id: skillId,
              val: Math.max(currentLevel, skillChange.level || currentLevel + 1)
            };
          }
        }
      }
    }

    // Build relationships object (directional)
    if (!baseSnapshot.relationships) {
      baseSnapshot.relationships = {};
    }

    // Process relationship changes for this actor
    const actorRelationshipChanges = (extractedData.relationshipChanges || []).filter(
      rc => rc.character1?.toLowerCase() === actor.name.toLowerCase() ||
            rc.character2?.toLowerCase() === actor.name.toLowerCase()
    );

    for (const relChange of actorRelationshipChanges) {
      const isActor1 = relChange.character1?.toLowerCase() === actor.name.toLowerCase();
      const otherActorName = isActor1 ? relChange.character2 : relChange.character1;
      
      if (otherActorName) {
        const otherActor = await this.findActorByName(otherActorName);
        if (otherActor) {
          // Calculate relationship strength from change description
          const strength = await this.calculateRelationshipStrength(relChange.change);
          const type = this.inferRelationshipType(relChange.change, strength);

          baseSnapshot.relationships[otherActor.id] = {
            strength,
            type,
            notes: relChange.change,
            direction: isActor1 ? 'outgoing' : 'incoming',
            updatedAt: Date.now()
          };
}
      }
    }

    // Add metadata
    baseSnapshot.snapshotTimestamp = Date.now();
    baseSnapshot.bookId = bookId;
    baseSnapshot.chapterId = chapterId;
    baseSnapshot.chapterAnalyzed = true;
    baseSnapshot.chapterLastModified = chapterText ? Date.now() : null;

    return baseSnapshot;
  }

  /**
   * Update actor snapshot
   * @param {string} actorId - Actor ID
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @param {Object} snapshotData - Snapshot data
   */
  async updateActorSnapshot(actorId, bookId, chapterId, snapshotData) {
    const actor = await db.get('actors', actorId);
    if (!actor) {
      throw new Error(`Actor ${actorId} not found`);
    }

    const snapKey = `${bookId}_${chapterId}`;
    
    // Update actor's snapshots property
    if (!actor.snapshots) {
      actor.snapshots = {};
    }

    actor.snapshots[snapKey] = snapshotData;

    // Also update actor's current state to match latest snapshot
    // (for backward compatibility and current view)
    actor.baseStats = { ...snapshotData.baseStats };
    actor.additionalStats = { ...snapshotData.additionalStats };
    actor.activeSkills = [...snapshotData.activeSkills];
    actor.inventory = [...snapshotData.inventory];
    actor.equipment = JSON.parse(JSON.stringify(snapshotData.equipment));

    await db.update('actors', actor);
// Also save to snapshot store (for querying)
    await db.saveSnapshot(actorId, bookId, chapterId, snapshotData);
  }

  /**
   * Get actor snapshot for specific chapter
   * @param {string} actorId - Actor ID
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Object|null>} Snapshot data
   */
  async getActorSnapshot(actorId, bookId, chapterId) {
    const actor = await db.get('actors', actorId);
    if (!actor) return null;

    const snapKey = `${bookId}_${chapterId}`;
    return actor.snapshots?.[snapKey] || null;
  }

  /**
   * Check if chapter needs re-analysis
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @param {Object} chapter - Chapter object
   * @param {Array} actors - All actors
   * @returns {Promise<Object>} Status object
   */
  async checkChapterNeedsReanalysis(bookId, chapterId, chapter, actors) {
    if (!chapter) {
      return { needsReanalysis: false, reason: 'Chapter not found' };
    }

    const chapterText = chapter.script || chapter.content || '';
    const chapterLastModified = chapter.lastUpdated || chapter.updatedAt || 0;

    // Check if any actor has a snapshot for this chapter
    let latestAnalysisTime = 0;
    let analyzedActors = 0;

    for (const actor of actors) {
      const snapshot = actor.snapshots?.[`${bookId}_${chapterId}`];
      if (snapshot && snapshot.chapterAnalyzed) {
        analyzedActors++;
        if (snapshot.snapshotTimestamp > latestAnalysisTime) {
          latestAnalysisTime = snapshot.snapshotTimestamp;
        }
      }
    }

    // If chapter was modified after last analysis, needs re-analysis
    if (chapterLastModified > latestAnalysisTime) {
      return {
        needsReanalysis: true,
        reason: 'Chapter was edited after last analysis',
        lastAnalysis: latestAnalysisTime,
        chapterModified: chapterLastModified
      };
    }

    // If chapter has text but no snapshots, needs analysis
    if (chapterText.length > 50 && analyzedActors === 0) {
      return {
        needsReanalysis: true,
        reason: 'Chapter has not been analyzed',
        lastAnalysis: null
      };
    }

    return {
      needsReanalysis: false,
      lastAnalysis: latestAnalysisTime,
      analyzedActors
    };
  }

  /**
   * Process stat changes for actors
   */
  async processStatChanges(statChanges, actors, bookId, chapterId) {
    for (const statChange of statChanges) {
      const actor = actors.find(a => 
        a.name.toLowerCase() === statChange.character?.toLowerCase()
      );
      if (actor) {
        const snapshot = await this.getActorSnapshot(actor.id, bookId, chapterId);
        if (snapshot && statChange.changes) {
          Object.entries(statChange.changes).forEach(([stat, change]) => {
            const value = typeof change === 'number' ? change : parseInt(change) || 0;
            snapshot.baseStats[stat] = (snapshot.baseStats[stat] || 0) + value;
          });
          await this.updateActorSnapshot(actor.id, bookId, chapterId, snapshot);
        }
      }
    }
  }

  /**
   * Process skill changes for actors
   */
  async processSkillChanges(skillChanges, actors, bookId, chapterId) {
    for (const skillChange of skillChanges) {
      const actor = actors.find(a => 
        a.name.toLowerCase() === skillChange.character?.toLowerCase()
      );
      if (actor) {
        const snapshot = await this.getActorSnapshot(actor.id, bookId, chapterId);
        if (snapshot) {
          // Skill processing is handled in buildSnapshotData
          // This is a fallback for standalone skill changes
        }
      }
    }
  }

  /**
   * Process relationship changes for actors
   */
  async processRelationshipChanges(relationshipChanges, actors, bookId, chapterId) {
    for (const relChange of relationshipChanges) {
      const actor1 = actors.find(a => 
        a.name.toLowerCase() === relChange.character1?.toLowerCase()
      );
      const actor2 = actors.find(a => 
        a.name.toLowerCase() === relChange.character2?.toLowerCase()
      );

      if (actor1 && actor2) {
        // Update both actors' relationship indicators
        const strength = await this.calculateRelationshipStrength(relChange.change);
        const type = this.inferRelationshipType(relChange.change, strength);

        // Update actor1's snapshot
        const snapshot1 = await this.getActorSnapshot(actor1.id, bookId, chapterId);
        if (snapshot1) {
          if (!snapshot1.relationships) snapshot1.relationships = {};
          snapshot1.relationships[actor2.id] = {
            strength,
            type,
            notes: relChange.change,
            direction: 'outgoing',
            updatedAt: Date.now()
          };
          await this.updateActorSnapshot(actor1.id, bookId, chapterId, snapshot1);
        }

        // Update actor2's snapshot
        const snapshot2 = await this.getActorSnapshot(actor2.id, bookId, chapterId);
        if (snapshot2) {
          if (!snapshot2.relationships) snapshot2.relationships = {};
          snapshot2.relationships[actor1.id] = {
            strength: strength, // Could be different from actor1's perspective
            type,
            notes: relChange.change,
            direction: 'incoming',
            updatedAt: Date.now()
          };
          await this.updateActorSnapshot(actor2.id, bookId, chapterId, snapshot2);
        }
      }
    }
  }

  /**
   * Helper: Find skill ID by name
   */
  async findSkillId(skillName) {
    const skills = await db.getAll('skillBank');
    const skill = skills.find(s => 
      s.name?.toLowerCase() === skillName?.toLowerCase()
    );
    return skill?.id || null;
  }

  /**
   * Helper: Find actor by name
   */
  async findActorByName(actorName) {
    const actors = await db.getAll('actors');
    return actors.find(a => 
      a.name?.toLowerCase() === actorName?.toLowerCase() ||
      (a.nicknames || []).some(n => n.toLowerCase() === actorName?.toLowerCase())
    ) || null;
  }

  /**
   * Convert timeline events (from Master Timeline extraction) to character data format
   * This allows us to use the proven Master Timeline extraction system universally
   */
  convertEventsToCharacterData(timelineEvents, actors) {
    const appearances = [];
    const statChanges = [];
    const skillChanges = [];
    const relationshipChanges = [];

    for (const event of timelineEvents) {
      const eventType = event.type || '';
      const actorsInEvent = event.actors || [];
      const description = (event.description || '').toLowerCase();

      // Character appearances
      if (eventType === 'character_appearance' || eventType === 'character_introduction') {
        actorsInEvent.forEach(actorName => {
          if (actorName && typeof actorName === 'string') {
            appearances.push({
              character: actorName,
              firstMention: description.includes('introduced') || description.includes('first') || event.title?.toLowerCase().includes('introduction')
            });
          }
        });
      }

      // Stat changes
      if (eventType === 'stat_change') {
        actorsInEvent.forEach(actorName => {
          // Extract stat changes from description (e.g., "STR increased by 5", "gained +2 VIT")
          const statMatches = description.match(/(\w+)\s*(?:increased|gained|lost|decreased|changed)\s*(?:by|to)?\s*([+-]?\d+)/gi);
          const changes = {};
          
          if (statMatches) {
            statMatches.forEach(match => {
              const parts = match.match(/(\w+)\s*(?:increased|gained|lost|decreased|changed)\s*(?:by|to)?\s*([+-]?\d+)/i);
              if (parts && parts.length >= 3) {
                const stat = parts[1].toUpperCase();
                const value = parseInt(parts[2]) || 0;
                changes[stat] = value;
              }
            });
          } else {
            // Fallback: look for patterns like "+5 STR" or "STR +5"
            const fallbackMatches = description.match(/([+-]?\d+)\s*(\w+)|(\w+)\s*([+-]?\d+)/gi);
            if (fallbackMatches) {
              fallbackMatches.forEach(match => {
                const parts = match.match(/([+-]?\d+)\s*(\w+)|(\w+)\s*([+-]?\d+)/i);
                if (parts) {
                  const stat = (parts[2] || parts[3] || '').toUpperCase();
                  const value = parseInt(parts[1] || parts[4] || '0') || 0;
                  if (stat && value !== 0) {
                    changes[stat] = value;
                  }
                }
              });
            }
          }

          if (Object.keys(changes).length > 0) {
            statChanges.push({
              character: actorName,
              changes
            });
          }
        });
      }

      // Skill events
      if (eventType === 'skill_event') {
        actorsInEvent.forEach(actorName => {
          if (!actorName || typeof actorName !== 'string') return;
          
          // Extract skill name from title or description
          // Patterns: "Actor Learns Skill", "Actor learned Skill", "Actor gained Skill skill"
          const title = event.title || '';
          const desc = event.description || '';
          const fullText = `${title} ${desc}`.toLowerCase();
          
          // Try multiple patterns
          let skillName = null;
          let action = 'gained';
          let level = 1;
          
          // Pattern 1: "Actor learns/gains/mastered Skill"
          const pattern1 = new RegExp(`${actorName.toLowerCase()}\\s+(?:learns?|gains?|mastered|improved|perfected)\\s+(.+?)(?:\\s+skill)?(?:\\s|$|,|\\.)`, 'i');
          const match1 = fullText.match(pattern1);
          if (match1 && match1[1]) {
            skillName = match1[1].trim();
          }
          
          // Pattern 2: "Learned Skill" or "Gained Skill" (without actor name)
          if (!skillName) {
            const pattern2 = /(?:learns?|gains?|mastered|improved|perfected)\s+(.+?)(?:\s+skill)?(?:\s|$|,|\.)/i;
            const match2 = fullText.match(pattern2);
            if (match2 && match2[1]) {
              skillName = match2[1].trim();
            }
          }
          
          // Pattern 3: Look for skill name directly in title (e.g., "Fireball" in "Grimguff Learns Fireball")
          if (!skillName && title) {
            // Remove actor name and action words, what's left might be skill
            const cleaned = title
              .replace(new RegExp(actorName, 'gi'), '')
              .replace(/(?:learns?|gains?|mastered|improved|perfected|skill)/gi, '')
              .trim();
            if (cleaned && cleaned.length > 2) {
              skillName = cleaned;
            }
          }
          
          if (skillName) {
            // Determine action and level from context
            if (fullText.includes('mastered') || fullText.includes('perfected') || fullText.includes('expert')) {
              action = 'mastered';
              level = 5;
            } else if (fullText.includes('improved') || fullText.includes('better') || fullText.includes('advanced')) {
              action = 'improved';
              level = 2;
            } else if (fullText.includes('learned') || fullText.includes('gained') || fullText.includes('acquired')) {
              action = 'gained';
              level = 1;
            }

            skillChanges.push({
              character: actorName,
              action,
              skill: skillName,
              level,
              context: event.description || event.title
            });
}
        });
      }

      // Relationship changes
      if (eventType === 'relationship_change') {
        if (actorsInEvent.length >= 2) {
          const char1 = actorsInEvent[0];
          const char2 = actorsInEvent[1];
          if (char1 && char2 && typeof char1 === 'string' && typeof char2 === 'string') {
            relationshipChanges.push({
              character1: char1,
              character2: char2,
              change: event.description || event.title
            });
}
        }
      }
    }
return {
      appearances,
      statChanges,
      skillChanges,
      relationshipChanges
    };
  }

  /**
   * Calculate relationship strength from change description
   */
  async calculateRelationshipStrength(changeDescription) {
    if (!changeDescription) return 0;

    const description = changeDescription.toLowerCase();
    
    // Use AI to calculate strength if available, otherwise use keyword matching
    try {
      const prompt = `Analyze this relationship change description and return a strength value from -100 to 100:
      -100 = extremely hostile/enemy
      0 = neutral/stranger
      +100 = extremely close/allied
      
      Description: "${changeDescription}"
      
      Return only a number between -100 and 100.`;
      
      const response = await aiService.callAI(prompt, 'text');
      const strength = parseInt(response.trim());
      if (!isNaN(strength) && strength >= -100 && strength <= 100) {
        return strength;
      }
    } catch (error) {
      console.warn('AI strength calculation failed, using keyword matching:', error);
    }

    // Fallback: keyword matching
    const positiveKeywords = ['friend', 'ally', 'love', 'trust', 'respect', 'close', 'partner', 'companion', 'help', 'save'];
    const negativeKeywords = ['enemy', 'hate', 'hostile', 'rival', 'betray', 'conflict', 'anger', 'fear', 'attack', 'hurt'];
    
    const positiveCount = positiveKeywords.filter(k => description.includes(k)).length;
    const negativeCount = negativeKeywords.filter(k => description.includes(k)).length;

    if (positiveCount > negativeCount) {
      return 30 + (positiveCount * 15); // 30-90
    } else if (negativeCount > positiveCount) {
      return -90 + (negativeCount * 15); // -90 to -30
    }
    
    return 0; // Neutral
  }

  /**
   * Infer relationship type from change and strength
   */
  inferRelationshipType(changeDescription, strength) {
    if (strength >= 60) return 'allied';
    if (strength >= 20) return 'friendly';
    if (strength >= -20) return 'neutral';
    if (strength >= -60) return 'tense';
    return 'hostile';
  }
}

// Export singleton instance
const personnelAnalysisService = new PersonnelAnalysisService();
export default personnelAnalysisService;
