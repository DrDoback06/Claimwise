import React, { useState, useEffect } from 'react';
import { Zap, Wand2, Settings, Save, RefreshCw, Target, X, Shield, Swords, Heart, Brain, Image as ImageIcon, Upload, Loader, Sparkles, Clock } from 'lucide-react';
import aiService from '../../services/aiService';
import imageGenerationService from '../../../services/imageGenerationService';
import upgradeTrackingService from '../../services/upgradeTrackingService';
import db from '../../services/database';

/**
 * Diablo II-Style Skill Generator
 * Features skill trees, synergies, level scaling, and procedural generation
 */
const DiabloSkillGenerator = ({ onSave, onClose, statRegistry, skillBank = [], initialSkill = null, books = [] }) => {
  // Base configuration
  const [skillType, setSkillType] = useState('Combat');
  const [skillTier, setSkillTier] = useState(1);
  const [scalingType, setScalingType] = useState('Linear');

  // Procedural generation sliders
  const [basePower, setBasePower] = useState(50);
  const [manaCost, setManaCost] = useState(20);
  const [cooldown, setCooldown] = useState(10);
  const [synergyCount, setSynergyCount] = useState(1);
  const [synergyComplexity, setSynergyComplexity] = useState(1.0);

  // Manual configuration
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statMods, setStatMods] = useState({});
  const [requiredLevel, setRequiredLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(20);
  const [passiveEffect, setPassiveEffect] = useState('');
  const [activeEffect, setActiveEffect] = useState('');

  // Skill scaling per level
  const [scalingPerLevel, setScalingPerLevel] = useState({});

  // Prerequisites
  const [parentSkills, setParentSkills] = useState([]);
  const [requiredStats, setRequiredStats] = useState({});
  const [prerequisiteLevel, setPrerequisiteLevel] = useState(1);
  const [requiredClasses, setRequiredClasses] = useState([]);

  // Skill Synergies
  const [synergies, setSynergies] = useState([]);
  const [synergySkillId, setSynergySkillId] = useState('');
  const [synergyBonusType, setSynergyBonusType] = useState('flat');
  const [synergyBonusValue, setSynergyBonusValue] = useState(5);
  const [synergyDescription, setSynergyDescription] = useState('');

  // UI state
  const [mode, setMode] = useState('sliders'); // 'sliders' | 'manual' | 'ai'
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Symbol state
  const [symbolPath, setSymbolPath] = useState(null);
  const [isGeneratingSymbol, setIsGeneratingSymbol] = useState(false);
  const [symbolPreview, setSymbolPreview] = useState(null);
  
  // Upgrade history state
  const [upgradeHistory, setUpgradeHistory] = useState([]);
  const [booksState, setBooksState] = useState([]);
  
  // Load initial skill data if editing
  useEffect(() => {
    if (initialSkill) {
      setName(initialSkill.name || '');
      setDescription(initialSkill.desc || '');
      setSkillType(initialSkill.type || 'Combat');
      setStatMods(initialSkill.statMod || {});
      setScalingPerLevel(initialSkill.scalingPerLevel || {});
      setRequiredLevel(initialSkill.requiredLevel || 1);
      setMaxLevel(initialSkill.maxLevel || 20);
      setPassiveEffect(initialSkill.passiveEffect || '');
      setActiveEffect(initialSkill.activeEffect || '');
      setSkillTier(initialSkill.tier || 1);
      setSymbolPath(initialSkill.symbolPath || null);
      // Load prerequisites
      if (initialSkill.prerequisites) {
        setParentSkills(initialSkill.prerequisites.parentSkills || []);
        setRequiredStats(initialSkill.prerequisites.requiredStats || {});
        setPrerequisiteLevel(initialSkill.prerequisites.requiredLevel || 1);
        setRequiredClasses(initialSkill.prerequisites.requiredClasses || []);
      }
      // Load synergies
      setSynergies(initialSkill.synergies || []);
      
      // Load upgrade history
      if (initialSkill.id) {
        loadUpgradeHistory(initialSkill.id);
      }
    }
  }, [initialSkill]);
  
  // Load books for chapter info
  useEffect(() => {
    if (books && books.length > 0) {
      setBooksState(books);
    } else {
      const loadBooks = async () => {
        try {
          const allBooks = await db.getAll('books');
          setBooksState(allBooks);
        } catch (error) {
          console.error('Error loading books:', error);
        }
      };
      loadBooks();
    }
  }, [books]);
  
  const loadUpgradeHistory = async (skillId) => {
    try {
      const history = await upgradeTrackingService.getUpgradeHistory(skillId, 'skill');
      setUpgradeHistory(history);
    } catch (error) {
      console.error('Error loading upgrade history:', error);
      setUpgradeHistory([]);
    }
  };
  
  // Load symbol preview when symbolPath changes
  useEffect(() => {
    if (symbolPath) {
      imageGenerationService.getImageUrl(symbolPath)
        .then(url => {
          setSymbolPreview(url);
        })
        .catch(err => {
          console.error('Failed to load symbol preview:', err);
          setSymbolPreview(null);
        });
    } else {
      setSymbolPreview(null);
    }
  }, [symbolPath]);

  // Stat management
  const [selectedStat, setSelectedStat] = useState(statRegistry[0]?.key || 'STR');
  const [statValue, setStatValue] = useState(5);
  const [statPerLevel, setStatPerLevel] = useState(1);
  const [statModifierType, setStatModifierType] = useState('flat'); // 'flat', 'percentage', 'perLevel', 'conditional'
  const [conditionalStat, setConditionalStat] = useState('HP'); // For conditional modifiers
  const [conditionalThreshold, setConditionalThreshold] = useState(50); // Percentage threshold

  const skillTypes = [
    { name: 'Combat', icon: Swords, color: 'red', examples: ['Strikes', 'Cleaves', 'Combos'] },
    { name: 'Magic', icon: Wand2, color: 'blue', examples: ['Spells', 'Hexes', 'Rituals'] },
    { name: 'Passive', icon: Shield, color: 'green', examples: ['Auras', 'Masteries', 'Resistances'] },
    { name: 'Social', icon: Brain, color: 'purple', examples: ['Persuasion', 'Intimidation', 'Bureaucracy'] },
    { name: 'Utility', icon: Target, color: 'yellow', examples: ['Movement', 'Detection', 'Crafting'] },
    { name: 'Aura', icon: Heart, color: 'pink', examples: ['Team Buffs', 'Enemy Debuffs', 'Environmental'] }
  ];

  const tiers = [
    { level: 1, name: 'Novice', multiplier: 1.0, color: 'gray' },
    { level: 2, name: 'Adept', multiplier: 1.5, color: 'green' },
    { level: 3, name: 'Expert', multiplier: 2.0, color: 'blue' },
    { level: 4, name: 'Master', multiplier: 3.0, color: 'purple' },
    { level: 5, name: 'Legendary', multiplier: 5.0, color: 'yellow' }
  ];

  const scalingTypes = [
    { name: 'Linear', formula: 'base + (level × increment)' },
    { name: 'Exponential', formula: 'base × (1.1 ^ level)' },
    { name: 'Diminishing', formula: 'base × log(level + 1)' },
    { name: 'Breakpoint', formula: 'base + (floor(level / 5) × 10)' }
  ];

  // Helper functions for prerequisites and synergies
  const addParentSkill = (skillId) => {
    if (!parentSkills.includes(skillId)) {
      setParentSkills([...parentSkills, skillId]);
    }
  };

  const removeParentSkill = (skillId) => {
    setParentSkills(parentSkills.filter(id => id !== skillId));
  };

  const addStatRequirement = () => {
    if (selectedStat && statValue) {
      setRequiredStats({
        ...requiredStats,
        [selectedStat]: statValue
      });
      setStatValue(5);
    }
  };

  const removeStatRequirement = (statKey) => {
    const newStats = { ...requiredStats };
    delete newStats[statKey];
    setRequiredStats(newStats);
  };

  const toggleClassRequirement = (className) => {
    if (requiredClasses.includes(className)) {
      setRequiredClasses(requiredClasses.filter(c => c !== className));
    } else {
      setRequiredClasses([...requiredClasses, className]);
    }
  };

  const addSynergy = () => {
    if (synergySkillId && synergyBonusValue) {
      setSynergies([...synergies, {
        skillId: synergySkillId,
        bonusType: synergyBonusType,
        bonusValue: synergyBonusValue,
        description: synergyDescription
      }]);
      setSynergySkillId('');
      setSynergyBonusValue(5);
      setSynergyDescription('');
    }
  };

  const removeSynergy = (index) => {
    setSynergies(synergies.filter((_, i) => i !== index));
  };

  /**
   * Procedural generation using sliders
   */
  const generateProcedural = () => {
    const tierData = tiers[skillTier - 1];
    const typeData = skillTypes.find(t => t.name === skillType);
    const scaledPower = basePower * tierData.multiplier;

    // Generate name
    const prefixes = {
      'Combat': ['Brutal', 'Swift', 'Devastating', 'Crushing'],
      'Magic': ['Arcane', 'Mystic', 'Eldritch', 'Forbidden'],
      'Passive': ['Eternal', 'Steadfast', 'Unwavering', 'Resilient'],
      'Social': ['Charming', 'Commanding', 'Persuasive', 'Authoritative'],
      'Utility': ['Efficient', 'Masterful', 'Precise', 'Enhanced'],
      'Aura': ['Radiant', 'Overwhelming', 'Inspiring', 'Terrifying']
    };

    const suffixes = {
      'Combat': ['Strike', 'Assault', 'Barrage', 'Execution'],
      'Magic': ['Bolt', 'Wave', 'Storm', 'Ritual'],
      'Passive': ['Mastery', 'Fortitude', 'Endurance', 'Resistance'],
      'Social': ['Presence', 'Authority', 'Influence', 'Manipulation'],
      'Utility': ['Form', 'Technique', 'Method', 'Process'],
      'Aura': ['Field', 'Emanation', 'Presence', 'Domain']
    };

    const prefix = prefixes[skillType][Math.floor(Math.random() * prefixes[skillType].length)];
    const suffix = suffixes[skillType][Math.floor(Math.random() * suffixes[skillType].length)];
    setName(`${prefix} ${suffix}`);

    // Generate stat mods based on power
    const mods = {};
    const numMods = Math.floor(synergyComplexity) + 1;
    for (let i = 0; i < Math.min(numMods, 3); i++) {
      const randomStat = statRegistry[Math.floor(Math.random() * statRegistry.length)];
      mods[randomStat.key] = Math.floor(scaledPower / (10 * numMods));
    }
    setStatMods(mods);

    // Generate scaling per level
    const scaling = {};
    Object.keys(mods).forEach(key => {
      scaling[key] = Math.floor(mods[key] / 10); // 10% of base per level
    });
    setScalingPerLevel(scaling);

    // Generate description based on type
    const descriptions = {
      'Combat': `A powerful ${tierData.name.toLowerCase()} combat technique that deals devastating physical damage.`,
      'Magic': `Channel bureaucratic energy to manifest ${tierData.name.toLowerCase()} magical effects.`,
      'Passive': `Provides permanent ${tierData.name.toLowerCase()} bonuses while active.`,
      'Social': `Manipulates social dynamics with ${tierData.name.toLowerCase()} efficiency.`,
      'Utility': `A ${tierData.name.toLowerCase()} technique for practical applications.`,
      'Aura': `Projects a ${tierData.name.toLowerCase()} aura affecting nearby entities.`
    };

    setDescription(descriptions[skillType]);

    // Set requirements
    setRequiredLevel(tierData.level * 5);
    setManaCost(Math.floor(scaledPower / 5));
    setCooldown(Math.max(1, Math.floor(20 / tierData.multiplier)));
  };

  /**
   * AI-assisted generation
   */
  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const context = {
        skillType,
        tier: tiers[skillTier - 1],
        basePower,
        manaCost,
        cooldown,
        scalingType,
        availableStats: statRegistry.map(s => s.key)
      };

      const systemContext = `You are creating RPG skills for "The Compliance Run" - a dark comedy horror series about bureaucratic fantasy apocalypse.
Skills should blend office/bureaucratic themes with RPG mechanics. Examples:
- "Queue Tolerance": Reduces panic in crowded areas
- "Neutral Tone": Avoids algorithmic detection
- "Evidence Craft": Forge receipts and paperwork
- "Hi-Vis Authority": Command respect through clothing`;

      const customPrompt = aiPrompt || `Generate a creative ${skillType} skill suitable for tier ${skillTier}`;

      const prompt = `${customPrompt}

Skill Parameters:
${JSON.stringify(context, null, 2)}

Return JSON format:
{
  "name": "Skill Name",
  "desc": "Skill description",
  "type": "${skillType}",
  "statMod": {"STR": 10, etc},
  "scalingPerLevel": {"STR": 1, etc},
  "requiredLevel": 5,
  "maxLevel": 20,
  "manaCost": ${manaCost},
  "cooldown": ${cooldown},
  "passiveEffect": "Description of passive bonus",
  "activeEffect": "Description of active effect",
  "synergies": ["Skill names that synergize"]
}`;

      const response = await aiService.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setName(result.name || '');
        setDescription(result.desc || '');
        setStatMods(result.statMod || {});
        setScalingPerLevel(result.scalingPerLevel || {});
        setRequiredLevel(result.requiredLevel || 1);
        setMaxLevel(result.maxLevel || 20);
        setPassiveEffect(result.passiveEffect || '');
        setActiveEffect(result.activeEffect || '');
      }
    } catch (error) {
      alert(`AI Generation Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Add stat modifier
   */
  const addStatMod = () => {
    if (selectedStat && statValue > 0) {
      const modifier = {
        type: statModifierType,
        value: statValue,
        perLevel: statModifierType === 'perLevel' ? statPerLevel : undefined,
        conditional: statModifierType === 'conditional' ? {
          stat: conditionalStat,
          threshold: conditionalThreshold
        } : undefined
      };
      
      // Support multiple modifiers of different types for same stat
      setStatMods(prev => {
        const existing = prev[selectedStat] || [];
        const newMods = Array.isArray(existing) ? [...existing, modifier] : [existing, modifier];
        return { ...prev, [selectedStat]: newMods };
      });
      
      if (statModifierType === 'perLevel' || statModifierType === 'flat') {
        setScalingPerLevel(prev => ({ ...prev, [selectedStat]: statPerLevel }));
      }
    }
  };

  /**
   * Remove stat modifier
   */
  const removeStatMod = (statKey, modifierIndex) => {
    const newMods = { ...statMods };
    if (Array.isArray(newMods[statKey])) {
      newMods[statKey] = newMods[statKey].filter((_, idx) => idx !== modifierIndex);
      if (newMods[statKey].length === 0) {
        delete newMods[statKey];
      }
    } else {
      delete newMods[statKey];
    }
    setStatMods(newMods);

    // Clean up scaling if no flat/perLevel modifiers remain
    const remainingMods = newMods[statKey];
    if (!remainingMods || (Array.isArray(remainingMods) && remainingMods.every(m => m.type !== 'flat' && m.type !== 'perLevel'))) {
      const newScaling = { ...scalingPerLevel };
      delete newScaling[statKey];
      setScalingPerLevel(newScaling);
    }
  };

  /**
   * Calculate stat value at a given level
   */
  const calculateStatAtLevel = (baseStat, scaling, level) => {
    const scaleValue = scaling || 0;

    switch (scalingType) {
      case 'Linear':
        return baseStat + (level * scaleValue);
      case 'Exponential':
        return Math.floor(baseStat * Math.pow(1.1, level));
      case 'Diminishing':
        return Math.floor(baseStat * Math.log2(level + 1));
      case 'Breakpoint':
        return baseStat + (Math.floor(level / 5) * (scaleValue * 5));
      default:
        return baseStat;
    }
  };

  /**
   * Generate skill symbol
   */
  const handleGenerateSymbol = async () => {
    if (!name && !description) {
      alert('Please enter skill name and description first');
      return;
    }

    setIsGeneratingSymbol(true);
    try {
      const skillData = {
        id: `skill_${Date.now()}`,
        name,
        type: skillType,
        desc: description,
        statMod: statMods, // Include stat modifiers
        tier: skillTier // Include tier
      };
      
      const path = await imageGenerationService.generateSkillSymbol(skillData);
      setSymbolPath(path);
      // Force immediate preview load
      const symbolUrl = await imageGenerationService.getImageUrl(path);
      setSymbolPreview(symbolUrl);
      alert('Symbol generated successfully!');
    } catch (error) {
      console.error('Symbol generation error:', error);
      alert(`Symbol generation failed: ${error.message}`);
    } finally {
      setIsGeneratingSymbol(false);
    }
  };

  /**
   * Upload custom symbol
   */
  const handleUploadSymbol = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsGeneratingSymbol(true);
    try {
      const skillId = `skill_${Date.now()}`;
      const path = await imageGenerationService.uploadCustomImage(file, 'skill', skillId);
      setSymbolPath(path);
      // Force immediate preview load
      const symbolUrl = await imageGenerationService.getImageUrl(path);
      setSymbolPreview(symbolUrl);
      alert('Symbol uploaded successfully!');
    } catch (error) {
      console.error('Symbol upload error:', error);
      alert(`Symbol upload failed: ${error.message}`);
    } finally {
      setIsGeneratingSymbol(false);
    }
  };

  /**
   * Save skill
   */
  const handleSave = () => {
    const skill = {
      id: initialSkill?.id || `skill_${Date.now()}`, // Use existing ID if editing
      name,
      type: skillType,
      desc: description,
      statMod: statMods,
      scalingPerLevel,
      scalingType,
      requiredLevel,
      maxLevel,
      defaultVal: 1,
      manaCost,
      cooldown,
      passiveEffect,
      activeEffect,
      tier: skillTier,
      prerequisites: {
        parentSkills: parentSkills,
        requiredStats: requiredStats,
        requiredLevel: prerequisiteLevel,
        requiredClasses: requiredClasses.length > 0 ? requiredClasses : null
      },
      synergies: synergies,
      classRestrictions: requiredClasses.length > 0 ? requiredClasses : null,
      symbolPath: symbolPath || null
    };

    onSave(skill);
  };

  const tierData = tiers[skillTier - 1];
  const typeData = skillTypes.find(t => t.name === skillType);

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col p-4 overflow-hidden">
      <div className="bg-slate-900 border-2 border-blue-500 w-full max-w-6xl mx-auto rounded-lg shadow-[0_0_80px_rgba(59,130,246,0.4)] flex flex-col h-full max-h-full my-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              <Zap className="mr-3 text-blue-400 animate-pulse" />
              DIABLO II SKILL FORGE
            </h2>
            <p className="text-sm text-slate-400 mt-1">Create epic skills with level scaling and synergies</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setMode('sliders')}
            className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 ${
              mode === 'sliders' ? 'bg-blue-900/30 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            PROCEDURAL SLIDERS
          </button>
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
          {/* Symbol Preview Section */}
          <div className="bg-slate-950 p-4 rounded border border-blue-500/30">
            <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              SKILL SYMBOL
            </h3>
            <div className="flex flex-col gap-4">
              {symbolPreview ? (
                <div className="relative">
                  <img 
                    src={symbolPreview} 
                    alt="Skill symbol preview" 
                    className="w-32 h-32 mx-auto rounded-lg border-2 border-blue-500/50 shadow-lg object-contain"
                  />
                  <button
                    onClick={() => {
                      setSymbolPreview(null);
                      setSymbolPath(null);
                    }}
                    className="absolute top-2 right-2 bg-red-900/90 hover:bg-red-800 border border-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    title="Remove symbol"
                  >
                    <X className="w-4 h-4"/>
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No symbol</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleGenerateSymbol}
                  disabled={isGeneratingSymbol || !name}
                  className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800 border border-blue-700 text-blue-300 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingSymbol ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Symbol
                    </>
                  )}
                </button>
                <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Symbol
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSymbol}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Base configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-blue-500 font-bold block mb-2">SKILL TYPE</label>
              <select
                value={skillType}
                onChange={(e) => setSkillType(e.target.value)}
                className={`w-full bg-slate-950 border border-${typeData?.color}-500 p-2 rounded text-white`}
              >
                {skillTypes.map(type => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Examples: {typeData?.examples.join(', ')}</p>
            </div>

            <div>
              <label className="text-xs text-blue-500 font-bold block mb-2">SKILL TIER</label>
              <select
                value={skillTier}
                onChange={(e) => setSkillTier(parseInt(e.target.value))}
                className={`w-full bg-slate-950 border border-${tierData.color}-500 p-2 rounded text-${tierData.color}-400 font-bold`}
              >
                {tiers.map(tier => (
                  <option key={tier.level} value={tier.level}>
                    Tier {tier.level}: {tier.name} (×{tier.multiplier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-blue-500 font-bold block mb-2">SCALING TYPE</label>
              <select
                value={scalingType}
                onChange={(e) => setScalingType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white text-sm"
                title={scalingTypes.find(s => s.name === scalingType)?.formula}
              >
                {scalingTypes.map(scale => (
                  <option key={scale.name} value={scale.name}>{scale.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">{scalingTypes.find(s => s.name === scalingType)?.formula}</p>
            </div>
          </div>

          {/* Slider Mode */}
          {mode === 'sliders' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded border border-blue-500/30">
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  SKILL GENERATION PARAMETERS
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Base Power</span>
                      <span className="text-blue-400 font-bold">{basePower}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={basePower}
                      onChange={(e) => setBasePower(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Mana Cost</span>
                      <span className="text-blue-400 font-bold">{manaCost}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={manaCost}
                      onChange={(e) => setManaCost(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Cooldown (seconds)</span>
                      <span className="text-blue-400 font-bold">{cooldown}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={cooldown}
                      onChange={(e) => setCooldown(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Synergy Complexity</span>
                      <span className="text-blue-400 font-bold">{synergyComplexity.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={synergyComplexity}
                      onChange={(e) => setSynergyComplexity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Number of stat modifiers and interactions</p>
                  </div>
                </div>

                <button
                  onClick={generateProcedural}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  GENERATE SKILL
                </button>
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-4">MANUAL CONFIGURATION</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-green-500 font-bold block mb-2">SKILL NAME</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Queue Tolerance"
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-green-500 font-bold block mb-2">DESCRIPTION</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what the skill does..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-green-500 font-bold block mb-2">REQUIRED LEVEL</label>
                      <input
                        type="number"
                        value={requiredLevel}
                        onChange={(e) => setRequiredLevel(parseInt(e.target.value))}
                        min="1"
                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-green-500 font-bold block mb-2">MAX LEVEL</label>
                      <input
                        type="number"
                        value={maxLevel}
                        onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                        min="1"
                        max="99"
                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-green-500 font-bold block mb-2">COOLDOWN</label>
                      <input
                        type="number"
                        value={cooldown}
                        onChange={(e) => setCooldown(parseInt(e.target.value))}
                        min="0"
                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-green-500 font-bold block mb-2">PASSIVE EFFECT</label>
                    <textarea
                      value={passiveEffect}
                      onChange={(e) => setPassiveEffect(e.target.value)}
                      placeholder="Always-active bonus when skill is learned..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-green-500 font-bold block mb-2">ACTIVE EFFECT</label>
                    <textarea
                      value={activeEffect}
                      onChange={(e) => setActiveEffect(e.target.value)}
                      placeholder="Effect when skill is activated..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Mode */}
          {mode === 'ai' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded border border-purple-500/30">
                <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
                  <Wand2 className="w-5 h-5 mr-2" />
                  AI-POWERED GENERATION
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-purple-500 font-bold block mb-2">GENERATION PROMPT</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the skill you want... (e.g., 'A skill that lets you navigate bureaucracy with supernatural efficiency')"
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white"
                    />
                  </div>

                  <button
                    onClick={generateWithAI}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        GENERATING...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        GENERATE WITH AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skill Preview */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-6 rounded border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              SKILL PREVIEW
            </h3>

            <div className="space-y-4">
              <div className={`text-2xl font-bold text-${tierData.color}-400`}>
                {name || '[Unnamed Skill]'}
              </div>

              <div className="flex gap-4 text-sm">
                <div className="bg-slate-900/50 px-3 py-1 rounded">
                  <span className="text-slate-400">Type: </span>
                  <span className={`text-${typeData?.color}-400 font-bold`}>{skillType}</span>
                </div>
                <div className="bg-slate-900/50 px-3 py-1 rounded">
                  <span className="text-slate-400">Tier: </span>
                  <span className={`text-${tierData.color}-400 font-bold`}>{tierData.name}</span>
                </div>
                <div className="bg-slate-900/50 px-3 py-1 rounded">
                  <span className="text-slate-400">Required Level: </span>
                  <span className="text-blue-400 font-bold">{requiredLevel}</span>
                </div>
              </div>

              <div className="text-sm text-slate-400">
                {description || 'No description provided.'}
              </div>

              {/* Stat modifiers */}
              {Object.keys(statMods).length > 0 && (
                <div className="bg-slate-900/50 p-4 rounded">
                  <div className="text-xs text-green-500 font-bold mb-3">STAT MODIFIERS (per level):</div>
                  <div className="space-y-2">
                    {Object.entries(statMods).map(([key, value]) => {
                      const levelScaling = scalingPerLevel[key] || 0;
                      const level5Value = calculateStatAtLevel(value, levelScaling, 5);
                      const level10Value = calculateStatAtLevel(value, levelScaling, 10);
                      const level20Value = calculateStatAtLevel(value, levelScaling, 20);

                      return (
                        <div key={key} className="bg-green-900/20 p-3 rounded border border-green-800/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-green-400 font-mono font-bold">{key}</span>
                            <button
                              onClick={() => removeStatMod(key)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex gap-4 text-xs text-green-300">
                            <div>Lv1: <span className="font-bold">+{value}</span></div>
                            <div>Lv5: <span className="font-bold">+{level5Value}</span></div>
                            <div>Lv10: <span className="font-bold">+{level10Value}</span></div>
                            <div>Lv20: <span className="font-bold">+{level20Value}</span></div>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Scaling: {scalingType} (+{levelScaling}/level)
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add stat modifier */}
                  <div className="space-y-2 mt-3">
                    <div className="flex gap-2">
                      <select
                        value={selectedStat}
                        onChange={(e) => setSelectedStat(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                      >
                        {statRegistry.map(s => (
                          <option key={s.key} value={s.key}>{s.key} - {s.name}</option>
                        ))}
                      </select>
                      <select
                        value={statModifierType}
                        onChange={(e) => setStatModifierType(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                      >
                        <option value="flat">Flat</option>
                        <option value="percentage">Percentage</option>
                        <option value="perLevel">Per Level</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>
                    {statModifierType === 'conditional' ? (
                      <div className="flex gap-2">
                        <select
                          value={conditionalStat}
                          onChange={(e) => setConditionalStat(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                        >
                          <option value="HP">HP</option>
                          <option value="MP">MP</option>
                          <option value="STR">STR</option>
                          <option value="VIT">VIT</option>
                          <option value="INT">INT</option>
                          <option value="DEX">DEX</option>
                        </select>
                        <input
                          type="number"
                          value={conditionalThreshold}
                          onChange={(e) => setConditionalThreshold(parseInt(e.target.value) || 50)}
                          placeholder="Threshold %"
                          min="1"
                          max="100"
                          className="w-24 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                        />
                        <input
                          type="number"
                          value={statValue}
                          onChange={(e) => setStatValue(parseInt(e.target.value) || 0)}
                          placeholder="Bonus value"
                          className="w-24 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                        />
                        <button
                          onClick={addStatMod}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 rounded font-bold"
                        >
                          ADD
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={statValue}
                          onChange={(e) => setStatValue(parseInt(e.target.value) || 0)}
                          placeholder={statModifierType === 'percentage' ? 'Percentage %' : 'Base value'}
                          className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                        />
                        {statModifierType === 'perLevel' && (
                          <input
                            type="number"
                            value={statPerLevel}
                            onChange={(e) => setStatPerLevel(parseInt(e.target.value) || 0)}
                            placeholder="/level"
                            className="w-24 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                          />
                        )}
                        <button
                          onClick={addStatMod}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 rounded font-bold"
                        >
                          ADD
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Effects */}
              {(passiveEffect || activeEffect) && (
                <div className="grid grid-cols-2 gap-4">
                  {passiveEffect && (
                    <div className="bg-purple-900/20 p-3 rounded border border-purple-800">
                      <div className="text-xs text-purple-400 font-bold mb-1">PASSIVE:</div>
                      <div className="text-xs text-purple-300">{passiveEffect}</div>
                    </div>
                  )}
                  {activeEffect && (
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-800">
                      <div className="text-xs text-blue-400 font-bold mb-1">ACTIVE:</div>
                      <div className="text-xs text-blue-300">{activeEffect}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Resource costs */}
              <div className="flex gap-4 text-sm">
                {manaCost > 0 && (
                  <div className="bg-blue-900/20 px-3 py-1 rounded border border-blue-800">
                    <span className="text-blue-400">Mana Cost: </span>
                    <span className="text-blue-300 font-bold">{manaCost}</span>
                  </div>
                )}
                {cooldown > 0 && (
                  <div className="bg-yellow-900/20 px-3 py-1 rounded border border-yellow-800">
                    <span className="text-yellow-400">Cooldown: </span>
                    <span className="text-yellow-300 font-bold">{cooldown}s</span>
                  </div>
                )}
              </div>

              {/* Prerequisites */}
              <div className="bg-orange-900/20 p-4 rounded border border-orange-800">
                <div className="text-xs text-orange-500 font-bold mb-3">PREREQUISITES & UNLOCK REQUIREMENTS</div>
                
                {/* Parent Skills */}
                <div className="mb-4">
                  <label className="text-xs text-orange-400 font-bold block mb-2">PARENT SKILLS (Required to unlock)</label>
                  <div className="space-y-2 mb-2">
                    {parentSkills.map(skillId => {
                      const skill = skillBank.find(s => s.id === skillId);
                      return (
                        <div key={skillId} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                          <span className="text-xs text-orange-300">{skill?.name || skillId}</span>
                          <button
                            onClick={() => removeParentSkill(skillId)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addParentSkill(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                  >
                    <option value="">Select parent skill...</option>
                    {skillBank.filter(s => !parentSkills.includes(s.id)).map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stat Requirements */}
                <div className="mb-4">
                  <label className="text-xs text-orange-400 font-bold block mb-2">STAT REQUIREMENTS</label>
                  <div className="space-y-2 mb-2">
                    {Object.entries(requiredStats).map(([statKey, minValue]) => (
                      <div key={statKey} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                        <span className="text-xs text-orange-300">{statKey}: {minValue}+</span>
                        <button
                          onClick={() => removeStatRequirement(statKey)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedStat}
                      onChange={(e) => setSelectedStat(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    >
                      {statRegistry.map(s => (
                        <option key={s.key} value={s.key}>{s.key} - {s.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={statValue}
                      onChange={(e) => setStatValue(parseInt(e.target.value) || 0)}
                      placeholder="Min value"
                      className="w-24 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    />
                    <button
                      onClick={addStatRequirement}
                      className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 rounded font-bold"
                    >
                      ADD
                    </button>
                  </div>
                </div>

                {/* Level Requirement */}
                <div className="mb-4">
                  <label className="text-xs text-orange-400 font-bold block mb-2">MINIMUM CHARACTER LEVEL</label>
                  <input
                    type="number"
                    value={prerequisiteLevel}
                    onChange={(e) => setPrerequisiteLevel(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full bg-slate-900 border border-slate-700 text-xs p-2 rounded text-white"
                  />
                </div>

                {/* Class Restrictions */}
                <div>
                  <label className="text-xs text-orange-400 font-bold block mb-2">CLASS RESTRICTIONS (Leave empty for all classes)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Knight', 'Mage', 'Rogue', 'Paladin', 'Necromancer', 'Barbarian', 'Druid', 'Assassin'].map(className => (
                      <button
                        key={className}
                        onClick={() => toggleClassRequirement(className)}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          requiredClasses.includes(className)
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {className}
                      </button>
                    ))}
                  </div>
                  {requiredClasses.length > 0 && (
                    <div className="mt-2 text-xs text-orange-300">
                      Restricted to: {requiredClasses.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Skill Synergies */}
              <div className="bg-purple-900/20 p-4 rounded border border-purple-800">
                <div className="text-xs text-purple-500 font-bold mb-3">SKILL SYNERGIES</div>
                
                {synergies.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {synergies.map((synergy, idx) => {
                      const skill = skillBank.find(s => s.id === synergy.skillId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                          <div className="flex-1">
                            <div className="text-xs text-purple-300 font-bold">{skill?.name || synergy.skillId}</div>
                            <div className="text-xs text-purple-400">
                              {synergy.bonusType === 'flat' ? `+${synergy.bonusValue}` : 
                               synergy.bonusType === 'percentage' ? `+${synergy.bonusValue}%` :
                               `+${synergy.bonusValue}/level`}
                            </div>
                            {synergy.description && (
                              <div className="text-xs text-slate-400 mt-1">{synergy.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => removeSynergy(idx)}
                            className="text-red-500 hover:text-red-400 ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <select
                    value={synergySkillId}
                    onChange={(e) => setSynergySkillId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                  >
                    <option value="">Select skill for synergy...</option>
                    {skillBank.filter(s => s.id !== synergySkillId && !synergies.find(syn => syn.skillId === s.id)).map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      value={synergyBonusType}
                      onChange={(e) => setSynergyBonusType(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    >
                      <option value="flat">Flat</option>
                      <option value="percentage">Percentage</option>
                      <option value="perLevel">Per Level</option>
                    </select>
                    <input
                      type="number"
                      value={synergyBonusValue}
                      onChange={(e) => setSynergyBonusValue(parseInt(e.target.value) || 0)}
                      placeholder="Bonus value"
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    />
                    <button
                      onClick={addSynergy}
                      disabled={!synergySkillId}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 rounded font-bold disabled:opacity-50"
                    >
                      ADD
                    </button>
                  </div>
                  <input
                    type="text"
                    value={synergyDescription}
                    onChange={(e) => setSynergyDescription(e.target.value)}
                    placeholder="Synergy description (optional)"
                    className="w-full bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Upgrade History */}
          {initialSkill && initialSkill.id && upgradeHistory.length > 0 && (
            <div className="bg-purple-900/20 p-4 rounded border border-purple-800">
              <div className="text-xs text-purple-400 font-bold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                UPGRADE HISTORY
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upgradeHistory.map((upgrade, idx) => {
                  const book = booksState.find(b => b.id === upgrade.bookId);
                  const chapter = book?.chapters?.find(c => c.id === upgrade.chapterId);
                  return (
                    <div key={idx} className="bg-slate-900/50 p-2 rounded text-xs">
                      <div className="text-purple-300 font-semibold mb-1">
                        Book {upgrade.bookId}, Ch {upgrade.chapterId}: {chapter?.title || 'Untitled'}
                      </div>
                      <div className="text-slate-300 mb-1">
                        {upgradeTrackingService.formatUpgradeChanges(upgrade.changes)}
                      </div>
                      {upgrade.sourceContext && (
                        <div className="text-slate-500 italic text-[10px] mt-1 line-clamp-2">
                          "{upgrade.sourceContext.substring(0, 100)}..."
                        </div>
                      )}
                      {upgrade.timestamp && (
                        <div className="text-slate-600 text-[10px] mt-1">
                          {new Date(upgrade.timestamp).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!name}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            SAVE TO SKILL TREE
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiabloSkillGenerator;
