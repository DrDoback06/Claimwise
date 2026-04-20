import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Swords, MessageSquare, BookOpen, Save, X, Plus, Trash2 } from 'lucide-react';
import db from '../services/database';
import storyBrain from '../services/storyBrain';
import { addStashItem } from '../services/weaverStashService';
import toastService from '../services/toastService';

/**
 * Chapter Templates System
 * Pre-built templates for different chapter types (action, dialogue, exposition, etc.)
 */
const ChapterTemplates = ({ onApplyTemplate, onClose, currentChapter = null }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const saved = await db.getAll('chapterTemplates') || [];
      setCustomTemplates(saved);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Pre-built templates
  const builtInTemplates = [
    {
      id: 'action_scene',
      name: 'Action Scene',
      description: 'High-energy action sequence with fast pacing',
      icon: Swords,
      color: 'red',
      structure: `## Opening Hook
[Start with immediate action or tension]

## Rising Action
[Build intensity, introduce obstacles]

## Climax
[Peak action moment, confrontation]

## Resolution
[Consequence or transition to next scene]`,
      tips: [
        'Use short, punchy sentences for urgency',
        'Focus on sensory details (sounds, impacts, movement)',
        'Keep dialogue minimal during action',
        'Vary sentence length for rhythm'
      ]
    },
    {
      id: 'dialogue_heavy',
      name: 'Dialogue-Heavy Scene',
      description: 'Character-driven conversation and banter',
      icon: MessageSquare,
      color: 'blue',
      structure: `## Scene Setup
[Brief context and setting]

## Opening Exchange
[Initial dialogue that hooks the reader]

## Core Conversation
[Main dialogue with character voice, subtext, and conflict]

## Closing Beat
[Punchline, revelation, or transition]`,
      tips: [
        'Give each character a distinct voice',
        'Use dialogue tags sparingly',
        'Include action beats between lines',
        'Let subtext drive the conversation',
        'Vary dialogue length and rhythm'
      ]
    },
    {
      id: 'exposition',
      name: 'Exposition & World-Building',
      description: 'Information delivery and world exploration',
      icon: BookOpen,
      color: 'purple',
      structure: `## Information Hook
[Interesting way to introduce the information]

## Core Exposition
[Deliver information through character experience or discovery]

## Integration
[Connect information to current plot or character]

## Transition
[Move into action or dialogue]`,
      tips: [
        'Show, don\'t tell - reveal through action',
        'Use character perspective to filter information',
        'Break up dense info with dialogue or action',
        'Make exposition serve the plot',
        'Use sensory details to ground the reader'
      ]
    },
    {
      id: 'character_development',
      name: 'Character Development',
      description: 'Deep dive into character thoughts and growth',
      icon: Sparkles,
      color: 'green',
      structure: `## Internal State
[Character's current emotional/mental state]

## Reflection
[Character processing events or decisions]

## Insight
[Revelation or understanding]

## Forward Movement
[How this changes the character going forward]`,
      tips: [
        'Balance internal monologue with external action',
        'Use specific memories or moments',
        'Show vulnerability and complexity',
        'Connect internal state to external behavior',
        'Avoid pure introspection - ground in scene'
      ]
    },
    {
      id: 'transition',
      name: 'Transition Chapter',
      description: 'Moving between major plot points',
      icon: FileText,
      color: 'yellow',
      structure: `## Closing Previous Arc
[Wrap up or acknowledge previous events]

## Journey/Transition
[Movement, travel, or time passage]

## Setting Up Next Arc
[Hints, foreshadowing, or new goal introduction]

## Chapter End Hook
[Cliffhanger or compelling question]`,
      tips: [
        'Use transitions to show character relationships',
        'Don\'t skip important emotional beats',
        'Use travel/journey for world-building',
        'Set up future conflicts or goals',
        'Keep pacing - transitions shouldn\'t drag'
      ]
    }
  ];

  const allTemplates = [...builtInTemplates, ...customTemplates];

  const handleApplyTemplate = async (template) => {
    if (!onApplyTemplate) return;

    try {
      // If template has AI generation capability, offer to enhance it
      const shouldEnhance = window.confirm(
        `Apply "${template.name}" template?\n\n` +
        `Would you like AI to generate content based on this template structure?`
      );

      if (shouldEnhance) {
        // Route through storyBrain so the generated prose inherits the book's
        // style reference, chapter memories, genre guide and writer
        // preferences (same pipeline as Continue Writing). Without this the
        // template produces off-style filler.
        const extraContext = await buildTemplateContext();
        const userPrompt = `Write a new chapter that follows this template structure. Keep every section heading exactly as given and fill each with prose in the book's own voice.

TEMPLATE STRUCTURE:
${template.structure}

Do NOT introduce unrelated characters, settings, or worlds; only use the story's existing canon.`;

        const additionalInstructions = [
          'TEMPLATE TIPS:',
          ...template.tips.map((t) => `- ${t}`),
          '',
          extraContext ? `EXTRA CONTEXT:\n${extraContext}` : '',
        ].filter(Boolean).join('\n');

        const generated = await storyBrain.generateProse({
          action: 'scene',
          userPrompt,
          additionalInstructions,
          bookId: currentChapter?.bookId || null,
          chapterId: currentChapter?.id || null,
          chapterNumber: currentChapter?.number || null,
        });

        // Per user request: template outputs live in the Weaver Stash until
        // the author explicitly brings them over. We stash here and close
        // the template modal; the stash drawer on the right pane shows it.
        try {
          await addStashItem({
            title: `Template: ${template.name}`,
            content: generated,
            source: 'template',
            bookId: currentChapter?.bookId || null,
            chapterId: currentChapter?.id || null,
            meta: { templateId: template.id, templateName: template.name },
          });
          toastService.success(`"${template.name}" draft saved to Weaver Stash.`);
        } catch (stashErr) {
          console.warn('[ChapterTemplates] Could not stash draft, falling back to direct apply:', stashErr);
          onApplyTemplate({
            ...template,
            generatedContent: generated,
            source: 'template',
          });
          return;
        }

        // Close the modal without inserting into the chapter.
        onClose?.();
      } else {
        // Just apply the structure
        onApplyTemplate({
          ...template,
          generatedContent: template.structure
        });
      }
    } catch (error) {
      console.error('Error applying template:', error);
      // Fallback: just apply structure
      onApplyTemplate({
        ...template,
        generatedContent: template.structure
      });
    }
  };

  const buildTemplateContext = async () => {
    try {
      const storyProfile = await db.get('storyProfile', 'current');
      const currentBook = currentChapter ? await db.get('books', currentChapter.bookId) : null;
      const previousChapter = currentBook && currentChapter 
        ? currentBook.chapters.find(c => c.number === (currentChapter.number - 1))
        : null;

      let context = '';
      if (storyProfile) {
        context += `Story: ${storyProfile.title || 'Untitled'}\n`;
        context += `Premise: ${storyProfile.premise || 'N/A'}\n`;
      }
      if (currentChapter) {
        context += `Current Chapter: ${currentChapter.title || `Chapter ${currentChapter.number}`}\n`;
      }
      if (previousChapter) {
        context += `Previous Chapter Summary: ${previousChapter.desc || previousChapter.content?.substring(0, 200) || 'N/A'}\n`;
      }

      return context || 'No additional context available.';
    } catch (error) {
      console.error('Error building template context:', error);
      return 'Context unavailable.';
    }
  };

  const handleSaveCustomTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      alert('Please provide both a name and content for the template');
      return;
    }

    try {
      const newTemplate = {
        id: `custom_${Date.now()}`,
        name: newTemplateName.trim(),
        description: 'Custom template',
        icon: FileText,
        color: 'gray',
        structure: newTemplateContent.trim(),
        tips: [],
        isCustom: true,
        createdAt: Date.now()
      };

      await db.add('chapterTemplates', newTemplate);
      await loadTemplates();
      setNewTemplateName('');
      setNewTemplateContent('');
      setShowCustomForm(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const handleDeleteCustomTemplate = async (templateId) => {
    if (!window.confirm('Delete this custom template?')) return;

    try {
      await db.delete('chapterTemplates', templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <div className="fixed inset-0 lw-z-modal bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-green-500/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-500" />
              Chapter Templates
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Choose a template to structure your chapter
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Built-in Templates */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Built-in Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {builtInTemplates.map(template => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className={`bg-slate-950 border-2 rounded-lg p-4 cursor-pointer transition-all
                      ${selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-900/10'
                        : 'border-slate-800 hover:border-slate-700'
                      }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded bg-${template.color}-600/20`}>
                        <Icon className={`w-5 h-5 text-${template.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-1">{template.name}</h4>
                        <p className="text-sm text-slate-400">{template.description}</p>
                      </div>
                    </div>
                    
                    {selectedTemplate?.id === template.id && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="mb-3">
                          <div className="text-xs text-slate-400 font-bold mb-2">Structure:</div>
                          <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                            {template.structure}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-bold mb-2">Tips:</div>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {template.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Templates */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Custom Templates</h3>
              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 
                  text-white text-xs font-bold rounded"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>

            {showCustomForm && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4">
                <div className="mb-3">
                  <label className="text-xs text-slate-400 block mb-1">Template Name</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded text-sm"
                    placeholder="e.g., Flashback Scene"
                  />
                </div>
                <div className="mb-3">
                  <label className="text-xs text-slate-400 block mb-1">Template Structure</label>
                  <textarea
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded text-sm font-mono"
                    rows={8}
                    placeholder="Enter the template structure here..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCustomTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 
                      text-white text-sm font-bold rounded"
                  >
                    <Save className="w-4 h-4" />
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomForm(false);
                      setNewTemplateName('');
                      setNewTemplateContent('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {customTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`bg-slate-950 border-2 rounded-lg p-4 cursor-pointer transition-all
                      ${selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-900/10'
                        : 'border-slate-800 hover:border-slate-700'
                      }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{template.name}</h4>
                        <p className="text-xs text-slate-500">Custom Template</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTemplate(template.id);
                        }}
                        className="p-1 hover:bg-red-900/20 rounded text-slate-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {selectedTemplate?.id === template.id && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="text-xs text-slate-400 font-bold mb-2">Structure:</div>
                        <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                          {template.structure}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No custom templates yet. Create one to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedTemplate && handleApplyTemplate(selectedTemplate)}
            disabled={!selectedTemplate}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 
              disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded
              flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterTemplates;
