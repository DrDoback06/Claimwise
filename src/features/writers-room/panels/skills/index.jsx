// Loomwright — Skill Tree editor (CODE-INSIGHT §6 / artboard 06b-skill-tree).
// Right-click canvas to add a node. Drag from a node to another to link.
// Click a node to edit it in the pane below. Cycle detection on link-add.

import React from 'react';
import PanelFrame from '../PanelFrame';
import ContextMenu, { useContextMenu } from '../../primitives/ContextMenu';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { generateTree } from '../../skills/treeService';
import { ensureWikiEntry } from '../../wiki/service';
import SpecialistChat from '../../specialist/SpecialistChat';
import QueuePanel from '../../review-queue/QueuePanel';
import { dragEntity } from '../../drag';

const TIERS = ['novice', 'adept', 'master', 'unique'];
const TIER_COLOR = (t) => ({
  novice: t.ink3,
  adept:  'oklch(60% 0.10 220)',
  master: 'oklch(70% 0.13 80)',
  unique: 'oklch(60% 0.13 300)',
});

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

// Detect cycle in proposed link a -> b.
function wouldCycle(skills, fromId, toId) {
  if (fromId === toId) return true;
  // BFS from `to` following dependents (links from b -> ?) — if we reach `from`, cycle.
  const adj = new Map();
  for (const s of skills) {
    for (const reqId of s.unlockReqs?.prereqIds || []) {
      if (!adj.has(reqId)) adj.set(reqId, new Set());
      adj.get(reqId).add(s.id);
    }
  }
  // Adding fromId -> toId means toId's prereqs include fromId; we'd cycle if
  // fromId ∈ descendants of toId (toId can reach fromId).
  const queue = [toId];
  const seen = new Set();
  while (queue.length) {
    const x = queue.shift();
    if (x === fromId) return true;
    if (seen.has(x)) continue;
    seen.add(x);
    const next = adj.get(x);
    if (next) for (const n of next) queue.push(n);
  }
  return false;
}

