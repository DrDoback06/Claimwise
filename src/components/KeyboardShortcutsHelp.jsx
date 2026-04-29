import React, { useState } from 'react';
import { X, Keyboard, Search, Command, ArrowRight } from 'lucide-react';

/**
 * KeyboardShortcutsHelp - Comprehensive keyboard shortcuts reference
 */
const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const shortcutCategories = [
    {
      id: 'global',
      name: 'Global',
      icon: '🌐',
      shortcuts: [
        { keys: ['Ctrl', 'K'], action: 'Open Quick Search', description: 'Search across all entities' },
        { keys: ['Ctrl', '/'], action: 'Show Shortcuts', description: 'Open this help panel' },
        { keys: ['Ctrl', 'S'], action: 'Save', description: 'Save current work' },
        { keys: ['Ctrl', 'Z'], action: 'Undo', description: 'Undo last action' },
        { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo', description: 'Redo undone action' },
        { keys: ['Escape'], action: 'Close Modal', description: 'Close any open modal' },
      ]
    },
    {
      id: 'navigation',
      name: 'Navigation',
      icon: '🧭',
      shortcuts: [
        { keys: ['Alt', '1'], action: 'Go to Personnel', description: 'Open character roster' },
        { keys: ['Alt', '2'], action: 'Go to Inventory', description: 'Open item management' },
        { keys: ['Alt', '3'], action: 'Go to Skills', description: 'Open skill tree' },
        { keys: ['Alt', '4'], action: 'Go to Writer\'s Room', description: 'Open writing canvas' },
        { keys: ['Alt', '5'], action: 'Go to Story Bible', description: 'Open chapter browser' },
        { keys: ['Alt', 'H'], action: 'Go Home', description: 'Return to dashboard' },
      ]
    },
    {
      id: 'writing',
      name: 'Writing',
      icon: '✍️',
      shortcuts: [
        { keys: ['Ctrl', 'Enter'], action: 'Continue Writing', description: 'AI continues your text' },
        { keys: ['Ctrl', 'Shift', 'S'], action: 'Generate Scene', description: 'AI writes a full scene' },
        { keys: ['Ctrl', 'Shift', 'D'], action: 'Add Dialogue', description: 'AI generates dialogue' },
        { keys: ['Ctrl', 'B'], action: 'Bold Selection', description: 'Make text bold' },
        { keys: ['Ctrl', 'I'], action: 'Italic Selection', description: 'Make text italic' },
        { keys: ['Tab'], action: 'Indent', description: 'Indent paragraph' },
        { keys: ['Shift', 'Tab'], action: 'Outdent', description: 'Remove indent' },
      ]
    },
    {
      id: 'selection',
      name: 'Selection Tools',
      icon: '✂️',
      shortcuts: [
        { keys: ['Ctrl', 'R'], action: 'Rewrite Selection', description: 'AI rewrites selected text' },
        { keys: ['Ctrl', 'E'], action: 'Expand Selection', description: 'AI expands selected text' },
        { keys: ['Ctrl', 'Shift', 'F'], action: 'Make Funnier', description: 'Add comedy to selection' },
        { keys: ['Ctrl', 'Shift', 'K'], action: 'Make Darker', description: 'Add darkness to selection' },
        { keys: ['Ctrl', 'Shift', 'C'], action: 'Copy Selection', description: 'Copy to clipboard' },
      ]
    },
    {
      id: 'trackchanges',
      name: 'Track Changes (Pro)',
      icon: '📝',
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'A'], action: 'Accept Change', description: 'Accept current change' },
        { keys: ['Ctrl', 'Shift', 'R'], action: 'Reject Change', description: 'Reject current change' },
        { keys: ['Ctrl', 'Shift', 'L'], action: 'Lock Change', description: 'Lock change for later' },
        { keys: ['Ctrl', 'Shift', 'N'], action: 'Next Change', description: 'Jump to next change' },
        { keys: ['Ctrl', 'Shift', 'P'], action: 'Previous Change', description: 'Jump to previous change' },
      ]
    },
    {
      id: 'panels',
      name: 'Panels',
      icon: '📋',
      shortcuts: [
        { keys: ['Ctrl', '1'], action: 'Toggle Context', description: 'Show/hide smart context' },
        { keys: ['Ctrl', '2'], action: 'Toggle Mood', description: 'Show/hide mood meter' },
        { keys: ['Ctrl', '3'], action: 'Toggle Plot', description: 'Show/hide plot beats' },
        { keys: ['Ctrl', 'Shift', 'M'], action: 'Toggle Focus Mode', description: 'Hide all distractions' },
      ]
    }
  ];

  const allShortcuts = shortcutCategories.flatMap(cat => 
    cat.shortcuts.map(s => ({ ...s, category: cat.name, categoryIcon: cat.icon }))
  );

  const filteredShortcuts = searchQuery
    ? allShortcuts.filter(s => 
        s.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory === 'all'
      ? allShortcuts
      : shortcutCategories.find(c => c.id === activeCategory)?.shortcuts || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden
        animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Keyboard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Master the app with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white 
                placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${activeCategory === 'all' 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              All
            </button>
            {shortcutCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${activeCategory === cat.id 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery ? (
            <div className="space-y-2">
              {filteredShortcuts.length > 0 ? (
                filteredShortcuts.map((shortcut, idx) => (
                  <ShortcutRow key={idx} shortcut={shortcut} showCategory />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No shortcuts found for "{searchQuery}"
                </div>
              )}
            </div>
          ) : activeCategory === 'all' ? (
            <div className="space-y-6">
              {shortcutCategories.map(category => (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <ShortcutRow key={idx} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredShortcuts.map((shortcut, idx) => (
                <ShortcutRow key={idx} shortcut={shortcut} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Command className="w-3.5 h-3.5" />
            <span>On Mac, use Cmd instead of Ctrl</span>
          </div>
          <div className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Ctrl</kbd> + 
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 ml-1">/</kbd> anytime
          </div>
        </div>
      </div>
    </div>
  );
};

const ShortcutRow = ({ shortcut, showCategory = false }) => (
  <div className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, idx) => (
          <React.Fragment key={idx}>
            <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-slate-200 
              group-hover:bg-slate-600 group-hover:border-slate-500 transition-colors min-w-[24px] text-center">
              {key}
            </kbd>
            {idx < shortcut.keys.length - 1 && (
              <span className="text-slate-600 text-xs">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
      <div>
        <div className="text-sm font-medium text-white">{shortcut.action}</div>
        <div className="text-xs text-slate-500">{shortcut.description}</div>
      </div>
    </div>
    {showCategory && shortcut.category && (
      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
        {shortcut.categoryIcon} {shortcut.category}
      </span>
    )}
  </div>
);

export default KeyboardShortcutsHelp;
