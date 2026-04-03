/**
 * StyleTestPanel Component
 * Displays AI-generated style examples for all mood presets
 * Allows user to rate each example (1-5 stars) with optional feedback tags
 */

import React, { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle, AlertCircle, Tag, X } from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';
import contextEngine from '../services/contextEngine';

const MOOD_PRESETS = [
  { id: 'comedy', label: 'Comedy', emoji: '😄' },
  { id: 'horror', label: 'Horror', emoji: '💀' },
  { id: 'tense', label: 'Tense', emoji: '⚡' },
  { id: 'relaxed', label: 'Relaxed', emoji: '🌿' },
  { id: 'fast', label: 'Fast', emoji: '⚡' },
  { id: 'slow', label: 'Slow', emoji: '🐌' },
  { id: 'rich', label: 'Rich', emoji: '✨' },
  { id: 'sparse', label: 'Sparse', emoji: '📝' },
  { id: 'intense', label: 'Intense', emoji: '🔥' },
  { id: 'detached', label: 'Detached', emoji: '🧊' },
  { id: 'dark', label: 'Dark', emoji: '🌑' },
  { id: 'light', label: 'Light', emoji: '☀️' },
  { id: 'absurd', label: 'Absurd', emoji: '🎭' },
  { id: 'grounded', label: 'Grounded', emoji: '🌍' },
  { id: 'formal', label: 'Formal', emoji: '🎩' },
  { id: 'casual', label: 'Casual', emoji: '💬' }
];

const FEEDBACK_TAGS = [
  'too generic',
  'not funny enough',
  'too dark',
  'wrong tone',
  'out of character',
  'too flowery',
  'not witty enough',
  'lacks emotion',
  'too emotional',
  'pacing wrong',
  'missing sarcasm',
  'too formal',
  'too casual',
  'doesn\'t match style'
];

const StyleTestPanel = ({ onComplete }) => {
  const [examples, setExamples] = useState({});
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMood, setCurrentMood] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    generateAllExamples();
  }, []);

  const generateAllExamples = async () => {
    setIsGenerating(true);
    const storyProfile = await contextEngine.getStoryProfile();
    const styleProfile = storyProfile?.styleProfile;
    
    // Generate examples for all moods
    for (let i = 0; i < MOOD_PRESETS.length; i++) {
      const preset = MOOD_PRESETS[i];
      setCurrentMood(i + 1);
      
      try {
        const example = await generateExampleForMood(preset.id, styleProfile, storyProfile);
        setExamples(prev => ({ ...prev, [preset.id]: example }));
      } catch (error) {
        console.error(`Error generating example for ${preset.id}:`, error);
        setExamples(prev => ({ ...prev, [preset.id]: 'Error generating example' }));
      }
    }
    
    setIsGenerating(false);
    setCurrentMood(0);
  };

  const generateExampleForMood = async (moodPreset, styleProfile, storyProfile) => {
    const moodDescriptions = {
      comedy: 'FUNNY and ABSURD - use wit, sarcasm, comedic timing',
      horror: 'HORROR and DREAD - unsettling, ominous, dark',
      tense: 'HIGH TENSION - urgent, anxious, on-edge',
      relaxed: 'RELAXED - calm, measured, peaceful',
      fast: 'FAST-PACED - snappy, quick, rapid-fire',
      slow: 'SLOW - contemplative, measured, detailed',
      rich: 'RICH DETAIL - sensory, immersive, vivid',
      sparse: 'SPARSE - minimal, essential only',
      intense: 'EMOTIONALLY INTENSE - charged, impactful',
      detached: 'DETACHED - clinical, unemotional, formal',
      dark: 'DARK - bleak, heavy, ominous',
      light: 'LIGHT - bright, optimistic, playful',
      absurd: 'ABSURDIST - surreal, ridiculous, over-the-top',
      grounded: 'GROUNDED - realistic, believable',
      formal: 'FORMAL - proper, structured, dignified',
      casual: 'CASUAL - conversational, relaxed'
    };

    const prompt = `Write a PERFECT, MAXIMUM EFFORT example in the writer's style demonstrating the "${moodDescriptions[moodPreset]}" mood. This is a "1 rep max" - your absolute best work.

STORY CONTEXT:
Title: ${storyProfile?.title || 'Untitled'}
Premise: ${storyProfile?.premise || 'Not set'}
Style: ${storyProfile?.comparisons || 'Not specified'}

STYLE PROFILE:
${JSON.stringify(styleProfile, null, 2)}

CRITICAL REQUIREMENTS:
1. Write EXACTLY 5 sentences maximum (no more, no less)
2. Each sentence must be PERFECT and demonstrate the mood clearly
3. Match the writing style from the style profile EXACTLY
4. Show the unique voice, humor style, and tone described
5. Be witty, sarcastic, and emotionally hard-hitting as specified
6. Make every word count - this is your best work

Write ONLY the 5 sentences (no explanations, no markdown, just the text):`;

    const result = await aiService.callAI(prompt, 'creative');
    return result?.trim() || '';
  };

  const handleRating = (moodId, rating) => {
    setRatings(prev => ({ ...prev, [moodId]: rating }));
  };

  const toggleFeedbackTag = (moodId, tag) => {
    setFeedback(prev => {
      const current = prev[moodId] || [];
      const updated = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, [moodId]: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all ratings and feedback
      for (const mood of MOOD_PRESETS) {
        const rating = ratings[mood.id];
        const tags = feedback[mood.id] || [];
        const example = examples[mood.id];

        if (rating || tags.length > 0) {
          await db.add('styleTestResults', {
            id: `test_${Date.now()}_${mood.id}`,
            moodPreset: mood.id,
            example: example,
            rating: rating || null,
            feedbackTags: tags,
            createdAt: Date.now()
          });
        }
      }

      onComplete?.();
    } catch (error) {
      console.error('Error saving style test results:', error);
      alert('Error saving results. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canComplete = Object.keys(ratings).length >= MOOD_PRESETS.length * 0.5; // At least 50% rated

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-white mb-1">Style Test</h3>
            <p className="text-sm text-slate-400">
              The AI will generate writing examples for all 16 mood presets. Rate each example (1-5 stars) 
              and add feedback tags to help the AI understand what works and what doesn't. This can take as 
              long as needed - no rush!
            </p>
          </div>
        </div>
      </div>

      {isGenerating && (
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-blue-300">
            Generating example {currentMood} of {MOOD_PRESETS.length}...
          </p>
        </div>
      )}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {MOOD_PRESETS.map(preset => {
          const example = examples[preset.id];
          const rating = ratings[preset.id] || 0;
          const tags = feedback[preset.id] || [];

          return (
            <div key={preset.id} className="bg-slate-900 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{preset.emoji}</span>
                  <h4 className="font-medium text-white">{preset.label}</h4>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRating(preset.id, star)}
                      className={`transition-colors ${
                        star <= rating
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-slate-600 hover:text-slate-500'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {example ? (
                <>
                  <div className="bg-slate-800/50 rounded p-3 mb-3">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {example}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleFeedbackTag(preset.id, tag)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          tags.includes(tag)
                            ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {tags.includes(tag) && <X className="w-3 h-3 inline mr-1" />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Generating example...</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          Rated: {Object.keys(ratings).length} / {MOOD_PRESETS.length}
        </div>
        <button
          onClick={handleSave}
          disabled={!canComplete || isSaving}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed 
            text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Results & Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StyleTestPanel;
