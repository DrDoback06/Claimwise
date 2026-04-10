/**
 * Character Relationship Hub
 * Multiple visualization modes: Network Graph, Relationship Cards, Evolution Timeline
 */

import React, { useState, useEffect } from 'react';
import { Network, Users, Clock, Heart, TrendingUp, ChevronRight, BookOpen } from 'lucide-react';
import CharacterRelationshipWeb from './CharacterRelationshipWeb';
import db from '../services/database';
import { getCardContainerStyles, getProgressBarStyles, getBadgeStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterRelationshipHub = ({ character, actors, onActorSelect, books }) => {
  const [viewMode, setViewMode] = useState('network'); // 'network' | 'cards' | 'timeline' | 'family-tree'
  const [relationships, setRelationships] = useState([]);
  const [relationshipHistory, setRelationshipHistory] = useState([]);

  // ---- Enhancements ----
  const [selectedRelationshipId, setSelectedRelationshipId] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null); // rel id being edited
  const [notesText, setNotesText] = useState('');
  const [showGapDetectorResults, setShowGapDetectorResults] = useState(false);
  const [gapDetectorResults, setGapDetectorResults] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadRelationships();
    loadRelationshipHistory();
  }, [character]);

  /**
   * Load relationships
   */
  const loadRelationships = async () => {
    try {
      const allRelationships = await db.getAll('relationships') || [];
      const characterRelationships = allRelationships.filter(rel => 
        rel.actor1Id === character.id || rel.actor2Id === character.id
      );

      // Enrich with actor names
      const enriched = characterRelationships.map(rel => {
        const otherActorId = rel.actor1Id === character.id ? rel.actor2Id : rel.actor1Id;
        const otherActor = actors.find(a => a.id === otherActorId);
        return {
          ...rel,
          otherActor,
          otherActorName: otherActor?.name || 'Unknown'
        };
      });

      setRelationships(enriched);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  /**
   * Load relationship history from timeline events
   */
  const loadRelationshipHistory = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const relationshipEvents = allEvents.filter(evt => 
        evt.type === 'relationship_change' &&
        evt.actors?.includes(character.name)
      ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      setRelationshipHistory(relationshipEvents);
    } catch (error) {
      console.error('Error loading relationship history:', error);
    }
  };

  // ---- Enhancement: Save relationship notes ----
  const saveRelationshipNotes = async (relId, notes) => {
    try {
      const allRels = await db.getAll('relationships') || [];
      const rel = allRels.find(r => r.id === relId);
      if (!rel) return;
      await db.update('relationships', { ...rel, notes });
      setRelationships(prev => prev.map(r => r.id === relId ? { ...r, notes } : r));
      setEditingNotes(null);
    } catch (e) {
      console.error('Error saving relationship notes:', e);
    }
  };

  // ---- Enhancement: Relationship gap detector ----
  const detectRelationshipGaps = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const charEvents = allEvents.filter(e => e.actors?.includes(character.name));
      const coActors = [...new Set(charEvents.flatMap(e => e.actors || []).filter(a => a !== character.name))];
      const definedPartners = relationships.map(r => r.otherActorName);
      const gaps = coActors.filter(name => !definedPartners.includes(name));
      setGapDetectorResults(gaps);
      setShowGapDetectorResults(true);
    } catch (e) {
      console.error('Gap detection error:', e);
    }
  };

  // ---- Enhancement: Relationship templates ----
  const relationshipTemplates = [
    { label: 'Rivals', type: 'rival', strength: 40, description: 'Competitive opposition between these characters.' },
    { label: 'Mentor / Student', type: 'mentor', strength: 70, description: 'One guides and teaches the other.' },
    { label: 'Lovers', type: 'romantic', strength: 90, description: 'A romantic bond between these characters.' },
    { label: 'Allies', type: 'ally', strength: 75, description: 'Mutual trust and cooperation.' },
    { label: 'Enemies', type: 'hostile', strength: 20, description: 'Active opposition and conflict.' },
    { label: 'Family', type: 'family', strength: 80, description: 'A familial bond.' },
  ];

  // ---- Enhancement: Family tree renderer ----
  const renderFamilyTreeView = () => {
    const familyRels = relationships.filter(r =>
      (r.type || '').toLowerCase().includes('family') ||
      (r.type || '').toLowerCase().includes('sibling') ||
      (r.type || '').toLowerCase().includes('parent') ||
      (r.type || '').toLowerCase().includes('child')
    );
    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">FAMILY TREE</div>
        {familyRels.length === 0 ? (
          <div className="text-center text-slate-500 p-8">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No family relationships found.</p>
            <p className="text-xs mt-1 text-slate-600">Tag relationships with type "family", "parent", "sibling", or "child" to see them here.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-blue-900/40 border border-blue-500 rounded-lg px-4 py-2 text-white font-bold">
              {character.name}
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              {familyRels.map((rel, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-6 bg-slate-600" />
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 text-center">
                    <div className="font-semibold">{rel.otherActorName}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{rel.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Enhancement: Influence ranking ----
  const getInfluenceRanking = () => {
    return [...relationships].sort((a, b) => (b.strength || 50) - (a.strength || 50));
  };

  /**
   * Get relationship strength color
   */
  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'text-green-400 border-green-500';
    if (strength >= 60) return 'text-blue-400 border-blue-500';
    if (strength >= 40) return 'text-yellow-400 border-yellow-500';
    if (strength >= 20) return 'text-orange-400 border-orange-500';
    return 'text-red-400 border-red-500';
  };

  /**
   * Get relationship type icon
   */
  const getTypeIcon = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('romance') || typeLower.includes('love')) return Heart;
    if (typeLower.includes('friend') || typeLower.includes('ally')) return Users;
    if (typeLower.includes('enemy') || typeLower.includes('rival')) return TrendingUp;
    return Network;
  };

  /**
   * Network Graph View
   */
  const renderNetworkView = () => {
    return (
      <CharacterRelationshipWeb
        actor={character}
        actors={actors}
        onActorSelect={onActorSelect}
      />
    );
  };

  /**
   * Relationship Cards View - Modern cards
   */
  const renderCardsView = () => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-shadow-soft">Relationship Cards</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationships.map((rel, idx) => {
            const TypeIcon = getTypeIcon(rel.type);
            const strength = rel.strength || 50;
            const strengthColor = getStrengthColor(strength);
            const strengthLevel = strength >= 80 ? 'Epic' : strength >= 60 ? 'Rare' : 'Common';

            return (
              <div
                key={rel.id || `rel-${idx}`}
                className={`${getCardContainerStyles('Common', 'quest')} p-5 ${getHoverEffects('medium')} cursor-pointer animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => onActorSelect?.(rel.otherActorId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${strengthColor.replace('text-', 'bg-').replace('-400', '-900/30')} border-2 ${strengthColor.replace('text-', 'border-')} flex items-center justify-center ${getHoverEffects('light')}`}>
                      <TypeIcon className={`w-6 h-6 ${strengthColor.replace('text-', 'text-')}`} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white text-shadow-soft">
                        {rel.otherActorName}
                      </div>
                      <div className="text-xs text-slate-300 uppercase tracking-wider capitalize">
                        {rel.type || 'Unknown Relationship'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getTextGradient(strength >= 80 ? 'green' : strength >= 60 ? 'blue' : 'yellow')}`}>
                    {strength}%
                  </div>
                </div>
                {rel.description && (
                  <div className="text-xs text-slate-300 mb-4 leading-relaxed opacity-90">
                    {rel.description}
                  </div>
                )}
                {/* Strength Meter - Modern gradient */}
                <div className={getProgressBarStyles(strengthLevel, true).container}>
                  <div
                    className={getProgressBarStyles(strengthLevel, true).fill}
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {relationships.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No relationships found</p>
            <p className="text-xs text-slate-500 mt-1">Relationships will appear here once extracted from manuscripts</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Evolution Timeline View
   */
  const renderTimelineView = () => {
    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">RELATIONSHIP EVOLUTION</div>
        <div className="space-y-3">
          {relationshipHistory.map((event, idx) => {
            const chapterInfo = getChapterInfo(event.bookId, event.chapterId);
            const otherActors = event.actors?.filter(name => name !== character.name) || [];

            return (
              <div key={idx} className="flex gap-4 p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold text-white">{event.title || 'Relationship Change'}</div>
                    {chapterInfo && (
                      <div className="text-xs text-slate-400">
                        {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <div className="text-xs text-slate-300 mb-2">{event.description}</div>
                  )}
                  {otherActors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {otherActors.map((actorName, i) => (
                        <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                          {actorName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {relationshipHistory.length === 0 && (
          <div className="text-center text-slate-500 p-8">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No relationship history found</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Get chapter info
   */
  const getChapterInfo = (bookId, chapterId) => {
    if (!books) return null;
    // Support both object-keyed (books[id]) and array formats
    const book = Array.isArray(books)
      ? books.find(b => b.id === bookId || b.id === String(bookId))
      : (books[bookId] || Object.values(books).find(b => b.id === bookId || b.id === String(bookId)));
    if (!book) return null;
    const chapter = book.chapters?.find(ch => ch.id === chapterId || ch.id === String(chapterId));
    return chapter ? { book, chapter } : null;
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector - Modern tab switcher */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-2`}>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('network')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'network'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Network className="w-4 h-4" />
            Network Graph
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'cards'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Cards
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'timeline'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('family-tree')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'family-tree'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Family
          </button>
        </div>
      </div>

      {/* ---- Enhancement: Toolbar row (Gap Detector, Templates, Influence Rank) ---- */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={detectRelationshipGaps}
          className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-yellow-300 px-3 py-1.5 rounded flex items-center gap-1"
        >
          <TrendingUp className="w-3 h-3" /> Gap Detector
        </button>
        <button
          onClick={() => setShowTemplates(v => !v)}
          className={`text-xs border px-3 py-1.5 rounded flex items-center gap-1 ${showTemplates ? 'bg-blue-800 border-blue-500 text-blue-200' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'}`}
        >
          <Heart className="w-3 h-3" /> Relationship Templates
        </button>
        {relationships.length > 0 && (
          <div className="text-xs text-slate-500 flex items-center gap-1 ml-2">
            <TrendingUp className="w-3 h-3" />
            Strongest: <span className="text-white ml-1">{getInfluenceRanking()[0]?.otherActorName}</span>
          </div>
        )}
      </div>

      {/* ---- Enhancement: Relationship Templates panel ---- */}
      {showTemplates && (
        <div className="bg-slate-900 border border-blue-700 rounded-lg p-4">
          <div className="text-xs font-bold text-blue-300 mb-3">RELATIONSHIP TEMPLATES</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {relationshipTemplates.map(t => (
              <button
                key={t.label}
                onClick={async () => {
                  const targetActor = actors.find(a => a.id !== character.id);
                  if (!targetActor) return;
                  const newRel = {
                    id: `rel_${Date.now()}`,
                    actor1Id: character.id,
                    actor2Id: targetActor.id,
                    type: t.type,
                    strength: t.strength,
                    description: t.description,
                    createdAt: Date.now(),
                  };
                  try {
                    await db.add('relationships', newRel);
                    await loadRelationships();
                    setShowTemplates(false);
                  } catch (e) {
                    console.error('Error creating relationship:', e);
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded p-2 text-left"
              >
                <div className="text-xs font-bold text-blue-300">{t.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{t.description.slice(0, 50)}...</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Enhancement: Gap Detector results ---- */}
      {showGapDetectorResults && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <div className="text-xs font-bold text-yellow-300">RELATIONSHIP GAPS DETECTED</div>
            <button onClick={() => setShowGapDetectorResults(false)} className="text-slate-500 hover:text-white">
              <BookOpen className="w-3 h-3" />
            </button>
          </div>
          {gapDetectorResults.length === 0 ? (
            <p className="text-xs text-slate-400">No gaps found — all co-appearing characters have defined relationships.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-slate-400 mb-2">These characters appear with {character.name} in chapters but have no defined relationship:</p>
              {gapDetectorResults.map(name => (
                <div key={name} className="flex items-center justify-between text-xs bg-yellow-900/30 rounded px-2 py-1">
                  <span className="text-yellow-200">{name}</span>
                  <span className="text-slate-500">No relationship defined</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Enhancement: Relationship notes editor (shown when editing) ---- */}
      {editingNotes !== null && (
        <div className="bg-slate-900 border border-teal-700 rounded-lg p-4">
          <div className="text-xs font-bold text-teal-300 mb-2">RELATIONSHIP NOTES</div>
          <textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm p-2 rounded resize-none"
            placeholder="Add history, lore, or notes about this relationship..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => saveRelationshipNotes(editingNotes, notesText)}
              className="text-xs bg-teal-700 hover:bg-teal-600 text-white px-3 py-1.5 rounded"
            >Save Notes</button>
            <button
              onClick={() => setEditingNotes(null)}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded"
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Content - Modern container */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
        {viewMode === 'network' && renderNetworkView()}
        {viewMode === 'cards' && renderCardsView()}
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'family-tree' && renderFamilyTreeView()}
      </div>
    </div>
  );
};

export default CharacterRelationshipHub;
