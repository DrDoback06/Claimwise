// Loomwright — single source of truth for "what the AI knows about this saga".
// Modelled on the legacy contextEngine.assembleChapterContext but reads
// straight from the in-memory store (no extra IDB hits — the writers-room
// store is already hydrated with everything the legacy engine pulled).
//
// Every AI call site should run its system prompt through `composeSystem`
// with the right `slice` so the model gets:
//   • Project: title, series, genre, tone, POV, tense, premise
//   • World rules + content boundaries
//   • Voice profile of the focused character (if any)
//   • Recent chapter summaries (last 3 chapters before this one)
//   • Canon snapshot trimmed to relevant kinds
//   • Writing preferences (pet peeves / favourites / dialogue style / density)

const MAX_CANON = 30;
const MAX_RECENT_CHARS = 600;

function clip(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 3) + '...' : s;
}

function projectLines(profile = {}) {
  const wp = profile.writingPreferences || {};
  return [
    profile.workingTitle && `Project: ${profile.workingTitle}${profile.seriesName ? ' (' + profile.seriesName + ')' : ''}`,
    (profile.genres || []).length && `Genres: ${profile.genres.join(', ')}`,
    (profile.subGenres || []).length && `Sub-genres: ${profile.subGenres.join(', ')}`,
    (profile.tone || []).length && `Tone: ${profile.tone.join(' / ')}`,
    profile.pov && `POV: ${profile.pov}`,
    profile.tense && `Tense: ${profile.tense}`,
    profile.targetAudience && `Audience: ${profile.targetAudience}`,
    profile.comparisons && `Comparable: ${profile.comparisons}`,
    profile.premise && `Premise: ${profile.premise}`,
    (profile.worldRules || []).length && `World rules: ${profile.worldRules.slice(0, 8).join(' · ')}`,
    wp.dialogueStyle && `Dialogue: ${wp.dialogueStyle}`,
    wp.descriptionDensity && `Description density: ${wp.descriptionDensity}`,
    wp.chapterLength && `Chapter length: ${wp.chapterLength}`,
    (wp.profanityLevel || wp.violenceLevel || wp.romanticContent) &&
      `Content limits: profanity=${wp.profanityLevel || 'mild'} · violence=${wp.violenceLevel || 'mild'} · romance=${wp.romanticContent || 'mild'}`,
    (wp.petPeeves || []).length && `Avoid: ${wp.petPeeves.slice(0, 8).join(' · ')}`,
    (wp.favorites || []).length && `Lean into: ${wp.favorites.slice(0, 8).join(' · ')}`,
  ].filter(Boolean);
}

// Voice profile for the currently-focused character (if any).
function voiceLines(state, focusCharId) {
  if (!focusCharId) return [];
  const c = (state.cast || []).find(x => x.id === focusCharId);
  if (!c) return [];
  const v = c.voice || {};
  const tics = (v.tics || []).slice(0, 5);
  return [
    `Focus character: ${c.name} (${c.role || 'support'})`,
    c.oneliner && `Oneliner: ${c.oneliner}`,
    v.fingerprint && `Voice fingerprint: ${v.fingerprint}`,
    tics.length && `Tics: ${tics.join(' · ')}`,
    (c.traits || []).length && `Traits: ${(c.traits).slice(0, 6).join(', ')}`,
    (c.knows || []).length && `Knows: ${(c.knows).map(k => k.fact || k).filter(Boolean).slice(0, 4).join(' · ')}`,
    (c.hides || []).length && `Hides: ${(c.hides).map(k => k.fact || k).filter(Boolean).slice(0, 4).join(' · ')}`,
    (c.fears || []).length && `Fears: ${(c.fears).map(k => k.fact || k).filter(Boolean).slice(0, 4).join(' · ')}`,
    c.wants?.true && `Wants (true): ${c.wants.true}`,
    c.wants?.surface && `Wants (surface): ${c.wants.surface}`,
  ].filter(Boolean);
}

// The last 3 chapters' summaries (or the first 600 chars of their text if no
// summary was generated). Mirrors legacy chapterOverview behaviour.
function recentChaptersLines(state, focusChapterId) {
  const order = state.book?.chapterOrder || [];
  const chapters = state.chapters || {};
  const idx = focusChapterId ? order.indexOf(focusChapterId) : order.length - 1;
  const start = Math.max(0, idx - 3);
  const slice = order.slice(start, idx);
  if (!slice.length) return [];
  const lines = ['Recent chapters:'];
  for (const id of slice) {
    const ch = chapters[id];
    if (!ch) continue;
    const summary = ch.summary || ch.overview || clip((ch.text || '').replace(/\s+/g, ' '), MAX_RECENT_CHARS);
    if (!summary) continue;
    lines.push(`• ch.${ch.n ?? '?'} ${ch.title || ''} — ${summary}`);
  }
  return lines.length > 1 ? lines : [];
}

// Canon snapshot — id::name pairs so the model can reference existing entities.
function canonLines(state, kinds = ['cast', 'places', 'items', 'quests']) {
  const out = [];
  if (kinds.includes('cast') && (state.cast || []).length) {
    out.push('Cast: ' + (state.cast || []).slice(0, MAX_CANON).map(c => `${c.id}::${c.name || ''}`).join(' · '));
  }
  if (kinds.includes('places') && (state.places || []).length) {
    out.push('Places: ' + (state.places || []).slice(0, MAX_CANON).map(p => `${p.id}::${p.name || ''}`).join(' · '));
  }
  if (kinds.includes('items') && (state.items || []).length) {
    out.push('Items: ' + (state.items || []).slice(0, MAX_CANON).map(i => `${i.id}::${i.name || ''}`).join(' · '));
  }
  if (kinds.includes('quests') && (state.quests || []).length) {
    out.push('Quests: ' + (state.quests || []).slice(0, MAX_CANON).map(q => `${q.id}::${q.name || q.title || ''}`).join(' · '));
  }
  if (kinds.includes('skills') && (state.skills || []).length) {
    out.push('Skills: ' + (state.skills || []).slice(0, MAX_CANON).map(s => `${s.id}::${s.name || ''}`).join(' · '));
  }
  return out;
}

// Compose a final system prompt. `persona` is the call-site-specific opening
// (the "you are an items master" framing). `slice` controls what canon goes in.
//
// Usage:
//   const sys = composeSystem({
//     state, persona: 'You are the suggestion engine...',
//     focusCharId: sel.character, focusChapterId: sel.chapter,
//     slice: ['cast', 'places'], extra: 'Return JSON only.',
//   });
export function composeSystem({
  state, persona,
  focusCharId, focusChapterId,
  slice,
  extra,
}) {
  const sections = [persona].filter(Boolean);
  const proj = projectLines(state.profile || {});
  if (proj.length) sections.push('PROJECT CONTEXT\n' + proj.join('\n'));
  const voice = voiceLines(state, focusCharId);
  if (voice.length) sections.push('VOICE CONTEXT\n' + voice.join('\n'));
  const recent = recentChaptersLines(state, focusChapterId);
  if (recent.length) sections.push(recent.join('\n'));
  const canon = canonLines(state, slice);
  if (canon.length) sections.push('CANON\n' + canon.join('\n'));
  if (extra) sections.push(extra);
  return sections.join('\n\n');
}

// Quick helper for places that just want a stringified context blob.
export function sagaContextString(state) {
  return projectLines(state.profile || {}).join(' · ');
}
