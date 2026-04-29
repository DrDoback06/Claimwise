import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Info } from 'lucide-react';

/**
 * FeatureHighlight - Highlights a feature with a tooltip
 */
const FeatureHighlight = ({ 
  children, 
  featureId, 
  message, 
  position = 'top',
  showOnce = true,
  onDismiss 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(`featureHighlight_${featureId}_dismissed`);
    if (!dismissed || !showOnce) {
      setIsVisible(true);
      // Auto-show tooltip after a delay
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [featureId, showOnce]);

  const handleDismiss = () => {
    setIsVisible(false);
    setShowTooltip(false);
    if (showOnce) {
      localStorage.setItem(`featureHighlight_${featureId}_dismissed`, 'true');
    }
    if (onDismiss) onDismiss();
  };

  if (!isVisible) {
    return <>{children}</>;
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div ref={elementRef} className="relative inline-block">
      {children}
      {showTooltip && (
        <div className={`absolute z-50 ${positions[position]}`}>
          <div className="bg-slate-900 border border-blue-500 rounded-lg shadow-2xl p-3 max-w-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-white">{message}</p>
                <button
                  onClick={handleDismiss}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Got it
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-slate-900 border-blue-500 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-r border-b rotate-45' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-l border-t rotate-45' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-r border-t rotate-45' :
              'right-full top-1/2 -translate-y-1/2 border-l border-b rotate-45'
            }`} />
          </div>
        </div>
      )}
      {isVisible && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

export default FeatureHighlight;
