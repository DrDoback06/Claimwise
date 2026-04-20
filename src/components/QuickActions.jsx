import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Command, ArrowRight, FileText, Users, Package, 
  Sparkles, BookOpen, Map, Network, Clock, Settings,
  Plus, Zap, PenTool, Target, Brain, Palette
} from 'lucide-react';

/**
 * QuickActions - Command palette / Quick action menu (Ctrl+K)
 * Provides fast access to all app features
 */
const QuickActions = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  worldState,
  onAction 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  
  // Search history
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('quick_actions_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // All available actions
  const allActions = [
    // Navigation
    { id: 'nav-home', icon: Target, label: 'Go to Home', category: 'Navigation', action: () => onNavigate('home') },
    { id: 'nav-story', icon: PenTool, label: 'Go to Writer\'s Room', category: 'Navigation', action: () => onNavigate('story') },
    { id: 'nav-personnel', icon: Users, label: 'Go to Personnel', category: 'Navigation', action: () => onNavigate('personnel') },
    { id: 'nav-items', icon: Package, label: 'Go to Inventory', category: 'Navigation', action: () => onNavigate('items') },
    { id: 'nav-skills', icon: Sparkles, label: 'Go to Skills', category: 'Navigation', action: () => onNavigate('skills') },
    { id: 'nav-bible', icon: BookOpen, label: 'Go to Story Bible', category: 'Navigation', action: () => onNavigate('bible') },
    { id: 'nav-mindmap', icon: Network, label: 'Go to Mind Map', category: 'Navigation', action: () => onNavigate('mindmap') },
    { id: 'nav-timeline', icon: Clock, label: 'Go to Timeline', category: 'Navigation', action: () => onNavigate('timeline') },
    { id: 'nav-settings', icon: Settings, label: 'Open Settings', category: 'Navigation', action: () => onAction?.('openSettings') },
    
    // Quick Create
    { id: 'create-chapter', icon: Plus, label: 'New Chapter', category: 'Create', action: () => onAction?.('newChapter') },
    { id: 'create-character', icon: Users, label: 'New Character', category: 'Create', action: () => onAction?.('newCharacter') },
    { id: 'create-item', icon: Package, label: 'New Item', category: 'Create', action: () => onAction?.('newItem') },
    { id: 'create-skill', icon: Zap, label: 'New Skill', category: 'Create', action: () => onAction?.('newSkill') },
    
    // AI Actions
    { id: 'ai-continue', icon: Brain, label: 'AI: Continue Writing', category: 'AI', action: () => onAction?.('aiContinue') },
    { id: 'ai-scene', icon: Sparkles, label: 'AI: Generate Scene', category: 'AI', action: () => onAction?.('aiScene') },
    { id: 'ai-review', icon: FileText, label: 'AI: Review Chapter', category: 'AI', action: () => onAction?.('aiReview') },
    
    // Tools
    { id: 'tool-backup', icon: FileText, label: 'Backup Project', category: 'Tools', action: () => onAction?.('backup') },
    { id: 'tool-export', icon: FileText, label: 'Export to PDF', category: 'Tools', action: () => onAction?.('exportPdf') },
    { id: 'tool-wizard', icon: Palette, label: 'Story Setup Wizard', category: 'Tools', action: () => onNavigate('wizard') },
  ];

  // Add dynamic actions based on worldState
  const dynamicActions = [];
  
  // Add recent chapters
  if (worldState?.books) {
    Object.values(worldState.books).forEach(book => {
      book.chapters?.slice(0, 3).forEach(chapter => {
        dynamicActions.push({
          id: `chapter-${book.id}-${chapter.id}`,
          icon: FileText,
          label: `Open: ${chapter.title}`,
          category: 'Recent Chapters',
          action: () => onAction?.('openChapter', { bookId: book.id, chapterId: chapter.id })
        });
      });
    });
  }

  // Add characters
  if (worldState?.actors) {
    worldState.actors.slice(0, 5).forEach(actor => {
      dynamicActions.push({
        id: `actor-${actor.id}`,
        icon: Users,
        label: `View: ${actor.name}`,
        category: 'Characters',
        action: () => onAction?.('viewActor', actor.id)
      });
    });
  }

  const actions = [...allActions, ...dynamicActions];

  // Filter actions based on query
  const filteredActions = query
    ? actions.filter(action => 
        action.label.toLowerCase().includes(query.toLowerCase()) ||
        action.category.toLowerCase().includes(query.toLowerCase())
      )
    : actions;

  // Group by category
  const groupedActions = filteredActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(action);
    return groups;
  }, {});

  // Flatten for keyboard navigation
  const flatActions = Object.values(groupedActions).flat();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatActions[selectedIndex]) {
      e.preventDefault();
      const action = flatActions[selectedIndex];
      action.action();
      
      // Save to search history
      if (query.trim()) {
        const newHistory = [
          { query: query.trim(), timestamp: Date.now() },
          ...searchHistory.filter(h => h.query !== query.trim())
        ].slice(0, 10); // Keep last 10
        setSearchHistory(newHistory);
        localStorage.setItem('quick_actions_history', JSON.stringify(newHistory));
      }
      
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  // Autocomplete suggestions from history
  const historySuggestions = useMemo(() => {
    if (!query) return [];
    return searchHistory
      .filter(h => h.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);
  }, [query, searchHistory]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden
          animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, pages, characters..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-lg"
            />
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded ml-2">↵</kbd>
              <span>select</span>
            </div>
          </div>
          
          {/* Autocomplete suggestions from history */}
          {historySuggestions.length > 0 && query && (
            <div className="px-4 pb-2 border-t border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Recent searches:</div>
              <div className="flex flex-wrap gap-1">
                {historySuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(suggestion.query);
                      inputRef.current?.focus();
                    }}
                    className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                  >
                    {suggestion.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {Object.entries(groupedActions).length > 0 ? (
            Object.entries(groupedActions).map(([category, categoryActions]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-800/50 sticky top-0">
                  {category}
                </div>
                {categoryActions.map((action, idx) => {
                  const globalIndex = flatActions.findIndex(a => a.id === action.id);
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action();
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors
                        ${globalIndex === selectedIndex 
                          ? 'bg-amber-500/20 text-white' 
                          : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <Icon className={`w-4 h-4 ${globalIndex === selectedIndex ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="flex-1 text-left">{action.label}</span>
                      {globalIndex === selectedIndex && (
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-slate-500">
              No actions found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Command className="w-3.5 h-3.5" />
            <span>Quick Actions</span>
          </div>
          <span>Press <kbd className="px-1 bg-slate-800 rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
