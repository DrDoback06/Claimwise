// bundle entry — exposes every legacy Claimwise service on window.CW so the
// Loomwright writers-room HTML can call them without changing any legacy code.

import db from './services/database';
import aiService from './services/aiService';

// Extraction / intelligence
import manuscriptIntelligenceService from './services/manuscriptIntelligenceService';
import manuscriptProcessingService from './services/manuscriptProcessingService';
import chapterDataExtractionService from './services/chapterDataExtractionService';
import chapterContextService from './services/chapterContextService';
import chapterOverviewService from './services/chapterOverviewService';
import chapterNavigationService from './services/chapterNavigationService';
import chapterMemoryService from './services/chapterMemoryService';
import canonExtractionPipeline from './services/canonExtractionPipeline';
import canonLifecycleService from './services/canonLifecycleService';
import intelligenceRouter from './services/intelligenceRouter';

// Entity detection + matching
import entityMatchingService from './services/entityMatchingService';
import entityInterjectionService from './services/entityInterjectionService';

// Plot, arc, world
import plotThreadingService from './services/plotThreadingService';
import narrativeArcService from './services/narrativeArcService';
import narrativeReviewQueueService from './services/narrativeReviewQueueService';
import worldConsistencyService from './services/worldConsistencyService';
import characterEnhancementService from './services/characterEnhancementService';
import characterTimelineService from './services/characterTimelineService';
import relationshipAnalysisService from './services/relationshipAnalysisService';
import personnelAnalysisService from './services/personnelAnalysisService';
import dialogueAnalysisService from './services/dialogueAnalysisService';
import emotionalBeatService from './services/emotionalBeatService';

// Style / voice
import styleReferenceService from './services/styleReferenceService';
import styleGuideService from './services/styleGuideService';
import styleConnectionService from './services/styleConnectionService';

// Writing enhancements — exports named functions, not a class
import * as writingEnhancementServices from './services/writingEnhancementServices';

// Integration (weaver preview/apply)
import integrationService from './services/integrationService';

// Data + consistency
import dataConsistencyService from './services/dataConsistencyService';
import dataInterconnectionService from './services/dataInterconnectionService';
import dataMigrationService from './services/dataMigrationService';
import contextEngine from './services/contextEngine';
import smartContextEngine from './services/smartContextEngine';
import storyBrain from './services/storyBrain';
import storyContextService from './services/storyContextService';
import manuscriptContextEngine from './services/manuscriptContextEngine';

// Suggestions + learning loop
import aiSuggestionService from './services/aiSuggestionService';
import suggestionFeedbackService from './services/suggestionFeedbackService';
import suggestionLearningService from './services/suggestionLearningService';
import confidencePolicyService from './services/confidencePolicyService';

// Prompt templates
import promptTemplates, {
  formatForClipboard,
  parseExternalAIResponse,
} from './services/promptTemplates';

// Utility services
import toastService from '../services/toastService';

// Static writing-craft data used by several services
import writingCraftGuide from './data/writingCraftGuide';
import { getExpertWriterContent } from './data/expertWriterBase';
import { getGenreGuide } from './data/genreGuides';

// Expose on window.CW
const CW = {
  // core
  db,
  aiService,
  toastService,
  promptTemplates,
  formatForClipboard,
  parseExternalAIResponse,

  // extraction / intelligence
  manuscriptIntelligenceService,
  manuscriptProcessingService,
  chapterDataExtractionService,
  chapterContextService,
  chapterOverviewService,
  chapterNavigationService,
  chapterMemoryService,
  canonExtractionPipeline,
  canonLifecycleService,
  intelligenceRouter,

  // entity
  entityMatchingService,
  entityInterjectionService,

  // plot / arc / world
  plotThreadingService,
  narrativeArcService,
  narrativeReviewQueueService,
  worldConsistencyService,
  characterEnhancementService,
  characterTimelineService,
  relationshipAnalysisService,
  personnelAnalysisService,
  dialogueAnalysisService,
  emotionalBeatService,

  // style / voice
  styleReferenceService,
  styleGuideService,
  styleConnectionService,

  // writing enhancements (named exports)
  writingEnhancementServices,

  // integration
  integrationService,

  // data
  dataConsistencyService,
  dataInterconnectionService,
  dataMigrationService,
  contextEngine,
  smartContextEngine,
  storyBrain,
  storyContextService,
  manuscriptContextEngine,

  // suggestions + learning
  aiSuggestionService,
  suggestionFeedbackService,
  suggestionLearningService,
  confidencePolicyService,

  // static data
  writingCraftGuide,
  getExpertWriterContent,
  getGenreGuide,
};

if (typeof window !== 'undefined') {
  window.CW = CW;
  // Initialise the database on bundle load so every panel can assume it's ready
  try {
    db.init().catch(e => console.warn('[CW] DB init deferred:', e?.message || e));
  } catch (e) {
    console.warn('[CW] DB init threw synchronously:', e);
  }
}

export default CW;
