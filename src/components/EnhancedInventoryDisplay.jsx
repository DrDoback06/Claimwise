/**
 * Enhanced Inventory Display
 * Grid view with visual effects and rarity indicators
 */

import React, { useState } from 'react';
import { Package, Zap, Shield, Sword, Star, TrendingUp, Grid, List } from 'lucide-react';
import { getCardContainerStyles, getRarityStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const EnhancedInventoryDisplay = ({ actor, items, books }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  /**
   * Get rarity color (legacy support for grid view)
   */
  const getRarityColor = (rarity) => {
    const styles = getRarityStyles(rarity);
    return `${styles.border} ${styles.bg}`;
  };

  /**
   * Get rarity glow (legacy support for grid view)
   */
  const getRarityGlow = (rarity) => {
    const styles = getRarityStyles(rarity);
    return styles.glow;
  };

  /**
   * Get item stats total
   */
  const getItemStatsTotal = (item) => {
    if (!item.stats) return 0;
    return Object.values(item.stats).reduce((sum, val) => sum + (val || 0), 0);
  };

  /**
   * Get equipped items
   */
  const getEquippedItems = () => {
    if (!actor.equipment) return [];
    const equipped = [];
    Object.entries(actor.equipment).forEach(([slot, itemId]) => {
      if (itemId) {
        const item = Array.isArray(itemId)
          ? items.find(i => i.id === itemId[0])
          : items.find(i => i.id === itemId);
        if (item) {
          equipped.push({ ...item, slot });
        }
      }
    });
    return equipped;
  };

  /**
   * Get inventory items
   */
  const getInventoryItems = () => {
    if (!actor.inventory) return [];
    return actor.inventory
      .map(id => items.find(i => i.id === id))
      .filter(Boolean);
  };

  const equippedItems = getEquippedItems();
  const inventoryItems = getInventoryItems();

  /**
   * Grid View
   */
  const renderGridView = () => {
    return (
      <div className="space-y-6">
        {/* Equipped Items */}
        {equippedItems.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 font-bold mb-3">EQUIPPED ITEMS</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {equippedItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${getRarityColor(item.rarity || 'Common')} ${getRarityGlow(item.rarity || 'Common')} hover:scale-105 transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-white truncate">{item.name}</div>
                    {item.rarity && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRarityColor(item.rarity).replace('border-', 'bg-').replace('-500', '-900/50')} ${getRarityColor(item.rarity).replace('border-', 'text-')}`}>
                        {item.rarity}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{item.type || 'Item'}</div>
                  {item.stats && Object.keys(item.stats).length > 0 && (
                    <div className="text-xs text-slate-300">
                      <div className="font-bold text-green-400">+{getItemStatsTotal(item)} Total Stats</div>
                      <div className="mt-1 space-y-0.5">
                        {Object.entries(item.stats).slice(0, 3).map(([stat, val]) => (
                          <div key={stat} className="text-[10px]">
                            {stat}: <span className="text-green-400">+{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-2">Slot: {item.slot}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Items */}
        {inventoryItems.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 font-bold mb-3">INVENTORY ({inventoryItems.length})</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {inventoryItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${getRarityColor(item.rarity || 'Common')} ${getRarityGlow(item.rarity || 'Common')} hover:scale-105 transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-white truncate">{item.name}</div>
                    {item.rarity && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRarityColor(item.rarity).replace('border-', 'bg-').replace('-500', '-900/50')} ${getRarityColor(item.rarity).replace('border-', 'text-')}`}>
                        {item.rarity}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{item.type || 'Item'}</div>
                  {item.stats && Object.keys(item.stats).length > 0 && (
                    <div className="text-xs text-slate-300">
                      <div className="font-bold text-green-400">+{getItemStatsTotal(item)} Total Stats</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {equippedItems.length === 0 && inventoryItems.length === 0 && (
          <div className="text-center text-slate-500 p-8">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items in inventory</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle - Modern UI */}
      <div className={`flex items-center justify-between ${getCardContainerStyles('Common', 'quest')} p-3`}>
        <div className="text-sm text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <span className="text-shadow-soft">Inventory Display</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-sm ${getHoverEffects('light')} ${
              viewMode === 'grid'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-sm ${getHoverEffects('light')} ${
              viewMode === 'list'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {[...equippedItems, ...inventoryItems].map((item, idx) => {
            const rarity = item.rarity || 'Common';
            const rarityStyles = getRarityStyles(rarity);
            return (
              <div
                key={item.id || `list-item-${idx}`}
                className={`${getCardContainerStyles(rarity, 'item')} p-4 ${getHoverEffects('medium')} animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${rarityStyles.bg} border-2 ${rarityStyles.border} flex items-center justify-center`}>
                      <Package className={`w-5 h-5 ${rarityStyles.textAccent}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-bold text-white ${getTextGradient(rarity === 'Mythic' ? 'orange' : rarity === 'Legendary' ? 'orange' : 'blue')}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-300 uppercase tracking-wider">
                        {item.type} • {rarity}
                      </div>
                    </div>
                  </div>
                  {item.stats && (
                    <div className={`text-lg font-bold ${getTextGradient('green')}`}>
                      +{getItemStatsTotal(item)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedInventoryDisplay;
