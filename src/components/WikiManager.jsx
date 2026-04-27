import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Wand2, Save, Edit3, Eye, Link as LinkIcon, Search, Plus, X, Sparkles, Clock, Image as ImageIcon, Package, Zap, RefreshCw, Download, CheckCircle, AlertTriangle, FileText, Layers } from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';
import imageGenerationService from '../services/imageGenerationService';

/**
 * Entity Thumbnail Component - Shows image or symbol for entities in wiki
 */
const EntityThumbnail = ({ entity, entityType, size = 'md' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const imagePath = entity.imagePath || entity.symbolPath;
    if (imagePath) {
      setLoading(true);
      imageGenerationService.getImageUrl(imagePath)
        .then(url => {
          setImageUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setImageUrl(null);
          setLoading(false);
        });
    } else {
      setImageUrl(null);
    }
  }, [entity?.imagePath, entity?.symbolPath]);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-800 rounded border border-slate-700 flex items-center justify-center`}>
        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={entity.name} 
        className={`${sizeClasses[size]} object-contain rounded border border-slate-700 bg-slate-800`} 
      />
    );
  }

  // Fallback icon
  return (
    <div className={`${sizeClasses[size]} bg-slate-800 rounded border border-slate-700 flex items-center justify-center`}>
      {entityType === 'skill' ? (
        <Zap className="w-5 h-5 text-slate-600 opacity-50" />
      ) : (
        <Package className="w-5 h-5 text-slate-600 opacity-50" />
      )}
    </div>
  );
};

/**
 * Auto-Wiki Generation and Management System
 * Generates wiki entries from items/actors with AI, manages linking
 */
// Wiki entry templates for structured content
const WIKI_TEMPLATES = {
  character: `## Overview\n\n## Appearance\n\n## Personality\n\n## Background\n\n## Abilities\n\n## Relationships\n\n## Story Role\n`,
  location: `## Description\n\n## Geography\n\n## History\n\n## Inhabitants\n\n## Points of Interest\n\n## Story Significance\n`,
  item: `## Description\n\n## Origin\n\n## Properties\n\n## Current Owner\n\n## History\n\n## Story Significance\n`,
  faction: `## Overview\n\n## Goals & Ideology\n\n## Members\n\n## History\n\n## Allies & Enemies\n\n## Story Significance\n`,
  magic: `## System Overview\n\n## Rules & Limitations\n\n## Practitioners\n\n## Origin\n\n## Story Significance\n`,
};

