/**
 * Chapter Memory Service
 * Automatically generates and maintains compressed chapter summaries.
 *
 * When a chapter is saved, this service creates a tight ~150-word "memory"
 * that captures what happened, who was involved, what changed, and what was
 * set up for the future. These memories are what feeds into the AI context
 * for ALL future chapters — so the AI always knows the full story without
 * reading every word (saving massive tokens).
 *
 * Think of this like how a human author keeps notes while writing:
 *  - "Ch 3: Sir Kael confronted the Queue Master. Lost his sword.
 *    Pip discovered the back entrance. Tension with Linda unresolved."
 */

import aiService from './aiService';
import db from './database';

const MEMORY_STORE = 'chapterMemories';

class ChapterMemoryService {
  constructor() {
    this.generating = new Set(); // prevent duplicate generation
  }

  /**
   * Generate a compressed memory for a chapter.
   * Called automatically when a chapter is saved.
   */
  async generateMemory(chapterId, chapterText, chapterNumber, bookId, actors = []) {
    // Prevent duplicate generation
    const key = `${bookId}_${chapterNumber}`;
    if (this.generating.has(key)) return null;
    this.generating.add(key);

    try {
      // Skip very short chapters
      if (!chapterText || chapterText.trim().length < 100) return null;

      const characterNames = actors.map(a => a.name).join(', ');

      const prompt = `Compress this chapter into a concise memory document for a writing assistant. This memory will be used as context when writing FUTURE chapters, so focus on what matters going forward.

CHAPTER ${chapterNumber}:
"""
${chapterText.slice(0, 6000)}${chapterText.length > 6000 ? '\n[...chapter continues...]' : ''}
"""

Characters in the story: ${characterNames || 'Not specified'}

Return a JSON object:
{
  "summary": "2-3 sentence summary of what happened (max 60 words)",
  "characters": [
    {
      "name": "Character Name",
      "status": "What state they're in at chapter end (emotional, physical, relational)",
      "changed": "How they changed during this chapter (null if unchanged)"
    }
  ],
  "setups": ["Things set up that haven't paid off yet (Chekhov's guns)"],
  "tensions": ["Unresolved conflicts or questions"],
  "decisions": ["Key decisions characters made and their immediate consequences"],
  "worldChanges": ["Any changes to the world/setting/rules"],
  "endingState": "The emotional/narrative state at chapter end (tense, resolved, cliffhanger, etc.)",
  "forwardHooks": ["What the reader is wondering/anticipating after this chapter"]
}`;

      const response = await aiService.callAI(prompt, 'analytical');

      let memory = null;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          memory = JSON.parse(jsonMatch[0]);
        }
      } catch (_) { /* fall through */ }

      if (!memory) {
        memory = {
          summary: response.slice(0, 200),
          characters: [],
          setups: [],
          tensions: [],
          decisions: [],
          worldChanges: [],
          endingState: 'unknown',
          forwardHooks: []
        };
      }

      // Save to IndexedDB
      const record = {
        id: `memory_${bookId}_ch${chapterNumber}`,
        bookId,
        chapterId,
        chapterNumber,
        ...memory,
        wordCount: chapterText.split(/\s+/).length,
        generatedAt: Date.now()
      };

