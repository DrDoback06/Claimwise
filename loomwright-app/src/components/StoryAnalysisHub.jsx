import React, { useState } from 'react';
import { Shield, AlertTriangle, GitBranch, BarChart3, FileText } from 'lucide-react';
import ConsistencyChecker from './ConsistencyChecker';
import PlotThreadTracker from './PlotThreadTracker';

/**
 * StoryAnalysisHub - Combined view for Consistency Checker and Plot Threads
 */
const StoryAnalysisHub = ({ actors, books, itemBank, skillBank, onClose, onJumpToChapter }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'consistency' | 'plotthreads'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'consistency', label: 'Consistency', icon: AlertTriangle },
    { id: 'plotthreads', label: 'Plot Threads', icon: GitBranch }
  ];

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Shield className="mr-3 text-blue-500" />
            STORY ANALYSIS
          </h2>
          <p className="text-sm text-slate-400 mt-1">Consistency checking and plot thread tracking</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 flex gap-2 px-4">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Analysis Overview
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Use the tabs above to access Consistency Checking and Plot Thread Tracking tools.
                  These tools help ensure your story maintains continuity and all plot threads are properly managed.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h4 className="text-sm font-semibold text-white">Consistency Checker</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      AI-powered system to detect inconsistencies across your story including character details, timeline issues, world building, and plot contradictions.
                    </p>
                    <button
                      onClick={() => setActiveTab('consistency')}
                      className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Open Consistency Checker
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-5 h-5 text-purple-400" />
                      <h4 className="text-sm font-semibold text-white">Plot Thread Tracker</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Track and manage multiple plot threads, assign chapters, monitor completion, and ensure all storylines are properly resolved.
                    </p>
                    <button
                      onClick={() => setActiveTab('plotthreads')}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Open Plot Threads
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Tips</h3>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                    <span>Run consistency checks regularly, especially after major story changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                    <span>Keep plot threads updated as you write to track story progression</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                    <span>Use the filters to focus on specific types of issues or threads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                    <span>Mark resolved issues to keep your analysis clean and focused</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consistency' && (
          <ConsistencyChecker
            actors={actors}
            books={books}
            itemBank={itemBank}
            skillBank={skillBank}
            onClose={onClose}
            onJumpToChapter={onJumpToChapter}
          />
        )}

        {activeTab === 'plotthreads' && (
          <PlotThreadTracker
            books={books}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default StoryAnalysisHub;
