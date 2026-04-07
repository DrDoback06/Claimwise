/**
 * Canon Lifecycle Service
 * State machine managing chapter canon states:
 *   Draft → SavePending → Extracting → ReviewLocked → CanonCommitted
 *
 * Non-negotiables:
 * - Save Draft and Save & Extract are separate paths
 * - Continue Writing enabled only when unresolved queue count = 0 and no blocking retro conflicts
 * - Queue close disabled while unresolved > 0
 * - Review lock allows read-only navigation to context tabs
 */

import db from './database';

const STATES = {
  DRAFT: 'Draft',
  SAVE_PENDING: 'SavePending',
  EXTRACTING: 'Extracting',
  REVIEW_LOCKED: 'ReviewLocked',
  CANON_COMMITTED: 'CanonCommitted'
};

const TRANSITIONS = {
  [STATES.DRAFT]: [STATES.SAVE_PENDING, STATES.DRAFT],
  [STATES.SAVE_PENDING]: [STATES.EXTRACTING, STATES.DRAFT],
  [STATES.EXTRACTING]: [STATES.REVIEW_LOCKED, STATES.DRAFT],
  [STATES.REVIEW_LOCKED]: [STATES.CANON_COMMITTED, STATES.REVIEW_LOCKED],
  [STATES.CANON_COMMITTED]: [STATES.DRAFT]
};

class CanonLifecycleService {
  constructor() {
    this._listeners = new Set();
    this._sessionCache = new Map();
  }

  // ─── State Queries ────────────────────────────────────────

