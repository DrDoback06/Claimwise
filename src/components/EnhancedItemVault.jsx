/**
 * Enhanced Item Vault Component
 * Main component for the Item Vault tab with appearance tracking, rarity system, and detailed views
 */

import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, BookOpen, Sparkles, Filter, Star, Zap, Shield, Sword, X, Grid, List, Plus, Wand2, History, AlertCircle, Loader2 } from 'lucide-react';
import db from '../services/database';
import aiService from '../services/aiService';
import toastService from '../services/toastService';
import { getRarityStyles, getCardContainerStyles, getHoverEffects, getTextGradient, getBadgeStyles } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';
import ItemOwnershipTimeline from './ItemOwnershipTimeline';
import ItemStoryContext from './ItemStoryContext';
import ItemAISuggestionsPanel from './ItemAISuggestionsPanel';
import ItemSkillAssociations from './ItemSkillAssociations';
import ItemQuestContext from './ItemQuestContext';
import ItemGamification from './ItemGamification';

const EnhancedItemVault = ({ items, books, actors = [], onItemSelect, onCreateNew }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline' | 'chapters'
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterRarity, setFilterRarity] = useState('all');
  const [itemAppearances, setItemAppearances] = useState({});

  // ---- Enhancements ----
  const [aiLoreResults, setAiLoreResults] = useState({}); // { itemId: 'lore text' }
  const [generatingLore, setGeneratingLore] = useState(null); // itemId
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [provenanceItem, setProvenanceItem] = useState(null);
  const [provenanceForm, setProvenanceForm] = useState({ foundByActor: '', foundInChapter: '', grantedAt: '' });

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
    if (!books) return null;
    const booksArray = Array.isArray(books) ? books : Object.values(books);
    const book = booksArray.find(b => b.id === bookId);
    if (!book) return null;
    const chapter = book.chapters?.find(ch => ch.id === chapterId);
    return chapter ? { book, chapter } : null;
  };


  // ---- Enhancement: AI lore generator ----
  const generateItemLore = async (item) => {
    if (generatingLore === item.id || aiLoreResults[item.id]) return;
    setGeneratingLore(item.id);
    try {
      const system = 'You are a fantasy lore writer. Write a single evocative paragraph of backstory/lore for this item. Be specific, mysterious, and memorable. Under 100 words.';
      const prompt = `Item: "${item.name}" (${item.type || 'item'}, ${item.rarity || 'Common'})\nDescription: ${item.desc || ''}\nStats: ${JSON.stringify(item.stats || {})}`;
      const lore = await aiService.callAI(prompt, 'creative', system);
      if (lore) {
        setAiLoreResults(prev => ({ ...prev, [item.id]: lore.trim() }));
        // Persist to item
        await db.update('items', { ...item, lore: lore.trim() });
        toastService.success('Lore generated!');
      }
    } catch (e) {
      console.warn('Lore generation failed:', e);
      toastService.error('Lore generation failed');
    } finally {
      setGeneratingLore(null);
    }
  };

  // ---- Enhancement: Save provenance ----
  const saveProvenance = async () => {
    if (!provenanceItem) return;
    try {
      const updated = { ...provenanceItem, provenance: provenanceForm };
      await db.update('items', updated);
      toastService.success('Provenance saved');
      setShowProvenanceModal(false);
      setProvenanceItem(null);
    } catch (e) {
      toastService.error('Failed to save provenance');
    }
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

                {/* AI Lore snippet */}
                {(aiLoreResults[item.id] || item.lore) && (
                  <div className="mt-2 text-[10px] text-indigo-300 italic line-clamp-2 bg-indigo-950/30 rounded px-2 py-1 border border-indigo-900/40">
                    {aiLoreResults[item.id] || item.lore}
                  </div>
                )}

                {/* AI Lore + Provenance quick buttons */}
                <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); generateItemLore(item); }}
                    disabled={generatingLore === item.id}
                    className="text-[10px] bg-indigo-800/50 hover:bg-indigo-700/60 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    title="Generate AI lore for this item"
                  >
                    {generatingLore === item.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5" />}
                    Lore
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setProvenanceItem(item); setProvenanceForm(item.provenance || { foundByActor: '', foundInChapter: '', grantedAt: '' }); setShowProvenanceModal(true); }}
                    className="text-[10px] bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    title="Set item provenance (who found it, when)"
                  >
                    <History className="w-2.5 h-2.5" />
                    Provenance
                  </button>
                </div>

                {/* Provenance badge if set */}
                {item.provenance?.foundByActor && (
                  <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Found by {item.provenance.foundByActor}
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

      {/* Provenance Modal */}
      {showProvenanceModal && provenanceItem && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Provenance: {provenanceItem.name}
              </h3>
              <button onClick={() => setShowProvenanceModal(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Found / Granted by character</label>
                <select
                  value={provenanceForm.foundByActor}
                  onChange={e => setProvenanceForm(p => ({ ...p, foundByActor: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="">— Select character —</option>
                  {(Array.isArray(actors) ? actors : []).map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Chapter acquired</label>
                <input
                  type="text"
                  value={provenanceForm.foundInChapter}
                  onChange={e => setProvenanceForm(p => ({ ...p, foundInChapter: e.target.value }))}
                  placeholder="Chapter title or number..."
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes</label>
                <textarea
                  value={provenanceForm.grantedAt}
                  onChange={e => setProvenanceForm(p => ({ ...p, grantedAt: e.target.value }))}
                  placeholder="How was this item acquired..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm resize-none"
                />
              </div>
              <button onClick={saveProvenance} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">Save Provenance</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedItemVault;
