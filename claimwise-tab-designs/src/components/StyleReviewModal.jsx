import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  Edit3,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Save,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import contextEngine from '../services/contextEngine';
import aiService from '../services/aiService';
import promptTemplates from '../services/promptTemplates';
import db from '../services/database';

/**
 * Style Review Modal
 * Triggered every 5 chapters to review style evolution
 */
const StyleReviewModal = ({ 
  currentChapter, 
  onApprove, 
  onDismiss,
  recentChapters = [] 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const [originalStyle, setOriginalStyle] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [editedUpdates, setEditedUpdates] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    consistent: false,
    evolved: true,
    recommendations: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const profile = await contextEngine.getStoryProfile();
      if (profile?.styleProfile) {
        setOriginalStyle(profile.styleProfile);
      }
    } catch (error) {
      console.error('Error loading style data:', error);
      setError('Failed to load style profile');
    } finally {
      setIsLoading(false);
    }
  };

  const generateEvolutionReview = async () => {
    if (!originalStyle) {
      setError('No original style profile found. Please complete onboarding first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const reviewNumber = Math.floor(currentChapter / 5);
      const chaptersText = recentChapters.map((ch, idx) => 
        `--- Chapter ${currentChapter - recentChapters.length + idx + 1} ---\n${ch}`
      ).join('\n\n');

      const evolutionPrompt = promptTemplates.styleEvolution(
        originalStyle,
        chaptersText,
        reviewNumber
      );

      const response = await aiService.callAI(evolutionPrompt, 'analytical');
      
      // Parse response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setEvolutionData(parsed);
      } else {
        throw new Error('Could not parse evolution data');
      }
    } catch (error) {
      console.error('Error generating evolution review:', error);
      setError('Failed to analyze style evolution. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    try {
      // Save evolution record
      await contextEngine.saveStyleEvolution(currentChapter, {
        originalStyle,
        evolutionData,
        userEdits: editedUpdates,
        approvedAt: Date.now()
      });

      // Update style profile if there are approved changes
      if (evolutionData?.updatedProfile) {
        const profile = await contextEngine.getStoryProfile();
        if (profile) {
          await contextEngine.saveStoryProfile({
            ...profile,
            styleProfile: {
              ...profile.styleProfile,
              ...evolutionData.updatedProfile,
              ...editedUpdates
            }
          });
        }
      }

      onApprove?.();
    } catch (error) {
      console.error('Error saving evolution:', error);
      setError('Failed to save. Try again.');
    }
  };

  const renderEvolutionBadge = (assessment) => {
    const lower = assessment?.toLowerCase() || '';
    if (lower.includes('positive') || lower.includes('improved')) {
      return (
        <span className="flex items-center gap-1 text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">
          <TrendingUp className="w-3 h-3" /> Positive
        </span>
      );
    }
    if (lower.includes('negative') || lower.includes('drift')) {
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs bg-red-900/30 px-2 py-0.5 rounded">
          <TrendingDown className="w-3 h-3" /> Drift
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-400 text-xs bg-slate-700 px-2 py-0.5 rounded">
        <Minus className="w-3 h-3" /> Neutral
      </span>
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-xl p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-slate-400">Loading style data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-amber-500/30 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Style Evolution Review</h2>
                <p className="text-sm text-slate-400">
                  Chapter {currentChapter} milestone - Let's see how your style has evolved
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {!evolutionData ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Time to review your writing style!
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Every 5 chapters, we analyze your recent writing to see how your style 
                has evolved and ensure the AI stays aligned with your voice.
              </p>
              <button
                onClick={generateEvolutionReview}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg mx-auto transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze My Style Evolution
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="font-medium text-white mb-2">Overall Assessment</h3>
                <p className="text-slate-300">{evolutionData.overallAssessment}</p>
              </div>

              {/* Consistent Elements */}
              <div>
                <button
                  onClick={() => toggleSection('consistent')}
                  className="w-full flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/30"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-400">Consistent Elements</span>
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                      {evolutionData.consistentElements?.length || 0}
                    </span>
                  </div>
                  {expandedSections.consistent ? (
                    <ChevronDown className="w-4 h-4 text-green-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-green-400" />
                  )}
                </button>
                {expandedSections.consistent && evolutionData.consistentElements?.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {evolutionData.consistentElements.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Evolved Elements */}
              <div>
                <button
                  onClick={() => toggleSection('evolved')}
                  className="w-full flex items-center justify-between p-3 bg-amber-900/20 rounded-lg border border-amber-500/30"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-400" />
                    <span className="font-medium text-amber-400">Evolved Elements</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                      {evolutionData.evolvedElements?.length || 0}
                    </span>
                  </div>
                  {expandedSections.evolved ? (
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  )}
                </button>
                {expandedSections.evolved && evolutionData.evolvedElements?.length > 0 && (
                  <div className="mt-2 space-y-3 pl-4">
                    {evolutionData.evolvedElements.map((item, idx) => (
                      <div key={idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{item.element}</span>
                          {renderEvolutionBadge(item.assessment)}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Before:</span>
                            <p className="text-slate-400">{item.original}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Now:</span>
                            <p className="text-slate-300">{item.current}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="w-full flex items-center justify-between p-3 bg-blue-900/20 rounded-lg border border-blue-500/30"
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-blue-400">Recommendations</span>
                  </div>
                  {expandedSections.recommendations ? (
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                  )}
                </button>
                {expandedSections.recommendations && evolutionData.recommendations?.length > 0 && (
                  <div className="mt-2 space-y-2 pl-4">
                    {evolutionData.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                        <p className="text-white text-sm">{rec.suggestion}</p>
                        <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strengths & Watch Areas */}
              {(evolutionData.strengthsIdentified?.length > 0 || evolutionData.areasToWatch?.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {evolutionData.strengthsIdentified?.length > 0 && (
                    <div className="bg-green-900/10 rounded-lg p-4 border border-green-500/20">
                      <h4 className="font-medium text-green-400 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {evolutionData.strengthsIdentified.map((s, idx) => (
                          <li key={idx} className="text-sm text-slate-300">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evolutionData.areasToWatch?.length > 0 && (
                    <div className="bg-amber-900/10 rounded-lg p-4 border border-amber-500/20">
                      <h4 className="font-medium text-amber-400 mb-2">Watch Areas</h4>
                      <ul className="space-y-1">
                        {evolutionData.areasToWatch.map((a, idx) => (
                          <li key={idx} className="text-sm text-slate-300">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {evolutionData && (
          <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Dismiss for now
            </button>
            <div className="flex gap-3">
              <button
                onClick={generateEvolutionReview}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
              >
                <Check className="w-5 h-5" />
                Approve & Update Style
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyleReviewModal;
