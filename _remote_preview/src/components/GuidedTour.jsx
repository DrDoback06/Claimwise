import React, { useState, useEffect } from 'react';
import { Map, X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import TutorialOverlay from './TutorialOverlay';

/**
 * GuidedTour - Step-by-step guided tour through UI elements
 */
const GuidedTour = ({ 
  isOpen, 
  onClose, 
  tourSteps = [],
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);

  const updateTargetElement = () => {
    const step = tourSteps[currentStep];
    if (step && step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      setTargetElement(element);
    } else {
      setTargetElement(null);
    }
  };

  useEffect(() => {
    if (isOpen && tourSteps.length > 0) {
      updateTargetElement();
    }
  }, [isOpen, currentStep, tourSteps]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) onComplete();
    onClose();
  };

  if (!isOpen || tourSteps.length === 0) return null;

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {targetElement && (
        <TutorialOverlay
          targetElement={targetElement}
          message={currentStepData.message}
          position={currentStepData.position || 'bottom'}
          onClose={onClose}
          onNext={handleNext}
        />
      )}

      {/* Tour Control Panel */}
      <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 w-80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Guided Tour</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
          <div className="h-1 bg-slate-800 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {currentStepData.title && (
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-white">{currentStepData.title}</h4>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-medium rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
          >
            {currentStep === tourSteps.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
