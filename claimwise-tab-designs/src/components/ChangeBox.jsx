import React, { useState, useRef, useEffect, memo } from 'react';
import { Check, X, Lock, RefreshCw, Edit3, Unlock } from 'lucide-react';

/**
 * ChangeBox - A tracked change container for AI-generated or edited content
 * 
 * States:
 * - pending: Orange border, AI content awaiting review
 * - locked: Dark green border, soft-accepted but reversible
 * - userEdit: Blue border, user edits within a change box
 * - accepted: No visual treatment (removed from tracking)
 */
const ChangeBox = memo(({
  id,
  type = 'pending', // 'pending' | 'locked' | 'userEdit'
  children,
  content,
  originalContent = null, // For showing what was replaced
  onAccept,
  onReject,
  onLock,
  onUnlock,
  onRegenerate,
  onEdit,
  onContentChange,
  isNested = false, // True if this is a user edit inside another box
  confidence = 'high', // 'high' | 'medium' | 'low'
  source = 'ai', // 'ai' | 'user' | 'mood-rewrite'
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const boxRef = useRef(null);
  const editRef = useRef(null);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus edit area when editing starts
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [isEditing]);

  // Keyboard shortcuts when selected
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e) => {
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey && !isEditing) {
        e.preventDefault();
        onAccept?.(id);
      } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !isEditing) {
        e.preventDefault();
        onReject?.(id);
      } else if (e.key === 'l' && !e.ctrlKey && !e.metaKey && !isEditing) {
        e.preventDefault();
        if (type === 'locked') {
          onUnlock?.(id);
        } else {
          onLock?.(id);
        }
      } else if (e.key === 'Escape') {
        setIsSelected(false);
        setIsEditing(false);
      } else if (e.key === 'e' && !isEditing) {
        e.preventDefault();
        setIsEditing(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, type, id, onAccept, onReject, onLock, onUnlock]);

  // Get styles based on type
  const getBoxStyles = () => {
    const baseStyles = `
      relative rounded-lg my-2 transition-all duration-200
      ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}
    `;

    switch (type) {
      case 'pending':
        return `${baseStyles} 
          border-2 border-amber-500/70 bg-amber-500/5
          ${isSelected ? 'ring-amber-400' : ''}
          hover:border-amber-400`;
      
      case 'locked':
        return `${baseStyles} 
          border-2 border-emerald-700 bg-transparent
          ${isSelected ? 'ring-emerald-600' : ''}
          hover:border-emerald-600`;
      
      case 'userEdit':
        return `${baseStyles} 
          border-2 border-blue-500/70 bg-blue-500/5
          ${isSelected ? 'ring-blue-400' : ''}
          hover:border-blue-400
          ${isNested ? 'ml-2 mr-2' : ''}`;
      
      default:
        return baseStyles;
    }
  };

  // Get confidence badge
  const getConfidenceBadge = () => {
    if (type !== 'pending') return null;
    
    const badges = {
      high: { color: 'bg-green-500', label: '●' },
      medium: { color: 'bg-yellow-500', label: '●' },
      low: { color: 'bg-red-500', label: '●' }
    };
    
    const badge = badges[confidence] || badges.high;
    
    return (
      <span 
        className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${badge.color}`}
        title={`${confidence} confidence`}
      />
    );
  };

  // Handle content editing
  const handleEditBlur = () => {
    if (editedContent !== content) {
      onContentChange?.(id, editedContent);
    }
    setIsEditing(false);
  };

  // Render lock icon for locked state
  const renderLockIcon = () => {
    if (type !== 'locked') return null;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsSelected(true);
        }}
        className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-900 border border-emerald-700 
          text-emerald-700 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
        title="Click to show options"
      >
        <Lock className="w-3 h-3" />
      </button>
    );
  };

  // Render action toolbar
  const renderToolbar = () => {
    if (!isSelected) return null;

    return (
      <div 
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 
          flex items-center gap-1 px-2 py-1 
          bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50
          animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        <button
          onClick={() => onAccept?.(id)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
            bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors"
          title="Accept (A)"
        >
          <Check className="w-3 h-3" />
          Accept
        </button>
        
        <button
          onClick={() => onReject?.(id)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
            bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
          title="Reject (R)"
        >
          <X className="w-3 h-3" />
          Reject
        </button>
        
        {type === 'locked' ? (
          <button
            onClick={() => onUnlock?.(id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
              bg-slate-600/20 text-slate-300 hover:bg-slate-600/40 transition-colors"
            title="Unlock (L)"
          >
            <Unlock className="w-3 h-3" />
            Unlock
          </button>
        ) : (
          <button
            onClick={() => onLock?.(id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
              bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors"
            title="Lock (L)"
          >
            <Lock className="w-3 h-3" />
            Lock
          </button>
        )}
        
        {type === 'pending' && (
          <button
            onClick={() => onRegenerate?.(id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
              bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
        
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
            bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
          title="Edit (E)"
        >
          <Edit3 className="w-3 h-3" />
        </button>

        {/* Keyboard hints */}
        <div className="ml-2 pl-2 border-l border-slate-600 text-[10px] text-slate-500">
          A/R/L/E
        </div>
      </div>
    );
  };

  // Render source label
  const getSourceLabel = () => {
    const labels = {
      'ai': 'AI Generated',
      'continue': 'AI Continue',
      'scene': 'AI Scene',
      'dialogue': 'AI Dialogue',
      'character': 'AI Character',
      'description': 'AI Description',
      'rewrite': 'AI Rewrite',
      'mood-rewrite': 'Mood Rewrite',
      'user': 'Your Edit'
    };
    return labels[source] || 'AI';
  };

  return (
    <div
      ref={boxRef}
      className={getBoxStyles()}
      onClick={() => setIsSelected(true)}
    >
      {/* Confidence badge */}
      {getConfidenceBadge()}
      
      {/* Lock icon for locked state */}
      {renderLockIcon()}
      
      {/* Toolbar */}
      {renderToolbar()}
      
      {/* Source label */}
      {type === 'pending' && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-medium 
          bg-slate-900 text-amber-400 rounded border border-amber-500/50">
          {getSourceLabel()}
        </div>
      )}
      
      {/* Content */}
      <div className={`p-3 ${type === 'locked' ? '' : 'pt-4'}`}>
        {isEditing ? (
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleEditBlur}
            onInput={(e) => setEditedContent(e.currentTarget.textContent)}
            className="outline-none min-h-[1em] text-slate-200"
          >
            {content}
          </div>
        ) : (
          <div className={`text-slate-200 ${type === 'locked' ? '' : ''}`}>
            {children || content}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * ChangeBoxContainer - Manages multiple change boxes and their state
 */
export const ChangeBoxContainer = memo(({ 
  changes, 
  onAccept, 
  onReject, 
  onLock, 
  onUnlock,
  onRegenerate,
  onContentChange 
}) => {
  return (
    <div className="space-y-2">
      {changes.map((change) => (
        <ChangeBox
          key={change.id}
          id={change.id}
          type={change.type}
          content={change.content}
          source={change.source}
          confidence={change.confidence}
          isNested={change.isNested}
          onAccept={onAccept}
          onReject={onReject}
          onLock={onLock}
          onUnlock={onUnlock}
          onRegenerate={onRegenerate}
          onContentChange={onContentChange}
        >
          {/* Render nested user edits */}
          {change.nestedEdits?.map((edit) => (
            <ChangeBox
              key={edit.id}
              id={edit.id}
              type="userEdit"
              content={edit.content}
              source="user"
              isNested={true}
              onAccept={onAccept}
              onReject={onReject}
              onContentChange={onContentChange}
            />
          ))}
        </ChangeBox>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if props actually changed
  return prevProps.changes === nextProps.changes &&
         prevProps.onAccept === nextProps.onAccept &&
         prevProps.onReject === nextProps.onReject &&
         prevProps.onLock === nextProps.onLock &&
         prevProps.onUnlock === nextProps.onUnlock &&
         prevProps.onRegenerate === nextProps.onRegenerate &&
         prevProps.onContentChange === nextProps.onContentChange;
});

export default ChangeBox;
