// Loomwright — Continuity Checker panel (CODE-INSIGHT §8).
// Severity-coded findings; Accept / Snooze / Dismiss triad per row.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import { scanContinuity } from '../../continuity/service';

const SEVERITY = {
  info:  { color: 'oklch(60% 0.10 220)', label: 'Info' },
  warn:  { color: 'oklch(65% 0.13 50)',  label: 'Warning' },
  error: { color: 'oklch(55% 0.18 25)',  label: 'Error' },
};

export default function ContinuityPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const continuity = store.continuity || { findings: [], lastScanAt: null };
  const [running, setRunning] = React.useState(false);
  const chapterId = sel.chapter || store.ui?.activeChapterId || store.book?.currentChapterId;

  const setContinuity = (next) =>
    store.setSlice('continuity', c => typeof next === 'function' ? next(c || { findings: [], lastScanAt: null }) : next);

  const run = async () => {
    if (!chapterId || running) return;
    setRunning(true);
    try {
      const found = await scanContinuity(store, chapterId);
      setContinuity({ findings: found, lastScanAt: Date.now() });
    } finally {
      setRunning(false);
    }
  };

  const dismiss = (id) =>
    setContinuity(c => ({ ...c, findings: (c.findings || []).filter(f => f.id !== id) }));

  const jumpToFinding = (f) => {
    const ref = (f.manuscriptLocations || [])[0];
    if (ref?.chapterId) {
      store.setPath('ui.activeChapterId', ref.chapterId);
      store.setPath('book.currentChapterId', ref.chapterId);
    }
    if (ref?.paragraphId) {
      store.setPath('ui.selection.paragraph', ref.paragraphId);
      setTimeout(() => {
        const el = document.querySelector(`[data-paragraph-id="${ref.paragraphId}"]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);
    }
  };
  const accept = (f) => {
    jumpToFinding(f);
    // Mark as accepted via dismissal (full per-fix tracked-change pipeline is Tier 3).
    dismiss(f.id);
  };

  const filtered = sel.character
    ? continuity.findings.filter(f => f.description?.toLowerCase().includes((store.cast?.find(c => c.id === sel.character)?.name || '').toLowerCase()))
    : continuity.findings;

  return (
    <PanelFrame
      title="Continuity"
      eyebrow="Checker"
      accent={PANEL_ACCENT.atlas}
      panelId="continuity"
      onClose={onClose}
      width={460}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={run} disabled={running || !chapterId} style={{
          padding: '6px 12px', background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: 2, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
          textTransform: 'uppercase', fontWeight: 600,
          opacity: running || !chapterId ? 0.5 : 1,
        }}>{running ? 'Scanning…' : 'Re-scan'}</button>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}>{continuity.lastScanAt ? `Scanned ${timeAgo(continuity.lastScanAt)}` : 'Not scanned yet'}</span>
      </div>
      {filtered.length === 0 && !running && (
        <div style={{
          padding: 24, textAlign: 'center',
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
        }}>
          {continuity.lastScanAt ? 'All consistent — no findings.' : 'Press Re-scan to look for inconsistencies in this chapter.'}
        </div>
      )}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(f => {
          const sev = SEVERITY[f.severity] || SEVERITY.warn;
          return (
            <div key={f.id} style={{
              padding: '10px 12px', background: t.paper2, border: `1px solid ${t.rule}`,
              borderLeft: `3px solid ${sev.color}`, borderRadius: 2,
            }}>
              <div style={{
                fontFamily: t.mono, fontSize: 9, color: sev.color,
                letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
              }}>{sev.label}</div>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5 }}>{f.description}</div>
              {f.suggestedFix && (
                <div style={{
                  marginTop: 6, padding: '6px 8px', background: t.paper,
                  borderLeft: `2px solid ${t.suggInk || t.warn}`,
                  fontFamily: t.hand || "'Caveat', cursive", fontSize: 14,
                  color: t.suggInk || t.ink2, lineHeight: 1.4,
                }}>{f.suggestedFix}</div>
              )}
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button onClick={() => accept(f)} style={primary(t)}>Accept</button>
                <button onClick={() => dismiss(f.id)} style={ghost(t)}>Dismiss</button>
              </div>
            </div>
          );
        })}
      </div>
    </PanelFrame>
  );
}

function timeAgo(ms) {
  const d = Date.now() - ms;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return Math.round(d / 60_000) + 'm ago';
  return Math.round(d / 3_600_000) + 'h ago';
}
function primary(t) {
  return {
    padding: '4px 10px', background: t.accent, color: t.onAccent,
    border: 'none', borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
    textTransform: 'uppercase', fontWeight: 600,
  };
}
function ghost(t) {
  return {
    padding: '4px 8px', background: 'transparent', color: t.ink3,
    border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
