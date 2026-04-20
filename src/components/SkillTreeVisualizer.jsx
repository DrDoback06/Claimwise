import React, { useState, useRef, useEffect } from 'react';
import { Zap, Save, Plus, Trash2, Link, Eye, Edit3, ArrowRight, GitBranch, X, GripVertical, Minimize2, Maximize2 } from 'lucide-react';

/**
 * Visual Skill Tree Editor with Flowchart Interface
 * Drag-and-drop, hierarchical arrangement, dependency visualization
 */
const SkillTreeVisualizer = ({ skills, onUpdateTree, onClose, actors, books, currentBook, currentChapter }) => {
  const canvasRef = useRef(null);
  const [treeData, setTreeData] = useState(loadTreeData());
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showConnections, setShowConnections] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasContainerRef = useRef(null);

  // Panel dragging state
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: null }); // null = bottom
  const [panelDragOffset, setPanelDragOffset] = useState({ x: 0, y: 0 });
  
  // Legend state
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const [legendPosition, setLegendPosition] = useState({ x: null, y: 20 }); // null = right
  const [legendDragOffset, setLegendDragOffset] = useState({ x: 0, y: 0 });
  
  // Character assignment
  const [assignedCharacter, setAssignedCharacter] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null); // { from, to }
  const [connectionRequirements, setConnectionRequirements] = useState({ level: null, stats: {}, parentLevel: null, customNotes: '' });
  
  // Get character's current chapter stats
  const getCharacterStats = (characterId, bookId, chapterId) => {
    if (!actors || !characterId) return null;
    const actor = actors.find(a => a.id === characterId);
    if (!actor) return null;
    
    // Get snapshot for current chapter if available
    if (bookId && chapterId) {
      const snapKey = `${bookId}_${chapterId}`;
      const snapshot = actor.snapshots?.[snapKey];
      if (snapshot) {
        return { ...actor.baseStats, ...snapshot.baseStats, ...snapshot.additionalStats };
      }
    }
    
    return actor.baseStats || {};
  };
  
  // Check if skill is available for assigned character
  const isSkillAvailable = (node) => {
    if (!assignedCharacter || !currentBook || !currentChapter) return true;
    
    const skill = getSkill(node.skillId);
    if (!skill || !skill.prerequisites) return true;
    
    const prereqs = skill.prerequisites;
    const charStats = getCharacterStats(assignedCharacter, currentBook, currentChapter);
    if (!charStats) return true;
    
    // Check parent skills
    if (prereqs.parentSkills && prereqs.parentSkills.length > 0) {
      const hasAllParents = prereqs.parentSkills.every(parentId => {
        const parentNode = treeData.nodes.find(n => n.skillId === parentId);
        return parentNode && isSkillAvailable(parentNode);
      });
      if (!hasAllParents) return false;
    }
    
    // Check stat requirements
    if (prereqs.requiredStats) {
      for (const [stat, minValue] of Object.entries(prereqs.requiredStats)) {
        if ((charStats[stat] || 0) < minValue) return false;
      }
    }
    
    // Check level requirement
    if (prereqs.requiredLevel && (charStats.level || 0) < prereqs.requiredLevel) {
      return false;
    }
    
    return true;
  };

  /**
   * Load or initialize tree data
   */
  function loadTreeData() {
    // Try to load from localStorage
    const saved = localStorage.getItem('skillTreeLayout');
    if (saved) {
      return JSON.parse(saved);
    }

    // Create default layout
    return {
      nodes: skills.map((skill, index) => ({
        id: skill.id,
        skillId: skill.id,
        x: 100 + (index % 5) * 200,
        y: 100 + Math.floor(index / 5) * 150,
        tier: skill.tier || 1,
        dependencies: []
      })),
      connections: []
    };
  }

  /**
   * Save tree layout
   */
  const saveTreeLayout = () => {
    localStorage.setItem('skillTreeLayout', JSON.stringify(treeData));
    if (onUpdateTree) {
      onUpdateTree(treeData);
    }
    alert('Skill tree layout saved!');
  };

  /**
   * Get skill data by ID
   */
  const getSkill = (skillId) => skills.find(s => s.id === skillId);

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle panel dragging
  useEffect(() => {
    if (!isDraggingPanel) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - panelDragOffset.x;
      const newY = e.clientY - panelDragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 320; // panel width
      const maxY = window.innerHeight - 100;
      
      setPanelPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(60, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingPanel(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel, panelDragOffset]);

  // Handle legend dragging
  useEffect(() => {
    if (!isDraggingLegend) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - legendDragOffset.x;
      const newY = e.clientY - legendDragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 200; // legend width
      const maxY = window.innerHeight - 300; // legend height
      
      setLegendPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(60, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingLegend(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLegend, legendDragOffset]);

  /**
   * Handle mouse down on node
   */
  const handleNodeMouseDown = (e, node) => {
    if (!editMode || isSpacePressed) return;

    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setSelectedNode(node);
    setDragOffset({
      x: (e.clientX - rect.left - pan.x) / zoom - node.x,
      y: (e.clientY - rect.top - pan.y) / zoom - node.y
    });
  };

  /**
   * Handle mouse down on canvas (for panning)
   */
  const handleCanvasMouseDown = (e) => {
    if (isSpacePressed && e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  /**
   * Check if mouse is over a connection line
   */
  const getConnectionAtPoint = (mouseX, mouseY) => {
    for (const conn of treeData.connections) {
      const fromNode = treeData.nodes.find(n => n.id === conn.from);
      const toNode = treeData.nodes.find(n => n.id === conn.to);
      
      if (!fromNode || !toNode) continue;
      
      const fromX = fromNode.x + 75;
      const fromY = fromNode.y + 40;
      const toX = toNode.x + 75;
      const toY = toNode.y + 40;
      
      // Calculate midpoint and control point for bezier curve
      const cpX = (fromX + toX) / 2;
      const cpY = (fromY + toY) / 2 + Math.abs(toY - fromY) / 4;
      
      // Check if point is near the bezier curve (simplified - check distance to line segments)
      const distToLine1 = distanceToLineSegment(mouseX, mouseY, fromX, fromY, cpX, cpY);
      const distToLine2 = distanceToLineSegment(mouseX, mouseY, cpX, cpY, toX, toY);
      
      if (Math.min(distToLine1, distToLine2) < 10) {
        return conn;
      }
    }
    return null;
  };
  
  /**
   * Calculate distance from point to line segment
   */
  const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Handle mouse move
   */
  const handleMouseMove = (e) => {
    if (isPanning && isSpacePressed) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (isDragging && selectedNode && editMode && !isSpacePressed) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;

      setTreeData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === selectedNode.id ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) } : n
        )
      }));
    } else if (!isDragging && !isPanning) {
      // Check for connection hover
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;
        const conn = getConnectionAtPoint(mouseX, mouseY);
        setHoveredConnection(conn);
      }
    }
  };

  /**
   * Handle mouse up
   */
  const handleMouseUp = (e) => {
    if (isDragging && selectedNode && editMode) {
      // Check if dropped on another node (drag-to-connect)
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;
        
        // Find node under mouse cursor
        const targetNode = treeData.nodes.find(node => {
          if (node.id === selectedNode.id) return false; // Don't connect to self
          const nodeX = node.x;
          const nodeY = node.y;
          const nodeWidth = 120; // Approximate node width
          const nodeHeight = 80; // Approximate node height
          
          return mouseX >= nodeX && mouseX <= nodeX + nodeWidth &&
                 mouseY >= nodeY && mouseY <= nodeY + nodeHeight;
        });
        
        if (targetNode) {
          // Auto-create parent-child connection (dragged skill becomes child of target)
          // Use skill prerequisites to populate connection requirements
          const draggedSkill = getSkill(selectedNode.skillId);
          const targetSkill = getSkill(targetNode.skillId);
          
          if (draggedSkill && targetSkill) {
            const prereqs = draggedSkill.prerequisites || {};
            const connectionRequirements = {
              level: prereqs.requiredLevel || null,
              stats: prereqs.requiredStats || {},
              parentLevel: null, // Can be set manually
              customNotes: ''
            };
            
            addConnection(targetNode.id, selectedNode.id, connectionRequirements);
          } else {
            addConnection(targetNode.id, selectedNode.id);
          }
        }
      }
    }
    setIsDragging(false);
    setIsPanning(false);
  };

  /**
   * Add connection between nodes
   */
  const addConnection = (fromId, toId, requirements = null) => {
    if (fromId === toId) return;

    // Check if connection already exists
    const exists = treeData.connections.some(
      c => c.from === fromId && c.to === toId
    );

    if (!exists) {
      const connection = {
        from: fromId,
        to: toId,
        type: 'prerequisite',
        requirements: requirements || {
          level: null,
          stats: {},
          parentLevel: null,
          customNotes: ''
        }
      };
      
      setTreeData(prev => ({
        ...prev,
        connections: [...prev.connections, connection],
        nodes: prev.nodes.map(n =>
          n.id === toId ? { ...n, dependencies: [...(n.dependencies || []), fromId] } : n
        )
      }));
    }
  };

  /**
   * Remove connection
   */
  const removeConnection = (fromId, toId) => {
    setTreeData(prev => ({
      ...prev,
      connections: prev.connections.filter(
        c => !(c.from === fromId && c.to === toId)
      ),
      nodes: prev.nodes.map(n =>
        n.id === toId ? { ...n, dependencies: (n.dependencies || []).filter(d => d !== fromId) } : n
      )
    }));
  };

  /**
   * Auto-arrange nodes by tier
   */
  const autoArrange = () => {
    const tierGroups = {};
    treeData.nodes.forEach(node => {
      const tier = node.tier || 1;
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(node);
    });

    const arranged = [];
    Object.entries(tierGroups).forEach(([tier, nodes]) => {
      nodes.forEach((node, index) => {
        arranged.push({
          ...node,
          x: 150 + index * 200,
          y: 100 + (parseInt(tier) - 1) * 200
        });
      });
    });

    setTreeData(prev => ({ ...prev, nodes: arranged }));
  };

  /**
   * Draw connections on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x < 5000; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 5000);
      ctx.stroke();
    }
    for (let y = 0; y < 5000; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(5000, y);
      ctx.stroke();
    }

    // Draw connections
    if (showConnections) {
      treeData.connections.forEach(conn => {
        const fromNode = treeData.nodes.find(n => n.id === conn.from);
        const toNode = treeData.nodes.find(n => n.id === conn.to);

        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2 / zoom;

          // Draw arrow
          const fromX = fromNode.x + 75;
          const fromY = fromNode.y + 40;
          const toX = toNode.x + 75;
          const toY = toNode.y + 40;

          // Bezier curve for smooth connection
          const cpX = (fromX + toX) / 2;
          const cpY = (fromY + toY) / 2 + Math.abs(toY - fromY) / 4;

          ctx.moveTo(fromX, fromY);
          ctx.quadraticCurveTo(cpX, cpY, toX, toY);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(toY - cpY, toX - cpX);
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - 10 * Math.cos(angle - Math.PI / 6),
            toY - 10 * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            toX - 10 * Math.cos(angle + Math.PI / 6),
            toY - 10 * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
        }
      });
    }

    ctx.restore();
  }, [treeData, zoom, pan, showConnections]);

  const tierColors = {
    1: '#6b7280',
    2: '#22c55e',
    3: '#3b82f6',
    4: '#a855f7',
    5: '#eab308'
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <GitBranch className="mr-3 text-blue-400" />
            SKILL TREE VISUALIZER
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1 rounded text-sm font-bold ${
                editMode ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {editMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowConnections(!showConnections)}
              className={`px-3 py-1 rounded text-sm font-bold ${
                showConnections ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              <Link className="w-4 h-4" />
            </button>

            <button
              onClick={autoArrange}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-bold hover:bg-purple-500"
            >
              AUTO-ARRANGE
            </button>

            <button
              onClick={saveTreeLayout}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-500 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              SAVE LAYOUT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Character Assignment */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Assign to Character:</label>
            <select
              value={assignedCharacter || ''}
              onChange={(e) => setAssignedCharacter(e.target.value || null)}
              className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1 rounded"
            >
              <option value="">None (View All)</option>
              {actors && actors.map(actor => (
                <option key={actor.id} value={actor.id}>{actor.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-white font-mono">{(zoom * 100).toFixed(0)}%</span>
          </div>

        </div>
      </div>

      {/* Canvas container - Scrollable area between header and footer */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative overflow-auto bg-slate-950"
        style={{ 
          cursor: isSpacePressed ? 'grab' : 'default',
          marginTop: '0',
          marginBottom: '40px' // Reserve space for footer
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
          }
        }}
      >
        <div 
          className="relative"
          style={{
            minWidth: '5000px',
            minHeight: '5000px',
            width: '5000px',
            height: '5000px'
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            width={5000}
            height={5000}
            style={{ pointerEvents: 'none' }}
          />

        {/* Skill nodes */}
        <div
          className="absolute top-0 left-0"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${5000 / zoom}px`,
            height: `${5000 / zoom}px`
          }}
        >
          {treeData.nodes.map(node => {
            const skill = getSkill(node.skillId);
            if (!skill) return null;

            const tierColor = tierColors[node.tier] || '#6b7280';
            const isSelected = selectedNode?.id === node.id;
            
            // Check if skill is locked based on prerequisites
            const isLocked = (() => {
              if (!skill?.prerequisites) return false;
              const prereqs = skill.prerequisites;
              // Check parent skills
              if (prereqs.parentSkills && prereqs.parentSkills.length > 0) {
                const hasAllParents = prereqs.parentSkills.every(parentId => {
                  return treeData.nodes.some(n => n.skillId === parentId);
                });
                if (!hasAllParents) return true;
              }
              return false;
            })();
            
            const isAvailable = isSkillAvailable(node);
            const isLockedForChar = assignedCharacter && !isAvailable;

            return (
              <div
                key={node.id}
                className={`absolute w-40 rounded-lg border-2 shadow-lg transition-all ${
                  isLockedForChar || isLocked ? 'bg-slate-950 opacity-60' : 'bg-slate-900'
                } ${
                  isSelected ? 'border-blue-500 shadow-blue-500/50' : 
                  isLockedForChar ? 'border-red-500' : 
                  isAvailable && assignedCharacter ? 'border-green-500' : 
                  isLocked ? 'border-red-500' : 'border-slate-700'
                }`}
                style={{
                  left: node.x,
                  top: node.y,
                  borderColor: isLocked ? '#ef4444' : (isSelected ? '#3b82f6' : tierColor)
                }}
              >
                {/* Drag handle bar - Always visible */}
                <div
                  className="w-full h-6 bg-slate-800/50 hover:bg-slate-700/50 cursor-move flex items-center justify-center border-b border-slate-700 rounded-t-lg"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (editMode && !isSpacePressed) {
                      handleNodeMouseDown(e, node);
                    }
                  }}
                  title="Drag to move (Edit mode)"
                >
                  <div className="w-8 h-1 bg-slate-500 rounded"></div>
                </div>
                <div className="p-3">
                  {isLockedForChar && (
                    <div className="bg-red-900/50 px-2 py-1 rounded mb-2 text-xs text-red-400 text-center font-bold" title="Requirements not met for assigned character">
                      🔒 LOCKED
                    </div>
                  )}
                  {isLocked && !isLockedForChar && (
                    <div className="bg-red-900/50 px-2 py-1 rounded mb-2 text-xs text-red-400 text-center font-bold">
                      🔒 LOCKED
                    </div>
                  )}
                  {isAvailable && assignedCharacter && !isLocked && (
                    <div className="bg-green-900/50 px-2 py-1 rounded mb-2 text-xs text-green-400 text-center font-bold">
                      ✓ AVAILABLE
                    </div>
                  )}
                  <div className="text-sm font-bold text-white mb-1 truncate" title={skill.name}>
                    {skill.name}
                  </div>

                <div className="text-xs text-slate-400 mb-2">
                  <span className="font-mono" style={{ color: tierColor }}>
                    Tier {node.tier}
                  </span>
                </div>

                <div className="text-xs text-slate-500 line-clamp-2">
                  {skill.desc}
                </div>

                {/* Dependencies */}
                {node.dependencies && node.dependencies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <div className="text-xs text-blue-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Requires: {node.dependencies.length}
                    </div>
                  </div>
                )}

                {/* Connection controls */}
                {editMode && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const toId = prompt('Enter target skill ID to create connection:');
                        if (toId) addConnection(node.id, toId);
                      }}
                      className="flex-1 bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-500"
                      title="Add Connection"
                    >
                      <Plus className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
        </div>

        {/* Legend - Draggable and Minimizable */}
        <div 
          className="absolute bg-slate-900/95 backdrop-blur rounded-lg border border-slate-800 z-50 pointer-events-auto"
          style={{
            top: legendPosition.y ? `${legendPosition.y}px` : 'auto',
            bottom: legendPosition.y ? 'auto' : 'auto',
            right: legendPosition.x ? 'auto' : '16px',
            left: legendPosition.x ? `${legendPosition.x}px` : 'auto',
            width: '200px',
            cursor: isDraggingLegend ? 'grabbing' : 'default'
          }}
        >
          {/* Drag handle */}
          <div
            className="flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 cursor-move border-b border-slate-700 rounded-t-lg"
            onMouseDown={(e) => {
              setIsDraggingLegend(true);
              const rect = e.currentTarget.getBoundingClientRect();
              setLegendDragOffset({
                x: e.clientX - (legendPosition.x || (window.innerWidth - rect.width - 16)),
                y: e.clientY - (legendPosition.y || 20)
              });
            }}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-500" />
              <div className="text-sm font-bold text-white">TIER COLORS</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLegendMinimized(!isLegendMinimized);
              }}
              className="text-slate-500 hover:text-white"
            >
              {isLegendMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>

          {!isLegendMinimized && (
            <>
              <div className="p-4 space-y-1">
                {Object.entries(tierColors).map(([tier, color]) => (
                  <div key={tier} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-400">
                      Tier {tier}: {
                        tier === '1' ? 'Novice' :
                        tier === '2' ? 'Adept' :
                        tier === '3' ? 'Expert' :
                        tier === '4' ? 'Master' :
                        'Legendary'
                      }
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500">
                  {editMode ? (
                    <>
                      <div>• Drag nodes to reposition</div>
                      <div>• Click + to add connections</div>
                      <div>• Use AUTO-ARRANGE for tidy layout</div>
                    </>
                  ) : (
                    <>
                      <div>• View-only mode active</div>
                      <div>• Toggle edit mode to modify</div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Node details panel - Draggable */}
        {selectedNode && (
          <div 
            className="absolute bg-slate-900/95 backdrop-blur rounded-lg border border-slate-800 z-50 pointer-events-auto overflow-y-auto"
            style={{ 
              bottom: panelPosition.y ? 'auto' : '60px',
              top: panelPosition.y ? `${panelPosition.y}px` : 'auto',
              left: `${panelPosition.x}px`,
              width: '320px',
              maxHeight: 'calc(100vh - 200px)',
              cursor: isDraggingPanel ? 'grabbing' : 'default'
            }}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 cursor-move border-b border-slate-700 rounded-t-lg"
              onMouseDown={(e) => {
                setIsDraggingPanel(true);
                const rect = e.currentTarget.getBoundingClientRect();
                setPanelDragOffset({
                  x: e.clientX - panelPosition.x,
                  y: e.clientY - (panelPosition.y || (window.innerHeight - rect.height - 60))
                });
              }}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-500" />
                <h3 className="text-lg font-bold text-white">
                  {getSkill(selectedNode.skillId)?.name}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(null);
                }}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Type: </span>
                <span className="text-white">{getSkill(selectedNode.skillId)?.type}</span>
              </div>

              <div>
                <span className="text-slate-400">Tier: </span>
                <span className="text-white">{selectedNode.tier}</span>
              </div>

              {selectedNode.dependencies && selectedNode.dependencies.length > 0 && (
                <div>
                  <div className="text-slate-400 mb-1">Dependencies:</div>
                  <div className="space-y-1">
                    {selectedNode.dependencies.map(depId => {
                      const depSkill = getSkill(depId);
                      return (
                        <div key={depId} className="flex justify-between items-center bg-slate-950 p-2 rounded">
                          <span className="text-xs text-blue-400">{depSkill?.name || depId}</span>
                          {editMode && (
                            <button
                              onClick={() => removeConnection(depId, selectedNode.id)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {(() => {
                const skill = getSkill(selectedNode.skillId);
                const prereqs = skill?.prerequisites;
                if (!prereqs) return null;

                return (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-slate-400 mb-2 font-bold">PREREQUISITES:</div>
                    
                    {/* Parent Skills */}
                    {prereqs.parentSkills && prereqs.parentSkills.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-orange-400 mb-1">Parent Skills:</div>
                        <div className="space-y-1">
                          {prereqs.parentSkills.map(parentId => {
                            const parentSkill = getSkill(parentId);
                            return (
                              <div key={parentId} className="text-xs text-orange-300 bg-slate-950 p-1 rounded">
                                {parentSkill?.name || parentId}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Stat Requirements */}
                    {prereqs.requiredStats && Object.keys(prereqs.requiredStats).length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-orange-400 mb-1">Stat Requirements:</div>
                        <div className="space-y-1">
                          {Object.entries(prereqs.requiredStats).map(([stat, minValue]) => (
                            <div key={stat} className="text-xs text-orange-300 bg-slate-950 p-1 rounded">
                              {stat}: {minValue}+
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level Requirement */}
                    {prereqs.requiredLevel && prereqs.requiredLevel > 1 && (
                      <div className="mb-2">
                        <div className="text-xs text-orange-400 mb-1">Level Requirement:</div>
                        <div className="text-xs text-orange-300 bg-slate-950 p-1 rounded">
                          Level {prereqs.requiredLevel}+
                        </div>
                      </div>
                    )}

                    {/* Class Restrictions */}
                    {prereqs.requiredClasses && prereqs.requiredClasses.length > 0 && (
                      <div>
                        <div className="text-xs text-orange-400 mb-1">Class Restrictions:</div>
                        <div className="text-xs text-orange-300 bg-slate-950 p-1 rounded">
                          {prereqs.requiredClasses.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="text-xs text-slate-500 mt-2">
                {getSkill(selectedNode.skillId)?.desc}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 text-xs text-slate-400 text-center">
        {treeData.nodes.length} skills • {treeData.connections.length} connections •
        Zoom: {(zoom * 100).toFixed(0)}% •
        {editMode ? 'Edit Mode Active' : 'View Mode'} •
        Hold SPACE + Click + Drag to pan • Ctrl+Scroll to zoom
      </div>
    </div>
  );
};

export default SkillTreeVisualizer;
