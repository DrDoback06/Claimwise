import React, { useState, useEffect, useRef } from 'react';
import { Volume2, X } from 'lucide-react';
import textToSpeechService from '../services/textToSpeechService';

/**
 * Global Read-Aloud Component
 * Works anywhere in the app when text is selected
 */
const GlobalReadAloud = () => {
  const [selectedText, setSelectedText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const selectionRef = useRef(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && text.length > 3) {
        // Stop any current playback when new selection is made
        if (isPlaying) {
          textToSpeechService.stop();
          setIsPlaying(false);
        }
        
        setSelectedText(text);
        setIsActive(true);
        
        // Get selection position
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          selectionRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.bottom + 10
          };
        }
      } else {
        setIsActive(false);
        setSelectedText('');
      }
    };

    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelection, 100);
    };

    // Listen for text selection
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [isPlaying]);

  const handleReadAloud = async () => {
    if (!selectedText) return;
    
    setShowPanel(true);
    setIsPlaying(true);
    
    try {
      await textToSpeechService.readText(selectedText, {
        onWord: (word, index) => {
          // Could highlight words here if needed
        },
        onComplete: () => {
          setIsPlaying(false);
        },
        onError: (error) => {
          console.error('Read aloud error:', error);
          setIsPlaying(false);
          alert('Failed to read text. Please check your TTS settings.');
        }
      });
    } catch (error) {
      console.error('Read aloud error:', error);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    textToSpeechService.stop();
    setIsPlaying(false);
  };

  if (!isActive && !showPanel) return null;

  return (
    <>
      {/* Floating Read-Aloud Button */}
      {isActive && !showPanel && selectedText && (
        <div
          className="fixed z-[9999] bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg p-2 flex items-center gap-2 cursor-pointer transition-all animate-in fade-in zoom-in-95"
          style={{
            left: selectionRef.current ? `${Math.min(selectionRef.current.x - 60, window.innerWidth - 140)}px` : '50%',
            top: selectionRef.current ? `${Math.min(selectionRef.current.y, window.innerHeight - 100)}px` : '50%',
            transform: selectionRef.current ? 'translateX(-50%)' : 'translate(-50%, -50%)'
          }}
          onClick={handleReadAloud}
          title="Read selected text aloud"
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-xs font-medium">Read Aloud</span>
        </div>
      )}

      {/* Read-Aloud Panel (if opened) */}
      {showPanel && (
        <div
          className="fixed z-[9998] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxWidth: '90vw'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-400" />
              Read Aloud
            </h3>
            <button
              onClick={() => {
                handleStop();
                setShowPanel(false);
                setIsActive(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-slate-300 bg-slate-800 p-3 rounded max-h-32 overflow-y-auto">
              {selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}
            </div>
            
            <div className="flex gap-2">
              {isPlaying ? (
                <button
                  onClick={handleStop}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-medium"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleReadAloud}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium"
                >
                  Play
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalReadAloud;
