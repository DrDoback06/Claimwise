import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Zap, Users, Swords, Shield, Sparkles, Brain, Heart, 
  Star, Lock, Unlock, ChevronRight, ChevronDown, X, 
  Eye, Grid, Compass, ZoomIn, ZoomOut, Home, Plus, Minus,
  Award, TrendingUp, GitBranch, Save, RotateCcw, Clock, Check
} from 'lucide-react';
import db from '../services/database';
import chapterNavigationService from '../services/chapterNavigationService';

/**
 * SkillTreeSystem - Full RPG skill tree with branching paths and constellation view
 * Features: skill points, prerequisites, tiers, character-specific trees
 */
const SkillTreeSystem = ({ 
  skills = [], 
  actors = [], 
  onClose,
  onUpdateSkills 
}) => {
  // View state
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'constellation'
  const [selectedActor, setSelectedActor] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredSkill, setHoveredSkill] = useState(null);
  
  // Tree data
  const [skillNodes, setSkillNodes] = useState([]);
  const [skillConnections, setSkillConnections] = useState([]);
  const [actorSkillPoints, setActorSkillPoints] = useState({});
  const [actorUnlockedSkills, setActorUnlockedSkills] = useState({});
  const [books, setBooks] = useState([]);
  const [skillChapterData, setSkillChapterData] = useState({});
  
  // Drag state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedSkillId, setDraggedSkillId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isDraggingSkill, setIsDraggingSkill] = useState(false);
  const [skillPositions, setSkillPositions] = useState({}); // Saved positions per actor
  
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  // Load saved skill positions for selected actor
  const loadSkillPositions = useCallback(async () => {
    if (!selectedActor) {
      setSkillPositions({});
      return;
    }
    
    try {
      const layouts = await db.getAll('skillTreeLayouts');
      const actorLayout = layouts.find(l => l.actorId === selectedActor.id);
      if (actorLayout && actorLayout.skillPositions) {
        const positionMap = {};
        actorLayout.skillPositions.forEach(pos => {
          positionMap[pos.skillId] = pos;
        });
        setSkillPositions(positionMap);
      } else {
        setSkillPositions({});
      }
    } catch (error) {
      console.error('Error loading skill positions:', error);
      setSkillPositions({});
    }
  }, [selectedActor]);

  // Save skill positions for selected actor
  const saveSkillPositions = useCallback(async (positions) => {
    if (!selectedActor) return;
    
    try {
      const layouts = await db.getAll('skillTreeLayouts');
      const existing = layouts.find(l => l.actorId === selectedActor.id);
      
      const layout = {
        id: existing?.id || `skilltree_${selectedActor.id}_${Date.now()}`,
        actorId: selectedActor.id,
        skillPositions: Object.entries(positions).map(([skillId, pos]) => ({
          skillId,
          chapterId: pos.chapterId,
          chapterKey: pos.chapterKey,
          angle: pos.angle,
          ringIndex: pos.ringIndex
        })),
        updatedAt: Date.now()
      };
      
      if (existing) {
        await db.update('skillTreeLayouts', layout);
      } else {
        await db.add('skillTreeLayouts', layout);
      }
    } catch (error) {
      console.error('Error saving skill positions:', error);
    }
  }, [selectedActor]);

  // Handle skill dragging
  useEffect(() => {
    if (!isDraggingSkill || !draggedSkillId) return;

    const handleMouseMove = (e) => {
      const skill = skillNodes.find(s => s.id === draggedSkillId);
      if (!skill || !skill.chapterRing) return;

      const centerX = 500;
      const centerY = 400;
      const ringRadius = skill.ringRadius || skill.chapterRing.radius;

      // Get mouse position relative to SVG
      const svg = svgRef.current;
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - transform.x) / transform.scale;
      const svgY = (e.clientY - rect.top - transform.y) / transform.scale;

      // Calculate angle and constrain to ring radius
      const dx = svgX - centerX;
      const dy = svgY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Constrain to ring radius
      const constrainedX = centerX + Math.cos(angle) * ringRadius;
      const constrainedY = centerY + Math.sin(angle) * ringRadius;

      // Check for collisions with other skills on same ring
      const minSpacing = 20;
      let finalX = constrainedX;
      let finalY = constrainedY;
      let finalAngle = angle;

      const otherSkills = skillNodes.filter(s => 
        s.id !== skill.id && 
        s.chapterKey === skill.chapterKey &&
        s.chapterRing
      );

      let collision = false;
      for (const other of otherSkills) {
        const dx2 = finalX - other.x;
        const dy2 = finalY - other.y;
        const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist < minSpacing) {
          collision = true;
          // Snap to nearest free position
          const angleStep = (Math.PI * 2) / 32;
          for (let i = 0; i < 32; i++) {
            const testAngle = angle + (i % 2 === 0 ? 1 : -1) * Math.floor((i + 1) / 2) * angleStep;
            const testX = centerX + Math.cos(testAngle) * ringRadius;
            const testY = centerY + Math.sin(testAngle) * ringRadius;
            
            const tooClose = otherSkills.some(os => {
              const ddx = testX - os.x;
              const ddy = testY - os.y;
              return Math.sqrt(ddx * ddx + ddy * ddy) < minSpacing;
            });
            
            if (!tooClose) {
              finalX = testX;
              finalY = testY;
              finalAngle = testAngle;
              collision = false;
              break;
            }
          }
          break;
        }
      }

      // Update skill position
      setSkillNodes(prev => prev.map(s => 
        s.id === skill.id 
          ? { ...s, x: finalX, y: finalY, angle: finalAngle }
          : s
      ));
    };

    const handleMouseUp = async () => {
      if (draggedSkillId) {
        const skill = skillNodes.find(s => s.id === draggedSkillId);
        if (skill && skill.chapterRing) {
          // Save position
          const newPositions = { ...skillPositions };
          newPositions[skill.id] = {
            chapterId: skill.chapterRing.chapterId,
            chapterKey: skill.chapterKey,
            angle: skill.angle || Math.atan2(skill.y - 400, skill.x - 500),
            ringIndex: skill.chapterRing.chapterNumber || 0
          };
          setSkillPositions(newPositions);
          await saveSkillPositions(newPositions);
        }
      }
      
      setIsDraggingSkill(false);
      setDraggedSkillId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSkill, draggedSkillId, skillNodes, skillPositions, saveSkillPositions, transform]);

  // Skill branches/categories
  const skillBranches = {
    combat: { 
      name: 'Combat', 
      icon: Swords, 
      color: '#ef4444', 
      glow: '#fca5a5',
      description: 'Physical attacks and weapon mastery'
    },
    magic: { 
      name: 'Magic', 
      icon: Sparkles, 
      color: '#8b5cf6', 
      glow: '#c4b5fd',
      description: 'Arcane arts and spell casting'
    },
    utility: { 
      name: 'Utility', 
      icon: Brain, 
      color: '#06b6d4', 
      glow: '#67e8f9',
      description: 'Survival, crafting, and support'
    },
    social: { 
      name: 'Social', 
      icon: Heart, 
      color: '#ec4899', 
      glow: '#f9a8d4',
      description: 'Charisma, persuasion, and influence'
    },
    defense: {
      name: 'Defense',
      icon: Shield,
      color: '#22c55e',
      glow: '#86efac',
      description: 'Protection and resilience'
    }
  };

  // Skill tiers
  const skillTiers = {
    novice: { level: 1, name: 'Novice', pointCost: 1, radius: 16 }, // Smaller nodes
    adept: { level: 2, name: 'Adept', pointCost: 2, radius: 20 },
    expert: { level: 3, name: 'Expert', pointCost: 3, radius: 24 },
    master: { level: 4, name: 'Master', pointCost: 5, radius: 28 },
    legendary: { level: 5, name: 'Legendary', pointCost: 8, radius: 32 }
  };

  useEffect(() => {
    buildSkillTree();
    loadActorProgress();
    loadBooks();
    loadSkillPositions();
  }, [skills, actors, selectedActor, loadSkillPositions]);

  useEffect(() => {
    if (books.length > 0) {
      loadSkillChapterData();
    }
  }, [books, actors]);

  const loadBooks = async () => {
    try {
      const allBooks = await db.getAll('books');
      setBooks(allBooks || []);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadSkillChapterData = async () => {
    try {
      // Load skill progression data from timelineEvents table
      const data = {};
      
      // Get all timeline events of type 'skill_event'
      const allEvents = await db.getAll('timelineEvents');
      const skillEvents = allEvents.filter(event => event.type === 'skill_event');
      
      // Get all books for chapter info
      const allBooks = books.length > 0 ? books : await db.getAll('books');
      const bookMap = new Map();
      allBooks.forEach(book => {
        if (book.chapters) {
          book.chapters.forEach(chapter => {
            bookMap.set(chapter.id, { book, chapter });
          });
        }
      });
      
      // Process skill events
      for (const event of skillEvents) {
        if (!event.actorIds || event.actorIds.length === 0) continue;
        if (!event.title && !event.description) continue;
        
        // Extract skill name from event title or description
        const skillNameMatch = (event.title || event.description || '').match(/(?:learned|gained|mastered|improved|acquired)\s+(.+?)(?:\s+skill)?/i);
        if (!skillNameMatch) continue;
        
        const skillName = skillNameMatch[1].trim();
        
        // Find skill by name
        const skill = skills.find(s => 
          s.name?.toLowerCase() === skillName.toLowerCase()
        );
        
        if (!skill) continue;
        
        const skillId = skill.id;
        const chapterInfo = bookMap.get(event.chapterId);
        if (!chapterInfo) continue;
        
        // Determine skill level from event description
        let skillLevel = 1;
        const desc = (event.description || event.title || '').toLowerCase();
        if (desc.includes('mastered') || desc.includes('perfected')) {
          skillLevel = 5;
        } else if (desc.includes('improved') || desc.includes('better')) {
          skillLevel = 2;
        } else if (desc.includes('learned') || desc.includes('gained')) {
          skillLevel = 1;
        }
        
        // Process for each actor in the event
        for (const actorId of event.actorIds) {
          const actor = actors.find(a => a.id === actorId);
          if (!actor) continue;
          
          // Create actor-specific skill data key
          const skillKey = `${actorId}_${skillId}`;
          
          if (!data[skillKey]) {
            data[skillKey] = { 
              actorId,
              skillId,
              chapters: [], 
              firstGained: null,
              upgrades: []
            };
          }
          
          const existingChapter = data[skillKey].chapters.find(c => c.chapterId === event.chapterId);
          if (!existingChapter) {
            const chapterData = {
              chapterId: event.chapterId,
              bookId: event.bookId,
              chapterNumber: chapterInfo.chapter.number,
              chapterTitle: chapterInfo.chapter.title,
              level: skillLevel
            };
            
            data[skillKey].chapters.push(chapterData);
            
            // Track first gained chapter
            if (!data[skillKey].firstGained) {
              data[skillKey].firstGained = { 
                chapterId: event.chapterId, 
                bookId: event.bookId,
                level: skillLevel
              };
            } else {
              // Check if this is an upgrade
              if (skillLevel > (data[skillKey].firstGained.level || 1)) {
                data[skillKey].upgrades.push({
                  chapterId: event.chapterId,
                  bookId: event.bookId,
                  chapterNumber: chapterInfo.chapter.number,
                  chapterTitle: chapterInfo.chapter.title,
                  level: skillLevel,
                  previousLevel: data[skillKey].chapters[data[skillKey].chapters.length - 2]?.level || 1
                });
              }
            }
          } else {
            // Update level if it changed
            if (skillLevel > existingChapter.level) {
              existingChapter.level = skillLevel;
              if (!data[skillKey].upgrades.find(u => u.chapterId === event.chapterId)) {
                data[skillKey].upgrades.push({
                  chapterId: event.chapterId,
                  bookId: event.bookId,
                  chapterNumber: chapterInfo.chapter.number,
                  chapterTitle: chapterInfo.chapter.title,
                  level: skillLevel,
                  previousLevel: existingChapter.level
                });
              }
            }
          }
        }
      }
      
      setSkillChapterData(data);
    } catch (error) {
      console.error('Error loading skill chapter data:', error);
    }
  };

  // Set up wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * scaleChange, 0.3), 2)
      }));
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  const buildSkillTree = () => {
    if (!skills || skills.length === 0) {
      // Generate sample skill tree structure
      generateDefaultSkillTree();
      return;
    }

    // If no actor is selected, show empty tree or all skills
    if (!selectedActor) {
      setSkillNodes([]);
      setSkillConnections([]);
      return;
    }

    // If an actor is selected, filter to only show skills they have or can unlock
    let skillsToShow = skills;
    if (selectedActor) {
      const actorSkills = selectedActor.activeSkills || [];
      const actorSkillIds = actorSkills.map(s => typeof s === 'string' ? s : (s.id || s));
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SkillTreeSystem.jsx:411',message:'buildSkillTree using current state',data:{selectedActorId:selectedActor.id,currentSkillsCount:actorSkills.length,currentSkills:actorSkillIds,hasSnapshots:!!selectedActor.snapshots,snapshotKeys:Object.keys(selectedActor.snapshots||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // Get all skills the actor has, plus prerequisites and skills that can be unlocked
      const skillsToInclude = new Set(actorSkillIds);
      
      // Add prerequisites of unlocked skills
      actorSkillIds.forEach(skillId => {
        const skill = skills.find(s => s.id === skillId);
        if (skill && skill.prerequisites && Array.isArray(skill.prerequisites)) {
          skill.prerequisites.forEach(prereqId => skillsToInclude.add(prereqId));
        }
      });
      
      // Add skills that can be unlocked (have all prerequisites met)
      skills.forEach(skill => {
        if (!skillsToInclude.has(skill.id)) {
          const prereqs = Array.isArray(skill.prerequisites) ? skill.prerequisites : [];
          const hasAllPrereqs = prereqs.length === 0 || 
            prereqs.every(prereqId => skillsToInclude.has(prereqId));
          if (hasAllPrereqs) {
            skillsToInclude.add(skill.id);
          }
        }
      });
      
      // Filter to show skills from timelineEvents (chapter-based progression)
      // Skills are pulled from timelineEvents table, aggregated by chapter
      skillsToShow = skills.filter(skill => skillsToInclude.has(skill.id));
      
      // If actor has no skills, show all skills (they can unlock any)
      if (skillsToShow.length === 0) {
        skillsToShow = skills;
      }
    }

    // Build nodes from filtered skills
    const nodes = skillsToShow.map((skill, idx) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description || skill.desc || '',
      branch: skill.branch || 'utility',
      tier: skill.tier || 'novice',
      prerequisites: skill.prerequisites || [],
      effects: skill.effects || [],
      statModifiers: skill.statModifiers || skill.statMod || {},
      scaling: skill.scaling || skill.scalingType || null,
      scalingPerLevel: skill.scalingPerLevel || {},
      maxLevel: skill.maxLevel || null,
      defaultVal: skill.defaultVal || 1,
      // Position will be calculated based on branch and tier
      x: 0,
      y: 0
    }));

    // Calculate positions
    const positionedNodes = calculateTreePositions(nodes);
    setSkillNodes(positionedNodes);

    // Build connections from prerequisites and upgrades
    const connections = [];
    positionedNodes.forEach(node => {
      // Prerequisite connections - ensure prerequisites is an array
      const prereqs = Array.isArray(node.prerequisites) ? node.prerequisites : [];
      prereqs.forEach(prereqId => {
        // Only add connection if prerequisite is also in the filtered set
        if (nodes.find(n => n.id === prereqId)) {
        connections.push({
          id: `conn_${prereqId}_${node.id}`,
          from: prereqId,
            to: node.id,
            type: 'prerequisite'
          });
        }
      });
      
      // Upgrade connections (same skill, different chapters)
      if (node.upgrades && node.upgrades.length > 0) {
        node.upgrades.forEach(upgrade => {
          connections.push({
            id: `upgrade_${node.id}_${upgrade.chapterId}`,
            from: node.id,
            to: `${node.id}_upgrade_${upgrade.chapterId}`,
            type: 'upgrade',
            upgradeData: upgrade
          });
        });
      }
    });
    setSkillConnections(connections);
  };

  // Calculate chapter-based positions (concentric rings)
  const calculateTreePositions = (nodes) => {
    if (!nodes || nodes.length === 0) return [];
    if (!selectedActor) return [];
    
    const centerX = 500;
    const centerY = 400;
    const minNodeSpacing = 140; // Increased spacing
    const baseRadius = 120; // Chapter 1 ring radius - bigger
    const ringSpacing = 110; // Space between chapter rings - bigger
    
    // Get all chapters from all books to determine ring structure
    const allChapters = [];
    books.forEach(book => {
      if (book.chapters) {
        book.chapters.forEach(chapter => {
          allChapters.push({
            ...chapter,
            bookId: book.id,
            globalIndex: allChapters.length + 1
          });
        });
      }
    });
    
    // If no chapters, fall back to tier-based positioning
    if (allChapters.length === 0) {
      return calculateTierBasedPositions(nodes);
    }
    
    // Create chapter ring structure
    const chapterRings = {};
    allChapters.forEach((chapter, idx) => {
      const chapterKey = `${chapter.bookId}_${chapter.id}`;
      chapterRings[chapterKey] = {
        chapterId: chapter.id,
        bookId: chapter.bookId,
        chapterNumber: chapter.number || idx + 1,
        chapterTitle: chapter.title || `Chapter ${chapter.number || idx + 1}`,
        radius: baseRadius + (idx * ringSpacing),
        skills: []
      };
    });
    
    // Assign skills to chapter rings based on when they were first gained
    const positionedNodes = [];
    const occupiedPositions = [];
    const skillsByChapter = {};
    
    nodes.forEach(node => {
      const skillData = skillChapterData[node.id];
      if (!skillData || !skillData.firstGained) {
        // Skill not found in chapter data, place on first ring
        const firstChapterKey = Object.keys(chapterRings)[0];
        if (firstChapterKey && chapterRings[firstChapterKey]) {
          if (!skillsByChapter[firstChapterKey]) skillsByChapter[firstChapterKey] = [];
          skillsByChapter[firstChapterKey].push(node);
        }
        return;
      }
      
      const chapterKey = `${skillData.firstGained.bookId}_${skillData.firstGained.chapterId}`;
      if (chapterRings[chapterKey]) {
        if (!skillsByChapter[chapterKey]) skillsByChapter[chapterKey] = [];
        skillsByChapter[chapterKey].push({
          ...node,
          firstGained: skillData.firstGained,
          upgrades: skillData.upgrades || []
        });
      }
    });
    
    // Position skills on their chapter rings - better distribution
    Object.entries(skillsByChapter).forEach(([chapterKey, chapterSkills]) => {
      const ring = chapterRings[chapterKey];
      if (!ring) return;
      
      // Group skills by branch for better visual organization
      const skillsByBranch = {};
      chapterSkills.forEach(node => {
        const branch = node.branch || 'utility';
        if (!skillsByBranch[branch]) skillsByBranch[branch] = [];
        skillsByBranch[branch].push(node);
      });
      
      // Distribute branches around the ring, then skills within each branch
      const branches = Object.keys(skillsByBranch);
      
      // If all skills are in the same branch, distribute evenly around full circle
      if (branches.length === 1) {
        const angleStep = (Math.PI * 2) / chapterSkills.length;
        chapterSkills.forEach((node, idx) => {
          let angle = idx * angleStep;
          let x = centerX + Math.cos(angle) * ring.radius;
          let y = centerY + Math.sin(angle) * ring.radius;
          
          // Collision detection with better spacing
          let attempts = 0;
          while (attempts < 30) {
            const tooClose = occupiedPositions.some(pos => {
              const dx = x - pos.x;
              const dy = y - pos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance < minNodeSpacing;
            });
            
            if (!tooClose) break;
            
            // Try different angle with smaller increments
            angle += (Math.PI * 2) / 16;
            x = centerX + Math.cos(angle) * ring.radius;
            y = centerY + Math.sin(angle) * ring.radius;
            attempts++;
          }
          
          occupiedPositions.push({ x, y });
          
          // Check for saved position
          const savedPos = skillPositions[node.id];
          let finalX = x;
          let finalY = y;
          let finalAngle = angle;
          
          if (savedPos && savedPos.chapterKey === chapterKey) {
            // Restore saved position
            finalAngle = savedPos.angle;
            finalX = centerX + Math.cos(finalAngle) * ring.radius;
            finalY = centerY + Math.sin(finalAngle) * ring.radius;
          }
          
          positionedNodes.push({
            ...node,
            x: finalX,
            y: finalY,
            angle: finalAngle,
            chapterRing: ring,
            chapterKey,
            ringRadius: ring.radius
          });
        });
      } else {
        // Multiple branches - use branch grouping logic
        const branchAngleStep = (Math.PI * 2) / branches.length;
        
        branches.forEach((branch, branchIdx) => {
          const branchSkills = skillsByBranch[branch];
          const branchBaseAngle = branchIdx * branchAngleStep;
          // Increase skill angle step to spread skills more evenly within branch
          const skillAngleStep = branchSkills.length > 1 
            ? Math.min(branchAngleStep * 0.8, (Math.PI * 2) / branchSkills.length * 0.5)
            : 0;
          
          branchSkills.forEach((node, skillIdx) => {
            // Center skill in branch section, spread others around it
            const angleOffset = branchSkills.length > 1
              ? (skillIdx - (branchSkills.length - 1) / 2) * skillAngleStep
              : 0;
            let angle = branchBaseAngle + angleOffset;
            
            let x = centerX + Math.cos(angle) * ring.radius;
            let y = centerY + Math.sin(angle) * ring.radius;
            
            // Collision detection with better spacing
            let attempts = 0;
            while (attempts < 30) {
              const tooClose = occupiedPositions.some(pos => {
                const dx = x - pos.x;
                const dy = y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < minNodeSpacing;
              });
              
              if (!tooClose) break;
              
              // Try different angle with smaller increments
              angle += (Math.PI * 2) / 16;
              x = centerX + Math.cos(angle) * ring.radius;
              y = centerY + Math.sin(angle) * ring.radius;
              attempts++;
            }
            
            occupiedPositions.push({ x, y });
            
            positionedNodes.push({
              ...node,
              x,
              y,
              chapterRing: ring,
              chapterKey
            });
          });
        });
      }
    });
    
    return positionedNodes;
  };
  
  // Fallback: tier-based positioning (original method)
  const calculateTierBasedPositions = (nodes) => {
    if (!nodes || nodes.length === 0) return [];
    
    const centerX = 500;
    const centerY = 400;
    const minNodeSpacing = 90;
    
    const branchAngles = {
      combat: -Math.PI / 2,
      magic: -Math.PI / 2 + (2 * Math.PI / 5),
      utility: -Math.PI / 2 + (4 * Math.PI / 5),
      social: -Math.PI / 2 + (6 * Math.PI / 5),
      defense: -Math.PI / 2 + (8 * Math.PI / 5)
    };

    const branchTierGroups = {};
    nodes.forEach(node => {
      const key = `${node.branch}_${node.tier}`;
      if (!branchTierGroups[key]) branchTierGroups[key] = [];
      branchTierGroups[key].push(node);
    });

    const positionedNodes = [];
    const occupiedPositions = [];

    nodes.forEach(node => {
      const branch = skillBranches[node.branch] ? node.branch : 'utility';
      const tier = skillTiers[node.tier] || skillTiers.novice;
      const baseAngle = branchAngles[branch] || 0;
      
      const tierDistances = {
        novice: 80,
        adept: 150,
        expert: 220,
        master: 290,
        legendary: 360
      };
      const baseDistance = tierDistances[node.tier] || 80;
      
      const sameGroupKey = `${node.branch}_${node.tier}`;
      const sameGroupNodes = branchTierGroups[sameGroupKey] || [];
      const indexInGroup = sameGroupNodes.indexOf(node);
      const totalInGroup = sameGroupNodes.length;
      
      const maxSpreadAngle = Math.PI / 4;
      const spreadAngle = totalInGroup > 1 
        ? ((indexInGroup / Math.max(1, totalInGroup - 1)) - 0.5) * maxSpreadAngle
        : 0;
      
      let finalAngle = baseAngle + spreadAngle;
      let x = centerX + Math.cos(finalAngle) * baseDistance;
      let y = centerY + Math.sin(finalAngle) * baseDistance;
      
      let attempts = 0;
      while (attempts < 20) {
        const tooClose = occupiedPositions.some(pos => {
          const dx = x - pos.x;
          const dy = y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < minNodeSpacing;
        });
        
        if (!tooClose) break;
        
        const angleStep = (Math.PI * 2) / 8;
        finalAngle += angleStep * (attempts % 8);
        x = centerX + Math.cos(finalAngle) * baseDistance;
        y = centerY + Math.sin(finalAngle) * baseDistance;
        attempts++;
      }
      
      occupiedPositions.push({ x, y });
      
      positionedNodes.push({
        ...node,
        x,
        y
      });
    });
    
    return positionedNodes;
  };

  const generateDefaultSkillTree = () => {
    // Create a comprehensive default skill tree
    const defaultNodes = [
      // Combat branch
      { id: 'basic_attack', name: 'Basic Attack', branch: 'combat', tier: 'novice', prerequisites: [], description: 'A simple physical attack' },
      { id: 'power_strike', name: 'Power Strike', branch: 'combat', tier: 'adept', prerequisites: ['basic_attack'], description: 'A powerful blow dealing extra damage' },
      { id: 'whirlwind', name: 'Whirlwind', branch: 'combat', tier: 'expert', prerequisites: ['power_strike'], description: 'Spin attack hitting all nearby enemies' },
      { id: 'execute', name: 'Execute', branch: 'combat', tier: 'master', prerequisites: ['whirlwind'], description: 'Finishing blow on weakened foes' },
      { id: 'wrath', name: 'Wrath of Grimguff', branch: 'combat', tier: 'legendary', prerequisites: ['execute'], description: 'Ultimate devastation' },
      
      // Defense branch
      { id: 'block', name: 'Block', branch: 'defense', tier: 'novice', prerequisites: [], description: 'Reduce incoming damage' },
      { id: 'parry', name: 'Parry', branch: 'defense', tier: 'adept', prerequisites: ['block'], description: 'Deflect attacks with timing' },
      { id: 'fortress', name: 'Fortress', branch: 'defense', tier: 'expert', prerequisites: ['parry'], description: 'Become immovable' },
      { id: 'counter', name: 'Counter Strike', branch: 'defense', tier: 'master', prerequisites: ['fortress', 'power_strike'], description: 'Retaliate after blocking' },
      
      // Magic branch
      { id: 'spark', name: 'Spark', branch: 'magic', tier: 'novice', prerequisites: [], description: 'A tiny magical flame' },
      { id: 'fireball', name: 'Fireball', branch: 'magic', tier: 'adept', prerequisites: ['spark'], description: 'Explosive fire magic' },
      { id: 'inferno', name: 'Inferno', branch: 'magic', tier: 'expert', prerequisites: ['fireball'], description: 'Engulf an area in flames' },
      { id: 'meteor', name: 'Meteor Strike', branch: 'magic', tier: 'master', prerequisites: ['inferno'], description: 'Call down celestial fire' },
      { id: 'apocalypse', name: 'Apocalypse', branch: 'magic', tier: 'legendary', prerequisites: ['meteor'], description: 'End of all things' },
      
      // Utility branch
      { id: 'perception', name: 'Perception', branch: 'utility', tier: 'novice', prerequisites: [], description: 'Notice hidden details' },
      { id: 'lockpick', name: 'Lockpicking', branch: 'utility', tier: 'adept', prerequisites: ['perception'], description: 'Open locks without keys' },
      { id: 'stealth', name: 'Stealth', branch: 'utility', tier: 'adept', prerequisites: ['perception'], description: 'Move unseen' },
      { id: 'trap_mastery', name: 'Trap Mastery', branch: 'utility', tier: 'expert', prerequisites: ['lockpick', 'stealth'], description: 'Set and disarm traps' },
      
      // Social branch
      { id: 'persuasion', name: 'Persuasion', branch: 'social', tier: 'novice', prerequisites: [], description: 'Convince others' },
      { id: 'intimidate', name: 'Intimidation', branch: 'social', tier: 'adept', prerequisites: ['persuasion'], description: 'Strike fear into hearts' },
      { id: 'deception', name: 'Deception', branch: 'social', tier: 'adept', prerequisites: ['persuasion'], description: 'Lie convincingly' },
      { id: 'leadership', name: 'Leadership', branch: 'social', tier: 'expert', prerequisites: ['intimidate', 'deception'], description: 'Command and inspire' },
      { id: 'legend', name: 'Legendary Status', branch: 'social', tier: 'master', prerequisites: ['leadership'], description: 'Your reputation precedes you' }
    ];

    const positionedNodes = calculateTreePositions(defaultNodes);
    setSkillNodes(positionedNodes);

    // Build connections
    const connections = [];
    positionedNodes.forEach(node => {
      node.prerequisites?.forEach(prereqId => {
        connections.push({
          id: `conn_${prereqId}_${node.id}`,
          from: prereqId,
          to: node.id
        });
      });
    });
    setSkillConnections(connections);
  };

  const loadActorProgress = async () => {
    try {
      // Sync with actors' actual activeSkills from their data
      const points = {};
      const unlocked = {};
      
      // Try to load from separate progress store for skill points (if it exists)
      let progress = [];
      try {
        progress = await db.getAll('actorSkillProgress') || [];
      } catch (e) {
        // Store doesn't exist, that's okay - we'll use defaults
        console.log('actorSkillProgress store not found, using actor data directly');
      }
      
      actors.forEach(actor => {
        // Get unlocked skills from actor's activeSkills array
        const actorSkills = actor.activeSkills || [];
        const unlockedSkillIds = actorSkills.map(s => {
          // Handle both {id, val} format and string format
          if (typeof s === 'string') return s;
          return s.id || s;
        });
        
        // Calculate skill points used (sum of skill levels/values)
        const pointsUsed = actorSkills.reduce((sum, skill) => {
          if (typeof skill === 'string') return sum + 1;
          const skillValue = skill.val || skill.value || 1;
          return sum + skillValue;
        }, 0);
        
        // Get total points from progress store or use default
        const actorProgress = progress.find(p => p.actorId === actor.id);
        const totalPoints = actorProgress?.totalSkillPoints ?? actorProgress?.skillPoints ?? 20; // Default 20 total points
        points[actor.id] = Math.max(0, totalPoints - pointsUsed);
        
        unlocked[actor.id] = unlockedSkillIds;
      });
      
      setActorSkillPoints(points);
      setActorUnlockedSkills(unlocked);
    } catch (error) {
      console.error('Error loading actor progress:', error);
      // Fallback: sync directly from actors
      const points = {};
      const unlocked = {};
      actors.forEach(actor => {
        const actorSkills = actor.activeSkills || [];
        const unlockedSkillIds = actorSkills.map(s => {
          if (typeof s === 'string') return s;
          return s.id || s;
        });
        const pointsUsed = actorSkills.reduce((sum, skill) => {
          if (typeof skill === 'string') return sum + 1;
          const skillValue = skill.val || skill.value || 1;
          return sum + skillValue;
        }, 0);
        points[actor.id] = Math.max(0, 20 - pointsUsed); // Default 20 total points
        unlocked[actor.id] = unlockedSkillIds;
      });
      setActorSkillPoints(points);
      setActorUnlockedSkills(unlocked);
    }
  };

  const saveActorProgress = async () => {
    if (!selectedActor) return;
    
    try {
      await db.update('actorSkillProgress', {
        id: selectedActor.id,
        actorId: selectedActor.id,
        skillPoints: actorSkillPoints[selectedActor.id] || 0,
        unlockedSkills: actorUnlockedSkills[selectedActor.id] || [],
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error saving actor progress:', error);
    }
  };

  const canUnlockSkill = useCallback((skill) => {
    if (!selectedActor) return false;
    
    const actorId = selectedActor.id;
    const unlocked = actorUnlockedSkills[actorId] || [];
    const points = actorSkillPoints[actorId] || 0;
    const tier = skillTiers[skill.tier] || skillTiers.novice;
    
    // Already unlocked
    if (unlocked.includes(skill.id)) return false;
    
    // Not enough points
    if (points < tier.pointCost) return false;
    
    // Check prerequisites
    if (skill.prerequisites && skill.prerequisites.length > 0) {
      const hasAllPrereqs = skill.prerequisites.every(prereqId => 
        unlocked.includes(prereqId)
      );
      if (!hasAllPrereqs) return false;
    }
    
    return true;
  }, [selectedActor, actorUnlockedSkills, actorSkillPoints]);

  // Update skill level for selected actor
  const updateSkillLevel = useCallback(async (skillId, newLevel) => {
    if (!selectedActor) return;
    
    try {
      // Get current actor skills
      const actorSkills = selectedActor.activeSkills || [];
      
      // Find and update the skill
      const updatedSkills = actorSkills.map(skill => {
        const skillIdStr = typeof skill === 'string' ? skill : skill.id;
        if (skillIdStr === skillId) {
          // Update level
          if (typeof skill === 'object') {
            return { ...skill, val: newLevel, value: newLevel, level: newLevel };
          } else {
            // Convert string to object with level
            return { id: skill, val: newLevel, value: newLevel, level: newLevel };
          }
        }
        return skill;
      });
      
      // Update actor in database
      const updatedActor = {
        ...selectedActor,
        activeSkills: updatedSkills
      };
      
      await db.update('actors', updatedActor);
      
      // Update local state
      setSelectedActor(updatedActor);
      
      // Reload skill tree to reflect changes
      buildSkillTree();
    } catch (error) {
      console.error('Error updating skill level:', error);
    }
  }, [selectedActor, buildSkillTree]);

  const unlockSkill = useCallback((skill) => {
    if (!selectedActor || !canUnlockSkill(skill)) return;
    
    const actorId = selectedActor.id;
    const tier = skillTiers[skill.tier] || skillTiers.novice;
    
    setActorSkillPoints(prev => ({
      ...prev,
      [actorId]: (prev[actorId] || 0) - tier.pointCost
    }));
    
    setActorUnlockedSkills(prev => ({
      ...prev,
      [actorId]: [...(prev[actorId] || []), skill.id]
    }));
  }, [selectedActor, canUnlockSkill]);

  const isSkillUnlocked = useCallback((skillId) => {
    if (!selectedActor) return false;
    return (actorUnlockedSkills[selectedActor.id] || []).includes(skillId);
  }, [selectedActor, actorUnlockedSkills]);

  const getSkillState = useCallback((skill) => {
    if (!selectedActor) return 'available';
    
    if (isSkillUnlocked(skill.id)) return 'unlocked';
    if (canUnlockSkill(skill)) return 'available';
    return 'locked';
  }, [selectedActor, isSkillUnlocked, canUnlockSkill]);

  // Pan and zoom handlers
  // Note: Wheel handling is done via useEffect with addEventListener to avoid passive listener warnings

  const handleMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.classList.contains('tree-background')) {
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

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const resetActorSkills = useCallback(() => {
    if (!selectedActor) return;
    if (!window.confirm(`Reset all skills for ${selectedActor.name}? This will refund all skill points.`)) return;
    
    const actorId = selectedActor.id;
    const unlocked = actorUnlockedSkills[actorId] || [];
    
    // Calculate refund
    let refund = 0;
    unlocked.forEach(skillId => {
      const skill = skillNodes.find(s => s.id === skillId);
      if (skill) {
        const tier = skillTiers[skill.tier] || skillTiers.novice;
        refund += tier.pointCost;
      }
    });
    
    setActorSkillPoints(prev => ({
      ...prev,
      [actorId]: (prev[actorId] || 0) + refund
    }));
    
    setActorUnlockedSkills(prev => ({
      ...prev,
      [actorId]: []
    }));
  }, [selectedActor, actorUnlockedSkills, skillNodes]);

  // Render constellation view (skill nodes as stars)
  const renderConstellationView = () => {
    return (
      <g>
        {/* Background nebula effect */}
        <defs>
          <radialGradient id="nebula1" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="nebula2" cx="70%" cy="60%" r="40%">
            <stop offset="0%" stopColor="rgba(236, 72, 153, 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <rect x="0" y="0" width="1000" height="800" fill="url(#nebula1)" />
        <rect x="0" y="0" width="1000" height="800" fill="url(#nebula2)" />

        {/* Connections as constellation lines */}
        {skillConnections.map(conn => {
          const fromNode = skillNodes.find(n => n.id === conn.from);
          const toNode = skillNodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          const fromUnlocked = isSkillUnlocked(conn.from);
          const toUnlocked = isSkillUnlocked(conn.to);
          const bothUnlocked = fromUnlocked && toUnlocked;
          
          return (
            <line
              key={conn.id}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={bothUnlocked ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
              strokeWidth={bothUnlocked ? 2 : 1}
              strokeDasharray={bothUnlocked ? 'none' : '4 4'}
            />
          );
        })}

        {/* Skill nodes as stars */}
        {skillNodes.map(skill => {
          const state = getSkillState(skill);
          const branch = skillBranches[skill.branch] || skillBranches.utility;
          const tier = skillTiers[skill.tier] || skillTiers.novice;
          const isHovered = hoveredSkill?.id === skill.id;
          const isSelected = selectedSkill?.id === skill.id;
          
          const starPoints = 4 + tier.level; // More points for higher tiers
          const outerRadius = tier.radius * (isHovered || isSelected ? 1.2 : 1);
          const innerRadius = outerRadius * 0.5;
          
          // Generate star path
          const starPath = [];
          for (let i = 0; i < starPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / starPoints - Math.PI / 2;
            starPath.push(`${i === 0 ? 'M' : 'L'} ${Math.cos(angle) * radius} ${Math.sin(angle) * radius}`);
          }
          starPath.push('Z');
          
          return (
            <g
              key={skill.id}
              transform={`translate(${skill.x}, ${skill.y})`}
              onClick={() => {
                setSelectedSkill(selectedSkill?.id === skill.id ? null : skill);
                if (state === 'available') unlockSkill(skill);
              }}
              onMouseEnter={() => setHoveredSkill(skill)}
              onMouseLeave={() => setHoveredSkill(null)}
              style={{ cursor: state === 'locked' ? 'not-allowed' : 'pointer' }}
            >
              {/* Glow effect for unlocked */}
              {state === 'unlocked' && (
                <circle
                  r={outerRadius + 10}
                  fill="none"
                  stroke={branch.glow}
                  strokeWidth="2"
                  opacity="0.5"
                  filter="url(#starGlow)"
                />
              )}
              
              {/* Star shape */}
              <path
                d={starPath.join(' ')}
                fill={state === 'unlocked' ? branch.color : 
                      state === 'available' ? branch.color + '80' : 
                      '#374151'}
                stroke={state === 'unlocked' ? branch.glow : 'rgba(255,255,255,0.3)'}
                strokeWidth="2"
                filter={state === 'unlocked' ? 'url(#starGlow)' : undefined}
                style={{ transition: 'all 0.3s ease' }}
              />
              
              {/* Lock icon for locked skills */}
              {state === 'locked' && (
                <Lock 
                  className="w-4 h-4" 
                  x={-8} 
                  y={-8} 
                  style={{ color: '#6b7280' }}
                />
              )}
              
              {/* Label */}
              <text
                y={outerRadius + 18}
                textAnchor="middle"
                fill={state === 'unlocked' ? 'white' : state === 'available' ? '#d1d5db' : '#6b7280'}
                fontSize="11"
                fontWeight={state === 'unlocked' ? 'bold' : 'normal'}
              >
                {skill.name}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // Render timeline view showing skill progression by chapter
  const renderTimelineView = () => {
    if (!selectedActor) return null;
    
    const actorSkills = actorUnlockedSkills[selectedActor.id] || [];
    const skillsWithChapters = actorSkills
      .map(skillId => {
        const skill = skills.find(s => s.id === skillId);
        const chapterData = skillChapterData[skillId];
        return { skill, chapterData };
      })
      .filter(item => item.skill && item.chapterData)
      .sort((a, b) => {
        const aFirst = a.chapterData.firstGained;
        const bFirst = b.chapterData.firstGained;
        if (!aFirst || !bFirst) return 0;
        return (aFirst.bookId || 0) - (bFirst.bookId || 0) || 
               (aFirst.chapterId || 0) - (bFirst.chapterId || 0);
      });

    return (
      <div className="absolute inset-0 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">Skill Progression Timeline</h3>
          <div className="space-y-4">
            {skillsWithChapters.map(({ skill, chapterData }) => {
              const firstGained = chapterData.firstGained;
              return (
                <div key={skill.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{skill.name}</h4>
                    {firstGained && (
                      <button
                        onClick={() => chapterNavigationService.navigateToChapter(firstGained.bookId, firstGained.chapterId)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        View Chapter <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    <p>First gained in: {chapterData.chapters[0]?.chapterTitle || 'Unknown'}</p>
                    <p>Used in {chapterData.chapters.length} chapter(s)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render comparison view showing all actors and their skills
  const renderComparisonView = () => {
    // Deduplicate actors by ID to prevent duplicates
    const uniqueActors = Array.from(
      new Map(actors.map(actor => [actor.id, actor])).values()
    );

    return (
      <div className="absolute inset-0 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">Actor Skill Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-white font-semibold">Actor</th>
                  {skills.map(skill => (
                    <th key={skill.id} className="text-center p-3 text-slate-400 text-xs min-w-[100px]">
                      {skill.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueActors.map(actor => {
                  const unlocked = actorUnlockedSkills[actor.id] || [];
                  return (
                    <tr key={actor.id} className="border-b border-slate-800">
                      <td className="p-3 text-white font-medium">{actor.name}</td>
                      {skills.map(skill => (
                        <td key={skill.id} className="text-center p-3">
                          {unlocked.includes(skill.id) ? (
                            <div className="w-6 h-6 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 mx-auto rounded-full bg-slate-700" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render traditional tree view with chapter rings
  const renderTreeView = () => {
          const centerX = 500;
          const centerY = 400;
    const baseRadius = 120; // Match calculateTreePositions
    const ringSpacing = 110; // Match calculateTreePositions
    
    // Get all chapters for ring rendering
    const allChapters = [];
    books.forEach(book => {
      if (book.chapters) {
        book.chapters.forEach(chapter => {
          allChapters.push({
            ...chapter,
            bookId: book.id
          });
        });
      }
    });
    
    // Book colors for ring coloring
    const bookColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
          
          return (
      <g>
        {/* Chapter rings */}
        {allChapters.map((chapter, idx) => {
          const radius = baseRadius + (idx * ringSpacing);
          const bookColor = bookColors[chapter.bookId % bookColors.length] || '#64748b';
          const hasContent = !!(chapter.content || chapter.script);
          
          return (
            <g key={`ring_${chapter.bookId}_${chapter.id}`}>
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={hasContent ? bookColor : 'rgba(255,255,255,0.1)'}
                strokeWidth={hasContent ? 2 : 1}
                strokeDasharray={hasContent ? 'none' : '8 8'}
                opacity={hasContent ? 0.6 : 0.3}
              />
              {/* Chapter label - positioned at top of ring */}
              <text
                x={centerX}
                y={centerY - radius - 5}
                textAnchor="middle"
                fill={hasContent ? bookColor : 'rgba(255,255,255,0.4)'}
                fontSize="10"
                fontWeight={hasContent ? 'bold' : 'normal'}
                opacity={0.8}
              >
                Ch {chapter.number || idx + 1}
              </text>
            </g>
          );
        })}

        {/* Connections */}
        {skillConnections.map(conn => {
          if (conn.type === 'upgrade') {
            // Handle upgrade connections (same skill, different chapters)
            const fromNode = skillNodes.find(n => n.id === conn.from);
            if (!fromNode || !fromNode.upgrades) return null;
            
            const upgrade = conn.upgradeData;
            if (!upgrade) return null;
            
            // Find the upgrade chapter ring
            const upgradeChapter = allChapters.find(c => 
              c.id === upgrade.chapterId && c.bookId === upgrade.bookId
            );
            if (!upgradeChapter) return null;
            
            const upgradeRadius = baseRadius + (allChapters.indexOf(upgradeChapter) * ringSpacing);
            const upgradeAngle = Math.atan2(fromNode.y - centerY, fromNode.x - centerX);
            const upgradeX = centerX + Math.cos(upgradeAngle) * upgradeRadius;
            const upgradeY = centerY + Math.sin(upgradeAngle) * upgradeRadius;
            
            // Draw curved line from main node to upgrade indicator
            const midX = (fromNode.x + upgradeX) / 2;
            const midY = (fromNode.y + upgradeY) / 2;
            const dx = upgradeX - fromNode.x;
            const dy = upgradeY - fromNode.y;
            const ctrlX = midX - dy * 0.2;
            const ctrlY = midY + dx * 0.2;
            
            return (
              <g key={conn.id}>
                <path
                  d={`M ${fromNode.x} ${fromNode.y} Q ${ctrlX} ${ctrlY} ${upgradeX} ${upgradeY}`}
            fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                {/* Upgrade indicator badge */}
                <circle
                  cx={upgradeX}
                  cy={upgradeY}
                  r="12"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <text
                  x={upgradeX}
                  y={upgradeY + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {upgrade.level}
                </text>
              </g>
            );
          }
          
          // Regular prerequisite connections
          const fromNode = skillNodes.find(n => n.id === conn.from);
          const toNode = skillNodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          const fromUnlocked = isSkillUnlocked(conn.from);
          const toUnlocked = isSkillUnlocked(conn.to);
          const branch = skillBranches[toNode.branch] || skillBranches.utility;
          
          // Calculate curved path
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const ctrlX = midX - dy * 0.1;
          const ctrlY = midY + dx * 0.1;
          
          return (
            <g key={conn.id}>
              <path
                d={`M ${fromNode.x} ${fromNode.y} Q ${ctrlX} ${ctrlY} ${toNode.x} ${toNode.y}`}
                fill="none"
                stroke={toUnlocked ? branch.color : 'rgba(255,255,255,0.15)'}
                strokeWidth={toUnlocked ? 3 : 2}
                strokeLinecap="round"
              />
              {/* Arrow head */}
              <circle
                cx={toNode.x + (fromNode.x - toNode.x) * 0.15}
                cy={toNode.y + (fromNode.y - toNode.y) * 0.15}
                r="4"
                fill={toUnlocked ? branch.color : 'rgba(255,255,255,0.3)'}
              />
            </g>
          );
        })}

        {/* Skill nodes */}
        {skillNodes.map(skill => {
          const state = getSkillState(skill);
          const branch = skillBranches[skill.branch] || skillBranches.utility;
          const tier = skillTiers[skill.tier] || skillTiers.novice;
          const isHovered = hoveredSkill?.id === skill.id;
          const isSelected = selectedSkill?.id === skill.id;
          const radius = tier.radius * (isHovered || isSelected ? 1.15 : 1);
          
          return (
            <g
              key={skill.id}
              transform={`translate(${skill.x}, ${skill.y})`}
              onClick={() => {
                setSelectedSkill(selectedSkill?.id === skill.id ? null : skill);
                if (state === 'available') unlockSkill(skill);
              }}
              onMouseEnter={() => setHoveredSkill(skill)}
              onMouseLeave={() => setHoveredSkill(null)}
              style={{ cursor: state === 'locked' ? 'not-allowed' : 'pointer' }}
            >
              {/* Outer glow for unlocked */}
              {state === 'unlocked' && (
                <circle
                  r={radius + 8}
                  fill="none"
                  stroke={branch.glow}
                  strokeWidth="3"
                  opacity="0.4"
                  style={{ animation: 'pulse 2s infinite' }}
                />
              )}
              
              {/* Available indicator */}
              {state === 'available' && (
                <circle
                  r={radius + 5}
                  fill="none"
                  stroke={branch.color}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                  style={{ animation: 'rotate 4s linear infinite' }}
                />
              )}
              
              {/* Main node */}
              <circle
                r={radius}
                fill={state === 'unlocked' ? branch.color : 
                      state === 'available' ? `${branch.color}40` : 
                      '#1f2937'}
                stroke={state === 'unlocked' ? branch.glow : 
                        state === 'available' ? branch.color : 
                        '#374151'}
                strokeWidth="3"
                style={{ transition: 'all 0.3s ease' }}
              />
              
              {/* Inner decoration based on tier */}
              {tier.level >= 3 && (
                <circle
                  r={radius * 0.6}
                  fill="none"
                  stroke={state === 'unlocked' ? branch.glow : 'rgba(255,255,255,0.1)'}
                  strokeWidth="1"
                />
              )}
              {tier.level >= 4 && (
                <circle
                  r={radius * 0.3}
                  fill={state === 'unlocked' ? branch.glow : 'rgba(255,255,255,0.05)'}
                />
              )}
              
              {/* Icon */}
              {state === 'locked' ? (
                <Lock className="w-5 h-5" x={-10} y={-10} style={{ color: '#6b7280' }} />
              ) : (
                <branch.icon 
                  className="w-5 h-5" 
                  x={-10} 
                  y={-10} 
                  style={{ color: state === 'unlocked' ? 'white' : branch.color }}
                />
              )}
              
              {/* Label */}
              <text
                y={radius + 18}
                textAnchor="middle"
                fill={state === 'unlocked' ? 'white' : state === 'available' ? '#d1d5db' : '#6b7280'}
                fontSize="11"
                fontWeight={state === 'unlocked' ? 'bold' : 'normal'}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              >
                {skill.name}
              </text>
              
              {/* Tier badge */}
              <g transform={`translate(${radius - 5}, ${-radius + 5})`}>
                <circle r="8" fill="#0f172a" stroke={branch.color} strokeWidth="1" />
                <text
                  textAnchor="middle"
                  y="4"
                  fill={branch.color}
                  fontSize="9"
                  fontWeight="bold"
                >
                  {tier.level}
                </text>
              </g>
              
              {/* Level adjustment buttons (+/-) - only show for unlocked skills */}
              {state === 'unlocked' && (
                <g transform={`translate(${radius + 15}, 0)`}>
                  {/* + Button */}
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentLevel = skill.level || skill.defaultVal || 1;
                      const maxLevel = skill.maxLevel || 5;
                      if (currentLevel < maxLevel) {
                        // Update skill level
                        const updatedSkill = { ...skill, level: currentLevel + 1 };
                        // Update actor's skill level in database
                        updateSkillLevel(skill.id, currentLevel + 1);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r="10" fill={branch.color} opacity="0.8" />
                    <Plus className="w-4 h-4" x={-8} y={-8} style={{ color: 'white' }} />
                  </g>
                  
                  {/* Level display */}
                  <text
                    x="0"
                    y={20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    Lv {skill.level || skill.defaultVal || 1}
                  </text>
                  
                  {/* - Button */}
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentLevel = skill.level || skill.defaultVal || 1;
                      if (currentLevel > 1) {
                        // Update skill level
                        const updatedSkill = { ...skill, level: currentLevel - 1 };
                        // Update actor's skill level in database
                        updateSkillLevel(skill.id, currentLevel - 1);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    transform="translate(0, 30)"
                  >
                    <circle r="10" fill={branch.color} opacity="0.8" />
                    <Minus className="w-4 h-4" x={-8} y={-8} style={{ color: 'white' }} />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950" ref={containerRef}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-slate-900/90 border-b border-slate-700 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Skill Tree</h2>
                <p className="text-xs text-slate-400">
                  {skillNodes.length} skills across {Object.keys(skillBranches).length} branches
                </p>
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                  viewMode === 'tree' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                Tree
              </button>
              <button
                onClick={() => setViewMode('constellation')}
                className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                  viewMode === 'constellation' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-4 h-4" />
                Constellation
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                  viewMode === 'timeline' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                  viewMode === 'comparison' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Comparison
              </button>
            </div>

            {/* Character selector */}
            <select
              value={selectedActor?.id || ''}
              onChange={(e) => {
                const actor = actors.find(a => a.id === e.target.value);
                setSelectedActor(actor || null);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 min-w-[200px]"
            >
              <option value="">Select Character...</option>
              {actors.map(actor => (
                <option key={actor.id} value={actor.id}>{actor.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Skill points display */}
            {selectedActor && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold">
                  {actorSkillPoints[selectedActor.id] || 0}
                </span>
                <span className="text-amber-400/60 text-sm">Skill Points</span>
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 2) }))}
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

            {selectedActor && (
              <>
                <button
                  onClick={resetActorSkills}
                  className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg"
                  title="Reset skills"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={saveActorProgress}
                  className="p-2 bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg"
                  title="Save progress"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            )}

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
      </div>

      {/* Main Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background */}
        <div className="absolute inset-0 tree-background bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 1000 800"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'center center'
          }}
        >
          {viewMode === 'timeline' || viewMode === 'comparison' ? null : (
            viewMode === 'constellation' ? renderConstellationView() : renderTreeView()
          )}
        </svg>
        
        {/* Timeline and Comparison views render outside SVG */}
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'comparison' && renderComparisonView()}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3">Branches</h4>
          <div className="space-y-2">
            {Object.entries(skillBranches).map(([key, branch]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: branch.color }}
                />
                <span className="text-xs text-white">{branch.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700">
            <h4 className="text-sm font-bold text-white mb-2">Tiers</h4>
            <div className="space-y-1">
              {Object.entries(skillTiers).map(([key, tier]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{tier.name}</span>
                  <span className="text-amber-400">{tier.pointCost} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!selectedActor && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Select a Character</h3>
            <p className="text-slate-500 max-w-md">
              Choose a character from the dropdown above to view and unlock their skills.
            </p>
          </div>
        )}
      </div>

      {/* Selected Skill Panel */}
      {selectedSkill && (
        <div className="absolute top-20 right-4 w-80 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div 
            className="p-4 border-b border-slate-700"
            style={{ 
              background: `linear-gradient(135deg, ${skillBranches[selectedSkill.branch]?.color}30, transparent)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: skillBranches[selectedSkill.branch]?.color,
                    boxShadow: `0 0 20px ${skillBranches[selectedSkill.branch]?.color}50`
                  }}
                >
                  {React.createElement(skillBranches[selectedSkill.branch]?.icon || Zap, {
                    className: 'w-6 h-6 text-white'
                  })}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedSkill.name}</h3>
                  <p className="text-xs text-slate-400 capitalize">
                    {skillBranches[selectedSkill.branch]?.name || 'Unknown'} - {skillTiers[selectedSkill.tier]?.name || 'Novice'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Description */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-slate-300">
                {selectedSkill.description || 'No description available.'}
              </p>
            </div>

            {/* Stat Modifiers */}
            {selectedSkill.statModifiers && Object.keys(selectedSkill.statModifiers).length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stat Modifiers</p>
                <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg">
                  {Object.entries(selectedSkill.statModifiers).map(([stat, val]) => (
                    <div key={stat} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{stat}:</span>
                      <span className="text-green-400 font-mono font-bold">+{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Effects */}
            {selectedSkill.effects && selectedSkill.effects.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Effects</p>
                <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg">
                  {selectedSkill.effects.map((effect, idx) => (
                    <div key={idx} className="text-sm text-slate-300">
                      {typeof effect === 'string' ? effect : JSON.stringify(effect)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Characters with this Skill */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Characters with this Skill</p>
              <div className="space-y-1">
                {actors
                  .filter(actor => actor.activeSkills?.some(skillId => 
                    (typeof skillId === 'string' ? skillId : skillId.id) === selectedSkill.id
                  ))
                  .map(actor => (
                    <div 
                      key={actor.id}
                      className="flex items-center justify-between bg-slate-800/50 p-2 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <span className="text-sm text-white">{actor.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                {actors.filter(actor => actor.activeSkills?.some(skillId => 
                  (typeof skillId === 'string' ? skillId : skillId.id) === selectedSkill.id
                )).length === 0 && (
                  <p className="text-xs text-slate-500">No characters have this skill</p>
                )}
              </div>
            </div>

            {/* Chapter Usage */}
            {skillChapterData[selectedSkill.id] && (() => {
              const chapterData = skillChapterData[selectedSkill.id];
              const firstGained = chapterData.firstGained;
              return (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Chapter Usage</p>
                  <div className="space-y-2">
                    {firstGained && (
                      <div className="bg-slate-800/50 p-2 rounded">
                        <p className="text-xs text-slate-400 mb-1">First Gained:</p>
                        <button
                          onClick={() => {
                            chapterNavigationService.navigateToChapter(firstGained.bookId, firstGained.chapterId);
                          }}
                          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          Chapter {chapterData.chapters.find(c => 
                            c.chapterId === firstGained.chapterId
                          )?.chapterNumber || '?'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {chapterData.chapters.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Appears in {chapterData.chapters.length} chapter(s):</p>
                        <div className="flex flex-wrap gap-1">
                          {chapterData.chapters.map((ch, idx) => (
                            <button
                              key={idx}
                              onClick={() => chapterNavigationService.navigateToChapter(ch.bookId, ch.chapterId)}
                              className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            >
                              Ch {ch.chapterNumber}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Scaling */}
            {selectedSkill.scaling && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Scaling</p>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <span className="text-sm text-slate-300">{selectedSkill.scaling}</span>
                  {selectedSkill.scalingPerLevel && Object.keys(selectedSkill.scalingPerLevel).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(selectedSkill.scalingPerLevel).map(([stat, perLevel]) => (
                        <div key={stat} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{stat} per level:</span>
                          <span className="text-purple-400 font-mono">+{perLevel}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {selectedSkill.prerequisites && selectedSkill.prerequisites.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Prerequisites</p>
                <div className="space-y-1">
                  {selectedSkill.prerequisites.map(prereqId => {
                    const prereq = skillNodes.find(s => s.id === prereqId);
                    const isUnlocked = isSkillUnlocked(prereqId);
                    return (
                      <div key={prereqId} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded">
                        {isUnlocked ? (
                          <Unlock className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm ${isUnlocked ? 'text-emerald-400' : 'text-red-400'}`}>
                          {prereq?.name || prereqId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skill Details */}
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Point Cost</span>
                  <span className="text-amber-400 font-bold">
                    {skillTiers[selectedSkill.tier]?.pointCost || 1} pts
                  </span>
                </div>
                {selectedSkill.maxLevel && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Max Level</span>
                    <span className="text-purple-400 font-bold">{selectedSkill.maxLevel}</span>
                  </div>
                )}
                {selectedSkill.defaultVal && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Default Value</span>
                    <span className="text-blue-400 font-bold">{selectedSkill.defaultVal}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            {selectedActor && (
              <button
                onClick={() => unlockSkill(selectedSkill)}
                disabled={!canUnlockSkill(selectedSkill)}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isSkillUnlocked(selectedSkill.id)
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                    : canUnlockSkill(selectedSkill)
                    ? 'bg-purple-500 hover:bg-purple-400 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSkillUnlocked(selectedSkill.id) 
                  ? 'Unlocked' 
                  : canUnlockSkill(selectedSkill) 
                  ? 'Unlock Skill' 
                  : 'Requirements Not Met'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SkillTreeSystem;
