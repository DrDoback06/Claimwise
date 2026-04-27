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

  inflight.delete(chapterId);
  clearRunning(store, chapterId);
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
