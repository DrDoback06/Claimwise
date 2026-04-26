// Loomwright — Extraction Wizard Layer 2 (CODE-INSIGHT §7 / artboard 04-margin).
// Four steps: SCAN · REVIEW · EDIT · COMMIT. Modal overlay opened from
// Shell action 'open.extraction' (currently triggered from CommandPalette).

import React from 'react';
import { useTheme } from '../theme';
import { useStore, createCharacter, createPlace, createItem, createThread, createQuest } from '../store';
import { runExtractPass } from './service';

const STEPS = ['SCAN', 'REVIEW', 'EDIT', 'COMMIT'];

const KIND_LABEL = {
  character: 'Character',
  place: 'Place',
  item: 'Item',
  thread: 'Thread',
  relationship: 'Relationship',
  fact: 'Fact',
};

export default function ExtractionWizard({ chapterId, onClose }) {
  const t = useTheme();
  const store = useStore();
  const chapter = chapterId ? store.chapters?.[chapterId] : null;

  const [step, setStep] = React.useState(0);
  const [findings, setFindings] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [edits, setEdits] = React.useState({}); // findingId -> patch
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [deepRan, setDeepRan] = React.useState(false);

  const startScan = React.useCallback(async ({ deep = false } = {}) => {
    setRunning(true); setError(null);
    try {
      const fs = await runExtractPass(store, chapterId, { deep });
      setFindings(fs);
      const newOnes = new Set(fs.filter(f => f.status === 'new').map(f => f.id));
      setSelectedIds(newOnes);
      if (deep) setDeepRan(true);
      // Save the run for "what changed since last time"
      store.setSlice('extractionRuns', m => ({
        ...(m || {}),
        [chapterId]: { ranAt: Date.now(), findings: fs, deepPassRan: deep || (m?.[chapterId]?.deepPassRan ?? false) },
      }));
      setStep(fs.length === 0 ? 0 : 1);
    } catch (err) {
      setError(err?.message || 'Scan failed');
    } finally {
      setRunning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, store]);

  // Auto-start when the wizard opens.
  React.useEffect(() => { startScan(); }, [startScan]);

  const groupedByKind = React.useMemo(() => {
    const m = {};
    for (const f of findings) {
      const k = f.kind;
      if (!m[k]) m[k] = [];
      m[k].push(f);
    }
    return m;
  }, [findings]);

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const editFinding = (id, patch) =>
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const commit = () => {
    const helper = { setSlice: store.setSlice };
    for (const f of findings) {
      if (!selectedIds.has(f.id)) continue;
      const patch = { ...(f.draft || {}), ...(edits[f.id] || {}), draftedByLoom: true };
      if (f.status === 'known' && f.resolvesTo) {
        // Update the existing entity with the patch.
        const slice = f.kind === 'character' ? 'cast'
          : f.kind === 'place' ? 'places'
          : f.kind === 'item' ? 'items'
          : (f.kind === 'thread' || f.kind === 'quest') ? 'quests' : null;
        if (slice) {
          store.setSlice(slice, xs => xs.map(x => x.id === f.resolvesTo ? { ...x, ...patch } : x));
        }
      } else {
        if (f.kind === 'character') createCharacter(helper, patch);
        else if (f.kind === 'place') createPlace(helper, patch);
        else if (f.kind === 'item') createItem(helper, patch);
        else if (f.kind === 'quest' || f.kind === 'thread') createQuest(helper, { name: patch.name, kind: f.kind === 'thread' ? 'thread' : 'main-quest', ...patch });
        else if (f.kind === 'fact' && (store.cast || []).length) {
          // Park unattributed facts on the first character as `knows`. Author
          // can move them later.
          const target = store.cast[0];
          store.setSlice('cast', xs => xs.map(x => x.id === target.id
            ? { ...x, knows: [...(x.knows || []), { id: 'kw_' + Date.now().toString(36), fact: patch.name, kind: 'knows', source: 'extracted' }] }
            : x));
        }
      }
    }
    onClose?.();
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000,
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div style={{
        width: 'min(820px, 100%)', maxHeight: '92vh',
        background: t.paper, color: t.ink,
        border: `1px solid ${t.rule}`, borderRadius: 6,
        display: 'flex', flexDirection: 'column',
        animation: 'lw-card-in 200ms ease-out',
      }}>
        {/* Stepper rail */}
        <header style={{
          padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}>Extraction · ch.{chapter?.n || '?'} {chapter?.title || ''}</div>
            <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginTop: 2 }}>
              Find what's new
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={label}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 999,
                      display: 'grid', placeItems: 'center',
                      background: done || active ? t.accent : 'transparent',
                      color: done || active ? t.onAccent : t.ink3,
                      border: `1px solid ${done || active ? t.accent : t.rule}`,
                      fontFamily: t.mono, fontSize: 10, fontWeight: 600,
                    }}>{i + 1}</span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9, color: active ? t.ink : t.ink3,
                      letterSpacing: 0.14, textTransform: 'uppercase',
                    }}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span style={{ flex: 1, height: 1, background: done ? t.accent : t.rule }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <button onClick={onClose} style={ghost(t)}>Skip</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {step === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                fontFamily: t.display, fontSize: 16, color: t.ink, marginBottom: 10,
              }}>{running ? 'Reading the chapter…' : (findings.length === 0 ? 'Nothing new — already canon' : 'Ready')}</div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>
                {running ? `Scanning ch.${chapter?.n || '?'}` : ''}
              </div>
              {!running && findings.length === 0 && !deepRan && (
                <button onClick={() => startScan({ deep: true })} style={{
                  marginTop: 16, padding: '8px 16px',
                  background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 2,
                  fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>Run deep pass anyway?</button>
              )}
              {error && (
                <div style={{ marginTop: 16, color: t.bad }}>{error} <button onClick={() => startScan()} style={ghost(t)}>retry</button></div>
              )}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                fontFamily: t.display, fontSize: 14, color: t.ink2, fontStyle: 'italic',
              }}>
                {findings.length} finding{findings.length === 1 ? '' : 's'} — pre-checked NEW, KNOWN unchecked.
                Untick any you don't want to commit.
              </div>
              {Object.entries(groupedByKind).map(([kind, list]) => (
                <div key={kind}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 10, color: t.ink2,
                    letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
                  }}>{KIND_LABEL[kind] || kind} · {list.length}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {list.map(f => {
                      const checked = selectedIds.has(f.id);
                      return (
                        <label key={f.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', background: t.paper2,
                          border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
                        }}>
                          <input type="checkbox" checked={checked} onChange={() => toggle(f.id)} />
                          <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, flex: 1 }}>
                            {f.name}
                          </span>
                          <span style={{
                            fontFamily: t.mono, fontSize: 9, color: f.status === 'new' ? t.good : t.ink3,
                            letterSpacing: 0.14, textTransform: 'uppercase',
                          }}>{f.status}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                fontFamily: t.display, fontSize: 14, color: t.ink2, fontStyle: 'italic',
              }}>Refine names and notes before commit.</div>
              {findings.filter(f => selectedIds.has(f.id)).map(f => {
                const eff = { ...(f.draft || {}), ...(edits[f.id] || {}) };
                return (
                  <div key={f.id} style={{
                    padding: 12, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
                  }}>
                    <div style={{
                      fontFamily: t.mono, fontSize: 9, color: t.ink3,
                      letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
                    }}>{KIND_LABEL[f.kind]} · {f.status}</div>
                    <input value={eff.name || ''}
                      onChange={e => editFinding(f.id, { name: e.target.value })}
                      style={{
                        width: '100%', padding: '4px 8px',
                        fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500,
                        background: 'transparent', border: `1px solid ${t.rule}`,
                        borderRadius: 1, outline: 'none', marginTop: 4,
                      }} />
                    <textarea rows={2} value={eff.notes || ''}
                      onChange={e => editFinding(f.id, { notes: e.target.value })}
                      placeholder="Notes…"
                      style={{
                        width: '100%', padding: '4px 8px',
                        fontFamily: t.display, fontSize: 12, color: t.ink2,
                        background: 'transparent', border: `1px solid ${t.rule}`,
                        borderRadius: 1, outline: 'none', marginTop: 6, lineHeight: 1.4,
                      }} />
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, marginBottom: 8 }}>
                Commit {selectedIds.size} entit{selectedIds.size === 1 ? 'y' : 'ies'}?
              </div>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic' }}>
                NEW entries become canon · KNOWN entries get your edits applied.
              </div>
            </div>
          )}
        </div>

        <footer style={{
          padding: '12px 18px', borderTop: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {step > 0 && step < 3 && (
            <button onClick={() => setStep(s => s - 1)} style={ghost(t)}>Back</button>
          )}
          {step === 0 && !running && findings.length > 0 && (
            <button onClick={() => setStep(1)} style={primary(t)}>Review →</button>
          )}
          {step === 1 && (
            <button onClick={() => setStep(2)} disabled={selectedIds.size === 0} style={primary(t)}>Edit →</button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(3)} style={primary(t)}>Confirm →</button>
          )}
          {step === 3 && (
            <button onClick={commit} style={primary(t)}>Commit {selectedIds.size}</button>
          )}
          <span style={{ flex: 1 }} />
          {!deepRan && step >= 1 && (
            <button onClick={() => startScan({ deep: true })} disabled={running} style={ghost(t)}>
              ✦ Run deep pass
            </button>
          )}
          <button onClick={onClose} style={ghost(t)}>Cancel</button>
        </footer>
      </div>
    </div>
  );
}

function primary(t) {
  return {
    padding: '8px 16px', background: t.accent, color: t.onAccent,
    border: 'none', borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
    textTransform: 'uppercase', fontWeight: 600,
  };
}
function ghost(t) {
  return {
    padding: '7px 12px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
