/**
 * Integration Service
 * Routes extracted entities to all target systems:
 * Timeline, Plot Threads, Character Arcs, Relationships, Wiki, Mind Map, UK Map
 */

import db from './database';

class IntegrationService {
  constructor() {
    this.pendingIntegrations = [];
  }

  /**
   * Route a single extraction to appropriate systems
   */
  async routeExtraction(entity, chapterId, bookId) {
    const integrations = [];
    const timestamp = Date.now();

    // Common integration for all entities
    integrations.push({
      system: 'timeline',
      action: 'add_event',
      data: this.createTimelineEvent(entity, chapterId, bookId, timestamp)
    });

    integrations.push({
      system: 'mindMap',
      action: 'add_node',
      data: this.createMindMapNode(entity, chapterId)
    });

    // Type-specific integrations
    switch (entity.type) {
      case 'actor':
        integrations.push({
          system: 'characterArcs',
          action: 'update',
          data: this.createCharacterArcUpdate(entity, chapterId, bookId)
        });
        integrations.push({
          system: 'wiki',
          action: 'create_or_update',
          data: this.createWikiEntry(entity, 'actor', chapterId, bookId)
        });
        break;

      case 'stat_change':
      case 'actor-update':
        integrations.push({
          system: 'characterArcs',
          action: 'update_stats',
          data: this.createStatChangeUpdate(entity, chapterId, bookId)
        });
        integrations.push({
          system: 'timeline',
          action: 'add_stat_event',
          data: this.createStatTimelineEvent(entity, chapterId, bookId, timestamp)
        });
        break;

      case 'item':
        integrations.push({
          system: 'wiki',
          action: 'create_or_update',
          data: this.createWikiEntry(entity, 'item', chapterId, bookId)
        });
        break;

      case 'skill':
        integrations.push({
          system: 'wiki',
          action: 'create_or_update',
          data: this.createWikiEntry(entity, 'skill', chapterId, bookId)
        });
        break;

      case 'location':
        integrations.push({
          system: 'ukMap',
          action: 'add_marker',
          data: this.createLocationMarker(entity, chapterId, bookId)
        });
        integrations.push({
          system: 'wiki',
          action: 'create_location',
          data: this.createWikiEntry(entity, 'location', chapterId, bookId)
        });
        break;

      case 'inventory':
        integrations.push({
          system: 'characterArcs',
          action: 'update_inventory',
          data: this.createInventoryUpdate(entity, chapterId, bookId)
        });
        break;

      case 'relationship':
        integrations.push({
          system: 'relationships',
          action: 'create_or_update',
          data: this.createRelationshipUpdate(entity, chapterId, bookId)
        });
        integrations.push({
          system: 'mindMap',
          action: 'add_edge',
          data: this.createRelationshipEdge(entity, chapterId)
        });
        break;

      case 'event':
        integrations.push({
          system: 'plotThreads',
          action: 'add_event',
          data: this.createPlotEvent(entity, chapterId, bookId)
        });
        integrations.push({
          system: 'wiki',
          action: 'create_event',
          data: this.createWikiEntry(entity, 'event', chapterId, bookId)
        });
        break;

      case 'quest':
        integrations.push({
          system: 'plotQuests',
          action: 'create_or_update',
          data: {
            id: entity.id || `pq_${Date.now()}`,
            title: entity.data?.title || entity.name,
            description: entity.data?.description || '',
            type: entity.data?.type || 'sub',
            status: entity.data?.status || 'active',
            objectives: entity.data?.objectives || [],
            chapterId, bookId,
            createdAt: Date.now()
          }
        });
        break;

      case 'faction':
        integrations.push({
          system: 'factions',
          action: 'create_or_update',
          data: {
            id: entity.id || `fac_${Date.now()}`,
            name: entity.data?.name || entity.name,
            type: entity.data?.type || 'organization',
            description: entity.data?.description || '',
            members: entity.data?.members || [],
            goals: entity.data?.goals || '',
            status: 'active',
            chapterId, bookId,
            createdAt: Date.now()
          }
        });
        break;

      default:
        // Generic wiki entry for unknown types
        integrations.push({
          system: 'wiki',
          action: 'create_or_update',
          data: this.createWikiEntry(entity, entity.type, chapterId, bookId)
        });
    }

    // Check for travel/location changes
    if (entity.data?.location || entity.data?.toLocation) {
      integrations.push({
        system: 'ukMap',
        action: 'add_travel',
        data: this.createTravelRecord(entity, chapterId, bookId, timestamp)
      });
    }

    return integrations;
  }

