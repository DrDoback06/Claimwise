import React, { useState } from 'react';
import { 
  ChevronUp, ChevronDown, Check, X, Lock, 
  Trash2, CheckCircle, AlertCircle, Edit3,
  Undo2, Clock, Sparkles
} from 'lucide-react';

/**
 * ChangeSummaryDrawer - Bottom slide-up panel showing all tracked changes
 * 
 * Features:
 * - Shows count of pending/locked changes
 * - Mini-map of where changes are in document
 * - Batch accept/reject operations
 * - Quick navigation to changes
 */
const ChangeSummaryDrawer = ({
  changes = [], // Array of { id, type, content, position, source }
  onAccept,
  onReject,
  onLock,
  onAcceptAll,
  onRejectAll,
  onAcceptAllLocked,
  onNavigateToChange,
  onUndo,
  undoStack = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState(new Set());

  // Count changes by type
  const pendingChanges = changes.filter(c => c.type === 'pending');
  const lockedChanges = changes.filter(c => c.type === 'locked');
  const userEditChanges = changes.filter(c => c.type === 'userEdit');
  const totalPending = pendingChanges.length + userEditChanges.length;

  // Toggle change selection
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedChanges);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedChanges(newSelection);
  };

  // Select all pending
  const selectAllPending = () => {
    const pendingIds = new Set(pendingChanges.map(c => c.id));
    setSelectedChanges(pendingIds);
  };

  // Accept selected
  const acceptSelected = () => {
    selectedChanges.forEach(id => onAccept?.(id));
    setSelectedChanges(new Set());
  };

  // Reject selected
  const rejectSelected = () => {
    selectedChanges.forEach(id => onReject?.(id));
    setSelectedChanges(new Set());
  };

  // Get source icon
  const getSourceIcon = (source) => {
    const icons = {
      'continue': '✏️',
      'scene': '🎬',
      'dialogue': '💬',
      'description': '🎨',
      'character': '👤',
      'rewrite': '🔄',
      'mood-rewrite': '🎭',
      'user': '✍️'
    };
    return icons[source] || '✨';
  };

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'pending': return 'amber';
      case 'locked': return 'emerald';
      case 'userEdit': return 'blue';
      default: return 'slate';
    }
  };

  // Collapsed summary bar
  const renderCollapsedBar = () => (
    <button
      onClick={() => setIsExpanded(true)}
      className="w-full flex items-center justify-between px-4 py-2 
        bg-slate-800 hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-4">
        <ChevronUp className="w-4 h-4 text-slate-400" />
        
        <div className="flex items-center gap-3 text-sm">
          {totalPending > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {totalPending} pending
            </span>
          )}
          
          {lockedChanges.length > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Lock className="w-3 h-3" />
              {lockedChanges.length} locked
            </span>
          )}
          
          {changes.length === 0 && (
            <span className="text-slate-500">No tracked changes</span>
          )}
        </div>
      </div>
      
      {/* Quick actions when collapsed */}
      {totalPending > 0 && (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAcceptAll?.();
            }}
            className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400 
              hover:bg-green-600/40 transition-colors"
          >
            Accept All
          </button>
        </div>
      )}
    </button>
  );

  // Expanded drawer
  const renderExpandedDrawer = () => (
    <div className="bg-slate-900 border-t border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <span className="font-medium text-white text-sm">Tracked Changes</span>
          
          <div className="flex items-center gap-2 text-xs">
            {totalPending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                {totalPending} pending
              </span>
            )}
            {lockedChanges.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {lockedChanges.length} locked
              </span>
            )}
          </div>
        </div>
        
        {/* Batch actions */}
        <div className="flex items-center gap-2">
          {selectedChanges.size > 0 && (
            <>
              <span className="text-xs text-slate-400">{selectedChanges.size} selected</span>
              <button
                onClick={acceptSelected}
                className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400 
                  hover:bg-green-600/40 transition-colors"
              >
                <Check className="w-3 h-3 inline mr-1" />
                Accept
              </button>
              <button
                onClick={rejectSelected}
                className="px-2 py-1 text-xs rounded bg-red-600/20 text-red-400 
                  hover:bg-red-600/40 transition-colors"
              >
                <X className="w-3 h-3 inline mr-1" />
                Reject
              </button>
            </>
          )}
          
          {lockedChanges.length > 0 && (
            <button
              onClick={onAcceptAllLocked}
              className="px-2 py-1 text-xs rounded bg-emerald-600/20 text-emerald-400 
                hover:bg-emerald-600/40 transition-colors"
            >
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Accept All Locked
            </button>
          )}
          
          {undoStack.length > 0 && (
            <button
              onClick={onUndo}
              className="px-2 py-1 text-xs rounded bg-slate-600/20 text-slate-300 
                hover:bg-slate-600/40 transition-colors"
            >
              <Undo2 className="w-3 h-3 inline mr-1" />
              Undo
            </button>
          )}
        </div>
      </div>
      
      {/* Changes list */}
      <div className="max-h-64 overflow-y-auto">
        {changes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm">No tracked changes</span>
            <span className="text-xs">AI-generated content will appear here for review</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {changes.map((change) => (
              <div
                key={change.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors
                  ${selectedChanges.has(change.id) ? 'bg-slate-800' : ''}`}
              >
                {/* Selection checkbox */}
                <input
                  type="checkbox"
                  checked={selectedChanges.has(change.id)}
                  onChange={() => toggleSelection(change.id)}
                  className="mt-1 rounded border-slate-600 text-amber-500 
                    focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                
                {/* Change info */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onNavigateToChange?.(change.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{getSourceIcon(change.source)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded 
                      bg-${getTypeColor(change.type)}-500/20 text-${getTypeColor(change.type)}-400`}>
                      {change.type}
                    </span>
                    {change.confidence && change.confidence !== 'high' && (
                      <span className={`text-xs ${
                        change.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {change.confidence === 'medium' ? '◐' : '○'} {change.confidence}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-300 truncate">
                    {change.content?.substring(0, 100)}
                    {change.content?.length > 100 ? '...' : ''}
                  </p>
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAccept?.(change.id)}
                    className="p-1.5 rounded hover:bg-green-600/20 text-slate-400 
                      hover:text-green-400 transition-colors"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onReject?.(change.id)}
                    className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 
                      hover:text-red-400 transition-colors"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {change.type !== 'locked' && (
                    <button
                      onClick={() => onLock?.(change.id)}
                      className="p-1.5 rounded hover:bg-emerald-600/20 text-slate-400 
                        hover:text-emerald-400 transition-colors"
                      title="Lock"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer with keyboard hints */}
      <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700 text-xs text-slate-500">
        <span className="mr-4">Click change to navigate</span>
        <span className="mr-4">Shift+Click for multi-select</span>
        <span>Shortcuts: A=Accept R=Reject L=Lock</span>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {isExpanded ? renderExpandedDrawer() : renderCollapsedBar()}
    </div>
  );
};

export default ChangeSummaryDrawer;
