import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Activity, Search, ChevronRight, ChevronDown, Shield, AlertTriangle, FileText, Briefcase, Zap, X, Terminal, Eye, Database, Crosshair, PenTool, CheckCircle, Save, RefreshCw, Archive, ShoppingBag, Clock, Edit3, Star, Filter, Lock, Sparkles, Plus, Minus, Trash2, Box, Layers, Settings as SettingsIcon, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, UserPlus, FilePlus, BarChart2, GitBranch, Network, History, BookMarked, Menu, TrendingUp, GripVertical, Package, Image as ImageIcon, Keyboard, Merge, CheckSquare, Square, MessageSquare, Target, Brain, Globe, Lightbulb, ChevronLeft } from 'lucide-react';

// Import services
import db from './src/services/database';
import aiService from './src/services/aiService';
import undoRedoManager from './services/undoRedo';
import toastService from './services/toastService';
import imageGenerationService from './services/imageGenerationService';

// Import components
import DiabloItemGenerator from './src/components/generators/DiabloItemGenerator';
import DiabloSkillGenerator from './src/components/generators/DiabloSkillGenerator';
import DiabloStatGenerator from './src/components/generators/DiabloStatGenerator';
import SkillTreeVisualizer from './src/components/SkillTreeVisualizer';
import SkillTreeSystem from './src/components/SkillTreeSystem';
import InventorySystem from './src/components/InventorySystem';
import ManuscriptParser from './src/components/ManuscriptParser';
import WikiManager from './src/components/WikiManager';
import WritingCanvas from './src/components/WritingCanvas';
import WritingCanvasPro from './src/components/WritingCanvasPro';
import WritingModeSelector, { WritingModeBadge } from './src/components/WritingModeSelector';
import StoryMap from './src/components/StoryMap';
import RelationshipTracker from './src/components/RelationshipTracker';
import RelationshipTrackerEnhanced from './src/components/RelationshipTrackerEnhanced';
import VersionControl from './src/components/VersionControl';
import SearchFilter from './src/components/SearchFilter';
import BackupManager from './src/components/BackupManager';
import Settings from './src/components/Settings';
import SyncManager from './components/SyncManager';
import ToastContainer from './components/ToastContainer';
import GlobalSearch from './components/GlobalSearch';
import ManuscriptIntelligence from './src/components/ManuscriptIntelligence';
import SpeedReader from './src/components/SpeedReader';
// TimelineVisualizer removed - replaced by MasterTimeline
import PlotThreadTracker from './src/components/PlotThreadTracker';
import PlotQuestTab from './src/components/PlotQuestTab';
import WorldLoreTab from './src/components/WorldLoreTab';
import CharacterArcMapper from './src/components/CharacterArcMapper';
import ConsistencyChecker from './src/components/ConsistencyChecker';
import StoryAnalysisHub from './src/components/StoryAnalysisHub';
import ActorImageDisplay from './src/components/ActorImageDisplay';
import MasterTimeline from './src/components/MasterTimeline';
import UKMapVisualization from './src/components/UKMapVisualization';
import StoryMindMap from './src/components/StoryMindMap';
import GravityMindMap from './src/components/GravityMindMap';
import IntegrationPreviewModal from './src/components/IntegrationPreviewModal';
import integrationService from './src/services/integrationService';
import NavigationSidebar from './components/NavigationSidebar';
import Tooltip from './components/Tooltip';
import OnboardingWizard from './src/components/OnboardingWizard';
import PlotBeatTracker from './src/components/PlotBeatTracker';
import StyleReviewModal from './src/components/StyleReviewModal';
import ChapterContextView from './src/components/ChapterContextView';
import PlotTimeline from './src/components/PlotTimeline';
import LoadingSkeleton from './src/components/LoadingSkeleton';
import KeyboardShortcutsHelp from './src/components/KeyboardShortcutsHelp';
import QuickActions from './src/components/QuickActions';
import WritingGoals from './src/components/WritingGoals';
import SessionTimer from './src/components/SessionTimer';
import GlobalReadAloud from './src/components/GlobalReadAloud';
import CharacterTimelineView from './src/components/CharacterTimelineView';
import CharacterRelationshipWeb from './src/components/CharacterRelationshipWeb';
import CharacterDialogueAnalysis from './src/components/CharacterDialogueAnalysis';
import EnhancedCharacterCard from './src/components/EnhancedCharacterCard';
import CharacterProgressionView from './src/components/CharacterProgressionView';
import CallbacksAndMemoriesDisplay from './src/components/CallbacksAndMemoriesDisplay';
import CharacterRelationshipHub from './src/components/CharacterRelationshipHub';
import CharacterAISuggestionsPanel from './src/components/CharacterAISuggestionsPanel';
import EnhancedInventoryDisplay from './src/components/EnhancedInventoryDisplay';
import StatHistoryTimeline from './src/components/StatHistoryTimeline';
import InventoryHistoryTimeline from './src/components/InventoryHistoryTimeline';
import CharacterStorylineCards from './src/components/CharacterStorylineCards';
import CharacterDialogueHub from './src/components/CharacterDialogueHub';
import CharacterPlotInvolvement from './src/components/CharacterPlotInvolvement';
import CharacterGamification from './src/components/CharacterGamification';
import EnhancedItemVault from './src/components/EnhancedItemVault';
import PaperDollView from './src/components/PaperDollView';
import EquipmentChangeViews from './src/components/EquipmentChangeViews';
import TotalStatsDisplay from './src/components/TotalStatsDisplay';
import InventoryAISuggestionsPanel from './src/components/InventoryAISuggestionsPanel';
import EquipmentStoryContext from './src/components/EquipmentStoryContext';
import InventoryCapacity from './src/components/InventoryCapacity';
import SetBonusDisplay from './src/components/SetBonusDisplay';
import InventoryGamification from './src/components/InventoryGamification';
import SkillAcquisitionTimeline from './src/components/SkillAcquisitionTimeline';
import SkillUsageTimeline from './src/components/SkillUsageTimeline';
import SkillStatImpactCards from './src/components/SkillStatImpactCards';
import SkillAISuggestionsPanel from './src/components/SkillAISuggestionsPanel';
import SkillMomentsTimeline from './src/components/SkillMomentsTimeline';
import SkillCardView from './src/components/SkillCardView';
import SkillUsageAnalytics from './src/components/SkillUsageAnalytics';
import SkillGamification from './src/components/SkillGamification';
import StatCharacterList from './src/components/StatCharacterList';
import StatChangeVisualization from './src/components/StatChangeVisualization';
import StatChangeEvents from './src/components/StatChangeEvents';
import StatAISuggestionsPanel from './src/components/StatAISuggestionsPanel';
import StatDisplayHub from './src/components/StatDisplayHub';
import StatCorrelationAnalysis from './src/components/StatCorrelationAnalysis';
import StatFormulaView from './src/components/StatFormulaView';
import StatSignificanceMoments from './src/components/StatSignificanceMoments';
import StatGamification from './src/components/StatGamification';
import contextEngine from './src/services/contextEngine';
import chapterOverviewService from './src/services/chapterOverviewService';
import chapterNavigationService from './src/services/chapterNavigationService';
// @deprecated - Using timelineEvents directly now
// import personnelAnalysisService from './src/services/personnelAnalysisService';
import upgradeTrackingService from './src/services/upgradeTrackingService';
import storyContiguityAgent from './src/services/storyContiguityAgent';
import StoryHealthPanel from './src/components/StoryHealthPanel';
import './styles/theme.css';
import './src/styles/rpgComponents.css';
import './src/styles/rpgAnimations.css';

// Default stat registry - basic RPG stats that wizard can extend
const DEFAULT_STAT_REGISTRY = [
    { id: "st1", key: "STR", name: "Strength", desc: "Physical power & carry weight.", isCore: true, color: "green" },
    { id: "st2", key: "VIT", name: "Vitality", desc: "Health & endurance.", isCore: true, color: "green" },
    { id: "st3", key: "INT", name: "Intelligence", desc: "Magic & logic puzzles.", isCore: true, color: "blue" },
  { id: "st4", key: "DEX", name: "Dexterity", desc: "Agility & speed.", isCore: true, color: "yellow" }
];

// Empty initial state - wizard populates everything
const EMPTY_STATE = {
  meta: { premise: "", tone: "", reveal: "" },
  statRegistry: [],
  skillBank: [],
  itemBank: [],
  books: [],
  actors: []
};

// Helper functions
const calculateActorState = (actor, itemBank, skillBank) => {
  let finalStats = { ...actor.baseStats };
  
  // Handle new additionalStats structure (base + bonuses) or old structure (simple values)
  let finalAdditional = {};
  let additionalBonuses = {};
  
  // Track stat sources for breakdown
  const statSources = {
    items: {},
    skills: {},
    equipment: {}
  };
  
  // Migrate old additionalStats format to new format if needed
  if (actor.additionalStats) {
    Object.entries(actor.additionalStats).forEach(([stat, val]) => {
      if (typeof val === 'object' && val !== null && 'base' in val) {
        // New format: { base: X, bonuses: Y }
        finalAdditional[stat] = val.base || 0;
        additionalBonuses[stat] = val.bonuses || 0;
      } else {
        // Old format: simple number - migrate it
        finalAdditional[stat] = typeof val === 'number' ? val : 0;
        additionalBonuses[stat] = 0;
      }
    });
  }
  
  let finalSkills = [...actor.activeSkills];
  let modifiers = {}; 

  // Process equipped items
  const equippedItemIds = [];
  if (actor.equipment) {
    Object.values(actor.equipment).forEach(slot => {
      if (Array.isArray(slot)) {
        slot.forEach(itemId => {
          if (itemId) equippedItemIds.push(itemId);
        });
      } else if (slot) {
        equippedItemIds.push(slot);
      }
    });
  }

  // Combine equipped items and inventory items for stat calculation
  const allItemIds = [...equippedItemIds, ...(actor.inventory || [])];
  const isEquipped = (itemId) => equippedItemIds.includes(itemId);
  
  allItemIds.forEach(itemId => {
    const item = itemBank.find(i => i.id === itemId);
    if (item) {
      const itemIsEquipped = isEquipped(itemId);
      const sourceKey = itemIsEquipped ? 'equipment' : 'items';
      
      // Apply item stats (handle both number and array of modifier objects)
      if (item.stats) {
        Object.entries(item.stats).forEach(([stat, val]) => {
          let statValue = 0;
          // Handle array of modifier objects
          if (Array.isArray(val)) {
            statValue = val.reduce((sum, mod) => {
              const modValue = typeof mod === 'object' && mod !== null ? (mod.value || 0) : (mod || 0);
              return sum + modValue;
            }, 0);
          } else if (typeof val === 'number') {
            statValue = val;
          } else if (typeof val === 'object' && val !== null) {
            statValue = val.value || 0;
          }
          
          if (statValue !== 0) {
            // Track source
            statSources[sourceKey][stat] = (statSources[sourceKey][stat] || 0) + statValue;
            
            if (finalStats[stat] !== undefined) {
              finalStats[stat] += statValue;
              modifiers[stat] = (modifiers[stat] || 0) + statValue;
            } else {
              // Additional stat - add to bonuses
              additionalBonuses[stat] = (additionalBonuses[stat] || 0) + statValue;
              modifiers[stat] = (modifiers[stat] || 0) + statValue; 
              // Initialize base if not exists
              if (finalAdditional[stat] === undefined) {
                finalAdditional[stat] = 0;
              }
            }
          }
        });
      }
      
      // Apply socketed items' stats
      if (item.sockets && item.sockets.socketedItems) {
        item.sockets.socketedItems.forEach(socketedItemId => {
          const socketedItem = itemBank.find(i => i.id === socketedItemId);
          if (socketedItem && socketedItem.stats) {
            Object.entries(socketedItem.stats).forEach(([stat, val]) => {
              let statValue = 0;
              if (Array.isArray(val)) {
                statValue = val.reduce((sum, mod) => {
                  const modValue = typeof mod === 'object' && mod !== null ? (mod.value || 0) : (mod || 0);
                  return sum + modValue;
                }, 0);
              } else if (typeof val === 'number') {
                statValue = val;
              } else if (typeof val === 'object' && val !== null) {
                statValue = val.value || 0;
              }
              
              if (statValue !== 0) {
                // Track source (socketed items count as part of equipment)
                statSources[itemIsEquipped ? 'equipment' : 'items'][stat] = 
                  (statSources[itemIsEquipped ? 'equipment' : 'items'][stat] || 0) + statValue;
                
                if (finalStats[stat] !== undefined) {
                  finalStats[stat] += statValue;
                  modifiers[stat] = (modifiers[stat] || 0) + statValue;
                } else {
                  additionalBonuses[stat] = (additionalBonuses[stat] || 0) + statValue;
                  modifiers[stat] = (modifiers[stat] || 0) + statValue;
                  if (finalAdditional[stat] === undefined) {
                    finalAdditional[stat] = 0;
                  }
                }
              }
            });
          }
        });
      }
      
      if (item.grantsSkills) {
        item.grantsSkills.forEach(skillId => {
           if (!finalSkills.find(s => s.id === skillId)) {
               finalSkills.push({ id: skillId, val: 1 });
           }
        });
      }
    }
  });
  
  // Process skills for stat bonuses
  finalSkills.forEach(skillRef => {
    const skill = skillBank.find(s => s.id === skillRef.id);
    if (skill && skill.stats) {
      Object.entries(skill.stats).forEach(([stat, val]) => {
        let statValue = 0;
        // Handle skill stat bonuses (can be per level)
        if (Array.isArray(val)) {
          statValue = val.reduce((sum, mod) => {
            const modValue = typeof mod === 'object' && mod !== null ? (mod.value || 0) : (mod || 0);
            return sum + modValue;
          }, 0);
        } else if (typeof val === 'number') {
          statValue = val * (skillRef.val || 1); // Multiply by skill level
        } else if (typeof val === 'object' && val !== null) {
          statValue = (val.value || 0) * (skillRef.val || 1);
        }
        
        if (statValue !== 0) {
          // Track source
          statSources.skills[stat] = (statSources.skills[stat] || 0) + statValue;
          
          if (finalStats[stat] !== undefined) {
            finalStats[stat] += statValue;
            modifiers[stat] = (modifiers[stat] || 0) + statValue;
          } else {
            additionalBonuses[stat] = (additionalBonuses[stat] || 0) + statValue;
            modifiers[stat] = (modifiers[stat] || 0) + statValue;
            if (finalAdditional[stat] === undefined) {
              finalAdditional[stat] = 0;
            }
          }
        }
      });
    }
  });

  // Calculate final additional stats: base + bonuses
  const computedAdditional = {};
  Object.keys({ ...finalAdditional, ...additionalBonuses }).forEach(stat => {
    const base = finalAdditional[stat] || 0;
    const bonuses = additionalBonuses[stat] || 0;
    computedAdditional[stat] = base + bonuses;
  });

  return {
    ...actor,
    computedStats: finalStats,
    computedAdditional: computedAdditional,
    additionalBonuses: additionalBonuses,
    statModifiers: modifiers,
    statSources: statSources, // Breakdown of stat sources
    computedSkills: finalSkills.map(s => {
        const baseSkill = skillBank.find(sb => sb.id === s.id);
        return baseSkill ? { ...baseSkill, value: s.val } : null;
    }).filter(Boolean)
  };
};

// Utility function to find compatible equipment slot for an item
const findCompatibleEquipmentSlot = (item, equipment) => {
  // First check if item has explicit equipmentSlot field (from generator)
  if (item.equipmentSlot) {
    const slot = item.equipmentSlot;
    if (slot === 'rings') {
      const emptyRingIndex = equipment.rings.findIndex(r => !r);
      if (emptyRingIndex !== -1) return { slot: 'rings', index: emptyRingIndex };
    } else if (slot === 'charms') {
      const emptyCharmIndex = equipment.charms.findIndex(c => !c);
      if (emptyCharmIndex !== -1) return { slot: 'charms', index: emptyCharmIndex };
    } else if (slot === 'weapon') {
      return { slot: equipment.leftHand ? 'rightHand' : 'leftHand', index: null };
    } else if (slot === 'shield') {
      return { slot: equipment.rightHand ? 'leftHand' : 'rightHand', index: null };
    } else if (['helm', 'cape', 'amulet', 'armour', 'gloves', 'belt', 'boots'].includes(slot)) {
      return { slot: slot, index: null };
    }
  }
  
  // Check baseType for more accurate matching
  const baseType = (item.baseType || '').toLowerCase();
  const itemClass = (item.type || '').toLowerCase();
  
  // Weapons detection (baseType takes priority)
  if (baseType === 'weapon' || itemClass.includes('weapon') || 
      itemClass.includes('sword') || itemClass.includes('axe') || 
      itemClass.includes('hammer') || itemClass.includes('spear') || 
      itemClass.includes('dagger') || itemClass.includes('bow') ||
      itemClass.includes('staff') || itemClass.includes('wand') ||
      itemClass.includes('mace') || itemClass.includes('flail')) {
    return { slot: equipment.leftHand ? 'rightHand' : 'leftHand', index: null };
  }
  
  // Shield detection
  if (itemClass.includes('shield') || itemClass.includes('buckler') || itemClass.includes('pavise')) {
    return { slot: equipment.rightHand ? 'leftHand' : 'rightHand', index: null };
  }
  
  // Armor slots (fallback to type-based detection)
  const itemType = (item.type || '').toLowerCase();
  if (itemType.includes('ring')) {
    const emptyRingIndex = equipment.rings.findIndex(r => !r);
    if (emptyRingIndex !== -1) return { slot: 'rings', index: emptyRingIndex };
  } else if (itemType.includes('charm')) {
    const emptyCharmIndex = equipment.charms.findIndex(c => !c);
    if (emptyCharmIndex !== -1) return { slot: 'charms', index: emptyCharmIndex };
  } else if (itemType.includes('helm') || itemType.includes('hat') || itemType.includes('crown') || itemType.includes('cap')) {
    return { slot: 'helm', index: null };
  } else if (itemType.includes('cape') || itemType.includes('cloak') || itemType.includes('mantle')) {
    return { slot: 'cape', index: null };
  } else if (itemType.includes('amulet') || itemType.includes('necklace') || itemType.includes('pendant')) {
    return { slot: 'amulet', index: null };
  } else if (itemType.includes('armour') || itemType.includes('armor') || itemType.includes('chest') || itemType.includes('breastplate')) {
    return { slot: 'armour', index: null };
  } else if (itemType.includes('gloves') || itemType.includes('gauntlets') || itemType.includes('bracers')) {
    return { slot: 'gloves', index: null };
  } else if (itemType.includes('belt') || itemType.includes('girdle') || itemType.includes('sash')) {
    return { slot: 'belt', index: null };
  } else if (itemType.includes('boots') || itemType.includes('shoes') || itemType.includes('greaves')) {
    return { slot: 'boots', index: null };
  }
  
  return null;
};

// Stat Slider Component with +/- buttons
const StatSlider = ({ label, value, modifier = 0, baseValue = null, onChange, max = 500, color = "green", readOnly = false, showBreakdown = false, onHover = null, statInfo = null }) => {
  const displayValue = baseValue !== null ? baseValue : (value - modifier);
  const totalValue = value;
  const bonusValue = modifier;
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (displayValue > 0) {
      onChange(Math.max(0, displayValue - 1));
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (displayValue < max) {
      onChange(Math.min(max, displayValue + 1));
    }
  };

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'range') {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          onChange(Math.max(0, displayValue - 5));
        } else if (e.ctrlKey || e.metaKey) {
          onChange(Math.max(0, displayValue - 10));
        } else {
          onChange(Math.max(0, displayValue - 1));
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) {
          onChange(Math.min(max, displayValue + 5));
        } else if (e.ctrlKey || e.metaKey) {
          onChange(Math.min(max, displayValue + 10));
        } else {
          onChange(Math.min(max, displayValue + 1));
        }
      }
    }
  };

  return (
    <div 
      className="mb-3"
      onMouseEnter={(e) => {
        if (onHover && statInfo) {
          setIsHovering(true);
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }
      }}
      onMouseMove={(e) => {
        if (isHovering) {
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }
      }}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
      <span className="uppercase font-bold truncate pr-2">{label}</span>
        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <button
                onClick={handleDecrement}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const interval = setInterval(() => {
                    if (displayValue > 0) onChange(Math.max(0, displayValue - 1));
                  }, 100);
                  const stop = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', stop);
                  };
                  document.addEventListener('mouseup', stop);
                }}
                className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 hover:text-white transition-all text-xs"
                title="Decrease (Hold for rapid)"
              >
                <Minus className="w-3 h-3"/>
              </button>
            </>
          )}
          <span className={`text-${color}-400 font-bold min-w-[60px] text-right`}>
            {showBreakdown && baseValue !== null ? (
              <>
                {totalValue} <span className="text-slate-500">({displayValue}</span>
                {bonusValue > 0 && <span className="text-blue-400">+{bonusValue}</span>}
                {bonusValue < 0 && <span className="text-red-400">{bonusValue}</span>}
                <span className="text-slate-500">)</span>
              </>
            ) : (
              <>
                {totalValue} {bonusValue > 0 && <span className="text-blue-400">(+{bonusValue})</span>}
              </>
            )}
      </span>
          {!readOnly && (
            <button
              onClick={handleIncrement}
              onMouseDown={(e) => {
                e.preventDefault();
                const interval = setInterval(() => {
                  if (displayValue < max) onChange(Math.min(max, displayValue + 1));
                }, 100);
                const stop = () => {
                  clearInterval(interval);
                  document.removeEventListener('mouseup', stop);
                };
                document.addEventListener('mouseup', stop);
              }}
              className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 hover:text-white transition-all text-xs"
              title="Increase (Hold for rapid)"
            >
              <Plus className="w-3 h-3"/>
            </button>
          )}
        </div>
    </div>
    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
       <div 
           className={`absolute top-0 left-0 h-full bg-${color}-500 opacity-50 transition-all`}
           style={{ width: `${Math.min((displayValue / max) * 100, 100)}%` }}
       />
         {bonusValue > 0 && (
           <div 
               className="absolute top-0 h-full bg-blue-500 opacity-60 transition-all"
             style={{ 
                   left: `${Math.min((displayValue / max) * 100, 100)}%`,
                   width: `${Math.min((Math.abs(bonusValue) / max) * 100, 100 - ((displayValue)/max)*100)}%` 
               }}
             />
         )}
         {bonusValue < 0 && (
             <div 
               className="absolute top-0 h-full bg-red-500 opacity-60 transition-all"
               style={{ 
                   left: `${Math.min(((displayValue + bonusValue) / max) * 100, 100)}%`,
                   width: `${Math.min((Math.abs(bonusValue) / max) * 100, 100)}%` 
             }}
           />
       )}
       {!readOnly && (
         <input 
          type="range" 
          min="0" 
          max={max} 
            value={displayValue} 
          onChange={(e) => onChange(parseInt(e.target.value))}
            onKeyDown={handleKeyDown}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Use arrow keys: ←/→ = ±1, Shift+←/→ = ±5, Ctrl+←/→ = ±10"
        />
       )}
    </div>
      {isHovering && statInfo && onHover && (
        <div className="absolute z-50 pointer-events-none" style={{ left: `${hoverPosition.x + 15}px`, top: `${hoverPosition.y + 15}px` }}>
          {onHover(statInfo, hoverPosition)}
        </div>
      )}
  </div>
);
};

