/**
 * Chapter Overview Service
 * Handles automatic generation and management of chapter summaries
 */

import contextEngine from './contextEngine';
import aiService from './aiService';
import promptTemplates from './promptTemplates';
import db from './database';

class ChapterOverviewService {
  /**
   * Generate an overview for a chapter
   */
  async generateOverview(chapterText, chapterNumber, bookId, existingCharacters = []) {
    try {
      const characterNames = existingCharacters
        .map(c => c.name)
        .join(', ') || 'No existing characters';

      const summaryPrompt = promptTemplates.chapterSummary(
        chapterText,
        chapterNumber,
        characterNames
      );

      const response = await aiService.callAI(summaryPrompt, 'analytical');

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to basic summary
      return {
        chapterNumber,
        summary: response.slice(0, 1000),
        keyEvents: [],
        characterUpdates: [],
        newElements: { characters: [], items: [], locations: [], concepts: [] },
        openThreads: [],
        generated: true
      };
    } catch (error) {
      console.error('Error generating overview:', error);
      throw error;
    }
  }

  /**
   * Save a chapter overview (draft or approved)
   */
  async saveOverview(bookId, chapterNumber, overviewData, approved = false) {
    try {
      const overview = {
        id: `overview_${bookId}_${chapterNumber}`,
        bookId,
        chapterNumber,
        ...overviewData,
        approved,
        approvedAt: approved ? Date.now() : null,
        updatedAt: Date.now()
      };

      await db.update('chapterOverviews', overview);
      return overview;
    } catch (error) {
      console.error('Error saving overview:', error);
      throw error;
    }
  }

  /**
   * Get overview for a chapter
   */
  async getOverview(bookId, chapterNumber) {
    try {
      return await contextEngine.getChapterOverview(bookId, chapterNumber);
    } catch (error) {
      console.error('Error getting overview:', error);
      return null;
    }
  }

  /**
   * Get all overviews for a book
   */
  async getAllOverviews(bookId) {
    try {
      const overviews = await db.getByIndex('chapterOverviews', 'bookId', bookId);
      return overviews.sort((a, b) => a.chapterNumber - b.chapterNumber);
    } catch (error) {
      console.error('Error getting all overviews:', error);
      return [];
    }
  }

  /**
   * Extract entity state updates from chapter analysis
   */
  async extractEntityStates(overview, bookId, chapterNumber) {
    const states = [];

    // Extract character state updates
    if (overview.characterUpdates) {
      for (const update of overview.characterUpdates) {
        // Find the actor by name
        const actors = await db.getAll('actors');
        const actor = actors.find(a => 
          a.name.toLowerCase() === update.character.toLowerCase() ||
          a.nicknames?.some(n => n.toLowerCase() === update.character.toLowerCase())
        );

        if (actor) {
          states.push({
            entityId: actor.id,
            entityType: 'actor',
            stateChange: update.stateChange,
            newInfo: update.newInfo,
            extractedFrom: `Chapter ${chapterNumber}`
          });
        }
      }
    }

    return states;
  }

  /**
   * Auto-detect and complete plot beats from chapter
   */
  async detectCompletedPlotBeats(overview, chapterNumber) {
    try {
      const completedBeats = [];
      const plotBeats = await contextEngine.getPlotBeats();

      // Check if any plot beats match the chapter events
      if (overview.plotBeatsAdvanced) {
        for (const advancedBeat of overview.plotBeatsAdvanced) {
          // Find matching beat
          const matchingBeat = plotBeats.find(b => 
            !b.completed && 
            (b.beat.toLowerCase().includes(advancedBeat.toLowerCase()) ||
             advancedBeat.toLowerCase().includes(b.beat.toLowerCase()))
          );

          if (matchingBeat) {
            completedBeats.push(matchingBeat);
          }
        }
      }

      return completedBeats;
    } catch (error) {
      console.error('Error detecting completed beats:', error);
      return [];
    }
  }

  /**
   * Process chapter after save - generate overview, detect beats, update states
   */
  async processChapterAfterSave(chapterText, chapterNumber, bookId, existingCharacters) {
    const results = {
      overview: null,
      completedBeats: [],
      entityStates: [],
      errors: []
    };

    try {
      // Generate overview
      results.overview = await this.generateOverview(
        chapterText,
        chapterNumber,
        bookId,
        existingCharacters
      );

      // Detect completed plot beats
      results.completedBeats = await this.detectCompletedPlotBeats(
        results.overview,
        chapterNumber
      );

      // Extract entity states
      results.entityStates = await this.extractEntityStates(
        results.overview,
        bookId,
        chapterNumber
      );

    } catch (error) {
      console.error('Error processing chapter:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Check if style review should be triggered
   */
  async shouldTriggerStyleReview(chapterNumber) {
    return await contextEngine.shouldTriggerStyleReview(chapterNumber);
  }

  /**
   * Get recent chapter texts for style review
   */
  async getRecentChaptersForStyleReview(bookId, currentChapter, count = 5) {
    const chapters = [];
    
    try {
      const book = await db.get('books', bookId);
      if (book && book.chapters) {
        const startChapter = Math.max(1, currentChapter - count + 1);
        for (let i = startChapter; i <= currentChapter; i++) {
          const chapter = book.chapters.find(c => 
            c.number === i || c.id === `ch_${i}`
          );
          if (chapter?.content) {
            chapters.push(chapter.content);
          }
        }
      }
    } catch (error) {
      console.error('Error getting recent chapters:', error);
    }

    return chapters;
  }
}

// Singleton instance
const chapterOverviewService = new ChapterOverviewService();

export default chapterOverviewService;
