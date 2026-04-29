import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Save, Star, Clock } from 'lucide-react';
import db from '../services/database';

/**
 * Search & Filter - Advanced search across all entities
 */
const SearchFilter = ({ items, skills, actors, stats, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityType, setEntityType] = useState('all'); // 'all' | 'items' | 'skills' | 'actors' | 'stats'
  const [filters, setFilters] = useState({
    rarity: '',
    type: '',
    tier: '',
    class: '',
    isCore: null
  });
  const [savedPresets, setSavedPresets] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    loadPresets();
    performSearch();
  }, [searchTerm, entityType, filters]);

  const loadPresets = async () => {
    try {
      const presets = JSON.parse(localStorage.getItem('searchPresets') || '[]');
      setSavedPresets(presets);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const performSearch = () => {
    let allResults = [];

    if (entityType === 'all' || entityType === 'items') {
      allResults = [...allResults, ...items.map(item => ({ ...item, entityType: 'item' }))];
    }
    if (entityType === 'all' || entityType === 'skills') {
      allResults = [...allResults, ...skills.map(skill => ({ ...skill, entityType: 'skill' }))];
    }
    if (entityType === 'all' || entityType === 'actors') {
      allResults = [...allResults, ...actors.map(actor => ({ ...actor, entityType: 'actor' }))];
    }
    if (entityType === 'all' || entityType === 'stats') {
      allResults = [...allResults, ...stats.map(stat => ({ ...stat, entityType: 'stat' }))];
    }

    // Apply search term
    if (searchTerm) {
      allResults = allResults.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.rarity) {
      allResults = allResults.filter(item => item.rarity === filters.rarity);
    }
    if (filters.type) {
      allResults = allResults.filter(item => item.type === filters.type);
    }
    if (filters.tier) {
      allResults = allResults.filter(item => item.tier === Number(filters.tier));
    }
    if (filters.class) {
      allResults = allResults.filter(item => item.class === filters.class);
    }
    if (filters.isCore !== null) {
      allResults = allResults.filter(item => item.isCore === filters.isCore);
    }

    setResults(allResults);
  };

  const savePreset = () => {
    const preset = {
      id: `preset_${Date.now()}`,
      name: prompt('Preset name:') || 'Unnamed Preset',
      searchTerm,
      entityType,
      filters,
      timestamp: Date.now()
    };

    const updated = [...savedPresets, preset];
    localStorage.setItem('searchPresets', JSON.stringify(updated));
    setSavedPresets(updated);
  };

  const loadPreset = (preset) => {
    setSearchTerm(preset.searchTerm);
    setEntityType(preset.entityType);
    setFilters(preset.filters);
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'item': return '📦';
      case 'skill': return '⚡';
      case 'actor': return '👤';
      case 'stat': return '📊';
      default: return '📄';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Search className="mr-3 text-green-500" />
            SEARCH & FILTER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Advanced search across all entities</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Filters Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs text-slate-400 block mb-2">ENTITY TYPE</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
            >
              <option value="all">All Entities</option>
              <option value="items">Items</option>
              <option value="skills">Skills</option>
              <option value="actors">Actors</option>
              <option value="stats">Stats</option>
            </select>
          </div>

          {entityType === 'all' || entityType === 'items' ? (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-2">RARITY</label>
                <select
                  value={filters.rarity}
                  onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                >
                  <option value="">All Rarities</option>
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Cursed">Cursed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">TYPE</label>
                <input
                  type="text"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  placeholder="Weapon, Armor, etc."
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                />
              </div>
            </>
          ) : null}

          {entityType === 'all' || entityType === 'skills' ? (
            <div>
              <label className="text-xs text-slate-400 block mb-2">TIER</label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
                <option value="5">Tier 5</option>
              </select>
            </div>
          ) : null}

          {entityType === 'all' || entityType === 'actors' ? (
            <div>
              <label className="text-xs text-slate-400 block mb-2">CLASS</label>
              <select
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
              >
                <option value="">All Classes</option>
                <option value="Protagonist">Protagonist</option>
                <option value="Ally">Ally</option>
                <option value="NPC">NPC</option>
                <option value="Threat">Threat</option>
              </select>
            </div>
          ) : null}

          {entityType === 'all' || entityType === 'stats' ? (
            <div>
              <label className="text-xs text-slate-400 block mb-2">CORE STAT</label>
              <select
                value={filters.isCore === null ? '' : filters.isCore ? 'true' : 'false'}
                onChange={(e) => setFilters({ ...filters, isCore: e.target.value === '' ? null : e.target.value === 'true' })}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
              >
                <option value="">All Stats</option>
                <option value="true">Core Only</option>
                <option value="false">Additional Only</option>
              </select>
            </div>
          ) : null}

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={savePreset}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              SAVE PRESET
            </button>
          </div>

          {savedPresets.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 font-bold mb-2">SAVED PRESETS</div>
              <div className="space-y-2">
                {savedPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => loadPreset(preset)}
                    className="w-full text-left bg-slate-950 p-2 rounded border border-slate-800 hover:border-slate-700 text-xs text-white"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 flex flex-col">
          {/* Search Bar */}
          <div className="bg-slate-900 border-b border-slate-800 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, description..."
                className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item, index) => (
                <button
                  key={item.id || index}
                  onClick={() => onSelect && onSelect(item)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-green-500/50 transition-all text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getEntityIcon(item.entityType)}</span>
                      <div className="text-white font-bold">{item.name || item.title}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{item.entityType.toUpperCase()}</div>
                  <div className="text-sm text-slate-300 line-clamp-2">
                    {item.desc || item.description || 'No description'}
                  </div>
                  {item.rarity && (
                    <div className="mt-2 text-xs text-yellow-400">{item.rarity}</div>
                  )}
                </button>
              ))}
            </div>
            {results.length === 0 && (
              <div className="text-center text-slate-500 mt-20">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;