export default function SkillsPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const skills = store.skills || [];
  const [selectedId, setSelectedId] = React.useState(null);
  const [linking, setLinking] = React.useState(null); // { fromId, x, y }
  const [drag, setDrag] = React.useState(null);
  const [genOpen, setGenOpen] = React.useState(false);
  const [genPrompt, setGenPrompt] = React.useState('');
  const [genBusy, setGenBusy] = React.useState(false);
  const [genResult, setGenResult] = React.useState(null);
  const svgRef = React.useRef(null);
  const ctx = useContextMenu();

  const runGenerate = async () => {
    if (!genPrompt.trim() || genBusy) return;
    setGenBusy(true);
    try {
      const r = await generateTree(store, genPrompt);
      setGenResult(r);
    } finally {
      setGenBusy(false);
    }
  };

  const commitGenerated = async () => {
    if (!genResult?.nodes?.length) return;
    // Append nodes to skills slice.
    store.setSlice('skills', xs => [...(xs || []), ...genResult.nodes]);
    // Auto-create missing stats.
    if (genResult.missingStats?.length) {
      store.setSlice('statCatalog', xs => {
        const cur = Array.isArray(xs) ? xs : [];
        const known = new Set(cur.map(c => c.key));
        const next = [...cur];
        for (const ns of genResult.missingStats) {
          if (!known.has(ns.key)) next.push({ key: ns.key, description: ns.description || '', max: ns.max || 100 });
        }
        return next;
      });
    }
    // Wiki origins for each new skill.
    for (const node of genResult.nodes) {
      const draft = genResult.wikiDrafts?.[node.name];
      try {
        await ensureWikiEntry({
          entityId: node.id,
          entityType: 'skill',
          entity: { name: node.name, description: node.description },
          body: draft,
          draftedByLoom: true,
        });
      } catch {}
    }
    setGenOpen(false);
    setGenPrompt('');
    setGenResult(null);
  };

  const selected = skills.find(s => s.id === selectedId) || null;
  const tierColor = TIER_COLOR(t);

  const screenToCanvas = (e) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - r.left) / r.width) * 1000,
      y: ((e.clientY - r.top) / r.height) * 600,
    };
  };

  const addNode = (point) => {
    const id = rid('sk');
    const node = {
      id, name: 'New skill', tier: 'novice',
      position: point, description: '',
      unlockReqs: { prereqIds: [] },
      effects: { stats: {}, flags: [] },
      level: 0, maxLevel: 5,
    };
    store.setSlice('skills', xs => [...(xs || []), node]);
    setSelectedId(id);
  };

  const updateNode = (id, patch) =>
    store.setSlice('skills', xs => xs.map(s => s.id === id ? { ...s, ...patch } : s));

  const deleteNode = (id) => {
    if (!window.confirm('Delete this skill node?')) return;
    store.setSlice('skills', xs => xs
      .filter(s => s.id !== id)
      .map(s => ({
        ...s,
        unlockReqs: {
          ...s.unlockReqs,
          prereqIds: (s.unlockReqs?.prereqIds || []).filter(p => p !== id),
        },
      })));
    if (selectedId === id) setSelectedId(null);
  };

  const linkNodes = (fromId, toId) => {
    if (fromId === toId) return;
    if (wouldCycle(skills, fromId, toId)) {
      window.alert('That link would create a cycle.');
      return;
    }
    store.setSlice('skills', xs => xs.map(s => {
      if (s.id !== toId) return s;
      const reqs = s.unlockReqs?.prereqIds || [];
      if (reqs.includes(fromId)) return s;
      return { ...s, unlockReqs: { ...(s.unlockReqs || {}), prereqIds: [...reqs, fromId] } };
    }));
  };

  const onCanvasContextMenu = (e) => {
    e.preventDefault();
    const point = screenToCanvas(e);
    const overNodeId = e.target?.dataset?.skillId || null;
    const items = overNodeId ? [
      { heading: skills.find(s => s.id === overNodeId)?.name || 'Skill' },
      { id: 'edit', label: 'Edit', onClick: () => setSelectedId(overNodeId) },
      { id: 'link-from', label: 'Start link from this node',
        onClick: () => setLinking({ fromId: overNodeId, x: e.clientX, y: e.clientY }) },
      { divider: true },
      { id: 'delete', label: 'Delete', danger: true, onClick: () => deleteNode(overNodeId) },
    ] : [
      { id: 'add', label: '+ Add node here', onClick: () => addNode(point) },
    ];
    ctx.open(e, items);
  };

  const onCanvasMouseMove = (e) => {
    if (drag) {
      const point = screenToCanvas(e);
      updateNode(drag.id, { position: { x: point.x - drag.dx, y: point.y - drag.dy } });
    }
    if (linking) {
      const r = svgRef.current?.getBoundingClientRect();
      if (r) setLinking(l => l ? { ...l, x: e.clientX, y: e.clientY } : l);
    }
  };

  const onCanvasMouseUp = (e) => {
    if (linking) {
      const targetId = e.target?.dataset?.skillId;
      if (targetId) linkNodes(linking.fromId, targetId);
      setLinking(null);
    }
    setDrag(null);
  };

  const onNodeMouseDown = (s, e) => {
    e.stopPropagation();
    if (e.button === 2) return;
    if (e.shiftKey) {
      setLinking({ fromId: s.id, x: e.clientX, y: e.clientY });
      return;
    }
    const point = screenToCanvas(e);
    setDrag({ id: s.id, dx: point.x - s.position.x, dy: point.y - s.position.y });
  };

  return (
    <PanelFrame
      title="Skill trees"
      eyebrow="Skills"
      accent={PANEL_ACCENT.items}
      panelId="skills"
      onClose={onClose}
      width={520}>
      <QueuePanel domain="skills" accent={PANEL_ACCENT.items} title="Skills review queue" />
      <SkillBank store={store} t={t} />
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}>{skills.length} nodes · shift-drag links</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => setGenOpen(true)} style={{
          padding: '4px 10px', background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
          textTransform: 'uppercase', fontWeight: 600,
        }}>✦ Generate tree</button>
      </div>

      <div style={{ position: 'relative', height: 380, borderBottom: `1px solid ${t.rule}`, background: t.paper2 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 1000 600"
          style={{ width: '100%', height: '100%', cursor: linking ? 'crosshair' : 'default' }}
          onContextMenu={onCanvasContextMenu}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={() => { setDrag(null); setLinking(null); }}
        >
          <defs>
            <marker id="lw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6"
              orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={t.ink3} />
            </marker>
          </defs>

          {/* Links */}
          {skills.map(target =>
            (target.unlockReqs?.prereqIds || []).map(fromId => {
              const from = skills.find(s => s.id === fromId);
              if (!from) return null;
              return (
                <line key={fromId + '-' + target.id}
                  x1={from.position.x} y1={from.position.y}
                  x2={target.position.x} y2={target.position.y}
                  stroke={t.ink3} strokeWidth={1.5} markerEnd="url(#lw-arrow)" opacity={0.7} />
              );
            }))}

          {/* Linking rubber-band */}
          {linking && svgRef.current && (() => {
            const from = skills.find(s => s.id === linking.fromId);
            if (!from) return null;
            const r = svgRef.current.getBoundingClientRect();
            const tx = ((linking.x - r.left) / r.width) * 1000;
            const ty = ((linking.y - r.top) / r.height) * 600;
            return (
              <line x1={from.position.x} y1={from.position.y} x2={tx} y2={ty}
                stroke={t.accent} strokeWidth={1.5} strokeDasharray="4 3" />
            );
          })()}

          {/* Nodes */}
          {skills.map(s => {
            const isSel = s.id === selectedId;
            const c = tierColor[s.tier] || t.accent;
            return (
              <g key={s.id} onMouseDown={(e) => onNodeMouseDown(s, e)}
                onClick={() => setSelectedId(s.id)} style={{ cursor: 'grab' }}>
                <circle data-skill-id={s.id}
                  cx={s.position.x} cy={s.position.y}
                  r={isSel ? 22 : 18}
                  fill={t.paper} stroke={c} strokeWidth={isSel ? 3 : 2} />
                <text x={s.position.x} y={s.position.y + 38}
                  fontSize={11} fontFamily={t.display} fill={t.ink}
                  textAnchor="middle" pointerEvents="none">{s.name}</text>
                <text x={s.position.x} y={s.position.y + 4}
                  fontSize={9} fontFamily={t.mono} fill={c}
                  textAnchor="middle" pointerEvents="none">
                  {s.tier?.[0]?.toUpperCase() || '·'}
                </text>
              </g>
            );
          })}

          {skills.length === 0 && (
            <text x={500} y={300} fontSize={14} fontFamily={t.display}
              fill={t.ink3} textAnchor="middle" fontStyle="italic">
              Right-click anywhere to add the first skill node.
            </text>
          )}
        </svg>
      </div>

      {/* Draggable skill tray — lets the writer drag any skill onto the editor / tangle. */}
      {skills.length > 0 && (
        <div style={{
          padding: '8px 12px', borderBottom: `1px solid ${t.rule}`,
          display: 'flex', flexWrap: 'wrap', gap: 4,
        }}>
          {skills.map(sk => {
            const c = tierColor[sk.tier] || t.accent;
            return (
              <div key={sk.id}
                draggable
                onDragStart={e => dragEntity(e, 'skill', sk.id)}
                onClick={() => setSelectedId(sk.id)}
                title="Drag to editor or tangle"
                style={{
                  padding: '3px 8px',
                  background: selectedId === sk.id ? c : 'transparent',
                  color: selectedId === sk.id ? t.onAccent : t.ink2,
                  border: `1px solid ${c}`, borderRadius: 999,
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
                  textTransform: 'uppercase', cursor: 'grab',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                {sk.name}
                {(sk.maxLevel || 0) > 0 && (
                  <span style={{ opacity: 0.7 }}>{sk.level || 0}/{sk.maxLevel || 5}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && <SkillEditor skill={selected} update={(p) => updateNode(selected.id, p)} t={t} />}
      {!selected && (
        <div style={{
          padding: 24, textAlign: 'center',
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
        }}>
          Click a node to edit it.
        </div>
      )}

      <SpecialistChat domain="skills" accent={PANEL_ACCENT.items} />

      <ContextMenu state={ctx.state} onClose={ctx.close} />

      {genOpen && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000,
          display: 'grid', placeItems: 'center', padding: 24,
        }}>
          <div style={{
            width: 'min(640px, 100%)', maxHeight: '90vh',
            background: t.paper, color: t.ink,
            border: `1px solid ${t.rule}`, borderRadius: 6,
            display: 'flex', flexDirection: 'column',
            animation: 'lw-card-in 200ms ease-out',
          }}>
            <header style={{
              padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
            }}>
              <div style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}>Skill librarian</div>
              <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginTop: 2 }}>
                Generate a skill tree
              </div>
            </header>
            <div style={{ padding: 18, flex: 1, overflowY: 'auto' }}>
              {!genResult && (
                <>
                  <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>
                    Examples: "a 10-node tree for a wheelwright that branches into engineering and folk-magic",
                    "small assassin tree built around stealth and crit",
                    "scholar tree centred on lore and language gates".
                  </div>
                  <textarea value={genPrompt} onChange={e => setGenPrompt(e.target.value)}
                    rows={5} placeholder="Describe the tree you want…"
                    style={{
                      width: '100%', marginTop: 12, padding: 12,
                      fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.5,
                      background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2, outline: 'none', resize: 'vertical',
                    }} />
                </>
              )}
              {genResult?.error && (
                <div style={{ color: t.bad, fontFamily: t.display, fontSize: 13 }}>{genResult.error}</div>
              )}
              {genResult?.nodes?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    fontFamily: t.mono, fontSize: 10, color: t.ink2,
                    letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
                  }}>{genResult.nodes.length} nodes proposed</div>
                  {genResult.nodes.map(n => (
                    <div key={n.id} style={{
                      padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{n.name}</span>
                        <span style={{
                          fontFamily: t.mono, fontSize: 9, color: t.ink3,
                          letterSpacing: 0.14, textTransform: 'uppercase',
                        }}>{n.tier}</span>
                      </div>
                      {n.description && (
                        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink2, fontStyle: 'italic', marginTop: 4, lineHeight: 1.5 }}>{n.description}</div>
                      )}
                      {Object.keys(n.effects?.stats || {}).length > 0 && (
                        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {Object.entries(n.effects.stats).map(([k, v]) => (
                            <span key={k} style={{
                              padding: '1px 6px', background: t.paper, border: `1px solid ${v > 0 ? t.good : v < 0 ? t.bad : t.rule}`,
                              borderRadius: 999, fontFamily: t.mono, fontSize: 9, color: v > 0 ? t.good : v < 0 ? t.bad : t.ink2,
                            }}>{k} {v > 0 ? '+' : ''}{v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(genResult.missingStats?.length || 0) > 0 && (
                    <div style={{
                      marginTop: 10, padding: 10, background: t.paper2,
                      borderLeft: `3px solid ${t.warn}`, borderRadius: 2,
                    }}>
                      <div style={{
                        fontFamily: t.mono, fontSize: 10, color: t.warn,
                        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
                      }}>Will create {genResult.missingStats.length} new stat{genResult.missingStats.length === 1 ? '' : 's'}</div>
                      {genResult.missingStats.map(s => (
                        <div key={s.key} style={{ fontFamily: t.display, fontSize: 12, color: t.ink2 }}>
                          <strong style={{ color: t.ink }}>{s.key}</strong>{s.description ? ' — ' + s.description : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <footer style={{
              padding: '12px 18px', borderTop: `1px solid ${t.rule}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {!genResult ? (
                <>
                  <span style={{ flex: 1 }} />
                  <button onClick={() => { setGenOpen(false); setGenPrompt(''); }} style={ghostBtn(t)}>Cancel</button>
                  <button onClick={runGenerate} disabled={!genPrompt.trim() || genBusy} style={primaryBtn(t)}>
                    {genBusy ? 'Designing…' : 'Generate'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setGenResult(null); }} style={ghostBtn(t)}>← Try again</button>
                  <span style={{ flex: 1 }} />
                  <button onClick={commitGenerated} disabled={genBusy || !genResult.nodes?.length} style={primaryBtn(t)}>
                    {genBusy ? 'Committing…' : 'Commit ' + (genResult.nodes?.length || 0) + ' nodes'}
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </PanelFrame>
  );
}

function primaryBtn(t) {
  return {
    padding: '8px 16px', background: t.accent, color: t.onAccent,
    border: 'none', borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
    textTransform: 'uppercase', fontWeight: 600,
  };
}
function ghostBtn(t) {
  return {
    padding: '7px 12px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

function SkillEditor({ skill: s, update, t }) {
  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 8,
  };
  const inp = {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none', marginTop: 4,
  };

  const stats = s.effects?.stats || {};
  const updateStat = (k, v) => {
    const n = parseInt(v, 10);
    const next = isNaN(n) || n === 0
      ? Object.fromEntries(Object.entries(stats).filter(([kk]) => kk !== k))
      : { ...stats, [k]: n };
    update({ effects: { ...(s.effects || {}), stats: next } });
  };
  const addStat = () => {
    const k = window.prompt('Stat key');
    if (k) updateStat(k, 1);
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={lbl}>Name</div>
      <input style={inp} value={s.name || ''} onChange={e => update({ name: e.target.value })} />
      <div style={lbl}>Tier</div>
      <select value={s.tier || 'novice'} onChange={e => update({ tier: e.target.value })} style={inp}>
        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <div style={lbl}>Description</div>
      <textarea rows={3} style={{ ...inp, lineHeight: 1.5 }} value={s.description || ''}
        onChange={e => update({ description: e.target.value })} />
      <div style={lbl}>Min chapter (unlock gate)</div>
      <input type="number" min={1} style={inp}
        value={s.unlockReqs?.minChapter ?? ''}
        onChange={e => update({
          unlockReqs: { ...(s.unlockReqs || { prereqIds: [] }), minChapter: e.target.value ? parseInt(e.target.value, 10) : undefined },
        })} />

      {/* Per-skill level / progression */}
      <div style={lbl}>Level / progression</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <button onClick={() => update({ level: Math.max(0, (s.level || 0) - 1) })} style={iconBtnSk(t)}>−</button>
        <span style={{
          fontFamily: t.mono, fontSize: 14, color: t.ink, fontWeight: 600,
          minWidth: 52, textAlign: 'center',
        }}>{s.level || 0} / {s.maxLevel || 5}</span>
        <button onClick={() => update({ level: Math.min(s.maxLevel || 5, (s.level || 0) + 1) })} style={iconBtnSk(t)}>+</button>
        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.12, textTransform: 'uppercase',
        }}>max</span>
        <input type="number" min={1} max={20}
          value={s.maxLevel || 5}
          onChange={e => update({ maxLevel: Math.max(1, parseInt(e.target.value, 10) || 5) })}
          style={{ width: 56, ...inp, marginTop: 0, fontFamily: t.mono, fontSize: 11, padding: '3px 6px' }} />
      </div>
      <div style={{ height: 6, background: t.rule, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
        <div style={{
          width: `${((s.level || 0) / (s.maxLevel || 5)) * 100}%`,
          height: '100%', background: t.accent, transition: 'width 200ms',
        }} />
      </div>
      {s.cooldown > 0 && (
        <div style={{ marginTop: 6, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
          cooldown: {s.cooldown} · cost: {s.costPoints || 1}
        </div>
      )}

      <div style={lbl}>Stat effects · while active</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{
              minWidth: 80, fontFamily: t.mono, fontSize: 10, color: t.ink2,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{k}</span>
            <input type="number" value={v} onChange={e => updateStat(k, e.target.value)}
              style={{ width: 60, ...inp, marginTop: 0, fontFamily: t.mono }} />
          </div>
        ))}
        <button onClick={addStat} style={{
          alignSelf: 'flex-start', marginTop: 4, padding: '4px 10px',
          background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`,
          borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>+ Stat</button>
      </div>

      {(s.unlockReqs?.prereqIds || []).length > 0 && (
        <>
          <div style={lbl}>Prerequisites</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {(s.unlockReqs.prereqIds).map(pid => (
              <span key={pid} style={{
                padding: '2px 8px', background: t.paper2, border: `1px solid ${t.rule}`,
                borderRadius: 999, fontFamily: t.mono, fontSize: 9, color: t.ink2,
              }}>{pid}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function iconBtnSk(t) {
  return {
    width: 26, height: 26, borderRadius: 999,
    border: `1px solid ${t.rule}`, background: 'transparent',
    color: t.ink2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 13, lineHeight: 1, padding: 0,
  };
}

// Skill bank — confirmed individual skills (not yet placed in any tree).
// Drag a chip onto any character's Skills tab or onto the tree canvas to
// commit the skill there. Migrates legacy `skills[]` items into the bank
// the first time the section opens (preserving the visual tree above).
function SkillBank({ store, t }) {
  const bank = store.skillBank || [];
  const trees = store.skillTrees || [];
  const [open, setOpen] = React.useState(true);
  const [name, setName] = React.useState('');

  const addToBank = () => {
    if (!name.trim()) return;
    const id = `skb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    store.setSlice('skillBank', xs => [
      ...(Array.isArray(xs) ? xs : []),
      { id, name: name.trim(), tier: 'novice', description: '', createdAt: Date.now() },
    ]);
    setName('');
  };

  const removeFromBank = (id) => {
    store.setSlice('skillBank', xs => (xs || []).filter(s => s.id !== id));
  };

  const newTree = () => {
    const id = `tr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    store.setSlice('skillTrees', xs => [
      ...(Array.isArray(xs) ? xs : []),
      { id, name: 'New tree', color: 'oklch(60% 0.13 80)', description: '', nodeIds: [], edges: [] },
    ]);
  };

  return (
    <div style={{ borderBottom: `1px solid ${t.rule}`, background: t.paper }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, color: t.ink2,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}>
        <span style={{ color: t.accent }}>{open ? '▾' : '▸'}</span>
        <span>Skill bank · {bank.length}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>
          {trees.length} tree{trees.length === 1 ? '' : 's'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addToBank(); }}
              placeholder="New skill name"
              style={{
                flex: 1, padding: '4px 8px',
                fontFamily: t.display, fontSize: 13, color: t.ink,
                background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
              }} />
            <button onClick={addToBank} disabled={!name.trim()} style={{
              padding: '4px 10px', background: t.accent, color: t.onAccent,
              border: 'none', borderRadius: 1, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
              fontWeight: 600, opacity: name.trim() ? 1 : 0.5,
            }}>+ Bank</button>
            <button onClick={newTree} style={{
              padding: '4px 10px', background: 'transparent', color: t.accent,
              border: `1px dashed ${t.accent}`, borderRadius: 1, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
              fontWeight: 600,
            }}>+ Tree</button>
          </div>
          {bank.length === 0 && (
            <div style={{
              padding: '10px 0',
              fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5,
            }}>
              The bank is empty. Add skills above, route them via the
              specialist (<code>@skills:</code>), or accept items from the
              review queue. Bank skills can be dragged onto a character.
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {bank.map(s => (
              <div key={s.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('application/x-lw-bank-skill', s.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{
                  padding: '3px 10px', background: t.paper2,
                  border: `1px solid ${t.rule}`, borderRadius: 999,
                  fontFamily: t.mono, fontSize: 10, color: t.ink2,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  cursor: 'grab',
                }}>
                {s.name}
                <button onClick={() => removeFromBank(s.id)} style={{
                  background: 'transparent', border: 'none', color: t.ink3,
                  cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
          {trees.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
              }}>Trees</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {trees.map(tr => (
                  <span key={tr.id} style={{
                    padding: '3px 10px', borderRadius: 999,
                    background: 'transparent', color: tr.color || t.accent,
                    border: `1px solid ${tr.color || t.accent}`,
                    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
                  }}>
                    {tr.name} · {(tr.nodeIds || []).length}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
