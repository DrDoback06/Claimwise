/**
 * Expert Writer Service
 * Combines static expert writing base with AI-generated genre-specific enhancements
 * Provides comprehensive writing foundation before applying user-specific style
 */

import { getExpertWriterContent } from '../data/expertWriterBase';
import aiService from './aiService';
import contextEngine from './contextEngine';

class ExpertWriterService {
  constructor() {
    this.cache = {
      genreEnhancements: {},
      lastCacheTime: null
    };
    this.cacheTimeout = 3600000; // 1 hour cache
  }

  /**
   * Get genre-specific enhancements for expert writer content
   */
  async getGenreEnhancements(storyProfile) {
    const genres = storyProfile?.genres || [storyProfile?.genre] || ['general'];
    const genreKey = Array.isArray(genres) ? genres.join('_') : genres;

    // Check cache
    if (this.cache.genreEnhancements[genreKey] && 
        this.cache.lastCacheTime && 
        (Date.now() - this.cache.lastCacheTime) < this.cacheTimeout) {
      return this.cache.genreEnhancements[genreKey];
    }

    try {
      const genreList = Array.isArray(genres) ? genres.join(', ') : genres;
      const premise = storyProfile?.premise || 'A story';
      const tone = storyProfile?.tone || storyProfile?.comparisons || 'general';

      const prompt = `You are an expert writing coach. Based on the genre(s) "${genreList}" and story premise "${premise}" with tone "${tone}", provide genre-specific writing guidance that enhances the base expert writing principles.

Focus on:
- Genre-specific narrative techniques
- Genre conventions and how to use/subvert them
- Genre-appropriate pacing and structure
- Genre-specific character archetypes and development
- Genre-appropriate dialogue styles
- Genre-specific world-building considerations
- Genre tone and mood techniques

Return ONLY the genre-specific guidance as formatted text. Be concise but comprehensive. Do not repeat general writing advice - focus on what's unique to this genre.

Format as:
=== GENRE-SPECIFIC WRITING GUIDANCE ===
[Your guidance here]`;

      const enhancement = await aiService.callAI(prompt, 'creative');
      
      // Cache the result
      this.cache.genreEnhancements[genreKey] = enhancement;
      this.cache.lastCacheTime = Date.now();

      return enhancement;
    } catch (error) {
      console.warn('Failed to generate genre enhancements, using base only:', error);
      return '';
    }
  }

  /**
   * Get complete expert writer context (base + genre enhancements)
   */
  async getExpertWriterContext(storyProfile = null) {
    const baseContent = getExpertWriterContent();
    
    let genreEnhancements = '';
    if (storyProfile) {
      genreEnhancements = await this.getGenreEnhancements(storyProfile);
    }

    const parts = [
      '=== EXPERT WRITER FOUNDATION ===',
      'You are an expert writer with deep knowledge of narrative craft, character development, dialogue, pacing, and storytelling techniques.',
      '',
      baseContent
    ];

    if (genreEnhancements) {
      parts.push('');
      parts.push(genreEnhancements);
    }

    parts.push('');
    parts.push('=== APPLYING EXPERT KNOWLEDGE ===');
    parts.push('Use these expert principles as your foundation. Then apply the user\'s specific style, voice, and preferences (provided below) to create writing that is both expertly crafted AND matches their unique voice.');

    return parts.join('\n');
  }

  /**
   * Clear cache (useful for testing or when story profile changes significantly)
   */
  clearCache() {
    this.cache = {
      genreEnhancements: {},
      lastCacheTime: null
    };
  }
}

export default new ExpertWriterService();
