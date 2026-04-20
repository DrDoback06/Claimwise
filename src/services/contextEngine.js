/**
 * Context Engine Service
 * Central service that assembles all context for AI-powered chapter generation
 */

import db from './database';
import promptTemplates from './promptTemplates';

class ContextEngine {
  constructor() {
    this.cache = {
      styleProfile: null,
      characterVoices: {},
      worldRules: null,
      lastUpdated: null
    };
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.cache = {
      styleProfile: null,
      characterVoices: {},
      worldRules: null,
      lastUpdated: null
    };
  }

  /**
   * Get the story profile (style, genre, etc.)
   */
  async getStoryProfile() {
    try {
      const profile = await db.get('storyProfile', 'main_profile');
      return profile || null;
    } catch (error) {
      console.error('Error getting story profile:', error);
      return null;
    }
  }

  /**
   * Save/update story profile
   */
  async saveStoryProfile(profileData) {
    try {
      const profile = {
        id: 'main_profile',
        ...profileData,
        updatedAt: Date.now()
      };
      await db.update('storyProfile', profile);
      this.cache.styleProfile = profile;
      return profile;
    } catch (error) {
      console.error('Error saving story profile:', error);
      throw error;
    }
  }

  /**
   * Get style profile from story profile
   */
  async getStyleProfile() {
    if (this.cache.styleProfile) {
      return this.cache.styleProfile.styleProfile || this.cache.styleProfile;
    }
    
    const profile = await this.getStoryProfile();
    if (profile) {
      this.cache.styleProfile = profile;
      return profile.styleProfile || profile;
    }
    return null;
  }

