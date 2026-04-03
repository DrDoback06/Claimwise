import React, { useState, useEffect } from 'react';
import { Users, Network, History, Edit3, Save, X, RefreshCw, Eye, Sparkles, TrendingUp } from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';

/**
 * Relationship Tracker - Track character relationships with AI summaries
 */
const RelationshipTracker = ({ actors, books, onClose }) => {
  const [relationships, setRelationships] = useState([]);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'graph' | 'timeline'
  const [filterActor, setFilterActor] = useState('all');

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      const rels = await db.getAll('relationships');
      setRelationships(rels);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const generateRelationshipSummary = async (actor1Id, actor2Id, bookId, chapterId) => {
    setIsGenerating(true);
    try {
      const actor1 = actors.find(a => a.id === actor1Id);
      const actor2 = actors.find(a => a.id === actor2Id);
      const book = books[bookId];
      const chapter = book?.chapters.find(c => c.id === chapterId);

      if (!actor1 || !actor2 || !chapter) {
        throw new Error('Missing data for relationship generation');
      }

      const events = extractEventsFromChapter(chapter, actor1Id, actor2Id);
      const summary = await aiService.generateRelationshipSummary(actor1, actor2, chapterId, events);

      const relationship = {
        id: `rel_${actor1Id}_${actor2Id}_${bookId}_${chapterId}`,
        actor1Id,
        actor2Id,
        bookId,
        chapterId,
        summary,
        relationshipType: 'complex', // AI could determine this
        events,
        confidence: 0.9,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.add('relationships', relationship);
      await loadRelationships();
      setSelectedRelationship(relationship);
    } catch (error) {
      alert(`Relationship Generation Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const extractEventsFromChapter = (chapter, actor1Id, actor2Id) => {
    const text = (chapter.script || chapter.desc || '').toLowerCase();
    const actor1 = actors.find(a => a.id === actor1Id);
    const actor2 = actors.find(a => a.id === actor2Id);
    
    const events = [];
    if (actor1 && actor2 && text.includes(actor1.name.toLowerCase()) && text.includes(actor2.name.toLowerCase())) {
      // Simple extraction - could be enhanced
      const sentences = text.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.includes(actor1.name.toLowerCase()) && sentence.includes(actor2.name.toLowerCase())) {
          events.push(sentence.trim());
        }
      });
    }
    return events.slice(0, 5); // Limit to 5 events
  };

  const autoGenerateForChapter = async (bookId, chapterId) => {
    const book = books[bookId];
    const chapter = book?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const text = (chapter.script || chapter.desc || '').toLowerCase();
    const involvedActors = actors.filter(a => text.includes(a.name.toLowerCase()));

    // Generate relationships for all pairs
    for (let i = 0; i < involvedActors.length; i++) {
      for (let j = i + 1; j < involvedActors.length; j++) {
        await generateRelationshipSummary(
          involvedActors[i].id,
          involvedActors[j].id,
          bookId,
          chapterId
        );
      }
    }
  };

  const updateRelationship = async (relId, updates) => {
    const rel = relationships.find(r => r.id === relId);
    if (!rel) return;

    const updated = {
      ...rel,
      ...updates,
      updatedAt: Date.now()
    };

    await db.update('relationships', updated);
    await loadRelationships();
    setSelectedRelationship(updated);
  };

  const filteredRelationships = relationships.filter(rel => {
    if (filterActor === 'all') return true;
    return rel.actor1Id === filterActor || rel.actor2Id === filterActor;
  });

  const getActorName = (actorId) => {
    return actors.find(a => a.id === actorId)?.name || actorId;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Network className="mr-3 text-green-500" />
            RELATIONSHIP TRACKER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Track character relationships with AI summaries</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900 flex flex-col overflow-y-auto">
          {/* Filters */}
          <div className="p-4 border-b border-slate-800">
            <div className="mb-3">
              <label className="text-xs text-slate-400 block mb-1">FILTER BY ACTOR</label>
              <select
                value={filterActor}
                onChange={(e) => setFilterActor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
              >
                <option value="all">All Actors</option>
                {actors.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-xs text-slate-400 block mb-1">VIEW MODE</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-bold ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  LIST
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-bold ${
                    viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  TIMELINE
                </button>
              </div>
            </div>
          </div>

          {/* Relationship List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredRelationships.map(rel => {
              const actor1 = actors.find(a => a.id === rel.actor1Id);
              const actor2 = actors.find(a => a.id === rel.actor2Id);
              
              return (
                <button
                  key={rel.id}
                  onClick={() => setSelectedRelationship(rel)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    selectedRelationship?.id === rel.id
                      ? 'bg-green-900/20 border-green-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-white font-bold text-sm">
                    {actor1?.name || rel.actor1Id} ↔ {actor2?.name || rel.actor2Id}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Book {rel.bookId}, Ch {rel.chapterId}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {rel.summary?.substring(0, 100)}...
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedRelationship ? (
            <>
              {/* Relationship Details */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <div className="text-2xl font-bold text-white mb-2">
                    {getActorName(selectedRelationship.actor1Id)} ↔ {getActorName(selectedRelationship.actor2Id)}
                  </div>
                  <div className="text-sm text-slate-400">
                    Book {selectedRelationship.bookId}, Chapter {selectedRelationship.chapterId}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 mb-4">
                  <div className="text-xs text-slate-400 font-bold mb-2">RELATIONSHIP SUMMARY</div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">
                    {selectedRelationship.summary}
                  </div>
                </div>

                {selectedRelationship.events && selectedRelationship.events.length > 0 && (
                  <div className="bg-slate-900 rounded-lg p-4 mb-4">
                    <div className="text-xs text-slate-400 font-bold mb-2">KEY EVENTS</div>
                    <ul className="space-y-2">
                      {selectedRelationship.events.map((event, i) => (
                        <li key={i} className="text-sm text-slate-300">• {event}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-xs text-slate-400 font-bold mb-2">METADATA</div>
                  <div className="text-sm text-slate-300 space-y-1">
                    <div>Type: {selectedRelationship.relationshipType}</div>
                    <div>Confidence: {(selectedRelationship.confidence * 100).toFixed(0)}%</div>
                    <div>Created: {new Date(selectedRelationship.createdAt).toLocaleDateString()}</div>
                    <div>Updated: {new Date(selectedRelationship.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Edit Panel */}
              <div className="bg-slate-900 border-t border-slate-800 p-4">
                <button
                  onClick={() => {
                    const newSummary = prompt('Edit relationship summary:', selectedRelationship.summary);
                    if (newSummary) {
                      updateRelationship(selectedRelationship.id, { summary: newSummary });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  EDIT SUMMARY
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a relationship to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipTracker;

