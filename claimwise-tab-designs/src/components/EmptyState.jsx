import React from 'react';
import { 
  FileText, Users, Package, Zap, BookOpen, 
  Target, Search, Sparkles, AlertCircle, Plus 
} from 'lucide-react';

/**
 * EmptyState - Consistent empty states with helpful CTAs
 */

const EmptyState = ({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration = null,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {illustration ? (
        illustration
      ) : (
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
          <Icon className="w-12 h-12 text-slate-600" />
        </div>
      )}
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{description}</p>
      
      {onAction && actionLabel && (
        <div className="flex items-center gap-3">
          <button
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const EmptyChapters = ({ onCreateChapter }) => (
  <EmptyState
    icon={BookOpen}
    title="No chapters yet"
    description="Start writing your story by creating your first chapter. You can add plot beats, characters, and build your world as you go."
    actionLabel="Create First Chapter"
    onAction={onCreateChapter}
  />
);

export const EmptyActors = ({ onAddActor }) => (
  <EmptyState
    icon={Users}
    title="No characters yet"
    description="Add characters to your story universe. Track their stats, skills, relationships, and development throughout your narrative."
    actionLabel="Add First Character"
    onAction={onAddActor}
  />
);

export const EmptyItems = ({ onAddItem }) => (
  <EmptyState
    icon={Package}
    title="No items yet"
    description="Create items, weapons, artifacts, and equipment for your story. Link them to characters and track their effects."
    actionLabel="Create First Item"
    onAction={onAddItem}
  />
);

export const EmptySkills = ({ onAddSkill }) => (
  <EmptyState
    icon={Zap}
    title="No skills yet"
    description="Build a skill system for your characters. Create skill trees, prerequisites, and track character progression."
    actionLabel="Create First Skill"
    onAction={onAddSkill}
  />
);

export const EmptyPlotBeats = ({ onAddBeat }) => (
  <EmptyState
    icon={Target}
    title="No plot beats yet"
    description="Plan your story by adding plot beats. Track which beats are completed and which are still pending."
    actionLabel="Add First Plot Beat"
    onAction={onAddBeat}
  />
);

export const EmptySearch = ({ query, onClear }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${query}"`}
    description="Try different keywords or check your spelling. You can search for characters, items, skills, chapters, and more."
    actionLabel="Clear Search"
    onAction={onClear}
  />
);

export const EmptyTimeline = ({ onAddEvent }) => (
  <EmptyState
    icon={Sparkles}
    title="No timeline events yet"
    description="Timeline events will appear here as you extract entities and progress through your story."
    actionLabel="Process Manuscript"
    onAction={onAddEvent}
  />
);

export const EmptyError = ({ error, onRetry }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description={error || "An unexpected error occurred. Don't worry, your data is safe."}
    actionLabel="Try Again"
    onAction={onRetry}
  />
);

export default EmptyState;
