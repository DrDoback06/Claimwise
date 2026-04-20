import db from './database';
import aiService from './aiService';

/**
 * Style Reference Service
 * Manages writing style documents, extracts patterns, and provides context for AI
 */

const STYLE_STORE = 'styleReferences';
const STYLE_PATTERNS_STORE = 'stylePatterns';
const STYLE_VERSIONS_STORE = 'styleVersions';

// Initialize stores if needed - graceful fallback
const initStores = async () => {
  try {
    // Try to access the store to see if it exists
    await db.getAll(STYLE_STORE);
  } catch (e) {
    // Store doesn't exist - this is okay, we'll handle it gracefully
    // The migration will create them on next page load
    if (e.name === 'NotFoundError' || e.message?.includes('object stores was not found')) {
      console.warn('Style reference stores not found. They will be created on next page refresh.');
      // Don't throw - just return, let the calling function handle empty results
      return false;
    }
    throw e;
  }
  return true;
};

/**
 * Save a style reference document
 */
export const saveStyleReference = async (data) => {
  const storesExist = await initStores();
  
  if (!storesExist) {
    throw new Error('DATABASE_MIGRATION_NEEDED: Please refresh the page to create the required database stores.');
  }
  
  const {
    id = `style_${Date.now()}`,
    name = 'Style Reference',
    content,
    type = 'general', // 'general' | 'examples' | 'guide' | 'reference'
    scope = 'global', // 'global' | 'project'
    projectId = null,
    metadata = {}
  } = data;

  // Create version entry
  const version = {
    id: `version_${Date.now()}`,
    styleId: id,
    content,
    createdAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).filter(w => w).length,
    charCount: content.length
  };

  let styleRef;
  
  try {
    // Save version
    await db.add(STYLE_VERSIONS_STORE, version);

    // Save or update style reference
    const existing = await db.get(STYLE_STORE, id).catch(() => null);
    styleRef = {
      id,
      name,
      type,
      scope,
      projectId,
      currentVersionId: version.id,
      metadata,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    await db.update(STYLE_STORE, styleRef);
  } catch (error) {
    if (error.name === 'NotFoundError' || error.message?.includes('object stores was not found')) {
      throw new Error('DATABASE_MIGRATION_NEEDED: Please refresh the page to run the database migration.');
    }
    throw error;
  }

  // Analyze and extract patterns (don't fail if analysis fails)
  try {
    await analyzeStylePatterns(id, content);
  } catch (error) {
    console.warn('Style pattern analysis failed, but reference was saved:', error);
  }

  return { styleRef, version };
};

/**
 * Analyze style document and extract patterns
 */
const analyzeStylePatterns = async (styleId, content) => {
  try {
    // Truncate content for analysis if too long (keep first 5000 words)
    const words = content.split(/\s+/);
    const analysisText = words.length > 5000 
      ? words.slice(0, 5000).join(' ') + '...'
      : content;

    const prompt = `Analyze this writing sample and extract key style patterns. Return JSON with:
{
  "tone": "description of overall tone",
  "pacing": "description of pacing (fast/slow/varies)",
  "humorStyle": "description of comedy/humor approach",
  "voice": "description of narrative voice",
  "dialogueStyle": "description of how dialogue is written",
  "descriptionStyle": "description of descriptive passages",
  "sentenceStructure": "description of sentence patterns",
  "vocabulary": "description of word choice and formality",
  "themes": ["theme1", "theme2"],
  "keyPhrases": ["example phrase 1", "example phrase 2"],
  "characterVoicePatterns": "description of how characters speak differently"
}

Text to analyze:
"""
${analysisText}
"""

Return ONLY valid JSON, no markdown or explanation.`;

    const result = await aiService.callAI(prompt, 'analysis');
    
    // Parse JSON result
    let patterns;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        patterns = JSON.parse(jsonMatch[0]);
      } else {
        patterns = JSON.parse(result);
      }
    } catch (e) {
      console.warn('Failed to parse style patterns, using fallback:', e);
      patterns = {
        tone: 'Extracted from document',
        pacing: 'Variable',
        humorStyle: 'Present in text',
        voice: 'Narrative voice detected',
        dialogueStyle: 'Dialogue patterns found',
        descriptionStyle: 'Descriptive writing present',
        sentenceStructure: 'Varied',
        vocabulary: 'Context-appropriate',
        themes: [],
        keyPhrases: [],
        characterVoicePatterns: 'Character voices detected'
      };
    }

    // Save patterns
    const patternData = {
      id: `pattern_${styleId}`,
      styleId,
      patterns,
      extractedAt: new Date().toISOString(),
      sourceLength: content.length
    };

    await db.update(STYLE_PATTERNS_STORE, patternData);

    return patterns;
  } catch (error) {
    console.error('Error analyzing style patterns:', error);
    return null;
  }
};

/**
 * Get all style references
 */
export const getStyleReferences = async (scope = null, projectId = null) => {
  const storesExist = await initStores();
  
  if (!storesExist) {
    // Stores don't exist yet - return empty array gracefully
    return [];
  }
  
  try {
    const all = await db.getAll(STYLE_STORE) || [];
    
    if (scope === 'global') {
      return all.filter(s => s.scope === 'global');
    } else if (scope === 'project' && projectId) {
      return all.filter(s => s.scope === 'project' && s.projectId === projectId);
    }
    
    return all;
  } catch (error) {
    if (error.name === 'NotFoundError' || error.message?.includes('object stores was not found')) {
      console.warn('Style reference stores not found. Database migration may be needed. Please refresh the page.');
      return [];
    }
    throw error;
  }
};

