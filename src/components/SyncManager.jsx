import React, { useState, useRef } from 'react';
import { Download, Upload, QrCode, Cloud, FileText, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import syncService from '../services/syncService';
import toastService from '../services/toastService';

const SyncManager = ({ onClose, onDataImported }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState('file'); // 'file' | 'qr' | 'cloud'
  const [mergeStrategy, setMergeStrategy] = useState('merge'); // 'overwrite' | 'merge' | 'skip'
  const [selectiveImport, setSelectiveImport] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  const entityTypes = [
    { id: 'actors', label: 'Actors' },
    { id: 'itemBank', label: 'Items' },
    { id: 'skillBank', label: 'Skills' },
    { id: 'statRegistry', label: 'Stats' },
    { id: 'books', label: 'Books' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'wiki', label: 'Wiki' },
    { id: 'skillTrees', label: 'Skill Trees' },
    { id: 'storyMap', label: 'Story Map' },
    { id: 'snapshots', label: 'Snapshots' },
    { id: 'documents', label: 'Documents' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await syncService.downloadJSON();
      if (result.success) {
        toastService.success('Data exported successfully!');
      } else {
        toastService.error('Export failed: ' + result.error);
      }
    } catch (error) {
      toastService.error('Export error: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateQR = async () => {
    setIsExporting(true);
    try {
      const qrData = await syncService.generateQRCode();
      setQrCodeData(qrData);
      toastService.success('QR code generated!');
    } catch (error) {
      toastService.error('QR code generation failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await syncService.importFromFile(file);
      
      if (result.success) {
        setImportResults(result.results);
        toastService.success('Data imported successfully!');
        if (onDataImported) {
          onDataImported();
        }
      } else {
        toastService.error('Import failed: ' + result.error);
      }
    } catch (error) {
      toastService.error('Import error: ' + error.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (importMode === 'file') {
      fileInputRef.current?.click();
    } else if (importMode === 'qr') {
      // QR scanning would go here
      toastService.info('QR code scanning not yet implemented. Please use file import.');
    } else {
      // Cloud import
      toastService.info('Cloud import not yet implemented. Please use file import.');
    }
  };

  const toggleEntitySelection = (entityId) => {
    setSelectedEntities(prev => 
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center flex-shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <RefreshCw className="mr-3 text-green-500" /> SYNC MANAGER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Export and import your data for mobile/desktop sync</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Export Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-green-500" /> Export Data
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Export all your data to a JSON file that can be imported on another device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${
                  isExporting
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export to File'}
              </button>
              <button
                onClick={handleGenerateQR}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${
                  isExporting
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Generate QR Code
              </button>
            </div>
            {qrCodeData && (
              <div className="mt-4 p-4 bg-slate-950 rounded border border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Scan this QR code with another device:</p>
                {qrCodeData.type === 'download' ? (
                  <div className="text-center">
                    <p className="text-sm text-yellow-400 mb-2">Data too large for QR code. Use file export instead.</p>
                    <a
                      href={qrCodeData.url}
                      download="claimwise-backup.json"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Download backup file
                    </a>
                  </div>
                ) : (
                  <img src={qrCodeData} alt="QR Code" className="mx-auto max-w-xs" />
                )}
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-500" /> Import Data
            </h3>
            
            {/* Import Mode Selection */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 block mb-2">Import Method</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setImportMode('file')}
                  className={`px-4 py-2 rounded text-sm font-bold ${
                    importMode === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  File
                </button>
                <button
                  onClick={() => setImportMode('qr')}
                  className={`px-4 py-2 rounded text-sm font-bold ${
                    importMode === 'qr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4 inline mr-2" />
                  QR Code
                </button>
                <button
                  onClick={() => setImportMode('cloud')}
                  className={`px-4 py-2 rounded text-sm font-bold ${
                    importMode === 'cloud'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Cloud className="w-4 h-4 inline mr-2" />
                  Cloud
                </button>
              </div>
            </div>

            {/* Merge Strategy */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 block mb-2">Merge Strategy</label>
              <select
                value={mergeStrategy}
                onChange={(e) => setMergeStrategy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
              >
                <option value="merge">Merge (update existing, add new)</option>
                <option value="overwrite">Overwrite (replace all)</option>
                <option value="skip">Skip (only add new items)</option>
              </select>
            </div>

            {/* Selective Import */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={selectiveImport}
                  onChange={(e) => setSelectiveImport(e.target.checked)}
                  className="rounded"
                />
                Selective Import (choose which entities to import)
              </label>
            </div>

            {selectiveImport && (
              <div className="mb-4 p-4 bg-slate-950 rounded border border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Select entities to import:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {entityTypes.map(entity => (
                    <label key={entity.id} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEntities.includes(entity.id)}
                        onChange={() => toggleEntitySelection(entity.id)}
                        className="rounded"
                      />
                      {entity.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={isImporting}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-bold ${
                isImporting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Data
                </>
              )}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          {/* Import Results */}
          {importResults && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Import Results
              </h3>
              <div className="space-y-2">
                {Object.entries(importResults.imported).map(([entity, count]) => (
                  <div key={entity} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{entityTypes.find(e => e.id === entity)?.label || entity}</span>
                    <span className="text-green-400">
                      {typeof count === 'number' ? `${count} imported` : `${count.added || 0} added, ${count.updated || 0} updated`}
                    </span>
                  </div>
                ))}
                {Object.keys(importResults.skipped || {}).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm text-yellow-400 mb-2">Skipped:</p>
                    {Object.entries(importResults.skipped).map(([entity, reason]) => (
                      <div key={entity} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{entityTypes.find(e => e.id === entity)?.label || entity}</span>
                        <span className="text-yellow-400">{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(importResults.errors || {}).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm text-red-400 mb-2">Errors:</p>
                    {Object.entries(importResults.errors).map(([entity, error]) => (
                      <div key={entity} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{entityTypes.find(e => e.id === entity)?.label || entity}</span>
                        <span className="text-red-400">{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" /> How to Sync
            </h3>
            <div className="space-y-3 text-sm text-slate-400">
              <div>
                <p className="font-bold text-white mb-1">Desktop to Mobile:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>On desktop, click "Export to File" to download your data</li>
                  <li>Transfer the JSON file to your mobile device (email, cloud storage, etc.)</li>
                  <li>On mobile, open the app and use "Import Data" to load the file</li>
                </ol>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Mobile to Desktop:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>On mobile, export your data</li>
                  <li>Transfer the file to your desktop</li>
                  <li>On desktop, import the file</li>
                </ol>
              </div>
              <div className="pt-3 border-t border-slate-800">
                <p className="text-yellow-400">
                  <strong>Note:</strong> Importing will merge with existing data by default. Use "Overwrite" strategy to replace all data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncManager;

