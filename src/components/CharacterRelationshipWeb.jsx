import React, { useState, useEffect, useMemo } from 'react';
import { Link, Users, Filter, X, Info } from 'lucide-react';
import db from '../services/database';

/**
 * CharacterRelationshipWeb - Interactive network graph showing character relationships
 */
const CharacterRelationshipWeb = ({ actor, actors, onActorSelect }) => {
  const [relationships, setRelationships] = useState([]);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStrength, setFilterStrength] = useState('all');
  const [showDetails, setShowDetails] = useState(false);

  // Load relationships
  useEffect(() => {
    if (actor && actor.id) {
      loadRelationships();
    } else {
      setRelationships([]);
    }
  }, [actor]);

  const loadRelationships = async () => {
    if (!actor || !actor.id) {
      setRelationships([]);
      return;
    }

    try {
      // Load from relationships table
      let allRelationships = [];
      try {
        allRelationships = await db.getAll('relationships') || [];
      } catch (dbError) {
        console.warn('Error loading relationships from DB:', dbError);
        allRelationships = [];
      }
      
      // Filter relationships involving this actor
      const actorRelationships = (allRelationships || []).filter(rel => 
        rel && (rel.actor1Id === actor.id || rel.actor2Id === actor.id)
      );

      // Also check timelineEvents for relationship changes
      let allEvents = [];
      try {
        allEvents = await db.getAll('timelineEvents') || [];
      } catch (dbError) {
        console.warn('Error loading timeline events from DB:', dbError);
        allEvents = [];
      }
      const relationshipEvents = (allEvents || []).filter(event => 
        event && 
        event.type === 'relationship_change' &&
        event.actorIds &&
        Array.isArray(event.actorIds) &&
        (event.actorIds.includes(actor.id))
      );

      // Combine and process
      const processed = [...actorRelationships];
      
      relationshipEvents.forEach(event => {
        if (event.actorIds && event.actorIds.length >= 2) {
          const otherActorId = event.actorIds.find(id => id !== actor.id);
          if (otherActorId) {
            const existing = processed.find(r => 
              (r.actor1Id === actor.id && r.actor2Id === otherActorId) ||
              (r.actor1Id === otherActorId && r.actor2Id === actor.id)
            );

            if (!existing) {
              processed.push({
                id: `event_${event.id}`,
                actor1Id: actor.id,
                actor2Id: otherActorId,
                type: inferRelationshipType(event.description || '', 50),
                strength: calculateStrength(event.description || ''),
                description: event.description || '',
                history: [{
                  chapterId: event.chapterId,
                  change: event.description,
                  timestamp: event.timestamp
                }]
              });
            }
          }
        }
      });

      setRelationships(processed);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CharacterRelationshipWeb.jsx:60',message:'Relationships processed',data:{processedCount:processed.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CharacterRelationshipWeb.jsx:63',message:'Error loading relationships',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      console.error('Error loading relationships:', error);
    }
  };

  // Helper functions
  const inferRelationshipType = (description, strength) => {
    const desc = description.toLowerCase();
    if (desc.includes('friend') || desc.includes('ally')) return 'allied';
    if (desc.includes('enemy') || desc.includes('hostile') || desc.includes('rival')) return 'hostile';
    if (desc.includes('family') || desc.includes('parent') || desc.includes('sibling')) return 'family';
    if (desc.includes('romance') || desc.includes('love') || desc.includes('partner')) return 'romantic';
    if (desc.includes('mentor') || desc.includes('teacher')) return 'mentor';
    if (desc.includes('student') || desc.includes('apprentice')) return 'student';
    return 'neutral';
  };

  const calculateStrength = (description) => {
    const desc = description.toLowerCase();
    let strength = 50;
    if (desc.includes('close') || desc.includes('strong') || desc.includes('deep')) strength = 80;
    if (desc.includes('distant') || desc.includes('weak') || desc.includes('tense')) strength = 30;
    if (desc.includes('very') || desc.includes('extremely')) strength = strength > 50 ? 90 : 20;
    return strength;
  };

  // Get unique relationship types
  const relationshipTypes = useMemo(() => {
    const types = new Set(relationships.map(r => r.type));
    return Array.from(types);
  }, [relationships]);

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      if (filterType !== 'all' && rel.type !== filterType) return false;
      if (filterStrength === 'strong' && rel.strength < 70) return false;
      if (filterStrength === 'weak' && rel.strength >= 70) return false;
      return true;
    });
  }, [relationships, filterType, filterStrength]);

  // Get connected actors
  const connectedActors = useMemo(() => {
    const actorIds = new Set();
    filteredRelationships.forEach(rel => {
      if (rel.actor1Id === actor.id) actorIds.add(rel.actor2Id);
      if (rel.actor2Id === actor.id) actorIds.add(rel.actor1Id);
    });
    return actors.filter(a => actorIds.has(a.id));
  }, [filteredRelationships, actor, actors]);

  const getRelationshipColor = (type, strength) => {
    const opacity = Math.max(0.3, strength / 100);
    switch (type) {
      case 'allied':
        return `rgba(34, 197, 94, ${opacity})`; // green
      case 'hostile':
        return `rgba(239, 68, 68, ${opacity})`; // red
      case 'family':
        return `rgba(168, 85, 247, ${opacity})`; // purple
      case 'romantic':
        return `rgba(236, 72, 153, ${opacity})`; // pink
      case 'mentor':
      case 'student':
        return `rgba(59, 130, 246, ${opacity})`; // blue
      default:
        return `rgba(148, 163, 184, ${opacity})`; // slate
    }
  };

  const getRelationshipLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!actor) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a character to view relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Filters */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-400" />
            Relationship Web
          </h3>
          <div className="text-sm text-slate-400">
            {filteredRelationships.length} relationship{filteredRelationships.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <label className="text-xs text-slate-400">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
            >
              <option value="all">All Types</option>
              {relationshipTypes.map(type => (
                <option key={type} value={type}>{getRelationshipLabel(type)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Strength:</label>
            <select
              value={filterStrength}
              onChange={(e) => setFilterStrength(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
            >
              <option value="all">All Strengths</option>
              <option value="strong">Strong (70+)</option>
              <option value="weak">Weak (&lt;70)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Relationship Network */}
      <div className="flex-1 overflow-hidden relative bg-slate-950">
        {filteredRelationships.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No relationships found</p>
              <p className="text-xs mt-2">Try adjusting filters</p>
            </div>
          </div>
        ) : (
          <div className="p-8 h-full overflow-auto">
            {/* Central Actor */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-slate-800">
                  {actor.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900 px-3 py-1 rounded border border-slate-700">
                  <div className="text-xs font-semibold text-white">{actor.name}</div>
                </div>
              </div>
            </div>

            {/* Connected Actors */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {connectedActors.map((connectedActor, index) => {
                const relationship = filteredRelationships.find(rel =>
                  (rel.actor1Id === actor.id && rel.actor2Id === connectedActor.id) ||
                  (rel.actor1Id === connectedActor.id && rel.actor2Id === actor.id)
                );

                if (!relationship) return null;

                const angle = (index * 360) / connectedActors.length;
                const distance = 150;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;

                return (
                  <div
                    key={connectedActor.id}
                    className="relative"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                      position: 'absolute',
                      left: '50%',
                      top: '50%'
                    }}
                  >
                    {/* Connection Line */}
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      style={{ width: '100%', height: '100%', zIndex: 0 }}
                    >
                      <line
                        x1="50%"
                        y1="50%"
                        x2={`${50 + (x / 10)}%`}
                        y2={`${50 + (y / 10)}%`}
                        stroke={getRelationshipColor(relationship.type, relationship.strength)}
                        strokeWidth={Math.max(2, relationship.strength / 20)}
                        opacity={0.6}
                      />
                    </svg>

                    {/* Actor Node */}
                    <div
                      className="relative z-10 cursor-pointer group"
                      onClick={() => {
                        setSelectedRelationship(relationship);
                        setShowDetails(true);
                        if (onActorSelect) onActorSelect(connectedActor.id);
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold shadow-lg border-2 border-slate-700 group-hover:border-blue-500 transition-colors">
                        {connectedActor.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Relationship Label */}
                      <div
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded border text-xs whitespace-nowrap"
                        style={{
                          borderColor: getRelationshipColor(relationship.type, relationship.strength),
                          color: getRelationshipColor(relationship.type, relationship.strength)
                        }}
                      >
                        {getRelationshipLabel(relationship.type)}
                        <div className="text-[10px] opacity-75">
                          {relationship.strength}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alternative Grid Layout for Better Visibility */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedActors.map((connectedActor) => {
                const relationship = filteredRelationships.find(rel =>
                  (rel.actor1Id === actor.id && rel.actor2Id === connectedActor.id) ||
                  (rel.actor1Id === connectedActor.id && rel.actor2Id === actor.id)
                );

                if (!relationship) return null;

                return (
                  <div
                    key={connectedActor.id}
                    onClick={() => {
                      setSelectedRelationship(relationship);
                      setShowDetails(true);
                      if (onActorSelect) onActorSelect(connectedActor.id);
                    }}
                    className="bg-slate-900 border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                    style={{
                      borderColor: getRelationshipColor(relationship.type, relationship.strength)
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold"
                      >
                        {connectedActor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{connectedActor.name}</div>
                        <div
                          className="text-xs"
                          style={{ color: getRelationshipColor(relationship.type, relationship.strength) }}
                        >
                          {getRelationshipLabel(relationship.type)} • {relationship.strength}%
                        </div>
                      </div>
                    </div>
                    {relationship.description && (
                      <div className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {relationship.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Relationship Details Modal */}
      {showDetails && selectedRelationship && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Relationship Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Type</div>
                <div className="text-sm font-semibold text-white">
                  {getRelationshipLabel(selectedRelationship.type)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Strength</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${selectedRelationship.strength}%`,
                        backgroundColor: getRelationshipColor(selectedRelationship.type, selectedRelationship.strength)
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-300">{selectedRelationship.strength}%</span>
                </div>
              </div>
              {selectedRelationship.description && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Description</div>
                  <div className="text-sm text-slate-300">{selectedRelationship.description}</div>
                </div>
              )}
              {selectedRelationship.history && selectedRelationship.history.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">History</div>
                  <div className="space-y-2">
                    {selectedRelationship.history.map((event, i) => (
                      <div key={i} className="bg-slate-800 rounded p-2 text-xs text-slate-300">
                        <div className="font-semibold">{event.change}</div>
                        {event.chapterId && (
                          <div className="text-slate-500 mt-1">Chapter {event.chapterId}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterRelationshipWeb;
