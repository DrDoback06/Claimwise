import React, { useState } from 'react';
import { 
  Feather, Zap, Rocket, Check, ChevronRight, 
  Sun, Moon, Sparkles, Eye, EyeOff, Volume2, VolumeX
} from 'lucide-react';

/**
 * WritingModeSelector - Choose between Zen, Standard, and Pro writing modes
 * 
 * Zen Mode: Distraction-free, silent auto-corrections
 * Standard Mode: Basic AI tools, character tracking (view-only)
 * Pro Studio: Full tracked changes, preview panels, everything
 */
const WritingModeSelector = ({ 
  currentMode, 
  onModeChange,
  isOpen,
  onClose 
}) => {
  const [hoveredMode, setHoveredMode] = useState(null);

  const modes = [
    {
      id: 'zen',
      name: 'Zen Mode',
      icon: Feather,
      tagline: 'Just you and the words',
      description: 'Distraction-free writing with silent auto-corrections. No AI buttons, no panels, just a clean canvas for your thoughts.',
      color: 'emerald',
      features: [
        { text: 'Silent spell check', icon: Check },
        { text: 'Auto grammar fixes', icon: Check },
        { text: 'Minimal interface', icon: Check },
        { text: 'Focus timer option', icon: Check },
      ],
      notIncluded: [
        'AI generation tools',
        'Character tracking',
        'Mood analysis',
        'Review suggestions'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      icon: Zap,
      tagline: 'The essentials',
      description: 'All the core features you need. AI tools visible, character and item detection, mood tracking - but without the tracked changes complexity.',
      color: 'amber',
      features: [
        { text: 'AI Continue & Scene', icon: Check },
        { text: 'Character detection', icon: Eye },
        { text: 'Mood meter', icon: Check },
        { text: 'Review button', icon: Check },
      ],
      notIncluded: [
        'Tracked changes',
        'Preview before insert',
        'Mood rewrite panel',
        'Batch operations'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Studio',
      icon: Rocket,
      tagline: 'The ultimate writing tool',
      description: 'Everything Standard has PLUS tracked changes, preview panels, mood rewrites with diff view, and actionable review suggestions. Full AI collaboration.',
      color: 'violet',
      features: [
        { text: 'Tracked changes', icon: Sparkles },
        { text: 'Preview before insert', icon: Eye },
        { text: 'Mood rewrite with diff', icon: Sparkles },
        { text: 'Actionable suggestions', icon: Sparkles },
        { text: 'Accept/Reject/Lock', icon: Sparkles },
        { text: 'Change summary drawer', icon: Sparkles },
      ],
      notIncluded: []
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden
        animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Choose Your Writing Mode</h2>
          <p className="text-sm text-slate-400 mt-1">
            Select the level of AI assistance that fits your workflow
          </p>
        </div>

        {/* Mode Cards */}
        <div className="p-6 grid grid-cols-3 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = currentMode === mode.id;
            const isHovered = hoveredMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => {
                  onModeChange(mode.id);
                  onClose();
                }}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
                className={`
                  relative p-5 rounded-xl border-2 text-left transition-all duration-200
                  ${isSelected 
                    ? `border-${mode.color}-500 bg-${mode.color}-500/10 ring-2 ring-${mode.color}-500/30` 
                    : `border-slate-700 bg-slate-800/50 hover:border-${mode.color}-500/50`
                  }
                `}
              >
                {/* Selected badge */}
                {isSelected && (
                  <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full 
                    bg-${mode.color}-500 text-white text-xs font-bold`}>
                    Active
                  </div>
                )}

                {/* Icon and name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg bg-${mode.color}-500/20`}>
                    <Icon className={`w-6 h-6 text-${mode.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{mode.name}</h3>
                    <p className={`text-xs text-${mode.color}-400`}>{mode.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-400 mb-4 min-h-[3rem]">
                  {mode.description}
                </p>

                {/* Features */}
                <div className="space-y-1.5">
                  {mode.features.map((feature, idx) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <FeatureIcon className={`w-3.5 h-3.5 text-${mode.color}-400`} />
                        <span className="text-slate-300">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Not included (shown on hover) */}
                {mode.notIncluded.length > 0 && isHovered && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Not included:</p>
                    {mode.notIncluded.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                        <EyeOff className="w-3 h-3" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {/* Select arrow */}
                <div className={`
                  absolute bottom-4 right-4 transition-transform duration-200
                  ${isHovered || isSelected ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}
                `}>
                  <ChevronRight className={`w-5 h-5 text-${mode.color}-400`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            💡 You can switch modes anytime from the Writer's Room header
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * WritingModeBadge - Small badge showing current mode, click to change
 */
export const WritingModeBadge = ({ mode, onClick }) => {
  const modeConfig = {
    zen: { icon: Feather, color: 'emerald', label: 'Zen' },
    standard: { icon: Zap, color: 'amber', label: 'Standard' },
    pro: { icon: Rocket, color: 'violet', label: 'Pro' }
  };

  const config = modeConfig[mode] || modeConfig.standard;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg 
        bg-${config.color}-500/20 border border-${config.color}-500/30
        hover:bg-${config.color}-500/30 transition-colors
      `}
      title="Click to change writing mode"
    >
      <Icon className={`w-4 h-4 text-${config.color}-400`} />
      <span className={`text-xs font-medium text-${config.color}-400`}>{config.label}</span>
    </button>
  );
};

export default WritingModeSelector;
