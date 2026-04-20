/**
 * Enhanced Tooltip Component
 * Rich, context-aware tooltips with tutorial mode support
 */

import React, { useState } from 'react';
import { X, HelpCircle, Keyboard, BookOpen, ChevronRight } from 'lucide-react';
import { getTooltip } from '../data/buttonTooltips';

const EnhancedTooltip = ({
  buttonId,
  children,
  position = 'top',
  context = {},
  tutorialMode = false,
  showOnHover = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  const tooltipData = getTooltip(buttonId, context, tutorialMode);
  
  if (!tooltipData) {
    // Fallback to simple tooltip if no data found
    return children;
  }

  const handleMouseEnter = () => {
    if (showOnHover) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (showOnHover && !showFullDetails) {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (tutorialMode) {
      setShowFullDetails(!showFullDetails);
      setIsOpen(true);
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      
      {(isOpen || showFullDetails) && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => {
            if (!showFullDetails) setIsOpen(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-sm w-80 pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                {tutorialMode && (
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xs text-purple-400 font-bold">
                      {tooltipData.tutorialStep}
                    </span>
                  </div>
                )}
                <h4 className="font-semibold text-white text-sm">{tooltipData.title}</h4>
              </div>
              {showFullDetails && (
                <button
                  onClick={() => {
                    setShowFullDetails(false);
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {/* Description */}
              <p className="text-sm text-slate-300">
                {showFullDetails ? tooltipData.detailedDescription : tooltipData.description}
              </p>

              {/* Context-Aware Tip */}
              {tooltipData.contextAwareTip && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                  <p className="text-xs text-blue-300 flex items-start gap-1">
                    <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{tooltipData.contextAwareTip}</span>
                  </p>
                </div>
              )}

              {/* Keyboard Shortcut */}
              {tooltipData.keyboardShortcut && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Shortcut: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                    {tooltipData.keyboardShortcut}
                  </kbd></span>
                </div>
              )}

              {/* Tips (when expanded) */}
              {showFullDetails && tooltipData.tips && tooltipData.tips.length > 0 && (
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Tips:</p>
                  <ul className="space-y-1">
                    {tooltipData.tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tutorial Content */}
              {tutorialMode && tooltipData.tutorialContent && (
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Tutorial Step {tooltipData.tutorialContent.step}
                    </span>
                    {tooltipData.tutorialContent.nextStep && (
                      <button
                        onClick={() => {
                          // Navigate to next step (would be handled by parent)
                          setShowFullDetails(false);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        Next Step
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Expand Button */}
              {!showFullDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDetails(true);
                  }}
                  className="w-full mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 py-1 hover:bg-slate-800 rounded"
                >
                  <BookOpen className="w-3 h-3" />
                  Learn More
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTooltip;