/**
 * Get style patterns for a reference
 */
export const getStylePatterns = async (styleId) => {
  await initStores();
  
  try {
    const patterns = await db.get(STYLE_PATTERNS_STORE, `pattern_${styleId}`);
    return patterns?.patterns || null;
  } catch (e) {
    return null;
  }
};

/**
 * Get all style patterns (merged)
 */
export const getAllStylePatterns = async (projectId = null) => {
  await initStores();
  
  const globalStyles = await getStyleReferences('global');
  const projectStyles = projectId ? await getStyleReferences('project', projectId) : [];
  
  const allStyles = [...globalStyles, ...projectStyles];
  const allPatterns = [];
  
  for (const style of allStyles) {
    const patterns = await getStylePatterns(style.id);
    if (patterns) {
      allPatterns.push({
        styleId: style.id,
        styleName: style.name,
        patterns
      });
    }
  }
  
  return allPatterns;
};

/**
 * Get style reference content (for AI context)
 */
export const getStyleContext = async (projectId = null, maxWords = 2000) => {
  const storesExist = await initStores();
  
  if (!storesExist) {
    // Stores don't exist yet - return empty string
    return '';
  }
  
  const globalStyles = await getStyleReferences('global');
  const projectStyles = projectId ? await getStyleReferences('project', projectId) : [];
  
  const allStyles = [...globalStyles, ...projectStyles];
  const contexts = [];
  
  for (const style of allStyles) {
    try {
      const version = await db.get(STYLE_VERSIONS_STORE, style.currentVersionId);
      if (version?.content) {
        contexts.push({
          name: style.name,
          type: style.type,
          content: version.content
        });
      }
    } catch (e) {
      // Version not found, skip
    }
  }
  
  // Combine and truncate if needed
  let combined = contexts.map(c => `[${c.name} - ${c.type}]\n${c.content}`).join('\n\n---\n\n');
  
  const words = combined.split(/\s+/);
  if (words.length > maxWords) {
    // Keep first portion, prioritizing examples
    const examples = contexts.filter(c => c.type === 'examples');
    const others = contexts.filter(c => c.type !== 'examples');
    
    let truncated = '';
    if (examples.length > 0) {
      const exampleText = examples.map(c => c.content).join('\n\n');
      const exampleWords = exampleText.split(/\s+/);
      if (exampleWords.length <= maxWords * 0.7) {
        truncated = exampleText + '\n\n';
        const remaining = maxWords - exampleWords.length;
        if (remaining > 0 && others.length > 0) {
          const otherText = others[0].content;
          const otherWords = otherText.split(/\s+/);
          truncated += otherWords.slice(0, remaining).join(' ');
        }
      } else {
        truncated = exampleWords.slice(0, Math.floor(maxWords * 0.7)).join(' ') + '\n\n';
        truncated += others[0]?.content.split(/\s+/).slice(0, Math.floor(maxWords * 0.3)).join(' ') || '';
      }
    } else {
      truncated = words.slice(0, maxWords).join(' ');
    }
    
    combined = truncated + '...';
  }
  
  return combined;
};

/**
 * Get version history for a style reference
 */
export const getStyleVersions = async (styleId) => {
  await initStores();
  
  try {
    const allVersions = await db.getAll(STYLE_VERSIONS_STORE) || [];
    return allVersions
      .filter(v => v.styleId === styleId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return [];
  }
};

/**
 * Restore a specific version
 */
export const restoreStyleVersion = async (styleId, versionId) => {
  await initStores();
  
  try {
    const version = await db.get(STYLE_VERSIONS_STORE, versionId);
    if (!version || version.styleId !== styleId) {
      throw new Error('Version not found');
    }
    
    const style = await db.get(STYLE_STORE, styleId);
    if (!style) {
      throw new Error('Style reference not found');
    }
    
    // Create new version from restored content
    const newVersion = {
      id: `version_${Date.now()}`,
      styleId,
      content: version.content,
      createdAt: new Date().toISOString(),
      wordCount: version.wordCount,
      charCount: version.charCount,
      restoredFrom: versionId
    };
    
    await db.add(STYLE_VERSIONS_STORE, newVersion);
    
    // Update style reference
    style.currentVersionId = newVersion.id;
    style.updatedAt = new Date().toISOString();
    await db.update(STYLE_STORE, style);
    
    // Re-analyze patterns
    await analyzeStylePatterns(styleId, version.content);
    
    return newVersion;
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
};

/**
 * Delete a style reference
 */
export const deleteStyleReference = async (styleId) => {
  await initStores();
  
  await db.delete(STYLE_STORE, styleId);
  
  // Delete patterns
  try {
    await db.delete(STYLE_PATTERNS_STORE, `pattern_${styleId}`);
  } catch (e) {
    // Pattern might not exist
  }
  
  // Keep versions for history, but mark as deleted
  // (or delete if you want full cleanup)
};

export default {
  saveStyleReference,
  getStyleReferences,
  getStylePatterns,
  getAllStylePatterns,
  getStyleContext,
  getStyleVersions,
  restoreStyleVersion,
  deleteStyleReference
};
