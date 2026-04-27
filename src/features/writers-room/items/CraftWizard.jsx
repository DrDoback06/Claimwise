// Loomwright — AI item-craft wizard. Tell the items master what you want;
// review the result; if there are missing stats / skills, confirm them
// before commit; the committed item lands in the bank with a wiki origin.

import React from 'react';
import { useTheme } from '../theme';
import { useStore, createItem } from '../store';
import { craftItem } from './craftService';
import { ensureWikiEntry } from '../wiki/service';

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

const RARITY_COLOR = {
  common: 'oklch(60% 0.02 0)',
  magic:  'oklch(60% 0.10 220)',
  rare:   'oklch(60% 0.13 50)',
  legendary: 'oklch(70% 0.13 80)',
  unique: 'oklch(60% 0.13 300)',
  mythic: 'oklch(60% 0.20 25)',
};

export default function CraftWizard({ onClose, prefill }) {
  const t = useTheme();
  const store = useStore();
  const [prompt, setPrompt] = React.useState(prefill || '');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [includeMissingStats, setIncludeMissingStats] = React.useState({});
  const [includeMissingSkills, setIncludeMissingSkills] = React.useState({});

  const submit = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      const r = await craftItem(store, prompt);
      if (r.error) setError(r.error);
      setResult(r);
      // Default: include all detected missing entities.
      const ms = {};
      (r.missingStats || []).forEach(s => { ms[s.key] = true; });
      setIncludeMissingStats(ms);
      const mk = {};
      (r.missingSkills || []).forEach((s, i) => { mk[s.name + i] = true; });
      setIncludeMissingSkills(mk);
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!result?.item) return;
    setBusy(true);
    try {
      // Create missing skills first (so the item can grantedSkills them).
      const skillIdMap = new Map(); // name -> id
      const missingSkills = (result.missingSkills || []).filter((s, i) => includeMissingSkills[s.name + i]);
      for (const sk of missingSkills) {
        const id = rid('sk');
        const node = {
          id,
          name: sk.name,
          tier: sk.tier || 'novice',
          position: { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 },
          description: sk.description || '',
          unlockReqs: { prereqIds: [] },
          effects: sk.effects || { stats: {}, flags: [] },
          draftedByLoom: true,
        };
        store.setSlice('skills', xs => [...(xs || []), node]);
        skillIdMap.set(sk.name, id);
        // Wiki origin for the new skill.
        try {
          await ensureWikiEntry({
            entityId: id,
            entityType: 'skill',
            entity: { name: sk.name, description: sk.description },
            draftedByLoom: true,
          });
        } catch {}
      }

      // Build the final item, swapping any name-referenced grantedSkills to ids.
      const item = { ...result.item };
      item.grantedSkills = (item.grantedSkills || []).map(g => {
        // If the AI returned a skill id we already know about, keep it. If
        // it returned a name we just created, swap to the new id.
        if (skillIdMap.has(g)) return skillIdMap.get(g);
        return g;
      });

      // Auto-create missing stats by adding them with description on the
      // store-level stat catalogue (so the Stats tab can surface them).
      const newStats = (result.missingStats || []).filter(s => includeMissingStats[s.key]);
      if (newStats.length) {
        store.setSlice('statCatalog', xs => {
          const cur = Array.isArray(xs) ? xs : [];
          const known = new Set(cur.map(c => c.key));
          const next = [...cur];
          for (const ns of newStats) {
            if (!known.has(ns.key)) next.push({ key: ns.key, description: ns.description || '', max: ns.max || 100 });
          }
          return next;
        });
      }

      // Persist the item into the bank (writers-room items slice).
      const helper = { setSlice: store.setSlice };
      const id = createItem(helper, item);
      // Wiki origin for the item.
      if (result.wikiDraft) {
        try {
          await ensureWikiEntry({
            entityId: id,
            entityType: 'item',
            entity: { name: item.name },
            body: result.wikiDraft,
            draftedByLoom: true,
          });
        } catch {}
      }
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000,
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div style={{
        width: 'min(720px, 100%)', maxHeight: '92vh',
        background: t.paper, color: t.ink,
        border: `1px solid ${t.rule}`, borderRadius: 6,
        display: 'flex', flexDirection: 'column',
        animation: 'lw-card-in 200ms ease-out',
      }}>
        <header style={{
          padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}>Items master</div>
            <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500 }}>
              Forge a new item
            </div>
          </div>
          <button onClick={onClose} style={iconBtn(t)}>×</button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!result && (
            <>
              <div style={{
                fontFamily: t.display, fontSize: 14, color: t.ink2, fontStyle: 'italic',
              }}>
                Describe the item. Examples:
              </div>
              <ul style={{
                fontFamily: t.display, fontSize: 13, color: t.ink3, lineHeight: 1.6,
                marginLeft: 18, marginTop: -4,
              }}>
                <li>"Make a legendary blade that grants +5 STR and a new skill called Death Blow"</li>
                <li>"A common cloak with two sockets, prefer Glacial prefix"</li>
                <li>"Mythic helm tied to the Wardens set"</li>
              </ul>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe the item…"
                style={{
                  padding: 12,
                  fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.5,
                  background: t.paper2, border: `1px solid ${t.rule}`,
                  borderRadius: 2, outline: 'none', resize: 'vertical',
                }}
              />
              {error && <div style={{ color: t.bad, fontFamily: t.display, fontSize: 13 }}>{error}</div>}
            </>
          )}

          {result?.item && (
            <>
              <div style={{
                padding: 14, background: t.paper2, border: `1px solid ${t.rule}`,
                borderLeft: `3px solid ${RARITY_COLOR[result.item.rarity] || t.accent}`,
                borderRadius: 4,
              }}>
                <div style={{
                  fontFamily: t.mono, fontSize: 9, color: RARITY_COLOR[result.item.rarity] || t.accent,
                  letterSpacing: 0.16, textTransform: 'uppercase',
                }}>{result.item.rarity} · {result.item.kind}{result.item.slot ? ` · ${result.item.slot}` : ''}</div>
                <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginTop: 4 }}>
                  {result.item.name}
                </div>
                {result.item.description && (
                  <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
                    {result.item.description}
                  </div>
                )}
                {Object.keys(result.item.statMods || {}).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {Object.entries(result.item.statMods).map(([k, v]) => (
                      <span key={k} style={{
                        padding: '2px 8px', background: t.paper,
                        border: `1px solid ${v > 0 ? t.good : v < 0 ? t.bad : t.rule}`,
                        borderRadius: 999,
                        fontFamily: t.mono, fontSize: 10,
                        color: v > 0 ? t.good : v < 0 ? t.bad : t.ink2,
                      }}>{k} {v > 0 ? '+' : ''}{v}</span>
                    ))}
                  </div>
                )}
                {(result.item.affixes || []).length > 0 && (
                  <div style={{ marginTop: 8, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
                    Affixes: {result.item.affixes.join(', ')}
                  </div>
                )}
                {(result.item.sockets || []).length > 0 && (
                  <div style={{ marginTop: 4, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
                    Sockets: {result.item.sockets.length}
                  </div>
                )}
                {(result.item.grantedSkills || []).length > 0 && (
                  <div style={{ marginTop: 4, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
                    Grants: {result.item.grantedSkills.join(', ')}
                  </div>
                )}
                {result.wikiDraft && (
                  <div style={{
                    marginTop: 12, padding: 10, background: t.paper,
                    borderLeft: `2px solid ${t.suggInk || t.warn}`, borderRadius: 2,
                    fontFamily: t.hand || "'Caveat', cursive", fontSize: 14,
                    color: t.suggInk || t.ink2, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>{result.wikiDraft}</div>
                )}
              </div>

              {(result.missingStats?.length || 0) > 0 && (
                <div>
                  <div style={{
                    fontFamily: t.mono, fontSize: 10, color: t.warn,
                    letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
                  }}>This item references {result.missingStats.length} new stat{result.missingStats.length === 1 ? '' : 's'}</div>
                  {result.missingStats.map((s) => (
                    <label key={s.key} style={missingRow(t)}>
                      <input type="checkbox"
                        checked={!!includeMissingStats[s.key]}
                        onChange={e => setIncludeMissingStats(m => ({ ...m, [s.key]: e.target.checked }))} />
                      <span style={{ fontFamily: t.display, fontWeight: 500, color: t.ink }}>{s.key}</span>
                      <span style={{ flex: 1, color: t.ink3, fontFamily: t.display, fontSize: 12, fontStyle: 'italic' }}>{s.description}</span>
                    </label>
                  ))}
                </div>
              )}

              {(result.missingSkills?.length || 0) > 0 && (
                <div>
                  <div style={{
                    fontFamily: t.mono, fontSize: 10, color: t.warn,
                    letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
                  }}>This item references {result.missingSkills.length} new skill{result.missingSkills.length === 1 ? '' : 's'}</div>
                  {result.missingSkills.map((s, i) => (
                    <label key={s.name + i} style={missingRow(t)}>
                      <input type="checkbox"
                        checked={!!includeMissingSkills[s.name + i]}
                        onChange={e => setIncludeMissingSkills(m => ({ ...m, [s.name + i]: e.target.checked }))} />
                      <span style={{ fontFamily: t.display, fontWeight: 500, color: t.ink }}>{s.name}</span>
                      <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{s.tier || 'novice'}</span>
                      <span style={{ flex: 1, color: t.ink3, fontFamily: t.display, fontSize: 12, fontStyle: 'italic' }}>{s.description}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <footer style={{
          padding: '12px 18px', borderTop: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {!result && (
            <>
              <span style={{ flex: 1 }} />
              <button onClick={onClose} style={ghost(t)}>Cancel</button>
              <button onClick={submit} disabled={!prompt.trim() || busy} style={primary(t)}>
                {busy ? 'Forging…' : 'Forge'}
              </button>
            </>
          )}
          {result?.item && (
            <>
              <button onClick={() => { setResult(null); }} style={ghost(t)}>← Try again</button>
              <span style={{ flex: 1 }} />
              <button onClick={commit} disabled={busy} style={primary(t)}>
                {busy ? 'Committing…' : 'Commit to bank'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function missingRow(t) {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', background: t.paper2,
    border: `1px solid ${t.rule}`, borderRadius: 2, marginBottom: 4,
    cursor: 'pointer',
  };
}
function iconBtn(t) {
  return {
    width: 26, height: 26, borderRadius: 999,
    border: `1px solid ${t.rule}`, background: 'transparent',
    color: t.ink3, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    fontFamily: t.mono, fontSize: 13, lineHeight: 1, padding: 0,
  };
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
