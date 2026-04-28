// Loomwright — autonomous extraction pipeline (rewritten 2026-04 to use the
// legacy multi-focused-call pattern via foundation.js + depth.js).
//
// Two modes:
//   foundation — Layer 1 roster scan: characters, places, items, skills,
//                quests, plus the side-channel relationships / factions /
//                lore / plots. Cheap, runs on import for every chapter and
//                on the explicit "Save & Extract" action.
//   deep       — Layer 2 change scan: stat / status / inventory / location
//                / knowledge / promise changes plus relationship deltas,
//                plot beats, emotional beats, and decisions. Expensive,
//                runs only on the explicit "Save & Deep Extract" action.
//
// Findings flow into reviewQueue (for the writer to confirm) and the new
// slices (factions / lore / plots / entityEvents). High-confidence items
// auto-apply per the tightened gate in `confidence.js`.

import { runFoundationPass } from '../extraction/foundation';
import { runDeepPass } from '../extraction/depth';
import { scanContinuity } from '../continuity/service';
import { detectQuestProgress } from '../quests/service';
import { bucket as bucketByConfidence } from './confidence';
import { classifyRiskBand, isAutoApplyBand } from './riskBands';
import { autoApplyQueueItems } from '../review-queue/operations';
import { buildEntityEventFromFinding } from '../entities/entityEventBuilder';

const DEBOUNCE_MS = 1500;
const REVIEW_CAP = 500;

const pending = new Map();   // chapterId|mode -> timeout
const inflight = new Map();  // chapterId|mode -> abort flag

function key(chapterId, mode) { return `${chapterId}|${mode}`; }

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

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

// Push a batch of stamped queue items + return their ids so we can record
// them on the extraction-history entry for undo.
function pushReview(store, chapterId, items, kind, source, runId) {
  if (!items || items.length === 0) return [];
  const ids = [];
  store.setSlice('reviewQueue', xs => {
    const arr = Array.isArray(xs) ? xs : [];
    const stamped = items.map(f => {
      const risk = classifyRiskBand({
        confidence: f.confidence,
        eventType: f.eventType || f.sourceType || f.kind,
        consequence: f.consequence || 'low',
        isCanonChanging: Boolean(f.canonRisk),
      });
      const id = f.id || rid('rq');
      ids.push(id);
      return {
        id,
        kind,
        source: source || `extraction-${kind}`,
        chapterId,
        addedAt: Date.now(),
        riskBand: f.riskBand || risk.id,
        riskLabel: risk.label,
        autoApplyEligible: risk.autoApply,
        runId,
        ...f,
      };
    });
    const next = [...arr, ...stamped];
    return next.length > REVIEW_CAP ? next.slice(next.length - REVIEW_CAP) : next;
  });
  return ids;
}

// ─── Foundation mode ─────────────────────────────────────────────────────

