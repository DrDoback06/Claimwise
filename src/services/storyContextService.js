/**
 * Story Context Service
 * Manages long-form story context documents that can be included in AI prompts
 * These documents contain story outlines, world-building details, character backgrounds, etc.
 */

import db from './database';

class StoryContextService {
  constructor() {
    this.cachedDocuments = null;
  }

  /**
   * Get all story context documents
   */
  async getAllDocuments() {
    if (this.cachedDocuments) {
      return this.cachedDocuments;
    }
    
    try {
      const documents = await db.getAll('storyContextDocuments');
      this.cachedDocuments = documents || [];
      return this.cachedDocuments;
    } catch (error) {
      console.error('Error loading story context documents:', error);
      return [];
    }
  }

  /**
   * Get enabled documents (those that should be included in AI prompts)
   */
  async getEnabledDocuments() {
    const allDocs = await this.getAllDocuments();
    return allDocs.filter(doc => doc.enabled !== false);
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category) {
    const allDocs = await this.getAllDocuments();
    return allDocs.filter(doc => doc.category === category);
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id) {
    try {
      return await db.get('storyContextDocuments', id);
    } catch (error) {
      console.error('Error getting story context document:', error);
      return null;
    }
  }

  /**
   * Create a new story context document
   */
  async createDocument(data) {
    try {
      const document = {
        id: data.id || `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title || 'Untitled Document',
        content: data.content || '',
        category: data.category || 'general', // 'outline', 'worldbuilding', 'character', 'plot', 'general'
        description: data.description || '',
        enabled: data.enabled !== undefined ? data.enabled : true,
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now(),
        tags: data.tags || []
      };

      await db.add('storyContextDocuments', document);
      this.cachedDocuments = null; // Clear cache
      return document;
    } catch (error) {
      console.error('Error creating story context document:', error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(id, updates) {
    try {
      const document = await this.getDocument(id);
      if (!document) {
        throw new Error('Document not found');
      }

      const updated = {
        ...document,
        ...updates,
        updatedAt: Date.now()
      };

      await db.update('storyContextDocuments', updated);
      this.cachedDocuments = null; // Clear cache
      return updated;
    } catch (error) {
      console.error('Error updating story context document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id) {
    try {
      await db.delete('storyContextDocuments', id);
      this.cachedDocuments = null; // Clear cache
    } catch (error) {
      console.error('Error deleting story context document:', error);
      throw error;
    }
  }

  /**
   * Toggle document enabled status
   */
  async toggleDocument(id) {
    const document = await this.getDocument(id);
    if (document) {
      return await this.updateDocument(id, { enabled: !document.enabled });
    }
  }

  /**
   * Build context string from enabled documents for AI prompts
   * Also includes uploaded documents from the 'documents' table (Manuscript Intelligence)
   */
  async buildContextString(selectedDocumentIds = null) {
    let documents = [];
    
    // Get story context documents
    if (selectedDocumentIds && selectedDocumentIds.length > 0) {
      // Get specific documents
      const storyDocs = await Promise.all(
        selectedDocumentIds.map(id => this.getDocument(id))
      );
      documents = storyDocs.filter(doc => doc && doc.enabled !== false);
    } else {
      // Get all enabled documents
      documents = await this.getEnabledDocuments();
    }

    // Also include uploaded documents from Manuscript Intelligence (documents table)
    try {
      const uploadedDocs = await db.getAll('documents');
      if (uploadedDocs && uploadedDocs.length > 0) {
        // Convert uploaded documents to story context format
        const convertedDocs = uploadedDocs.map(doc => ({
          id: doc.id,
          title: doc.filename || 'Uploaded Document',
          content: doc.text || '',
          category: 'general',
          description: `Uploaded ${doc.fileType || 'document'}`,
          enabled: true,
          createdAt: doc.uploadedAt || Date.now(),
          updatedAt: doc.uploadedAt || Date.now(),
          tags: []
        }));
        documents = [...documents, ...convertedDocs];
      }
    } catch (error) {
      console.warn('Could not load uploaded documents for context:', error);
    }

    if (documents.length === 0) {
      return '';
    }

    // Sort by category, then by title
    documents.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });

    // Build context string
    let contextString = '=== STORY CONTEXT DOCUMENTS ===\n\n';
    
    let currentCategory = null;
    documents.forEach(doc => {
      if (currentCategory !== doc.category) {
        if (currentCategory !== null) {
          contextString += '\n';
        }
        contextString += `--- ${doc.category.toUpperCase()} ---\n\n`;
        currentCategory = doc.category;
      }
      
      contextString += `[${doc.title}]\n`;
      if (doc.description) {
        contextString += `${doc.description}\n\n`;
      }
      contextString += `${doc.content}\n\n`;
    });

    contextString += '=== END STORY CONTEXT DOCUMENTS ===\n\n';
    
    return contextString;
  }

  /**
   * Get Series Bible content (book descriptions and chapter summaries)
   */
  async getSeriesBibleContext(books) {
    if (!books || Object.keys(books).length === 0) {
      return '';
    }

    let context = '=== SERIES BIBLE ===\n\n';
    
    const booksArray = Array.isArray(books) ? books : Object.values(books);
    
    booksArray.forEach(book => {
      context += `BOOK: ${book.title || 'Untitled'}\n`;
      if (book.description) {
        context += `Description: ${book.description}\n`;
      }
      if (book.genre) {
        context += `Genre: ${book.genre}\n`;
      }
      if (book.chapters && book.chapters.length > 0) {
        context += `\nChapters:\n`;
        book.chapters.forEach((chapter, idx) => {
          const chapterNum = chapter.number || idx + 1;
          const chapterTitle = chapter.title || `Chapter ${chapterNum}`;
          const chapterDesc = chapter.desc || chapter.description || '';
          context += `  ${chapterNum}. ${chapterTitle}`;
          if (chapterDesc) {
            context += ` - ${chapterDesc}`;
          }
          context += `\n`;
        });
      }
      context += `\n`;
    });

    context += '=== END SERIES BIBLE ===\n\n';
    
    return context;
  }

  /**
   * Get Wiki entries context
   */
  async getWikiContext(wikiEntries) {
    if (!wikiEntries || wikiEntries.length === 0) {
      return '';
    }

    let context = '=== WIKI ENTRIES ===\n\n';
    
    wikiEntries.forEach(entry => {
      context += `[${entry.title || 'Untitled'}]\n`;
      if (entry.content) {
        context += `${entry.content}\n\n`;
      }
    });

    context += '=== END WIKI ENTRIES ===\n\n';
    
    return context;
  }
}

const storyContextService = new StoryContextService();
export default storyContextService;
