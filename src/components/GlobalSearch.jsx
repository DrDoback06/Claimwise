import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Users, Briefcase, Zap, BookOpen, GitBranch } from 'lucide-react';
import toastService from '../services/toastService';

const GlobalSearch = ({ worldState, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const found = [];

    // Search actors
    worldState.actors?.forEach(actor => {
      if (actor.name.toLowerCase().includes(searchTerm) || 
          actor.desc?.toLowerCase().includes(searchTerm) ||
          actor.class?.toLowerCase().includes(searchTerm)) {
        found.push({
          type: 'actor',
          id: actor.id,
          name: actor.name,
          subtitle: actor.class || 'Actor',
          icon: Users
        });
      }
    });

    // Search items
    worldState.itemBank?.forEach(item => {
      if (item.name.toLowerCase().includes(searchTerm) ||
          item.desc?.toLowerCase().includes(searchTerm) ||
          item.type?.toLowerCase().includes(searchTerm)) {
        found.push({
          type: 'item',
          id: item.id,
          name: item.name,
          subtitle: item.type || 'Item',
          icon: Briefcase
        });
      }
    });

    // Search skills
    worldState.skillBank?.forEach(skill => {
      if (skill.name.toLowerCase().includes(searchTerm) ||
          skill.desc?.toLowerCase().includes(searchTerm) ||
          skill.type?.toLowerCase().includes(searchTerm)) {
        found.push({
          type: 'skill',
          id: skill.id,
          name: skill.name,
          subtitle: skill.type || 'Skill',
          icon: Zap
        });
      }
    });

    // Search chapters
    Object.values(worldState.books || {}).forEach(book => {
      book.chapters?.forEach(chapter => {
        if (chapter.title?.toLowerCase().includes(searchTerm) ||
            chapter.desc?.toLowerCase().includes(searchTerm) ||
            chapter.script?.toLowerCase().includes(searchTerm)) {
          found.push({
            type: 'chapter',
            id: chapter.id,
            name: chapter.title,
            subtitle: `${book.title} - Chapter ${chapter.id}`,
            icon: FileText,
            bookId: book.id
          });
        }
      });
    });

    setResults(found.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  }, [query, worldState]);

  const handleSelect = (result) => {
    if (onNavigate) {
      onNavigate(result.type, result.id, result.bookId);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-green-500/50 rounded-lg shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-green-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actors, items, skills, chapters..."
            className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none focus:border-green-500"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-slate-800 border-l-4 ${
                    index === selectedIndex 
                      ? 'bg-slate-800 border-green-500' 
                      : 'border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{result.name}</div>
                    <div className="text-xs text-slate-400">{result.subtitle}</div>
                  </div>
                  <div className="text-xs text-slate-500 uppercase">{result.type}</div>
                </button>
              );
            })}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No results found for "{query}"
          </div>
        )}

        {!query && (
          <div className="p-8 text-center text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start typing to search...</p>
            <p className="text-xs mt-2">Press Esc to close</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;

