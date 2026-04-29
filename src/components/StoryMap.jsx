import React, { useState, useEffect, useRef } from 'react';
import { Network, Search, Filter, X, Eye, Edit3, Save, RefreshCw, Link as LinkIcon, GitBranch, Sparkles, Users, BookOpen, Package, Zap, MapPin, Calendar, Heart, Plus, Trash2, Settings, Download, Upload } from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';
import toastService from '../services/toastService';

/**
 * Story Map - Comprehensive Mind Mapping System
 * Supports multiple entity types: chapters, actors, items, skills, tropes, locations, events, relationships
 * Custom relationship types with visual distinction
 */
const StoryMap = ({ books, actors, itemBank, skillBank, onClose, onChapterClick }) => {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  
  // Core state
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  
  // UI state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Entity panels
  const [showEntityPanel, setShowEntityPanel] = useState(true);
  const [entityPanelTab, setEntityPanelTab] = useState('chapters'); // 'chapters' | 'actors' | 'items' | 'skills' | 'tropes'
  const [entitySearch, setEntitySearch] = useState('');
  
  // Connection mode
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionFrom, setConnectionFrom] = useState(null);
  const [connectionType, setConnectionType] = useState('references'); // 'uses', 'references', 'follows', 'conflicts_with', 'enables', 'causes', 'influences', 'custom'
  const [customConnectionLabel, setCustomConnectionLabel] = useState('');
  
  // Node editor
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  
  // Filters
  const [filterType, setFilterType] = useState('all'); // 'all' | 'chapter' | 'actor' | 'item' | 'skill' | 'trope'
  const [filterConnections, setFilterConnections] = useState('all'); // 'all' | connection type
  
  // AI detection
  const [isDetecting, setIsDetecting] = useState(false);

  // Node type definitions
  const nodeTypes = {
    chapter: { icon: BookOpen, color: '#3b82f6', shape: 'circle', label: 'Chapter' },
    actor: { icon: Users, color: '#22c55e', shape: 'square', label: 'Actor' },
    item: { icon: Package, color: '#eab308', shape: 'diamond', label: 'Item' },
    skill: { icon: Zap, color: '#a855f7', shape: 'hexagon', label: 'Skill' },
    trope: { icon: Sparkles, color: '#f59e0b', shape: 'star', label: 'Trope' },
    location: { icon: MapPin, color: '#ef4444', shape: 'triangle', label: 'Location' },
    event: { icon: Calendar, color: '#06b6d4', shape: 'pentagon', label: 'Event' },
    relationship: { icon: Heart, color: '#ec4899', shape: 'circle', label: 'Relationship' }
  };

  // Relationship types
  const relationshipTypes = {
    uses: { color: '#3b82f6', label: 'Uses' },
    references: { color: '#22c55e', label: 'References' },
    follows: { color: '#a855f7', label: 'Follows' },
    conflicts_with: { color: '#ef4444', label: 'Conflicts With' },
    enables: { color: '#eab308', label: 'Enables' },
    causes: { color: '#f59e0b', label: 'Causes' },
    influences: { color: '#06b6d4', label: 'Influences' },
    custom: { color: '#64748b', label: 'Custom' }
  };

  useEffect(() => {
    loadStoryMap();
  }, [books, actors, itemBank, skillBank]);

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

  const loadStoryMap = async () => {
    try {
      const savedNodes = await db.getAll('storyMap');
      if (savedNodes.length > 0) {
        setNodes(savedNodes);
        const conns = [];
        savedNodes.forEach(node => {
          if (node.connections) {
            node.connections.forEach(conn => {
              conns.push({
                id: `conn_${node.id}_${conn.targetId}_${Date.now()}`,
                from: node.id,
                to: conn.targetId,
                type: conn.type,
                label: conn.label || conn.type,
                bidirectional: conn.bidirectional || false
              });
            });
          }
        });
        setConnections(conns);
      } else {
        initializeDefaultNodes();
      }
    } catch (error) {
      console.error('Error loading story map:', error);
      initializeDefaultNodes();
    }
  };

  const initializeDefaultNodes = () => {
    const newNodes = [];
    if (books && Array.isArray(books)) {
      books.forEach((book, bookIndex) => {
        if (book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach((chapter, chapterIndex) => {
            newNodes.push({
              id: `node_chapter_${book.id}_${chapter.id}`,
              type: 'chapter',
              entityId: chapter.id,
              bookId: book.id,
              title: chapter.title || 'Untitled Chapter',
              description: chapter.desc || '',
              x: 100 + (chapterIndex % 5) * 200,
              y: 100 + bookIndex * 250,
              connections: [],
              metadata: {
                bookTitle: book.title,
                chapterIndex: chapterIndex + 1
              }
            });
          });
        }
      });
    }
    setNodes(newNodes);
    saveStoryMap(newNodes);
  };

  const saveStoryMap = async (nodesToSave = nodes) => {
    try {
      for (const node of nodesToSave) {
        await db.update('storyMap', node);
      }
    } catch (error) {
      console.error('Error saving story map:', error);
    }
  };

  // Get entity data by type and ID
  const getEntityData = (type, entityId) => {
    switch (type) {
      case 'chapter':
        if (!books || !Array.isArray(books)) return null;
        for (const book of books) {
          const chapter = book.chapters?.find(c => c.id === entityId);
          if (chapter) return { ...chapter, bookTitle: book.title };
        }
        return null;
      case 'actor':
        return actors?.find(a => a.id === entityId) || null;
      case 'item':
        return itemBank?.find(i => i.id === entityId) || null;
      case 'skill':
        return skillBank?.find(s => s.id === entityId) || null;
      default:
        return null;
    }
  };

  // Add node from entity
  const addNodeFromEntity = (type, entity) => {
    const entityData = getEntityData(type, entity.id);
    if (!entityData) return;

    const newNode = {
      id: `node_${type}_${entity.id}_${Date.now()}`,
      type: type,
      entityId: entity.id,
      title: entity.name || entity.title || 'Untitled',
      description: entity.desc || entity.description || '',
      x: 300 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      connections: [],
      metadata: type === 'chapter' ? { bookTitle: entityData.bookTitle } : {}
    };

    setNodes(prev => [...prev, newNode]);
    saveStoryMap([...nodes, newNode]);
    toastService.success(`Added ${nodeTypes[type].label} node: ${newNode.title}`);
  };

  // Create manual node
  const createManualNode = (type) => {
    const newNode = {
      id: `node_${type}_manual_${Date.now()}`,
      type: type,
      entityId: null,
      title: `New ${nodeTypes[type].label}`,
      description: '',
      x: 300 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      connections: [],
      metadata: {}
    };

    setNodes(prev => [...prev, newNode]);
    setEditingNode(newNode);
    setShowNodeEditor(true);
    saveStoryMap([...nodes, newNode]);
  };

  // Delete node
  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    toastService.info('Node deleted');
  };

  // Handle node drag
  const handleNodeDrag = (e, node) => {
    if (!isDragging && canvasContainerRef.current && !isSpacePressed) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragNode(node);
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const scrollX = canvasContainerRef.current.scrollLeft;
      const scrollY = canvasContainerRef.current.scrollTop;
      setDragOffset({
        x: (e.clientX - rect.left + scrollX) / zoom - node.x,
        y: (e.clientY - rect.top + scrollY) / zoom - node.y
      });
    }

    if (!canvasContainerRef.current || !isDragging || isSpacePressed) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const scrollX = canvasContainerRef.current.scrollLeft;
    const scrollY = canvasContainerRef.current.scrollTop;
    let newX = (e.clientX - rect.left + scrollX) / zoom - dragOffset.x;
    let newY = (e.clientY - rect.top + scrollY) / zoom - dragOffset.y;

    setNodes(prev => prev.map(n => 
      n.id === node.id ? { ...n, x: Math.max(0, Math.min(5000 - 60, newX)), y: Math.max(0, Math.min(5000 - 60, newY)) } : n
    ));
  };

  const handleCanvasMouseDown = (e) => {
    if (isSpacePressed && e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && isSpacePressed) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (isDragging && dragNode && !isSpacePressed) {
      handleNodeDrag(e, dragNode);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragNode(null);
      setDragOffset({ x: 0, y: 0 });
      saveStoryMap();
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Handle node click
  const handleNodeClick = (node, e) => {
    if (connectionMode) {
      if (!connectionFrom) {
        setConnectionFrom(node.id);
        toastService.info(`Selected ${node.title} as connection source. Click another node to connect.`);
      } else if (connectionFrom !== node.id) {
        // Create connection
        const label = connectionType === 'custom' ? customConnectionLabel : relationshipTypes[connectionType].label;
        const newConn = {
          id: `conn_${connectionFrom}_${node.id}_${Date.now()}`,
          from: connectionFrom,
          to: node.id,
          type: connectionType,
          label: label,
          bidirectional: false
        };
        setConnections(prev => [...prev, newConn]);
        
        // Update nodes with connection references
        setNodes(prev => prev.map(n => {
          if (n.id === connectionFrom) {
            return { ...n, connections: [...(n.connections || []), { targetId: node.id, type: connectionType, label }] };
          }
          if (n.id === node.id) {
            return { ...n, connections: [...(n.connections || []), { targetId: connectionFrom, type: connectionType, label }] };
          }
          return n;
        }));
        
        setConnectionFrom(null);
        setConnectionMode(false);
        setCustomConnectionLabel('');
        toastService.success(`Connected ${getNodeTitle(connectionFrom)} to ${node.title}`);
        saveStoryMap();
      }
    } else {
      setSelectedNode(node);
      setEditingNode(node);
    }
  };

  const getNodeTitle = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.title : 'Unknown';
  };

  // Delete connection
  const deleteConnection = (connId) => {
    const conn = connections.find(c => c.id === connId);
    if (conn) {
      setConnections(prev => prev.filter(c => c.id !== connId));
      setNodes(prev => prev.map(n => ({
        ...n,
        connections: (n.connections || []).filter(c => 
          !(c.targetId === conn.from && n.id === conn.to) && 
          !(c.targetId === conn.to && n.id === conn.from)
        )
      })));
      toastService.info('Connection deleted');
    }
  };

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
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

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw connections
    const filtered = connections.filter(conn => {
      if (filterConnections !== 'all' && conn.type !== filterConnections) return false;
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      return fromNode && toNode;
    });

    filtered.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const relType = relationshipTypes[conn.type] || relationshipTypes.custom;
      ctx.strokeStyle = relType.color;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash(conn.type === 'conflicts_with' ? [5, 5] : []);
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw label
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      ctx.fillStyle = relType.color;
      ctx.font = `${10 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(conn.label || conn.type, midX, midY - 5 / zoom);
    });

    // Draw nodes
    const filteredNodes = nodes.filter(node => filterType === 'all' || node.type === filterType);
    filteredNodes.forEach(node => {
      const nodeType = nodeTypes[node.type] || nodeTypes.chapter;
      const isSelected = selectedNode?.id === node.id;
      const isConnectionSource = connectionFrom === node.id;

      ctx.fillStyle = isSelected ? '#22c55e' : (isConnectionSource ? '#f59e0b' : nodeType.color);
      ctx.strokeStyle = isSelected ? '#22c55e' : (isConnectionSource ? '#f59e0b' : nodeType.color);
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom;

      // Draw shape based on type
      ctx.beginPath();
      const radius = 25 / zoom;
      switch (nodeType.shape) {
        case 'square':
          ctx.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
          break;
        case 'diamond':
          ctx.moveTo(node.x, node.y - radius);
          ctx.lineTo(node.x + radius, node.y);
          ctx.lineTo(node.x, node.y + radius);
          ctx.lineTo(node.x - radius, node.y);
          ctx.closePath();
          break;
        case 'triangle':
          ctx.moveTo(node.x, node.y - radius);
          ctx.lineTo(node.x + radius, node.y + radius);
          ctx.lineTo(node.x - radius, node.y + radius);
          ctx.closePath();
          break;
        case 'hexagon':
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = node.x + radius * Math.cos(angle);
            const y = node.y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          break;
        case 'star':
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI / 5) * i;
            const r = i % 2 === 0 ? radius : radius * 0.5;
            const x = node.x + r * Math.cos(angle);
            const y = node.y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          break;
        default: // circle
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#ffffff';
      ctx.font = `${11 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(node.title.substring(0, 20), node.x, node.y + 40 / zoom);
    });

    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [nodes, connections, filterType, filterConnections, zoom, pan, selectedNode, connectionFrom]);

  // Get entities for panel
  const getEntitiesForPanel = () => {
    const searchLower = entitySearch.toLowerCase();
    switch (entityPanelTab) {
      case 'chapters':
        if (!books || !Array.isArray(books)) return [];
        return books.flatMap(book => 
          (book.chapters || []).map(chapter => ({
            id: chapter.id,
            name: chapter.title,
            desc: chapter.desc,
            bookTitle: book.title
          }))
        ).filter(e => e.name.toLowerCase().includes(searchLower));
      case 'actors':
        return (actors || []).filter(a => a.name.toLowerCase().includes(searchLower));
      case 'items':
        return (itemBank || []).filter(i => i.name.toLowerCase().includes(searchLower));
      case 'skills':
        return (skillBank || []).filter(s => s.name.toLowerCase().includes(searchLower));
      case 'tropes':
        // Tropes would be custom/manual entries
        return nodes.filter(n => n.type === 'trope' && n.title.toLowerCase().includes(searchLower));
      default:
        return [];
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Network className="mr-3 text-green-500" />
            STORY MAP - MIND MAPPER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Visualize connections between chapters, actors, items, skills, and tropes</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
          >
            <option value="all">All Types</option>
            {Object.entries(nodeTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.label}</option>
            ))}
          </select>
          <select
            value={filterConnections}
            onChange={(e) => setFilterConnections(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white p-2 rounded text-xs"
          >
            <option value="all">All Connections</option>
            {Object.entries(relationshipTypes).map(([key, rel]) => (
              <option key={key} value={key}>{rel.label}</option>
            ))}
          </select>
          <button
            onClick={() => setConnectionMode(!connectionMode)}
            className={`px-3 py-2 rounded text-xs font-bold ${
              connectionMode ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Click two nodes to connect"
          >
            <LinkIcon className="w-4 h-4 inline mr-1" />
            CONNECT
          </button>
          <button
            onClick={async () => {
              setIsDetecting(true);
              try {
                const chapters = nodes.filter(n => n.type === 'chapter').map(node => {
                  const entity = getEntityData('chapter', node.entityId);
                  return {
                    id: node.id,
                    title: node.title,
                    desc: entity?.desc || node.description || ''
                  };
                });
                const detected = await aiService.detectStoryConnections(chapters);
                if (Array.isArray(detected)) {
                  detected.forEach(conn => {
                    if (conn.chapters && conn.chapters.length >= 2) {
                      const newConn = {
                        id: `conn_${conn.chapters[0]}_${conn.chapters[1]}_${Date.now()}`,
                        from: conn.chapters[0],
                        to: conn.chapters[1],
                        type: conn.type || 'references',
                        label: conn.description || 'Auto-detected'
                      };
                      setConnections(prev => {
                        if (!prev.find(c => c.from === newConn.from && c.to === newConn.to)) {
                          return [...prev, newConn];
                        }
                        return prev;
                      });
                    }
                  });
                  toastService.success('Connections detected!');
                }
              } catch (error) {
                toastService.error('Connection detection failed: ' + error.message);
              } finally {
                setIsDetecting(false);
              }
            }}
            disabled={isDetecting}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
          >
            {isDetecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AUTO-DETECT
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Entity Panel - Fixed */}
        {showEntityPanel && (
          <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">ENTITIES</h3>
                <button
                  onClick={() => setShowEntityPanel(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 mb-3">
                {['chapters', 'actors', 'items', 'skills', 'tropes'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setEntityPanelTab(tab)}
                    className={`flex-1 px-2 py-1 rounded text-xs font-bold ${
                      entityPanelTab === tab
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-2 py-2 text-white text-sm"
                />
              </div>

              {/* Add Manual Node */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {['location', 'event', 'trope', 'relationship'].map(type => (
                  <button
                    key={type}
                    onClick={() => createManualNode(type)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {nodeTypes[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity List */}
            <div className="flex-1 overflow-y-auto">
              {getEntitiesForPanel().map(entity => {
                const nodeType = nodeTypes[entityPanelTab === 'chapters' ? 'chapter' : entityPanelTab.slice(0, -1)] || nodeTypes.chapter;
                const Icon = nodeType.icon;
                const existingNode = nodes.find(n => n.type === (entityPanelTab === 'chapters' ? 'chapter' : entityPanelTab.slice(0, -1)) && n.entityId === entity.id);

                return (
                  <div
                    key={entity.id}
                    className="p-3 border-b border-slate-800 hover:bg-slate-900 cursor-pointer"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('entityType', entityPanelTab === 'chapters' ? 'chapter' : entityPanelTab.slice(0, -1));
                      e.dataTransfer.setData('entityId', entity.id);
                    }}
                    onDoubleClick={() => {
                      if (!existingNode) {
                        addNodeFromEntity(entityPanelTab === 'chapters' ? 'chapter' : entityPanelTab.slice(0, -1), entity);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: nodeType.color }} />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{entity.name}</div>
                        {entity.bookTitle && (
                          <div className="text-xs text-slate-400">{entity.bookTitle}</div>
                        )}
                      </div>
                      {existingNode ? (
                        <Eye className="w-4 h-4 text-green-500" title="Already on map" />
                      ) : (
                        <Plus className="w-4 h-4 text-slate-600" title="Double-click to add" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Connection Mode UI */}
          {connectionMode && (
            <div className="bg-yellow-900/20 border-b border-yellow-500/50 p-2 flex items-center gap-4 flex-shrink-0">
              <span className="text-sm text-yellow-400 font-bold">Connection Mode Active</span>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white p-1 rounded text-xs"
              >
                {Object.entries(relationshipTypes).map(([key, rel]) => (
                  <option key={key} value={key}>{rel.label}</option>
                ))}
              </select>
              {connectionType === 'custom' && (
                <input
                  type="text"
                  value={customConnectionLabel}
                  onChange={(e) => setCustomConnectionLabel(e.target.value)}
                  placeholder="Custom label..."
                  className="bg-slate-950 border border-slate-700 text-white p-1 rounded text-xs flex-1"
                />
              )}
              {connectionFrom && (
                <span className="text-sm text-white">
                  From: <strong>{getNodeTitle(connectionFrom)}</strong> - Click target node
                </span>
              )}
              <button
                onClick={() => {
                  setConnectionMode(false);
                  setConnectionFrom(null);
                }}
                className="text-yellow-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Canvas Container - Scrollable */}
          <div 
            ref={canvasContainerRef}
            className="flex-1 relative overflow-auto bg-slate-950"
            style={{ cursor: isSpacePressed ? 'grab' : (isPanning ? 'grabbing' : 'default') }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDrop={(e) => {
              e.preventDefault();
              const entityType = e.dataTransfer.getData('entityType');
              const entityId = e.dataTransfer.getData('entityId');
              if (entityType && entityId) {
                const rect = canvasContainerRef.current.getBoundingClientRect();
                const scrollX = canvasContainerRef.current.scrollLeft;
                const scrollY = canvasContainerRef.current.scrollTop;
                const x = (e.clientX - rect.left + scrollX - pan.x) / zoom;
                const y = (e.clientY - rect.top + scrollY - pan.y) / zoom;
                
                const entity = getEntityData(entityType, entityId);
                if (entity) {
                  const newNode = {
                    id: `node_${entityType}_${entityId}_${Date.now()}`,
                    type: entityType,
                    entityId: entityId,
                    title: entity.name || entity.title || 'Untitled',
                    description: entity.desc || entity.description || '',
                    x: Math.max(0, Math.min(5000 - 60, x)),
                    y: Math.max(0, Math.min(5000 - 60, y)),
                    connections: [],
                    metadata: entityType === 'chapter' ? { bookTitle: entity.bookTitle } : {}
                  };
                  setNodes(prev => [...prev, newNode]);
                  saveStoryMap([...nodes, newNode]);
                  toastService.success(`Added ${nodeTypes[entityType].label} node`);
                }
              }
            }}
            onDragOver={(e) => e.preventDefault()}
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
                width={5000}
                height={5000}
                className="absolute top-0 left-0"
                style={{ pointerEvents: 'none' }}
              />

              {/* Node Elements - Clickable */}
              {nodes.filter(node => filterType === 'all' || node.type === filterType).map(node => {
                const nodeType = nodeTypes[node.type] || nodeTypes.chapter;
                const Icon = nodeType.icon;
                const isSelected = selectedNode?.id === node.id;
                const isConnectionSource = connectionFrom === node.id;

                return (
                  <div
                    key={node.id}
                    className="absolute cursor-move"
                    style={{
                      left: node.x - 30,
                      top: node.y - 30,
                      width: '60px',
                      height: '60px',
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center'
                    }}
                    onMouseDown={(e) => {
                      if (!isSpacePressed) {
                        e.stopPropagation();
                        handleNodeClick(node, e);
                        handleNodeDrag(e, node);
                      }
                    }}
                    onDoubleClick={() => {
                      setEditingNode(node);
                      setShowNodeEditor(true);
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center border-2 ${
                        isSelected ? 'border-green-500 shadow-lg shadow-green-500/50' :
                        isConnectionSource ? 'border-yellow-500 shadow-lg shadow-yellow-500/50' :
                        'border-slate-700'
                      }`}
                      style={{
                        backgroundColor: nodeType.color,
                        borderColor: isSelected ? '#22c55e' : (isConnectionSource ? '#f59e0b' : nodeType.color)
                      }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-white text-xs font-bold whitespace-nowrap"
                      style={{ fontSize: `${12 / zoom}px` }}
                    >
                      {node.title.substring(0, 15)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Node Editor / Connection Editor */}
        {showNodeEditor && editingNode && (
          <div className="w-80 border-l border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">EDIT NODE</h3>
                <button
                  onClick={() => {
                    setShowNodeEditor(false);
                    setEditingNode(null);
                  }}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Type</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = nodeTypes[editingNode.type]?.icon || BookOpen;
                    return <Icon className="w-4 h-4" style={{ color: nodeTypes[editingNode.type]?.color }} />;
                  })()}
                  <span className="text-white font-bold">{nodeTypes[editingNode.type]?.label || editingNode.type}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={editingNode.title}
                  onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  value={editingNode.description || ''}
                  onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setNodes(prev => prev.map(n => n.id === editingNode.id ? editingNode : n));
                    setSelectedNode(editingNode);
                    saveStoryMap();
                    toastService.success('Node updated');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  SAVE
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this node?')) {
                      deleteNode(editingNode.id);
                      setShowNodeEditor(false);
                      setEditingNode(null);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Connections */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Connections</label>
                <div className="space-y-2">
                  {connections.filter(c => c.from === editingNode.id || c.to === editingNode.id).map(conn => {
                    const otherNodeId = conn.from === editingNode.id ? conn.to : conn.from;
                    const otherNode = nodes.find(n => n.id === otherNodeId);
                    return (
                      <div key={conn.id} className="bg-slate-900 p-2 rounded flex justify-between items-center">
                        <div>
                          <div className="text-xs text-white font-bold">{otherNode?.title || 'Unknown'}</div>
                          <div className="text-xs text-slate-400">{conn.label || conn.type}</div>
                        </div>
                        <button
                          onClick={() => deleteConnection(conn.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Entity Panel Button */}
        {!showEntityPanel && (
          <button
            onClick={() => setShowEntityPanel(true)}
            className="fixed top-24 left-4 bg-slate-900 border border-slate-800 rounded p-2 text-white z-50 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Zoom Controls - Fixed */}
      <div className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur border border-slate-800 rounded p-2 flex flex-col gap-2 z-50 pointer-events-auto">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded"
        >
          +
        </button>
        <div className="text-xs text-white text-center">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.25))}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded"
        >
          -
        </button>
      </div>

      {/* Instructions - Fixed Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 text-xs text-slate-400 text-center flex-shrink-0 z-10">
        {nodes.length} nodes • {connections.length} connections • 
        Hold SPACE + Click + Drag to pan • Ctrl+Scroll to zoom • 
        Drag entities from panel to canvas • Double-click nodes to edit
      </div>
    </div>
  );
};

export default StoryMap;
