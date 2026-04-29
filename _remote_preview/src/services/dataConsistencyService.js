/**
 * Data Consistency Service
 * Ensures all data storage is consistent, prevents duplicates, and provides single source of truth
 */

import db from './database';
import contextEngine from './contextEngine';

class DataConsistencyService {
  constructor() {
    this.cache = new Map();
    this.thresholds = this._loadThresholdConfig();
  }

  _loadThresholdConfig() {
    const defaults = {
      plotBeatSimilarity: 0.93,
      timelineTitleSimilarity: 0.9,
      timelineCombinedTitleSimilarity: 0.82,
      timelineDescriptionSimilarity: 0.88,
      locationSimilarity: 0.94,
      nodeSimilarity: 0.94
    };
    try {
      const raw = localStorage.getItem('consistency_thresholds');
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    } catch (error) {
      console.warn('Invalid threshold config, falling back to defaults:', error);
      return defaults;
    }
  }

  setThresholdConfig(config = {}) {
    this.thresholds = { ...this.thresholds, ...config };
    localStorage.setItem('consistency_thresholds', JSON.stringify(this.thresholds));
  }

  /**
   * Check if a plot beat already exists (by content similarity and chapter)
   */
  async findExistingPlotBeat(beatData) {
    try {
      const allBeats = await contextEngine.getPlotBeats();
      const beatText = (beatData.beat || '').toLowerCase().trim();
      const targetChapter = beatData.targetChapter || beatData.chapter;
      
      // Check for exact or very similar beats
      const existing = allBeats.find(b => {
        const existingText = (b.beat || '').toLowerCase().trim();
        const existingChapter = b.targetChapter || b.chapter;
        
        // Exact match on text and chapter
        if (existingText === beatText && existingChapter === targetChapter) {
          return true;
        }
        
        // Similarity check (if texts are very similar and same chapter)
        if (targetChapter && existingChapter === targetChapter) {
          const similarity = this._calculateSimilarity(existingText, beatText);
          if (similarity > this.thresholds.plotBeatSimilarity) {
            return true;
          }
        }
      });
      
      return existing || null;
    } catch (error) {
      console.error('Error finding existing plot beat:', error);
      return null;
    }
  }

  /**
   * Add plot beat with duplicate checking
   */
  async addPlotBeatSafe(beatData) {
    const existing = await this.findExistingPlotBeat(beatData);
    if (existing) {
      // Update existing beat if new data has more info
      const updated = {
        ...existing,
        ...beatData,
        id: existing.id, // Keep original ID
        updatedAt: Date.now()
      };
      await contextEngine.addPlotBeat(updated);
      return updated;
    }
    return await contextEngine.addPlotBeat(beatData);
  }

  /**
   * Check if a timeline event already exists
   */
  async findExistingTimelineEvent(eventData) {
    try {
      const allEvents = await db.getAll('timelineEvents');
      const eventTitle = (eventData.title || '').toLowerCase().trim();
      const eventDesc = (eventData.description || '').toLowerCase().trim();
      const chapterId = eventData.chapterId;
      const bookId = eventData.bookId;
      
      const existing = allEvents.find(e => {
        const existingTitle = (e.title || '').toLowerCase().trim();
        const existingDesc = (e.description || '').toLowerCase().trim();
        const existingChapter = e.chapterId;
        const existingBook = e.bookId;
        
        // Exact match on title and chapter
        if (existingTitle === eventTitle && existingChapter === chapterId && existingBook === bookId) {
          return true;
        }
        
        // Similarity check for same chapter
        if (chapterId && existingChapter === chapterId && bookId && existingBook === bookId) {
          const titleSimilarity = this._calculateSimilarity(existingTitle, eventTitle);
          const descSimilarity = this._calculateSimilarity(existingDesc, eventDesc);
          if (
            titleSimilarity > this.thresholds.timelineTitleSimilarity ||
            (
              titleSimilarity > this.thresholds.timelineCombinedTitleSimilarity &&
              descSimilarity > this.thresholds.timelineDescriptionSimilarity
            )
          ) {
            return true;
          }
        }
      });
      
      return existing || null;
    } catch (error) {
      console.error('Error finding existing timeline event:', error);
      return null;
    }
  }

