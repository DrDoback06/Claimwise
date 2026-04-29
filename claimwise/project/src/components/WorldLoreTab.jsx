import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Flag, BookOpen, Plus, Edit3, Trash2, X, Save,
  ChevronDown, ChevronRight, Search, Filter, Eye
} from 'lucide-react';
import db from '../services/database';
import toastService from '../../services/toastService';

/**
 * World/Lore Tab — Unified view for world-building data
 * Merges: Wiki lore entries + Factions (per spec Section 6)
 *
 * Factions live under World/Lore — not a separate top-level tab.
 * "Dialogue voice signatures" are character facets, handled in character tab.
 */
const WorldLoreTab = ({ actors, books }) => {
  const [activeSubTab, setActiveSubTab] = useState('lore');
  const [factions, setFactions] = useState([]);
  const [wikiEntries, setWikiEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: '', description: '', members: '', goals: '' });

  const loadData = useCallback(async () => {
    try {
      const [f, w] = await Promise.all([
        db.getAll('factions'),
        db.getAll('wikiEntries')
      ]);
      setFactions(f || []);
      setWikiEntries((w || []).filter(e => e.entityType === 'lore' || e.entityType === 'world'));
    } catch (e) {
      console.warn('WorldLoreTab load error:', e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateFaction = async () => {
    const faction = {
      id: `fac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newItem.name,
      type: newItem.type || 'organization',
      description: newItem.description,
      members: newItem.members ? newItem.members.split(',').map(m => m.trim()) : [],
      goals: newItem.goals,
      status: 'active',
      chapterId: null,
      createdAt: Date.now()
    };
    await db.add('factions', faction);
    setShowCreateModal(false);
    setNewItem({ name: '', type: '', description: '', members: '', goals: '' });
    toastService.success(`Faction "${faction.name}" created`);
    loadData();
  };

  const handleCreateLore = async () => {
    const entry = {
      id: `lore_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityId: null,
      entityType: 'lore',
      title: newItem.name,
      category: newItem.type || 'general',
      content: newItem.description,
      updatedAt: Date.now()
    };
    await db.add('wikiEntries', entry);
    setShowCreateModal(false);
    setNewItem({ name: '', type: '', description: '', members: '', goals: '' });
    toastService.success(`Lore entry "${entry.title}" created`);
    loadData();
  };

  const handleDelete = async (id, store) => {
    if (!window.confirm('Delete this entry?')) return;
    await db.delete(store, id);
    toastService.success('Deleted');
    loadData();
  };

  const filteredFactions = factions.filter(f =>
    !searchQuery || f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredLore = wikiEntries.filter(e =>
    !searchQuery || (e.title || e.entityId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            World / Lore
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mb-3">
          {[
            { key: 'lore', label: 'Lore', icon: BookOpen, count: filteredLore.length },
            { key: 'factions', label: 'Factions', icon: Flag, count: filteredFactions.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeSubTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-slate-900 border border-slate-700 text-white text-xs pl-7 pr-3 py-1.5 rounded"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeSubTab === 'factions' && filteredFactions.map(faction => (
          <div key={faction.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800"
              onClick={() => toggleExpand(faction.id)}
            >
              <div className="flex items-center gap-2">
                {expandedIds.has(faction.id) ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                <Flag className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm text-white">{faction.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-orange-900/30 text-orange-400">{faction.type}</span>
                {faction.status && <span className="text-xs text-slate-500">{faction.status}</span>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(faction.id, 'factions'); }} className="text-slate-600 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {expandedIds.has(faction.id) && (
              <div className="p-3 pt-0 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-300">{faction.description}</p>
                {faction.members?.length > 0 && (
                  <div className="text-xs"><span className="text-slate-500">Members:</span> <span className="text-slate-300">{faction.members.join(', ')}</span></div>
                )}
                {faction.goals && (
                  <div className="text-xs"><span className="text-slate-500">Goals:</span> <span className="text-slate-300">{faction.goals}</span></div>
                )}
              </div>
            )}
          </div>
        ))}

        {activeSubTab === 'lore' && filteredLore.map(entry => (
          <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800"
              onClick={() => toggleExpand(entry.id)}
            >
              <div className="flex items-center gap-2">
                {expandedIds.has(entry.id) ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">{entry.title || entry.entityId}</span>
                {entry.category && <span className="text-xs px-2 py-0.5 rounded bg-purple-900/30 text-purple-400">{entry.category}</span>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id, 'wikiEntries'); }} className="text-slate-600 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {expandedIds.has(entry.id) && (
              <div className="p-3 pt-0 border-t border-slate-800">
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{entry.content}</p>
              </div>
            )}
          </div>
        ))}

        {((activeSubTab === 'factions' && filteredFactions.length === 0) ||
          (activeSubTab === 'lore' && filteredLore.length === 0)) && (
          <div className="text-center text-slate-500 py-12 text-xs">
            No {activeSubTab} entries yet. Click "New" to create one.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Create {activeSubTab === 'factions' ? 'Faction' : 'Lore Entry'}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded" />
              <input type="text" placeholder={activeSubTab === 'factions' ? 'Type (guild, kingdom, etc.)' : 'Category'} value={newItem.type}
                onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded" />
              <textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded h-20" />
              {activeSubTab === 'factions' && (
                <>
                  <input type="text" placeholder="Members (comma-separated)" value={newItem.members}
                    onChange={e => setNewItem(p => ({ ...p, members: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded" />
                  <input type="text" placeholder="Goals" value={newItem.goals}
                    onChange={e => setNewItem(p => ({ ...p, goals: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded" />
                </>
              )}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 bg-slate-700 text-white text-xs rounded">Cancel</button>
              <button
                onClick={activeSubTab === 'factions' ? handleCreateFaction : handleCreateLore}
                disabled={!newItem.name}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldLoreTab;
