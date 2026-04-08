import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Package,
  Target,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ChapterMoodSliders, { defaultPresets } from './ChapterMoodSliders';
import contextEngine from '../services/contextEngine';
import aiService from '../services/aiService';
import storyBrain from '../services/storyBrain';
import promptTemplates from '../services/promptTemplates';

/**
 * Chapter Planning Overlay Component
 * Canvas-style planning that appears in the text area before generation
 */
const ChapterPlanningOverlay = ({
  bookId,
  chapterNumber,
  onApprove,
  onCancel,
  existingPlan = null
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [error, setError] = useState(null);

  // Plan state
  const [plan, setPlan] = useState(existingPlan || {
    chapterNumber,
    suggestedTitle: '',
    actorsToUse: [],
    suggestedNewActors: [],
    plotBeatsToAddress: [],
    itemsInPlay: [],
    chapterOutline: [],
    connectionToPrevious: '',
    setupForNext: ''
  });

  // Mood sliders
  const [moodSliders, setMoodSliders] = useState({
    comedy_horror: 60,
    action_dialogue: 50,
    pacing: 50,
    tone: 40,
    detail: 60,
    emotional: 50,
    despair: 30,
    tension: 40
  });

  // Available entities
  const [availableActors, setAvailableActors] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [context, setContext] = useState(null);

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    actors: true,
    items: true,
    beats: true,
    outline: true,
    mood: true
  });
  const [editingField, setEditingField] = useState(null);

  useEffect(() => {
    loadContext();
  }, [bookId, chapterNumber]);

  const loadContext = async () => {
    setIsLoading(true);
    try {
      const ctx = await contextEngine.assembleChapterContext(bookId, chapterNumber);
      setContext(ctx);
      setAvailableActors(ctx.availableActors || []);
      setAvailableItems(ctx.availableItems || []);

      // Auto-generate plan if none exists
      if (!existingPlan) {
        await generatePlan(ctx);
      }
    } catch (error) {
      console.error('Error loading context:', error);
      setError('Failed to load story context');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlan = async (ctx = context) => {
    if (!ctx) return;
    
    setIsGeneratingPlan(true);
    setError(null);

    try {
      const planPrompt = contextEngine.buildPlanningPrompt(ctx, moodSliders);
      // Use storyBrain for planning context (includes arc guidance, chapter memories, genre guides)
      const { systemContext } = await storyBrain.getContext({
        text: '',
        chapterNumber,
        bookId: ctx?.bookId || null,
        chapterId: ctx?.chapterId || null,
        action: 'planning'
      });
      const craft = storyBrain.getCraftDirective('planning');
      const system = `You are a story consultant planning the next chapter.\n\n${craft}\n\n${systemContext}`;
      const response = await aiService.callAI(planPrompt, 'creative', system);

      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setPlan(prev => ({
          ...prev,
          ...parsed,
          chapterNumber
        }));

        // Update mood sliders if suggested
        if (parsed.suggestedMood) {
          setMoodSliders(prev => ({ ...prev, ...parsed.suggestedMood }));
        }
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setError('Failed to generate chapter plan. You can still edit manually.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const addActorToPlan = (actor) => {
    if (!plan.actorsToUse.find(a => a.name === actor.name)) {
      setPlan(prev => ({
        ...prev,
        actorsToUse: [...prev.actorsToUse, {
          name: actor.name,
          id: actor.id,
          currentState: 'From previous chapter',
          roleInChapter: 'To be determined',
          isNew: false
        }]
      }));
    }
  };

  const removeActorFromPlan = (actorName) => {
    setPlan(prev => ({
      ...prev,
      actorsToUse: prev.actorsToUse.filter(a => a.name !== actorName)
    }));
  };

  const addNewActorSuggestion = () => {
    setPlan(prev => ({
      ...prev,
      suggestedNewActors: [...prev.suggestedNewActors, {
        name: 'New Character',
        description: '',
        purpose: ''
      }]
    }));
  };

  const updateActorRole = (index, role) => {
    setPlan(prev => {
      const updated = [...prev.actorsToUse];
      updated[index] = { ...updated[index], roleInChapter: role };
      return { ...prev, actorsToUse: updated };
    });
  };

  const addItemToPlan = (item) => {
    if (!plan.itemsInPlay.find(i => i.item === item.name)) {
      setPlan(prev => ({
        ...prev,
        itemsInPlay: [...prev.itemsInPlay, {
          item: item.name,
          id: item.id,
          holder: 'Unknown',
          relevance: 'May be used'
        }]
      }));
    }
  };

  const removeItemFromPlan = (itemName) => {
    setPlan(prev => ({
      ...prev,
      itemsInPlay: prev.itemsInPlay.filter(i => i.item !== itemName)
    }));
  };

  const addPlotBeat = () => {
    setPlan(prev => ({
      ...prev,
      plotBeatsToAddress: [...prev.plotBeatsToAddress, {
        beat: 'New plot beat',
        howToAddress: ''
      }]
    }));
  };

  const removePlotBeat = (index) => {
    setPlan(prev => ({
      ...prev,
      plotBeatsToAddress: prev.plotBeatsToAddress.filter((_, i) => i !== index)
    }));
  };

  const addSceneToOutline = () => {
    setPlan(prev => ({
      ...prev,
      chapterOutline: [...prev.chapterOutline, {
        scene: prev.chapterOutline.length + 1,
        description: '',
        purpose: '',
        characters: [],
        mood: ''
      }]
    }));
  };

  const removeScene = (index) => {
    setPlan(prev => ({
      ...prev,
      chapterOutline: prev.chapterOutline.filter((_, i) => i !== index)
    }));
  };

  const handleApprove = () => {
    onApprove?.({
      plan,
      moodSliders,
      context
    });
  };

  const renderSectionHeader = (title, section, icon, count) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-white">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading story context...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-amber-500/30 overflow-hidden">
      {/* Header */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-amber-400">
              Chapter {chapterNumber} Planning
            </h3>
            <p className="text-sm text-slate-400">
              Review and edit the plan before generating
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generatePlan()}
              disabled={isGeneratingPlan}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
            >
              {isGeneratingPlan ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="m-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Chapter Title */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Chapter Title</label>
          <input
            type="text"
            value={plan.suggestedTitle}
            onChange={(e) => setPlan(prev => ({ ...prev, suggestedTitle: e.target.value }))}
            placeholder="Enter chapter title..."
            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-amber-500"
          />
        </div>

        {/* Actors Section */}
        <div className="space-y-2">
          {renderSectionHeader('Actors', 'actors', <Users className="w-4 h-4 text-blue-400" />, plan.actorsToUse.length)}
          
          {expandedSections.actors && (
            <div className="pl-4 space-y-2">
              {/* Selected actors */}
              {plan.actorsToUse.map((actor, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                  <span className="text-white font-medium">{actor.name}</span>
                  <input
                    type="text"
                    value={actor.roleInChapter}
                    onChange={(e) => updateActorRole(idx, e.target.value)}
                    placeholder="Role in chapter..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
                  />
                  <button
                    onClick={() => removeActorFromPlan(actor.name)}
                    className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add actor dropdown */}
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    const actor = availableActors.find(a => a.id === e.target.value);
                    if (actor) addActorToPlan(actor);
                    e.target.value = '';
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg"
                  defaultValue=""
                >
                  <option value="" disabled>Add existing actor...</option>
                  {availableActors
                    .filter(a => !plan.actorsToUse.find(p => p.name === a.name))
                    .map(actor => (
                      <option key={actor.id} value={actor.id}>{actor.name}</option>
                    ))
                  }
                </select>
                <button
                  onClick={addNewActorSuggestion}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* New actor suggestions */}
              {plan.suggestedNewActors?.map((actor, idx) => (
                <div key={idx} className="p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">NEW</span>
                    <input
                      type="text"
                      value={actor.name}
                      onChange={(e) => {
                        const updated = [...plan.suggestedNewActors];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setPlan(prev => ({ ...prev, suggestedNewActors: updated }));
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm"
                    />
                    <button
                      onClick={() => setPlan(prev => ({
                        ...prev,
                        suggestedNewActors: prev.suggestedNewActors.filter((_, i) => i !== idx)
                      }))}
                      className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={actor.purpose}
                    onChange={(e) => {
                      const updated = [...plan.suggestedNewActors];
                      updated[idx] = { ...updated[idx], purpose: e.target.value };
                      setPlan(prev => ({ ...prev, suggestedNewActors: updated }));
                    }}
                    placeholder="Why introduce them?"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="space-y-2">
          {renderSectionHeader('Items', 'items', <Package className="w-4 h-4 text-purple-400" />, plan.itemsInPlay.length)}
          
          {expandedSections.items && (
            <div className="pl-4 space-y-2">
              {plan.itemsInPlay.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                  <span className="text-purple-300">{item.item}</span>
                  <input
                    type="text"
                    value={item.relevance}
                    onChange={(e) => {
                      const updated = [...plan.itemsInPlay];
                      updated[idx] = { ...updated[idx], relevance: e.target.value };
                      setPlan(prev => ({ ...prev, itemsInPlay: updated }));
                    }}
                    placeholder="How it's used..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
                  />
                  <button
                    onClick={() => removeItemFromPlan(item.item)}
                    className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <select
                onChange={(e) => {
                  const item = availableItems.find(i => i.id === e.target.value);
                  if (item) addItemToPlan(item);
                  e.target.value = '';
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg"
                defaultValue=""
              >
                <option value="" disabled>Add item...</option>
                {availableItems
                  .filter(i => !plan.itemsInPlay.find(p => p.item === i.name))
                  .map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))
                }
              </select>
            </div>
          )}
        </div>

        {/* Plot Beats Section */}
        <div className="space-y-2">
          {renderSectionHeader('Plot Beats', 'beats', <Target className="w-4 h-4 text-amber-400" />, plan.plotBeatsToAddress.length)}
          
          {expandedSections.beats && (
            <div className="pl-4 space-y-2">
              {plan.plotBeatsToAddress.map((beat, idx) => (
                <div key={idx} className="p-2 bg-slate-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono text-sm">#{idx + 1}</span>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={beat.beat}
                        onChange={(e) => {
                          const updated = [...plan.plotBeatsToAddress];
                          updated[idx] = { ...updated[idx], beat: e.target.value };
                          setPlan(prev => ({ ...prev, plotBeatsToAddress: updated }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={beat.howToAddress}
                        onChange={(e) => {
                          const updated = [...plan.plotBeatsToAddress];
                          updated[idx] = { ...updated[idx], howToAddress: e.target.value };
                          setPlan(prev => ({ ...prev, plotBeatsToAddress: updated }));
                        }}
                        placeholder="How to address this..."
                        className="w-full bg-slate-900 border border-slate-700 text-slate-400 px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removePlotBeat(idx)}
                      className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addPlotBeat}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Plot Beat
              </button>
            </div>
          )}
        </div>

        {/* Scene Outline */}
        <div className="space-y-2">
          {renderSectionHeader('Scene Outline', 'outline', <Edit3 className="w-4 h-4 text-green-400" />, plan.chapterOutline.length)}
          
          {expandedSections.outline && (
            <div className="pl-4 space-y-2">
              {plan.chapterOutline.map((scene, idx) => (
                <div key={idx} className="p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-medium">Scene {scene.scene}</span>
                    <button
                      onClick={() => removeScene(idx)}
                      className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={scene.description}
                    onChange={(e) => {
                      const updated = [...plan.chapterOutline];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setPlan(prev => ({ ...prev, chapterOutline: updated }));
                    }}
                    placeholder="What happens in this scene..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={scene.mood || ''}
                      onChange={(e) => {
                        const updated = [...plan.chapterOutline];
                        updated[idx] = { ...updated[idx], mood: e.target.value };
                        setPlan(prev => ({ ...prev, chapterOutline: updated }));
                      }}
                      placeholder="Mood..."
                      className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={scene.purpose || ''}
                      onChange={(e) => {
                        const updated = [...plan.chapterOutline];
                        updated[idx] = { ...updated[idx], purpose: e.target.value };
                        setPlan(prev => ({ ...prev, chapterOutline: updated }));
                      }}
                      placeholder="Purpose..."
                      className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded text-sm"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addSceneToOutline}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Scene
              </button>
            </div>
          )}
        </div>

        {/* Mood Sliders */}
        <div className="space-y-2">
          {renderSectionHeader('Chapter Mood', 'mood', <Sparkles className="w-4 h-4 text-amber-400" />)}
          
          {expandedSections.mood && (
            <div className="pl-4">
              <ChapterMoodSliders
                values={moodSliders}
                onChange={setMoodSliders}
                presets={defaultPresets}
                compact={false}
              />
            </div>
          )}
        </div>

        {/* Connection notes */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Connection to Previous Chapter</label>
            <textarea
              value={plan.connectionToPrevious}
              onChange={(e) => setPlan(prev => ({ ...prev, connectionToPrevious: e.target.value }))}
              placeholder="How does this chapter connect to the previous one?"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Setup for Next Chapter</label>
            <textarea
              value={plan.setupForNext}
              onChange={(e) => setPlan(prev => ({ ...prev, setupForNext: e.target.value }))}
              placeholder="What does this chapter set up for the future?"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApprove}
          className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
        >
          <Check className="w-5 h-5" />
          Approve & Generate
        </button>
      </div>
    </div>
  );
};

export default ChapterPlanningOverlay;
