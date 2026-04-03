import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, X, Edit3, Save, Trash2, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import db from '../services/database';
import aiService from '../services/aiService';
import toastService from '../../services/toastService';

/**
 * Plot Thread Tracker - Track and manage multiple plot threads
 */
const PlotThreadTracker = ({ books, onClose }) => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showThreadEditor, setShowThreadEditor] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

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

  const createThread = () => {
    const newThread = {
      id: `thread_${Date.now()}`,
      name: 'New Plot Thread',
      description: '',
      status: 'active', // 'active' | 'paused' | 'resolved'
      chapters: [],
      dependencies: [],
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
        <div className="flex items-center gap-4">
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
            <h3 className="text-lg font-bold text-white mb-3">PLOT THREADS ({threads.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {threads.map(thread => (
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

              <div>
                <label className="text-xs text-slate-400 block mb-1">Status</label>
                <select
                  value={editingThread.status}
                  onChange={(e) => setEditingThread({ ...editingThread, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="resolved">Resolved</option>
                </select>
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

