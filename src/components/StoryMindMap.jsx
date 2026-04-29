import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  GitBranch, Users, Briefcase, Zap, MapPin, Target, Heart, 
  Search, ZoomIn, ZoomOut, RefreshCw, X, Filter, Eye, EyeOff,
  ChevronRight, Maximize2, Circle, Layout, Grid, Compass, Download,
  Navigation, Layers, Sparkles, Merge, CheckSquare, Square
} from 'lucide-react';
import db from '../services/database';
import toastService from '../services/toastService';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import chapterNavigationService from '../services/chapterNavigationService';
import dataConsistencyService from '../services/dataConsistencyService';
import aiService from '../services/aiService';

/**
 * Story Mind Map Component
 * Force-directed graph visualization of story entities and their connections
 */
const StoryMindMap = ({ actors, items, skills, books, onClose }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Simulation state
  const [simulation, setSimulation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(true);
  
  // View state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleGroups, setVisibleGroups] = useState({
    protagonists: true,
    antagonists: true,
    npcs: true,
    characters: true,
    items: true,
    skills: true,
    locations: true,
    events: true
  });
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  
  // Layout state
  const [layoutMode, setLayoutMode] = useState('planetary'); // 'force' | 'radial' | 'hierarchical' | 'grid' | 'planetary'
  const [planetaryNodes, setPlanetaryNodes] = useState([]);
  const [selectedPlanet, setSelectedPlanet] = useState(null); // Selected planet for spider diagram
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showEdgeStrength, setShowEdgeStrength] = useState(true);
  const [isGeneratingConnections, setIsGeneratingConnections] = useState(false);
  const [isExtractingRelationships, setIsExtractingRelationships] = useState(false);
  const [isPopulatingEntities, setIsPopulatingEntities] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState(new Set());
  const [mergeSuggestions, setMergeSuggestions] = useState([]);
  const [isAnalyzingDuplicates, setIsAnalyzingDuplicates] = useState(false);
  
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  // Node type configurations
  const nodeConfig = {
    actor: { icon: Users, color: '#22c55e', shape: 'circle' },
    item: { icon: Briefcase, color: '#eab308', shape: 'rect' },
    skill: { icon: Zap, color: '#3b82f6', shape: 'diamond' },
    location: { icon: MapPin, color: '#06b6d4', shape: 'hexagon' },
    event: { icon: Target, color: '#f97316', shape: 'diamond' },
    relationship: { icon: Heart, color: '#ec4899', shape: 'circle' }
  };

  // Group colors
  const groupColors = {
    protagonists: '#22c55e',
    antagonists: '#ef4444',
    npcs: '#8b5cf6',
    characters: '#22c55e',
    items: '#eab308',
    skills: '#3b82f6',
    locations: '#06b6d4',
    events: '#f97316',
    other: '#64748b'
  };

  // Generate chapter rings for a planet (actor) - defined first as it's used by generatePlanetarySystem
  const generateChapterRings = useCallback((actor, allChapters) => {
    const baseRadius = 20;
    const ringSpacing = 15;
    
    return allChapters.map((chapter, idx) => ({
      chapterId: chapter.id,
      bookId: chapter.bookId,
      chapterNumber: chapter.number || idx + 1,
      chapterTitle: chapter.title || `Chapter ${chapter.number || idx + 1}`,
      radius: baseRadius + (idx * ringSpacing),
      entities: [],
      hasContent: !!(chapter.content || chapter.script)
    }));
  }, []);

  // Populate chapter rings with entities - defined before generatePlanetarySystem
  const populateChapterRings = useCallback(async (planetaryNode, allChapters, items, skills, locations) => {
    const actor = actors.find(a => a.id === planetaryNode.actorId);
    if (!actor) return planetaryNode;

    // Process rings and extract entities from chapter content
    const processedRings = await Promise.all(planetaryNode.chapterRings.map(async (ring) => {
      const chapter = allChapters.find(c => 
        c.id === ring.chapterId && c.bookId === ring.bookId
      );
      if (!chapter) return ring;

      const entities = [];
      
      // Extract entities from snapshots and appearances (existing logic)
      const snapshot = actor.snapshots?.[`${ring.bookId}_${ring.chapterId}`];
      if (snapshot) {
        if (snapshot.inventory) {
          snapshot.inventory.forEach(itemId => {
            const item = items.find(i => i.id === itemId);
            if (item) entities.push({ type: 'item', id: item.id, name: item.name, entity: item });
          });
        }
        if (snapshot.activeSkills) {
          snapshot.activeSkills.forEach(skillId => {
            const skillIdStr = typeof skillId === 'string' ? skillId : skillId.id;
            const skill = skills.find(s => s.id === skillIdStr);
            if (skill) entities.push({ type: 'skill', id: skill.id, name: skill.name, entity: skill });
          });
        }
      }
      if (actor.appearances) {
        const appearance = actor.appearances[`${ring.bookId}_${ring.chapterId}`];
        if (appearance?.location) {
          const location = locations.find(l => l.id === appearance.location || l.name === appearance.location);
          if (location) entities.push({ type: 'location', id: location.id, name: location.name, entity: location });
        }
      }
      
      // Extract entities directly from chapter content
      const chapterText = chapter.content || chapter.script || '';
      if (chapterText.length > 50) {
        try {
          const existingEntities = {
            actors: actors || [],
            items: items || [],
            skills: skills || []
          };
          
          const extracted = await chapterDataExtractionService.extractEntitiesFromChapter(
            chapterText,
            ring.chapterId,
            ring.bookId,
            existingEntities
          );
          
          // Add extracted entities to ring, avoiding duplicates
          if (extracted && extracted.entities) {
            extracted.entities.forEach(entity => {
              // Only add if entity is related to this actor or is a location/item/skill mentioned in context
              const actorNameLower = actor.name.toLowerCase();
              const entityNameLower = (entity.name || '').toLowerCase();
              
              // Check if entity is mentioned in context with this actor, or is a general location/item/skill
              if (entity.type === 'location' || entity.type === 'item' || entity.type === 'skill') {
                if (!entities.find(e => e.id === entity.id || e.name === entity.name)) {
                  entities.push({ 
                    type: entity.type, 
                    id: entity.id, 
                    name: entity.name, 
                    entity: entity.metadata || entity 
                  });
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error extracting entities from chapter ${ring.chapterId}:`, error);
        }
      }
      
      return { 
        ...ring, 
        entities, 
        hasContent: !!(chapter.content || chapter.script) || entities.length > 0,
        entityCount: entities.length
      };
    }));

    planetaryNode.chapterRings = processedRings;
    const totalEntities = planetaryNode.chapterRings.reduce((sum, ring) => sum + ring.entities.length, 0);
    
    // Calculate mention-based brightness for each ring
    const maxMentions = Math.max(...Object.values(planetaryNode.chapterMentions || {}), 1);
    processedRings.forEach(ring => {
      const chapterKey = `${ring.bookId}_${ring.chapterId}`;
      const mentionCount = planetaryNode.chapterMentions?.[chapterKey] || 0;
      // Brightness: 0.3 (dark) to 1.0 (bright) based on mentions
      ring.brightness = Math.min(1, 0.3 + (mentionCount / Math.max(maxMentions, 1)) * 0.7);
      ring.mentionCount = mentionCount;
    });
    
    // Scale planet size: mention-based is primary, but also consider entities
    const mentionRadius = planetaryNode.radius || 18; // Already set from mention count
    const entityRadius = Math.max(18, Math.min(35, 15 + Math.sqrt(totalEntities) * 1.5));
    // Use the larger of the two, but cap at 50px
    planetaryNode.radius = Math.min(50, Math.max(mentionRadius, entityRadius));
    planetaryNode.totalEntities = totalEntities;
    planetaryNode.maxRingRadius = Math.max(...processedRings.map(r => r.radius), 0);
    return planetaryNode;
  }, [actors, items, skills]);

  // Planetary gravitational simulation - defined before generatePlanetarySystem
  // Handle planet click - create spider diagram
  const handlePlanetClick = useCallback((planetId) => {
    if (selectedPlanet === planetId) {
      // Deselect if clicking same planet
      setSelectedPlanet(null);
      // Reset to original positions
      setPlanetaryNodes(prev => prev.map(p => ({
        ...p,
        x: p.originalX || p.x,
        y: p.originalY || p.y
      })));
    } else {
      setSelectedPlanet(planetId);
      // Create spider diagram formation
      createSpiderDiagram(planetId);
    }
  }, [selectedPlanet, planetaryNodes]);

  // Create spider diagram formation around selected planet
  const createSpiderDiagram = useCallback((selectedPlanetId) => {
    setPlanetaryNodes(prev => {
      const selected = prev.find(p => p.id === selectedPlanetId);
      if (!selected) return prev;

      const centerX = selected.x;
      const centerY = selected.y;
      const viewWidth = 1200; // Approximate view width
      const viewHeight = 800; // Approximate view height
      const outerEdgeDistance = Math.min(viewWidth, viewHeight) * 0.4; // Distance to outer edge

      // Find connected planets
      const connectedPlanets = [];
      const unconnectedPlanets = [];

      prev.forEach(planet => {
        if (planet.id === selectedPlanetId) return;

        // Check if connected via relationship
        const isConnected = relationships.some(rel => {
          const actor1Match = (rel.actor1Id === selected.actorId && rel.actor2Id === planet.actorId);
          const actor2Match = (rel.actor1Id === planet.actorId && rel.actor2Id === selected.actorId);
          return actor1Match || actor2Match;
        });

        if (isConnected) {
          connectedPlanets.push(planet);
        } else {
          unconnectedPlanets.push(planet);
        }
      });

      // Position connected planets in spider diagram
      // Distance based on relationship strength, evenly spaced around circle
      const connectedPositions = connectedPlanets.map((planet, idx) => {
        // Find relationship strength
        const rel = relationships.find(r => 
          (r.actor1Id === selected.actorId && r.actor2Id === planet.actorId) ||
          (r.actor1Id === planet.actorId && r.actor2Id === selected.actorId)
        );
        const strength = rel?.strength || 50;
        
        // Distance based on strength (stronger = closer, but with min/max bounds)
        const minDistance = 150;
        const maxDistance = 300;
        const distance = minDistance + (maxDistance - minDistance) * (1 - strength / 100);
        
        // Even spacing around circle
        const angle = (idx / connectedPlanets.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        return { ...planet, x, y };
      });

      // Move unconnected planets outward proportionally
      const unconnectedPositions = unconnectedPlanets.map(planet => {
        const dx = planet.x - centerX;
        const dy = planet.y - centerY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scale = outerEdgeDistance / Math.max(currentDistance, 1);
        const x = centerX + dx * scale;
        const y = centerY + dy * scale;
        return { ...planet, x, y };
      });

      return prev.map(planet => {
        if (planet.id === selectedPlanetId) {
          return { ...planet, x: centerX, y: centerY }; // Keep selected at center
        }
        
        const connected = connectedPositions.find(p => p.id === planet.id);
        if (connected) return connected;
        
        const unconnected = unconnectedPositions.find(p => p.id === planet.id);
        if (unconnected) return unconnected;
        
        return planet;
      });
    });
  }, [relationships]);

  const runPlanetarySimulation = useCallback(() => {
    // Don't run simulation if planet is selected (spider diagram mode)
    if (layoutMode !== 'planetary' || planetaryNodes.length === 0 || selectedPlanet) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    
    const G = 0.25; // Increased for more visible movement
    const repulsionForce = 0.3;
    const damping = 0.96; // Increased from 0.92 for less resistance
    const minDistance = 80;
    
    const simulate = () => {
      // Don't run simulation if planet is selected (spider diagram mode)
      if (layoutMode !== 'planetary' || selectedPlanet) {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        return;
      }
      
      setPlanetaryNodes(prevNodes => {
        if (prevNodes.length === 0) return prevNodes;
        
        const newNodes = prevNodes.map(node => ({ ...node }));
        const width = 1200;
        const height = 800;
        
        const centerX = 600;
        const centerY = 400;
        
        newNodes.forEach((node, i) => {
          // Centrality force for most mentioned node (isCenter)
          if (node.isCenter) {
            const centerDx = centerX - node.x;
            const centerDy = centerY - node.y;
            const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy) || 1;
            const centerForce = 0.15; // Strong pull to center
            node.vx += centerDx * centerForce * 0.1;
            node.vy += centerDy * centerForce * 0.1;
          }
          
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const rel = relationships.find(r => 
              (r.actor1Id === node.actorId && r.actor2Id === other.actorId) ||
              (r.actor1Id === other.actorId && r.actor2Id === node.actorId)
            );
            // Use actual relationship strength, with reduced default for non-relationships
            const relationshipStrength = rel ? (rel.strength || 50) / 100 : 0.01;
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            // Collision boundary: node radius + max ring radius + other node radius + other max ring radius + padding
            const minDist = node.radius + (node.maxRingRadius || 0) + other.radius + (other.maxRingRadius || 0) + 50;
            
            if (distance < minDist) {
              const repulsion = (minDist - distance) / distance * repulsionForce;
              node.vx -= dx * repulsion;
              node.vy -= dy * repulsion;
            } else {
              // Scale force by relationship strength more dramatically
              const force = (relationshipStrength * G * 2) / (distance * distance + 100);
              node.vx += dx * force;
              node.vy += dy * force;
            }
          });
          node.vx *= damping;
          node.vy *= damping;
          node.x += node.vx;
          node.y += node.vy;
          // Boundary constraints with proper spacing
          const boundaryPadding = node.radius + (node.maxRingRadius || 0) + 50;
          node.x = Math.max(boundaryPadding, Math.min(width - boundaryPadding, node.x));
          node.y = Math.max(node.radius + node.maxRingRadius + 50, Math.min(height - node.radius - node.maxRingRadius - 50, node.y));
        });
        return newNodes;
      });
      frameRef.current = requestAnimationFrame(simulate);
    };
    
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(simulate);
  }, [layoutMode, relationships, planetaryNodes.length, selectedPlanet]);

  // Generate planetary system - defined after dependencies
  // Count actor mentions across all chapters
  const countActorMentions = useCallback(async (actorsList, allChaptersList) => {
    const mentionCounts = {};
    const mentionCountsPerChapter = {}; // For ring brightness

    if (!actorsList || actorsList.length === 0 || !allChaptersList || allChaptersList.length === 0) {
      return { total: mentionCounts, perChapter: mentionCountsPerChapter };
    }

    // Build search patterns for each actor (name + nicknames)
    const actorPatterns = actorsList.map(actor => {
      const patterns = [actor.name.toLowerCase()];
      if (actor.nicknames && Array.isArray(actor.nicknames)) {
        actor.nicknames.forEach(nick => {
          if (nick && nick.trim()) patterns.push(nick.toLowerCase());
        });
      }
      return { actorId: actor.id, patterns };
    });

    // Count mentions in each chapter
    allChaptersList.forEach(chapter => {
      const chapterText = (chapter.content || chapter.script || '').toLowerCase();
      if (!chapterText || chapterText.length < 10) return;

      actorPatterns.forEach(({ actorId, patterns }) => {
        let count = 0;
        patterns.forEach(pattern => {
          // Count occurrences (case-insensitive, word boundary aware)
          const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const matches = chapterText.match(regex);
          if (matches) count += matches.length;
        });

        if (count > 0) {
          if (!mentionCounts[actorId]) mentionCounts[actorId] = 0;
          mentionCounts[actorId] += count;

          if (!mentionCountsPerChapter[actorId]) mentionCountsPerChapter[actorId] = {};
          const chapterKey = `${chapter.bookId}_${chapter.id}`;
          mentionCountsPerChapter[actorId][chapterKey] = count;
        }
      });
    });

    return { total: mentionCounts, perChapter: mentionCountsPerChapter };
  }, []);

  const generatePlanetarySystem = useCallback(async () => {
    console.log('[StoryMindMap] generatePlanetarySystem called', { 
      actorsCount: actors?.length || 0, 
      booksCount: Array.isArray(books) ? books.length : Object.keys(books || {}).length,
      layoutMode 
    });
    
    if (!actors || actors.length === 0) {
      console.log('[StoryMindMap] No actors, setting empty planetary nodes');
      setPlanetaryNodes([]);
      return;
    }
    
    const allChapters = [];
    const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
    booksArray.forEach(book => {
      if (book?.chapters) {
        book.chapters.forEach(chapter => {
          allChapters.push({ ...chapter, bookId: book.id });
        });
      }
    });

    console.log('[StoryMindMap] Generating planetary nodes', { actorsCount: actors.length, chaptersCount: allChapters.length });

    // Count mentions for each actor
    const { total: mentionCounts, perChapter: mentionCountsPerChapter } = await countActorMentions(actors, allChapters);

    // Sort actors by mention count (most mentioned = center)
    const sortedActors = [...actors].sort((a, b) => 
      (mentionCounts[b.id] || 0) - (mentionCounts[a.id] || 0)
    );

    // Distribute planets in a radial spiral, with most mentioned at center
    const centerX = 600;
    const centerY = 400;
    const spiralTightness = 0.15; // Controls how tight the spiral is
    const spiralRadius = 120; // Base radius for spiral
    
    const newPlanetaryNodes = sortedActors.map((actor, idx) => {
      const mentionCount = mentionCounts[actor.id] || 0;
      const chapterMentions = mentionCountsPerChapter[actor.id] || {};
      
      // Calculate node radius based on mention count (cap at 50px)
      const baseRadiusSize = 18;
      const mentionRadius = Math.min(50, baseRadiusSize + Math.sqrt(mentionCount) * 2);
      
      const chapterRings = generateChapterRings(actor, allChapters);
      
      let x, y;
      if (idx === 0) {
        // Most mentioned at center
        x = centerX;
        y = centerY;
      } else {
        // Spiral outward: angle increases, radius increases
        const angle = idx * spiralTightness * Math.PI * 2; // Golden angle approximation
        const radius = spiralRadius * Math.sqrt(idx); // Square root for even distribution
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      return {
        id: `planet_${actor.id}`,
        type: 'planet',
        actorId: actor.id,
        actorName: actor.name,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: mentionRadius,
        mentionCount: mentionCount,
        chapterMentions: chapterMentions,
        maxRingRadius: chapterRings.length > 0 ? chapterRings[chapterRings.length - 1].radius : 20,
        chapterRings,
        entities: { items: [], skills: [], locations: [], events: [] },
        metadata: actor,
        isCenter: idx === 0,
        originalX: x, // Store original position for reset
        originalY: y
      };
    });

    // Load locations for entity population
    const locations = await db.getAll('locations').catch(() => []);
    
    // Populate nodes with entities (now async)
    const populatedNodes = await Promise.all(newPlanetaryNodes.map(node => 
      populateChapterRings(node, allChapters, items || [], skills || [], locations || [])
    ));
    
    console.log('[StoryMindMap] Setting planetary nodes:', populatedNodes.length);
    setPlanetaryNodes(populatedNodes);
    
    // Start simulation after a brief delay to ensure state is set
    if (layoutMode === 'planetary') {
      setTimeout(() => {
        console.log('[StoryMindMap] Starting planetary simulation');
        runPlanetarySimulation();
      }, 100);
    }
  }, [actors, books, items, skills, generateChapterRings, populateChapterRings, layoutMode, runPlanetarySimulation]);

  useEffect(() => {
    // Always load relationships (needed for planetary gravitational connections)
    loadRelationships();
    
    // Only load old graph data if NOT in planetary mode
    if (layoutMode !== 'planetary') {
      loadGraphData();
    } else {
      // In planetary mode, clear old nodes to prevent rendering conflicts
      setNodes([]);
      setEdges([]);
    }
  }, [actors, items, skills, layoutMode]);

  // Generate planetary system on mount and when dependencies change
  useEffect(() => {
    if (layoutMode === 'planetary') {
      // Ensure actors and books are loaded before generating
      if (actors && actors.length > 0 && books) {
        try {
          generatePlanetarySystem();
        } catch (error) {
          console.error('[StoryMindMap] Error generating planetary system:', error);
          setPlanetaryNodes([]);
        }
      } else {
        // If no actors/books yet, set empty array to show loading state
        console.log('[StoryMindMap] Waiting for actors/books...', { actors, books });
        setPlanetaryNodes([]);
      }
    } else if (nodes.length > 0 && isSimulating) {
      runSimulation();
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [layoutMode, actors, books, relationships, items, skills, generatePlanetarySystem]);
  
  // Separate effect to start simulation when planetary nodes are ready or relationships change
  useEffect(() => {
    if (layoutMode === 'planetary' && planetaryNodes.length > 0) {
      // Cancel any existing simulation
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      const timer = setTimeout(() => {
        runPlanetarySimulation();
      }, 100);
      return () => {
        clearTimeout(timer);
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [planetaryNodes.length, layoutMode, relationships.length, runPlanetarySimulation]);

  // Fix passive event listener warning for wheel events
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(3, Math.max(0.3, prev.scale * scaleDelta))
      }));
    };

    containerElement.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      containerElement.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  // Merge nodes from DB and props, deduplicating by entityId
  const mergeNodesWithProps = (dbNodes, propsNodes) => {
    const nodeMap = new Map();
    
    // First, add all DB nodes (these take precedence)
    dbNodes.forEach(node => {
      const key = node.entityId || node.id;
      if (key) {
        nodeMap.set(key, node);
      }
    });
    
    // Then add props nodes only if they don't exist
    propsNodes.forEach(node => {
      const key = node.entityId || node.id;
      if (key && !nodeMap.has(key)) {
        nodeMap.set(key, node);
      }
    });
    
    return Array.from(nodeMap.values());
  };

  const loadGraphData = async () => {
    // Don't load old graph data if in planetary mode
    if (layoutMode === 'planetary') {
      console.log('[StoryMindMap] Skipping loadGraphData - in planetary mode');
      return;
    }
    
    try {
      setLoading(true);
      
      // Load from database
      const [dbNodes, dbEdges] = await Promise.all([
        db.getAll('mindMapNodes'),
        db.getAll('mindMapEdges')
      ]);

      // Always generate from current props to ensure latest data
      const generatedNodes = generateNodesFromData();
      const generatedEdges = generateEdgesFromData(generatedNodes);
      
      // Merge DB nodes with generated nodes (deduplicate by entityId)
      const mergedNodes = mergeNodesWithProps(dbNodes, generatedNodes);
      
      // Merge edges - combine DB edges with generated edges
      const edgeMap = new Map();
      dbEdges.forEach(edge => {
        const key = `${edge.source}_${edge.target}_${edge.type}`;
        edgeMap.set(key, edge);
      });
      generatedEdges.forEach(edge => {
        const key = `${edge.source}_${edge.target}_${edge.type}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, edge);
        }
      });
      const mergedEdges = Array.from(edgeMap.values());
      
      setNodes(mergedNodes);
      
      // Create relationship edges and merge with existing edges
      const relationshipEdges = createRelationshipEdges(relationships, mergedNodes);
      const allEdges = [...mergedEdges, ...relationshipEdges];
      
      // Deduplicate edges (reuse edgeMap from above)
      allEdges.forEach(edge => {
        const key = `${edge.source}_${edge.target}_${edge.type}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, edge);
        }
      });
      setEdges(Array.from(edgeMap.values()));
    } catch (error) {
      console.error('Error loading graph data:', error);
      // Fallback to generating from current data
      const generatedNodes = generateNodesFromData();
      const generatedEdges = generateEdgesFromData(generatedNodes);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    } finally {
      setLoading(false);
    }
  };

  // Extract relationships from chapters and convert to relationship objects
  // NOTE: This function is deprecated. Relationships should be extracted via Personnel tab chapter analysis.
  // This function is kept for backward compatibility but should use Relationship Tracker data instead.
  const extractRelationshipsFromChapters = async () => {
    if (!books || (Array.isArray(books) ? books.length === 0 : Object.keys(books || {}).length === 0)) {
      toastService.error('No books found. Please add chapters first.');
      return;
    }

    setIsGeneratingConnections(true);
    try {
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      const allChapters = [];
      booksArray.forEach(book => {
        if (book && book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach(chapter => {
            allChapters.push({
              bookId: book.id,
              chapterId: chapter.id,
              chapterNumber: chapter.number || 0,
              title: chapter.title || `Chapter ${chapter.number || ''}`,
              content: chapter.script || chapter.content || '',
              desc: chapter.desc || ''
            });
          });
        }
      });

      if (allChapters.length === 0) {
        toastService.error('No chapters found in books.');
        return;
      }

      let relationshipsCreated = 0;
      let relationshipsUpdated = 0;

      // Process each chapter
      for (const chapter of allChapters) {
        if (!chapter.content || chapter.content.trim().length < 50) continue;

        try {
          // Use advanced relationship extraction
          const extractedRelationships = await chapterDataExtractionService.extractRelationshipsAdvanced(
            chapter.content,
            chapter.chapterId,
            chapter.bookId,
            actors || []
          );

          // Process each extracted relationship
          for (const rel of extractedRelationships) {
            if (!rel.actor1Id || !rel.actor2Id || rel.actor1Id === rel.actor2Id) continue;

            // Check if relationship already exists
            const existingRels = await db.getAll('relationships');
            const existingRel = existingRels.find(r => 
              (r.actor1Id === rel.actor1Id && r.actor2Id === rel.actor2Id) ||
              (r.actor1Id === rel.actor2Id && r.actor2Id === rel.actor1Id)
            );

            if (existingRel) {
              // Update existing relationship - merge data
              const newStrength = Math.max(existingRel.strength || 50, rel.strength);
              const dominantType = _getDominantRelationshipType(existingRel.type, rel.type);
              
              existingRel.strength = newStrength;
              existingRel.type = dominantType;
              existingRel.description = rel.change || existingRel.description || '';
              existingRel.history = existingRel.history || [];
              existingRel.history.push({
                chapterId: chapter.chapterId,
                bookId: chapter.bookId,
                change: rel.change,
                events: rel.events,
                emotion: rel.emotion,
                dialogue: rel.dialogue,
                progression: rel.progression,
                timestamp: Date.now()
              });
              
              // Merge events, dialogue if not already present
              if (rel.events && rel.events.length > 0) {
                existingRel.events = [...(existingRel.events || []), ...rel.events].slice(0, 10);
              }
              if (rel.dialogue && rel.dialogue.length > 0) {
                existingRel.dialogue = [...(existingRel.dialogue || []), ...rel.dialogue].slice(0, 5);
              }
              
              existingRel.updatedAt = Date.now();
              await db.update('relationships', existingRel);
              relationshipsUpdated++;
            } else {
              // Create new relationship with all extracted data
              const newRelationship = {
                id: `rel_${rel.actor1Id}_${rel.actor2Id}_${Date.now()}`,
                actor1Id: rel.actor1Id,
                actor2Id: rel.actor2Id,
                type: rel.type,
                strength: rel.strength,
                description: rel.change || '',
                context: rel.context || '',
                emotion: rel.emotion || '',
                events: rel.events || [],
                dialogue: rel.dialogue || [],
                progression: rel.progression || '',
                history: [{
                  chapterId: chapter.chapterId,
                  bookId: chapter.bookId,
                  change: rel.change,
                  events: rel.events,
                  emotion: rel.emotion,
                  dialogue: rel.dialogue,
                  progression: rel.progression,
                  timestamp: Date.now()
                }],
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              await db.add('relationships', newRelationship);
              relationshipsCreated++;
            }
          }
        } catch (error) {
          console.error(`Error processing chapter ${chapter.chapterId}:`, error);
        }
      }

      // Reload relationships to update state
      await loadRelationships();
      
      toastService.success(
        `Extracted relationships: ${relationshipsCreated} created, ${relationshipsUpdated} updated from ${allChapters.length} chapters.`
      );
    } catch (error) {
      console.error('Error extracting relationships from chapters:', error);
      toastService.error('Error extracting relationships: ' + error.message);
    } finally {
      setIsExtractingRelationships(false);
    }
  };

  // Helper to determine dominant relationship type when merging
  const _getDominantRelationshipType = (type1, type2) => {
    // Priority order: hostile > romantic > familial > allied > mentor > business > rival > neutral
    const priority = {
      'hostile': 7,
      'romantic': 6,
      'familial': 5,
      'allied': 4,
      'mentor': 3,
      'business': 2,
      'rival': 1,
      'neutral': 0
    };
    
    const p1 = priority[type1?.toLowerCase()] ?? 0;
    const p2 = priority[type2?.toLowerCase()] ?? 0;
    
    return p1 >= p2 ? type1 : type2;
  };

  // Load relationships from database
  const loadRelationships = async () => {
    try {
      // Load relationships from database (populated by Relationship Tracker from actor snapshots)
      // Relationships are now managed through Personnel tab chapter analysis, not direct text extraction
      const rels = await db.getAll('relationships');
      setRelationships(rels);
      // Reload graph data to include relationship edges if nodes are already loaded
      if (nodes.length > 0) {
        const relationshipEdges = createRelationshipEdges(rels, nodes);
        const allEdges = [...edges, ...relationshipEdges];
        const edgeMap = new Map();
        allEdges.forEach(edge => {
          const key = `${edge.source}_${edge.target}_${edge.type}`;
          if (!edgeMap.has(key)) {
            edgeMap.set(key, edge);
          }
        });
        setEdges(Array.from(edgeMap.values()));
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  // Create edges from relationship data
  const createRelationshipEdges = (relationships, nodeList) => {
    const edges = [];
    const nodeMap = new Map();
    
    // Create map of nodes by entityId and id
    nodeList.forEach(node => {
      if (node.entityId) nodeMap.set(node.entityId, node);
      nodeMap.set(node.id, node);
    });

    relationships.forEach(rel => {
      // Handle different relationship data structures
      const actor1Id = rel.actor1Id || rel.actors?.[0];
      const actor2Id = rel.actor2Id || rel.actors?.[1];
      
      if (!actor1Id || !actor2Id) return;

      // Find nodes for both actors
      const node1 = nodeMap.get(actor1Id) || nodeList.find(n => 
        n.entityId === actor1Id || 
        (n.type === 'actor' && n.metadata?.id === actor1Id)
      );
      const node2 = nodeMap.get(actor2Id) || nodeList.find(n => 
        n.entityId === actor2Id || 
        (n.type === 'actor' && n.metadata?.id === actor2Id)
      );

      if (node1 && node2) {
        edges.push({
          id: `edge_rel_${rel.id || `${actor1Id}_${actor2Id}`}`,
          source: node1.id,
          target: node2.id,
          type: rel.type || 'relationship',
          label: rel.type || 'relationship',
          strength: (rel.strength || 50) / 100, // Normalize to 0-1
          relationshipData: rel,
          chapterContext: rel.history || rel.events || []
        });
      }
    });

    return edges;
  };

  // AI-powered duplicate detection
  const analyzeDuplicates = async () => {
    setIsAnalyzingDuplicates(true);
    try {
      const actorNodes = nodes.filter(n => n.type === 'actor');
      if (actorNodes.length < 2) {
        toastService.info('Need at least 2 actor nodes to detect duplicates');
        return;
      }

      // Prepare data for AI analysis
      const actorData = actorNodes.map(node => ({
        id: node.id,
        entityId: node.entityId,
        name: node.label,
        metadata: node.metadata
      }));

      const prompt = `Analyze these character names and identify which ones are likely the same character with different name variations. Return a JSON array of groups, where each group contains the IDs of characters that should be merged together.

Characters:
${actorData.map(a => `- ${a.name} (ID: ${a.id})`).join('\n')}

Return format: [{"group": 1, "ids": ["id1", "id2"], "reason": "Same character, different name variations"}, ...]`;

      const response = await aiService.callAI(
        prompt,
        'structured',
        '',
        { temperature: 0.3, maxTokens: 2000 }
      );

      if (response && Array.isArray(response)) {
        setMergeSuggestions(response);
        toastService.success(`Found ${response.length} potential duplicate groups`);
      } else {
        toastService.error('Failed to analyze duplicates');
      }
    } catch (error) {
      console.error('Error analyzing duplicates:', error);
      toastService.error('Error analyzing duplicates');
    } finally {
      setIsAnalyzingDuplicates(false);
    }
  };


  // Render planetary view
  const renderPlanetaryView = () => {
    
    if (planetaryNodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Compass className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-3" />
            <p className="text-slate-400">Generating planetary system...</p>
            <p className="text-slate-500 text-sm mt-1">Creating chapter rings for each actor</p>
            <p className="text-slate-600 text-xs mt-2">
              Actors: {actors?.length || 0}, Books: {Array.isArray(books) ? books.length : Object.keys(books || {}).length}
            </p>
          </div>
        </div>
      );
    }
    
    const bookColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    
    return (
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 1200 800"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center'
        }}
      >
        <defs>
          <filter id="planetGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Gravitational links between planets - merged per pair */}
        {(() => {
          // Group relationships by actor pair (merge multiple relationships into one link)
          const relationshipMap = new Map();
          
          relationships.forEach(rel => {
            const key1 = `${rel.actor1Id}_${rel.actor2Id}`;
            const key2 = `${rel.actor2Id}_${rel.actor1Id}`;
            const key = relationshipMap.has(key1) ? key1 : (relationshipMap.has(key2) ? key2 : key1);
            
            if (!relationshipMap.has(key)) {
              relationshipMap.set(key, {
                actor1Id: rel.actor1Id,
                actor2Id: rel.actor2Id,
                types: [],
                strengths: [],
                relationships: []
              });
            }
            
            const merged = relationshipMap.get(key);
            merged.types.push(rel.type || 'neutral');
            merged.strengths.push(rel.strength || 50);
            merged.relationships.push(rel);
          });
          
          // Render merged relationships
          return Array.from(relationshipMap.values()).map(merged => {
            const planet1 = filteredPlanetaryNodes.find(p => p.actorId === merged.actor1Id);
            const planet2 = filteredPlanetaryNodes.find(p => p.actorId === merged.actor2Id);
            if (!planet1 || !planet2) return null;
            
            // Determine dominant type (priority: hostile > romantic > familial > allied > mentor > business > rival > neutral)
            const typePriority = {
              'hostile': 7, 'romantic': 6, 'familial': 5, 'allied': 4,
              'mentor': 3, 'business': 2, 'rival': 1, 'neutral': 0
            };
            const dominantType = merged.types.reduce((a, b) => 
              (typePriority[a?.toLowerCase()] ?? 0) >= (typePriority[b?.toLowerCase()] ?? 0) ? a : b
            ) || 'neutral';
            
            // Calculate combined strength (average or max)
            const avgStrength = merged.strengths.reduce((a, b) => a + b, 0) / merged.strengths.length;
            const maxStrength = Math.max(...merged.strengths);
            const combinedStrength = Math.max(avgStrength, maxStrength * 0.9); // Slight bias toward max
            
            // Get color from relationship type
            const getRelationshipColor = (type) => {
              const typeMap = {
                'allied': '#22c55e',      // green
                'hostile': '#ef4444',     // red
                'romantic': '#ec4899',    // pink
                'familial': '#a855f7',    // purple
                'mentor': '#3b82f6',      // blue
                'neutral': '#64748b',     // grey
                'business': '#f59e0b',    // orange
                'rival': '#dc2626'        // dark red
              };
              return typeMap[type?.toLowerCase()] || '#64748b';
            };
            
            const strength = combinedStrength / 100;
            const dx = planet2.x - planet1.x;
            const dy = planet2.y - planet1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Curved path to avoid other planets
            const midX = (planet1.x + planet2.x) / 2;
            const midY = (planet1.y + planet2.y) / 2;
            const ctrlX = midX - dy * 0.2;
            const ctrlY = midY + dx * 0.2;
            
            // Visual feedback: thicker, more opaque links for stronger relationships
            const strokeWidth = Math.max(1, Math.min(8, strength * 10));
            const opacity = Math.max(0.3, Math.min(0.9, 0.4 + strength * 0.5));
            const linkColor = getRelationshipColor(dominantType);
            
            // Check if this relationship is connected to selected planet
            const isConnectedToSelected = selectedPlanet && (
              (planet1.id === selectedPlanet || planet2.id === selectedPlanet)
            );
            const highlightOpacity = isConnectedToSelected ? 1 : opacity;
            const highlightStrokeWidth = isConnectedToSelected ? strokeWidth * 1.5 : strokeWidth;
            const highlightColor = isConnectedToSelected ? '#ffffff' : linkColor;
            
            return (
              <g key={`link_${merged.actor1Id}_${merged.actor2Id}`}>
                <path
                  d={`M ${planet1.x} ${planet1.y} Q ${ctrlX} ${ctrlY} ${planet2.x} ${planet2.y}`}
                  stroke={highlightColor}
                  strokeWidth={highlightStrokeWidth}
                  fill="none"
                  opacity={highlightOpacity}
                  strokeDasharray={dominantType === 'hostile' ? '5,5' : 'none'}
                  style={{
                    filter: isConnectedToSelected ? 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                {/* Tooltip on hover with detailed relationship info */}
                <title>
                  {planet1.actorName || planet1.name} ↔ {planet2.actorName || planet2.name}
                  {'\n'}Type: {dominantType}
                  {'\n'}Strength: {Math.round(combinedStrength)}/100
                  {merged.relationships.length > 1 ? `\n(${merged.relationships.length} relationships merged)` : ''}
                  {merged.relationships[0]?.description ? `\n${merged.relationships[0].description}` : ''}
                  {merged.relationships[0]?.emotion ? `\nEmotion: ${merged.relationships[0].emotion}` : ''}
                </title>
                {/* Visual strength indicator */}
                <circle
                  cx={(planet1.x + planet2.x) / 2}
                  cy={(planet1.y + planet2.y) / 2}
                  r={Math.max(3, Math.min(8, strength * 8))}
                  fill={isConnectedToSelected ? highlightColor : linkColor}
                  opacity={highlightOpacity * 0.8}
                />
              </g>
            );
          }).filter(Boolean);
        })()}
        
        {/* Planets with rings */}
        {filteredPlanetaryNodes.map(planet => {
          const actor = actors?.find(a => a.id === planet.actorId);
          const role = actor?.role || 'character';
          const planetColor = groupColors[role] || groupColors.characters;
          
          const isSelected = selectedPlanet === planet.id;
          const isFaded = selectedPlanet && !isSelected;
          
          return (
            <g 
              key={planet.id} 
              transform={`translate(${planet.x}, ${planet.y})`}
              onClick={() => handlePlanetClick(planet.id)}
              style={{ cursor: 'pointer' }}
              opacity={isFaded ? 0.5 : 1}
            >
              {/* Chapter rings - same style as skill tree */}
              {planet.chapterRings && planet.chapterRings.map((ring, idx) => {
                const bookColor = bookColors[ring.bookId % bookColors.length] || '#64748b';
                return (
                  <g key={`ring_${ring.chapterId || idx}`}>
                    <circle
                      r={ring.radius}
                      fill="none"
                      stroke={ring.hasContent ? bookColor : 'rgba(255,255,255,0.1)'}
                      strokeWidth={ring.hasContent ? (1 + (ring.brightness || 0.5) * 2) : 1}
                      strokeDasharray={ring.hasContent ? 'none' : '8 8'}
                      opacity={ring.hasContent ? (ring.brightness || 0.5) : 0.3}
                    />
                    {/* Chapter label at top of ring */}
                    <text
                      x="0"
                      y={-ring.radius - 5}
                      textAnchor="middle"
                      fill={ring.hasContent ? bookColor : 'rgba(255,255,255,0.4)'}
                      fontSize="9"
                      fontWeight={ring.hasContent ? 'bold' : 'normal'}
                      opacity={0.8}
                    >
                      Ch {ring.chapterNumber || idx + 1}
                    </text>
                    {/* Entity count on ring */}
                    {ring.entityCount > 0 && (
                      <text
                        x="0"
                        y={ring.radius + 12}
                        textAnchor="middle"
                        fill={bookColor}
                        fontSize="8"
                        fontWeight="bold"
                        opacity={0.9}
                      >
                        {ring.entityCount}
                      </text>
                    )}
                    {/* Entities on ring - distributed around circumference */}
                    {ring.entities && ring.entities.map((entity, entityIdx) => {
                      const angle = (entityIdx / Math.max(ring.entities.length, 1)) * Math.PI * 2;
                      const entityX = Math.cos(angle) * ring.radius;
                      const entityY = Math.sin(angle) * ring.radius;
                      const entityColor = nodeConfig[entity.type]?.color || '#64748b';
                      const Icon = nodeConfig[entity.type]?.icon;
                      
                      return (
                        <g key={`entity_${entity.id || entityIdx}`} transform={`translate(${entityX}, ${entityY})`}>
                          <circle
                            r="4"
                            fill={entityColor}
                            stroke="white"
                            strokeWidth="1"
                            opacity="0.9"
                          />
                          {Icon && (
                            <Icon 
                              className="w-2 h-2" 
                              x={-4} 
                              y={-4}
                              style={{ color: 'white', opacity: 0.9 }}
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              
              {/* Planet core with pulse animation based on mentions */}
              <circle
                r={planet.radius}
                fill={planetColor}
                stroke={isSelected ? '#ffffff' : planetColor}
                strokeWidth={isSelected ? 5 : 3}
                filter="url(#planetGlow)"
                opacity={isSelected ? 1 : 0.9}
                style={{
                  animation: planet.mentionCount > 0 
                    ? `planetPulse ${2 + (100 / Math.max(planet.mentionCount, 1))}s infinite`
                    : 'none',
                  filter: isSelected ? 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' : 'url(#planetGlow)',
                  transition: 'all 0.3s ease'
                }}
              />
              {/* Pulse ring for high mention count */}
              {planet.mentionCount > 50 && (
                <circle
                  r={planet.radius + 5}
                  fill="none"
                  stroke={planetColor}
                  strokeWidth="2"
                  opacity="0.6"
                  style={{
                    animation: `planetPulse ${2 + (100 / planet.mentionCount)}s infinite`
                  }}
                />
              )}
              <text
                y={planet.radius + 18}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                {planet.actorName}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Merge selected actors
  const mergeSelectedActors = async () => {
    if (selectedForMerge.size < 2) {
      toastService.error('Please select at least 2 actors to merge');
      return;
    }

    try {
      const selectedIds = Array.from(selectedForMerge);
      const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && n.type === 'actor');
      
      if (selectedNodes.length < 2) {
        toastService.error('Selected nodes must be actors');
        return;
      }

      // Get full actor data from database
      const actorsToMerge = [];
      const allActors = await db.getAll('actors');
      for (const node of selectedNodes) {
        const actor = allActors.find(a => a.id === node.entityId);
        if (actor) actorsToMerge.push(actor);
      }

      if (actorsToMerge.length < 2) {
        toastService.error('Could not load all actors from database');
        return;
      }

      // Choose primary actor (first one, or one with most data)
      const primaryActor = actorsToMerge.reduce((prev, curr) => {
        const prevData = (prev.activeSkills?.length || 0) + (prev.inventory?.length || 0);
        const currData = (curr.activeSkills?.length || 0) + (curr.inventory?.length || 0);
        return currData > prevData ? curr : prev;
      });

      const mergedActor = {
        ...primaryActor,
        // Merge names - add others as nicknames
        nicknames: [
          ...(primaryActor.nicknames || []),
          ...actorsToMerge
            .filter(a => a.id !== primaryActor.id)
            .map(a => a.name)
            .filter(name => name !== primaryActor.name)
        ],
        // Merge skills (deduplicate)
        activeSkills: [
          ...new Set([
            ...(primaryActor.activeSkills || []),
            ...actorsToMerge.flatMap(a => a.activeSkills || [])
          ])
        ],
        // Merge inventory (deduplicate)
        inventory: [
          ...new Set([
            ...(primaryActor.inventory || []),
            ...actorsToMerge.flatMap(a => a.inventory || [])
          ])
        ],
        // Merge stats (take highest values)
        baseStats: Object.keys(primaryActor.baseStats || {}).reduce((acc, stat) => {
          acc[stat] = Math.max(
            primaryActor.baseStats[stat] || 0,
            ...actorsToMerge.map(a => a.baseStats?.[stat] || 0)
          );
          return acc;
        }, {}),
        // Merge snapshots
        snapshots: {
          ...(primaryActor.snapshots || {}),
          ...actorsToMerge.reduce((acc, a) => ({ ...acc, ...(a.snapshots || {}) }), {})
        },
        // Merge appearances
        appearances: {
          ...(primaryActor.appearances || {}),
          ...actorsToMerge.reduce((acc, a) => ({ ...acc, ...(a.appearances || {}) }), {})
        }
      };

      // Update primary actor
      await db.update('actors', mergedActor);

      // Update all relationships to point to primary actor
      const allRelationships = await db.getAll('relationships');
      for (const rel of allRelationships) {
        const actor1Id = rel.actor1Id || rel.actors?.[0];
        const actor2Id = rel.actor2Id || rel.actors?.[1];
        let updated = false;

        if (actorsToMerge.some(a => a.id === actor1Id) && actor1Id !== primaryActor.id) {
          rel.actor1Id = primaryActor.id;
          if (rel.actors) rel.actors[0] = primaryActor.id;
          updated = true;
        }
        if (actorsToMerge.some(a => a.id === actor2Id) && actor2Id !== primaryActor.id) {
          rel.actor2Id = primaryActor.id;
          if (rel.actors) rel.actors[1] = primaryActor.id;
          updated = true;
        }

        if (updated) {
          await db.update('relationships', rel);
        }
      }

      // Delete duplicate actors
      for (const actor of actorsToMerge) {
        if (actor.id !== primaryActor.id) {
          await db.delete('actors', actor.id);
        }
      }

      // Update mind map nodes
      const primaryNode = selectedNodes.find(n => n.entityId === primaryActor.id);
      if (primaryNode) {
        // Update primary node with merged data
        const updatedNode = {
          ...primaryNode,
          label: primaryActor.name,
          metadata: primaryActor
        };
        await db.update('mindMapNodes', updatedNode);

        // Delete duplicate nodes
        for (const node of selectedNodes) {
          if (node.id !== primaryNode.id) {
            await db.delete('mindMapNodes', node.id);
          }
        }
      }

      // Update edges to point to primary node
      const allEdges = await db.getAll('mindMapEdges');
      for (const edge of allEdges) {
        let updated = false;
        if (selectedNodes.some(n => n.id === edge.source) && edge.source !== primaryNode.id) {
          edge.source = primaryNode.id;
          updated = true;
        }
        if (selectedNodes.some(n => n.id === edge.target) && edge.target !== primaryNode.id) {
          edge.target = primaryNode.id;
          updated = true;
        }
        if (updated) {
          await db.update('mindMapEdges', edge);
        }
      }

      toastService.success(`Merged ${selectedNodes.length} actors into ${primaryActor.name}`);
      
      // Reload data
      setSelectedForMerge(new Set());
      setMergeMode(false);
      
      // Force reload by clearing and reloading
      setNodes([]);
      setEdges([]);
      await loadGraphData();
      await loadRelationships();
      
      // Note: Parent component should reload actors from database on next render
      // The actors prop will update when parent re-fetches from DB
    } catch (error) {
      console.error('Error merging actors:', error);
      toastService.error('Error merging actors: ' + error.message);
    }
  };

  const generateNodesFromData = () => {
    const generatedNodes = [];
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    // Add actors
    actors?.forEach((actor, idx) => {
      const angle = (idx / (actors.length || 1)) * Math.PI * 2;
      generatedNodes.push({
        id: `node_actor_${actor.id}`,
        entityId: actor.id,
        entityType: 'actor',
        type: 'actor',
        label: actor.name,
        group: actor.role?.toLowerCase().includes('protagonist') ? 'protagonists' 
             : actor.role?.toLowerCase().includes('antagonist') ? 'antagonists'
             : actor.role?.toLowerCase().includes('npc') ? 'npcs' : 'characters',
        size: actor.role?.toLowerCase().includes('protagonist') ? 25 : 20,
        x: centerX + Math.cos(angle) * radius + Math.random() * 50,
        y: centerY + Math.sin(angle) * radius + Math.random() * 50,
        vx: 0,
        vy: 0,
        metadata: actor
      });
    });

    // Add items
    items?.forEach((item, idx) => {
      const angle = (idx / (items.length || 1)) * Math.PI * 2;
      generatedNodes.push({
        id: `node_item_${item.id}`,
        entityId: item.id,
        entityType: 'item',
        type: 'item',
        label: item.name,
        group: 'items',
        size: 15,
        x: centerX + Math.cos(angle) * (radius * 1.5) + Math.random() * 50,
        y: centerY + Math.sin(angle) * (radius * 1.5) + Math.random() * 50,
        vx: 0,
        vy: 0,
        metadata: item
      });
    });

    // Add skills
    skills?.forEach((skill, idx) => {
      const angle = (idx / (skills.length || 1)) * Math.PI * 2;
      generatedNodes.push({
        id: `node_skill_${skill.id}`,
        entityId: skill.id,
        entityType: 'skill',
        type: 'skill',
        label: skill.name,
        group: 'skills',
        size: 12,
        x: centerX + Math.cos(angle) * (radius * 0.8) + Math.random() * 50,
        y: centerY + Math.sin(angle) * (radius * 0.8) + Math.random() * 50,
        vx: 0,
        vy: 0,
        metadata: skill
      });
    });

    return generatedNodes;
  };

  const generateEdgesFromData = (nodeList) => {
    const generatedEdges = [];
    const nodeMap = new Map(nodeList.map(n => [n.entityId, n]));

    // Link actors to their items (inventory)
    actors?.forEach(actor => {
      actor.inventory?.forEach(itemId => {
        const itemNode = nodeList.find(n => n.entityId === itemId && n.type === 'item');
        const actorNode = nodeList.find(n => n.entityId === actor.id && n.type === 'actor');
        if (itemNode && actorNode) {
          generatedEdges.push({
            id: `edge_${actorNode.id}_${itemNode.id}`,
            source: actorNode.id,
            target: itemNode.id,
            type: 'owns',
            label: 'Owns',
            strength: 0.8
          });
        }
      });

      // Link actors to their skills
      actor.activeSkills?.forEach(skillId => {
        const skillNode = nodeList.find(n => (n.entityId === skillId || n.id === `node_skill_${skillId}`) && n.type === 'skill');
        const actorNode = nodeList.find(n => n.entityId === actor.id && n.type === 'actor');
        if (skillNode && actorNode) {
          generatedEdges.push({
            id: `edge_${actorNode.id}_${skillNode.id}`,
            source: actorNode.id,
            target: skillNode.id,
            type: 'has_skill',
            label: 'Has Skill',
            strength: 0.6
          });
        }
      });
    });

    return generatedEdges;
  };

  // Generate connections from chapters
  const generateConnectionsFromChapters = async () => {
    if (!books || (Array.isArray(books) ? books.length === 0 : Object.keys(books).length === 0)) {
      toastService.error('No books found. Please add chapters first.');
      return;
    }

    setIsGeneratingConnections(true);
    try {
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      const allChapters = [];
      booksArray.forEach(book => {
        if (book && book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach((ch, idx) => {
            allChapters.push({
              bookId: book.id,
              chapterId: ch.id || `${book.id}_${idx + 1}`,
              chapterNumber: ch.number || idx + 1,
              title: ch.title || `Chapter ${idx + 1}`,
              content: ch.script || ch.content || ''
            });
          });
        }
      });

      let currentNodes = [...nodes];
      let currentEdges = [...edges];

      for (const chapter of allChapters) {
        if (!chapter.content || chapter.content.trim().length < 50) continue;

        const existingEntities = {
          actors: actors || [],
          items: items || [],
          skills: skills || []
        };

        const { entities, relationships } = await chapterDataExtractionService.extractEntitiesFromChapter(
          chapter.content,
          chapter.chapterId,
          chapter.bookId,
          existingEntities
        );

        // Add new entities as nodes
        for (const entity of entities) {
          const nodeData = {
            entityId: entity.id,
            entityType: entity.type,
            type: entity.type,
            label: entity.name,
            group: entity.type === 'actor' ? (entity.metadata?.role || 'characters') : entity.type,
            metadata: entity.metadata,
            chapterAppearances: [{ bookId: chapter.bookId, chapterId: chapter.chapterId, chapterNumber: chapter.chapterNumber }]
          };
          const savedNode = await dataConsistencyService.addMindMapNodeSafe(nodeData);
          if (!currentNodes.find(n => n.id === savedNode.id)) {
            currentNodes.push(savedNode);
          }
        }

        // Add new relationships as edges
        for (const rel of relationships) {
          const sourceNode = currentNodes.find(n => n.id === rel.source || n.entityId === rel.source);
          const targetNode = currentNodes.find(n => n.id === rel.target || n.entityId === rel.target);
          
          if (sourceNode && targetNode) {
            const edgeData = {
              source: sourceNode.id,
              target: targetNode.id,
              label: rel.type,
              type: rel.type,
              strength: rel.strength || 0.5,
              chapterContext: [{ bookId: chapter.bookId, chapterId: chapter.chapterId, chapterNumber: chapter.chapterNumber }]
            };
            const savedEdge = await dataConsistencyService.addMindMapEdgeSafe(edgeData);
            if (!currentEdges.find(e => e.id === savedEdge.id)) {
              currentEdges.push(savedEdge);
            }
          }
        }
      }

      setNodes(currentNodes);
      setEdges(currentEdges);
      await loadGraphData(); // Reload to get updated data
      toastService.success(`Generated connections from ${allChapters.length} chapters.`);
    } catch (error) {
      console.error('Error generating connections:', error);
      toastService.error('Error generating connections: ' + error.message);
    } finally {
      setIsGeneratingConnections(false);
    }
  };

  // Apply different layout modes
  const applyLayout = useCallback((mode) => {
    // If switching to planetary, don't modify nodes - let planetary system handle it
    if (mode === 'planetary') {
      setLayoutMode('planetary');
      generatePlanetarySystem();
      return;
    }
    
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      switch (mode) {
        case 'radial': {
          // Group by type
          const groups = {};
          newNodes.forEach(node => {
            const group = node.group || 'other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(node);
          });
          
          const groupKeys = Object.keys(groups);
          const angleStep = (Math.PI * 2) / groupKeys.length;
          
          groupKeys.forEach((group, groupIdx) => {
            const groupAngle = angleStep * groupIdx - Math.PI / 2;
            const groupRadius = 200;
            const groupCenterX = centerX + Math.cos(groupAngle) * groupRadius * 0.5;
            const groupCenterY = centerY + Math.sin(groupAngle) * groupRadius * 0.5;
            
            groups[group].forEach((node, nodeIdx) => {
              const nodeAngle = groupAngle + (nodeIdx / groups[group].length - 0.5) * 0.8;
              const nodeRadius = 150 + (nodeIdx % 2) * 50;
              node.x = groupCenterX + Math.cos(nodeAngle) * nodeRadius;
              node.y = groupCenterY + Math.sin(nodeAngle) * nodeRadius;
              node.vx = 0;
              node.vy = 0;
            });
          });
          break;
        }
        
        case 'hierarchical': {
          // Sort by group priority
          const groupOrder = ['protagonists', 'antagonists', 'npcs', 'characters', 'items', 'skills', 'locations', 'events', 'other'];
          const sortedNodes = [...newNodes].sort((a, b) => {
            return groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
          });
          
          // Calculate layers
          const layers = {};
          sortedNodes.forEach(node => {
            const layer = groupOrder.indexOf(node.group);
            if (!layers[layer]) layers[layer] = [];
            layers[layer].push(node);
          });
          
          const layerCount = Object.keys(layers).length;
          const layerHeight = height / (layerCount + 1);
          
          Object.entries(layers).forEach(([layer, layerNodes]) => {
            const y = parseInt(layer) * layerHeight + layerHeight / 2 + 50;
            layerNodes.forEach((node, idx) => {
              const xStep = width / (layerNodes.length + 1);
              node.x = (idx + 1) * xStep;
              node.y = y;
              node.vx = 0;
              node.vy = 0;
            });
          });
          break;
        }
        
        case 'grid': {
          const cols = Math.ceil(Math.sqrt(newNodes.length));
          const cellWidth = width / (cols + 1);
          const cellHeight = height / (Math.ceil(newNodes.length / cols) + 1);
          
          newNodes.forEach((node, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            node.x = (col + 1) * cellWidth;
            node.y = (row + 1) * cellHeight;
            node.vx = 0;
            node.vy = 0;
          });
          break;
        }
        
        case 'planetary':
          // Planetary layout handled separately
          generatePlanetarySystem();
          break;
          
        case 'force':
        default:
          // Reset velocities for force-directed
          newNodes.forEach(node => {
            node.vx = (Math.random() - 0.5) * 5;
            node.vy = (Math.random() - 0.5) * 5;
          });
          break;
      }
      
      return newNodes;
    });
    
    setLayoutMode(mode);
    if (mode !== 'force' && mode !== 'planetary') {
      setIsSimulating(false);
    }
    if (mode !== 'planetary') {
      toastService.info(`Applied ${mode} layout`);
    }
  }, [generatePlanetarySystem]);

  // Simple force simulation
  const runSimulation = useCallback(() => {
    const simulate = () => {
      if (!isSimulating) return;

      setNodes(prevNodes => {
        const newNodes = [...prevNodes];
        const width = 800;
        const height = 600;
        const centerX = width / 2;
        const centerY = height / 2;

        // Apply forces
        newNodes.forEach((node, i) => {
          if (draggedNode?.id === node.id) return;

          // Center gravity
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;

          // Repulsion from other nodes
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const ddx = node.x - other.x;
            const ddy = node.y - other.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
            const minDist = (node.size + other.size) * 2;
            
            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.5;
              node.vx += ddx * force;
              node.vy += ddy * force;
            }
          });

          // Attraction along edges
          edges.forEach(edge => {
            if (edge.source === node.id) {
              const target = newNodes.find(n => n.id === edge.target);
              if (target) {
                const ddx = target.x - node.x;
                const ddy = target.y - node.y;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
                const force = (dist - 100) * 0.01 * (edge.strength || 0.5);
                node.vx += ddx / dist * force;
                node.vy += ddy / dist * force;
              }
            } else if (edge.target === node.id) {
              const source = newNodes.find(n => n.id === edge.source);
              if (source) {
                const ddx = source.x - node.x;
                const ddy = source.y - node.y;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
                const force = (dist - 100) * 0.01 * (edge.strength || 0.5);
                node.vx += ddx / dist * force;
                node.vy += ddy / dist * force;
              }
            }
          });

          // Apply velocity with damping
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;

          // Boundary constraints
          node.x = Math.max(50, Math.min(width - 50, node.x));
          node.y = Math.max(50, Math.min(height - 50, node.y));
        });

        return newNodes;
      });

      frameRef.current = requestAnimationFrame(simulate);
    };

    frameRef.current = requestAnimationFrame(simulate);
  }, [edges, isSimulating, draggedNode]);

  // Interaction handlers
  const handleMouseDown = (e, node = null) => {
    if (node) {
      setDraggedNode(node);
      setDragStart({ x: e.clientX - node.x * transform.scale, y: e.clientY - node.y * transform.scale });
    } else if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (draggedNode) {
      const newX = (e.clientX - dragStart.x) / transform.scale;
      const newY = (e.clientY - dragStart.y) / transform.scale;
      setNodes(prev => prev.map(n => 
        n.id === draggedNode.id ? { ...n, x: newX, y: newY, vx: 0, vy: 0 } : n
      ));
    } else if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(3, Math.max(0.3, prev.scale * scaleDelta))
    }));
  };

  // Filter nodes
  // In planetary mode, filter planetary nodes by search query
  const filteredPlanetaryNodes = layoutMode === 'planetary' 
    ? (searchQuery 
        ? planetaryNodes.filter(node => 
            node.actorName?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : planetaryNodes)
    : [];
  
  const filteredNodes = layoutMode === 'planetary' ? [] : nodes.filter(node => {
    const groupVisible = visibleGroups[node.group] !== false;
    const matchesSearch = !searchQuery || 
      node.label.toLowerCase().includes(searchQuery.toLowerCase());
    return groupVisible && matchesSearch;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = layoutMode === 'planetary' ? [] : edges.filter(e => 
    filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Get connected nodes for highlighting
  const getConnectedNodes = (nodeId) => {
    const connected = new Set([nodeId]);
    edges.forEach(e => {
      if (e.source === nodeId) connected.add(e.target);
      if (e.target === nodeId) connected.add(e.source);
    });
    return connected;
  };

  const highlightedNodes = hoveredNode ? getConnectedNodes(hoveredNode.id) : new Set();

  // Render node shape
  const renderNodeShape = (node, isHighlighted, isSelected, isFaded) => {
    const config = nodeConfig[node.type] || nodeConfig.actor;
    const color = groupColors[node.group] || config.color;
    const size = node.size || 15;
    const opacity = isFaded ? 0.3 : 1;
    const baseProps = {
      fill: isSelected ? '#fff' : color,
      stroke: isHighlighted ? '#fff' : color,
      strokeWidth: isHighlighted ? 3 : 2,
      opacity,
      style: { 
        cursor: 'pointer',
        transition: 'all 0.2s'
      }
    };

    switch (config.shape) {
      case 'rect':
        return (
          <rect
            x={-size}
            y={-size}
            width={size * 2}
            height={size * 2}
            rx={4}
            {...baseProps}
          />
        );
      case 'diamond':
        return (
          <polygon
            points={`0,${-size} ${size},0 0,${size} ${-size},0`}
            {...baseProps}
          />
        );
      case 'hexagon':
        const h = size * 0.866;
        return (
          <polygon
            points={`${-size/2},${-h} ${size/2},${-h} ${size},0 ${size/2},${h} ${-size/2},${h} ${-size},0`}
            {...baseProps}
          />
        );
      default:
        return (
          <circle
            r={size}
            {...baseProps}
          />
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-purple-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitBranch className="text-purple-500" />
            STORY MIND MAP
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {layoutMode === 'planetary' 
              ? `${planetaryNodes.length} planets • ${planetaryNodes.reduce((sum, p) => sum + (p.chapterRings?.length || 0), 0)} chapter rings`
              : layoutMode === 'planetary'
                ? `${filteredPlanetaryNodes.length} planets • ${planetaryNodes.reduce((sum, p) => sum + (p.chapterRings?.length || 0), 0)} chapter rings`
                : `${filteredNodes.length} nodes • ${filteredEdges.length} connections`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout Options */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
            <Layout className="w-4 h-4 text-slate-500" />
            <button
              onClick={() => { setIsSimulating(true); applyLayout('force'); }}
              className={`p-1.5 rounded text-xs ${layoutMode === 'force' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              title="Force-directed layout"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyLayout('radial')}
              className={`p-1.5 rounded text-xs ${layoutMode === 'radial' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              title="Radial layout"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyLayout('hierarchical')}
              className={`p-1.5 rounded text-xs ${layoutMode === 'hierarchical' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              title="Hierarchical layout"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyLayout('grid')}
              className={`p-1.5 rounded text-xs ${layoutMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              title="Grid layout"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyLayout('planetary')}
              className={`p-1.5 rounded text-xs ${layoutMode === 'planetary' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              title="Planetary layout"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* Simulation Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-2 rounded text-sm ${
              isSimulating ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            disabled={layoutMode !== 'force'}
          >
            <RefreshCw className={`w-4 h-4 inline mr-1 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating' : 'Paused'}
          </button>

          {/* View Options */}
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`p-2 rounded ${showMiniMap ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            title="Toggle mini-map"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowEdgeStrength(!showEdgeStrength)}
            className={`p-2 rounded ${showEdgeStrength ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            title="Show edge strength"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <button
            onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale / 1.2) }))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded"
          >
            Reset
          </button>
          <button
            onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            onClick={generateConnectionsFromChapters}
            disabled={isGeneratingConnections}
            className="ml-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg flex items-center gap-2"
            title="Auto-generate connections from chapter co-occurrences"
          >
            <Sparkles className="w-4 h-4" />
            {isGeneratingConnections ? 'Generating...' : 'Auto-Generate'}
          </button>
          
          {/* Extract Relationships Button */}
          <button
            onClick={extractRelationshipsFromChapters}
            disabled={isExtractingRelationships || isGeneratingConnections}
            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            title="Extract relationships from all chapters"
          >
            <Heart className={`w-4 h-4 ${isExtractingRelationships ? 'animate-pulse' : ''}`} />
            {isExtractingRelationships ? 'Extracting...' : 'Extract Relationships'}
          </button>
          
          {/* Populate Entities Button */}
          <button
            onClick={async () => {
              setIsPopulatingEntities(true);
              try {
                // Regenerate planetary system to populate entities
                await generatePlanetarySystem();
                toastService.success('Entities populated from chapters');
              } catch (error) {
                console.error('Error populating entities:', error);
                toastService.error('Error populating entities: ' + error.message);
              } finally {
                setIsPopulatingEntities(false);
              }
            }}
            disabled={isPopulatingEntities || layoutMode !== 'planetary'}
            className="ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            title="Extract and populate entities in chapter rings"
          >
            <Sparkles className={`w-4 h-4 ${isPopulatingEntities ? 'animate-pulse' : ''}`} />
            {isPopulatingEntities ? 'Populating...' : 'Populate Entities'}
          </button>
          
          {/* Regenerate Button */}
          <button
            onClick={async () => {
              try {
                // Clear saved state
                const oldStates = await db.getAll('mindMapState');
                for (const old of oldStates) {
                  await db.delete('mindMapState', old.id);
                }
                setLastGenerated(null);
                // Regenerate
                await generatePlanetarySystem();
                toastService.success('Mind map regenerated');
              } catch (error) {
                console.error('Error regenerating mind map:', error);
                toastService.error('Error regenerating: ' + error.message);
              }
            }}
            disabled={layoutMode !== 'planetary'}
            className="ml-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            title="Regenerate mind map (clears saved positions)"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>

          {onClose && (
            <button onClick={onClose} className="ml-2 text-slate-500 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>


      {/* Filters Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-3 py-1.5 rounded w-48 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Group Toggles */}
        <div className="flex gap-1 flex-wrap">
          {Object.entries(visibleGroups).map(([group, visible]) => (
            <button
              key={group}
              onClick={() => setVisibleGroups(prev => ({ ...prev, [group]: !visible }))}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                visible
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
              style={{ backgroundColor: visible ? groupColors[group] + '40' : undefined }}
            >
              {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Graph Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {loading && layoutMode !== 'planetary' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <GitBranch className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-3" />
                <p className="text-slate-400">Loading mind map...</p>
              </div>
            </div>
          ) : layoutMode === 'planetary' ? (
            // Planetary view takes absolute priority - never fall through to old graph
            renderPlanetaryView()
          ) : filteredNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No nodes to display</p>
                <p className="text-slate-500 text-sm mt-1">
                  Extract entities from your manuscript to populate the mind map
                </p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full"
              viewBox="0 0 800 600"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: 'center'
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  viewBox="0 -5 10 10"
                  refX="20"
                  refY="0"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,-5L10,0L0,5" fill="#64748b" />
                </marker>
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Edges */}
              <g>
                {filteredEdges.map(edge => {
                  const sourceNode = filteredNodes.find(n => n.id === edge.source);
                  const targetNode = filteredNodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const isHighlighted = highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);
                  const isFaded = hoveredNode && !isHighlighted;
                  const strength = edge.strength || 0.5;
                  
                  // Color based on strength
                  const getEdgeColor = (str) => {
                    if (!showEdgeStrength) return '#475569';
                    if (str >= 0.8) return '#22c55e'; // strong - green
                    if (str >= 0.5) return '#eab308'; // medium - yellow
                    if (str >= 0.3) return '#f97316'; // weak - orange
                    return '#ef4444'; // very weak - red
                  };

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isHighlighted ? '#fff' : getEdgeColor(strength)}
                        strokeWidth={isHighlighted ? 3 : showEdgeStrength ? 1 + strength * 2 : 1}
                        opacity={isFaded ? 0.2 : 0.6}
                        markerEnd="url(#arrowhead)"
                      />
                      {/* Edge label */}
                      {edge.label && isHighlighted && (
                        <text
                          x={(sourceNode.x + targetNode.x) / 2}
                          y={(sourceNode.y + targetNode.y) / 2 - 5}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="10"
                        >
                          {edge.label}
                        </text>
                      )}
                      {/* Strength indicator */}
                      {showEdgeStrength && !isFaded && (
                        <text
                          x={(sourceNode.x + targetNode.x) / 2}
                          y={(sourceNode.y + targetNode.y) / 2 + (edge.label && isHighlighted ? 10 : 0)}
                          textAnchor="middle"
                          fill={getEdgeColor(strength)}
                          fontSize="8"
                          opacity={0.8}
                        >
                          {(strength * 100).toFixed(0)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Nodes */}
              <g>
                {filteredNodes.map(node => {
                  const isHighlighted = highlightedNodes.has(node.id);
                  const isSelected = selectedNode?.id === node.id;
                  const isFaded = hoveredNode && !isHighlighted && hoveredNode.id !== node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, node);
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(selectedNode?.id === node.id ? null : node);
                      }}
                      style={{ cursor: 'pointer' }}
                      filter={isHighlighted ? 'url(#nodeGlow)' : undefined}
                    >
                      {renderNodeShape(node, isHighlighted, isSelected, isFaded)}
                      
                      {/* Node Label */}
                      <text
                        y={node.size + 15}
                        textAnchor="middle"
                        fill={isFaded ? '#475569' : '#e2e8f0'}
                        fontSize="11"
                        fontWeight={isHighlighted ? 'bold' : 'normal'}
                      >
                        {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Node Detail Panel */}
        {selectedNode && (
          <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {React.createElement(nodeConfig[selectedNode.type]?.icon || Users, {
                  className: `w-5 h-5`,
                  style: { color: groupColors[selectedNode.group] }
                })}
                <h3 className="font-bold text-white">{selectedNode.label}</h3>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Type & Group */}
              <div className="flex gap-2">
                <span 
                  className="px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: groupColors[selectedNode.group] + '30', color: groupColors[selectedNode.group] }}
                >
                  {selectedNode.type}
                </span>
                <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">
                  {selectedNode.group}
                </span>
              </div>

              {/* Metadata based on type */}
              {selectedNode.type === 'actor' && selectedNode.metadata && (
                <>
                  {selectedNode.metadata.class && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">CLASS</div>
                      <div className="text-sm text-white">{selectedNode.metadata.class}</div>
                    </div>
                  )}
                  {selectedNode.metadata.role && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ROLE</div>
                      <div className="text-sm text-white">{selectedNode.metadata.role}</div>
                    </div>
                  )}
                  {selectedNode.metadata.baseStats && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">STATS</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedNode.metadata.baseStats).map(([stat, val]) => (
                          <span key={stat} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">
                            {stat}: {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'item' && selectedNode.metadata && (
                <>
                  {selectedNode.metadata.type && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">TYPE</div>
                      <div className="text-sm text-white">{selectedNode.metadata.type}</div>
                    </div>
                  )}
                  {selectedNode.metadata.rarity && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">RARITY</div>
                      <div className="text-sm text-white">{selectedNode.metadata.rarity}</div>
                    </div>
                  )}
                  {selectedNode.metadata.statMod && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">STAT MODIFIERS</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedNode.metadata.statMod).map(([stat, val]) => (
                          <span key={stat} className={`text-xs px-2 py-1 rounded ${
                            val >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                            {stat}: {val >= 0 ? '+' : ''}{val}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'skill' && selectedNode.metadata && (
                <>
                  {selectedNode.metadata.type && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">TYPE</div>
                      <div className="text-sm text-white">{selectedNode.metadata.type}</div>
                    </div>
                  )}
                  {selectedNode.metadata.tier && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">TIER</div>
                      <div className="text-sm text-white">{selectedNode.metadata.tier}</div>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              {selectedNode.metadata?.desc && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">DESCRIPTION</div>
                  <p className="text-sm text-slate-300">{selectedNode.metadata.desc}</p>
                </div>
              )}

              {/* Chapter Appearances */}
              {selectedNode.chapterAppearances && selectedNode.chapterAppearances.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">CHAPTER APPEARANCES</div>
                  <div className="space-y-1">
                    {selectedNode.chapterAppearances.map((chap, idx) => (
                      <button
                        key={idx}
                        onClick={() => chapterNavigationService.navigateToChapter(chap.bookId, chap.chapterId)}
                        className="w-full flex items-center justify-between text-xs bg-slate-950 p-2 rounded hover:bg-slate-800 text-left"
                      >
                        <span className="text-slate-300">Chapter {chap.chapterNumber}</span>
                        <ChevronRight className="w-3 h-3 text-emerald-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships (for actor nodes) */}
              {selectedNode.type === 'actor' && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">RELATIONSHIPS</div>
                  <div className="space-y-1">
                    {edges
                      .filter(e => 
                        (e.source === selectedNode.id || e.target === selectedNode.id) &&
                        e.type === 'relationship'
                      )
                      .map(edge => {
                        const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                        const otherNode = nodes.find(n => n.id === otherId);
                        if (!otherNode) return null;
                        
                        const relData = edge.relationshipData;
                        const strength = relData?.strength || 50;
                        const relType = relData?.type || edge.label || 'relationship';
                        
                        return (
                          <div 
                            key={edge.id}
                            className="bg-slate-950 p-2 rounded cursor-pointer hover:bg-slate-800"
                            onClick={() => setSelectedNode(otherNode)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-white font-semibold">{otherNode.label}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {relType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${Math.abs(strength)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{strength}</span>
                            </div>
                            {edge.chapterContext && edge.chapterContext.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {edge.chapterContext.slice(0, 3).map((ctx, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const bookId = ctx.bookId || relData?.bookId;
                                      const chapterId = ctx.chapterId || relData?.chapterId;
                                      if (bookId && chapterId) {
                                        chapterNavigationService.navigateToChapter(bookId, chapterId);
                                      }
                                    }}
                                    className="text-xs px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded"
                                  >
                                    Ch {ctx.chapterNumber || ctx.chapterId}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {edges.filter(e => 
                      (e.source === selectedNode.id || e.target === selectedNode.id) &&
                      e.type === 'relationship'
                    ).length === 0 && (
                      <p className="text-xs text-slate-500">No relationships tracked</p>
                    )}
                  </div>
                </div>
              )}

              {/* Connected Nodes */}
              <div>
                <div className="text-xs text-slate-500 mb-2">CONNECTIONS</div>
                <div className="space-y-1">
                  {edges
                    .filter(e => 
                      (e.source === selectedNode.id || e.target === selectedNode.id) &&
                      e.type !== 'relationship'
                    )
                    .map(edge => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const otherNode = nodes.find(n => n.id === otherId);
                      if (!otherNode) return null;
                      
                      return (
                        <div 
                          key={edge.id}
                          className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded cursor-pointer hover:bg-slate-800"
                          onClick={() => setSelectedNode(otherNode)}
                        >
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">{edge.label || edge.type}</span>
                          <span className="text-white ml-auto">{otherNode.label}</span>
                        </div>
                      );
                    })}
                  {edges.filter(e => 
                    (e.source === selectedNode.id || e.target === selectedNode.id) &&
                    e.type !== 'relationship'
                  ).length === 0 && (
                    <div className="text-xs text-slate-500 text-center py-2">No connections</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini-map */}
      {showMiniMap && filteredNodes.length > 0 && (
        <div className="absolute bottom-20 right-4 w-40 h-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="text-[10px] text-slate-500 px-2 py-1 bg-slate-950 border-b border-slate-700">
            MINI MAP
          </div>
          <svg viewBox="0 0 800 600" className="w-full h-full">
            {/* Background */}
            <rect x="0" y="0" width="800" height="600" fill="#0f172a" />
            
            {/* Edges in mini-map */}
            {filteredEdges.map(edge => {
              const sourceNode = filteredNodes.find(n => n.id === edge.source);
              const targetNode = filteredNodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;
              return (
                <line
                  key={`mini-${edge.id}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            })}
            
            {/* Nodes in mini-map */}
            {filteredNodes.map(node => (
              <circle
                key={`mini-${node.id}`}
                cx={node.x}
                cy={node.y}
                r={4}
                fill={groupColors[node.group] || '#64748b'}
              />
            ))}
            
            {/* Viewport indicator */}
            <rect
              x={400 - 200 / transform.scale - transform.x / transform.scale}
              y={300 - 150 / transform.scale - transform.y / transform.scale}
              width={400 / transform.scale}
              height={300 / transform.scale}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          </svg>
        </div>
      )}

      {/* Legend */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap gap-4 justify-center">
        {Object.entries(nodeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <div 
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-slate-400 capitalize">{type}</span>
          </div>
        ))}
        {/* Edge strength legend */}
        {showEdgeStrength && (
          <div className="flex items-center gap-2 text-xs border-l border-slate-700 pl-4">
            <span className="text-slate-500">Edge Strength:</span>
            <span className="text-green-400">Strong</span>
            <span className="text-yellow-400">Medium</span>
            <span className="text-red-400">Weak</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryMindMap;