  /**
   * Generate preview of all integrations for multiple extractions
   */
  async generatePreview(extractions, chapterId, bookId) {
    const preview = {
      timeline: [],
      characterArcs: [],
      plotThreads: [],
      relationships: [],
      wiki: [],
      mindMap: { nodes: [], edges: [] },
      ukMap: { locations: [], travel: [] },
      summary: {
        totalEntities: extractions.length,
        timelineEvents: 0,
        wikiEntries: 0,
        characterUpdates: 0,
        locationMarkers: 0,
        mindMapNodes: 0,
        mindMapEdges: 0
      }
    };

    for (const extraction of extractions) {
      const integrations = await this.routeExtraction(extraction, chapterId, bookId);

      for (const integration of integrations) {
        switch (integration.system) {
          case 'timeline':
            preview.timeline.push(integration.data);
            preview.summary.timelineEvents++;
            break;

          case 'characterArcs':
            preview.characterArcs.push(integration.data);
            preview.summary.characterUpdates++;
            break;

          case 'plotThreads':
            preview.plotThreads.push(integration.data);
            break;

          case 'relationships':
            preview.relationships.push(integration.data);
            break;

          case 'wiki':
            preview.wiki.push(integration.data);
            preview.summary.wikiEntries++;
            break;

          case 'mindMap':
            if (integration.action === 'add_node') {
              preview.mindMap.nodes.push(integration.data);
              preview.summary.mindMapNodes++;
            } else if (integration.action === 'add_edge') {
              preview.mindMap.edges.push(integration.data);
              preview.summary.mindMapEdges++;
            }
            break;

          case 'ukMap':
            if (integration.action === 'add_marker') {
              preview.ukMap.locations.push(integration.data);
              preview.summary.locationMarkers++;
            } else if (integration.action === 'add_travel') {
              preview.ukMap.travel.push(integration.data);
            }
            break;

          case 'plotQuests':
            if (!preview.quests) preview.quests = [];
            preview.quests.push(integration.data);
            break;

          case 'factions':
            if (!preview.factions) preview.factions = [];
            preview.factions.push(integration.data);
            break;
        }
      }
    }

    // Detect potential plot threads from events
    preview.suggestedPlotThreads = await this.detectPlotThreads(preview.timeline, extractions);

    return preview;
  }

