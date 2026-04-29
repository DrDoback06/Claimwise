import React, { useState, useEffect } from 'react';
import { BarChart2, Wand2, Settings, Save, RefreshCw, Dices, Sliders, X, Sparkles, Loader, Edit3 } from 'lucide-react';
import aiService from '../../services/aiService';

/**
 * Diablo II-Style Stat Generator
 * Features extensive customization, procedural generation, and AI assistance
 */
const DiabloStatGenerator = ({ onSave, onClose, existingStats = [], initialStat = null }) => {
  // Check if we're editing an existing stat
  const isEditing = !!initialStat;
  
  // Base configuration
  const [name, setName] = useState(initialStat?.name || '');
  const [key, setKey] = useState(initialStat?.key || '');
  const [description, setDescription] = useState(initialStat?.desc || '');
  const [color, setColor] = useState(initialStat?.color || 'green');
  const [isCore, setIsCore] = useState(initialStat?.isCore || false);
  const [category, setCategory] = useState(initialStat?.category || 'Physical');
  
  // Load initial stat data when editing
  useEffect(() => {
    if (initialStat) {
      setName(initialStat.name || '');
      setKey(initialStat.key || '');
      setDescription(initialStat.desc || '');
      setColor(initialStat.color || 'green');
      setIsCore(initialStat.isCore || false);
      setCategory(initialStat.category || 'Physical');
    }
  }, [initialStat]);

  // UI state
  const [mode, setMode] = useState('manual'); // 'manual' | 'ai'
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const statCategories = [
    { name: 'Physical', color: 'green', examples: ['Strength', 'Vitality', 'Dexterity'] },
    { name: 'Mental', color: 'blue', examples: ['Intelligence', 'Wisdom', 'Focus'] },
    { name: 'Social', color: 'purple', examples: ['Charisma', 'Authority', 'Sarcasm'] },
    { name: 'Resource', color: 'red', examples: ['Rage', 'Mana', 'Stamina'] },
    { name: 'Special', color: 'yellow', examples: ['Luck', 'Karma', 'Debt'] }
  ];

  const statColors = [
    { name: 'Green', value: 'green', desc: 'Physical attributes' },
    { name: 'Blue', value: 'blue', desc: 'Mental attributes' },
    { name: 'Red', value: 'red', desc: 'Aggressive/Resource' },
    { name: 'Purple', value: 'purple', desc: 'Special/Magical' },
    { name: 'Yellow', value: 'yellow', desc: 'Speed/Luck' },
    { name: 'Pink', value: 'pink', desc: 'Social/Emotional' },
    { name: 'Gray', value: 'gray', desc: 'Neutral/Environmental' }
  ];

  /**
   * Generate key from name
   */
  const generateKeyFromName = (statName) => {
    if (!statName) return '';
    // Take first 3-4 letters, uppercase
    const words = statName.split(' ');
    if (words.length === 1) {
      return statName.substring(0, 4).toUpperCase();
    }
    // Use first letter of each word
    return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
  };

  /**
   * Auto-generate key when name changes
   */
  const handleNameChange = (newName) => {
    setName(newName);
    if (!key || key === generateKeyFromName(name)) {
      setKey(generateKeyFromName(newName));
    }
  };

  /**
   * Check if key is already taken (excludes current stat when editing)
   */
  const isKeyTaken = (statKey) => {
    return existingStats.some(s => 
      s.key === statKey.toUpperCase() && 
      (!isEditing || s.id !== initialStat?.id)
    );
  };

  /**
   * AI-assisted generation
   */
  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const context = {
        category,
        color,
        isCore,
        existingStats: existingStats.map(s => s.key),
        userPrompt: aiPrompt || `Generate a creative ${category.toLowerCase()} stat for a bureaucratic horror-fantasy setting`
      };

      // TODO: Implement generateStat in aiService
      // For now, use a simple generation based on category
      const result = {
        name: category === 'Physical' ? 'Might' : category === 'Mental' ? 'Focus' : category === 'Social' ? 'Presence' : category === 'Resource' ? 'Energy' : 'Fortune',
        key: category === 'Physical' ? 'MGT' : category === 'Mental' ? 'FOC' : category === 'Social' ? 'PRE' : category === 'Resource' ? 'ENG' : 'FRT',
        desc: `A ${category.toLowerCase()} stat that represents ${category === 'Physical' ? 'raw physical power' : category === 'Mental' ? 'mental acuity and focus' : category === 'Social' ? 'social influence and presence' : category === 'Resource' ? 'internal energy reserves' : 'luck and fortune'}.`,
        color: color,
        isCore: isCore,
        category: category
      };
      
      // If aiService.generateStat exists, use it instead
      // const result = await aiService.generateStat(context);

      if (result) {
        setName(result.name || '');
        setKey(result.key || generateKeyFromName(result.name || ''));
        setDescription(result.desc || result.description || '');
        setColor(result.color || color);
        setIsCore(result.isCore || false);
        setCategory(result.category || category);
      }
    } catch (error) {
      alert(`AI Generation Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Save stat
   */
  const handleSave = () => {
    if (!name || !key) {
      alert('Please enter stat name and key');
      return;
    }

    if (isKeyTaken(key)) {
      alert(`Key "${key}" is already taken. Please use a different key.`);
      return;
    }

    const stat = {
      id: isEditing ? initialStat.id : `stat_${Date.now()}`,
      key: key.toUpperCase(),
      name,
      desc: description,
      color,
      isCore,
      category,
      // Include existingId flag for editing mode
      ...(isEditing && { existingId: initialStat.id })
    };

    onSave(stat);
  };

  const categoryData = statCategories.find(c => c.name === category);
  const colorData = statColors.find(c => c.value === color);

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col p-4 overflow-hidden">
      <div className="bg-slate-900 border-2 border-purple-500 w-full max-w-6xl mx-auto rounded-lg shadow-[0_0_80px_rgba(168,85,247,0.4)] flex flex-col h-full max-h-full my-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              {isEditing ? (
                <Edit3 className="mr-3 text-blue-400 animate-pulse" />
              ) : (
                <BarChart2 className="mr-3 text-purple-400 animate-pulse" />
              )}
              {isEditing ? 'EDIT STAT' : 'DIABLO II STAT FORGE'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isEditing ? `Editing "${initialStat?.name}"` : 'Create epic stats with extensive customization'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 ${
              mode === 'manual' ? 'bg-green-900/30 text-green-400 border-b-2 border-green-500' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            MANUAL CONFIG
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 ${
              mode === 'ai' ? 'bg-purple-900/30 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            AI GENERATION
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Base configuration (always visible) */}
          <div className="bg-slate-950 p-4 rounded border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-4">STAT IDENTITY</h3>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="text-xs text-purple-500 font-bold block mb-2">STAT NAME</label>
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Strength, Rage, Authority..."
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-purple-500 font-bold block mb-2">KEY (ABBREVIATION)</label>
                  <input
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="e.g. STR, RAGE, AUTH"
                    className={`w-full bg-slate-900 border p-2 rounded text-white uppercase ${
                      isKeyTaken(key) ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  {isKeyTaken(key) && (
                    <p className="text-xs text-red-400 mt-1">⚠ Key already taken!</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-purple-500 font-bold block mb-2">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  >
                    {statCategories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-purple-500 font-bold block mb-2">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this stat represents and how it affects gameplay..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-purple-500 font-bold block mb-2">COLOR</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                >
                  {statColors.map(col => (
                    <option key={col.value} value={col.value}>{col.name} - {col.desc}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCore}
                    onChange={(e) => setIsCore(e.target.checked)}
                    className="w-4 h-4 mr-2"
                  />
                  <span className="text-sm text-white">Core Stat?</span>
                </label>
                <span className="ml-2 text-xs text-slate-400">(Appears in base stats)</span>
              </div>
            </div>
          </div>

          {/* AI Generation Mode */}
          {mode === 'ai' && (
            <div className="bg-slate-950 p-6 rounded border border-purple-500/30">
              <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
                <Wand2 className="w-5 h-5 mr-2" />
                AI GENERATION
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-purple-500 font-bold block mb-2">CUSTOM PROMPT (OPTIONAL)</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the stat you want to create... (leave empty for auto-generation)"
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-500"
                  />
                </div>
                <button
                  onClick={generateWithAI}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 bg-purple-900/50 hover:bg-purple-800 border border-purple-700 text-purple-300 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      GENERATE STAT
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-slate-950 p-4 rounded border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-4">PREVIEW</h3>
            <div className={`bg-slate-900 border-2 border-${color}-500/50 p-4 rounded`}>
              <div className={`font-bold text-lg text-${color}-400`}>
                {key || 'KEY'} <span className="text-sm text-white font-normal ml-2">{name || 'Stat Name'}</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {description || 'No description yet'}
              </div>
              <div className="flex gap-2 mt-3">
                <span className={`text-[10px] uppercase px-2 py-1 rounded ${
                  isCore ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCore ? 'CORE' : 'ADDITIONAL'}
                </span>
                <span className={`text-[10px] uppercase px-2 py-1 rounded bg-${color}-900/30 text-${color}-400`}>
                  {category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !key || isKeyTaken(key)}
            className={`flex-1 ${isEditing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <Save className="w-5 h-5" />
            {isEditing ? 'UPDATE STAT' : 'SAVE TO STAT REGISTRY'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiabloStatGenerator;

