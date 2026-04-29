/**
 * Chapter Flow Analyzer Service
 * Analyzes chapter relationships, dependencies, and flow
 */

import aiService from './aiService';
import db from './database';

class ChapterFlowAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze chapter dependencies
   * @param {Array} chapters - Array of chapters to analyze
   * @param {Object} books - Books object
   * @returns {Promise<Array>} Array of chapter dependencies
   */
  async analyzeChapterDependencies(chapters, books) {
    try {
      const chaptersWithContent = chapters.map(ch => ({
        id: ch.id,
        title: ch.title,
        number: ch.number,
        bookId: ch.bookId,
        content: (ch.script || ch.content || '').substring(0, 2000) // First 2000 chars for analysis
      }));

      const prompt = `Analyze these chapters and identify dependencies:

${JSON.stringify(chaptersWithContent, null, 2)}

For each chapter, identify:
- Which chapters it references or depends on
- Which chapters reference it
- Chapter order dependencies
- Character appearance patterns

Return JSON:
{
  "dependencies": [
    {
      "chapterId": 1,
      "dependsOn": [2, 3],
      "referencedBy": [4, 5],
      "order": 1,
      "characterAppearances": ["Character 1", "Character 2"]
    }
  ],
  "flow": {
    "linear": true/false,
    "branches": [],
    "parallel": []
  }
}`;

      const response = await aiService.callAI(prompt, 'analytical');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { dependencies: [], flow: { linear: true, branches: [], parallel: [] } };
    } catch (error) {
      console.error('Error analyzing chapter dependencies:', error);
      return { dependencies: [], flow: { linear: true, branches: [], parallel: [] } };
    }
  }

  /**
   * Track character appearances across chapters
   * @param {Array} chapters - Array of chapters
   * @param {Array} actors - Available actors
   * @returns {Promise<Object>} Character appearance map
   */
  async trackCharacterAppearances(chapters, actors) {
    const appearances = {};
    
    for (const actor of actors) {
      appearances[actor.id] = {
        actorId: actor.id,
        actorName: actor.name,
        chapters: [],
        firstAppearance: null,
        lastAppearance: null,
        appearanceCount: 0
      };
    }

    for (const chapter of chapters) {
      const chapterText = (chapter.script || chapter.content || '').toLowerCase();
      
      for (const actor of actors) {
        const actorNameLower = actor.name.toLowerCase();
        const nicknames = (actor.nicknames || []).map(n => n.toLowerCase());
        
        // Check if actor name or nickname appears in chapter
        const appears = chapterText.includes(actorNameLower) || 
                       nicknames.some(nick => chapterText.includes(nick));
        
        if (appears) {
          appearances[actor.id].chapters.push({
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            bookId: chapter.bookId,
            chapterTitle: chapter.title
          });
          
          appearances[actor.id].appearanceCount++;
          
          if (!appearances[actor.id].firstAppearance) {
            appearances[actor.id].firstAppearance = {
              chapterId: chapter.id,
              chapterNumber: chapter.number,
              bookId: chapter.bookId
            };
          }
          
          appearances[actor.id].lastAppearance = {
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            bookId: chapter.bookId
          };
        }
      }
    }

    return appearances;
  }

  /**
   * Track plot thread continuity
   * @param {Array} chapters - Array of chapters
   * @param {Array} plotBeats - Array of plot beats
   * @returns {Promise<Object>} Plot thread continuity map
   */
  async trackPlotThreadContinuity(chapters, plotBeats) {
    try {
      // Group beats by storyline/thread
      const threads = {};
      
      for (const beat of plotBeats) {
        const threadKey = beat.storyline || beat.thread || 'general';
        if (!threads[threadKey]) {
          threads[threadKey] = {
            name: threadKey,
            beats: [],
            chapters: [],
            continuity: []
          };
        }
        
        threads[threadKey].beats.push(beat);
        
        if (beat.targetChapter && !threads[threadKey].chapters.includes(beat.targetChapter)) {
          threads[threadKey].chapters.push(beat.targetChapter);
        }
      }

      // Analyze continuity for each thread
      for (const threadKey in threads) {
        const thread = threads[threadKey];
        thread.chapters.sort((a, b) => a - b);
        
        // Check for gaps in continuity
        const gaps = [];
        for (let i = 0; i < thread.chapters.length - 1; i++) {
          const current = thread.chapters[i];
          const next = thread.chapters[i + 1];
          if (next - current > 1) {
            gaps.push({ from: current, to: next });
          }
        }
        
        thread.continuity = {
          isContinuous: gaps.length === 0,
          gaps: gaps,
          chapterCount: thread.chapters.length,
          beatCount: thread.beats.length
        };
      }

      return threads;
    } catch (error) {
      console.error('Error tracking plot thread continuity:', error);
      return {};
    }
  }

  /**
   * Ensure correct chapter sequence
   * @param {Array} chapters - Array of chapters
   * @returns {Promise<Object>} Sequence validation result
   */
  async validateChapterSequence(chapters) {
    const issues = [];
    const sortedChapters = [...chapters].sort((a, b) => {
      if (a.bookId !== b.bookId) return a.bookId - b.bookId;
      return (a.number || 0) - (b.number || 0);
    });

    // Check for duplicate chapter numbers
    const numberMap = {};
    for (const chapter of sortedChapters) {
      const key = `${chapter.bookId}_${chapter.number}`;
      if (numberMap[key]) {
        issues.push({
          type: 'duplicate_number',
          chapterId: chapter.id,
          chapterNumber: chapter.number,
          bookId: chapter.bookId,
          message: `Duplicate chapter number ${chapter.number} in book ${chapter.bookId}`
        });
      }
      numberMap[key] = chapter;
    }

    // Check for gaps in sequence
    const bookChapters = {};
    for (const chapter of sortedChapters) {
      if (!bookChapters[chapter.bookId]) {
        bookChapters[chapter.bookId] = [];
      }
      bookChapters[chapter.bookId].push(chapter);
    }

    for (const bookId in bookChapters) {
      const bookChs = bookChapters[bookId].sort((a, b) => (a.number || 0) - (b.number || 0));
      for (let i = 0; i < bookChs.length - 1; i++) {
        const current = bookChs[i].number || 0;
        const next = bookChs[i + 1].number || 0;
        if (next - current > 1) {
          issues.push({
            type: 'sequence_gap',
            bookId: bookId,
            from: current,
            to: next,
            message: `Gap in chapter sequence: ${current} to ${next}`
          });
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      sortedChapters: sortedChapters
    };
  }

  /**
   * Build complete chapter flow analysis
   * @param {Object} books - Books object
   * @param {Array} plotBeats - Plot beats
   * @param {Array} actors - Actors
   * @returns {Promise<Object>} Complete flow analysis
   */
  async buildCompleteFlowAnalysis(books, plotBeats = [], actors = []) {
    try {
      // Collect all chapters
      const allChapters = [];
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      
      for (const book of booksArray) {
        if (book.chapters && Array.isArray(book.chapters)) {
          for (const chapter of book.chapters) {
            allChapters.push({
              ...chapter,
              bookId: book.id
            });
          }
        }
      }

      // Run all analyses
      const [
        dependencies,
        characterAppearances,
        plotContinuity,
        sequenceValidation
      ] = await Promise.all([
        this.analyzeChapterDependencies(allChapters, books),
        this.trackCharacterAppearances(allChapters, actors),
        this.trackPlotThreadContinuity(allChapters, plotBeats),
        this.validateChapterSequence(allChapters)
      ]);

      return {
        dependencies,
        characterAppearances,
        plotContinuity,
        sequenceValidation,
        summary: {
          totalChapters: allChapters.length,
          totalBooks: booksArray.length,
          charactersTracked: actors.length,
          plotThreads: Object.keys(plotContinuity).length,
          sequenceIssues: sequenceValidation.issues.length
        }
      };
    } catch (error) {
      console.error('Error building complete flow analysis:', error);
      throw error;
    }
  }
}

// Create singleton instance
const chapterFlowAnalyzer = new ChapterFlowAnalyzer();

export default chapterFlowAnalyzer;
