/**
 * IndexedDB Database Layer for Claimwise Omniscience
 * Provides persistent local storage for all app data
 */

const DB_NAME = 'ClaimwiseOmniscience';
// Bumped 2026-04 to v26 — older builds shipped with the IDB pushed up to
// v25, so opening at a lower version causes a VersionError. All historical
// upgrade blocks below are guarded with `oldVersion < N`, so opening from
// v25 → v26 is a no-op (just nudges the recorded version forward).
const DB_VERSION = 26;

class ClaimwiseDB {
  constructor() {
    this.db = null;
    // Query result cache with TTL (time-to-live)
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Initialize the database
   */
  async init() {
    // If already initialized, return existing connection
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Add error handler for database errors
        this.db.onerror = (event) => {
          console.error('Database error:', event.target.error);
        };
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Create object stores (version 1)
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('statRegistry')) {
            db.createObjectStore('statRegistry', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('skillBank')) {
            const skillStore = db.createObjectStore('skillBank', { keyPath: 'id' });
            skillStore.createIndex('type', 'type', { unique: false });
            skillStore.createIndex('name', 'name', { unique: false });
            skillStore.createIndex('tier', 'tier', { unique: false }); // For tier-based queries
            skillStore.createIndex('createdAt', 'createdAt', { unique: false }); // For sorting by date
          }

          if (!db.objectStoreNames.contains('itemBank')) {
            const itemStore = db.createObjectStore('itemBank', { keyPath: 'id' });
            itemStore.createIndex('type', 'type', { unique: false });
            itemStore.createIndex('name', 'name', { unique: false });
            itemStore.createIndex('rarity', 'rarity', { unique: false }); // For rarity-based queries
            itemStore.createIndex('createdAt', 'createdAt', { unique: false }); // For sorting by date
          }

          if (!db.objectStoreNames.contains('actors')) {
            const actorStore = db.createObjectStore('actors', { keyPath: 'id' });
            actorStore.createIndex('class', 'class', { unique: false });
            actorStore.createIndex('isFav', 'isFav', { unique: false });
            actorStore.createIndex('name', 'name', { unique: false }); // For name-based queries
            actorStore.createIndex('createdAt', 'createdAt', { unique: false }); // For sorting by date
          }

          if (!db.objectStoreNames.contains('books')) {
            db.createObjectStore('books', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('relationships')) {
            const relStore = db.createObjectStore('relationships', { keyPath: 'id' });
            relStore.createIndex('actors', 'actors', { unique: false, multiEntry: true });
          }

          if (!db.objectStoreNames.contains('wiki')) {
            const wikiStore = db.createObjectStore('wiki', { keyPath: 'id' });
            wikiStore.createIndex('type', 'type', { unique: false });
            wikiStore.createIndex('linkedTo', 'linkedTo', { unique: false });
          }

          if (!db.objectStoreNames.contains('skillTrees')) {
            db.createObjectStore('skillTrees', { keyPath: 'id' });
          }
        }

        // Migration for version 2-4: Add epic enhancement stores
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('plotThreads')) {
            const plotThreadStore = db.createObjectStore('plotThreads', { keyPath: 'id' });
            plotThreadStore.createIndex('status', 'status', { unique: false });
            plotThreadStore.createIndex('completion', 'completion', { unique: false });
          }

          if (!db.objectStoreNames.contains('characterArcs')) {
            const charArcStore = db.createObjectStore('characterArcs', { keyPath: 'characterId' });
            charArcStore.createIndex('characterName', 'characterName', { unique: false });
          }

          if (!db.objectStoreNames.contains('consistencyIssues')) {
            const issueStore = db.createObjectStore('consistencyIssues', { keyPath: 'id' });
            issueStore.createIndex('type', 'type', { unique: false });
            issueStore.createIndex('severity', 'severity', { unique: false });
            issueStore.createIndex('status', 'status', { unique: false });
          }

          if (!db.objectStoreNames.contains('resolvedIssues')) {
            db.createObjectStore('resolvedIssues', { keyPath: 'id' });
          }
        }

