// Loomwright — character appearance metrics. Pure functions of state.

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function characterMetrics(store, character) {
  if (!character?.name) {
    return { mentions: 0, chapters: 0, dialogueLines: 0, perChapter: [], firstAppears: null };
  }
  const names = [character.name, ...(character.aliases || [])].filter(Boolean);
  const namePattern = `(?:${names.map(escapeRegExp).join('|')})`;
  const mentionRe = new RegExp(`\\b${namePattern}\\b`, 'gi');
  const dialogueReA = new RegExp(`["“][^"”]+["”][,.\\s]*(?:said|asked|replied|whispered|shouted|murmured|cried)?\\s+${namePattern}`, 'gi');
  const dialogueReB = new RegExp(`${namePattern}[,\\s]+(?:said|asked|replied|whispered|shouted|murmured|cried|growled|gasped|breathed|hissed|added|continued)?\\s+["“][^"”]+["”]`, 'gi');

  const chapters = store.book?.chapterOrder || [];
  let mentions = 0, dialogueLines = 0, chaptersWith = 0, firstAppears = null;
  const perChapter = [];

  for (const id of chapters) {
    const ch = store.chapters?.[id];
    if (!ch) { perChapter.push({ id, n: 0, mentions: 0, dialogue: 0 }); continue; }
    const text = ch.text || '';
    mentionRe.lastIndex = 0;
    dialogueReA.lastIndex = 0;
    dialogueReB.lastIndex = 0;
    const m = (text.match(mentionRe) || []).length;
    const d = ((text.match(dialogueReA) || []).length + (text.match(dialogueReB) || []).length);
    if (m > 0) {
      chaptersWith += 1;
      if (firstAppears == null) firstAppears = ch.n;
    }
    mentions += m;
    dialogueLines += d;
    perChapter.push({ id, n: ch.n, mentions: m, dialogue: d });
  }

  return { mentions, chapters: chaptersWith, dialogueLines, perChapter, firstAppears };
}
