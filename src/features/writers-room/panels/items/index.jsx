// Loomwright — Items panel (plan §16).
// 2026-04 design refresh (CODE-INSIGHT §6): item editor adds stat-mods +
// granted-skills + live derived-stats preview. RPG-style math.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createItem } from '../../store';
import { useSelection } from '../../selection';
import { dragEntity } from '../../drag';
import { itemById, characterById, chapterList, derivedStats } from '../../store/selectors';

export default function ItemsPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const items = store.items || [];
  const itemId = sel.item || items[0]?.id;
  const item = itemId ? itemById(store, itemId) : null;

  const addItem = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createItem({ setSlice }, {});
    });
    if (id) select('item', id);
  };

  return (
    <PanelFrame
      title="Things, marked"
      eyebrow="Items"
      accent={PANEL_ACCENT.items}
      panelId="inventory"
      onClose={onClose}
      width={420}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
        {items.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Items appear as your characters pick them up.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {items.map(it => (
            <div key={it.id}
              onClick={() => select('item', it.id)}
              draggable
              onDragStart={e => dragEntity(e, 'item', it.id)}
              style={{
                padding: '8px 10px',
                background: sel.item === it.id ? t.paper2 : 'transparent',
                border: `1px solid ${sel.item === it.id ? t.accent : t.rule}`,
                borderRadius: 1, cursor: 'grab',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ fontSize: 16, color: PANEL_ACCENT.items }}>{it.icon || '◆'}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{it.kind}</div>
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{
            padding: '8px 10px', background: 'transparent',
            color: t.accent, border: `1px dashed ${t.accent}`,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
          }}>+ Add</button>
        </div>
      </div>

      {item && <ItemDetail item={item} />}
    </PanelFrame>
  );
}

function ItemDetail({ item }) {
  const t = useTheme();
  const store = useStore();
  const owner = item.owner ? characterById(store, item.owner) : null;
  const chapters = chapterList(store);

  const update = (patch) => store.setSlice('items', is => is.map(x => x.id === item.id ? { ...x, ...patch } : x));

  // Build a track of mentions across chapters using the item name.
  const track = chapters.map(ch => {
    const text = ch.text || '';
    if (!text || !item.name) return null;
    const re = new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text) ? { ch } : null;
  }).filter(Boolean);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <input value={item.icon || '◆'} onChange={e => update({ icon: e.target.value })}
          style={{ width: 36, height: 36, fontSize: 20, textAlign: 'center', background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, color: PANEL_ACCENT.items }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={item.name || ''} onChange={e => update({ name: e.target.value })}
            style={{ width: '100%', fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none' }} />
          <input value={item.kind || ''} onChange={e => update({ kind: e.target.value })}
            style={{ width: '100%', fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', marginTop: 2 }} />
        </div>
      </div>

      {owner && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }}>Owner</div>
          <button style={{
            padding: '4px 10px', background: 'transparent',
            border: `1px solid ${owner.color || t.accent}`, borderRadius: 1,
            fontFamily: t.display, fontSize: 12, color: t.ink, cursor: 'pointer',
          }}>{owner.name}</button>
        </div>
      )}

      <textarea rows={3} value={item.description || ''} onChange={e => update({ description: e.target.value })}
        placeholder="Description"
        style={{
          width: '100%', padding: '6px 8px', fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5,
          background: 'transparent', border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none', marginBottom: 10,
        }} />

      <div style={{ padding: '8px 10px', background: PANEL_ACCENT.items + '22', borderLeft: `2px solid ${PANEL_ACCENT.items}`, marginBottom: 10 }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 2 }}>Symbolism</div>
        <input value={item.symbolism || ''} onChange={e => update({ symbolism: e.target.value })}
          placeholder="What this item means in the story…"
          style={{ width: '100%', fontFamily: t.display, fontSize: 12, color: t.ink, background: 'transparent', border: 'none', outline: 'none', fontStyle: 'italic' }} />
      </div>

      <RpgFields item={item} update={update} />
      <StatModsEditor item={item} update={update} />
      <GrantedSkills item={item} update={update} />
      <DerivedPreview item={item} />

      <OwnershipTimeline item={item} />

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 10, marginBottom: 6 }}>Across the book</div>
      {track.length === 0 ? (
        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>No chapter mentions yet.</div>
      ) : (
        track.map(({ ch }, i) => (
          <div key={ch.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
            borderTop: i > 0 ? `1px solid ${t.rule}` : 'none',
          }}>
            <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>CH.{String(ch.n).padStart(2, '0')}</span>
            <span style={{ fontSize: 12, color: t.ink2, fontStyle: 'italic' }}>{ch.title}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Item editor extensions (CODE-INSIGHT §6) ─────────────────────────

const RARITIES = ['common', 'magic', 'rare', 'legendary', 'unique', 'mythic'];
const RARITY_COLOR = {
  common: 'oklch(60% 0.02 0)',
  magic:  'oklch(60% 0.10 220)',
  rare:   'oklch(60% 0.13 50)',
  legendary: 'oklch(70% 0.13 80)',
  unique: 'oklch(60% 0.13 300)',
  mythic: 'oklch(60% 0.20 25)',
};
const SLOTS = ['', 'head', 'main-hand', 'off-hand', 'body', 'feet', 'hands', 'belt', 'pocket'];

function RpgFields({ item, update }) {
  const t = useTheme();
  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4,
  };
  return (
    <div style={{
      padding: '10px 0', borderTop: `1px solid ${t.rule}`,
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
    }}>
      <div>
        <div style={lbl}>Slot</div>
        <select value={item.slot || ''} onChange={e => update({ slot: e.target.value })}
          style={smallInput(t)}>
          {SLOTS.map(s => <option key={s} value={s}>{s || '—'}</option>)}
        </select>
      </div>
      <div>
        <div style={lbl}>Rarity</div>
        <select value={item.rarity || 'common'} onChange={e => update({ rarity: e.target.value })}
          style={{ ...smallInput(t), color: RARITY_COLOR[item.rarity || 'common'] }}>
          {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <div style={lbl}>Weight (kg)</div>
        <input type="number" step={0.1} min={0}
          value={item.weight ?? ''} onChange={e => update({ weight: parseFloat(e.target.value) || 0 })}
          style={smallInput(t)} />
      </div>
    </div>
  );
}

function StatModsEditor({ item, update }) {
  const t = useTheme();
  const mods = item.statMods || {};
  const entries = Object.entries(mods);

  const setMod = (k, v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n === 0) {
      const { [k]: _, ...rest } = mods;
      update({ statMods: rest });
    } else {
      update({ statMods: { ...mods, [k]: n } });
    }
  };
  const renameMod = (oldK, newK) => {
    if (!newK || newK === oldK) return;
    const { [oldK]: v, ...rest } = mods;
    update({ statMods: { ...rest, [newK]: v } });
  };
  const removeKey = (k) => {
    const { [k]: _, ...rest } = mods;
    update({ statMods: rest });
  };
  const addMod = () => {
    const k = window.prompt('Stat key (e.g. "STR", "DEX", "perception")');
    if (!k) return;
    update({ statMods: { ...mods, [k]: 1 } });
  };

  return (
    <div style={{
      padding: '10px 0', borderTop: `1px solid ${t.rule}`,
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 10, color: t.ink2,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Stat modifiers · while equipped</span>
        <button onClick={addMod} style={{
          padding: '2px 8px', background: 'transparent',
          color: t.accent, border: `1px dashed ${t.accent}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>+ Stat</button>
      </div>
      {entries.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>
          No modifiers — equipping won't change stats.
        </div>
      )}
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
          <input value={k} onChange={e => renameMod(k, e.target.value)}
            style={{ ...smallInput(t), width: 90, textTransform: 'uppercase' }} />
          <button onClick={() => setMod(k, v - 1)} style={iconBtn(t)}>−</button>
          <span style={{
            width: 36, textAlign: 'center', fontFamily: t.mono, fontSize: 12,
            color: v > 0 ? t.good : v < 0 ? t.bad : t.ink2,
            fontWeight: 600,
          }}>{v > 0 ? '+' : ''}{v}</span>
          <button onClick={() => setMod(k, v + 1)} style={iconBtn(t)}>+</button>
          <span style={{ flex: 1 }} />
          <button onClick={() => removeKey(k)} style={{
            background: 'transparent', border: 'none', color: t.ink3,
            cursor: 'pointer', fontFamily: t.mono, fontSize: 12,
          }}>×</button>
        </div>
      ))}
    </div>
  );
}

function GrantedSkills({ item, update }) {
  const t = useTheme();
  const store = useStore();
  const skills = store.skills || [];
  const granted = item.grantedSkills || [];

  const toggle = (sid) => {
    update({ grantedSkills: granted.includes(sid)
      ? granted.filter(x => x !== sid)
      : [...granted, sid] });
  };

  return (
    <div style={{ padding: '10px 0', borderTop: `1px solid ${t.rule}` }}>
      <div style={{
        fontFamily: t.mono, fontSize: 10, color: t.ink2,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
      }}>Granted skills · while equipped</div>
      {skills.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>
          No skills defined yet — open the Skill Tree to author one.
        </div>
      )}
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {skills.map(s => {
            const on = granted.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)} style={{
                padding: '3px 8px',
                background: on ? t.accent : 'transparent',
                color: on ? t.onAccent : t.ink2,
                border: `1px solid ${on ? t.accent : t.rule}`, borderRadius: 999,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
                textTransform: 'uppercase', cursor: 'pointer',
              }}>{s.name || s.id}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DerivedPreview({ item }) {
  const t = useTheme();
  const store = useStore();
  const owner = item.owner ? characterById(store, item.owner) : null;
  if (!owner) return null;

  // Compute hypothetical equipped stats: derived for a clone with this item equipped.
  const equippedNow = (owner.equipped || []).includes(item.id);
  const hypoOwner = equippedNow ? owner : { ...owner, equipped: [...(owner.equipped || []), item.id] };
  const before = derivedStats(store, owner);
  const after = derivedStats(store, hypoOwner);
  const keys = Array.from(new Set([
    ...Object.keys(before), ...Object.keys(after), ...Object.keys(item.statMods || {}),
  ]));
  if (keys.length === 0) return null;

  return (
    <div style={{
      padding: '10px 12px', marginTop: 10,
      background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
      }}>{equippedNow ? 'Equipped on' : 'If equipped on'} {owner.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {keys.map(k => {
          const b = before[k] || 0;
          const a = after[k] || 0;
          const delta = a - b;
          const max = Math.max(20, Math.max(Math.abs(b), Math.abs(a)) + Math.abs(delta));
          return (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 50px', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink2,
                letterSpacing: 0.14, textTransform: 'uppercase',
              }}>{k}</span>
              <div style={{ position: 'relative', height: 8, background: t.rule, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${(Math.max(0, Math.min(b, a)) / max) * 100}%`,
                  background: t.ink3,
                }} />
                {delta !== 0 && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(Math.min(b, a) / max) * 100}%`,
                    width: `${(Math.abs(delta) / max) * 100}%`,
                    background: delta > 0 ? t.good : t.bad,
                  }} />
                )}
              </div>
              <span style={{
                fontFamily: t.mono, fontSize: 11, color: delta > 0 ? t.good : delta < 0 ? t.bad : t.ink2,
                textAlign: 'right',
              }}>{a}{delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta})` : ''}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        {!equippedNow && (
          <button onClick={() => {
            const next = { ...owner, equipped: [...(owner.equipped || []), item.id] };
            store.setSlice('cast', cs => cs.map(c => c.id === owner.id ? next : c));
          }} style={primary(t)}>Equip on {owner.name}</button>
        )}
        {equippedNow && (
          <button onClick={() => {
            const next = { ...owner, equipped: (owner.equipped || []).filter(id => id !== item.id) };
            store.setSlice('cast', cs => cs.map(c => c.id === owner.id ? next : c));
          }} style={ghost(t)}>Unequip</button>
        )}
      </div>
    </div>
  );
}

function smallInput(t) {
  return {
    width: '100%', padding: '4px 6px',
    fontFamily: t.mono, fontSize: 11, color: t.ink2,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none',
  };
}
function iconBtn(t) {
  return {
    width: 22, height: 22, borderRadius: 999, border: `1px solid ${t.rule}`,
    background: 'transparent', color: t.ink2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 11, lineHeight: 1, padding: 0,
  };
}
function primary(t) {
  return {
    padding: '5px 10px', background: t.accent, color: t.onAccent,
    border: 'none', borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
    textTransform: 'uppercase', fontWeight: 600,
  };
}
function ghost(t) {
  return {
    padding: '5px 10px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

function OwnershipTimeline({ item }) {
  const t = useTheme();
  const store = useStore();
  // Track is the canonical ownership history if present.
  // Each entry shape: { ch, owner: charId, act, detail, warning }.
  const track = item.track || [];
  // Synthesise from cast if track empty: chapters where the current owner is mentioned with the item.
  const synthetic = React.useMemo(() => {
    if (track.length || !item.owner || !item.name) return [];
    const owner = (store.cast || []).find(c => c.id === item.owner);
    if (!owner?.name) return [];
    const out = [];
    const order = store.book?.chapterOrder || [];
    for (const id of order) {
      const ch = store.chapters?.[id];
      if (!ch) continue;
      const text = ch.text || '';
      const both = text.includes(item.name) && text.includes(owner.name);
      if (both) out.push({ ch: ch.n, owner: owner.id, act: 'carries' });
    }
    return out;
  }, [item.track, item.owner, item.name, store.book?.chapterOrder, store.chapters, store.cast]);

  const entries = track.length ? track : synthetic;

  if (entries.length === 0) {
    return (
      <div style={{ marginBottom: 10, padding: '8px 10px', background: t.paper2, borderLeft: `2px solid ${t.rule}`, borderRadius: 1 }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }}>Ownership timeline</div>
        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>
          No ownership history yet. Set an owner above and the Loom will track them through the chapters.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6 }}>
        Ownership timeline
      </div>
      <div>
        {entries.map((e, i) => {
          const owner = (store.cast || []).find(c => c.id === e.owner);
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '46px 8px 1fr', gap: 8, alignItems: 'center',
              padding: '4px 0',
              borderTop: i > 0 ? `1px solid ${t.rule}` : 'none',
            }}>
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>CH.{String(e.ch).padStart(2, '0')}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: owner?.color || t.accent }} />
              <div style={{ fontSize: 12, color: t.ink2 }}>
                <span style={{ fontWeight: 500, color: t.ink }}>{owner?.name || '?'}</span> {e.act || 'has it'}
                {e.detail && <span style={{ fontStyle: 'italic' }}> — {e.detail}</span>}
                {e.warning && <span style={{ color: t.warn }}> ⚠ {e.warning}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
