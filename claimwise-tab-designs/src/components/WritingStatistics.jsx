import React, { useMemo } from 'react';
import { Clock, BarChart3, MessageSquare, FileText, TrendingUp } from 'lucide-react';

/**
 * WritingStatistics - Calculate and display writing statistics
 * Reading time, avg sentence length, dialogue ratio, etc.
 */
const WritingStatistics = ({ content, wordCount }) => {
  const stats = useMemo(() => {
    if (!content) {
      return {
        readingTime: 0,
        avgSentenceLength: 0,
        dialogueRatio: 0,
        paragraphCount: 0,
        sentenceCount: 0,
        dialogueCount: 0,
        avgWordsPerSentence: 0
      };
    }

    // Calculate reading time (average reading speed: 200-250 words per minute)
    const readingTime = Math.ceil(wordCount / 225); // Using 225 as average

    // Count sentences (ending with . ! ?)
    const sentences = content.match(/[.!?]+/g) || [];
    const sentenceCount = sentences.length || 1; // Avoid division by zero

    // Count paragraphs (double line breaks)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    const paragraphCount = paragraphs.length;

    // Calculate average sentence length
    const words = content.split(/\s+/).filter(w => w);
    const avgWordsPerSentence = words.length / sentenceCount;

    // Detect dialogue (text within quotes)
    const dialogueMatches = content.match(/["'""].*?["'"]/g) || [];
    const dialogueWords = dialogueMatches
      .join(' ')
      .split(/\s+/)
      .filter(w => w).length;
    const dialogueRatio = wordCount > 0 ? (dialogueWords / wordCount) * 100 : 0;

    // Calculate average sentence length in characters
    const sentencesArray = content.split(/[.!?]+/).filter(s => s.trim());
    const totalChars = sentencesArray.reduce((sum, s) => sum + s.trim().length, 0);
    const avgSentenceLength = sentencesArray.length > 0 ? totalChars / sentencesArray.length : 0;

    return {
      readingTime,
      avgSentenceLength: Math.round(avgSentenceLength),
      dialogueRatio: Math.round(dialogueRatio * 10) / 10,
      paragraphCount,
      sentenceCount,
      dialogueCount: dialogueMatches.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10
    };
  }, [content, wordCount]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Writing Statistics</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <div>
            <div className="text-slate-400">Reading Time</div>
            <div className="text-white font-medium">{stats.readingTime} min</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <div>
            <div className="text-slate-400">Sentences</div>
            <div className="text-white font-medium">{stats.sentenceCount}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
          <div>
            <div className="text-slate-400">Avg Words/Sentence</div>
            <div className="text-white font-medium">{stats.avgWordsPerSentence}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
          <div>
            <div className="text-slate-400">Dialogue Ratio</div>
            <div className="text-white font-medium">{stats.dialogueRatio}%</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 col-span-2">
          <div className="text-slate-400">Paragraphs:</div>
          <div className="text-white font-medium">{stats.paragraphCount}</div>
          <div className="text-slate-400 ml-auto">Dialogue Lines:</div>
          <div className="text-white font-medium">{stats.dialogueCount}</div>
        </div>
      </div>
    </div>
  );
};

export default WritingStatistics;
