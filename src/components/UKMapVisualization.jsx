import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Users, Clock, Play, Pause, X, ZoomIn, ZoomOut, 
  Filter, ChevronDown, ChevronRight, Calendar, Target,
  Search, Layers, Thermometer, Eye, EyeOff, Navigation, Sparkles
} from 'lucide-react';
import db from '../services/database';
import toastService from '../services/toastService';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import chapterNavigationService from '../services/chapterNavigationService';
import dataConsistencyService from '../services/dataConsistencyService';

/**
 * UK Map Visualization Component
 * Stylized SVG map with location markers, animated travel paths, heat map, and search
 */
const UKMapVisualization = ({ actors, books, onClose }) => {
  const [locations, setLocations] = useState([]);
  const [travelRecords, setTravelRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [locationChapterData, setLocationChapterData] = useState({});
  
  // View state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedActor, setSelectedActor] = useState('all');
  const [showTravelPaths, setShowTravelPaths] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showRegions, setShowRegions] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Map transform state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Timeline slider
  const [timelinePosition, setTimelinePosition] = useState(100); // 0-100 percentage
  
  const svgRef = useRef(null);
  const animationRef = useRef(null);
  const searchInputRef = useRef(null);

  // UK Major Cities with coordinates
  const ukCities = useMemo(() => [
    { name: 'London', x: 520, y: 580, region: 'England', population: 'major' },
    { name: 'Birmingham', x: 420, y: 480, region: 'England', population: 'major' },
    { name: 'Manchester', x: 400, y: 400, region: 'England', population: 'major' },
    { name: 'Liverpool', x: 370, y: 410, region: 'England', population: 'major' },
    { name: 'Leeds', x: 440, y: 390, region: 'England', population: 'major' },
    { name: 'Sheffield', x: 450, y: 420, region: 'England', population: 'city' },
    { name: 'Bristol', x: 380, y: 560, region: 'England', population: 'city' },
    { name: 'Newcastle', x: 440, y: 310, region: 'England', population: 'city' },
    { name: 'Edinburgh', x: 400, y: 220, region: 'Scotland', population: 'major' },
    { name: 'Glasgow', x: 350, y: 240, region: 'Scotland', population: 'major' },
    { name: 'Cardiff', x: 360, y: 560, region: 'Wales', population: 'major' },
    { name: 'Belfast', x: 260, y: 280, region: 'N. Ireland', population: 'major' },
    { name: 'Oxford', x: 480, y: 540, region: 'England', population: 'city' },
    { name: 'Cambridge', x: 530, y: 500, region: 'England', population: 'city' },
    { name: 'Brighton', x: 510, y: 620, region: 'England', population: 'city' },
    { name: 'Plymouth', x: 300, y: 630, region: 'England', population: 'city' },
    { name: 'York', x: 460, y: 380, region: 'England', population: 'city' },
    { name: 'Nottingham', x: 460, y: 450, region: 'England', population: 'city' },
    { name: 'Southampton', x: 460, y: 600, region: 'England', population: 'city' },
    { name: 'Dover', x: 570, y: 590, region: 'England', population: 'town' },
    { name: 'Canterbury', x: 560, y: 575, region: 'England', population: 'town' },
    { name: 'Bath', x: 380, y: 555, region: 'England', population: 'town' },
    { name: 'Stratford', x: 430, y: 500, region: 'England', population: 'town' },
    { name: 'Windsor', x: 500, y: 560, region: 'England', population: 'town' },
    { name: 'Inverness', x: 340, y: 140, region: 'Scotland', population: 'town' },
    { name: 'Aberdeen', x: 420, y: 160, region: 'Scotland', population: 'city' },
    { name: 'Dundee', x: 400, y: 200, region: 'Scotland', population: 'city' },
    { name: 'Swansea', x: 320, y: 570, region: 'Wales', population: 'city' },
  ], []);

  // UK Regions for labeling
  const ukRegions = useMemo(() => [
    { name: 'SCOTLAND', x: 370, y: 180, fontSize: 14 },
    { name: 'NORTHERN\nIRELAND', x: 250, y: 310, fontSize: 10 },
    { name: 'WALES', x: 330, y: 530, fontSize: 12 },
    { name: 'ENGLAND', x: 450, y: 480, fontSize: 14 },
    { name: 'CORNWALL', x: 280, y: 660, fontSize: 9 },
  ], []);

  useEffect(() => {
    loadMapData();
  }, [books]);

  // Auto-extract locations and travel paths from chapters
  const extractLocationsFromChapters = async () => {
    if (!books || (Array.isArray(books) ? books.length === 0 : Object.keys(books).length === 0)) {
      return;
    }

    setIsExtracting(true);
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
              content: chapter.content || chapter.script || ''
            });
          });
        }
      });

      if (allChapters.length === 0) {
        return;
      }

      const extractedLocations = [];
      const locationChapters = {};
      const travelPaths = [];

      // Process each chapter
      for (const chapter of allChapters) {
        if (!chapter.content || chapter.content.trim().length < 50) continue;

        // Extract locations
        const extractedLocs = await chapterDataExtractionService.extractLocationsFromChapter(
          chapter.content,
          chapter.chapterId,
          chapter.bookId
        );

        // Extract events (for travel detection)
        const events = await chapterDataExtractionService.extractEventsFromChapter(
          chapter.content,
          chapter.chapterId,
          chapter.bookId,
          actors || []
        );

        // Process locations using data consistency service
        for (const loc of extractedLocs) {
          const locationData = {
            name: loc.name,
            type: loc.type || 'location',
            description: loc.description || '',
            isUKCity: loc.isUKCity || false,
            coordinates: getUKCityCoordinates(loc.name), // Try to get coordinates
            firstAppearance: {
              bookId: chapter.bookId,
              chapterId: chapter.chapterId
            },
            createdAt: Date.now()
          };
          
          try {
            const savedLoc = await dataConsistencyService.addLocationSafe(locationData);
            extractedLocations.push(savedLoc);
            
            // Track chapter appearances
            if (!locationChapters[savedLoc.id]) {
              locationChapters[savedLoc.id] = [];
            }
            if (!locationChapters[savedLoc.id].find(c => c.chapterId === chapter.chapterId)) {
              locationChapters[savedLoc.id].push({
                chapterId: chapter.chapterId,
                bookId: chapter.bookId,
                chapterNumber: chapter.chapterNumber
              });
            }
          } catch (error) {
            console.error('Error saving location:', error);
          }
        }

        // Process travel events
        const travelEvents = events.filter(e => e.type === 'travel');
        for (const event of travelEvents) {
          if (event.locations && event.locations.length >= 2) {
            // Create travel path between locations
            for (let i = 0; i < event.locations.length - 1; i++) {
              // Find locations in database or extracted locations
              const fromLocName = event.locations[i];
              const toLocName = event.locations[i + 1];
              
              // Try to find in current locations state
              let fromLoc = locations.find(l => 
                l.name && l.name.toLowerCase() === fromLocName.toLowerCase()
              );
              let toLoc = locations.find(l => 
                l.name && l.name.toLowerCase() === toLocName.toLowerCase()
              );
              
              // If not found, try in extracted locations
              if (!fromLoc) {
                fromLoc = extractedLocations.find(l => 
                  l.name && l.name.toLowerCase() === fromLocName.toLowerCase()
                );
              }
              if (!toLoc) {
                toLoc = extractedLocations.find(l => 
                  l.name && l.name.toLowerCase() === toLocName.toLowerCase()
                );
              }

              if (fromLoc && toLoc) {
                // Find locations by name if not found by ID
                if (!fromLoc.id) {
                  const foundFrom = await dataConsistencyService.findExistingLocation(fromLocName);
                  if (foundFrom) fromLoc = foundFrom;
                }
                if (!toLoc.id) {
                  const foundTo = await dataConsistencyService.findExistingLocation(toLocName);
                  if (foundTo) toLoc = foundTo;
                }
                
                if (fromLoc && toLoc && fromLoc.id && toLoc.id) {
                  travelPaths.push({
                    fromLocationId: fromLoc.id,
                    toLocationId: toLoc.id,
                    actorId: event.actors?.[0] || event.actorIds?.[0] || null,
                    actorName: actors?.find(a => a.id === (event.actors?.[0] || event.actorIds?.[0]))?.name || event.actors?.[0] || 'Unknown',
                    chapterId: chapter.chapterId,
                    bookId: chapter.bookId,
                    chapterNumber: chapter.chapterNumber,
                    timestamp: Date.now(),
                    description: event.description || event.title
                  });
                }
              }
            }
          }
        }
      }

      // Save travel paths using data consistency service
      for (const path of travelPaths) {
        try {
          await dataConsistencyService.addTravelSafe(path);
        } catch (error) {
          console.error('Error saving travel path:', error);
        }
      }

      setLocationChapterData(locationChapters);
      
      // Reload map data
      await loadMapData();
      
      if (extractedLocations.length > 0 || travelPaths.length > 0) {
        toastService.success(
          `Extracted ${extractedLocations.length} locations and ${travelPaths.length} travel paths from chapters.`
        );
      }
    } catch (error) {
      console.error('Error extracting locations from chapters:', error);
      toastService.error('Error extracting locations: ' + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Helper to get UK city coordinates (simplified - would need a full database)
  const getUKCityCoordinates = (cityName) => {
    const ukCities = {
      'london': { x: 530, y: 300 },
      'manchester': { x: 400, y: 250 },
      'birmingham': { x: 420, y: 280 },
      'liverpool': { x: 380, y: 240 },
      'leeds': { x: 420, y: 220 },
      'sheffield': { x: 430, y: 240 },
      'bristol': { x: 380, y: 320 },
      'newcastle': { x: 450, y: 150 },
      'edinburgh': { x: 480, y: 100 },
      'glasgow': { x: 450, y: 90 },
      'cardiff': { x: 360, y: 310 },
      'belfast': { x: 300, y: 120 },
      'oxford': { x: 450, y: 300 },
      'cambridge': { x: 500, y: 280 },
      'brighton': { x: 500, y: 330 },
      'plymouth': { x: 320, y: 380 },
      'york': { x: 440, y: 200 },
      'nottingham': { x: 440, y: 260 },
      'southampton': { x: 450, y: 340 }
    };
    
    const normalized = cityName.toLowerCase().trim();
    return ukCities[normalized] || null;
  };

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            setIsAnimating(false);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      clearInterval(animationRef.current);
    }
    return () => clearInterval(animationRef.current);
  }, [isAnimating]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [locs, travel] = await Promise.all([
        db.getAll('locations'),
        db.getAll('characterTravel')
      ]);
      
      setLocations(locs);
      setTravelRecords(travel.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(3, Math.max(0.5, prev.scale * scaleDelta))
    }));
  };

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }));
  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const cityMatches = ukCities.filter(c => c.name.toLowerCase().includes(query));
      const locationMatches = locations.filter(l => l.name?.toLowerCase().includes(query));
      setSearchResults([
        ...cityMatches.map(c => ({ ...c, type: 'city' })),
        ...locationMatches.map(l => ({ ...l, type: 'location' }))
      ].slice(0, 8));
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, locations, ukCities]);

  // Jump to location
  const jumpToLocation = (loc) => {
    const x = loc.x || loc.coordinates?.x;
    const y = loc.y || loc.coordinates?.y;
    if (x && y) {
      // Center the map on this location
      setTransform({
        x: 350 - x * 1.5,
        y: 300 - y * 1.5,
        scale: 1.5
      });
      if (loc.type === 'location') {
        setSelectedLocation(loc);
      }
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  // Filter travel by actor
  const filteredTravel = selectedActor === 'all' 
    ? travelRecords 
    : travelRecords.filter(t => t.actorName === selectedActor || t.actorId === selectedActor);

  // Get unique actors from travel
  const travelingActors = [...new Set(travelRecords.map(t => t.actorName).filter(Boolean))];

  // Get visible travel based on timeline
  const visibleTravel = filteredTravel.filter((_, idx) => {
    const progress = (idx / filteredTravel.length) * 100;
    return progress <= timelinePosition;
  });

  // Calculate heat map data
  const heatMapData = useMemo(() => {
    const eventCounts = {};
    visibleTravel.forEach(travel => {
      const toKey = travel.toLocation?.toLowerCase();
      const fromKey = travel.fromLocation?.toLowerCase();
      if (toKey) eventCounts[toKey] = (eventCounts[toKey] || 0) + 1;
      if (fromKey) eventCounts[fromKey] = (eventCounts[fromKey] || 0) + 1;
    });
    
    // Get max for normalization
    const maxCount = Math.max(...Object.values(eventCounts), 1);
    
    return { counts: eventCounts, max: maxCount };
  }, [visibleTravel]);

  // Get heat color based on intensity
  const getHeatColor = (count, max) => {
    if (!count) return 'transparent';
    const intensity = count / max;
    if (intensity < 0.25) return 'rgba(34, 197, 94, 0.3)'; // green
    if (intensity < 0.5) return 'rgba(234, 179, 8, 0.4)'; // yellow
    if (intensity < 0.75) return 'rgba(249, 115, 22, 0.5)'; // orange
    return 'rgba(239, 68, 68, 0.6)'; // red
  };

  // Get locations with events based on timeline
  const getLocationEvents = (locationId) => {
    return visibleTravel.filter(t => 
      t.toLocation === locationId || t.fromLocation === locationId
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-cyan-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-cyan-500" />
            UK STORY MAP
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {locations.length} locations • {travelRecords.length} travel records
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Animation Controls */}
          <button
            onClick={() => {
              if (!isAnimating && animationProgress >= 100) {
                setAnimationProgress(0);
              }
              setIsAnimating(!isAnimating);
            }}
            className={`p-2 rounded ${isAnimating ? 'bg-red-600' : 'bg-cyan-600'} text-white`}
            title={isAnimating ? 'Pause' : 'Animate travel paths'}
          >
            {isAnimating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Zoom Controls */}
          <button onClick={zoomOut} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={resetView} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded">
            Reset
          </button>
          <button onClick={zoomIn} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded">
            <ZoomIn className="w-5 h-5" />
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
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-3 py-1.5 rounded w-44 focus:outline-none focus:border-cyan-500"
          />
          {/* Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded shadow-xl z-50 max-h-64 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <div
                  key={`${result.name}-${idx}`}
                  onClick={() => jumpToLocation(result)}
                  className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                >
                  {result.type === 'city' ? (
                    <Navigation className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <MapPin className="w-4 h-4 text-green-400" />
                  )}
                  <div>
                    <div className="text-sm text-white">{result.name}</div>
                    <div className="text-xs text-slate-500">
                      {result.type === 'city' ? result.region : 'Story Location'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actor Filter */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 rounded"
          >
            <option value="all">All Characters</option>
            {travelingActors.map(actor => (
              <option key={actor} value={actor}>{actor}</option>
            ))}
          </select>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
          <Layers className="w-4 h-4 text-slate-500 mr-1" />
          <button
            onClick={() => setShowTravelPaths(!showTravelPaths)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
              showTravelPaths ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Show travel paths"
          >
            {showTravelPaths ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Paths
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
              showLabels ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Show city labels"
          >
            {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Cities
          </button>
          <button
            onClick={() => setShowRegions(!showRegions)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
              showRegions ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Show region names"
          >
            {showRegions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Regions
          </button>
          <button
            onClick={() => setShowHeatMap(!showHeatMap)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
              showHeatMap ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Show activity heat map"
          >
            <Thermometer className="w-3 h-3" />
            Heat
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center gap-3 min-w-[200px]">
          <Clock className="w-4 h-4 text-slate-500" />
          <input
            type="range"
            min="0"
            max="100"
            value={timelinePosition}
            onChange={(e) => setTimelinePosition(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">{timelinePosition}%</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Map Area */}
        <div 
          className="flex-1 overflow-hidden relative bg-slate-950"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-cyan-500 animate-bounce mx-auto mb-3" />
                <p className="text-slate-400">Loading map...</p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              viewBox="0 0 700 900"
              className="w-full h-full"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: 'center'
              }}
            >
              {/* Stylized UK Map Background */}
              <defs>
                <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="dropShadow">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/>
                </filter>
              </defs>

              {/* UK Outline - Stylized */}
              <g filter="url(#dropShadow)">
                {/* Scotland */}
                <path
                  d="M350,50 L420,80 L450,120 L480,100 L500,140 L480,180 L450,200 L400,180 L380,220 L350,200 L320,220 L300,180 L280,200 L260,160 L280,120 L320,100 L350,50"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                />
                
                {/* Northern England */}
                <path
                  d="M300,220 L380,220 L420,260 L480,280 L520,320 L500,380 L460,360 L400,380 L360,340 L320,360 L280,320 L260,280 L300,220"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                />
                
                {/* Wales & West */}
                <path
                  d="M280,360 L320,360 L340,400 L320,440 L280,460 L240,420 L220,380 L240,340 L280,360"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                />
                
                {/* Central England */}
                <path
                  d="M320,360 L400,380 L440,420 L480,400 L520,440 L540,500 L500,540 L440,520 L380,540 L340,500 L320,440 L340,400 L320,360"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                />
                
                {/* South England */}
                <path
                  d="M340,500 L380,540 L440,520 L500,540 L560,560 L580,600 L540,640 L480,620 L420,640 L360,620 L320,580 L300,540 L340,500"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                />
                
                {/* Cornwall */}
                <path
                  d="M260,580 L300,560 L320,580 L280,620 L240,640 L200,620 L220,580 L260,580"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                />

                {/* Northern Ireland (optional) */}
                <path
                  d="M200,220 L240,200 L280,220 L260,260 L220,280 L180,260 L200,220"
                  fill="url(#mapGradient)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.6"
                />
              </g>

              {/* Grid Lines for atmosphere */}
              <g opacity="0.1" stroke="#06b6d4" strokeWidth="0.5">
                {[...Array(10)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 90} x2="700" y2={i * 90} />
                ))}
                {[...Array(8)].map((_, i) => (
                  <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="900" />
                ))}
              </g>

              {/* Region Names */}
              {showRegions && ukRegions.map(region => (
                <text
                  key={region.name}
                  x={region.x}
                  y={region.y}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize={region.fontSize}
                  fontWeight="bold"
                  letterSpacing="2"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  {region.name.split('\n').map((line, i) => (
                    <tspan key={i} x={region.x} dy={i === 0 ? 0 : region.fontSize + 2}>
                      {line}
                    </tspan>
                  ))}
                </text>
              ))}

              {/* Heat Map Overlay */}
              {showHeatMap && ukCities.map(city => {
                const count = heatMapData.counts[city.name.toLowerCase()] || 0;
                if (count === 0) return null;
                const color = getHeatColor(count, heatMapData.max);
                const radius = 20 + (count / heatMapData.max) * 30;
                
                return (
                  <circle
                    key={`heat-${city.name}`}
                    cx={city.x}
                    cy={city.y}
                    r={radius}
                    fill={color}
                    opacity="0.7"
                  >
                    <animate
                      attributeName="r"
                      values={`${radius};${radius + 5};${radius}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}

              {/* City Markers and Labels */}
              {showLabels && ukCities.map(city => {
                const isStoryLocation = locations.some(l => 
                  l.name?.toLowerCase() === city.name.toLowerCase()
                );
                const eventCount = heatMapData.counts[city.name.toLowerCase()] || 0;
                
                return (
                  <g key={city.name}>
                    {/* City Dot */}
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={city.population === 'major' ? 4 : city.population === 'city' ? 3 : 2}
                      fill={isStoryLocation ? '#22c55e' : '#64748b'}
                      stroke="#fff"
                      strokeWidth="1"
                    />
                    {/* City Label */}
                    <text
                      x={city.x + 8}
                      y={city.y + 3}
                      fill={isStoryLocation ? '#22c55e' : '#94a3b8'}
                      fontSize={city.population === 'major' ? 10 : 8}
                      fontWeight={city.population === 'major' ? 'bold' : 'normal'}
                      style={{ fontFamily: 'sans-serif' }}
                    >
                      {city.name}
                      {eventCount > 0 && (
                        <tspan fill="#f97316" fontSize="8"> ({eventCount})</tspan>
                      )}
                    </text>
                  </g>
                );
              })}

              {/* Travel Paths */}
              {showTravelPaths && visibleTravel.map((travel, idx) => {
                const fromLoc = locations.find(l => 
                  l.id === travel.fromLocation || 
                  l.name?.toLowerCase() === travel.fromLocation?.toLowerCase()
                );
                const toLoc = locations.find(l => 
                  l.id === travel.toLocation || 
                  l.name?.toLowerCase() === travel.toLocation?.toLowerCase()
                );

                if (!fromLoc?.coordinates || !toLoc?.coordinates) return null;

                const pathProgress = isAnimating 
                  ? Math.min(100, (animationProgress - (idx / visibleTravel.length * 100)) * 2)
                  : 100;

                if (pathProgress <= 0) return null;

                // Get actor color
                const actorColors = {
                  'Pipkins': '#22c55e',
                  'Grimguff': '#ef4444',
                  'Sir Grimguff': '#ef4444'
                };
                const color = actorColors[travel.actorName] || '#06b6d4';

                return (
                  <g key={travel.id || idx}>
                    {/* Path Line */}
                    <line
                      x1={fromLoc.coordinates.x}
                      y1={fromLoc.coordinates.y}
                      x2={toLoc.coordinates.x}
                      y2={toLoc.coordinates.y}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      opacity={0.6}
                      style={{
                        strokeDashoffset: isAnimating ? 100 - pathProgress : 0,
                        transition: 'stroke-dashoffset 0.3s'
                      }}
                    />
                    {/* Direction Arrow */}
                    <circle
                      cx={fromLoc.coordinates.x + (toLoc.coordinates.x - fromLoc.coordinates.x) * (pathProgress / 100)}
                      cy={fromLoc.coordinates.y + (toLoc.coordinates.y - fromLoc.coordinates.y) * (pathProgress / 100)}
                      r="4"
                      fill={color}
                      filter="url(#glow)"
                    />
                  </g>
                );
              })}

              {/* Location Markers */}
              {locations.map(loc => {
                if (!loc.coordinates) return null;
                
                const events = getLocationEvents(loc.id);
                const isSelected = selectedLocation?.id === loc.id;
                const hasActivity = events.length > 0;

                return (
                  <g
                    key={loc.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(loc);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulse animation for active locations */}
                    {hasActivity && (
                      <circle
                        cx={loc.coordinates.x}
                        cy={loc.coordinates.y}
                        r="15"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        opacity="0.5"
                      >
                        <animate
                          attributeName="r"
                          values="10;20;10"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;0;0.5"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    
                    {/* Main Marker */}
                    <circle
                      cx={loc.coordinates.x}
                      cy={loc.coordinates.y}
                      r={isSelected ? 12 : hasActivity ? 10 : 8}
                      fill={isSelected ? '#06b6d4' : hasActivity ? '#22c55e' : '#64748b'}
                      stroke="#fff"
                      strokeWidth="2"
                      filter="url(#glow)"
                    />
                    
                    {/* Location Name */}
                    <text
                      x={loc.coordinates.x}
                      y={loc.coordinates.y - 15}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="12"
                      fontWeight="bold"
                      style={{ textShadow: '0 0 4px #000' }}
                    >
                      {loc.name}
                    </text>

                    {/* Event Count Badge */}
                    {events.length > 0 && (
                      <g>
                        <circle
                          cx={loc.coordinates.x + 10}
                          cy={loc.coordinates.y - 10}
                          r="8"
                          fill="#ef4444"
                        />
                        <text
                          x={loc.coordinates.x + 10}
                          y={loc.coordinates.y - 7}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {events.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(20, 720)">
                <rect x="0" y="0" width="180" height={showHeatMap ? 140 : 100} fill="#0f172a" stroke="#334155" rx="5" opacity="0.9" />
                <text x="10" y="20" fill="#fff" fontSize="12" fontWeight="bold">Legend</text>
                <circle cx="20" cy="40" r="6" fill="#22c55e" />
                <text x="35" y="43" fill="#94a3b8" fontSize="10">Story Location</text>
                <circle cx="20" cy="58" r="6" fill="#64748b" />
                <text x="35" y="61" fill="#94a3b8" fontSize="10">Reference City</text>
                <line x1="10" y1="76" x2="30" y2="76" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4,2" />
                <text x="35" y="79" fill="#94a3b8" fontSize="10">Travel Path</text>
                
                {/* Heat map legend */}
                {showHeatMap && (
                  <g transform="translate(0, 20)">
                    <text x="10" y="85" fill="#fff" fontSize="10">Activity:</text>
                    <rect x="60" y="78" width="15" height="10" fill="rgba(34, 197, 94, 0.5)" />
                    <rect x="78" y="78" width="15" height="10" fill="rgba(234, 179, 8, 0.5)" />
                    <rect x="96" y="78" width="15" height="10" fill="rgba(249, 115, 22, 0.5)" />
                    <rect x="114" y="78" width="15" height="10" fill="rgba(239, 68, 68, 0.5)" />
                    <text x="60" y="100" fill="#94a3b8" fontSize="8">Low</text>
                    <text x="114" y="100" fill="#94a3b8" fontSize="8">High</text>
                  </g>
                )}
              </g>

              {/* Mini Map */}
              <g transform="translate(570, 720)">
                <rect x="0" y="0" width="100" height="80" fill="#0f172a" stroke="#334155" rx="5" opacity="0.9" />
                <text x="5" y="15" fill="#64748b" fontSize="8">Mini Map</text>
                {/* Simplified UK outline */}
                <path
                  d="M40,20 L55,25 L60,35 L55,50 L50,60 L40,65 L35,55 L30,50 L35,40 L40,30 L40,20"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1"
                  opacity="0.5"
                  transform="scale(0.8) translate(10, 5)"
                />
                {/* Viewport indicator */}
                <rect
                  x={30 - transform.x / 20}
                  y={30 - transform.y / 20}
                  width={40 / transform.scale}
                  height={30 / transform.scale}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1"
                />
              </g>
            </svg>
          )}
        </div>

        {/* Location Detail Panel */}
        {selectedLocation && (
          <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                {selectedLocation.name}
              </h3>
              <button onClick={() => setSelectedLocation(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Description */}
              {selectedLocation.description && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">DESCRIPTION</div>
                  <p className="text-sm text-slate-300">{selectedLocation.description}</p>
                </div>
              )}

              {/* Characters Visited */}
              {selectedLocation.charactersVisited?.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">CHARACTERS VISITED</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.charactersVisited.map((char, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline at Location */}
              <div>
                <div className="text-xs text-slate-500 mb-2">LOCATION TIMELINE</div>
                <div className="space-y-2">
                  {getLocationEvents(selectedLocation.id).map((travel, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span className="text-sm text-white">{travel.actorName}</span>
                        </div>
                        {travel.chapterId && travel.bookId && (
                          <button
                            onClick={() => chapterNavigationService.navigateToChapter(travel.bookId, travel.chapterId)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            title="Navigate to chapter"
                          >
                            Ch {travel.chapterNumber || '?'}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {travel.fromLocation === selectedLocation.id || travel.fromLocation === selectedLocation.name
                          ? `Departed to ${travel.toLocation}`
                          : `Arrived from ${travel.fromLocation || 'unknown'}`
                        }
                      </div>
                      {travel.description && (
                        <div className="text-xs text-slate-500 mt-1 italic">
                          "{travel.description.substring(0, 100)}..."
                        </div>
                      )}
                    </div>
                  ))}
                  {getLocationEvents(selectedLocation.id).length === 0 && (
                    <div className="text-xs text-slate-500 text-center py-4">
                      No recorded events at this location
                    </div>
                  )}
                </div>
              </div>

              {/* Chapter Appearances */}
              {locationChapterData[selectedLocation.id] && locationChapterData[selectedLocation.id].length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">APPEARS IN CHAPTERS</div>
                  <div className="flex flex-wrap gap-2">
                    {locationChapterData[selectedLocation.id].slice(0, 10).map((ch, idx) => (
                      <button
                        key={idx}
                        onClick={() => chapterNavigationService.navigateToChapter(ch.bookId, ch.chapterId)}
                        className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
                      >
                        Ch {ch.chapterNumber}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                    {locationChapterData[selectedLocation.id].length > 10 && (
                      <span className="text-xs text-slate-500">+{locationChapterData[selectedLocation.id].length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* First Appearance */}
              {selectedLocation.firstAppearance && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">FIRST APPEARANCE</div>
                  <button
                    onClick={() => chapterNavigationService.navigateToChapter(
                      selectedLocation.firstAppearance.bookId,
                      selectedLocation.firstAppearance.chapterId
                    )}
                    className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    Book {selectedLocation.firstAppearance.bookId}, Chapter {selectedLocation.firstAppearance.chapterId}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Coordinates */}
              {selectedLocation.realCoords && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">COORDINATES</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {selectedLocation.realCoords.lat?.toFixed(4)}, {selectedLocation.realCoords.lng?.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UKMapVisualization;
