import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, Palette, Sparkles } from 'lucide-react';
import smartContextEngine from '../services/smartContextEngine';
import styleReferenceService from '../services/styleReferenceService';

/**
 * StylePreviewPanel - Shows the style profile being used for AI generation
 */
const StylePreviewPanel = ({ 
  chapterText = '',
  chapterId = null,
  bookId = null,
  moodSettings = null,
  moodPreset = null,
  isCollapsible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);
  const [styleInfo, setStyleInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load if we have minimum required info
    if (chapterText !== undefined || chapterId || bookId) {
      loadStyleInfo();
    } else {
      setIsLoading(false);
      setStyleInfo({
        error: 'No chapter context available',
        errorDetails: 'Chapter text, chapter ID, or book ID required'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterText, chapterId, bookId, moodSettings, moodPreset]);

  const loadStyleInfo = async () => {
    setIsLoading(true);
    try {
      // Load style info directly without building full AI context (avoids AI calls)
      let styleInfoData = {
        toneBalance: null,
        humorStyle: null,
        narratorTone: null,
        hasStyleProfile: false,
        hasExamples: false,
        exampleSnippet: null
      };

      // Get story profile directly (no AI calls)
      try {
        const storyProfile = await smartContextEngine.getFullStoryProfile().catch(() => null);
        if (storyProfile?.styleProfile) {
          const sp = storyProfile.styleProfile;
          if (sp.toneBalance) {
            styleInfoData.toneBalance = `${sp.toneBalance.comedyPercent}% comedy / ${sp.toneBalance.horrorPercent}% horror`;
          }
          if (sp.voiceProfile?.humorStyle?.length > 0) {
            styleInfoData.humorStyle = sp.voiceProfile.humorStyle.join(', ');
          }
          if (sp.voiceProfile?.narratorTone) {
            styleInfoData.narratorTone = sp.voiceProfile.narratorTone;
          }
          styleInfoData.hasStyleProfile = true;
        }
      } catch (error) {
        console.warn('Error loading story profile:', error);
      }

      // Check for style references (no AI calls)
      if (bookId) {
        try {
          const styleContext = await styleReferenceService.getStyleContext(bookId, 500).catch(() => '');
          if (styleContext && styleContext.trim().length > 0) {
            styleInfoData.hasExamples = true;
            styleInfoData.exampleSnippet = styleContext.substring(0, 200).trim() + '...';
          }
        } catch (error) {
          console.warn('Error loading style references:', error);
        }
      }

      setStyleInfo(styleInfoData);
    } catch (error) {
      console.error('Failed to load style info:', error);
      setStyleInfo({
        error: 'Could not load style information',
        errorDetails: error.message || 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3 h-3 animate-pulse" />
          Loading style profile...
        </div>
      </div>
    );
  }

  if (!styleInfo) {
    // Still show loading if we haven't gotten info yet
    if (isLoading) {
      return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Loading style profile...
          </div>
        </div>
      );
    }
    return null; // Don't show if no style info available and not loading
  }
  
  if (styleInfo.error) {
    // Show error state instead of hiding completely
    return (
      <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
          <Palette className="w-3 h-3 text-red-400" />
          <span>Style Profile Error</span>
        </div>
        <div className="text-xs text-red-400 mt-2">
          {styleInfo.error}
          {styleInfo.errorDetails && (
            <div className="text-[10px] text-red-500/70 mt-1">{styleInfo.errorDetails}</div>
          )}
        </div>
        <button
          onClick={loadStyleInfo}
          className="text-xs text-slate-400 hover:text-slate-300 mt-2 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
      {isCollapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-slate-300">Style Profile</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
      ) : (
        <div className="px-3 py-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-slate-300">Style Profile</span>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="p-3 space-y-3 text-xs">
          {styleInfo.toneBalance && (
            <div>
              <div className="text-slate-400 mb-1">Tone Balance</div>
              <div className="text-slate-300 font-medium">{styleInfo.toneBalance}</div>
            </div>
          )}

          {styleInfo.humorStyle && (
            <div>
              <div className="text-slate-400 mb-1">Humor Style</div>
              <div className="text-slate-300">{styleInfo.humorStyle}</div>
            </div>
          )}

          {styleInfo.narratorTone && (
            <div>
              <div className="text-slate-400 mb-1">Narrator Tone</div>
              <div className="text-slate-300">{styleInfo.narratorTone}</div>
            </div>
          )}

          {styleInfo.hasExamples && styleInfo.exampleSnippet && (
            <div>
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Style Example
              </div>
              <div className="bg-slate-950 border border-slate-700 rounded p-2 text-slate-300 italic text-[11px] line-clamp-3">
                "{styleInfo.exampleSnippet}"
              </div>
            </div>
          )}

          {moodSettings && (
            <div>
              <div className="text-slate-400 mb-1">Current Mood</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(moodSettings).map(([key, value]) => (
                  <div key={key} className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                    {key.replace('_', ' ')}: {value}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {!styleInfo.hasStyleProfile && (
            <div className="text-slate-500 italic text-[11px]">
              No style profile detected. AI will use default style.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StylePreviewPanel;