  /**
   * Apply all integrations from a preview
   */
  async applyAllIntegrations(preview, options = {}) {
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    const { 
      skipTimeline = false,
      skipWiki = false,
      skipCharacterArcs = false,
      skipMindMap = false,
      skipUKMap = false,
      skipPlotThreads = false,
      skipRelationships = false
    } = options;

    try {
      // Apply timeline events
      if (!skipTimeline) {
        for (const event of preview.timeline) {
          try {
            await db.add('timelineEvents', event);
            results.success.push({ system: 'timeline', id: event.id });
          } catch (error) {
            // Try update if add fails (already exists)
            try {
              await db.update('timelineEvents', event);
              results.success.push({ system: 'timeline', id: event.id, action: 'updated' });
            } catch (e) {
              results.failed.push({ system: 'timeline', id: event.id, error: e.message });
            }
          }
        }
      }

      // Apply wiki entries
      if (!skipWiki) {
        for (const entry of preview.wiki) {
          try {
            const existing = await this.findExistingWikiEntry(entry);
            if (existing) {
              // Merge with existing entry
              const merged = this.mergeWikiEntries(existing, entry);
              await db.update('wikiEntries', merged);
              results.success.push({ system: 'wiki', id: entry.id, action: 'merged' });
            } else {
              await db.add('wikiEntries', entry);
              results.success.push({ system: 'wiki', id: entry.id });
            }
          } catch (error) {
            results.failed.push({ system: 'wiki', id: entry.id, error: error.message });
          }
        }
      }

      // Apply character arc updates
      if (!skipCharacterArcs) {
        for (const update of preview.characterArcs) {
          try {
            await this.applyCharacterArcUpdate(update);
            results.success.push({ system: 'characterArcs', id: update.actorId });
          } catch (error) {
            results.failed.push({ system: 'characterArcs', id: update.actorId, error: error.message });
          }
        }
      }

      // Apply mind map nodes and edges
      if (!skipMindMap) {
        for (const node of preview.mindMap.nodes) {
          try {
            const existingNodes = await db.getAll('mindMapNodes');
            const exists = existingNodes.find(n => n.entityId === node.entityId);
            if (!exists) {
              await db.add('mindMapNodes', node);
              results.success.push({ system: 'mindMap', id: node.id, type: 'node' });
            } else {
              results.skipped.push({ system: 'mindMap', id: node.id, reason: 'already exists' });
            }
          } catch (error) {
            results.failed.push({ system: 'mindMap', id: node.id, error: error.message });
          }
        }

        for (const edge of preview.mindMap.edges) {
          try {
            await db.add('mindMapEdges', edge);
            results.success.push({ system: 'mindMap', id: edge.id, type: 'edge' });
          } catch (error) {
            results.failed.push({ system: 'mindMap', id: edge.id, error: error.message });
          }
        }
      }

      // Apply UK map locations and travel
      if (!skipUKMap) {
        for (const location of preview.ukMap.locations) {
          try {
            const existingLocations = await db.getAll('locations');
            const exists = existingLocations.find(l => 
              l.name.toLowerCase() === location.name.toLowerCase()
            );
            if (!exists) {
              await db.add('locations', location);
              results.success.push({ system: 'ukMap', id: location.id, type: 'location' });
            } else {
              // Update existing location with new events
              exists.events = [...new Set([...(exists.events || []), ...(location.events || [])])];
              exists.charactersVisited = [...new Set([...(exists.charactersVisited || []), ...(location.charactersVisited || [])])];
              await db.update('locations', exists);
              results.success.push({ system: 'ukMap', id: exists.id, type: 'location', action: 'updated' });
            }
          } catch (error) {
            results.failed.push({ system: 'ukMap', id: location.id, error: error.message });
          }
        }

        for (const travel of preview.ukMap.travel) {
          try {
            await db.add('characterTravel', travel);
            results.success.push({ system: 'ukMap', id: travel.id, type: 'travel' });
          } catch (error) {
            results.failed.push({ system: 'ukMap', id: travel.id, error: error.message });
          }
        }
      }

      // Apply plot thread suggestions
      if (!skipPlotThreads && preview.suggestedPlotThreads) {
        for (const thread of preview.suggestedPlotThreads) {
          if (thread.approved) {
            try {
              await this.applyPlotThread(thread);
              results.success.push({ system: 'plotThreads', id: thread.id });
            } catch (error) {
              results.failed.push({ system: 'plotThreads', id: thread.id, error: error.message });
            }
          }
        }
      }

      // Apply quests
      if (preview.quests) {
        for (const quest of preview.quests) {
          try {
            await db.add('plotQuests', quest);
            results.success.push({ system: 'plotQuests', id: quest.id });
          } catch (error) {
            try {
              await db.update('plotQuests', quest);
              results.success.push({ system: 'plotQuests', id: quest.id, action: 'updated' });
            } catch (e) {
              results.failed.push({ system: 'plotQuests', id: quest.id, error: e.message });
            }
          }
        }
      }

      // Apply factions
      if (preview.factions) {
        for (const faction of preview.factions) {
          try {
            await db.add('factions', faction);
            results.success.push({ system: 'factions', id: faction.id });
          } catch (error) {
            try {
              await db.update('factions', faction);
              results.success.push({ system: 'factions', id: faction.id, action: 'updated' });
            } catch (e) {
              results.failed.push({ system: 'factions', id: faction.id, error: e.message });
            }
          }
        }
      }

      // Apply relationships
      if (!skipRelationships) {
        for (const rel of preview.relationships) {
          try {
            await db.add('relationships', rel);
            results.success.push({ system: 'relationships', id: rel.id });
          } catch (error) {
            try {
              await db.update('relationships', rel);
              results.success.push({ system: 'relationships', id: rel.id, action: 'updated' });
            } catch (e) {
              results.failed.push({ system: 'relationships', id: rel.id, error: e.message });
            }
          }
        }
      }

    } catch (error) {
      console.error('Error applying integrations:', error);
      results.error = error.message;
    }

    return results;
  }

  // ==================== Data Creation Methods ====================

