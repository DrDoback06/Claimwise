/**
 * Stat Formula View Component
 */

import React from 'react';
import { Calculator } from 'lucide-react';

const StatFormulaView = ({ stat }) => {
  if (!stat.formula) {
    return (
      <div className="text-center text-slate-500 p-4 text-xs">
        No formula defined
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Calculator className="w-4 h-4" />
        FORMULA
      </div>
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-sm font-mono text-white">{stat.formula}</div>
        {stat.formulaDescription && (
          <div className="text-xs text-slate-400 mt-2">{stat.formulaDescription}</div>
        )}
      </div>
    </div>
  );
};

export default StatFormulaView;
