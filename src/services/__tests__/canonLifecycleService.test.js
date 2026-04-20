/**
 * Canon Lifecycle Service — Unit Tests
 *
 * Tests: lifecycle transitions valid/invalid, commit blocked on unresolved nodes,
 * idempotent commit behavior, rollback creates new version
 */

// Mock database
const mockDb = {
  _stores: {},
  async add(store, data) { this._stores[store] = this._stores[store] || []; this._stores[store].push(JSON.parse(JSON.stringify(data))); },
  async update(store, data) {
    this._stores[store] = this._stores[store] || [];
    const copy = JSON.parse(JSON.stringify(data));
    const idx = this._stores[store].findIndex(d => d.id === data.id);
    if (idx >= 0) this._stores[store][idx] = copy; else this._stores[store].push(copy);
  },
  async get(store, id) { return (this._stores[store] || []).find(d => d.id === id) || undefined; },
  async getByIndex(store, idx, val) { return (this._stores[store] || []).filter(d => d[idx] === val); },
  async getAll(store) { return this._stores[store] || []; },
  async clear(store) { this._stores[store] = []; },
  _reset() { this._stores = {}; }
};

jest.mock('../database', () => mockDb);

const { default: canonLifecycleService, STATES, TRANSITIONS } = require('../canonLifecycleService');

describe('CanonLifecycleService', () => {
  beforeEach(() => {
    mockDb._reset();
    canonLifecycleService._sessionCache = new Map();
  });

  describe('State transitions', () => {
    test('Draft -> SavePending is valid', () => {
      expect(canonLifecycleService.isValidTransition(STATES.DRAFT, STATES.SAVE_PENDING)).toBe(true);
    });

    test('SavePending -> Extracting is valid', () => {
      expect(canonLifecycleService.isValidTransition(STATES.SAVE_PENDING, STATES.EXTRACTING)).toBe(true);
    });

    test('Extracting -> ReviewLocked is valid', () => {
      expect(canonLifecycleService.isValidTransition(STATES.EXTRACTING, STATES.REVIEW_LOCKED)).toBe(true);
    });

    test('ReviewLocked -> CanonCommitted is valid', () => {
      expect(canonLifecycleService.isValidTransition(STATES.REVIEW_LOCKED, STATES.CANON_COMMITTED)).toBe(true);
    });

    test('CanonCommitted -> Draft is valid', () => {
      expect(canonLifecycleService.isValidTransition(STATES.CANON_COMMITTED, STATES.DRAFT)).toBe(true);
    });

    test('Draft -> CanonCommitted is NOT valid (must go through pipeline)', () => {
      expect(canonLifecycleService.isValidTransition(STATES.DRAFT, STATES.CANON_COMMITTED)).toBe(false);
    });

    test('Draft -> ReviewLocked is NOT valid', () => {
      expect(canonLifecycleService.isValidTransition(STATES.DRAFT, STATES.REVIEW_LOCKED)).toBe(false);
    });

    test('Extracting -> CanonCommitted is NOT valid (must review)', () => {
      expect(canonLifecycleService.isValidTransition(STATES.EXTRACTING, STATES.CANON_COMMITTED)).toBe(false);
    });
  });

  describe('Edit permissions', () => {
    test('canEdit is true only in Draft', () => {
      expect(canonLifecycleService.canEdit(STATES.DRAFT)).toBe(true);
      expect(canonLifecycleService.canEdit(STATES.SAVE_PENDING)).toBe(false);
      expect(canonLifecycleService.canEdit(STATES.EXTRACTING)).toBe(false);
      expect(canonLifecycleService.canEdit(STATES.REVIEW_LOCKED)).toBe(false);
      expect(canonLifecycleService.canEdit(STATES.CANON_COMMITTED)).toBe(false);
    });
  });

  describe('Continue Writing gate', () => {
    test('canContinueWriting requires ReviewLocked + 0 unresolved + 0 blocking retro', () => {
      expect(canonLifecycleService.canContinueWriting(STATES.REVIEW_LOCKED, 0, 0)).toBe(true);
    });

    test('canContinueWriting blocked by unresolved items', () => {
      expect(canonLifecycleService.canContinueWriting(STATES.REVIEW_LOCKED, 5, 0)).toBe(false);
    });

    test('canContinueWriting blocked by retro impacts', () => {
      expect(canonLifecycleService.canContinueWriting(STATES.REVIEW_LOCKED, 0, 2)).toBe(false);
    });

    test('canContinueWriting blocked in wrong state', () => {
      expect(canonLifecycleService.canContinueWriting(STATES.DRAFT, 0, 0)).toBe(false);
    });
  });

  describe('Commit blocking', () => {
    test('commitCanon throws when unresolved items remain', async () => {
      const session = await canonLifecycleService.createSession('ch1', 1, 'book1');
      // Use startSaveAndExtract + beginExtraction + completeExtraction helpers
      await canonLifecycleService.startSaveAndExtract('ch1', 1, 'book1');
      await canonLifecycleService.beginExtraction('ch1', 'snap1');
      await canonLifecycleService.completeExtraction('ch1');

      await expect(canonLifecycleService.commitCanon('ch1', 5, 0))
        .rejects.toThrow('Cannot commit: 5 unresolved queue items remain');
    });

    test('commitCanon throws when blocking retro impacts remain', async () => {
      await canonLifecycleService.createSession('ch2', 2, 'book1');
      await canonLifecycleService.startSaveAndExtract('ch2', 2, 'book1');
      await canonLifecycleService.beginExtraction('ch2', 'snap2');
      await canonLifecycleService.completeExtraction('ch2');

      await expect(canonLifecycleService.commitCanon('ch2', 0, 3))
        .rejects.toThrow('Cannot commit: 3 blocking retro impacts remain');
    });

    test('commitCanon succeeds with 0 unresolved and 0 blocking', async () => {
      await canonLifecycleService.createSession('ch3', 3, 'book1');
      await canonLifecycleService.startSaveAndExtract('ch3', 3, 'book1');
      await canonLifecycleService.beginExtraction('ch3', 'snap3');
      await canonLifecycleService.completeExtraction('ch3');

      const result = await canonLifecycleService.commitCanon('ch3', 0, 0);
      expect(result.status).toBe(STATES.CANON_COMMITTED);
    });
  });

  describe('Version management', () => {
    test('createVersionSnapshot increments version number', async () => {
      const v1 = await canonLifecycleService.createVersionSnapshot('ch1', 1, 'text1', {});
      expect(v1.versionNumber).toBe(1);

      const v2 = await canonLifecycleService.createVersionSnapshot('ch1', 1, 'text2', {});
      expect(v2.versionNumber).toBe(2);
    });

    test('rollbackToVersion creates a NEW version (never overwrites)', async () => {
      await canonLifecycleService.createVersionSnapshot('ch1', 1, 'original text', {});
      await canonLifecycleService.createVersionSnapshot('ch1', 1, 'modified text', {});

      const rollback = await canonLifecycleService.rollbackToVersion('ch1', 1);
      expect(rollback.versionNumber).toBe(3); // New version, not overwrite
      expect(rollback.content).toBe('original text');
    });
  });

  describe('Queue close semantics', () => {
    test('canCloseQueue returns true only when unresolved = 0', () => {
      expect(canonLifecycleService.canCloseQueue(0)).toBe(true);
      expect(canonLifecycleService.canCloseQueue(1)).toBe(false);
      expect(canonLifecycleService.canCloseQueue(100)).toBe(false);
    });
  });
});