  isValidTransition(from, to) {
    const allowed = TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  canEdit(state) {
    return state === STATES.DRAFT;
  }

  canSaveAndExtract(state) {
    return state === STATES.DRAFT;
  }

  canCloseQueue(unresolvedCount) {
    return unresolvedCount === 0;
  }

  canContinueWriting(state, unresolvedCount, blockingRetroCount) {
    return state === STATES.REVIEW_LOCKED &&
           unresolvedCount === 0 &&
           blockingRetroCount === 0;
  }

  isReadOnlyNav(state) {
    return state === STATES.REVIEW_LOCKED ||
           state === STATES.EXTRACTING ||
           state === STATES.SAVE_PENDING;
  }

  // ─── Session Management ───────────────────────────────────

  async getSession(chapterId) {
    const sessions = await db.getByIndex('canonSessions', 'chapterId', chapterId);
    if (!sessions || sessions.length === 0) return null;
    return sessions.sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  async getActiveSession(chapterId) {
    const session = await this.getSession(chapterId);
    if (!session) return null;
    if (session.status === STATES.CANON_COMMITTED) return null;
    return session;
  }

  async getChapterState(chapterId) {
    const session = await this.getActiveSession(chapterId);
    return session ? session.status : STATES.DRAFT;
  }

  async createSession(chapterId, chapterNumber, bookId) {
    const now = Date.now();
    const session = {
      id: `cs_${chapterId}_${now}`,
      chapterId,
      chapterNumber,
      bookId,
      status: STATES.DRAFT,
      createdAt: now,
      updatedAt: now,
      committedAt: null,
      extractionStartedAt: null,
      extractionCompletedAt: null,
      snapshotId: null
    };
    await db.add('canonSessions', session);
    this._sessionCache.set(chapterId, session);
    this._emit('sessionCreated', session);
    return session;
  }

  async transitionTo(chapterId, newState, metadata = {}) {
    const session = await this.getActiveSession(chapterId);
    if (!session) {
      throw new Error(`No active session for chapter ${chapterId}`);
    }

    if (!this.isValidTransition(session.status, newState)) {
      throw new Error(
        `Invalid transition: ${session.status} → ${newState} for chapter ${chapterId}`
      );
    }

    const oldState = session.status;
    const now = Date.now();

    session.status = newState;
    session.updatedAt = now;

    if (newState === STATES.EXTRACTING) {
      session.extractionStartedAt = now;
    }
    if (newState === STATES.REVIEW_LOCKED) {
      session.extractionCompletedAt = now;
    }
    if (newState === STATES.CANON_COMMITTED) {
      session.committedAt = now;
    }

    Object.assign(session, metadata);

    await db.update('canonSessions', session);
    this._sessionCache.set(chapterId, session);
    this._emit('stateChanged', { chapterId, oldState, newState, session });
    return session;
  }

  // ─── High-Level Lifecycle Actions ──────────────────────────

  async startSaveAndExtract(chapterId, chapterNumber, bookId) {
    let session = await this.getActiveSession(chapterId);
    if (!session) {
      session = await this.createSession(chapterId, chapterNumber, bookId);
    }

    if (session.status !== STATES.DRAFT) {
      throw new Error(`Chapter ${chapterId} is not in Draft state (currently: ${session.status})`);
    }

    await this.transitionTo(chapterId, STATES.SAVE_PENDING);
    return session;
  }

  async beginExtraction(chapterId, snapshotId) {
    return this.transitionTo(chapterId, STATES.EXTRACTING, { snapshotId });
  }

  async completeExtraction(chapterId) {
    return this.transitionTo(chapterId, STATES.REVIEW_LOCKED);
  }

  async commitCanon(chapterId, unresolvedCount, blockingRetroCount) {
    if (unresolvedCount > 0) {
      throw new Error(`Cannot commit: ${unresolvedCount} unresolved queue items remain`);
    }
    if (blockingRetroCount > 0) {
      throw new Error(`Cannot commit: ${blockingRetroCount} blocking retro impacts remain`);
    }
    return this.transitionTo(chapterId, STATES.CANON_COMMITTED);
  }

  async cancelSession(chapterId) {
    const session = await this.getActiveSession(chapterId);
    if (!session) return null;

    if (session.status === STATES.CANON_COMMITTED) {
      throw new Error('Cannot cancel a committed session');
    }

    session.status = STATES.DRAFT;
    session.updatedAt = Date.now();
    session.cancelledAt = Date.now();
    await db.update('canonSessions', session);
    this._sessionCache.set(chapterId, session);
    this._emit('sessionCancelled', session);
    return session;
  }

  // ─── Save Draft (separate path from Save & Extract) ───────

  async saveDraft(chapterId, chapterText, bookData) {
    const state = await this.getChapterState(chapterId);
    if (state !== STATES.DRAFT) {
      throw new Error(`Cannot save draft: chapter is in ${state} state`);
    }

    const book = { ...bookData };
    const chapter = book.chapters?.find(c => c.id === chapterId);
    if (!chapter) throw new Error('Chapter not found in book');

    chapter.script = chapterText;
    chapter.lastUpdated = Date.now();
    chapter.isDraft = true;

    await db.update('books', book);
    this._emit('draftSaved', { chapterId, timestamp: Date.now() });
    return chapter;
  }

  // ─── Version Management ────────────────────────────────────

  async createVersionSnapshot(chapterId, chapterNumber, chapterText, entityState) {
    const existingVersions = await db.getByIndex('chapterVersions', 'chapterId', chapterId);
    const versionNumber = (existingVersions?.length || 0) + 1;
    const now = Date.now();

    const version = {
      id: `cv_${chapterId}_v${versionNumber}_${now}`,
      chapterId,
      chapterNumber,
      versionNumber,
      content: chapterText,
      entityState,
      createdAt: now
    };

    await db.add('chapterVersions', version);
    this._emit('versionCreated', version);
    return version;
  }

  async getVersionHistory(chapterId) {
    const versions = await db.getByIndex('chapterVersions', 'chapterId', chapterId);
    return (versions || []).sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersionDiff(chapterId, fromVersionNum, toVersionNum) {
    const versions = await db.getByIndex('chapterVersions', 'chapterId', chapterId);
    const fromVer = versions?.find(v => v.versionNumber === fromVersionNum);
    const toVer = versions?.find(v => v.versionNumber === toVersionNum);

    if (!fromVer || !toVer) {
      throw new Error('One or both version numbers not found');
    }

    return {
      chapterId,
      fromVersion: fromVersionNum,
      toVersion: toVersionNum,
      fromContent: fromVer.content,
      toContent: toVer.content,
      fromEntityState: fromVer.entityState,
      toEntityState: toVer.entityState,
      fromTimestamp: fromVer.createdAt,
      toTimestamp: toVer.createdAt
    };
  }

  async rollbackToVersion(chapterId, versionNumber) {
    const versions = await db.getByIndex('chapterVersions', 'chapterId', chapterId);
    const targetVersion = versions?.find(v => v.versionNumber === versionNumber);

    if (!targetVersion) {
      throw new Error(`Version ${versionNumber} not found for chapter ${chapterId}`);
    }

    // Rollback creates a NEW version (never overwrites)
    const newVersion = await this.createVersionSnapshot(
      chapterId,
      targetVersion.chapterNumber,
      targetVersion.content,
      targetVersion.entityState
    );

    // Log the rollback in changelog
    const changelog = {
      id: `cl_${chapterId}_${Date.now()}`,
      chapterId,
      fromVersion: versions.length,
      toVersion: newVersion.versionNumber,
      action: 'rollback',
      rollbackTarget: versionNumber,
      createdAt: Date.now()
    };
    await db.add('chapterChangelog', changelog);

    this._emit('versionRolledBack', { chapterId, targetVersion: versionNumber, newVersion });
    return newVersion;
  }

  // ─── Event System ──────────────────────────────────────────

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emit(event, data) {
    for (const listener of this._listeners) {
      try { listener(event, data); } catch (e) { console.error('Lifecycle listener error:', e); }
    }
  }
}

export { STATES, TRANSITIONS };
export default new CanonLifecycleService();
