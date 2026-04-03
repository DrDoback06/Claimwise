/**
 * Style Connection Service
 * Checks which style sources are connected and available for AI generation
 */

import styleReferenceService from './styleReferenceService';
import expertWriterService from './expertWriterService';
import smartContextEngine from './smartContextEngine';
import db from './database';
import { getExpertWriterContent } from '../data/expertWriterBase';

/**
 * Check connection status for all style sources
 * @param {Object} options - Context options (chapterId, bookId, etc.)
 * @returns {Promise<Array>} Array of { id, name, connected, details, error }
 */
export const checkStyleConnections = async (options = {}) => {
  const { chapterId = null, bookId = null } = options;
  const connections = [];

  // 1. Expert Writer Foundation (Built-in Guides)
  // Check base content only (no AI calls) to avoid timeouts
  try {
    const baseContent = getExpertWriterContent();
    const isConnected = baseContent && baseContent.trim().length > 0;
    
    connections.push({
      id: 'expert-writer',
      name: 'Built-in Writing Guides',
      type: 'built-in',
      connected: isConnected,
      details: isConnected 
        ? `Expert writing foundation available (${baseContent.length} chars)`
        : 'Built-in guides not available',
      error: isConnected ? null : 'Failed to load expert writer base content'
    });
  } catch (error) {
    connections.push({
      id: 'expert-writer',
      name: 'Built-in Writing Guides',
      type: 'built-in',
      connected: false,
      details: 'Error loading built-in guides',
      error: error.message
    });
  }

  // 2. Style Profile (from Story Profile)
  try {
    const storyProfile = await smartContextEngine.getFullStoryProfile().catch(() => null);
    const hasStyleProfile = storyProfile?.styleProfile && Object.keys(storyProfile.styleProfile).length > 0;
    
    if (hasStyleProfile) {
      const sp = storyProfile.styleProfile;
      const hasVoiceProfile = sp.voiceProfile && Object.keys(sp.voiceProfile).length > 0;
      const hasToneBalance = sp.toneBalance;
      const hasComedyRules = sp.comedyRules && Object.keys(sp.comedyRules).length > 0;
      
      connections.push({
        id: 'style-profile',
        name: 'Style Profile',
        type: 'custom',
        connected: true,
        details: `Style profile loaded${hasVoiceProfile ? ' (voice profile)' : ''}${hasToneBalance ? ' (tone balance)' : ''}${hasComedyRules ? ' (comedy rules)' : ''}`,
        error: null
      });
    } else {
      connections.push({
        id: 'style-profile',
        name: 'Style Profile',
        type: 'custom',
        connected: false,
        details: 'No style profile configured',
        error: 'Style profile not found in story profile'
      });
    }
  } catch (error) {
    connections.push({
      id: 'style-profile',
      name: 'Style Profile',
      type: 'custom',
      connected: false,
      details: 'Error loading style profile',
      error: error.message
    });
  }

  // 3. Style Instructions
  try {
    const instructions = await smartContextEngine.getStyleInstructions();
    const isConnected = instructions && instructions.length > 0;
    
    connections.push({
      id: 'style-instructions',
      name: 'Style Instructions',
      type: 'custom',
      connected: isConnected,
      details: isConnected 
        ? `${instructions.length} style instruction${instructions.length !== 1 ? 's' : ''} loaded`
        : 'No style instructions configured',
      error: isConnected ? null : 'No style instructions found',
      instructionCount: instructions?.length || 0
    });
  } catch (error) {
    connections.push({
      id: 'style-instructions',
      name: 'Style Instructions',
      type: 'custom',
      connected: false,
      details: 'Error loading style instructions',
      error: error.message
    });
  }

  // 4. Style References (Custom Documents)
  try {
    if (bookId) {
      const styleContext = await styleReferenceService.getStyleContext(bookId, 2000);
      const isConnected = styleContext && styleContext.trim().length > 0;
      
      // Get list of style documents
      let styleDocs = [];
      try {
        const allDocs = await db.getAll('styleReferences');
        styleDocs = allDocs.filter(doc => 
          doc.scope === 'global' || 
          (doc.scope === 'project' && doc.projectId === bookId)
        );
      } catch (e) {
        // Store might not exist yet
      }
      
      connections.push({
        id: 'style-references',
        name: 'Style Documents',
        type: 'custom',
        connected: isConnected,
        details: isConnected 
          ? `${styleDocs.length} style document${styleDocs.length !== 1 ? 's' : ''} loaded (${styleContext.length} chars)`
          : 'No style documents found',
        error: isConnected ? null : 'No style documents available',
        documentCount: styleDocs.length,
        documents: styleDocs.map(doc => ({ id: doc.id, name: doc.name, type: doc.type }))
      });
    } else {
      connections.push({
        id: 'style-references',
        name: 'Style Documents',
        type: 'custom',
        connected: false,
        details: 'Book ID required to load style documents',
        error: 'No book ID provided'
      });
    }
  } catch (error) {
    connections.push({
      id: 'style-references',
      name: 'Style Documents',
      type: 'custom',
      connected: false,
      details: 'Error loading style documents',
      error: error.message
    });
  }

  // 5. Negative Examples
  try {
    const negativeExamples = await smartContextEngine.getNegativeExamples().catch(() => []);
    const isConnected = negativeExamples && negativeExamples.length > 0;
    
    connections.push({
      id: 'negative-examples',
      name: 'Negative Examples',
      type: 'custom',
      connected: isConnected,
      details: isConnected 
        ? `${negativeExamples.length} negative example${negativeExamples.length !== 1 ? 's' : ''} loaded`
        : 'No negative examples configured',
      error: isConnected ? null : 'No negative examples found',
      exampleCount: negativeExamples?.length || 0
    });
  } catch (error) {
    connections.push({
      id: 'negative-examples',
      name: 'Negative Examples',
      type: 'custom',
      connected: false,
      details: 'Error loading negative examples',
      error: error.message
    });
  }

  return connections;
};

export default {
  checkStyleConnections
};