  /**
   * Add timeline event with duplicate checking
   */
  async addTimelineEventSafe(eventData) {
    const existing = await this.findExistingTimelineEvent(eventData);
    if (existing) {
      // Merge data, keeping original ID
      const updated = {
        ...existing,
        ...eventData,
        id: existing.id,
        updatedAt: Date.now()
      };
      await db.update('timelineEvents', updated);
      return updated;
    }
    
    // Ensure event has required fields
    if (!eventData.id) {
      eventData.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    try {
      await db.add('timelineEvents', eventData);
      return eventData;
    } catch (error) {
      // If add fails (duplicate ID), try update
      await db.update('timelineEvents', eventData);
      return eventData;
    }
  }

  /**
   * Find existing location by name
   */
  async findExistingLocation(locationName) {
    try {
      const allLocations = await db.getAll('locations');
      const searchName = (locationName || '').toLowerCase().trim();
      
      return allLocations.find(loc => {
        const locName = (loc.name || '').toLowerCase().trim();
        return locName === searchName || this._calculateSimilarity(locName, searchName) > this.thresholds.locationSimilarity;
      }) || null;
    } catch (error) {
      console.error('Error finding existing location:', error);
      return null;
    }
  }

  /**
   * Add location with duplicate checking
   */
  async addLocationSafe(locationData) {
    const existing = await this.findExistingLocation(locationData.name);
    if (existing) {
      // Update existing location, merge chapter appearances
      const updated = {
        ...existing,
        ...locationData,
        id: existing.id, // Keep original ID
        updatedAt: Date.now()
      };
      
      // Merge firstAppearance if new one is earlier
      if (locationData.firstAppearance && existing.firstAppearance) {
        // Keep the earlier appearance
        if (!existing.firstAppearance.chapterId || 
            (locationData.firstAppearance.chapterId && 
             locationData.firstAppearance.chapterId < existing.firstAppearance.chapterId)) {
          updated.firstAppearance = locationData.firstAppearance;
        }
      }
      
      await db.update('locations', updated);
      return updated;
    }
    
    // Create new location
    if (!locationData.id) {
      locationData.id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    try {
      await db.add('locations', locationData);
      return locationData;
    } catch (error) {
      await db.update('locations', locationData);
      return locationData;
    }
  }

  /**
   * Find existing character travel record
   */
  async findExistingTravel(travelData) {
    try {
      const allTravel = await db.getAll('characterTravel');
      const fromId = travelData.fromLocationId;
      const toId = travelData.toLocationId;
      const actorId = travelData.actorId;
      const chapterId = travelData.chapterId;
      
      return allTravel.find(t => 
        t.fromLocationId === fromId &&
        t.toLocationId === toId &&
        t.actorId === actorId &&
        t.chapterId === chapterId
      ) || null;
    } catch (error) {
      console.error('Error finding existing travel:', error);
      return null;
    }
  }

  /**
   * Add character travel with duplicate checking
   */
  async addTravelSafe(travelData) {
    const existing = await this.findExistingTravel(travelData);
    if (existing) {
      return existing; // Don't duplicate travel records
    }
    
    if (!travelData.id) {
      travelData.id = `travel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    try {
      await db.add('characterTravel', travelData);
      return travelData;
    } catch (error) {
      await db.update('characterTravel', travelData);
      return travelData;
    }
  }

  /**
   * Find existing mind map node
   */
  async findExistingMindMapNode(nodeData) {
    try {
      const allNodes = await db.getAll('mindMapNodes');
      const nodeId = nodeData.entityId || nodeData.id;
      const nodeLabel = (nodeData.label || nodeData.name || '').toLowerCase().trim();
      
      // Check by entityId first (most reliable)
      if (nodeId) {
        const byEntityId = allNodes.find(n => n.entityId === nodeId || n.id === nodeId);
        if (byEntityId) return byEntityId;
      }
      
      // Check by label similarity
      if (nodeLabel) {
        const byLabel = allNodes.find(n => {
          const existingLabel = ((n.label || n.name || '')).toLowerCase().trim();
          return existingLabel === nodeLabel || this._calculateSimilarity(existingLabel, nodeLabel) > this.thresholds.nodeSimilarity;
        });
        if (byLabel) return byLabel;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing mind map node:', error);
      return null;
    }
  }

  /**
   * Add mind map node with duplicate checking
   */
  async addMindMapNodeSafe(nodeData) {
    const existing = await this.findExistingMindMapNode(nodeData);
    if (existing) {
      // Merge data, update chapter appearances
      const updated = {
        ...existing,
        ...nodeData,
        id: existing.id
      };
      
      // Merge chapter appearances
      if (nodeData.chapterAppearances && Array.isArray(nodeData.chapterAppearances)) {
        const existingAppearances = existing.chapterAppearances || [];
        const merged = [...existingAppearances];
        nodeData.chapterAppearances.forEach(ca => {
          if (!merged.find(ea => ea.chapterId === ca.chapterId)) {
            merged.push(ca);
          }
        });
        updated.chapterAppearances = merged;
      }
      
      await db.update('mindMapNodes', updated);
      return updated;
    }
    
    if (!nodeData.id) {
      nodeData.id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    try {
      await db.add('mindMapNodes', nodeData);
      return nodeData;
    } catch (error) {
      await db.update('mindMapNodes', nodeData);
      return nodeData;
    }
  }

  /**
   * Find existing mind map edge
   */
  async findExistingMindMapEdge(edgeData) {
    try {
      const allEdges = await db.getAll('mindMapEdges');
      const source = edgeData.source;
      const target = edgeData.target;
      const type = edgeData.type;
      
      return allEdges.find(e => 
        e.source === source &&
        e.target === target &&
        e.type === type
      ) || null;
    } catch (error) {
      console.error('Error finding existing mind map edge:', error);
      return null;
    }
  }

  /**
   * Add mind map edge with duplicate checking
   */
  async addMindMapEdgeSafe(edgeData) {
    const existing = await this.findExistingMindMapEdge(edgeData);
    if (existing) {
      // Merge chapter context
      const updated = {
        ...existing,
        ...edgeData,
        id: existing.id
      };
      
      if (edgeData.chapterContext && Array.isArray(edgeData.chapterContext)) {
        const existingContext = existing.chapterContext || [];
        const merged = [...existingContext];
        edgeData.chapterContext.forEach(cc => {
          if (!merged.find(ec => ec.chapterId === cc.chapterId)) {
            merged.push(cc);
          }
        });
        updated.chapterContext = merged;
      }
      
      // Update strength if new one is higher
      if (edgeData.strength && (!existing.strength || edgeData.strength > existing.strength)) {
        updated.strength = edgeData.strength;
      }
      
      await db.update('mindMapEdges', updated);
      return updated;
    }
    
    if (!edgeData.id) {
      edgeData.id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    try {
      await db.add('mindMapEdges', edgeData);
      return edgeData;
    } catch (error) {
      await db.update('mindMapEdges', edgeData);
      return edgeData;
    }
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  _calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    // Simple substring check
    if (longer.includes(shorter)) return 0.8;
    
    // Levenshtein distance
    const distance = this._levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  _levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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
    return matrix[str2.length][str1.length];
  }

  /**
   * Get all data sources (for verification)
   */
  async getAllDataSources() {
    return {
      plotBeats: await contextEngine.getPlotBeats(),
      timelineEvents: await db.getAll('timelineEvents'),
      locations: await db.getAll('locations'),
      characterTravel: await db.getAll('characterTravel'),
      mindMapNodes: await db.getAll('mindMapNodes'),
      mindMapEdges: await db.getAll('mindMapEdges'),
      actors: await db.getAll('actors'),
      books: await db.getAll('books'),
      items: await db.getAll('itemBank'),
      skills: await db.getAll('skillBank')
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

const dataConsistencyService = new DataConsistencyService();
export default dataConsistencyService;
