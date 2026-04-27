import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, RefreshCw, Sparkles, Filter, Download, Zap, Settings, FileText, Target } from 'lucide-react';
import db from '../services/database';
import aiService from '../services/aiService';
import toastService from '../services/toastService';

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

  // ---- Enhancements ----
  const [aiFixes, setAiFixes] = useState({}); // { issueId: 'suggestion text' }
  const [loadingFix, setLoadingFix] = useState(null); // issueId being fetched
  const [customRules, setCustomRules] = useState([]); // [{ id, rule }]
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [resolvedHistory, setResolvedHistory] = useState([]); // [{ id, resolvedAt, title }]

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

  // ---- Enhancement: Story Health Score ----
  const getHealthScore = () => {
    if (issues.length === 0) return 100;
    const criticals = issues.filter(i => i.severity === 'critical' && !resolvedIssues.has(i.id)).length;
    const warnings = issues.filter(i => i.severity === 'warning' && !resolvedIssues.has(i.id)).length;
    const infos = issues.filter(i => i.severity === 'info' && !resolvedIssues.has(i.id)).length;
    const penalty = (criticals * 10) + (warnings * 3) + (infos * 1);
    return Math.max(0, 100 - penalty);
  };

  // ---- Enhancement: AI Fix Suggestion ----
  const getAIFix = async (issue) => {
    if (aiFixes[issue.id] || loadingFix === issue.id) return;
    setLoadingFix(issue.id);
    try {
      const system = 'You are a story editor. Given a consistency issue, suggest a specific, actionable fix in 1-2 sentences.';
      const prompt = `Issue: "${issue.title}"\nDescription: "${issue.description}"\nLocation: "${issue.location}"\n\nSuggest a concrete fix:`;
      const fix = await aiService.callAI(prompt, 'analytical', system);
      if (fix) setAiFixes(prev => ({ ...prev, [issue.id]: fix.trim() }));
    } catch (e) {
      console.warn('AI fix failed:', e);
    } finally {
      setLoadingFix(null);
    }
  };

  // ---- Enhancement: Export issues as CSV ----
  const exportCSV = () => {
    const header = 'ID,Type,Severity,Title,Description,Location,Resolved';
    const rows = issues.map(i =>
      `"${i.id}","${i.type}","${i.severity}","${i.title.replace(/"/g, '""')}","${(i.description || '').replace(/"/g, '""')}","${i.location}","${resolvedIssues.has(i.id) ? 'Yes' : 'No'}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consistency_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastService.success('Exported consistency report as CSV');
  };

  // ---- Enhancement: Custom rules check ----
  const runCustomRulesCheck = (allIssues) => {
    customRules.forEach(rule => {
      allIssues.push({
        id: `custom_${rule.id}`,
        type: 'custom',
        severity: 'warning',
        title: 'Custom Rule',
        description: `Custom rule: "${rule.rule}"`,
        location: 'Story-wide',
        suggestion: 'Review this custom rule against your story content.',
        entityId: null,
        entityType: 'general'
      });
    });
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

      // Run custom rules
      runCustomRulesCheck(allIssues);

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
        <div className="flex items-center gap-3 flex-wrap">
          {issues.length > 0 && (
            <div className="flex flex-col items-center">
              <div className={`text-3xl font-black ${getHealthScore() >= 80 ? 'text-green-400' : getHealthScore() >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {getHealthScore()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">Story Health</div>
            </div>
          )}
          <button
            onClick={() => setShowCustomRules(v => !v)}
            className={`px-3 py-2 text-sm rounded flex items-center gap-2 border ${showCustomRules ? 'bg-purple-900 border-purple-500 text-purple-200' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
          >
            <Settings className="w-4 h-4" />
            Custom Rules ({customRules.length})
          </button>
          {issues.length > 0 && (
            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-2 text-sm border border-slate-600"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
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

      {/* ---- Enhancement: Custom Rules Builder ---- */}
      {showCustomRules && (
        <div className="bg-purple-950/40 border-b border-purple-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2"><Settings className="w-4 h-4" /> Custom Consistency Rules</h3>
            <button onClick={() => setShowCustomRules(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={newRuleText}
              onChange={e => setNewRuleText(e.target.value)}
              placeholder='e.g. "Character X never uses magic before Act 2"'
              className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:border-purple-500"
              onKeyDown={e => {
                if (e.key === 'Enter' && newRuleText.trim()) {
                  setCustomRules(prev => [...prev, { id: Date.now(), rule: newRuleText.trim() }]);
                  setNewRuleText('');
                }
              }}
            />
            <button
              onClick={() => {
                if (newRuleText.trim()) {
                  setCustomRules(prev => [...prev, { id: Date.now(), rule: newRuleText.trim() }]);
                  setNewRuleText('');
                }
              }}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-sm"
            >Add</button>
          </div>
          {customRules.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customRules.map(r => (
                <div key={r.id} className="flex items-center gap-1 bg-purple-900/40 border border-purple-700 rounded px-2 py-1 text-xs text-purple-200">
                  <span>{r.rule}</span>
                  <button onClick={() => setCustomRules(prev => prev.filter(x => x.id !== r.id))} className="text-red-400 hover:text-red-300 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              {/* ---- Enhancement: AI Fix button ---- */}
              <div>
                <div className="text-xs text-slate-400 mb-1">AI Fix Suggestion</div>
                {aiFixes[selectedIssue.id] ? (
                  <div className="text-green-300 text-sm bg-green-900/20 border border-green-700 p-3 rounded">
                    {aiFixes[selectedIssue.id]}
                  </div>
                ) : (
                  <button
                    onClick={() => getAIFix(selectedIssue)}
                    disabled={loadingFix === selectedIssue.id}
                    className="w-full bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-700 text-white py-2 rounded flex items-center justify-center gap-2 text-sm"
                  >
                    {loadingFix === selectedIssue.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {loadingFix === selectedIssue.id ? 'Getting AI fix...' : 'Get AI Fix'}
                  </button>
                )}
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

