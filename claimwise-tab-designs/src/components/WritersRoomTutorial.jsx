import React, { useState, useEffect } from 'react';
import { BookOpen, X, ChevronRight, ChevronLeft, Sparkles, CheckCircle, SkipForward } from 'lucide-react';

/**
 * WritersRoomTutorial - Interactive onboarding and guided tours for Writers Room
 */
const WritersRoomTutorial = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showSkip, setShowSkip] = useState(true);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Writer\'s Room',
      description: 'The Writer\'s Room is your AI-powered writing environment. Let\'s take a quick tour of the key features.',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Key Features:</h4>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>AI-powered writing assistance</li>
              <li>Automatic entity extraction</li>
              <li>Context-aware suggestions</li>
              <li>Mood and style editing</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'writing',
      title: 'Writing Your Chapter',
      description: 'Start writing in the main editor. You can type directly or use AI assistance.',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Writing Tips:</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• Right-click anywhere in the editor for AI tools</li>
              <li>• Select text and right-click for rewrite options</li>
              <li>• Use Ctrl+S (Cmd+S) to save and extract entities</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'ai-assist',
      title: 'AI Assistant',
      description: 'The AI Assistant provides context-aware help. Click "AI ASSIST" or right-click in the editor.',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">AI Features:</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• Continue Writing - AI continues from your cursor</li>
              <li>• Generate Scene - Creates complete scenes</li>
              <li>• Add Dialogue - Generates character conversations</li>
              <li>• Enhance - Make text funnier, darker, or more detailed</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'mood-editor',
      title: 'Mood Editor',
      description: 'Adjust the tone and style of your writing with the Mood Editor. Select text and click "MOOD EDITOR".',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Mood Options:</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• Quick Presets - Comedy, Horror, Tense, Dark, Light</li>
              <li>• Advanced Sliders - Fine-tune tension, pacing, detail, etc.</li>
              <li>• Preview before applying changes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'context',
      title: 'Context Management',
      description: 'Select relevant chapters to provide context for AI generation. The AI uses this to maintain consistency.',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Context Features:</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• Select chapters from the sidebar</li>
              <li>• Use "Smart Context" to auto-suggest relevant chapters</li>
              <li>• Context affects AI generation quality</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'extraction',
      title: 'Entity Extraction',
      description: 'When you save, the system automatically extracts characters, items, skills, and more from your text.',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Extraction Features:</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• Automatic detection of entities</li>
              <li>• Review and confirm before adding</li>
              <li>• Updates character stats and relationships</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'You now know the basics of the Writer\'s Room. Start writing and explore the features as you go!',
      content: (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-400 mb-2">Ready to Write!</h4>
            <p className="text-xs text-slate-300">
              Remember: You can always access help by clicking the "Help" button or pressing F1.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => new Set([...prev, tutorialSteps[currentStep].id]));
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
    const allSteps = new Set(tutorialSteps.map(s => s.id));
    setCompletedSteps(allSteps);
    localStorage.setItem('writersRoomTutorialCompleted', 'true');
    if (onComplete) onComplete();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('writersRoomTutorialCompleted', 'true');
    localStorage.setItem('writersRoomTutorialSkipped', 'true');
    onClose();
  };

  useEffect(() => {
    const completed = localStorage.getItem('writersRoomTutorialCompleted');
    if (completed && !isOpen) {
      setShowSkip(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Writer's Room Tutorial</h2>
              <div className="text-xs text-slate-400">
                Step {currentStep + 1} of {tutorialSteps.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSkip && (
              <button
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-700 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-sm text-slate-300">{currentStepData.description}</p>
            </div>
            {currentStepData.content}
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
            {tutorialSteps.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : completedSteps.has(step.id)
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
            {currentStep === tutorialSteps.length - 1 ? (
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

export default WritersRoomTutorial;