  /**
   * Get character voice profile
   */
  async getCharacterVoice(actorId) {
    if (this.cache.characterVoices[actorId]) {
      return this.cache.characterVoices[actorId];
    }

    try {
      const voices = await db.getByIndex('characterVoices', 'actorId', actorId);
      if (voices && voices.length > 0) {
        this.cache.characterVoices[actorId] = voices[0];
        return voices[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting character voice:', error);
      return null;
    }
  }

  /**
   * Get all character voices for given actors
   */
  async getCharacterVoices(actorIds) {
    const voices = {};
    for (const actorId of actorIds) {
      const voice = await this.getCharacterVoice(actorId);
      if (voice) {
        voices[actorId] = voice;
      }
    }
    return voices;
  }

  /**
   * Save character voice profile
   */
  async saveCharacterVoice(actorId, voiceData) {
    try {
      const voice = {
        id: `voice_${actorId}`,
        actorId,
        ...voiceData,
        updatedAt: Date.now()
      };
      await db.update('characterVoices', voice);
      this.cache.characterVoices[actorId] = voice;
      return voice;
    } catch (error) {
      console.error('Error saving character voice:', error);
      throw error;
    }
  }

  /**
   * Get world rules
   */
  async getWorldRules() {
    if (this.cache.worldRules) {
      return this.cache.worldRules;
    }

    const profile = await this.getStoryProfile();
    if (profile && profile.worldRules) {
      this.cache.worldRules = profile.worldRules;
      return profile.worldRules;
    }
    return null;
  }

  /**
   * Get all plot beats
   */
  async getPlotBeats() {
    try {
      const beats = await db.getAll('plotBeats');
      return beats.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error getting plot beats:', error);
      return [];
    }
  }

  /**
   * Get remaining (incomplete) plot beats
   */
  async getRemainingPlotBeats() {
    const beats = await this.getPlotBeats();
    return beats.filter(b => !b.completed);
  }

  /**
   * Get plot beats for a specific chapter
   */
  async getPlotBeatsForChapter(chapterNumber) {
    const beats = await this.getPlotBeats();
    return beats.filter(b => b.targetChapter === chapterNumber || (!b.completed && !b.targetChapter));
  }

  /**
   * Mark plot beat as completed
   */
  async completePlotBeat(beatId, chapterNumber) {
    try {
      const beat = await db.get('plotBeats', beatId);
      if (beat) {
        beat.completed = true;
        beat.completedInChapter = chapterNumber;
        beat.completedAt = Date.now();
        await db.update('plotBeats', beat);
      }
      return beat;
    } catch (error) {
      console.error('Error completing plot beat:', error);
      throw error;
    }
  }

  /**
   * Update plot beat status (toggle complete/incomplete)
   */
  async updatePlotBeatStatus(beatId, completed) {
    try {
      const beat = await db.get('plotBeats', beatId);
      if (beat) {
        beat.completed = completed;
        if (completed) {
          beat.completedAt = Date.now();
        } else {
          beat.completedAt = null;
          beat.completedInChapter = null;
        }
        await db.update('plotBeats', beat);
      }
      return beat;
    } catch (error) {
      console.error('Error updating plot beat status:', error);
      throw error;
    }
  }

  /**
   * Add new plot beat (uses upsert to avoid duplicate key errors)
   */
  async addPlotBeat(beatData) {
    try {
      const beats = await this.getPlotBeats();
      const maxOrder = beats.reduce((max, b) => Math.max(max, b.order || 0), 0);
      
      // Generate a truly unique ID using timestamp + random string
      const uniqueId = beatData.id || `beat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const beat = {
        ...beatData,
        id: uniqueId,
        completed: beatData.completed ?? false,
        order: beatData.order || maxOrder + 1,
        createdAt: beatData.createdAt || Date.now()
      };
      // Use update (put) instead of add to allow upserts
      await db.update('plotBeats', beat);
      return beat;
    } catch (error) {
      console.error('Error adding plot beat:', error);
      throw error;
    }
  }

  /**
   * Save multiple plot beats at once (replaces existing)
   */
  async savePlotBeats(beatsArray) {
    try {
      const beats = await this.getPlotBeats();
      const maxOrder = beats.reduce((max, b) => Math.max(max, b.order || 0), 0);
      
      const processedBeats = beatsArray.map((beatData, idx) => {
        // Generate unique ID for each beat
        const uniqueId = beatData.id || `beat_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          ...beatData,
          id: uniqueId,
          completed: beatData.completed ?? false,
          order: beatData.order || maxOrder + idx + 1,
          createdAt: beatData.createdAt || Date.now()
        };
      });
      
      // Use bulkUpdate which does put operations (upserts)
      await db.bulkUpdate('plotBeats', processedBeats);
      return processedBeats;
    } catch (error) {
      console.error('Error saving plot beats:', error);
      throw error;
    }
  }

  /**
   * Get chapter overview by book and chapter number
   */
  async getChapterOverview(bookId, chapterNumber) {
    try {
      const overviews = await db.getByIndex('chapterOverviews', 'bookId', bookId);
      return overviews.find(o => o.chapterNumber === chapterNumber) || null;
    } catch (error) {
      console.error('Error getting chapter overview:', error);
      return null;
    }
  }

  /**
   * Get all chapter overviews up to a specific chapter
   */
  async getAllOverviews(bookId, upToChapter) {
    try {
      const overviews = await db.getByIndex('chapterOverviews', 'bookId', bookId);
      return overviews
        .filter(o => o.chapterNumber < upToChapter)
        .sort((a, b) => a.chapterNumber - b.chapterNumber);
    } catch (error) {
      console.error('Error getting chapter overviews:', error);
      return [];
    }
  }

  /**
   * Save chapter overview
   */
  async saveChapterOverview(bookId, chapterNumber, overviewData) {
    try {
      const overview = {
        id: `overview_${bookId}_${chapterNumber}`,
        bookId,
        chapterNumber,
        ...overviewData,
        updatedAt: Date.now()
      };
      await db.update('chapterOverviews', overview);
      return overview;
    } catch (error) {
      console.error('Error saving chapter overview:', error);
      throw error;
    }
  }

  /**
   * Get entity state for a specific chapter
   */
  async getEntityState(entityId, entityType, bookId, chapterNumber) {
    try {
      const states = await db.getByIndex('entityChapterStates', 'entityId', entityId);
      return states.find(s => 
        s.entityType === entityType && 
        s.bookId === bookId && 
        s.chapterNumber === chapterNumber
      ) || null;
    } catch (error) {
      console.error('Error getting entity state:', error);
      return null;
    }
  }

  /**
   * Get latest entity state up to a chapter
   */
  async getLatestEntityState(entityId, entityType, bookId, upToChapter) {
    try {
      const states = await db.getByIndex('entityChapterStates', 'entityId', entityId);
      const relevantStates = states
        .filter(s => 
          s.entityType === entityType && 
          s.bookId === bookId && 
          s.chapterNumber <= upToChapter
        )
        .sort((a, b) => b.chapterNumber - a.chapterNumber);
      
      return relevantStates[0] || null;
    } catch (error) {
      console.error('Error getting latest entity state:', error);
      return null;
    }
  }

  /**
   * Save entity state for a chapter
   */
  async saveEntityState(entityId, entityType, bookId, chapterNumber, stateData) {
    try {
      const state = {
        id: `state_${entityType}_${entityId}_${bookId}_${chapterNumber}`,
        entityId,
        entityType,
        bookId,
        chapterNumber,
        ...stateData,
        updatedAt: Date.now()
      };
      await db.update('entityChapterStates', state);
      return state;
    } catch (error) {
      console.error('Error saving entity state:', error);
      throw error;
    }
  }

  /**
   * Get actor states for chapter context
   */
  async getActorStates(actorIds, bookId, upToChapter) {
    const states = [];
    for (const actorId of actorIds) {
      const state = await this.getLatestEntityState(actorId, 'actor', bookId, upToChapter);
      if (state) {
        states.push(state);
      } else {
        // Get base actor info if no state exists
        try {
          const actor = await db.get('actors', actorId);
          if (actor) {
            states.push({
              entityId: actorId,
              entityType: 'actor',
              name: actor.name,
              baseInfo: true,
              ...actor
            });
          }
        } catch (e) {
          console.warn(`Could not get actor ${actorId}`);
        }
      }
    }
    return states;
  }

  /**
   * Get full chapter text
   */
  async getFullChapter(bookId, chapterNumber) {
    try {
      const book = await db.get('books', bookId);
      if (book && book.chapters) {
        const chapter = book.chapters.find(c => c.number === chapterNumber || c.id === `ch_${chapterNumber}`);
        return chapter?.content || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting full chapter:', error);
      return null;
    }
  }

  /**
   * Get all available items
   */
  async getAvailableItems() {
    try {
      return await db.getAll('itemBank');
    } catch (error) {
      console.error('Error getting items:', error);
      return [];
    }
  }

  /**
   * Get all available actors
   */
  async getAvailableActors() {
    try {
      return await db.getAll('actors');
    } catch (error) {
      console.error('Error getting actors:', error);
      return [];
    }
  }

  /**
   * MAIN METHOD: Assemble all context for chapter generation
   */
  async assembleChapterContext(bookId, chapterNumber, selectedActorIds = [], selectedItemIds = []) {
    console.log(`[ContextEngine] Assembling context for Book ${bookId}, Chapter ${chapterNumber}`);

    // Gather all context in parallel where possible
    const [
      styleProfile,
      worldRules,
      plotBeats,
      previousChapter,
      chapterOverviews,
      allActors,
      allItems
    ] = await Promise.all([
      this.getStyleProfile(),
      this.getWorldRules(),
      this.getPlotBeatsForChapter(chapterNumber),
      this.getFullChapter(bookId, chapterNumber - 1),
      this.getAllOverviews(bookId, chapterNumber),
      this.getAvailableActors(),
      this.getAvailableItems()
    ]);

    // Get actor states for selected actors (or all if none selected)
    const actorIdsToUse = selectedActorIds.length > 0 
      ? selectedActorIds 
      : allActors.map(a => a.id);
    const actorStates = await this.getActorStates(actorIdsToUse, bookId, chapterNumber - 1);

    // Get character voices for selected actors
    const characterVoices = await this.getCharacterVoices(actorIdsToUse);

    // Filter items if specific ones selected
    const itemsInPlay = selectedItemIds.length > 0
      ? allItems.filter(i => selectedItemIds.includes(i.id))
      : allItems;

    return {
      // Core profile data
      styleProfile,
      worldRules,
      
      // Story progress
      plotBeats,
      remainingPlotBeats: plotBeats.filter(b => !b.completed),
      
      // Chapter history
      previousChapter,
      chapterOverviews,
      previousChapterSummary: chapterOverviews.length > 0 
        ? chapterOverviews[chapterOverviews.length - 1]?.summary 
        : null,
      
      // Entities
      actorStates,
      characterVoices,
      availableActors: allActors,
      availableItems: itemsInPlay,
      
      // Meta
      bookId,
      chapterNumber,
      contextAssembledAt: Date.now()
    };
  }

  /**
   * Build the mega-prompt for chapter generation
   */
  buildChapterPrompt(context, chapterPlan, moodSliders) {
    return promptTemplates.chapterGeneration(
      chapterPlan,
      context.styleProfile,
      context.characterVoices,
      context.previousChapter,
      context.chapterOverviews?.map(o => o.summary).join('\n\n'),
      context.worldRules,
      moodSliders
    );
  }

  /**
   * Build the chapter planning prompt
   */
  buildPlanningPrompt(context, moodSliders) {
    return promptTemplates.chapterPlan(
      context.chapterNumber,
      context.previousChapterSummary,
      context.availableActors,
      context.availableItems,
      context.remainingPlotBeats,
      context.styleProfile,
      moodSliders
    );
  }

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress() {
    try {
      const progress = await db.get('onboardingProgress', 'main');
      return progress || {
        id: 'main',
        currentStep: 1,
        completedSteps: [],
        data: {}
      };
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return {
        id: 'main',
        currentStep: 1,
        completedSteps: [],
        data: {}
      };
    }
  }

  /**
   * Save onboarding progress
   */
  async saveOnboardingProgress(progress) {
    try {
      await db.update('onboardingProgress', {
        id: 'main',
        ...progress,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete() {
    const progress = await this.getOnboardingProgress();
    return progress.completedAt != null;
  }

  /**
   * Merge wizard characters into Personnel (actors)
   * Creates new actors or updates existing ones with voice profiles
   */
  async mergeWizardCharactersToPersonnel(characters) {
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    try {
      // Get all existing actors
      const existingActors = await db.getAll('actors');
      
      for (const character of characters) {
        try {
          // Find existing actor by name (case-insensitive)
          const existingActor = existingActors.find(a => 
            a.name.toLowerCase() === character.name.toLowerCase()
          );

          if (existingActor) {
            // Merge wizard data into existing actor
            const updatedActor = {
              ...existingActor,
              role: character.role || existingActor.role,
              desc: character.description || existingActor.desc,
              biography: character.description || existingActor.biography,
              // Add voice profile reference
              voiceProfileId: `voice_${existingActor.id}`,
              updatedAt: Date.now()
            };
            
            await db.update('actors', updatedActor);
            results.updated.push({ id: existingActor.id, name: existingActor.name });

            // Save voice profile if available
            if (character.voiceProfile) {
              await this.saveCharacterVoice(existingActor.id, {
                characterName: character.name,
                role: character.role,
                description: character.description,
                ...character.voiceProfile
              });
            }
          } else {
            // Create new actor from wizard character
            const newActorId = `act_wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newActor = {
              id: newActorId,
              name: character.name,
              nicknames: [],
              class: character.role || 'Character',
              role: character.role || '',
              desc: character.description || '',
              biography: character.description || '',
              isFav: false,
              baseStats: { STR: 10, VIT: 10, INT: 10, DEX: 10 },
              additionalStats: {},
              activeSkills: [],
              inventory: [],
              snapshots: {},
              equipment: {
                helm: null, cape: null, amulet: null, armour: null,
                gloves: null, belt: null, boots: null,
                leftHand: null, rightHand: null,
                rings: [null, null, null, null, null, null, null],
                charms: [null, null, null, null]
              },
              appearances: {},
              arcMilestones: {},
              lastConsistencyCheck: null,
              aiSuggestions: [],
              voiceProfileId: `voice_${newActorId}`,
              createdAt: Date.now(),
              createdFromWizard: true
            };
            
            await db.add('actors', newActor);
            results.created.push({ id: newActorId, name: character.name });

            // Save voice profile if available
            if (character.voiceProfile) {
              await this.saveCharacterVoice(newActorId, {
                characterName: character.name,
                role: character.role,
                description: character.description,
                ...character.voiceProfile
              });
            }
          }
        } catch (charError) {
          console.error(`Error merging character ${character.name}:`, charError);
          results.errors.push({ name: character.name, error: charError.message });
        }
      }
    } catch (error) {
      console.error('Error in mergeWizardCharactersToPersonnel:', error);
      results.errors.push({ name: 'batch', error: error.message });
    }

    return results;
  }

  /**
   * Style evolution check - should trigger every 5 chapters
   */
  async shouldTriggerStyleReview(currentChapter) {
    if (currentChapter % 5 !== 0) return false;
    
    try {
      const evolutions = await db.getAll('styleEvolution');
      const lastReview = evolutions
        .sort((a, b) => (b.reviewedAtChapter || 0) - (a.reviewedAtChapter || 0))[0];
      
      if (!lastReview) return true;
      return lastReview.reviewedAtChapter < currentChapter;
    } catch (error) {
      console.error('Error checking style review:', error);
      return false;
    }
  }

  /**
   * Save style evolution review
   */
  async saveStyleEvolution(chapterNumber, evolutionData) {
    try {
      const evolution = {
        id: `evolution_${chapterNumber}`,
        reviewedAtChapter: chapterNumber,
        ...evolutionData,
        createdAt: Date.now()
      };
      await db.add('styleEvolution', evolution);
      return evolution;
    } catch (error) {
      console.error('Error saving style evolution:', error);
      throw error;
    }
  }

  // ========== CHAPTER COMPLETION TRACKING ==========

  /**
   * Get the current chapter (first incomplete chapter)
   */
  async getCurrentChapter() {
    try {
      const books = await db.getAll('books');
      if (!books || books.length === 0) return null;

      // Find first incomplete chapter across all books
      for (const book of books) {
        if (!book.chapters) continue;
        for (const chapter of book.chapters) {
          if (!chapter.completed) {
            return {
              ...chapter,
              bookId: book.id,
              bookTitle: book.title
            };
          }
        }
      }
      
      // All chapters complete, return last chapter
      const lastBook = books[books.length - 1];
      const lastChapter = lastBook?.chapters?.[lastBook.chapters.length - 1];
      return lastChapter ? { ...lastChapter, bookId: lastBook.id, bookTitle: lastBook.title } : null;
    } catch (error) {
      console.error('Error getting current chapter:', error);
      return null;
    }
  }

  /**
   * Update chapter completion status
   */
  async updateChapterCompletion(bookId, chapterId, completed, wordCount = null) {
    try {
      const book = await db.get('books', bookId);
      if (!book) throw new Error('Book not found');

      const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
      if (chapterIndex === -1) throw new Error('Chapter not found');

      book.chapters[chapterIndex] = {
        ...book.chapters[chapterIndex],
        completed: completed,
        wordCount: wordCount ?? book.chapters[chapterIndex].wordCount,
        completedAt: completed ? Date.now() : null
      };

      await db.update('books', book);
      return book.chapters[chapterIndex];
    } catch (error) {
      console.error('Error updating chapter completion:', error);
      throw error;
    }
  }

  /**
   * Update chapter content
   */
  async updateChapterContent(bookId, chapterId, content, title = null) {
    try {
      const book = await db.get('books', bookId);
      if (!book) throw new Error('Book not found');

      const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
      if (chapterIndex === -1) throw new Error('Chapter not found');

      const wordCount = content ? content.trim().split(/\s+/).filter(w => w).length : 0;

      book.chapters[chapterIndex] = {
        ...book.chapters[chapterIndex],
        content: content,
        script: content, // Keep script in sync for compatibility
        wordCount: wordCount,
        ...(title && { title }),
        updatedAt: Date.now()
      };

      await db.update('books', book);
      return book.chapters[chapterIndex];
    } catch (error) {
      console.error('Error updating chapter content:', error);
      throw error;
    }
  }

  /**
   * Add a new chapter to a book
   */
  async addChapter(bookId, chapterData = {}) {
    try {
      const book = await db.get('books', bookId);
      if (!book) throw new Error('Book not found');

      const maxId = book.chapters.reduce((max, c) => Math.max(max, c.id || 0), 0);
      const newChapter = {
        id: maxId + 1,
        number: book.chapters.length + 1,
        title: chapterData.title || `Chapter ${book.chapters.length + 1}`,
        desc: chapterData.desc || '',
        content: chapterData.content || '',
        script: chapterData.content || '',
        completed: false,
        wordCount: 0,
        createdAt: Date.now()
      };

      book.chapters.push(newChapter);
      await db.update('books', book);

      return newChapter;
    } catch (error) {
      console.error('Error adding chapter:', error);
      throw error;
    }
  }

  /**
   * AI-powered chapter completion detection
   * Returns true if the chapter appears complete based on structure
   */
  async analyzeChapterCompleteness(content) {
    if (!content) return { isComplete: false, confidence: 0, reason: 'No content' };
    
    const wordCount = content.trim().split(/\s+/).filter(w => w).length;
    
    // Basic heuristics for completion
    const hasMinWords = wordCount >= 500;
    const hasEnding = /(\.\s*$|\.["']\s*$|\?\s*$|!\s*$)/.test(content.trim());
    const hasParagraphs = (content.match(/\n\n/g) || []).length >= 2;
    
    let confidence = 0;
    let reasons = [];
    
    if (hasMinWords) {
      confidence += 40;
      reasons.push(`${wordCount} words (sufficient length)`);
    } else {
      reasons.push(`Only ${wordCount} words (may be incomplete)`);
    }
    
    if (hasEnding) {
      confidence += 30;
      reasons.push('Proper sentence ending');
    }
    
    if (hasParagraphs) {
      confidence += 30;
      reasons.push('Multiple paragraphs');
    }

    return {
      isComplete: confidence >= 70,
      confidence,
      wordCount,
      reasons
    };
  }

  /**
   * Get all chapters with completion status
   */
  async getAllChaptersWithStatus() {
    try {
      const books = await db.getAll('books');
      const chapters = [];

      for (const book of books) {
        if (!book.chapters) continue;
        for (const chapter of book.chapters) {
          chapters.push({
            ...chapter,
            bookId: book.id,
            bookTitle: book.title,
            hasContent: (chapter.content || chapter.script || '').length > 0
          });
        }
      }

      return chapters.sort((a, b) => {
        if (a.bookId !== b.bookId) return a.bookId - b.bookId;
        return (a.number || a.id) - (b.number || b.id);
      });
    } catch (error) {
      console.error('Error getting chapters with status:', error);
      return [];
    }
  }
}

// Create singleton instance
const contextEngine = new ContextEngine();

export default contextEngine;
