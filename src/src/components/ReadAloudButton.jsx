/**
 * ReadAloudButton Component
 * Quick button for selection toolbar to start read-aloud
 */

import React from 'react';
import { Volume2 } from 'lucide-react';

const ReadAloudButton = ({ onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Read selected text aloud"
      className="flex flex-col items-center gap-1 px-2 py-2 bg-blue-600/20 hover:bg-blue-600/40 
        disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-blue-400 text-xs font-medium transition-colors"
    >
      <Volume2 className="w-4 h-4" />
      Read Aloud
    </button>
  );
};

export default ReadAloudButton;
