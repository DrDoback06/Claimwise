/**
 * Chapter Context Service
 * Provides intelligent chapter relevance detection and context building
 * Uses AI to analyze chapter content and suggest relevant previous chapters
 */

import aiService from './aiService';
import db from './database';

class ChapterContextService {
  constructor() {
    this.relevanceCache = new Map();
  }

  /**
   * Analyze chapter content to extract entities and themes
   */
  async analyzeChapterContent(chapter, actors, items, skills) {
    if (!chapter) return { actors: [], items: [], skills: [], themes: [] };

    const text = chapter.script || chapter.desc || '';
    
    // Extract mentioned entities
    const mentionedActors = actors.filter(a => 
      text.toLowerCase().includes(a.name.toLowerCase())
    ).map(a => a.id);

    const mentionedItems = items.filter(i => 
      text.toLowerCase().includes(i.name.toLowerCase())
    ).map(i => i.id);

    const mentionedSkills = skills.filter(s => 
      text.toLowerCase().includes(s.name.toLowerCase())
    ).map(s => s.id);

    // Use AI to extract themes and key concepts
    const themes = await this._extractThemes(text);

    return {
      actors: mentionedActors,
      items: mentionedItems,
      skills: mentionedSkills,
      themes: themes,
      wordCount: text.length,
      hasDialogue: text.includes('"') || text.includes("'"),
      hasAction: this._detectActionKeywords(text)
    };
  }

  /**
   * Find relevant chapters using AI-powered analysis
   */
  async findRelevantChapters(currentChapter, allChapters, actors, items, skills, maxSuggestions = 5) {
    if (!currentChapter || !allChapters || allChapters.length === 0) {
      return [];
    }

    // Check cache first
    const cacheKey = `${currentChapter.id}_${allChapters.length}`;
    if (this.relevanceCache.has(cacheKey)) {
      return this.relevanceCache.get(cacheKey);
    }

    // Analyze current chapter
    const currentAnalysis = await this.analyzeChapterContent(currentChapter, actors, items, skills);

    // Filter out current chapter and future chapters
    const previousChapters = allChapters.filter(ch => {
      if (ch.id === currentChapter.id) return false;
      if (ch.bookId === currentChapter.bookId && ch.id < currentChapter.id) return true;
      if (ch.bookId < currentChapter.bookId) return true;
      return false;
    });

    if (previousChapters.length === 0) {
      return [];
    }

    // Use AI to score relevance
    const relevantChapters = await this._scoreChapterRelevance(
      currentChapter,
      currentAnalysis,
      previousChapters,
      actors,
      items,
      skills,
      maxSuggestions
    );

    // Cache results
    this.relevanceCache.set(cacheKey, relevantChapters);

    // Also cache in database for persistence
    try {
      await db.update('meta', {
        id: `chapterRelevance_${currentChapter.id}`,
        suggestions: relevantChapters,
        cachedAt: Date.now()
      });
    } catch (error) {
      // If update fails, try add
      try {
        await db.add('meta', {
          id: `chapterRelevance_${currentChapter.id}`,
          suggestions: relevantChapters,
          cachedAt: Date.now()
        });
      } catch (e) {
        console.warn('Could not cache chapter relevance:', e);
      }
    }

    return relevantChapters;
  }

  /**
   * Use AI to score chapter relevance
   */
  async _scoreChapterRelevance(currentChapter, currentAnalysis, previousChapters, actors, items, skills, maxSuggestions) {
    const systemContext = `You are analyzing chapter relevance for "The Compliance Run" book series.
Your task is to identify which previous chapters are most relevant to the current chapter based on:
- Shared characters/actors
- Shared items or skills
- Thematic connections
- Plot continuity
- Character development arcs

Return a JSON array of chapter suggestions with relevance scores (0.0-1.0), ordered by relevance.`;

    // Build context for AI
    const currentChapterSummary = {
      title: currentChapter.title || 'Untitled',
      description: currentChapter.desc || '',
      actors: currentAnalysis.actors.map(id => {
        const actor = actors.find(a => a.id === id);
        return actor ? actor.name : id;
      }),
      items: currentAnalysis.items.map(id => {
        const item = items.find(i => i.id === id);
        return item ? item.name : id;
      }),
      skills: currentAnalysis.skills.map(id => {
        const skill = skills.find(s => s.id === id);
        return skill ? skill.name : id;
      }),
      themes: currentAnalysis.themes
    };

    const previousChaptersSummary = previousChapters.slice(0, 20).map(ch => ({
      id: ch.id,
      bookId: ch.bookId,
      title: ch.title || 'Untitled',
      description: ch.desc || '',
      preview: (ch.script || '').substring(0, 300)
    }));

    const prompt = `Current Chapter:
Title: ${currentChapterSummary.title}
Description: ${currentChapterSummary.description}
Actors: ${currentChapterSummary.actors.join(', ') || 'None'}
Items: ${currentChapterSummary.items.join(', ') || 'None'}
Skills: ${currentChapterSummary.skills.join(', ') || 'None'}
Themes: ${currentChapterSummary.themes.join(', ') || 'None'}

Previous Chapters to analyze:
${previousChaptersSummary.map((ch, i) => `
${i + 1}. Chapter ${ch.id} (Book ${ch.bookId}): ${ch.title}
   Description: ${ch.description}
   Preview: ${ch.preview}
`).join('\n')}

Analyze which previous chapters are most relevant to the current chapter. Consider:
1. Direct character/actor connections
2. Item or skill continuity
3. Thematic resonance
4. Plot thread continuation
5. Character development arcs

Return JSON array format:
[
  {
    "chapterId": "chapter_id",
    "bookId": book_id,
    "relevance": 0.85,
    "reason": "Brief explanation of why this chapter is relevant"
  }
]

Return only the top ${maxSuggestions} most relevant chapters, ordered by relevance score (highest first).`;

    try {
      const response = await aiService.callAI(prompt, "analytical", systemContext);
      
      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        
        // Map back to full chapter objects
        return suggestions.map(sugg => {
          const chapter = previousChapters.find(ch => 
            ch.id === sugg.chapterId && ch.bookId === sugg.bookId
          );
          if (chapter) {
            return {
              ...chapter,
              relevance: sugg.relevance || 0.5,
              reason: sugg.reason || 'Relevant to current chapter',
              suggested: true
            };
          }
          return null;
        }).filter(Boolean).slice(0, maxSuggestions);
      }
    } catch (error) {
      console.error('Error scoring chapter relevance:', error);
    }