      await this._saveMemory(record);
      return record;
    } catch (error) {
      console.warn('[ChapterMemory] Failed to generate memory:', error);
      return null;
    } finally {
      this.generating.delete(key);
    }
  }

  /**
   * Get the memory for a specific chapter.
   */
  async getMemory(bookId, chapterNumber) {
    try {
      const id = `memory_${bookId}_ch${chapterNumber}`;
      return await db.get(MEMORY_STORE, id);
    } catch (_) {
      return null;
    }
  }

  /**
   * Get all memories for a book, ordered by chapter number.
   */
  async getAllMemories(bookId) {
    try {
      const all = await db.getAll(MEMORY_STORE);
      return all
        .filter(m => m.bookId === bookId)
        .sort((a, b) => a.chapterNumber - b.chapterNumber);
    } catch (_) {
      return [];
    }
  }

  /**
   * Build a compressed "story so far" from all chapter memories.
   * This is what feeds into AI context — a tight summary of the entire story.
   *
   * @param {string} bookId
   * @param {number} upToChapter - only include chapters up to this number
   * @param {number} maxChars - character budget for the output
   * @returns {string} compressed story context
   */
  async buildStorySoFar(bookId, upToChapter = Infinity, maxChars = 3000) {
    const memories = await this.getAllMemories(bookId);
    const relevant = memories.filter(m => m.chapterNumber < upToChapter);

    if (relevant.length === 0) return '';

    const parts = ['=== STORY SO FAR (compressed chapter memories) ===\n'];
    let charCount = parts[0].length;

    // Always include ALL forward hooks and unresolved tensions
    const allSetups = [];
    const allTensions = [];

    for (const mem of relevant) {
      // Chapter summary (always include)
      const chLine = `Ch ${mem.chapterNumber}: ${mem.summary}`;
      if (charCount + chLine.length < maxChars * 0.6) {
        parts.push(chLine);
        charCount += chLine.length;
      }

      // Collect ongoing setups and tensions
      if (mem.setups) allSetups.push(...mem.setups);
      if (mem.tensions) allTensions.push(...mem.tensions);
    }

    // Most recent chapter gets more detail
    const lastMem = relevant[relevant.length - 1];
    if (lastMem) {
      parts.push(`\n--- LAST CHAPTER (Ch ${lastMem.chapterNumber}) STATE ---`);
      parts.push(`Ending: ${lastMem.endingState || 'unknown'}`);

      if (lastMem.characters?.length > 0) {
        parts.push('Character states:');
        for (const ch of lastMem.characters) {
          parts.push(`  ${ch.name}: ${ch.status}${ch.changed ? ` (changed: ${ch.changed})` : ''}`);
        }
      }

      if (lastMem.decisions?.length > 0) {
        parts.push('Key decisions: ' + lastMem.decisions.join('; '));
      }

      if (lastMem.forwardHooks?.length > 0) {
        parts.push('Reader is expecting: ' + lastMem.forwardHooks.join('; '));
      }
    }

    // Unresolved items (critical for continuity)
    const unresolvedSetups = this._deduplicateList(allSetups);
    const unresolvedTensions = this._deduplicateList(allTensions);

    if (unresolvedSetups.length > 0) {
      parts.push(`\nUNRESOLVED SETUPS (Chekhov's guns): ${unresolvedSetups.slice(0, 8).join('; ')}`);
    }
    if (unresolvedTensions.length > 0) {
      parts.push(`ACTIVE TENSIONS: ${unresolvedTensions.slice(0, 8).join('; ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Get the most recent chapter's character states.
   * Useful for ensuring character consistency.
   */
  async getLatestCharacterStates(bookId, upToChapter = Infinity) {
    const memories = await this.getAllMemories(bookId);
    const relevant = memories.filter(m => m.chapterNumber < upToChapter);

    // Build latest state per character by walking forward through chapters
    const states = {};
    for (const mem of relevant) {
      if (!mem.characters) continue;
      for (const ch of mem.characters) {
        states[ch.name] = {
          ...ch,
          lastSeenChapter: mem.chapterNumber
        };
      }
    }

    return states;
  }

  /**
   * Delete a memory (e.g. when a chapter is significantly rewritten).
   */
  async deleteMemory(bookId, chapterNumber) {
    try {
      const id = `memory_${bookId}_ch${chapterNumber}`;
      await db.delete(MEMORY_STORE, id);
    } catch (_) { /* ignore */ }
  }

  // --- Internal ---

  async _saveMemory(record) {
    try {
      await db.update(MEMORY_STORE, record);
    } catch (error) {
      // If the store doesn't exist, try adding
      try {
        await db.add(MEMORY_STORE, record);
      } catch (_) {
        console.warn('[ChapterMemory] Could not save memory:', error);
      }
    }
  }

  _deduplicateList(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = item.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

const chapterMemoryService = new ChapterMemoryService();
export default chapterMemoryService;
