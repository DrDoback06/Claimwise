// Loomwright — autonomous on-save pipeline.
//
// Watches chapter saves; debounces; then runs extraction + continuity scans
// in the background. Findings get bucketed by confidence and queued into
// `state.reviewQueue` so the writer comes back to a populated room.
//
// One queue, one worker, one outstanding job per chapter. Earlier jobs for
// the same chapter are cancelled by the next save.

import { runExtractPass } from '../extraction/service';
import { scanContinuity } from '../continuity/service';
import { detectQuestProgress } from '../quests/service';
import { bucket as bucketByConfidence } from './confidence';
import { runDeepCharacterPass, runQuestInvolvementPass } from './deep-extract';

const DEBOUNCE_MS = 2500;

const pending = new Map();   // chapterId -> timeout
const inflight = new Map();  // chapterId -> abort flag

function markRunning(store, chapterId, label) {
  store.setSlice('autonomousJobs', xs => {
    const arr = Array.isArray(xs) ? xs : [];
    const i = arr.findIndex(j => j.chapterId === chapterId);
    const next = { chapterId, label, startedAt: Date.now() };
    if (i >= 0) return arr.map((x, j) => j === i ? next : x);
    return [...arr, next];
  });
}

function clearRunning(store, chapterId) {
  store.setSlice('autonomousJobs', xs => (xs || []).filter(j => j.chapterId !== chapterId));
}

const REVIEW_CAP = 200;