async function runFoundationJob(store, chapterId, runId) {
  const cancelled = { abort: false };
  inflight.set(key(chapterId, 'foundation'), cancelled);

  markRunning(store, chapterId, 'foundation');
  console.info('[pipeline] foundation start', chapterId);

  let findings = [];
  try {
    findings = await runFoundationPass(store, chapterId);
  } catch (err) {
    console.warn('[pipeline] foundation failed', err?.message);
    clearRunning(store, chapterId);
    return;
  }
  if (cancelled.abort) { clearRunning(store, chapterId); return; }

  const byKind = (Array.isArray(findings) ? findings : []).reduce((acc, f) => {
    acc[f.kind] = (acc[f.kind] || 0) + 1; return acc;
  }, {});
  const bucketed = bucketByConfidence(findings);
  console.info('[pipeline] foundation findings', chapterId, {
    total: findings.length || 0,
    byKind,
    auto: bucketed.auto.length,
    suggested: bucketed.suggested.length,
    background: bucketed.background.length,
    relationships: findings.relationships?.length || 0,
    factions: findings.factions?.length || 0,
    lore: findings.lore?.length || 0,
    plots: findings.plots?.length || 0,
  });

  const queueIds = [];

  // Auto-apply bucket: write to queue stamped, then run the auto-apply
  // helper. The tightened gate in confidence.js / autoApplyQueueItems will
  // block auto-create unless the entity occurred in >= 2 chapters.
  if (bucketed.auto.length) {
    const stampedAuto = bucketed.auto.map(f => ({ ...f, autoApplied: true, status: 'auto-applied' }));
    queueIds.push(...pushReview(store, chapterId, stampedAuto, 'extraction', 'foundation', runId));
    if (isAutoApplyBand('blue', store)) {
      const fresh = (store.reviewQueue || []).filter(it =>
        it.runId === runId && it.status === 'auto-applied'
      );
      autoApplyQueueItems(store, fresh.map(x => x.id));
    }
  }
  if (bucketed.suggested.length || bucketed.background.length) {
    queueIds.push(...pushReview(
      store, chapterId,
      [...bucketed.suggested, ...bucketed.background],
      'extraction', 'foundation', runId
    ));
  }

  // Side-channel: factions, lore, plots, relationships.
  // Each gets written to its own slice, deduped against existing entries.
  if ((findings.factions || []).length) {
    store.setSlice('factions', xs => {
      const arr = Array.isArray(xs) ? xs : [];
      const have = new Set(arr.map(f => (f.name || '').toLowerCase()));
      const fresh = findings.factions.filter(f => f.name && !have.has(f.name.toLowerCase()));
      return [...arr, ...fresh];
    });
  }
  if ((findings.lore || []).length) {
    store.setSlice('lore', xs => {
      const arr = Array.isArray(xs) ? xs : [];
      const have = new Set(arr.map(l => (l.title || '').toLowerCase()));
      const fresh = findings.lore.filter(l => l.title && !have.has(l.title.toLowerCase()));
      return [...arr, ...fresh];
    });
  }
  if ((findings.plots || []).length) {
    store.setSlice('plots', xs => {
      const arr = Array.isArray(xs) ? xs : [];
      const have = new Set(arr.map(p => (p.title || '').toLowerCase()));
      const fresh = findings.plots.filter(p => p.title && !have.has(p.title.toLowerCase()));
      return [...arr, ...fresh];
    });
  }
  if ((findings.relationships || []).length) {
    // Append to each character's `relationships[]` array. Dedupe by
    // {a, b, kind} so re-running doesn't double-up.
    store.setSlice('cast', xs => {
      if (!Array.isArray(xs)) return xs;
      const byName = new Map(xs.map(c => [(c.name || '').toLowerCase(), c]));
      const next = xs.map(c => ({ ...c, relationships: [...(c.relationships || [])] }));
      for (const r of findings.relationships) {
        const a = byName.get((r.a || '').toLowerCase());
        const b = byName.get((r.b || '').toLowerCase());
        if (!a) continue;
        const charIdx = next.findIndex(c => c.id === a.id);
        if (charIdx < 0) continue;
        const existing = next[charIdx].relationships || [];
        const dupKey = `${(r.b || '').toLowerCase()}|${(r.kind || '').toLowerCase()}`;
        const has = existing.some(x => `${(x.with || x.b || '').toLowerCase()}|${(x.kind || '').toLowerCase()}` === dupKey);
        if (has) continue;
        next[charIdx].relationships = [...existing, {
          id: rid('rel'),
          with: r.b,
          withId: b?.id || null,
          kind: r.kind,
          strength: r.strength,
          reason: r.reason,
          chapterId: r.chapterId,
          confidence: r.confidence,
          draftedByLoom: true,
        }];
      }
      return next;
    });
  }

  // entityEvents — for now foundation produces none. Layer 2 fills these.

  clearRunning(store, chapterId);
  recordHistory(store, runId, 'foundation', chapterId, queueIds, findings);
  console.info('[pipeline] foundation done', chapterId, { queueIds: queueIds.length });
}

// ─── Deep mode ───────────────────────────────────────────────────────────

