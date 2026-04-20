import React, { useMemo } from 'react';
import { MessageSquare, BarChart3, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * CharacterDialogueAnalysis - Speech pattern analysis for characters
 */
const CharacterDialogueAnalysis = ({ actor, books }) => {
  // Extract all dialogue for this character
  const dialogueData = useMemo(() => {
    if (!actor || !actor.name || !books) return null;

    const allDialogue = [];
    const dialoguePatterns = {
      wordCount: 0,
      sentenceCount: 0,
      averageWordsPerSentence: 0,
      uniqueWords: new Set(),
      commonWords: {},
      commonPhrases: {},
      punctuation: { '?': 0, '!': 0, '.': 0, ',': 0 },
      contractions: 0,
      formalWords: 0,
      casualWords: 0
    };

    // Process all chapters
    const booksArray = Array.isArray(books) ? books : Object.values(books || {});
    if (!booksArray || booksArray.length === 0) {
      return null;
    }
    
    booksArray.forEach(book => {
      if (!book || !book.chapters) return;
      
      book.chapters.forEach(chapter => {
        const chapterText = chapter.script || chapter.desc || '';
        const actorName = actor.name || '';

        // Extract dialogue lines (simple pattern matching)
        const dialogueRegex = new RegExp(`"([^"]*)"`, 'g');
        const lines = chapterText.split('\n');

        lines.forEach(line => {
          // Check if this line contains the character's name and dialogue
          if (line.includes(actorName) && line.includes('"')) {
            const matches = line.match(dialogueRegex);
            if (matches) {
              matches.forEach(dialogue => {
                const cleanDialogue = dialogue.replace(/"/g, '').trim();
                if (cleanDialogue.length > 0) {
                  allDialogue.push({
                    text: cleanDialogue,
                    bookId: book.id,
                    chapterId: chapter.id,
                    chapterTitle: chapter.title
                  });

                  // Analyze dialogue
                  const words = cleanDialogue.split(/\s+/);
                  dialoguePatterns.wordCount += words.length;
                  dialoguePatterns.sentenceCount += (cleanDialogue.match(/[.!?]+/g) || []).length || 1;
                  words.forEach(word => {
                    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
                    if (cleanWord.length > 0) {
                      dialoguePatterns.uniqueWords.add(cleanWord);
                      dialoguePatterns.commonWords[cleanWord] = (dialoguePatterns.commonWords[cleanWord] || 0) + 1;
                    }
                  });

                  // Check punctuation
                  dialoguePatterns.punctuation['?'] += (cleanDialogue.match(/\?/g) || []).length;
                  dialoguePatterns.punctuation['!'] += (cleanDialogue.match(/!/g) || []).length;
                  dialoguePatterns.punctuation['.'] += (cleanDialogue.match(/\./g) || []).length;
                  dialoguePatterns.punctuation[','] += (cleanDialogue.match(/,/g) || []).length;

                  // Check contractions
                  dialoguePatterns.contractions += (cleanDialogue.match(/\b(won't|can't|don't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|wouldn't|couldn't|shouldn't|'ll|'re|'ve|'d|'m)\b/gi) || []).length;

                  // Check formality
                  const formalWords = ['shall', 'ought', 'thus', 'therefore', 'hence', 'moreover', 'furthermore'];
                  const casualWords = ['gonna', 'wanna', 'yeah', 'nah', 'yep', 'nope', 'gotta'];
                  formalWords.forEach(word => {
                    if (cleanDialogue.toLowerCase().includes(word)) dialoguePatterns.formalWords++;
                  });
                  casualWords.forEach(word => {
                    if (cleanDialogue.toLowerCase().includes(word)) dialoguePatterns.casualWords++;
                  });
                }
              });
            }
          }
        });
      });
    });

    // Calculate averages
    dialoguePatterns.averageWordsPerSentence = dialoguePatterns.sentenceCount > 0
      ? dialoguePatterns.wordCount / dialoguePatterns.sentenceCount
      : 0;

    // Get top words and phrases
    const topWords = Object.entries(dialoguePatterns.commonWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Analyze voice consistency
    const voiceConsistency = {
      score: 0,
      issues: []
    };

    if (dialoguePatterns.wordCount > 0) {
      const contractionRatio = dialoguePatterns.contractions / dialoguePatterns.wordCount;
      const questionRatio = dialoguePatterns.punctuation['?'] / dialoguePatterns.sentenceCount;
      const exclamationRatio = dialoguePatterns.punctuation['!'] / dialoguePatterns.sentenceCount;

      // Calculate consistency score (0-100)
      let score = 70; // Base score
      if (contractionRatio > 0.1) score += 10; // Uses contractions consistently
      if (questionRatio > 0.2) score += 5; // Asks questions
      if (exclamationRatio > 0.15) score += 5; // Expressive
      if (dialoguePatterns.formalWords > dialoguePatterns.casualWords) score += 10; // Formal
      else if (dialoguePatterns.casualWords > dialoguePatterns.formalWords) score += 10; // Casual

      voiceConsistency.score = Math.min(100, score);

      // Identify issues
      if (dialoguePatterns.averageWordsPerSentence > 25) {
        voiceConsistency.issues.push('Very long sentences - may need variation');
      }
      if (dialoguePatterns.averageWordsPerSentence < 5) {
        voiceConsistency.issues.push('Very short sentences - may need more depth');
      }
      if (dialoguePatterns.formalWords > 0 && dialoguePatterns.casualWords > 0) {
        voiceConsistency.issues.push('Mixed formal/casual tone - consider consistency');
      }
    }

    return {
      totalDialogue: allDialogue.length,
      totalWords: dialoguePatterns.wordCount,
      totalSentences: dialoguePatterns.sentenceCount,
      averageWordsPerSentence: dialoguePatterns.averageWordsPerSentence.toFixed(1),
      uniqueWordCount: dialoguePatterns.uniqueWords.size,
      topWords,
      punctuation: dialoguePatterns.punctuation,
      contractions: dialoguePatterns.contractions,
      voiceConsistency,
      dialogue: allDialogue.slice(0, 20) // Show first 20 dialogue lines
    };
  }, [actor, books]);

  if (!actor) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a character to analyze dialogue</p>
        </div>
      </div>
    );
  }

  if (!dialogueData || dialogueData.totalDialogue === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No dialogue found for {actor.name}</p>
          <p className="text-xs mt-2">Dialogue will appear here once detected in chapters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Statistics Overview */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Dialogue Analysis
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Total Dialogue</div>
            <div className="text-2xl font-bold text-white">{dialogueData.totalDialogue}</div>
            <div className="text-xs text-slate-500">lines</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Total Words</div>
            <div className="text-2xl font-bold text-white">{dialogueData.totalWords}</div>
            <div className="text-xs text-slate-500">words</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Avg Words/Sentence</div>
            <div className="text-2xl font-bold text-white">{dialogueData.averageWordsPerSentence}</div>
            <div className="text-xs text-slate-500">words</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Unique Words</div>
            <div className="text-2xl font-bold text-white">{dialogueData.uniqueWordCount}</div>
            <div className="text-xs text-slate-500">vocabulary</div>
          </div>
        </div>
      </div>

      {/* Voice Consistency */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Voice Consistency
          </div>
          <div className={`text-lg font-bold ${
            dialogueData.voiceConsistency.score >= 80 ? 'text-green-400' :
            dialogueData.voiceConsistency.score >= 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {dialogueData.voiceConsistency.score}%
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              dialogueData.voiceConsistency.score >= 80 ? 'bg-green-500' :
              dialogueData.voiceConsistency.score >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${dialogueData.voiceConsistency.score}%` }}
          />
        </div>
        {dialogueData.voiceConsistency.issues.length > 0 && (
          <div className="mt-2 space-y-1">
            {dialogueData.voiceConsistency.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-yellow-400">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Words */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-sm font-semibold text-white mb-3">Most Common Words</div>
        <div className="flex flex-wrap gap-2">
          {dialogueData.topWords.map(({ word, count }, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 flex items-center gap-2"
            >
              <span className="text-sm text-white">{word}</span>
              <span className="text-xs text-slate-400">({count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogue Patterns */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-sm font-semibold text-white mb-3">Dialogue Patterns</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Questions</div>
            <div className="text-lg font-semibold text-white">{dialogueData.punctuation['?']}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Exclamations</div>
            <div className="text-lg font-semibold text-white">{dialogueData.punctuation['!']}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Contractions</div>
            <div className="text-lg font-semibold text-white">{dialogueData.contractions}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Formality</div>
            <div className="text-lg font-semibold text-white">
              {dialogueData.contractions > 10 ? 'Casual' : 'Formal'}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Dialogue */}
      <div className="p-4">
        <div className="text-sm font-semibold text-white mb-3">Sample Dialogue</div>
        <div className="space-y-2">
          {dialogueData.dialogue.map((dialogue, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded p-3">
              <div className="text-sm text-slate-300 italic mb-1">"{dialogue.text}"</div>
              <div className="text-xs text-slate-500">
                {dialogue.bookTitle} - {dialogue.chapterTitle}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterDialogueAnalysis;
