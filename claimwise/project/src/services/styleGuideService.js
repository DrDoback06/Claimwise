/**
 * Style Guide Service
 * Loads and manages the Writing Style Guide for The Compliance Run
 * Supports loading from markdown files with database override capability
 */

import db from './database';

class StyleGuideService {
  constructor() {
    this.cachedGuide = null;
    this.cachedBuzzwords = null;
    this.loadPromise = null;
  }

  /**
   * Load style guide from markdown files or database
   */
  async loadStyleGuide() {
    if (this.cachedGuide) {
      return this.cachedGuide;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadStyleGuideInternal();
    return this.loadPromise;
  }

  async _loadStyleGuideInternal() {
    try {
      // First check database for custom override
      const dbOverride = await db.get('meta', 'styleGuideOverride');
      if (dbOverride && dbOverride.content) {
        this.cachedGuide = {
          full: dbOverride.content,
          source: 'database',
          loadedAt: Date.now()
        };
        return this.cachedGuide;
      }

      // Load from markdown files
      // Try multiple paths: public/data, public, and workspace root
      let fullGuide = await this._loadMarkdownFile('Writing Style Guide.md');
      let overviewGuide = await this._loadMarkdownFile('Overview - Writing Style Guide.md');
      
      // If files not found, try to load from cached database version
      if (!fullGuide) {
        const cached = await db.get('meta', 'styleGuideCache');
        if (cached && cached.content) {
          fullGuide = cached.content.full || '';
          overviewGuide = cached.content.overview || overviewGuide;
        }
      }

      const combinedGuide = {
        full: fullGuide || '',
        overview: overviewGuide || '',
        source: 'markdown',
        loadedAt: Date.now()
      };

      // Cache in database for future use
      try {
        await db.update('meta', {
          id: 'styleGuideCache',
          content: combinedGuide,
          cachedAt: Date.now()
        });
      } catch (error) {
        // If update fails, try add
        try {
          await db.add('meta', {
            id: 'styleGuideCache',
            content: combinedGuide,
            cachedAt: Date.now()
          });
        } catch (e) {
          console.warn('Could not cache style guide:', e);
        }
      }

      this.cachedGuide = combinedGuide;
      return this.cachedGuide;
    } catch (error) {
      console.error('Error loading style guide:', error);
      // Return fallback minimal guide
      return {
        full: 'You are writing for "The Compliance Run" - a dark comedy horror-RPG series set in bureaucratic apocalypse Britain.',
        overview: '',
        source: 'fallback',
        loadedAt: Date.now()
      };
    }
  }

  /**
   * Load markdown file from public directory or workspace root
   */
  async _loadMarkdownFile(filename) {
    try {
      // Try to fetch from public directory first
      const publicPath = `/data/${filename}`;
      const response = await fetch(publicPath);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`Could not load ${filename} from public directory:`, error);
    }

    // Try loading from workspace root (relative to src)
    try {
      // For development, try importing directly if possible
      // This will only work if the files are in the public folder or accessible
      const workspacePath = `../../${filename}`;
      const response = await fetch(workspacePath);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`Could not load ${filename} from workspace root:`, error);
    }

