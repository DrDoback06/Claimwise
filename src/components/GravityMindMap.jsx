import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Users, Briefcase, Zap, MapPin, Heart, 
  Search, ZoomIn, ZoomOut, X, Eye, EyeOff,
  Play, Pause, Lock, Unlock, Maximize2, Home
} from 'lucide-react';
import db from '../services/database';

/**
 * GravityMindMap - Orbital physics-based mind map
 * Characters are "suns" with gravitational pull, other entities orbit around them
 */
const GravityMindMap = ({ actors = [], items = [], skills = [], onClose }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // View state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [lockedNode, setLockedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTypes, setVisibleTypes] = useState({
    actor: true,
    item: true,
    skill: true,
    location: true
  });
  
  // Drag state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  // Configuration - increased spacing for better readability
  const config = {
    centerX: 600,
    centerY: 450,
    sunMinRadius: 35,
    sunMaxRadius: 60,
    orbitRadiusMin: 150,
    orbitRadiusMax: 450,
    orbitSpeedBase: 0.001, // Slower orbits for readability
    connectionStrengthDecay: 0.95,
    trailLength: 10,
    minNodeSpacing: 80 // Minimum distance between nodes
  };

  // Node type configurations
  const nodeStyles = {
    actor: { 
      icon: Users, 
      colors: {
        protagonist: { fill: '#22c55e', glow: '#4ade80' },
        antagonist: { fill: '#ef4444', glow: '#f87171' },
        npc: { fill: '#8b5cf6', glow: '#a78bfa' },
        default: { fill: '#3b82f6', glow: '#60a5fa' }
      }
    },
    item: { icon: Briefcase, fill: '#eab308', glow: '#facc15' },
    skill: { icon: Zap, fill: '#06b6d4', glow: '#22d3ee' },
    location: { icon: MapPin, fill: '#f97316', glow: '#fb923c' }
  };

  useEffect(() => {
    initializeGraph();
  }, [actors, items, skills]);

  useEffect(() => {
    if (nodes.length > 0 && isAnimating) {
      startAnimation();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, isAnimating, animationSpeed]);

  const initializeGraph = async () => {
    setLoading(true);
    try {
      const { nodeList, edgeList } = await buildGraphData();
      setNodes(nodeList);
      setEdges(edgeList);
    } catch (error) {
      console.error('Error initializing graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildGraphData = async () => {
    const nodeList = [];
    const edgeList = [];
    const actorConnections = new Map(); // Track how many things connect to each actor

    // Count connections for each actor
    actors?.forEach(actor => {
      let connections = 0;
      connections += (actor.inventory?.length || 0);
      connections += (actor.activeSkills?.length || 0);
      connections += (actor.relationships?.length || 0);
      actorConnections.set(actor.id, connections);
    });

    // Calculate max connections for normalization
    const maxConnections = Math.max(1, ...actorConnections.values());

    // Create actor nodes (suns) - spread out more for readability
    const protagonists = actors?.filter(a => a.role?.toLowerCase().includes('protagonist')) || [];
    const antagonists = actors?.filter(a => a.role?.toLowerCase().includes('antagonist')) || [];
    const npcs = actors?.filter(a => !a.role?.toLowerCase().includes('protagonist') && !a.role?.toLowerCase().includes('antagonist')) || [];
    
    actors?.forEach((actor, idx) => {
      const connections = actorConnections.get(actor.id) || 0;
      const normalizedConnections = connections / maxConnections;
      
      // Protagonists get prime positions
      const isProtagonist = actor.role?.toLowerCase().includes('protagonist');
      const isAntagonist = actor.role?.toLowerCase().includes('antagonist');
      const isNpc = !isProtagonist && !isAntagonist;
      
      // Calculate position based on role with better spacing
      let angle, radius;
      if (isProtagonist) {
        // Protagonists in inner ring, evenly spaced
        const protIdx = protagonists.indexOf(actor);
        angle = (protIdx / Math.max(protagonists.length, 1)) * Math.PI * 2 - Math.PI / 2;
        radius = 120 + protIdx * 80;
      } else if (isAntagonist) {
        // Antagonists on opposite side
        const antIdx = antagonists.indexOf(actor);
        angle = Math.PI + (antIdx / Math.max(antagonists.length, 1)) * Math.PI * 0.8 - Math.PI * 0.4;
        radius = 250 + antIdx * 60;
      } else {
        // NPCs spread around the outer ring
        const npcIdx = npcs.indexOf(actor);
        angle = (npcIdx / Math.max(npcs.length, 1)) * Math.PI * 2;
        radius = 350 + (npcIdx % 3) * 60; // Stagger the radii
      }

      const baseSize = isProtagonist ? config.sunMaxRadius : 
                       isAntagonist ? config.sunMaxRadius * 0.7 :
                       isNpc ? config.sunMinRadius * 0.7 :
                       config.sunMinRadius;
      
      const size = baseSize * (0.7 + normalizedConnections * 0.3);
      const roleType = isProtagonist ? 'protagonist' : isAntagonist ? 'antagonist' : isNpc ? 'npc' : 'default';

      nodeList.push({
        id: `actor_${actor.id}`,
        entityId: actor.id,
        type: 'actor',
        roleType,
        label: actor.name,
        size,
        mass: size * 2, // Gravitational mass
        x: config.centerX + Math.cos(angle) * radius,
        y: config.centerY + Math.sin(angle) * radius,
        fixed: isProtagonist, // Protagonists don't move
        connections: connections,
        metadata: actor,
        orbitAngle: 0,
        orbitSpeed: 0,
        orbitRadius: 0,
        orbitCenter: null,
        trail: []
      });
    });

    // Create item nodes (satellites)
    items?.forEach((item, idx) => {
      // Find which actor owns this item - handle both string and object formats
      const ownerActor = actors?.find(a => {
        const inventory = a.inventory || [];
        return inventory.some(invItem => {
          if (typeof invItem === 'string') return invItem === item.id;
          return (invItem.id || invItem) === item.id;
        });
      });
      const ownerNode = ownerActor ? nodeList.find(n => n.entityId === ownerActor.id && n.type === 'actor') : null;
      
      const orbitRadius = config.orbitRadiusMin + Math.random() * 50;
      const orbitAngle = Math.random() * Math.PI * 2;
      const orbitSpeed = config.orbitSpeedBase * (0.5 + Math.random() * 0.5);

      const centerX = ownerNode ? ownerNode.x : config.centerX;
      const centerY = ownerNode ? ownerNode.y : config.centerY;

      nodeList.push({
        id: `item_${item.id}`,
        entityId: item.id,
        type: 'item',
        label: item.name,
        size: 18 + (item.rarity === 'legendary' ? 8 : item.rarity === 'rare' ? 4 : 0),
        mass: 1,
        x: centerX + Math.cos(orbitAngle) * orbitRadius,
        y: centerY + Math.sin(orbitAngle) * orbitRadius,
        fixed: false,
        metadata: item,
        orbitAngle,
        orbitSpeed,
        orbitRadius,
        orbitCenter: ownerNode?.id || null,
        sharedWith: [], // Other actors who can use this
        trail: []
      });

      // Create edge if owned - check for duplicates
      if (ownerNode) {
        const edgeExists = edgeList.some(e => 
          e.source === ownerNode.id && e.target === `item_${item.id}`
        );
        if (!edgeExists) {
          edgeList.push({
            id: `edge_${ownerNode.id}_item_${item.id}`,
            source: ownerNode.id,
            target: `item_${item.id}`,
            type: 'owns',
            strength: 0.8
          });
        }
      }
      
      // Also check for shared items (equipped by multiple actors)
      const allOwners = actors?.filter(a => {
        const inventory = a.inventory || [];
        return inventory.some(invItem => {
          if (typeof invItem === 'string') return invItem === item.id;
          return (invItem.id || invItem) === item.id;
        });
      }) || [];
      
      // Add edges for additional owners (shared items)
      allOwners.slice(1).forEach(additionalOwner => {
        const additionalOwnerNode = nodeList.find(n => n.entityId === additionalOwner.id && n.type === 'actor');
        if (additionalOwnerNode) {
          const edgeExists = edgeList.some(e => 
            e.source === additionalOwnerNode.id && e.target === `item_${item.id}`
          );
          if (!edgeExists) {
            edgeList.push({
              id: `edge_${additionalOwnerNode.id}_item_${item.id}`,
              source: additionalOwnerNode.id,
              target: `item_${item.id}`,
              type: 'owns',
              strength: 0.6 // Lower strength for shared items
            });
          }
        }
      });
    });

    // Create skill nodes (satellites)
    skills?.forEach((skill, idx) => {
      // Find which actors have this skill - handle both {id, val} and string formats
      const skillOwners = actors?.filter(a => {
        const activeSkills = a.activeSkills || [];
        return activeSkills.some(s => {
          if (typeof s === 'string') return s === skill.id;
          return (s.id || s) === skill.id;
        });
      }) || [];
      const primaryOwner = skillOwners[0];
      const ownerNode = primaryOwner ? nodeList.find(n => n.entityId === primaryOwner.id && n.type === 'actor') : null;
      
      const orbitRadius = config.orbitRadiusMin + 30 + Math.random() * 70;
      const orbitAngle = Math.random() * Math.PI * 2;
      const orbitSpeed = config.orbitSpeedBase * (0.3 + Math.random() * 0.4);

      const centerX = ownerNode ? ownerNode.x : config.centerX;
      const centerY = ownerNode ? ownerNode.y : config.centerY;

      nodeList.push({
        id: `skill_${skill.id}`,
        entityId: skill.id,
        type: 'skill',
        label: skill.name,
        size: 15 + Math.min(skillOwners.length * 3, 15), // Bigger if shared
        mass: 1,
        x: centerX + Math.cos(orbitAngle) * orbitRadius,
        y: centerY + Math.sin(orbitAngle) * orbitRadius,
        fixed: false,
        metadata: skill,
        orbitAngle,
        orbitSpeed,
        orbitRadius,
        orbitCenter: ownerNode?.id || null,
        sharedWith: skillOwners.slice(1).map(a => `actor_${a.id}`),
        trail: []
      });

      // Create edges for all owners
      skillOwners.forEach(owner => {
        const actorNodeId = `actor_${owner.id}`;
        // Check if edge already exists to prevent duplicates
        const edgeExists = edgeList.some(e => 
          e.source === actorNodeId && e.target === `skill_${skill.id}`
        );
        if (!edgeExists) {
          edgeList.push({
            id: `edge_${actorNodeId}_skill_${skill.id}`,
            source: actorNodeId,
            target: `skill_${skill.id}`,
            type: 'has_skill',
            strength: owner === primaryOwner ? 0.9 : 0.5
          });
        }
      });
    });

    // Add relationship connections between actors
    try {
      const relationships = await db.getAll('relationships');
      relationships?.forEach(rel => {
        const actor1Node = nodeList.find(n => n.entityId === rel.actor1Id && n.type === 'actor');
        const actor2Node = nodeList.find(n => n.entityId === rel.actor2Id && n.type === 'actor');
        
        if (actor1Node && actor2Node) {
          // Check if edge already exists (bidirectional check)
          const edgeExists = edgeList.some(e => 
            (e.source === actor1Node.id && e.target === actor2Node.id) ||
            (e.source === actor2Node.id && e.target === actor1Node.id)
          );
          
          if (!edgeExists) {
            edgeList.push({
              id: `edge_rel_${rel.id || `${rel.actor1Id}_${rel.actor2Id}`}`,
              source: actor1Node.id,
              target: actor2Node.id,
              type: 'relationship',
              label: rel.relationshipType || rel.type || 'relationship',
              strength: (rel.strength || 50) / 100, // Normalize to 0-1
              metadata: rel
            });
          }
        }
      });
    } catch (error) {
      console.warn('Could not load relationships for mind map:', error);
    }

    // Prevent duplicate actor nodes (shouldn't happen, but safety check)
    const seenActorIds = new Set();
    const uniqueNodeList = nodeList.filter(node => {
      if (node.type === 'actor') {
        if (seenActorIds.has(node.entityId)) {
          console.warn(`Duplicate actor node detected: ${node.entityId}`);
          return false;
        }
        seenActorIds.add(node.entityId);
      }
      return true;
    });

    return { nodeList: uniqueNodeList, edgeList };
  };

  const startAnimation = () => {
    let lastFrameTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS; // ~16.67ms per frame
    
    const animate = (currentTime) => {
      // Throttle to 60fps max
      const elapsed = currentTime - lastFrameTime;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime - (elapsed % frameInterval);
      timeRef.current += (elapsed / 1000) * animationSpeed;

      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => {
          if (node.fixed || node.type === 'actor') {
            return node; // Actors don't orbit
          }

          // Find orbit center
          let centerX = config.centerX;
          let centerY = config.centerY;

          if (node.orbitCenter) {
            const centerNode = prevNodes.find(n => n.id === node.orbitCenter);
            if (centerNode) {
              centerX = centerNode.x;
              centerY = centerNode.y;
            }
          }

          // If shared with multiple actors, oscillate between them
          if (node.sharedWith && node.sharedWith.length > 0) {
            const allCenters = [node.orbitCenter, ...node.sharedWith]
              .filter(Boolean)
              .map(id => prevNodes.find(n => n.id === id))
              .filter(Boolean);
            
            if (allCenters.length > 1) {
              // Calculate weighted average position based on oscillation
              const oscillation = (Math.sin(timeRef.current * 0.5) + 1) / 2;
              const idx1 = Math.floor(oscillation * (allCenters.length - 1));
              const idx2 = Math.min(idx1 + 1, allCenters.length - 1);
              const blend = (oscillation * (allCenters.length - 1)) - idx1;
              
              centerX = allCenters[idx1].x * (1 - blend) + allCenters[idx2].x * blend;
              centerY = allCenters[idx1].y * (1 - blend) + allCenters[idx2].y * blend;
            }
          }

          // Update orbit angle
          const newOrbitAngle = node.orbitAngle + node.orbitSpeed;

          // Calculate new position
          const newX = centerX + Math.cos(newOrbitAngle) * node.orbitRadius;
          const newY = centerY + Math.sin(newOrbitAngle) * node.orbitRadius;

          // Update trail
          const newTrail = [...node.trail, { x: node.x, y: node.y }].slice(-config.trailLength);

          return {
            ...node,
            x: newX,
            y: newY,
            orbitAngle: newOrbitAngle,
            trail: newTrail
          };
        });

        return newNodes;
      });

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };


  // Pan and zoom handlers - use addEventListener to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * scaleChange, 0.3), 3)
      }));
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('map-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  }, [selectedNode]);

  const handleNodeLock = useCallback((node) => {
    setLockedNode(lockedNode?.id === node.id ? null : node);
    // When locked, center on this node
    if (lockedNode?.id !== node.id) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setTransform({
          x: containerRect.width / 2 - node.x * transform.scale,
          y: containerRect.height / 2 - node.y * transform.scale,
          scale: transform.scale
        });
      }
    }
  }, [lockedNode, transform.scale]);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNode(null);
    setLockedNode(null);
  }, []);

  // Filter nodes based on visibility, search, and viewport (viewport culling)
  const filteredNodes = useMemo(() => {
    let filtered = nodes.filter(node => {
      if (!visibleTypes[node.type]) return false;
      if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    
    // Apply viewport culling if zoomed in (only when scale > 0.5 for performance)
    if (transform.scale > 0.5 && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewport = {
        left: -transform.x / transform.scale,
        top: -transform.y / transform.scale,
        width: rect.width / transform.scale,
        height: rect.height / transform.scale
      };
      
      const padding = 100; // Padding for smooth scrolling
      filtered = filtered.filter(node => {
        return node.x >= viewport.left - padding &&
               node.x <= viewport.left + viewport.width + padding &&
               node.y >= viewport.top - padding &&
               node.y <= viewport.top + viewport.height + padding;
      });
    }
    
    return filtered;
  }, [nodes, visibleTypes, searchQuery, transform, containerRef]);

  // Filter edges based on visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  const getNodeColor = (node) => {
    if (node.type === 'actor') {
      return nodeStyles.actor.colors[node.roleType] || nodeStyles.actor.colors.default;
    }
    return { fill: nodeStyles[node.type]?.fill || '#666', glow: nodeStyles[node.type]?.glow || '#888' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Building orbital map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950" ref={containerRef}>
      {/* Header Controls */}
      <div className="flex-shrink-0 p-4 bg-slate-900/80 border-b border-slate-700 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Universe Map</h2>
                <p className="text-xs text-slate-400">{nodes.length} entities in orbit</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities..."
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg w-64 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Animation Controls */}
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`p-2 rounded-lg transition-colors ${
                isAnimating ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}
              title={isAnimating ? 'Pause orbits' : 'Resume orbits'}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Speed Control */}
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2 py-2 focus:border-cyan-500"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
            </select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }))}
                className="p-1.5 text-slate-400 hover:text-white rounded"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 w-12 text-center">
                {Math.round(transform.scale * 100)}%
              </span>
              <button
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.3) }))}
                className="p-1.5 text-slate-400 hover:text-white rounded"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={resetView}
              className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              title="Reset view"
            >
              <Home className="w-4 h-4" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs text-slate-500">Show:</span>
          {Object.entries(visibleTypes).map(([type, visible]) => (
            <button
              key={type}
              onClick={() => setVisibleTypes(prev => ({ ...prev, [type]: !visible }))}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
                visible 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-slate-800/50 text-slate-500'
              }`}
            >
              {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div 
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Stars */}
        <div className="absolute inset-0 map-background">
          <svg className="w-full h-full">
            <defs>
              <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            {/* Star field */}
            {Array.from({ length: 100 }, (_, i) => (
              <circle
                key={i}
                cx={Math.random() * 100 + '%'}
                cy={Math.random() * 100 + '%'}
                r={Math.random() * 1.5 + 0.5}
                fill="rgba(255,255,255,0.3)"
                style={{ 
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </svg>
        </div>

        {/* Main SVG Canvas */}
        <svg
          ref={canvasRef}
          className="w-full h-full"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Glow filters for each type */}
            <filter id="glow-actor-protagonist" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#4ade80" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-actor-antagonist" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#f87171" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-item" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#facc15" floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-skill" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#22d3ee" floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbital paths (subtle rings around characters) */}
          {filteredNodes.filter(n => n.type === 'actor').map(actor => {
            const orbiting = filteredNodes.filter(n => n.orbitCenter === actor.id);
            if (orbiting.length === 0) return null;
            
            const maxOrbit = Math.max(...orbiting.map(n => n.orbitRadius));
            return (
              <g key={`orbit_${actor.id}`}>
                <circle
                  cx={actor.x}
                  cy={actor.y}
                  r={maxOrbit}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                {orbiting.length > 3 && (
                  <circle
                    cx={actor.x}
                    cy={actor.y}
                    r={maxOrbit * 0.6}
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                    strokeDasharray="2 6"
                  />
                )}
              </g>
            );
          })}

          {/* Connection edges */}
          {filteredEdges.map(edge => {
            const sourceNode = filteredNodes.find(n => n.id === edge.source);
            const targetNode = filteredNodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isHighlighted = selectedNode && 
              (selectedNode.id === edge.source || selectedNode.id === edge.target);

            return (
              <line
                key={edge.id}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isHighlighted ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={edge.type === 'has_skill' ? '4 2' : 'none'}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}

          {/* Orbit trails */}
          {filteredNodes.filter(n => n.trail && n.trail.length > 1).map(node => (
            <path
              key={`trail_${node.id}`}
              d={`M ${node.trail.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke={getNodeColor(node).fill}
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeLinecap="round"
            />
          ))}

          {/* Nodes */}
          {filteredNodes.map(node => {
            const colors = getNodeColor(node);
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNode?.id === node.id;
            const isLocked = lockedNode?.id === node.id;
            const scale = isSelected || isHovered ? 1.2 : 1;

            const filterType = node.type === 'actor' ? `glow-actor-${node.roleType}` : `glow-${node.type}`;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
              >
                {/* Node shape */}
                {node.type === 'actor' ? (
                  // Character nodes - circles with radial gradient
                  <>
                    <circle
                      r={node.size}
                      fill={`url(#actor-gradient-${node.roleType})`}
                      filter={isSelected || isHovered ? `url(#${filterType})` : undefined}
                    />
                    <defs>
                      <radialGradient id={`actor-gradient-${node.roleType}`} cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor={colors.glow} />
                        <stop offset="100%" stopColor={colors.fill} />
                      </radialGradient>
                    </defs>
                    {/* Inner ring for protagonists */}
                    {node.roleType === 'protagonist' && (
                      <circle
                        r={node.size + 5}
                        fill="none"
                        stroke={colors.glow}
                        strokeWidth="2"
                        strokeOpacity="0.5"
                        strokeDasharray="3 3"
                        style={{
                          animation: 'rotate 10s linear infinite',
                          transformOrigin: 'center'
                        }}
                      />
                    )}
                  </>
                ) : node.type === 'item' ? (
                  // Item nodes - rounded rectangles
                  <rect
                    x={-node.size}
                    y={-node.size * 0.7}
                    width={node.size * 2}
                    height={node.size * 1.4}
                    rx="4"
                    fill={colors.fill}
                    filter={isSelected || isHovered ? `url(#${filterType})` : undefined}
                  />
                ) : node.type === 'skill' ? (
                  // Skill nodes - diamonds
                  <polygon
                    points={`0,${-node.size} ${node.size},0 0,${node.size} ${-node.size},0`}
                    fill={colors.fill}
                    filter={isSelected || isHovered ? `url(#${filterType})` : undefined}
                  />
                ) : (
                  // Default - circle
                  <circle
                    r={node.size}
                    fill={colors.fill}
                    filter={isSelected || isHovered ? `url(#${filterType})` : undefined}
                  />
                )}

                {/* Lock indicator */}
                {isLocked && (
                  <circle
                    r={node.size + 8}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Label */}
                <text
                  y={node.size + 16}
                  textAnchor="middle"
                  fill="white"
                  fontSize={node.type === 'actor' ? '12' : '10'}
                  fontWeight={node.type === 'actor' ? 'bold' : 'normal'}
                  style={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    pointerEvents: 'none'
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-xs text-white">Protagonist</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-xs text-white">Antagonist</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-xs text-white">NPC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 rounded-sm bg-yellow-500" />
              <span className="text-xs text-white">Item</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rotate-45 bg-cyan-500" />
              <span className="text-xs text-white">Skill</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Panel */}
      {selectedNode && (
        <div className="absolute top-20 right-4 w-80 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div 
            className="p-4 border-b border-slate-700"
            style={{ 
              background: `linear-gradient(135deg, ${getNodeColor(selectedNode).fill}20, transparent)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getNodeColor(selectedNode).fill }}
                >
                  {selectedNode.type === 'actor' ? <Users className="w-5 h-5 text-white" /> :
                   selectedNode.type === 'item' ? <Briefcase className="w-5 h-5 text-white" /> :
                   selectedNode.type === 'skill' ? <Zap className="w-5 h-5 text-white" /> :
                   <MapPin className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedNode.label}</h3>
                  <p className="text-xs text-slate-400 capitalize">{selectedNode.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNodeLock(selectedNode)}
                  className={`p-1.5 rounded ${lockedNode?.id === selectedNode.id ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                  title={lockedNode?.id === selectedNode.id ? 'Unlock' : 'Lock focus'}
                >
                  {lockedNode?.id === selectedNode.id ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {/* Connections */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Connections</p>
              <div className="space-y-2">
                {edges
                  .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                  .slice(0, 10)
                  .map(edge => {
                    const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                    const otherNode = nodes.find(n => n.id === otherId);
                    if (!otherNode) return null;
                    return (
                      <button
                        key={edge.id}
                        onClick={() => setSelectedNode(otherNode)}
                        className="w-full flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: getNodeColor(otherNode).fill + '40' }}
                        >
                          {otherNode.type === 'actor' ? <Users className="w-3 h-3" style={{ color: getNodeColor(otherNode).fill }} /> :
                           otherNode.type === 'item' ? <Briefcase className="w-3 h-3" style={{ color: getNodeColor(otherNode).fill }} /> :
                           <Zap className="w-3 h-3" style={{ color: getNodeColor(otherNode).fill }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{otherNode.label}</p>
                          <p className="text-xs text-slate-500">{edge.type.replace('_', ' ')}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Metadata */}
            {selectedNode.metadata && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Details</p>
                <div className="space-y-1 text-sm">
                  {selectedNode.type === 'actor' && (
                    <>
                      {selectedNode.metadata.role && (
                        <p className="text-slate-400">Role: <span className="text-white">{selectedNode.metadata.role}</span></p>
                      )}
                      {selectedNode.metadata.bio && (
                        <p className="text-slate-400 text-xs mt-2">{selectedNode.metadata.bio.slice(0, 150)}...</p>
                      )}
                    </>
                  )}
                  {selectedNode.type === 'item' && (
                    <>
                      {selectedNode.metadata.rarity && (
                        <p className="text-slate-400">Rarity: <span className="text-white capitalize">{selectedNode.metadata.rarity}</span></p>
                      )}
                      {selectedNode.metadata.description && (
                        <p className="text-slate-400 text-xs mt-2">{selectedNode.metadata.description.slice(0, 150)}...</p>
                      )}
                    </>
                  )}
                  {selectedNode.type === 'skill' && (
                    <>
                      {selectedNode.metadata.tier && (
                        <p className="text-slate-400">Tier: <span className="text-white">{selectedNode.metadata.tier}</span></p>
                      )}
                      {selectedNode.metadata.description && (
                        <p className="text-slate-400 text-xs mt-2">{selectedNode.metadata.description.slice(0, 150)}...</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GravityMindMap;