// Main App Component
const OmniscienceV22 = () => {
  const [activeTab, setActiveTab] = useState('home'); // Default to home for returning users
  const [worldState, setWorldState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerMode, setPickerMode] = useState(null);
  const [creatorMode, setCreatorMode] = useState(null);
  const [editingStat, setEditingStat] = useState(null);
  const [showManuscriptParser, setShowManuscriptParser] = useState(false);
  const [showWikiManager, setShowWikiManager] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showStoryMap, setShowStoryMap] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showVersionControl, setShowVersionControl] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showDocumentContext, setShowDocumentContext] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // Onboarding & Intelligence state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true); // Assume complete, check on load
  const [showStyleReview, setShowStyleReview] = useState(false);
  
  // Writing Mode state - 'zen' | 'standard' | 'pro'
  const [writingMode, setWritingMode] = useState('standard');
  const [showWritingModeSelector, setShowWritingModeSelector] = useState(false);
  
  // Session stats
  const [sessionStats, setSessionStats] = useState({
    wordsWrittenToday: 0,
    sessionStartTime: Date.now(),
    chaptersEdited: 0,
    aiAssists: 0
  });
  
  // Focus mode (hides sidebar)
  const [focusMode, setFocusMode] = useState(false);
  const [styleReviewChapter, setStyleReviewChapter] = useState(null);
  const [recentChaptersForReview, setRecentChaptersForReview] = useState([]);
  
  // Undo/Redo state
  const [undoRedoInfo, setUndoRedoInfo] = useState({ canUndo: false, canRedo: false });

  // Personnel State
  const [selectedActorId, setSelectedActorId] = useState("grimguff");
  const [bookTab, setBookTab] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [expandedBooks, setExpandedBooks] = useState({1: true});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editingId, setEditingId] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null); 
  const [tempText, setTempText] = useState("");
  const [tempTitle, setTempTitle] = useState("");
  
  // Personnel improvements state
  const [personnelViewMode, setPersonnelViewMode] = useState('standard'); // 'standard' | 'timeline'
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelFilter, setPersonnelFilter] = useState({ class: 'all', role: 'all' });
  const [actorDetailTab, setActorDetailTab] = useState('overview'); // 'overview' | 'timeline' | 'relationships' | 'dialogue' | 'arc' | 'stats' | 'inventory'
  const [actorTimelineEvents, setActorTimelineEvents] = useState({});
  const [selectedActors, setSelectedActors] = useState(new Set());
  const [bulkStatChanges, setBulkStatChanges] = useState({});
  
  // AI Features state
  const [detectedCharacters, setDetectedCharacters] = useState([]);
  const [showCharacterDetection, setShowCharacterDetection] = useState(false);
  const [statChangeSuggestions, setStatChangeSuggestions] = useState([]);
  const [showStatChanges, setShowStatChanges] = useState(false);
  const [skillItemSuggestions, setSkillItemSuggestions] = useState([]);
  const [showSkillItemSuggestions, setShowSkillItemSuggestions] = useState(false);
  const [characterBiography, setCharacterBiography] = useState(null);
  const [isGeneratingBiography, setIsGeneratingBiography] = useState(false);
  const [isGeneratingActorImage, setIsGeneratingActorImage] = useState(false);
  const [actorImageUrl, setActorImageUrl] = useState(null);
  const [loadingActorImage, setLoadingActorImage] = useState(false);
  const [consistencyIssues, setConsistencyIssues] = useState([]);
  const [showConsistencyCheck, setShowConsistencyCheck] = useState(false);
  const [characterArcData, setCharacterArcData] = useState(null);
  const [snapshotSuggestion, setSnapshotSuggestion] = useState(null);
  const [isAnalyzingAppearances, setIsAnalyzingAppearances] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [inventoryActorId, setInventoryActorId] = useState(null);
  const [isAnalyzingChapter, setIsAnalyzingChapter] = useState(false);
  const [chapterAnalysisStatus, setChapterAnalysisStatus] = useState(null);
  const [selectedSnapshotChapter, setSelectedSnapshotChapter] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [actionMenu, setActionMenu] = useState({ item: null, x: 0, y: 0 });
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Story Engine
  const [genBook, setGenBook] = useState(1);
  const [genChap, setGenChap] = useState(1);
  const [userNote, setUserNote] = useState("");
  const [activeCast, setActiveCast] = useState(["grimguff", "pipkins"]);
  const [isGen, setIsGen] = useState(false);
  const [output, setOutput] = useState("");

  // Bible improvements state
  const [bibleViewMode, setBibleViewMode] = useState('standard'); // 'standard' | 'timeline'
  const [chapterTags, setChapterTags] = useState({}); // { 'book_chapter': ['tag1', 'tag2'] }
  const [draggedChapter, setDraggedChapter] = useState(null); // { bookId, chapterId }
  const [tagInputTarget, setTagInputTarget] = useState(null); // { bookId, chapterId } for tag modal
  const [tagInputValue, setTagInputValue] = useState('');

  // Bank (Items/Skills) improvements state
  const [bankFilter, setBankFilter] = useState({ rarity: 'all', type: 'all', search: '' });
  const [bankSort, setBankSort] = useState('name'); // 'name' | 'rarity' | 'usage'

  // Stats improvements state
  const [statFormulas, setStatFormulas] = useState({}); // { statKey: "STR + VIT * 2" }
  const [statUsage, setStatUsage] = useState({});

  // ---- Stats enhancements state ----
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [diceRollerActor, setDiceRollerActor] = useState(null);
  const [diceResult, setDiceResult] = useState(null);
  const [diceRollStat, setDiceRollStat] = useState('');
  const [showStatCompare, setShowStatCompare] = useState(false);
  const [statCompareKey, setStatCompareKey] = useState('');

  // ---- Personnel enhancements state ----
  const [showCharacterCompare, setShowCharacterCompare] = useState(false);
  const [compareActorId, setCompareActorId] = useState(null);
  const [characterNotes, setCharacterNotes] = useState({}); // { actorId: 'notes text' }
  const [showCharacterNotes, setShowCharacterNotes] = useState(false);
  const [characterFactions, setCharacterFactions] = useState({}); // { actorId: ['faction1'] }
  const [showFactionModal, setShowFactionModal] = useState(false);
  const [allFactions, setAllFactions] = useState([]); // list of faction names
  const [showMotivationEditor, setShowMotivationEditor] = useState(false);
  const [actorMotivations, setActorMotivations] = useState({}); // { actorId: { goals, fears, desires, secrets } }

  // Initialize app with database
  useEffect(() => {
    initializeApp();
    
    // Load saved writing mode preference
    const savedMode = localStorage.getItem('writingMode');
    if (savedMode && ['zen', 'standard', 'pro'].includes(savedMode)) {
      setWritingMode(savedMode);
    }

    // Set up chapter navigation service callback
    chapterNavigationService.setNavigationCallback((bookId, chapterId) => {
      setActiveTab('bible');
      if (bookId) {
        setBookTab(bookId);
        setCurrentChapter(chapterId);
      }
      toastService.info(`Navigated to chapter ${chapterId}`);
    });
  }, []);

  // Calculate stat usage
  useEffect(() => {
    if (!worldState || !worldState.statRegistry) return;
    const usage = {};
    worldState.statRegistry.forEach(stat => {
      let count = 0;
      // Count actors using this stat
      count += worldState.actors.filter(actor => 
        actor.baseStats?.[stat.key] !== undefined
      ).length;
      // Count items using this stat
      count += worldState.itemBank.filter(item => 
        item.stats?.[stat.key] !== undefined || item.statMod?.[stat.key] !== undefined
      ).length;
      // Count skills using this stat
      count += worldState.skillBank.filter(skill => 
        skill.statMod?.[stat.key] !== undefined
      ).length;
      usage[stat.key] = count;
    });
    setStatUsage(usage);
  }, [worldState]);

  const initializeApp = async () => {
    try {
      await db.init();

      // Check if onboarding is complete
      const isOnboardingDone = await contextEngine.isOnboardingComplete();
      setOnboardingComplete(isOnboardingDone);
      
      // If onboarding not complete, show wizard and skip loading data
      if (!isOnboardingDone) {
        setShowOnboarding(true);
        // Set empty state while waiting for wizard
        setWorldState({
          ...EMPTY_STATE,
          statRegistry: DEFAULT_STAT_REGISTRY,
          books: {}
        });
        setIsLoading(false);
        return;
      }

      // Load whatever data exists (populated by wizard)
      let actors = await db.getAll('actors');
      
      // Ensure default stat registry exists
      let statRegistry = await db.getAll('statRegistry');
      if (statRegistry.length === 0) {
        await db.bulkAdd('statRegistry', DEFAULT_STAT_REGISTRY);
        statRegistry = DEFAULT_STAT_REGISTRY;
      }
      
      // Migrate existing actors to new schema
      actors = actors.map(actor => {
        // Migrate equipment field
        if (!actor.equipment) {
          actor.equipment = {
            helm: null,
            cape: null,
            amulet: null,
            armour: null,
            gloves: null,
            belt: null,
            boots: null,
            leftHand: null,
            rightHand: null,
            rings: [null, null, null, null, null, null, null],
            charms: [null, null, null, null]
          };
        }
        
        // Migrate additionalStats to new format
        if (actor.additionalStats) {
          const migrated = {};
          Object.entries(actor.additionalStats).forEach(([stat, val]) => {
            if (typeof val === 'object' && val !== null && 'base' in val) {
              // Already new format
              migrated[stat] = val;
            } else {
              // Old format - convert to new
              migrated[stat] = {
                base: typeof val === 'number' ? val : 0,
                bonuses: 0
              };
            }
          });
          actor.additionalStats = migrated;
        } else {
          actor.additionalStats = {};
        }
        
        // Ensure other new fields exist
        if (!actor.appearances) actor.appearances = {};
        if (!actor.biography) actor.biography = '';
        if (!actor.arcMilestones) actor.arcMilestones = {};
        if (!actor.lastConsistencyCheck) actor.lastConsistencyCheck = null;
        if (!actor.aiSuggestions) actor.aiSuggestions = [];
        
        return actor;
      });
      
      // Save migrated actors back to database
      for (const actor of actors) {
        await db.update('actors', actor);
      }
      
      const loadedData = {
        meta: (await db.getAll('meta'))[0] || { premise: "", tone: "", reveal: "" },
        statRegistry: statRegistry,
        skillBank: await db.getAll('skillBank'),
        itemBank: await db.getAll('itemBank'),
        actors: actors,
        books: await db.getAll('books')
      };

      // Convert books array to object format for compatibility
      const booksObj = {};
      loadedData.books.forEach(book => {
        booksObj[book.id] = book;
      });

      const finalState = { ...loadedData, books: booksObj };
      setWorldState(finalState);
      // Save initial state for undo/redo
      undoRedoManager.saveState(finalState, 'Initial Load');
      updateUndoRedoInfo();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Fallback to empty state - wizard will populate data
      const fallbackState = { 
        ...EMPTY_STATE, 
        statRegistry: DEFAULT_STAT_REGISTRY,
        books: {} 
      };
      setWorldState(fallbackState);
      undoRedoManager.saveState(fallbackState, 'Initial Load');
      updateUndoRedoInfo();
      setIsLoading(false);
    }
  };

  const updateUndoRedoInfo = () => {
    setUndoRedoInfo(undoRedoManager.getHistoryInfo());
  };

  // Check chapter analysis status
  const checkChapterAnalysisStatus = async () => {
    if (!worldState || !worldState.books || !worldState.actors) {
      setChapterAnalysisStatus(null);
      return;
    }

    const currentBook = worldState.books[bookTab];
    const currentCh = currentBook?.chapters.find(c => c.id === currentChapter);
    if (!currentCh) {
      setChapterAnalysisStatus(null);
      return;
    }

    try {
      // Check if chapter has timeline events
      const allEvents = await db.getAll('timelineEvents');
      const chapterEvents = allEvents.filter(e => 
        e.bookId === bookTab && e.chapterId === currentChapter
      );
      
      // Check if chapter was modified after last event extraction
      const lastEventTime = chapterEvents.length > 0 
        ? Math.max(...chapterEvents.map(e => e.timestamp || e.createdAt || 0))
        : 0;
      
      const chapterModifiedTime = currentCh.lastUpdated || currentCh.createdAt || 0;
      const needsReanalysis = chapterModifiedTime > lastEventTime;
      
      setChapterAnalysisStatus({
        needsReanalysis,
        analyzedActors: chapterEvents.filter(e => e.actorIds && e.actorIds.length > 0).length,
        eventsCount: chapterEvents.length,
        reason: needsReanalysis ? 'Chapter was modified after last extraction' : null
      });
    } catch (error) {
      console.error('Error checking chapter analysis status:', error);
      setChapterAnalysisStatus(null);
    }
  };

  // Check analysis status when chapter changes
  useEffect(() => {
    if (bookTab && currentChapter && worldState && worldState.actors && worldState.actors.length > 0) {
      checkChapterAnalysisStatus();
    }
  }, [bookTab, currentChapter, worldState?.actors?.length]);

  // Load timeline events for selected actor
  useEffect(() => {
    const loadActorTimeline = async () => {
      if (!selectedActorId) {
        setActorTimelineEvents({});
        return;
      }

      try {
        const allEvents = await db.getAll('timelineEvents');
        const actorEvents = allEvents.filter(event => 
          event.actorIds && event.actorIds.includes(selectedActorId)
        );
        
        // Group events by chapter
        const eventsByChapter = {};
        for (const event of actorEvents) {
          const key = `${event.bookId}_${event.chapterId}`;
          if (!eventsByChapter[key]) {
            eventsByChapter[key] = [];
          }
          eventsByChapter[key].push(event);
        }
        
        setActorTimelineEvents(eventsByChapter);
      } catch (error) {
        console.error('Error loading actor timeline:', error);
        setActorTimelineEvents({});
      }
    };

    loadActorTimeline();
  }, [selectedActorId]);

  // Handle undo/redo keyboard shortcuts and global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Global search: Cmd/Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
        return;
      }
      
      // Keyboard shortcuts help: Ctrl+/
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
        return;
      }
      
      // Quick navigation: Ctrl+1-6 for tabs
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('personnel'); return; }
        if (e.key === '2') { e.preventDefault(); setActiveTab('stats'); return; }
        if (e.key === '3') { e.preventDefault(); setActiveTab('skills'); return; }
        if (e.key === '4') { e.preventDefault(); setActiveTab('items'); return; }
        if (e.key === '5') { e.preventDefault(); setActiveTab('story'); return; }
        if (e.key === '6') { e.preventDefault(); setActiveTab('bible'); return; }
      }
      
      // Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleNavigate = (type, id, bookId) => {
    if (type === 'actor') {
      setSelectedActorId(id);
      setActiveTab('personnel');
    } else if (type === 'item') {
      setActiveTab('items');
    } else if (type === 'skill') {
      setActiveTab('skills');
    } else if (type === 'chapter') {
      // Use navigation service for consistency
      chapterNavigationService.navigateToChapter(bookId, id);
      return;
    }
    toastService.info(`Navigated to ${type}: ${id}`);
  };

  const handleUndo = () => {
    const previousState = undoRedoManager.undo();
    if (previousState) {
      setWorldState(previousState);
      updateUndoRedoInfo();
    }
  };

  const handleRedo = () => {
    const nextState = undoRedoManager.redo();
    if (nextState) {
      setWorldState(nextState);
      updateUndoRedoInfo();
    }
  };

  // Save state to database
  const saveToDatabase = async (storeName, data, action = 'Update') => {
    try {
      if (Array.isArray(data)) {
        await db.bulkUpdate(storeName, data);
      } else {
        await db.update(storeName, data);
      }
      
      // Save state for undo/redo
      if (worldState) {
        const newState = { ...worldState };
        if (storeName === 'actors') {
          newState.actors = await db.getAll('actors');
        } else if (storeName === 'itemBank') {
          newState.itemBank = await db.getAll('itemBank');
        } else if (storeName === 'skillBank') {
          newState.skillBank = await db.getAll('skillBank');
        } else if (storeName === 'books') {
          const books = await db.getAll('books');
          const booksObj = {};
          books.forEach(book => { booksObj[book.id] = book; });
          newState.books = booksObj;
        } else if (storeName === 'statRegistry') {
          newState.statRegistry = await db.getAll('statRegistry');
        }
        undoRedoManager.saveState(newState, action);
        updateUndoRedoInfo();
      }
    } catch (error) {
      console.error(`Error saving to ${storeName}:`, error);
    }
  };

  // Effect to handle selection fallback after delete (must be before early return)
  useEffect(() => {
      if (worldState && !worldState.actors.find(a => a.id === selectedActorId)) {
          if (worldState.actors.length > 0) {
              setSelectedActorId(worldState.actors[0].id);
          } else {
              setSelectedActorId(null);
          }
      }
  }, [worldState, selectedActorId]);

  if (isLoading || !worldState) {
    return (
      <div className="grimguff-app min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 animate-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="text-white text-xl font-bold mb-2">GRIMGUFF TRACKER</div>
          <div className="text-slate-400 text-sm mb-6">Initializing your story world...</div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse transition-all duration-500" style={{width: '60%'}}></div>
          </div>
          <div className="mt-4">
            <LoadingSkeleton.Text lines={2} className="mx-auto max-w-xs" />
          </div>
        </div>
      </div>
    );
  }

  // Helpers
  const getRawActor = () => {
    let base = worldState.actors.find(a => a.id === selectedActorId);
    if (!base && worldState.actors.length > 0) return worldState.actors[0]; 
    if (!base) return null;

    const snapKey = `${bookTab}_${currentChapter}`;
    const snapshot = base.snapshots?.[snapKey];
    return snapshot ? { ...base, ...snapshot, isSnapshot: true } : { ...base, isSnapshot: false };
  };

  const rawActor = getRawActor();
  const calculatedActor = rawActor ? calculateActorState(rawActor, worldState.itemBank, worldState.skillBank) : null;

  // Handlers
  const updateBaseStat = async (stat, val) => {
    if (!rawActor) return;
    const updatedActor = { ...rawActor, baseStats: { ...rawActor.baseStats, [stat]: val } };
    await saveToDatabase('actors', updatedActor, `Update ${rawActor.name} ${stat}`);
    setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
  };
  
  const updateSkillVal = async (skillId, val) => {
      if (!rawActor) return;
      const updatedActor = { ...rawActor, activeSkills: rawActor.activeSkills.map(s => s.id === skillId ? {...s, val: val} : s) };
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
  }

  const addItemToActor = async (itemId) => {
      if (!rawActor) return;
      const updatedActor = { ...rawActor, inventory: [...rawActor.inventory, itemId] };
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
      setPickerMode(null);
  };

  const removeItemFromActor = async (index) => {
      if (!rawActor) return;
      const newInv = [...rawActor.inventory];
      newInv.splice(index, 1);
      const updatedActor = { ...rawActor, inventory: newInv };
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
  };

  const removeSkillFromActor = async (index) => {
      if (!rawActor) return;
      const newSkills = [...rawActor.activeSkills];
      newSkills.splice(index, 1);
      const updatedActor = { ...rawActor, activeSkills: newSkills };
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
  }

  const addSkillToActor = async (skillId) => {
      if (!rawActor) return;
      if (rawActor.activeSkills.find(s => s.id === skillId)) { setPickerMode(null); return; }
      const updatedActor = { ...rawActor, activeSkills: [...rawActor.activeSkills, {id: skillId, val: 1}] };
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
      setPickerMode(null);
  };

  // @deprecated - Snapshots are no longer used, data comes from timelineEvents
  const saveSnapshot = async () => {
    if (!rawActor) return;
    const snapKey = `${bookTab}_${currentChapter}`;
    
    // Save EVERYTHING - complete actor state
    const snapshotData = {
      // Actor identity
      id: rawActor.id,
      name: rawActor.name,
      role: rawActor.role,
      class: rawActor.class,
      desc: rawActor.desc || '',
      
      // Stats
      baseStats: { ...rawActor.baseStats },
      additionalStats: rawActor.additionalStats ? JSON.parse(JSON.stringify(rawActor.additionalStats)) : {},
      
      // Skills & Items
      activeSkills: [...(rawActor.activeSkills || [])],
      inventory: [...(rawActor.inventory || [])],
      equipment: rawActor.equipment ? JSON.parse(JSON.stringify(rawActor.equipment)) : {
        helm: null, cape: null, amulet: null, armour: null, gloves: null, belt: null, boots: null,
        leftHand: null, rightHand: null, rings: [null, null, null, null, null, null, null], charms: [null, null, null, null]
      },
      
      // AI-generated data
      biography: rawActor.biography || '',
      arcMilestones: rawActor.arcMilestones ? JSON.parse(JSON.stringify(rawActor.arcMilestones)) : {},
      appearances: rawActor.appearances ? JSON.parse(JSON.stringify(rawActor.appearances)) : {},
      
      // Metadata
      snapshotTimestamp: Date.now(),
      bookId: bookTab,
      chapterId: currentChapter
    };
    
    // Save to database
    await db.saveSnapshot(rawActor.id, bookTab, currentChapter, snapshotData);
    
    // Update local state
    const updatedActor = { ...rawActor, snapshots: { ...rawActor.snapshots, [snapKey]: snapshotData } };
    await saveToDatabase('actors', updatedActor);
    setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
    toastService.success(`Complete snapshot saved for ${rawActor.name} at Book ${bookTab}, Chapter ${currentChapter}.`);
  };

  const handleCreate = async (data) => {
      if (creatorMode === 'actor') {
          const newActor = {
              id: `act_${Date.now()}`, 
              name: data.name, 
              role: data.role, 
              class: data.actorClass, 
              desc: data.desc, 
              nicknames: data.nicknames || [], // Array of alternate names/aliases
              isFav: false,
              baseStats: data.baseStats || { STR: 10, VIT: 10, INT: 10, DEX: 10 }, 
              additionalStats: {}, 
              activeSkills: [], 
              inventory: [], 
              snapshots: {},
              equipment: {
                helm: null,
                cape: null,
                amulet: null,
                armour: null,
                gloves: null,
                belt: null,
                boots: null,
                leftHand: null,
                rightHand: null,
                rings: [null, null, null, null, null, null, null],
                charms: [null, null, null, null]
              },
              appearances: {}, biography: '', arcMilestones: {}, lastConsistencyCheck: null, aiSuggestions: []
          };
          await db.add('actors', newActor);
          const newState = {...worldState, actors: [...worldState.actors, newActor]};
          setWorldState(newState);
          undoRedoManager.saveState(newState, `Create Actor: ${data.name}`);
          updateUndoRedoInfo();
          setSelectedActorId(newActor.id);
      } else if (creatorMode === 'stat') {
          const newStat = { id: `st_${Date.now()}`, key: data.key, name: data.name, desc: data.desc, color: data.color, isCore: data.isCore };
          await db.add('statRegistry', newStat);
          const newState = {...worldState, statRegistry: [...worldState.statRegistry, newStat]};
          setWorldState(newState);
          undoRedoManager.saveState(newState, `Create Stat: ${data.name}`);
          updateUndoRedoInfo();
      } else {
        const type = creatorMode;
        const bankKey = type === 'skill' ? 'skillBank' : 'itemBank';
        
        // Check if editing (data has id and exists in bank)
        const existingItem = worldState[bankKey].find(i => i.id === data.id);
        
        if (existingItem) {
          // Update existing item
          const updatedItem = { ...existingItem, ...data };
          await db.update(bankKey, updatedItem);
          const newState = {
            ...worldState, 
            [bankKey]: worldState[bankKey].map(i => i.id === data.id ? updatedItem : i)
          };
          setWorldState(newState);
          undoRedoManager.saveState(newState, `Update ${type === 'skill' ? 'Skill' : 'Item'}: ${data.name}`);
          updateUndoRedoInfo();
          toastService.success(`${type === 'skill' ? 'Skill' : 'Item'} updated successfully!`);
        } else {
          // Create new item
        const newItem = { 
            id: data.id || `${type}_${Date.now()}`, 
            name: data.name, 
            desc: data.desc, 
            type: data.type,
            stats: data.stats, 
            statMod: data.stats, 
            grantsSkills: data.grantsSkills || [], 
            quests: data.quests || '', 
            debuffs: data.debuffs || '',
            rarity: data.rarity || 'Common', 
            baseType: data.baseType || data.type,
            imagePath: data.imagePath || null,
            symbolPath: data.symbolPath || null,
            equipmentSlot: data.equipmentSlot || null
        };
        await db.add(bankKey, newItem);
        const newState = {...worldState, [bankKey]: [...worldState[bankKey], newItem]};
        setWorldState(newState);
        undoRedoManager.saveState(newState, `Create ${type === 'skill' ? 'Skill' : 'Item'}: ${data.name}`);
        updateUndoRedoInfo();
          toastService.success(`${type === 'skill' ? 'Skill' : 'Item'} created successfully!`);
        }
      }
      setCreatorMode(null);
  };

  const deleteBankItem = async (type, id) => {
    if(!window.confirm("Delete this item permanently?")) return;
    const bankKey = type === 'skill' ? 'skillBank' : 'itemBank';
    const item = worldState[bankKey].find(i => i.id === id);
    await db.delete(bankKey, id);
    const newState = {...worldState, [bankKey]: worldState[bankKey].filter(i => i.id !== id)};
    setWorldState(newState);
    undoRedoManager.saveState(newState, `Delete ${type === 'skill' ? 'Skill' : 'Item'}: ${item?.name || id}`);
    updateUndoRedoInfo();
  };

  const deleteStat = async (id) => {
      if(!window.confirm("Delete this stat?")) return;
      await db.delete('statRegistry', id);
      setWorldState(prev => ({
          ...prev, 
          statRegistry: prev.statRegistry.filter(s => s.id !== id)
      }));
  }

  const deleteActor = async (id) => {
      if(!window.confirm("Delete this actor?")) return;
      await db.delete('actors', id);
      setWorldState(prev => {
          const newActors = prev.actors.filter(a => a.id !== id);
          return {...prev, actors: newActors};
      });
  }


  // Bible Handlers
  const toggleBook = (id) => setExpandedBooks(prev => ({...prev, [id]: !prev[id]}));
  const toggleChapter = (id) => setExpandedChapters(prev => ({...prev, [id]: !prev[id]}));
  
  const addBook = async () => {
      const nextId = Math.max(...Object.keys(worldState.books).map(Number), 0) + 1;
      const newBook = {id: nextId, title: `Book ${nextId}`, focus: "Overview", chapters: []};
      
      // Auto-generate book symbol
      try {
        const symbolPath = await imageGenerationService.generateBookSymbol(newBook);
        newBook.symbolPath = symbolPath;
      } catch (error) {
        console.error('Failed to generate book symbol:', error);
        // Continue without symbol if generation fails
      }
      
      await db.add('books', newBook);
      setWorldState(prev => ({
          ...prev, 
          books: {...prev.books, [nextId]: newBook}
      }));
  }
  
  const removeBook = async (id) => {
      if(!window.confirm("Delete book?")) return;
      await db.delete('books', id);
      setWorldState(prev => {
          const newBooks = {...prev.books}; 
          delete newBooks[id]; 
          return {...prev, books: newBooks};
      });
  }
  
  const addChapter = async (bId) => {
      const book = worldState.books[bId];
      const nextId = (book.chapters.length ? Math.max(...book.chapters.map(c=>c.id)) : 0) + 1;
      const newChap = {id: nextId, title: `Chapter ${nextId}`, desc: "Overview", script: ""};
      
      // Auto-generate chapter symbol
      try {
        const symbolPath = await imageGenerationService.generateChapterSymbol(newChap, book.title);
        newChap.symbolPath = symbolPath;
      } catch (error) {
        console.error('Failed to generate chapter symbol:', error);
        // Continue without symbol if generation fails
      }
      
      const updatedBook = {...book, chapters: [...book.chapters, newChap]};
      await db.update('books', updatedBook);
      setWorldState(prev => ({ ...prev, books: {...prev.books, [bId]: updatedBook} }));
  }
  
  const removeChapter = async (bId, cId) => {
      if(!window.confirm("Delete chapter?")) return;
      const book = worldState.books[bId];
      const updatedBook = {...book, chapters: book.chapters.filter(c=>c.id !== cId)};
      await db.update('books', updatedBook);
      setWorldState(prev => ({ ...prev, books: {...prev.books, [bId]: updatedBook} }));
  }

  const reorderChapters = async (bookId, draggedChapterId, targetChapterId) => {
    const book = worldState.books[bookId];
    if (!book || !draggedChapterId || !targetChapterId) return;
    
    const chapters = [...book.chapters];
    const draggedIndex = chapters.findIndex(c => c.id === draggedChapterId);
    const targetIndex = chapters.findIndex(c => c.id === targetChapterId);
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;
    
    // Remove dragged chapter and insert at target position
    const [draggedChapter] = chapters.splice(draggedIndex, 1);
    chapters.splice(targetIndex, 0, draggedChapter);
    
    // Auto-renumber chapters (update display order, but keep IDs)
    // Note: We keep the original IDs for snapshot tracking, but update the order
    const updatedBook = { ...book, chapters };
    await db.update('books', updatedBook);
    setWorldState(prev => ({ ...prev, books: {...prev.books, [bookId]: updatedBook} }));
  }

  // Check if a chapter has snapshots
  const hasSnapshots = (bookId, chapterId) => {
    return worldState.actors.some(actor => {
      const snapKey = `${bookId}_${chapterId}`;
      return actor.snapshots && actor.snapshots[snapKey];
    });
  }

  // Get snapshot count for a chapter
  const getSnapshotCount = (bookId, chapterId) => {
    const snapKey = `${bookId}_${chapterId}`;
    return worldState.actors.filter(actor => actor.snapshots && actor.snapshots[snapKey]).length;
  }
  
  const startEdit = (id, title, text) => { setEditingId(id); setTempTitle(title); setTempText(text); }
  
  const saveEdit = async (type, bId, cId = null) => {
      const books = {...worldState.books};
      if (type === 'book') { 
        books[bId].title = tempTitle; 
        books[bId].focus = tempText;
        await db.update('books', books[bId]);
      } 
      else if (type === 'chap') { 
        const cIdx = books[bId].chapters.findIndex(c => c.id === cId); 
        if(cIdx >= 0) { 
          books[bId].chapters[cIdx].title = tempTitle; 
          books[bId].chapters[cIdx].desc = tempText;
          await db.update('books', books[bId]);
        } 
      } 
      else if (type === 'script') { 
        const cIdx = books[bId].chapters.findIndex(c => c.id === cId); 
        if(cIdx >= 0) {
          books[bId].chapters[cIdx].script = tempText;
          await db.update('books', books[bId]);
        }
      }
      setWorldState(prev => ({ ...prev, books }));
      setEditingId(null);
  }

  const generateChapter = async () => {
    const bookData = worldState.books[genBook];
    const chapInfo = bookData.chapters.find(c => c.id === genChap) || { title: `Chapter ${genChap}`, desc: "Standard Progression", script: "" };
    const partyContext = worldState.actors.filter(a => activeCast.includes(a.id)).map(a => {
        const snapKey = `${genBook}_${genChap}`; const snap = a.snapshots?.[snapKey] || a;
        const calc = calculateActorState(snap, worldState.itemBank, worldState.skillBank);
        return `${a.name}: STR ${calc.computedStats.STR} (Inv: ${a.inventory.length})`;
    }).join('\n   - ');
    const prompt = `Omniscience Engine V22.\nCONTEXT: ${bookData.title} -> ${chapInfo.title}\nFOCUS: ${bookData.focus}\nBEAT: ${chapInfo.desc}\nNOTE: ${userNote}\nCAST: ${partyContext}\nTask: Write narrative brief + draft opening. Tone: Bureaucratic Fantasy.`;
    setIsGen(true);
    try {
      const result = await aiService.callGemini(prompt);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsGen(false);
    }
  };

  // Picker Modal Component
  const PickerModal = ({ title, items, onSelect, onClose }) => {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("name");

    const filteredItems = items
        .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type));

  return (
      <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-green-500 w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-slate-800 bg-green-900/20">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white flex items-center"><Database className="mr-2 w-4 h-4"/> {title}</h3>
                <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white"/></button>
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2 w-3 h-3 text-slate-500"/>
                    <input className="w-full bg-slate-950 border border-slate-700 rounded pl-7 py-1 text-xs text-white" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
                <select className="bg-slate-950 border border-slate-700 rounded text-xs text-white px-2" value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="name">Name</option>
                    <option value="type">Type</option>
                </select>
            </div>
          </div>
          <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
            {filteredItems.map(item => (
              <button key={item.id} onClick={() => onSelect(item.id)} className="w-full text-left p-3 hover:bg-slate-800 border-b border-slate-800/50 last:border-0 flex justify-between items-center group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-green-400">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
                {item.stats && <div className="text-[10px] font-mono text-slate-400">{Object.keys(item.stats).join(', ')}</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Creator Modal Components
  const StatCreatorModal = ({ onClose, onSave }) => {
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [desc, setDesc] = useState("");
    const [color, setColor] = useState("green");
    const [isCore, setIsCore] = useState(false);

    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500 w-full max-w-sm rounded-lg p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">NEW STAT DEFINITION</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">FULL NAME</label>
                        <input className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Strength" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">KEY (ABBREVIATION)</label>
                        <input className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white uppercase" value={key} onChange={e => setKey(e.target.value.toUpperCase())} placeholder="e.g. STR" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">DESCRIPTION</label>
                        <textarea className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 block mb-1">COLOR</label>
                            <select className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white" value={color} onChange={e => setColor(e.target.value)}>
                                <option value="green">Green (Physical)</option>
                                <option value="blue">Blue (Mental)</option>
                                <option value="red">Red (Aggro)</option>
                                <option value="purple">Purple (Special)</option>
                                <option value="yellow">Yellow (Speed)</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-5">
                            <input type="checkbox" checked={isCore} onChange={e => setIsCore(e.target.checked)} className="mr-2"/>
                            <span className="text-sm text-white">Core Stat?</span>
                        </div>
                    </div>
                    <button onClick={() => onSave({key, name, desc, color, isCore})} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded mt-4">CREATE STAT</button>
                    <button onClick={onClose} className="w-full text-slate-500 text-xs mt-2 hover:text-white">CANCEL</button>
                </div>
          </div>
        </div>
    )
  }

  const CreatorModal = ({ type, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [role, setRole] = useState("");
    const [nicknames, setNicknames] = useState(""); // Comma-separated nicknames
    const [actorClass, setActorClass] = useState("Protagonist");
    const [suggestedStats, setSuggestedStats] = useState(null);
    const [suggestedRoleClass, setSuggestedRoleClass] = useState(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [baseStats, setBaseStats] = useState({ STR: 10, VIT: 10, INT: 10, DEX: 10 });

    // Auto-suggest when name/role/class/desc changes
    useEffect(() => {
      if (type === 'actor' && (name || role || actorClass || desc)) {
        const timeoutId = setTimeout(async () => {
          setIsLoadingSuggestions(true);
          try {
            // Feature 5: Suggest stats
            const statSuggestion = await aiService.suggestActorStats(
              { name, role, actorClass, desc },
              worldState.statRegistry,
              worldState.actors
            );
            if (statSuggestion.suggestedStats && Object.keys(statSuggestion.suggestedStats).length > 0) {
              setSuggestedStats(statSuggestion);
              setBaseStats(statSuggestion.suggestedStats);
            }

            // Feature 8: Suggest role/class
            const roleClassSuggestion = await aiService.suggestRoleClass(
              { name, desc, role, actorClass },
              worldState
            );
            if (roleClassSuggestion.suggestedRole || roleClassSuggestion.suggestedClass) {
              setSuggestedRoleClass(roleClassSuggestion);
            }
          } catch (error) {
            console.error('Error getting suggestions:', error);
          } finally {
            setIsLoadingSuggestions(false);
          }
        }, 1000); // Debounce 1 second

        return () => clearTimeout(timeoutId);
      }
    }, [name, role, actorClass, desc, type]);

    const applyStatSuggestion = () => {
      if (suggestedStats) {
        setBaseStats(suggestedStats.suggestedStats);
      }
    };

    const applyRoleClassSuggestion = () => {
      if (suggestedRoleClass) {
        if (suggestedRoleClass.suggestedRole) setRole(suggestedRoleClass.suggestedRole);
        if (suggestedRoleClass.suggestedClass) setActorClass(suggestedRoleClass.suggestedClass);
      }
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-green-500 w-full max-w-md rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">CREATE NEW ACTOR</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">NAME</label>
                        <input className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">CLASS</label>
                        <div className="flex gap-2">
                          <select className="flex-1 bg-slate-950 border border-slate-700 p-2 rounded text-white" value={actorClass} onChange={e => setActorClass(e.target.value)}>
                            <option value="Protagonist">Protagonist</option>
                            <option value="Ally">Ally</option>
                            <option value="NPC">NPC</option>
                            <option value="Threat">Threat</option>
                        </select>
                          {suggestedRoleClass?.suggestedClass && suggestedRoleClass.suggestedClass !== actorClass && (
                            <button 
                              onClick={applyRoleClassSuggestion}
                              className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800 hover:bg-blue-900/50 flex items-center"
                              title={suggestedRoleClass.reasoning}
                            >
                              <Sparkles className="w-3 h-3 mr-1"/> AI: {suggestedRoleClass.suggestedClass}
                            </button>
                          )}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">ROLE (e.g. "The Fallen Knight")</label>
                        <div className="flex gap-2">
                          <input className="flex-1 bg-slate-950 border border-slate-700 p-2 rounded text-white" value={role} onChange={e => setRole(e.target.value)} />
                          {suggestedRoleClass?.suggestedRole && suggestedRoleClass.suggestedRole !== role && (
                            <button 
                              onClick={applyRoleClassSuggestion}
                              className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800 hover:bg-blue-900/50 flex items-center"
                              title={suggestedRoleClass.reasoning}
                            >
                              <Sparkles className="w-3 h-3 mr-1"/> AI
                            </button>
                          )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 block mb-1">NICKNAMES / ALIASES (comma-separated)</label>
                        <input 
                          className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white" 
                          value={nicknames} 
                          onChange={e => setNicknames(e.target.value)} 
                          placeholder="e.g. boss, the knight, fat cunt"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Helps AI recognize when this character is mentioned by other names</p>
                    </div>

          <div>
                        <label className="text-xs text-slate-500 block mb-1">DESCRIPTION</label>
                        <textarea className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>

                    {/* AI Stat Suggestions */}
                    {suggestedStats && (
                      <div className="bg-blue-900/20 border border-blue-800 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-blue-400 flex items-center">
                            <Sparkles className="w-3 h-3 mr-1"/> AI SUGGESTED STATS
                          </span>
                          <button 
                            onClick={applyStatSuggestion}
                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Apply
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">{suggestedStats.reasoning}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(suggestedStats.suggestedStats).map(([stat, val]) => (
                            <div key={stat} className="flex justify-between text-xs">
                              <span className="text-slate-300">{stat}:</span>
                              <span className="text-blue-400 font-bold">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isLoadingSuggestions && (
                      <div className="text-xs text-slate-500 flex items-center">
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin"/> Getting AI suggestions...
                      </div>
                    )}

                    <button onClick={() => onSave({
                      name, 
                      desc, 
                      role, 
                      actorClass, 
                      baseStats,
                      nicknames: nicknames.split(',').map(n => n.trim()).filter(n => n.length > 0)
                    })} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-4">SAVE</button>
                    <button onClick={onClose} className="w-full text-slate-500 text-xs mt-2 hover:text-white">CANCEL</button>
                </div>
            </div>
        </div>
    )
  }

  // Keyboard Shortcuts Modal Component
  const KeyboardShortcutsModal = ({ onClose }) => {
    const shortcuts = [
      { category: 'General', items: [
        { keys: 'Ctrl+Z', action: 'Undo last action' },
        { keys: 'Ctrl+Y', action: 'Redo last action' },
        { keys: 'Ctrl+S', action: 'Save current work' },
        { keys: 'Ctrl+/', action: 'Show this help' },
        { keys: 'Ctrl+K', action: 'Open global search' },
        { keys: 'Esc', action: 'Close modal/panel' },
      ]},
      { category: 'Navigation', items: [
        { keys: 'Ctrl+1', action: 'Go to Personnel tab' },
        { keys: 'Ctrl+2', action: 'Go to Stat Registry' },
        { keys: 'Ctrl+3', action: 'Go to Skill Tree' },
        { keys: 'Ctrl+4', action: 'Go to Item Vault' },
        { keys: 'Ctrl+5', action: 'Go to Writers Room' },
        { keys: 'Ctrl+6', action: 'Go to Series Bible' },
      ]},
      { category: 'Editing', items: [
        { keys: 'Enter', action: 'Confirm/Save' },
        { keys: 'Tab', action: 'Next field' },
        { keys: 'Shift+Tab', action: 'Previous field' },
        { keys: 'Arrow Keys', action: 'Navigate sliders (+Shift for ×5, +Ctrl for ×10)' },
      ]},
      { category: 'Visualization', items: [
        { keys: 'Space+Drag', action: 'Pan canvas' },
        { keys: 'Scroll', action: 'Zoom in/out' },
        { keys: '+/-', action: 'Zoom controls' },
      ]},
    ];

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-slate-900 border border-green-500/50 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Keyboard Shortcuts</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            {shortcuts.map(category => (
              <div key={category.category}>
                <h4 className="text-sm font-bold text-green-400 mb-3">{category.category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {category.items.map((shortcut, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-950 rounded">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-green-400 min-w-[80px] text-center">
                        {shortcut.keys}
                      </kbd>
                      <span className="text-sm text-slate-300">{shortcut.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-green-400">Ctrl+/</kbd> anytime to show this help</p>
          </div>
        </div>
      </div>
    );
  };

  // Tag Input Modal Component
  const TagInputModal = ({ target, value, onChange, onSave, onClose }) => {
    if (!target) return null;
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (value.trim()) {
        onSave(target.bookId, target.chapterId, value.trim());
        onChange('');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-slate-900 border border-green-500/50 rounded-lg p-6 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-white mb-4">Add Chapter Tag</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter tag..."
              className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded mb-4 focus:border-green-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!value.trim()}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded disabled:opacity-50"
              >
                ADD TAG
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Renderers
  const renderPersonnel = () => {
    const coreStats = worldState.statRegistry.filter(s => s.isCore);
    const additionalStats = worldState.statRegistry.filter(s => !s.isCore);

    // Filter and search actors
    const filteredActors = worldState.actors.filter(actor => {
      const matchesSearch = !personnelSearch || 
        actor.name.toLowerCase().includes(personnelSearch.toLowerCase()) ||
        actor.class?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
        actor.role?.toLowerCase().includes(personnelSearch.toLowerCase());
      const matchesClass = personnelFilter.class === 'all' || actor.class === personnelFilter.class;
      const matchesRole = personnelFilter.role === 'all' || actor.role === personnelFilter.role;
      return matchesSearch && matchesClass && matchesRole;
    });

    // Item action handlers - defined at top level for accessibility
    const handleItemActionEquip = (item) => {
      if (!rawActor) return;
      const equipment = rawActor.equipment || {
        helm: null, cape: null, amulet: null, armour: null, gloves: null, belt: null, boots: null,
        leftHand: null, rightHand: null, rings: [null, null, null, null, null, null, null], charms: [null, null, null, null]
      };
      const slotInfo = findCompatibleEquipmentSlot(item, equipment);
      if (slotInfo) {
        if (slotInfo.index !== null) {
          const updatedEquipment = { ...equipment };
          if (slotInfo.slot === 'rings') {
            updatedEquipment.rings = [...updatedEquipment.rings];
            updatedEquipment.rings[slotInfo.index] = item.id;
          } else if (slotInfo.slot === 'charms') {
            updatedEquipment.charms = [...updatedEquipment.charms];
            updatedEquipment.charms[slotInfo.index] = item.id;
          }
          const updatedActor = { ...rawActor, equipment: updatedEquipment };
          saveToDatabase('actors', updatedActor);
          setWorldState(prev => ({
            ...prev,
            actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
          }));
          toastService.success(`Equipped ${item.name}`);
        } else {
          if (equipment[slotInfo.slot]) {
            toastService.warning(`Slot ${slotInfo.slot} is already filled. Use "Equip (Replace)" to replace it.`);
          } else {
            const updatedEquipment = { ...equipment };
            updatedEquipment[slotInfo.slot] = item.id;
            const updatedActor = { ...rawActor, equipment: updatedEquipment };
            saveToDatabase('actors', updatedActor);
            setWorldState(prev => ({
              ...prev,
              actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
            }));
            toastService.success(`Equipped ${item.name}`);
          }
        }
      } else {
        toastService.warning('No compatible slot found for this item.');
      }
    };

    const handleItemActionEquipReplace = (item) => {
      if (!rawActor) return;
      const equipment = rawActor.equipment || {
        helm: null, cape: null, amulet: null, armour: null, gloves: null, belt: null, boots: null,
        leftHand: null, rightHand: null, rings: [null, null, null, null, null, null, null], charms: [null, null, null, null]
      };
      const slotInfo = findCompatibleEquipmentSlot(item, equipment);
      if (slotInfo) {
        if (slotInfo.index !== null) {
          const updatedEquipment = { ...equipment };
          if (slotInfo.slot === 'rings') {
            updatedEquipment.rings = [...updatedEquipment.rings];
            updatedEquipment.rings[slotInfo.index] = item.id;
          } else if (slotInfo.slot === 'charms') {
            updatedEquipment.charms = [...updatedEquipment.charms];
            updatedEquipment.charms[slotInfo.index] = item.id;
          }
          const updatedActor = { ...rawActor, equipment: updatedEquipment };
          saveToDatabase('actors', updatedActor);
          setWorldState(prev => ({
            ...prev,
            actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
          }));
          toastService.success(`Equipped ${item.name}`);
        } else {
          const oldItemId = equipment[slotInfo.slot];
          if (oldItemId) {
            const updatedActor = { ...rawActor };
            if (!updatedActor.inventory.includes(oldItemId)) {
              updatedActor.inventory = [...updatedActor.inventory, oldItemId];
            }
            const updatedEquipment = { ...equipment };
            updatedEquipment[slotInfo.slot] = item.id;
            updatedActor.equipment = updatedEquipment;
            saveToDatabase('actors', updatedActor);
            setWorldState(prev => ({
              ...prev,
              actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
            }));
            toastService.success(`Replaced item in ${slotInfo.slot}`);
          } else {
            const updatedEquipment = { ...equipment };
            updatedEquipment[slotInfo.slot] = item.id;
            const updatedActor = { ...rawActor, equipment: updatedEquipment };
            saveToDatabase('actors', updatedActor);
            setWorldState(prev => ({
              ...prev,
              actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
            }));
            toastService.success(`Equipped ${item.name}`);
          }
        }
      } else {
        toastService.warning('No compatible slot found for this item.');
      }
    };

    const handleItemActionRemove = async (item) => {
      if (!rawActor) return;
      const updatedActor = { ...rawActor };
      updatedActor.inventory = updatedActor.inventory.filter(id => id !== item.id);
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({
        ...prev,
        actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
      }));
      toastService.success(`Removed ${item.name} from inventory`);
    };

    const handleItemActionViewDetails = (item) => {
      setHoveredItem(item);
      setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    };

    // Get unique classes and roles for filters
    const uniqueClasses = [...new Set(worldState.actors.map(a => a.class).filter(Boolean))];
    const uniqueRoles = [...new Set(worldState.actors.map(a => a.role).filter(Boolean))];

    // Bulk stat update handler
    const applyBulkStatChanges = async () => {
      if (selectedActors.size === 0) {
        toastService.warning('No actors selected');
        return;
      }
      if (Object.keys(bulkStatChanges).length === 0) {
        toastService.warning('No stat changes specified');
        return;
      }

      try {
        for (const actorId of selectedActors) {
          const actor = worldState.actors.find(a => a.id === actorId);
          if (actor) {
            const updatedActor = {
              ...actor,
              baseStats: {
                ...actor.baseStats,
                ...Object.fromEntries(
                  Object.entries(bulkStatChanges).map(([stat, change]) => [
                    stat,
                    (actor.baseStats[stat] || 0) + change
                  ])
                )
              }
            };
            await db.update('actors', updatedActor);
            setWorldState(prev => ({
              ...prev,
              actors: prev.actors.map(a => a.id === actorId ? updatedActor : a)
            }));
          }
        }
        toastService.success(`Applied stat changes to ${selectedActors.size} actors`);
        setBulkStatChanges({});
        setSelectedActors(new Set());
      } catch (error) {
        toastService.error(`Failed to apply bulk changes: ${error.message}`);
      }
    };

    return (
    <div className="flex flex-col h-full animate-in fade-in relative overflow-hidden">
        {pickerMode && pickerMode !== 'equipment' && <PickerModal title={pickerMode === 'item' ? "Item Vault" : "Skill Tree"} items={pickerMode === 'item' ? worldState.itemBank : worldState.skillBank} onSelect={pickerMode === 'item' ? addItemToActor : addSkillToActor} onClose={() => setPickerMode(null)} />}
        {creatorMode === 'actor' && <CreatorModal type="actor" onClose={()=>setCreatorMode(null)} onSave={handleCreate}/>}
        
        <div className="flex justify-between items-center mb-4 bg-slate-900 p-4 rounded border border-slate-800">
            <div className="flex items-center space-x-4 flex-wrap">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="mr-3 text-green-500" /> PERSONNEL
              </h2>
              <Tooltip content="Create a new character with stats, skills, and equipment" position="bottom">
              <button onClick={() => setCreatorMode('actor')} className="text-xs flex items-center bg-blue-900/30 text-blue-300 px-3 py-1 rounded border border-blue-800 hover:bg-blue-900/50">
                <UserPlus className="w-3 h-3 mr-2"/> ADD ACTOR
              </button>
              </Tooltip>
              <Tooltip content="AI scans all chapters to detect new characters mentioned in your story" position="bottom">
              <button 
                onClick={async () => {
                  setShowCharacterDetection(true);
                  setIsLoadingSuggestions(true);
                  try {
                    // Collect all chapter text
                    const allText = Object.values(worldState.books).flatMap(book => 
                      book.chapters.map(ch => `Book ${book.id}, Chapter ${ch.id}: ${ch.title}\n${ch.script || ch.desc || ''}`)
                    ).join('\n\n');
                    const result = await aiService.detectCharactersInText(allText, worldState.actors);
                    setDetectedCharacters(result.characters || []);
                  } catch (error) {
                    toastService.error(`Character detection failed: ${error.message}`);
                  } finally {
                    setIsLoadingSuggestions(false);
                  }
                }}
                className="text-xs flex items-center bg-purple-900/30 text-purple-300 px-3 py-1 rounded border border-purple-800 hover:bg-purple-900/50"
              >
                <Sparkles className="w-3 h-3 mr-2"/> SCAN FOR CHARACTERS
              </button>
              </Tooltip>
              <button 
                onClick={async () => {
                  if (!rawActor) {
                    toastService.warning('Select an actor first');
                    return;
                  }
                  setShowStatChanges(true);
                  setIsLoadingSuggestions(true);
                  try {
                    const currentBook = worldState.books[bookTab];
                    const currentCh = currentBook?.chapters.find(c => c.id === currentChapter);
                    if (currentCh?.script) {
                      const result = await aiService.extractStatChanges(
                        currentCh.script,
                        worldState.actors,
                        worldState.statRegistry
                      );
                      setStatChangeSuggestions(result.changes || []);
                    } else {
                      toastService.warning('No chapter text available');
                    }
                  } catch (error) {
                    toastService.error(`Stat extraction failed: ${error.message}`);
                  } finally {
                    setIsLoadingSuggestions(false);
                  }
                }}
                className="text-xs flex items-center bg-green-900/30 text-green-300 px-3 py-1 rounded border border-green-800 hover:bg-green-900/50"
              >
                <TrendingUp className="w-3 h-3 mr-2"/> EXTRACT STATS
              </button>
              <button 
                onClick={async () => {
                  if (!rawActor) {
                    toastService.warning('Select an actor first');
                    return;
                  }
                  setShowSkillItemSuggestions(true);
                  setIsLoadingSuggestions(true);
                  try {
                    const currentBook = worldState.books[bookTab];
                    const currentCh = currentBook?.chapters.find(c => c.id === currentChapter);
                    if (currentCh?.script) {
                      const result = await aiService.detectSkillItemAcquisitions(
                        currentCh.script,
                        rawActor.id,
                        worldState.itemBank,
                        worldState.skillBank
                      );
                      setSkillItemSuggestions(result.acquisitions || []);
                    } else {
                      toastService.warning('No chapter text available');
                    }
                  } catch (error) {
                    toastService.error(`Skill/Item detection failed: ${error.message}`);
                  } finally {
                    setIsLoadingSuggestions(false);
                  }
                }}
                className="text-xs flex items-center bg-orange-900/30 text-orange-300 px-3 py-1 rounded border border-orange-800 hover:bg-orange-900/50"
              >
                <Zap className="w-3 h-3 mr-2"/> DETECT SKILLS/ITEMS
              </button>
              <button 
                onClick={async () => {
                  if (!rawActor) {
                    toastService.warning('Select an actor first');
                    return;
                  }
                  setShowConsistencyCheck(true);
                  setIsLoadingSuggestions(true);
                  try {
                    const chapters = Object.values(worldState.books).flatMap(book => 
                      book.chapters.map(ch => ({
                        bookId: book.id,
                        chapterId: ch.id,
                        title: ch.title,
                        script: ch.script || ''
                      }))
                    );
                    const result = await aiService.checkCharacterConsistency(
                      rawActor.id,
                      rawActor.snapshots || {},
                      chapters
                    );
                    setConsistencyIssues(result);
                  } catch (error) {
                    toastService.error(`Consistency check failed: ${error.message}`);
                  } finally {
                    setIsLoadingSuggestions(false);
                  }
                }}
                className="text-xs flex items-center bg-red-900/30 text-red-300 px-3 py-1 rounded border border-red-800 hover:bg-red-900/50"
              >
                <AlertTriangle className="w-3 h-3 mr-2"/> CHECK CONSISTENCY
              </button>
              <Tooltip content="Analyze current chapter and update all mentioned actors' profiles with skills, stats, and relationships" position="bottom">
              <button 
                onClick={async () => {
                  if (!worldState || !worldState.books || !worldState.actors) {
                    toastService.warning('Data not loaded yet');
                    return;
                  }

                  const currentBook = worldState.books[bookTab];
                  const currentCh = currentBook?.chapters.find(c => c.id === currentChapter);
                  if (!currentCh) {
                    toastService.warning('Chapter not found');
                    return;
                  }
                  const chapterText = currentCh.script || currentCh.content || '';
                  if (chapterText.trim().length < 50) {
                    toastService.warning('Chapter text too short for analysis');
                    return;
                  }

                  // This button has been removed - entity extraction now happens automatically
                  // when saving chapters in the Writers Room via the Entity Extraction Wizard
                  toastService.info('Entity extraction now happens automatically when you save chapters in the Writers Room. Use the "Save & Extract" button there.');
                }}
                disabled={isAnalyzingChapter}
                className={`text-xs flex items-center px-3 py-1 rounded border ${
                  isAnalyzingChapter
                    ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                    : chapterAnalysisStatus?.needsReanalysis
                    ? 'bg-amber-900/30 text-amber-300 border-amber-800 hover:bg-amber-900/50'
                    : 'bg-indigo-900/30 text-indigo-300 border-indigo-800 hover:bg-indigo-900/50'
                }`}
              >
                {isAnalyzingChapter ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin"/> ANALYZING...
                  </>
                ) : chapterAnalysisStatus?.needsReanalysis ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2"/> RE-ANALYZE CHAPTER
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-2"/> ANALYZE CHAPTER
                  </>
                )}
              </button>
              </Tooltip>
              <div className="flex gap-2">
                <button
                  onClick={() => setPersonnelViewMode(personnelViewMode === 'standard' ? 'timeline' : 'standard')}
                  className={`text-xs px-3 py-1 rounded border ${
                    personnelViewMode === 'timeline' 
                      ? 'bg-green-900/30 text-green-300 border-green-800' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {personnelViewMode === 'timeline' ? 'Timeline View' : 'Standard View'}
                </button>
              </div>
            </div>
            <div className="flex space-x-2 items-center">
               <select value={bookTab} onChange={(e) => {
                 const newBookTab = Number(e.target.value);
                 setBookTab(newBookTab);
                 // Reset to first chapter of new book
                 const book = worldState.books[newBookTab];
                 if (book && book.chapters && book.chapters.length > 0) {
                   setCurrentChapter(book.chapters[0].id);
                 }
               }} className="bg-slate-800 text-white text-xs p-1 rounded border border-slate-700">{Object.keys(worldState.books).map(b => <option key={b} value={b}>Book {b}</option>)}</select>
               <select value={currentChapter} onChange={(e) => setCurrentChapter(Number(e.target.value))} className="bg-slate-800 text-white text-xs p-1 rounded border border-slate-700">
                 {worldState.books[bookTab]?.chapters.map((c, index) => (
                   <option key={c.id} value={c.id}>Ch {index + 1}: {c.title}</option>
                 )) || <option value={1}>Ch 1</option>}
               </select>
            </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 bg-slate-900 p-4 rounded border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={personnelSearch}
                onChange={(e) => setPersonnelSearch(e.target.value)}
                placeholder="Search actors..."
                className="w-full bg-slate-950 border border-slate-700 text-white pl-8 pr-2 py-2 rounded text-sm"
              />
            </div>
            <select
              value={personnelFilter.class}
              onChange={(e) => setPersonnelFilter({ ...personnelFilter, class: e.target.value })}
              className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <select
              value={personnelFilter.role}
              onChange={(e) => setPersonnelFilter({ ...personnelFilter, role: e.target.value })}
              className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {selectedActors.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{selectedActors.size} selected</span>
                <button
                  onClick={() => setSelectedActors(new Set())}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          
          {/* Bulk Operations Panel */}
          {selectedActors.size > 0 && (
            <div className="mt-4 p-3 bg-slate-950 border border-green-500/50 rounded">
              <div className="text-xs font-bold text-green-400 mb-2">BULK OPERATIONS</div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {coreStats.map(stat => (
                  <div key={stat.key} className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 w-12">{stat.key}:</label>
                    <input
                      type="number"
                      value={bulkStatChanges[stat.key] || 0}
                      onChange={(e) => setBulkStatChanges({ ...bulkStatChanges, [stat.key]: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs"
                      placeholder="+/-"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyBulkStatChanges}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded"
                >
                  Apply to {selectedActors.size} Selected
                </button>
                {selectedActors.size >= 2 && (
                  <button
                    onClick={async () => {
                      const actorsToMerge = Array.from(selectedActors).map(id => 
                        worldState.actors.find(a => a.id === id)
                      ).filter(Boolean);
                      
                      if (actorsToMerge.length < 2) {
                        toastService.error('Could not find all selected actors');
                        return;
                      }

                      // Choose primary actor (one with most data)
                      const primaryActor = actorsToMerge.reduce((prev, curr) => {
                        const prevData = (prev.activeSkills?.length || 0) + (prev.inventory?.length || 0);
                        const currData = (curr.activeSkills?.length || 0) + (curr.inventory?.length || 0);
                        return currData > prevData ? curr : prev;
                      });

                      const mergedActor = {
                        ...primaryActor,
                        nicknames: [
                          ...(primaryActor.nicknames || []),
                          ...actorsToMerge
                            .filter(a => a.id !== primaryActor.id)
                            .map(a => a.name)
                            .filter(name => name !== primaryActor.name)
                        ],
                        activeSkills: [
                          ...new Set([
                            ...(primaryActor.activeSkills || []).map(s => typeof s === 'string' ? s : (s.id || s)),
                            ...actorsToMerge.flatMap(a => (a.activeSkills || []).map(s => typeof s === 'string' ? s : (s.id || s)))
                          ])
                        ],
                        inventory: [
                          ...new Set([
                            ...(primaryActor.inventory || []),
                            ...actorsToMerge.flatMap(a => a.inventory || [])
                          ])
                        ],
                        baseStats: Object.keys(primaryActor.baseStats || {}).reduce((acc, stat) => {
                          acc[stat] = Math.max(
                            primaryActor.baseStats[stat] || 0,
                            ...actorsToMerge.map(a => a.baseStats?.[stat] || 0)
                          );
                          return acc;
                        }, {}),
                        snapshots: {
                          ...(primaryActor.snapshots || {}),
                          ...actorsToMerge.reduce((acc, a) => ({ ...acc, ...(a.snapshots || {}) }), {})
                        },
                        appearances: {
                          ...(primaryActor.appearances || {}),
                          ...actorsToMerge.reduce((acc, a) => ({ ...acc, ...(a.appearances || {}) }), {})
                        }
                      };

                      // Update primary actor
                      await saveToDatabase('actors', mergedActor);

                      // Update relationships
                      const allRelationships = await db.getAll('relationships');
                      for (const rel of allRelationships) {
                        const actor1Id = rel.actor1Id || rel.actors?.[0];
                        const actor2Id = rel.actor2Id || rel.actors?.[1];
                        let updated = false;

                        if (actorsToMerge.some(a => a.id === actor1Id) && actor1Id !== primaryActor.id) {
                          rel.actor1Id = primaryActor.id;
                          if (rel.actors) rel.actors[0] = primaryActor.id;
                          updated = true;
                        }
                        if (actorsToMerge.some(a => a.id === actor2Id) && actor2Id !== primaryActor.id) {
                          rel.actor2Id = primaryActor.id;
                          if (rel.actors) rel.actors[1] = primaryActor.id;
                          updated = true;
                        }

                        if (updated) {
                          await db.update('relationships', rel);
                        }
                      }

                      // Delete duplicate actors
                      for (const actor of actorsToMerge) {
                        if (actor.id !== primaryActor.id) {
                          await db.delete('actors', actor.id);
                        }
                      }

                      // Reload actors
                      const actors = await db.getAll('actors');
                      setWorldState(prev => ({ ...prev, actors }));
                      setSelectedActors(new Set());
                      if (selectedActorId && actorsToMerge.some(a => a.id === selectedActorId)) {
                        setSelectedActorId(primaryActor.id);
                      }

                      toastService.success(`Merged ${actorsToMerge.length} actors into ${primaryActor.name}`);
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Merge className="w-3 h-3" />
                    Merge {selectedActors.size} Actors
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6 h-full overflow-hidden">
            <div className="w-1/4 overflow-y-auto custom-scrollbar">
                {filteredActors.map(char => (
                    <EnhancedCharacterCard
                      key={char.id}
                      character={char}
                      isSelected={selectedActorId === char.id}
                      onSelect={() => setSelectedActorId(char.id)}
                      onDelete={() => deleteActor(char.id)}
                      worldState={worldState}
                      showCheckbox={true}
                      isChecked={selectedActors.has(char.id)}
                      onCheckboxChange={(checked) => {
                        const newSet = new Set(selectedActors);
                        if (checked) {
                          newSet.add(char.id);
                        } else {
                          newSet.delete(char.id);
                        }
                        setSelectedActors(newSet);
                      }}
                    />
                ))}
                {filteredActors.length === 0 && (
                  <div className="text-center text-slate-500 p-8">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No actors match filters</p>
                  </div>
                )}
            </div>
            <div className="w-3/4 overflow-y-auto custom-scrollbar pb-20">
                {rawActor ? (
                <div className={`bg-slate-900/90 border ${rawActor.isSnapshot ? 'border-green-500' : 'border-slate-700'} p-6 rounded-lg shadow-xl relative`}>
                     <div className="absolute top-4 right-4 flex items-center space-x-2 flex-wrap gap-2">
                        {rawActor.isSnapshot && <span className="text-[10px] text-green-500 font-mono flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> SAVED</span>}
                        <button 
                          onClick={async () => {
                            if (!rawActor) return;
                            setIsGeneratingActorImage(true);
                            try {
                              // Get current chapter context
                              const currentBook = worldState.books[bookTab];
                              const currentCh = currentBook?.chapters.find(c => c.id === currentChapter);
                              const chapterContext = currentCh?.script || currentCh?.desc || '';
                              
                              // Get equipped items
                              const equipment = {};
                              if (rawActor.equipment) {
                                Object.entries(rawActor.equipment).forEach(([slot, itemId]) => {
                                  if (itemId) {
                                    const item = Array.isArray(itemId) 
                                      ? itemId.map(id => worldState.itemBank.find(i => i.id === id)).filter(Boolean)
                                      : worldState.itemBank.find(i => i.id === itemId);
                                    if (item) equipment[slot] = item;
                                  }
                                });
                              }
                              
                              // Get skills
                              const skills = rawActor.activeSkills
                                ?.map(skill => worldState.skillBank.find(s => s.id === skill.id))
                                .filter(Boolean) || [];
                              
                              const context = {
                                equipment,
                                skills,
                                chapterContext,
                                chapterId: currentCh?.id
                              };
                              
                              const imagePath = await imageGenerationService.generateActorImage(rawActor, context);
                              
                              // Save image path to actor (store per chapter)
                              const imageKey = `image_${currentCh?.id || 'snapshot'}`;
                              const updatedActor = { 
                                ...rawActor, 
                                [imageKey]: imagePath,
                                imagePath: imagePath // Also set main image path
                              };
                              await saveToDatabase('actors', updatedActor);
                              setWorldState(prev => ({
                                ...prev,
                                actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                              }));
                              toastService.success('Actor image generated successfully!');
                            } catch (error) {
                              console.error('Actor image generation error:', error);
                              toastService.error(`Image generation failed: ${error.message}`);
                            } finally {
                              setIsGeneratingActorImage(false);
                            }
                          }}
                          disabled={isGeneratingActorImage}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded flex items-center disabled:opacity-50"
                        >
                          {isGeneratingActorImage ? <RefreshCw className="w-3 h-3 mr-1 animate-spin"/> : <ImageIcon className="w-3 h-3 mr-1" />}
                          {isGeneratingActorImage ? 'Generating...' : 'GENERATE IMAGE'}
                        </button>
                        <button 
                          onClick={async () => {
                            setIsGeneratingBiography(true);
                            try {
                              const chapters = Object.values(worldState.books).flatMap(book => 
                                book.chapters.filter(ch => {
                                  const text = (ch.script || ch.desc || '').toLowerCase();
                                  return text.includes(rawActor.name.toLowerCase());
                                }).map(ch => ({
                                  bookId: book.id,
                                  chapterId: ch.id,
                                  text: ch.script || ch.desc || ''
                                }))
                              );
                              const bio = await aiService.generateCharacterBiography(rawActor, chapters, worldState);
                              setCharacterBiography(bio);
                              // Update actor with biography
                              const updatedActor = { ...rawActor, biography: bio };
                              await saveToDatabase('actors', updatedActor);
                              setWorldState(prev => ({
                                ...prev,
                                actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                              }));
                            } catch (error) {
                              toastService.error(`Biography generation failed: ${error.message}`);
                            } finally {
                              setIsGeneratingBiography(false);
                            }
                          }}
                          disabled={isGeneratingBiography}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] px-3 py-1 rounded flex items-center disabled:opacity-50"
                        >
                          {isGeneratingBiography ? <RefreshCw className="w-3 h-3 mr-1 animate-spin"/> : <FileText className="w-3 h-3 mr-1"/>} {isGeneratingBiography ? 'Generating...' : 'GENERATE BIO'}
                        </button>
                        <button 
                          onClick={async () => {
                            setIsAnalyzingAppearances(true);
                            try {
                              const appearances = {};
                              for (const book of Object.values(worldState.books)) {
                                for (const chapter of book.chapters) {
                                  const text = chapter.script || chapter.desc || '';
                                  if (text.toLowerCase().includes(rawActor.name.toLowerCase())) {
                                    const analysis = await aiService.analyzeCharacterAppearances(text, rawActor.name);
                                    const key = `${book.id}_${chapter.id}`;
                                    appearances[key] = {
                                      bookId: book.id,
                                      chapterId: chapter.id,
                                      mentionCount: analysis.mentionCount,
                                      dialogueCount: analysis.dialogueCount,
                                      importance: analysis.importance,
                                      firstMention: analysis.firstMention,
                                      lastMention: analysis.lastMention,
                                      keyMoments: analysis.keyMoments
                                    };
                                  }
                                }
                              }
                              const updatedActor = { ...rawActor, appearances };
                              await saveToDatabase('actors', updatedActor);
                              setWorldState(prev => ({
                                ...prev,
                                actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                              }));
                              toastService.success('Appearance tracking updated');
                            } catch (error) {
                              toastService.error(`Appearance tracking failed: ${error.message}`);
                            } finally {
                              setIsAnalyzingAppearances(false);
                            }
                          }}
                          disabled={isAnalyzingAppearances}
                          className="bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] px-3 py-1 rounded flex items-center disabled:opacity-50"
                        >
                          {isAnalyzingAppearances ? <RefreshCw className="w-3 h-3 mr-1 animate-spin"/> : <Eye className="w-3 h-3 mr-1"/>} TRACK APPEARANCES
                        </button>
                        <button 
                          onClick={async () => {
                            setIsLoadingSuggestions(true);
                            try {
                              const chapters = Object.values(worldState.books).flatMap(book => 
                                book.chapters.map(ch => ({
                                  bookId: book.id,
                                  chapterId: ch.id,
                                  title: ch.title,
                                  script: ch.script || ''
                                }))
                              );
                              const arcData = await aiService.analyzeCharacterArc(rawActor.id, chapters, rawActor.snapshots || {});
                              if (arcData) {
                                const updatedActor = { ...rawActor, arcMilestones: arcData };
                                await saveToDatabase('actors', updatedActor);
                                setWorldState(prev => ({
                                  ...prev,
                                  actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                                }));
                                setCharacterArcData(arcData);
                                toastService.success(`Character arc analyzed: ${arcData.overallCompletion}% complete`);
                              }
                            } catch (error) {
                              toastService.error(`Arc analysis failed: ${error.message}`);
                            } finally {
                              setIsLoadingSuggestions(false);
                            }
                          }}
                          disabled={isLoadingSuggestions}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-3 py-1 rounded flex items-center disabled:opacity-50"
                        >
                          {isLoadingSuggestions ? <RefreshCw className="w-3 h-3 mr-1 animate-spin"/> : <BarChart2 className="w-3 h-3 mr-1"/>} ANALYZE ARC
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              const currentBook = worldState.books[bookTab];
                              const currentCh = currentBook?.chapters.find(c => c.id === currentChapter);
                              const snapKey = `${bookTab}_${currentChapter}`;
                              const prevSnapshot = rawActor.snapshots?.[Object.keys(rawActor.snapshots || {}).sort().pop() || ''];
                              const suggestion = await aiService.suggestSnapshot(
                                rawActor.id,
                                { bookId: bookTab, chapterId: currentChapter },
                                prevSnapshot,
                                currentCh?.script || ''
                              );
                              setSnapshotSuggestion(suggestion);
                              if (suggestion.shouldCreate && suggestion.confidence > 0.7) {
                                // Auto-suggest with note
                                const snapshotData = { 
                                  baseStats: rawActor.baseStats, 
                                  additionalStats: rawActor.additionalStats, 
                                  activeSkills: rawActor.activeSkills, 
                                  inventory: rawActor.inventory,
                                  note: suggestion.suggestedNote
                                };
                                await db.saveSnapshot(rawActor.id, bookTab, currentChapter, snapshotData);
                                const updatedActor = { ...rawActor, snapshots: { ...rawActor.snapshots, [snapKey]: snapshotData } };
                                await saveToDatabase('actors', updatedActor);
                                setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
                                toastService.success(`Snapshot saved: ${suggestion.suggestedNote}`);
                                setSnapshotSuggestion(null);
                              }
                            } catch (error) {
                              toastService.error(`Snapshot suggestion failed: ${error.message}`);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded flex items-center"
                        >
                          <Save className="w-3 h-3 mr-1" /> SAVE SNAPSHOT
                        </button>
              </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{rawActor.name}</h2>
                    

                    {/* Timeline View - Read from timelineEvents */}
                    {personnelViewMode === 'timeline' && (
                      <div className="mb-6 p-4 bg-slate-950 border border-green-700 rounded">
                        <div className="text-xs font-bold text-green-400 mb-4">TIMELINE PROGRESSION</div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {Object.keys(actorTimelineEvents).length > 0 ? (
                            Object.entries(actorTimelineEvents)
                              .sort(([a], [b]) => {
                                const [bookA, chA] = a.split('_').map(Number);
                                const [bookB, chB] = b.split('_').map(Number);
                                if (bookA !== bookB) return bookA - bookB;
                                return chA - chB;
                              })
                              .map(([chapterKey, events]) => {
                                const [bookId, chapterId] = chapterKey.split('_').map(Number);
                                const book = worldState.books[bookId];
                                const chapter = book?.chapters.find(c => c.id === chapterId);
                                
                                const skillEvents = events.filter(e => e.type === 'skill_event');
                                const statEvents = events.filter(e => e.type === 'stat_change');
                                const relationshipEvents = events.filter(e => e.type === 'relationship_change');
                                
                                const skills = skillEvents.map(event => {
                                  const skillNameMatch = (event.title || event.description || '').match(/(?:learned|gained|mastered|improved|acquired)\s+(.+?)(?:\s+skill)?/i);
                                  if (!skillNameMatch) return null;
                                  const skillName = skillNameMatch[1].trim();
                                  const skill = worldState.skillBank.find(sk => 
                                    sk.name?.toLowerCase() === skillName.toLowerCase()
                                  );
                                  return skill ? { ...skill, name: skill.name } : { name: skillName, id: null };
                                }).filter(Boolean);
                                
                                return (
                                  <div key={chapterKey} className="bg-slate-900 p-3 rounded border border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <div className="text-sm font-bold text-white">
                                          Book {bookId}, Chapter {chapterId}: {chapter?.title || 'Untitled'}
                                        </div>
                                        {events[0]?.timestamp && (
                                          <div className="text-xs text-slate-400">
                                            {new Date(events[0].timestamp).toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                      <div>
                                        <span className="text-slate-400">Skills: </span>
                                        <span className="text-white">{skills.length}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Stat Changes: </span>
                                        <span className="text-white">{statEvents.length}</span>
                                      </div>
                                      {relationshipEvents.length > 0 && (
                                        <div className="col-span-2">
                                          <span className="text-slate-400">Relationships: </span>
                                          <span className="text-white">{relationshipEvents.length}</span>
                                        </div>
                                      )}
                                    </div>
                                    {skills.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs text-slate-400 mb-1">Skills:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {skills.slice(0, 5).map((skill, idx) => (
                                            <span key={skill.id || idx} className="bg-slate-800 text-cyan-300 px-2 py-1 rounded text-xs">
                                              {skill.name}
                                            </span>
                                          ))}
                                          {skills.length > 5 && (
                                            <span className="text-xs text-slate-500">+{skills.length - 5} more</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                          ) : (
                            <div className="text-center text-slate-500 p-8">
                              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No timeline events found for this actor</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Role and Class Display */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="bg-slate-800 px-3 py-1 rounded">
                        <span className="text-slate-400">Class:</span>
                        <span className="text-white ml-2">{rawActor.class || 'Unassigned'}</span>
                      </div>
                      <div className="bg-slate-800 px-3 py-1 rounded">
                        <span className="text-slate-400">Role:</span>
                        <span className="text-white ml-2">{rawActor.role || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* ---- Enhancement: Faction tags display ---- */}
                    {(() => {
                      const factions = (characterFactions[rawActor.id] || rawActor.factions || []);
                      return factions.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {factions.map(f => (
                            <span key={f} className="bg-purple-900/40 border border-purple-600 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                              {f}
                            </span>
                          ))}
                          <button onClick={() => setShowFactionModal(true)} className="text-xs text-slate-500 hover:text-slate-300 px-1">+</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowFactionModal(true)} className="text-xs text-slate-500 hover:text-purple-400 mb-3 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add faction / group
                        </button>
                      );
                    })()}

                    {/* ---- Enhancement: Character action buttons row ---- */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => {
                          setShowCharacterNotes(true);
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1 border border-slate-700"
                      >
                        <FileText className="w-3 h-3" /> Notes
                      </button>
                      <button
                        onClick={() => setShowMotivationEditor(true)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1 border border-slate-700"
                      >
                        <Target className="w-3 h-3" /> Motivations
                      </button>
                      <button
                        onClick={() => {
                          const other = worldState.actors.find(a => a.id !== rawActor.id);
                          setCompareActorId(other?.id || null);
                          setShowCharacterCompare(true);
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1 border border-slate-700"
                      >
                        <Users className="w-3 h-3" /> Compare
                      </button>
                      <button
                        onClick={async () => {
                          const cloneName = window.prompt('Name for the new character clone:', `${rawActor.name} (Copy)`);
                          if (!cloneName) return;
                          const cloned = {
                            ...rawActor,
                            id: `actor_${Date.now()}`,
                            name: cloneName,
                            createdAt: Date.now()
                          };
                          await saveToDatabase('actors', cloned);
                          setWorldState(prev => ({ ...prev, actors: [...prev.actors, cloned] }));
                          toastService.success(`Created clone: ${cloneName}`);
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3 h-3" /> Clone as Template
                      </button>
                      <button
                        onClick={() => {
                          const data = {
                            name: rawActor.name,
                            class: rawActor.class,
                            role: rawActor.role,
                            biography: rawActor.biography,
                            baseStats: rawActor.baseStats,
                            activeSkills: rawActor.activeSkills,
                            inventory: rawActor.inventory,
                            factions: characterFactions[rawActor.id] || rawActor.factions || [],
                            motivations: actorMotivations[rawActor.id] || rawActor.motivations || {},
                            notes: characterNotes[rawActor.id] || '',
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${rawActor.name.replace(/\s+/g, '_')}_character_sheet.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toastService.success('Character sheet exported!');
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1 border border-slate-700"
                      >
                        <Archive className="w-3 h-3" /> Export Sheet
                      </button>
                    </div>

                    {/* ---- Enhancement: Character Notes panel ---- */}
                    {showCharacterNotes && (
                      <div className="mb-4 p-3 bg-slate-950 border border-teal-700 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-bold text-teal-400">CHARACTER NOTES (SCRATCHPAD)</div>
                          <button onClick={() => setShowCharacterNotes(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea
                          value={characterNotes[rawActor.id] || rawActor.notes || ''}
                          onChange={async (e) => {
                            const newNotes = e.target.value;
                            setCharacterNotes(prev => ({ ...prev, [rawActor.id]: newNotes }));
                            const updated = { ...rawActor, notes: newNotes };
                            await saveToDatabase('actors', updated);
                            setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updated : a) }));
                          }}
                          placeholder="Free-form notes about this character..."
                          rows={5}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm p-2 rounded resize-none focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {/* ---- Enhancement: Motivation Editor ---- */}
                    {showMotivationEditor && (
                      <div className="mb-4 p-3 bg-slate-950 border border-orange-700 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-bold text-orange-400">CHARACTER MOTIVATIONS</div>
                          <button onClick={() => setShowMotivationEditor(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {['goals', 'fears', 'desires', 'secrets'].map(field => (
                            <div key={field}>
                              <label className="text-xs text-slate-400 capitalize mb-1 block">{field}</label>
                              <textarea
                                value={(actorMotivations[rawActor.id] || rawActor.motivations || {})[field] || ''}
                                onChange={async (e) => {
                                  const updated = {
                                    ...(actorMotivations[rawActor.id] || rawActor.motivations || {}),
                                    [field]: e.target.value
                                  };
                                  setActorMotivations(prev => ({ ...prev, [rawActor.id]: updated }));
                                  const updatedActor = { ...rawActor, motivations: updated };
                                  await saveToDatabase('actors', updatedActor);
                                  setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
                                }}
                                placeholder={`Character's ${field}...`}
                                rows={3}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs p-2 rounded resize-none focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ---- Enhancement: Faction Modal ---- */}
                    {showFactionModal && (
                      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowFactionModal(false)}>
                        <div className="bg-slate-900 border border-purple-500 rounded-lg p-5 w-80" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between mb-3">
                            <h3 className="font-bold text-purple-300">Faction / Group Membership</h3>
                            <button onClick={() => setShowFactionModal(false)}><X className="w-4 h-4 text-slate-500" /></button>
                          </div>
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {(allFactions.length > 0 ? allFactions : ['Heroes', 'Villains', 'Neutral', 'Merchants', 'Guard', 'Rebels']).map(f => {
                              const currentFactions = characterFactions[rawActor.id] || rawActor.factions || [];
                              const isIn = currentFactions.includes(f);
                              return (
                                <button key={f}
                                  onClick={async () => {
                                    const updated = isIn ? currentFactions.filter(x => x !== f) : [...currentFactions, f];
                                    setCharacterFactions(prev => ({ ...prev, [rawActor.id]: updated }));
                                    const updatedActor = { ...rawActor, factions: updated };
                                    await saveToDatabase('actors', updatedActor);
                                    setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${isIn ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                >
                                  {isIn ? '✓ ' : ''}{f}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            className="w-full bg-slate-800 border border-slate-600 text-white px-2 py-1 text-sm rounded"
                            placeholder="+ Create new faction..."
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                const newF = e.target.value.trim();
                                setAllFactions(prev => [...new Set([...prev, newF])]);
                                const currentFactions = characterFactions[rawActor.id] || rawActor.factions || [];
                                const updated = [...currentFactions, newF];
                                setCharacterFactions(prev => ({ ...prev, [rawActor.id]: updated }));
                                const updatedActor = { ...rawActor, factions: updated };
                                await saveToDatabase('actors', updatedActor);
                                setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* ---- Enhancement: Character Comparison Modal ---- */}
                    {showCharacterCompare && (
                      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCharacterCompare(false)}>
                        <div className="bg-slate-900 border border-blue-500 rounded-xl p-5 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-blue-300 text-lg">Character Comparison</h3>
                            <button onClick={() => setShowCharacterCompare(false)}><X className="w-5 h-5 text-slate-500" /></button>
                          </div>
                          <div className="mb-3">
                            <label className="text-xs text-slate-400 mb-1 block">Compare with:</label>
                            <select
                              value={compareActorId || ''}
                              onChange={e => setCompareActorId(e.target.value)}
                              className="bg-slate-800 border border-slate-600 text-white px-3 py-1.5 rounded text-sm w-full"
                            >
                              {worldState.actors.filter(a => a.id !== rawActor.id).map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                          {(() => {
                            const other = worldState.actors.find(a => a.id === compareActorId);
                            if (!other) return <p className="text-slate-500 text-sm">Select a character above.</p>;
                            const allStatKeys = [...new Set([
                              ...Object.keys(rawActor.baseStats || {}),
                              ...Object.keys(other.baseStats || {})
                            ])];
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {[rawActor, other].map(actor => (
                                  <div key={actor.id}>
                                    <div className="text-lg font-bold text-white mb-2">{actor.name}</div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-slate-400">Class: <span className="text-white">{actor.class || '—'}</span></div>
                                      <div className="text-xs text-slate-400">Role: <span className="text-white">{actor.role || '—'}</span></div>
                                      <div className="text-xs text-slate-400 mt-2 font-bold">BASE STATS</div>
                                      {allStatKeys.map(k => (
                                        <div key={k} className="flex justify-between text-xs">
                                          <span className="text-slate-400">{k}</span>
                                          <span className={`font-bold ${(actor.baseStats?.[k] || 0) > ((actor === rawActor ? other : rawActor).baseStats?.[k] || 0) ? 'text-green-400' : 'text-white'}`}>
                                            {actor.baseStats?.[k] ?? '—'}
                                          </span>
                                        </div>
                                      ))}
                                      <div className="text-xs text-slate-400 mt-2 font-bold">SKILLS</div>
                                      <div className="text-xs text-white">{actor.activeSkills?.length || 0} active</div>
                                      <div className="text-xs text-slate-400 mt-2 font-bold">INVENTORY</div>
                                      <div className="text-xs text-white">{actor.inventory?.length || 0} items</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Nicknames Display & Editor */}
                    <div className="mb-6 p-3 bg-slate-950 border border-slate-700 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-bold text-amber-400">NICKNAMES / ALIASES</div>
                        <button
                          onClick={() => {
                            const newNickname = window.prompt('Enter new nickname/alias:');
                            if (newNickname && newNickname.trim()) {
                              const updatedNicknames = [...(rawActor.nicknames || []), newNickname.trim()];
                              const updatedActor = { ...rawActor, nicknames: updatedNicknames };
                              saveToDatabase('actors', updatedActor);
                              setWorldState(prev => ({
                                ...prev,
                                actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                              }));
                              toastService.success(`Added nickname: ${newNickname.trim()}`);
                            }
                          }}
                          className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </button>
                      </div>
                      {(!rawActor.nicknames || rawActor.nicknames.length === 0) ? (
                        <div className="text-xs text-slate-500 italic">No nicknames set. Add nicknames that this character is known by.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {rawActor.nicknames.map((nick, idx) => (
                            <div key={idx} className="bg-slate-800 text-amber-300 px-2 py-1 rounded text-xs flex items-center gap-2 group">
                              <span>{nick}</span>
                              <button
                                onClick={() => {
                                  const updatedNicknames = rawActor.nicknames.filter((_, i) => i !== idx);
                                  const updatedActor = { ...rawActor, nicknames: updatedNicknames };
                                  saveToDatabase('actors', updatedActor);
                                  setWorldState(prev => ({
                                    ...prev,
                                    actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                                  }));
                                  toastService.info(`Removed nickname: ${nick}`);
                                }}
                                className="text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100 transition-opacity"
                                title="Remove nickname"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Actor Image Display */}
                    <ActorImageDisplay 
                      actor={rawActor} 
                      bookTab={bookTab} 
                      currentChapter={currentChapter} 
                      books={worldState.books}
                    />
                    
                    {/* Tabbed Interface */}
                    <div className="mt-4">
                      {/* Tab Navigation */}
                      <div className="flex flex-wrap gap-2 border-b border-slate-700 mb-4">
                        {[
                          { id: 'overview', label: 'Overview', icon: FileText },
                          { id: 'progression', label: 'Progression', icon: TrendingUp },
                          { id: 'timeline', label: 'Timeline', icon: Clock },
                          { id: 'plot-timeline', label: 'Plot Beats', icon: GitBranch },
                          { id: 'master-timeline', label: 'Master Timeline', icon: Activity },
                          { id: 'relationships', label: 'Relationships', icon: Network },
                          { id: 'dialogue', label: 'Dialogue', icon: MessageSquare },
                          { id: 'arc', label: 'Arc', icon: BarChart2 },
                          { id: 'stats', label: 'Stats', icon: BarChart2 },
                          { id: 'inventory', label: 'Inventory', icon: Package }
                        ].map(tab => {
                          const TabIcon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActorDetailTab(tab.id)}
                              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
                                actorDetailTab === tab.id
                                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              <TabIcon className="w-4 h-4" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab Content */}
                      <div className="min-h-[400px]">
                        {actorDetailTab === 'overview' && (
                          <div className="space-y-4">
                            {/* Character Progression Preview */}
                            <div className="p-3 bg-slate-950 border border-green-700 rounded">
                              <div className="text-xs font-bold text-green-400 mb-2 flex items-center justify-between">
                                <span>PROGRESSION PREVIEW</span>
                                <button onClick={() => setActorDetailTab('progression')} className="text-xs text-green-400 hover:text-green-300">
                                  View Full →
                                </button>
                              </div>
                              <CharacterProgressionView character={rawActor} books={worldState?.books || {}} worldState={worldState} />
                            </div>

                            {rawActor.biography && (
                              <div className="p-3 bg-slate-950 border border-slate-700 rounded">
                                <div className="text-xs font-bold text-purple-400 mb-2">BIOGRAPHY</div>
                                <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{rawActor.biography}</div>
                              </div>
                            )}

                            {/* Character Arc Display */}
                            {(rawActor.arcMilestones || characterArcData) && (
                              <div className="p-3 bg-slate-950 border border-indigo-700 rounded">
                                <div className="text-xs font-bold text-indigo-400 mb-2">CHARACTER ARC PROGRESSION</div>
                                <div className="text-xs text-slate-300 mb-2">
                                  Overall Completion: <span className="text-indigo-400 font-bold">{(rawActor.arcMilestones || characterArcData)?.overallCompletion || 0}%</span>
                                </div>
                                <div className="space-y-2">
                                  {['introduction', 'development', 'conflict', 'resolution'].map(stage => {
                                    const stageData = (rawActor.arcMilestones || characterArcData)?.[stage];
                                    if (!stageData) return null;
                                    return (
                                      <div key={stage} className="bg-slate-900 p-2 rounded">
                                        <div className="flex justify-between items-center mb-1">
                                          <div className="text-xs font-bold text-slate-200 capitalize">{stage}</div>
                                          <div className="text-xs text-indigo-400">{stageData.completion}%</div>
                                        </div>
                                        {stageData.chapter && (
                                          <div className="text-xs text-slate-400">Chapter: {stageData.chapter}</div>
                                        )}
                                        {stageData.description && (
                                          <div className="text-xs text-slate-300 mt-1">{stageData.description}</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Callbacks & Memories Integration */}
                            <div className="p-3 bg-slate-950 border border-purple-700 rounded">
                              <div className="text-xs font-bold text-purple-400 mb-2">CALLBACKS & MEMORIES</div>
                              <CallbacksAndMemoriesDisplay character={rawActor} books={worldState?.books || {}} />
                            </div>

                            {/* AI Suggestions Panel */}
                            <div className="p-3 bg-slate-950 border border-cyan-700 rounded">
                              <div className="text-xs font-bold text-cyan-400 mb-2">AI SUGGESTIONS</div>
                              <CharacterAISuggestionsPanel
                                character={rawActor}
                                onAccept={(suggestion) => {
                                  toastService.success('Suggestion accepted');
                                }}
                                onDismiss={(suggestion) => {
                                  toastService.info('Suggestion dismissed');
                                }}
                              />
                            </div>

                            {/* Storyline Cards */}
                            <div className="p-3 bg-slate-950 border border-yellow-700 rounded">
                              <div className="text-xs font-bold text-yellow-400 mb-2">STORYLINES</div>
                              <CharacterStorylineCards character={rawActor} books={worldState?.books || {}} />
                            </div>

                            {/* Plot Involvement */}
                            <div className="p-3 bg-slate-950 border border-red-700 rounded">
                              <div className="text-xs font-bold text-red-400 mb-2">PLOT INVOLVEMENT</div>
                              <CharacterPlotInvolvement character={rawActor} books={worldState?.books || {}} />
                            </div>

                            {/* Gamification */}
                            <div className="p-3 bg-slate-950 border border-yellow-700 rounded">
                              <div className="text-xs font-bold text-yellow-400 mb-2">GAMIFICATION</div>
                              <CharacterGamification character={rawActor} worldState={worldState} />
                            </div>

                            {/* Appearance Metrics */}
                            {rawActor.appearances && Object.keys(rawActor.appearances).length > 0 && (
                              <div className="p-3 bg-slate-950 border border-slate-700 rounded">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="text-xs font-bold text-blue-400">APPEARANCE METRICS</div>
                                  <button
                                    onClick={async () => {
                                      setIsAnalyzingAppearances(true);
                                      try {
                                        const appearances = {};
                                        for (const book of Object.values(worldState.books)) {
                                          for (const chapter of book.chapters) {
                                            const text = chapter.script || chapter.desc || '';
                                            if (text.toLowerCase().includes(rawActor.name.toLowerCase())) {
                                              const analysis = await aiService.analyzeCharacterAppearances(text, rawActor.name);
                                              const key = `${book.id}_${chapter.id}`;
                                              appearances[key] = {
                                                bookId: book.id,
                                                chapterId: chapter.id,
                                                mentionCount: analysis.mentionCount,
                                                dialogueCount: analysis.dialogueCount,
                                                importance: analysis.importance,
                                                firstMention: analysis.firstMention,
                                                lastMention: analysis.lastMention,
                                                keyMoments: analysis.keyMoments
                                              };
                                            }
                                          }
                                        }
                                        const updatedActor = { ...rawActor, appearances };
                                        await saveToDatabase('actors', updatedActor);
                                        setWorldState(prev => ({
                                          ...prev,
                                          actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                                        }));
                                        toastService.success('Appearance metrics updated');
                                      } catch (error) {
                                        toastService.error(`Appearance analysis failed: ${error.message}`);
                                      } finally {
                                        setIsAnalyzingAppearances(false);
                                      }
                                    }}
                                    disabled={isAnalyzingAppearances}
                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
                                  >
                                    {isAnalyzingAppearances ? <RefreshCw className="w-3 h-3 animate-spin"/> : 'Update'}
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <div className="text-slate-400">Chapters</div>
                                    <div className="text-white font-bold">{Object.keys(rawActor.appearances).length}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400">Total Mentions</div>
                                    <div className="text-white font-bold">
                                      {Object.values(rawActor.appearances).reduce((sum, a) => sum + (a.mentionCount || 0), 0)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400">Dialogue Lines</div>
                                    <div className="text-white font-bold">
                                      {Object.values(rawActor.appearances).reduce((sum, a) => sum + (a.dialogueCount || 0), 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                            <h3 className="text-xs font-bold text-green-500 mb-4 uppercase">Core Stats</h3>
                            {coreStats.map(stat => {
                              const statValue = calculatedActor.computedStats[stat.key] || 0;
                              const modifier = calculatedActor.statModifiers[stat.key] || 0;
                              const baseValue = statValue - modifier;
                              // Calculate breakdown from items/skills/equipment
                              const statSources = calculatedActor.statSources || {};
                              const fromItems = statSources.items?.[stat.key] || 0;
                              const fromSkills = statSources.skills?.[stat.key] || 0;
                              const fromEquipment = statSources.equipment?.[stat.key] || 0;
                              return (
                                <StatSlider 
                                  key={stat.key} 
                                  label={stat.key} 
                                  value={statValue} 
                                  baseValue={baseValue}
                                  modifier={modifier} 
                                  onChange={(val) => updateBaseStat(stat.key, val)} 
                                  max={500} 
                                  color={stat.color}
                                  statInfo={stat}
                                  onHover={(statInfo, pos) => (
                                    <StatTooltip
                                      statInfo={statInfo}
                                      statName={statInfo.name}
                                      baseValue={baseValue}
                                      totalValue={statValue}
                                      modifier={modifier}
                                      fromItems={fromItems}
                                      fromSkills={fromSkills}
                                      fromEquipment={fromEquipment}
                                      x={pos.x}
                                      y={pos.y}
                                    />
                                  )}
                                />
                              );
                            })}
                        </div>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                            <h3 className="text-xs font-bold text-purple-400 mb-4 uppercase">Additional Stats (Editable)</h3>
                            {(() => {
                                const allKeys = new Set([...Object.keys(calculatedActor.computedAdditional || {}), ...additionalStats.map(s=>s.key)]);
                                return Array.from(allKeys).map(k => {
                                    const totalVal = calculatedActor.computedAdditional?.[k] || 0;
                                    const bonuses = calculatedActor.additionalBonuses?.[k] || 0;
                                    // Get base value from actor's additionalStats (new format) or calculate from total - bonuses
                                    let baseVal = 0;
                                    if (rawActor.additionalStats && rawActor.additionalStats[k]) {
                                      if (typeof rawActor.additionalStats[k] === 'object' && rawActor.additionalStats[k] !== null) {
                                        baseVal = rawActor.additionalStats[k].base || 0;
                                      } else {
                                        // Old format - migrate on the fly
                                        baseVal = typeof rawActor.additionalStats[k] === 'number' ? rawActor.additionalStats[k] - bonuses : 0;
                                      }
                                    }
                                    const meta = additionalStats.find(s=>s.key===k) || {color: 'purple', name: k, desc: `${k} stat`};
                                    // Get breakdown from statSources
                                    const statSources = calculatedActor.statSources || {};
                                    const fromItems = statSources.items?.[k] || 0;
                                    const fromSkills = statSources.skills?.[k] || 0;
                                    const fromEquipment = statSources.equipment?.[k] || 0;
                                    if(totalVal > 0 || bonuses !== 0 || additionalStats.find(s=>s.key===k)) {
                                      return (
                                        <StatSlider 
                                          key={k} 
                                          label={k} 
                                          value={totalVal} 
                                          baseValue={baseVal}
                                          modifier={bonuses}
                                          onChange={async (newBase) => {
                                            // Update base value in additionalStats
                                            const updatedAdditionalStats = { ...rawActor.additionalStats };
                                            if (!updatedAdditionalStats[k]) {
                                              updatedAdditionalStats[k] = { base: 0, bonuses: 0 };
                                            } else if (typeof updatedAdditionalStats[k] !== 'object') {
                                              // Migrate old format
                                              updatedAdditionalStats[k] = { base: newBase, bonuses: bonuses };
                                            } else {
                                              updatedAdditionalStats[k] = { ...updatedAdditionalStats[k], base: newBase };
                                            }
                                            const updatedActor = { ...rawActor, additionalStats: updatedAdditionalStats };
                                            await saveToDatabase('actors', updatedActor);
                                            setWorldState(prev => ({ ...prev, actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a) }));
                                          }} 
                                          max={500} 
                                          color={meta.color} 
                                          readOnly={false}
                                          showBreakdown={true}
                                          statInfo={meta}
                                          onHover={(statInfo, pos) => (
                                            <StatTooltip
                                              statInfo={statInfo}
                                              statName={statInfo.name || k}
                                              baseValue={baseVal}
                                              totalValue={totalVal}
                                              modifier={bonuses}
                                              fromItems={fromItems}
                                              fromSkills={fromSkills}
                                              fromEquipment={fromEquipment}
                                              x={pos.x}
                                              y={pos.y}
                                            />
                                          )}
                                        />
                                      );
                                    }
                                    return null;
                                })
                            })()}
                      </div>
                    </div>
                    {/* Skills - Full Width with 2 Rows */}
                    <div className="bg-slate-950 p-4 rounded border border-slate-800 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-blue-400 uppercase flex items-center">
                                <Zap className="w-3 h-3 mr-2"/> Skills
                            </h3>
                            <button onClick={() => setPickerMode('skill')} className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800 hover:bg-blue-900/50">
                                <Plus className="w-3 h-3"/>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {calculatedActor.computedSkills.map((skill, i) => (
                                <div 
                                  key={i} 
                                  className="bg-slate-900 p-3 rounded border border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer group"
                                  onMouseEnter={(e) => {
                                    setHoveredSkill(skill);
                                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                                  }}
                                  onMouseMove={(e) => {
                                    if (hoveredSkill && hoveredSkill.id === skill.id) {
                                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (hoveredSkill && hoveredSkill.id === skill.id) {
                                      setHoveredSkill(null);
                                    }
                                  }}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-shrink-0">
                                          <div className="w-12 h-12 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                                            <SkillSymbol skill={skill} size="md" />
                                            {!skill.symbolPath && (
                                              <Zap className="w-6 h-6 text-slate-600 opacity-50" />
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <div className="font-bold text-sm text-slate-200 group-hover:text-blue-400 transition-colors truncate">{skill.name}</div>
                                                <button onClick={(e) => {e.stopPropagation(); e.preventDefault(); removeSkillFromActor(i)}} className="text-slate-600 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                                    <Trash2 className="w-3 h-3"/>
                                                </button>
                                    </div>
                                    <StatSlider label="Level" value={skill.value || 1} onChange={(val) => updateSkillVal(skill.id, val)} max={20} color="blue"/>
                                </div>
                        </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equipment Slots */}
                    {(() => {
                      const equipment = rawActor.equipment || {
                        helm: null, cape: null, amulet: null, armour: null, gloves: null, belt: null, boots: null,
                        leftHand: null, rightHand: null, rings: [null, null, null, null, null, null, null], charms: [null, null, null, null]
                      };

                      const handleEquip = async (slotType, slotIndex, itemId) => {
                        const updatedEquipment = { ...equipment };
                        
                        if (slotIndex !== null && slotIndex !== undefined) {
                          if (slotType === 'rings') {
                            updatedEquipment.rings = [...updatedEquipment.rings];
                            updatedEquipment.rings[slotIndex] = itemId;
                          } else if (slotType === 'charms') {
                            updatedEquipment.charms = [...updatedEquipment.charms];
                            updatedEquipment.charms[slotIndex] = itemId;
                          }
                        } else {
                          updatedEquipment[slotType] = itemId;
                        }
                        
                        const updatedActor = { ...rawActor, equipment: updatedEquipment };
                        await saveToDatabase('actors', updatedActor);
                        setWorldState(prev => ({
                          ...prev,
                          actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                        }));
                        setPickerMode(null);
                        toastService.success(`Equipped ${worldState.itemBank.find(i => i.id === itemId)?.name || 'item'}`);
                      };

                      const handleUnequip = async (slotType, slotIndex) => {
                        const updatedEquipment = { ...equipment };
                        let itemId = null;
                        
                        if (slotIndex !== null && slotIndex !== undefined) {
                          if (slotType === 'rings') {
                            itemId = updatedEquipment.rings[slotIndex];
                            updatedEquipment.rings = [...updatedEquipment.rings];
                            updatedEquipment.rings[slotIndex] = null;
                          } else if (slotType === 'charms') {
                            itemId = updatedEquipment.charms[slotIndex];
                            updatedEquipment.charms = [...updatedEquipment.charms];
                            updatedEquipment.charms[slotIndex] = null;
                          }
                        } else {
                          itemId = updatedEquipment[slotType];
                          updatedEquipment[slotType] = null;
                        }
                        
                        const updatedActor = { ...rawActor, equipment: updatedEquipment };
                        if (itemId && !updatedActor.inventory.includes(itemId)) {
                          updatedActor.inventory = [...updatedActor.inventory, itemId];
                        }
                        
                        await saveToDatabase('actors', updatedActor);
                        setWorldState(prev => ({
                          ...prev,
                          actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                        }));
                        toastService.success('Item unequipped');
                      };


                      const equippedItemIds = [
                        equipment.helm, equipment.cape, equipment.amulet, equipment.armour,
                        equipment.gloves, equipment.belt, equipment.boots,
                        equipment.leftHand, equipment.rightHand,
                        ...equipment.rings.filter(Boolean),
                        ...equipment.charms.filter(Boolean)
                      ].filter(Boolean);

                      return (
                        <div className="bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 p-6 rounded-xl border-2 border-slate-700/50 shadow-2xl mb-6 backdrop-blur-sm relative overflow-hidden">
                          {/* Decorative background pattern */}
                          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,197,94,0.3) 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                          }}></div>
                          
                          <div className="relative z-10">
                            <h3 className="text-xs font-extrabold text-green-400 mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
                              <Shield className="w-4 h-4 text-green-500" />
                              <span className="drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">Equipment</span>
                            </h3>
                            
                            {/* Creature Silhouette with Equipment Slots */}
                            <div className="mb-8 overflow-visible" style={{ minHeight: '600px' }}>
                              <CreatureSilhouette 
                                equipment={equipment}
                                onEquip={handleEquip}
                                onUnequip={handleUnequip}
                                worldState={worldState}
                              />
                            </div>

                            {/* Rings Row */}
                            <div className="mt-8 pt-6 border-t border-slate-700/50">
                              <div className="text-xs font-bold text-slate-300 mb-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                                <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                                <span className="text-slate-400">Rings</span>
                                <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                              </div>
                              <div className="flex gap-3 justify-center flex-wrap">
                                {equipment.rings.map((ringId, idx) => (
                                  <EquipmentSlot 
                                    key={idx} 
                                    slotType="rings" 
                                    slotIndex={idx}
                                    itemId={ringId} 
                                    onEquip={handleEquip} 
                                    onUnequip={handleUnequip} 
                                    label={`Ring ${idx + 1}`} 
                                    size="sm" 
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Charms Row */}
                            <div className="mt-6 pt-6 border-t border-slate-700/50">
                              <div className="text-xs font-bold text-slate-300 mb-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                                <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                                <span className="text-slate-400">Charms</span>
                                <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                              </div>
                              <div className="flex gap-3 justify-center flex-wrap">
                                {equipment.charms.map((charmId, idx) => (
                                  <EquipmentSlot 
                                    key={idx} 
                                    slotType="charms" 
                                    slotIndex={idx}
                                    itemId={charmId} 
                                    onEquip={handleEquip} 
                                    onUnequip={handleUnequip} 
                                    label={`Charm ${idx + 1}`} 
                                    size="sm" 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Inventory List */}
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-yellow-500 uppercase flex items-center">
                                <ShoppingBag className="w-3 h-3 mr-2"/> Inventory
                            </h3>
                            <button onClick={() => setPickerMode('item')} className="text-[10px] bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded border border-yellow-800 hover:bg-yellow-900/50">
                                <Plus className="w-3 h-3"/>
                            </button>
                        </div>
                        {(() => {
                          const equipment = rawActor.equipment || {
                            helm: null, cape: null, amulet: null, armour: null, gloves: null, belt: null, boots: null,
                            leftHand: null, rightHand: null, rings: [null, null, null, null, null, null, null], charms: [null, null, null, null]
                          };
                          const equippedItemIds = [
                            equipment.helm, equipment.cape, equipment.amulet, equipment.armour,
                            equipment.gloves, equipment.belt, equipment.boots,
                            equipment.leftHand, equipment.rightHand,
                            ...equipment.rings.filter(Boolean),
                            ...equipment.charms.filter(Boolean)
                          ].filter(Boolean);
                          const unequippedItems = rawActor.inventory
                            .map(id => worldState.itemBank.find(i => i.id === id))
                            .filter(item => item && !equippedItemIds.includes(item.id));

                          const findCompatibleSlot = (item) => {
                            const itemType = (item.type || '').toLowerCase();
                            if (itemType.includes('ring')) {
                              const emptyRingIndex = equipment.rings.findIndex(r => !r);
                              if (emptyRingIndex !== -1) return { slot: 'rings', index: emptyRingIndex };
                            } else if (itemType.includes('charm')) {
                              const emptyCharmIndex = equipment.charms.findIndex(c => !c);
                              if (emptyCharmIndex !== -1) return { slot: 'charms', index: emptyCharmIndex };
                            } else if (itemType.includes('helm') || itemType.includes('hat')) {
                              return { slot: 'helm', index: null };
                            } else if (itemType.includes('cape') || itemType.includes('cloak')) {
                              return { slot: 'cape', index: null };
                            } else if (itemType.includes('amulet') || itemType.includes('necklace')) {
                              return { slot: 'amulet', index: null };
                            } else if (itemType.includes('armour') || itemType.includes('armor') || itemType.includes('chest')) {
                              return { slot: 'armour', index: null };
                            } else if (itemType.includes('gloves') || itemType.includes('gauntlets')) {
                              return { slot: 'gloves', index: null };
                            } else if (itemType.includes('belt')) {
                              return { slot: 'belt', index: null };
                            } else if (itemType.includes('boots') || itemType.includes('shoes')) {
                              return { slot: 'boots', index: null };
                            } else if (itemType.includes('weapon') || itemType.includes('shield')) {
                              return { slot: equipment.leftHand ? 'rightHand' : 'leftHand', index: null };
                            }
                            return null;
                          };
                                
                                return (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {unequippedItems.map(item => {
                                const rarityStyles = {
                                  Legendary: 'border-yellow-500/60 bg-gradient-to-br from-yellow-900/20 to-amber-900/10 hover:border-yellow-400 hover:shadow-yellow-500/40 text-yellow-300',
                                  Epic: 'border-purple-500/60 bg-gradient-to-br from-purple-900/20 to-violet-900/10 hover:border-purple-400 hover:shadow-purple-500/40 text-purple-300',
                                  Rare: 'border-blue-500/60 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 hover:border-blue-400 hover:shadow-blue-500/40 text-blue-300',
                                  Uncommon: 'border-green-500/60 bg-gradient-to-br from-green-900/20 to-emerald-900/10 hover:border-green-400 hover:shadow-green-500/40 text-green-300',
                                  Common: 'border-slate-600/60 bg-gradient-to-br from-slate-800/20 to-slate-900/10 hover:border-slate-400 hover:shadow-slate-500/30 text-slate-200'
                                };
                                const itemRarity = item.rarity || 'Common';
                                return (
                                  <div 
                                    key={item.id} 
                                    className={`
                                      border-2 ${rarityStyles[itemRarity]}
                                      p-4 rounded-lg 
                                      hover:scale-105 hover:shadow-xl
                                      transition-all duration-300 ease-in-out 
                                      cursor-pointer group relative
                                      backdrop-blur-sm
                                      overflow-hidden
                                      before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity
                                    `}
                                    style={item.rarity === 'Legendary' ? {
                                      boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)'
                                    } : item.rarity === 'Epic' ? {
                                      boxShadow: '0 0 12px rgba(168, 85, 247, 0.2)'
                                    } : {}}
                                    onMouseEnter={(e) => {
                                      setHoveredItem(item);
                                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseMove={(e) => {
                                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredItem(null);
                                    }}
                                    onClick={(e) => {
                                      setActionMenu({ item, x: e.clientX, y: e.clientY });
                                    }}
                                  >
                                    <div className="relative w-full h-32 mb-3 bg-transparent overflow-hidden flex items-center justify-center">
                                      <ItemImage item={item} className="w-full h-full max-w-full max-h-full" />
                                      {!item.imagePath && (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                          <Package className="w-8 h-8 opacity-30" />
                                        </div>
                                      )}
                                    </div>
                                    <div className={`font-bold text-sm mb-2 ${itemRarity === 'Legendary' ? 'drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]' : ''}`}>
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-slate-400 mb-3 font-medium">{item.type}</div>
                                    <div className="text-[10px] text-green-400/80 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-semibold uppercase tracking-wider">
                                      Click for actions
                                    </div>
                                  </div>
                                );
                              })}
                              {unequippedItems.length === 0 && (
                                <div className="col-span-full text-center p-8 text-slate-500">
                                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No unequipped items</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                            </div>
                          </div>
                        )}

                        {actorDetailTab === 'progression' && (
                          <CharacterProgressionView
                            character={rawActor}
                            books={worldState?.books || {}}
                            worldState={worldState}
                          />
                        )}

                        {actorDetailTab === 'timeline' && (
                          <CharacterTimelineView
                            actor={rawActor}
                            books={worldState?.books || {}}
                            items={worldState?.itemBank || []}
                            skills={worldState?.skillBank || []}
                          />
                        )}

                        {actorDetailTab === 'plot-timeline' && (
                          <div className="space-y-2">
                            <div className="text-xs text-slate-400 px-1 pb-1 border-b border-slate-800">
                              Plot beats involving <span className="text-white font-bold">{rawActor?.name}</span>
                            </div>
                            <PlotTimeline
                              books={worldState?.books || {}}
                              actors={worldState?.actors || []}
                              filterActorId={rawActor?.id}
                            />
                          </div>
                        )}

                        {actorDetailTab === 'master-timeline' && (
                          <div className="space-y-2">
                            <div className="text-xs text-slate-400 px-1 pb-1 border-b border-slate-800">
                              All timeline events involving <span className="text-white font-bold">{rawActor?.name}</span>
                            </div>
                            <MasterTimeline
                              books={worldState?.books || {}}
                              actors={worldState?.actors || []}
                              filterActorName={rawActor?.name}
                            />
                          </div>
                        )}

                        {actorDetailTab === 'relationships' && (
                          <CharacterRelationshipHub
                            character={rawActor}
                            actors={worldState?.actors || []}
                            onActorSelect={(actorId) => setSelectedActorId(actorId)}
                            books={worldState?.books || {}}
                          />
                        )}

                        {actorDetailTab === 'dialogue' && (
                          <CharacterDialogueHub
                            character={rawActor}
                            books={worldState?.books || {}}
                          />
                        )}

                        {actorDetailTab === 'arc' && (
                          <div className="space-y-4">
                            {(rawActor.arcMilestones || characterArcData) && (
                              <div className="p-4 bg-slate-950 border border-indigo-700 rounded">
                                <div className="text-xs font-bold text-indigo-400 mb-2">CHARACTER ARC PROGRESSION</div>
                                <div className="text-xs text-slate-300 mb-2">
                                  Overall Completion: <span className="text-indigo-400 font-bold">{(rawActor.arcMilestones || characterArcData)?.overallCompletion || 0}%</span>
                                </div>
                                <div className="space-y-2">
                                  {['introduction', 'development', 'conflict', 'resolution'].map(stage => {
                                    const stageData = (rawActor.arcMilestones || characterArcData)?.[stage];
                                    if (!stageData) return null;
                                    return (
                                      <div key={stage} className="bg-slate-900 p-2 rounded">
                                        <div className="flex justify-between items-center mb-1">
                                          <div className="text-xs font-bold text-slate-200 capitalize">{stage}</div>
                                          <div className="text-xs text-indigo-400">{stageData.completion}%</div>
                                        </div>
                                        {stageData.chapter && (
                                          <div className="text-xs text-slate-400">Chapter: {stageData.chapter}</div>
                                        )}
                                        {stageData.description && (
                                          <div className="text-xs text-slate-300 mt-1">{stageData.description}</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {actorDetailTab === 'stats' && (
                          <StatHistoryTimeline
                            actor={rawActor}
                            books={worldState?.books || {}}
                            statRegistry={worldState?.statRegistry || []}
                          />
                        )}

                        {actorDetailTab === 'inventory' && (
                          <div className="space-y-4">
                            {/* Paper Doll View */}
                            <div className="p-3 bg-slate-950 border border-blue-700 rounded">
                              <div className="text-xs font-bold text-blue-400 mb-2">PAPER DOLL</div>
                              {(() => {
                                // #region agent log
                                try {
                                  fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:3523',message:'Rendering PaperDollView',data:{actorId:rawActor?.id,itemsCount:worldState?.itemBank?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                } catch(e) {}
                                // #endregion
                                try {
                                  return <PaperDollView 
                                    actor={rawActor} 
                                    items={worldState?.itemBank || []}
                                    onSlotClick={(slot) => console.log('Slot clicked:', slot)}
                                    onItemHover={(item) => console.log('Item hovered:', item)}
                                  />;
                                } catch(error) {
                                  // #region agent log
                                  fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:3523',message:'PaperDollView render error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                  // #endregion
                                  return <div className="text-red-400">Error rendering PaperDollView: {error.message}</div>;
                                }
                              })()}
                            </div>

                            {/* Equipment Change Views */}
                            <div className="p-3 bg-slate-950 border border-purple-700 rounded">
                              <div className="text-xs font-bold text-purple-400 mb-2">EQUIPMENT HISTORY</div>
                              <EquipmentChangeViews 
                                actor={rawActor} 
                                items={worldState?.itemBank || []}
                                books={worldState?.books || {}}
                              />
                            </div>

                            {/* Total Stats Display */}
                            <div className="p-3 bg-slate-950 border border-green-700 rounded">
                              <TotalStatsDisplay 
                                actor={rawActor}
                                items={worldState?.itemBank || []}
                                statRegistry={worldState?.statRegistry || []}
                              />
                            </div>

                            {/* AI Suggestions */}
                            <div className="p-3 bg-slate-950 border border-cyan-700 rounded">
                              <div className="text-xs font-bold text-cyan-400 mb-2">AI SUGGESTIONS</div>
                              <InventoryAISuggestionsPanel actor={rawActor} />
                            </div>

                            {/* Equipment Story Context */}
                            <div className="p-3 bg-slate-950 border border-yellow-700 rounded">
                              <div className="text-xs font-bold text-yellow-400 mb-2">EQUIPMENT STORY CONTEXT</div>
                              <EquipmentStoryContext 
                                item={null} 
                                books={worldState?.books || {}}
                              />
                            </div>

                            {/* Inventory Capacity */}
                            <div className="p-3 bg-slate-950 border border-orange-700 rounded">
                              <InventoryCapacity actor={rawActor} />
                            </div>

                            {/* Set Bonus Display */}
                            <div className="p-3 bg-slate-950 border border-pink-700 rounded">
                              <SetBonusDisplay 
                                equippedItems={Object.values(rawActor.equipment || {}).flat().filter(Boolean)}
                                items={worldState?.itemBank || []}
                              />
                            </div>

                            {/* Gamification */}
                            <div className="p-3 bg-slate-950 border border-yellow-700 rounded">
                              <div className="text-xs font-bold text-yellow-400 mb-2">GAMIFICATION</div>
                              <InventoryGamification 
                                actor={rawActor}
                                items={worldState?.itemBank || []}
                              />
                            </div>

                            {/* Enhanced Inventory Display */}
                            <div className="p-3 bg-slate-950 border border-slate-700 rounded">
                              <EnhancedInventoryDisplay 
                                actor={rawActor}
                                items={worldState?.itemBank || []}
                                books={worldState?.books || {}}
                              />
                            </div>
                          </div>
                        )}
                        {actorDetailTab === 'inventory-old' && (
                          <InventoryHistoryTimeline
                            actor={rawActor}
                            books={worldState?.books || {}}
                            items={worldState?.itemBank || []}
                          />
                        )}
                      </div>
                    </div>
                </div>
                ) : (<div className="text-center p-20 text-slate-500">No actors found. Add one to begin.</div>)}
            </div>
                                        </div>
                                        
        {/* Character Detection Modal */}
        {showCharacterDetection && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500 w-full max-w-2xl rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">DETECTED CHARACTERS</h3>
                <button onClick={() => setShowCharacterDetection(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              {isLoadingSuggestions ? (
                <div className="text-center p-8">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2"/>
                  <div className="text-slate-400">Scanning chapters...</div>
                </div>
              ) : detectedCharacters.length === 0 ? (
                <div className="text-center p-8 text-slate-400">No new characters detected.</div>
              ) : (
                <div className="space-y-3">
                  {detectedCharacters.map((char, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-700 p-4 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white">{char.name}</div>
                          <div className="text-xs text-slate-400">{char.description}</div>
                        </div>
                        <div className="text-xs text-purple-400">{(char.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Source: {char.sourceChapters?.join(', ') || 'Unknown'}</div>
                      <div className="text-xs text-slate-400 italic mb-2">"{char.textEvidence}"</div>
                      <div className="flex gap-2">
                                                        <button
                          onClick={async () => {
                            const newActor = {
                              id: `act_${Date.now()}`,
                              name: char.name,
                              role: char.suggestedRole || '',
                              class: char.suggestedClass || 'NPC',
                              desc: char.description || '',
                              isFav: false,
                              baseStats: char.suggestedStats || { STR: 10, VIT: 10, INT: 10, DEX: 10 },
                              additionalStats: {},
                              activeSkills: [],
                              inventory: [],
                              snapshots: {},
                              appearances: {},
                              biography: '',
                              arcMilestones: {},
                              lastConsistencyCheck: null,
                              aiSuggestions: []
                            };
                            await db.add('actors', newActor);
                            const newState = {...worldState, actors: [...worldState.actors, newActor]};
                            setWorldState(newState);
                            toastService.success(`Created actor: ${char.name}`);
                            setDetectedCharacters(detectedCharacters.filter((_, i) => i !== idx));
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded"
                        >
                          Create Actor
                        </button>
                        <button
                          onClick={() => setDetectedCharacters(detectedCharacters.filter((_, i) => i !== idx))}
                          className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stat Changes Review Modal */}
        {showStatChanges && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-green-500 w-full max-w-2xl rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">EXTRACTED STAT CHANGES</h3>
                <button onClick={() => setShowStatChanges(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              {isLoadingSuggestions ? (
                <div className="text-center p-8">
                  <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2"/>
                  <div className="text-slate-400">Extracting stat changes...</div>
                </div>
              ) : statChangeSuggestions.length === 0 ? (
                <div className="text-center p-8 text-slate-400">No stat changes detected.</div>
              ) : (
                <div className="space-y-3">
                  {statChangeSuggestions
                    .filter(change => change.actorName === rawActor?.name || change.actorId === rawActor?.id)
                    .map((change, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-700 p-4 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-white">{change.actorName}</div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          change.confidence >= 0.85 ? 'bg-green-900/30 text-green-300' :
                          change.confidence >= 0.6 ? 'bg-yellow-900/30 text-yellow-300' :
                          'bg-red-900/30 text-red-300'
                        }`}>
                          {(change.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">"{change.textEvidence}"</div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {Object.entries(change.statChanges || {}).map(([stat, val]) => (
                          <div key={stat} className="text-xs">
                            <span className="text-slate-400">{stat}:</span>
                            <span className={`ml-1 font-bold ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {val > 0 ? '+' : ''}{val}
                            </span>
                          </div>
                        ))}
                      </div>
                      {change.confidence >= 0.85 ? (
                        <button
                          onClick={async () => {
                            const updatedActor = {
                              ...rawActor,
                              baseStats: {
                                ...rawActor.baseStats,
                                ...Object.fromEntries(
                                  Object.entries(change.statChanges || {}).map(([stat, val]) => [
                                    stat,
                                    (rawActor.baseStats[stat] || 0) + val
                                  ])
                                )
                              }
                            };
                            await saveToDatabase('actors', updatedActor);
                            setWorldState(prev => ({
                              ...prev,
                              actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                            }));
                            toastService.success(`Applied stat changes to ${change.actorName}`);
                            setStatChangeSuggestions(statChangeSuggestions.filter((_, i) => i !== idx));
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded"
                        >
                          Auto-Apply (High Confidence)
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const updatedActor = {
                                ...rawActor,
                                baseStats: {
                                  ...rawActor.baseStats,
                                  ...Object.fromEntries(
                                    Object.entries(change.statChanges || {}).map(([stat, val]) => [
                                      stat,
                                      (rawActor.baseStats[stat] || 0) + val
                                    ])
                                  )
                                }
                              };
                              await saveToDatabase('actors', updatedActor);
                              setWorldState(prev => ({
                                ...prev,
                                actors: prev.actors.map(a => a.id === rawActor.id ? updatedActor : a)
                              }));
                              toastService.success(`Applied stat changes to ${change.actorName}`);
                              setStatChangeSuggestions(statChangeSuggestions.filter((_, i) => i !== idx));
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => setStatChangeSuggestions(statChangeSuggestions.filter((_, i) => i !== idx))}
                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consistency Check Results Modal */}
        {showConsistencyCheck && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500 w-full max-w-2xl rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">CONSISTENCY CHECK RESULTS</h3>
                <button onClick={() => setShowConsistencyCheck(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              {isLoadingSuggestions ? (
                <div className="text-center p-8">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2"/>
                  <div className="text-slate-400">Checking consistency...</div>
                </div>
              ) : consistencyIssues.length === 0 ? (
                <div className="text-center p-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2"/>
                  <div className="text-green-400 font-bold">No inconsistencies found!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {consistencyIssues.map((issue, idx) => (
                    <div key={idx} className={`bg-slate-950 border p-4 rounded ${
                      issue.severity === 'critical' ? 'border-red-500' :
                      issue.severity === 'warning' ? 'border-yellow-500' :
                      'border-slate-700'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-white">{issue.type.replace('_', ' ').toUpperCase()}</div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          issue.severity === 'critical' ? 'bg-red-900/30 text-red-300' :
                          issue.severity === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {issue.severity}
                        </div>
                      </div>
                      <div className="text-sm text-slate-300 mb-2">{issue.description}</div>
                      <div className="text-xs text-slate-400 mb-2">Location: {issue.location}</div>
                      <div className="text-xs text-blue-400">{issue.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skill/Item Acquisition Suggestions Modal */}
        {showSkillItemSuggestions && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-orange-500 w-full max-w-2xl rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">DETECTED SKILL/ITEM ACQUISITIONS</h3>
                <button onClick={() => setShowSkillItemSuggestions(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              {isLoadingSuggestions ? (
                <div className="text-center p-8">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2"/>
                  <div className="text-slate-400">Detecting acquisitions...</div>
                </div>
              ) : skillItemSuggestions.length === 0 ? (
                <div className="text-center p-8 text-slate-400">No skill/item acquisitions detected.</div>
              ) : (
                <div className="space-y-3">
                  {skillItemSuggestions
                    .filter(acq => acq.actorId === rawActor?.id || acq.actorName === rawActor?.name)
                    .map((acq, idx) => {
                      const existingItem = acq.type === 'item' && acq.matchesExisting 
                        ? worldState.itemBank.find(i => i.id === acq.existingId || i.name.toLowerCase() === acq.name.toLowerCase())
                        : null;
                      const existingSkill = acq.type === 'skill' && acq.matchesExisting
                        ? worldState.skillBank.find(s => s.id === acq.existingId || s.name.toLowerCase() === acq.name.toLowerCase())
                        : null;

                      return (
                        <div key={idx} className="bg-slate-950 border border-slate-700 p-4 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white">{acq.name}</div>
                              <div className="text-xs text-slate-400 capitalize">{acq.type} - {acq.action}</div>
                            </div>
                            <div className="text-xs text-orange-400">{(acq.confidence * 100).toFixed(0)}%</div>
                          </div>
                          <div className="text-xs text-slate-400 italic mb-2">"{acq.textEvidence}"</div>
                          {acq.action === 'acquired' || acq.action === 'learned' ? (
                            <button
                              onClick={async () => {
                                if (acq.type === 'item' && existingItem) {
                                  await addItemToActor(existingItem.id);
                                  toastService.success(`Added ${acq.name} to inventory`);
                                } else if (acq.type === 'skill' && existingSkill) {
                                  await addSkillToActor(existingSkill.id);
                                  toastService.success(`Learned ${acq.name}`);
                                                                    } else {
                                  toastService.warning(`${acq.name} not found in database. Create it first.`);
                                                                    }
                                setSkillItemSuggestions(skillItemSuggestions.filter((_, i) => i !== idx));
                                                            }}
                              className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded"
                                                        >
                              {acq.matchesExisting ? 'Add to Actor' : 'Create & Add'}
                                                        </button>
                          ) : (
                            <div className="text-xs text-slate-400">Item/Skill lost - manual removal required</div>
                                                    )}
                                                </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment Picker Modal */}
        {pickerMode && pickerMode.type === 'equipment' && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-green-500 w-full max-w-2xl rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Select Item for {pickerMode.slotType}</h3>
                <button onClick={() => setPickerMode(null)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {pickerMode.items.map(item => (
                                                                    <button
                    key={item.id}
                    onClick={() => pickerMode.onSelect(pickerMode.slotType, pickerMode.slotIndex, item.id)}
                    className="text-left p-3 bg-slate-950 border border-slate-700 rounded hover:border-green-500 transition-all"
                  >
                    <div className={`font-bold ${
                      item.rarity === 'Legendary' ? 'text-yellow-400' :
                      item.rarity === 'Epic' ? 'text-purple-400' :
                      item.rarity === 'Rare' ? 'text-blue-400' :
                      'text-slate-200'
                    }`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-400">{item.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Snapshot Suggestion Badge */}
        {snapshotSuggestion && snapshotSuggestion.shouldCreate && (
          <div className="absolute bottom-4 right-4 bg-blue-900/90 border border-blue-500 p-4 rounded-lg shadow-xl max-w-sm z-40">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-blue-300">SNAPSHOT SUGGESTED</div>
              <button onClick={() => setSnapshotSuggestion(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="text-xs text-slate-300 mb-2">{snapshotSuggestion.reason}</div>
            <div className="text-xs text-blue-400 italic mb-2">"{snapshotSuggestion.suggestedNote}"</div>
            <div className="text-xs text-slate-400">Confidence: {(snapshotSuggestion.confidence * 100).toFixed(0)}%</div>
          </div>
        )}

        {/* Item Tooltip */}
        {hoveredItem && (
          <ItemTooltip 
            item={hoveredItem} 
            x={tooltipPosition.x} 
            y={tooltipPosition.y} 
          />
        )}
        {/* Item Action Menu */}
        {actionMenu.item && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setActionMenu({ item: null, x: 0, y: 0 })}
            />
            <ItemActionMenu
              item={actionMenu.item}
              x={actionMenu.x}
              y={actionMenu.y}
              onEquip={() => {
                try {
                  if (handleItemActionEquip) {
                    handleItemActionEquip(actionMenu.item);
                  } else {
                    toastService.error('Handler not available');
                  }
                } catch (e) {
                  toastService.error(`Error: ${e.message}`);
                }
              }}
              onEquipReplace={() => {
                try {
                  if (handleItemActionEquipReplace) {
                    handleItemActionEquipReplace(actionMenu.item);
                  } else {
                    toastService.error('Handler not available');
                  }
                } catch (e) {
                  toastService.error(`Error: ${e.message}`);
                }
              }}
              onRemove={() => {
                try {
                  if (handleItemActionRemove) {
                    handleItemActionRemove(actionMenu.item);
                  } else {
                    toastService.error('Handler not available');
                  }
                } catch (e) {
                  toastService.error(`Error: ${e.message}`);
                }
              }}
              onViewDetails={() => {
                try {
                  if (handleItemActionViewDetails) {
                    handleItemActionViewDetails(actionMenu.item);
                  } else {
                    setHoveredItem(actionMenu.item);
                    setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                  }
                } catch (e) {
                  setHoveredItem(actionMenu.item);
                  setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                }
              }}
              onClose={() => setActionMenu({ item: null, x: 0, y: 0 })}
            />
          </>
        )}
        {/* Skill Tooltip */}
        {hoveredSkill && (
          <SkillTooltip 
            skill={hoveredSkill} 
            x={tooltipPosition.x} 
            y={tooltipPosition.y} 
          />
        )}
    </div>
    );
  };

  // Item Tooltip Component
  const ItemTooltip = ({ item, x, y }) => {
    if (!item) return null;

    const rarityColor = item.rarity === 'Legendary' ? 'text-yellow-400' :
      item.rarity === 'Epic' ? 'text-purple-400' :
      item.rarity === 'Rare' ? 'text-blue-400' :
      item.rarity === 'Uncommon' ? 'text-green-400' :
      'text-slate-200';

    // Calculate tooltip position to avoid screen edges
    const tooltipWidth = 300;
    const tooltipHeight = 400;
    const padding = 20;
    let tooltipX = x + 15;
    let tooltipY = y + 15;

    // Adjust if tooltip would go off right edge
    if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = x - tooltipWidth - 15;
    }
    // Adjust if tooltip would go off bottom edge
    if (tooltipY + tooltipHeight > window.innerHeight) {
      tooltipY = y - tooltipHeight - 15;
    }
    // Ensure tooltip doesn't go off left/top edges
    tooltipX = Math.max(padding, tooltipX);
    tooltipY = Math.max(padding, tooltipY);

    return (
      <div
        className="fixed z-50 bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl p-4 max-w-xs pointer-events-none"
        style={{
          left: `${tooltipX}px`,
          top: `${tooltipY}px`,
          minWidth: '280px'
        }}
      >
        {/* Item Name */}
        <div className={`text-lg font-bold mb-1 ${rarityColor}`}>
          {item.name}
        </div>
        
        {/* Item Type */}
        <div className="text-sm text-slate-400 mb-2">
          {item.type}
        </div>
        
        <div className="border-t border-slate-700 my-2"></div>
        
        {/* Stats */}
        {item.stats && Object.keys(item.stats).length > 0 && (
          <>
            <div className="space-y-1 mb-2">
              {Object.entries(item.stats).map(([stat, val]) => {
                let statValue = 0;
                if (Array.isArray(val)) {
                  statValue = val.reduce((sum, mod) => {
                    const modValue = typeof mod === 'object' && mod !== null ? (mod.value || 0) : (mod || 0);
                    return sum + modValue;
                  }, 0);
                } else if (typeof val === 'number') {
                  statValue = val;
                } else if (typeof val === 'object' && val !== null) {
                  statValue = val.value || 0;
                }
                
                return (
                  <div key={stat} className={`text-sm font-mono ${statValue > 0 ? 'text-green-400' : statValue < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {statValue > 0 ? '+' : ''}{statValue} {stat}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-700 my-2"></div>
          </>
        )}
        
        {/* Skills Granted */}
        {item.grantsSkills && item.grantsSkills.length > 0 && (
          <>
            <div className="mb-2">
              <div className="text-xs text-slate-500 mb-1">Grants Skills:</div>
              {item.grantsSkills.map((skillId, idx) => {
                const skill = worldState.skillBank.find(s => s.id === skillId);
                return skill ? (
                  <div key={idx} className="text-sm text-blue-400 font-mono">
                    • {skill.name}
                                                                </div>
                                                            ) : null;
                                                        })}
                                                    </div>
            <div className="border-t border-slate-700 my-2"></div>
          </>
        )}
        
        {/* Description */}
        {item.desc && (
          <>
            <div className="text-sm text-slate-300 italic mb-2">
              {item.desc}
                                            </div>
            <div className="border-t border-slate-700 my-2"></div>
          </>
        )}
        
        {/* Quest Text */}
        {item.quests && item.quests.trim() && (
          <>
            <div className="mb-2">
              <div className="text-xs text-yellow-400 font-bold mb-1">Quest:</div>
              <div className="text-sm text-yellow-300">
                {item.quests}
              </div>
            </div>
            <div className="border-t border-slate-700 my-2"></div>
          </>
        )}
        
        {/* Debuffs */}
        {item.debuffs && item.debuffs.trim() && (
          <div className="mb-2">
            <div className="text-xs text-red-400 font-bold mb-1">Debuff:</div>
            <div className="text-sm text-red-300">
              {item.debuffs}
            </div>
          </div>
        )}
        
        {/* Rarity Badge */}
        <div className="mt-2 pt-2 border-t border-slate-700">
          <div className={`text-xs font-bold ${rarityColor}`}>
            {item.rarity || 'Common'}
          </div>
        </div>
                                    </div>
                                );
};

// Stat Tooltip Component
const StatTooltip = ({ statInfo, statName, baseValue, totalValue, modifier, fromItems = 0, fromSkills = 0, fromEquipment = 0, x, y }) => {
  if (!statInfo) return null;

  const tooltipWidth = 280;
  const tooltipHeight = 200;
  const padding = 20;
  let tooltipX = x + 15;
  let tooltipY = y + 15;

  if (tooltipX + tooltipWidth > window.innerWidth) {
    tooltipX = x - tooltipWidth - 15;
  }
  if (tooltipY + tooltipHeight > window.innerHeight) {
    tooltipY = y - tooltipHeight - 15;
  }
  tooltipX = Math.max(padding, tooltipX);
  tooltipY = Math.max(padding, tooltipY);

  return (
    <div
      className="fixed z-50 bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl p-3 pointer-events-none"
      style={{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`,
        minWidth: '260px'
      }}
    >
      <div className="text-sm font-bold text-blue-400 mb-2 uppercase">{statName}</div>
      {statInfo.description && (
        <div className="text-xs text-slate-400 mb-3">{statInfo.description}</div>
      )}
      <div className="border-t border-slate-700 my-2"></div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Base Value:</span>
          <span className="text-slate-200 font-mono">{baseValue}</span>
                        </div>
        {fromItems !== 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">From Items:</span>
            <span className="text-green-400 font-mono">+{fromItems}</span>
                    </div>
        )}
        {fromSkills !== 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">From Skills:</span>
            <span className="text-purple-400 font-mono">+{fromSkills}</span>
                </div>
        )}
        {fromEquipment !== 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">From Equipment:</span>
            <span className="text-yellow-400 font-mono">+{fromEquipment}</span>
            </div>
        )}
        <div className="border-t border-slate-700 my-1"></div>
        <div className="flex justify-between">
          <span className="text-slate-300 font-bold">Total:</span>
          <span className="text-blue-400 font-bold font-mono">{totalValue}</span>
        </div>
        {statInfo.max && (
          <div className="flex justify-between mt-1">
            <span className="text-slate-500 text-[10px]">Percentage:</span>
            <span className="text-slate-500 text-[10px] font-mono">{Math.round((totalValue / statInfo.max) * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Skill Tooltip Component
const SkillTooltip = ({ skill, x, y }) => {
  const [symbolUrl, setSymbolUrl] = useState(null);
  
  useEffect(() => {
    if (skill?.symbolPath) {
      imageGenerationService.getImageUrl(skill.symbolPath)
        .then(url => setSymbolUrl(url))
        .catch(() => setSymbolUrl(null));
    } else {
      setSymbolUrl(null);
    }
  }, [skill?.symbolPath]);

  if (!skill) return null;

  const tooltipWidth = 300;
  const tooltipHeight = 350;
  const padding = 20;
  let tooltipX = x + 15;
  let tooltipY = y + 15;

  if (tooltipX + tooltipWidth > window.innerWidth) {
    tooltipX = x - tooltipWidth - 15;
  }
  if (tooltipY + tooltipHeight > window.innerHeight) {
    tooltipY = y - tooltipHeight - 15;
  }
  tooltipX = Math.max(padding, tooltipX);
  tooltipY = Math.max(padding, tooltipY);

  const typeColor = skill.type === 'Combat' ? 'text-red-400' :
    skill.type === 'Magic' ? 'text-blue-400' :
    skill.type === 'Support' ? 'text-green-400' :
    skill.type === 'Passive' ? 'text-yellow-400' :
    'text-slate-400';

  return (
    <div
      className="fixed z-50 bg-slate-900 border-2 border-purple-500 rounded-lg shadow-2xl p-3 pointer-events-none"
      style={{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`,
        minWidth: '280px'
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {symbolUrl ? (
          <img src={symbolUrl} alt={skill.name} className="w-16 h-16 object-contain rounded-lg border border-purple-500/30 bg-slate-800/50" />
        ) : (
          <div className="w-16 h-16 bg-slate-800/50 rounded-lg border border-purple-500/30 flex items-center justify-center">
            <Zap className="w-8 h-8 text-purple-500/50" />
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm font-bold text-purple-400 mb-1">{skill.name}</div>
          <div className={`text-xs ${typeColor}`}>{skill.type} Skill</div>
        </div>
      </div>
      {skill.tier && (
        <div className="text-xs text-slate-500 mb-2">Tier {skill.tier}</div>
      )}
      {skill.description && (
        <div className="text-xs text-slate-400 mb-3">{skill.description}</div>
      )}
      <div className="border-t border-slate-700 my-2"></div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Current Level:</span>
          <span className="text-purple-400 font-mono">{skill.value || 0}</span>
        </div>
        {skill.maxLevel && (
          <div className="flex justify-between">
            <span className="text-slate-400">Max Level:</span>
            <span className="text-slate-300 font-mono">{skill.maxLevel}</span>
          </div>
        )}
        {skill.statModifiers && Object.keys(skill.statModifiers).length > 0 && (
          <>
            <div className="border-t border-slate-700 my-1"></div>
            <div className="text-slate-400 text-[10px] uppercase mb-1">Stat Modifiers:</div>
            {Object.entries(skill.statModifiers).map(([stat, val]) => (
              <div key={stat} className="flex justify-between">
                <span className="text-slate-500 text-[10px]">{stat}:</span>
                <span className="text-green-400 text-[10px] font-mono">+{val}</span>
              </div>
            ))}
          </>
        )}
        {skill.scaling && (
          <>
            <div className="border-t border-slate-700 my-1"></div>
            <div className="text-slate-400 text-[10px]">Scaling: {skill.scaling}</div>
          </>
        )}
        {skill.prerequisites && skill.prerequisites.length > 0 && (
          <>
            <div className="border-t border-slate-700 my-1"></div>
            <div className="text-slate-400 text-[10px]">Prerequisites: {skill.prerequisites.join(', ')}</div>
          </>
        )}
      </div>
    </div>
  );
};

// Slot Tooltip Component
const SlotTooltip = ({ slotType, x, y }) => {
  if (!slotType) return null;

  const tooltipWidth = 200;
  const tooltipHeight = 100;
  const padding = 20;
  let tooltipX = x + 15;
  let tooltipY = y + 15;

  if (tooltipX + tooltipWidth > window.innerWidth) {
    tooltipX = x - tooltipWidth - 15;
  }
  if (tooltipY + tooltipHeight > window.innerHeight) {
    tooltipY = y - tooltipHeight - 15;
  }
  tooltipX = Math.max(padding, tooltipX);
  tooltipY = Math.max(padding, tooltipY);

  const slotInfo = {
    helm: { name: 'Helm', desc: 'Head protection equipment' },
    cape: { name: 'Cape', desc: 'Back/cloak equipment' },
    amulet: { name: 'Amulet', desc: 'Neck jewelry' },
    armour: { name: 'Armour', desc: 'Body protection' },
    gloves: { name: 'Gloves', desc: 'Hand protection' },
    belt: { name: 'Belt', desc: 'Waist equipment' },
    boots: { name: 'Boots', desc: 'Foot protection' },
    leftHand: { name: 'Left Hand', desc: 'Weapon or shield' },
    rightHand: { name: 'Right Hand', desc: 'Weapon or shield' },
    ring: { name: 'Ring', desc: 'Finger jewelry' },
    charm: { name: 'Charm', desc: 'Inventory charm' }
  };

  const info = slotInfo[slotType] || { name: slotType, desc: 'Equipment slot' };

  return (
    <div
      className="fixed z-50 bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl p-3 pointer-events-none"
      style={{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`,
        minWidth: '180px'
      }}
    >
      <div className="text-sm font-bold text-slate-300 mb-1">{info.name}</div>
      <div className="text-xs text-slate-400">{info.desc}</div>
      <div className="text-xs text-slate-500 mt-2">Click to equip item</div>
    </div>
  );
};

// Item Action Menu Component
const ItemActionMenu = ({ item, x, y, onEquip, onEquipReplace, onRemove, onViewDetails, onClose }) => {
  if (!item) return null;

  const menuWidth = 200;
  const menuHeight = 200;
  const padding = 20;
  let menuX = x;
  let menuY = y;

  if (menuX + menuWidth > window.innerWidth) {
    menuX = x - menuWidth;
  }
  if (menuY + menuHeight > window.innerHeight) {
    menuY = y - menuHeight;
  }
  menuX = Math.max(padding, menuX);
  menuY = Math.max(padding, menuY);

  return (
    <div
      className="fixed z-50 bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl pointer-events-auto"
      style={{
        left: `${menuX}px`,
        top: `${menuY}px`,
        minWidth: '180px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 space-y-1">
        <button
          onClick={() => {
            onEquip();
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-slate-800 rounded transition-colors"
        >
          Equip
        </button>
        <button
          onClick={() => {
            onEquipReplace();
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-slate-800 rounded transition-colors"
        >
          Equip (Replace)
        </button>
        <button
          onClick={() => {
            onViewDetails();
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-slate-800 rounded transition-colors"
        >
          View Details
        </button>
        <div className="border-t border-slate-700 my-1"></div>
        <button
          onClick={() => {
            if (window.confirm(`Remove ${item.name} from inventory?`)) {
              onRemove();
            }
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded transition-colors"
        >
          Remove
        </button>
        <button
          onClick={onClose}
          className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Item Image Component - Helper for loading and displaying item images
const ItemImage = ({ item, className = '' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item?.imagePath) {
      setLoading(true);
      imageGenerationService.getImageUrl(item.imagePath)
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
  }, [item?.imagePath]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (imageUrl) {
    return <img src={imageUrl} alt={item.name} className={`object-contain ${className}`} style={{ background: 'transparent' }} />;
  }

  return null;
};

// Book Symbol Component
const BookSymbol = ({ book, size = 'md' }) => {
  const [symbolUrl, setSymbolUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book?.symbolPath) {
      setLoading(true);
      imageGenerationService.getImageUrl(book.symbolPath)
        .then(url => {
          setSymbolUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setSymbolUrl(null);
          setLoading(false);
        });
    } else {
      setSymbolUrl(null);
    }
  }, [book?.symbolPath]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-800/50 rounded border border-slate-700 flex items-center justify-center`}>
        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (symbolUrl) {
    return <img src={symbolUrl} alt={book.title} className={`${sizeClasses[size]} object-contain rounded border border-slate-700 bg-slate-800/50`} />;
  }

  return (
    <div className={`${sizeClasses[size]} bg-slate-800/50 rounded border border-slate-700 flex items-center justify-center`}>
      <BookOpen className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-slate-600 opacity-50`} />
    </div>
  );
};

// Chapter Symbol Component
const ChapterSymbol = ({ chapter, size = 'sm' }) => {
  const [symbolUrl, setSymbolUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chapter?.symbolPath) {
      setLoading(true);
      imageGenerationService.getImageUrl(chapter.symbolPath)
        .then(url => {
          setSymbolUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setSymbolUrl(null);
          setLoading(false);
        });
    } else {
      setSymbolUrl(null);
    }
  }, [chapter?.symbolPath]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-800/50 rounded border border-slate-700 flex items-center justify-center`}>
        <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (symbolUrl) {
    return <img src={symbolUrl} alt={chapter.title} className={`${sizeClasses[size]} object-contain rounded border border-slate-700 bg-slate-800/50`} />;
  }

  return (
    <div className={`${sizeClasses[size]} bg-slate-800/50 rounded border border-slate-700 flex items-center justify-center`}>
      <FileText className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-slate-600 opacity-50`} />
    </div>
  );
};

// Skill Symbol Component - Helper for loading and displaying skill symbols
const SkillSymbol = ({ skill, className = '', size = 'md' }) => {
  const [symbolUrl, setSymbolUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (skill?.symbolPath) {
      setLoading(true);
      imageGenerationService.getImageUrl(skill.symbolPath)
        .then(url => {
          setSymbolUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setSymbolUrl(null);
          setLoading(false);
        });
    } else {
      setSymbolUrl(null);
    }
  }, [skill?.symbolPath]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (symbolUrl) {
    return <img src={symbolUrl} alt={skill.name} className={`object-contain ${sizeClasses[size]} ${className}`} />;
  }

  return null;
};

// Creature Silhouette Component - Diablo II style abstract creature
const CreatureSilhouette = ({ equipment, onEquip, onUnequip, worldState }) => {
  const slotPositions = {
    helm: { x: '50%', y: '4%', size: 'sm' },
    cape: { x: '50%', y: '9%', size: 'sm' },
    amulet: { x: '50%', y: '16%', size: 'sm' },
    armour: { x: '50%', y: '36%', size: 'md' },
    leftHand: { x: '12%', y: '30%', size: 'md' },
    rightHand: { x: '88%', y: '30%', size: 'md' },
    gloves: { x: '12%', y: '50%', size: 'sm' },
    belt: { x: '50%', y: '56%', size: 'sm' },
    boots: { x: '50%', y: '76%', size: 'sm' }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8" style={{ height: '600px', minHeight: '600px' }}>
      {/* SVG Silhouette Background */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        viewBox="0 0 200 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 0 }}
      >
        {/* Abstract creature silhouette - skeletal/geometric design */}
        {/* Head */}
        <ellipse cx="100" cy="30" rx="25" ry="30" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1.5" strokeDasharray="2,2"/>
        
        {/* Neck */}
        <rect x="95" y="50" width="10" height="15" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="1,1"/>
        
        {/* Torso */}
        <path 
          d="M 70 65 Q 100 70 130 65 L 130 150 Q 100 160 70 150 Z" 
          fill="none" 
          stroke="rgba(34,197,94,0.3)" 
          strokeWidth="2" 
          strokeDasharray="2,2"
        />
        
        {/* Left Arm */}
        <path 
          d="M 70 80 Q 50 90 40 120 Q 35 140 40 160" 
          fill="none" 
          stroke="rgba(34,197,94,0.3)" 
          strokeWidth="1.5" 
          strokeDasharray="2,2"
        />
        
        {/* Right Arm */}
        <path 
          d="M 130 80 Q 150 90 160 120 Q 165 140 160 160" 
          fill="none" 
          stroke="rgba(34,197,94,0.3)" 
          strokeWidth="1.5" 
          strokeDasharray="2,2"
        />
        
        {/* Waist/Belt Area */}
        <ellipse cx="100" cy="180" rx="35" ry="8" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="1,1"/>
        
        {/* Left Leg */}
        <path 
          d="M 85 188 Q 75 200 70 230 Q 68 250 70 270" 
          fill="none" 
          stroke="rgba(34,197,94,0.3)" 
          strokeWidth="1.5" 
          strokeDasharray="2,2"
        />
        
        {/* Right Leg */}
        <path 
          d="M 115 188 Q 125 200 130 230 Q 132 250 130 270" 
          fill="none" 
          stroke="rgba(34,197,94,0.3)" 
          strokeWidth="1.5" 
          strokeDasharray="2,2"
        />
        
        {/* Subtle glow effect */}
        <ellipse cx="100" cy="100" rx="60" ry="80" fill="rgba(34,197,94,0.02)" />
      </svg>

      {/* Equipment Slots positioned on silhouette */}
      {Object.entries(slotPositions).map(([slotType, pos]) => (
        <div
          key={slotType}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: pos.x,
            top: pos.y,
            pointerEvents: 'auto'
          }}
        >
          <EquipmentSlot
            slotType={slotType}
            itemId={equipment[slotType]}
            onEquip={onEquip}
            onUnequip={onUnequip}
            label={slotType.charAt(0).toUpperCase() + slotType.slice(1).replace(/([A-Z])/g, ' $1')}
            size={pos.size}
          />
        </div>
      ))}
    </div>
  );
};

// Equipment Slot Component with epic visual polish
const EquipmentSlot = ({ slotType, slotIndex = null, itemId, onEquip, onUnequip, label, size = 'md' }) => {
    const item = itemId ? worldState.itemBank.find(i => i.id === itemId) : null;
    const [isHovering, setIsHovering] = useState(false);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
    const [itemImage, setItemImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);

    // Load item image
    useEffect(() => {
      if (item?.imagePath) {
        setImageLoading(true);
        imageGenerationService.getImageUrl(item.imagePath)
          .then(url => {
            setItemImage(url);
            setImageLoading(false);
          })
          .catch(() => {
            setItemImage(null);
            setImageLoading(false);
          });
      } else {
        setItemImage(null);
      }
    }, [item?.imagePath]);
    
    const sizeClasses = {
      sm: 'w-16 h-16 text-[9px]',
      md: 'w-20 h-20 text-xs',
      lg: 'w-24 h-24 text-sm'
    };

    const getRarityStyles = () => {
      if (!item) return {
        border: 'border-2 border-dashed border-slate-600',
        shadow: 'shadow-none',
        glow: '',
        bg: 'bg-gradient-to-br from-slate-900/80 to-slate-800/60',
        text: 'text-slate-500'
      };
      
      switch(item.rarity) {
        case 'Legendary':
          return {
            border: 'border-2 border-yellow-500',
            shadow: 'shadow-lg shadow-yellow-500/60',
            glow: 'hover:shadow-2xl hover:shadow-yellow-400/80',
            bg: 'bg-gradient-to-br from-yellow-900/30 via-amber-900/20 to-yellow-800/30',
            text: 'text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]',
            pulse: 'animate-pulse'
          };
        case 'Epic':
          return {
            border: 'border-2 border-purple-500',
            shadow: 'shadow-lg shadow-purple-500/60',
            glow: 'hover:shadow-2xl hover:shadow-purple-400/80',
            bg: 'bg-gradient-to-br from-purple-900/30 via-violet-900/20 to-purple-800/30',
            text: 'text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]',
            pulse: ''
          };
        case 'Rare':
          return {
            border: 'border-2 border-blue-500',
            shadow: 'shadow-lg shadow-blue-500/60',
            glow: 'hover:shadow-2xl hover:shadow-blue-400/80',
            bg: 'bg-gradient-to-br from-blue-900/30 via-cyan-900/20 to-blue-800/30',
            text: 'text-blue-300 drop-shadow-[0_0_3px_rgba(59,130,246,0.7)]',
            pulse: ''
          };
        case 'Uncommon':
          return {
            border: 'border-2 border-green-500',
            shadow: 'shadow-lg shadow-green-500/50',
            glow: 'hover:shadow-2xl hover:shadow-green-400/70',
            bg: 'bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-green-800/30',
            text: 'text-green-300 drop-shadow-[0_0_3px_rgba(34,197,94,0.7)]',
            pulse: ''
          };
        default:
          return {
            border: 'border-2 border-slate-500',
            shadow: 'shadow-md shadow-slate-500/40',
            glow: 'hover:shadow-lg hover:shadow-slate-400/50',
            bg: 'bg-gradient-to-br from-slate-900/70 to-slate-800/50',
            text: 'text-slate-300',
            pulse: ''
          };
      }
    };

    const rarityStyles = getRarityStyles();
    
    return (
      <>
        <div 
          className={`
            ${sizeClasses[size]} 
            ${rarityStyles.border} 
            ${rarityStyles.shadow} 
            ${rarityStyles.bg}
            ${item ? rarityStyles.glow : 'hover:border-green-400 hover:shadow-green-500/40'}
            rounded-lg 
            flex flex-col items-center justify-center 
            cursor-pointer 
            transition-all duration-300 ease-in-out 
            relative group 
            overflow-hidden
            ${item ? 'hover:scale-110 transform' : 'hover:scale-105'}
            ${item ? 'backdrop-blur-sm' : ''}
            ${item && rarityStyles.pulse ? rarityStyles.pulse : ''}
            before:absolute before:inset-0 before:rounded-lg
            ${item ? 'before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300' : ''}
          `}
          style={item ? {
            boxShadow: item.rarity === 'Legendary' 
              ? '0 0 20px rgba(250, 204, 21, 0.4), inset 0 0 20px rgba(250, 204, 21, 0.1)'
              : item.rarity === 'Epic'
              ? '0 0 15px rgba(168, 85, 247, 0.4), inset 0 0 15px rgba(168, 85, 247, 0.1)'
              : undefined
          } : {}}
          onClick={() => {
            if (item) {
              onUnequip(slotType, slotIndex);
            } else {
              // Open item picker for this slot type
              const compatibleItems = worldState.itemBank.filter(i => {
                const itemType = (i.type || '').toLowerCase();
                const slotTypeLower = slotType.toLowerCase();
                
                if (slotTypeLower.includes('ring')) return itemType.includes('ring');
                if (slotTypeLower.includes('charm')) return itemType.includes('charm');
                if (slotTypeLower.includes('helm')) return itemType.includes('helm') || itemType.includes('hat');
                if (slotTypeLower.includes('cape')) return itemType.includes('cape') || itemType.includes('cloak');
                if (slotTypeLower.includes('amulet')) return itemType.includes('amulet') || itemType.includes('necklace');
                if (slotTypeLower.includes('armour')) return itemType.includes('armour') || itemType.includes('armor') || itemType.includes('chest');
                if (slotTypeLower.includes('gloves')) return itemType.includes('gloves') || itemType.includes('gauntlets');
                if (slotTypeLower.includes('belt')) return itemType.includes('belt');
                if (slotTypeLower.includes('boots')) return itemType.includes('boots') || itemType.includes('shoes');
                if (slotTypeLower.includes('hand')) return itemType.includes('weapon') || itemType.includes('shield');
                return true;
              });
              
              setPickerMode({ type: 'equipment', slotType, slotIndex, items: compatibleItems, onSelect: onEquip });
            }
          }}
          onMouseEnter={(e) => {
            setIsHovering(true);
            setHoverPosition({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => {
            setHoverPosition({ x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoverPosition({ x: 0, y: 0 });
          }}
        >
          {item ? (
            <>
              {itemImage && !imageLoading ? (
                <img 
                  src={itemImage} 
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg z-0 absolute inset-0"
                />
              ) : imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : null}
              <div className={`font-bold truncate w-full text-center px-1 leading-tight z-10 ${rarityStyles.text} ${item.rarity === 'Legendary' ? 'font-extrabold' : 'font-semibold'} ${itemImage ? 'absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-1' : ''}`}>
                {item.name}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnequip(slotType, slotIndex);
                }}
                className="absolute top-1 right-1 bg-red-900/90 hover:bg-red-800 border border-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 hover:scale-110 shadow-lg"
                title="Unequip"
              >
                <X className="w-3 h-3"/>
              </button>
            </>
          ) : (
            <>
              <div className="text-slate-400 text-center px-1 text-[8px] leading-tight font-semibold uppercase tracking-wider z-10">{label || slotType}</div>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-8 h-8 border border-slate-600 rounded"></div>
              </div>
            </>
          )}
        </div>
        {isHovering && (
          <div 
            className="fixed z-[9999] pointer-events-none" 
            style={{ 
              left: `${hoverPosition.x + 15}px`, 
              top: `${hoverPosition.y + 15}px`,
              transform: 'none'
            }}
          >
            {item ? (
              <ItemTooltip item={item} x={hoverPosition.x} y={hoverPosition.y} />
            ) : (
              <SlotTooltip slotType={slotType} x={hoverPosition.x} y={hoverPosition.y} />
            )}
          </div>
        )}
      </>
    );
  };

  const renderInventory = () => {
    const currentInventoryActorId = inventoryActorId || selectedActorId || (worldState.actors[0]?.id);
    const inventoryActor = worldState.actors.find(a => a.id === currentInventoryActorId);
    const calculatedInventoryActor = inventoryActor ? calculateActorState(inventoryActor, worldState.itemBank, worldState.skillBank) : null;
    
    if (!inventoryActor) {
      return (
        <div className="text-center p-20 text-slate-500">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No actors found. Create an actor first.</p>
        </div>
      );
    }

    const equipment = inventoryActor.equipment || {
      helm: null, cape: null, amulet: null, armour: null, gloves: null, belt: null, boots: null,
      leftHand: null, rightHand: null, rings: [null, null, null, null, null, null, null], charms: [null, null, null, null]
    };

    const handleEquip = async (slotType, slotIndex, itemId) => {
      const updatedEquipment = { ...equipment };
      
      if (slotIndex !== null && slotIndex !== undefined) {
        // Array slot (rings, charms)
        if (slotType === 'rings') {
          updatedEquipment.rings = [...updatedEquipment.rings];
          updatedEquipment.rings[slotIndex] = itemId;
        } else if (slotType === 'charms') {
          updatedEquipment.charms = [...updatedEquipment.charms];
          updatedEquipment.charms[slotIndex] = itemId;
        }
      } else {
        // Single slot
        updatedEquipment[slotType] = itemId;
      }
      
      const updatedActor = { ...inventoryActor, equipment: updatedEquipment };
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({
        ...prev,
        actors: prev.actors.map(a => a.id === inventoryActor.id ? updatedActor : a)
      }));
      setPickerMode(null);
      toastService.success(`Equipped ${worldState.itemBank.find(i => i.id === itemId)?.name || 'item'}`);
    };

    const handleUnequip = async (slotType, slotIndex) => {
      const updatedEquipment = { ...equipment };
      let itemId = null;
      
      if (slotIndex !== null && slotIndex !== undefined) {
        if (slotType === 'rings') {
          itemId = updatedEquipment.rings[slotIndex];
          updatedEquipment.rings = [...updatedEquipment.rings];
          updatedEquipment.rings[slotIndex] = null;
        } else if (slotType === 'charms') {
          itemId = updatedEquipment.charms[slotIndex];
          updatedEquipment.charms = [...updatedEquipment.charms];
          updatedEquipment.charms[slotIndex] = null;
        }
      } else {
        itemId = updatedEquipment[slotType];
        updatedEquipment[slotType] = null;
      }
      
      const updatedActor = { ...inventoryActor, equipment: updatedEquipment };
      // Add item back to inventory if not already there
      if (itemId && !updatedActor.inventory.includes(itemId)) {
        updatedActor.inventory = [...updatedActor.inventory, itemId];
      }
      
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({
        ...prev,
        actors: prev.actors.map(a => a.id === inventoryActor.id ? updatedActor : a)
      }));
      toastService.success('Item unequipped');
    };

    const findCompatibleSlot = (item) => {
      // First check if item has explicit equipmentSlot field (from generator)
      if (item.equipmentSlot) {
        const slot = item.equipmentSlot;
        if (slot === 'rings') {
          const emptyRingIndex = equipment.rings.findIndex(r => !r);
          if (emptyRingIndex !== -1) return { slot: 'rings', index: emptyRingIndex };
        } else if (slot === 'charms') {
          const emptyCharmIndex = equipment.charms.findIndex(c => !c);
          if (emptyCharmIndex !== -1) return { slot: 'charms', index: emptyCharmIndex };
        } else if (slot === 'weapon') {
          return { slot: equipment.leftHand ? 'rightHand' : 'leftHand', index: null };
        } else if (['helm', 'cape', 'amulet', 'armour', 'gloves', 'belt', 'boots'].includes(slot)) {
          return { slot: slot, index: null };
        }
      }
      
      // Fallback to type-based detection (for backwards compatibility)
      // Check both type and baseType
      const itemType = (item.type || '').toLowerCase();
      const itemBaseType = (item.baseType || '').toLowerCase();
      if (itemType.includes('ring')) {
        const emptyRingIndex = equipment.rings.findIndex(r => !r);
        if (emptyRingIndex !== -1) return { slot: 'rings', index: emptyRingIndex };
      } else if (itemType.includes('charm')) {
        const emptyCharmIndex = equipment.charms.findIndex(c => !c);
        if (emptyCharmIndex !== -1) return { slot: 'charms', index: emptyCharmIndex };
      } else if (itemType.includes('helm') || itemType.includes('hat')) {
        return { slot: 'helm', index: null };
      } else if (itemType.includes('cape') || itemType.includes('cloak')) {
        return { slot: 'cape', index: null };
      } else if (itemType.includes('amulet') || itemType.includes('necklace')) {
        return { slot: 'amulet', index: null };
      } else if (itemType.includes('armour') || itemType.includes('armor') || itemType.includes('chest')) {
        return { slot: 'armour', index: null };
      } else if (itemType.includes('gloves') || itemType.includes('gauntlets')) {
        return { slot: 'gloves', index: null };
      } else if (itemType.includes('belt')) {
        return { slot: 'belt', index: null };
      } else if (itemType.includes('boots') || itemType.includes('shoes')) {
        return { slot: 'boots', index: null };
      } else if (itemType.includes('weapon') || itemType.includes('shield') || itemBaseType === 'weapon') {
        return { slot: equipment.leftHand ? 'rightHand' : 'leftHand', index: null };
      }
      return null;
    };

    const handleItemActionEquip = (item) => {
      const slotInfo = findCompatibleSlot(item);
      if (slotInfo) {
        if (slotInfo.index !== null) {
          handleEquip(slotInfo.slot, slotInfo.index, item.id);
        } else {
          if (equipment[slotInfo.slot]) {
            toastService.warning(`Slot ${slotInfo.slot} is already filled. Use "Equip (Replace)" to replace it.`);
          } else {
            handleEquip(slotInfo.slot, null, item.id);
          }
        }
      } else {
        toastService.warning('No compatible slot found for this item.');
      }
    };

    const handleItemActionEquipReplace = (item) => {
      const slotInfo = findCompatibleSlot(item);
      if (slotInfo) {
        if (slotInfo.index !== null) {
          handleEquip(slotInfo.slot, slotInfo.index, item.id);
        } else {
          const oldItemId = equipment[slotInfo.slot];
          if (oldItemId) {
            const updatedActor = { ...inventoryActor };
            if (!updatedActor.inventory.includes(oldItemId)) {
              updatedActor.inventory = [...updatedActor.inventory, oldItemId];
            }
            const updatedEquipment = { ...equipment };
            updatedEquipment[slotInfo.slot] = item.id;
            updatedActor.equipment = updatedEquipment;
            saveToDatabase('actors', updatedActor);
            setWorldState(prev => ({
              ...prev,
              actors: prev.actors.map(a => a.id === inventoryActor.id ? updatedActor : a)
            }));
            toastService.success(`Replaced item in ${slotInfo.slot}`);
          } else {
            handleEquip(slotInfo.slot, null, item.id);
          }
        }
      } else {
        toastService.warning('No compatible slot found for this item.');
      }
    };

    const handleItemActionRemove = async (item) => {
      const updatedActor = { ...inventoryActor };
      updatedActor.inventory = updatedActor.inventory.filter(id => id !== item.id);
      await saveToDatabase('actors', updatedActor);
      setWorldState(prev => ({
        ...prev,
        actors: prev.actors.map(a => a.id === inventoryActor.id ? updatedActor : a)
      }));
      toastService.success(`Removed ${item.name} from inventory`);
    };

    const handleItemActionViewDetails = (item) => {
      setHoveredItem(item);
      setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    };

    // Get unequipped items (items in inventory that aren't equipped)
    const equippedItemIds = [
      equipment.helm, equipment.cape, equipment.amulet, equipment.armour,
      equipment.gloves, equipment.belt, equipment.boots,
      equipment.leftHand, equipment.rightHand,
      ...equipment.rings.filter(Boolean),
      ...equipment.charms.filter(Boolean)
    ].filter(Boolean);

    const unequippedItems = inventoryActor.inventory
      .map(id => worldState.itemBank.find(i => i.id === id))
      .filter(item => item && !equippedItemIds.includes(item.id));

    return (
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="flex justify-between items-center mb-4 bg-slate-900 p-4 rounded border border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center">
            <ShoppingBag className="mr-3 text-green-500" /> INVENTORY
          </h2>
          <select
            value={currentInventoryActorId}
            onChange={(e) => setInventoryActorId(e.target.value)}
            className="bg-slate-800 text-white text-sm p-2 rounded border border-slate-700"
          >
            {worldState.actors.map(actor => (
              <option key={actor.id} value={actor.id}>{actor.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6 h-full overflow-hidden">
          {/* Equipment Slots - Epic Diablo II Style */}
          <div className="w-2/5 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border-2 border-slate-700/50 shadow-2xl p-6 rounded-xl overflow-y-auto backdrop-blur-sm relative">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,197,94,0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>
            
            <div className="relative z-10">
              <h3 className="text-sm font-extrabold text-green-400 mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">Equipment</span>
              </h3>
              
              {/* Creature Silhouette with Equipment Slots */}
              <div className="mb-8 overflow-visible" style={{ minHeight: '600px' }}>
                <CreatureSilhouette 
                  equipment={equipment}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                  worldState={worldState}
                />
              </div>

              {/* Rings Row */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-xs font-bold text-slate-300 mb-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                  <span className="text-slate-400">Rings</span>
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {equipment.rings.map((ringId, idx) => (
                    <EquipmentSlot 
                      key={idx} 
                      slotType="rings" 
                      slotIndex={idx}
                      itemId={ringId} 
                      onEquip={handleEquip} 
                      onUnequip={handleUnequip} 
                      label={`Ring ${idx + 1}`} 
                      size="sm" 
                    />
                  ))}
                </div>
              </div>

              {/* Charms Row */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="text-xs font-bold text-slate-300 mb-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                  <span className="text-slate-400">Charms</span>
                  <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {equipment.charms.map((charmId, idx) => (
                    <EquipmentSlot 
                      key={idx} 
                      slotType="charms" 
                      slotIndex={idx}
                      itemId={charmId} 
                      onEquip={handleEquip} 
                      onUnequip={handleUnequip} 
                      label={`Charm ${idx + 1}`} 
                      size="sm" 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Equipped Items Stats Summary */}
            {calculatedInventoryActor && (
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="text-xs font-bold text-green-400 mb-2 uppercase">Equipment Stats</div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  {Object.entries(calculatedInventoryActor.statModifiers || {}).length > 0 ? (
                    Object.entries(calculatedInventoryActor.statModifiers).slice(0, 6).map(([stat, val]) => (
                      <div key={stat} className="flex justify-between">
                        <span>{stat}:</span>
                        <span className={val > 0 ? 'text-green-400' : 'text-red-400'}>
                          {val > 0 ? '+' : ''}{val}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No items equipped</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unequipped Items List - Epic Style */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-lg p-4">
            <h3 className="text-sm font-extrabold text-yellow-400 mb-6 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-yellow-500" />
              <span className="drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">Unequipped Items</span>
              <span className="ml-auto text-xs bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded-full border border-yellow-700/50">
                {unequippedItems.length}
              </span>
            </h3>
            {unequippedItems.length === 0 ? (
              <div className="text-center p-20 text-slate-500">
                <div className="relative">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-lg opacity-50"></div>
                  </div>
                </div>
                <p className="text-sm font-semibold mt-4">All items are equipped</p>
                <p className="text-xs text-slate-600 mt-2">Click on equipment slots to add more items</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unequippedItems.map(item => {
                  const rarityStyles = {
                    Legendary: 'border-yellow-500/60 bg-gradient-to-br from-yellow-900/20 to-amber-900/10 hover:border-yellow-400 hover:shadow-yellow-500/40 text-yellow-300',
                    Epic: 'border-purple-500/60 bg-gradient-to-br from-purple-900/20 to-violet-900/10 hover:border-purple-400 hover:shadow-purple-500/40 text-purple-300',
                    Rare: 'border-blue-500/60 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 hover:border-blue-400 hover:shadow-blue-500/40 text-blue-300',
                    Uncommon: 'border-green-500/60 bg-gradient-to-br from-green-900/20 to-emerald-900/10 hover:border-green-400 hover:shadow-green-500/40 text-green-300',
                    Common: 'border-slate-600/60 bg-gradient-to-br from-slate-800/20 to-slate-900/10 hover:border-slate-400 hover:shadow-slate-500/30 text-slate-200'
                  };
                  const itemRarity = item.rarity || 'Common';
                  return (
                    <div 
                      key={item.id} 
                      className={`
                        border-2 ${rarityStyles[itemRarity]}
                        p-4 rounded-lg 
                        hover:scale-105 hover:shadow-xl
                        transition-all duration-300 ease-in-out 
                        cursor-pointer group relative
                        backdrop-blur-sm
                        overflow-hidden
                        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity
                      `}
                      style={item.rarity === 'Legendary' ? {
                        boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)'
                      } : item.rarity === 'Epic' ? {
                        boxShadow: '0 0 12px rgba(168, 85, 247, 0.2)'
                      } : {}}
                      onMouseEnter={(e) => {
                        setHoveredItem(item);
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(null);
                      }}
                      onClick={(e) => {
                        setActionMenu({ item, x: e.clientX, y: e.clientY });
                      }}
                    >
                      <div className="relative w-full h-32 mb-3 bg-slate-900/50 rounded overflow-hidden">
                        <ItemImage item={item} className="w-full h-full" />
                        {!item.imagePath && (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                            <Package className="w-8 h-8 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className={`font-bold text-sm mb-2 ${itemRarity === 'Legendary' ? 'drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-400 mb-3 font-medium">{item.type}</div>
                      <div className="text-[10px] text-green-400/80 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-semibold uppercase tracking-wider">
                        Click for actions
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Equipment Picker Modal */}
        {pickerMode && pickerMode.type === 'equipment' && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-green-500 w-full max-w-2xl rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Select Item for {pickerMode.slotType}</h3>
                <button onClick={() => setPickerMode(null)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {pickerMode.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => pickerMode.onSelect(pickerMode.slotType, pickerMode.slotIndex, item.id)}
                    className="text-left p-3 bg-slate-950 border border-slate-700 rounded hover:border-green-500 transition-all"
                  >
                    <div className={`font-bold ${
                      item.rarity === 'Legendary' ? 'text-yellow-400' :
                      item.rarity === 'Epic' ? 'text-purple-400' :
                      item.rarity === 'Rare' ? 'text-blue-400' :
                      'text-slate-200'
                    }`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-400">{item.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Item Tooltip */}
        {hoveredItem && (
          <ItemTooltip 
            item={hoveredItem} 
            x={tooltipPosition.x} 
            y={tooltipPosition.y} 
          />
        )}
        {/* Item Action Menu */}
        {actionMenu.item && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setActionMenu({ item: null, x: 0, y: 0 })}
            />
            <ItemActionMenu
              item={actionMenu.item}
              x={actionMenu.x}
              y={actionMenu.y}
              onEquip={() => {
                try {
                  if (handleItemActionEquip) {
                    handleItemActionEquip(actionMenu.item);
                  } else {
                    toastService.error('Handler not available');
                  }
                } catch (e) {
                  toastService.error(`Error: ${e.message}`);
                }
              }}
              onEquipReplace={() => {
                try {
                  if (handleItemActionEquipReplace) {
                    handleItemActionEquipReplace(actionMenu.item);
                  } else {
                    toastService.error('Handler not available');
                  }
                } catch (e) {
                  toastService.error(`Error: ${e.message}`);
                }
              }}
              onRemove={() => {
                try {
                  if (handleItemActionRemove) {
                    handleItemActionRemove(actionMenu.item);
                  } else {
                    toastService.error('Handler not available');
                  }
                } catch (e) {
                  toastService.error(`Error: ${e.message}`);
                }
              }}
              onViewDetails={() => {
                try {
                  if (handleItemActionViewDetails) {
                    handleItemActionViewDetails(actionMenu.item);
                  } else {
                    setHoveredItem(actionMenu.item);
                    setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                  }
                } catch (e) {
                  setHoveredItem(actionMenu.item);
                  setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                }
              }}
              onClose={() => setActionMenu({ item: null, x: 0, y: 0 })}
            />
          </>
        )}
        {/* Skill Tooltip */}
        {hoveredSkill && (
          <SkillTooltip 
            skill={hoveredSkill} 
            x={tooltipPosition.x} 
            y={tooltipPosition.y} 
          />
        )}
    </div>
    );
  };

  // Calculate word counts
  const calculateWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getBookWordCount = (book) => {
    return book.chapters.reduce((total, ch) => total + calculateWordCount(ch.script), 0);
  };

  const getTotalWordCount = () => {
    return Object.values(worldState.books).reduce((total, book) => total + getBookWordCount(book), 0);
  };

  const renderBible = () => {
    const totalWords = getTotalWordCount();
    
    return (
      <div className="flex flex-col h-full animate-in fade-in pb-20 p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <BookOpen className="mr-3 text-green-500"/> SERIES BIBLE
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                Total Words: {totalWords.toLocaleString()} | Books: {Object.keys(worldState.books).length}
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip content={bibleViewMode === 'timeline' ? 'Switch to standard grid view' : 'Switch to chronological timeline view'} position="bottom">
              <button
                onClick={() => setBibleViewMode(bibleViewMode === 'standard' ? 'timeline' : 'standard')}
                className={`text-xs px-3 py-1 rounded border ${
                  bibleViewMode === 'timeline' 
                    ? 'bg-green-900/30 text-green-300 border-green-800' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {bibleViewMode === 'timeline' ? 'Timeline View' : 'Standard View'}
              </button>
              </Tooltip>
              <Tooltip content="Add a new book to your series" position="bottom">
              <button onClick={addBook} className="text-xs flex items-center bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 rounded hover:bg-green-900/50">
                <Plus className="w-3 h-3 mr-1"/> ADD BOOK
              </button>
              </Tooltip>
            </div>
          </div>

          {bibleViewMode === 'timeline' ? (
            <div className="space-y-4 overflow-y-auto custom-scrollbar">
              {Object.entries(worldState.books).map(([bId, book]) => (
                <div key={bId} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <BookSymbol book={book} size="md" />
                    <h3 className="font-bold text-white text-lg">{book.title}</h3>
                    </div>
                    <div className="text-xs text-slate-400">
                      {getBookWordCount(book).toLocaleString()} words | {book.chapters.length} chapters
                    </div>
                  </div>
                  <div className="space-y-2">
                    {book.chapters.map(chap => {
                      const wordCount = calculateWordCount(chap.script);
                      const tags = chapterTags[`${bId}_${chap.id}`] || [];
                      return (
                        <div key={chap.id} className="bg-slate-950 border border-slate-800 rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <ChapterSymbol chapter={chap} size="sm" />
                              <span className="text-sm font-bold text-white">Ch {chap.id}: {chap.title}</span>
                              <span className="text-xs text-slate-500">({wordCount} words)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {tags.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                              <button
                                onClick={() => {
                                  setTagInputTarget({ bookId: bId, chapterId: chap.id });
                                }}
                                className="text-xs text-slate-500 hover:text-white"
                                title="Add tag"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">{chap.desc || 'No synopsis'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto custom-scrollbar">{Object.entries(worldState.books).map(([bId, book]) => {
              const isExpanded = expandedBooks[bId];
              return (
                  <div key={bId} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                      <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center cursor-pointer" onClick={() => toggleBook(bId)}>
                          <div className="flex items-center space-x-2">{isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500"/> : <ChevronRight className="w-4 h-4 text-slate-500"/>}{editingId === `book_${bId}` ? (<input className="bg-slate-900 text-white font-bold px-2 py-1 rounded border border-green-500" value={tempTitle} onClick={e=>e.stopPropagation()} onChange={e=>setTempTitle(e.target.value)} />) : (<h3 className="font-bold text-white text-lg" onClick={(e) => {e.stopPropagation(); startEdit(`book_${bId}`, book.title, book.focus)}}>{book.title}</h3>)}</div>
                          <div className="flex items-center space-x-2">{editingId === `book_${bId}` ? <button onClick={(e)=>{e.stopPropagation(); saveEdit('book', bId)}} className="text-green-500"><CheckCircle className="w-4 h-4"/></button> : null}<button onClick={(e) => {e.stopPropagation(); e.preventDefault(); removeBook(bId)}} className="text-slate-700 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4"/></button></div>
                      </div>
                      {isExpanded && (
                        <div className="p-4 bg-slate-900">
                          <div className="mb-4 flex justify-between items-center">
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">OVERVIEW</div>
                              {editingId === `book_${bId}` ? (
                                <textarea className="w-full bg-slate-950 text-slate-300 p-2 rounded border border-green-500" value={tempText} onClick={e=>e.stopPropagation()} onChange={e=>setTempText(e.target.value)} />
                              ) : (
                                <p className="text-sm text-slate-400 italic cursor-pointer hover:text-white" onClick={()=>startEdit(`book_${bId}`, book.title, book.focus)}>
                                  {book.focus || "Click to add overview..."}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 ml-4">
                              {getBookWordCount(book).toLocaleString()} words
                            </div>
                          </div>
                          <div className="space-y-2">{book.chapters.map((chap, chapIndex) => {
                          const isChapExp = expandedChapters[`${bId}_${chap.id}`]; const editKey = `chap_${bId}_${chap.id}`; const scriptKey = `script_${bId}_${chap.id}`;
                          const hasSnaps = hasSnapshots(bId, chap.id);
                          const snapCount = getSnapshotCount(bId, chap.id);
                          const isDragging = draggedChapter?.bookId === bId && draggedChapter?.chapterId === chap.id;
                          return (
                              <div 
                                  key={chap.id} 
                                  draggable
                                  onDragStart={(e) => {
                                      setDraggedChapter({ bookId: bId, chapterId: chap.id });
                                      e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onDragOver={(e) => {
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDrop={(e) => {
                                      e.preventDefault();
                                      if (draggedChapter && draggedChapter.bookId === bId && draggedChapter.chapterId !== chap.id) {
                                          reorderChapters(bId, draggedChapter.chapterId, chap.id);
                                      }
                                      setDraggedChapter(null);
                                  }}
                                  onDragEnd={() => setDraggedChapter(null)}
                                  className={`border rounded bg-slate-950/50 transition-all ${
                                      isDragging ? 'opacity-50 border-green-500' : hasSnaps ? 'border-blue-500/50' : 'border-slate-800'
                                  }`}
                              >
                                  <div className="p-2 flex justify-between items-center cursor-pointer hover:bg-slate-800" onClick={() => toggleChapter(`${bId}_${chap.id}`)}>
                                      <div className="flex items-center space-x-2">
                                          <GripVertical className="w-3 h-3 text-slate-600 cursor-move" onMouseDown={(e) => e.stopPropagation()} />
                                          {isChapExp ? <ChevronDown className="w-3 h-3 text-slate-500"/> : <ChevronRight className="w-3 h-3 text-slate-500"/>}
                                          {hasSnaps && (
                                              <span className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1" title={`${snapCount} snapshot(s)`}>
                                                  <Save className="w-3 h-3" />
                                                  {snapCount}
                                              </span>
                                          )}
                                          {editingId === editKey ? (
                                              <input className="bg-slate-900 text-white text-sm px-1 rounded border border-green-500" value={tempTitle} onClick={e=>e.stopPropagation()} onChange={e=>setTempTitle(e.target.value)}/>
                                          ) : (
                                              <span className="text-sm font-bold text-slate-300" onClick={e=>{e.stopPropagation(); startEdit(editKey, chap.title, chap.desc)}}>
                                                  Ch {chapIndex + 1}: {chap.title}
                                              </span>
                                          )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          {editingId === editKey ? (
                                              <button onClick={e=>{e.stopPropagation(); saveEdit('chap', bId, chap.id)}} className="text-green-500">
                                                  <CheckCircle className="w-3 h-3"/>
                                              </button>
                                          ) : null}
                                          <button onClick={e=>{e.stopPropagation(); e.preventDefault(); removeChapter(bId, chap.id)}} className="text-slate-700 hover:text-red-500 cursor-pointer">
                                              <X className="w-3 h-3"/>
                                          </button>
                                      </div>
                                  </div>
                                  {isChapExp && (
                                    <div className="p-3 border-t border-slate-800 bg-slate-900">
                                      <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                          <label className="text-[10px] text-slate-500 uppercase">SYNOPSIS</label>
                                          <div className="text-xs text-slate-500">
                                            {calculateWordCount(chap.script)} words
                                          </div>
                                        </div>
                                        {editingId === editKey ? (
                                          <textarea className="w-full bg-slate-950 text-xs text-white p-2 rounded border border-green-500" value={tempText} onClick={e=>e.stopPropagation()} onChange={e=>setTempText(e.target.value)}/>
                                        ) : (
                                          <p className="text-xs text-slate-400 cursor-pointer" onClick={()=>startEdit(editKey, chap.title, chap.desc)}>
                                            {chap.desc || "Add synopsis..."}
                                          </p>
                                        )}
                                      </div>
                                      <div className="mb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          <label className="text-[10px] text-slate-500 uppercase">TAGS</label>
                                          {(chapterTags[`${bId}_${chap.id}`] || []).map((tag, i) => (
                                            <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                                              {tag}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const key = `${bId}_${chap.id}`;
                                                  setChapterTags(prev => ({
                                                    ...prev,
                                                    [key]: (prev[key] || []).filter(t => t !== tag)
                                                  }));
                                                }}
                                                className="ml-1 text-blue-300 hover:text-red-400"
                                              >
                                                ×
                                              </button>
                                            </span>
                                          ))}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const tag = prompt('Add tag:');
                                              if (tag) {
                                                const key = `${bId}_${chap.id}`;
                                                setChapterTags(prev => ({
                                                  ...prev,
                                                  [key]: [...(prev[key] || []), tag]
                                                }));
                                              }
                                            }}
                                            className="text-xs text-slate-500 hover:text-white"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <label className="text-[10px] text-slate-500 uppercase">FULL SCRIPT</label>
                                          {editingId === scriptKey ? (
                                            <button onClick={()=>saveEdit('script', bId, chap.id)} className="text-green-500">
                                              <CheckCircle className="w-3 h-3"/>
                                            </button>
                                          ) : (
                                            <button onClick={()=>startEdit(scriptKey, "", chap.script)} className="text-slate-600 hover:text-white">
                                              <Edit3 className="w-3 h-3"/>
                                            </button>
                                          )}
                                        </div>
                                        {editingId === scriptKey ? (
                                          <textarea className="w-full h-40 bg-slate-950 text-sm text-slate-300 font-mono p-2 rounded border border-green-500 focus:outline-none" value={tempText} onChange={e=>setTempText(e.target.value)} placeholder="Write chapter script..."/>
                                        ) : (
                                          <div className="w-full h-20 bg-slate-950 text-sm text-slate-500 font-mono p-2 rounded border border-slate-800 overflow-hidden cursor-pointer" onClick={()=>startEdit(scriptKey, "", chap.script)}>
                                            {chap.script || "// Click to write script..."}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                          )
                      })}<button onClick={()=>addChapter(bId)} className="w-full py-1 text-xs text-slate-500 border border-dashed border-slate-700 rounded hover:text-green-500 hover:border-green-500">+ ADD CHAPTER</button></div></div>)}
                  </div>
              )})}
            </div>
          )}
      </div>
    );
  };

  // Get usage tracking
  const getItemUsage = (itemId) => {
    return worldState.actors.filter(actor => actor.inventory?.includes(itemId)).length;
  };

  const getSkillUsage = (skillId) => {
    return worldState.actors.filter(actor => 
      actor.activeSkills?.some(s => s.id === skillId)
    ).length;
  };

  // Get dependencies
  const getItemDependencies = (item) => {
    const deps = [];
    if (item.grantsSkills && item.grantsSkills.length > 0) {
      deps.push(...item.grantsSkills.map(skillId => {
        const skill = worldState.skillBank.find(s => s.id === skillId);
        return skill ? { type: 'skill', name: skill.name } : null;
      }).filter(Boolean));
    }
    return deps;
  };

  const getSkillDependencies = (skill) => {
    // Skills can depend on other skills (prerequisites)
    // This would be stored in skill.prerequisites or similar
    return skill.prerequisites || [];
  };

  const renderBank = (type) => {
    const items = type === 'skill' ? worldState.skillBank : worldState.itemBank;
    
    // Filter items - also filter out invalid items
    let filteredItems = items.filter(item => {
      // Skip invalid items (missing name or not an object)
      if (!item || typeof item !== 'object' || !item.name || typeof item.name !== 'string') {
        return false;
      }
      const matchesSearch = !bankFilter.search || 
        item.name.toLowerCase().includes(bankFilter.search.toLowerCase()) ||
        (typeof item.desc === 'string' && item.desc.toLowerCase().includes(bankFilter.search.toLowerCase()));
      const matchesRarity = bankFilter.rarity === 'all' || item.rarity === bankFilter.rarity;
      const matchesType = bankFilter.type === 'all' || item.type === bankFilter.type;
      return matchesSearch && matchesRarity && matchesType;
    });

    // Sort items
    filteredItems = [...filteredItems].sort((a, b) => {
      switch (bankSort) {
        case 'rarity':
          const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        case 'usage':
          const usageA = type === 'skill' ? getSkillUsage(a.id) : getItemUsage(a.id);
          const usageB = type === 'skill' ? getSkillUsage(b.id) : getItemUsage(b.id);
          return usageB - usageA;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    const uniqueTypes = [...new Set(items.map(i => i.type).filter(Boolean))];
    const uniqueRarities = [...new Set(items.map(i => i.rarity).filter(Boolean))];

    return (
      <div className="flex flex-col h-full animate-in fade-in relative overflow-hidden">
          {creatorMode === type && (type === 'skill' ? (
            <DiabloSkillGenerator
              onClose={()=>{
                setCreatorMode(null);
                setEditingSkill(null);
              }}
              onSave={handleCreate}
              statRegistry={worldState.statRegistry}
              skillBank={worldState.skillBank}
              initialSkill={editingSkill}
              books={Object.values(worldState.books || {})}
            />
          ) : (
            <DiabloItemGenerator
              onClose={()=>{
                setCreatorMode(null);
                setEditingItem(null);
              }}
              onSave={handleCreate}
              statRegistry={worldState.statRegistry}
              skillBank={worldState.skillBank}
              initialItem={editingItem}
              books={Object.values(worldState.books || {})}
            />
          ))}
          <div className="flex justify-between items-center mb-4 bg-slate-900 p-4 rounded border border-slate-800 shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center">
              {type === 'skill' ? <Zap className="mr-3 text-blue-500"/> : <Briefcase className="mr-3 text-yellow-500"/>} 
              {type === 'skill' ? "SKILL TREE" : "ITEM VAULT"}
            </h2>
            <Tooltip 
              content={type === 'skill' 
                ? 'Create a new skill with custom effects, stat bonuses, and descriptions' 
                : 'Create a new item with stats, rarity, equipment slots, and AI-generated images'
              } 
              position="left"
            >
              <button onClick={()=>setCreatorMode(type)} className="flex items-center bg-green-900/30 text-green-400 px-3 py-2 rounded border border-green-800 hover:bg-green-900/50 transition-colors">
              <Plus className="w-4 h-4 mr-2"/> CREATE NEW
            </button>
            </Tooltip>
          </div>

          {/* Filters */}
          <div className="mb-4 bg-slate-900 p-4 rounded border border-slate-800 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={bankFilter.search}
                  onChange={(e) => setBankFilter({ ...bankFilter, search: e.target.value })}
                  placeholder={`Search ${type}s...`}
                  className="w-full bg-slate-950 border border-slate-700 text-white pl-8 pr-2 py-2 rounded text-sm"
                />
              </div>
              {type === 'item' && (
                <select
                  value={bankFilter.rarity}
                  onChange={(e) => setBankFilter({ ...bankFilter, rarity: e.target.value })}
                  className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
                >
                  <option value="all">All Rarities</option>
                  {uniqueRarities.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
              )}
              <select
                value={bankFilter.type}
                onChange={(e) => setBankFilter({ ...bankFilter, type: e.target.value })}
                className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={bankSort}
                onChange={(e) => setBankSort(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
              >
                <option value="name">Sort by Name</option>
                {type === 'item' && <option value="rarity">Sort by Rarity</option>}
                <option value="usage">Sort by Usage</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 custom-scrollbar pb-20 p-4 overflow-y-auto h-full">
            {filteredItems.map(item => {
              const usage = type === 'skill' ? getSkillUsage(item.id) : getItemUsage(item.id);
              const dependencies = type === 'skill' ? getSkillDependencies(item) : getItemDependencies(item);
              
              return (
                <div 
                  key={item.id} 
                  className="bg-slate-900 border border-slate-800 p-4 rounded hover:border-green-500/30 group cursor-pointer"
                  onClick={() => {
                    // Open in edit mode
                    if (type === 'item') {
                      setCreatorMode('item');
                      // Store item to edit
                      setEditingItem(item);
                    } else if (type === 'skill') {
                      setCreatorMode('skill');
                      setEditingSkill(item);
                    }
                  }}
                >
                  {/* Item/Skill Image */}
                  {item.imagePath || item.symbolPath ? (
                    <div className="mb-3 relative w-full h-32 bg-transparent overflow-hidden flex items-center justify-center">
                      <ItemImage 
                        item={type === 'item' ? item : { imagePath: item.symbolPath }} 
                        className="w-full h-full max-w-full max-h-full"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 w-full h-32 bg-slate-950 rounded border border-slate-700 flex items-center justify-center">
                      {type === 'item' ? (
                        <Package className="w-8 h-8 text-slate-600 opacity-50" />
                      ) : (
                        <Zap className="w-8 h-8 text-slate-600 opacity-50" />
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <span className="font-bold text-white">{typeof item.name === 'string' ? item.name : (item.name?.toString() || 'Unnamed')}</span>
                      {item.rarity && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          item.rarity === 'Legendary' ? 'bg-yellow-900/30 text-yellow-400' :
                          item.rarity === 'Epic' ? 'bg-purple-900/30 text-purple-400' :
                          item.rarity === 'Rare' ? 'bg-blue-900/30 text-blue-400' :
                          item.rarity === 'Uncommon' ? 'bg-green-900/30 text-green-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {item.rarity}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        e.preventDefault(); 
                        deleteBankItem(type, item.id);
                      }} 
                      className="text-slate-700 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{typeof item.desc === 'string' ? item.desc : (item.desc?.toString() || 'No description')}</p>
                  <p className="text-xs text-green-400/80 opacity-0 group-hover:opacity-100 transition-opacity mb-2">Click to edit</p>
                  
                  {/* Usage Tracking */}
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Used by {usage} {usage === 1 ? 'actor' : 'actors'}
                  </div>

                  {/* Dependencies */}
                  {dependencies.length > 0 && (
                    <div className="text-xs text-blue-400 mb-2">
                      <div className="font-bold mb-1">Dependencies:</div>
                      {dependencies.map((dep, i) => {
                        const depName = typeof dep === 'string' ? dep : (dep?.name || dep?.id || 'Unknown');
                        return (
                          <div key={i} className="text-slate-400">
                            • {depName}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {item.stats && Object.keys(item.stats).length > 0 && (
                    <div className="text-[10px] font-mono text-green-400 bg-green-900/10 p-2 rounded mb-1">
                      MODS: {JSON.stringify(item.stats).replace(/"/g,'').replace(/{|}/g,'')}
                    </div>
                  )}
                  {item.quests && typeof item.quests === 'string' && item.quests.trim() && (
                    <div className="text-[10px] font-mono text-purple-400 bg-purple-900/10 p-2 rounded mb-1">
                      QUEST: {item.quests}
                    </div>
                  )}
                  {item.debuffs && typeof item.debuffs === 'object' && Object.keys(item.debuffs).length > 0 && (
                    <div className="text-[10px] font-mono text-red-400 bg-red-900/10 p-2 rounded">
                      CURSE: {JSON.stringify(item.debuffs).replace(/"/g,'').replace(/{|}/g,'')}
                    </div>
                  )}
                  {item.debuffs && typeof item.debuffs === 'string' && item.debuffs.trim() && (
                    <div className="text-[10px] font-mono text-red-400 bg-red-900/10 p-2 rounded">
                      CURSE: {item.debuffs}
                    </div>
                  )}
                  
                  {/* Upgrade History Badge */}
                  {item.upgradeHistory && item.upgradeHistory.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="text-xs text-purple-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.upgradeHistory.length} upgrade{item.upgradeHistory.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-3 text-center text-slate-500 p-8">
                <p>No {type}s match filters</p>
              </div>
            )}
            </div>
          </div>
      </div>
    );
  };


  // Evaluate stat formula
  const evaluateFormula = (formula, actorStats) => {
    if (!formula) return null;
    try {
      // Simple formula evaluation (e.g., "STR + VIT * 2")
      // Replace stat keys with values
      let expression = formula;
      Object.entries(actorStats).forEach(([key, value]) => {
        expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
      });
      // Evaluate (basic - in production, use a proper expression parser)
      return Function(`"use strict"; return (${expression})`)();
    } catch (error) {
      return null;
    }
  };

  const renderStats = () => {
    // Calculate actual usage for each stat
    const calculateStatUsage = (statKey) => {
      const actorCount = worldState.actors.filter(a => 
        a.baseStats?.[statKey] !== undefined || a.additionalStats?.[statKey] !== undefined
      ).length;
      const itemCount = worldState.itemBank.filter(i => 
        i.stats?.[statKey] !== undefined || i.statMod?.[statKey] !== undefined
      ).length;
      const skillCount = worldState.skillBank.filter(s => 
        s.statMod?.[statKey] !== undefined
      ).length;
      return { total: actorCount + itemCount + skillCount, actorCount, itemCount, skillCount };
    };

    // Group stats by category
    const coreStats = worldState.statRegistry.filter(s => s.isCore);
    const additionalStatsList = worldState.statRegistry.filter(s => !s.isCore);

    return (
      <div className="flex flex-col h-full animate-in fade-in p-4 relative overflow-y-auto">
          {creatorMode === 'stat' && (
            <DiabloStatGenerator
              onClose={() => setCreatorMode(null)}
              onSave={async (stat) => {
                if (stat.existingId) {
                  // Editing existing stat
                  const updatedStat = { ...stat, id: stat.existingId };
                  delete updatedStat.existingId;
                  await db.update('statRegistry', updatedStat);
                  const stats = await db.getAll('statRegistry');
                  setWorldState(prev => ({ ...prev, statRegistry: stats }));
                  setCreatorMode(null);
                  toastService.success(`Stat "${stat.name}" updated successfully!`);
                } else {
                  // Creating new stat
                  await db.add('statRegistry', stat);
                  const stats = await db.getAll('statRegistry');
                  setWorldState(prev => ({ ...prev, statRegistry: stats }));
                  setCreatorMode(null);
                  toastService.success(`Stat "${stat.name}" created successfully!`);
                }
              }}
              existingStats={worldState.statRegistry}
              initialStat={editingStat}
            />
          )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <BarChart2 className="mr-3 text-purple-500"/> STAT REGISTRY
            </h2>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs text-slate-400 flex items-center">
                {worldState.statRegistry.length} stats ({coreStats.length} core, {additionalStatsList.length} additional)
              </span>
              {/* Dice Roll Simulator */}
              <button
                onClick={() => setShowDiceRoller(v => !v)}
                className={`flex items-center px-3 py-2 rounded border text-sm transition-colors ${showDiceRoller ? 'bg-yellow-700/40 border-yellow-600 text-yellow-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                🎲 Dice
              </button>
              {/* Cross-character stat comparison */}
              <button
                onClick={() => setShowStatCompare(v => !v)}
                className={`flex items-center px-3 py-2 rounded border text-sm transition-colors ${showStatCompare ? 'bg-blue-700/40 border-blue-600 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                <BarChart2 className="w-3.5 h-3.5 mr-1" /> Compare
              </button>
              <Tooltip content="Create a new stat attribute that can be used by characters, items, and skills" position="left">
                <button onClick={() => {
                  setEditingStat(null);
                  setCreatorMode('stat');
                }} className="flex items-center bg-purple-900/30 text-purple-400 px-3 py-2 rounded border border-purple-800 hover:bg-purple-900/50 transition-colors">
              <Plus className="w-4 h-4 mr-2"/> NEW STAT
            </button>
              </Tooltip>
            </div>
          </div>

          {/* Dice Roll Simulator */}
          {showDiceRoller && (
            <div className="mb-4 p-4 bg-yellow-950/30 border border-yellow-700/40 rounded-xl">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-yellow-300 text-sm">🎲 Dice Roll Simulator</span>
                <select
                  value={diceRollerActor?.id || ''}
                  onChange={e => setDiceRollerActor(worldState.actors.find(a => a.id === e.target.value) || null)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="">— Select character —</option>
                  {worldState.actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select
                  value={diceRollStat}
                  onChange={e => setDiceRollStat(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="">— Select stat —</option>
                  {worldState.statRegistry.map(s => <option key={s.id} value={s.key}>{s.name}</option>)}
                </select>
                <button
                  onClick={() => {
                    const d20 = Math.floor(Math.random() * 20) + 1;
                    const actorStat = diceRollerActor ? (diceRollerActor.baseStats?.[diceRollStat] || 0) : 0;
                    const modifier = Math.floor((actorStat - 10) / 2); // D&D-style modifier
                    setDiceResult({ roll: d20, modifier, total: d20 + modifier, stat: diceRollStat, actor: diceRollerActor?.name });
                  }}
                  className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold px-4 py-1.5 rounded text-sm"
                >
                  Roll d20
                </button>
                {diceResult && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`text-2xl font-black ${diceResult.roll === 20 ? 'text-yellow-300' : diceResult.roll === 1 ? 'text-red-400' : 'text-white'}`}>{diceResult.total}</span>
                    <span className="text-xs text-slate-400">
                      (d20: {diceResult.roll} {diceResult.modifier >= 0 ? '+' : ''}{diceResult.modifier} {diceResult.stat} mod{diceResult.actor ? ` — ${diceResult.actor}` : ''})
                    </span>
                    {diceResult.roll === 20 && <span className="text-yellow-300 font-bold text-sm">CRITICAL!</span>}
                    {diceResult.roll === 1 && <span className="text-red-400 font-bold text-sm">FUMBLE!</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cross-character stat comparison */}
          {showStatCompare && (
            <div className="mb-4 p-4 bg-blue-950/30 border border-blue-700/40 rounded-xl">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="font-bold text-blue-300 text-sm">Cross-Character Stat Comparison</span>
                <select
                  value={statCompareKey}
                  onChange={e => setStatCompareKey(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="">— Select stat —</option>
                  {worldState.statRegistry.map(s => <option key={s.id} value={s.key}>{s.name}</option>)}
                </select>
              </div>
              {statCompareKey && (() => {
                const values = worldState.actors
                  .map(a => ({ name: a.name, val: a.baseStats?.[statCompareKey] ?? a.additionalStats?.[statCompareKey] ?? null }))
                  .filter(x => x.val !== null)
                  .sort((a, b) => b.val - a.val);
                const maxVal = Math.max(...values.map(v => v.val), 1);
                return values.length === 0 ? (
                  <div className="text-xs text-slate-500">No characters have this stat.</div>
                ) : (
                  <div className="space-y-1.5">
                    {values.map((v, i) => (
                      <div key={v.name} className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 w-28 truncate">{i + 1}. {v.name}</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(v.val / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-blue-300 w-8 text-right">{v.val}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Core Stats Section */}
          {coreStats.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                CORE STATS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coreStats.map(stat => {
                  const usage = calculateStatUsage(stat.key);
                const formula = statFormulas[stat.key] || stat.formula || '';
                
                return (
                    <div key={stat.id} className="bg-slate-900 border border-green-500/50 p-4 rounded hover:border-green-400 transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className={`font-bold text-lg`} style={{color: `var(--tw-${stat.color || 'green'}-400, #4ade80)`}}>
                            {stat.key} <span className="text-sm text-white font-normal ml-2">{stat.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">{stat.desc}</div>
                          
                          {/* Formula */}
                          <div className="mb-2">
                            <label className="text-xs text-slate-400 mb-1 block">Formula:</label>
                            <input
                              type="text"
                              value={formula}
                                onChange={async (e) => {
                                  const newFormulas = { ...statFormulas, [stat.key]: e.target.value };
                                  setStatFormulas(newFormulas);
                                  // Also save to stat
                                  const updatedStat = { ...stat, formula: e.target.value };
                                  await db.update('statRegistry', updatedStat);
                                }}
                              placeholder="e.g., STR + VIT * 2"
                              className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1 rounded text-xs font-mono"
                            />
                              </div>

                            {/* Usage Tracking */}
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Used by {usage.total} {usage.total === 1 ? 'entity' : 'entities'}
                              {usage.total > 0 && (
                                <span className="text-slate-500">
                                  ({usage.actorCount} actors, {usage.itemCount} items, {usage.skillCount} skills)
                                </span>
                            )}
                          </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase px-2 py-1 rounded bg-green-900/30 text-green-400">
                              CORE
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStat(stat);
                                setCreatorMode('stat');
                              }} 
                              className="text-slate-700 hover:text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="w-4 h-4"/>
                            </button>
                            <button onClick={(e) => {e.stopPropagation(); e.preventDefault(); deleteStat(stat.id)}} className="text-slate-700 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Additional Stats Section */}
          {additionalStatsList.length > 0 && (
            <div>
              <div className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                ADDITIONAL STATS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalStatsList.map(stat => {
                  const usage = calculateStatUsage(stat.key);
                  const formula = statFormulas[stat.key] || stat.formula || '';
                  
                  return (
                    <div key={stat.id} className="bg-slate-900 border border-slate-800 p-4 rounded hover:border-purple-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className={`font-bold text-lg`} style={{color: stat.color === 'green' ? '#4ade80' : stat.color === 'blue' ? '#60a5fa' : stat.color === 'yellow' ? '#facc15' : stat.color === 'red' ? '#f87171' : stat.color === 'purple' ? '#a78bfa' : stat.color === 'pink' ? '#f472b6' : stat.color === 'gray' ? '#9ca3af' : '#a78bfa'}}>
                              {stat.key} <span className="text-sm text-white font-normal ml-2">{stat.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-2">{stat.desc}</div>
                            
                            {/* Formula */}
                            <div className="mb-2">
                              <label className="text-xs text-slate-400 mb-1 block">Formula:</label>
                              <input
                                type="text"
                                value={formula}
                                onChange={async (e) => {
                                  const newFormulas = { ...statFormulas, [stat.key]: e.target.value };
                                  setStatFormulas(newFormulas);
                                  const updatedStat = { ...stat, formula: e.target.value };
                                  await db.update('statRegistry', updatedStat);
                                }}
                                placeholder="e.g., STR + VIT * 2"
                                className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1 rounded text-xs font-mono"
                              />
                          </div>

                          {/* Usage Tracking */}
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                              Used by {usage.total} {usage.total === 1 ? 'entity' : 'entities'}
                              {usage.total > 0 && (
                              <span className="text-slate-500">
                                  ({usage.actorCount} actors, {usage.itemCount} items, {usage.skillCount} skills)
                              </span>
                            )}
                          </div>
                        </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase px-2 py-1 rounded bg-slate-800 text-slate-400">
                              ADDITIONAL
                          </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStat(stat);
                                setCreatorMode('stat');
                              }} 
                              className="text-slate-700 hover:text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="w-4 h-4"/>
                            </button>
                            <button onClick={(e) => {e.stopPropagation(); e.preventDefault(); deleteStat(stat.id)}} className="text-slate-700 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                  </div>
                );
              })}
          </div>
      </div>
          )}
          
          {worldState.statRegistry.length === 0 && (
            <div className="text-center text-slate-500 p-12 border border-dashed border-slate-700 rounded-lg">
              <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No stats defined yet</p>
              <p className="text-sm">Click "NEW STAT" to create your first stat</p>
            </div>
          )}
      </div>
    );
  }

  const renderStoryEngine = () => (
      <div className="flex flex-col h-full animate-in fade-in p-4 pb-20">
          <div className="bg-slate-900 p-6 rounded-lg border border-green-500/30 mb-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><PenTool size={120} /></div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center"><Terminal className="mr-3 text-green-500"/> STORY ENGINE v22</h2>
                <button
                  onClick={() => setActiveTab('story')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  ENHANCED WRITER'S ROOM
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                      <div className="flex gap-4">
                          <select value={genBook} onChange={e=>setGenBook(Number(e.target.value))} className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded">{Object.keys(worldState.books).map(n=><option key={n} value={n}>Book {n}</option>)}</select>
                          <select value={genChap} onChange={e=>setGenChap(Number(e.target.value))} className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded">
                            {worldState.books[genBook]?.chapters.map((c, index) => (
                              <option key={c.id} value={c.id}>Ch {index + 1}: {c.title}</option>
                            ))}
                          </select>
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 max-h-32 overflow-y-auto"><label className="text-[10px] text-blue-400 font-bold block mb-1">ACTIVE CAST</label><div className="grid grid-cols-2 gap-2">{worldState.actors.map(a=><div key={a.id} onClick={()=>{const n=activeCast.includes(a.id)?activeCast.filter(x=>x!==a.id):[...activeCast,a.id]; setActiveCast(n)}} className={`cursor-pointer text-xs p-1 rounded ${activeCast.includes(a.id)?'bg-green-900/20 text-green-400':'text-slate-500'}`}>{a.name}</div>)}</div></div>
                      <textarea value={userNote} onChange={e=>setUserNote(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-300 p-2 rounded text-xs h-20" placeholder="Director's Note..."/>
                      <button onClick={() => setShowManuscriptParser(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"><FileText className="w-4 h-4"/> PARSE MANUSCRIPT</button>
                  </div>
                  <div className="flex flex-col justify-end"><button onClick={generateChapter} disabled={isGen} className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded flex items-center justify-center shadow-lg">{isGen?<RefreshCw className="animate-spin mr-2"/>:<Zap className="mr-2"/>} GENERATE</button></div>
              </div>
          </div>
          <div className="flex-1 flex flex-col"><div className="bg-slate-950 border border-slate-800 rounded-t-lg p-2"><span className="text-xs text-slate-500 font-mono">OUTPUT_STREAM.txt</span></div><textarea value={output} onChange={e=>setOutput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 border-t-0 rounded-b-lg p-6 font-mono text-sm text-green-300 focus:outline-none resize-none custom-scrollbar"/></div>
      </div>
  );

  return (
    <div className="grimguff-app min-h-screen text-slate-200 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden h-screen">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false);
            setOnboardingComplete(true);
            toastService.success('Setup complete! Your writing assistant is ready.');
          }}
        />
      )}
      
      {/* Style Review Modal */}
      {showStyleReview && (
        <StyleReviewModal
          currentChapter={styleReviewChapter}
          recentChapters={recentChaptersForReview}
          onApprove={() => {
            setShowStyleReview(false);
            toastService.success('Style profile updated!');
          }}
          onDismiss={() => setShowStyleReview(false)}
        />
      )}
      
      <ToastContainer />
      <TagInputModal 
        target={tagInputTarget}
        value={tagInputValue}
        onChange={setTagInputValue}
        onSave={(bookId, chapterId, tag) => {
          const key = `${bookId}_${chapterId}`;
          setChapterTags(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), tag]
          }));
          setTagInputTarget(null);
        }}
        onClose={() => {
          setTagInputTarget(null);
          setTagInputValue('');
        }}
      />
      {/* Keyboard Shortcuts Help - Enhanced Version */}
      <KeyboardShortcutsHelp 
        isOpen={showKeyboardShortcuts} 
        onClose={() => setShowKeyboardShortcuts(false)} 
      />
      
      {/* Quick Actions Command Palette */}
      <QuickActions
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setShowGlobalSearch(false);
        }}
        worldState={worldState}
        onAction={(action, data) => {
          switch (action) {
            case 'openSettings':
              setShowSettings(true);
              break;
            case 'newChapter':
              setActiveTab('story');
              break;
            case 'newCharacter':
              setCreatorMode('actor');
              break;
            case 'newItem':
              setCreatorMode('item');
              break;
            case 'newSkill':
              setCreatorMode('skill');
              break;
            case 'backup':
              setShowBackupManager(true);
              break;
            case 'viewActor':
              setSelectedActorId(data);
              setActiveTab('personnel');
              break;
            default:
              break;
          }
          setShowGlobalSearch(false);
        }}
      />
      {/* Refined Header */}
      <header className="bg-gradient-to-r from-[#0f1419] to-[#1a1f26] border-b border-emerald-500/20 h-14 flex items-center px-6 justify-between shadow-xl z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              GRIMGUFF <span className="text-gradient">TRACKER</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip 
            content={undoRedoInfo.canUndo ? `Undo last action: ${undoRedoInfo.undoDescription || 'previous change'}` : 'Nothing to undo'} 
            shortcut="Ctrl+Z"
            position="bottom"
          >
          <button
            onClick={handleUndo}
            disabled={!undoRedoInfo.canUndo}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                undoRedoInfo.canUndo 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600' 
                  : 'bg-slate-900/50 text-slate-600 cursor-not-allowed border border-slate-800'
              }`}
          >
            <ArrowLeft className="w-4 h-4" />
            UNDO
          </button>
          </Tooltip>
          <Tooltip 
            content={undoRedoInfo.canRedo ? `Redo: ${undoRedoInfo.redoDescription || 'next change'}` : 'Nothing to redo'} 
            shortcut="Ctrl+Y"
            position="bottom"
          >
              <button
            onClick={handleRedo}
            disabled={!undoRedoInfo.canRedo}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                undoRedoInfo.canRedo 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600' 
                  : 'bg-slate-900/50 text-slate-600 cursor-not-allowed border border-slate-800'
              }`}
          >
            <ArrowRight className="w-4 h-4" />
            REDO
          </button>
          </Tooltip>
          <div className="w-px h-6 bg-slate-700/50 mx-2" />
          <Tooltip 
            content="View all keyboard shortcuts and hotkeys" 
            shortcut="Ctrl+/"
            position="bottom"
          >
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-700"
            >
              <Keyboard className="w-4 h-4" />
              </button>
          </Tooltip>
          <Tooltip
            content="Search across all your story content - characters, items, chapters, and more"
            shortcut="Ctrl+K"
            position="bottom"
          >
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-700"
            >
              <Search className="w-4 h-4" />
            </button>
          </Tooltip>
          {/* ---- New Feature A: Story Health Panel ---- */}
          <StoryHealthPanel className="ml-2" />
            </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* New Grouped Navigation Sidebar */}
        <NavigationSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        />
        <main className="flex-1 overflow-hidden bg-gradient-to-br from-[#0f1419] via-[#131920] to-[#1a1f26] relative min-w-0">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
          <div className="w-full h-full relative z-10 p-3 md:p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'home' && (
              <ChapterContextView
                onNavigate={(tab) => setActiveTab(tab)}
                onContinueWriting={() => setActiveTab('story')}
              />
            )}
            {activeTab === 'personnel' && renderPersonnel()}
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'skills' && renderBank('skill')}
            {activeTab === 'items' && (
              <EnhancedItemVault
                items={worldState.itemBank}
                books={worldState.books}
                onItemSelect={(item) => {
                  setEditingItem(item);
                  setCreatorMode('item');
                }}
                onCreateNew={() => setCreatorMode('item')}
              />
            )}
            {activeTab === 'inventory' && (
              <InventorySystem
                actors={worldState.actors}
                items={worldState.itemBank}
                onEquipItem={(actorId, itemId, slotKey) => {
                  const rawActor = worldState.actors.find(a => a.id === actorId);
                  if (!rawActor) return;
                  
                  const updatedActor = {
                    ...rawActor,
                    equippedItems: {
                      ...(rawActor.equippedItems || {}),
                      [slotKey]: itemId
                    }
                  };
                  
                  setWorldState(prev => ({
                    ...prev,
                    actors: prev.actors.map(a => a.id === actorId ? updatedActor : a)
                  }));
                  
                  db.update('actors', updatedActor);
                }}
                onUnequipItem={(actorId, slotKey) => {
                  const rawActor = worldState.actors.find(a => a.id === actorId);
                  if (!rawActor) return;
                  
                  const updatedEquipped = { ...(rawActor.equippedItems || {}) };
                  delete updatedEquipped[slotKey];
                  
                  const updatedActor = {
                    ...rawActor,
                    equippedItems: updatedEquipped
                  };
                  
                  setWorldState(prev => ({
                    ...prev,
                    actors: prev.actors.map(a => a.id === actorId ? updatedActor : a)
                  }));
                  
                  db.update('actors', updatedActor);
                }}
                onClose={() => setActiveTab('items')}
              />
            )}
            {activeTab === 'story' && (
              <div className="h-full flex flex-col">
                {/* Writing Mode Header - only show in non-zen mode */}
                {writingMode !== 'zen' && (
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                    <WritingModeBadge 
                      mode={writingMode} 
                      onClick={() => setShowWritingModeSelector(true)} 
                    />
                    
                    {/* Session Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>📝 {sessionStats.wordsWrittenToday.toLocaleString()} words today</span>
                      <span>⏱️ {Math.floor((Date.now() - sessionStats.sessionStartTime) / 60000)}m session</span>
                      {sessionStats.aiAssists > 0 && <span>✨ {sessionStats.aiAssists} AI assists</span>}
                    </div>
                    
                    <button
                      onClick={() => setFocusMode(!focusMode)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        focusMode 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {focusMode ? '🎯 Focus ON' : '🎯 Focus Mode'}
                    </button>
                  </div>
                )}
                
                {/* Render appropriate canvas based on mode */}
                <div className="flex-1 overflow-hidden">
                  {writingMode === 'pro' ? (
                    <WritingCanvasPro
                      onNavigate={(tab) => setActiveTab(tab)}
                      onSave={async () => {
                        const books = await db.getAll('books');
                        const booksObj = books.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
                        setWorldState(prev => ({ ...prev, books: booksObj }));
                        setSessionStats(prev => ({ ...prev, chaptersEdited: prev.chaptersEdited + 1 }));

                        // ---- New Feature A: Trigger Story Continuity Agent ----
                        try {
                          const allBooks = Object.values(booksObj);
                          const latestBook = allBooks[allBooks.length - 1];
                          const latestChapter = latestBook?.chapters?.[latestBook.chapters.length - 1];
                          if (latestChapter) {
                            const [freshActors, freshItems, freshSkills] = await Promise.all([
                              db.getAll('actors'),
                              db.getAll('itemBank'),
                              db.getAll('skillBank'),
                            ]);
                            storyContiguityAgent.runAfterChapterSave({
                              chapter: latestChapter,
                              book: latestBook,
                              actors: freshActors || [],
                              itemBank: freshItems || [],
                              skillBank: freshSkills || [],
                            });
                          }
                        } catch (_) {}
                      }}
                      onEntityUpdate={async () => {
                        // Refresh worldState when entities are created/updated
                        const actors = await db.getAll('actors');
                        const items = await db.getAll('itemBank');
                        const skills = await db.getAll('skillBank');
                        setWorldState(prev => ({
                          ...prev,
                          actors,
                          itemBank: items,
                          skillBank: skills
                        }));
                      }}
                    />
                  ) : (
                    <WritingCanvas
                      onNavigate={(tab) => setActiveTab(tab)}
                      onSave={async () => {
                        const books = await db.getAll('books');
                        const booksObj = books.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
                        setWorldState(prev => ({ ...prev, books: booksObj }));
                        setSessionStats(prev => ({ ...prev, chaptersEdited: prev.chaptersEdited + 1 }));
                      }}
                      onEntityUpdate={async () => {
                        // Refresh worldState when entities are created/updated
                        const actors = await db.getAll('actors');
                        const items = await db.getAll('itemBank');
                        const skills = await db.getAll('skillBank');
                        setWorldState(prev => ({
                          ...prev,
                          actors,
                          itemBank: items,
                          skillBank: skills
                        }));
                      }}
                      zenMode={writingMode === 'zen'}
                    />
                  )}
                </div>
              </div>
            )}
            {activeTab === 'bible' && renderBible()}
            {activeTab === 'skilltree' && (
              <SkillTreeSystem
                skills={worldState.skillBank}
                actors={worldState.actors}
                onClose={() => setActiveTab('skills')}
                onUpdateSkills={(updatedSkills) => {
                  setWorldState(prev => ({ ...prev, skillBank: updatedSkills }));
                }}
              />
            )}
            {activeTab === 'wiki' && (
              <WikiManager
                entities={[...worldState.itemBank, ...worldState.actors]}
                entityType="mixed"
                onClose={() => setActiveTab('items')}
              />
            )}
            {activeTab === 'storymap' && (
              <StoryMap
                books={worldState.books}
                actors={worldState.actors}
                itemBank={worldState.itemBank}
                skillBank={worldState.skillBank}
                onClose={() => setActiveTab('bible')}
                onChapterClick={(bookId, chapterId) => {
                  setActiveTab('bible');
                  setBookTab(bookId);
                  setCurrentChapter(chapterId);
                }}
              />
            )}
            {activeTab === 'mindmap' && (
              <StoryMindMap
                actors={worldState.actors}
                items={worldState.itemBank}
                skills={worldState.skillBank}
                books={worldState.books}
                onClose={() => setActiveTab('storymap')}
              />
            )}
            {activeTab === 'plottimeline' && (
              <PlotTimeline
                books={worldState.books}
                onBeatUpdate={() => {
                  // Refresh data if needed
                }}
                onClose={() => setActiveTab('bible')}
              />
            )}
            {activeTab === 'ukmap' && (
              <UKMapVisualization
                actors={worldState.actors}
                books={worldState.books}
                onClose={() => setActiveTab('storymap')}
              />
            )}
            {activeTab === 'timeline' && (
              <MasterTimeline
                books={worldState.books}
                actors={worldState.actors}
                onClose={() => setActiveTab('bible')}
              />
            )}
            {activeTab === 'plotthreads' && (
              <PlotQuestTab
                books={worldState.books}
              />
            )}
            {activeTab === 'worldlore' && (
              <WorldLoreTab
                actors={worldState.actors}
                books={worldState.books}
              />
            )}
            {activeTab === 'consistency' && (
              <StoryAnalysisHub
                actors={worldState.actors}
                books={worldState.books}
                itemBank={worldState.itemBank}
                skillBank={worldState.skillBank}
                onClose={() => setActiveTab('bible')}
              />
            )}
            {activeTab === 'characterarcs' && (
              <CharacterArcMapper
                actors={worldState.actors}
                books={worldState.books}
                onClose={() => setActiveTab('bible')}
              />
            )}
            {(activeTab === 'plotthreads' || activeTab === 'consistency') && (
              <StoryAnalysisHub
                actors={worldState.actors}
                books={worldState.books}
                itemBank={worldState.itemBank}
                skillBank={worldState.skillBank}
                onClose={() => setActiveTab('bible')}
              />
            )}
            {activeTab === 'relationships' && (
              <RelationshipTrackerEnhanced
                actors={worldState.actors}
                books={worldState.books}
                onClose={() => setActiveTab('personnel')}
              />
            )}
            {activeTab === 'versioncontrol' && (
              <VersionControl
                actors={worldState.actors}
                books={worldState.books}
                onClose={() => setActiveTab('personnel')}
              />
            )}
            {activeTab === 'search' && (
              <SearchFilter
                items={worldState.itemBank}
                skills={worldState.skillBank}
                actors={worldState.actors}
                stats={worldState.statRegistry}
                onSelect={(item) => {
                  // Navigate to appropriate tab based on entity type
                  if (item.entityType === 'item') {
                    setActiveTab('items');
                  } else if (item.entityType === 'skill') {
                    setActiveTab('skills');
                  } else if (item.entityType === 'actor') {
                    setActiveTab('personnel');
                    setSelectedActorId(item.id);
                  } else if (item.entityType === 'stat') {
                    setActiveTab('stats');
                  }
                }}
                onClose={() => setActiveTab('items')}
              />
            )}
            {activeTab === 'backup' && (
              <BackupManager
                onClose={() => setActiveTab('settings')}
              />
            )}
            {activeTab === 'settings' && (
              <Settings
                onClose={() => setActiveTab('personnel')}
                onRerunOnboarding={() => setActiveTab('storysetup')}
              />
            )}
            {activeTab === 'storysetup' && (
              <OnboardingWizard
                onComplete={() => {
                  setActiveTab('home');
                  // Reload world state to pick up any new characters
                  initializeApp();
                }}
                existingData={true}
              />
            )}

            {activeTab === 'sync' && (
              <SyncManager
                onClose={() => setActiveTab('bible')}
                onDataImported={() => {
                  // Reload data after import
                  initializeApp();
                }}
              />
            )}

            {activeTab === 'manuscript' && (
              <ManuscriptIntelligence
                worldState={worldState}
                onClose={() => setActiveTab('bible')}
                onApplySuggestions={async (suggestions) => {
                  // Suggestions are already applied in ManuscriptIntelligence
                  // Just refresh world state
                  await initializeApp();
                }}
                onWorldStateUpdate={setWorldState}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'speedreader' && (
              <SpeedReader worldState={worldState} />
            )}

          </div>
      </main>
      </div>

      {/* Manuscript Parser Modal */}
      {showManuscriptParser && (
        <ManuscriptParser
          actors={worldState.actors}
          skillBank={worldState.skillBank}
          itemBank={worldState.itemBank}
          onCreateNewItem={async (itemName) => {
            // Create basic item
            const newItem = {
              id: `item_${Date.now()}`,
              name: itemName,
              type: 'Artifact',
              desc: `Auto-created from manuscript: ${itemName}`,
              stats: {},
              grantsSkills: [],
              quests: '',
              debuffs: '',
              rarity: 'Common'
            };
            await db.add('itemBank', newItem);
            const items = await db.getAll('itemBank');
            setWorldState(prev => ({ ...prev, itemBank: items }));
          }}
          onCreateNewSkill={async (skillName) => {
            // Create basic skill
            const newSkill = {
              id: `skill_${Date.now()}`,
              name: skillName,
              type: 'Passive',
              desc: `Auto-created from manuscript: ${skillName}`,
              statMod: {},
              defaultVal: 1
            };
            await db.add('skillBank', newSkill);
            const skills = await db.getAll('skillBank');
            setWorldState(prev => ({ ...prev, skillBank: skills }));
          }}
          onApplyUpdates={async (updates) => {
            for (const update of updates) {
              const actor = worldState.actors.find(a => a.id === update.actorId);
              if (actor && update.changes) {
                const updatedActor = { ...actor };

                if (update.changes.stats) {
                  Object.entries(update.changes.stats).forEach(([stat, value]) => {
                    if (updatedActor.baseStats[stat] !== undefined) {
                      updatedActor.baseStats[stat] += value;
                    } else {
                      updatedActor.additionalStats[stat] = (updatedActor.additionalStats[stat] || 0) + value;
                    }
                  });
                }

                if (update.changes.skills) {
                  update.changes.skills.forEach(skillName => {
                    const skill = worldState.skillBank.find(s => s.name.toLowerCase() === skillName.toLowerCase());
                    if (skill && !updatedActor.activeSkills.find(s => s.id === skill.id)) {
                      updatedActor.activeSkills.push({ id: skill.id, val: 1 });
                    }
                  });
                }

                if (update.changes.items) {
                  update.changes.items.forEach(itemName => {
                    const item = worldState.itemBank.find(i => i.name.toLowerCase() === itemName.toLowerCase());
                    if (item && !updatedActor.inventory.includes(item.id)) {
                      updatedActor.inventory.push(item.id);
                    }
                  });
                }

                await saveToDatabase('actors', updatedActor);
                
                // Auto-save snapshot
                const snapKey = `${bookTab}_${currentChapter}`;
                await db.saveSnapshot(actor.id, bookTab, currentChapter, {
                  baseStats: updatedActor.baseStats,
                  additionalStats: updatedActor.additionalStats,
                  activeSkills: updatedActor.activeSkills,
                  inventory: updatedActor.inventory
                });
              }
            }

            const actors = await db.getAll('actors');
            setWorldState(prev => ({ ...prev, actors }));
            setShowManuscriptParser(false);
          }}
          onClose={() => setShowManuscriptParser(false)}
        />
      )}

      
      {showGlobalSearch && (
        <GlobalSearch
          worldState={worldState}
          onClose={() => setShowGlobalSearch(false)}
          onNavigate={handleNavigate}
        />
      )}
      
      {/* Writing Mode Selector */}
      <WritingModeSelector
        currentMode={writingMode}
        onModeChange={(mode) => {
          setWritingMode(mode);
          // Save preference
          localStorage.setItem('writingMode', mode);
        }}
        isOpen={showWritingModeSelector}
        onClose={() => setShowWritingModeSelector(false)}
      />
      
      {/* Global Read-Aloud - works everywhere */}
      <GlobalReadAloud />
    </div>
  );
};

export default OmniscienceV22;