    // If both fail, return null - the service will use fallback
    return null;
  }

  /**
   * Get full system context for AI prompts
   */
  async getSystemContext() {
    const guide = await this.loadStyleGuide();
    
    if (!guide.full && !guide.overview) {
      return 'You are a creative writing assistant for "The Compliance Run" book series.';
    }

    let systemContext = `You are a creative writing assistant for "The Compliance Run" book series.

CRITICAL: You MUST follow the complete Writing Style Guide provided below. This guide defines the tone, voice, character dynamics, world rules, and all stylistic requirements for the series.

=== WRITING STYLE GUIDE ===

`;

    if (guide.overview) {
      systemContext += `OVERVIEW:\n${guide.overview}\n\n`;
    }

    if (guide.full) {
      systemContext += `FULL STYLE GUIDE:\n${guide.full}\n\n`;
    }

    systemContext += `=== END STYLE GUIDE ===

When writing chapters, you MUST:
1. Follow the tone and voice guidelines exactly (60% horror/RPG brutality, 40% caustic comedy)
2. Maintain character voices (Grimguff's formal/heroic, Pipkins' sardonic/British slang)
3. Use the specified buzzwords and terminology correctly
4. Follow the pacing and structure patterns
5. Incorporate recurring gags and devices appropriately
6. Use proper formatting (italics for thoughts, bold for UI, etc.)
7. Reference the validation checklist before finalizing output

The style guide is your primary reference - consult it for any questions about tone, character voice, world rules, or stylistic choices.`;

    return systemContext;
  }

  /**
   * Get buzzwords reference section
   */
  async getBuzzwordsReference() {
    if (this.cachedBuzzwords) {
      return this.cachedBuzzwords;
    }

    // Try to load from dedicated buzzwords reference file first
    try {
      const buzzwordsFile = await this._loadMarkdownFile('BUZZWORDS_REFERENCE.md');
      if (buzzwordsFile) {
        this.cachedBuzzwords = buzzwordsFile;
        return this.cachedBuzzwords;
      }
    } catch (error) {
      console.warn('Could not load buzzwords reference file:', error);
    }

    // Fallback: Extract buzzwords section from full guide
    const guide = await this.loadStyleGuide();
    const buzzwordsSection = this._extractSection(guide.full, 'Buzzwords, Slang & Syntax');
    
    this.cachedBuzzwords = buzzwordsSection || '';
    return this.cachedBuzzwords;
  }

  /**
   * Get tone and voice guidelines
   */
  async getToneGuidelines() {
    const guide = await this.loadStyleGuide();
    return this._extractSection(guide.full, 'Tone & Voice');
  }

  /**
   * Get character dynamics guidelines
   */
  async getCharacterGuidelines() {
    const guide = await this.loadStyleGuide();
    return this._extractSection(guide.full, 'Character Dynamics & Dialogue');
  }

  /**
   * Get world rules section
   */
  async getWorldRules() {
    const guide = await this.loadStyleGuide();
    return this._extractSection(guide.full, 'World Rules');
  }

  /**
   * Get validation checklist
   */
  async getValidationChecklist() {
    const guide = await this.loadStyleGuide();
    return this._extractSection(guide.full, 'Validation Checklist');
  }

  /**
   * Extract a specific section from markdown text
   */
  _extractSection(text, sectionTitle) {
    if (!text) return '';
    
    const lines = text.split('\n');
    const sectionStart = lines.findIndex(line => 
      line.includes(sectionTitle) || line.toLowerCase().includes(sectionTitle.toLowerCase())
    );
    
    if (sectionStart === -1) return '';
    
    // Find the next major section (starts with ## or #)
    let sectionEnd = lines.length;
    for (let i = sectionStart + 1; i < lines.length; i++) {
      if (lines[i].match(/^#{1,2}\s/)) {
        sectionEnd = i;
        break;
      }
    }
    
    return lines.slice(sectionStart, sectionEnd).join('\n');
  }

  /**
   * Clear cache (useful for reloading)
   */
  clearCache() {
    this.cachedGuide = null;
    this.cachedBuzzwords = null;
    this.loadPromise = null;
  }

  /**
   * Set custom style guide override in database
   */
  async setCustomOverride(content) {
    await db.update('meta', {
      id: 'styleGuideOverride',
      content: content,
      updatedAt: Date.now()
    });
    this.clearCache();
  }

  /**
   * Remove custom override (revert to markdown)
   */
  async removeCustomOverride() {
    await db.delete('meta', 'styleGuideOverride');
    this.clearCache();
  }
}

// Create singleton instance
const styleGuideService = new StyleGuideService();

export default styleGuideService;
