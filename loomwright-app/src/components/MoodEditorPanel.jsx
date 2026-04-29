import React, { useState, useEffect } from 'react';
import { X, Sparkles, Sliders, Check, RefreshCw } from 'lucide-react';
import aiService from '../services/aiService';
import smartContextEngine from '../services/smartContextEngine';
import storyBrain from '../services/storyBrain';

/**
 * MoodEditorPanel - Unified mood rewrite interface with quick presets and advanced sliders
 */
const MoodEditorPanel = ({ 
  isOpen, 
  onClose, 
  selectedText, 
  onApply, 
  originalText = '',
  chapterId = null,
  bookId = null,
  chapterText = ''
}) => {
  const [moodSettings, setMoodSettings] = useState({
    comedy_horror: 50,
    tension: 50,
    pacing: 50,
    detail: 50,
    emotional: 50,
    darkness: 50,
    absurdity: 50,
    formality: 50
  });

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Quick presets
  const presets = {
    comedy: { 
      comedy_horror: 20, tension: 40, pacing: 60, detail: 50, 
      emotional: 50, darkness: 30, absurdity: 80, formality: 30,
      label: 'Comedy', icon: '😄'
    },
    horror: { 
      comedy_horror: 80, tension: 80, pacing: 50, detail: 70, 
      emotional: 60, darkness: 90, absurdity: 20, formality: 50,
      label: 'Horror', icon: '😱'
    },
    tense: { 
      comedy_horror: 50, tension: 90, pacing: 70, detail: 40, 
      emotional: 70, darkness: 60, absurdity: 30, formality: 50,
      label: 'Tense', icon: '⚡'
    },
    dark: { 
      comedy_horror: 70, tension: 70, pacing: 50, detail: 60, 
      emotional: 60, darkness: 90, absurdity: 20, formality: 50,
      label: 'Dark', icon: '🌑'
    },
    light: { 
      comedy_horror: 30, tension: 30, pacing: 50, detail: 50, 
      emotional: 40, darkness: 20, absurdity: 70, formality: 40,
      label: 'Light', icon: '☀️'
    }
  };

  // Apply preset
  const applyPreset = (presetKey) => {
    const preset = presets[presetKey];
    if (preset) {
      setMoodSettings(preset);
      setSelectedPreset(presetKey);
      setShowAdvanced(false);
    }
  };

  // Generate preview
  const generatePreview = async () => {
if (!selectedText && !originalText) return;
    
    const textToRewrite = selectedText || originalText;
    setIsGenerating(true);
    
    try {
const moodDescriptions = [];
      if (moodSettings.comedy_horror > 70) moodDescriptions.push('HORROR - dark, unsettling, ominous');
      else if (moodSettings.comedy_horror < 30) moodDescriptions.push('COMEDY - witty, absurd, humorous');
      if (moodSettings.tension > 70) moodDescriptions.push('HIGH TENSION - urgent, suspenseful');
      else if (moodSettings.tension < 30) moodDescriptions.push('LOW TENSION - calm, relaxed');
      if (moodSettings.pacing > 70) moodDescriptions.push('FAST PACING - quick, snappy, minimal detail');
      else if (moodSettings.pacing < 30) moodDescriptions.push('SLOW PACING - measured, contemplative');
      if (moodSettings.detail > 70) moodDescriptions.push('RICH DETAIL - sensory, immersive, descriptive');
      else if (moodSettings.detail < 30) moodDescriptions.push('SPARSE - minimal, focused, essential only');
      if (moodSettings.emotional > 70) moodDescriptions.push('INTENSE EMOTION - charged, impactful');
      else if (moodSettings.emotional < 30) moodDescriptions.push('DETACHED - clinical, unemotional');
      if (moodSettings.darkness > 70) moodDescriptions.push('DARK - bleak, heavy, ominous');
      else if (moodSettings.darkness < 30) moodDescriptions.push('LIGHT - bright, optimistic');
      if (moodSettings.formality > 70) moodDescriptions.push('FORMAL - proper, structured, dignified');
      else if (moodSettings.formality < 30) moodDescriptions.push('CASUAL - conversational, relaxed');

      // Get style context from storyBrain (includes craft directives, chapter memories, genre guides)
      let systemContext = '';
      try {
        if (chapterText && bookId) {
          const moodPreset = moodSettings.comedy_horror < 30 ? 'comedy' : moodSettings.comedy_horror > 70 ? 'horror' : null;
          const { systemContext: ctx } = await storyBrain.getContext({
            text: chapterText,
            chapterId,
            bookId,
            action: 'mood'
          });
          const craft = storyBrain.getCraftDirective('mood', moodPreset);
          systemContext = `You are adjusting the mood of a passage in this story.\n\n${craft}\n\n${ctx}`;
        }
      } catch (error) {
        console.warn('Failed to load style context for mood editor:', error);
      }

      const moodGuide = `Rewrite this text with these EXACT mood characteristics: ${moodDescriptions.join(', ')}.

Mood Settings: Comedy/Horror: ${moodSettings.comedy_horror}%, Tension: ${moodSettings.tension}%, Pacing: ${moodSettings.pacing}%, Detail: ${moodSettings.detail}%, Emotional: ${moodSettings.emotional}%, Darkness: ${moodSettings.darkness}%, Absurdity: ${moodSettings.absurdity}%, Formality: ${moodSettings.formality}%

Keep the same events/meaning but transform the tone and style to match these settings EXACTLY.`;

      let prompt = '';
      if (systemContext) {
        prompt = `
=== YOUR TASK ===
${moodGuide}

Text to rewrite:
"${textToRewrite}"

=== CRITICAL STYLE REQUIREMENTS ===
- Match the writing style from the style profile and references above EXACTLY
- Apply the mood characteristics specified while maintaining the unique voice
- Be witty, sarcastic, and emotionally hard-hitting as specified in the style profile
- Do NOT write generic or bland prose

${customPrompt ? `\n=== CUSTOM INSTRUCTIONS ===\n${customPrompt}\n` : ''}

Only return the rewritten text (no explanations):`;
      } else {
        prompt = `${moodGuide}

Text to rewrite:
"${textToRewrite}"

${customPrompt ? `\n=== CUSTOM INSTRUCTIONS ===\n${customPrompt}\n` : ''}

Only return the rewritten text (no explanations):`;
      }

      const result = await aiService.callAI(prompt, 'creative', systemContext);
if (!result || result.trim().length === 0) {
        throw new Error('AI returned empty result');
      }
      
      const cleanResult = result.replace(/^["']|["']$/g, '').trim();
setPreviewText(cleanResult);
    } catch (error) {
console.error('Preview generation failed:', error);
      const errorMessage = error.message?.includes('API key') 
        ? 'AI service not configured. Please check your API keys in Settings.'
        : error.message?.includes('quota') || error.message?.includes('rate limit')
        ? 'AI service quota exceeded. Please try again later.'
        : 'Error generating preview. Please try again.';
      setPreviewText(`❌ ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate preview when settings change (debounced)
  useEffect(() => {
    if (!isOpen || (!selectedText && !originalText)) return;
    
    const timeoutId = setTimeout(() => {
      if (showAdvanced) {
        generatePreview();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodSettings, showAdvanced, isOpen, selectedText, originalText]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setPreviewText('');
      setSelectedPreset(null);
      setShowAdvanced(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const textToRewrite = selectedText || originalText;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm lw-z-modal flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        {/* Style Connection Indicator */}
        <StyleConnectionIndicator
          chapterId={chapterId}
          bookId={bookId}
          position="top-right"
          size="small"
        />
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Mood Editor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Style Preview Panel */}
          <StylePreviewPanel
            chapterText={originalText || selectedText}
            chapterId={null}
            bookId={null}
            moodSettings={moodSettings}
            moodPreset={selectedPreset}
            isCollapsible={true}
          />
          
          {/* Quick Presets */}
          <div>
            <div className="text-sm font-semibold text-slate-300 mb-3">Quick Presets</div>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPreset === key
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{preset.icon}</div>
                  <div className="text-xs font-medium">{preset.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Controls Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-300">Advanced Controls</div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
            >
              <Sliders className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          {/* Advanced Sliders */}
          {showAdvanced && (
            <div className="space-y-4 bg-slate-800/50 rounded-lg p-4">
              {Object.entries({
                comedy_horror: { label: 'Comedy / Horror', min: 0, max: 100 },
                tension: { label: 'Tension', min: 0, max: 100 },
                pacing: { label: 'Pacing', min: 0, max: 100 },
                detail: { label: 'Detail', min: 0, max: 100 },
                emotional: { label: 'Emotional', min: 0, max: 100 },
                darkness: { label: 'Darkness', min: 0, max: 100 },
                absurdity: { label: 'Absurdity', min: 0, max: 100 },
                formality: { label: 'Formality', min: 0, max: 100 }
              }).map(([key, config]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-300">{config.label}</label>
                    <span className="text-sm font-mono text-slate-400">{moodSettings[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    value={moodSettings[key]}
                    onChange={(e) => {
                      setMoodSettings(prev => ({
                        ...prev,
                        [key]: parseInt(e.target.value)
                      }));
                      setSelectedPreset(null);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Custom Prompt Field */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Custom Prompt (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Add specific instructions to guide the AI..."
              className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3 py-2 rounded resize-y min-h-[60px] max-h-[120px]"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-slate-500 mt-1">{customPrompt.length}/500</div>
          </div>

          {/* Original Text */}
          {textToRewrite && (
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2">Original Text</div>
              <div className="bg-slate-950 border border-slate-700 rounded p-3 text-sm text-slate-300 max-h-32 overflow-y-auto">
                {textToRewrite}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewText && (
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2">Preview</div>
              <div className="bg-slate-950 border border-purple-700/50 rounded p-3 text-sm text-slate-200 max-h-48 overflow-y-auto">
                {isGenerating ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating preview...
                  </div>
                ) : (
                  previewText
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-between">
          <button
            onClick={generatePreview}
            disabled={isGenerating || !textToRewrite}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Preview
              </>
            )}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                let textToApply = previewText;
                if (!textToApply && textToRewrite) {
                  await generatePreview();
                  textToApply = previewText;
                }
                if (textToApply && textToApply.trim().length > 0 && !textToApply.startsWith('❌') && onApply) {
                  onApply(textToApply, moodSettings);
                } else if (!textToRewrite) {
                  // No text to rewrite
                } else if (textToApply && textToApply.startsWith('❌')) {
                  // Error in preview, don't apply
                } else {
                  // Still generating or no preview
                }
              }}
              disabled={(!previewText || previewText.startsWith('❌')) && !textToRewrite}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodEditorPanel;
