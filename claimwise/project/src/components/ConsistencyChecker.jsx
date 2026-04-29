import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, RefreshCw, Sparkles, Filter, Download } from 'lucide-react';
import db from '../services/database';
import aiService from '../services/aiService';
import toastService from '../../services/toastService';

/**
 * Consistency Checker - AI-powered system to detect inconsistencies across the story
 */
const ConsistencyChecker = ({ actors, books, itemBank, skillBank, onClose }) => {
  const [issues, setIssues] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'character' | 'timeline' | 'world' | 'plot'
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolvedIssues, setResolvedIssues] = useState(new Set());

  useEffect(() => {
    loadResolvedIssues();
  }, []);

  const loadResolvedIssues = async () => {
    try {
      const saved = await db.getAll('resolvedIssues');
      setResolvedIssues(new Set(saved.map(i => i.id)));
    } catch (error) {
      console.error('Error loading resolved issues:', error);
    }
  };

  const markResolved = async (issueId) => {
    setResolvedIssues(prev => new Set([...prev, issueId]));
    try {
      await db.update('resolvedIssues', { id: issueId, resolvedAt: Date.now() });
    } catch (error) {
      // Store might not exist, that's okay
    }
    toastService.info('Issue marked as resolved');
  };

  const runConsistencyCheck = async () => {
    setIsChecking(true);
    setIssues([]);
    
    try {
      const allIssues = [];

      // Character Consistency Check
      if (actors && Array.isArray(actors)) {
        for (const actor of actors) {
          // Check for stat inconsistencies across chapters
          const chapters = books?.flatMap(book => book.chapters || []) || [];
          const actorMentions = chapters.filter(chapter => {
            const text = (chapter.script || chapter.desc || '').toLowerCase();
            return text.includes(actor.name.toLowerCase());
          });

          if (actorMentions.length > 0) {
            // Check for sudden stat changes without explanation
            const statChanges = [];
            // This would require comparing snapshots, simplified for now
            allIssues.push({
              id: `char_${actor.id}_stats`,
              type: 'character',
              severity: 'warning',
              title: `Character: ${actor.name}`,
              description: `Appears in ${actorMentions.length} chapters. Verify stat consistency.`,
              location: `Character: ${actor.name}`,
              suggestion: 'Review character snapshots across chapters for stat consistency.',
              entityId: actor.id,
              entityType: 'actor'
            });
          }
        }
      }

      // Timeline Consistency Check
      if (books && Array.isArray(books)) {
        const allChapters = books.flatMap(book => 
          (book.chapters || []).map(chapter => ({ ...chapter, bookTitle: book.title }))
        );
        
        // Check for duplicate chapter titles
        const titleCounts = {};
        allChapters.forEach(chapter => {
          titleCounts[chapter.title] = (titleCounts[chapter.title] || 0) + 1;
        });
        
        Object.entries(titleCounts).forEach(([title, count]) => {
          if (count > 1) {
            allIssues.push({
              id: `timeline_duplicate_${title}`,
              type: 'timeline',
              severity: 'warning',
              title: 'Duplicate Chapter Title',
              description: `Chapter title "${title}" appears ${count} times.`,
              location: 'Series Bible',
              suggestion: 'Consider renaming duplicate chapters for clarity.',
              entityId: null,
              entityType: 'chapter'
            });
          }
        });
      }

      // World Building Consistency
      if (itemBank && Array.isArray(itemBank)) {
        // Check for items with missing descriptions
        itemBank.forEach(item => {
          if (!item.desc || item.desc.trim().length < 10) {
            allIssues.push({
              id: `world_item_${item.id}`,
              type: 'world',
              severity: 'info',
              title: `Item: ${item.name}`,
              description: 'Item has minimal or missing description.',
              location: 'Item Vault',
              suggestion: 'Add detailed description for better world-building consistency.',
              entityId: item.id,
              entityType: 'item'
            });
          }
        });
      }

      // AI-Powered Deep Check
      try {
        const aiCheck = await aiService.checkConsistencyAuto(
          JSON.stringify({
            actors: actors?.map(a => ({ id: a.id, name: a.name, stats: a.baseStats })),
            books: books?.map(b => ({
              id: b.id,
              title: b.title,
              chapters: b.chapters?.map(c => ({ id: c.id, title: c.title, desc: c.desc }))
            })),
            items: itemBank?.map(i => ({ id: i.id, name: i.name, desc: i.desc })),
            skills: skillBank?.map(s => ({ id: s.id, name: s.name, desc: s.desc }))
          }),
          { actors, books, itemBank, skillBank }
        );

        // Parse AI response for additional issues
        if (aiCheck && typeof aiCheck === 'string') {
          // Try to extract structured issues from AI response
          const lines = aiCheck.split('\n');
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes('inconsistency') || 
                line.toLowerCase().includes('contradiction') ||
                line.toLowerCase().includes('issue')) {
              allIssues.push({
                id: `ai_issue_${Date.now()}_${index}`,
                type: 'plot',
                severity: 'warning',
                title: 'AI Detected Issue',
                description: line,
                location: 'Story-wide',
                suggestion: 'Review the identified inconsistency.',
                entityId: null,
                entityType: 'general'
              });
            }
          });
        }
      } catch (error) {
        console.error('AI consistency check error:', error);
        // Continue without AI check
      }

      setIssues(allIssues);
      toastService.success(`Found ${allIssues.length} potential issues`);
    } catch (error) {
      toastService.error('Consistency check failed: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (resolvedIssues.has(issue.id)) return false;
    if (filterType !== 'all' && issue.type !== filterType) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-900/20 border-red-500';
      case 'warning': return 'text-yellow-500 bg-yellow-900/20 border-yellow-500';
      case 'info': return 'text-blue-500 bg-blue-900/20 border-blue-500';
      default: return 'text-slate-500 bg-slate-900/20 border-slate-500';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const issueCounts = {
    all: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
    resolved: resolvedIssues.size
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-red-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <AlertTriangle className="mr-3 text-red-500" />
            CONSISTENCY CHECKER
          </h2>
          <p className="text-sm text-slate-400 mt-1">AI-powered inconsistency detection across your story</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={runConsistencyCheck}
            disabled={isChecking}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex items-center gap-2 disabled:opacity-50"
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isChecking ? 'CHECKING...' : 'RUN CHECK'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Filters & Stats */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-3">STATISTICS</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Issues:</span>
                <span className="text-white font-bold">{issueCounts.all}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Critical:</span>
                <span className="text-white font-bold">{issueCounts.critical}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">Warnings:</span>
                <span className="text-white font-bold">{issueCounts.warning}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">Info:</span>
                <span className="text-white font-bold">{issueCounts.info}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Resolved:</span>
                <span className="text-white font-bold">{issueCounts.resolved}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-3">FILTERS</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="character">Character</option>
                  <option value="timeline">Timeline</option>
                  <option value="world">World Building</option>
                  <option value="plot">Plot</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Issues List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {filteredIssues.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{issues.length === 0 ? 'Run a consistency check to find issues' : 'No issues match the current filters'}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {filteredIssues.map(issue => {
                  const Icon = getSeverityIcon(issue.severity);
                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`p-4 rounded border cursor-pointer ${
                        selectedIssue?.id === issue.id
                          ? 'bg-slate-800 border-slate-600'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                      } ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-sm font-bold text-white">{issue.title}</div>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                {issue.type}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mb-2">{issue.description}</div>
                            <div className="text-xs text-slate-500">Location: {issue.location}</div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markResolved(issue.id);
                          }}
                          className="text-green-500 hover:text-green-400 ml-2"
                          title="Mark as resolved"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Issue Details */}
        {selectedIssue && (
          <div className="w-96 border-l border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">ISSUE DETAILS</h3>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Title</div>
                <div className="text-white font-bold">{selectedIssue.title}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Type</div>
                <div className="text-white">{selectedIssue.type}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Severity</div>
                <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${getSeverityColor(selectedIssue.severity)}`}>
                  {selectedIssue.severity.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Description</div>
                <div className="text-white text-sm">{selectedIssue.description}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Location</div>
                <div className="text-white text-sm">{selectedIssue.location}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Suggestion</div>
                <div className="text-slate-300 text-sm bg-slate-900 p-3 rounded">{selectedIssue.suggestion}</div>
              </div>
              <button
                onClick={() => markResolved(selectedIssue.id)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                MARK AS RESOLVED
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsistencyChecker;

