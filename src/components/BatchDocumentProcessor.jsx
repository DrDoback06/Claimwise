import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, Edit3, Save, Trash2, Filter, Download, ArrowRight, Briefcase, Zap, Users, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import documentService from '../services/documentService';
import aiService from '../services/aiService';
import toastService from '../services/toastService';

const BatchDocumentProcessor = ({ worldState, onClose, onDataImported }) => {
  const [documents, setDocuments] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({ file: '', progress: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [filterType, setFilterType] = useState('all'); // 'all' | 'book' | 'items' | 'skills' | 'relationships' | 'story-map'
  const [filterConfidence, setFilterConfidence] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const fileInputRef = useRef(null);

  // Destination mapping for each type
  const getDestination = (type) => {
    const destinations = {
      'items': { name: 'Item Vault', icon: Briefcase, tab: 'items', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-900/30' },
      'skills': { name: 'Skill Tree', icon: Zap, tab: 'skills', colorClass: 'text-blue-400', bgClass: 'bg-blue-900/30' },
      'actor': { name: 'Personnel', icon: Users, tab: 'personnel', colorClass: 'text-green-400', bgClass: 'bg-green-900/30' },
      'actor-update': { name: 'Personnel', icon: Users, tab: 'personnel', colorClass: 'text-green-400', bgClass: 'bg-green-900/30' },
      'book': { name: 'Series Bible', icon: BookOpen, tab: 'bible', colorClass: 'text-purple-400', bgClass: 'bg-purple-900/30' },
      'relationships': { name: 'Relationship Tracker', icon: Users, tab: 'relationships', colorClass: 'text-pink-400', bgClass: 'bg-pink-900/30' },
      'story-map': { name: 'Story Map', icon: FileText, tab: 'storymap', colorClass: 'text-cyan-400', bgClass: 'bg-cyan-900/30' }
    };
    return destinations[type] || { name: 'Unknown', icon: FileText, tab: 'bible', colorClass: 'text-gray-400', bgClass: 'bg-gray-900/30' };
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newDocuments = [];
    for (const file of files) {
      try {
        const parsedData = await documentService.parseFile(file);
        const docType = await documentService.detectDocumentType(parsedData.text);
        
        newDocuments.push({
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          filename: file.name,
          text: parsedData.text,
          metadata: parsedData.metadata,
          detectedType: docType,
          processed: false,
          suggestions: null
        });
      } catch (error) {
        toastService.error(`Failed to parse ${file.name}: ${error.message}`);
      }
    }

    setDocuments(prev => [...prev, ...newDocuments]);
    toastService.success(`${newDocuments.length} document(s) uploaded`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processAllDocuments = async () => {
    if (documents.length === 0) {
      toastService.warn('No documents to process');
      return;
    }

    setIsProcessing(true);
    const allSuggestions = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (doc.processed) continue;

      setCurrentProgress({ file: doc.filename, progress: ((i + 1) / documents.length) * 100 });

      try {
        let docSuggestions = null;

        // Process based on detected type
        switch (doc.detectedType) {
          case 'book':
            const bookResult = await aiService.processBookDocument(doc.text, worldState.books || []);
            if (bookResult.book) {
              docSuggestions = {
                type: 'book',
                data: bookResult.book,
                confidence: bookResult.confidence || 0.8
              };
            }
            break;

          case 'items':
            const itemsResult = await aiService.processItemBatch(doc.text, worldState.itemBank || []);
            if (itemsResult.items && itemsResult.items.length > 0) {
              docSuggestions = {
                type: 'items',
                data: itemsResult.items,
                confidence: itemsResult.confidence || 0.8
              };
            }
            break;

          case 'skills':
            const skillsResult = await aiService.processSkillBatch(doc.text, worldState.skillBank || []);
            if (skillsResult.skills && skillsResult.skills.length > 0) {
              docSuggestions = {
                type: 'skills',
                data: skillsResult.skills,
                confidence: skillsResult.confidence || 0.8
              };
            }
            break;

          case 'relationships':
            const relationshipsResult = await aiService.processRelationshipBatch(doc.text, worldState.actors || []);
            if (relationshipsResult.relationships && relationshipsResult.relationships.length > 0) {
              docSuggestions = {
                type: 'relationships',
                data: relationshipsResult.relationships,
                confidence: relationshipsResult.confidence || 0.8
              };
            }
            break;

          case 'story-map':
            const storyMapResult = await aiService.processStoryMapConnections(doc.text, getAllChapters(worldState));
            if (storyMapResult.connections && storyMapResult.connections.length > 0) {
              docSuggestions = {
                type: 'story-map',
                data: storyMapResult.connections,
                confidence: storyMapResult.confidence || 0.8
              };
            }
            break;

          case 'mixed':
          default:
            // Use general document scanning
            const generalResult = await aiService.scanDocumentForSuggestions(doc.text, worldState);
            if (generalResult.suggestions) {
              // Extract all suggestions from nested structure
              const extractedSuggestions = [];
              
              // Process newActors
              if (generalResult.suggestions.newActors) {
                generalResult.suggestions.newActors.forEach((actor, idx) => {
                  extractedSuggestions.push({
                    id: `sugg_${doc.id}_actor_${idx}_${Date.now()}`,
                    documentId: doc.id,
                    documentName: doc.filename,
                    type: 'actor',
                    data: actor,
                    confidence: generalResult.confidence || 0.7,
                    status: 'pending'
                  });
                });
              }
              
              // Process newItems
              if (generalResult.suggestions.newItems) {
                generalResult.suggestions.newItems.forEach((item, idx) => {
                  extractedSuggestions.push({
                    id: `sugg_${doc.id}_item_${idx}_${Date.now()}`,
                    documentId: doc.id,
                    documentName: doc.filename,
                    type: 'items',
                    data: item,
                    confidence: generalResult.confidence || 0.7,
                    status: 'pending'
                  });
                });
              }
              
              // Process newSkills
              if (generalResult.suggestions.newSkills) {
                generalResult.suggestions.newSkills.forEach((skill, idx) => {
                  extractedSuggestions.push({
                    id: `sugg_${doc.id}_skill_${idx}_${Date.now()}`,
                    documentId: doc.id,
                    documentName: doc.filename,
                    type: 'skills',
                    data: skill,
                    confidence: generalResult.confidence || 0.7,
                    status: 'pending'
                  });
                });
              }
              
              // Process newChapters
              if (generalResult.suggestions.newChapters) {
                generalResult.suggestions.newChapters.forEach((chapter, idx) => {
                  extractedSuggestions.push({
                    id: `sugg_${doc.id}_chapter_${idx}_${Date.now()}`,
                    documentId: doc.id,
                    documentName: doc.filename,
                    type: 'book',
                    data: chapter,
                    confidence: generalResult.confidence || 0.7,
                    status: 'pending'
                  });
                });
              }
              
              // Process updatedActors
              if (generalResult.suggestions.updatedActors) {
                generalResult.suggestions.updatedActors.forEach((update, idx) => {
                  extractedSuggestions.push({
                    id: `sugg_${doc.id}_update_${idx}_${Date.now()}`,
                    documentId: doc.id,
                    documentName: doc.filename,
                    type: 'actor-update',
                    data: update,
                    confidence: generalResult.confidence || 0.7,
                    status: 'pending'
                  });
                });
              }
              
              if (extractedSuggestions.length > 0) {
                allSuggestions.push(...extractedSuggestions);
              }
            }
            break;
        }

        if (docSuggestions) {
          // Create suggestion entries
          const suggestionEntries = Array.isArray(docSuggestions.data)
            ? docSuggestions.data.map((item, idx) => ({
                id: `sugg_${doc.id}_${idx}_${Date.now()}`,
                documentId: doc.id,
                documentName: doc.filename,
                type: docSuggestions.type,
                data: item,
                confidence: docSuggestions.confidence,
                status: 'pending'
              }))
            : [{
                id: `sugg_${doc.id}_${Date.now()}`,
                documentId: doc.id,
                documentName: doc.filename,
                type: docSuggestions.type,
                data: docSuggestions.data,
                confidence: docSuggestions.confidence,
                status: 'pending'
              }];

          allSuggestions.push(...suggestionEntries);
          
          // Mark document as processed
          doc.processed = true;
          doc.suggestions = docSuggestions;
        }
      } catch (error) {
        console.error(`Error processing ${doc.filename}:`, error);
        toastService.error(`Error processing ${doc.filename}: ${error.message}`);
      }
    }

    setDocuments([...documents]);
    setSuggestions(prev => [...prev, ...allSuggestions]);
    setIsProcessing(false);
    setCurrentProgress({ file: '', progress: 0 });
    setReviewMode(true);
    setCurrentReviewIndex(0);
    setShowReviewPopup(true);
    
    toastService.success(`Processing complete! ${allSuggestions.length} suggestions generated.`);
  };

  const getAllChapters = (worldState) => {
    const chapters = [];
    if (worldState.books) {
      worldState.books.forEach(book => {
        if (book.chapters) {
          book.chapters.forEach(chapter => {
            chapters.push({
              bookId: book.id,
              id: chapter.id,
              title: chapter.title
            });
          });
        }
      });
    }
    return chapters;
  };

  const toggleSuggestionSelection = (suggestionId) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const filtered = getFilteredSuggestions();
    setSelectedSuggestions(new Set(filtered.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const selectHighConfidence = () => {
    const filtered = getFilteredSuggestions().filter(s => s.confidence >= 0.8);
    setSelectedSuggestions(new Set(filtered.map(s => s.id)));
  };

  const getFilteredSuggestions = () => {
    return suggestions.filter(s => {
      if (filterType !== 'all' && s.type !== filterType) return false;
      if (s.confidence < filterConfidence) return false;
      return true;
    });
  };

  const applySelectedSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      toastService.warn('No suggestions selected');
      return;
    }

    const toApply = suggestions.filter(s => selectedSuggestions.has(s.id));
    
    try {
      if (onDataImported) {
        await onDataImported(toApply);
      }
      
      // Mark as approved
      setSuggestions(prev => prev.map(s => 
        selectedSuggestions.has(s.id) ? { ...s, status: 'approved' } : s
      ));
      
      // Remove applied suggestions
      setSuggestions(prev => prev.filter(s => !selectedSuggestions.has(s.id)));
      setSelectedSuggestions(new Set());
      
      toastService.success(`${toApply.length} suggestion(s) applied!`);
    } catch (error) {
      toastService.error('Failed to apply suggestions: ' + error.message);
    }
  };

  const rejectSelectedSuggestions = () => {
    setSuggestions(prev => prev.filter(s => !selectedSuggestions.has(s.id)));
    setSelectedSuggestions(new Set());
    toastService.info('Suggestions rejected');
  };

  const removeDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setSuggestions(prev => prev.filter(s => s.documentId !== docId));
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center flex-shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FileText className="mr-3 text-green-500" /> BATCH DOCUMENT PROCESSOR
          </h2>
          <p className="text-sm text-slate-400 mt-1">Upload multiple documents for AI batch processing</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Upload Section */}
          {!reviewMode && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-500" /> Upload Documents
              </h3>
              
              <label htmlFor="batch-file-upload" className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center font-bold py-4 rounded cursor-pointer mb-4">
                <Upload className="w-5 h-5 inline mr-2" />
                SELECT FILES (PDF, DOCX, TXT, MD)
              </label>
              <input
                id="batch-file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Document List */}
              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Uploaded Documents ({documents.length})</span>
                    <button
                      onClick={processAllDocuments}
                      disabled={isProcessing}
                      className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${
                        isProcessing
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-500 text-white'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          PROCESS ALL
                        </>
                      )}
                    </button>
                  </div>

                  {isProcessing && (
                    <div className="bg-slate-950 p-4 rounded border border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white">{currentProgress.file}</span>
                        <span className="text-sm text-slate-400">{Math.round(currentProgress.progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${currentProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className={`flex justify-between items-center p-3 rounded border ${
                          doc.processed
                            ? 'border-green-500/50 bg-green-900/20'
                            : 'border-slate-800 bg-slate-950'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white">{doc.filename}</div>
                          <div className="text-xs text-slate-400">
                            Type: {doc.detectedType} | {doc.text.length.toLocaleString()} chars
                            {doc.processed && <span className="text-green-400 ml-2">✓ Processed</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-500 hover:text-red-400 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Section */}
          {reviewMode && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-yellow-500" /> Review Suggestions ({filteredSuggestions.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewMode(false)}
                    className="px-3 py-1 rounded text-sm bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Type Filter</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="book">Books</option>
                    <option value="items">Items</option>
                    <option value="skills">Skills</option>
                    <option value="relationships">Relationships</option>
                    <option value="story-map">Story Map</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Min Confidence</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filterConfidence}
                    onChange={(e) => setFilterConfidence(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-slate-400">{(filterConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-2 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectHighConfidence}
                    className="px-3 py-2 rounded text-sm bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    High Confidence
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-2 rounded text-sm bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedSuggestions.size > 0 && (
                <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/50 rounded flex justify-between items-center">
                  <span className="text-white font-bold">{selectedSuggestions.size} selected</span>
                  <div className="flex gap-2">
                    <button
                      onClick={applySelectedSuggestions}
                      className="px-4 py-2 rounded font-bold bg-green-600 hover:bg-green-500 text-white flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply Selected
                    </button>
                    <button
                      onClick={rejectSelectedSuggestions}
                      className="px-4 py-2 rounded font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Review Popup */}
              {showReviewPopup && filteredSuggestions.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {(() => {
                      const suggestion = filteredSuggestions[currentReviewIndex];
                      const destination = getDestination(suggestion.type);
                      const isLast = currentReviewIndex === filteredSuggestions.length - 1;
                      const isFirst = currentReviewIndex === 0;
                      
                      return (
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Suggestion {currentReviewIndex + 1} of {filteredSuggestions.length}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${destination.bgClass} ${destination.colorClass} uppercase`}>
                                  {suggestion.type}
                                </span>
                                <span className="text-xs text-slate-400">from {suggestion.documentName}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowReviewPopup(false)}
                              className="text-slate-500 hover:text-white"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Destination Info */}
                          <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded flex items-center gap-3">
                            <destination.icon className={`w-5 h-5 ${destination.colorClass}`} />
                            <div className="flex-1">
                              <div className="text-xs text-slate-400 mb-1">Destination</div>
                              <div className="text-sm font-bold text-white">{destination.name}</div>
                              <div className="text-xs text-slate-500">Will be added to: {destination.tab}</div>
                            </div>
                            <ArrowRight className={`w-4 h-4 ${destination.colorClass}`} />
                          </div>

                          {/* Suggestion Details */}
                          <div className="mb-4">
                            <div className="text-xs text-slate-400 mb-2">What's being {suggestion.type === 'actor-update' ? 'updated' : 'added'}:</div>
                            <div className="bg-slate-950 border border-slate-800 rounded p-4">
                              {suggestion.type === 'items' && (
                                <div>
                                  <div className="text-lg font-bold text-white mb-2">{suggestion.data.name}</div>
                                  <div className="text-sm text-slate-400 mb-2">{suggestion.data.desc || suggestion.data.description}</div>
                                  {suggestion.data.type && (
                                    <div className="text-xs text-slate-500 mb-1">Type: {suggestion.data.type}</div>
                                  )}
                                  {suggestion.data.rarity && (
                                    <div className="text-xs text-slate-500 mb-1">Rarity: {suggestion.data.rarity}</div>
                                  )}
                                  {suggestion.data.stats && (
                                    <div className="text-xs text-slate-500">Stats: {Object.entries(suggestion.data.stats).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                                  )}
                                </div>
                              )}
                              {suggestion.type === 'skills' && (
                                <div>
                                  <div className="text-lg font-bold text-white mb-2">{suggestion.data.name}</div>
                                  <div className="text-sm text-slate-400 mb-2">{suggestion.data.desc || suggestion.data.description}</div>
                                  {suggestion.data.type && (
                                    <div className="text-xs text-slate-500 mb-1">Type: {suggestion.data.type}</div>
                                  )}
                                  {suggestion.data.tier && (
                                    <div className="text-xs text-slate-500 mb-1">Tier: {suggestion.data.tier}</div>
                                  )}
                                  {suggestion.data.statMod && (
                                    <div className="text-xs text-slate-500">Modifiers: {Object.entries(suggestion.data.statMod).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                                  )}
                                </div>
                              )}
                              {suggestion.type === 'actor' && (
                                <div>
                                  <div className="text-lg font-bold text-white mb-2">{suggestion.data.name}</div>
                                  <div className="text-sm text-slate-400 mb-2">{suggestion.data.desc || suggestion.data.description}</div>
                                  {suggestion.data.class && (
                                    <div className="text-xs text-slate-500 mb-1">Class: {suggestion.data.class}</div>
                                  )}
                                  {suggestion.data.stats && (
                                    <div className="text-xs text-slate-500">Stats: {Object.entries(suggestion.data.stats).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                                  )}
                                </div>
                              )}
                              {suggestion.type === 'book' && (
                                <div>
                                  <div className="text-lg font-bold text-white mb-2">{suggestion.data.title || 'New Chapter'}</div>
                                  <div className="text-sm text-slate-400 mb-2">{suggestion.data.desc || suggestion.data.synopsis || suggestion.data.description}</div>
                                  {suggestion.data.suggestedBook && (
                                    <div className="text-xs text-slate-500">Book: {suggestion.data.suggestedBook}</div>
                                  )}
                                </div>
                              )}
                              {suggestion.type === 'actor-update' && (
                                <div>
                                  <div className="text-lg font-bold text-white mb-2">Update for: {suggestion.data.actorId || suggestion.data.actorName}</div>
                                  {suggestion.data.changes && (
                                    <div className="text-sm text-slate-400">
                                      <div className="text-xs text-slate-500 mb-1">Changes:</div>
                                      {suggestion.data.changes.stats && (
                                        <div className="text-xs text-slate-500">Stats: {JSON.stringify(suggestion.data.changes.stats)}</div>
                                      )}
                                      {suggestion.data.changes.skills && (
                                        <div className="text-xs text-slate-500">Skills: {suggestion.data.changes.skills.join(', ')}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {!['items', 'skills', 'actor', 'book', 'actor-update'].includes(suggestion.type) && (
                                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                                  {JSON.stringify(suggestion.data, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>

                          {/* Confidence */}
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-xs text-slate-400">Confidence:</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              suggestion.confidence >= 0.8 ? 'bg-green-900/30 text-green-400' :
                              suggestion.confidence >= 0.6 ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {(suggestion.confidence * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (!isFirst) {
                                    setCurrentReviewIndex(prev => prev - 1);
                                  }
                                }}
                                disabled={isFirst}
                                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                              </button>
                              <button
                                onClick={() => {
                                  if (!isLast) {
                                    setCurrentReviewIndex(prev => prev + 1);
                                  }
                                }}
                                disabled={isLast}
                                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                Next
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  toggleSuggestionSelection(suggestion.id);
                                  if (!isLast) {
                                    setCurrentReviewIndex(prev => prev + 1);
                                  } else {
                                    setShowReviewPopup(false);
                                  }
                                }}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  if (!selectedSuggestions.has(suggestion.id)) {
                                    toggleSuggestionSelection(suggestion.id);
                                  }
                                  if (!isLast) {
                                    setCurrentReviewIndex(prev => prev + 1);
                                  } else {
                                    setShowReviewPopup(false);
                                  }
                                }}
                                className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Suggestions List (fallback view) */}
              {!showReviewPopup && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSuggestions.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">No suggestions match the current filters.</div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setCurrentReviewIndex(0);
                          setShowReviewPopup(true);
                        }}
                        className="w-full px-4 py-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 mb-4"
                      >
                        <Eye className="w-5 h-5" />
                        Review Suggestions One by One
                      </button>
                      {filteredSuggestions.map(suggestion => {
                        const destination = getDestination(suggestion.type);
                        return (
                          <div
                            key={suggestion.id}
                            className={`p-4 rounded border ${
                              selectedSuggestions.has(suggestion.id)
                                ? 'border-blue-500 bg-blue-900/20'
                                : 'border-slate-800 bg-slate-950'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.has(suggestion.id)}
                                  onChange={() => toggleSuggestionSelection(suggestion.id)}
                                  className="rounded"
                                />
                                <span className="text-xs font-bold text-blue-400 uppercase">{suggestion.type}</span>
                                <span className="text-xs text-slate-400">from {suggestion.documentName}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3" />
                                  {destination.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  suggestion.confidence >= 0.8 ? 'bg-green-900/30 text-green-400' :
                                  suggestion.confidence >= 0.6 ? 'bg-yellow-900/30 text-yellow-400' :
                                  'bg-red-900/30 text-red-400'
                                }`}>
                                  {(suggestion.confidence * 100).toFixed(0)}% confidence
                                </span>
                              </div>
                            </div>
                            <div className="bg-slate-900 p-3 rounded text-xs text-slate-300">
                              {suggestion.data.name || suggestion.data.title || JSON.stringify(suggestion.data).substring(0, 100) + '...'}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDocumentProcessor;

