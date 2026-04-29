import db from './database';
import chapterDataExtractionService from './chapterDataExtractionService';
import extractionHistoryService from './extractionHistoryService';

class ChapterIngestionOrchestrator {
  async ingestChapter({ bookId, chapterId, chapterNumber = null, chapterText, actors = [] }) {
    const session = await extractionHistoryService.startSession(chapterId, 'realtime', 'writer_room_chapter_save');
    const startedAt = Date.now();

    const ledger = {
      id: session.id,
      chapterId,
      bookId,
      chapterNumber,
      status: 'started',
      startedAt,
      stages: {},
      errors: [],
      reviewQueue: []
    };

    try {
      const [events, entities, characterData, beats, locations] = await Promise.all([
        chapterDataExtractionService.extractEventsFromChapter(chapterText, chapterId, bookId, actors),
        chapterDataExtractionService.extractEntitiesFromChapter(chapterText, chapterId, bookId),
        chapterDataExtractionService.extractCharacterDataFromChapter(chapterText, chapterId, bookId, actors),
        chapterDataExtractionService.extractBeatsFromChapter(chapterText, chapterNumber || 0, bookId),
        chapterDataExtractionService.extractLocationsFromChapter(chapterText, chapterId, bookId)
      ]);

      ledger.stages.extracted = {
        events: events.length,
        beats: beats.length,
        locations: locations.length,
        actors: entities.actors.length,
        items: entities.items.length,
        skills: entities.skills.length,
        statChanges: characterData.statChanges.length,
        relationshipChanges: characterData.relationshipChanges.length
      };

      const coreTimelineEvents = events.map((event, index) => ({
        ...event,
        id: event.id || `event_${chapterId}_${Date.now()}_${index}`,
        chapterId,
        chapterNumber,
        bookId,
        sessionId: session.id,
        confidence: Number(event.confidence ?? 0.9),
        modelProvider: 'ai_service',
        promptVersion: 'chapter_events_v2',
        sourceContext: chapterText.slice(0, 500),
        reviewStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      const coreBeats = beats.map((beat, index) => ({
        ...beat,
        id: beat.id || `beat_${chapterId}_${Date.now()}_${index}`,
        chapterId,
        bookId,
        sessionId: session.id,
        confidence: Number(beat.confidence ?? 0.85),
        modelProvider: 'ai_service',
        promptVersion: 'chapter_beats_v2',
        sourceContext: chapterText.slice(0, 500),
        reviewStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      const coreLocations = locations.map((location, index) => ({
        ...location,
        id: location.id || `loc_${chapterId}_${Date.now()}_${index}`,
        chapterId,
        bookId,
        sessionId: session.id,
        confidence: Number(location.confidence ?? 0.85),
        modelProvider: 'ai_service',
        promptVersion: 'chapter_locations_v2',
        sourceContext: chapterText.slice(0, 500),
        reviewStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      await db.executeTransaction(['timelineEvents', 'plotBeats', 'locations'], 'readwrite', ({ stores }) => {
        coreTimelineEvents.forEach((event) => stores.timelineEvents.put(event));
        coreBeats.forEach((beat) => stores.plotBeats.put(beat));
        coreLocations.forEach((location) => stores.locations.put(location));
      });

      const reviewQueue = [
        ...entities.actors.map((entry) => ({ type: 'actor', data: entry })),
        ...entities.items.map((entry) => ({ type: 'item', data: entry })),
        ...entities.skills.map((entry) => ({ type: 'skill', data: entry })),
        ...characterData.statChanges.map((entry) => ({ type: 'stat_change', data: entry })),
        ...characterData.relationshipChanges.map((entry) => ({ type: 'relationship_change', data: entry })),
        ...characterData.skillChanges.map((entry) => ({ type: 'skill_change', data: entry }))
      ].map((entry, index) => ({
        ...(() => {
          const confidence = Number(entry.data?.confidence ?? 0.75);
          const mandatoryReview = confidence < 0.9;
          return {
            confidence,
            mandatoryReview,
            matchReason: mandatoryReview
              ? `Confidence ${confidence.toFixed(2)} is below strict threshold 0.90`
              : `Confidence ${confidence.toFixed(2)} passes strict threshold 0.90`
          };
        })(),
        id: `review_${chapterId}_${Date.now()}_${index}`,
        chapterId,
        bookId,
        sessionId: session.id,
        provider: 'ai_service',
        promptVersion: 'chapter_review_v1',
        sourceContext: chapterText.slice(0, 500),
        reviewer: null,
        status: 'pending',
        ...entry,
        createdAt: Date.now()
      }));

      try {
        await db.batchUpsert('manuscriptSuggestions', reviewQueue, 50);
      } catch (derivedError) {
        await db.batchUpsert('wizardState', [
          {
            id: `retry_${session.id}`,
            sessionId: session.id,
            timestamp: Date.now(),
            status: 'retry_pending',
            queue: reviewQueue,
            error: derivedError.message
          }
        ]);
        ledger.errors.push({ stage: 'derived_queue', error: derivedError.message });
      }

      ledger.reviewQueue = reviewQueue.map((item) => ({ id: item.id, type: item.type, status: item.status }));
      ledger.status = ledger.errors.length ? 'partial' : 'committed';
      ledger.completedAt = Date.now();

      await db.update('extractionSessions', {
        ...session,
        status: ledger.status,
        processingStartTime: startedAt,
        processingEndTime: Date.now(),
        extractionResults: ledger
      });

      return ledger;
    } catch (error) {
      ledger.status = 'failed';
      ledger.errors.push({ stage: 'core_commit', error: error.message });
      ledger.completedAt = Date.now();

      await db.update('extractionSessions', {
        ...session,
        status: 'failed',
        processingStartTime: startedAt,
        processingEndTime: Date.now(),
        error: error.message,
        extractionResults: ledger
      });

      throw error;
    }
  }
}

const chapterIngestionOrchestrator = new ChapterIngestionOrchestrator();
export default chapterIngestionOrchestrator;
