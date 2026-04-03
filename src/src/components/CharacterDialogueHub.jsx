/**
 * Character Dialogue Hub
 * Comprehensive dialogue analysis: word clouds, speech patterns, samples, voice consistency
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Cloud, BarChart3, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getBadgeStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterDialogueHub = ({ character, books }) => {
  const [dialogueData, setDialogueData] = useState({
    wordCloud: [],
    speechPatterns: null,
    samples: [],
    consistencyScore: 0,
    statistics: null
  });
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'wordcloud' | 'patterns' | 'samples'

  useEffect(() => {
    loadDialogueData();
  }, [character]);

  /**
   * Load dialogue data from chapters
   */
  const loadDialogueData = async () => {
    try {
      // Collect all dialogue from chapters where character appears
      const allDialogue = [];
      const wordFreq = {};
      const speechSamples = [];

      if (books) {
        for (const book of Object.values(books)) {
          for (const chapter of book.chapters || []) {
            const text = chapter.script || chapter.content || '';
            if (text.toLowerCase().includes(character.name.toLowerCase())) {
              // Extract dialogue (simplified - would use proper dialogue extraction)
              const dialogueMatches = text.match(/"([^"]+)"/g) || [];
              dialogueMatches.forEach(match => {
                const dialogue = match.replace(/"/g, '');
                if (dialogue.length > 10) {
                  speechSamples.push({
                    text: dialogue,
                    chapterId: chapter.id,
                    bookId: book.id,
                    chapterNumber: chapter.number
                  });

                  // Count words
                  const words = dialogue.toLowerCase().match(/\b\w+\b/g) || [];
                  words.forEach(word => {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                  });
                }
              });
            }
          }
        }
      }

      // Create word cloud data (top 20 words)
      const wordCloud = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count }));

      // Analyze speech patterns
      const speechPatterns = analyzeSpeechPatterns(speechSamples);

      // Calculate consistency score
      const consistencyScore = calculateConsistencyScore(speechSamples, speechPatterns);

      // Calculate statistics
      const statistics = {
        totalDialogue: speechSamples.length,
        averageLength: speechSamples.reduce((sum, s) => sum + s.text.length, 0) / (speechSamples.length || 1),
        totalWords: Object.values(wordFreq).reduce((sum, count) => sum + count, 0),
        uniqueWords: Object.keys(wordFreq).length
      };

      setDialogueData({
        wordCloud,
        speechPatterns,
        samples: speechSamples.slice(0, 10),
        consistencyScore,
        statistics
      });
    } catch (error) {
      console.error('Error loading dialogue data:', error);
    }
  };

  /**
   * Analyze speech patterns
   */
  const analyzeSpeechPatterns = (samples) => {
    if (samples.length === 0) return null;

    const allText = samples.map(s => s.text).join(' ');
    const words = allText.toLowerCase().match(/\b\w+\b/g) || [];
    const sentences = allText.match(/[^.!?]+[.!?]+/g) || [];

    // Calculate formality (based on contractions, slang, etc.)
    const contractions = (allText.match(/\b(won't|can't|don't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|wouldn't|couldn't|shouldn't|'ll|'re|'ve|'d|'m)\b/gi) || []).length;
    const formality = Math.max(0, Math.min(100, 100 - (contractions / words.length) * 100));

    // Calculate average sentence length
    const avgSentenceLength = sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
      : 0;

    // Detect quirks (repeated phrases, unique words)
    const phraseFreq = {};
    samples.forEach(sample => {
      const phrases = sample.text.match(/\b\w+\s+\w+\b/g) || [];
      phrases.forEach(phrase => {
        phraseFreq[phrase.toLowerCase()] = (phraseFreq[phrase.toLowerCase()] || 0) + 1;
      });
    });

    const quirks = Object.entries(phraseFreq)
      .filter(([_, count]) => count >= 3)
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      formality: Math.round(formality),
      averageSentenceLength: Math.round(avgSentenceLength),
      vocabulary: words.length > 0 ? 'varied' : 'limited',
      quirks,
      punctuation: {
        exclamation: (allText.match(/!/g) || []).length,
        question: (allText.match(/\?/g) || []).length,
        ellipsis: (allText.match(/\.\.\./g) || []).length
      }
    };
  };

  /**
   * Calculate voice consistency score
   */
  const calculateConsistencyScore = (samples, patterns) => {
    if (samples.length < 2 || !patterns) return 0;

    // Compare sentence lengths across samples
    const lengths = samples.map(s => s.text.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const consistency = Math.max(0, 100 - (variance / avgLength) * 10);

    return Math.round(consistency);
  };

  /**
   * Word Cloud View
   */
  const renderWordCloud = () => {
    const maxCount = Math.max(...dialogueData.wordCloud.map(w => w.count), 1);

    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">WORD FREQUENCY CLOUD</div>
        <div className="flex flex-wrap gap-2 p-4 bg-slate-900 rounded">
          {dialogueData.wordCloud.map((word, idx) => {
            const size = 12 + (word.count / maxCount) * 16;
            return (
              <span
                key={idx}
                className="text-white hover:text-purple-400 transition-colors"
                style={{ fontSize: `${size}px` }}
                title={`${word.word}: ${word.count} times`}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Speech Patterns View
   */
  const renderSpeechPatterns = () => {
    if (!dialogueData.speechPatterns) {
      return (
        <div className="text-center text-slate-500 p-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No speech pattern data available</p>
        </div>
      );
    }

    const patterns = dialogueData.speechPatterns;

    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">SPEECH PATTERNS</div>
        
        {/* Formality */}
        <div className="bg-slate-900 rounded p-3 border border-slate-700">
          <div className="text-xs font-bold text-white mb-2">Formality Level</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-800 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${patterns.formality}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{patterns.formality}%</span>
          </div>
        </div>

        {/* Sentence Length */}
        <div className="bg-slate-900 rounded p-3 border border-slate-700">
          <div className="text-xs font-bold text-white mb-2">Average Sentence Length</div>
          <div className="text-lg font-bold text-green-400">{patterns.averageSentenceLength} words</div>
        </div>

        {/* Quirks */}
        {patterns.quirks && patterns.quirks.length > 0 && (
          <div className="bg-slate-900 rounded p-3 border border-slate-700">
            <div className="text-xs font-bold text-white mb-2">Speech Quirks</div>
            <div className="space-y-1">
              {patterns.quirks.map((quirk, idx) => (
                <div key={idx} className="text-xs text-slate-300">
                  "{quirk.phrase}" ({quirk.count} times)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Punctuation */}
        <div className="bg-slate-900 rounded p-3 border border-slate-700">
          <div className="text-xs font-bold text-white mb-2">Punctuation Usage</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-400">Exclamations</div>
              <div className="text-white font-bold">{patterns.punctuation.exclamation}</div>
            </div>
            <div>
              <div className="text-slate-400">Questions</div>
              <div className="text-white font-bold">{patterns.punctuation.question}</div>
            </div>
            <div>
              <div className="text-slate-400">Ellipsis</div>
              <div className="text-white font-bold">{patterns.punctuation.ellipsis}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Dialogue Samples View
   */
  const renderSamples = () => {
    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">DIALOGUE SAMPLES</div>
        <div className="space-y-3">
          {dialogueData.samples.map((sample, idx) => {
            const chapterInfo = getChapterInfo(sample.bookId, sample.chapterId);
            return (
              <div key={idx} className="bg-slate-900 rounded p-3 border border-slate-700">
                <div className="text-sm text-white italic mb-2">"{sample.text}"</div>
                {chapterInfo && (
                  <div className="text-xs text-slate-400">
                    {chapterInfo.book.title} • Chapter {chapterInfo.chapter.number}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {dialogueData.samples.length === 0 && (
          <div className="text-center text-slate-500 p-8">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No dialogue samples found</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Get chapter info
   */
  const getChapterInfo = (bookId, chapterId) => {
    if (!books || !books[bookId]) return null;
    const book = books[bookId];
    const chapter = book.chapters?.find(ch => ch.id === chapterId);
    return chapter ? { book, chapter } : null;
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${
            viewMode === 'overview'
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setViewMode('wordcloud')}
          className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${
            viewMode === 'wordcloud'
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Word Cloud
        </button>
        <button
          onClick={() => setViewMode('patterns')}
          className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${
            viewMode === 'patterns'
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Patterns
        </button>
        <button
          onClick={() => setViewMode('samples')}
          className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${
            viewMode === 'samples'
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Samples
        </button>
      </div>

      {/* Overview */}
      {viewMode === 'overview' && (
        <div className="space-y-4">
          {/* Statistics Dashboard - Modern cards */}
          {dialogueData.statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
                <div className="text-xs text-slate-300 uppercase tracking-wider mb-2">Total Dialogue</div>
                <div className={`text-2xl font-bold ${getTextGradient('blue')}`}>{dialogueData.statistics.totalDialogue}</div>
              </div>
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
                <div className="text-xs text-slate-300 uppercase tracking-wider mb-2">Avg Length</div>
                <div className={`text-2xl font-bold ${getTextGradient('green')}`}>{Math.round(dialogueData.statistics.averageLength)}</div>
              </div>
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
                <div className="text-xs text-slate-300 uppercase tracking-wider mb-2">Total Words</div>
                <div className={`text-2xl font-bold ${getTextGradient('purple')}`}>{dialogueData.statistics.totalWords}</div>
              </div>
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
                <div className="text-xs text-slate-300 uppercase tracking-wider mb-2">Unique Words</div>
                <div className={`text-2xl font-bold ${getTextGradient('orange')}`}>{dialogueData.statistics.uniqueWords}</div>
              </div>
            </div>
          )}

          {/* Voice Consistency Score - Modern card */}
          <div className={`${getCardContainerStyles('Common', 'quest')} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-white uppercase tracking-wider text-shadow-soft">Voice Consistency Score</div>
              <div className={`flex items-center gap-2 ${
                dialogueData.consistencyScore >= 80 ? 'text-green-400' :
                dialogueData.consistencyScore >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {dialogueData.consistencyScore >= 80 ? (
                  <CheckCircle className="w-6 h-6 animate-pulse" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
                <span className={`text-2xl font-bold ${getTextGradient(dialogueData.consistencyScore >= 80 ? 'green' : dialogueData.consistencyScore >= 60 ? 'orange' : 'red')}`}>
                  {dialogueData.consistencyScore}%
                </span>
              </div>
            </div>
            <div className={getProgressBarStyles(dialogueData.consistencyScore >= 80 ? 'Epic' : dialogueData.consistencyScore >= 60 ? 'Rare' : 'Common', true).container}>
              <div
                className={getProgressBarStyles(dialogueData.consistencyScore >= 80 ? 'Epic' : dialogueData.consistencyScore >= 60 ? 'Rare' : 'Common', true).fill}
                style={{ width: `${dialogueData.consistencyScore}%` }}
              />
            </div>
          </div>

          {/* Quick Word Cloud Preview - Modern badges */}
          {dialogueData.wordCloud.length > 0 && (
            <div className={`${getCardContainerStyles('Common', 'quest')} p-5`}>
              <div className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <span className="text-shadow-soft">Top Words</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dialogueData.wordCloud.slice(0, 10).map((word, idx) => (
                  <span key={word.word || idx} className={getBadgeStyles('pill', 'blue')}>
                    {word.word} ({word.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content - Modern container */}
      {viewMode === 'wordcloud' && (
        <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
          {renderWordCloud()}
        </div>
      )}
      {viewMode === 'patterns' && (
        <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
          {renderSpeechPatterns()}
        </div>
      )}
      {viewMode === 'samples' && (
        <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
          {renderSamples()}
        </div>
      )}
    </div>
  );
};

export default CharacterDialogueHub;
