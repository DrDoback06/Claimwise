/**
 * Document Service - Handles file parsing, storage, and text extraction
 * Supports PDF, DOCX, TXT, and Markdown files
 */

import db from './database';

class DocumentService {
  constructor() {
    this.supportedFormats = ['pdf', 'docx', 'txt', 'md', 'markdown'];
  }

  /**
   * Parse and extract text from uploaded file
   */
  async parseFile(file) {
    const fileType = this.getFileType(file.name);
    
    if (!this.supportedFormats.includes(fileType)) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    switch (fileType) {
      case 'pdf':
        return await this.parsePDF(file);
      case 'docx':
        return await this.parseDOCX(file);
      case 'txt':
      case 'md':
      case 'markdown':
        return await this.parseText(file);
      default:
        throw new Error(`Parser not implemented for: ${fileType}`);
    }
  }

  /**
   * Get file type from filename
   */
  getFileType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || 'txt';
  }

  /**
   * Parse PDF file using PDF.js
   */
  async parsePDF(file) {
    try {
      // Dynamic import of PDF.js
      let pdfjsLib;
      try {
        pdfjsLib = await import('pdfjs-dist');
      } catch (importError) {
        throw new Error('PDF.js library not installed. Please install pdfjs-dist: npm install pdfjs-dist');
      }

      // Use local worker file, fallback to CDN if not available
      try {
        // Try multiple possible worker paths
        const workerPaths = [
          '/pdf.worker.min.mjs',
          '/pdf.worker.min.js',
          '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          '/node_modules/pdfjs-dist/build/pdf.worker.min.js'
        ];
        
        let workerFound = false;
        for (const workerPath of workerPaths) {
          try {
            const testResponse = await fetch(workerPath, { method: 'HEAD' });
            if (testResponse.ok) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
              workerFound = true;
              break;
            }
          } catch (e) {
            // Try next path
            continue;
          }
        }
        
        if (!workerFound) {
          // Fallback to CDN
          console.warn('Local PDF worker not found, using CDN fallback');
          const version = pdfjsLib.version || '3.11.174';
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
        }
      } catch (error) {
        // Fallback to CDN
        console.warn('Error setting up PDF worker, using CDN fallback:', error);
        const version = pdfjsLib.version || '3.11.174';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
      }

      const arrayBuffer = await file.arrayBuffer();
      
      // Add timeout for large PDFs
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // Reduce console noise
      });
      
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timeout (30s)')), 30000)
        )
      ]);
      
      let fullText = '';
      const maxPages = 500; // Limit to prevent memory issues
      const pagesToProcess = Math.min(pdf.numPages, maxPages);
      
      for (let i = 1; i <= pagesToProcess; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str || '').join(' ');
          fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(`Error parsing page ${i}:`, pageError);
          // Continue with next page
        }
      }
      
      if (pdf.numPages > maxPages) {
        fullText += `\n[Note: PDF has ${pdf.numPages} pages, only first ${maxPages} processed]`;
      }

      if (!fullText.trim()) {
        throw new Error('No text could be extracted from PDF. The PDF may be image-based or encrypted.');
      }

      return {
        text: fullText,
        metadata: {
          pages: pdf.numPages,
          title: pdf.metadata?.Title || file.name,
          author: pdf.metadata?.Author || '',
          creationDate: pdf.metadata?.CreationDate || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Provide more helpful error messages
      if (error.message.includes('not installed')) {
        throw error;
      } else if (error.message.includes('timeout')) {
        throw new Error(`PDF is too large or taking too long to process. Try a smaller file or split the PDF.`);
      } else if (error.message.includes('No text')) {
        throw error;
      } else {
        throw new Error(`Failed to parse PDF: ${error.message}. Make sure the PDF is not password-protected or corrupted.`);
      }
    }
  }

  /**
   * Parse DOCX file using mammoth
   */
  async parseDOCX(file) {
    try {
      // Dynamic import of mammoth
      const mammoth = await import('mammoth');
      
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        text: result.value,
        metadata: {
          title: file.name,
          author: '',
          creationDate: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Parse plain text file
   */
  async parseText(file) {
    try {
      const text = await file.text();
      return {
        text,
        metadata: {
          title: file.name,
          author: '',
          creationDate: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error(`Failed to parse text file: ${error.message}`);
    }
  }

  /**
   * Save document to database
   */
  async saveDocument(file, parsedData) {
    const document = {
      id: `doc_${Date.now()}`,
      filename: file.name,
      fileType: this.getFileType(file.name),
      fileSize: file.size,
      text: parsedData.text,
      metadata: parsedData.metadata,
      uploadedAt: Date.now(),
      processedAt: null,
      suggestionsGenerated: false
    };

    await db.add('documents', document);
    return document;
  }

  /**
   * Get all documents
   */
  async getAllDocuments() {
    return await db.getAll('documents');
  }

  /**
   * Get document by ID
   */
  async getDocument(id) {
    return await db.get('documents', id);
  }

  /**
   * Delete document
   */
  async deleteDocument(id) {
    await db.delete('documents', id);
  }

  /**
   * Save document suggestions
   */
  async saveSuggestions(documentId, suggestions) {
    const suggestionRecord = {
      id: `sug_${documentId}_${Date.now()}`,
      documentId,
      suggestions,
      createdAt: Date.now(),
      status: 'pending' // 'pending' | 'approved' | 'rejected'
    };

    await db.add('documentSuggestions', suggestionRecord);
    
    // Mark document as processed
    const doc = await this.getDocument(documentId);
    if (doc) {
      doc.processedAt = Date.now();
      doc.suggestionsGenerated = true;
      await db.update('documents', doc);
    }

    return suggestionRecord;
  }

  /**
   * Get suggestions for a document
   */
  async getSuggestions(documentId) {
    const allSuggestions = await db.getAll('documentSuggestions');
    return allSuggestions.filter(s => s.documentId === documentId);
  }

  /**
   * Update suggestion status
   */
  async updateSuggestionStatus(suggestionId, status) {
    const suggestion = await db.get('documentSuggestions', suggestionId);
    if (suggestion) {
      suggestion.status = status;
      await db.update('documentSuggestions', suggestion);
    }
  }

  /**
   * Detect document type based on content analysis
   */
  async detectDocumentType(text) {
    // Simple keyword-based detection
    const lowerText = text.toLowerCase();
    
    // Book indicators
    const bookKeywords = ['chapter', 'book', 'part', 'act', 'prologue', 'epilogue', 'title:', 'book title'];
    const bookScore = bookKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Item indicators
    const itemKeywords = ['weapon', 'armor', 'item', 'artifact', 'tool', 'equipment', 'rarity', 'stats', 'grants'];
    const itemScore = itemKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Skill indicators
    const skillKeywords = ['skill', 'ability', 'power', 'spell', 'technique', 'tier', 'level', 'unlock'];
    const skillScore = skillKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Relationship indicators
    const relationshipKeywords = ['relationship', 'alliance', 'enemy', 'friend', 'romance', 'family', 'bond'];
    const relationshipScore = relationshipKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Story map indicators
    const storyMapKeywords = ['connection', 'link', 'reference', 'foreshadow', 'callback', 'thread'];
    const storyMapScore = storyMapKeywords.filter(kw => lowerText.includes(kw)).length;
    
    const scores = {
      book: bookScore,
      items: itemScore,
      skills: skillScore,
      relationships: relationshipScore,
      'story-map': storyMapScore
    };
    
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore === 0) {
      return 'mixed'; // Unknown type
    }
    
    // Check if multiple types have high scores (mixed document)
    const highScores = Object.entries(scores).filter(([_, score]) => score >= maxScore * 0.7);
    if (highScores.length > 1) {
      return 'mixed';
    }
    
    // Return the type with highest score
    return Object.entries(scores).find(([_, score]) => score === maxScore)[0];
  }

  /**
   * Chunk text for AI processing (split into manageable chunks)
   */
  chunkText(text, chunkSize = 5000) {
    const chunks = [];
    let currentChunk = '';
    
    const sentences = text.split(/[.!?]+\s+/);
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}

const documentService = new DocumentService();
export default documentService;