async function runDeepJob(store, chapterId, runId) {
  const cancelled = { abort: false };
  inflight.set(key(chapterId, 'deep'), cancelled);

  // Pre-step: also run foundation (cheap & catches any new entities the
  // chapter introduced since the last foundation pass) so the deep pass
  // has the latest roster to resolve names against.
  await runFoundationJob(store, chapterId, runId);
  if (cancelled.abort) { clearRunning(store, chapterId); return; }

  markRunning(store, chapterId, 'deep');
  console.info('[pipeline] deep start', chapterId);

  let deep = null;
  try {
    deep = await runDeepPass(store, chapterId);
  } catch (err) {
    console.warn('[pipeline] deep failed', err?.message);
    clearRunning(store, chapterId);
    return;
  }
  if (cancelled.abort || !deep) { clearRunning(store, chapterId); return; }

  console.info('[pipeline] deep findings', chapterId, {
    appearances: deep.appearances.length,
    statChanges: deep.statChanges.length,
    skillChanges: deep.skillChanges.length,
    inventoryChanges: deep.inventoryChanges.length,
    locationChanges: deep.locationChanges.length,
    statusChanges: deep.statusChanges.length,
    knowledgeChanges: deep.knowledgeChanges.length,
    promiseChanges: deep.promiseChanges.length,
    revelations: deep.revelations.length,
    relationshipChanges: deep.relationshipChanges.length,
    plotBeats: deep.plotBeats.length,
    emotionalBeats: deep.emotionalBeats.length,
    decisions: deep.decisions.length,
  });

  const queueIds = routeDeepFindings(store, chapterId, deep, runId);

  // Continuity + quest-progress as additional passes — same as before.
  try {
    markRunning(store, chapterId, 'continuity');
    const findings = await scanContinuity(store, chapterId);
    if (!cancelled.abort && findings?.length) {
      store.setSlice('continuity', c => {
        const cur = c || { findings: [], lastScanAt: null };
        const others = (cur.findings || []).filter(f =>
          !(f.manuscriptLocations || []).some(loc => loc.chapterId === chapterId));
        return { findings: [...others, ...findings], lastScanAt: Date.now() };
      });
      queueIds.push(...pushReview(store, chapterId, findings, 'continuity', 'deep', runId));
    }
  } catch (err) { console.warn('[pipeline] continuity failed', err?.message); }

  try {
    markRunning(store, chapterId, 'quests');
    const beats = await detectQuestProgress(store, chapterId);
    if (!cancelled.abort && beats?.length) {
      queueIds.push(...pushReview(store, chapterId, beats, 'quest-progress', 'deep', runId));
    }
  } catch (err) { console.warn('[pipeline] quest detect failed', err?.message); }

  // Build entityEvents from all the accumulated findings so the timeline
  // graph populates. Each "change" from the deep pass becomes an event
  // referencing the resolved character + state delta.
  const newEvents = [];
  for (const a of deep.appearances) {
    if (!a.character) continue;
    newEvents.push(buildEntityEventFromFinding({
      kind: 'character', name: a.character,
      eventType: a.firstMention ? 'first-appearance' : 'appearance',
      summary: a.why || (a.firstMention ? 'First on-page appearance' : 'Appears'),
      confidence: a.confidence,
      chapterId, source: 'deep-pass',
    }, store));
  }
  for (const s of deep.statChanges) {
    newEvents.push(buildEntityEventFromFinding({
      kind: 'character', name: s.character,
      eventType: 'stat-change',
      summary: `${s.stat} ${s.delta != null ? (s.delta >= 0 ? '+' : '') + s.delta : (s.qualitative || 'changed')} — ${s.reason || ''}`.trim(),
      confidence: s.confidence,
      stateChanges: [{ entity: s.character, field: s.stat, after: s.delta }],
      chapterId, source: 'deep-pass',
    }, store));
  }
  for (const r of deep.relationshipChanges) {
    newEvents.push(buildEntityEventFromFinding({
      kind: 'relationship', name: `${r.a} ↔ ${r.b}`,
      eventType: 'relationship-change',
      summary: `${r.action || 'shifted'} (${r.kind}) — ${r.reason || ''}`.trim(),
      confidence: r.confidence,
      chapterId, source: 'deep-pass',
    }, store));
  }
  for (const beat of deep.plotBeats) {
    newEvents.push(buildEntityEventFromFinding({
      kind: 'plot', name: beat.plotTitle || beat.summary?.slice(0, 60) || 'Plot beat',
      eventType: 'plot-beat',
      summary: `[${beat.status}] ${beat.summary}`,
      confidence: beat.confidence,
      chapterId, source: 'deep-pass',
    }, store));
  }
  if (newEvents.length) {
    store.setSlice('entityEvents', xs => [...(Array.isArray(xs) ? xs : []), ...newEvents]);
  }

  clearRunning(store, chapterId);
  recordHistory(store, runId, 'deep', chapterId, queueIds, deep);
  console.info('[pipeline] deep done', chapterId, { queueIds: queueIds.length, events: newEvents.length });
}

