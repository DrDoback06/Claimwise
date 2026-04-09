/**
 * StyleTestPanel Component
 * Displays AI-generated style examples for mood presets
 * Each example is opt-in (manual generate per mood)
 * Allows user to rate each example (1-5 stars) with feedback tags + freetext
 */

import React, { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle, AlertCircle, Tag, X, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';
import contextEngine from '../services/contextEngine';

const MOOD_PRESETS = [
  { id: 'comedy', label: 'Comedy', emoji: '😄', description: 'Funny, witty, absurd humor' },
  { id: 'horror', label: 'Horror', emoji: '💀', description: 'Dread, unsettling, dark' },
  { id: 'tense', label: 'Tense', emoji: '⚡', description: 'Urgent, anxious, on-edge' },
  { id: 'relaxed', label: 'Relaxed', emoji: '🌿', description: 'Calm, peaceful, measured' },
  { id: 'fast', label: 'Fast', emoji: '🏃', description: 'Snappy, rapid-fire action' },
  { id: 'slow', label: 'Slow', emoji: '🐌', description: 'Contemplative, detailed' },
  { id: 'rich', label: 'Rich', emoji: '✨', description: 'Sensory, immersive, vivid' },
  { id: 'sparse', label: 'Sparse', emoji: '📝', description: 'Minimal, essential only' },
  { id: 'intense', label: 'Intense', emoji: '🔥', description: 'Emotionally charged, impactful' },
  { id: 'detached', label: 'Detached', emoji: '🧊', description: 'Clinical, unemotional' },
  { id: 'dark', label: 'Dark', emoji: '🌑', description: 'Bleak, heavy, ominous' },
  { id: 'light', label: 'Light', emoji: '☀️', description: 'Bright, optimistic, playful' },
  { id: 'absurd', label: 'Absurd', emoji: '🎭', description: 'Surreal, ridiculous, over-the-top' },
  { id: 'grounded', label: 'Grounded', emoji: '🌍', description: 'Realistic, believable' },
  { id: 'formal', label: 'Formal', emoji: '🎩', description: 'Proper, structured, dignified' },
  { id: 'casual', label: 'Casual', emoji: '💬', description: 'Conversational, relaxed' }
];

const FEEDBACK_TAGS = [
  // Tone issues
  'too generic',
  'wrong tone',
  'too dark',
  'not dark enough',
  'too formal',
  'too casual',
  // Style issues
  'too flowery',
  'too sparse',
  'pacing wrong',
  'too repetitive',
  'overwrought',
  // Voice issues
  'out of character',
  'doesn\'t match style',
  'voice inconsistent',
  // Humor/emotion
  'not funny enough',
  'not witty enough',
  'missing sarcasm',
  'lacks emotion',
  'too emotional',
  'too on-the-nose',
  // Quality signals
  'cliché',
  'predictable',
  'forced',
  'unnatural dialogue'
];

// Positive tags to capture what works well
const POSITIVE_TAGS = [
  'nailed the tone',
  'great voice',
  'perfect pacing',
  'love the humor',
  'emotionally resonant',
  'vivid imagery',
  'authentic dialogue',
  'clever wording',
  'unexpected twist',
  'exactly right'
];

const StyleTestPanel = ({ onComplete }) => {
  const [examples, setExamples] = useState({});
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState({});
  const [positiveFeedback, setPositiveFeedback] = useState({});
  const [freetext, setFreetext] = useState({});
  const [generatingMood, setGeneratingMood] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [storyProfile, setStoryProfile] = useState(null);
  const [expandedMood, setExpandedMood] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await contextEngine.getStoryProfile();
    setStoryProfile(profile);
  };

  const generateExampleForMood = async (moodId) => {
    if (generatingMood) return; // prevent concurrent generation
    setGeneratingMood(moodId);

    try {
      const styleProfile = storyProfile?.styleProfile;

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

      const prompt = `Write a PERFECT, MAXIMUM EFFORT example in the writer's style demonstrating the "${moodDescriptions[moodId]}" mood. This is a "1 rep max" - your absolute best work.

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
      setExamples(prev => ({ ...prev, [moodId]: result?.trim() || 'Error generating example' }));
    } catch (error) {
      console.error(`Error generating example for ${moodId}:`, error);
      setExamples(prev => ({ ...prev, [moodId]: null }));
      alert(`Failed to generate example for "${moodId}". Make sure you have at least one AI provider key set up.`);
    } finally {
      setGeneratingMood(null);
    }
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

  const togglePositiveTag = (moodId, tag) => {
    setPositiveFeedback(prev => {
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
      for (const mood of MOOD_PRESETS) {
        const rating = ratings[mood.id];
        const tags = feedback[mood.id] || [];
        const posTags = positiveFeedback[mood.id] || [];
        const example = examples[mood.id];
        const notes = freetext[mood.id] || '';

        if (example && (rating || tags.length > 0 || posTags.length > 0 || notes)) {
          await db.add('styleTestResults', {
            id: `test_${Date.now()}_${mood.id}`,
            moodPreset: mood.id,
            example: example,
            rating: rating || null,
            feedbackTags: tags,
            positiveTags: posTags,
            freetext: notes,
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

  const generatedCount = Object.keys(examples).filter(k => examples[k]).length;
  const ratedCount = Object.keys(ratings).length;
  const canComplete = ratedCount >= 3; // At least 3 moods rated

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-white mb-1">Style Test - Rate AI Examples</h3>
            <p className="text-sm text-slate-400">
              Choose the moods you want to test. Click <strong>Generate</strong> on any mood to see how the AI
              writes in that style. Rate the results and leave feedback — this teaches the AI what works for your story.
              You don't need to test all 16, but the more you rate, the better the AI learns your preferences.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span>Generated: {generatedCount}/{MOOD_PRESETS.length}</span>
              <span>Rated: {ratedCount}/{generatedCount || 0}</span>
              <span className={ratedCount >= 3 ? 'text-green-400' : 'text-amber-400'}>
                {ratedCount >= 3 ? '✓ Enough to continue' : `Rate at least ${3 - ratedCount} more to continue`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {MOOD_PRESETS.map(preset => {
          const example = examples[preset.id];
          const rating = ratings[preset.id] || 0;
          const tags = feedback[preset.id] || [];
          const posTags = positiveFeedback[preset.id] || [];
          const isGenerating = generatingMood === preset.id;
          const isExpanded = expandedMood === preset.id;
          const hasExample = example && example !== 'Error generating example';

          return (
            <div key={preset.id} className={`bg-slate-900 rounded-lg border transition-colors ${
              rating > 0 ? 'border-green-500/30' : hasExample ? 'border-amber-500/30' : 'border-slate-700'
            }`}>
              {/* Mood header - always visible */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{preset.emoji}</span>
                  <div>
                    <h4 className="font-medium text-white">{preset.label}</h4>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Star rating - compact */}
                  {hasExample && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={(e) => { e.stopPropagation(); handleRating(preset.id, star); }}
                          className={`transition-colors ${
                            star <= rating
                              ? 'text-yellow-400 hover:text-yellow-300'
                              : 'text-slate-600 hover:text-slate-500'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Generate / Regenerate button */}
                  {!hasExample ? (
                    <button
                      onClick={() => generateExampleForMood(preset.id)}
                      disabled={!!generatingMood}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-3 h-3" /> Generate</>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateExampleForMood(preset.id)}
                        disabled={!!generatingMood}
                        title="Regenerate"
                        className="p-1.5 text-slate-400 hover:text-amber-400 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setExpandedMood(isExpanded ? null : preset.id)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Example text - shown when generated */}
              {hasExample && (
                <div className="px-4 pb-3">
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {example}
                    </p>
                  </div>
                </div>
              )}

              {/* Expanded feedback section */}
              {hasExample && isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                  {/* What didn't work */}
                  <div>
                    <p className="text-xs text-red-400 font-medium mb-2">What didn't work:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FEEDBACK_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleFeedbackTag(preset.id, tag)}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            tags.includes(tag)
                              ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {tags.includes(tag) && <X className="w-2.5 h-2.5 inline mr-0.5" />}
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* What worked well */}
                  <div>
                    <p className="text-xs text-green-400 font-medium mb-2">What worked well:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POSITIVE_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => togglePositiveTag(preset.id, tag)}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            posTags.includes(tag)
                              ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {posTags.includes(tag) && <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" />}
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Freetext notes */}
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Additional notes (optional):</p>
                    <textarea
                      value={freetext[preset.id] || ''}
                      onChange={(e) => setFreetext(prev => ({ ...prev, [preset.id]: e.target.value }))}
                      placeholder="e.g. 'More like Terry Pratchett's footnote humor' or 'The second sentence was perfect but the rest felt flat'"
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Quick feedback hint if example exists but not expanded */}
              {hasExample && !isExpanded && (tags.length > 0 || posTags.length > 0) && (
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1">
                    {posTags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">{t}</span>
                    ))}
                    {tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          {ratedCount > 0 ? `${ratedCount} mood${ratedCount > 1 ? 's' : ''} rated` : 'Generate & rate moods to continue'}
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
