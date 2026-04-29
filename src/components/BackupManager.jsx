import React, { useState, useRef } from 'react';
import {
  Download, Upload, FolderPlus, Trash2, AlertTriangle,
  CheckCircle, Loader2, FileArchive, Clock, RefreshCw
} from 'lucide-react';
import backupService from '../services/backupService';

/**
 * BackupManager - UI for project backup, restore, and new project creation
 */
const BackupManager = ({ onProjectChange }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [status, setStatus] = useState(null);
  const [projectName, setProjectName] = useState('my-story');
  
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setIsExporting(true);
    setStatus(null);
    
    try {
      const result = await backupService.exportProject(projectName);
      setStatus({ type: 'success', message: `Backup saved: ${result.filename}` });
    } catch (error) {
      setStatus({ type: 'error', message: `Export failed: ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Confirm import
    if (!window.confirm('This will replace ALL current data. Are you sure you want to import this backup?')) {
      e.target.value = '';
      return;
    }
    
    setIsImporting(true);
    setStatus(null);
    
    try {
      const result = await backupService.importProject(file, true);
      setStatus({ 
        type: 'success', 
        message: `Imported "${result.manifest.projectName}" from ${new Date(result.manifest.exportedAt).toLocaleDateString()}` 
      });
      
      // Notify parent to reload
      setTimeout(() => {
        onProjectChange?.();
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatus({ type: 'error', message: `Import failed: ${error.message}` });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleNewProject = async () => {
    if (!showConfirmReset) {
      setShowConfirmReset(true);
      return;
    }
    
    setIsResetting(true);
    setStatus(null);
    
    try {
      await backupService.startNewProject();
      setStatus({ type: 'success', message: 'Project reset! Reloading...' });
      
      // Reload to show wizard
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setStatus({ type: 'error', message: `Reset failed: ${error.message}` });
      setShowConfirmReset(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickSave = async () => {
    setStatus(null);
    try {
      const result = await backupService.quickSave();
      if (result.success) {
        setStatus({ type: 'success', message: 'Quick save complete!' });
      } else {
        setStatus({ type: 'warning', message: result.reason || 'Quick save failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const quickSaveTime = backupService.getQuickSaveTime();

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          status.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
          status.type === 'warning' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' :
          'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
           status.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
           <AlertTriangle className="w-5 h-5" />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-500" />
          Export Project
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Download your entire project as a ZIP file. Includes all characters, items, 
          chapters, plot beats, and settings.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-500 uppercase mb-1 block">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white 
                placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              placeholder="my-story"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 
                disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileArchive className="w-5 h-5" />
              )}
              {isExporting ? 'Exporting...' : 'Download Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-500" />
          Import Project
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Restore from a backup ZIP file. This will <span className="text-amber-400 font-medium">replace all current data</span>.
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 
            disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isImporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          {isImporting ? 'Importing...' : 'Choose Backup File'}
        </button>
      </div>

      {/* Quick Save Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-green-500" />
          Quick Save
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Save to browser storage for quick recovery. Good for between-session saves.
        </p>
        
        {quickSaveTime && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Clock className="w-4 h-4" />
            Last quick save: {new Date(quickSaveTime).toLocaleString()}
          </div>
        )}
        
        <button
          onClick={handleQuickSave}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 
            text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Quick Save Now
        </button>
      </div>

      {/* New Project Section */}
      <div className="bg-red-950/30 rounded-xl p-6 border border-red-900/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-red-500" />
          Start New Project
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Clear all data and start fresh with the setup wizard. 
          <span className="text-red-400 font-medium"> This cannot be undone!</span>
        </p>
        
        {showConfirmReset ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Are you absolutely sure?</p>
                <p className="text-sm text-slate-400">
                  All characters, chapters, items, and settings will be permanently deleted.
                  Make sure you've exported a backup first!
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNewProject}
                disabled={isResetting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 
                  disabled:bg-slate-700 text-white font-medium rounded-lg transition-colors"
              >
                {isResetting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                {isResetting ? 'Resetting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 px-6 py-2 bg-red-600/50 hover:bg-red-600 
              text-white font-medium rounded-lg transition-colors border border-red-500/30"
          >
            <FolderPlus className="w-5 h-5" />
            Start New Project
          </button>
        )}
      </div>
    </div>
  );
};

export default BackupManager;
