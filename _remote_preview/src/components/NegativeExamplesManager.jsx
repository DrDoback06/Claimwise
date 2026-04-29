/**
 * NegativeExamplesManager Component
 * Allows users to mark AI outputs as negative examples with tags
 * System learns from these to avoid similar mistakes
 */

import React, { useState } from 'react';
import { X, Tag, AlertCircle, Trash2 } from 'lucide-react';
import db from '../services/database';

const NEGATIVE_TAGS = [
  'too generic',
  'not funny enough',
  'too dark',
  'wrong tone',
  'out of character',
  'too flowery',
  'not witty enough',
  'lacks emotion',
  'too emotional',
  'pacing wrong',
  'missing sarcasm',
  'too formal',
  'too casual',
  'doesn\'t match style',
  'boring',
  'overwritten',
  'underwritten',
  'confusing'
];

const NegativeExamplesManager = ({ onMarkNegative, currentContent = null, currentMood = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customReason, setCustomReason] = useState('');
  const [requested, setRequested] = useState('');

  const handleMarkNegative = async () => {
    if (selectedTags.length === 0 && !customReason.trim()) {
      alert('Please select at least one tag or provide a reason');
      return;
    }

    try {
      await db.add('negativeExamples', {
        id: `negative_${Date.now()}`,
        content: currentContent || '',
        requested: requested || 'Not specified',
        moodPreset: currentMood || null,
        tags: selectedTags,
        whyWrong: customReason.trim() || null,
        createdAt: Date.now()
      });

      // Reset form
      setSelectedTags([]);
      setCustomReason('');
      setRequested('');
      setIsOpen(false);

      onMarkNegative?.();
    } catch (error) {
      console.error('Error saving negative example:', error);
      alert('Error saving negative example. Please try again.');
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 
          text-red-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
        title="Mark this as a negative example"
      >
        <AlertCircle className="w-4 h-4" />
        Mark as Bad Example
      </button>
    );
  }

  return (
    <div className="bg-slate-900 border border-red-500/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          Mark as Negative Example
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-700 rounded text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">What was requested?</label>
        <input
          type="text"
          value={requested}
          onChange={(e) => setRequested(e.target.value)}
          placeholder="e.g., 'Make this funnier' or 'Rewrite with comedy mood'"
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">What's wrong? (Select tags)</label>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {selectedTags.includes(tag) && <X className="w-3 h-3 inline mr-1" />}
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Additional reason (optional)</label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Explain why this doesn't work..."
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleMarkNegative}
          disabled={selectedTags.length === 0 && !customReason.trim()}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed 
            text-white rounded-lg text-sm flex items-center gap-2"
        >
          <Tag className="w-4 h-4" />
          Save Negative Example
        </button>
      </div>
    </div>
  );
};

export default NegativeExamplesManager;
