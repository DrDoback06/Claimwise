import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, GripHorizontal } from 'lucide-react';

/**
 * FloatingPanel - Draggable, resizable floating panel component
 * Used in the WritingCanvas for smart context, mood meter, and AI chat
 */
const FloatingPanel = ({
  id,
  title,
  icon: Icon,
  children,
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 300, height: 400 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 600, height: 800 },
  isOpen = true,
  onClose,
  onToggle,
  isCollapsed = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  zIndex = 10,
  resizable = true,
  collapsible = true,
  closable = true
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);
  const panelRef = useRef(null);

  // Load saved position/size from localStorage and ensure visible bounds
  useEffect(() => {
    const savedState = localStorage.getItem(`panel_${id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.size) setSize(parsed.size);
        if (parsed.collapsed !== undefined) setLocalCollapsed(parsed.collapsed);
        
        // Validate position is within screen bounds
        if (parsed.position) {
          const maxX = window.innerWidth - (parsed.size?.width || size.width);
          const maxY = window.innerHeight - 100; // Leave room at bottom
          const minY = 80; // Leave room for header
          
          setPosition({
            x: Math.max(10, Math.min(parsed.position.x, maxX)),
            y: Math.max(minY, Math.min(parsed.position.y, maxY))
          });
        }
      } catch (e) {
        console.warn('Failed to load panel state:', e);
      }
    } else {
      // Ensure default position is also within bounds
      const maxX = window.innerWidth - defaultSize.width - 10;
      const minY = 80;
      setPosition({
        x: Math.max(10, Math.min(defaultPosition.x, maxX)),
        y: Math.max(minY, defaultPosition.y)
      });
    }
  }, [id]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`panel_${id}`, JSON.stringify({
      position,
      size,
      collapsed: localCollapsed
    }));
  }, [id, position, size, localCollapsed]);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-resize-handle')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - (localCollapsed ? 40 : size.height)));
      setPosition({ x: newX, y: newY });
    } else if (isResizing) {
      const newWidth = Math.max(minSize.width, Math.min(e.clientX - position.x, maxSize.width));
      const newHeight = Math.max(minSize.height, Math.min(e.clientY - position.y, maxSize.height));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, position]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const toggleCollapse = () => {
    setLocalCollapsed(!localCollapsed);
    onToggle?.(!localCollapsed);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`
        fixed bg-slate-900/95 backdrop-blur-sm border border-slate-700
        rounded-xl shadow-2xl shadow-black/30
        transition-all duration-200
        ${isDragging ? 'cursor-grabbing' : ''}
        ${className}
      `}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: localCollapsed ? 'auto' : size.height,
        zIndex: zIndex + (isDragging ? 100 : 0),
        minWidth: minSize.width,
        minHeight: localCollapsed ? 'auto' : minSize.height,
      }}
    >
      {/* Header */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 border-b border-slate-700/50
          cursor-grab active:cursor-grabbing select-none
          bg-gradient-to-r from-slate-800/50 to-slate-800/30
          rounded-t-xl
          ${headerClassName}
        `}
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
        {Icon && <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        <span className="flex-1 text-sm font-medium text-white truncate">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {collapsible && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title={localCollapsed ? 'Expand' : 'Collapse'}
            >
              {localCollapsed ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {closable && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!localCollapsed && (
        <div
          className={`
            overflow-auto
            ${bodyClassName}
          `}
          style={{ height: `calc(100% - 40px)` }}
        >
          {children}
        </div>
      )}

      {/* Resize Handle */}
      {resizable && !localCollapsed && (
        <div
          className="panel-resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-slate-500 opacity-50 hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
};

/**
 * FloatingPanelContainer - Manages multiple floating panels
 */
export const FloatingPanelContainer = ({ children }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="relative w-full h-full pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

export default FloatingPanel;
