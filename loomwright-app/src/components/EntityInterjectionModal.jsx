/**
 * Entity Interjection Modal
 * Allows users to interject entities (actors, items, skills, locations, events) into selected text
 * with mood control and placement options
 */

import React, { useState, useEffect } from 'react';
import {
  X, Users, Briefcase, Zap, MapPin, Calendar, Sparkles,
  RefreshCw, CheckCircle, ArrowUp, ArrowDown, ArrowRight,
  Search, Plus, Loader2
} from 'lucide-react';
import entityInterjectionService from '../services/entityInterjectionService';
import db from '../services/database';
import toastService from '../services/toastService';
import StylePreviewPanel from './StylePreviewPanel';
import StyleConnectionIndicator from './StyleConnectionIndicator';

const EntityInterjectionModal = ({
  selectedText,
  chapterContext,
  chapterId,
  bookId,
  actors = [],
  items = [],
  skills = [],
  onInsert,
  onClose
}) => {
  const [entityType, setEntityType] = useState('actor');
  const [selectedEntities, setSelectedEntities] = useState([]); // Changed to array for multi-select
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [customPrompt, setCustomPrompt] = useState(''); // New: custom prompt field
  const [moodPreset, setMoodPreset] = useState(null);
  const [moodSettings, setMoodSettings] = useState({
    comedy_horror: 50,
    tension: 50,
    pacing: 50,
    detail: 50,
    emotional: 50,
    darkness: 50,
    absurdity: 50,
    formality: 50
  });
  const [customMoodText, setCustomMoodText] = useState('');
  const [placementOption, setPlacementOption] = useState('replace');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  // Filter entities based on search
  const filteredEntities = () => {
    const query = searchQuery.toLowerCase();
    let entities = [];

    switch (entityType) {
      case 'actor':
        entities = actors.filter(a => a.name.toLowerCase().includes(query));
        break;
      case 'item':
        entities = items.filter(i => i.name.toLowerCase().includes(query));
        break;
      case 'skill':
        entities = skills.filter(s => s.name.toLowerCase().includes(query));
        break;
      case 'location':
        // Locations would come from a locations array if available
        entities = [];
        break;
      case 'event':
        // Events would come from timeline events
        entities = [];
        break;
    }

    return entities.slice(0, 10); // Limit to 10 results
  };

  // Toggle entity selection (multi-select)
  const toggleEntitySelection = (entity) => {
    setSelectedEntities(prev => {
      const isSelected = prev.some(e => e.id === entity.id && e.type === entityType);
      if (isSelected) {
        return prev.filter(e => !(e.id === entity.id && e.type === entityType));
      } else {
        return [...prev, { ...entity, type: entityType }];
      }
    });
  };

  // Generate interjection
  const handleGenerate = async () => {
    const hasSelectedEntities = selectedEntities.length > 0;
    const hasNewEntity = newEntityName.trim().length > 0;
    
    if (!hasSelectedEntities && !hasNewEntity) {
      toastService.warning('Please select at least one entity or create a new one');
      return;
    }

    setIsGenerating(true);
    setGeneratedOptions(null);
    setSelectedOption(null);

    try {
      // Build entity list (selected + new)
      const entitiesToInterject = [...selectedEntities];
      if (hasNewEntity) {
        entitiesToInterject.push({
          name: newEntityName,
          type: entityType,
          description: '',
          id: `new_${Date.now()}`
        });
      }

      const mood = moodPreset || (customMoodText ? { custom: customMoodText } : moodSettings);

      const result = await entityInterjectionService.interjectEntities(
        entitiesToInterject,
        selectedText,
        chapterContext,
        moodSettings,
        moodPreset,
        customPrompt, // Pass custom prompt
        chapterId,
        bookId
      );

      setGeneratedOptions(result);
      // Auto-select first option
      if (result.options && result.options.length > 0) {
        setSelectedOption(result.options[0]);
      }
    } catch (error) {
      console.error('Error generating interjection:', error);
      toastService.error('Failed to generate interjection: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply selected interjection
  const handleApply = () => {
    if (!selectedOption) {
      toastService.warning('Please select a placement option');
      return;
    }

    onInsert({
      type: selectedOption.type,
      text: selectedOption.text,
      originalText: selectedText
    });

    onClose();
  };

  // Mood presets
  const moodPresets = [
    { id: 'comedy', label: 'Comedy', icon: '😄' },
    { id: 'horror', label: 'Horror', icon: '💀' },
    { id: 'tense', label: 'Tense', icon: '⚡' },
    { id: 'relaxed', label: 'Relaxed', icon: '🌿' },
    { id: 'dark', label: 'Dark', icon: '🌑' },
    { id: 'light', label: 'Light', icon: '☀️' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center lw-z-modal p-4">
      <div className="bg-slate-900 rounded-xl border border-purple-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Style Connection Indicator */}
        <StyleConnectionIndicator
          chapterId={chapterId}
          bookId={bookId}
          position="top-right"
          size="small"
        />
        {/* Header */}
        <div className="bg-purple-500/10 border-b border-purple-500/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Interject Entity</h2>
              <p className="text-sm text-slate-400">Add an entity naturally into your text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Style Preview Panel */}
          <StylePreviewPanel
            chapterText={chapterContext}
            chapterId={chapterId}
            bookId={bookId}
            moodSettings={moodSettings}
            moodPreset={moodPreset}
            isCollapsible={true}
          />
          
          {/* Entity Type Selection */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Entity Type</label>
            <div className="flex gap-2">
              {['actor', 'item', 'skill', 'location', 'event'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setEntityType(type);
                    // Don't clear entities - allow multi-type selection
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    entityType === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {type === 'actor' && <Users className="w-4 h-4 inline mr-2" />}
                  {type === 'item' && <Briefcase className="w-4 h-4 inline mr-2" />}
                  {type === 'skill' && <Zap className="w-4 h-4 inline mr-2" />}
                  {type === 'location' && <MapPin className="w-4 h-4 inline mr-2" />}
                  {type === 'event' && <Calendar className="w-4 h-4 inline mr-2" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Selector */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Select Entity</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${entityType}s...`}
                className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg"
              />
            </div>

            {/* Entity List - Multi-select with checkboxes */}
            <div className="bg-slate-950 border border-slate-700 rounded-lg max-h-48 overflow-y-auto">
              {filteredEntities().map(entity => {
                const isSelected = selectedEntities.some(e => e.id === entity.id && e.type === entityType);
                return (
                  <button
                    key={entity.id}
                    onClick={() => {
                      toggleEntitySelection(entity);
                      setShowCreateNew(false);
                    }}
                    className={`w-full text-left p-3 hover:bg-slate-800 transition-colors flex items-center gap-3 ${
                      isSelected ? 'bg-purple-500/20 border-l-2 border-purple-500' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{entity.name}</div>
                      {entity.description && (
                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">{entity.description}</div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Create New Option */}
              <button
                onClick={() => {
                  setShowCreateNew(true);
                }}
                className="w-full text-left p-3 hover:bg-slate-800 transition-colors border-t border-slate-700"
              >
                <div className="flex items-center gap-2 text-purple-400">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Create New {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</span>
                </div>
              </button>
            </div>

            {/* Selected Entities Summary */}
            {selectedEntities.length > 0 && (
              <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-2">Selected ({selectedEntities.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {selectedEntities.map((entity, idx) => (
                    <div key={idx} className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300 flex items-center gap-1">
                      <span>{entity.name}</span>
                      <button
                        onClick={() => toggleEntitySelection(entity)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Input */}
            {showCreateNew && (
              <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder={`Enter ${entityType} name...`}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2 rounded-lg"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Selected Text Preview */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Selected Text</label>
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 text-sm italic">
              "{selectedText}"
            </div>
          </div>

          {/* Custom Prompt/Context */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Custom Prompt / Context (Optional)
              <span className="text-xs text-slate-500 ml-2">Guide the AI on how to use the entities</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'Write about Grimguff using Council Tax Evader to open a portal to the Tax Free Realm' or 'Make this scene more dramatic with these items'"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-lg text-sm min-h-[80px] resize-y"
              rows={3}
            />
            <div className="text-xs text-slate-500 mt-1">
              This prompt will guide the AI on how to interject the selected entities. Leave empty to use default behavior.
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Mood</label>
            
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {moodPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setMoodPreset(preset.id);
                    setCustomMoodText('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    moodPreset === preset.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-1">{preset.icon}</span>
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Mood Text */}
            <div className="mb-3">
              <input
                type="text"
                value={customMoodText}
                onChange={(e) => {
                  setCustomMoodText(e.target.value);
                  setMoodPreset(null);
                }}
                placeholder="Or describe custom mood (e.g., 'melancholic and introspective')"
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm"
              />
            </div>

            {/* Mood Sliders (Advanced) */}
            <details className="bg-slate-950 border border-slate-700 rounded-lg p-3">
              <summary className="text-sm text-slate-400 cursor-pointer">Advanced Mood Controls</summary>
              <div className="mt-3 space-y-3">
                {Object.entries(moodSettings).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <span>{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => setMoodSettings(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (selectedEntities.length === 0 && !newEntityName.trim())}
            className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Interjection
              </>
            )}
          </button>

          {/* Generated Options */}
          {generatedOptions && generatedOptions.options && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Placement Options</label>
              <div className="space-y-3">
                {generatedOptions.options.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedOption(option)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedOption === option
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {option.type === 'replace' && <ArrowRight className="w-4 h-4 text-slate-400" />}
                        {option.type === 'insert_before' && <ArrowUp className="w-4 h-4 text-slate-400" />}
                        {option.type === 'insert_after' && <ArrowDown className="w-4 h-4 text-slate-400" />}
                        {option.type === 'blend' && <RefreshCw className="w-4 h-4 text-slate-400" />}
                        <span className="font-medium text-white">{option.label}</span>
                      </div>
                      {selectedOption === option && (
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{option.description}</p>
                    <div className="bg-slate-900 border border-slate-800 rounded p-3 text-sm text-slate-300">
                      {option.preview}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 border-t border-slate-700 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedOption}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Apply Interjection
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityInterjectionModal;
