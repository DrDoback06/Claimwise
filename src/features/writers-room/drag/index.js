// Loomwright — drag protocol. Three mime types, never invent new ones (plan §3.1).
//
//   application/wr-entity         { kind, id }                      every entity chip
//   application/wr-prose-snippet  { chapterId, range, text }        prose dragged out
//   application/wr-chapter        { chapterId }                     chapter rows

export const MIME = {
  ENTITY: 'application/wr-entity',
  PROSE: 'application/wr-prose-snippet',
  CHAPTER: 'application/wr-chapter',
};

export function dragEntity(e, kind, id) {
  e.dataTransfer.setData(MIME.ENTITY, JSON.stringify({ kind, id }));
  e.dataTransfer.effectAllowed = 'copy';
}

export function dragProseSnippet(e, chapterId, range, text) {
  e.dataTransfer.setData(MIME.PROSE, JSON.stringify({ chapterId, range, text }));
  e.dataTransfer.effectAllowed = 'copy';
}

export function dragChapter(e, chapterId) {
  e.dataTransfer.setData(MIME.CHAPTER, JSON.stringify({ chapterId }));
  e.dataTransfer.effectAllowed = 'move';
}

// Drop targets MUST call e.preventDefault() on dragover after type check.
export function readDrop(e, mime) {
  const raw = e.dataTransfer.getData(mime);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Convenience — accepts any of the three; returns { mime, data } or null.
export function readAnyDrop(e) {
  for (const m of [MIME.ENTITY, MIME.PROSE, MIME.CHAPTER]) {
    const data = readDrop(e, m);
    if (data) return { mime: m, data };
  }
  return null;
}

export function isAcceptable(e, mimeOrList) {
  const list = Array.isArray(mimeOrList) ? mimeOrList : [mimeOrList];
  return list.some(m => e.dataTransfer.types.includes(m));
}
