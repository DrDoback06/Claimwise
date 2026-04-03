import React, { useState, useEffect } from 'react';
import { FileText, Upload, X, Check, XCircle, Eye, Sparkles, Save, Trash2, BookOpen, Users, Briefcase, Zap, AlertCircle } from 'lucide-react';
import documentService from '../services/documentService';
import aiService from '../services/aiService';
import toastService from '../../services/toastService';

/**
 * Document Context Manager - Upload documents and get AI suggestions
 */
const DocumentContextManager = ({ worldState, onClose, onApplySuggestions }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState({
    actors: new Set(),
    items: new Set(),
    skills: new Set(),
    chapters: new Set(),
    actorUpdates: new Set()
  });
  const [chapterBookSelections, setChapterBookSelections] = useState({}); // { chapterIndex: bookId }
  const [viewMode, setViewMode] = useState('library'); // 'library' | 'suggestions' | 'document'

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getAllDocuments();
      setDocuments(docs.sort((a, b) => b.uploadedAt - a.uploadedAt));
    } catch (error) {
      console.error('Error loading documents:', error);
      toastService.error('Failed to load documents');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Parse file
      const parsedData = await documentService.parseFile(file);
      
      // Save to database
      const document = await documentService.saveDocument(file, parsedData);
      
      setDocuments(prev => [document, ...prev]);
      setSelectedDocument(document);
      toastService.success(`Document "${file.name}" uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toastService.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const scanDocument = async (documentId) => {
    setIsScanning(true);
    try {
      const doc = await documentService.getDocument(documentId);
      if (!doc) {
        throw new Error('Document not found');
      }

      // Scan with AI
      const result = await aiService.scanDocumentForSuggestions(doc.text, worldState);
      
      // Extract suggestions from nested structure
      const extractedSuggestions = {
        actors: result.suggestions?.newActors || result.actors || [],
        items: result.suggestions?.newItems || result.items || [],
        skills: result.suggestions?.newSkills || result.skills || [],
        chapters: result.suggestions?.newChapters || result.chapters || [],
        actorUpdates: result.suggestions?.updatedActors || result.actorUpdates || []
      };
      
      // Save suggestions
      await documentService.saveSuggestions(documentId, extractedSuggestions);
      
      setSuggestions(extractedSuggestions);
      setViewMode('suggestions');
      toastService.success(`Document scanned! Found ${Object.values(extractedSuggestions).flat().length} suggestions.`);
    } catch (error) {
      console.error('Scan error:', error);
      toastService.error(`Scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSuggestion = (category, index) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev[category]);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return { ...prev, [category]: newSet };
    });
  };

  const applySelectedSuggestions = async () => {
    if (!suggestions) return;

    // Map chapters with their selected books
    const selectedChapterIndices = Array.from(selectedSuggestions.chapters);
    const chaptersWithBooks = selectedChapterIndices.map(idx => {
      const chapter = suggestions.chapters[idx];
      const bookId = chapterBookSelections[idx];
      return {
        ...chapter,
        bookId: bookId && bookId !== '__new__' ? bookId : null,
        newBookTitle: bookId === '__new__' ? (document.querySelector(`input[data-chapter-new-book="${idx}"]`)?.value || 'New Book') : null
      };
    });

    const toApply = {
      actors: suggestions.actors?.filter((_, i) => selectedSuggestions.actors.has(i)) || [],
      items: suggestions.items?.filter((_, i) => selectedSuggestions.items.has(i)) || [],
      skills: suggestions.skills?.filter((_, i) => selectedSuggestions.skills.has(i)) || [],
      chapters: chaptersWithBooks,
      actorUpdates: suggestions.actorUpdates?.filter((_, i) => selectedSuggestions.actorUpdates.has(i)) || []
    };

    if (onApplySuggestions) {
      await onApplySuggestions(toApply);
    }

    toastService.success(`Applied ${Object.values(toApply).flat().length} suggestions`);
    setViewMode('library');
    setSuggestions(null);
    setChapterBookSelections({});
    setSelectedSuggestions({
      actors: new Set(),
      items: new Set(),
      skills: new Set(),
      chapters: new Set(),
      actorUpdates: new Set()
    });
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    
    try {
      await documentService.deleteDocument(docId);
      await loadDocuments();
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
      toastService.success('Document deleted');
    } catch (error) {
      toastService.error(`Delete failed: ${error.message}`);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FileText className="mr-3 text-green-500" />
            DOCUMENT CONTEXT MANAGER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Upload documents for AI analysis and suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            UPLOAD DOCUMENT
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Document Library */}
        <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-3">DOCUMENT LIBRARY</h3>
            <div className="text-xs text-slate-400">
              Supported: PDF, DOCX, TXT, Markdown
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {documents.map(doc => (
              <div
                key={doc.id}
                className={`bg-slate-900 border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedDocument?.id === doc.id ? 'border-green-500 bg-green-900/20' : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => {
                  setSelectedDocument(doc);
                  setViewMode('document');
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm truncate">{doc.filename}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDate(doc.uploadedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDocument(doc.id);
                    }}
                    className="text-slate-600 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-slate-800 px-2 py-1 rounded">{doc.fileType.toUpperCase()}</span>
                  <span className="text-slate-500">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                  {doc.suggestionsGenerated && (
                    <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded">Scanned</span>
                  )}
                </div>
                {selectedDocument?.id === doc.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      scanDocument(doc.id);
                    }}
                    disabled={isScanning}
                    className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        SCAN FOR SUGGESTIONS
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center text-slate-500 p-8">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded</p>
                <p className="text-xs mt-2">Upload a document to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'suggestions' && suggestions && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">AI SUGGESTIONS</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Select all
                        setSelectedSuggestions({
                          actors: new Set(suggestions.actors?.map((_, i) => i) || []),
                          items: new Set(suggestions.items?.map((_, i) => i) || []),
                          skills: new Set(suggestions.skills?.map((_, i) => i) || []),
                          chapters: new Set(suggestions.chapters?.map((_, i) => i) || []),
                          actorUpdates: new Set(suggestions.actorUpdates?.map((_, i) => i) || [])
                        });
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Select All
                    </button>
                    <button
                      onClick={applySelectedSuggestions}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold"
                    >
                      APPLY SELECTED
                    </button>
                  </div>
                </div>

                {/* Actors */}
                {suggestions.actors && suggestions.actors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-400" />
                      NEW ACTORS ({suggestions.actors.length})
                    </h4>
                    <div className="space-y-3">
                      {suggestions.actors.map((actor, idx) => (
                        <div
                          key={idx}
                          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedSuggestions.actors.has(idx) ? 'border-green-500 bg-green-900/20' : 'border-slate-800'
                          }`}
                          onClick={() => toggleSuggestion('actors', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.actors.has(idx)}
                                  onChange={() => toggleSuggestion('actors', idx)}
                                  className="w-4 h-4"
                                />
                                <span className="font-bold text-white">{actor.name}</span>
                                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{actor.class}</span>
                                <span className="text-xs text-slate-500">Confidence: {(actor.confidence * 100).toFixed(0)}%</span>
                              </div>
                              <div className="text-sm text-slate-400 mb-2">{actor.desc}</div>
                              {actor.baseStats && (
                                <div className="text-xs text-slate-500">
                                  Stats: {Object.entries(actor.baseStats).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                {suggestions.items && suggestions.items.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-yellow-400" />
                      NEW ITEMS ({suggestions.items.length})
                    </h4>
                    <div className="space-y-3">
                      {suggestions.items.map((item, idx) => (
                        <div
                          key={idx}
                          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedSuggestions.items.has(idx) ? 'border-green-500 bg-green-900/20' : 'border-slate-800'
                          }`}
                          onClick={() => toggleSuggestion('items', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.items.has(idx)}
                                  onChange={() => toggleSuggestion('items', idx)}
                                  className="w-4 h-4"
                                />
                                <span className="font-bold text-white">{item.name}</span>
                                <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded">{item.type}</span>
                                <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">{item.rarity || 'Common'}</span>
                                <span className="text-xs text-slate-500">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                              </div>
                              <div className="text-sm text-slate-400 mb-2">{item.desc}</div>
                              {item.stats && (
                                <div className="text-xs text-slate-500">
                                  Stats: {Object.entries(item.stats).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {suggestions.skills && suggestions.skills.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-blue-400" />
                      NEW SKILLS ({suggestions.skills.length})
                    </h4>
                    <div className="space-y-3">
                      {suggestions.skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedSuggestions.skills.has(idx) ? 'border-green-500 bg-green-900/20' : 'border-slate-800'
                          }`}
                          onClick={() => toggleSuggestion('skills', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.skills.has(idx)}
                                  onChange={() => toggleSuggestion('skills', idx)}
                                  className="w-4 h-4"
                                />
                                <span className="font-bold text-white">{skill.name}</span>
                                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{skill.type}</span>
                                <span className="text-xs bg-slate-800 px-2 py-1 rounded">Tier {skill.tier || 1}</span>
                                <span className="text-xs text-slate-500">Confidence: {(skill.confidence * 100).toFixed(0)}%</span>
                              </div>
                              <div className="text-sm text-slate-400 mb-2">{skill.desc}</div>
                              {skill.statMod && (
                                <div className="text-xs text-slate-500">
                                  Modifiers: {Object.entries(skill.statMod).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapters */}
                {suggestions.chapters && suggestions.chapters.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-green-400" />
                      CHAPTER SUGGESTIONS ({suggestions.chapters.length})
                    </h4>
                    <div className="space-y-3">
                      {suggestions.chapters.map((chapter, idx) => (
                        <div
                          key={idx}
                          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedSuggestions.chapters.has(idx) ? 'border-green-500 bg-green-900/20' : 'border-slate-800'
                          }`}
                          onClick={() => toggleSuggestion('chapters', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.chapters.has(idx)}
                                  onChange={() => toggleSuggestion('chapters', idx)}
                                  className="w-4 h-4"
                                />
                                <span className="font-bold text-white">{chapter.title}</span>
                                <span className="text-xs text-slate-500">Confidence: {((chapter.confidence || 0.8) * 100).toFixed(0)}%</span>
                              </div>
                              <div className="text-sm text-slate-400 mb-2">{chapter.synopsis || chapter.desc}</div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-400">Assign to Book:</label>
                                <select
                                  value={chapterBookSelections[idx] || ''}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setChapterBookSelections(prev => ({ ...prev, [idx]: e.target.value }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-slate-800 border border-slate-700 text-white text-xs p-1 rounded"
                                >
                                  <option value="">Select book...</option>
                                  {worldState.books && Object.values(worldState.books).map(book => (
                                    <option key={book.id} value={book.id}>{book.title}</option>
                                  ))}
                                  <option value="__new__">+ Create New Book</option>
                                </select>
                                {chapterBookSelections[idx] === '__new__' && (
                                  <input
                                    type="text"
                                    data-chapter-new-book={idx}
                                    placeholder="New book title"
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      // Store new book title in chapter object
                                      if (suggestions.chapters[idx]) {
                                        suggestions.chapters[idx].newBookTitle = e.target.value;
                                      }
                                    }}
                                    className="bg-slate-800 border border-slate-700 text-white text-xs p-1 rounded flex-1"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actor Updates */}
                {suggestions.actorUpdates && suggestions.actorUpdates.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
                      ACTOR UPDATES ({suggestions.actorUpdates.length})
                    </h4>
                    <div className="space-y-3">
                      {suggestions.actorUpdates.map((update, idx) => (
                        <div
                          key={idx}
                          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedSuggestions.actorUpdates.has(idx) ? 'border-green-500 bg-green-900/20' : 'border-slate-800'
                          }`}
                          onClick={() => toggleSuggestion('actorUpdates', idx)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.actorUpdates.has(idx)}
                                  onChange={() => toggleSuggestion('actorUpdates', idx)}
                                  className="w-4 h-4"
                                />
                                <span className="font-bold text-white">{update.actorName}</span>
                                <span className="text-xs text-slate-500">Confidence: {(update.confidence * 100).toFixed(0)}%</span>
                              </div>
                              {update.statChanges && (
                                <div className="text-sm text-slate-400 mb-1">
                                  Stat Changes: {Object.entries(update.statChanges).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ')}
                                </div>
                              )}
                              {update.newSkills && update.newSkills.length > 0 && (
                                <div className="text-sm text-slate-400 mb-1">
                                  New Skills: {update.newSkills.join(', ')}
                                </div>
                              )}
                              {update.newItems && update.newItems.length > 0 && (
                                <div className="text-sm text-slate-400">
                                  New Items: {update.newItems.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'document' && selectedDocument && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedDocument.filename}</h3>
                      <div className="text-sm text-slate-400 mt-1">
                        Uploaded: {formatDate(selectedDocument.uploadedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => scanDocument(selectedDocument.id)}
                      disabled={isScanning}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          SCAN FOR SUGGESTIONS
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {selectedDocument.text.substring(0, 5000)}
                      {selectedDocument.text.length > 5000 && '...\n\n[Document truncated for display]'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'library' && !selectedDocument && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a document to view or scan</p>
                <p className="text-sm mt-2">Upload documents to get AI-powered suggestions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentContextManager;

