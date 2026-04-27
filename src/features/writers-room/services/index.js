// Loomwright — service facade. Re-exports the existing legacy services so
// every panel can `import { aiService, entityMatchingService } from '../services'`
// without touching the underlying implementations.
//
// The redesign branch's `window.CW.*` pattern is replaced with imports.

export { default as aiService } from '../../../services/aiService';
export { default as entityMatchingService } from '../../../services/entityMatchingService';
export { default as entityInterjectionService } from '../../../services/entityInterjectionService';
export { default as worldConsistencyService } from '../../../services/worldConsistencyService';
export { default as writingEnhancementServices } from '../../../services/writingEnhancementServices';
export { default as plotThreadingService } from '../../../services/plotThreadingService';
export { default as narrativeArcService } from '../../../services/narrativeArcService';
export { default as voiceService } from '../../../services/voiceService';
export { default as styleGuideService } from '../../../services/styleGuideService';
export { default as styleConnectionService } from '../../../services/styleConnectionService';
export { default as styleReferenceService } from '../../../services/styleReferenceService';
export { default as relationshipAnalysisService } from '../../../services/relationshipAnalysisService';
export { default as suggestionFeedbackService } from '../../../services/suggestionFeedbackService';
export { default as suggestionLearningService } from '../../../services/suggestionLearningService';
export { default as textToSpeechService } from '../../../services/textToSpeechService';
export { default as integrationService } from '../../../services/integrationService';
export { default as manuscriptIntelligenceService } from '../../../services/manuscriptIntelligenceService';
export { default as chapterIngestionOrchestrator } from '../../../services/chapterIngestionOrchestrator';
export { default as canonExtractionPipeline } from '../../../services/canonExtractionPipeline';
export { default as cloudSync } from '../../../services/cloudSync';

export { suggest, MODE_THRESHOLDS } from './suggest';
export { dictation } from './dictation';
