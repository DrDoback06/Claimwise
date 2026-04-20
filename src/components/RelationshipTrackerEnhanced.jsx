import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Network, History, Edit3, Save, X, RefreshCw, Eye, Sparkles, TrendingUp,
  Calendar, Heart, HeartOff, AlertTriangle, ArrowRight, ArrowLeft, Play, Pause,
  Minus, Plus, Gauge, Clock, Filter, Search
} from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';

/**
 * Enhanced Relationship Tracker with Timeline, Strength Meter, and Events Log
 */
const RelationshipTrackerEnhanced = ({ actors, books, onClose }) => {
  const [relationships, setRelationships] = useState([]);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'graph' | 'timeline'
  const [filterActor, setFilterActor] = useState('all');
  const [timelinePosition, setTimelinePosition] = useState(100); // 0-100 percentage
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null); // {actor1Id, actor2Id}

  useEffect(() => {
    loadRelationships();
  }, [actors, books]);

  const loadRelationships = async () => {
    try {
      // Load relationships from timelineEvents table (primary source)
      const allEvents = await db.getAll('timelineEvents');
      const relationshipEvents = allEvents.filter(event => event.type === 'relationship_change');
      
      // Also load from relationships table for backward compatibility
      const relsFromTable = await db.getAll('relationships') || [];
      
      // Process relationship events from timelineEvents
      const relsFromEvents = [];
      const relationshipMap = new Map(); // Track latest relationship per actor pair per chapter
      
      for (const event of relationshipEvents) {
        if (!event.actors || event.actors.length < 2) continue;
        if (!event.actorIds || event.actorIds.length < 2) continue;
        
        const actor1Id = event.actorIds[0];
        const actor2Id = event.actorIds[1];
        const actor1Name = event.actors[0];
        const actor2Name = event.actors[1];
        
        // Create relationship key
        const relKey = `${Math.min(actor1Id, actor2Id)}_${Math.max(actor1Id, actor2Id)}_${event.bookId}_${event.chapterId}`;
        
        // Calculate relationship strength from description
        const strength = calculateRelationshipStrengthFromDescription(event.description || event.title || '');
        const relationshipType = inferRelationshipType(event.description || event.title || '', strength);
        
        // Store or update relationship (keep latest per chapter)
        const existingRel = relationshipMap.get(relKey);
        if (!existingRel || (event.timestamp > (existingRel.timestamp || 0))) {
          relationshipMap.set(relKey, {
            id: `rel_${actor1Id}_${actor2Id}_${event.bookId}_${event.chapterId}_${event.timestamp}`,
            actor1Id,
            actor2Id,
            actor1Name,
            actor2Name,
            bookId: event.bookId,
            chapterId: event.chapterId,
            strength,
            relationshipType,
            summary: event.description || event.title || '',
            events: [event.id],
            createdAt: event.timestamp || event.createdAt || Date.now(),
            updatedAt: event.timestamp || event.createdAt || Date.now(),
            timestamp: event.timestamp || event.createdAt || Date.now(),
            source: 'timelineEvent'
          });
        } else {
          // Add event to existing relationship
          existingRel.events.push(event.id);
          if (event.timestamp > existingRel.updatedAt) {
            existingRel.updatedAt = event.timestamp;
            existingRel.strength = strength;
            existingRel.relationshipType = relationshipType;
            existingRel.summary = event.description || event.title || '';
          }
        }
      }
      
      // Convert map to array
      relationshipMap.forEach(rel => relsFromEvents.push(rel));
      
      // Merge with table relationships (table takes precedence for manual entries)
      const allRels = [...relsFromEvents];
      const tableRelMap = new Map();
      
      relsFromTable.forEach(rel => {
        const key = `${Math.min(rel.actor1Id, rel.actor2Id)}_${Math.max(rel.actor1Id, rel.actor2Id)}_${rel.bookId}_${rel.chapterId}`;
        tableRelMap.set(key, rel);
      });
      
      // Add table relationships that don't exist in events
      tableRelMap.forEach((rel, key) => {
        const exists = allRels.find(r => 
          ((r.actor1Id === rel.actor1Id && r.actor2Id === rel.actor2Id) ||
           (r.actor1Id === rel.actor2Id && r.actor2Id === rel.actor1Id)) &&
          r.bookId === rel.bookId &&
          r.chapterId === rel.chapterId
        );
        if (!exists) {
          allRels.push(rel);
        }
      });
      
      setRelationships(allRels);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };
  
  // Calculate relationship strength from event description
  const calculateRelationshipStrengthFromDescription = (description) => {
    if (!description) return 0;
    
    const desc = description.toLowerCase();
    let strength = 0;
    
    // Positive indicators
    if (desc.includes('friend') || desc.includes('ally') || desc.includes('trust')) strength += 30;
    if (desc.includes('close') || desc.includes('bond') || desc.includes('companion')) strength += 20;
    if (desc.includes('love') || desc.includes('romance') || desc.includes('beloved')) strength += 40;
    if (desc.includes('family') || desc.includes('brother') || desc.includes('sister')) strength += 35;
    if (desc.includes('best friend') || desc.includes('closest')) strength += 50;
    
    // Negative indicators
    if (desc.includes('enemy') || desc.includes('foe') || desc.includes('rival')) strength -= 40;
    if (desc.includes('hate') || desc.includes('despise') || desc.includes('loathe')) strength -= 50;
    if (desc.includes('betray') || desc.includes('betrayed')) strength -= 60;
    if (desc.includes('hostile') || desc.includes('antagonistic')) strength -= 30;
    
    // Neutral
    if (desc.includes('neutral') || desc.includes('stranger') || desc.includes('acquaintance')) strength = 0;
    
    // Clamp to -100 to 100
    return Math.max(-100, Math.min(100, strength));
  };
  
  // Infer relationship type from description
  const inferRelationshipType = (description, strength) => {
    if (!description) return 'neutral';
    
    const desc = description.toLowerCase();
    
    if (strength >= 70) return 'ally';
    if (strength >= 40) return 'friend';
    if (strength >= 10) return 'positive';
    if (strength <= -40) return 'enemy';
    if (strength <= -10) return 'hostile';
    if (desc.includes('romance') || desc.includes('love')) return 'romantic';
    if (desc.includes('family')) return 'family';
    
    return 'neutral';
  };

  // Aggregate relationships from actor profile snapshots
  const loadRelationshipsFromSnapshots = (actors) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RelationshipTrackerEnhanced.jsx:64',message:'loadRelationshipsFromSnapshots started',data:{actorsCount:actors.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    const relationships = [];
    
    for (const actor of actors) {
      if (!actor.snapshots) continue;
      
      // Iterate through all snapshots
      for (const [snapKey, snapshot] of Object.entries(actor.snapshots)) {
        // #region agent log
        if (snapshot.relationships) {
          fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RelationshipTrackerEnhanced.jsx:72',message:'Snapshot with relationships found',data:{actorId:actor.id,snapKey,relationshipsCount:Object.keys(snapshot.relationships).length,relationshipKeys:Object.keys(snapshot.relationships)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        }
        // #endregion
        
        if (!snapshot.relationships) continue;
        
        const [bookId, chapterId] = snapKey.split('_').map(Number);
        
        // Process each relationship in the snapshot
        for (const [otherActorId, relData] of Object.entries(snapshot.relationships)) {
          // Calculate bidirectional relationship
          const bidirectional = calculateBidirectionalRelationship(
            actor.id,
            otherActorId,
            snapKey,
            actors
          );
          
          relationships.push({
            id: `rel_${actor.id}_${otherActorId}_${bookId}_${chapterId}_${Date.now()}`,
            actor1Id: actor.id,
            actor2Id: otherActorId,
            bookId,
            chapterId,
            strength: bidirectional.strength,
            relationshipType: bidirectional.type,
            summary: relData.notes || '',
            events: [],
            createdAt: snapshot.snapshotTimestamp || Date.now(),
            updatedAt: relData.updatedAt || snapshot.snapshotTimestamp || Date.now(),
            source: 'snapshot'
          });
        }
      }
    }
    
    return relationships;
  };

  // Calculate bidirectional relationship from directional snapshots
  const calculateBidirectionalRelationship = (actor1Id, actor2Id, snapKey, actors) => {
    const actor1 = actors.find(a => a.id === actor1Id);
    const actor2 = actors.find(a => a.id === actor2Id);
    
    if (!actor1 || !actor2) return { strength: 0, type: 'neutral' };
    
    const snapshot1 = actor1.snapshots?.[snapKey];
    const snapshot2 = actor2.snapshots?.[snapKey];
    
    const rel1 = snapshot1?.relationships?.[actor2Id];
    const rel2 = snapshot2?.relationships?.[actor1Id];
    
    // If both actors have relationship data, average the strengths
    if (rel1 && rel2) {
      const avgStrength = (rel1.strength + rel2.strength) / 2;
      return {
        strength: avgStrength,
        type: rel1.type || rel2.type || 'neutral'
      };
    }
    
    // If only one has data, use that
    if (rel1) {
      return {
        strength: rel1.strength,
        type: rel1.type || 'neutral'
      };
    }
    
    if (rel2) {
      return {
        strength: rel2.strength,
        type: rel2.type || 'neutral'
      };
    }
    
    return { strength: 0, type: 'neutral' };
  };

  // Get all relationships for a specific pair across all chapters
  const getRelationshipHistory = useMemo(() => {
    return (actor1Id, actor2Id) => {
      return relationships
        .filter(rel => 
          (rel.actor1Id === actor1Id && rel.actor2Id === actor2Id) ||
          (rel.actor1Id === actor2Id && rel.actor2Id === actor1Id)
        )
        .sort((a, b) => {
          // Sort by book then chapter
          if (a.bookId !== b.bookId) return a.bookId - b.bookId;
          return a.chapterId - b.chapterId;
        });
    };
  }, [relationships]);

  // Calculate relationship strength from summary/type
  const calculateStrength = (relationship) => {
    // If strength is already stored, use it
    if (relationship.strength !== undefined) {
      return relationship.strength;
    }

    // Otherwise, infer from relationship type and summary
    const summary = (relationship.summary || '').toLowerCase();
    const type = (relationship.relationshipType || '').toLowerCase();
    
    // Keywords that indicate relationship strength
    const positiveKeywords = ['friend', 'ally', 'love', 'trust', 'respect', 'close', 'partner', 'companion'];
    const negativeKeywords = ['enemy', 'hate', 'hostile', 'rival', 'betray', 'conflict', 'anger', 'fear'];
    const neutralKeywords = ['acquaintance', 'neutral', 'stranger', 'colleague', 'unknown'];

    let strength = 0; // -100 to 100 scale
    
    if (type.includes('allied') || type.includes('friend')) {
      strength = 60 + Math.random() * 40; // 60-100
    } else if (type.includes('hostile') || type.includes('enemy')) {
      strength = -100 + Math.random() * 40; // -100 to -60
    } else if (type.includes('neutral')) {
      strength = -20 + Math.random() * 40; // -20 to 20
    } else {
      // Infer from summary
      const positiveCount = positiveKeywords.filter(k => summary.includes(k)).length;
      const negativeCount = negativeKeywords.filter(k => summary.includes(k)).length;
      const neutralCount = neutralKeywords.filter(k => summary.includes(k)).length;

      if (positiveCount > negativeCount) {
        strength = 30 + (positiveCount * 15); // 30-90
      } else if (negativeCount > positiveCount) {
        strength = -90 + (negativeCount * 15); // -90 to -30
      } else {
        strength = -10 + Math.random() * 20; // -10 to 10
      }
    }

    return Math.max(-100, Math.min(100, strength));
  };

  // Get relationship type label from strength
  const getRelationshipType = (strength) => {
    if (strength >= 60) return { label: 'Allied', color: '#22c55e', icon: Heart };
    if (strength >= 20) return { label: 'Friendly', color: '#84cc16', icon: TrendingUp };
    if (strength >= -20) return { label: 'Neutral', color: '#eab308', icon: Minus };
    if (strength >= -60) return { label: 'Tense', color: '#f97316', icon: AlertTriangle };
    return { label: 'Hostile', color: '#ef4444', icon: HeartOff };
  };

  // Get all events for a relationship pair chronologically
  const getRelationshipEvents = useMemo(() => {
    return (actor1Id, actor2Id) => {
      const history = getRelationshipHistory(actor1Id, actor2Id);
      const events = [];

      history.forEach(rel => {
        // Add relationship events
        if (rel.events && Array.isArray(rel.events)) {
          rel.events.forEach((event, idx) => {
            events.push({
              id: `${rel.id}_event_${idx}`,
              type: 'interaction',
              text: event,
              bookId: rel.bookId,
              chapterId: rel.chapterId,
              timestamp: rel.createdAt || rel.updatedAt,
              relationship: rel
            });
          });
        }

        // Add relationship change events
        if (rel.summary) {
          events.push({
            id: `${rel.id}_summary`,
            type: 'relationship_change',
            text: `Relationship update: ${rel.summary.substring(0, 100)}...`,
            bookId: rel.bookId,
            chapterId: rel.chapterId,
            timestamp: rel.createdAt || rel.updatedAt,
            relationship: rel,
            strength: calculateStrength(rel)
          });
        }
      });

      return events.sort((a, b) => {
        // Sort by book, then chapter, then timestamp
        if (a.bookId !== b.bookId) return a.bookId - b.bookId;
        if (a.chapterId !== b.chapterId) return a.chapterId - b.chapterId;
        return (a.timestamp || 0) - (b.timestamp || 0);
      });
    };
  }, [relationships, getRelationshipHistory]);

  // Timeline view - shows relationship changes over time
  const renderTimelineView = () => {
    if (!selectedPair) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Select a character pair to view timeline</p>
          </div>
        </div>
      );
    }

    const history = getRelationshipHistory(selectedPair.actor1Id, selectedPair.actor2Id);
    const events = getRelationshipEvents(selectedPair.actor1Id, selectedPair.actor2Id);
    
    // Filter events based on timeline position
    const filteredEvents = events.filter((event, idx) => {
      const position = (idx / events.length) * 100;
      return position <= timelinePosition;
    });

    const currentStrength = filteredEvents.length > 0 
      ? calculateStrength(filteredEvents[filteredEvents.length - 1].relationship)
      : 0;

    const relationshipType = getRelationshipType(currentStrength);

    return (
      <div className="flex-1 flex flex-col p-6">
        {/* Timeline Controls */}
        <div className="mb-6 bg-slate-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {actors.find(a => a.id === selectedPair.actor1Id)?.name} ↔ {actors.find(a => a.id === selectedPair.actor2Id)?.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Book {history[0]?.bookId || '?'} - Book {history[history.length - 1]?.bookId || '?'}</span>
                <span>{events.length} events</span>
              </div>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={timelinePosition}
              onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #22c55e 0%, #22c55e ${timelinePosition}%, #374151 ${timelinePosition}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Start</span>
              <span>{timelinePosition.toFixed(0)}%</span>
              <span>End</span>
            </div>
          </div>

          {/* Current Relationship Strength */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Current Relationship</span>
              <span className="text-sm font-bold" style={{ color: relationshipType.color }}>
                {relationshipType.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <relationshipType.icon className="w-5 h-5" style={{ color: relationshipType.color }} />
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.abs(currentStrength)}%`,
                    backgroundColor: currentStrength >= 0 ? '#22c55e' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-sm font-mono text-slate-300 w-12 text-right">
                {currentStrength > 0 ? '+' : ''}{currentStrength.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Events Log */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase">Events Log</h4>
          <div className="space-y-3">
            {filteredEvents.map((event, idx) => {
              const eventStrength = event.strength !== undefined 
                ? event.strength 
                : calculateStrength(event.relationship);
              const eventType = getRelationshipType(eventStrength);
              
              return (
                <div
                  key={event.id}
                  className="bg-slate-900 rounded-lg p-4 border-l-4"
                  style={{ borderColor: eventType.color }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <eventType.icon className="w-4 h-4" style={{ color: eventType.color }} />
                      <span className="text-xs font-bold text-slate-400">
                        Book {event.bookId}, Chapter {event.chapterId}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{event.text}</p>
                  {event.strength !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Strength:</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full max-w-32">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.abs(eventStrength)}%`,
                            backgroundColor: eventStrength >= 0 ? '#22c55e' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {eventStrength > 0 ? '+' : ''}{eventStrength.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Generate relationship summary (enhanced to include strength)
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

      // Calculate initial strength
      const strength = calculateStrength({ summary, relationshipType: 'complex' });

      const relationship = {
        id: `rel_${actor1Id}_${actor2Id}_${bookId}_${chapterId}`,
        actor1Id,
        actor2Id,
        bookId,
        chapterId,
        summary,
        relationshipType: strength >= 60 ? 'allied' : strength <= -60 ? 'hostile' : 'neutral',
        strength,
        events,
        confidence: 0.9,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.add('relationships', relationship);
      await loadRelationships();
      setSelectedRelationship(relationship);
      setSelectedPair({ actor1Id, actor2Id });
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
      const sentences = text.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.includes(actor1.name.toLowerCase()) && sentence.includes(actor2.name.toLowerCase())) {
          events.push(sentence.trim());
        }
      });
    }
    return events.slice(0, 10); // Increased limit
  };

  const updateRelationship = async (relId, updates) => {
    const rel = relationships.find(r => r.id === relId);
    if (!rel) return;

    // Recalculate strength if summary or type changed
    if (updates.summary || updates.relationshipType) {
      updates.strength = calculateStrength({ ...rel, ...updates });
    }

    const updated = {
      ...rel,
      ...updates,
      updatedAt: Date.now()
    };

    await db.update('relationships', updated);
    await loadRelationships();
    setSelectedRelationship(updated);
  };

  // Get unique pairs of actors who have relationships
  const relationshipPairs = useMemo(() => {
    const pairs = new Map();
    relationships.forEach(rel => {
      const key = [rel.actor1Id, rel.actor2Id].sort().join('_');
      if (!pairs.has(key)) {
        pairs.set(key, {
          actor1Id: rel.actor1Id,
          actor2Id: rel.actor2Id,
          relationships: []
        });
      }
      pairs.get(key).relationships.push(rel);
    });
    return Array.from(pairs.values());
  }, [relationships]);

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
          <p className="text-sm text-slate-400 mt-1">Track character relationships with timeline visualization</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col overflow-y-auto">
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

          {/* Relationship Pairs List (for timeline view) */}
          {viewMode === 'timeline' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-xs text-slate-400 font-bold mb-2 uppercase">Character Pairs</div>
              {relationshipPairs.map((pair, idx) => {
                const latestRel = pair.relationships[pair.relationships.length - 1];
                const strength = calculateStrength(latestRel);
                const relType = getRelationshipType(strength);
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedPair({ actor1Id: pair.actor1Id, actor2Id: pair.actor2Id })}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selectedPair?.actor1Id === pair.actor1Id && selectedPair?.actor2Id === pair.actor2Id
                        ? 'bg-green-900/20 border-green-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-white font-bold text-sm mb-1">
                      {getActorName(pair.actor1Id)} ↔ {getActorName(pair.actor2Id)}
                    </div>
                    <div className="flex items-center gap-2">
                      <relType.icon className="w-3 h-3" style={{ color: relType.color }} />
                      <span className="text-xs" style={{ color: relType.color }}>
                        {relType.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({pair.relationships.length} events)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Relationship List (for list view) */
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredRelationships.map(rel => {
                const actor1 = actors.find(a => a.id === rel.actor1Id);
                const actor2 = actors.find(a => a.id === rel.actor2Id);
                const strength = calculateStrength(rel);
                const relType = getRelationshipType(strength);
                
                return (
                  <button
                    key={rel.id}
                    onClick={() => {
                      setSelectedRelationship(rel);
                      setSelectedPair({ actor1Id: rel.actor1Id, actor2Id: rel.actor2Id });
                    }}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selectedRelationship?.id === rel.id
                        ? 'bg-green-900/20 border-green-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-white font-bold text-sm mb-1">
                      {actor1?.name || rel.actor1Id} ↔ {actor2?.name || rel.actor2Id}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <relType.icon className="w-3 h-3" style={{ color: relType.color }} />
                      <span className="text-xs" style={{ color: relType.color }}>
                        {relType.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Book {rel.bookId}, Ch {rel.chapterId}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'timeline' ? (
            renderTimelineView()
          ) : selectedRelationship ? (
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

                {/* Relationship Strength Meter */}
                <div className="bg-slate-900 rounded-lg p-4 mb-4">
                  <div className="text-xs text-slate-400 font-bold mb-3 uppercase">Relationship Strength</div>
                  {(() => {
                    const strength = calculateStrength(selectedRelationship);
                    const relType = getRelationshipType(strength);
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <relType.icon className="w-5 h-5" style={{ color: relType.color }} />
                            <span className="text-lg font-bold" style={{ color: relType.color }}>
                              {relType.label}
                            </span>
                          </div>
                          <span className="text-lg font-mono text-slate-300">
                            {strength > 0 ? '+' : ''}{strength.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.abs(strength)}%`,
                              backgroundColor: strength >= 0 ? '#22c55e' : '#ef4444',
                              marginLeft: strength < 0 ? `${100 - Math.abs(strength)}%` : '0'
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Hostile (-100)</span>
                          <span>Neutral (0)</span>
                          <span>Allied (+100)</span>
                        </div>
                      </div>
                    );
                  })()}
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

export default RelationshipTrackerEnhanced;
