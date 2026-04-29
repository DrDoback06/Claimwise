import React, { useState, useEffect } from 'react';
import {
  FileText, Upload, X, Save, History, Trash2, Eye, Edit3,
  Sparkles, BookOpen, Globe, Folder, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Clock, RefreshCw
} from 'lucide-react';
import styleReferenceService from '../services/styleReferenceService';
import toastService from '../services/toastService';

/**
 * Style Reference Manager
 * Allows users to input, analyze, and manage writing style documents
 */
const StyleReferenceManager = ({ projectId = null, onClose, compact = false }) => {
  const [styleReferences, setStyleReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Input state
  const [showInput, setShowInput] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [inputType, setInputType] = useState('examples');
  const [inputScope, setInputScope] = useState(projectId ? 'project' : 'global');
  
  // View state
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [viewingVersions, setViewingVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [viewingPatterns, setViewingPatterns] = useState(false);
  const [patterns, setPatterns] = useState(null);

  useEffect(() => {
    loadStyleReferences();
  }, [projectId]);

  const [migrationNeeded, setMigrationNeeded] = useState(false);

  const loadStyleReferences = async () => {
    setLoading(true);
    setMigrationNeeded(false);
    try {
      const refs = await styleReferenceService.getStyleReferences(null, projectId);
      setStyleReferences(refs);
    } catch (error) {
      console.error('Error loading style references:', error);
      if (error.message?.includes('DATABASE_MIGRATION_NEEDED') || 
          error.message?.includes('Database stores not found') || 
          error.message?.includes('migration')) {
        setMigrationNeeded(true);
        toastService.error('Database needs update. Please refresh the page.');
      } else {
        toastService.error('Failed to load style references');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!inputName.trim() || !inputContent.trim()) {
      toastService.error('Please provide a name and content');
      return;
    }

    setSaving(true);
    try {
      await styleReferenceService.saveStyleReference({
        name: inputName.trim(),
        content: inputContent.trim(),
        type: inputType,
        scope: inputScope,
        projectId: inputScope === 'project' ? projectId : null
      });

      toastService.success('Style reference saved and analyzed!');
      setInputName('');
      setInputContent('');
      setShowInput(false);
      await loadStyleReferences();
    } catch (error) {
      console.error('Error saving style reference:', error);
      if (error.message?.includes('DATABASE_MIGRATION_NEEDED') || 
          error.message?.includes('Database stores not found') || 
          error.message?.includes('migration')) {
        setMigrationNeeded(true);
        toastService.error('Database needs update. Please refresh the page to continue.');
      } else {
        toastService.error('Failed to save style reference: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleViewVersions = async (styleId) => {
    try {
      const vers = await styleReferenceService.getStyleVersions(styleId);
      setVersions(vers);
      setSelectedStyle(styleId);
      setViewingVersions(true);
    } catch (error) {
      console.error('Error loading versions:', error);
      toastService.error('Failed to load version history');
    }
  };

  const handleViewPatterns = async (styleId) => {
    try {
      const pats = await styleReferenceService.getStylePatterns(styleId);
      setPatterns(pats);
      setSelectedStyle(styleId);
      setViewingPatterns(true);
    } catch (error) {
      console.error('Error loading patterns:', error);
      toastService.error('Failed to load style patterns');
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Restore this version? This will create a new version from this content.')) {
      return;
    }

    try {
      await styleReferenceService.restoreStyleVersion(selectedStyle, versionId);
      toastService.success('Version restored!');
      await loadStyleReferences();
      setViewingVersions(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      toastService.error('Failed to restore version');
    }
  };

  const handleDelete = async (styleId) => {
    if (!window.confirm('Delete this style reference? Version history will be preserved.')) {
      return;
    }

    try {
      await styleReferenceService.deleteStyleReference(styleId);
      toastService.success('Style reference deleted');
      await loadStyleReferences();
    } catch (error) {
      console.error('Error deleting style reference:', error);
      toastService.error('Failed to delete style reference');
    }
  };

  const wordCount = inputContent.split(/\s+/).filter(w => w).length;
  const charCount = inputContent.length;

  if (compact) {
    return (
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Style References
          </h3>
          <button
            onClick={() => setShowInput(!showInput)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm"
          >
            {showInput ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showInput && (
          <div className="mb-4 p-4 bg-slate-800 rounded border border-slate-700">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Reference name (e.g., 'My Writing Examples')"
              className="w-full mb-3 p-2 bg-slate-950 border border-slate-600 rounded text-white"
            />
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Paste your writing examples, style guide, or reference material here..."
              className="w-full h-48 p-3 bg-slate-950 border border-slate-600 rounded text-white resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {wordCount.toLocaleString()} words • {charCount.toLocaleString()} chars
              </span>
              <button
                onClick={handleSave}
                disabled={saving || !inputName.trim() || !inputContent.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-sm"
              >
                {saving ? 'Saving...' : 'Save & Analyze'}
              </button>
            </div>
          </div>
        )}

        {migrationNeeded && (
          <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Database Update Required</span>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              Please refresh the page to update the database.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm 
                flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Page
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : migrationNeeded ? (
          <div className="text-center py-4 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
            <p className="text-xs">Refresh to continue</p>
          </div>
        ) : styleReferences.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No style references yet</p>
            <p className="text-xs mt-1">Add examples of your writing to improve AI style matching</p>
          </div>
        ) : (
          <div className="space-y-2">
            {styleReferences.map(style => (
              <div key={style.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{style.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        style.scope === 'global' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {style.scope === 'global' ? <Globe className="w-3 h-3 inline" /> : <Folder className="w-3 h-3 inline" />}
                        {style.scope}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">{style.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Updated {new Date(style.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewPatterns(style.id)}
                      className="p-1.5 hover:bg-slate-700 rounded"
                      title="View extracted patterns"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleViewVersions(style.id)}
                      className="p-1.5 hover:bg-slate-700 rounded"
                      title="View version history"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-400" />
              Style Reference Manager
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Add writing examples, style guides, or reference material to improve AI style matching
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Add New */}
        <div className="mb-6">
          <button
            onClick={() => setShowInput(!showInput)}
            className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 
              flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Upload className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white">Add Style Reference</div>
                <div className="text-xs text-slate-500">Paste examples, guides, or reference material</div>
              </div>
            </div>
            {showInput ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showInput && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g., 'My Writing Examples' or 'Comedy Style Guide'"
                    className="w-full p-2 bg-slate-950 border border-slate-600 rounded text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                    <select
                      value={inputType}
                      onChange={(e) => setInputType(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-600 rounded text-white"
                    >
                      <option value="examples">Writing Examples</option>
                      <option value="guide">Style Guide</option>
                      <option value="reference">Reference Material</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Scope</label>
                    <select
                      value={inputScope}
                      onChange={(e) => setInputScope(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-600 rounded text-white"
                    >
                      <option value="global">Global (All Projects)</option>
                      {projectId && <option value="project">This Project Only</option>}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Content
                    <span className="ml-2 text-xs text-slate-500 font-normal">
                      (Paste your writing examples, style guide, or reference material)
                    </span>
                  </label>
                  <textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder="Paste your writing examples, style guide, or reference material here...

The AI will analyze this to understand:
• Your writing tone and voice
• Comedy/humor style
• Pacing and sentence structure
• Dialogue patterns
• Description style
• Character voice differences
• Vocabulary and formality

You can paste entire chapters, excerpts, or style notes."
                    className="w-full h-64 p-3 bg-slate-950 border border-slate-600 rounded text-white 
                      font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      {wordCount.toLocaleString()} words • {charCount.toLocaleString()} characters
                    </span>
                    <button
                      onClick={handleSave}
                      disabled={saving || !inputName.trim() || !inputContent.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 
                        text-white rounded font-medium flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Save & Analyze
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Migration Notice */}
        {migrationNeeded && (
          <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-amber-400 mb-1">Database Update Required</h4>
                <p className="text-sm text-slate-300 mb-3">
                  The database needs to be updated to support style references. This will happen automatically when you refresh the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium 
                    flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Style References List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading style references...</div>
        ) : migrationNeeded ? (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-amber-400" />
            <p>Please refresh the page to continue</p>
          </div>
        ) : styleReferences.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-400 mb-2">No style references yet</p>
            <p className="text-sm text-slate-600">
              Add examples of your writing to help the AI match your style better
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {styleReferences.map(style => (
              <div key={style.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-white">{style.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        style.scope === 'global' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {style.scope === 'global' ? <Globe className="w-3 h-3 inline mr-1" /> : <Folder className="w-3 h-3 inline mr-1" />}
                        {style.scope}
                      </span>
                      <span className="text-xs text-slate-500 capitalize px-2 py-0.5 bg-slate-700 rounded">
                        {style.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Last updated {new Date(style.updatedAt).toLocaleDateString()} at {new Date(style.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewPatterns(style.id)}
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                      title="View extracted style patterns"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleViewVersions(style.id)}
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                      title="View version history"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(style.id)}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete style reference"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patterns Modal */}
      {viewingPatterns && patterns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] mx-4 bg-slate-900 rounded-xl border border-purple-500/50 
            shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Extracted Style Patterns
              </h3>
              <button
                onClick={() => {
                  setViewingPatterns(false);
                  setPatterns(null);
                }}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(patterns).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-800 rounded border border-slate-700">
                  <div className="text-xs uppercase text-slate-500 font-semibold mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-slate-300">
                    {Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-1">
                        {value.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {viewingVersions && versions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] mx-4 bg-slate-900 rounded-xl border border-slate-700 
            shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Version History
              </h3>
              <button
                onClick={() => {
                  setViewingVersions(false);
                  setVersions([]);
                }}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {versions.map(version => (
                <div key={version.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-white">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                      {version.restoredFrom && (
                        <span className="text-xs text-blue-400">(Restored)</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(version.id)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm"
                    >
                      Restore
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    {version.wordCount.toLocaleString()} words • {version.charCount.toLocaleString()} chars
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleReferenceManager;
