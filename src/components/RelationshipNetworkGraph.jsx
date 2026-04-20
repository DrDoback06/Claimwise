/**
 * Relationship Network Graph
 * Network graph visualization of character relationships
 */

import React, { useState, useMemo } from 'react';
import { Users, X, Filter } from 'lucide-react';

const RelationshipNetworkGraph = ({ relationships = [], characters = [], onNodeClick }) => {
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('all');
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    let filtered = relationships;
    
    if (selectedRelationshipType !== 'all') {
      filtered = filtered.filter(r => r.type === selectedRelationshipType);
    }
    
    if (selectedCharacter) {
      filtered = filtered.filter(r => 
        r.actor1Id === selectedCharacter || r.actor2Id === selectedCharacter
      );
    }
    
    return filtered;
  }, [relationships, selectedRelationshipType, selectedCharacter]);

  // Get unique relationship types
  const relationshipTypes = useMemo(() => {
    const types = new Set(relationships.map(r => r.type).filter(Boolean));
    return Array.from(types);
  }, [relationships]);

  // Get characters involved in relationships
  const involvedCharacters = useMemo(() => {
    const charIds = new Set();
    filteredRelationships.forEach(r => {
      if (r.actor1Id) charIds.add(r.actor1Id);
      if (r.actor2Id) charIds.add(r.actor2Id);
    });
    return characters.filter(c => charIds.has(c.id));
  }, [filteredRelationships, characters]);

  const getRelationshipColor = (type) => {
    // Loomwright-harmonised palette
    const colorMap = {
      allied:   '#6fbf7c', // good (moss)
      hostile:  '#c76b5a', // bad (terracotta)
      romantic: '#d09c8e', // warm peach
      familial: '#e2b552', // accent (amber)
      mentor:   '#7fb8c7', // accent-2 (teal)
      neutral:  '#a8a18f', // ink-2
      friend:   '#6fbf7c',
      enemy:    '#c76b5a',
    };
    return colorMap[type] || '#a8a18f';
  };

  const getCharacterName = (actorId) => {
    const char = characters.find(c => c.id === actorId);
    return char?.name || `Character ${actorId}`;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-white">Relationship Network</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedRelationshipType}
          onChange={(e) => setSelectedRelationshipType(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2"
        >
          <option value="all">All Types</option>
          {relationshipTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
        <select
          value={selectedCharacter || 'all'}
          onChange={(e) => setSelectedCharacter(e.target.value === 'all' ? null : e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2"
        >
          <option value="all">All Characters</option>
          {involvedCharacters.map(char => (
            <option key={char.id} value={char.id}>{char.name}</option>
          ))}
        </select>
      </div>

      {/* Network Visualization */}
      <div className="flex-1 overflow-auto">
        {filteredRelationships.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No relationships match the current filters
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRelationships.map((rel, idx) => {
              const char1Name = getCharacterName(rel.actor1Id || rel.character1);
              const char2Name = getCharacterName(rel.actor2Id || rel.character2);
              const color = getRelationshipColor(rel.type);

              return (
                <div
                  key={rel.id || idx}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-purple-500/50 transition-colors cursor-pointer"
                  onClick={() => onNodeClick && onNodeClick(rel)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-white font-medium">{char1Name}</span>
                      <span className="text-xs text-slate-400">→</span>
                      <span className="text-sm text-white font-medium">{char2Name}</span>
                    </div>
                    <span className="text-xs text-slate-500 capitalize">{rel.type || 'relationship'}</span>
                  </div>
                  {rel.strength !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${rel.strength}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{rel.strength}%</span>
                      </div>
                    </div>
                  )}
                  {rel.description && (
                    <div className="text-xs text-slate-400 mt-2">{rel.description.substring(0, 100)}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 mb-2">Relationship Types:</div>
        <div className="flex flex-wrap gap-2">
          {relationshipTypes.slice(0, 6).map(type => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getRelationshipColor(type) }}
              />
              <span className="text-xs text-slate-500 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelationshipNetworkGraph;