const WikiManager = ({ entities, entityType = 'item', onClose }) => {
  const [wikiEntries, setWikiEntries] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkedEntries, setLinkedEntries] = useState([]);
  const [entityImage, setEntityImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // ---- Enhancements ----
  const [bodySearchTerm, setBodySearchTerm] = useState('');
  const [bodySearchResults, setBodySearchResults] = useState([]); // [{ entityName, snippet }]
  const [showBodySearch, setShowBodySearch] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  useEffect(() => {
    loadWikiEntries();
  }, []);

  // Load entity image when selected entity changes
  useEffect(() => {
    if (selectedEntity) {
      const imagePath = selectedEntity.imagePath || selectedEntity.symbolPath;
      if (imagePath) {
        imageGenerationService.getImageUrl(imagePath)
          .then(url => setEntityImage(url))
          .catch(() => setEntityImage(null));
      } else {
        setEntityImage(null);
      }
    } else {
      setEntityImage(null);
    }
  }, [selectedEntity]);

  /**
   * Load wiki entries from database
   */
  const loadWikiEntries = async () => {
    try {
      // Try new wikiEntries store first, fallback to old wiki store
      let entries = [];
      try {
        entries = await db.getAll('wikiEntries');
      } catch (e) {
        // Fallback to old wiki store
        entries = await db.getAll('wiki');
        // Migrate to new format
        for (const entry of entries) {
          if (!entry.entityId) {
            entry.entityId = entry.id;
            entry.entityType = entry.type || 'item';
            entry.version = 1;
            try {
              await db.add('wikiEntries', entry);
            } catch (err) {
              // Already exists or error
            }
          }
        }
      }
      setWikiEntries(entries);
    } catch (error) {
      console.error('Failed to load wiki entries:', error);
    }
  };

  // ---- Enhancement: Full-text body search ----
  const searchWikiBodies = () => {
    if (!bodySearchTerm.trim()) { setBodySearchResults([]); return; }
    const term = bodySearchTerm.toLowerCase();
    const results = wikiEntries
      .filter(e => (e.content || '').toLowerCase().includes(term))
      .map(e => {
        const idx = e.content.toLowerCase().indexOf(term);
        const start = Math.max(0, idx - 40);
        const snippet = '…' + e.content.slice(start, idx + 80) + '…';
        return { entityId: e.entityId, entityName: e.entityName, snippet };
      });
    setBodySearchResults(results);
    setShowBodySearch(true);
  };

  // ---- Enhancement: Completeness score per entry ----
  const getCompletenessScore = (entry) => {
    if (!entry?.content) return 0;
    const templateKey = entry.entityType === 'actor' ? 'character' : (entry.entityType || 'item');
    const template = WIKI_TEMPLATES[templateKey] || WIKI_TEMPLATES.item;
    const sections = template.match(/## \w+/g) || [];
    if (sections.length === 0) return 100;
    const filled = sections.filter(s => entry.content.includes(s.replace('## ', ''))).length;
    return Math.round((filled / sections.length) * 100);
  };

  // ---- Enhancement: Export wiki as HTML ----
  const exportWikiHtml = () => {
    const entries = wikiEntries;
    if (entries.length === 0) { return; }
    const entryHtml = entries.map(e => `
      <section>
        <h2>${e.entityName} <small style="font-size:0.6em;color:#888">[${e.entityType}]</small></h2>
        <pre style="white-space:pre-wrap;font-family:Georgia,serif">${(e.content || '').replace(/</g,'&lt;')}</pre>
        <hr/>
      </section>`).join('\n');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Wiki Export</title>
      <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333}h2{color:#1a1a2e}hr{border:none;border-top:1px solid #eee;margin:30px 0}</style>
      </head><body><h1>Story Wiki</h1>${entryHtml}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'story_wiki.html'; a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Generate wiki entry with AI
   */
  const generateWikiEntry = async (entity) => {
    setIsGenerating(true);
    setSelectedEntity(entity);

    try {
      const context = {
        relatedEntities: entities.filter(e => e.id !== entity.id).slice(0, 5),
        entityType
      };

      const content = await aiService.generateWiki(entity, entityType, context);

      // Auto-generate image if entity doesn't have one
      let imagePath = entity.imagePath || entity.symbolPath || null;
      if (!imagePath && entityType !== 'actor') {
        try {
          if (entityType === 'item') {
            imagePath = await imageGenerationService.generateItemImage(entity);
          } else if (entityType === 'skill') {
            imagePath = await imageGenerationService.generateSkillSymbol(entity);
          }
        } catch (error) {
          console.error('Failed to auto-generate image:', error);
          // Continue without image if generation fails
        }
      }

      const entry = {
        id: `wiki_${entity.id}_${Date.now()}`,
        entityId: entity.id,
        entityName: entity.name,
        entityType: entityType,
        content,
        linkedTo: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        imagePath: imagePath
      };

      setCurrentEntry(entry);
    } catch (error) {
      alert(`Wiki Generation Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Save wiki entry with auto-save and version history
   */
  const saveWikiEntry = async (isManual = false) => {
    if (!currentEntry) return;

    try {
      // Check if content changed
      const existing = wikiEntries.find(e => e.entityId === currentEntry.entityId);
      if (existing && existing.content === currentEntry.content && !isManual) {
        return; // No changes, skip auto-save
      }

      // Save previous version if content changed
      if (existing && existing.content !== currentEntry.content) {
        const versionHistory = existing.versionHistory || [];
        versionHistory.push({
          content: existing.content,
          updatedAt: existing.updatedAt,
          version: existing.version
        });
        currentEntry.versionHistory = versionHistory;
        currentEntry.version = (existing.version || 1) + 1;
      }

      currentEntry.updatedAt = Date.now();
      
      // Ensure imagePath is preserved
      if (!currentEntry.imagePath && selectedEntity) {
        currentEntry.imagePath = selectedEntity.imagePath || selectedEntity.symbolPath || null;
      }
      
      // Save to new wikiEntries store
      try {
        if (existing) {
          await db.update('wikiEntries', currentEntry);
        } else {
          await db.add('wikiEntries', currentEntry);
        }
      } catch (e) {
        console.error('Error saving to wikiEntries:', e);
        // Fallback to old wiki store
        try {
          await db.update('wiki', currentEntry);
        } catch (e2) {
          console.error('Error saving to wiki store:', e2);
          throw new Error(`Failed to save wiki entry: ${e2.message}`);
        }
      }
      
      await loadWikiEntries();
      
      if (isManual) {
        // Use toast service if available
        if (window.toastService) {
          window.toastService.success('Wiki entry saved!');
        } else {
          alert('Wiki entry saved!');
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save Error:', error);
      if (isManual) {
        if (window.toastService) {
          window.toastService.error(`Save Error: ${error.message}`);
        } else {
          alert(`Save Error: ${error.message}`);
        }
      }
    }
  };

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!currentEntry || !isEditing) return;
    
    const timeoutId = setTimeout(() => {
      saveWikiEntry(false);
    }, 3000); // Auto-save after 3 seconds of no typing
    
    return () => clearTimeout(timeoutId);
  }, [currentEntry?.content, isEditing]);

  /**
   * Add link to another wiki entry
   */
  const addLink = (targetId) => {
    if (!currentEntry) return;

    if (!currentEntry.linkedTo.includes(targetId)) {
      setCurrentEntry(prev => ({
        ...prev,
        linkedTo: [...prev.linkedTo, targetId],
        updatedAt: Date.now()
      }));
    }
  };

  /**
   * Remove link
   */
  const removeLink = (targetId) => {
    if (!currentEntry) return;

    setCurrentEntry(prev => ({
      ...prev,
      linkedTo: prev.linkedTo.filter(id => id !== targetId),
      updatedAt: Date.now()
    }));
  };

  /**
   * Find existing wiki entry for entity
   */
  const findExistingEntry = (entityId) => {
    return wikiEntries.find(e => e.entityId === entityId);
  };

  /**
   * Filter entities by search
   */
  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BookOpen className="mr-3 text-purple-400" />
            WIKI MANAGER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Full-text body search */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={bodySearchTerm}
              onChange={e => setBodySearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchWikiBodies()}
              placeholder="Search entry bodies..."
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs w-44"
            />
            <button onClick={searchWikiBodies} className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded" title="Search inside wiki bodies">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Export wiki */}
          <button onClick={exportWikiHtml} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded flex items-center gap-1" title="Export wiki as HTML">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>
      {/* Body search results panel */}
      {showBodySearch && bodySearchResults.length > 0 && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300">{bodySearchResults.length} result{bodySearchResults.length > 1 ? 's' : ''} for "{bodySearchTerm}"</span>
            <button onClick={() => setShowBodySearch(false)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {bodySearchResults.map((r, i) => (
              <div key={i} className="text-xs">
                <span className="text-white font-bold">{r.entityName}</span>
                <span className="text-slate-400 ml-2">{r.snippet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Entity list - Fixed width */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-3">ENTITIES</h3>
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search entities..."
                className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-2 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredEntities.map(entity => {
              const hasEntry = findExistingEntry(entity.id);
              const isSelected = selectedEntity?.id === entity.id;

              return (
                <button
                  key={entity.id}
                  onClick={() => {
                    setSelectedEntity(entity);
                    const existing = findExistingEntry(entity.id);
                    if (existing) {
                      setCurrentEntry(existing);
                      setIsEditing(false);
                    } else {
                      setCurrentEntry(null);
                    }
                  }}
                  className={`w-full text-left p-3 border-b border-slate-800 transition-all ${
                    isSelected ? 'bg-purple-900/20 border-l-4 border-l-purple-500' : 'hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{entity.name}</div>
                      <div className="text-xs text-slate-400">{entity.type || entityType}</div>
                    </div>
                    {hasEntry ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content area - Calculated width to fit beside sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {selectedEntity && (
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center flex-shrink-0">
              <div>
                <p className="text-sm text-slate-400">
                  {selectedEntity.name} • {entityType}
                </p>
              </div>

              <div className="flex gap-2">
                {currentEntry && (
                  <>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-3 py-2 rounded font-bold text-sm ${
                        isEditing ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>

                    {isEditing && (
                      <>
                        <button
                          onClick={() => saveWikiEntry(true)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-sm"
                        >
                          <Save className="w-4 h-4 inline mr-2" />
                          SAVE
                        </button>
                        {/* Template insert menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowTemplateMenu(v => !v)}
                            className="px-3 py-2 bg-indigo-800/60 hover:bg-indigo-700/60 text-indigo-300 border border-indigo-700/50 rounded font-bold text-sm flex items-center gap-1"
                            title="Insert a structured template"
                          >
                            <Layers className="w-4 h-4" />
                            Template
                          </button>
                          {showTemplateMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-40">
                              {Object.entries(WIKI_TEMPLATES).map(([key, tmpl]) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setCurrentEntry(prev => ({ ...prev, content: (prev?.content || '') + '\n' + tmpl }));
                                    setShowTemplateMenu(false);
                                  }}
                                  className="block w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 capitalize"
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {currentEntry && (
                          <div className="text-xs text-slate-400 flex items-center gap-2 ml-1">
                            <Clock className="w-3 h-3" />
                            {currentEntry.updatedAt ? new Date(currentEntry.updatedAt).toLocaleTimeString() : 'Never'}
                            {/* Completeness score */}
                            <span className={`ml-2 font-bold ${getCompletenessScore(currentEntry) >= 80 ? 'text-green-400' : getCompletenessScore(currentEntry) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {getCompletenessScore(currentEntry)}% complete
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
          {!selectedEntity && (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select an entity to view or generate its wiki entry</p>
              </div>
            </div>
          )}

          {selectedEntity && !currentEntry && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Wiki Entry Yet</h3>
                <p className="text-slate-400 mb-6">
                  Generate a comprehensive wiki entry for <strong>{selectedEntity.name}</strong> using AI
                </p>

                <button
                  onClick={() => generateWikiEntry(selectedEntity)}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="w-5 h-5 animate-spin" />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      GENERATE WIKI ENTRY
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentEntry && (
            <div className="p-6 max-w-4xl mx-auto">
              {/* Wiki content */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
                {/* Entity Image/Symbol Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-purple-400 uppercase">Entity Visual</h4>
                    <div className="flex gap-2">
                      {!entityImage && selectedEntity && (
                        <button
                          onClick={async () => {
                            if (!selectedEntity) return;
                            setIsGeneratingImage(true);
                            try {
                              let newImagePath = null;
                              if (entityType === 'item') {
                                newImagePath = await imageGenerationService.generateItemImage(selectedEntity);
                              } else if (entityType === 'skill') {
                                newImagePath = await imageGenerationService.generateSkillSymbol(selectedEntity);
                              }
                              
                              if (newImagePath) {
                                // Update entity with new image path
                                if (entityType === 'item') {
                                  const itemBank = await db.getAll('itemBank');
                                  const item = itemBank.find(i => i.id === selectedEntity.id);
                                  if (item) {
                                    item.imagePath = newImagePath;
                                    await db.update('itemBank', item);
                                  }
                                } else if (entityType === 'skill') {
                                  const skillBank = await db.getAll('skillBank');
                                  const skill = skillBank.find(s => s.id === selectedEntity.id);
                                  if (skill) {
                                    skill.symbolPath = newImagePath;
                                    await db.update('skillBank', skill);
                                  }
                                }
                                
                                // Update current entry
                                setCurrentEntry(prev => ({ ...prev, imagePath: newImagePath }));
                                // Reload image
                                const imageUrl = await imageGenerationService.getImageUrl(newImagePath);
                                setEntityImage(imageUrl);
                                alert('Image generated successfully!');
                              }
                            } catch (error) {
                              console.error('Image generation error:', error);
                              alert(`Image generation failed: ${error.message}`);
                            } finally {
                              setIsGeneratingImage(false);
                            }
                          }}
                          disabled={isGeneratingImage}
                          className="px-3 py-1 bg-purple-900/50 hover:bg-purple-800 border border-purple-700 text-purple-300 rounded text-xs flex items-center gap-2 disabled:opacity-50"
                        >
                          {isGeneratingImage ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Generate Image
                            </>
                          )}
                        </button>
                      )}
                      <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-xs flex items-center gap-2 cursor-pointer">
                        <ImageIcon className="w-3 h-3" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setIsGeneratingImage(true);
                            try {
                              const category = entityType === 'skill' ? 'skill' : 'item';
                              const newImagePath = await imageGenerationService.uploadCustomImage(file, category, selectedEntity.id);
                              
                              // Update entity
                              if (entityType === 'item') {
                                const itemBank = await db.getAll('itemBank');
                                const item = itemBank.find(i => i.id === selectedEntity.id);
                                if (item) {
                                  item.imagePath = newImagePath;
                                  await db.update('itemBank', item);
                                }
                              } else if (entityType === 'skill') {
                                const skillBank = await db.getAll('skillBank');
                                const skill = skillBank.find(s => s.id === selectedEntity.id);
                                if (skill) {
                                  skill.symbolPath = newImagePath;
                                  await db.update('skillBank', skill);
                                }
                              }
                              
                              setCurrentEntry(prev => ({ ...prev, imagePath: newImagePath }));
                              const imageUrl = await imageGenerationService.getImageUrl(newImagePath);
                              setEntityImage(imageUrl);
                              alert('Image uploaded successfully!');
                            } catch (error) {
                              console.error('Image upload error:', error);
                              alert(`Image upload failed: ${error.message}`);
                            } finally {
                              setIsGeneratingImage(false);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {entityImage ? (
                    <div className="flex justify-center">
                      <div className="relative">
                        <img 
                          src={entityImage} 
                          alt={currentEntry.entityName}
                          className="max-w-xs max-h-64 rounded-lg border-2 border-purple-500/30 shadow-xl object-contain bg-slate-950/50 p-4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="w-48 h-48 bg-slate-950/50 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center">
                        {entityType === 'skill' ? (
                          <Zap className="w-16 h-16 text-slate-600 opacity-50" />
                        ) : (
                          <Package className="w-16 h-16 text-slate-600 opacity-50" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-white mb-6">{currentEntry.entityName}</h3>

                {isEditing ? (
                  <textarea
                    value={currentEntry.content}
                    onChange={(e) => setCurrentEntry(prev => ({
                      ...prev,
                      content: e.target.value,
                      updatedAt: Date.now()
                    }))}
                    className="w-full h-96 bg-slate-950 border border-slate-700 rounded p-4 text-white font-mono text-sm resize-vertical"
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <div
                      className="text-slate-300 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: currentEntry.content
                          .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>')
                          .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-5 mb-2">$1</h2>')
                          .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                      }}
                    />
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                  <div>Created: {new Date(currentEntry.createdAt).toLocaleString()}</div>
                  <div>Updated: {new Date(currentEntry.updatedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Linked entries */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-blue-400" />
                    LINKED ENTRIES
                  </h3>

                  {isEditing && (
                    <button
                      onClick={() => {
                        const targetId = prompt('Enter entity ID to link:');
                        if (targetId) addLink(targetId);
                      }}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      ADD LINK
                    </button>
                  )}
                </div>

                {currentEntry.linkedTo.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No linked entries yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {currentEntry.linkedTo.map(linkedId => {
                      const linkedEntity = entities.find(e => e.id === linkedId);
                      const linkedWiki = wikiEntries.find(w => w.entityId === linkedId);

                      return (
                        <div
                          key={linkedId}
                          className="bg-slate-950 border border-slate-800 rounded p-3 flex justify-between items-center hover:border-blue-500 transition-all cursor-pointer"
                          onClick={() => {
                            if (linkedEntity) {
                              setSelectedEntity(linkedEntity);
                              setCurrentEntry(linkedWiki || null);
                              setIsEditing(false);
                            }
                          }}
                        >
                          <div>
                            <div className="text-sm font-bold text-white">
                              {linkedEntity?.name || linkedId}
                            </div>
                            <div className="text-xs text-slate-500">
                              {linkedEntity?.type || 'Unknown'}
                            </div>
                          </div>

                          {isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLink(linkedId);
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Regenerate button */}
              {!isEditing && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => generateWikiEntry(selectedEntity)}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    REGENERATE WITH AI
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    This will replace the current content
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiManager;
