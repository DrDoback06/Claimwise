import React, { useState, useEffect, memo } from 'react';
import { 
  X, Check, Edit3, RefreshCw, Sparkles, 
  ChevronDown, ChevronUp, Lightbulb,
  ArrowRight, Loader2, Lock, Sliders
} from 'lucide-react';
import NegativeExamplesManager from './NegativeExamplesManager';
import StyleConnectionIndicator from './StyleConnectionIndicator';

/**
 * PreviewPanel - Floating panel for previewing AI-generated content before insertion
 * 
 * Features:
 * - Shows original text in locked box at top
 * - Shows generated content below for comparison
 * - Editable mood sliders for quick adjustments
 * - Option to insert at cursor or let AI decide
 * - Edit before inserting
 * - Regenerate with different parameters
 */
const PreviewPanel = ({
  isOpen,
  onClose,
  content,
  originalSelection = null, // If replacing selected text
  source = 'ai', // 'continue' | 'scene' | 'dialogue' | 'description' | 'character' | 'rewrite' | 'mood-rewrite'
  confidence = 'high',
  suggestedPosition = null, // AI's suggested insert position
  onInsertAtCursor,
  onInsertAtPosition,
  onRegenerate,
  onEdit,
  isLoading = false,
  moodSettings = null, // For mood rewrites, show the sliders used
  onMoodChange = null, // Callback when mood sliders change
  chapterId = null, // For style connection checking
  bookId = null, // For style connection checking
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [insertMode, setInsertMode] = useState('cursor'); // 'cursor' | 'ai-suggested'
  const [showMoodSliders, setShowMoodSliders] = useState(false);
  
  // Local mood settings for editing
  const [localMoodSettings, setLocalMoodSettings] = useState({
    comedy_horror: 50,
    tension: 50,
    pacing: 50,
    detail: 50,
    emotional: 50,
    darkness: 50,
    absurdity: 50,
    formality: 50
  });

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    if (moodSettings) {
      setLocalMoodSettings(prev => ({ ...prev, ...moodSettings }));
    }
  }, [moodSettings]);

  if (!isOpen) return null;

  // Get source-specific styling and labels
  const getSourceConfig = () => {
    const configs = {
      'continue': { 
        color: 'amber', 
        label: 'Continue Writing',
        icon: Sparkles,
        description: 'AI continues from your cursor position'
      },
      'scene': { 
        color: 'cyan', 
        label: 'Generated Scene',
        icon: Sparkles,
        description: 'Full scene based on plot beats'
      },
      'dialogue': { 
        color: 'purple', 
        label: 'Dialogue Exchange',
        icon: Sparkles,
        description: 'Character conversation'
      },
      'description': { 
        color: 'emerald', 
        label: 'Descriptive Passage',
        icon: Sparkles,
        description: 'Sensory details and atmosphere'
      },
      'character': { 
        color: 'pink', 
        label: 'Character Introduction',
        icon: Sparkles,
        description: 'New character entering the scene'
      },
      'rewrite': { 
        color: 'amber', 
        label: 'Rewritten Text',
        icon: RefreshCw,
        description: 'Your selection, rewritten'
      },
      'mood-rewrite': { 
        color: 'violet', 
        label: 'Mood Rewrite',
        icon: Sparkles,
        description: 'Adjusted to new mood settings'
      },
    };
    return configs[source] || configs.continue;
  };

  const config = getSourceConfig();
  const Icon = config.icon;

  // Confidence indicator
  const getConfidenceDisplay = () => {
    const displays = {
      high: { color: 'text-green-400', bg: 'bg-green-400', label: 'High Confidence' },
      medium: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Medium Confidence' },
      low: { color: 'text-red-400', bg: 'bg-red-400', label: 'Experimental' }
    };
    return displays[confidence] || displays.high;
  };

  const confDisplay = getConfidenceDisplay();

  // Handle insert
  const handleInsert = () => {
    const finalContent = isEditing ? editedContent : content;
    if (insertMode === 'cursor') {
      onInsertAtCursor?.(finalContent);
    } else {
      onInsertAtPosition?.(finalContent, suggestedPosition);
    }
    onClose();
  };

  // Handle regenerate with current mood settings
  const handleRegenerateWithMood = () => {
    onMoodChange?.(localMoodSettings);
    onRegenerate?.();
  };

  // Mood slider labels
  const moodSliderConfig = {
    comedy_horror: { label: 'Comedy ↔ Horror', leftLabel: '😄', rightLabel: '💀' },
    tension: { label: 'Tension', leftLabel: 'Relaxed', rightLabel: 'Intense' },
    pacing: { label: 'Pacing', leftLabel: 'Slow', rightLabel: 'Fast' },
    detail: { label: 'Detail Level', leftLabel: 'Sparse', rightLabel: 'Rich' },
    emotional: { label: 'Emotional', leftLabel: 'Detached', rightLabel: 'Intense' },
    darkness: { label: 'Darkness', leftLabel: 'Light', rightLabel: 'Dark' },
    absurdity: { label: 'Absurdity', leftLabel: 'Grounded', rightLabel: 'Absurd' },
    formality: { label: 'Formality', leftLabel: 'Casual', rightLabel: 'Formal' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`
          w-full max-w-2xl max-h-[85vh] mx-4
          bg-slate-900 border-2 border-${config.color}-500/50
          relative 
          rounded-2xl shadow-2xl shadow-${config.color}-500/10
          flex flex-col overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
          relative
        `}
      >
        {/* Style Connection Indicator */}
        <StyleConnectionIndicator
          chapterId={chapterId}
          bookId={bookId}
          position="top-right"
          size="small"
        />
        
        {/* Header */}
        <div className={`
          flex items-center justify-between px-4 py-3 
          bg-gradient-to-r from-${config.color}-500/20 to-transparent
          border-b border-slate-700
        `}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${config.color}-500/20`}>
              <Icon className={`w-5 h-5 text-${config.color}-400`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{config.label}</h3>
              <p className="text-xs text-slate-400">{config.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Confidence badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800`}>
              <span className={`w-2 h-2 rounded-full ${confDisplay.bg}`} />
              <span className={`text-xs ${confDisplay.color}`}>{confDisplay.label}</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Original text - ALWAYS visible in locked box */}
        {originalSelection && (
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-400">Original Text (read-only)</span>
            </div>
            <div className="p-3 bg-slate-950/50 border border-slate-700 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm text-slate-400 italic select-none">{originalSelection}</p>
            </div>
          </div>
        )}

        {/* Mood sliders toggle & panel */}
        <div className="border-b border-slate-700">
          <button
            onClick={() => setShowMoodSliders(!showMoodSliders)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/50 
              text-sm text-slate-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>Mood Sliders</span>
              {showMoodSliders && <span className="text-xs text-violet-400">(adjust and regenerate)</span>}
            </div>
            {showMoodSliders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showMoodSliders && (
            <div className="px-4 py-3 bg-slate-800/30 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(localMoodSettings).map(([key, value]) => {
                  const sliderConfig = moodSliderConfig[key] || { label: key, leftLabel: '0', rightLabel: '100' };
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">{sliderConfig.label}</span>
                        <span className="text-violet-400">{value}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-12 text-right">{sliderConfig.leftLabel}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => setLocalMoodSettings(prev => ({
                            ...prev,
                            [key]: parseInt(e.target.value)
                          }))}
                          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-violet-500 
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-xs text-slate-600 w-12">{sliderConfig.rightLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={handleRegenerateWithMood}
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 
                  bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700
                  rounded-lg text-white text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate with These Settings
              </button>
            </div>
          )}
        </div>

        {/* Content area - New/Generated content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-3.5 h-3.5 text-${config.color}-400`} />
            <span className="text-xs font-medium text-slate-400">
              {originalSelection ? 'Rewritten Version' : 'Generated Content'}
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span>Generating content...</span>
            </div>
          ) : isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 bg-slate-800 border border-slate-600 rounded-lg p-4 
                text-slate-200 resize-none outline-none focus:border-blue-500 transition-colors"
              placeholder="Edit the content..."
            />
          ) : (
            <div className={`
              bg-green-500/5 border border-green-500/30 
              rounded-lg p-4 text-slate-200 whitespace-pre-wrap
            `}>
              {content || 'No content generated'}
            </div>
          )}
        </div>

        {/* Insert mode selector */}
        <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-xs text-slate-500">Insert location:</span>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="insertMode"
                value="cursor"
                checked={insertMode === 'cursor'}
                onChange={() => setInsertMode('cursor')}
                className="text-amber-500"
              />
              <span className="text-sm text-slate-300">At cursor position</span>
            </label>
            
            {suggestedPosition && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="insertMode"
                  value="ai-suggested"
                  checked={insertMode === 'ai-suggested'}
                  onChange={() => setInsertMode('ai-suggested')}
                  className="text-amber-500"
                />
                <span className="text-sm text-slate-300 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  AI suggested position
                </span>
              </label>
            )}
          </div>
          
          {suggestedPosition && insertMode === 'ai-suggested' && (
            <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              AI suggests: "{suggestedPosition.reason}"
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${isEditing 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Done Editing' : 'Edit First'}
            </button>
            
            <button
              onClick={() => onRegenerate?.()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <NegativeExamplesManager
              currentContent={content}
              currentMood={moodSettings ? 'custom' : null}
              onMarkNegative={() => {
                // Refresh context after marking negative
                onClose();
              }}
            />
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleInsert}
              disabled={isLoading || !content}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                bg-gradient-to-r from-${config.color}-600 to-${config.color}-500
                hover:from-${config.color}-500 hover:to-${config.color}-400
                text-white shadow-lg shadow-${config.color}-500/20
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              `}
            >
              <Check className="w-4 h-4" />
              {originalSelection ? 'Replace Original' : 'Insert'} {insertMode === 'cursor' ? 'at Cursor' : 'at AI Position'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MoodRewritePanel - Specialized preview for mood-based rewrites
 * Shows diff between original and rewritten content with editable mood sliders
 */
export const MoodRewritePanel = ({
  isOpen,
  onClose,
  originalContent,
  rewrittenContent,
  moodSettings,
  onAccept,
  onRegenerate,
  onAdjustMood,
  onMoodChange,
  isLoading = false
}) => {
  // Local mood settings for editing
  const [localMoodSettings, setLocalMoodSettings] = useState({
    comedy_horror: 50,
    tension: 50,
    pacing: 50,
    detail: 50,
    emotional: 50,
    darkness: 50,
    absurdity: 50,
    formality: 50
  });

  useEffect(() => {
    if (moodSettings) {
      setLocalMoodSettings(prev => ({ ...prev, ...moodSettings }));
    }
  }, [moodSettings]);

  if (!isOpen) return null;

  // Mood slider labels
  const moodSliderConfig = {
    comedy_horror: { label: 'Comedy ↔ Horror', leftLabel: '😄', rightLabel: '💀' },
    tension: { label: 'Tension', leftLabel: 'Relaxed', rightLabel: 'Intense' },
    pacing: { label: 'Pacing', leftLabel: 'Slow', rightLabel: 'Fast' },
    detail: { label: 'Detail Level', leftLabel: 'Sparse', rightLabel: 'Rich' },
    emotional: { label: 'Emotional', leftLabel: 'Detached', rightLabel: 'Intense' },
    darkness: { label: 'Darkness', leftLabel: 'Light', rightLabel: 'Dark' },
    absurdity: { label: 'Absurdity', leftLabel: 'Grounded', rightLabel: 'Absurd' },
    formality: { label: 'Formality', leftLabel: 'Casual', rightLabel: 'Formal' }
  };

  const handleRegenerateWithMood = () => {
    onMoodChange?.(localMoodSettings);
    onRegenerate?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] mx-4 bg-slate-900 border-2 border-violet-500/50 
        rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500/20 to-transparent border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Mood Rewrite Preview</h3>
              <p className="text-xs text-slate-400">Compare original vs rewritten, adjust mood and regenerate</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editable Mood sliders */}
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-slate-300">Mood Settings</span>
            <span className="text-xs text-slate-500">(adjust and regenerate)</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(localMoodSettings).map(([key, value]) => {
              const sliderConfig = moodSliderConfig[key] || { label: key, leftLabel: '0', rightLabel: '100' };
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{sliderConfig.label}</span>
                    <span className="text-violet-400">{value}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-10 text-right">{sliderConfig.leftLabel}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => setLocalMoodSettings(prev => ({
                        ...prev,
                        [key]: parseInt(e.target.value)
                      }))}
                      className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                        [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-violet-500 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 w-10">{sliderConfig.rightLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button
            onClick={handleRegenerateWithMood}
            disabled={isLoading}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 
              bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700
              rounded-lg text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate with These Settings
          </button>
        </div>

        {/* Content comparison */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span>Rewriting with new mood...</span>
            </div>
          ) : (
            <>
              {/* Original - locked box at top */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">Original Text (read-only)</span>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-700/50 rounded max-h-40 overflow-y-auto">
                  <p className="text-sm text-slate-400 italic select-none">{originalContent}</p>
                </div>
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronDown className="w-6 h-6 text-violet-400" />
              </div>
              
              {/* Rewritten */}
              <div className="bg-green-500/5 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Rewritten Version</span>
                </div>
                <div className="text-slate-200 text-sm whitespace-pre-wrap">{rewrittenContent}</div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Try Again
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                onAccept?.(rewrittenContent);
                onClose();
              }}
              disabled={isLoading || !rewrittenContent}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
                text-white shadow-lg shadow-green-500/20 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" />
              Replace Original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(PreviewPanel, (prevProps, nextProps) => {
  // Custom comparison for memo
  return prevProps.isOpen === nextProps.isOpen &&
         prevProps.content === nextProps.content &&
         prevProps.isLoading === nextProps.isLoading &&
         prevProps.confidence === nextProps.confidence;
});
