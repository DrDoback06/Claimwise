import React from 'react';
import { X, Sparkles } from 'lucide-react';

/**
 * TutorialOverlay - Overlay for highlighting UI elements during tutorials
 */
const TutorialOverlay = ({ 
  targetElement, 
  message, 
  position = 'bottom',
  onClose,
  onNext 
}) => {
  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();
  
  const positions = {
    top: { top: rect.top - 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' },
    bottom: { top: rect.bottom + 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' },
    left: { top: rect.top + rect.height / 2, left: rect.left - 10, transform: 'translate(-100%, -50%)' },
    right: { top: rect.top + rect.height / 2, left: rect.right + 10, transform: 'translate(0, -50%)' }
  };

  const style = positions[position] || positions.bottom;

  return (
    <>
      {/* Highlight Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 pointer-events-none"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${rect.left}px 100%, 
            ${rect.left}px ${rect.top}px, 
            ${rect.right}px ${rect.top}px, 
            ${rect.right}px ${rect.bottom}px, 
            ${rect.left}px ${rect.bottom}px, 
            ${rect.left}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />
      
      {/* Highlight Border */}
      <div
        className="fixed z-50 border-4 border-blue-500 rounded-lg pointer-events-none animate-pulse"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-slate-900 border border-blue-500 rounded-lg shadow-2xl p-4 max-w-sm pointer-events-auto"
        style={style}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white">{message}</p>
            <div className="flex gap-2 mt-3">
              {onNext && (
                <button
                  onClick={onNext}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
                >
                  Next
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default TutorialOverlay;
