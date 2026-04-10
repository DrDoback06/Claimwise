import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, X, Edit3, Save, Trash2, CheckCircle, Clock, AlertCircle, Sparkles, AlertTriangle, Users, FileText, Flag, Download } from 'lucide-react';
import db from '../services/database';
import aiService from '../services/aiService';
import toastService from '../../services/toastService';

/**
 * Plot Thread Tracker - Track and manage multiple plot threads
 */
const PRIORITY_LABELS = [
  { value: 'main', label: 'Main Plot', color: 'bg-red-600', textColor: 'text-red-400', border: 'border-red-600' },
  { value: 'major', label: 'Major Subplot', color: 'bg-orange-600', textColor: 'text-orange-400', border: 'border-orange-600' },
  { value: 'minor', label: 'Minor Subplot', color: 'bg-slate-600', textColor: 'text-slate-400', border: 'border-slate-600' },
];

const PlotThreadTracker = ({ books, actors = [], onClose }) => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showThreadEditor, setShowThreadEditor] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // ---- Enhancements ----
  const [isDetectingDangling, setIsDetectingDangling] = useState(false);
  const [danglingResults, setDanglingResults] = useState([]);
  const [showDanglingPanel, setShowDanglingPanel] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const saved = await db.getAll('plotThreads');
      setThreads(saved.length > 0 ? saved : []);
    } catch (error) {
      console.error('Error loading plot threads:', error);
      setThreads([]);
    }
  };

  const saveThreads = async (threadsToSave = threads) => {
    try {
      for (const thread of threadsToSave) {
        await db.update('plotThreads', thread);
      }
    } catch (error) {
      console.error('Error saving plot threads:', error);
    }
  };

  // ---- Enhancement: detect dangling threads (opened but never resolved) ----
  const detectDanglingThreads = async () => {
    setIsDetectingDangling(true);
    try {
      const openThreads = threads.filter(t => t.status !== 'resolved');
      if (openThreads.length === 0) {
        toastService.info('No open threads to check.');
        setIsDetectingDangling(false);
        return;
      }
      const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
      const totalChapters = booksArray.flatMap(b => b.chapters || []).length;
      const dangling = openThreads.filter(t => {
        if (t.completion >= 80) return false;
        if (t.chapters.length === 0) return true;
        // If thread has chapters assigned but hasn't progressed in story
        return t.chapters.length < Math.max(1, Math.floor(totalChapters * 0.1));
      });
      setDanglingResults(dangling);
      setShowDanglingPanel(true);
      if (dangling.length === 0) toastService.success('No dangling threads detected!');
    } catch (e) {
      console.error('Dangling thread detection error:', e);
    } finally {
      setIsDetectingDangling(false);
    }
  };

  // ---- Enhancement: Export threads as plain text outline ----
  const exportThreads = () => {
    const lines = ['# Plot Thread Outline', ''];
    const byPriority = ['main', 'major', 'minor'];
    byPriority.forEach(p => {
      const group = threads.filter(t => (t.priority || 'minor') === p);
      if (group.length === 0) return;
      const label = PRIORITY_LABELS.find(l => l.value === p)?.label || p;
      lines.push(`## ${label}`);
      group.forEach(t => {
        lines.push(`### ${t.name} [${t.status}] — ${t.completion}%`);
        if (t.description) lines.push(t.description);
        if (t.notes) lines.push(`Notes: ${t.notes}`);
        if (t.driverCharacters?.length) lines.push(`Characters: ${t.driverCharacters.join(', ')}`);
        lines.push('');
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plot_threads.txt'; a.click();
    URL.revokeObjectURL(url);
    toastService.success('Exported plot threads');
  };

  const createThread = () => {
    const newThread = {
      id: `thread_${Date.now()}`,
      name: 'New Plot Thread',
      description: '',
      status: 'active', // 'active' | 'paused' | 'resolved'
      priority: 'minor', // 'main' | 'major' | 'minor'
      chapters: [],
      dependencies: [],
      driverCharacters: [], // character names
      notes: '',
      completion: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setEditingThread(newThread);
    setShowThreadEditor(true);
  };

  const saveThread = () => {
    if (!editingThread) return;
    const updated = editingThread.updatedAt ? Date.now() : editingThread.createdAt;
    const threadToSave = { ...editingThread, updatedAt: updated };
    
    setThreads(prev => {
      const existing = prev.findIndex(t => t.id === threadToSave.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = threadToSave;
        return updated;
      }
      return [...prev, threadToSave];
    });
    
    saveThreads([...threads, threadToSave]);
    setShowThreadEditor(false);
    setEditingThread(null);
    toastService.success('Plot thread saved');
  };

  const deleteThread = async (threadId) => {
    if (window.confirm('Delete this plot thread?')) {
      setThreads(prev => prev.filter(t => t.id !== threadId));
      try {
        await db.delete('plotThreads', threadId);
        toastService.info('Plot thread deleted');
      } catch (error) {
        console.error('Error deleting thread:', error);
        toastService.error('Failed to delete thread');
      }
    }
  };

  const assignChapter = (threadId, chapterId) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId && !t.chapters.includes(chapterId)) {
        return { ...t, chapters: [...t.chapters, chapterId], updatedAt: Date.now() };
      }
      return t;
    }));
    saveThreads();
  };

  const generateSuggestions = async (threadId) => {
    setIsGeneratingSuggestions(true);
    try {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;

      const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
      const chapters = booksArray.flatMap(book => book.chapters || []) || [];
      const context = chapters.filter(c => thread.chapters.includes(c.id))
        .map(c => `${c.title}: ${c.desc || ''}`).join('\n');

      const suggestion = await aiService.suggestRelevantChapters(
        thread.description,
        context,
        chapters.map(c => ({ id: c.id, title: c.title, desc: c.desc }))
      );

      toastService.success('Suggestions generated! Check thread details.');
    } catch (error) {
      toastService.error('Failed to generate suggestions: ' + error.message);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'paused': return 'bg-yellow-600';
      case 'resolved': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-purple-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <GitBranch className="mr-3 text-purple-500" />
            PLOT THREAD TRACKER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Track and manage multiple plot threads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={detectDanglingThreads}
            disabled={isDetectingDangling}
            className="px-3 py-2 bg-yellow-800/60 hover:bg-yellow-700/60 text-yellow-300 border border-yellow-700/50 font-bold rounded text-sm flex items-center gap-1.5"
            title="Detect dangling threads (opened but never resolved)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {isDetectingDangling ? 'Checking...' : 'Dangling'}
          </button>
          <button
            onClick={exportThreads}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded text-sm flex items-center gap-1.5"
            title="Export threads as text outline"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={createThread}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            NEW THREAD
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Thread List */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">PLOT THREADS ({threads.length})</h3>
            </div>
            <div className="flex gap-1 flex-wrap">
              {[{value:'all',label:'All'}, ...PRIORITY_LABELS].map(p => (
                <button
                  key={p.value}
                  onClick={() => setFilterPriority(p.value)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${filterPriority === p.value ? (p.border || 'border-purple-500') + ' bg-purple-900/30 text-white' : 'border-slate-700 text-slate-500 hover:text-white'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {showDanglingPanel && danglingResults.length > 0 && (
            <div className="mx-3 mt-3 p-3 bg-yellow-950/40 border border-yellow-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-yellow-300 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {danglingResults.length} Dangling Thread{danglingResults.length > 1 ? 's' : ''}</span>
                <button onClick={() => setShowDanglingPanel(false)} className="text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>
              </div>
              {danglingResults.map(t => <div key={t.id} className="text-xs text-yellow-200 py-0.5">· {t.name}</div>)}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {threads.filter(t => filterPriority === 'all' || (t.priority || 'minor') === filterPriority).map(thread => (
              <div
                key={thread.id}
                onClick={() => {
                  setSelectedThread(thread);
                  setEditingThread(thread);
                  setShowThreadEditor(true);
                }}
                className={`p-3 rounded cursor-pointer border ${
                  selectedThread?.id === thread.id
                    ? 'bg-purple-900/50 border-purple-500'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(thread.status)}`} />
                    <div className="text-sm font-bold text-white">{thread.name}</div>
                    {thread.priority && thread.priority !== 'minor' && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${PRIORITY_LABELS.find(p=>p.value===thread.priority)?.color || 'bg-slate-600'} text-white`}>
                        {PRIORITY_LABELS.find(p=>p.value===thread.priority)?.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-400 mb-2">{thread.description.substring(0, 60)}...</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{thread.chapters.length} chapters</span>
                  <span className="text-slate-500">{thread.completion}% complete</span>
                </div>
              </div>
            ))}
            {threads.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">
                No plot threads yet. Create one to get started!
              </div>
            )}
          </div>
        </div>

        {/* Thread Editor */}
        {showThreadEditor && editingThread && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">EDIT THREAD</h3>
              <button
                onClick={() => {
                  setShowThreadEditor(false);
                  setEditingThread(null);
                  setSelectedThread(null);
                }}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Thread Name</label>
                <input
                  type="text"
                  value={editingThread.name}
                  onChange={(e) => setEditingThread({ ...editingThread, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  value={editingThread.description}
                  onChange={(e) => setEditingThread({ ...editingThread, description: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <select
                    value={editingThread.status}
                    onChange={(e) => setEditingThread({ ...editingThread, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={editingThread.priority || 'minor'}
                    onChange={(e) => setEditingThread({ ...editingThread, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                  >
                    {PRIORITY_LABELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Driver Characters */}
              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Driver Characters</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(editingThread.driverCharacters || []).map(name => (
                    <span key={name} className="flex items-center gap-1 bg-indigo-900/50 border border-indigo-700/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                      {name}
                      <button onClick={() => setEditingThread(prev => ({ ...prev, driverCharacters: prev.driverCharacters.filter(n => n !== name) }))} className="text-indigo-400 hover:text-white"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const name = e.target.value;
                    if (!name) return;
                    setEditingThread(prev => ({
                      ...prev,
                      driverCharacters: [...new Set([...(prev.driverCharacters || []), name])]
                    }));
                    e.target.value = '';
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                >
                  <option value="">— Assign a character —</option>
                  {(Array.isArray(actors) ? actors : []).map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Thread Notes */}
              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Planning Notes</label>
                <textarea
                  value={editingThread.notes || ''}
                  onChange={(e) => setEditingThread({ ...editingThread, notes: e.target.value })}
                  rows={3}
                  placeholder="Outline, key beats, foreshadowing notes..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Completion: {editingThread.completion}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingThread.completion}
                  onChange={(e) => setEditingThread({ ...editingThread, completion: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-slate-400">Assigned Chapters</label>
                  <button
                    onClick={() => generateSuggestions(editingThread.id)}
                    disabled={isGeneratingSuggestions}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Suggest
                  </button>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(books) ? books : (books ? Object.values(books) : [])).flatMap(book => (book.chapters || []).map(chapter => ({
                    ...chapter,
                    bookTitle: book.title
                  }))).map(chapter => (
                    <label key={chapter.id} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingThread.chapters.includes(chapter.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingThread({
                              ...editingThread,
                              chapters: [...editingThread.chapters, chapter.id]
                            });
                          } else {
                            setEditingThread({
                              ...editingThread,
                              chapters: editingThread.chapters.filter(id => id !== chapter.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span>{chapter.bookTitle} - {chapter.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveThread}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  SAVE
                </button>
                <button
                  onClick={() => {
                    setShowThreadEditor(false);
                    setEditingThread(null);
                    setSelectedThread(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {!showThreadEditor && (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select or create a plot thread to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlotThreadTracker;

