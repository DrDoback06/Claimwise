import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Rewind, FastForward, Upload, BookOpen, FileText,
  ChevronLeft, ChevronRight, Minus, Plus, X, Bookmark, 
  Type, Moon, Sun, Download, BarChart3, Eye, EyeOff, Settings
} from 'lucide-react';
import db from '../services/database';
import contextEngine from '../services/contextEngine';
import documentService from '../services/documentService';
import toastService from '../services/toastService';

/**
 * Speed Reader Component
 * Displays text one word at a time with centered positioning
 * Middle letter stays fixed at center point, colored red
 */
const SpeedReader = ({ worldState }) => {
  // State
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(() => {
    const saved = localStorage.getItem('speedreader_speed');
    return saved ? Number(saved) : 300;
  });
  const [sourceType, setSourceType] = useState('chapter'); // 'chapter' | 'document'
  
  // Chapter source state
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  
  // Document source state
  const [uploadedText, setUploadedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Enhancement states
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('speedreader_fontSize');
    return saved ? Number(saved) : 72;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('speedreader_darkMode');
    return saved === null ? true : saved === 'true';
  });
  const [pauseOnPunctuation, setPauseOnPunctuation] = useState(() => {
    const saved = localStorage.getItem('speedreader_pauseOnPunctuation');
    return saved === null ? true : saved === 'true';
  });
  const [showPreview, setShowPreview] = useState(() => {
    const saved = localStorage.getItem('speedreader_showPreview');
    return saved === null ? true : saved === 'true';
  });
  const [focusMode, setFocusMode] = useState(false);
  const [bookmark, setBookmark] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    startTime: null,
    wordsRead: 0,
    totalTime: 0,
    averageSpeed: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const intervalRef = useRef(null);
  const wordDisplayRef = useRef(null);
  const centerPointRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const wordsReadRef = useRef(0);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  // Load books from worldState or database
  const loadBooks = async () => {
    try {
      let loadedBooks = [];
      if (worldState?.books) {
        loadedBooks = Array.isArray(worldState.books) 
          ? worldState.books 
          : Object.values(worldState.books);
      } else {
        loadedBooks = await db.getAll('books');
        loadedBooks = Array.isArray(loadedBooks) 
          ? loadedBooks 
          : Object.values(loadedBooks || {});
      }
      
      setBooks(loadedBooks);
      
      // Auto-select first book/chapter if available
      if (loadedBooks.length > 0 && !selectedBook) {
        const firstBook = loadedBooks[0];
        setSelectedBook(firstBook.id);
        if (firstBook.chapters && firstBook.chapters.length > 0) {
          setChapters(firstBook.chapters);
          setSelectedChapter(firstBook.chapters[0].id || firstBook.chapters[0].number);
        }
      }
    } catch (error) {
      console.error('Error loading books:', error);
      toastService.error('Failed to load books');
    }
  };

  // Update chapters when book changes
  useEffect(() => {
    if (selectedBook && sourceType === 'chapter') {
      const book = books.find(b => b.id === selectedBook);
      if (book?.chapters) {
        setChapters(book.chapters);
        if (book.chapters.length > 0) {
          setSelectedChapter(book.chapters[0].id || book.chapters[0].number);
        } else {
          setSelectedChapter(null);
        }
      }
    }
  }, [selectedBook, books, sourceType]);

  // Load chapter text
  const loadChapterText = async () => {
    if (!selectedBook || !selectedChapter) return;
    
    try {
      const book = books.find(b => b.id === selectedBook);
      if (!book) return;
      
      const chapter = book.chapters.find(
        c => c.id === selectedChapter || c.number === selectedChapter
      );
      
      if (chapter) {
        const text = chapter.content || chapter.script || '';
        if (text) {
          const tokenized = tokenizeText(text);
          setWords(tokenized);
          setCurrentIndex(0);
          setIsPlaying(false);
          toastService.success(`Loaded chapter: ${chapter.title || `Chapter ${chapter.number}`}`);
        } else {
          toastService.warning('Chapter has no content');
          setWords([]);
        }
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      toastService.error('Failed to load chapter');
    }
  };

  // Load chapter when selection changes
  useEffect(() => {
    if (sourceType === 'chapter' && selectedBook && selectedChapter) {
      loadChapterText();
    }
  }, [selectedBook, selectedChapter, sourceType]);

  // Tokenize text into words
  const tokenizeText = (text) => {
    if (!text) return [];
    
    // Split by whitespace and punctuation, preserving punctuation
    return text
      .split(/(\s+|[.,!?;:—–\-"''()\[\]{}]+)/)
      .filter(token => token.trim().length > 0)
      .map(token => token.trim());
  };

  // Handle document upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedData = await documentService.parseFile(file);
      const text = parsedData.text;
      
      if (text) {
        const tokenized = tokenizeText(text);
        setUploadedText(text);
        setUploadedFileName(file.name);
        setWords(tokenized);
        setCurrentIndex(0);
        setIsPlaying(false);
        setSourceType('document');
        toastService.success(`Loaded document: ${file.name}`);
      } else {
        toastService.error('No text could be extracted from document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toastService.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (e.target) e.target.value = '';
    }
  };

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('speedreader_speed', speed.toString());
  }, [speed]);

  useEffect(() => {
    localStorage.setItem('speedreader_fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('speedreader_darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('speedreader_pauseOnPunctuation', pauseOnPunctuation.toString());
  }, [pauseOnPunctuation]);

  useEffect(() => {
    localStorage.setItem('speedreader_showPreview', showPreview.toString());
  }, [showPreview]);

  // Load bookmark on mount
  useEffect(() => {
    const saved = localStorage.getItem('speedreader_bookmark');
    if (saved) {
      try {
        const bookmarkData = JSON.parse(saved);
        setBookmark(bookmarkData);
      } catch (e) {
        console.error('Error loading bookmark:', e);
      }
    }
  }, []);

  // Calculate interval in milliseconds from WPM
  const getIntervalMs = (wpm, word = '') => {
    const baseInterval = (60 / wpm) * 1000;
    
    // Enhancement 5: Pause on punctuation
    if (pauseOnPunctuation && word) {
      // Check if word ends with punctuation
      if (/[.!?]$/.test(word)) {
        return baseInterval * 2; // Double pause for sentence endings
      } else if (/[,;:—]$/.test(word)) {
        return baseInterval * 1.5; // 1.5x pause for commas, semicolons
      }
    }
    
    return baseInterval;
  };

  // Start/stop playback
  const togglePlayPause = () => {
    if (words.length === 0) {
      toastService.warning('No text loaded');
      return;
    }
    
    setIsPlaying(prev => {
      const newState = !prev;
      if (newState && !sessionStartTimeRef.current) {
        // Start session tracking
        sessionStartTimeRef.current = Date.now();
        setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
      }
      return newState;
    });
  };

  // Playback effect with dynamic intervals for punctuation
  useEffect(() => {
    if (isPlaying && words.length > 0 && currentIndex < words.length) {
      let timeoutId;
      
      const advanceWord = () => {
        setCurrentIndex(prev => {
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            // Update session stats
            if (sessionStartTimeRef.current) {
              const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000;
              const wordsRead = prev + 1;
              setSessionStats(prevStats => ({
                ...prevStats,
                wordsRead: wordsRead,
                totalTime: elapsed,
                averageSpeed: elapsed > 0 ? Math.round((wordsRead / elapsed) * 60) : 0
              }));
            }
            return prev;
          }
          
          const newIndex = prev + 1;
          wordsReadRef.current = newIndex;
          
          // Update session stats periodically
          if (sessionStartTimeRef.current && newIndex % 10 === 0) {
            const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000;
            setSessionStats(prevStats => ({
              ...prevStats,
              wordsRead: newIndex,
              totalTime: elapsed,
              averageSpeed: elapsed > 0 ? Math.round((newIndex / elapsed) * 60) : 0
            }));
          }
          
          // Schedule next word with dynamic interval based on the NEW word
          const nextWord = words[newIndex];
          const intervalMs = getIntervalMs(speed, nextWord);
          timeoutId = setTimeout(advanceWord, intervalMs);
          
          return newIndex;
        });
      };
      
      // Start the cycle with current word
      const currentWord = words[currentIndex];
      const intervalMs = getIntervalMs(speed, currentWord);
      timeoutId = setTimeout(advanceWord, intervalMs);
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [isPlaying, words.length, speed, currentIndex, pauseOnPunctuation, words]);

  // Rewind 15 seconds
  const handleRewind = () => {
    if (words.length === 0) return;
    
    const wordsPerSecond = speed / 60;
    const wordsToSkip = Math.floor(wordsPerSecond * 15);
    setCurrentIndex(prev => Math.max(0, prev - wordsToSkip));
    setIsPlaying(false);
  };

  // Forward 15 seconds
  const handleForward = () => {
    if (words.length === 0) return;
    
    const wordsPerSecond = speed / 60;
    const wordsToSkip = Math.floor(wordsPerSecond * 15);
    setCurrentIndex(prev => Math.min(words.length - 1, prev + wordsToSkip));
    setIsPlaying(false);
  };

  // Adjust speed
  const adjustSpeed = (delta) => {
    setSpeed(prev => Math.max(50, Math.min(1500, prev + delta)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (words.length > 0) {
            setIsPlaying(prev => !prev);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (words.length > 0) {
            const wordsPerSecond = speed / 60;
            const wordsToSkip = Math.floor(wordsPerSecond * 15);
            setCurrentIndex(prev => Math.max(0, prev - wordsToSkip));
            setIsPlaying(false);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (words.length > 0) {
            const wordsPerSecond = speed / 60;
            const wordsToSkip = Math.floor(wordsPerSecond * 15);
            setCurrentIndex(prev => Math.min(words.length - 1, prev + wordsToSkip));
            setIsPlaying(false);
          }
          break;
        case 'ArrowUp':
        case '+':
        case '=':
          e.preventDefault();
          setSpeed(prev => Math.max(50, Math.min(1500, prev + 25)));
          break;
        case 'ArrowDown':
        case '-':
        case '_':
          e.preventDefault();
          setSpeed(prev => Math.max(50, Math.min(1500, prev - 25)));
          break;
        case 'Escape':
          e.preventDefault();
          setIsPlaying(false);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          if (words.length > 0) {
            saveBookmark();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [words.length, speed]);

  // Get current word
  const currentWord = words[currentIndex] || '';

  // Calculate middle letter index
  const getMiddleLetterIndex = (word) => {
    if (!word) return 0;
    return Math.floor(word.length / 2);
  };

  // Calculate offset to center the middle letter at fixed point
  // This approximates the width of characters (using 0.6em as average character width)
  const calculateWordOffset = (word) => {
    if (!word) return 0;
    const middleIndex = getMiddleLetterIndex(word);
    const beforeMiddle = word.substring(0, middleIndex);
    // Approximate: each character is roughly 0.6em wide
    const charWidth = fontSize * 0.6;
    const offset = -beforeMiddle.length * charWidth;
    return offset;
  };

  // Enhancement 6: Bookmark functionality
  const saveBookmark = () => {
    if (words.length === 0) {
      toastService.warning('No text to bookmark');
      return;
    }
    const bookmarkData = {
      index: currentIndex,
      word: words[currentIndex],
      sourceType,
      selectedBook,
      selectedChapter,
      uploadedFileName,
      timestamp: Date.now()
    };
    setBookmark(bookmarkData);
    localStorage.setItem('speedreader_bookmark', JSON.stringify(bookmarkData));
    toastService.success('Bookmark saved!');
  };

  const loadBookmark = () => {
    if (!bookmark) {
      toastService.warning('No bookmark saved');
      return;
    }
    setCurrentIndex(bookmark.index);
    setIsPlaying(false);
    toastService.info(`Jumped to bookmark (word ${bookmark.index + 1})`);
  };

  // Enhancement 10: Export session data
  const exportSessionData = () => {
    const data = {
      sessionStats,
      bookmark,
      settings: {
        speed,
        fontSize,
        darkMode,
        pauseOnPunctuation,
        showPreview
      },
      source: {
        sourceType,
        selectedBook,
        selectedChapter,
        uploadedFileName
      },
      timestamp: Date.now()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `speedreader-session-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toastService.success('Session data exported!');
  };

  // Calculate statistics
  const wordsRemaining = words.length - currentIndex - 1;
  const wordsRead = currentIndex + 1;
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
  const timeRemaining = wordsRemaining > 0 ? Math.round((wordsRemaining / speed) * 60) : 0;
  const timeRemainingFormatted = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;
  const getPreviewWords = (count = 5) => {
    if (words.length === 0) return [];
    const start = Math.min(currentIndex + 1, words.length);
    return words.slice(start, start + count);
  };

  // Render word with center letter highlighted
  const renderWord = (word) => {
    if (!word) return null;
    
    const middleIndex = getMiddleLetterIndex(word);
    const beforeMiddle = word.substring(0, middleIndex);
    const middleLetter = word[middleIndex] || '';
    const afterMiddle = word.substring(middleIndex + 1);

    return (
      <span className="inline-block">
        <span className={darkMode ? 'text-white' : 'text-slate-900'}>{beforeMiddle}</span>
        <span className="text-red-500 font-bold">{middleLetter}</span>
        <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{afterMiddle}</span>
      </span>
    );
  };

  // Clear uploaded document
  const clearDocument = () => {
    setUploadedText('');
    setUploadedFileName('');
    setWords([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setSourceType('chapter');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200">
      {/* Header with source selection */}
      <div className={`border-b ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100'} p-4`}>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Source type selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Source:</span>
            <button
              onClick={() => {
                setSourceType('chapter');
                clearDocument();
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sourceType === 'chapter'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1.5" />
              Chapter
            </button>
            <button
              onClick={() => setSourceType('document')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sourceType === 'document'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1.5" />
              Document
            </button>
          </div>

          {/* Chapter selector */}
          {sourceType === 'chapter' && (
            <>
              <select
                value={selectedBook || ''}
                onChange={(e) => setSelectedBook(Number(e.target.value))}
                className={`${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'} px-3 py-1.5 rounded text-sm`}
              >
                <option value="">Select Book</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title || `Book ${book.id}`}
                  </option>
                ))}
              </select>

              {selectedBook && chapters.length > 0 && (
                <select
                  value={selectedChapter || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Try to parse as number, fallback to string
                    setSelectedChapter(isNaN(value) ? value : Number(value));
                  }}
                  className={`${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'} px-3 py-1.5 rounded text-sm`}
                >
                  <option value="">Select Chapter</option>
                  {chapters.map(ch => (
                    <option key={ch.id || ch.number} value={ch.id || ch.number}>
                      {ch.title || `Chapter ${ch.number || ch.id}`}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {/* Document upload */}
          {sourceType === 'document' && (
            <div className="flex items-center gap-2">
              <label className={`px-3 py-1.5 ${darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} rounded text-sm cursor-pointer transition-colors`}>
                <Upload className="w-4 h-4 inline mr-1.5" />
                {isUploading ? 'Uploading...' : 'Upload Document'}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.markdown"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadedFileName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm">
                  <span className="text-slate-300">{uploadedFileName}</span>
                  <button
                    onClick={clearDocument}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Word display area */}
      <div className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden ${focusMode ? 'bg-black' : ''}`}>
        {/* Enhancement 9: Focus mode overlay */}
        {focusMode && (
          <div className="absolute inset-0 bg-black/80 z-10 pointer-events-none" />
        )}
        
        {/* Word display - centered by middle letter */}
        <div
          ref={wordDisplayRef}
          className={`relative z-20 ${focusMode ? 'bg-black/90 p-8 rounded-lg' : ''}`}
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            lineHeight: '1.2',
            userSelect: 'none',
          }}
        >
          {currentWord ? (
            <div
              style={{
                display: 'inline-block',
                transform: currentWord ? `translateX(${calculateWordOffset(currentWord)}px)` : 'none',
                transition: 'transform 0.1s ease-out',
              }}
            >
              {renderWord(currentWord)}
            </div>
          ) : (
            <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>
              {words.length === 0 ? 'Load a chapter or upload a document to begin' : 'Ready'}
            </span>
          )}
        </div>

        {/* Enhancement 8: Text preview */}
        {showPreview && currentWord && getPreviewWords().length > 0 && (
          <div className={`mt-8 text-center z-20 ${focusMode ? 'bg-black/90 p-4 rounded-lg' : ''}`}>
            <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>Next:</div>
            <div className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {getPreviewWords().join(' ')}
            </div>
          </div>
        )}
      </div>

      {/* Enhancement 1: Progress bar */}
      {words.length > 0 && (
        <div className={`border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} px-4 py-2`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`flex-1 h-2 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} min-w-[60px] text-right`}>
              {Math.round(progress)}%
            </span>
          </div>
          
          {/* Enhancement 2: Statistics */}
          <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Words: {wordsRead} / {words.length}</span>
            <span>Remaining: {wordsRemaining}</span>
            <span>Time: {timeRemainingFormatted}</span>
            {sessionStats.averageSpeed > 0 && (
              <span>Avg: {sessionStats.averageSpeed} WPM</span>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={`border-t ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100'} p-4`}>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-3">
          {/* Enhancement buttons */}
          <div className="flex items-center gap-2">
            {/* Bookmark */}
            <button
              onClick={saveBookmark}
              disabled={words.length === 0}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title="Save bookmark (B)"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            {bookmark && (
              <button
                onClick={loadBookmark}
                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} transition-colors`}
                title="Load bookmark"
              >
                <Bookmark className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </button>
            )}
            
            {/* Focus mode */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`p-2 rounded-lg ${focusMode ? 'bg-emerald-500/20 border border-emerald-500/30' : darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} transition-colors`}
              title="Focus mode"
            >
              {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} transition-colors`}
              title="Toggle dark/light mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg ${showSettings ? 'bg-emerald-500/20 border border-emerald-500/30' : darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} transition-colors`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {/* Export */}
            <button
              onClick={exportSessionData}
              disabled={words.length === 0}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-slate-300 hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title="Export session data"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}`}>
            <div className="grid grid-cols-2 gap-4">
              {/* Font size */}
              <div>
                <label className={`text-sm block mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Type className="w-4 h-4 inline mr-1" />
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="36"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Pause on punctuation */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pauseOnPunctuation"
                  checked={pauseOnPunctuation}
                  onChange={(e) => setPauseOnPunctuation(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="pauseOnPunctuation" className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Pause on punctuation
                </label>
              </div>
              
              {/* Show preview */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPreview"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="showPreview" className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Show preview words
                </label>
              </div>
              
              {/* Session stats */}
              {sessionStats.averageSpeed > 0 && (
                <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Session: {sessionStats.wordsRead} words, {Math.round(sessionStats.totalTime)}s, {sessionStats.averageSpeed} WPM avg
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 flex-wrap">
          {/* Rewind */}
          <button
            onClick={handleRewind}
            disabled={words.length === 0}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Rewind 15 seconds (Left Arrow)"
          >
            <Rewind className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            disabled={words.length === 0}
            className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-emerald-400" />
            ) : (
              <Play className="w-6 h-6 text-emerald-400" />
            )}
          </button>

          {/* Forward */}
          <button
            onClick={handleForward}
            disabled={words.length === 0}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Forward 15 seconds (Right Arrow)"
          >
            <FastForward className="w-5 h-5" />
          </button>

          {/* Speed control */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustSpeed(-25)}
              disabled={speed <= 50}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Decrease speed (Down Arrow or -)"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center min-w-[120px]">
              <input
                type="range"
                min="50"
                max="1500"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-slate-400 mt-1">
                {speed} WPM
              </span>
            </div>
            
            <button
              onClick={() => adjustSpeed(25)}
              disabled={speed >= 1500}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Increase speed (Up Arrow or +)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Progress */}
          {words.length > 0 && (
            <div className="text-sm text-slate-400">
              {currentIndex + 1} / {words.length}
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'} text-center mt-3`}>
          Space: Play/Pause • ← →: Rewind/Forward 15s • ↑ ↓: Adjust Speed • Esc: Pause • B: Bookmark
        </div>
      </div>
    </div>
  );
};

export default SpeedReader;
