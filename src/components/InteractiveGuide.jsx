import React, { useState } from 'react';
import { BookOpen, X, ChevronRight, ChevronLeft, CheckCircle, Play, Pause } from 'lucide-react';

/**
 * InteractiveGuide - Interactive step-by-step guides for features
 */
const InteractiveGuide = ({ 
  isOpen, 
  onClose, 
  guideTitle,
  guideSteps = [],
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
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
    const allSteps = new Set(guideSteps.map((_, i) => i));
    setCompletedSteps(allSteps);
    if (onComplete) onComplete();
    onClose();
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      for (let i = 0; i < stepIndex; i++) {
        newSet.add(i);
      }
      return newSet;
    });
  };

  if (!isOpen || guideSteps.length === 0) return null;

  const currentStepData = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">{guideTitle || 'Interactive Guide'}</h2>
              <div className="text-xs text-slate-400">
                Step {currentStep + 1} of {guideSteps.length}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Step Navigation */}
          <div className="w-64 bg-slate-950 border-r border-slate-800 overflow-y-auto p-4">
            <div className="text-xs font-semibold text-slate-400 mb-3 uppercase">Steps</div>
            <div className="space-y-1">
              {guideSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600 text-white'
                      : completedSteps.has(index)
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {completedSteps.has(index) ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        index === currentStep
                          ? 'border-white bg-white'
                          : 'border-slate-500'
                      }`} />
                    )}
                    <span className="text-xs font-medium">Step {index + 1}</span>
                  </div>
                  <div className="text-xs opacity-75 line-clamp-2">{step.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
                {currentStepData.description && (
                  <p className="text-sm text-slate-300 mb-4">{currentStepData.description}</p>
                )}
              </div>

              {currentStepData.content && (
                <div className="bg-slate-800 rounded-lg p-4">
                  {typeof currentStepData.content === 'string' ? (
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{currentStepData.content}</p>
                  ) : (
                    currentStepData.content
                  )}
                </div>
              )}

              {currentStepData.steps && (
                <div className="space-y-3">
                  {currentStepData.steps.map((subStep, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-1">{subStep.title}</div>
                          {subStep.description && (
                            <div className="text-xs text-slate-300">{subStep.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStepData.tips && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                  <div className="text-sm font-semibold text-blue-400 mb-2">💡 Tips</div>
                  <ul className="space-y-1">
                    {currentStepData.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentStepData.warning && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                  <div className="text-sm font-semibold text-yellow-400 mb-1">⚠️ Warning</div>
                  <div className="text-xs text-slate-300">{currentStepData.warning}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : completedSteps.has(index)
                    ? 'bg-green-500'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
          >
            {currentStep === guideSteps.length - 1 ? (
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
    </div>
  );
};

export default InteractiveGuide;
