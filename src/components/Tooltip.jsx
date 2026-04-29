import React, { useState, useRef, useEffect } from 'react';

/**
 * Contextual Tooltip Component
 * Provides rich, context-aware tooltips throughout the application
 */
const Tooltip = ({ 
  children, 
  content,           // Main description
  shortcut,          // Keyboard shortcut (optional)
  contextTip,        // Context-aware tip based on app state
  position = 'top',  // top, bottom, left, right
  delay = 300,       // Delay before showing tooltip
  disabled = false,  // Disable tooltip
  maxWidth = 280,    // Max width of tooltip
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 8;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.top - tooltipRect.height - padding;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.bottom + padding;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - padding;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + padding;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      default:
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x < padding) x = padding;
    if (x + tooltipRect.width > viewportWidth - padding) {
      x = viewportWidth - tooltipRect.width - padding;
    }
    if (y < padding) {
      // Flip to bottom if can't fit on top
      y = triggerRect.bottom + padding;
    }
    if (y + tooltipRect.height > viewportHeight - padding) {
      y = viewportHeight - tooltipRect.height - padding;
    }

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, content]);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Determine the actual content to show
  const displayContent = contextTip || content;

  if (!displayContent && !shortcut) {
    return children;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={`inline-flex ${className}`}
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none animate-fadeIn"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            maxWidth: maxWidth,
          }}
        >
          <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl px-3 py-2 text-sm">
            <div className="text-slate-100 leading-relaxed">
              {displayContent}
            </div>
            {shortcut && (
              <div className="mt-1 pt-1 border-t border-slate-700">
                <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-400">
                  {shortcut}
                </kbd>
              </div>
            )}
          </div>
          {/* Arrow pointer */}
          <div 
            className={`absolute w-2 h-2 bg-slate-800 border-slate-600 transform rotate-45 ${
              position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
              position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
              position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
              'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
            }`}
          />
        </div>
      )}
    </>
  );
};

// Add the fadeIn animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.15s ease-out;
  }
`;
if (!document.head.querySelector('[data-tooltip-styles]')) {
  style.setAttribute('data-tooltip-styles', 'true');
  document.head.appendChild(style);
}

export default Tooltip;