  createTimelineEvent(entity, chapterId, bookId, timestamp) {
    return {
      id: `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapEntityTypeToEventType(entity.type),
      title: this.generateEventTitle(entity),
      description: entity.data?.description || entity.sourceContext || '',
      bookId,
      chapterId,
      actors: this.extractActorIds(entity),
      items: this.extractItemIds(entity),
      locations: this.extractLocationIds(entity),
      skills: this.extractSkillIds(entity),
      timestamp,
      entityType: entity.type,
      entityId: entity.id,
      plotThreads: [],
      importance: entity.confidence || 0.5
    };
  }

  createStatTimelineEvent(entity, chapterId, bookId, timestamp) {
    const statChanges = entity.data?.stats || entity.data?.changes?.stats || {};
    const actorName = entity.data?.actorName || entity.data?.characterName || 'Unknown';
    
    return {
      id: `evt_stat_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'stat_change',
      title: `${actorName} - Stat Change`,
      description: Object.entries(statChanges).map(([stat, val]) => 
        `${stat}: ${val >= 0 ? '+' : ''}${val}`
      ).join(', '),
      bookId,
      chapterId,
      actors: [actorName],
      statChanges,
      timestamp,
      importance: 0.6
    };
  }

  createMindMapNode(entity, chapterId) {
    const name = entity.data?.name || entity.data?.title || entity.data?.actorName || 'Unknown';
    
    return {
      id: `node_${entity.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId: entity.id || `entity_${Date.now()}`,
      entityType: entity.type,
      type: this.mapToMindMapNodeType(entity.type),
      label: name,
      group: this.determineNodeGroup(entity),
      size: this.calculateNodeSize(entity),
      x: Math.random() * 800, // Initial random position
      y: Math.random() * 600,
      metadata: {
        ...entity.data,
        sourceContext: entity.sourceContext,
        confidence: entity.confidence,
        chapterId
      }
    };
  }

  createRelationshipEdge(entity, chapterId) {
    return {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: `node_actor_${entity.data?.actor1Name?.toLowerCase().replace(/\s/g, '_')}`,
      target: `node_actor_${entity.data?.actor2Name?.toLowerCase().replace(/\s/g, '_')}`,
      type: entity.data?.type || 'related',
      label: entity.data?.description || entity.data?.type || 'Related',
      chapterId,
      strength: entity.data?.strength || 0.5,
      timestamp: Date.now()
    };
  }

  createCharacterArcUpdate(entity, chapterId, bookId) {
    return {
      actorId: entity.data?.id || entity.id,
      actorName: entity.data?.name,
      chapterId,
      bookId,
      timestamp: Date.now(),
      type: 'appearance',
      description: entity.data?.description || '',
      stats: entity.data?.stats,
      emotionalState: this.inferEmotionalState(entity),
      goals: entity.data?.goals || [],
      relationships: []
    };
  }

  createStatChangeUpdate(entity, chapterId, bookId) {
    return {
      actorId: null, // Will be resolved by name
      actorName: entity.data?.actorName || entity.data?.characterName,
      chapterId,
      bookId,
      timestamp: Date.now(),
      type: 'stat_change',
      statChanges: entity.data?.stats || entity.data?.changes?.stats || {},
      description: entity.sourceContext || ''
    };
  }

  createInventoryUpdate(entity, chapterId, bookId) {
    return {
      actorName: entity.data?.actorName,
      itemName: entity.data?.itemName,
      action: entity.data?.action, // 'pickup', 'drop', 'equip'
      chapterId,
      bookId,
      timestamp: Date.now()
    };
  }

  createRelationshipUpdate(entity, chapterId, bookId) {
    return {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actors: [entity.data?.actor1Name, entity.data?.actor2Name].filter(Boolean),
      actor1Name: entity.data?.actor1Name,
      actor2Name: entity.data?.actor2Name,
      type: entity.data?.type || 'neutral',
      strength: entity.data?.strength || 0.5,
      description: entity.data?.description || '',
      chapterId,
      bookId,
      timestamp: Date.now(),
      events: [{
        chapterId,
        description: entity.sourceContext || entity.data?.description || ''
      }]
    };
  }

  createLocationMarker(entity, chapterId, bookId) {
    const name = entity.data?.name || 'Unknown Location';
    const coords = this.getUKCoordinates(name);
    
    return {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      coordinates: coords.svg,
      realCoords: coords.real,
      type: entity.data?.type || 'location',
      description: entity.data?.description || '',
      events: [],
      charactersVisited: this.extractActorNames(entity),
      firstAppearance: { bookId, chapterId },
      lastAppearance: { bookId, chapterId },
      createdAt: Date.now()
    };
  }

  createTravelRecord(entity, chapterId, bookId, timestamp) {
    return {
      id: `travel_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      actorId: entity.data?.actorId,
      actorName: entity.data?.actorName || entity.data?.characterName,
      fromLocation: entity.data?.fromLocation,
      toLocation: entity.data?.toLocation || entity.data?.location,
      chapterId,
      bookId,
      timestamp,
      description: entity.sourceContext || ''
    };
  }

