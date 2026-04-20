import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, Maximize2, Minimize2, Sparkles, 
  Volume2, Plus, X, ChevronRight
} from 'lucide-react';

/**
 * TextSelectionContextMenu - Right-click context menu for text selection tools
 */
const TextSelectionContextMenu = ({ 
  isOpen, 
  onClose, 
  position = { x: 0, y: 0 },
  selectedText = '',
  onAction 
}) => {
  const menuRef = useRef(null);

  const menuItems = [
    {
      id: 'rewrite',
      label: 'Rewrite',
      icon: RefreshCw,
      description: 'Improve clarity and style',
      section: 'transform'
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: Maximize2,
      description: 'Add more detail',
      section: 'transform'
    },
    {
      id: 'condense',
      label: 'Condense',
      icon: Minimize2,
      description: 'Make more concise',
      section: 'transform'
    },
    {
      id: 'mood',
      label: 'Mood Editor',
      icon: Sparkles,
      description: 'Adjust tone and mood',
      section: 'style'
    },
    {
      id: 'ai-enhance',
      label: 'AI Enhance',
      icon: Sparkles,
      description: 'Open AI Assistant',
      section: 'ai'
    },
    {
      id: 'read-aloud',
      label: 'Read Aloud',
      icon: Volume2,
      description: 'Text-to-speech',
      section: 'tools'
    },
    {
      id: 'entity-interject',
      label: 'Interject Entity',
      icon: Plus,
      description: 'Add character/item/skill',
      section: 'tools'
    }
  ];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleAction = (itemId) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextSelectionContextMenu.jsx:97',message:'Text context menu action',data:{itemId,selectedTextLength:selectedText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    if (onAction) {
      onAction(itemId, { selectedText });
    }
    onClose();
  };

  if (!isOpen || !selectedText) return null;

  // Calculate position (ensure menu stays in viewport)
  const menuWidth = 240;
  const menuHeight = 300;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 10);

  // Group items by section
  const sections = {
    transform: { label: 'Transform', items: [] },
    style: { label: 'Style', items: [] },
    ai: { label: 'AI', items: [] },
    tools: { label: 'Tools', items: [] }
  };

  menuItems.forEach(item => {
    if (sections[item.section]) {
      sections[item.section].items.push(item);
    }
  });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-60"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Text Tools</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Selected Text Preview */}
      <div className="p-2 bg-slate-950 border-b border-slate-800">
        <div className="text-xs text-slate-400 mb-1">{selectedText.length} characters</div>
        <div className="text-xs text-slate-300 line-clamp-2">{selectedText.substring(0, 100)}</div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {Object.entries(sections).map(([sectionKey, section]) => {
          if (section.items.length === 0) return null;
          
          return (
            <div key={sectionKey}>
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                {section.label}
              </div>
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAction(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-left group"
                  >
                    <ItemIcon className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-300 font-medium">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TextSelectionContextMenu;
