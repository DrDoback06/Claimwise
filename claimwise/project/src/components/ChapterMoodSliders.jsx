import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Laugh, 
  Skull, 
  Swords, 
  MessageSquare, 
  Gauge, 
  Sun, 
  Moon,
  Eye,
  Heart,
  CloudRain,
  Zap,
  RotateCcw,
  Save,
  Sparkles
} from 'lucide-react';

/**
 * Chapter Mood Sliders Component
 * Controls the emotional and stylistic parameters for chapter generation
 */
const ChapterMoodSliders = ({ 
  values = {}, 
  onChange, 
  onSavePreset,
  presets = [],
  compact = false 
}) => {
  const defaultValues = {
    comedy_horror: 60,      // 0 = pure horror, 100 = pure comedy
    action_dialogue: 50,    // 0 = all dialogue, 100 = all action
    pacing: 50,             // 0 = slow/contemplative, 100 = fast/frenetic
    tone: 40,               // 0 = light, 100 = dark
    detail: 60,             // 0 = sparse, 100 = rich
    emotional: 50,          // 0 = detached, 100 = deeply emotional
    despair: 30,            // 0 = hopeful, 100 = despairing
    tension: 40             // 0 = calm, 100 = tense
  };

  const [sliderValues, setSliderValues] = useState({ ...defaultValues, ...values });
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);

  useEffect(() => {
    setSliderValues({ ...defaultValues, ...values });
  }, [values]);

  const handleSliderChange = (sliderId, newValue) => {
    const updated = { ...sliderValues, [sliderId]: parseInt(newValue) };
    setSliderValues(updated);
    onChange?.(updated);
  };

  const resetToDefaults = () => {
    setSliderValues(defaultValues);
    onChange?.(defaultValues);
  };

  const loadPreset = (preset) => {
    setSliderValues(preset.values);
    onChange?.(preset.values);
  };

  const saveCurrentAsPreset = () => {
    if (presetName.trim()) {
      onSavePreset?.({
        name: presetName.trim(),
        values: sliderValues,
        createdAt: Date.now()
      });
      setPresetName('');
      setShowPresetSave(false);
    }
  };

  const sliderConfig = [
    {
      id: 'comedy_horror',
      label: 'Comedy ↔ Horror',
      leftLabel: 'Comedy',
      rightLabel: 'Horror',
      leftIcon: <Laugh className="w-4 h-4 text-yellow-400" />,
      rightIcon: <Skull className="w-4 h-4 text-red-400" />,
      description: 'Balance between humorous and horrific elements',
      leftColor: 'from-yellow-500',
      rightColor: 'to-red-500'
    },
    {
      id: 'action_dialogue',
      label: 'Dialogue ↔ Action',
      leftLabel: 'Dialogue',
      rightLabel: 'Action',
      leftIcon: <MessageSquare className="w-4 h-4 text-blue-400" />,
      rightIcon: <Swords className="w-4 h-4 text-orange-400" />,
      description: 'Ratio of conversation to physical action',
      leftColor: 'from-blue-500',
      rightColor: 'to-orange-500'
    },
    {
      id: 'pacing',
      label: 'Slow ↔ Fast',
      leftLabel: 'Contemplative',
      rightLabel: 'Frenetic',
      leftIcon: <Gauge className="w-4 h-4 text-green-400" style={{ transform: 'rotate(-45deg)' }} />,
      rightIcon: <Gauge className="w-4 h-4 text-purple-400" style={{ transform: 'rotate(45deg)' }} />,
      description: 'Speed of narrative progression',
      leftColor: 'from-green-500',
      rightColor: 'to-purple-500'
    },
    {
      id: 'tone',
      label: 'Light ↔ Dark',
      leftLabel: 'Light',
      rightLabel: 'Dark',
      leftIcon: <Sun className="w-4 h-4 text-amber-400" />,
      rightIcon: <Moon className="w-4 h-4 text-indigo-400" />,
      description: 'Overall brightness or darkness of mood',
      leftColor: 'from-amber-400',
      rightColor: 'to-indigo-600'
    },
    {
      id: 'detail',
      label: 'Sparse ↔ Rich',
      leftLabel: 'Sparse',
      rightLabel: 'Rich',
      leftIcon: <Eye className="w-4 h-4 text-slate-400" />,
      rightIcon: <Sparkles className="w-4 h-4 text-pink-400" />,
      description: 'Density of descriptive detail',
      leftColor: 'from-slate-500',
      rightColor: 'to-pink-500'
    },
    {
      id: 'emotional',
      label: 'Detached ↔ Emotional',
      leftLabel: 'Detached',
      rightLabel: 'Emotional',
      leftIcon: <Eye className="w-4 h-4 text-cyan-400" />,
      rightIcon: <Heart className="w-4 h-4 text-rose-400" />,
      description: 'Emotional intensity and reader connection',
      leftColor: 'from-cyan-500',
      rightColor: 'to-rose-500'
    },
    {
      id: 'despair',
      label: 'Hope ↔ Despair',
      leftLabel: 'Hopeful',
      rightLabel: 'Despairing',
      leftIcon: <Sun className="w-4 h-4 text-emerald-400" />,
      rightIcon: <CloudRain className="w-4 h-4 text-gray-400" />,
      description: 'Level of hopelessness or optimism',
      leftColor: 'from-emerald-500',
      rightColor: 'to-gray-600'
    },
    {
      id: 'tension',
      label: 'Calm ↔ Tense',
      leftLabel: 'Calm',
      rightLabel: 'Tense',
      leftIcon: <Heart className="w-4 h-4 text-teal-400" />,
      rightIcon: <Zap className="w-4 h-4 text-yellow-400" />,
      description: 'Underlying tension and suspense',
      leftColor: 'from-teal-500',
      rightColor: 'to-yellow-500'
    }
  ];

  const renderSlider = (config) => {
    const value = sliderValues[config.id];
    
    if (compact) {
      return (
        <div key={config.id} className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              {config.leftIcon}
              <span className="text-xs text-slate-400">{config.label}</span>
              {config.rightIcon}
            </div>
            <span className="text-xs font-mono text-slate-300">{value}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => handleSliderChange(config.id, e.target.value)}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500"
            style={{
              background: `linear-gradient(to right, 
                rgb(234 179 8) 0%, 
                rgb(234 179 8) ${value}%, 
                rgb(51 65 85) ${value}%, 
                rgb(51 65 85) 100%)`
            }}
          />
        </div>
      );
    }

    return (
      <div key={config.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {config.leftIcon}
            <span className="text-sm font-medium text-white">{config.label}</span>
            {config.rightIcon}
          </div>
          <span className="text-sm font-mono text-amber-400 bg-slate-900 px-2 py-1 rounded">
            {value}%
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-20">{config.leftLabel}</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => handleSliderChange(config.id, e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  var(--tw-gradient-stops))`,
                '--tw-gradient-from': config.leftColor.replace('from-', ''),
                '--tw-gradient-to': config.rightColor.replace('to-', '')
              }}
            />
            {/* Custom slider styling */}
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                border: 2px solid rgb(245 158 11);
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              }
              input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                border: 2px solid rgb(245 158 11);
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              }
            `}</style>
          </div>
          <span className="text-xs text-slate-500 w-20 text-right">{config.rightLabel}</span>
        </div>
        
        <p className="text-xs text-slate-500 mt-2">{config.description}</p>
      </div>
    );
  };

  return (
    <div className={compact ? '' : 'bg-slate-900 rounded-xl p-6 border border-slate-700'}>
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold text-white">Chapter Mood</h3>
              <p className="text-xs text-slate-400">Adjust the emotional parameters for generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPresetSave(!showPresetSave)}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Save as preset"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preset save form */}
      {showPresetSave && !compact && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-amber-500/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name (e.g., 'Tense Chase Scene')"
              className="flex-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded text-sm"
            />
            <button
              onClick={saveCurrentAsPreset}
              disabled={!presetName.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-medium rounded text-sm transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Presets */}
      {presets.length > 0 && !compact && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">Quick Presets:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(preset)}
                className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sliders */}
      <div className={compact ? 'space-y-1' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        {sliderConfig.map(renderSlider)}
      </div>

      {/* Summary */}
      {!compact && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-sm text-slate-300">
            <span className="text-amber-400 font-medium">Current mood:</span>{' '}
            {sliderValues.comedy_horror > 60 ? 'Comedic' : sliderValues.comedy_horror < 40 ? 'Horrific' : 'Balanced'},{' '}
            {sliderValues.pacing > 60 ? 'fast-paced' : sliderValues.pacing < 40 ? 'contemplative' : 'moderate pace'},{' '}
            {sliderValues.tone > 60 ? 'dark' : sliderValues.tone < 40 ? 'light' : 'mixed tone'},{' '}
            {sliderValues.emotional > 60 ? 'emotionally intense' : sliderValues.emotional < 40 ? 'detached' : 'moderate emotion'},{' '}
            {sliderValues.tension > 60 ? 'high tension' : sliderValues.tension < 40 ? 'calm' : 'building tension'}.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Built-in presets for common chapter types
 */
export const defaultPresets = [
  {
    name: 'Opening Hook',
    values: {
      comedy_horror: 50,
      action_dialogue: 40,
      pacing: 60,
      tone: 40,
      detail: 70,
      emotional: 40,
      despair: 20,
      tension: 60
    }
  },
  {
    name: 'Tense Confrontation',
    values: {
      comedy_horror: 30,
      action_dialogue: 60,
      pacing: 70,
      tone: 70,
      detail: 50,
      emotional: 70,
      despair: 50,
      tension: 90
    }
  },
  {
    name: 'Comic Relief',
    values: {
      comedy_horror: 90,
      action_dialogue: 30,
      pacing: 50,
      tone: 20,
      detail: 60,
      emotional: 40,
      despair: 10,
      tension: 20
    }
  },
  {
    name: 'Emotional Climax',
    values: {
      comedy_horror: 30,
      action_dialogue: 30,
      pacing: 40,
      tone: 60,
      detail: 80,
      emotional: 95,
      despair: 60,
      tension: 70
    }
  },
  {
    name: 'Action Sequence',
    values: {
      comedy_horror: 50,
      action_dialogue: 90,
      pacing: 90,
      tone: 50,
      detail: 40,
      emotional: 50,
      despair: 30,
      tension: 85
    }
  },
  {
    name: 'Dark Revelation',
    values: {
      comedy_horror: 20,
      action_dialogue: 20,
      pacing: 30,
      tone: 90,
      detail: 70,
      emotional: 80,
      despair: 80,
      tension: 75
    }
  },
  {
    name: 'Quiet Character Moment',
    values: {
      comedy_horror: 50,
      action_dialogue: 20,
      pacing: 20,
      tone: 40,
      detail: 80,
      emotional: 70,
      despair: 30,
      tension: 20
    }
  },
  {
    name: 'Bureaucratic Nightmare',
    values: {
      comedy_horror: 70,
      action_dialogue: 40,
      pacing: 30,
      tone: 60,
      detail: 70,
      emotional: 60,
      despair: 70,
      tension: 50
    }
  }
];

export default ChapterMoodSliders;
