// Loomwright — snapshot helpers (plan §21).
//
// Auto-snapshots happen on chapter saves with a 10-minute throttle per
// chapter. Manual snapshots can be triggered from the version-history UI.
// Snapshots persist in store.snapshots (capped at 25 per chapter).

const PER_CHAPTER_CAP = 25;
const AUTO_THROTTLE_MS = 10 * 60 * 1000;

export function shouldAutoSnapshot(chapterId, snapshots) {
  if (!chapterId || !snapshots?.length) return true;
  const latest = snapshots
    .filter(s => s.chapterId === chapterId)
    .reduce((a, b) => (a && a.t > b.t ? a : b), null);
  if (!latest) return true;
  return Date.now() - latest.t > AUTO_THROTTLE_MS;
}

export function makeSnapshot(chapter, kind = 'auto') {
  if (!chapter) return null;
  const text = chapter.text || '';
  return {
    id: `snap_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`,
    chapterId: chapter.id,
    chapterN: chapter.n,
    chapterTitle: chapter.title,
    t: Date.now(),
    text,
    paragraphs: chapter.paragraphs || null,
    wordCount: (text.trim().match(/\S+/g) || []).length,
    kind,
  };
}

export function pushSnapshot(store, snapshot) {
  if (!snapshot) return;
  store.setSlice('snapshots', arr => {
    const next = [...(arr || []), snapshot];
    // Prune by chapter to PER_CHAPTER_CAP.
    const byCh = {};
    for (const s of next) {
      byCh[s.chapterId] = byCh[s.chapterId] || [];
      byCh[s.chapterId].push(s);
    }
    const kept = [];
    for (const [, list] of Object.entries(byCh)) {
      list.sort((a, b) => b.t - a.t);
      kept.push(...list.slice(0, PER_CHAPTER_CAP));
    }
    return kept.sort((a, b) => a.t - b.t);
  });
}

export function snapshotsForChapter(snapshots, chapterId) {
  return (snapshots || [])
    .filter(s => s.chapterId === chapterId)
    .sort((a, b) => a.t - b.t);
}
