import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { checkStyleConnections } from '../services/styleConnectionService';
import toastService from '../services/toastService';

/**
 * StyleConnectionIndicator - Shows connection status for all style sources
 * Displays multiple lights (one per source) with hover tooltips
 */
const StyleConnectionIndicator = ({ 
  chapterId = null,
  bookId = null,
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  size = 'small' // 'small', 'medium', 'large'
}) => {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [showAllDetails, setShowAllDetails] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [chapterId, bookId]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection check timeout')), 8000)
      );
      
      const connsPromise = checkStyleConnections({ chapterId, bookId });
      const conns = await Promise.race([connsPromise, timeoutPromise]);
      
      setConnections(conns);
      
      // Show toast for any failures (only if significant)
      const failures = conns.filter(c => !c.connected && c.type === 'custom');
      if (failures.length > 0 && failures.length === conns.filter(c => c.type === 'custom').length) {
        // Only warn if ALL custom docs failed
        const failureNames = failures.map(f => f.name).join(', ');
        toastService.warning(`Style connection issues: ${failureNames}`);
      }
    } catch (error) {
      console.error('Failed to check style connections:', error);
      // Set empty connections so indicator still shows
      setConnections([]);
      // Don't show toast on timeout - just show indicator
      if (!error.message?.includes('timeout')) {
        toastService.error('Failed to check style connections');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-2 left-2';
      case 'bottom-right':
        return 'bottom-2 right-2';
      case 'bottom-left':
        return 'bottom-2 left-2';
      case 'top-right':
        // Offset from right edge to avoid blocking X button (X button is typically ~40px from right)
        return 'top-2 right-12';
      default:
        // Default to top-right with offset
        return 'top-2 right-12';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'large':
        return 'w-4 h-4';
      case 'medium':
        return 'w-3 h-3';
      default:
        return 'w-2.5 h-2.5';
    }
  };

  if (isLoading) {
    return (
      <div className={`absolute ${getPositionClasses()} z-[100] flex items-center gap-1.5 bg-slate-900/98 backdrop-blur-md border-2 border-slate-500 rounded-lg px-2.5 py-2 shadow-2xl`}>
        <Loader2 className={`${getSizeClasses()} text-slate-400 animate-spin`} />
        <span className="text-xs text-slate-300 font-medium">Checking connections...</span>
      </div>
    );
  }

  if (connections.length === 0) {
    // Still show indicator even if no connections found
    return (
      <div className={`absolute ${getPositionClasses()} z-[100] flex items-center gap-1.5 bg-slate-900/98 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg px-2.5 py-2 shadow-2xl`}>
        <AlertCircle className={`${getSizeClasses()} text-yellow-400`} />
        <span className="text-xs text-yellow-300 font-medium">No connections</span>
      </div>
    );
  }

  const allConnected = connections.every(c => c.connected);
  const customDocs = connections.filter(c => c.type === 'custom');
  const builtInDocs = connections.filter(c => c.type === 'built-in');

  return (
    <div className={`absolute ${getPositionClasses()} z-[100]`}>
      <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-sm border-2 border-slate-600 rounded-lg px-2 py-1.5 shadow-2xl">
        {/* Status Summary */}
        <div className="flex items-center gap-1">
          {allConnected ? (
            <CheckCircle className={`${getSizeClasses()} text-green-400`} />
          ) : (
            <AlertCircle className={`${getSizeClasses()} text-yellow-400`} />
          )}
        </div>

        {/* Individual Connection Lights */}
        <div className="flex items-center gap-1">
          {/* Built-in Guides */}
          {builtInDocs.map(conn => (
            <div
              key={conn.id}
              className="relative"
              onMouseEnter={() => setHoveredConnection(conn.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            >
              <div
                className={`${getSizeClasses()} rounded-full transition-all border-2 cursor-pointer ${
                  conn.connected
                    ? 'bg-green-500 border-green-300 shadow-lg shadow-green-500/80 animate-pulse hover:scale-110'
                    : 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50 hover:scale-110'
                }`}
                title={conn.name}
              />
              
              {/* Tooltip */}
              {hoveredConnection === conn.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
                  <div className="text-xs font-semibold text-slate-300 mb-1">{conn.name}</div>
                  <div className={`text-xs ${conn.connected ? 'text-green-400' : 'text-red-400'} mb-2`}>
                    {conn.connected ? '✓ Connected' : '✗ Disconnected'}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{conn.details}</div>
                  {conn.error && (
                    <div className="text-xs text-red-400 mt-2 pt-2 border-t border-slate-700">
                      Error: {conn.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Custom Documents */}
          {customDocs.map(conn => (
            <div
              key={conn.id}
              className="relative"
              onMouseEnter={() => setHoveredConnection(conn.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            >
              <div
                className={`${getSizeClasses()} rounded-full transition-all border-2 cursor-pointer ${
                  conn.connected
                    ? 'bg-green-500 border-green-300 shadow-lg shadow-green-500/80 animate-pulse hover:scale-110'
                    : 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50 hover:scale-110'
                }`}
                title={conn.name}
              />
              
              {/* Tooltip */}
              {hoveredConnection === conn.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
                  <div className="text-xs font-semibold text-slate-300 mb-1">{conn.name}</div>
                  <div className={`text-xs ${conn.connected ? 'text-green-400' : 'text-red-400'} mb-2`}>
                    {conn.connected ? '✓ Connected' : '✗ Disconnected'}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{conn.details}</div>
                  
                  {/* Show document list if available */}
                  {conn.documents && conn.documents.length > 0 && (
                    <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
                      <div className="font-semibold mb-1">Documents:</div>
                      {conn.documents.map((doc, idx) => (
                        <div key={doc.id || idx} className="ml-2">
                          • {doc.name} ({doc.type})
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {conn.error && (
                    <div className="text-xs text-red-400 mt-2 pt-2 border-t border-slate-700">
                      Error: {conn.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowAllDetails(!showAllDetails)}
          className="text-xs text-slate-400 hover:text-slate-300 transition-colors ml-1"
          title="Show all connection details"
        >
          {showAllDetails ? '−' : '+'}
        </button>
      </div>

      {/* Expanded Details Panel */}
      {showAllDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 border-2 border-slate-600 rounded-lg p-3 shadow-2xl z-[100]">
          <div className="text-xs font-semibold text-slate-300 mb-3">Style Connection Status</div>
          <div className="space-y-2">
            {connections.map(conn => (
              <div key={conn.id} className="flex items-start gap-2">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    conn.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-300">{conn.name}</div>
                  <div className="text-xs text-slate-400">{conn.details}</div>
                  {conn.documents && conn.documents.length > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {conn.documents.map((doc, idx) => (
                        <span key={doc.id || idx}>
                          {idx > 0 && ', '}
                          {doc.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {conn.error && (
                    <div className="text-xs text-red-400 mt-1">Error: {conn.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleConnectionIndicator;