  createPlotEvent(entity, chapterId, bookId) {
    return {
      id: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: entity.data?.name || entity.data?.title || 'Event',
      description: entity.data?.description || '',
      participants: entity.data?.participants || this.extractActorNames(entity),
      chapterId,
      bookId,
      timestamp: Date.now(),
      type: 'milestone',
      consequences: entity.data?.consequences || []
    };
  }

  createWikiEntry(entity, entityType, chapterId, bookId) {
    const name = entity.data?.name || entity.data?.title || entity.data?.actorName || 'Unknown';
    
    const baseEntry = {
      id: `wiki_${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId: entity.id,
      title: name,
      content: this.generateWikiContent(entity, entityType),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      firstAppearance: { bookId, chapterId },
      appearances: [{ bookId, chapterId, context: entity.sourceContext }],
      relatedEntities: this.extractRelatedEntities(entity),
      tags: this.generateWikiTags(entity, entityType)
    };

    // Add type-specific fields
    switch (entityType) {
      case 'actor':
        baseEntry.sections = {
          overview: entity.data?.description || '',
          statsHistory: [{ chapterId, stats: entity.data?.stats || {} }],
          inventory: [],
          relationships: [],
          locationsVisited: [],
          chapterAppearances: [chapterId],
          characterArc: {
            emotionalStates: [this.inferEmotionalState(entity)],
            goals: entity.data?.goals || [],
            conflicts: []
          }
        };
        baseEntry.class = entity.data?.class;
        baseEntry.role = entity.data?.role;
        break;

      case 'location':
        baseEntry.sections = {
          overview: entity.data?.description || '',
          events: [],
          visitors: this.extractActorNames(entity),
          timeline: []
        };
        baseEntry.coordinates = this.getUKCoordinates(name);
        break;

      case 'item':
        baseEntry.sections = {
          overview: entity.data?.description || '',
          stats: entity.data?.stats || {},
          owners: [],
          acquisitionEvents: [{ chapterId, context: entity.sourceContext }]
        };
        baseEntry.itemType = entity.data?.type;
        baseEntry.rarity = entity.data?.rarity;
        break;

      case 'skill':
        baseEntry.sections = {
          overview: entity.data?.description || '',
          statModifiers: entity.data?.statMod || {},
          users: [],
          tier: entity.data?.tier || 1
        };
        break;

      case 'event':
        baseEntry.sections = {
          overview: entity.data?.description || '',
          participants: entity.data?.participants || [],
          location: entity.data?.location,
          consequences: entity.data?.consequences || []
        };
        break;
    }

    return baseEntry;
  }

  // ==================== Helper Methods ====================

  mapEntityTypeToEventType(entityType) {
    const mapping = {
      'actor': 'character_appearance',
      'stat_change': 'stat_change',
      'actor-update': 'character_update',
      'item': 'item_event',
      'skill': 'skill_event',
      'location': 'travel',
      'inventory': 'inventory_change',
      'relationship': 'relationship_change',
      'event': 'milestone'
    };
    return mapping[entityType] || 'generic';
  }

  mapToMindMapNodeType(entityType) {
    const mapping = {
      'actor': 'actor',
      'item': 'item',
      'skill': 'skill',
      'location': 'location',
      'event': 'event',
      'relationship': 'relationship'
    };
    return mapping[entityType] || 'generic';
  }

  determineNodeGroup(entity) {
    if (entity.type === 'actor') {
      const role = entity.data?.role?.toLowerCase() || '';
      if (role.includes('protagonist') || role.includes('main')) return 'protagonists';
      if (role.includes('antagonist') || role.includes('villain')) return 'antagonists';
      if (role.includes('npc') || role.includes('support')) return 'npcs';
      return 'characters';
    }
    if (entity.type === 'location') return 'locations';
    if (entity.type === 'item') return 'items';
    if (entity.type === 'skill') return 'skills';
    if (entity.type === 'event') return 'events';
    return 'other';
  }

  calculateNodeSize(entity) {
    // Size based on importance/confidence
    const baseSize = 15;
    const confidenceBonus = (entity.confidence || 0.5) * 10;
    
    // Main characters get bigger nodes
    if (entity.type === 'actor') {
      const role = entity.data?.role?.toLowerCase() || '';
      if (role.includes('protagonist')) return baseSize + confidenceBonus + 10;
      if (role.includes('antagonist')) return baseSize + confidenceBonus + 8;
    }
    
    return baseSize + confidenceBonus;
  }

  generateEventTitle(entity) {
    const name = entity.data?.name || entity.data?.title || entity.data?.actorName || '';
    
    switch (entity.type) {
      case 'actor':
        return `${name} appears`;
      case 'item':
        return `Item: ${name}`;
      case 'skill':
        return `Skill: ${name}`;
      case 'location':
        return `Location: ${name}`;
      case 'stat_change':
        return `${entity.data?.actorName || 'Character'} - Stat Change`;
      case 'inventory':
        return `${entity.data?.actorName} ${entity.data?.action} ${entity.data?.itemName}`;
      case 'relationship':
        return `${entity.data?.actor1Name} & ${entity.data?.actor2Name}`;
      case 'event':
        return name || 'Event';
      default:
        return name || 'Event';
    }
  }

  extractActorIds(entity) {
    const ids = [];
    if (entity.data?.actorId) ids.push(entity.data.actorId);
    if (entity.data?.actor1Id) ids.push(entity.data.actor1Id);
    if (entity.data?.actor2Id) ids.push(entity.data.actor2Id);
    return ids;
  }

  extractActorNames(entity) {
    const names = [];
    if (entity.data?.actorName) names.push(entity.data.actorName);
    if (entity.data?.characterName) names.push(entity.data.characterName);
    if (entity.data?.actor1Name) names.push(entity.data.actor1Name);
    if (entity.data?.actor2Name) names.push(entity.data.actor2Name);
    if (entity.data?.participants) names.push(...entity.data.participants);
    return [...new Set(names)];
  }

  extractItemIds(entity) {
    const ids = [];
    if (entity.data?.itemId) ids.push(entity.data.itemId);
    if (entity.type === 'item' && entity.id) ids.push(entity.id);
    return ids;
  }

  extractLocationIds(entity) {
    const ids = [];
    if (entity.data?.locationId) ids.push(entity.data.locationId);
    if (entity.type === 'location' && entity.id) ids.push(entity.id);
    return ids;
  }

  extractSkillIds(entity) {
    const ids = [];
    if (entity.data?.skillId) ids.push(entity.data.skillId);
    if (entity.type === 'skill' && entity.id) ids.push(entity.id);
    return ids;
  }

  extractRelatedEntities(entity) {
    const related = [];
    if (entity.data?.relatedTo) related.push(...entity.data.relatedTo);
    return related;
  }

  inferEmotionalState(entity) {
    const context = (entity.sourceContext || '').toLowerCase();
    const desc = (entity.data?.description || '').toLowerCase();
    const combined = context + ' ' + desc;

    if (combined.match(/happy|joy|triumph|success|victory|celebration/)) {
      return { state: 'positive', intensity: 0.7 };
    }
    if (combined.match(/angry|rage|fury|frustrated|annoyed/)) {
      return { state: 'angry', intensity: 0.7 };
    }
    if (combined.match(/sad|grief|loss|mourn|despair/)) {
      return { state: 'sad', intensity: 0.7 };
    }
    if (combined.match(/fear|afraid|terror|scared|worried/)) {
      return { state: 'fearful', intensity: 0.7 };
    }
    if (combined.match(/confused|uncertain|puzzled|bewildered/)) {
      return { state: 'confused', intensity: 0.5 };
    }
    
    return { state: 'neutral', intensity: 0.5 };
  }

  generateWikiContent(entity, entityType) {
    const name = entity.data?.name || entity.data?.title || 'Unknown';
    const desc = entity.data?.description || entity.data?.desc || '';
    
    let content = `# ${name}\n\n`;
    
    if (desc) {
      content += `${desc}\n\n`;
    }

    if (entity.sourceContext) {
      content += `## First Mention\n> "${entity.sourceContext}"\n\n`;
    }

    return content;
  }

  generateWikiTags(entity, entityType) {
    const tags = [entityType];
    
    if (entity.data?.type) tags.push(entity.data.type.toLowerCase());
    if (entity.data?.class) tags.push(entity.data.class.toLowerCase());
    if (entity.data?.role) tags.push(entity.data.role.toLowerCase());
    if (entity.data?.rarity) tags.push(entity.data.rarity.toLowerCase());
    
    return [...new Set(tags)];
  }

  // UK location coordinates (SVG-based for stylized map)
  getUKCoordinates(locationName) {
    const ukLocations = {
      'london': { svg: { x: 520, y: 380 }, real: { lat: 51.5074, lng: -0.1278 } },
      'birmingham': { svg: { x: 460, y: 320 }, real: { lat: 52.4862, lng: -1.8904 } },
      'manchester': { svg: { x: 440, y: 260 }, real: { lat: 53.4808, lng: -2.2426 } },
      'liverpool': { svg: { x: 410, y: 270 }, real: { lat: 53.4084, lng: -2.9916 } },
      'leeds': { svg: { x: 480, y: 250 }, real: { lat: 53.8008, lng: -1.5491 } },
      'sheffield': { svg: { x: 475, y: 280 }, real: { lat: 53.3811, lng: -1.4701 } },
      'bristol': { svg: { x: 400, y: 380 }, real: { lat: 51.4545, lng: -2.5879 } },
      'newcastle': { svg: { x: 480, y: 180 }, real: { lat: 54.9783, lng: -1.6178 } },
      'edinburgh': { svg: { x: 450, y: 120 }, real: { lat: 55.9533, lng: -3.1883 } },
      'glasgow': { svg: { x: 400, y: 130 }, real: { lat: 55.8642, lng: -4.2518 } },
      'cardiff': { svg: { x: 380, y: 380 }, real: { lat: 51.4816, lng: -3.1791 } },
      'belfast': { svg: { x: 320, y: 180 }, real: { lat: 54.5973, lng: -5.9301 } },
      'oxford': { svg: { x: 480, y: 360 }, real: { lat: 51.7520, lng: -1.2577 } },
      'cambridge': { svg: { x: 540, y: 340 }, real: { lat: 52.2053, lng: 0.1218 } },
      'brighton': { svg: { x: 510, y: 420 }, real: { lat: 50.8225, lng: -0.1372 } },
      'plymouth': { svg: { x: 340, y: 430 }, real: { lat: 50.3755, lng: -4.1427 } },
      'cornwall': { svg: { x: 300, y: 440 }, real: { lat: 50.2660, lng: -5.0527 } },
      'york': { svg: { x: 490, y: 240 }, real: { lat: 53.9591, lng: -1.0815 } },
      'nottingham': { svg: { x: 485, y: 300 }, real: { lat: 52.9548, lng: -1.1581 } },
      'southampton': { svg: { x: 470, y: 410 }, real: { lat: 50.9097, lng: -1.4044 } },
      'portsmouth': { svg: { x: 490, y: 415 }, real: { lat: 50.8198, lng: -1.0880 } },
      'dover': { svg: { x: 570, y: 400 }, real: { lat: 51.1279, lng: 1.3134 } },
      'canterbury': { svg: { x: 560, y: 385 }, real: { lat: 51.2802, lng: 1.0789 } },
      'bath': { svg: { x: 410, y: 375 }, real: { lat: 51.3811, lng: -2.3590 } },
      'stratford': { svg: { x: 455, y: 340 }, real: { lat: 52.1917, lng: -1.7083 } },
      'stonehenge': { svg: { x: 440, y: 390 }, real: { lat: 51.1789, lng: -1.8262 } },
      'windsor': { svg: { x: 500, y: 375 }, real: { lat: 51.4839, lng: -0.6044 } }
    };

    const normalized = locationName.toLowerCase().trim();
    
    // Try exact match
    if (ukLocations[normalized]) {
      return ukLocations[normalized];
    }

    // Try partial match
    for (const [key, coords] of Object.entries(ukLocations)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return coords;
      }
    }

    // Default to center of UK with some randomness
    return {
      svg: { x: 450 + Math.random() * 100 - 50, y: 300 + Math.random() * 100 - 50 },
      real: { lat: 52.5 + Math.random() - 0.5, lng: -1.5 + Math.random() - 0.5 }
    };
  }

