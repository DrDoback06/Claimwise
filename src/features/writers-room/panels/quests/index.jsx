// Loomwright — Quests panel (renamed from Threads, CODE-INSIGHT 2026-04).
// A quest carries multiple named sides (factions). Each side has its own
// member list and progress beats. Quest beats can be detected from chapter
// text via the dedicated quest-progress service.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { dragEntity } from '../../drag';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createQuest } from '../../store';
import { useSelection } from '../../selection';
import { questById } from '../../store/selectors';
import QueuePanel from '../../review-queue/QueuePanel';
import { detectQuestProgress } from '../../quests/service';

const KINDS = ['main-quest', 'side-quest', 'rivalry', 'thread'];
const SEVERITIES = ['low', 'medium', 'high'];
// Hex (not oklch) so they feed `<input type="color">` cleanly.
const SIDE_COLORS = [
  '#a33a2b', '#3367b2', '#4a8b53',
  '#c79945', '#7a5dab', '#b8731c',
];

// `<input type="color">` only accepts #rrggbb. Older characters / quests may
// carry oklch() colours; fall back to a default so the swatch renders.
function hexOrDefault(value, fallback) {
  if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) return value;
  return fallback;
}

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

export default function QuestsPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const quests = store.quests || [];
  const questId = sel.quest || sel.thread || quests[0]?.id;
  const quest = questId ? questById(store, questId) : null;
  const [filter, setFilter] = React.useState('active');
  const [scanning, setScanning] = React.useState(false);
  const [detected, setDetected] = React.useState([]);

  const filtered = filter === 'all' ? quests
    : filter === 'active' ? quests.filter(q => q.active !== false)
    : quests.filter(q => q.active === false);

  const newQuest = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createQuest({ setSlice }, { name: 'New quest', kind: 'main-quest' });
    });
    if (id) select('quest', id);
  };

  const scan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const chId = store.ui?.activeChapterId || store.book?.currentChapterId;
      const beats = await detectQuestProgress(store, chId);
      setDetected(beats);
    } finally {
      setScanning(false);
    }
  };

  const acceptDetection = (d) => {
    store.setSlice('quests', qs => qs.map(q => q.id === d.questId
      ? { ...q, progress: [...(q.progress || []), {
          id: rid('pr'), sideId: d.sideId, beat: d.beat,
          chapterId: d.chapterId, confidence: d.confidence, source: 'detected',
        }] }
      : q));
    setDetected(ds => ds.filter(x => x !== d));
  };
  const dismissDetection = (d) => setDetected(ds => ds.filter(x => x !== d));

  return (
    <PanelFrame
      title="Quests"
      eyebrow={`Quests · ${quests.length}`}
      accent={PANEL_ACCENT.threads}
      panelId="quests"
      onClose={onClose}
      width={520}>
      <QueuePanel domain="quests" accent={PANEL_ACCENT.threads} title="Quests review queue" />
      <div style={{
        padding: '8px 12px', display: 'flex', gap: 6, borderBottom: `1px solid ${t.rule}`,
      }}>
        {['all', 'active', 'dormant'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={chip(t, filter === f)}>{f}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={scan} disabled={scanning} style={ghost(t)}>
          {scanning ? 'Scanning…' : '⌬ Scan chapter'}
        </button>
        <button onClick={newQuest} style={primary(t)}>+ Quest</button>
      </div>

      {detected.length > 0 && (
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.rule}`, background: PANEL_ACCENT.loom + '12' }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.warn,
            letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
          }}>{detected.length} progress beat{detected.length === 1 ? '' : 's'} detected</div>
          {detected.map((d, i) => {
            const q = questById(store, d.questId);
            const side = q?.sides?.find(s => s.id === d.sideId);
            return (
              <div key={i} style={{
                padding: 8, marginBottom: 4, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
              }}>
                <div style={{
                  fontFamily: t.mono, fontSize: 9, color: t.ink3,
                  letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 2,
                }}>
                  {q?.name || 'Quest'} · {side?.name || 'side'} · ch.{store.chapters?.[d.chapterId]?.n ?? '?'}
                </div>
                <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.4 }}>{d.beat}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button onClick={() => acceptDetection(d)} style={primary(t)}>Accept</button>
                  <button onClick={() => dismissDetection(d)} style={ghost(t)}>Dismiss</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        padding: '10px 12px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto',
      }}>
        {filtered.length === 0 && (
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
            padding: '12px 4px',
          }}>
            {filter === 'active' ? 'No active quests yet — open the architect or create one.' : 'No quests at that filter.'}
          </div>
        )}
        {filtered.map(q => (
          <button key={q.id}
            onClick={() => select('quest', q.id)}
            draggable
            onDragStart={e => dragEntity(e, 'quest', q.id)}
            style={{
              padding: '8px 10px', textAlign: 'left',
              background: questId === q.id ? t.paper2 : 'transparent',
              border: `1px solid ${questId === q.id ? (q.color || t.accent) : t.rule}`,
              borderLeft: `3px solid ${q.color || PANEL_ACCENT.threads}`,
              borderRadius: 2, cursor: 'grab',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{q.name || q.title}</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
                {q.kind || 'main-quest'} · {(q.sides?.length || 0)} side{q.sides?.length === 1 ? '' : 's'} · {(q.progress?.length || 0)} beat{q.progress?.length === 1 ? '' : 's'}
              </div>
            </div>
            <span style={{
              fontFamily: t.mono, fontSize: 9,
              color: q.active === false ? t.ink3 : t.good,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{q.active === false ? 'dormant' : 'active'}</span>
          </button>
        ))}
      </div>

      {quest && <QuestEditor quest={quest} />}
      {!quest && (
        <div style={{ padding: 24, textAlign: 'center', fontFamily: t.display, color: t.ink3, fontStyle: 'italic' }}>
          Pick a quest above, or open the quest architect.
        </div>
      )}

    </PanelFrame>
  );
}

function QuestEditor({ quest }) {
  const t = useTheme();
  const store = useStore();
  const cast = store.cast || [];
  const update = (patch) => store.setSlice('quests', qs => qs.map(q => q.id === quest.id ? { ...q, ...patch } : q));

  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 12,
  };
  const inp = {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none', marginTop: 4,
  };

  const sides = quest.sides || [];
  const addSide = () => {
    const newSide = {
      id: rid('side'), name: `Side ${sides.length + 1}`,
      color: SIDE_COLORS[sides.length % SIDE_COLORS.length],
      members: [], goal: '',
    };
    update({ sides: [...sides, newSide] });
  };
  const updateSide = (sid, patch) => update({ sides: sides.map(s => s.id === sid ? { ...s, ...patch } : s) });
  const removeSide = (sid) => update({ sides: sides.filter(s => s.id !== sid) });

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="color" value={hexOrDefault(quest.color, '#b8492e')}
          onChange={e => update({ color: e.target.value })}
          style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        <input value={quest.name || ''} onChange={e => update({ name: e.target.value })}
          style={{ ...inp, marginTop: 0, fontSize: 16, fontWeight: 500 }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <select value={quest.kind || 'main-quest'} onChange={e => update({ kind: e.target.value })}
          style={smallInput(t)}>
          {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={quest.severity || 'medium'} onChange={e => update({ severity: e.target.value })}
          style={smallInput(t)}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => update({ active: quest.active === false })} style={chip(t, quest.active !== false)}>
          {quest.active === false ? 'dormant' : 'active'}
        </button>
      </div>

      <div style={lbl}>Description</div>
      <textarea rows={2} value={quest.description || ''} onChange={e => update({ description: e.target.value })}
        style={{ ...inp, lineHeight: 1.5 }} />

      {/* Sides editor */}
      <div style={{ ...lbl, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Sides · {sides.length}</span>
        <button onClick={addSide} style={ghost(t)}>+ Side</button>
      </div>
      {sides.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', marginTop: 6 }}>
          A quest with one side is a goal. Two or more sides becomes a contest.
        </div>
      )}
      {sides.map(side => (
        <div key={side.id} style={{
          marginTop: 8, padding: 10, background: t.paper2,
          border: `1px solid ${t.rule}`, borderLeft: `3px solid ${side.color}`, borderRadius: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={hexOrDefault(side.color, '#b8492e')}
              onChange={e => updateSide(side.id, { color: e.target.value })}
              style={{ width: 22, height: 22, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            <input value={side.name} onChange={e => updateSide(side.id, { name: e.target.value })}
              style={{ ...inp, marginTop: 0, fontSize: 14, fontWeight: 500 }} />
            <button onClick={() => removeSide(side.id)} style={{
              background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', padding: 4,
            }}>×</button>
          </div>
          <input value={side.goal || ''} onChange={e => updateSide(side.id, { goal: e.target.value })}
            placeholder="What this side is trying to do…"
            style={{ ...inp, marginTop: 6, fontFamily: t.display, fontSize: 12, fontStyle: 'italic' }} />
          <div style={{ marginTop: 8 }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
            }}>Members</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {cast.map(c => {
                const has = (side.members || []).includes(c.id);
                return (
                  <button key={c.id} onClick={() => {
                    const list = side.members || [];
                    updateSide(side.id, { members: has ? list.filter(id => id !== c.id) : [...list, c.id] });
                  }} style={{
                    padding: '2px 8px',
                    background: has ? (c.color || side.color) : 'transparent',
                    color: has ? t.onAccent : t.ink2,
                    border: `1px solid ${has ? (c.color || side.color) : t.rule}`,
                    borderRadius: 999, cursor: 'pointer',
                    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1,
                  }}>{c.name || '?'}</button>
                );
              })}
            </div>
          </div>
          {/* Per-side progress beats */}
          <SideProgress quest={quest} side={side} />
        </div>
      ))}

      {(quest.objectives?.length > 0) && (
        <>
          <div style={lbl}>Objectives</div>
          {(quest.objectives || []).map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <input type="checkbox" checked={!!o.completed}
                onChange={e => update({ objectives: quest.objectives.map(x => x.id === o.id ? { ...x, completed: e.target.checked } : x) })} />
              <input value={o.text} onChange={e => update({ objectives: quest.objectives.map(x => x.id === o.id ? { ...x, text: e.target.value } : x) })}
                style={{ ...inp, marginTop: 0, fontSize: 12 }} />
            </div>
          ))}
        </>
      )}
      <button onClick={() => update({ objectives: [...(quest.objectives || []), { id: rid('obj'), text: 'New objective', completed: false }] })}
        style={{ ...ghost(t), marginTop: 8 }}>+ Objective</button>
    </div>
  );
}

function SideProgress({ quest, side }) {
  const t = useTheme();
  const store = useStore();
  const beats = (quest.progress || []).filter(p => p.sideId === side.id);
  if (beats.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
      }}>Progress · {beats.length}</div>
      {beats.map(b => {
        const ch = store.chapters?.[b.chapterId];
        return (
          <div key={b.id} style={{
            padding: '4px 6px', borderLeft: `2px solid ${side.color}`,
            fontFamily: t.display, fontSize: 12, color: t.ink2, lineHeight: 1.4,
          }}>
            <span style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.1, marginRight: 6,
            }}>ch.{ch?.n ?? '?'}</span>
            {b.beat}
          </div>
        );
      })}
    </div>
  );
}

function chip(t, on) {
  return {
    padding: '4px 10px',
    background: on ? t.accent : 'transparent',
    color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? t.accent : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
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
    padding: '4px 8px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
function smallInput(t) {
  return {
    padding: '4px 6px', background: t.paper, color: t.ink,
    border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
    fontFamily: t.mono, fontSize: 11,
  };
}
