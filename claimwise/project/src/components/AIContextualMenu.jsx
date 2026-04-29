import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Wand2, MessageSquare, FileText, Zap, 
  TrendingUp, TrendingDown, Maximize2, Minimize2,
  RefreshCw, X, ChevronRight
} from 'lucide-react';
import aiService from '../services/aiService';
import StylePreviewPanel from './StylePreviewPanel';
import StyleConnectionIndicator from './StyleConnectionIndicator';

/**
 * AIContextualMenu - Context-aware AI assistance menu
 * Appears on right-click or when clicking AI Assist button
 */
const AIContextualMenu = ({ 
  isOpen, 
  onClose, 
  position = { x: 0, y: 0 },
  selectedText = '',
  cursorContext = '',
  onAction 
}) => {
  const menuRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // Menu sections
  const menuSections = {
    generate: {
      label: 'Generate',
      icon: Sparkles,
      items: [
        { 
          id: 'continue', 
          label: 'Continue Writing', 
          icon: ChevronRight,
          description: 'AI writes next 2-3 paragraphs',
          requiresText: false
        },
        { 
          id: 'scene', 
          label: 'Generate Scene', 
          icon: FileText,
          description: 'Complete 3-5 paragraph scene',
          requiresText: false
        },
        { 
          id: 'dialogue', 
          label: 'Add Dialogue', 
          icon: MessageSquare,
          description: '4-8 lines of character dialogue',
          requiresText: false
        }
      ]
    },
    enhance: {
      label: 'Enhance',
      icon: Wand2,
      items: [
        { 
          id: 'funnier', 
          label: 'Make Funnier', 
          icon: Sparkles,
          description: 'Add wit and humor',
          requiresText: true
        },
        { 
          id: 'darker', 
          label: 'Make Darker', 
          icon: TrendingDown,
          description: 'Add tension and darkness',
          requiresText: true
        },
        { 
          id: 'detail', 
          label: 'Add Detail', 
          icon: Maximize2,
          description: 'Expand with sensory details',
          requiresText: true
        },
        { 
          id: 'tighten', 
          label: 'Tighten Prose', 
          icon: Minimize2,
          description: 'Condense and sharpen',
          requiresText: true
        }
      ]
    },
    transform: {
      label: 'Transform',
      icon: RefreshCw,
      items: [
        { 
          id: 'rewrite', 
          label: 'Rewrite', 
          icon: RefreshCw,
          description: 'Improve clarity and impact',
          requiresText: true
        },
        { 
          id: 'expand', 
          label: 'Expand', 
          icon: Maximize2,
          description: 'Add more content',
          requiresText: true
        },
        { 
          id: 'condense', 
          label: 'Condense', 
          icon: Minimize2,
          description: 'Make more concise',
          requiresText: true
        }
      ]
    }
  };

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

  // Handle menu item click
  const handleAction = async (item) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIContextualMenu.jsx:144',message:'handleAction called',data:{actionId:item.id,requiresText:item.requiresText,hasSelectedText:!!selectedText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (item.requiresText && !selectedText) {
      // Note: toastService would need to be imported, but we'll let parent handle this
      return;
    }

    setIsProcessing(true);
    
    try {
      if (onAction) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIContextualMenu.jsx:153',message:'Calling onAction',data:{actionId:item.id,selectedTextLength:selectedText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        await onAction(item.id, selectedText, customPrompt, {
          cursorContext,
          item
        });
      }
      onClose();
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIContextualMenu.jsx:162',message:'AI action error',data:{error:error.message,actionId:item.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      console.error('AI action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Calculate position (ensure menu stays in viewport)
  const menuWidth = 320;
  const menuHeight = 400;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-80 max-h-[90vh] overflow-y-auto relative"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {/* Style Connection Indicator */}
      <StyleConnectionIndicator
        chapterId={chapterId}
        bookId={bookId}
        position="top-right"
        size="small"
      />
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Context Info */}
      {selectedText && (
        <div className="p-3 bg-slate-950 border-b border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Selected Text</div>
          <div className="text-xs text-slate-300 truncate">{selectedText.substring(0, 50)}...</div>
        </div>
      )}

      {/* Style Preview Panel */}
      {chapterText && (
        <div className="p-3 bg-slate-950 border-b border-slate-800">
          <StylePreviewPanel
            chapterText={chapterText}
            chapterId={chapterId}
            bookId={bookId}
            moodSettings={null}
            moodPreset={null}
            isCollapsible={true}
          />
        </div>
      )}

      {/* Custom Prompt Field */}
      <div className="p-3 bg-slate-950 border-b border-slate-800">
        <label className="text-xs text-slate-400 mb-1 block">Custom Prompt (Optional)</label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Add specific instructions to guide the AI..."
          className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[60px] max-h-[120px]"
          rows={3}
          maxLength={500}
        />
        <div className="text-[10px] text-slate-500 mt-1">{customPrompt.length}/500</div>
      </div>

      {/* Menu Sections */}
      <div className="p-2 space-y-1">
        {Object.entries(menuSections).map(([sectionKey, section]) => {
          const SectionIcon = section.icon;
          const isExpanded = activeSection === sectionKey || activeSection === null;
          
          return (
            <div key={sectionKey}>
              <button
                onClick={() => setActiveSection(activeSection === sectionKey ? null : sectionKey)}
                className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">{section.label}</span>
                </div>
                <ChevronRight 
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} 
                />
              </button>
              
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isDisabled = item.requiresText && !selectedText;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isDisabled && handleAction(item)}
                        disabled={isDisabled || isProcessing}
                        className={`w-full flex items-start gap-3 px-3 py-2 rounded text-left transition-colors ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-slate-800 cursor-pointer'
                        }`}
                        title={item.description}
                      >
                        <ItemIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-300 font-medium">{item.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
        💡 Right-click anywhere in editor to open this menu
      </div>
    </div>
  );
};

export default AIContextualMenu;
