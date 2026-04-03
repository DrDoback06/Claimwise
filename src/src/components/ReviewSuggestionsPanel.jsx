import React, { useState, useEffect } from 'react';
import { 
  X, Check, ChevronRight, ChevronDown, Lightbulb,
  AlertTriangle, Sparkles, Loader2, RefreshCw,
  CheckCircle, ArrowRight, Edit3, Eye
} from 'lucide-react';

/**
 * ReviewSuggestionsPanel - Panel for selecting and applying AI suggestions
 * 
 * Features:
 * - Card-based UI for each suggestion
 * - Individual accept/reject per suggestion
 * - Select all / deselect all
 * - Shows before/after preview
 * - Apply selected suggestions as tracked changes
 */
const ReviewSuggestionsPanel = ({
  isOpen,
  onClose,
  suggestions = [], // Array of { id, type, description, originalText, suggestedText, position, confidence }
  onApplySelected,
  onRegenerate,
  isLoading = false,
  chapterContent = '',
}) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedSuggestions(new Set());
    setExpandedSuggestion(null);
  }, [suggestions]);

  if (!isOpen) return null;

  // Toggle suggestion selection
  const toggleSuggestion = (id) => {
    const newSelection = new Set(selectedSuggestions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSuggestions(newSelection);
  };

  // Select all
  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  // Get suggestion type styling
  const getSuggestionStyle = (type) => {
    const styles = {
      'flow': { color: 'cyan', icon: '🌊', label: 'Flow & Pacing' },
      'dialogue': { color: 'purple', icon: '💬', label: 'Dialogue' },
      'description': { color: 'emerald', icon: '🎨', label: 'Description' },
      'consistency': { color: 'amber', icon: '⚠️', label: 'Consistency' },
      'grammar': { color: 'blue', icon: '📝', label: 'Grammar' },
      'style': { color: 'pink', icon: '✨', label: 'Style' },
      'character': { color: 'orange', icon: '👤', label: 'Character Voice' },
      'tension': { color: 'red', icon: '🔥', label: 'Tension' },
      'clarity': { color: 'slate', icon: '💡', label: 'Clarity' },
    };
    return styles[type] || { color: 'slate', icon: '💡', label: type };
  };

  // Get confidence styling
  const getConfidenceStyle = (confidence) => {
    const styles = {
      'high': { color: 'green', label: 'Recommended' },
      'medium': { color: 'yellow', label: 'Consider' },
      'low': { color: 'red', label: 'Experimental' },
    };
    return styles[confidence] || styles.medium;
  };

  // Apply selected suggestions
  const handleApply = () => {
    const selectedItems = suggestions.filter(s => selectedSuggestions.has(s.id));
    onApplySelected?.(selectedItems);
    onClose();
  };

  // Render individual suggestion card
  const renderSuggestionCard = (suggestion) => {
    const style = getSuggestionStyle(suggestion.type);
    const confStyle = getConfidenceStyle(suggestion.confidence);
    const isSelected = selectedSuggestions.has(suggestion.id);
    const isExpanded = expandedSuggestion === suggestion.id;

    return (
      <div
        key={suggestion.id}
        className={`
          rounded-xl border-2 transition-all duration-200 overflow-hidden
          ${isSelected 
            ? `border-${style.color}-500 bg-${style.color}-500/10` 
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }
        `}
      >
        {/* Card header */}
        <div 
          className="flex items-start gap-3 p-4 cursor-pointer"
          onClick={() => toggleSuggestion(suggestion.id)}
        >
          {/* Checkbox */}
          <div className="pt-0.5">
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
              ${isSelected 
                ? `border-${style.color}-500 bg-${style.color}-500` 
                : 'border-slate-500'
              }
            `}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{style.icon}</span>
              <span className={`text-sm font-medium text-${style.color}-400`}>
                {style.label}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full 
                bg-${confStyle.color}-500/20 text-${confStyle.color}-400`}>
                {confStyle.label}
              </span>
            </div>
            
            <p className="text-sm text-slate-300 mb-2">
              {suggestion.description}
            </p>
            
            {/* Preview toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSuggestion(isExpanded ? null : suggestion.id);
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {isExpanded ? 'Hide' : 'Show'} before/after
            </button>
          </div>
        </div>
        
        {/* Expanded preview */}
        {isExpanded && (
          <div className="border-t border-slate-700 p-4 bg-slate-900/50 space-y-3">
            {/* Original */}
            {suggestion.originalText && (
              <div>
                <div className="text-xs text-red-400 mb-1 font-medium">Original:</div>
                <div className="text-sm text-slate-400 bg-red-500/5 border border-red-500/20 
                  rounded p-2 line-through">
                  {suggestion.originalText}
                </div>
              </div>
            )}
            
            {/* Suggested */}
            <div>
              <div className="text-xs text-green-400 mb-1 font-medium">Suggested:</div>
              <div className="text-sm text-slate-200 bg-green-500/5 border border-green-500/20 
                rounded p-2">
                {suggestion.suggestedText}
              </div>
            </div>
            
            {/* Location hint */}
            {suggestion.position && (
              <div className="text-xs text-slate-500">
                📍 Near: "{suggestion.position.context?.substring(0, 50)}..."
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] mx-4 bg-slate-900 border border-slate-700 
        rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r 
          from-amber-500/20 to-transparent border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Review Suggestions</h3>
              <p className="text-xs text-slate-400">
                Select suggestions to apply as tracked changes
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">
              {selectedSuggestions.size} of {suggestions.length} selected
            </span>
            <button
              onClick={selectAll}
              className="text-amber-400 hover:text-amber-300"
            >
              Select all
            </button>
            <button
              onClick={deselectAll}
              className="text-slate-400 hover:text-white"
            >
              Deselect all
            </button>
          </div>
          
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
              bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reanalyze
          </button>
        </div>

        {/* Suggestions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span>Analyzing your chapter...</span>
              <span className="text-xs text-slate-500 mt-1">
                Looking for improvements in flow, dialogue, description, and more
              </span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
              <span className="text-lg font-medium text-white">Looking good!</span>
              <span className="text-sm text-slate-500 mt-1">
                No major suggestions found. Your writing is solid!
              </span>
            </div>
          ) : (
            suggestions.map(renderSuggestionCard)
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
          <div className="text-xs text-slate-500">
            💡 Applied suggestions become tracked changes you can accept/reject later
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleApply}
              disabled={selectedSuggestions.size === 0 || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400
                text-white shadow-lg shadow-amber-500/20
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Apply {selectedSuggestions.size} Suggestion{selectedSuggestions.size !== 1 ? 's' : ''}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSuggestionsPanel;
