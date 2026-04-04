/**
 * Enhanced Item Vault Component
 * Main component for the Item Vault tab with appearance tracking, rarity system, and detailed views
 */

import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, BookOpen, Sparkles, Filter, Star, Zap, Shield, Sword, X, Grid, List, Plus } from 'lucide-react';
import db from '../services/database';
import { getRarityStyles, getCardContainerStyles, getHoverEffects, getTextGradient, getBadgeStyles } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';
import ItemOwnershipTimeline from './ItemOwnershipTimeline';
import ItemStoryContext from './ItemStoryContext';
import ItemAISuggestionsPanel from './ItemAISuggestionsPanel';
import ItemSkillAssociations from './ItemSkillAssociations';
import ItemQuestContext from './ItemQuestContext';
import ItemGamification from './ItemGamification';

const EnhancedItemVault = ({ items, books, onItemSelect, onCreateNew }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline' | 'chapters'
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterRarity, setFilterRarity] = useState('all');
  const [itemAppearances, setItemAppearances] = useState({});

  useEffect(() => {
    loadItemAppearances();
  }, [items, books]);

  /**
   * Load item appearances from timeline events
   */
  const loadItemAppearances = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const appearances = {};

      items.forEach(item => {
        const itemEvents = allEvents.filter(evt => 
          evt.type === 'item_event' &&
          (evt.title?.toLowerCase().includes(item.name.toLowerCase()) ||
           evt.description?.toLowerCase().includes(item.name.toLowerCase()) ||
           evt.items?.includes(item.name))
        );

        appearances[item.id] = itemEvents.map(evt => ({
          bookId: evt.bookId,
          chapterId: evt.chapterId,
          timestamp: evt.timestamp || Date.now(),
          event: evt
        }));
      });

      setItemAppearances(appearances);
    } catch (error) {
      console.error('Error loading item appearances:', error);
    }
  };

  /**
   * Get chapter info
   */
  const getChapterInfo = (bookId, chapterId) => {
    if (!books || !books[bookId]) return null;
    const book = books[bookId];
    const chapter = book.chapters?.find(ch => ch.id === chapterId);
    return chapter ? { book, chapter } : null;
  };


  /**
   * Filter items
   */
  const filteredItems = items.filter(item => {
    if (filterRarity !== 'all' && item.rarity !== filterRarity) return false;
    return true;
  });

  /**
   * Grid View - Diablo/WoW-style item cards
   */
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredItems.map((item, idx) => {
          const rarity = item.rarity || 'Common';
          const rarityStyles = getRarityStyles(rarity);
          const cardStyles = getCardContainerStyles(rarity, 'item');
          const appearances = itemAppearances[item.id] || [];

          return (
            <div
              key={item.id}
              className={`${cardStyles} ${rarityStyles.glow} cursor-pointer relative overflow-hidden animate-scale-in group`}
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => setSelectedItem(item)}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 ${rarityStyles.bgGradient} opacity-50 pointer-events-none`} />
              
              {/* Glassmorphism background */}
              <div className={`absolute inset-0 ${rarityStyles.glass} pointer-events-none`} />
              
              {/* Ornate border decorative elements */}
              <div className="ornate-border-corner" style={{ borderColor: rarityStyles.border.replace('border-', '') }} />
              
              {/* Shimmer effect for legendary+ */}
              {(rarity === 'Legendary' || rarity === 'Mythic') && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
              )}
              
              <div className="relative z-10 p-4">
                {/* Item Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-bold text-white mb-1 text-shadow-soft truncate ${getTextGradient(rarity === 'Mythic' ? 'orange' : rarity === 'Legendary' ? 'orange' : rarity === 'Epic' ? 'purple' : 'blue')}`}>
                      {item.name}
                    </div>
                    {item.type && (
                      <div className="text-xs text-slate-300 uppercase tracking-wider opacity-80">
                        {item.type}
                      </div>
                    )}
                  </div>
                  {item.rarity && (
                    <div className={getBadgeStyles('pill', rarity === 'Mythic' ? 'red' : rarity === 'Legendary' ? 'orange' : rarity === 'Epic' ? 'purple' : rarity === 'Rare' ? 'blue' : 'slate')}>
                      {item.rarity}
                    </div>
                  )}
                </div>

                {/* Item Description */}
                {item.desc && (
                  <div className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed opacity-90">
                    {item.desc}
                  </div>
                )}

                {/* Item Stats Preview */}
                {item.stats && Object.keys(item.stats).length > 0 && (
                  <div className="mb-3 space-y-1">
                    {Object.entries(item.stats).slice(0, 2).map(([stat, val]) => (
                      <div key={stat} className="text-xs text-green-400 flex items-center justify-between">
                        <span className="capitalize">{stat}:</span>
                        <span className="font-bold">+{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Appearances Badge */}
                {appearances.length > 0 && (
                  <div className={`flex items-center gap-1.5 ${getBadgeStyles('pill', 'slate')} mt-3`}>
                    <BookOpen className="w-3 h-3" />
                    <span className="text-xs">{appearances.length} appearance{appearances.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Hover effect indicator */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className={`w-4 h-4 ${rarityStyles.textAccent}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Timeline View
   */
  const renderTimelineView = () => {
    if (!selectedItem) {
      return (
        <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
          <p className="text-sm font-semibold">Select an item to view timeline</p>
          <p className="text-xs text-slate-500 mt-1">Click on any item card above to see its history</p>
        </div>
      );
    }

    return (
      <div className="glass-medium rounded-lg p-5 border border-slate-700/50">
        <ItemOwnershipTimeline item={selectedItem} books={books} />
      </div>
    );
  };

  /**
   * Chapters View
   */
  const renderChaptersView = () => {
    const allAppearances = [];
    items.forEach(item => {
      const appearances = itemAppearances[item.id] || [];
      appearances.forEach(app => {
        allAppearances.push({ ...app, item });
      });
    });

    allAppearances.sort((a, b) => a.timestamp - b.timestamp);

    return (
      <div className="space-y-3">
        {allAppearances.map((app, idx) => {
          const chapterInfo = getChapterInfo(app.bookId, app.chapterId);
          return (
            <div key={idx} className="bg-slate-900 rounded p-3 border border-slate-700">
              <div className="text-sm font-bold text-white">{app.item.name}</div>
              {chapterInfo && (
                <div className="text-xs text-slate-400">
                  {chapterInfo.book.title} • Chapter {chapterInfo.chapter.number}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Modern RPG style */}
      <div className="flex items-center justify-between glass-medium rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold text-white text-shadow-soft ${getTextGradient('blue')}`}>
              ITEM VAULT
            </h2>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              {filteredItems.length} Items
            </div>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className={`glass-medium border-2 border-green-500/50 px-5 py-2.5 rounded-lg text-white font-semibold ${getHoverEffects('medium')} bg-green-600/20 hover:bg-green-600/30 hover:border-green-400`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create New Item
        </button>
      </div>

      {/* Filters and View Mode - Modern UI */}
      <div className="flex items-center gap-4 glass-medium rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            className="glass-light border border-slate-700/50 text-white p-2 rounded-lg text-sm font-semibold cursor-pointer hover:border-blue-500/50 transition-colors"
          >
            <option value="all">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
            <option value="Mythic">Mythic</option>
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-lg text-sm ${getHoverEffects('light')} ${
              viewMode === 'grid'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-2.5 rounded-lg text-sm ${getHoverEffects('light')} ${
              viewMode === 'timeline'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('chapters')}
            className={`p-2.5 rounded-lg text-sm ${getHoverEffects('light')} ${
              viewMode === 'chapters'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === 'chapters' && renderChaptersView()}

      {/* Item Details Panel */}
      {selectedItem && (
        <div className="mt-6 p-4 bg-slate-900 rounded border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{selectedItem.name}</h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Story Context */}
              <div className="glass-medium rounded-lg p-4 border border-slate-700/50">
                <ItemStoryContext item={selectedItem} books={books} />
              </div>

              {/* Ownership Timeline */}
              <div className="glass-medium rounded-lg p-4 border border-slate-700/50">
                <ItemOwnershipTimeline item={selectedItem} books={books} />
              </div>

              {/* AI Suggestions */}
              <div className="glass-medium rounded-lg p-4 border border-slate-700/50">
                <ItemAISuggestionsPanel item={selectedItem} />
              </div>

              {/* Skill Associations */}
              <div className="glass-medium rounded-lg p-4 border border-slate-700/50">
                <ItemSkillAssociations item={selectedItem} skillBank={[]} />
              </div>

              {/* Quest Context */}
              <div className="glass-medium rounded-lg p-4 border border-slate-700/50">
                <ItemQuestContext item={selectedItem} books={books} />
              </div>

              {/* Gamification */}
              <div className="glass-medium rounded-lg p-4 border border-slate-700/50">
                <ItemGamification item={selectedItem} items={items} actors={[]} />
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedItemVault;
