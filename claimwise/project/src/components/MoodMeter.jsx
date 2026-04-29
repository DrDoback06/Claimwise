import React, { useState, useEffect } from 'react';
import { 
  Smile, Skull, Zap, Clock, Heart, Frown, 
  Sun, Moon, AlertTriangle, Sparkles
} from 'lucide-react';

/**
 * MoodMeter - Live visualization of chapter mood balance
 * Tracks comedy/horror, tension, pacing, emotion in real-time
 */
const MoodMeter = ({ 
  text = '', 
  targetMood = {},
  styleProfile = null,
  onMoodUpdate
}) => {
  const [analyzedMood, setAnalyzedMood] = useState({
    comedy: 50,
    horror: 50,
    tension: 50,
    pacing: 50,
    emotion: 50,
    detail: 50
  });

  // Default targets from style profile or generic defaults
  const defaultTargets = styleProfile?.toneBalance ? {
    comedy: styleProfile.toneBalance.comedyPercent || 60,
    horror: styleProfile.toneBalance.horrorPercent || 40,
    tension: 50,
    pacing: 50,
    emotion: 50,
    detail: 50
  } : {
    comedy: 60,
    horror: 40,
    tension: 50,
    pacing: 50,
    emotion: 50,
    detail: 50
  };

  const targets = { ...defaultTargets, ...targetMood };

  // Simple mood analysis based on text content
  useEffect(() => {
    if (!text || text.length < 50) {
      setAnalyzedMood(targets);
      return;
    }

    const wordCount = text.split(/\s+/).filter(w => w).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    
    // Comedy indicators
    const comedyWords = ['laugh', 'funny', 'joke', 'smile', 'grin', 'chuckle', 'absurd', 
                         'ridiculous', 'hilarious', 'snort', 'giggle', 'ironic', 'sarcastic'];
    const comedyCount = comedyWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'gi'))?.length || 0), 0);
    
    // Horror indicators
    const horrorWords = ['dark', 'shadow', 'fear', 'death', 'blood', 'scream', 'horror',
                        'terror', 'dread', 'nightmare', 'creep', 'chill', 'shiver'];
    const horrorCount = horrorWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'gi'))?.length || 0), 0);
    
    // Tension indicators (action words, short sentences)
    const tensionWords = ['suddenly', 'crash', 'bang', 'run', 'fight', 'escape', 'danger',
                         'urgent', 'quick', 'fast', 'now', 'stop', 'freeze'];
    const tensionCount = tensionWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'gi'))?.length || 0), 0);
    
    // Emotion indicators
    const emotionWords = ['love', 'hate', 'feel', 'heart', 'soul', 'tears', 'joy', 
                         'sorrow', 'hope', 'despair', 'anger', 'peace'];
    const emotionCount = emotionWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'gi'))?.length || 0), 0);

    // Calculate mood percentages (normalized to 0-100)
    const comedyScore = Math.min(100, 30 + (comedyCount / Math.max(wordCount, 1)) * 3000);
    const horrorScore = Math.min(100, 30 + (horrorCount / Math.max(wordCount, 1)) * 3000);
    const tensionScore = Math.min(100, 30 + (tensionCount / Math.max(wordCount, 1)) * 2500 + 
                                  Math.max(0, (15 - avgWordsPerSentence) * 5));
    const pacingScore = Math.min(100, Math.max(0, 100 - avgWordsPerSentence * 2.5));
    const emotionScore = Math.min(100, 30 + (emotionCount / Math.max(wordCount, 1)) * 3000);
    const detailScore = Math.min(100, avgWordsPerSentence * 3.5);

    const newMood = {
      comedy: Math.round(comedyScore),
      horror: Math.round(horrorScore),
      tension: Math.round(tensionScore),
      pacing: Math.round(pacingScore),
      emotion: Math.round(emotionScore),
      detail: Math.round(detailScore)
    };

    setAnalyzedMood(newMood);
    onMoodUpdate?.(newMood);
  }, [text]);

  const getMoodDiff = (current, target) => {
    const diff = current - target;
    if (Math.abs(diff) < 10) return 'balanced';
    return diff > 0 ? 'high' : 'low';
  };

  const getColorForDiff = (diff) => {
    if (diff === 'balanced') return 'text-emerald-400';
    if (diff === 'high') return 'text-amber-400';
    return 'text-blue-400';
  };

  const moodMetrics = [
    { 
      key: 'comedy', 
      label: 'Comedy', 
      icon: Smile, 
      color: 'from-yellow-400 to-amber-500',
      oppositeLabel: 'Horror',
      oppositeIcon: Skull
    },
    { 
      key: 'tension', 
      label: 'Tension', 
      icon: Zap, 
      color: 'from-red-400 to-orange-500',
      oppositeLabel: 'Calm',
      oppositeIcon: Sun
    },
    { 
      key: 'pacing', 
      label: 'Fast', 
      icon: Clock, 
      color: 'from-blue-400 to-cyan-500',
      oppositeLabel: 'Slow',
      oppositeIcon: Moon
    },
    { 
      key: 'emotion', 
      label: 'Emotional', 
      icon: Heart, 
      color: 'from-pink-400 to-rose-500',
      oppositeLabel: 'Detached',
      oppositeIcon: Frown
    },
    { 
      key: 'detail', 
      label: 'Rich Detail', 
      icon: Sparkles, 
      color: 'from-purple-400 to-violet-500',
      oppositeLabel: 'Sparse',
      oppositeIcon: AlertTriangle
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs text-slate-500 text-center">
        Live mood analysis based on your text
      </div>

      {moodMetrics.map(metric => {
        const current = analyzedMood[metric.key];
        const target = targets[metric.key];
        const diff = getMoodDiff(current, target);
        const Icon = metric.icon;
        const OppositeIcon = metric.oppositeIcon;

        return (
          <div key={metric.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <OppositeIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">{metric.oppositeLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">{metric.label}</span>
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              {/* Current value bar */}
              <div 
                className={`absolute h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-500`}
                style={{ width: `${current}%` }}
              />
              {/* Target marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm"
                style={{ left: `${target}%` }}
                title={`Target: ${target}%`}
              />
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <span className={getColorForDiff(diff)}>
                {current}%
              </span>
              <span className="text-slate-600">
                Target: {target}%
              </span>
            </div>
          </div>
        );
      })}

      {/* Overall Balance */}
      <div className="pt-3 border-t border-slate-700">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.round(
              moodMetrics.reduce((acc, m) => {
                const current = analyzedMood[m.key];
                const target = targets[m.key];
                return acc + (100 - Math.abs(current - target));
              }, 0) / moodMetrics.length
            )}%
          </div>
          <div className="text-xs text-slate-500">Balance Score</div>
        </div>
      </div>
    </div>
  );
};

export default MoodMeter;
