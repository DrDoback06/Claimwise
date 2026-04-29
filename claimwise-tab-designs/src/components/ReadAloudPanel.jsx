/**
 * ReadAloudPanel Component
 * Full read-aloud UI with controls, word highlighting, and progress tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  Volume2, VolumeX, Gauge, X, User, Sparkles
} from 'lucide-react';
import textToSpeechService from '../services/textToSpeechService';

const ReadAloudPanel = ({
  text,
  isOpen,
  onClose,
  startPosition = 0, // Character position to start reading from
  onWordHighlight = null // Callback for word highlighting
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [detectedDialogue, setDetectedDialogue] = useState([]);
  const textRef = useRef(null);
  const wordsRef = useRef([]);

  useEffect(() => {
    if (text) {
      wordsRef.current = text.split(/\s+/);
    }
  }, [text]);

  useEffect(() => {
    // Set up word update callback
    textToSpeechService.onWordUpdate = (wordData) => {
      setCurrentWord(wordData.word);
      setCurrentWordIndex(wordData.index);
      setProgress((wordData.index / wordsRef.current.length) * 100);
      
      // Check if we're in dialogue
      const dialogue = textToSpeechService.detectDialogue(text);
      const currentCharIndex = wordData.charIndex;
      const inDialogue = dialogue.find(d => 
        currentCharIndex >= d.start && currentCharIndex <= d.end
      );
      
      if (inDialogue) {
        // Try to detect which character is speaking
        const beforeDialogue = text.substring(0, inDialogue.start);
        const saidMatch = beforeDialogue.match(/(\w+)\s+said|said\s+(\w+)/i);
        if (saidMatch) {
          setCurrentCharacter(saidMatch[1] || saidMatch[2]);
        }
      } else {
        setCurrentCharacter(null);
      }

      // Call external highlight callback
      if (onWordHighlight) {
        onWordHighlight({
          word: wordData.word,
          index: wordData.index,
          charIndex: wordData.charIndex,
          charLength: wordData.charLength
        });
      }
    };

    return () => {
      textToSpeechService.onWordUpdate = null;
    };
  }, [text, onWordHighlight]);

  const handlePlay = async () => {
    // Always stop any current playback first
    textToSpeechService.stop();
    
    if (isPaused) {
      textToSpeechService.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      try {
        const textToRead = startPosition > 0 
          ? text.substring(startPosition)
          : text;

        // Reset state for new reading
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentWordIndex(0);
        setProgress(0);
        setCurrentWord(null);
        setCurrentCharacter(null);
        setCurrentEmotion(null);

        // Detect emotion and dialogue in parallel (non-blocking)
        Promise.all([
          textToSpeechService.detectEmotion(textToRead.substring(0, 500)).catch(() => 'neutral'),
          Promise.resolve(textToSpeechService.detectDialogue(textToRead))
        ]).then(([emotion, dialogue]) => {
          setCurrentEmotion(emotion);
          setDetectedDialogue(dialogue);
        }).catch(() => {
          // Silently fail - emotion detection is optional
          setCurrentEmotion('neutral');
        });

        // Start reading immediately (don't wait for emotion detection)
        await textToSpeechService.readWithHighlights(textToRead, (wordData) => {
          setCurrentWord(wordData.word);
          setCurrentWordIndex(wordData.index);
          setProgress((wordData.index / wordsRef.current.length) * 100);
        });

        setIsPlaying(false);
      } catch (error) {
        console.error('Read aloud error:', error);
        setIsPlaying(false);
        alert('Failed to read text. Please check your TTS settings.');
      }
    }
  };

  const handlePause = () => {
    textToSpeechService.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    textToSpeechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWord(null);
    setCurrentWordIndex(0);
    setProgress(0);
    setCurrentCharacter(null);
    setCurrentEmotion(null);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    textToSpeechService.setSpeed(newSpeed);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    textToSpeechService.setVolume(newVolume);
  };

  const handleSkipBackward = () => {
    // Skip to previous sentence
    if (currentWordIndex > 0) {
      const newIndex = Math.max(0, currentWordIndex - 10); // Approximate sentence
      setCurrentWordIndex(newIndex);
      // Restart from new position
      handleStop();
      // TODO: Implement proper skip
    }
  };

  const handleSkipForward = () => {
    // Skip to next sentence
    if (currentWordIndex < wordsRef.current.length) {
      const newIndex = Math.min(wordsRef.current.length, currentWordIndex + 10); // Approximate sentence
      setCurrentWordIndex(newIndex);
      // Restart from new position
      handleStop();
      // TODO: Implement proper skip
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 
      bg-slate-900/98 backdrop-blur-sm border border-blue-500/50 rounded-xl shadow-2xl 
      w-full max-w-4xl animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-blue-400" />
          <h3 className="font-medium text-white">Read Aloud</h3>
          {currentCharacter && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">
              <User className="w-3 h-3" />
              {currentCharacter}
            </div>
          )}
          {currentEmotion && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-400">
              <Sparkles className="w-3 h-3" />
              {currentEmotion}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}% • Word {currentWordIndex + 1} of {wordsRef.current.length}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Word Highlight */}
      {currentWord && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-slate-700">
          <div className="text-center">
            <span className="text-sm text-slate-400">Reading: </span>
            <span className="text-lg font-bold text-blue-400">{currentWord}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Main Playback Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleSkipBackward}
            disabled={!isPlaying && !isPaused}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 
              rounded-lg text-slate-300 transition-colors"
            title="Previous sentence"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              <Pause className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={!text}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed 
                rounded-lg text-white transition-colors"
            >
              <Play className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 
              rounded-lg text-slate-300 transition-colors"
            title="Stop"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkipForward}
            disabled={!isPlaying && !isPaused}
            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 
              rounded-lg text-slate-300 transition-colors"
            title="Next sentence"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Speed and Volume Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Speed Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Speed</span>
              </div>
              <span className="text-xs text-blue-400 font-medium">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Volume Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {volume > 0 ? (
                  <Volume2 className="w-4 h-4 text-slate-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs text-slate-400">Volume</span>
              </div>
              <span className="text-xs text-blue-400 font-medium">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadAloudPanel;
