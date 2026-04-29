/**
 * Autonomous Processing Pipeline
 * The brain of the self-updating story management system
 * 
 * Handles:
 * - Live spell/grammar suggestions
 * - Text processing against previous chapters
 * - Entity extraction and routing
 * - One-click full entity creation
 * - Change tracking for incremental updates
 * - Consistency checking with lock awareness
 */

import aiService from './aiService';
import db from './database';
import toastService from './toastService';

class AutonomousPipeline {
  constructor() {
    this.lastProcessedState = {};
    this.pendingSuggestions = [];
    this.entityQueue = [];
    this.lockedEntities = new Set();
    this.processingHistory = [];
    this.liveTypingDebounce = null;
  }

  /**
   * Initialize pipeline with current world state
   */
  async initialize() {
    try {
      // Load locked entities
      const locked = await db.get('meta', 'lockedEntities');
      if (locked?.entities) {
        this.lockedEntities = new Set(locked.entities);
      }
      
      // Load processing history
      const history = await db.getAll('processingHistory');
      this.processingHistory = history || [];
      
      console.log('[Pipeline] Initialized with', this.lockedEntities.size, 'locked entities');
    } catch (error) {
      console.warn('[Pipeline] Initialization error:', error);
    }
  }

  /**
   * Lock an entity to prevent AI modifications
   */
  async lockEntity(entityType, entityId, reason = 'User locked') {
    const lockKey = `${entityType}:${entityId}`;
    this.lockedEntities.add(lockKey);
    
    await db.update('meta', {
      id: 'lockedEntities',
      entities: Array.from(this.lockedEntities),
      updatedAt: Date.now()
    }).catch(() => db.add('meta', {
      id: 'lockedEntities',
      entities: Array.from(this.lockedEntities),
      updatedAt: Date.now()
    }));
    
    // Log the lock action
    await this.logAction('lock', { entityType, entityId, reason });
    
    return true;
  }

  /**
   * Unlock an entity
   */
  async unlockEntity(entityType, entityId) {
    const lockKey = `${entityType}:${entityId}`;
    this.lockedEntities.delete(lockKey);
    
    await db.update('meta', {
      id: 'lockedEntities',
      entities: Array.from(this.lockedEntities),
      updatedAt: Date.now()
    });
    
    await this.logAction('unlock', { entityType, entityId });
    
    return true;
  }

  /**
   * Check if entity is locked
   */
  isLocked(entityType, entityId) {
    return this.lockedEntities.has(`${entityType}:${entityId}`);
  }

  /**
   * Get all locked entities
   */
  getLockedEntities() {
    return Array.from(this.lockedEntities).map(key => {
      const [type, id] = key.split(':');
      return { type, id };
    });
  }

  // ========================================
  // LIVE TYPING SUGGESTIONS
  // ========================================

  /**
   * Process text as user types (debounced)
   * Returns spell/grammar suggestions and minor entity hints
   */
  async processLiveTyping(text, cursorPosition, context) {
    // Clear previous debounce
    if (this.liveTypingDebounce) {
      clearTimeout(this.liveTypingDebounce);
    }

    return new Promise((resolve) => {
      this.liveTypingDebounce = setTimeout(async () => {
        try {
          const suggestions = await this.getLiveTypingSuggestions(text, cursorPosition, context);
          resolve(suggestions);
        } catch (error) {
          console.warn('[Pipeline] Live typing error:', error);
          resolve({ spelling: [], grammar: [], hints: [] });
        }
      }, 500); // 500ms debounce
    });
  }

  /**
   * Get live typing suggestions (spell, grammar, hints)
   */
  async getLiveTypingSuggestions(text, cursorPosition, context) {
    // Get the current sentence/paragraph around cursor
    const nearbyText = this.extractNearbyText(text, cursorPosition, 200);
    
    const result = {
      spelling: [],
      grammar: [],
      hints: [],
      quickFixes: []
    };

    // Simple spell check patterns (client-side for speed)
    result.spelling = this.quickSpellCheck(nearbyText);
    
    // Grammar patterns (client-side basics)
    result.grammar = this.quickGrammarCheck(nearbyText);

    // Check for entity mentions that might need attention
    if (context?.actors) {
      result.hints = this.detectEntityMentions(nearbyText, context);
    }

    return result;
  }

