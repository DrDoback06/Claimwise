import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Settings, Save, RefreshCw, Dices, Sliders, X, Zap, Shield, Swords, Package, Image as ImageIcon, Upload, Loader, Clock } from 'lucide-react';
import aiService from '../../services/aiService';
import imageGenerationService from '../../services/imageGenerationService';
import toastService from '../../services/toastService';
import upgradeTrackingService from '../../services/upgradeTrackingService';
import db from '../../services/database';

/**
 * Diablo II-Style Item Generator
 * Features extensive customization, procedural generation, and AI assistance
 */
const DiabloItemGenerator = ({ onSave, onClose, statRegistry, skillBank, initialItem = null, books = [] }) => {
  // Base configuration
  const [baseType, setBaseType] = useState('Weapon');
  const [itemClass, setItemClass] = useState('Melee');
  const [rarity, setRarity] = useState('Common');

  // Procedural generation sliders
  const [powerLevel, setPowerLevel] = useState(50);
  const [affixCount, setAffixCount] = useState(2);
  const [statVariance, setStatVariance] = useState(20);
  const [cursedChance, setCursedChance] = useState(0);

  // Manual configuration
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lore, setLore] = useState('');
  const [stats, setStats] = useState({});
  const [linkedSkills, setLinkedSkills] = useState([]);
  const [questText, setQuestText] = useState('');
  const [debuffs, setDebuffs] = useState('');

  // UI state
  const [mode, setMode] = useState('sliders'); // 'sliders' | 'manual' | 'ai'
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Image state
  const [imagePath, setImagePath] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Upgrade history state
  const [upgradeHistory, setUpgradeHistory] = useState([]);
  const [booksState, setBooksState] = useState([]);
  
  // Equipment slot mapping
  const [equipmentSlot, setEquipmentSlot] = useState(null);
  
  // Load initial item data if editing
  useEffect(() => {
    if (initialItem) {
      setName(initialItem.baseName || initialItem.name || '');
      setDescription(initialItem.desc || '');
      setLore(initialItem.lore || '');
      setStats(initialItem.stats || {});
      setLinkedSkills(initialItem.grantsSkills || []);
      setQuestText(initialItem.quests || '');
      setDebuffs(initialItem.debuffs || '');
      setRarity(initialItem.rarity || 'Common');
      setBaseType(initialItem.baseType || 'Weapon');
      setItemClass(initialItem.type || 'Melee');
      setImagePath(initialItem.imagePath || null);
      setEquipmentSlot(initialItem.equipmentSlot || null);
    }
  }, [initialItem]);
  
  // Load image preview when imagePath changes
  useEffect(() => {
    if (imagePath) {
      imageGenerationService.getImageUrl(imagePath)
        .then(url => {
          setImagePreview(url);
        })
        .catch(err => {
          console.error('Failed to load image preview:', err);
          setImagePreview(null);
        });
    } else {
      setImagePreview(null);
    }
  }, [imagePath]);
  
  const loadUpgradeHistory = async (itemId) => {
    try {
      const history = await upgradeTrackingService.getUpgradeHistory(itemId, 'item');
      setUpgradeHistory(history);
    } catch (error) {
      console.error('Error loading upgrade history:', error);
      setUpgradeHistory([]);
    }
  };

  // Stat management
  const [selectedStat, setSelectedStat] = useState(statRegistry[0]?.key || 'STR');
  const [statValue, setStatValue] = useState(10);
  const [statIsNegative, setStatIsNegative] = useState(false); // Toggle for positive/negative stats
  const [statModifierType, setStatModifierType] = useState('flat'); // 'flat', 'percentage', 'perLevel', 'conditional'
  const [conditionalStat, setConditionalStat] = useState('HP');
  const [conditionalThreshold, setConditionalThreshold] = useState(50);

  const itemTypes = {
    'Weapon': [
      'Sword', 'Longsword', 'Shortsword', 'Broadsword', 'Rapier', 'Scimitar', 'Falchion', 'Claymore', 'Katana',
      'Axe', 'Battle Axe', 'War Axe', 'Hand Axe', 'Greataxe', 'Tomahawk',
      'Hammer', 'War Hammer', 'Maul', 'Mace', 'Flail', 'Morningstar', 'Club',
      'Spear', 'Lance', 'Halberd', 'Pike', 'Trident', 'Glaive',
      'Dagger', 'Stiletto', 'Kris', 'Kukri', 'Bowie Knife',
      'Bow', 'Longbow', 'Shortbow', 'Crossbow', 'Recurve Bow', 'Composite Bow',
      'Staff', 'Quarterstaff', 'Wand', 'Scepter', 'Orb', 'Tome', 'Grimoire',
      'Whip', 'Chain', 'Flail', 'Nunchaku',
      'Fist Weapon', 'Claw', 'Gauntlet', 'Brass Knuckles'
    ],
    'Armor': [
      'Helmet', 'Cap', 'Crown', 'Circlet', 'Tiara', 'Hood', 'Mask', 'Visor',
      'Chestplate', 'Breastplate', 'Cuirass', 'Vest', 'Tunic', 'Robe', 'Coat', 'Jacket',
      'Chainmail', 'Chain Shirt', 'Scale Mail', 'Ring Mail', 'Splint Mail',
      'Plate Mail', 'Full Plate', 'Heavy Plate', 'Field Plate',
      'Leather Armor', 'Studded Leather', 'Hide Armor', 'Padded Armor',
      'Arcane Armor', 'Enchanted Robe', 'Mystic Vestment', 'Sorcerer\'s Garb',
      'Leggings', 'Greaves', 'Chausses', 'Pants', 'Trousers',
      'Gauntlets', 'Gloves', 'Mittens', 'Bracers', 'Vambraces',
      'Boots', 'Shoes', 'Sandals', 'Sabatons', 'Greaves',
      'Shield', 'Buckler', 'Tower Shield', 'Kite Shield', 'Round Shield', 'Heater Shield'
    ],
    'Artifact': [
      'Ring', 'Signet Ring', 'Band', 'Seal Ring',
      'Amulet', 'Pendant', 'Locket', 'Medallion', 'Talisman',
      'Trinket', 'Charm', 'Token', 'Relic', 'Idol',
      'Belt', 'Sash', 'Girdle', 'Cord',
      'Cloak', 'Cape', 'Mantle', 'Shawl',
      'Banner', 'Standard', 'Flag'
    ],
    'Consumable': [
      'Health Potion', 'Mana Potion', 'Stamina Potion', 'Elixir', 'Tonic',
      'Scroll', 'Spell Scroll', 'Enchantment Scroll', 'Ritual Scroll',
      'Food', 'Ration', 'Ration Pack', 'Trail Mix',
      'Gem', 'Ruby', 'Sapphire', 'Emerald', 'Diamond', 'Topaz', 'Amethyst', 'Pearl',
      'Rune', 'Enchanted Rune', 'Ancient Rune', 'Power Rune',
      'Material', 'Ore', 'Ingot', 'Cloth', 'Leather', 'Hide', 'Bone', 'Crystal'
    ]
  };

  const rarities = [
    { name: 'Common', color: 'gray', multiplier: 1.0 },
    { name: 'Uncommon', color: 'green', multiplier: 1.2 },
    { name: 'Rare', color: 'blue', multiplier: 1.5 },
    { name: 'Epic', color: 'purple', multiplier: 2.0 },
    { name: 'Legendary', color: 'yellow', multiplier: 3.0 },
    { name: 'Cursed', color: 'red', multiplier: 2.5 }
  ];

  /**
   * Procedural generation using sliders
   */
  const generateProcedural = () => {
    const rarityData = rarities.find(r => r.name === rarity);
    const basePower = powerLevel * rarityData.multiplier;

    // Generate name - Expanded Diablo II style prefixes and suffixes
    const prefixes = [
      // Power/Quality
      'Bureaucratic', 'Cursed', 'Sanctioned', 'Compliant', 'Queued', 'Processed',
      'Ancient', 'Elder', 'Primal', 'Primeval', 'Forgotten', 'Lost', 'Hidden',
      'Blessed', 'Divine', 'Sacred', 'Hallowed', 'Consecrated', 'Revered',
      'Cursed', 'Damned', 'Corrupted', 'Tainted', 'Blighted', 'Defiled',
      'Enchanted', 'Magical', 'Arcane', 'Mystical', 'Eldritch', 'Ethereal',
      'Epic', 'Legendary', 'Mythic', 'Fabled', 'Immortal', 'Eternal',
      'Master\'s', 'Grandmaster\'s', 'Expert\'s', 'Adept\'s', 'Novice\'s',
      'Warrior\'s', 'Mage\'s', 'Rogue\'s', 'Paladin\'s', 'Necromancer\'s',
      // Material/Origin
      'Iron', 'Steel', 'Silver', 'Gold', 'Platinum', 'Mithril', 'Adamantine',
      'Dragon', 'Demon', 'Angel', 'Celestial', 'Infernal', 'Abyssal',
      'Frost', 'Flame', 'Storm', 'Thunder', 'Lightning', 'Shadow', 'Void',
      'Crystal', 'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Topaz',
      'Bone', 'Skull', 'Soul', 'Spirit', 'Phantom', 'Wraith',
      // Status/Effect
      'Vampiric', 'Leeching', 'Draining', 'Siphoning', 'Absorbing',
      'Regenerating', 'Healing', 'Restoring', 'Reviving', 'Renewing',
      'Swift', 'Quick', 'Rapid', 'Hasty', 'Fleet', 'Nimble',
      'Mighty', 'Powerful', 'Strong', 'Potent', 'Formidable',
      'Precise', 'Accurate', 'True', 'Perfect', 'Flawless',
      'Guardian\'s', 'Protector\'s', 'Defender\'s', 'Shield\'s',
      'Slayer\'s', 'Destroyer\'s', 'Executioner\'s', 'Reaper\'s'
    ];
    const suffixes = [
      // Power/Quality
      'of Authority', 'of Waiting', 'of Compliance', 'of the Queue', 'of Bureaucracy',
      'of Power', 'of Might', 'of Strength', 'of Force', 'of Potency',
      'of the Ages', 'of Eternity', 'of Infinity', 'of Immortality',
      'of Perfection', 'of Excellence', 'of Mastery', 'of Supremacy',
      // Stat Bonuses
      'of Strength', 'of Vitality', 'of Dexterity', 'of Intelligence', 'of Wisdom',
      'of Health', 'of Mana', 'of Stamina', 'of Energy', 'of Life',
      'of Speed', 'of Swiftness', 'of Agility', 'of Quickness',
      'of Accuracy', 'of Precision', 'of Focus', 'of Clarity',
      'of Protection', 'of Defense', 'of Warding', 'of Shielding',
      'of Destruction', 'of Slaying', 'of Execution', 'of Annihilation',
      // Elemental
      'of Fire', 'of Flame', 'of Inferno', 'of Blaze', 'of Embers',
      'of Frost', 'of Ice', 'of Winter', 'of Cold', 'of Freezing',
      'of Lightning', 'of Thunder', 'of Storms', 'of Tempest',
      'of Shadow', 'of Darkness', 'of Void', 'of Night',
      'of Light', 'of Radiance', 'of Brilliance', 'of Illumination',
      // Special Effects
      'of Life Stealing', 'of Mana Stealing', 'of Leeching', 'of Draining',
      'of Regeneration', 'of Healing', 'of Restoration', 'of Renewal',
      'of Reanimation', 'of Resurrection', 'of Revival',
      'of Resistance', 'of Immunity', 'of Absorption',
      'of Fortune', 'of Luck', 'of Chance', 'of Fate',
      'of the Ancients', 'of the Elders', 'of the Gods', 'of the Titans',
      'of Wrath', 'of Fury', 'of Rage', 'of Vengeance',
      'of Tranquility', 'of Peace', 'of Serenity', 'of Calm',
      'of the Beast', 'of the Dragon', 'of the Demon', 'of the Angel'
    ];
    const baseNames = {
      'Weapon': ['Sword', 'Axe', 'Hammer', 'Dagger', 'Bow', 'Staff', 'Spear', 'Mace', 'Whip', 'Claw'],
      'Armor': ['Armor', 'Plate', 'Mail', 'Leather', 'Robe', 'Vest', 'Boots', 'Helmet', 'Gloves', 'Shield'],
      'Artifact': ['Ring', 'Amulet', 'Trinket', 'Charm', 'Belt', 'Cloak', 'Banner'],
      'Consumable': ['Potion', 'Scroll', 'Gem', 'Rune', 'Food', 'Material']
    };

    const genName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${baseNames[baseType][Math.floor(Math.random() * baseNames[baseType].length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    setName(genName);

    // Generate stats based on power level and variance
    const genStats = {};
    const numStats = Math.max(1, Math.floor(affixCount + (Math.random() - 0.5)));

    for (let i = 0; i < numStats && i < statRegistry.length; i++) {
      const randomStat = statRegistry[Math.floor(Math.random() * statRegistry.length)];
      const baseValue = Math.floor((basePower / numStats) * (1 + (Math.random() - 0.5) * (statVariance / 100)));
      genStats[randomStat.key] = Math.max(1, baseValue);
    }

    setStats(genStats);

    // Generate debuff if cursed
    if (Math.random() * 100 < cursedChance || rarity === 'Cursed') {
      const curses = [
        `-${Math.floor(Math.random() * 10 + 5)} ${statRegistry[Math.floor(Math.random() * statRegistry.length)].key}`,
        'Drains health over time',
        'Reduces speed in queues',
        'Attracts bureaucratic attention',
        'Causes random paperwork generation'
      ];
      setDebuffs(curses[Math.floor(Math.random() * curses.length)]);
    }

    // Generate description
    const descriptions = [
      `Forged in the fires of endless waiting, this ${baseType.toLowerCase()} carries the weight of a thousand forms.`,
      `Once belonging to a case worker, now imbued with bureaucratic power.`,
      `Stamped with the seal of Claimwise, this item bends reality to policy.`,
      `Those who wield it can sense the nearest queue from miles away.`,
      `Rumored to have processed over 10,000 claims before being decommissioned.`
    ];
    setDescription(descriptions[Math.floor(Math.random() * descriptions.length)]);
  };

  /**
   * AI-assisted generation
   */
  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const context = {
        baseType,
        itemClass,
        rarity,
        powerLevel,
        affixCount,
        availableStats: statRegistry.map(s => s.key),
        availableSkills: skillBank.map(s => s.name)
      };

      const customPrompt = aiPrompt || `Generate a creative ${rarity} ${baseType} suitable for a bureaucratic horror-fantasy setting`;

      const result = await aiService.generateDiabloItem(baseType, rarity, affixCount, {
        ...context,
        userPrompt: customPrompt
      });

      if (result) {
        setName(result.name || '');
        setDescription(result.desc || '');
        setLore(result.lore || '');
        setStats(result.stats || {});
        setLinkedSkills(result.grantsSkills || []);
        setQuestText(result.quests || '');
        setDebuffs(result.debuffs || '');
      }
    } catch (error) {
      alert(`AI Generation Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Add stat manually
   */
  const addStat = () => {
    if (selectedStat && statValue !== 0) {
      const finalValue = statIsNegative ? -Math.abs(statValue) : Math.abs(statValue);
      const modifier = {
        type: statModifierType,
        value: finalValue,
        conditional: statModifierType === 'conditional' ? {
          stat: conditionalStat,
          threshold: conditionalThreshold
        } : undefined
      };
      
      // Support multiple modifiers of different types for same stat
      setStats(prev => {
        const existing = prev[selectedStat];
        let existingMods = [];
        
        // Convert existing value to array of modifier objects
        if (existing === undefined || existing === null) {
          existingMods = [];
        } else if (Array.isArray(existing)) {
          // Already an array - normalize to modifier objects
          existingMods = existing.map(ex => 
            typeof ex === 'object' && ex !== null ? ex : { type: 'flat', value: ex }
          );
        } else if (typeof existing === 'number') {
          // Convert number to modifier object
          existingMods = [{ type: 'flat', value: existing }];
        } else if (typeof existing === 'object') {
          // Already a modifier object
          existingMods = [existing];
        }
        
        const newMods = [...existingMods, modifier];
        return { ...prev, [selectedStat]: newMods };
      });
    }
  };

  /**
   * Remove stat
   */
  const removeStat = (statKey, modifierIndex) => {
    const newStats = { ...stats };
    
    // Normalize the stat value to an array if needed
    const currentValue = newStats[statKey];
    let normalizedArray = [];
    
    if (currentValue === undefined || currentValue === null) {
      // Stat doesn't exist, nothing to remove
      return;
    } else if (Array.isArray(currentValue)) {
      normalizedArray = currentValue.map(ex => 
        typeof ex === 'object' && ex !== null ? ex : { type: 'flat', value: ex }
      );
    } else if (typeof currentValue === 'number') {
      normalizedArray = [{ type: 'flat', value: currentValue }];
    } else if (typeof currentValue === 'object') {
      normalizedArray = [currentValue];
    }
    
    // Remove the modifier at the specified index
    if (modifierIndex !== undefined && modifierIndex !== null) {
      normalizedArray = normalizedArray.filter((_, idx) => idx !== modifierIndex);
    } else {
      // If no index specified, remove all modifiers for this stat
      normalizedArray = [];
    }
    
    // Update or remove the stat
    if (normalizedArray.length === 0) {
      delete newStats[statKey];
    } else if (normalizedArray.length === 1) {
      // Single modifier - could store as object or array, but keep as array for consistency
      newStats[statKey] = normalizedArray;
    } else {
      newStats[statKey] = normalizedArray;
    }
    
    setStats(newStats);
  };

  /**
   * Add skill
   */
  const addSkill = (skillId) => {
    if (!linkedSkills.includes(skillId)) {
      setLinkedSkills(prev => [...prev, skillId]);
    }
  };

  // Item sockets
  const [maxSockets, setMaxSockets] = useState(0);
  const [socketedItems, setSocketedItems] = useState([]);
  const [socketType, setSocketType] = useState('gem');

  // Affixes
  const [affixes, setAffixes] = useState([]);
  const [selectedAffixType, setSelectedAffixType] = useState('prefix');
  const [selectedAffixTier, setSelectedAffixTier] = useState(1);
  const [affixName, setAffixName] = useState('');
  const [affixStats, setAffixStats] = useState({});

  // Class restrictions
  const [itemClassRestrictions, setItemClassRestrictions] = useState([]);

  /**
   * Remove socketed item
   */
  const removeSocketedItem = (index) => {
    setSocketedItems(socketedItems.filter((_, idx) => idx !== index));
  };

  /**
   * Add affix
   */
  const addAffix = () => {
    if (affixName) {
      const affix = {
        type: selectedAffixType,
        name: affixName,
        tier: selectedAffixTier,
        stats: affixStats,
        requirements: {}
      };
      setAffixes([...affixes, affix]);
      setAffixName('');
      setAffixStats({});
    }
  };

  /**
   * Remove affix
   */
  const removeAffix = (index) => {
    setAffixes(affixes.filter((_, idx) => idx !== index));
  };

  /**
   * Toggle item class restriction
   */
  const toggleItemClassRestriction = (className) => {
    if (itemClassRestrictions.includes(className)) {
      setItemClassRestrictions(itemClassRestrictions.filter(c => c !== className));
    } else {
      setItemClassRestrictions([...itemClassRestrictions, className]);
    }
  };

  /**
   * Generate item name with affixes
   */
  const getItemNameWithAffixes = () => {
    const prefixes = affixes.filter(a => a.type === 'prefix').map(a => a.name);
    const suffixes = affixes.filter(a => a.type === 'suffix').map(a => a.name);
    const parts = [...prefixes, name, ...suffixes].filter(Boolean);
    return parts.join(' ') || '[Unnamed Item]';
  };

  /**
   * Generate item image
   */
  const handleGenerateImage = async () => {
    if (!name && !description) {
      alert('Please enter item name and description first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const itemData = {
        id: `item_${Date.now()}`,
        name: getItemNameWithAffixes() || name,
        type: itemClass, // This is the specific item type (e.g., "Sword", "Bow")
        baseType: baseType, // This is the category (e.g., "Weapon", "Armor")
        desc: description,
        lore,
        rarity,
        stats: stats // Include stats in prompt
      };
      
      const path = await imageGenerationService.generateItemImage(itemData);
      setImagePath(path);
      // Image preview will be loaded by useEffect when imagePath changes
      toastService.success('Image generated successfully!');
    } catch (error) {
      console.error('Image generation error:', error);
      alert(`Image generation failed: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  /**
   * Auto-determine equipment slot based on item type
   */
  const determineEquipmentSlot = (itemType, baseType) => {
    const typeLower = (itemType || '').toLowerCase();
    const baseLower = (baseType || '').toLowerCase();
    
    // Check for rings
    if (typeLower.includes('ring')) {
      return 'rings';
    }
    // Check for charms
    if (typeLower.includes('charm') || typeLower.includes('trinket')) {
      return 'charms';
    }
    // Check for helmet
    if (typeLower.includes('helm') || typeLower.includes('hat') || typeLower.includes('cap') || typeLower.includes('crown')) {
      return 'helm';
    }
    // Check for cape
    if (typeLower.includes('cape') || typeLower.includes('cloak') || typeLower.includes('mantle')) {
      return 'cape';
    }
    // Check for amulet
    if (typeLower.includes('amulet') || typeLower.includes('necklace') || typeLower.includes('pendant')) {
      return 'amulet';
    }
    // Check for armor/chest
    if (typeLower.includes('armour') || typeLower.includes('armor') || typeLower.includes('chest') || 
        typeLower.includes('plate') || typeLower.includes('mail') || typeLower.includes('robe') ||
        typeLower.includes('vest') || typeLower.includes('tunic') || typeLower.includes('coat')) {
      return 'armour';
    }
    // Check for gloves
    if (typeLower.includes('gloves') || typeLower.includes('gauntlets') || typeLower.includes('bracers')) {
      return 'gloves';
    }
    // Check for belt
    if (typeLower.includes('belt') || typeLower.includes('sash') || typeLower.includes('girdle')) {
      return 'belt';
    }
    // Check for boots
    if (typeLower.includes('boots') || typeLower.includes('shoes') || typeLower.includes('sandals')) {
      return 'boots';
    }
    // Check for weapons/shields
    if (baseLower === 'weapon' || typeLower.includes('weapon') || typeLower.includes('sword') || 
        typeLower.includes('axe') || typeLower.includes('hammer') || typeLower.includes('dagger') ||
        typeLower.includes('bow') || typeLower.includes('staff') || typeLower.includes('spear') ||
        typeLower.includes('mace') || typeLower.includes('whip') || typeLower.includes('shield')) {
      return 'weapon'; // Will be assigned to leftHand or rightHand
    }
    
    return null; // No specific slot (consumable, etc.)
  };

  /**
   * Upload custom image
   */
  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const itemId = `item_${Date.now()}`;
      const path = await imageGenerationService.uploadCustomImage(file, 'item', itemId);
      setImagePath(path);
      const imageUrl = await imageGenerationService.getImageUrl(path);
      setImagePreview(imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      alert(`Image upload failed: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  /**
   * Save item
   */
  const handleSave = () => {
    // Auto-determine equipment slot if not set
    const autoSlot = equipmentSlot || determineEquipmentSlot(itemClass, baseType);
    
    const item = {
      id: initialItem?.id || `item_${Date.now()}`, // Use existing ID if editing
      name: getItemNameWithAffixes(),
      baseName: name,
      type: itemClass, // This is the specific item type (e.g., "Sword", "Bow")
      baseType: baseType, // This is the category (e.g., "Weapon", "Armor")
      desc: description,
      lore,
      stats,
      grantsSkills: linkedSkills,
      quests: questText,
      debuffs,
      rarity,
      sockets: {
        maxSockets,
        socketType,
        socketedItems
      },
      affixes: affixes,
      classRestrictions: itemClassRestrictions.length > 0 ? itemClassRestrictions : null,
      imagePath: imagePath || null,
      equipmentSlot: autoSlot // Add equipment slot for inventory matching
    };

    onSave(item);
  };

  const rarityColor = rarities.find(r => r.name === rarity)?.color || 'gray';

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col p-4 overflow-hidden">
      <div className="bg-slate-900 border-2 border-yellow-500 w-full max-w-6xl mx-auto rounded-lg shadow-[0_0_80px_rgba(234,179,8,0.4)] flex flex-col h-full max-h-full my-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              <Sparkles className="mr-3 text-yellow-400 animate-pulse" />
              DIABLO II ITEM FORGE
            </h2>
            <p className="text-sm text-slate-400 mt-1">Create epic items with extensive customization</p>
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
            <Sliders className="w-4 h-4" />
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
          {/* Base configuration (always visible) */}
          <div className="bg-slate-950 p-4 rounded border border-yellow-500/30">
            <h3 className="text-sm font-bold text-yellow-400 mb-4">ITEM IDENTITY</h3>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="text-xs text-yellow-500 font-bold block mb-2">ITEM NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name or edit generated name..."
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Editable in all modes - change after AI/procedural generation</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-yellow-500 font-bold block mb-2">BASE TYPE</label>
                <select
                  value={baseType}
                  onChange={(e) => { setBaseType(e.target.value); setItemClass(itemTypes[e.target.value][0]); }}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                >
                  {Object.keys(itemTypes).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-yellow-500 font-bold block mb-2">ITEM CLASS</label>
                <select
                  value={itemClass}
                  onChange={(e) => {
                    setItemClass(e.target.value);
                    // Auto-update equipment slot when item class changes
                    const autoSlot = determineEquipmentSlot(e.target.value, baseType);
                    setEquipmentSlot(autoSlot);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                >
                  {itemTypes[baseType].map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-yellow-500 font-bold block mb-2">RARITY</label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className={`w-full bg-slate-900 border border-${rarityColor}-500 p-2 rounded text-${rarityColor}-400 font-bold`}
                >
                  {rarities.map(r => (
                    <option key={r.name} value={r.name}>{r.name} (×{r.multiplier})</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Equipment Slot Selector */}
            <div className="mt-4">
              <label className="text-xs text-yellow-500 font-bold block mb-2">EQUIPMENT SLOT (for inventory)</label>
              <select
                value={equipmentSlot || determineEquipmentSlot(itemClass, baseType) || ''}
                onChange={(e) => setEquipmentSlot(e.target.value || null)}
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
              >
                <option value="">Auto-detect (based on item type)</option>
                <option value="helm">Helm</option>
                <option value="cape">Cape</option>
                <option value="amulet">Amulet</option>
                <option value="armour">Armour</option>
                <option value="gloves">Gloves</option>
                <option value="belt">Belt</option>
                <option value="boots">Boots</option>
                <option value="rings">Ring (slot 1 or 2)</option>
                <option value="charms">Charm</option>
                <option value="weapon">Weapon (left or right hand)</option>
                <option value="">None (consumable/inventory only)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {equipmentSlot || determineEquipmentSlot(itemClass, baseType) 
                  ? `Will equip to: ${equipmentSlot || determineEquipmentSlot(itemClass, baseType)}` 
                  : 'This item cannot be equipped (consumable/inventory only)'}
              </p>
            </div>
          </div>

          {/* Image Preview Section */}
          <div className="bg-slate-950 p-4 rounded border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              ITEM VISUAL
            </h3>
            <div className="flex flex-col gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Item preview" 
                    className="w-full max-w-xs mx-auto rounded-lg border-2 border-purple-500/50 shadow-lg"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImagePath(null);
                    }}
                    className="absolute top-2 right-2 bg-red-900/90 hover:bg-red-800 border border-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    title="Remove image"
                  >
                    <X className="w-4 h-4"/>
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-xs mx-auto h-48 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No image</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !name}
                  className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800 border border-purple-700 text-purple-300 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Image
                    </>
                  )}
                </button>
                <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Slider Mode */}
          {mode === 'sliders' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded border border-blue-500/30">
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                  <Dices className="w-5 h-5 mr-2" />
                  PROCEDURAL GENERATION PARAMETERS
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Power Level</span>
                      <span className="text-blue-400 font-bold">{powerLevel}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={powerLevel}
                      onChange={(e) => setPowerLevel(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Overall strength of the item</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Affix Count</span>
                      <span className="text-blue-400 font-bold">{affixCount}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={affixCount}
                      onChange={(e) => setAffixCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Number of stat modifiers</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Stat Variance</span>
                      <span className="text-blue-400 font-bold">±{statVariance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={statVariance}
                      onChange={(e) => setStatVariance(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Randomness in stat values</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Cursed Chance</span>
                      <span className="text-red-400 font-bold">{cursedChance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={cursedChance}
                      onChange={(e) => setCursedChance(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Chance to generate negative effects</p>
                  </div>
                </div>

                <button
                  onClick={generateProcedural}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  GENERATE ITEM
                </button>
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-4">MANUAL CONFIGURATION</h3>
                <p className="text-xs text-slate-500">Use the "Additional Properties" section below to edit description, lore, quests, debuffs, and skills</p>
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
                      placeholder="Describe the item you want to create... (e.g., 'A cursed clipboard that grants bureaucratic powers but drains sanity')"
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

                  <p className="text-xs text-slate-500 text-center">
                    AI will create a unique item based on your prompt and the selected rarity/type
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Properties (always visible, editable in all modes) */}
          <div className="bg-slate-950 p-6 rounded border border-slate-700">
            <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              ADDITIONAL PROPERTIES
            </h3>
            <p className="text-xs text-slate-500 mb-4">Edit description, lore, quests, debuffs, and skills in all modes</p>
            
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item's appearance and primary effect..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-600"
                />
              </div>

              {/* Lore */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">LORE</label>
                <textarea
                  value={lore}
                  onChange={(e) => setLore(e.target.value)}
                  placeholder="Background story of the item... (leave empty to remove)"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-600"
                />
              </div>

              {/* Quest Text */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">QUEST/EVOLUTION TEXT</label>
                <textarea
                  value={questText}
                  onChange={(e) => setQuestText(e.target.value)}
                  placeholder="Quest requirements or item evolution conditions... (leave empty to remove)"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-600"
                />
              </div>

              {/* Debuffs */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">DEBUFFS/CURSES</label>
                <textarea
                  value={debuffs}
                  onChange={(e) => setDebuffs(e.target.value)}
                  placeholder="Negative effects or curses... (leave empty to remove)"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white placeholder-slate-600"
                />
              </div>

              {/* Granted Skills */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2">GRANTS SKILLS</label>
                {linkedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {linkedSkills.map(skillId => {
                      const skill = skillBank.find(s => s.id === skillId);
                      return (
                        <span key={skillId} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded border border-blue-800 flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          {skill?.name || skillId}
                          <button
                            onClick={() => setLinkedSkills(prev => prev.filter(id => id !== skillId))}
                            className="ml-2 text-blue-500 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSkill(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                  >
                    <option value="">+ Add Skill</option>
                    {skillBank.filter(s => !linkedSkills.includes(s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Item preview (always visible) */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-6 rounded border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              ITEM PREVIEW
            </h3>

            <div className="space-y-4">
              <div className={`text-2xl font-bold text-${rarityColor}-400`}>
                {name || '[Unnamed Item]'}
              </div>

              <div className="text-sm text-slate-400">
                {description || 'No description provided.'}
              </div>

              {lore && (
                <div className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3">
                  {lore}
                </div>
              )}

              {/* Stats display */}
              {Object.keys(stats).length > 0 && (
                <div className="bg-slate-900/50 p-3 rounded">
                  <div className="text-xs text-green-500 font-bold mb-2">STAT MODIFIERS:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(stats).map(([key, value]) => {
                      try {
                        // Normalize value to array of modifier objects
                        let modifiers = [];
                        if (value === undefined || value === null) {
                          modifiers = [];
                        } else if (Array.isArray(value)) {
                          modifiers = value.map(ex => {
                            if (ex === null || ex === undefined) return { type: 'flat', value: 0 };
                            return typeof ex === 'object' ? ex : { type: 'flat', value: Number(ex) || 0 };
                          }).filter(Boolean);
                        } else if (typeof value === 'number') {
                          modifiers = [{ type: 'flat', value: value }];
                        } else if (typeof value === 'object') {
                          modifiers = [value];
                        } else {
                          // Fallback for any other type
                          modifiers = [{ type: 'flat', value: Number(value) || 0 }];
                        }
                        
                        return modifiers.map((mod, idx) => {
                          const displayValue = typeof mod === 'object' && mod !== null ? (Number(mod.value) || 0) : (Number(mod) || 0);
                          const modType = typeof mod === 'object' && mod !== null ? (mod.type || 'flat') : 'flat';
                          return (
                            <div key={`${key}-${idx}`} className={`flex justify-between items-center px-2 py-1 rounded ${
                              displayValue < 0 ? 'bg-red-900/20' : 'bg-green-900/20'
                            }`}>
                              <span className={`text-xs font-mono ${
                                displayValue < 0 ? 'text-red-400' : 'text-green-400'
                              }`}>{key}</span>
                              <span className={`text-xs font-bold ${
                                displayValue < 0 ? 'text-red-300' : 'text-green-300'
                              }`}>
                                {displayValue > 0 ? `+${displayValue}` : displayValue}
                                {modType && modType !== 'flat' && (
                                  <span className="text-green-500 ml-1">({modType})</span>
                                )}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    removeStat(key, idx);
                                  } catch (err) {
                                    console.error('Error removing stat:', err);
                                  }
                                }}
                                className="text-red-500 hover:text-red-400 ml-2"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        });
                      } catch (err) {
                        console.error('Error rendering stat:', key, value, err);
                        return (
                          <div key={key} className="bg-red-900/20 border border-red-800 p-2 rounded text-xs text-red-400">
                            Error rendering {key}: {err.message}
                          </div>
                        );
                      }
                    }).flat()}
                  </div>

                  {/* Add stat manually */}
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
                      <button
                        onClick={() => setStatIsNegative(!statIsNegative)}
                        className={`text-xs px-3 py-1 rounded font-bold ${
                          statIsNegative 
                            ? 'bg-red-600 hover:bg-red-500 text-white' 
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        }`}
                        title={statIsNegative ? 'Click for positive' : 'Click for negative'}
                      >
                        {statIsNegative ? '−' : '+'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={Math.abs(statValue)}
                        onChange={(e) => setStatValue(Math.abs(parseInt(e.target.value) || 0))}
                        className="w-20 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                        placeholder="Value"
                      />
                      <select
                        value={statModifierType}
                        onChange={(e) => setStatModifierType(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                      >
                        <option value="flat">Flat</option>
                        <option value="percentage">Percentage</option>
                        <option value="perLevel">Per Level</option>
                        <option value="conditional">Conditional</option>
                      </select>
                      <button
                        onClick={addStat}
                        className={`text-xs px-3 rounded font-bold ${
                          statIsNegative
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        }`}
                      >
                        {statIsNegative ? 'ADD −' : 'ADD +'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Granted skills (read-only preview) */}
              {linkedSkills.length > 0 && (
                <div className="bg-slate-900/50 p-3 rounded">
                  <div className="text-xs text-blue-500 font-bold mb-2">GRANTS SKILLS:</div>
                  <div className="flex flex-wrap gap-2">
                    {linkedSkills.map(skillId => {
                      const skill = skillBank.find(s => s.id === skillId);
                      return (
                        <span key={skillId} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded border border-blue-800 flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          {skill?.name || skillId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quest text */}
              {questText && (
                <div className="bg-purple-900/20 p-3 rounded border border-purple-800">
                  <div className="text-xs text-purple-400 font-bold mb-1">QUEST/EVOLUTION:</div>
                  <div className="text-xs text-purple-300">{questText}</div>
                </div>
              )}

              {/* Debuffs */}
              {debuffs && (
                <div className="bg-red-900/20 p-3 rounded border border-red-800">
                  <div className="text-xs text-red-400 font-bold mb-1">CURSE/DEBUFF:</div>
                  <div className="text-xs text-red-300">{debuffs}</div>
                </div>
              )}

              {/* Upgrade History */}
              {initialItem && initialItem.id && upgradeHistory.length > 0 && (
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

              {/* Quest and debuff editors (if in manual mode) */}
              {mode === 'manual' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-xs text-purple-400 font-bold block mb-1">QUEST/EVOLUTION</label>
                    <textarea
                      value={questText}
                      onChange={(e) => setQuestText(e.target.value)}
                      placeholder="e.g., Kill 50 goblins to unlock..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-red-400 font-bold block mb-1">CURSE/DEBUFF</label>
                    <textarea
                      value={debuffs}
                      onChange={(e) => setDebuffs(e.target.value)}
                      placeholder="e.g., -5 INT while equipped..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Item Sockets */}
              <div className="bg-blue-900/20 p-4 rounded border border-blue-800">
                <div className="text-xs text-blue-500 font-bold mb-3">ITEM SOCKETS</div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-blue-400">Max Sockets:</label>
                    <input
                      type="number"
                      value={maxSockets}
                      onChange={(e) => setMaxSockets(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                      max="6"
                      className="w-20 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    />
                    <select
                      value={socketType}
                      onChange={(e) => setSocketType(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    >
                      <option value="gem">Gem</option>
                      <option value="rune">Rune</option>
                      <option value="jewel">Jewel</option>
                    </select>
                  </div>
                  {socketedItems.length > 0 && (
                    <div className="space-y-1">
                      {socketedItems.map((socket, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded text-xs">
                          <span className="text-blue-300">Socket {idx + 1}: {socket.type}</span>
                          <button
                            onClick={() => removeSocketedItem(idx)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Affixes */}
              <div className="bg-yellow-900/20 p-4 rounded border border-yellow-800">
                <div className="text-xs text-yellow-500 font-bold mb-3">AFFIXES</div>
                {affixes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {affixes.map((affix, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                        <div>
                          <div className="text-xs text-yellow-300 font-bold">
                            [{affix.type.toUpperCase()}] {affix.name} (Tier {affix.tier})
                          </div>
                          {Object.keys(affix.stats).length > 0 && (
                            <div className="text-xs text-yellow-400">
                              {Object.entries(affix.stats).map(([key, val]) => `${key}: +${val}`).join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeAffix(idx)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={selectedAffixType}
                      onChange={(e) => setSelectedAffixType(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    >
                      <option value="prefix">Prefix</option>
                      <option value="suffix">Suffix</option>
                    </select>
                    <select
                      value={selectedAffixTier}
                      onChange={(e) => setSelectedAffixTier(parseInt(e.target.value))}
                      className="bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    >
                      <option value={1}>Tier 1</option>
                      <option value={2}>Tier 2</option>
                      <option value={3}>Tier 3</option>
                      <option value={4}>Tier 4</option>
                      <option value={5}>Tier 5</option>
                    </select>
                    <input
                      type="text"
                      value={affixName}
                      onChange={(e) => setAffixName(e.target.value)}
                      placeholder="Affix name"
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs p-1 rounded text-white"
                    />
                    <button
                      onClick={addAffix}
                      disabled={!affixName}
                      className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 rounded font-bold disabled:opacity-50"
                    >
                      ADD
                    </button>
                  </div>
                  <div className="text-xs text-yellow-400">
                    Preview: {getItemNameWithAffixes()}
                  </div>
                </div>
              </div>

              {/* Class Restrictions */}
              <div className="bg-red-900/20 p-4 rounded border border-red-800">
                <div className="text-xs text-red-500 font-bold mb-2">CLASS RESTRICTIONS (Leave empty for all classes)</div>
                <div className="flex flex-wrap gap-2">
                  {['Knight', 'Mage', 'Rogue', 'Paladin', 'Necromancer', 'Barbarian', 'Druid', 'Assassin'].map(className => (
                    <button
                      key={className}
                      onClick={() => toggleItemClassRestriction(className)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        itemClassRestrictions.includes(className)
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {className}
                    </button>
                  ))}
                </div>
                {itemClassRestrictions.length > 0 && (
                  <div className="mt-2 text-xs text-red-300">
                    Restricted to: {itemClassRestrictions.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
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
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            SAVE TO ITEM VAULT
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiabloItemGenerator;