// Convert a deep-pass batch into review-queue items. Returns the new queue
// ids so the history record can include them.
function routeDeepFindings(store, chapterId, deep, runId) {
  const items = [];
  for (const a of deep.appearances) {
    if (!a.character) continue;
    items.push({
      kind: 'character',
      status: a.resolved ? 'known' : 'new',
      name: a.character,
      resolvesTo: a.resolved?.id || null,
      notes: a.why || (a.firstMention ? 'First on-page appearance.' : 'Appears in this chapter.'),
      confidence: a.confidence ?? 0.7,
      sourceType: 'appearance',
    });
  }
  for (const s of deep.statChanges) {
    if (!s.character || !s.stat) continue;
    items.push({
      kind: 'character',
      status: 'known',
      name: s.character,
      resolvesTo: s.resolved?.id || null,
      notes: `${s.stat} ${(s.delta ?? 0) >= 0 ? '+' : ''}${s.delta ?? s.qualitative ?? '?'} — ${s.reason || ''}`.trim(),
      confidence: s.confidence ?? 0.65,
      sourceType: 'stat-change',
      payload: { stat: s.stat, delta: s.delta, qualitative: s.qualitative, reason: s.reason },
    });
  }
  for (const sk of deep.skillChanges) {
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
  for (const r of deep.relationshipChanges) {
    if (!r.a || !r.b) continue;
    items.push({
      kind: 'relationship',
      status: 'new',
      name: `${r.a} ↔ ${r.b}`,
      notes: `${r.action || r.kind || 'shift'}${typeof r.strength === 'number' ? ` (${r.strength.toFixed(1)})` : ''} — ${r.reason || ''}`,
      confidence: r.confidence ?? 0.6,
      sourceType: 'relationship-change',
      payload: { a: r.resolvedA?.id || r.a, b: r.resolvedB?.id || r.b, kind: r.kind, action: r.action, strength: r.strength },
    });
  }
  for (const inv of deep.inventoryChanges) {
    if (!inv.character || !inv.item) continue;
    items.push({
      kind: 'item',
      status: inv.resolved?.id ? 'known' : 'new',
      name: inv.item,
      notes: `${inv.character} ${inv.action || 'changed inventory'}${inv.location ? ` in ${inv.location}` : ''} — ${inv.reason || ''}`.trim(),
      confidence: inv.confidence ?? 0.7,
      sourceType: 'inventory-change',
      payload: { character: inv.resolved?.id || inv.character, action: inv.action, location: inv.location },
    });
  }
  for (const l of deep.locationChanges) {
    if (!l.character || !l.location) continue;
    items.push({
      kind: 'place',
      status: 'new',
      name: l.location,
      notes: `${l.character} ${l.action || 'moved'} — ${l.reason || ''}`.trim(),
      confidence: l.confidence ?? 0.68,
      sourceType: 'location-change',
      payload: { character: l.resolved?.id || l.character, action: l.action },
    });
  }
  for (const s of deep.statusChanges) {
    if (!s.character || !s.status) continue;
    items.push({
      kind: 'character',
      status: 'known',
      name: s.character,
      resolvesTo: s.resolved?.id || null,
      notes: `${s.action || 'became'} ${s.status} — ${s.reason || ''}`.trim(),
      confidence: s.confidence ?? 0.7,
      sourceType: 'status-change',
      payload: { status: s.status, action: s.action },
    });
  }
  for (const k of deep.knowledgeChanges) {
    if (!k.character || !k.fact) continue;
    items.push({
      kind: 'fact',
      status: 'new',
      name: `${k.character} ${k.action || 'learned'}: ${k.fact}`,
      notes: k.fromCharacter ? `from ${k.fromCharacter}` : '',
      confidence: k.confidence ?? 0.7,
      sourceType: 'knowledge-change',
      payload: { character: k.resolved?.id || k.character, fact: k.fact, action: k.action, from: k.fromCharacter },
    });
  }
  for (const r of deep.revelations) {
    items.push({
      kind: 'fact',
      status: 'new',
      name: r.summary,
      notes: `Revelation, impact: ${r.impact || 'medium'}`,
      confidence: r.confidence ?? 0.7,
      sourceType: 'revelation',
      payload: { characters: r.characters, impact: r.impact },
    });
  }
  for (const beat of deep.plotBeats) {
    items.push({
      kind: 'plot',
      status: 'new',
      name: beat.plotTitle || beat.summary?.slice(0, 60) || 'Plot beat',
      notes: `[${beat.status}] ${beat.summary}`,
      confidence: beat.confidence ?? 0.65,
      sourceType: 'plot-beat',
      payload: { status: beat.status, characters: beat.characters },
    });
  }
  for (const e of deep.emotionalBeats) {
    items.push({
      kind: 'character',
      status: 'known',
      name: e.character,
      resolvesTo: e.resolved?.id || null,
      notes: `${e.emotion} (${e.intensity || 'medium'}) — ${e.trigger || ''}`,
      confidence: e.confidence ?? 0.65,
      sourceType: 'emotional-beat',
      payload: { emotion: e.emotion, trigger: e.trigger, intensity: e.intensity },
    });
  }
  for (const d of deep.decisions) {
    items.push({
      kind: 'character',
      status: 'known',
      name: d.character,
      resolvesTo: d.resolved?.id || null,
      notes: `Decided: ${d.decision} (stake: ${d.stake || '?'})`,
      confidence: d.confidence ?? 0.7,
      sourceType: 'decision',
      payload: { decision: d.decision, stake: d.stake },
    });
  }
  return pushReview(store, chapterId, items, 'deep', 'deep', runId);
}

// ─── Extraction history (undo support) ──────────────────────────────────

function recordHistory(store, runId, mode, chapterId, queueIds, findingsBag) {
  store.setSlice('extractionHistory', xs => {
    const arr = Array.isArray(xs) ? xs : [];
    const entry = {
      id: runId,
      mode,
      chapterId,
      finishedAt: Date.now(),
      queueIds: queueIds || [],
      // For dedupe + diagnostics. Doesn't include the full findings.
      summary: summariseFindings(findingsBag),
    };
    return [...arr.slice(-49), entry]; // keep last 50
  });
}

function summariseFindings(b) {
  if (!b) return {};
  if (Array.isArray(b)) {
    const out = {};
    for (const f of b) out[f.kind] = (out[f.kind] || 0) + 1;
    return out;
  }
  // deep bag — top-level keys are arrays of changes
  const out = {};
  for (const k of Object.keys(b)) if (Array.isArray(b[k])) out[k] = b[k].length;
  return out;
}

// ─── Public API ──────────────────────────────────────────────────────────

export function scheduleFoundationRun(store, chapterId) {
  if (!chapterId) return;
  const k = key(chapterId, 'foundation');
  const flag = inflight.get(k);
  if (flag) flag.abort = true;
  clearTimeout(pending.get(k));
  const runId = rid('run');
  const timer = setTimeout(() => {
    pending.delete(k);
    runFoundationJob(store, chapterId, runId);
  }, DEBOUNCE_MS);
  pending.set(k, timer);
  return runId;
}

export function scheduleDeepRun(store, chapterId) {
  if (!chapterId) return;
  const k = key(chapterId, 'deep');
  const flag = inflight.get(k);
  if (flag) flag.abort = true;
  clearTimeout(pending.get(k));
  const runId = rid('run');
  const timer = setTimeout(() => {
    pending.delete(k);
    runDeepJob(store, chapterId, runId);
  }, DEBOUNCE_MS);
  pending.set(k, timer);
  return runId;
}

// Backwards-compat shim — old callsites scheduling a generic "autonomous"
// run get foundation by default.
export function scheduleAutonomousRun(store, chapterId) {
  return scheduleFoundationRun(store, chapterId);
}

export function clearAllRuns() {
  for (const t of pending.values()) clearTimeout(t);
  pending.clear();
  for (const flag of inflight.values()) flag.abort = true;
  inflight.clear();
}

// Run foundation across every chapter that has enough text. Used by the
// onboarding wizard's "import everything" path so all 20+ chapters get
// rostered without the writer having to navigate through them.
export function scheduleFoundationForAll(store) {
  const order = store.book?.chapterOrder || [];
  let scheduled = 0;
  for (const id of order) {
    const ch = store.chapters?.[id];
    if ((ch?.text || '').trim().length > 80) {
      scheduleFoundationRun(store, id);
      scheduled++;
    }
  }
  return scheduled;
}