  async findExistingWikiEntry(entry) {
    try {
      const entries = await db.getAll('wikiEntries');
      return entries.find(e => 
        e.title.toLowerCase() === entry.title.toLowerCase() &&
        e.entityType === entry.entityType
      );
    } catch (error) {
      return null;
    }
  }

  mergeWikiEntries(existing, newEntry) {
    return {
      ...existing,
      updatedAt: Date.now(),
      appearances: [...(existing.appearances || []), ...(newEntry.appearances || [])],
      content: existing.content + '\n\n' + (newEntry.content || ''),
      relatedEntities: [...new Set([
        ...(existing.relatedEntities || []),
        ...(newEntry.relatedEntities || [])
      ])],
      tags: [...new Set([...(existing.tags || []), ...(newEntry.tags || [])])]
    };
  }

  async applyCharacterArcUpdate(update) {
    // Find actor by name
    const actors = await db.getAll('actors');
    const actor = actors.find(a => 
      a.name.toLowerCase() === update.actorName?.toLowerCase()
    );

    if (!actor) return;

    // Get or create character arc
    let arc;
    try {
      const arcs = await db.getAll('characterArcs');
      arc = arcs.find(a => a.characterId === actor.id);
    } catch (e) {
      arc = null;
    }

    if (!arc) {
      arc = {
        characterId: actor.id,
        characterName: actor.name,
        timeline: [],
        statsHistory: [],
        emotionalStates: [],
        goals: [],
        relationships: [],
        locationsVisited: []
      };
    }

    // Add update to timeline
    arc.timeline.push({
      chapterId: update.chapterId,
      bookId: update.bookId,
      timestamp: update.timestamp,
      type: update.type,
      description: update.description
    });

    // Add stat changes if present
    if (update.statChanges && Object.keys(update.statChanges).length > 0) {
      arc.statsHistory.push({
        chapterId: update.chapterId,
        timestamp: update.timestamp,
        changes: update.statChanges
      });
    }

    // Add emotional state if present
    if (update.emotionalState) {
      arc.emotionalStates.push({
        chapterId: update.chapterId,
        timestamp: update.timestamp,
        ...update.emotionalState
      });
    }

    // Save arc
    try {
      await db.update('characterArcs', arc);
    } catch (e) {
      await db.add('characterArcs', arc);
    }
  }

