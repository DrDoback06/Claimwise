import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, Shield, Sword, Crown, Shirt, Gem,
  Hand, Footprints, CircleDot, Star, Sparkles,
  X, ChevronDown, Search, Filter, ArrowUpDown,
  Plus, Trash2, Edit3, Save, Eye, EyeOff,
  ArrowRight, Check, AlertCircle, Zap
} from 'lucide-react';
import db from '../services/database';

/**
 * InventorySystem - Diablo/Dark Souls style inventory with paper doll and grid
 * Features: Equipment slots, item grid, drag-and-drop, rarity colors, tooltips
 */
const InventorySystem = ({ 
  actors = [],
  items = [],
  onEquipItem,
  onUnequipItem,
  onUpdateInventory,
  onClose 
}) => {
  const [selectedActor, setSelectedActor] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'rarity' | 'type'
  const [draggedItem, setDraggedItem] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareItems, setCompareItems] = useState([null, null]);

  // Equipment slot configuration
  const equipmentSlots = {
    head: { name: 'Head', icon: Crown, position: { top: '5%', left: '50%' }, accepts: ['helmet', 'hat', 'crown'] },
    amulet: { name: 'Amulet', icon: Gem, position: { top: '18%', left: '35%' }, accepts: ['amulet', 'necklace'] },
    cape: { name: 'Cape', icon: Shirt, position: { top: '18%', left: '65%' }, accepts: ['cape', 'cloak'] },
    mainHand: { name: 'Main Hand', icon: Sword, position: { top: '35%', left: '15%' }, accepts: ['sword', 'axe', 'mace', 'staff', 'wand', 'weapon'] },
    armor: { name: 'Armor', icon: Shield, position: { top: '35%', left: '50%' }, accepts: ['armor', 'robe', 'chest'] },
    offHand: { name: 'Off Hand', icon: Shield, position: { top: '35%', left: '85%' }, accepts: ['shield', 'tome', 'orb', 'offhand'] },
    gloves: { name: 'Gloves', icon: Hand, position: { top: '55%', left: '20%' }, accepts: ['gloves', 'gauntlets'] },
    belt: { name: 'Belt', icon: CircleDot, position: { top: '55%', left: '50%' }, accepts: ['belt', 'sash'] },
    ring1: { name: 'Ring', icon: CircleDot, position: { top: '55%', left: '80%' }, accepts: ['ring'] },
    boots: { name: 'Boots', icon: Footprints, position: { top: '75%', left: '50%' }, accepts: ['boots', 'shoes'] },
    ring2: { name: 'Ring', icon: CircleDot, position: { top: '75%', left: '35%' }, accepts: ['ring'] },
    charm1: { name: 'Charm', icon: Star, position: { top: '90%', left: '30%' }, accepts: ['charm', 'trinket'] },
    charm2: { name: 'Charm', icon: Star, position: { top: '90%', left: '45%' }, accepts: ['charm', 'trinket'] },
    charm3: { name: 'Charm', icon: Star, position: { top: '90%', left: '60%' }, accepts: ['charm', 'trinket'] },
    charm4: { name: 'Charm', icon: Star, position: { top: '90%', left: '75%' }, accepts: ['charm', 'trinket'] }
  };

  // Rarity configuration
  const rarityConfig = {
    common: { name: 'Common', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.1)', borderColor: '#4b5563' },
    uncommon: { name: 'Uncommon', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#16a34a' },
    rare: { name: 'Rare', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#2563eb' },
    epic: { name: 'Epic', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)', borderColor: '#9333ea' },
    legendary: { name: 'Legendary', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#d97706' },
    mythic: { name: 'Mythic', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#dc2626' }
  };

  // Item type icons
  const itemTypeIcons = {
    weapon: Sword,
    sword: Sword,
    armor: Shield,
    helmet: Crown,
    boots: Footprints,
    gloves: Hand,
    ring: CircleDot,
    amulet: Gem,
    charm: Star,
    trinket: Sparkles,
    default: Package
  };

  // Get actor's equipped items
  const getEquippedItems = useCallback(() => {
    if (!selectedActor) return {};
    const equipped = {};
    
    Object.keys(equipmentSlots).forEach(slotKey => {
      const equippedItemId = selectedActor.equippedItems?.[slotKey];
      if (equippedItemId) {
        equipped[slotKey] = items.find(item => item.id === equippedItemId);
      }
    });
    
    return equipped;
  }, [selectedActor, items]);

  // Get actor's inventory items (not equipped)
  const getInventoryItems = useCallback(() => {
    if (!selectedActor) return [];
    
    const equippedIds = Object.values(selectedActor.equippedItems || {}).filter(Boolean);
    const inventoryIds = selectedActor.inventory || [];
    
    return inventoryIds
      .map(id => items.find(item => item.id === id))
      .filter(item => item && !equippedIds.includes(item.id));
  }, [selectedActor, items]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let filtered = getInventoryItems();
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply rarity filter
    if (filterRarity !== 'all') {
      filtered = filtered.filter(item => item.rarity === filterRarity);
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType || item.slot === filterType);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
          return rarityOrder.indexOf(b.rarity || 'common') - rarityOrder.indexOf(a.rarity || 'common');
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  }, [getInventoryItems, searchQuery, filterRarity, filterType, sortBy]);

  // Handle equip item
  const handleEquip = useCallback((item, slotKey) => {
    if (!selectedActor || !item) return;
    
    // Find appropriate slot if not specified
    if (!slotKey) {
      slotKey = Object.entries(equipmentSlots).find(([key, slot]) => {
        const currentlyEquipped = selectedActor.equippedItems?.[key];
        if (currentlyEquipped) return false; // Slot occupied
        return slot.accepts.some(type => 
          item.type?.toLowerCase().includes(type) || 
          item.slot?.toLowerCase().includes(type)
        );
      })?.[0];
    }
    
    if (!slotKey) {
      console.log('No available slot for this item');
      return;
    }
    
    onEquipItem?.(selectedActor.id, item.id, slotKey);
  }, [selectedActor, onEquipItem]);

  // Handle unequip item
  const handleUnequip = useCallback((slotKey) => {
    if (!selectedActor) return;
    onUnequipItem?.(selectedActor.id, slotKey);
  }, [selectedActor, onUnequipItem]);

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSlot = (e, slotKey) => {
    e.preventDefault();
    if (draggedItem) {
      handleEquip(draggedItem, slotKey);
    }
    setDraggedItem(null);
  };

  const handleDropOnInventory = (e) => {
    e.preventDefault();
    // If dragging from equipment slot, unequip it
    if (draggedItem && draggedItem._equippedSlot) {
      handleUnequip(draggedItem._equippedSlot);
    }
    setDraggedItem(null);
  };

  // Get rarity styling
  const getRarityStyle = (rarity) => {
    return rarityConfig[rarity] || rarityConfig.common;
  };

  // Get item icon
  const getItemIcon = (item) => {
    const IconComponent = itemTypeIcons[item.type?.toLowerCase()] || 
                         itemTypeIcons[item.slot?.toLowerCase()] || 
                         itemTypeIcons.default;
    return IconComponent;
  };

  // Calculate total equipped stats
  const calculateEquippedStats = useMemo(() => {
    if (!selectedActor) return {};
    
    const stats = {};
    const equipped = getEquippedItems();
    
    Object.values(equipped).forEach(item => {
      if (item?.stats) {
        Object.entries(item.stats).forEach(([stat, value]) => {
          stats[stat] = (stats[stat] || 0) + value;
        });
      }
    });
    
    return stats;
  }, [selectedActor, getEquippedItems]);

  // Render equipment slot
  const renderEquipmentSlot = (slotKey, slotConfig) => {
    const equipped = getEquippedItems();
    const equippedItem = equipped[slotKey];
    const IconComponent = slotConfig.icon;
    const isHovered = hoveredSlot === slotKey;
    const canDrop = draggedItem && slotConfig.accepts.some(type => 
      draggedItem.type?.toLowerCase().includes(type) || 
      draggedItem.slot?.toLowerCase().includes(type)
    );
    
    const rarityStyle = equippedItem ? getRarityStyle(equippedItem.rarity) : null;
    
    return (
      <div
        key={slotKey}
        className={`
          absolute w-14 h-14 rounded-lg border-2 transition-all cursor-pointer
          flex items-center justify-center
          ${equippedItem 
            ? `bg-gradient-to-br from-slate-800 to-slate-900`
            : 'bg-slate-800/50 border-dashed border-slate-600 hover:border-slate-500'
          }
          ${canDrop ? 'border-emerald-400 bg-emerald-400/10 scale-110' : ''}
          ${isHovered && !canDrop ? 'scale-105' : ''}
        `}
        style={{
          ...slotConfig.position,
          transform: `translate(-50%, -50%) ${isHovered || canDrop ? 'scale(1.1)' : 'scale(1)'}`,
          borderColor: equippedItem ? rarityStyle.borderColor : undefined,
          boxShadow: equippedItem ? `0 0 10px ${rarityStyle.color}30` : undefined
        }}
        onMouseEnter={() => {
          setHoveredSlot(slotKey);
          if (equippedItem) setHoveredItem(equippedItem);
        }}
        onMouseLeave={() => {
          setHoveredSlot(null);
          setHoveredItem(null);
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnSlot(e, slotKey)}
        onClick={() => {
          if (equippedItem) {
            handleUnequip(slotKey);
          }
        }}
      >
        {equippedItem ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {React.createElement(getItemIcon(equippedItem), {
              className: 'w-7 h-7',
              style: { color: rarityStyle.color }
            })}
            {/* Rarity indicator */}
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-900"
              style={{ backgroundColor: rarityStyle.color }}
            />
          </div>
        ) : (
          <IconComponent className="w-6 h-6 text-slate-600" />
        )}
        
        {/* Slot label */}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">
          {slotConfig.name}
        </span>
      </div>
    );
  };

  // Render inventory item
  const renderInventoryItem = (item, index) => {
    const rarityStyle = getRarityStyle(item.rarity);
    const IconComponent = getItemIcon(item);
    const isHovered = hoveredItem?.id === item.id;
    
    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onMouseEnter={() => setHoveredItem(item)}
        onMouseLeave={() => setHoveredItem(null)}
        onDoubleClick={() => handleEquip(item)}
        className={`
          w-14 h-14 rounded-lg border-2 cursor-grab active:cursor-grabbing
          flex items-center justify-center relative transition-all
          ${isHovered ? 'scale-110 z-10' : ''}
        `}
        style={{
          backgroundColor: rarityStyle.bgColor,
          borderColor: rarityStyle.borderColor,
          boxShadow: isHovered ? `0 0 15px ${rarityStyle.color}40` : undefined
        }}
      >
        <IconComponent 
          className="w-7 h-7"
          style={{ color: rarityStyle.color }}
        />
        
        {/* Rarity corner */}
        <div 
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900"
          style={{ backgroundColor: rarityStyle.color }}
        />
        
        {/* Stack count (if applicable) */}
        {item.stackCount && item.stackCount > 1 && (
          <span 
            className="absolute bottom-0.5 right-1 text-[10px] font-bold"
            style={{ color: rarityStyle.color }}
          >
            {item.stackCount}
          </span>
        )}
      </div>
    );
  };

  // Render item tooltip
  const renderItemTooltip = () => {
    if (!hoveredItem) return null;
    
    const rarityStyle = getRarityStyle(hoveredItem.rarity);
    
    return (
      <div 
        className="fixed z-50 pointer-events-none"
        style={{
          top: '50%',
          right: '330px',
          transform: 'translateY(-50%)'
        }}
      >
        <div 
          className="w-64 bg-slate-900/98 backdrop-blur-sm border-2 rounded-xl shadow-2xl overflow-hidden"
          style={{ borderColor: rarityStyle.borderColor }}
        >
          {/* Header */}
          <div 
            className="p-3 border-b"
            style={{ 
              borderColor: rarityStyle.borderColor,
              background: `linear-gradient(135deg, ${rarityStyle.color}20, transparent)`
            }}
          >
            <h3 
              className="font-bold text-lg"
              style={{ color: rarityStyle.color }}
            >
              {hoveredItem.name}
            </h3>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span style={{ color: rarityStyle.color }}>{rarityStyle.name}</span>
              {hoveredItem.type && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 capitalize">{hoveredItem.type}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Stats */}
          {hoveredItem.stats && Object.keys(hoveredItem.stats).length > 0 && (
            <div className="p-3 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stats</p>
              <div className="space-y-1">
                {Object.entries(hoveredItem.stats).map(([stat, value]) => (
                  <div key={stat} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{stat}</span>
                    <span className={value > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Description */}
          {hoveredItem.description && (
            <div className="p-3 border-b border-slate-800">
              <p className="text-sm text-slate-300 italic">
                "{hoveredItem.description}"
              </p>
            </div>
          )}
          
          {/* Effects */}
          {hoveredItem.effects && hoveredItem.effects.length > 0 && (
            <div className="p-3 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Effects</p>
              <div className="space-y-1">
                {hoveredItem.effects.map((effect, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-300">{effect}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions hint */}
          <div className="p-2 bg-slate-800/50 text-center">
            <span className="text-xs text-slate-500">
              Double-click to equip • Drag to slot
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-slate-900/90 border-b border-slate-700 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Inventory</h2>
                <p className="text-xs text-slate-400">
                  {filteredInventory.length} items
                </p>
              </div>
            </div>

            {/* Character selector */}
            <select
              value={selectedActor?.id || ''}
              onChange={(e) => {
                const actor = actors.find(a => a.id === e.target.value);
                setSelectedActor(actor || null);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 min-w-[200px]"
            >
              <option value="">Select Character...</option>
              {actors.map(actor => (
                <option key={actor.id} value={actor.id}>{actor.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {selectedActor ? (
          <>
            {/* Paper Doll (Left) */}
            <div className="w-80 flex-shrink-0 p-6 border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">{selectedActor.name}</h3>
                <p className="text-sm text-slate-400">{selectedActor.role || 'Character'}</p>
              </div>

              {/* Equipment Slots */}
              <div className="relative h-[450px] bg-slate-800/30 rounded-xl border border-slate-700">
                {/* Character silhouette background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <svg viewBox="0 0 100 200" className="h-full">
                    <ellipse cx="50" cy="25" rx="20" ry="25" fill="white" />
                    <rect x="30" y="45" width="40" height="60" rx="5" fill="white" />
                    <rect x="10" y="50" width="20" height="50" rx="5" fill="white" />
                    <rect x="70" y="50" width="20" height="50" rx="5" fill="white" />
                    <rect x="30" y="105" width="15" height="70" rx="5" fill="white" />
                    <rect x="55" y="105" width="15" height="70" rx="5" fill="white" />
                  </svg>
                </div>

                {/* Render all equipment slots */}
                {Object.entries(equipmentSlots).map(([key, config]) => 
                  renderEquipmentSlot(key, config)
                )}
              </div>

              {/* Equipped Stats Summary */}
              {Object.keys(calculateEquippedStats).length > 0 && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Equipment Bonuses</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(calculateEquippedStats).slice(0, 6).map(([stat, value]) => (
                      <div key={stat} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{stat}</span>
                        <span className="text-emerald-400">+{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Grid (Right) */}
            <div 
              className="flex-1 p-6 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={handleDropOnInventory}
            >
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg"
                  />
                </div>

                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="all">All Rarities</option>
                  {Object.entries(rarityConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rarity">Sort by Rarity</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>

              {/* Inventory Grid */}
              <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Backpack</h4>
                  <span className="text-xs text-slate-500">
                    {filteredInventory.length} items
                  </span>
                </div>

                {filteredInventory.length > 0 ? (
                  <div className="grid grid-cols-8 gap-2">
                    {filteredInventory.map((item, idx) => renderInventoryItem(item, idx))}
                    
                    {/* Empty slots to fill grid */}
                    {Array.from({ length: Math.max(0, 32 - filteredInventory.length) }).map((_, idx) => (
                      <div
                        key={`empty_${idx}`}
                        className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-800/20"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No items in inventory</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Items will appear here when added
                    </p>
                  </div>
                )}
              </div>

              {/* Rarity Legend */}
              <div className="mt-4 flex items-center justify-center gap-4">
                {Object.entries(rarityConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-slate-500">{config.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* No character selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">Select a Character</h3>
              <p className="text-slate-500 max-w-md">
                Choose a character from the dropdown above to view and manage their equipment and inventory.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Item Tooltip */}
      {renderItemTooltip()}
    </div>
  );
};

export default InventorySystem;
