import React, { useState, useEffect } from 'react';
import { 
  Sparkles, X, CheckCircle, AlertCircle, Users, Briefcase, Zap, 
  TrendingUp, ChevronDown, ChevronRight, Edit3, Plus, SkipForward,
  ArrowRight, FileText, Clock, RefreshCw
} from 'lucide-react';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import entityMatchingService from '../services/entityMatchingService';
import upgradeTrackingService from '../services/upgradeTrackingService';
import characterEnhancementService from '../services/characterEnhancementService';
import db from '../services/database';
import toastService from '../../services/toastService';

/**
 * Entity Extraction Wizard
 * Mandatory wizard that appears after chapter save to extract and manage entities
 */
const EntityExtractionWizard = ({ 
  chapterText, 
  chapterId, 
  bookId, 
  actors, 
  items, 
  skills, 
  statRegistry,
  books = [],
  onComplete,
  onClose 
}) => {
  const [extractedEntities, setExtractedEntities] = useState({ actors: [], items: [], skills: [] });
  const [matchedEntities, setMatchedEntities] = useState([]);
  const [newEntities, setNewEntities] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [isExtracting, setIsExtracting] = useState(true);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({ new: true, upgrades: false });
  const [entityActions, setEntityActions] = useState({}); // Track user actions per entity
  const [enhancingEntity, setEnhancingEntity] = useState(null); // Track which entity is being enhanced
  const [enhancedPreview, setEnhancedPreview] = useState(null); // Store enhanced data preview

  useEffect(() => {
    extractEntities();
  }, []);

  const extractEntities = async () => {
    try {
      setIsExtracting(true);
      const entities = await chapterDataExtractionService.extractEntitiesFromChapter(
        chapterText,
        chapterId,
        bookId
      );

      setExtractedEntities(entities);
      processEntities(entities);
    } catch (error) {
      console.error('Error extracting entities:', error);
      toastService.error('Failed to extract entities: ' + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const processEntities = (entities) => {
    const worldState = { actors, items, skills, statRegistry };
    const matched = [];
    const newOnes = [];
    const upgradeList = [];

    // Process actors
    for (const entity of entities.actors || []) {
      const match = entityMatchingService.matchEntity(entity, worldState);
      if (match) {
        const upgrade = entityMatchingService.detectUpgrade(entity, match.matchedEntity);
        if (upgrade) {
          upgradeList.push({
            entity: entity,
            existing: match.matchedEntity,
            match: match,
            upgrade: upgrade,
            type: 'actor'
          });
        } else {
          matched.push({
            entity: entity,
            existing: match.matchedEntity,
            match: match,
            type: 'actor'
          });
        }
      } else {
        newOnes.push({ ...entity, type: 'actor' });
      }
    }

    // Process items
    for (const entity of entities.items || []) {
      const match = entityMatchingService.matchEntity(entity, worldState);
      if (match) {
        const upgrade = entityMatchingService.detectUpgrade(entity, match.matchedEntity);
        if (upgrade) {
          upgradeList.push({
            entity: entity,
            existing: match.matchedEntity,
            match: match,
            upgrade: upgrade,
            type: 'item'
          });
        } else {
          matched.push({
            entity: entity,
            existing: match.matchedEntity,
            match: match,
            type: 'item'
          });
        }
      } else {
        newOnes.push({ ...entity, type: 'item' });
      }
    }

    // Process skills
    for (const entity of entities.skills || []) {
      const match = entityMatchingService.matchEntity(entity, worldState);
      if (match) {
        const upgrade = entityMatchingService.detectUpgrade(entity, match.matchedEntity);
        if (upgrade) {
          upgradeList.push({
            entity: entity,
            existing: match.matchedEntity,
            match: match,
            upgrade: upgrade,
            type: 'skill'
          });
        } else {
          matched.push({
            entity: entity,
            existing: match.matchedEntity,
            match: match,
            type: 'skill'
          });
        }
      } else {
        newOnes.push({ ...entity, type: 'skill' });
      }
    }

    setMatchedEntities(matched);
    setNewEntities(newOnes);
    setUpgrades(upgradeList);
  };

  const handleAction = async (entityData, action) => {
    const key = `${entityData.type}_${entityData.name || entityData.entity?.name}`;
    setEntityActions(prev => ({ ...prev, [key]: action }));

    try {
      switch (action) {
        case 'create':
          await createEntity(entityData);
          break;
        case 'update':
          await updateEntity(entityData);
          break;
        case 'upgrade':
          await applyUpgrade(entityData);
          break;
        case 'skip':
          // Just mark as skipped, no action needed
          break;
      }
    } catch (error) {
      console.error('Error processing entity action:', error);
      toastService.error('Failed to process entity: ' + error.message);
    }
  };

  const handleEnhanceCharacter = async (entityData) => {
    if (entityData.type !== 'actor') {
      toastService.warning('Enhancement is only available for characters');
      return;
    }

    setEnhancingEntity(entityData);
    setEnhancedPreview(null);

    try {
      // Build world state
      const worldState = {
        actors: actors || [],
        itemBank: items || [],
        skillBank: skills || [],
        statRegistry: statRegistry || []
      };

      // Enhance character
      const enhanced = await characterEnhancementService.enhanceCharacterFromText(
        entityData,
        chapterText,
        worldState,
        chapterId,
        bookId
      );

      setEnhancedPreview(enhanced);
      toastService.success('Character enhanced! Review the details below.');
    } catch (error) {
      console.error('Error enhancing character:', error);
      toastService.error('Failed to enhance character: ' + error.message);
      setEnhancingEntity(null);
    }
  };

  const handleApplyEnhanced = async (entityData) => {
    if (!enhancedPreview) return;

    // Merge enhanced data with entity data
    const enhancedEntityData = {
      ...entityData,
      entity: {
        ...entityData.entity,
        stats: enhancedPreview.stats,
        biography: enhancedPreview.biography,
        appearance: enhancedPreview.appearance
      },
      enhancedSkills: enhancedPreview.skills,
      enhancedEquipment: enhancedPreview.equipment,
      enhancedNicknames: enhancedPreview.nicknames
    };

    // Create entity with enhanced data
    await createEntityWithEnhancement(enhancedEntityData);
    
    // Clear preview
    setEnhancedPreview(null);
    setEnhancingEntity(null);
  };

  const createEntity = async (entityData) => {
    const entity = entityData.entity || entityData;
    const type = entityData.type;

    try {
      let newEntity;
      switch (type) {
        case 'actor':
          newEntity = {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: entity.name,
            role: entity.role || 'NPC',
            class: entity.class || 'Unknown',
            desc: entity.description || entity.desc || '',
            isFav: false,
            baseStats: entity.stats || { STR: 10, VIT: 10, INT: 10, DEX: 10 },
            additionalStats: {},
            activeSkills: [],
            inventory: [],
            snapshots: {},
            equipment: {
              helm: null, cape: null, amulet: null, armour: null,
              gloves: null, belt: null, boots: null,
              leftHand: null, rightHand: null,
              rings: [null, null, null, null, null, null, null],
              charms: [null, null, null, null]
            },
            appearances: {},
            biography: entity.description || '',
            nicknames: [],
            arcMilestones: {},
            lastConsistencyCheck: null,
            aiSuggestions: []
          };
          await db.add('actors', newEntity);
          toastService.success(`Created actor: ${entity.name}`);
          break;

        case 'item':
          newEntity = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: entity.name,
            desc: entity.description || '',
            type: entity.type || 'Item',
            stats: entity.stats || {},
            statMod: entity.stats || {},
            rarity: entity.rarity || 'Common',
            grantsSkills: entity.grantsSkills || [],
            quests: entity.quests || '',
            debuffs: entity.debuffs || {},
            upgradeHistory: []
          };
          await db.add('itemBank', newEntity);
          toastService.success(`Created item: ${entity.name}`);
          break;

        case 'skill':
          newEntity = {
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: entity.name,
            desc: entity.description || '',
            type: entity.type || 'Utility',
            tier: entity.tier || 1,
            statMod: entity.statMod || entity.stats || {},
            defaultVal: entity.defaultVal || 1,
            maxLevel: entity.maxLevel || null,
            prerequisites: entity.prerequisites || [],
            upgradeHistory: []
          };
          await db.add('skillBank', newEntity);
          toastService.success(`Created skill: ${entity.name}`);
          break;
      }
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  };

  const createEntityWithEnhancement = async (entityData) => {
    const entity = entityData.entity || entityData;
    const type = entityData.type;

    if (type !== 'actor') {
      await createEntity(entityData);
      return;
    }

    try {
      // Get enhanced data
      const enhanced = entityData.enhancedSkills ? {
        skills: entityData.enhancedSkills,
        equipment: entityData.enhancedEquipment,
        nicknames: entityData.enhancedNicknames
      } : enhancedPreview;

      if (!enhanced) {
        await createEntity(entityData);
        return;
      }

      // Resolve skill IDs from names if needed
      const resolvedSkills = [];
      for (const skillRef of enhanced.skills || []) {
        if (typeof skillRef === 'string') {
          const found = (skills || []).find(s => s.name === skillRef || s.id === skillRef);
          if (found) {
            resolvedSkills.push({ id: found.id, val: skillRef.level || 1 });
          }
        } else if (skillRef.id) {
          resolvedSkills.push({ id: skillRef.id, val: skillRef.level || 1 });
        }
      }

      // Resolve equipment IDs from names if needed
      const resolvedEquipment = {
        helm: null, cape: null, amulet: null, armour: null,
        gloves: null, belt: null, boots: null,
        leftHand: null, rightHand: null,
        rings: [null, null, null, null, null, null, null],
        charms: [null, null, null, null]
      };

      for (const [slot, itemRef] of Object.entries(enhanced.equipment || {})) {
        if (itemRef) {
          if (typeof itemRef === 'string') {
            const found = (items || []).find(i => i.name === itemRef || i.id === itemRef);
            if (found && resolvedEquipment.hasOwnProperty(slot)) {
              resolvedEquipment[slot] = found.id;
            }
          } else if (typeof itemRef === 'object' && itemRef.id) {
            if (resolvedEquipment.hasOwnProperty(slot)) {
              resolvedEquipment[slot] = itemRef.id;
            }
          }
        }
      }

      const newEntity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: entity.name,
        role: entity.role || 'NPC',
        class: entity.class || 'Unknown',
        desc: entity.description || entity.desc || '',
        isFav: false,
        baseStats: enhanced.stats || entity.stats || { STR: 10, VIT: 10, INT: 10, DEX: 10 },
        additionalStats: {},
        activeSkills: resolvedSkills,
        inventory: [],
        snapshots: {},
        equipment: resolvedEquipment,
        appearances: {},
        biography: enhanced.biography || entity.description || '',
        nicknames: enhanced.nicknames || [],
        arcMilestones: {},
        lastConsistencyCheck: null,
        aiSuggestions: []
      };

      await db.add('actors', newEntity);
      toastService.success(`Created enhanced actor: ${entity.name}`);
    } catch (error) {
      console.error('Error creating enhanced entity:', error);
      toastService.error('Failed to create enhanced entity: ' + error.message);
      // Fallback to regular creation
      await createEntity(entityData);
    }
  };

  const updateEntity = async (entityData) => {
    // For matched entities without upgrades, just skip (they already exist)
    // This is mainly for reference
    toastService.info(`Entity ${entityData.entity?.name} already exists`);
  };

  const applyUpgrade = async (entityData) => {
    const { existing, upgrade, type } = entityData;
    
    try {
      // Add upgrade to history
      await upgradeTrackingService.addUpgrade(
        existing.id,
        type,
        chapterId,
        bookId,
        upgrade,
        entityData.entity?.description || entityData.entity?.sourceContext || ''
      );

      // Apply changes to entity
      if (upgrade.stats) {
        for (const [stat, value] of Object.entries(upgrade.stats)) {
          existing.stats = existing.stats || {};
          existing.stats[stat] = (existing.stats[stat] || 0) + value;
          existing.statMod = existing.statMod || {};
          existing.statMod[stat] = (existing.statMod[stat] || 0) + value;
        }
      }

      if (upgrade.description) {
        existing.desc = upgrade.description;
      }

      if (upgrade.type) {
        existing.type = upgrade.type;
      }

      if (upgrade.rarity) {
        existing.rarity = upgrade.rarity;
      }

      if (upgrade.tier) {
        existing.tier = upgrade.tier;
      }

      // Update entity in database
      switch (type) {
        case 'item':
          await db.update('itemBank', existing);
          break;
        case 'skill':
          await db.update('skillBank', existing);
          break;
      }

      toastService.success(`Upgraded ${type}: ${existing.name}`);
    } catch (error) {
      console.error('Error applying upgrade:', error);
      throw error;
    }
  };

  const handleComplete = () => {
    // Check if all entities have been processed
    const totalEntities = newEntities.length + upgrades.length;
    const processedEntities = Object.keys(entityActions).length;
    
    if (processedEntities < totalEntities) {
      const unprocessed = totalEntities - processedEntities;
      if (!window.confirm(`You have ${unprocessed} unprocessed entities. Skip them and continue?`)) {
        return;
      }
    }

    onComplete?.();
    onClose?.();
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'actor': return Users;
      case 'item': return Briefcase;
      case 'skill': return Zap;
      default: return FileText;
    }
  };

  const getEntityColor = (type) => {
    switch (type) {
      case 'actor': return 'green';
      case 'item': return 'yellow';
      case 'skill': return 'blue';
      default: return 'gray';
    }
  };

  const renderEntityCard = (entityData, isUpgrade = false) => {
    const entity = entityData.entity || entityData;
    // Safety check: ensure entity has a name
    if (!entity || !entity.name) {
      console.warn('Invalid entity data in renderEntityCard:', entityData);
      return null;
    }
    const key = `${entityData.type}_${entity.name}`;
    const action = entityActions[key] || null;
    const Icon = getEntityIcon(entityData.type);
    const color = getEntityColor(entityData.type);
    
    const colorClasses = {
      green: {
        border: 'border-green-500/30',
        bg: 'bg-green-500/20',
        text: 'text-green-400'
      },
      yellow: {
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400'
      },
      blue: {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/20',
        text: 'text-blue-400'
      },
      gray: {
        border: 'border-gray-500/30',
        bg: 'bg-gray-500/20',
        text: 'text-gray-400'
      }
    };
    
    const colorClass = colorClasses[color] || colorClasses.gray;

    return (
      <div key={key} className={`bg-slate-800 border ${colorClass.border} rounded-lg p-4 mb-3`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full ${colorClass.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colorClass.text}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white">{entity.name}</h4>
                {isUpgrade && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                    Upgrade
                  </span>
                )}
                {entityData.match && entityData.match.confidence !== undefined && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                    Matched ({Math.round((entityData.match.confidence || 0) * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-2">{entity.description || 'No description'}</p>
              
              {isUpgrade && entityData.upgrade && Object.keys(entityData.upgrade).length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 mb-2">
                  <p className="text-xs text-purple-300 font-semibold mb-1">Changes:</p>
                  <p className="text-xs text-slate-300">
                    {upgradeTrackingService.formatUpgradeChanges(entityData.upgrade) || 'No changes specified'}
                  </p>
                </div>
              )}

              {entityData.existing && entityData.existing.name && (
                <div className="bg-slate-700/50 rounded p-2 mb-2">
                  <p className="text-xs text-slate-400 mb-1">Existing:</p>
                  <p className="text-xs text-slate-300">{entityData.existing.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!action && (
              <>
                {isUpgrade ? (
                  <>
                    <button
                      onClick={() => handleAction(entityData, 'upgrade')}
                      className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply Upgrade
                    </button>
                    <button
                      onClick={() => handleAction(entityData, 'skip')}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                  </>
                ) : (
                  <>
                    {entityData.existing ? (
                      <button
                        onClick={() => handleAction(entityData, 'update')}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Match
                      </button>
                    ) : (
                      <>
                        {entityData.type === 'actor' && (
                          <button
                            onClick={() => handleEnhanceCharacter(entityData)}
                            disabled={enhancingEntity === entityData}
                            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm rounded flex items-center gap-1"
                            title="AI will generate full character profile (stats, skills, equipment, biography, nicknames)"
                          >
                            {enhancingEntity === entityData ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            Enhance
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(entityData, 'create')}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Create
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleAction(entityData, 'skip')}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                  </>
                )}
              </>
            )}
            {action && (
              <div className="px-3 py-1.5 bg-green-500/20 text-green-300 text-sm rounded flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {action === 'create' ? 'Created' : action === 'upgrade' ? 'Upgraded' : action === 'update' ? 'Confirmed' : 'Skipped'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isExtracting) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl border border-purple-500/30 w-full max-w-2xl p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Extracting Entities</h2>
            <p className="text-slate-400">Analyzing chapter text for entities...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalNew = newEntities.length;
  const totalUpgrades = upgrades.length;
  const totalProcessed = Object.keys(entityActions).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-purple-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-purple-500/10 border-b border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Entity Extraction Wizard</h2>
                <p className="text-sm text-slate-400">
                  Review and manage entities found in this chapter
                </p>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">New Entities</p>
                <p className="text-2xl font-bold text-green-400">{totalNew}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Upgrades</p>
                <p className="text-2xl font-bold text-purple-400">{totalUpgrades}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Processed</p>
                <p className="text-2xl font-bold text-blue-400">{totalProcessed}/{totalNew + totalUpgrades}</p>
              </div>
            </div>
          </div>

          {/* New Entities Section */}
          {totalNew > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, new: !prev.new }))}
                className="w-full flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-3 hover:bg-green-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedSections.new ? <ChevronDown className="w-5 h-5 text-green-400" /> : <ChevronRight className="w-5 h-5 text-green-400" />}
                  <h3 className="text-lg font-semibold text-white">New Entities ({totalNew})</h3>
                </div>
                <span className="text-sm text-green-400">Create these new entities</span>
              </button>
              {expandedSections.new && (
                <div className="space-y-3">
                  {newEntities
                    .filter(entity => entity && (entity.entity || entity).name)
                    .map((entity, idx) => renderEntityCard(entity, false))}
                </div>
              )}
            </div>
          )}

          {/* Upgrades Section */}
          {totalUpgrades > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, upgrades: !prev.upgrades }))}
                className="w-full flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-3 hover:bg-purple-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedSections.upgrades ? <ChevronDown className="w-5 h-5 text-purple-400" /> : <ChevronRight className="w-5 h-5 text-purple-400" />}
                  <h3 className="text-lg font-semibold text-white">Upgrades ({totalUpgrades})</h3>
                </div>
                <span className="text-sm text-purple-400">Apply upgrades to existing entities</span>
              </button>
              {expandedSections.upgrades && (
                <div className="space-y-3">
                  {upgrades
                    .filter(upgrade => upgrade && (upgrade.entity || upgrade).name)
                    .map((upgrade, idx) => renderEntityCard(upgrade, true))}
                </div>
              )}
            </div>
          )}

          {totalNew === 0 && totalUpgrades === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-lg text-white mb-2">No new entities found</p>
              <p className="text-sm text-slate-400">All entities in this chapter already exist in your database.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 border-t border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {totalProcessed < totalNew + totalUpgrades 
                ? `Process ${totalNew + totalUpgrades - totalProcessed} more entities to continue`
                : 'All entities processed'}
            </p>
            <button
              onClick={handleComplete}
              disabled={totalProcessed < totalNew + totalUpgrades}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2"
            >
              Complete
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityExtractionWizard;
