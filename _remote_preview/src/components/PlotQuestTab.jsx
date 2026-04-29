import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Target, Plus, Edit3, Trash2, X, ChevronDown,
  ChevronRight, Search, CheckSquare, Square, ArrowRight
} from 'lucide-react';
import db from '../services/database';
import toastService from '../services/toastService';

/**
 * Plot + Quest Tab — Unified plot management
 * Per spec Section 6: Quests belong in Plot tab.
 * - Main/sub plots with state progression
 * - Quest checklist-style tracking
 * - Thread completion visualization
 */
const PlotQuestTab = ({ books }) => {
  const [activeSubTab, setActiveSubTab] = useState('plots');
  const [plotThreads, setPlotThreads] = useState([]);
  const [quests, setQuests] = useState([]);
  const [plotBeats, setPlotBeats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', type: 'main', objectives: '' });

  const loadData = useCallback(async () => {
    try {
      const [pt, q, pb] = await Promise.all([
        db.getAll('plotThreads'),
        db.getAll('plotQuests'),
        db.getAll('plotBeats')
      ]);
      setPlotThreads(pt || []);
      setQuests(q || []);
      setPlotBeats(pb || []);
    } catch (e) {
      console.warn('PlotQuestTab load error:', e);
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

  const handleCreate = async () => {
    if (activeSubTab === 'quests') {
      const quest = {
        id: `pq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        plotThreadId: null,
        title: newItem.title,
        description: newItem.description,
        type: newItem.type || 'sub',
        status: 'active',
        objectives: newItem.objectives ? newItem.objectives.split('\n').map((o, i) => ({
          id: `obj_${i}`, text: o.trim(), completed: false
        })).filter(o => o.text) : [],
        chapterId: null,
        createdAt: Date.now()
      };
      await db.add('plotQuests', quest);
      toastService.success(`Quest "${quest.title}" created`);
    } else {
      const thread = {
        id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: newItem.title,
        description: newItem.description,
        status: 'active',
        completion: 0,
        type: newItem.type || 'main',
        createdAt: Date.now()
      };
      await db.add('plotThreads', thread);
      toastService.success(`Plot thread "${thread.title}" created`);
    }
    setShowCreateModal(false);
    setNewItem({ title: '', description: '', type: 'main', objectives: '' });
    loadData();
  };

  const toggleObjective = async (questId, objId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    const updated = {
      ...quest,
      objectives: quest.objectives.map(o =>
        o.id === objId ? { ...o, completed: !o.completed } : o
      )
    };
    const allDone = updated.objectives.every(o => o.completed);
    updated.status = allDone ? 'completed' : 'active';
    await db.update('plotQuests', updated);
    loadData();
  };

  const updateThreadStatus = async (threadId, status) => {
    const thread = plotThreads.find(t => t.id === threadId);
    if (!thread) return;
    const completion = status === 'completed' ? 100 : status === 'active' ? thread.completion : 0;
    await db.update('plotThreads', { ...thread, status, completion });
    loadData();
  };

  const handleDelete = async (id, store) => {
    if (!window.confirm('Delete this entry?')) return;
    await db.delete(store, id);
    loadData();
  };

  const filtered = (activeSubTab === 'quests' ? quests : plotThreads).filter(item =>
    !searchQuery || (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    active: 'bg-blue-900/30 text-blue-400',
    completed: 'bg-green-900/30 text-green-400',
    failed: 'bg-red-900/30 text-red-400',
    abandoned: 'bg-slate-800 text-slate-500',
    setup: 'bg-purple-900/30 text-purple-400',
    development: 'bg-blue-900/30 text-blue-400',
    climax: 'bg-yellow-900/30 text-yellow-400',
    resolution: 'bg-green-900/30 text-green-400'
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-400" />
            Plot & Quests
          </h2>
          <button onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          {[
            { key: 'plots', label: 'Plot Threads', count: plotThreads.length },
            { key: 'quests', label: 'Quests', count: quests.length },
            { key: 'beats', label: 'Beats', count: plotBeats.length }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveSubTab(tab.key)}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeSubTab === tab.key ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..." className="w-full bg-slate-900 border border-slate-700 text-white text-xs pl-7 pr-3 py-1.5 rounded" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeSubTab === 'plots' && filtered.map(thread => (
          <div key={thread.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800" onClick={() => toggleExpand(thread.id)}>
              <div className="flex items-center gap-2">
                {expandedIds.has(thread.id) ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                <span className="font-bold text-sm text-white">{thread.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[thread.status] || 'bg-slate-800 text-slate-400'}`}>{thread.status}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">{thread.type || 'main'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${thread.completion || 0}%` }} />
                </div>
                <span className="text-xs text-slate-500">{thread.completion || 0}%</span>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(thread.id, 'plotThreads'); }} className="text-slate-600 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {expandedIds.has(thread.id) && (
              <div className="p-3 pt-0 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-300">{thread.description}</p>
                <div className="flex gap-1">
                  {['active', 'development', 'climax', 'resolution', 'completed'].map(st => (
                    <button key={st} onClick={() => updateThreadStatus(thread.id, st)}
                      className={`px-2 py-0.5 rounded text-[10px] ${thread.status === st ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                      {st}
                    </button>
                  ))}
                </div>
                {/* Related quests */}
                {quests.filter(q => q.plotThreadId === thread.id).length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] text-slate-500 font-bold mb-1">LINKED QUESTS</div>
                    {quests.filter(q => q.plotThreadId === thread.id).map(q => (
                      <div key={q.id} className="text-xs text-slate-300 flex items-center gap-1">
                        <Target className="w-3 h-3 text-yellow-400" /> {q.title}
                        <span className={`text-[10px] px-1 rounded ${statusColors[q.status] || ''}`}>{q.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {activeSubTab === 'quests' && filtered.map(quest => (
          <div key={quest.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800" onClick={() => toggleExpand(quest.id)}>
              <div className="flex items-center gap-2">
                {expandedIds.has(quest.id) ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                <Target className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-sm text-white">{quest.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${quest.type === 'main' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-slate-800 text-slate-400'}`}>{quest.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[quest.status] || ''}`}>{quest.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {quest.objectives?.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {quest.objectives.filter(o => o.completed).length}/{quest.objectives.length}
                  </span>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(quest.id, 'plotQuests'); }} className="text-slate-600 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {expandedIds.has(quest.id) && (
              <div className="p-3 pt-0 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-300">{quest.description}</p>
                {quest.objectives?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold">OBJECTIVES</div>
                    {quest.objectives.map(obj => (
                      <button key={obj.id} onClick={() => toggleObjective(quest.id, obj.id)}
                        className="flex items-center gap-2 w-full text-left p-1 hover:bg-slate-800 rounded">
                        {obj.completed ? <CheckSquare className="w-3 h-3 text-green-400 flex-shrink-0" /> : <Square className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                        <span className={`text-xs ${obj.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{obj.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {activeSubTab === 'beats' && plotBeats.sort((a, b) => (a.order || 0) - (b.order || 0)).map(beat => (
          <div key={beat.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${beat.completed ? 'bg-green-600' : 'bg-slate-700'}`}>
              {beat.completed ? <CheckSquare className="w-3 h-3 text-white" /> : <span className="text-xs text-slate-400">{beat.order || '?'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-bold">{beat.beat}</div>
              {beat.purpose && <div className="text-xs text-slate-400">{beat.purpose}</div>}
              {beat.chapter && <div className="text-[10px] text-slate-500">Ch. {beat.chapter}</div>}
            </div>
          </div>
        ))}

        {filtered.length === 0 && activeSubTab !== 'beats' && (
          <div className="text-center text-slate-500 py-12 text-xs">
            No {activeSubTab} yet. Click "New" to create one.
          </div>
        )}
        {activeSubTab === 'beats' && plotBeats.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-xs">
            No plot beats yet. They are extracted during Save & Extract.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Create {activeSubTab === 'quests' ? 'Quest' : 'Plot Thread'}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded" />
              <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded">
                <option value="main">Main</option>
                <option value="sub">Sub</option>
              </select>
              <textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded h-20" />
              {activeSubTab === 'quests' && (
                <textarea placeholder="Objectives (one per line)" value={newItem.objectives} onChange={e => setNewItem(p => ({ ...p, objectives: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded h-16" />
              )}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 bg-slate-700 text-white text-xs rounded">Cancel</button>
              <button onClick={handleCreate} disabled={!newItem.title}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded disabled:opacity-50">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotQuestTab;
