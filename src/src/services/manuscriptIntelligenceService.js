/**
 * Manuscript Intelligence Service
 * Comprehensive extraction service for book structures, chapters, and story data
 */

import aiService from './aiService';
import db from './database';
import chapterDataExtractionService from './chapterDataExtractionService';
import aiSuggestionService from './aiSuggestionService';
import relationshipAnalysisService from './relationshipAnalysisService';
import plotThreadingService from './plotThreadingService';
import emotionalBeatService from './emotionalBeatService';
import dialogueAnalysisService from './dialogueAnalysisService';
import worldConsistencyService from './worldConsistencyService';

class ManuscriptIntelligenceService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Extract book structure from document
   * @param {string} docText - Full document text
   * @param {Array} existingBooks - Existing books for reference
   * @returns {Promise<Object>} Extracted book structure
   */
  async extractBookStructure(docText, existingBooks = []) {
    try {
      const existingTitles = existingBooks.map(b => b.title || '').filter(Boolean).join(', ');
      
      const systemContext = `You are analyzing a document for "The Compliance Run" book series.
Extract book structure including title, focus theme, description, and metadata.
Return JSON with this structure:
{
  "book": {
    "title": "Book Title",
    "focus": "Main theme/focus",
    "desc": "Book description",
    "bookNumber": 1,
    "metadata": {
      "genre": "...",
      "tone": "...",
      "setting": "..."
    }
  },
  "confidence": 0.9
}`;

      const prompt = `Analyze this document and extract book structure:

${docText.substring(0, 10000)}

${existingTitles ? `Existing books: ${existingTitles}` : 'No existing books found'}

Extract the book structure. If multiple books are mentioned, extract the primary book or the first one.`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      
      return { book: null, confidence: 0, raw: response };
    } catch (error) {
      console.error('Error extracting book structure:', error);
      return { book: null, confidence: 0, error: error.message };
    }
  }

  /**
   * Extract chapter flows from document
   * @param {string} docText - Full document text
   * @param {Object} book - Book object to assign chapters to
   * @returns {Promise<Array>} Array of extracted chapters
   */
  async extractChapterFlows(docText, book) {
    try {
      const systemContext = `You are analyzing a document to extract all chapters.
Extract chapters with their titles, descriptions, content, and order.
Return JSON array:
[
  {
    "title": "Chapter Title",
    "desc": "Chapter description",
    "number": 1,
    "content": "Full chapter text if available",
    "keyPlotPoints": ["plot point 1", "plot point 2"],
    "characters": ["Character 1", "Character 2"],
    "order": 1
  }
]`;

      const prompt = `Analyze this document and extract ALL chapters:

${docText}

Book context: ${book ? `Book: ${book.title || 'Unknown'}` : 'No book context'}

Extract all chapters with their titles, descriptions, and content. Maintain chapter order.`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const chapters = JSON.parse(jsonMatch[0]);
        return chapters.map((ch, idx) => ({
          ...ch,
          id: ch.id || `chapter_extracted_${Date.now()}_${idx}`,
          number: ch.number || ch.order || idx + 1,
          bookId: book?.id || null,
          script: ch.content || ch.script || '',
          extracted: true,
          createdAt: Date.now()
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting chapter flows:', error);
      return [];
    }
  }

  /**
   * Extract complete chapter data including beats, storylines, etc.
   * @param {string} chapterText - Chapter content
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Book ID
   * @param {Array} actors - Available actors
   * @returns {Promise<Object>} Complete chapter data
   */
  async extractCompleteChapterData(chapterText, chapterNumber, bookId, actors = []) {
    if (!chapterText || chapterText.trim().length < 50) {
      return {
        beats: [],
        storylines: [],
        characterArcs: [],
        timelineEvents: [],
        decisions: [],
        callbacks: []
      };
    }

    try {
      // Extract all data types in parallel
      const [
        beats,
        events,
        storylines,
        characterArcs,
        decisions,
        callbacks
      ] = await Promise.all([
        chapterDataExtractionService.extractBeatsFromChapter(chapterText, chapterNumber, bookId),
        chapterDataExtractionService.extractEventsFromChapter(chapterText, null, bookId, actors),
        this.extractStorylines(chapterText, chapterNumber, bookId),
        this.extractCharacterArcMoments(chapterText, chapterNumber, bookId, actors),
        this.extractDecisions(chapterText, chapterNumber, bookId),
        this.extractCallbacks(chapterText, chapterNumber, bookId)
      ]);

      return {
        beats,
        storylines,
        characterArcs,
        timelineEvents: events,
        decisions,
        callbacks
      };
    } catch (error) {
      console.error('Error extracting complete chapter data:', error);
      return {
        beats: [],
        storylines: [],
        characterArcs: [],
        timelineEvents: [],
        decisions: [],
        callbacks: []
      };
    }
  }

  /**
   * Extract storylines from chapter
   * @param {string} chapterText - Chapter content
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Book ID
   * @returns {Promise<Array>} Array of storylines
   */
  async extractStorylines(chapterText, chapterNumber, bookId) {
    try {
      const prompt = `Analyze this chapter and extract storylines/plot threads:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5000)}

Extract storylines that:
- Span multiple chapters or are part of larger arcs
- Have continuity that should be tracked
- Are important plot threads

Return JSON array:
[
  {
    "title": "Storyline title",
    "description": "What this storyline is about",
    "status": "active|resolved|ongoing",
    "importance": 1-10,
    "relatedChapters": [1, 2, 3],
    "characters": ["Character 1", "Character 2"]
  }
]`;

      const response = await aiService.callAI(prompt, 'structured');
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const storylines = JSON.parse(jsonMatch[0]);
        return storylines.map((sl, idx) => ({
          ...sl,
          id: `storyline_${Date.now()}_${idx}`,
          chapterNumber,
          bookId,
          createdAt: Date.now(),
          extracted: true
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting storylines:', error);
      return [];
    }
  }

  /**
   * Extract character arc moments
   * @param {string} chapterText - Chapter content
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Book ID
   * @param {Array} actors - Available actors
   * @returns {Promise<Array>} Array of character arc moments
   */
  async extractCharacterArcMoments(chapterText, chapterNumber, bookId, actors = []) {
    try {
      const actorNames = actors.map(a => a.name).join(', ');
      
      const prompt = `Analyze this chapter for character development moments:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5000)}

Available characters: ${actorNames || 'None'}

Extract character arc moments - significant character development, growth, or change:
- Character milestones
- Emotional development
- Skill/ability growth
- Relationship changes
- Personal revelations

Return JSON array:
[
  {
    "characterName": "Character name",
    "moment": "What happened",
    "type": "growth|revelation|conflict|resolution",
    "importance": 1-10,
    "emotionalState": "...",
    "impact": "How this affects the character"
  }
]`;

      const response = await aiService.callAI(prompt, 'structured');
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const moments = JSON.parse(jsonMatch[0]);
        return moments.map((m, idx) => ({
          ...m,
          id: `arc_moment_${Date.now()}_${idx}`,
          chapterNumber,
          bookId,
          createdAt: Date.now(),
          extracted: true
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting character arc moments:', error);
      return [];
    }
  }

  /**
   * Extract decisions from chapter
   * @param {string} chapterText - Chapter content
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Book ID
   * @returns {Promise<Array>} Array of decisions
   */
  async extractDecisions(chapterText, chapterNumber, bookId) {
    try {
      const prompt = `Analyze this chapter for important decisions:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5000)}

Extract decisions that:
- Matter for future story development
- Have consequences that should be tracked
- Affect character relationships or plot direction
- Are choices characters make that impact the story

Return JSON array:
[
  {
    "decision": "What decision was made",
    "character": "Who made it",
    "consequences": "What consequences this might have",
    "importance": 1-10,
    "type": "plot|character|relationship|world"
  }
]`;

      const response = await aiService.callAI(prompt, 'structured');
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const decisions = JSON.parse(jsonMatch[0]);
        return decisions.map((d, idx) => ({
          ...d,
          id: `decision_${Date.now()}_${idx}`,
          chapterNumber,
          bookId,
          createdAt: Date.now(),
          extracted: true
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting decisions:', error);
      return [];
    }
  }

  /**
   * Extract callback opportunities
   * @param {string} chapterText - Chapter content
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Book ID
   * @returns {Promise<Array>} Array of callback opportunities
   */
  async extractCallbacks(chapterText, chapterNumber, bookId) {
    try {
      const prompt = `Analyze this chapter for callback opportunities:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5000)}

Extract events, moments, or details that:
- Should be referenced later in the story
- Set up future plot points
- Are memorable moments that characters might recall
- Create opportunities for callbacks or references

Return JSON array:
[
  {
    "event": "What happened",
    "description": "Details of the event",
    "type": "memory|setup|reference|callback",
    "importance": 1-10,
    "suggestedCallbackChapter": null or chapter number
  }
]`;

      const response = await aiService.callAI(prompt, 'structured');
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const callbacks = JSON.parse(jsonMatch[0]);
        return callbacks.map((cb, idx) => ({
          ...cb,
          id: `callback_${Date.now()}_${idx}`,
          chapterNumber,
          bookId,
          createdAt: Date.now(),
          extracted: true
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting callbacks:', error);
      return [];
    }
  }

  /**
   * Save extraction session to database
   * @param {Object} sessionData - Complete session data
   * @returns {Promise<Object>} Saved session
   */
  async saveExtractionSession(sessionData) {
    try {
      const session = {
        id: sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: sessionData.timestamp || Date.now(),
        status: sessionData.status || 'active',
        sourceType: sessionData.sourceType || 'text',
        sourceName: sessionData.sourceName || '',
        documentText: sessionData.documentText || '',
        suggestions: sessionData.suggestions || [],
        reviewStatus: sessionData.reviewStatus || {},
        appliedActions: sessionData.appliedActions || {},
        wizardState: sessionData.wizardState || {},
        extractionResults: sessionData.extractionResults || {},
        lastSaved: Date.now()
      };

      try {
        await db.add('extractionSessions', session);
      } catch (e) {
        // Update if exists
        await db.update('extractionSessions', session);
      }

      return session;
    } catch (error) {
      console.error('Error saving extraction session:', error);
      throw error;
    }
  }

  /**
   * Load extraction session from database
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session data
   */
  async loadExtractionSession(sessionId) {
    try {
      const session = await db.get('extractionSessions', sessionId);
      return session;
    } catch (error) {
      console.error('Error loading extraction session:', error);
      return null;
    }
  }

  /**
   * Get active sessions that can be resumed
   * @returns {Promise<Array>} Array of active sessions
   */
  async getActiveSessions() {
    try {
      const allSessions = await db.getAll('extractionSessions');
      return allSessions
        .filter(s => s.status === 'active' || s.status === 'paused')
        .sort((a, b) => (b.lastSaved || b.timestamp) - (a.lastSaved || a.timestamp))
        .slice(0, 10); // Last 10 active sessions
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Resume a session - restore wizard state
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session data for restoration
   */
  async resumeSession(sessionId) {
    try {
      const session = await this.loadExtractionSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Update status to active
      session.status = 'active';
      session.lastSaved = Date.now();
      await db.update('extractionSessions', session);

      return {
        session,
        suggestions: session.suggestions || [],
        reviewStatus: session.reviewStatus || {},
        appliedActions: session.appliedActions || {},
        wizardState: session.wizardState || {},
        extractionResults: session.extractionResults || {}
      };
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  }

  /**
   * Save processing checkpoint
   * @param {string} sessionId - Session ID
   * @param {number} progress - Progress percentage
   * @param {Object} checkpointData - Data to save
   * @returns {Promise<void>}
   */
  async _saveCheckpoint(sessionId, progress, checkpointData) {
    try {
      const session = await this.loadExtractionSession(sessionId);
      if (session) {
        session.processingCheckpoint = {
          progress: { current: progress, status: 'Processing...', liveSuggestions: [] },
          data: checkpointData,
          timestamp: Date.now()
        };
        session.status = 'processing';
        await db.update('extractionSessions', session);
      }
    } catch (error) {
      console.warn('Error saving checkpoint:', error);
    }
  }

  /**
   * Save wizard state to database
   * @param {string} sessionId - Session ID
   * @param {Object} wizardState - Current wizard state
   * @returns {Promise<void>}
   */
  async saveWizardState(sessionId, wizardState) {
    try {
      const session = await this.loadExtractionSession(sessionId);
      if (session) {
        session.wizardState = wizardState;
        session.lastSaved = Date.now();
        await db.update('extractionSessions', session);
      } else {
        // Create new session if doesn't exist
        await this.saveExtractionSession({
          id: sessionId,
          wizardState,
          status: 'active'
        });
      }
    } catch (error) {
      console.error('Error saving wizard state:', error);
    }
  }

  /**
   * Process complete document - extract everything
   * @param {string} docText - Full document text
   * @param {Object} worldState - Current world state
   * @param {Function} onProgress - Progress callback
   * @param {string} sessionId - Optional session ID for persistence
   * @returns {Promise<Object>} Complete extraction results
   */
  async processCompleteDocument(docText, worldState, onProgress = null, sessionId = null) {
    try {
      // Load checkpoint if resuming
      let checkpoint = null;
      let startFromCheckpoint = false;
      if (sessionId) {
        try {
          const session = await this.loadExtractionSession(sessionId);
          if (session?.processingCheckpoint) {
            checkpoint = session.processingCheckpoint;
            startFromCheckpoint = true;
            if (onProgress && checkpoint.progress) {
              onProgress(checkpoint.progress);
            }
          }
        } catch (e) { 
          console.warn('Error loading checkpoint:', e); 
        }
      }

      if (onProgress && !startFromCheckpoint) {
        onProgress({ current: 5, status: 'Extracting book structure...' });
      }

      // Step 1: Extract book structure (skip if resuming)
      let bookResult;
      if (startFromCheckpoint && checkpoint.data?.bookResult) {
        bookResult = checkpoint.data.bookResult;
      } else {
        const existingBooks = worldState.books ? Object.values(worldState.books) : [];
        bookResult = await this.extractBookStructure(docText, existingBooks);
      }
      
      if (onProgress && !startFromCheckpoint) {
        onProgress({ current: 15, status: 'Extracting chapters...' });
      }

      // Step 2: Extract chapters (skip if resuming)
      let book = bookResult.book;
      const existingBooks = worldState.books ? Object.values(worldState.books) : [];
      if (!book && existingBooks.length > 0) {
        book = existingBooks[0];
      }
      
      let chapters;
      if (startFromCheckpoint && checkpoint.data?.chapters) {
        chapters = checkpoint.data.chapters;
      } else {
        chapters = await this.extractChapterFlows(docText, book);
        
        // Save checkpoint
        if (sessionId && onProgress) {
          await this._saveCheckpoint(sessionId, 15, { bookResult, chapters });
        }
      }
      
      if (onProgress && !startFromCheckpoint) {
        onProgress({ current: 30, status: `Processing ${chapters.length} chapters...` });
      }

      // Step 3: Extract data from each chapter
      const allBeats = [];
      const allStorylines = [];
      const allCharacterArcs = [];
      const allTimelineEvents = [];
      const allDecisions = [];
      const allCallbacks = [];
      const allAISuggestions = [];
      const actors = worldState.actors || [];

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterText = chapter.script || chapter.content || '';
        
        if (onProgress) {
          const progress = 30 + ((i / chapters.length) * 50);
          onProgress({ 
            current: Math.round(progress), 
            status: `Processing chapter ${i + 1}/${chapters.length}: ${chapter.title || 'Untitled'}` 
          });
        }

        const chapterData = await this.extractCompleteChapterData(
          chapterText,
          chapter.number || i + 1,
          book?.id || null,
          actors
        );

        allBeats.push(...chapterData.beats);
        allStorylines.push(...chapterData.storylines);
        allCharacterArcs.push(...chapterData.characterArcs);
        allTimelineEvents.push(...chapterData.timelineEvents);
        allDecisions.push(...chapterData.decisions);
        allCallbacks.push(...chapterData.callbacks);

        // Generate AI suggestions for this chapter
        if (onProgress) {
          const aiProgress = 80 + ((i / chapters.length) * 15);
          onProgress({ 
            current: Math.round(aiProgress), 
            status: `Generating AI suggestions for chapter ${i + 1}/${chapters.length}...` 
          });
        }

        try {
          const context = {
            previousChapters: chapters.slice(0, i),
            activeThreads: allStorylines,
            characters: actors,
            futureChapters: chapters.slice(i + 1)
          };

          const aiSuggestions = await aiSuggestionService.generateAllSuggestions(chapterText, context);
          const relationshipAnalysis = await relationshipAnalysisService.analyzeRelationshipsComprehensive(
            chapterText,
            actors,
            worldState.relationships || []
          );
          const emotionalAnalysis = await emotionalBeatService.analyzeEmotionalBeats(
            chapterText,
            actors,
            [],
            []
          );
          const dialogueAnalysis = await dialogueAnalysisService.analyzeDialogue(chapterText, actors);
          const worldConsistency = await worldConsistencyService.monitorWorldConsistency(chapterText, worldState);

          // Combine all AI suggestions
          const chapterAISuggestions = [
            ...aiSuggestions.all,
            ...relationshipAnalysis.all,
            ...emotionalAnalysis.all,
            ...dialogueAnalysis.all,
            ...worldConsistency.all
          ].map(s => ({
            ...s,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            bookId: book?.id
          }));

          allAISuggestions.push(...chapterAISuggestions);

          // Save AI suggestions to database
          try {
            for (const suggestion of chapterAISuggestions) {
              const suggestionRecord = {
                id: suggestion.id || `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chapterId: chapter.id,
                chapterNumber: chapter.number,
                bookId: book?.id || null,
                type: suggestion.type || 'unknown',
                priority: suggestion.priority || 'medium',
                confidence: suggestion.confidence || 0.5,
                status: 'pending', // 'pending' | 'accepted' | 'dismissed'
                suggestion: suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || '',
                reasoning: suggestion.reasoning || '',
                suggestions: suggestion.suggestions || [],
                characters: suggestion.characters || suggestion.character1 ? [suggestion.character1, suggestion.character2].filter(Boolean) : [],
                data: suggestion, // Store full suggestion data
                createdAt: Date.now(),
                source: 'manuscript_intelligence'
              };

              try {
                await db.add('aiSuggestions', suggestionRecord);
              } catch (e) {
                // Update if exists (shouldn't happen, but handle gracefully)
                console.warn('Suggestion already exists, skipping:', suggestionRecord.id);
              }
            }
          } catch (error) {
            console.warn('Error saving AI suggestions to database:', error);
          }
        } catch (error) {
          console.warn('Error generating AI suggestions for chapter:', error);
        }
      }

      // Analyze plot threading across all chapters
      if (onProgress) {
        onProgress({ current: 95, status: 'Analyzing plot threading...' });
      }

      let plotThreadingAnalysis = { all: [] };
      try {
        const plotThreads = await db.getAll('plotThreads') || [];
        plotThreadingAnalysis = await plotThreadingService.analyzePlotThreading(plotThreads, chapters);
      } catch (error) {
        console.warn('Error analyzing plot threading:', error);
      }

      if (onProgress) {
        onProgress({ current: 95, status: 'Finalizing extraction...' });
      }

      const results = {
        book,
        chapters,
        beats: allBeats,
        storylines: allStorylines,
        characterArcs: allCharacterArcs,
        timelineEvents: allTimelineEvents,
        decisions: allDecisions,
        callbacks: allCallbacks,
        aiSuggestions: allAISuggestions,
        plotThreading: plotThreadingAnalysis,
        summary: {
          booksFound: book ? 1 : 0,
          chaptersFound: chapters.length,
          beatsFound: allBeats.length,
          storylinesFound: allStorylines.length,
          characterArcsFound: allCharacterArcs.length,
          timelineEventsFound: allTimelineEvents.length,
          decisionsFound: allDecisions.length,
          callbacksFound: allCallbacks.length,
          aiSuggestionsFound: allAISuggestions.length
        }
      };

      // Save session to database if sessionId provided
      if (sessionId) {
        try {
          const session = await this.loadExtractionSession(sessionId);
          if (session) {
            session.extractionResults = results;
            session.status = 'completed';
            session.processingEndTime = Date.now();
            // Clear checkpoint on completion
            delete session.processingCheckpoint;
            await db.update('extractionSessions', session);
          } else {
            await this.saveExtractionSession({
              id: sessionId,
              documentText: docText,
              extractionResults: results,
              status: 'completed',
              sourceType: 'document',
              sourceName: 'Complete Document Extraction',
              processingEndTime: Date.now()
            });
          }
        } catch (error) {
          console.warn('Failed to save extraction session:', error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing complete document:', error);
      throw error;
    }
  }
}

// Create singleton instance
const manuscriptIntelligenceService = new ManuscriptIntelligenceService();

export default manuscriptIntelligenceService;
