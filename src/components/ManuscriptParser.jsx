import React, { useState } from 'react';
import { FileText, Wand2, Check, X, AlertCircle, Eye, Edit3, Save, Zap } from 'lucide-react';
import aiService from '../services/aiService';

/**
 * Manuscript Parser - AI + Manual Hybrid System
 * Automatically detects actor updates from manuscript text
 */
const ManuscriptParser = ({ actors, onApplyUpdates, onClose }) => {
  const [manuscriptText, setManuscriptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResults, setParseResults] = useState(null);
  const [selectedUpdates, setSelectedUpdates] = useState(new Set());
  const [manualEdits, setManualEdits] = useState({});

  /**
   * Parse manuscript using AI
   */
  const parseManuscript = async () => {
    if (!manuscriptText.trim()) {
      alert('Please paste manuscript text first');
      return;
    }

    setIsParsing(true);
    try {
      const result = await aiService.parseManuscript(manuscriptText, actors);
      setParseResults(result);

      // Auto-select all high-confidence updates
      const highConfidence = new Set();
      result.updates?.forEach((update, index) => {
        if (update.confidence >= 0.7) {
          highConfidence.add(index);
        }
      });
      setSelectedUpdates(highConfidence);
    } catch (error) {
      alert(`Parsing Error: ${error.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  /**
   * Toggle update selection
   */
  const toggleUpdate = (index) => {
    setSelectedUpdates(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /**
   * Edit update manually
   */
  const editUpdate = (index, field, value) => {
    setManualEdits(prev => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [field]: value
      }
    }));
  };

  /**
   * Apply selected updates
   */
  const applyUpdates = () => {
    const updatesToApply = [];

    parseResults.updates.forEach((update, index) => {
      if (selectedUpdates.has(index)) {
        // Merge manual edits
        const finalUpdate = {
          ...update,
          ...(manualEdits[index] || {})
        };
        updatesToApply.push(finalUpdate);
      }
    });

    if (updatesToApply.length === 0) {
      alert('No updates selected');
      return;
    }

    onApplyUpdates(updatesToApply);
    alert(`Applied ${updatesToApply.length} updates to actors`);
    onClose();
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400 bg-green-900/20 border-green-800';
    if (confidence >= 0.6) return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
    return 'text-red-400 bg-red-900/20 border-red-800';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FileText className="mr-3 text-purple-400" />
            MANUSCRIPT PARSER
          </h2>
          <p className="text-sm text-slate-400 mt-1">AI + Manual hybrid system for extracting actor updates</p>
        </div>

        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Input */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col">
          <div className="bg-slate-950 p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">MANUSCRIPT TEXT</h3>
            <p className="text-xs text-slate-400">
              Paste chapter text below. AI will extract stat changes, skill acquisitions, item gains, etc.
            </p>
          </div>

          <div className="flex-1 p-4">
            <textarea
              value={manuscriptText}
              onChange={(e) => setManuscriptText(e.target.value)}
              placeholder="Paste your manuscript text here...

Example:
'Grimguff felt his strength surge as he lifted the massive sword. His STR increased by 15 points. He also learned the skill Manual Handling, allowing him to wield two-handed weapons in one hand...'
"
              className="w-full h-full bg-slate-950 border border-slate-700 rounded p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="bg-slate-950 p-4 border-t border-slate-800">
            <button
              onClick={parseManuscript}
              disabled={isParsing || !manuscriptText.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <Wand2 className="w-5 h-5 animate-spin" />
                  PARSING WITH AI...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  PARSE MANUSCRIPT
                </>
              )}
            </button>

            <div className="mt-3 text-xs text-slate-400">
              Characters: {manuscriptText.length} • Words: {manuscriptText.split(/\s+/).filter(w => w).length}
            </div>
          </div>
        </div>

        {/* Right panel: Results */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-slate-950 p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">DETECTED UPDATES</h3>
            <p className="text-xs text-slate-400">
              Review AI-detected changes. Edit if needed, then select which ones to apply.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!parseResults && (
              <div className="text-center text-slate-500 mt-20">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Parse results will appear here</p>
              </div>
            )}

            {parseResults?.error && (
              <div className="bg-red-900/20 border border-red-800 rounded p-4 text-red-400">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                {parseResults.error}
              </div>
            )}

            {parseResults?.updates?.length === 0 && (
              <div className="bg-yellow-900/20 border border-yellow-800 rounded p-4 text-yellow-400">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                No actor updates detected in this text
              </div>
            )}

            {parseResults?.updates?.map((update, index) => {
              const isSelected = selectedUpdates.has(index);
              const edits = manualEdits[index] || {};
              const actor = actors.find(a => a.id === update.actorId);

              return (
                <div
                  key={index}
                  className={`bg-slate-900 border-2 rounded-lg p-4 transition-all ${
                    isSelected ? 'border-purple-500 shadow-purple-500/20' : 'border-slate-800'
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUpdate(index)}
                        className="w-5 h-5"
                      />
                      <div>
                        <div className="text-white font-bold">
                          {actor?.name || update.actorName || 'Unknown Actor'}
                        </div>
                        <div className="text-xs text-slate-400">ID: {update.actorId}</div>
                      </div>
                    </div>

                    <div className={`px-2 py-1 rounded text-xs font-bold border ${getConfidenceColor(update.confidence)}`}>
                      {(update.confidence * 100).toFixed(0)}% Confidence
                    </div>
                  </div>

                  {/* Changes */}
                  {update.changes && (
                    <div className="space-y-2">
                      {/* Stat changes */}
                      {update.changes.stats && Object.keys(update.changes.stats).length > 0 && (
                        <div className="bg-slate-950 rounded p-3">
                          <div className="text-xs text-green-500 font-bold mb-2 flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            STAT CHANGES
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(edits.stats || update.changes.stats).map(([stat, value]) => (
                              <div key={stat} className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{stat}:</span>
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => editUpdate(index, 'stats', {
                                    ...(edits.stats || update.changes.stats),
                                    [stat]: parseInt(e.target.value)
                                  })}
                                  className="w-16 bg-slate-900 border border-slate-700 text-white text-xs p-1 rounded"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {update.changes.skills && update.changes.skills.length > 0 && (
                        <div className="bg-slate-950 rounded p-3">
                          <div className="text-xs text-blue-500 font-bold mb-2">SKILLS GAINED</div>
                          <div className="flex flex-wrap gap-2">
                            {(edits.skills || update.changes.skills).map((skill, i) => (
                              <span key={i} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded border border-blue-800">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      {update.changes.items && update.changes.items.length > 0 && (
                        <div className="bg-slate-950 rounded p-3">
                          <div className="text-xs text-yellow-500 font-bold mb-2">ITEMS GAINED</div>
                          <div className="flex flex-wrap gap-2">
                            {(edits.items || update.changes.items).map((item, i) => (
                              <span key={i} className="bg-yellow-900/30 text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-800">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Level */}
                      {update.changes.level && (
                        <div className="bg-slate-950 rounded p-3">
                          <div className="text-xs text-purple-500 font-bold mb-1">LEVEL</div>
                          <input
                            type="number"
                            value={edits.level || update.changes.level}
                            onChange={(e) => editUpdate(index, 'level', parseInt(e.target.value))}
                            className="w-20 bg-slate-900 border border-slate-700 text-white p-1 rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text evidence */}
                  {update.textEvidence && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-xs text-slate-500 italic">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        "{update.textEvidence}"
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Apply button */}
          {parseResults?.updates?.length > 0 && (
            <div className="bg-slate-950 p-4 border-t border-slate-800">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedUpdates(new Set())}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
                >
                  DESELECT ALL
                </button>

                <button
                  onClick={() => {
                    const all = new Set();
                    parseResults.updates.forEach((_, i) => all.add(i));
                    setSelectedUpdates(all);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
                >
                  SELECT ALL
                </button>

                <button
                  onClick={applyUpdates}
                  disabled={selectedUpdates.size === 0}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  APPLY {selectedUpdates.size} SELECTED UPDATE{selectedUpdates.size !== 1 ? 'S' : ''}
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-400 text-center">
                {selectedUpdates.size} of {parseResults.updates.length} updates selected
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManuscriptParser;