function pushReview(store, chapterId, items, kind) {
  if (!items || items.length === 0) return;
  store.setSlice('reviewQueue', xs => {
    const arr = Array.isArray(xs) ? xs : [];
    const stamped = items.map(f => ({ id: f.id || `rq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, kind, chapterId, addedAt: Date.now(), ...f }));
    const next = [...arr, ...stamped];
    // Cap from the front so the most recent stay surfaced.
    return next.length > REVIEW_CAP ? next.slice(next.length - REVIEW_CAP) : next;
  });
}

async function runJob(store, chapterId) {
  const profile = store.profile || {};
  const enabled = profile.autonomousPipeline !== false; // default on
  if (!enabled) return;
  const cancelled = { abort: false };
  inflight.set(chapterId, cancelled);

  // Extraction pass
  try {
    markRunning(store, chapterId, 'extraction');
    const findings = await runExtractPass(store, chapterId, { deep: false });
    if (cancelled.abort) return;
    const bucketed = bucketByConfidence(findings);
    // Auto-applies are saved straight to canon; suggested + background go
    // into the review queue as kind='extraction'.
    if (bucketed.auto.length) {
      // Keep this surfaced to the writer too, so they see what was created.
      pushReview(store, chapterId, bucketed.auto.map(f => ({ ...f, autoApplied: true })), 'extraction');
    }
    if (bucketed.suggested.length || bucketed.background.length) {
      pushReview(store, chapterId, [...bucketed.suggested, ...bucketed.background], 'extraction');
    }
  } catch (err) {
    console.warn('[pipeline] extraction failed', err?.message);
  }
  if (cancelled.abort) { clearRunning(store, chapterId); return; }

  // Continuity pass
  try {
    markRunning(store, chapterId, 'continuity');
    const findings = await scanContinuity(store, chapterId);
    if (cancelled.abort) return;
    if (findings.length) {
      // Continuity findings live in the continuity slice as well.
      store.setSlice('continuity', c => {
        const cur = c || { findings: [], lastScanAt: null };
        // Replace findings for this chapter; keep findings for other chapters.
        const others = (cur.findings || []).filter(f =>
          !(f.manuscriptLocations || []).some(loc => loc.chapterId === chapterId));
        return { findings: [...others, ...findings], lastScanAt: Date.now() };
      });
      pushReview(store, chapterId, findings, 'continuity');
    }
  } catch (err) {
    console.warn('[pipeline] continuity failed', err?.message);
  }
  if (cancelled.abort) { clearRunning(store, chapterId); return; }

  // Quest progress pass
  try {
    markRunning(store, chapterId, 'quests');
    const beats = await detectQuestProgress(store, chapterId);
    if (cancelled.abort) return;
    if (beats.length) {
      pushReview(store, chapterId, beats, 'quest-progress');
    }
  } catch (err) {
    console.warn('[pipeline] quest detect failed', err?.message);
  }
  if (cancelled.abort) { clearRunning(store, chapterId); return; }

  // Deep character pass — appearances, stat changes, skill changes,
  // relationship changes. Each finding routes to the appropriate review
  // queue based on its kind so the writer can confirm in-context.
  try {
    markRunning(store, chapterId, 'deep-character');
    const deep = await runDeepCharacterPass(store, chapterId);
    if (cancelled.abort) return;
    routeDeepFindings(store, chapterId, deep);
  } catch (err) {
    console.warn('[pipeline] deep-character failed', err?.message);
  }
  if (cancelled.abort) { clearRunning(store, chapterId); return; }

  // Quest involvement pass — for each known active quest, decide which
  // characters were involved in this chapter. High-confidence matches
  // auto-attach to quest.characters; the rest go into the quests queue.
  try {
    markRunning(store, chapterId, 'quest-actors');
    const quests = (store.quests || []).filter(q => q.active !== false).slice(0, 8);
    for (const quest of quests) {
      if (cancelled.abort) break;
      const involved = await runQuestInvolvementPass(store, chapterId, quest);
      if (cancelled.abort) break;
      routeQuestInvolvement(store, chapterId, quest, involved);
    }
  } catch (err) {
    console.warn('[pipeline] quest-actors failed', err?.message);
  }

  inflight.delete(chapterId);
  clearRunning(store, chapterId);
}

// Convert deep-extract findings into review-queue items keyed by domain.
function routeDeepFindings(store, chapterId, deep) {
  const items = [];
  for (const a of deep.appearances || []) {
    if (!a.character) continue;
    items.push({
      kind: 'character',
      status: a.resolved ? 'known' : 'new',
      name: a.character,
      resolvesTo: a.resolved?.id || null,
      notes: a.firstMention ? 'First on-page appearance.' : 'Appears in this chapter.',
      confidence: a.confidence ?? 0.7,
      sourceType: 'appearance',
    });
  }
  for (const s of deep.statChanges || []) {
    if (!s.character || !s.stat) continue;
    items.push({
      kind: 'character',
      status: 'known',
      name: s.character,
      resolvesTo: s.resolved?.id || null,
      notes: `${s.stat} ${(s.delta ?? 0) >= 0 ? '+' : ''}${s.delta ?? '?'} — ${s.reason || ''}`.trim(),
      confidence: s.confidence ?? 0.65,
      sourceType: 'stat-change',
      payload: { stat: s.stat, delta: s.delta, reason: s.reason },
    });
  }
  for (const sk of deep.skillChanges || []) {
    if (!sk.skill) continue;
    items.push({
      kind: 'skill',
      status: 'new',
      name: sk.skill,
      notes: `${sk.action || 'gained'} by ${sk.character || '?'} (level ${sk.level || 1}) — ${sk.reason || ''}`.trim(),
      confidence: sk.confidence ?? 0.7,
      sourceType: 'skill-change',
      payload: { character: sk.resolved?.id || sk.character, action: sk.action, level: sk.level },
    });
  }
  for (const r of deep.relationshipChanges || []) {
    if (!r.a || !r.b) continue;
    items.push({
      kind: 'relationship',
      status: 'new',
      name: `${r.a} ↔ ${r.b}`,
      notes: `${r.kind || 'shift'}${typeof r.strength === 'number' ? ` (${r.strength.toFixed(1)})` : ''} — ${r.reason || ''}`,
      confidence: r.confidence ?? 0.6,
      sourceType: 'relationship-change',
      payload: { a: r.resolvedA?.id || r.a, b: r.resolvedB?.id || r.b, kind: r.kind, strength: r.strength },
    });
  }
  if (items.length) pushReview(store, chapterId, items, 'deep');
}

function routeQuestInvolvement(store, chapterId, quest, involved) {
  if (!Array.isArray(involved) || involved.length === 0) return;
  const HIGH = 0.8;
  const auto = involved.filter(i => (i.confidence ?? 0) >= HIGH);
  const suggest = involved.filter(i => (i.confidence ?? 0) < HIGH);

  // Auto-attach high-confidence actors directly to the quest.
  if (auto.length) {
    store.setSlice('quests', qs => (qs || []).map(q => {
      if (q.id !== quest.id) return q;
      const cur = new Set(q.characters || []);
      for (const i of auto) if (i.resolved?.id) cur.add(i.resolved.id);
      return { ...q, characters: [...cur] };
    }));
  }

  // Suggest the rest via the quests review queue.
  if (suggest.length) {
    pushReview(store, chapterId, suggest.map(i => ({
      kind: 'quest',
      status: 'known',
      name: `${i.resolved?.name || i.character} → ${quest.name || quest.title}`,
      resolvesTo: quest.id,
      notes: `Possible involvement (${i.role || 'actor'}): ${i.reason || ''}`,
      confidence: i.confidence ?? 0,
      sourceType: 'quest-involvement',
      payload: { questId: quest.id, characterId: i.resolved?.id || null, role: i.role },
    })), 'deep');
  }
}

// Public API: schedule a debounced run for a chapter id. If the writer
// keeps typing, we keep pushing the timer back; the AI only fires once
// the writer stops.
export function scheduleAutonomousRun(store, chapterId) {
  if (!chapterId) return;
  // Cancel any in-flight job for this chapter.
  const flag = inflight.get(chapterId);
  if (flag) flag.abort = true;
  clearTimeout(pending.get(chapterId));
  const timer = setTimeout(() => {
    pending.delete(chapterId);
    runJob(store, chapterId);
  }, DEBOUNCE_MS);
  pending.set(chapterId, timer);
}

export function clearAutonomousRun(chapterId) {
  if (chapterId == null) return;
  clearTimeout(pending.get(chapterId));
  pending.delete(chapterId);
  const flag = inflight.get(chapterId);
  if (flag) flag.abort = true;
  inflight.delete(chapterId);
}

export function clearAllRuns() {
  for (const t of pending.values()) clearTimeout(t);
  pending.clear();
  for (const flag of inflight.values()) flag.abort = true;
  inflight.clear();
}
