import React, { useState, useEffect } from 'react';
import { History, ArrowLeft, ArrowRight, GitBranch, TrendingUp, BarChart2, X, RefreshCw, AlertTriangle } from 'lucide-react';
import db from '../services/database';

/**
 * Version Control - Timeline visualization, comparison, and revert functionality
 */
const VersionControl = ({ actors, books, onClose }) => {
  const [selectedActor, setSelectedActor] = useState(actors[0]?.id || null);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot1, setSelectedSnapshot1] = useState(null);
  const [selectedSnapshot2, setSelectedSnapshot2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [revertMode, setRevertMode] = useState(null); // null | 'affect' | 'branch'

  useEffect(() => {
    if (selectedActor) {
      loadSnapshots();
    }
  }, [selectedActor]);

  const loadSnapshots = async () => {
    try {
      const history = await db.getSnapshotHistory(selectedActor);
      setSnapshots(history);
    } catch (error) {
      console.error('Error loading snapshots:', error);
    }
  };

  const compareSnapshots = async () => {
    if (!selectedSnapshot1 || !selectedSnapshot2) return;

    try {
      const snap1 = snapshots.find(s => s.id === selectedSnapshot1);
      const snap2 = snapshots.find(s => s.id === selectedSnapshot2);

      if (!snap1 || !snap2) return;

      const result = await db.compareSnapshots(
        selectedActor,
        { bookId: snap1.bookId, chapterId: snap1.chapterId },
        { bookId: snap2.bookId, chapterId: snap2.chapterId }
      );

      setComparison(result);
    } catch (error) {
      alert(`Comparison Error: ${error.message}`);
    }
  };

  const revertSnapshot = async (snapshotId) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    if (!revertMode) {
      // Ask user which mode
      const choice = window.confirm(
        'How should this revert work?\n\n' +
        'OK = Affect all future chapters (linear timeline)\n' +
        'Cancel = Create new branch (parallel version)'
      );
      setRevertMode(choice ? 'affect' : 'branch');
    }

    try {
      const actor = actors.find(a => a.id === selectedActor);
      if (!actor) return;

      if (revertMode === 'affect') {
        // Update actor with snapshot data, affecting future - restore ALL fields
        const updatedActor = {
          ...actor,
          baseStats: snapshot.data.baseStats || actor.baseStats,
          additionalStats: snapshot.data.additionalStats || actor.additionalStats,
          activeSkills: snapshot.data.activeSkills || actor.activeSkills,
          inventory: snapshot.data.inventory || actor.inventory,
          equipment: snapshot.data.equipment || actor.equipment,
          biography: snapshot.data.biography !== undefined ? snapshot.data.biography : actor.biography,
          arcMilestones: snapshot.data.arcMilestones || actor.arcMilestones,
          appearances: snapshot.data.appearances || actor.appearances,
          role: snapshot.data.role !== undefined ? snapshot.data.role : actor.role,
          class: snapshot.data.class !== undefined ? snapshot.data.class : actor.class,
          desc: snapshot.data.desc !== undefined ? snapshot.data.desc : actor.desc
        };
        await db.update('actors', updatedActor);
        alert('Actor reverted. All future chapters will use this state.');
      } else {
        // Create branch
        const branchId = `branch_${Date.now()}`;
        const branchActor = {
          ...actor,
          id: `${actor.id}_${branchId}`,
          name: `${actor.name} (Branch)`,
          snapshots: { [snapshot.id]: snapshot.data }
        };
        await db.add('actors', branchActor);
        alert('Branch created. Original actor unchanged.');
      }
    } catch (error) {
      alert(`Revert Error: ${error.message}`);
    }
  };

  const getSnapshotLabel = (snapshot) => {
    return `Book ${snapshot.bookId}, Ch ${snapshot.chapterId}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <History className="mr-3 text-green-500" />
            VERSION CONTROL
          </h2>
          <p className="text-sm text-slate-400 mt-1">Timeline visualization and snapshot comparison</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <label className="text-xs text-slate-400 block mb-2">SELECT ACTOR</label>
            <select
              value={selectedActor || ''}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
            >
              {actors.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs text-slate-400 font-bold mb-3">SNAPSHOT TIMELINE</div>
            <div className="space-y-2">
              {snapshots.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedSnapshot1 === snapshot.id || selectedSnapshot2 === snapshot.id
                      ? 'bg-green-900/20 border-green-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                  onClick={() => {
                    if (!selectedSnapshot1) {
                      setSelectedSnapshot1(snapshot.id);
                    } else if (!selectedSnapshot2 && selectedSnapshot1 !== snapshot.id) {
                      setSelectedSnapshot2(snapshot.id);
                    } else {
                      setSelectedSnapshot1(snapshot.id);
                      setSelectedSnapshot2(null);
                    }
                  }}
                >
                  <div className="text-white font-bold text-sm">{getSnapshotLabel(snapshot)}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(snapshot.timestamp).toLocaleString()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      revertSnapshot(snapshot.id);
                    }}
                    className="mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    REVERT
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedSnapshot1 && selectedSnapshot2 ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">COMPARISON</h3>
                <div className="text-sm text-slate-400">
                  {getSnapshotLabel(snapshots.find(s => s.id === selectedSnapshot1))} vs {getSnapshotLabel(snapshots.find(s => s.id === selectedSnapshot2))}
                </div>
                <button
                  onClick={compareSnapshots}
                  className="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded"
                >
                  COMPARE
                </button>
              </div>

              {comparison && (
                <div className="space-y-4">
                  {/* Stat Changes */}
                  {comparison.stats && Object.keys(comparison.stats).length > 0 && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <div className="text-xs text-green-400 font-bold mb-3">STAT CHANGES</div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(comparison.stats).map(([stat, change]) => (
                          <div key={stat} className="bg-slate-950 p-3 rounded">
                            <div className="text-white font-bold">{stat}</div>
                            <div className="text-sm text-slate-400">
                              {change.from} → {change.to} ({change.diff > 0 ? '+' : ''}{change.diff})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Changes */}
                  {(comparison.skills.added.length > 0 || comparison.skills.removed.length > 0) && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <div className="text-xs text-blue-400 font-bold mb-3">SKILL CHANGES</div>
                      {comparison.skills.added.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm text-green-400">Added:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {comparison.skills.added.map((skill, i) => (
                              <span key={i} className="bg-green-900/30 text-green-300 text-xs px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {comparison.skills.removed.length > 0 && (
                        <div>
                          <div className="text-sm text-red-400">Removed:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {comparison.skills.removed.map((skill, i) => (
                              <span key={i} className="bg-red-900/30 text-red-300 text-xs px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Item Changes */}
                  {(comparison.items.added.length > 0 || comparison.items.removed.length > 0) && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <div className="text-xs text-yellow-400 font-bold mb-3">ITEM CHANGES</div>
                      {comparison.items.added.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm text-green-400">Added:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {comparison.items.added.map((item, i) => (
                              <span key={i} className="bg-green-900/30 text-green-300 text-xs px-2 py-1 rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {comparison.items.removed.length > 0 && (
                        <div>
                          <div className="text-sm text-red-400">Removed:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {comparison.items.removed.map((item, i) => (
                              <span key={i} className="bg-red-900/30 text-red-300 text-xs px-2 py-1 rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select two snapshots to compare</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionControl;