  async applyPlotThread(thread) {
    const existingThreads = await db.getAll('plotThreads');
    const existing = existingThreads.find(t => t.name.toLowerCase() === thread.name.toLowerCase());

    if (existing) {
      // Add events to existing thread
      existing.events = [...(existing.events || []), ...(thread.events || [])];
      existing.completion = Math.min(100, (existing.completion || 0) + 5);
      await db.update('plotThreads', existing);
    } else {
      // Create new thread
      const newThread = {
        id: thread.id || `thread_${Date.now()}`,
        name: thread.name,
        description: thread.description || '',
        status: 'active',
        completion: 10,
        events: thread.events || [],
        characters: thread.characters || [],
        createdAt: Date.now()
      };
      await db.add('plotThreads', newThread);
    }
  }

  async detectPlotThreads(timelineEvents, extractions) {
    // Simple plot thread detection based on recurring characters and themes
    const threads = [];
    const characterEvents = {};

    // Group events by character
    for (const event of timelineEvents) {
      for (const actor of (event.actors || [])) {
        if (!characterEvents[actor]) {
          characterEvents[actor] = [];
        }
        characterEvents[actor].push(event);
      }
    }

    // Create suggested threads for characters with multiple events
    for (const [character, events] of Object.entries(characterEvents)) {
      if (events.length >= 2) {
        threads.push({
          id: `thread_${character.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
          name: `${character}'s Journey`,
          description: `Following ${character} through the story`,
          events: events.map(e => e.id),
          characters: [character],
          approved: false,
          confidence: 0.7
        });
      }
    }

    // Detect location-based threads
    const locationEvents = {};
    for (const event of timelineEvents) {
      for (const location of (event.locations || [])) {
        if (!locationEvents[location]) {
          locationEvents[location] = [];
        }
        locationEvents[location].push(event);
      }
    }

    for (const [location, events] of Object.entries(locationEvents)) {
      if (events.length >= 2) {
        threads.push({
          id: `thread_location_${location.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
          name: `Events at ${location}`,
          description: `Key events occurring at ${location}`,
          events: events.map(e => e.id),
          characters: [...new Set(events.flatMap(e => e.actors || []))],
          approved: false,
          confidence: 0.5
        });
      }
    }

    return threads;
  }
}

const integrationService = new IntegrationService();
export default integrationService;