  /**
   * Extract text around cursor position
   */
  extractNearbyText(text, position, radius) {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end);
  }

  /**
   * Quick client-side spell check (common mistakes)
   */
  quickSpellCheck(text) {
    const commonMistakes = {
      'teh': 'the',
      'adn': 'and',
      'taht': 'that',
      'hte': 'the',
      'wiht': 'with',
      'thier': 'their',
      'recieve': 'receive',
      'occured': 'occurred',
      'seperately': 'separately',
      'untill': 'until',
      'definately': 'definitely',
      'occassion': 'occasion',
      'accomodate': 'accommodate',
      'occurance': 'occurrence',
      'arguement': 'argument',
      'calender': 'calendar',
      'collegue': 'colleague',
      'concious': 'conscious',
      'embarass': 'embarrass',
      'enviroment': 'environment',
      'goverment': 'government',
      'independant': 'independent',
      'knowlege': 'knowledge',
      'millenium': 'millennium',
      'neccessary': 'necessary',
      'noticable': 'noticeable',
      'occassionally': 'occasionally',
      'paralell': 'parallel',
      'publically': 'publicly',
      'recomend': 'recommend',
      'refered': 'referred',
      'relevent': 'relevant',
      'seperate': 'separate',
      'supercede': 'supersede',
      'tommorow': 'tomorrow',
      'truely': 'truly',
      'wierd': 'weird'
    };

    const suggestions = [];
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (commonMistakes[cleanWord]) {
        suggestions.push({
          type: 'spelling',
          word: cleanWord,
          suggestion: commonMistakes[cleanWord],
          position: index
        });
      }
    });

    return suggestions;
  }

  /**
   * Quick client-side grammar check
   */
  quickGrammarCheck(text) {
    const suggestions = [];
    
    // Double spaces
    if (text.includes('  ')) {
      suggestions.push({
        type: 'grammar',
        issue: 'Double space detected',
        suggestion: 'Remove extra space'
      });
    }

    // Common grammar issues
    const patterns = [
      { regex: /\bi\s/g, issue: 'Lowercase "i"', suggestion: 'Capitalize "I"' },
      { regex: /\.\s*[a-z]/g, issue: 'Lowercase after period', suggestion: 'Capitalize first letter' },
      { regex: /\s+,/g, issue: 'Space before comma', suggestion: 'Remove space' },
      { regex: /\s+\./g, issue: 'Space before period', suggestion: 'Remove space' },
      { regex: /their\s+(is|are|was|were)\b/gi, issue: 'Possible "there" instead of "their"', suggestion: 'Check: there/their' },
      { regex: /your\s+(a|an)\b/gi, issue: 'Possible "you\'re" instead of "your"', suggestion: 'Check: you\'re/your' },
      { regex: /its\s+(a|an|the)\b/gi, issue: 'Possible "it\'s" instead of "its"', suggestion: 'Check: it\'s/its' },
    ];

    patterns.forEach(({ regex, issue, suggestion }) => {
      if (regex.test(text)) {
        suggestions.push({ type: 'grammar', issue, suggestion });
      }
    });

    return suggestions;
  }

  /**
   * Detect entity mentions in text
   */
  detectEntityMentions(text, context) {
    const hints = [];
    const lowerText = text.toLowerCase();

    // Check for known actor mentions
    context.actors?.forEach(actor => {
      if (lowerText.includes(actor.name.toLowerCase())) {
        hints.push({
          type: 'actor_mention',
          entity: actor.name,
          entityId: actor.id,
          message: `${actor.name} mentioned - stats may need updating`
        });
      }
    });

    // Check for potential new characters (capitalized names not in database)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    const potentialNames = [...text.matchAll(namePattern)].map(m => m[1]);
    const knownNames = new Set(context.actors?.map(a => a.name.toLowerCase()) || []);
    
    potentialNames.forEach(name => {
      if (!knownNames.has(name.toLowerCase()) && name.length > 2) {
        // Exclude common words
        const commonWords = ['The', 'This', 'That', 'They', 'Then', 'There', 'What', 'When', 'Where', 'Which', 'While', 'Would', 'Could', 'Should', 'Chapter', 'Book', 'Part', 'Section'];
        if (!commonWords.includes(name)) {
          hints.push({
            type: 'potential_character',
            name,
            message: `"${name}" might be a new character`
          });
        }
      }
    });

    return hints;
  }

  // ========================================
  // TEXT PROCESSING (On-Demand)
  // ========================================

  /**
   * Process chapter text against previous chapters
   * Returns consistency issues and suggested changes
   */
  async processText(chapterText, currentChapter, worldState) {
    const results = {
      consistencyIssues: [],
      suggestions: [],
      potentialEntities: [],
      warnings: [],
      summary: null
    };

    try {
      // Get previous chapter context
      const previousContext = await this.buildPreviousContext(currentChapter, worldState);
      
      // Build comprehensive prompt for AI
      const analysisPrompt = this.buildAnalysisPrompt(chapterText, previousContext, worldState);
      
      // Call AI for deep analysis
      const analysis = await aiService.analyzeChapterText(analysisPrompt);
      
      if (analysis) {
        results.consistencyIssues = analysis.consistencyIssues || [];
        results.suggestions = analysis.suggestions || [];
        results.warnings = analysis.warnings || [];
        results.summary = analysis.summary;
        
        // Check for locked entity conflicts
        results.consistencyIssues = this.checkLockedEntityConflicts(
          results.consistencyIssues,
          worldState
        );
      }

      // Log processing
      await this.logAction('processText', {
        chapterId: currentChapter?.id,
        issuesFound: results.consistencyIssues.length,
        suggestionsFound: results.suggestions.length
      });

      return results;
    } catch (error) {
      console.error('[Pipeline] Text processing error:', error);
      toastService.error('Text processing failed: ' + error.message);
      return results;
    }
  }

  /**
   * Build context from previous chapters
   */
  async buildPreviousContext(currentChapter, worldState) {
    const context = {
      characters: [],
      events: [],
      locations: [],
      items: [],
      relationships: [],
      recentChanges: []
    };

    // Get all chapters before current
    const allChapters = [];
    Object.values(worldState.books || {}).forEach(book => {
      book.chapters?.forEach(ch => {
        allChapters.push({
          bookId: book.id,
          ...ch
        });
      });
    });

    // Sort by book and chapter order
    allChapters.sort((a, b) => {
      if (a.bookId !== b.bookId) return a.bookId - b.bookId;
      return a.id - b.id;
    });

    // Find current chapter index
    const currentIndex = allChapters.findIndex(ch => 
      ch.id === currentChapter?.id && ch.bookId === currentChapter?.bookId
    );

    // Get previous chapters (last 3-5 for context)
    const previousChapters = allChapters.slice(
      Math.max(0, currentIndex - 5),
      currentIndex
    );

    // Build character context from actors
    context.characters = worldState.actors?.map(actor => ({
      id: actor.id,
      name: actor.name,
      class: actor.class,
      role: actor.role,
      stats: actor.baseStats,
      lastKnownState: actor.snapshots?.[`${currentChapter?.bookId}_${currentChapter?.id - 1}`],
      isLocked: this.isLocked('actor', actor.id)
    })) || [];

    // Get recent timeline events
    try {
      const events = await db.getAll('timelineEvents');
      context.events = events?.slice(-20) || [];
    } catch (e) {
      context.events = [];
    }

    // Get locations
    try {
      const locations = await db.getAll('locations');
      context.locations = locations || [];
    } catch (e) {
      context.locations = [];
    }

    // Get relationships
    try {
      const relationships = await db.getAll('relationships');
      context.relationships = relationships || [];
    } catch (e) {
      context.relationships = [];
    }

    // Get recent processing changes
    context.recentChanges = this.processingHistory.slice(-10);

    return context;
  }

  /**
   * Build analysis prompt for AI
   */
  buildAnalysisPrompt(chapterText, previousContext, worldState) {
    return {
      task: 'chapter_analysis',
      chapterText,
      context: {
        knownCharacters: previousContext.characters,
        recentEvents: previousContext.events,
        knownLocations: previousContext.locations,
        relationships: previousContext.relationships,
        lockedEntities: this.getLockedEntities(),
        statRegistry: worldState.statRegistry,
        itemBank: worldState.itemBank?.slice(0, 50), // Limit for token management
        skillBank: worldState.skillBank?.slice(0, 50)
      },
      instructions: `
        Analyze this chapter text and provide:
        1. CONSISTENCY ISSUES: Any contradictions with established facts
        2. SUGGESTIONS: Recommended changes to character stats, relationships, etc.
        3. WARNINGS: Potential issues or things to review
        4. SUMMARY: Brief summary of what happens in this chapter
        
        For locked entities, note if changes would affect them but mark as "locked_conflict".
        
        Process in chronological order of the text - earlier statements take precedence
        unless clearly superseded by later events.
      `
    };
  }

  /**
   * Check for conflicts with locked entities
   */
  checkLockedEntityConflicts(issues, worldState) {
    return issues.map(issue => {
      if (issue.entityType && issue.entityId) {
        if (this.isLocked(issue.entityType, issue.entityId)) {
          return {
            ...issue,
            isLockedConflict: true,
            message: `⚠️ LOCKED: ${issue.message} (Entity is locked - unlock to modify)`
          };
        }
      }
      return issue;
    });
  }

  // ========================================
  // ENTITY EXTRACTION
  // ========================================

  /**
   * Extract entities from processed text
   * Returns categorized entities for user approval
   */
  async extractEntities(chapterText, worldState, chapterId) {
    const entities = {
      newActors: [],
      actorUpdates: [],
      newItems: [],
      itemUpdates: [],
      newSkills: [],
      skillUpdates: [],
      newLocations: [],
      newEvents: [],
      relationshipChanges: [],
      statChanges: [],
      wikiEntries: [],
      timelineEvents: [],
      plotUpdates: []
    };

    try {
      // Use AI to extract all entities
      // Third parameter is buzzWords array (optional), not options object
      const extracted = await aiService.processManuscriptIntelligence(
        chapterText,
        worldState,
        [] // Use default buzzWords
      );

      if (extracted?.suggestions) {
        // Categorize suggestions
        extracted.suggestions.forEach(suggestion => {
          const category = this.categorizeEntity(suggestion, worldState);
          if (category && entities[category]) {
            // Check if locked
            if (suggestion.entityId && this.isLocked(suggestion.entityType, suggestion.entityId)) {
              suggestion.isLocked = true;
              suggestion.lockWarning = 'This entity is locked. Unlock to apply changes.';
            }
            entities[category].push(suggestion);
          }
        });
      }

      // Store in queue for user approval
      this.entityQueue = Object.entries(entities)
        .flatMap(([category, items]) => items.map(item => ({ ...item, category })));

      return entities;
    } catch (error) {
      console.error('[Pipeline] Entity extraction error:', error);
      toastService.error('Entity extraction failed: ' + error.message);
      return entities;
    }
  }

  /**
   * Categorize an entity suggestion
   */
  categorizeEntity(suggestion, worldState) {
    const type = suggestion.type || suggestion.entityType;
    const action = suggestion.action;

    const categoryMap = {
      'actor_create': 'newActors',
      'actor_update': 'actorUpdates',
      'actor': action === 'create' ? 'newActors' : 'actorUpdates',
      'item_create': 'newItems',
      'item_update': 'itemUpdates',
      'item': action === 'create' ? 'newItems' : 'itemUpdates',
      'skill_create': 'newSkills',
      'skill_update': 'skillUpdates',
      'skill': action === 'create' ? 'newSkills' : 'skillUpdates',
      'location': 'newLocations',
      'event': 'newEvents',
      'relationship': 'relationshipChanges',
      'stat_change': 'statChanges',
      'wiki': 'wikiEntries',
      'timeline': 'timelineEvents',
      'plot': 'plotUpdates'
    };

    return categoryMap[type] || categoryMap[`${type}_${action}`];
  }

  // ========================================
  // ONE-CLICK FULL ENTITY CREATION
  // ========================================

  /**
   * Accept an entity suggestion and create ALL related entries
   * This is the "magic" one-click that updates everything
   */
  async acceptEntity(suggestion, worldState, chapterId) {
    const results = {
      success: false,
      created: [],
      updated: [],
      errors: []
    };

    try {
      // Check if locked
      if (suggestion.isLocked) {
        results.errors.push(`Entity is locked. Unlock first to make changes.`);
        return results;
      }

      const entityType = suggestion.type || suggestion.entityType;
      const entityData = suggestion.data || suggestion;

      // Route to appropriate full creation method
      switch (entityType) {
        case 'actor':
          await this.createFullActor(entityData, worldState, chapterId, results);
          break;
        case 'item':
          await this.createFullItem(entityData, worldState, chapterId, results);
          break;
        case 'skill':
          await this.createFullSkill(entityData, worldState, chapterId, results);
          break;
        case 'location':
          await this.createFullLocation(entityData, worldState, chapterId, results);
          break;
        case 'event':
          await this.createFullEvent(entityData, worldState, chapterId, results);
          break;
        case 'relationship':
          await this.createFullRelationship(entityData, worldState, chapterId, results);
          break;
        case 'stat_change':
          await this.applyStatChange(entityData, worldState, chapterId, results);
          break;
        default:
          results.errors.push(`Unknown entity type: ${entityType}`);
      }

      results.success = results.errors.length === 0;

      // Log the action
      await this.logAction('acceptEntity', {
        entityType,
        entityId: entityData.id,
        chapterId,
        created: results.created,
        updated: results.updated
      });

      return results;
    } catch (error) {
      console.error('[Pipeline] Accept entity error:', error);
      results.errors.push(error.message);
      return results;
    }
  }

  /**
   * Create a full actor with all related entries
   */
  async createFullActor(data, worldState, chapterId, results) {
    const actorId = data.id || `actor_${Date.now()}`;
    
    // 1. Create the actor
    const actor = {
      id: actorId,
      name: data.name,
      class: data.class || 'Unknown',
      role: data.role || '',
      desc: data.description || '',
      baseStats: data.stats || this.generateDefaultStats(worldState.statRegistry),
      additionalStats: {},
      activeSkills: [],
      inventory: [],
      equipment: {
        helm: null, cape: null, amulet: null, armour: null,
        gloves: null, belt: null, boots: null,
        leftHand: null, rightHand: null,
        rings: [null, null, null, null, null, null, null],
        charms: [null, null, null, null]
      },
      snapshots: {},
      biography: data.biography || '',
      appearances: {},
      createdAt: Date.now(),
      createdInChapter: chapterId
    };

    await db.add('actors', actor);
    results.created.push({ type: 'actor', id: actorId, name: data.name });

    // 2. Create wiki entry
    const wikiEntry = {
      id: `wiki_${actorId}`,
      entityType: 'character',
      entityId: actorId,
      title: data.name,
      content: data.biography || `${data.name} is a ${data.class || 'character'} in the story.`,
      linkedEntities: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.add('wikiEntries', wikiEntry);
    results.created.push({ type: 'wiki', id: wikiEntry.id, name: `Wiki: ${data.name}` });

    // 3. Create timeline event for introduction
    const timelineEvent = {
      id: `event_intro_${actorId}`,
      title: `${data.name} Introduced`,
      description: `${data.name} first appears in the story`,
      type: 'character_introduction',
      actors: [actorId],
      chapterId,
      timestamp: Date.now(),
      order: Date.now()
    };
    await db.add('timelineEvents', timelineEvent);
    results.created.push({ type: 'timeline', id: timelineEvent.id, name: timelineEvent.title });

    // 4. Add to mind map
    const mindMapNode = {
      id: `node_${actorId}`,
      type: 'actor',
      entityId: actorId,
      label: data.name,
      x: Math.random() * 500,
      y: Math.random() * 500,
      createdAt: Date.now()
    };
    await db.add('mindMapNodes', mindMapNode);
    results.created.push({ type: 'mindmap_node', id: mindMapNode.id, name: data.name });

    // 5. Generate AI biography if not provided
    if (!data.biography) {
      try {
        const bio = await aiService.generateCharacterBiography(actor, [], worldState);
        if (bio) {
          actor.biography = bio;
          await db.update('actors', actor);
          wikiEntry.content = bio;
          await db.update('wikiEntries', wikiEntry);
          results.updated.push({ type: 'actor', id: actorId, field: 'biography' });
        }
      } catch (e) {
        console.warn('[Pipeline] Biography generation failed:', e);
      }
    }

    return actor;
  }

  /**
   * Create a full item with all related entries
   */
  async createFullItem(data, worldState, chapterId, results) {
    const itemId = data.id || `item_${Date.now()}`;
    
    // 1. Create the item
    const item = {
      id: itemId,
      name: data.name,
      type: data.type || 'Miscellaneous',
      baseType: data.baseType || 'item',
      rarity: data.rarity || 'Common',
      desc: data.description || '',
      stats: data.stats || {},
      statMod: data.statMod || {},
      equipmentSlot: data.equipmentSlot || null,
      createdAt: Date.now(),
      createdInChapter: chapterId
    };

    await db.add('itemBank', item);
    results.created.push({ type: 'item', id: itemId, name: data.name });

    // 2. Create wiki entry
    const wikiEntry = {
      id: `wiki_${itemId}`,
      entityType: 'item',
      entityId: itemId,
      title: data.name,
      content: data.description || `${data.name} is a ${data.rarity || ''} ${data.type || 'item'}.`,
      linkedEntities: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.add('wikiEntries', wikiEntry);
    results.created.push({ type: 'wiki', id: wikiEntry.id, name: `Wiki: ${data.name}` });

    // 3. Add to mind map
    const mindMapNode = {
      id: `node_${itemId}`,
      type: 'item',
      entityId: itemId,
      label: data.name,
      x: Math.random() * 500,
      y: Math.random() * 500,
      createdAt: Date.now()
    };
    await db.add('mindMapNodes', mindMapNode);
    results.created.push({ type: 'mindmap_node', id: mindMapNode.id, name: data.name });

    // 4. If owner specified, add to their inventory
    if (data.ownerId) {
      try {
        const owner = await db.get('actors', data.ownerId);
        if (owner) {
          owner.inventory = [...(owner.inventory || []), itemId];
          await db.update('actors', owner);
          results.updated.push({ type: 'actor', id: data.ownerId, field: 'inventory' });

          // Create timeline event
          const timelineEvent = {
            id: `event_item_${itemId}`,
            title: `${owner.name} acquires ${data.name}`,
            description: `${owner.name} obtained ${data.name}`,
            type: 'item_acquisition',
            actors: [data.ownerId],
            items: [itemId],
            chapterId,
            timestamp: Date.now(),
            order: Date.now()
          };
          await db.add('timelineEvents', timelineEvent);
          results.created.push({ type: 'timeline', id: timelineEvent.id, name: timelineEvent.title });
        }
      } catch (e) {
        console.warn('[Pipeline] Owner update failed:', e);
      }
    }

    return item;
  }

  /**
   * Create a full skill with all related entries
   */
  async createFullSkill(data, worldState, chapterId, results) {
    const skillId = data.id || `skill_${Date.now()}`;
    
    // 1. Create the skill
    const skill = {
      id: skillId,
      name: data.name,
      type: data.type || 'Active',
      tier: data.tier || 1,
      desc: data.description || '',
      statMod: data.statMod || {},
      prerequisites: data.prerequisites || {},
      createdAt: Date.now(),
      createdInChapter: chapterId
    };

    await db.add('skillBank', skill);
    results.created.push({ type: 'skill', id: skillId, name: data.name });

    // 2. Create wiki entry
    const wikiEntry = {
      id: `wiki_${skillId}`,
      entityType: 'skill',
      entityId: skillId,
      title: data.name,
      content: data.description || `${data.name} is a ${data.type || 'skill'}.`,
      linkedEntities: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.add('wikiEntries', wikiEntry);
    results.created.push({ type: 'wiki', id: wikiEntry.id, name: `Wiki: ${data.name}` });

    // 3. Add to mind map
    const mindMapNode = {
      id: `node_${skillId}`,
      type: 'skill',
      entityId: skillId,
      label: data.name,
      x: Math.random() * 500,
      y: Math.random() * 500,
      createdAt: Date.now()
    };
    await db.add('mindMapNodes', mindMapNode);
    results.created.push({ type: 'mindmap_node', id: mindMapNode.id, name: data.name });

    // 4. If learner specified, add to their skills
    if (data.learnerId) {
      try {
        const learner = await db.get('actors', data.learnerId);
        if (learner) {
          learner.activeSkills = [...(learner.activeSkills || []), { id: skillId, val: 1 }];
          await db.update('actors', learner);
          results.updated.push({ type: 'actor', id: data.learnerId, field: 'activeSkills' });

          // Create timeline event
          const timelineEvent = {
            id: `event_skill_${skillId}`,
            title: `${learner.name} learns ${data.name}`,
            description: `${learner.name} acquired the skill ${data.name}`,
            type: 'skill_learned',
            actors: [data.learnerId],
            skills: [skillId],
            chapterId,
            timestamp: Date.now(),
            order: Date.now()
          };
          await db.add('timelineEvents', timelineEvent);
          results.created.push({ type: 'timeline', id: timelineEvent.id, name: timelineEvent.title });
        }
      } catch (e) {
        console.warn('[Pipeline] Learner update failed:', e);
      }
    }

    return skill;
  }

  /**
   * Create a full location with all related entries
   */
  async createFullLocation(data, worldState, chapterId, results) {
    const locationId = data.id || `loc_${Date.now()}`;
    
    // 1. Create the location
    const location = {
      id: locationId,
      name: data.name,
      type: data.type || 'location',
      description: data.description || '',
      coordinates: data.coordinates || null,
      region: data.region || null,
      createdAt: Date.now(),
      createdInChapter: chapterId
    };

    await db.add('locations', location);
    results.created.push({ type: 'location', id: locationId, name: data.name });

    // 2. Create wiki entry
    const wikiEntry = {
      id: `wiki_${locationId}`,
      entityType: 'location',
      entityId: locationId,
      title: data.name,
      content: data.description || `${data.name} is a location in the story.`,
      linkedEntities: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.add('wikiEntries', wikiEntry);
    results.created.push({ type: 'wiki', id: wikiEntry.id, name: `Wiki: ${data.name}` });

    // 3. Add to mind map
    const mindMapNode = {
      id: `node_${locationId}`,
      type: 'location',
      entityId: locationId,
      label: data.name,
      x: Math.random() * 500,
      y: Math.random() * 500,
      createdAt: Date.now()
    };
    await db.add('mindMapNodes', mindMapNode);
    results.created.push({ type: 'mindmap_node', id: mindMapNode.id, name: data.name });

    return location;
  }

  /**
   * Create a full event with all related entries
   */
  async createFullEvent(data, worldState, chapterId, results) {
    const eventId = data.id || `event_${Date.now()}`;
    
    // 1. Create timeline event
    const event = {
      id: eventId,
      title: data.title || data.name,
      description: data.description || '',
      type: data.type || 'story_event',
      actors: data.actors || [],
      locations: data.locations || [],
      items: data.items || [],
      chapterId,
      timestamp: data.timestamp || Date.now(),
      order: data.order || Date.now(),
      createdAt: Date.now()
    };

    await db.add('timelineEvents', event);
    results.created.push({ type: 'timeline', id: eventId, name: data.title || data.name });

    // 2. Create wiki entry for significant events
    if (data.isSignificant) {
      const wikiEntry = {
        id: `wiki_${eventId}`,
        entityType: 'event',
        entityId: eventId,
        title: data.title || data.name,
        content: data.description || '',
        linkedEntities: [...(data.actors || []), ...(data.locations || [])],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.add('wikiEntries', wikiEntry);
      results.created.push({ type: 'wiki', id: wikiEntry.id, name: `Wiki: ${data.title}` });
    }

    // 3. Add connections in mind map
    if (data.actors?.length > 0) {
      for (const actorId of data.actors) {
        const edge = {
          id: `edge_${eventId}_${actorId}`,
          source: `node_${actorId}`,
          target: `node_${eventId}`,
          type: 'participates_in',
          createdAt: Date.now()
        };
        await db.add('mindMapEdges', edge).catch(() => {});
      }
    }

    return event;
  }

  /**
   * Create/update a relationship
   */
  async createFullRelationship(data, worldState, chapterId, results) {
    const relationshipId = data.id || `rel_${Date.now()}`;
    
    // 1. Create/update relationship
    const relationship = {
      id: relationshipId,
      actor1Id: data.actor1Id,
      actor2Id: data.actor2Id,
      type: data.type || 'knows',
      strength: data.strength || 50,
      description: data.description || '',
      history: [{
        chapterId,
        change: data.change || 'established',
        timestamp: Date.now()
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Check if relationship already exists
    const existing = await db.getAll('relationships');
    const existingRel = existing?.find(r => 
      (r.actor1Id === data.actor1Id && r.actor2Id === data.actor2Id) ||
      (r.actor1Id === data.actor2Id && r.actor2Id === data.actor1Id)
    );

    if (existingRel) {
      // Update existing
      existingRel.type = data.type || existingRel.type;
      existingRel.strength = data.strength || existingRel.strength;
      existingRel.history = [...(existingRel.history || []), {
        chapterId,
        change: data.change || 'updated',
        timestamp: Date.now()
      }];
      existingRel.updatedAt = Date.now();
      await db.update('relationships', existingRel);
      results.updated.push({ type: 'relationship', id: existingRel.id, name: `Relationship updated` });
    } else {
      await db.add('relationships', relationship);
      results.created.push({ type: 'relationship', id: relationshipId, name: `${data.actor1Name} - ${data.actor2Name}` });
    }

    // 2. Create mind map edge
    const edge = {
      id: `edge_rel_${relationshipId}`,
      source: `node_${data.actor1Id}`,
      target: `node_${data.actor2Id}`,
      type: data.type || 'relationship',
      label: data.type,
      strength: data.strength,
      createdAt: Date.now()
    };
    await db.add('mindMapEdges', edge).catch(() => {
      // Update if exists
      db.update('mindMapEdges', edge).catch(() => {});
    });

    // 3. Timeline event for relationship change
    const timelineEvent = {
      id: `event_rel_${relationshipId}_${Date.now()}`,
      title: `Relationship: ${data.actor1Name || 'Character'} & ${data.actor2Name || 'Character'}`,
      description: data.description || `Relationship ${data.change || 'established'}`,
      type: 'relationship_change',
      actors: [data.actor1Id, data.actor2Id],
      chapterId,
      timestamp: Date.now(),
      order: Date.now()
    };
    await db.add('timelineEvents', timelineEvent);
    results.created.push({ type: 'timeline', id: timelineEvent.id, name: timelineEvent.title });

    return relationship;
  }

  /**
   * Apply a stat change to an actor
   */
  async applyStatChange(data, worldState, chapterId, results) {
    try {
      const actor = await db.get('actors', data.actorId);
      if (!actor) {
        results.errors.push(`Actor ${data.actorId} not found`);
        return;
      }

      // Check if locked
      if (this.isLocked('actor', data.actorId)) {
        results.errors.push(`Actor ${actor.name} is locked`);
        return;
      }

      // Apply stat changes
      const previousStats = { ...actor.baseStats };
      
      Object.entries(data.changes || {}).forEach(([stat, change]) => {
        if (typeof change === 'number') {
          actor.baseStats[stat] = (actor.baseStats[stat] || 0) + change;
        } else if (change.set !== undefined) {
          actor.baseStats[stat] = change.set;
        }
      });

      await db.update('actors', actor);
      results.updated.push({ type: 'actor', id: data.actorId, field: 'baseStats' });

      // Create snapshot for this chapter
      const snapKey = `${chapterId.split('_')[0] || 1}_${chapterId}`;
      actor.snapshots = actor.snapshots || {};
      actor.snapshots[snapKey] = {
        baseStats: { ...actor.baseStats },
        additionalStats: { ...actor.additionalStats },
        timestamp: Date.now(),
        note: data.reason || 'Stat change from chapter'
      };
      await db.update('actors', actor);

      // Timeline event
      const changeDescription = Object.entries(data.changes || {})
        .map(([stat, val]) => `${stat}: ${val > 0 ? '+' : ''}${val}`)
        .join(', ');

      const timelineEvent = {
        id: `event_stat_${Date.now()}`,
        title: `${actor.name} Stats Changed`,
        description: changeDescription,
        type: 'stat_change',
        actors: [data.actorId],
        chapterId,
        timestamp: Date.now(),
        order: Date.now()
      };
      await db.add('timelineEvents', timelineEvent);
      results.created.push({ type: 'timeline', id: timelineEvent.id, name: timelineEvent.title });

    } catch (error) {
      results.errors.push(`Stat change failed: ${error.message}`);
    }
  }

  /**
   * Generate default stats based on stat registry
   */
  generateDefaultStats(statRegistry) {
    const stats = {};
    if (Array.isArray(statRegistry)) {
      statRegistry
        .filter(s => s && s.isCore && s.key)
        .forEach(stat => {
          stats[stat.key] = 10; // Default value
        });
    }
    // Fallback to default stats if none generated
    if (Object.keys(stats).length === 0) {
      stats.STR = 10;
      stats.VIT = 10;
      stats.INT = 10;
      stats.DEX = 10;
    }
    return stats;
  }

  // ========================================
  // LOGGING & HISTORY
  // ========================================

  /**
   * Log a pipeline action
   */
  async logAction(action, data) {
    const entry = {
      id: `log_${Date.now()}`,
      action,
      data,
      timestamp: Date.now()
    };

    this.processingHistory.push(entry);
    
    // Keep only last 100 entries in memory
    if (this.processingHistory.length > 100) {
      this.processingHistory = this.processingHistory.slice(-100);
    }

    // Persist to database
    try {
      await db.add('processingHistory', entry);
    } catch (e) {
      console.warn('[Pipeline] Failed to persist log:', e);
    }
  }

  /**
   * Get processing history
   */
  async getHistory(limit = 50) {
    try {
      const history = await db.getAll('processingHistory');
      return (history || []).slice(-limit).reverse();
    } catch (e) {
      return this.processingHistory.slice(-limit).reverse();
    }
  }

  // ========================================
  // CHANGE TRACKING
  // ========================================

  /**
   * Get changes since last processing
   */
  async getChangesSinceLastProcess(chapterId) {
    const lastProcess = this.processingHistory
      .filter(h => h.action === 'processText' && h.data?.chapterId === chapterId)
      .pop();

    if (!lastProcess) {
      return { isFirstProcess: true, changes: [] };
    }

    // Get all changes after last process
    const changes = this.processingHistory
      .filter(h => h.timestamp > lastProcess.timestamp)
      .filter(h => h.action !== 'processText');

    return {
      isFirstProcess: false,
      lastProcessed: lastProcess.timestamp,
      changes
    };
  }
}

// Export singleton instance
const autonomousPipeline = new AutonomousPipeline();
export default autonomousPipeline;