    // Fallback: simple entity-based matching
    return this._fallbackRelevanceScoring(currentAnalysis, previousChapters, actors, items, skills, maxSuggestions);
  }

  /**
   * Fallback relevance scoring based on entity overlap
   */
  _fallbackRelevanceScoring(currentAnalysis, previousChapters, actors, items, skills, maxSuggestions) {
    const scored = previousChapters.map(ch => {
      const chText = (ch.script || ch.desc || '').toLowerCase();
      
      let score = 0;
      let reasons = [];

      // Check actor overlap
      currentAnalysis.actors.forEach(actorId => {
        const actor = actors.find(a => a.id === actorId);
        if (actor && chText.includes(actor.name.toLowerCase())) {
          score += 0.3;
          reasons.push(`Features ${actor.name}`);
        }
      });

      // Check item overlap
      currentAnalysis.items.forEach(itemId => {
        const item = items.find(i => i.id === itemId);
        if (item && chText.includes(item.name.toLowerCase())) {
          score += 0.2;
          reasons.push(`Mentions ${item.name}`);
        }
      });

      // Check skill overlap
      currentAnalysis.skills.forEach(skillId => {
        const skill = skills.find(s => s.id === skillId);
        if (skill && chText.includes(skill.name.toLowerCase())) {
          score += 0.2;
          reasons.push(`References ${skill.name}`);
        }
      });

      // Boost score if same book
      if (ch.bookId === currentAnalysis.bookId) {
        score += 0.1;
      }

      return {
        ...ch,
        relevance: Math.min(score, 1.0),
        reason: reasons.join(', ') || 'Potential relevance',
        suggested: true
      };
    });

    return scored
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxSuggestions)
      .filter(ch => ch.relevance > 0.1);
  }

  /**
   * Extract themes from text using AI
   */
  async _extractThemes(text) {
    if (!text || text.length < 100) return [];

    const systemContext = `Extract key themes and concepts from chapter text for "The Compliance Run" series.
Return a simple comma-separated list of themes (e.g., "bureaucracy, survival, friendship, horror").`;

    const prompt = `Extract themes from this chapter text:\n\n${text.substring(0, 2000)}`;

    try {
      const response = await aiService.callAI(prompt, "analytical", systemContext);
      const themes = response.split(',').map(t => t.trim()).filter(t => t.length > 0);
      return themes.slice(0, 5); // Limit to top 5 themes
    } catch (error) {
      console.error('Error extracting themes:', error);
      return [];
    }
  }

  /**
   * Detect action keywords in text
   */
  _detectActionKeywords(text) {
    const actionKeywords = ['fought', 'attacked', 'ran', 'charged', 'struck', 'defended', 'dodged', 'blocked', 'swung', 'threw'];
    const lowerText = text.toLowerCase();
    return actionKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Build chapter context from selected chapters
   */
  buildChapterContext(selectedChapters) {
    if (!selectedChapters || selectedChapters.length === 0) {
      return '';
    }

    return selectedChapters.map((ch, index) => {
      const title = ch.title || `Chapter ${ch.id}`;
      const bookRef = ch.bookId ? ` (Book ${ch.bookId})` : '';
      const preview = ch.script ? ch.script.substring(0, 1000) : (ch.desc || '');
      
      return `Previous Chapter ${index + 1}: ${title}${bookRef}
${ch.desc ? `Description: ${ch.desc}\n` : ''}
Content Preview:
${preview}${ch.script && ch.script.length > 1000 ? '...' : ''}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Clear relevance cache
   */
  clearCache() {
    this.relevanceCache.clear();
  }
}

// Create singleton instance
const chapterContextService = new ChapterContextService();

export default chapterContextService;