        // Migration for version 5: Add documents stores
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('documents')) {
            const docStore = db.createObjectStore('documents', { keyPath: 'id' });
            docStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            docStore.createIndex('fileType', 'fileType', { unique: false });
          }

          if (!db.objectStoreNames.contains('documentSuggestions')) {
            const suggStore = db.createObjectStore('documentSuggestions', { keyPath: 'id' });
            suggStore.createIndex('documentId', 'documentId', { unique: false });
            suggStore.createIndex('type', 'type', { unique: false });
            suggStore.createIndex('status', 'status', { unique: false });
          }
        }

        // Migration for version 6: Add Manuscript Intelligence stores
        if (oldVersion < 6) {
          // Wiki entries with version history
          if (!db.objectStoreNames.contains('wikiEntries')) {
            const wikiStore = db.createObjectStore('wikiEntries', { keyPath: 'id' });
            wikiStore.createIndex('entityId', 'entityId', { unique: false });
            wikiStore.createIndex('entityType', 'entityType', { unique: false });
            wikiStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Processing history
          if (!db.objectStoreNames.contains('processingHistory')) {
            const historyStore = db.createObjectStore('processingHistory', { keyPath: 'id' });
            historyStore.createIndex('processedAt', 'processedAt', { unique: false });
            historyStore.createIndex('documentId', 'documentId', { unique: false });
          }

          // Customizable buzz words
          if (!db.objectStoreNames.contains('buzzWords')) {
            const buzzStore = db.createObjectStore('buzzWords', { keyPath: 'id' });
            buzzStore.createIndex('tag', 'tag', { unique: true });
            buzzStore.createIndex('type', 'type', { unique: false });
          }

          // Manuscript suggestions (before review)
          if (!db.objectStoreNames.contains('manuscriptSuggestions')) {
            const suggStore = db.createObjectStore('manuscriptSuggestions', { keyPath: 'id' });
            suggStore.createIndex('documentId', 'documentId', { unique: false });
            suggStore.createIndex('type', 'type', { unique: false });
            suggStore.createIndex('status', 'status', { unique: false });
            suggStore.createIndex('confidence', 'confidence', { unique: false });
          }
        }

        // Migration for version 7-8: Add images store for AI-generated images
        if (oldVersion < 8) {
          if (!db.objectStoreNames.contains('images')) {
            const imageStore = db.createObjectStore('images', { keyPath: 'id' });
            imageStore.createIndex('path', 'path', { unique: false });
            imageStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }

        // Migration for version 9: Add story context documents store
        if (oldVersion < 9) {
          if (!db.objectStoreNames.contains('storyContextDocuments')) {
            const contextStore = db.createObjectStore('storyContextDocuments', { keyPath: 'id' });
            contextStore.createIndex('title', 'title', { unique: false });
            contextStore.createIndex('category', 'category', { unique: false });
            contextStore.createIndex('createdAt', 'createdAt', { unique: false });
            contextStore.createIndex('enabled', 'enabled', { unique: false });
          }
        }

        // Migration for version 10: Add extraction history for reversible changes
        if (oldVersion < 10) {
          if (!db.objectStoreNames.contains('extractionHistory')) {
            const historyStore = db.createObjectStore('extractionHistory', { keyPath: 'id' });
            historyStore.createIndex('extractionId', 'extractionId', { unique: false });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
            historyStore.createIndex('chapterId', 'chapterId', { unique: false });
            historyStore.createIndex('entityType', 'entityType', { unique: false });
            historyStore.createIndex('entityId', 'entityId', { unique: false });
            historyStore.createIndex('reverted', 'reverted', { unique: false });
          }

          if (!db.objectStoreNames.contains('extractionSessions')) {
            const sessionStore = db.createObjectStore('extractionSessions', { keyPath: 'id' });
            sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
            sessionStore.createIndex('chapterId', 'chapterId', { unique: false });
            sessionStore.createIndex('sourceType', 'sourceType', { unique: false });
          }
        }

        // Migration for version 11: Add visualization and auto-integration stores
        if (oldVersion < 11) {
          // Timeline Events - Master timeline for all story events
          if (!db.objectStoreNames.contains('timelineEvents')) {
            const timelineStore = db.createObjectStore('timelineEvents', { keyPath: 'id' });
            timelineStore.createIndex('type', 'type', { unique: false });
            timelineStore.createIndex('bookId', 'bookId', { unique: false });
            timelineStore.createIndex('chapterId', 'chapterId', { unique: false });
            timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
            timelineStore.createIndex('entityType', 'entityType', { unique: false });
          }

          // Locations - UK map locations with coordinates
          if (!db.objectStoreNames.contains('locations')) {
            const locationStore = db.createObjectStore('locations', { keyPath: 'id' });
            locationStore.createIndex('name', 'name', { unique: false });
            locationStore.createIndex('type', 'type', { unique: false });
            locationStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Character Travel - Travel history for map visualization
          if (!db.objectStoreNames.contains('characterTravel')) {
            const travelStore = db.createObjectStore('characterTravel', { keyPath: 'id' });
            travelStore.createIndex('actorId', 'actorId', { unique: false });
            travelStore.createIndex('actorName', 'actorName', { unique: false });
            travelStore.createIndex('chapterId', 'chapterId', { unique: false });
            travelStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Mind Map Nodes - Story mind map nodes
          if (!db.objectStoreNames.contains('mindMapNodes')) {
            const nodesStore = db.createObjectStore('mindMapNodes', { keyPath: 'id' });
            nodesStore.createIndex('entityId', 'entityId', { unique: false });
            nodesStore.createIndex('entityType', 'entityType', { unique: false });
            nodesStore.createIndex('type', 'type', { unique: false });
            nodesStore.createIndex('group', 'group', { unique: false });
          }

          // Mind Map Edges - Connections between nodes
          if (!db.objectStoreNames.contains('mindMapEdges')) {
            const edgesStore = db.createObjectStore('mindMapEdges', { keyPath: 'id' });
            edgesStore.createIndex('source', 'source', { unique: false });
            edgesStore.createIndex('target', 'target', { unique: false });
            edgesStore.createIndex('type', 'type', { unique: false });
            edgesStore.createIndex('chapterId', 'chapterId', { unique: false });
          }
        }

        // Migration for version 12: Add Writer's Universe Intelligence stores
        if (oldVersion < 12) {
          // Story Profile - Core onboarding and style data
          if (!db.objectStoreNames.contains('storyProfile')) {
            const profileStore = db.createObjectStore('storyProfile', { keyPath: 'id' });
            profileStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Character Voices - Per-character voice profiles
          if (!db.objectStoreNames.contains('characterVoices')) {
            const voiceStore = db.createObjectStore('characterVoices', { keyPath: 'id' });
            voiceStore.createIndex('actorId', 'actorId', { unique: true });
            voiceStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Plot Beats - Living to-do list of story beats
          if (!db.objectStoreNames.contains('plotBeats')) {
            const beatStore = db.createObjectStore('plotBeats', { keyPath: 'id' });
            beatStore.createIndex('chapter', 'chapter', { unique: false });
            beatStore.createIndex('completed', 'completed', { unique: false });
            beatStore.createIndex('order', 'order', { unique: false });
          }

          // Chapter Overviews - AI-generated chapter summaries
          if (!db.objectStoreNames.contains('chapterOverviews')) {
            const overviewStore = db.createObjectStore('chapterOverviews', { keyPath: 'id' });
            overviewStore.createIndex('bookId', 'bookId', { unique: false });
            overviewStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
            overviewStore.createIndex('approvedAt', 'approvedAt', { unique: false });
          }

          // Style Evolution - Track style changes over time
          if (!db.objectStoreNames.contains('styleEvolution')) {
            const evolutionStore = db.createObjectStore('styleEvolution', { keyPath: 'id' });
            evolutionStore.createIndex('reviewedAtChapter', 'reviewedAtChapter', { unique: false });
            evolutionStore.createIndex('approvedAt', 'approvedAt', { unique: false });
          }

          // Entity Chapter States - Track entity states per chapter
          if (!db.objectStoreNames.contains('entityChapterStates')) {
            const stateStore = db.createObjectStore('entityChapterStates', { keyPath: 'id' });
            stateStore.createIndex('entityId', 'entityId', { unique: false });
            stateStore.createIndex('entityType', 'entityType', { unique: false });
            stateStore.createIndex('bookId', 'bookId', { unique: false });
            stateStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
          }

          // Onboarding Progress - Track wizard completion
          if (!db.objectStoreNames.contains('onboardingProgress')) {
            const progressStore = db.createObjectStore('onboardingProgress', { keyPath: 'id' });
            progressStore.createIndex('completedAt', 'completedAt', { unique: false });
          }
        }

        // Migration for version 14: Add style reference stores
        if (oldVersion < 14) {
          // Style References - Writing style documents
          if (!db.objectStoreNames.contains('styleReferences')) {
            const styleStore = db.createObjectStore('styleReferences', { keyPath: 'id' });
            styleStore.createIndex('scope', 'scope', { unique: false });
            styleStore.createIndex('projectId', 'projectId', { unique: false });
            styleStore.createIndex('type', 'type', { unique: false });
            styleStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Style Patterns - Extracted style patterns from analysis
          if (!db.objectStoreNames.contains('stylePatterns')) {
            const patternStore = db.createObjectStore('stylePatterns', { keyPath: 'id' });
            patternStore.createIndex('styleId', 'styleId', { unique: false });
            patternStore.createIndex('extractedAt', 'extractedAt', { unique: false });
          }

          // Style Versions - Version history for style references
          if (!db.objectStoreNames.contains('styleVersions')) {
            const versionStore = db.createObjectStore('styleVersions', { keyPath: 'id' });
            versionStore.createIndex('styleId', 'styleId', { unique: false });
            versionStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }

        // Migration for version 15: Add AI learning and context stores
        if (oldVersion < 15) {
          // Style Test Results - Store style test ratings and feedback
          if (!db.objectStoreNames.contains('styleTestResults')) {
            const testStore = db.createObjectStore('styleTestResults', { keyPath: 'id' });
            testStore.createIndex('moodPreset', 'moodPreset', { unique: false });
            testStore.createIndex('rating', 'rating', { unique: false });
            testStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Character Timelines - Track character changes over time
          if (!db.objectStoreNames.contains('characterTimelines')) {
            const timelineStore = db.createObjectStore('characterTimelines', { keyPath: 'id' });
            timelineStore.createIndex('actorId', 'actorId', { unique: false });
            timelineStore.createIndex('chapterId', 'chapterId', { unique: false });
            timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
            timelineStore.createIndex('eventType', 'eventType', { unique: false });
          }

          // Scene Contexts - Store scene context per chapter
          if (!db.objectStoreNames.contains('sceneContexts')) {
            const sceneStore = db.createObjectStore('sceneContexts', { keyPath: 'id' });
            sceneStore.createIndex('chapterId', 'chapterId', { unique: false });
            sceneStore.createIndex('bookId', 'bookId', { unique: false });
            sceneStore.createIndex('position', 'position', { unique: false });
            sceneStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Negative Examples - Store rejected AI outputs with tags
          if (!db.objectStoreNames.contains('negativeExamples')) {
            const negativeStore = db.createObjectStore('negativeExamples', { keyPath: 'id' });
            negativeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            negativeStore.createIndex('createdAt', 'createdAt', { unique: false });
            negativeStore.createIndex('moodPreset', 'moodPreset', { unique: false });
          }

          // Style Instructions - Store specific style rules
          if (!db.objectStoreNames.contains('styleInstructions')) {
            const instructionStore = db.createObjectStore('styleInstructions', { keyPath: 'id' });
            instructionStore.createIndex('category', 'category', { unique: false });
            instructionStore.createIndex('priority', 'priority', { unique: false });
            instructionStore.createIndex('enabled', 'enabled', { unique: false });
          }
        }

        // Migration for version 16: Add voice preferences for TTS
        if (oldVersion < 16) {
          // Voice Preferences - Store TTS voice preferences per project/character
          if (!db.objectStoreNames.contains('voicePreferences')) {
            const voiceStore = db.createObjectStore('voicePreferences', { keyPath: 'id' });
            voiceStore.createIndex('characterId', 'characterId', { unique: false });
            voiceStore.createIndex('projectId', 'projectId', { unique: false });
            voiceStore.createIndex('provider', 'provider', { unique: false });
            voiceStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
        }

        // Migration for version 17: Add chapter templates store
        if (oldVersion < 17) {
          if (!db.objectStoreNames.contains('chapterTemplates')) {
            const templateStore = db.createObjectStore('chapterTemplates', { keyPath: 'id' });
            templateStore.createIndex('bookId', 'bookId', { unique: false });
            templateStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }

        // Migration for version 18: Add mind map state and skill tree layouts
        if (oldVersion < 18) {
          // Mind Map State - Save planetary mind map positions
          if (!db.objectStoreNames.contains('mindMapState')) {
            const mindMapStore = db.createObjectStore('mindMapState', { keyPath: 'id' });
            mindMapStore.createIndex('lastGenerated', 'lastGenerated', { unique: false });
            mindMapStore.createIndex('layoutMode', 'layoutMode', { unique: false });
          }

          // Skill Tree Layouts - Save skill node positions per actor
          if (!db.objectStoreNames.contains('skillTreeLayouts')) {
            const skillTreeStore = db.createObjectStore('skillTreeLayouts', { keyPath: 'id' });
            skillTreeStore.createIndex('actorId', 'actorId', { unique: true });
            skillTreeStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
        }

        // Migration for version 19: Add AI suggestions, feedback, and enhanced persistence stores
        if (oldVersion < 19) {
          // AI Suggestions - Store AI-generated suggestions
          if (!db.objectStoreNames.contains('aiSuggestions')) {
            const suggestionStore = db.createObjectStore('aiSuggestions', { keyPath: 'id' });
            suggestionStore.createIndex('type', 'type', { unique: false });
            suggestionStore.createIndex('priority', 'priority', { unique: false });
            suggestionStore.createIndex('chapterId', 'chapterId', { unique: false });
            suggestionStore.createIndex('bookId', 'bookId', { unique: false });
            suggestionStore.createIndex('status', 'status', { unique: false });
            suggestionStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Suggestion Feedback - Track user feedback on suggestions
          if (!db.objectStoreNames.contains('suggestionFeedback')) {
            const feedbackStore = db.createObjectStore('suggestionFeedback', { keyPath: 'id' });
            feedbackStore.createIndex('suggestionId', 'suggestionId', { unique: false });
            feedbackStore.createIndex('rating', 'rating', { unique: false });
            feedbackStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Wizard State - Save manuscript intelligence wizard state
          if (!db.objectStoreNames.contains('wizardState')) {
            const wizardStore = db.createObjectStore('wizardState', { keyPath: 'id' });
            wizardStore.createIndex('sessionId', 'sessionId', { unique: false });
            wizardStore.createIndex('timestamp', 'timestamp', { unique: false });
            wizardStore.createIndex('status', 'status', { unique: false });
          }

          // Storylines - Store storylines/plot threads
          if (!db.objectStoreNames.contains('storylines')) {
            const storylineStore = db.createObjectStore('storylines', { keyPath: 'id' });
            storylineStore.createIndex('status', 'status', { unique: false });
            storylineStore.createIndex('chapterId', 'chapterId', { unique: false });
            storylineStore.createIndex('bookId', 'bookId', { unique: false });
            storylineStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Decisions - Store tracked decisions
          if (!db.objectStoreNames.contains('decisions')) {
            const decisionStore = db.createObjectStore('decisions', { keyPath: 'id' });
            decisionStore.createIndex('chapterId', 'chapterId', { unique: false });
            decisionStore.createIndex('bookId', 'bookId', { unique: false });
            decisionStore.createIndex('importance', 'importance', { unique: false });
            decisionStore.createIndex('resolved', 'resolved', { unique: false });
            decisionStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Callbacks - Store callback opportunities
          if (!db.objectStoreNames.contains('callbacks')) {
            const callbackStore = db.createObjectStore('callbacks', { keyPath: 'id' });
            callbackStore.createIndex('chapterId', 'chapterId', { unique: false });
            callbackStore.createIndex('bookId', 'bookId', { unique: false });
            callbackStore.createIndex('targetChapter', 'targetChapter', { unique: false });
            callbackStore.createIndex('used', 'used', { unique: false });
            callbackStore.createIndex('importance', 'importance', { unique: false });
            callbackStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Memories - Store important memories
          if (!db.objectStoreNames.contains('memories')) {
            const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
            memoryStore.createIndex('chapterId', 'chapterId', { unique: false });
            memoryStore.createIndex('bookId', 'bookId', { unique: false });
            memoryStore.createIndex('importance', 'importance', { unique: false });
            memoryStore.createIndex('referenced', 'referenced', { unique: false });
            memoryStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }

        // Migration for version 21: Narrative Control Integration
        if (oldVersion < 21) {
          // Canon Sessions - Track extraction session lifecycle
          if (!db.objectStoreNames.contains('canonSessions')) {
            const sessionStore = db.createObjectStore('canonSessions', { keyPath: 'id' });
            sessionStore.createIndex('chapterId', 'chapterId', { unique: false });
            sessionStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
            sessionStore.createIndex('status', 'status', { unique: false });
            sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
            sessionStore.createIndex('committedAt', 'committedAt', { unique: false });
          }

          // Narrative Review Queue - Unified queue for all extraction nodes
          if (!db.objectStoreNames.contains('narrativeReviewQueue')) {
            const queueStore = db.createObjectStore('narrativeReviewQueue', { keyPath: 'id' });
            queueStore.createIndex('sessionId', 'sessionId', { unique: false });
            queueStore.createIndex('chapterId', 'chapterId', { unique: false });
            queueStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
            queueStore.createIndex('domain', 'domain', { unique: false });
            queueStore.createIndex('status', 'status', { unique: false });
            queueStore.createIndex('blocking', 'blocking', { unique: false });
            queueStore.createIndex('confidenceBand', 'confidenceBand', { unique: false });
            queueStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Queue Audit - Full audit trail of queue actions
          if (!db.objectStoreNames.contains('queueAudit')) {
            const auditStore = db.createObjectStore('queueAudit', { keyPath: 'id' });
            auditStore.createIndex('queueItemId', 'queueItemId', { unique: false });
            auditStore.createIndex('sessionId', 'sessionId', { unique: false });
            auditStore.createIndex('action', 'action', { unique: false });
            auditStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Chapter Versions - Immutable canon snapshots
          if (!db.objectStoreNames.contains('chapterVersions')) {
            const versionStore = db.createObjectStore('chapterVersions', { keyPath: 'id' });
            versionStore.createIndex('chapterId', 'chapterId', { unique: false });
            versionStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
            versionStore.createIndex('versionNumber', 'versionNumber', { unique: false });
            versionStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Chapter Changelog - Diff records between versions
          if (!db.objectStoreNames.contains('chapterChangelog')) {
            const changelogStore = db.createObjectStore('chapterChangelog', { keyPath: 'id' });
            changelogStore.createIndex('chapterId', 'chapterId', { unique: false });
            changelogStore.createIndex('fromVersion', 'fromVersion', { unique: false });
            changelogStore.createIndex('toVersion', 'toVersion', { unique: false });
            changelogStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Retro Impacts - Downstream impact tracking for retro-edits
          if (!db.objectStoreNames.contains('retroImpacts')) {
            const retroStore = db.createObjectStore('retroImpacts', { keyPath: 'id' });
            retroStore.createIndex('originChapterId', 'originChapterId', { unique: false });
            retroStore.createIndex('impactedChapterId', 'impactedChapterId', { unique: false });
            retroStore.createIndex('severity', 'severity', { unique: false });
            retroStore.createIndex('status', 'status', { unique: false });
            retroStore.createIndex('blocking', 'blocking', { unique: false });
            retroStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Plot Quests - Quest tracking merged into Plot domain
          if (!db.objectStoreNames.contains('plotQuests')) {
            const questStore = db.createObjectStore('plotQuests', { keyPath: 'id' });
            questStore.createIndex('plotThreadId', 'plotThreadId', { unique: false });
            questStore.createIndex('type', 'type', { unique: false });
            questStore.createIndex('status', 'status', { unique: false });
            questStore.createIndex('chapterId', 'chapterId', { unique: false });
            questStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Factions - Faction entities under World/Lore domain
          if (!db.objectStoreNames.contains('factions')) {
            const factionStore = db.createObjectStore('factions', { keyPath: 'id' });
            factionStore.createIndex('name', 'name', { unique: false });
            factionStore.createIndex('type', 'type', { unique: false });
            factionStore.createIndex('status', 'status', { unique: false });
            factionStore.createIndex('chapterId', 'chapterId', { unique: false });
            factionStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Extraction Failures - Track failed extraction nodes
          if (!db.objectStoreNames.contains('extractionFailures')) {
            const failureStore = db.createObjectStore('extractionFailures', { keyPath: 'id' });
            failureStore.createIndex('sessionId', 'sessionId', { unique: false });
            failureStore.createIndex('chapterId', 'chapterId', { unique: false });
            failureStore.createIndex('domain', 'domain', { unique: false });
            failureStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Canon Settings - Configurable confidence thresholds and policies
          if (!db.objectStoreNames.contains('canonSettings')) {
            db.createObjectStore('canonSettings', { keyPath: 'id' });
          }
        }

        // Legacy version 17 check (if it exists)
        if (oldVersion < 17 && oldVersion >= 16) {
          // Chapter Templates - Store custom chapter templates
          if (!db.objectStoreNames.contains('chapterTemplates')) {
            const templateStore = db.createObjectStore('chapterTemplates', { keyPath: 'id' });
            templateStore.createIndex('name', 'name', { unique: false });
            templateStore.createIndex('createdAt', 'createdAt', { unique: false });
            templateStore.createIndex('isCustom', 'isCustom', { unique: false });
          }
        }

        // Migration for version 20: Add missing sync stores
        if (oldVersion < 20) {
          if (!db.objectStoreNames.contains('backups')) {
            const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
            backupStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('snapshots')) {
            const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
            snapshotStore.createIndex('actorId', 'actorId', { unique: false });
            snapshotStore.createIndex('bookId', 'bookId', { unique: false });
            snapshotStore.createIndex('chapterId', 'chapterId', { unique: false });
            snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }

        // Migration for version 22: Story Brain chapter memories
        if (oldVersion < 22) {
          if (!db.objectStoreNames.contains('chapterMemories')) {
            const memoryStore = db.createObjectStore('chapterMemories', { keyPath: 'id' });
            memoryStore.createIndex('bookId', 'bookId', { unique: false });
            memoryStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
            memoryStore.createIndex('generatedAt', 'generatedAt', { unique: false });
          }
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (this.db) {
      // Check if database is still open
      try {
        // Try to access objectStoreNames to verify connection is still valid
        if (this.db.objectStoreNames) {
          return; // Already initialized and valid
        }
      } catch (e) {
        // Database connection is invalid, reset and reinitialize
        this.db = null;
      }
    }
    
    // Initialize if not already done
    try {
      await this.init();
      if (!this.db) {
        throw new Error('Database initialization failed - db is null after init');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Clear expired cache entries
   */
  _cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cached result if available and not expired
   */
  _getCached(key) {
    this._cleanCache();
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache entry with TTL
   */
  _setCache(key, data, ttl = null) {
    const expires = Date.now() + (ttl || this.cacheTTL);
    this.cache.set(key, { data, expires });
  }

  /**
   * Clear all cache or specific key
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Generic CRUD operations
   */
  async add(storeName, data) {
    await this.ensureInitialized();
    // Invalidate cache for this store
    this._invalidateStoreCache(storeName);
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Invalidate cache for a specific store
   */
  _invalidateStoreCache(storeName) {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${storeName}:`)) {
        this.cache.delete(key);
      }
    }
  }

  async get(storeName, key, useCache = true) {
    await this.ensureInitialized();
    
    // Check cache first
    if (useCache) {
      const cacheKey = `${storeName}:get:${key}`;
      const cached = this._getCached(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        // Cache the result
        if (useCache) {
          this._setCache(`${storeName}:get:${key}`, result);
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, useCache = true) {
    await this.ensureInitialized();
    
    // Check cache first
    if (useCache) {
      const cacheKey = `${storeName}:getAll`;
      const cached = this._getCached(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result;
        // Cache the result
        if (useCache) {
          this._setCache(`${storeName}:getAll`, result);
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get paginated results from a store
   * @param {string} storeName - Name of the object store
   * @param {number} page - Page number (1-indexed)
   * @param {number} pageSize - Number of items per page
   * @param {string} indexName - Optional index to sort by
   * @param {string} direction - 'next' or 'prev' for cursor direction
   * @returns {Promise<{items: Array, total: number, page: number, pageSize: number, hasMore: boolean}>}
   */
  async getPaginated(storeName, page = 1, pageSize = 50, indexName = null, direction = 'next') {
    await this.ensureInitialized();
    
    const cacheKey = `${storeName}:paginated:${page}:${pageSize}:${indexName || 'none'}:${direction}`;
    const cached = this._getCached(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    // Get total count
    const countRequest = store.count();
    const total = await new Promise((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    
    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    return new Promise((resolve, reject) => {
      let items = [];
      let itemsProcessed = 0;
      
      const source = indexName ? store.index(indexName) : store;
      const request = direction === 'next' 
        ? source.openCursor(null, 'next')
        : source.openCursor(null, 'prev');
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (!cursor) {
          // No more items
          const result = {
            items,
            total,
            page,
            pageSize,
            hasMore: offset + items.length < total
          };
          this._setCache(cacheKey, result);
          resolve(result);
          return;
        }
        
        // Skip items before offset
        if (itemsProcessed < offset) {
          itemsProcessed++;
          cursor.continue();
          return;
        }
        
        // Collect items for this page
        if (items.length < pageSize) {
          items.push(cursor.value);
          itemsProcessed++;
          cursor.continue();
        } else {
          // Page full
          const result = {
            items,
            total,
            page,
            pageSize,
            hasMore: offset + items.length < total
          };
          this._setCache(cacheKey, result);
          resolve(result);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Batch read multiple items efficiently
   * @param {string} storeName - Name of the object store
   * @param {Array} keys - Array of keys to retrieve
   * @returns {Promise<Array>} Array of results (null for missing keys)
   */
  async batchGet(storeName, keys) {
    await this.ensureInitialized();
    
    // Check cache first
    const cacheKey = `${storeName}:batch:${keys.sort().join(',')}`;
    const cached = this._getCached(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    // Use Promise.all for parallel reads within the transaction
    const promises = keys.map(key => {
      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null); // Return null for errors
      });
    });
    
    const results = await Promise.all(promises);
    this._setCache(cacheKey, results);
    return results;
  }

  async update(storeName, data) {
    await this.ensureInitialized();
    // Invalidate cache for this store and specific item
    this._invalidateStoreCache(storeName);
    if (data && data.id) {
      this.cache.delete(`${storeName}:get:${data.id}`);
    }
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    await this.ensureInitialized();
    // Invalidate cache
    this._invalidateStoreCache(storeName);
    this.cache.delete(`${storeName}:get:${key}`);
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.ensureInitialized();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query by index
   */
  async getByIndex(storeName, indexName, value) {
    await this.ensureInitialized();
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Bulk operations
   */
  async bulkAdd(storeName, dataArray) {
    await this.ensureInitialized();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const promises = dataArray.map(data => {
      return new Promise((resolve, reject) => {
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
    return Promise.all(promises);
  }

  async bulkUpdate(storeName, dataArray) {
    await this.ensureInitialized();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const promises = dataArray.map(data => {
      return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
    return Promise.all(promises);
  }

  /**
   * Execute a custom IndexedDB transaction across one or many stores.
   */
  async executeTransaction(storeNames, mode, operationFn) {
    await this.ensureInitialized();
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    const transaction = this.db.transaction(stores, mode);
    const storeMap = Object.fromEntries(stores.map(name => [name, transaction.objectStore(name)]));

    return new Promise((resolve, reject) => {
      let settled = false;
      const settleResolve = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      const settleReject = (error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      let operationResult;
      transaction.oncomplete = () => settleResolve(operationResult);
      transaction.onerror = () => settleReject(transaction.error);
      transaction.onabort = () => settleReject(transaction.error || new Error('Transaction aborted'));

      Promise.resolve()
        .then(() => operationFn({ transaction, stores: storeMap }))
        .then(result => {
          operationResult = result;
        })
        .catch(error => {
          try {
            transaction.abort();
          } catch (abortError) {
            console.warn('Transaction abort warning:', abortError);
          }
          settleReject(error);
        });
    });
  }

  /**
   * Batch upsert with chunking to avoid oversized transactions.
   */
  async batchUpsert(storeName, records, batchSize = 50) {
    await this.ensureInitialized();
    if (!Array.isArray(records) || records.length === 0) {
      return 0;
    }

    const normalizedBatchSize = Math.max(1, Number(batchSize) || 50);
    for (let i = 0; i < records.length; i += normalizedBatchSize) {
      const chunk = records.slice(i, i + normalizedBatchSize);
      await this.executeTransaction(storeName, 'readwrite', ({ stores }) => {
        chunk.forEach(record => {
          stores[storeName].put(record);
        });
      });
    }

    this._invalidateStoreCache(storeName);
    return records.length;
  }

  async getStoreNames() {
    await this.ensureInitialized();
    return Array.from(this.db.objectStoreNames || []);
  }

  getSchemaVersion() {
    return DB_VERSION;
  }

  /**
   * Export all data
   */
  async exportData() {
    const data = {};
    const storeNames = [
      'meta', 'statRegistry', 'skillBank', 'itemBank', 'actors', 'books',
      'relationships', 'wiki', 'skillTrees',
      // Narrative control stores
      'canonSessions', 'narrativeReviewQueue', 'queueAudit',
      'chapterVersions', 'chapterChangelog', 'retroImpacts',
      'plotQuests', 'factions', 'canonSettings',
      // Visualization & context stores
      'timelineEvents', 'locations', 'plotThreads', 'plotBeats',
      'wikiEntries', 'characterArcs', 'extractionHistory', 'extractionSessions'
    ];

    for (const storeName of storeNames) {
      data[storeName] = await this.getAll(storeName);
    }

    return data;
  }

  /**
   * Import data (replaces existing data)
   */
  async importData(data) {
    const storeNames = Object.keys(data);

    for (const storeName of storeNames) {
      if (this.db.objectStoreNames.contains(storeName)) {
        await this.clear(storeName);
        if (data[storeName] && data[storeName].length > 0) {
          await this.bulkAdd(storeName, data[storeName]);
        }
      }
    }
  }

  /**
   * Create a backup of all data
   */
  async createBackup() {
    try {
      const data = await this.exportData();
      const backup = {
        id: `backup_${Date.now()}`,
        timestamp: Date.now(),
        data
      };
      await this.add('backups', backup);
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup: ' + error.message);
    }
  }

  /**
   * Get backups
   */
  async getBackups(limit = 10) {
    try {
      const transaction = this.db.transaction(['backups'], 'readonly');
      const store = transaction.objectStore('backups');
      const index = store.index('timestamp');
      return new Promise((resolve, reject) => {
        const request = index.getAll();
        request.onsuccess = () => {
          const backups = request.result.sort((a, b) => b.timestamp - a.timestamp);
          resolve(backups.slice(0, limit));
        };
        request.onerror = () => {
          console.error('Error getting backups:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backup) {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup data');
    }
    await this.importData(backup.data);
  }

  /**
   * Save actor snapshot
   */
  async saveSnapshot(actorId, bookId, chapterId, snapshotData) {
    try {
      const snapshot = {
        id: `snapshot_${actorId}_${bookId}_${chapterId}_${Date.now()}`,
        actorId: actorId,
        bookId: bookId,
        chapterId: chapterId,
        data: snapshotData,
        timestamp: Date.now()
      };

      // Check if snapshots store exists, if not create it
      if (!this.db.objectStoreNames.contains('snapshots')) {
        // Note: This would require a database version upgrade
        // For now, store in meta with a key pattern
        await this.update('meta', {
          id: `snapshot_${actorId}_${bookId}_${chapterId}`,
          ...snapshot
        });
      } else {
        await this.add('snapshots', snapshot);
      }

      return snapshot;
    } catch (error) {
      console.error('Error saving snapshot:', error);
      // Fallback to meta storage
      try {
        await this.update('meta', {
          id: `snapshot_${actorId}_${bookId}_${chapterId}`,
          actorId: actorId,
          bookId: bookId,
          chapterId: chapterId,
          data: snapshotData,
          timestamp: Date.now()
        });
      } catch (e) {
        throw new Error('Failed to save snapshot: ' + e.message);
      }
    }
  }

  /**
   * Get snapshot for specific actor, book, and chapter
   */
  async getSnapshot(actorId, bookId, chapterId) {
    try {
      if (this.db.objectStoreNames.contains('snapshots')) {
        const snapshots = await this.getAll('snapshots');
        return snapshots.find(s => 
          s.actorId === actorId && 
          s.bookId === bookId && 
          s.chapterId === chapterId
        );
      } else {
        // Fallback to meta storage
        return await this.get('meta', `snapshot_${actorId}_${bookId}_${chapterId}`);
      }
    } catch (error) {
      console.error('Error getting snapshot:', error);
      return null;
    }
  }

  /**
   * Get latest snapshots for multiple actors
   */
  async getLatestSnapshotsForActors(actorIds, bookId = null, chapterId = null) {
    try {
      const snapshots = {};

      if (this.db.objectStoreNames.contains('snapshots')) {
        const allSnapshots = await this.getAll('snapshots');
        
        for (const actorId of actorIds) {
          // Filter snapshots for this actor
          let actorSnapshots = allSnapshots.filter(s => s.actorId === actorId);
          
          // If book/chapter specified, filter further
          if (bookId !== null) {
            actorSnapshots = actorSnapshots.filter(s => s.bookId === bookId);
          }
          if (chapterId !== null) {
            actorSnapshots = actorSnapshots.filter(s => s.chapterId === chapterId);
          }

          // Get the latest one
          if (actorSnapshots.length > 0) {
            const latest = actorSnapshots.sort((a, b) => 
              (b.timestamp || 0) - (a.timestamp || 0)
            )[0];
            snapshots[actorId] = latest.data || latest;
          }
        }
      } else {
        // Fallback: try to get from meta or actor snapshots property
        for (const actorId of actorIds) {
          try {
            // Try getting from meta first
            const metaKey = bookId && chapterId 
              ? `snapshot_${actorId}_${bookId}_${chapterId}`
              : null;
            
            if (metaKey) {
              const snapshot = await this.get('meta', metaKey);
              if (snapshot) {
                snapshots[actorId] = snapshot.data || snapshot;
                continue;
              }
            }

            // Try getting actor and checking snapshots property
            const actor = await this.get('actors', actorId);
            if (actor && actor.snapshots) {
              // Get latest snapshot from actor's snapshots object
              const snapshotKeys = Object.keys(actor.snapshots);
              if (snapshotKeys.length > 0) {
                const latestKey = snapshotKeys.sort().reverse()[0];
                snapshots[actorId] = actor.snapshots[latestKey];
              }
            }
          } catch (e) {
            console.warn(`Could not get snapshot for actor ${actorId}:`, e);
          }
        }
      }

      return snapshots;
    } catch (error) {
      console.error('Error getting latest snapshots:', error);
      return {};
    }
  }
}

// Create singleton instance
const db = new ClaimwiseDB();

export default db;
