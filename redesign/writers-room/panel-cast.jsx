// writers-room/panel-cast.jsx — full character dossier: stats, skills, inventory, arc, relationships

function StatBar({ label, value, color }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{value}</span>
      </div>
      <div style={{ height: 3, background: t.rule, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

function CastPanel({ onClose, onInterview, onSendToWeaver }) {
  const t = useTheme();
  const { sel, select } = useSelection();
  const store = useStore();

  const addCharacter = () => {
    const id = window.createCharacter(store, {});
    select('character', id);
  };

  if (!WR.CAST.length) {
    return (
      <PanelFrame title="Who's on this page" eyebrow="Cast · empty" accent="oklch(55% 0.10 220)" onClose={onClose} width={440}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, marginBottom: 8 }}>No cast yet</div>
          <div style={{ fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 20px' }}>
            Add a character by hand, or keep writing — the Loom will notice names in your prose and offer to add them.
          </div>
          <button onClick={addCharacter} style={{ padding: '10px 18px', background: 'oklch(55% 0.10 220)', color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>+ Add character</button>
        </div>
      </PanelFrame>
    );
  }

  const charId = sel.character || WR.CAST[0].id;
  const c = WR.CAST.find(x => x.id === charId) || WR.CAST[0];
  const onPage = WR.CAST.filter(x => x.status === 'on-page');
  const offPage = WR.CAST.filter(x => x.status === 'off-page' || !x.status);
  const charItems = WR.ITEMS.filter(it => (c.inventory || []).includes(it.id));
  const charThreads = WR.THREADS.filter(th => (th.characters || []).includes(c.id));

  // arc chart data
  const arcMax = WR.BOOK.totalChapters;

  return (
    <PanelFrame title="Who's on this page" eyebrow={`Cast · ${onPage.length} on page`} accent="oklch(55% 0.10 220)" onClose={onClose} width={460}>
      {/* Roster */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>On page now · ch.{WR.BOOK.currentChapter}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {onPage.map(x => (
            <button key={x.id} onClick={() => select('character', x.id)} draggable onDragStart={e => dragEntity(e, 'character', x.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', background: charId === x.id ? x.color + '22' : 'transparent', border: `1px solid ${charId === x.id ? x.color : t.rule}`, borderRadius: 1, cursor: 'grab', fontFamily: t.display, fontSize: 12, color: t.ink }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: x.color, color: t.onAccent, display: 'grid', placeItems: 'center', fontFamily: t.display, fontWeight: 600, fontSize: 10 }}>{x.name[0]}</div>
              {x.name}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Off-page · relevant</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {offPage.map(x => (
            <button key={x.id} onClick={() => select('character', x.id)} draggable onDragStart={e => dragEntity(e, 'character', x.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', background: 'transparent', border: `1px solid ${charId === x.id ? x.color : t.rule}`, borderRadius: 1, cursor: 'grab', fontFamily: t.display, fontSize: 11, color: t.ink2, opacity: charId === x.id ? 1 : 0.7 }}>
              <span style={{ width: 6, height: 6, background: x.color, borderRadius: '50%' }} />
              {x.name}
            </button>
          ))}
          <button onClick={addCharacter} style={{ padding: '4px 9px', background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1 }}>+ new</button>
        </div>
      </div>

      {/* Dossier header — editable */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: c.color, color: t.onAccent, display: 'grid', placeItems: 'center', fontFamily: t.display, fontWeight: 500, fontSize: 22, flexShrink: 0 }}>{(c.name || '?')[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={[c.role, c.age, c.pronouns].filter(Boolean).join(' · ') || c.role || 'support'}
            onChange={e => {
              const parts = e.target.value.split('·').map(s => s.trim()).filter(Boolean);
              store.setSlice('cast', xs => xs.map(x => x.id === c.id ? { ...x, role: parts[0] || 'support', age: parts[1] || x.age, pronouns: parts[2] || x.pronouns } : x));
            }}
            style={{ width: '100%', fontFamily: t.mono, fontSize: 9, color: c.color, letterSpacing: 0.14, textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
          />
          <input
            value={c.name || ''}
            onChange={e => store.setSlice('cast', xs => xs.map(x => x.id === c.id ? { ...x, name: e.target.value } : x))}
            placeholder="Unnamed"
            style={{ width: '100%', fontFamily: t.display, fontSize: 24, color: t.ink, fontWeight: 500, marginTop: 2, lineHeight: 1.1, background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
          />
          <input
            value={c.oneliner || ''}
            onChange={e => store.setSlice('cast', xs => xs.map(x => x.id === c.id ? { ...x, oneliner: e.target.value } : x))}
            placeholder="One-line description"
            style={{ width: '100%', fontSize: 12, color: t.ink2, lineHeight: 1.5, fontStyle: 'italic', marginTop: 4, background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
          />
        </div>
      </div>

      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={onInterview} style={{ padding: '7px 12px', background: c.color, color: t.onAccent, border: 'none', borderRadius: 1, fontFamily: t.display, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="chat" size={12} color={t.onAccent} /> Interview</button>
        <button onClick={onSendToWeaver} style={{ padding: '7px 12px', background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 1, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>✦ Weave</button>
      </div>

      {/* Stats */}
      {Object.keys(c.stats || {}).length > 0 && (
      <CollapseSection title="Stats" count={Object.keys(c.stats || {}).length} accent={c.color}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
          {Object.entries(c.stats || {}).map(([k, v]) => <StatBar key={k} label={k} value={v} color={c.color} />)}
        </div>
      </CollapseSection>
      )}

      {/* Skills */}
      {(c.skills || []).length > 0 && (
      <CollapseSection title="Skills" count={(c.skills || []).length} accent={c.color}>
        {(c.skills || []).map((s, i) => (
          <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500, flex: 1 }}>{s.k}</span>
              <span style={{ padding: '1px 6px', background: t.paper2, fontFamily: t.mono, fontSize: 9, color: c.color, letterSpacing: 0.1, textTransform: 'uppercase', borderLeft: `2px solid ${c.color}` }}>{s.lvl}</span>
            </div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase', marginTop: 2 }}>{s.origin}</div>
            {s.detail && <div style={{ fontSize: 12, color: t.ink2, marginTop: 3, lineHeight: 1.5, fontStyle: 'italic' }}>{s.detail}</div>}
          </div>
        ))}
      </CollapseSection>
      )}

      {/* Inventory */}
      <CollapseSection title="Inventory" count={charItems.length} accent={c.color}>
        {charItems.map(it => {
          const last = it.track[it.track.length - 1];
          return (
            <div key={it.id} draggable onDragStart={e => dragEntity(e, 'item', it.id)} onClick={() => select('item', it.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', marginBottom: 3, background: sel.item === it.id ? t.paper2 : 'transparent', border: `1px solid ${sel.item === it.id ? t.accent : 'transparent'}`, borderRadius: 1, cursor: 'grab' }}>
              <span style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', background: t.paper2, borderRadius: 1, fontSize: 14, color: c.color, fontFamily: t.mono }}>{it.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink }}>{it.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{it.kind} · last: {last?.act} @ ch.{last?.ch}</div>
              </div>
              {last?.warning && <span style={{ color: t.warn, fontSize: 14 }}>⚠</span>}
            </div>
          );
        })}
      </CollapseSection>

      {/* Threads this character is in */}
      <CollapseSection title="Threads" count={charThreads.length} accent={c.color}>
        {charThreads.map(th => (
          <div key={th.id} onClick={() => select('thread', th.id)} draggable onDragStart={e => dragEntity(e, 'thread', th.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 3, background: sel.thread === th.id ? t.paper2 : 'transparent', border: `1px solid ${sel.thread === th.id ? th.color : 'transparent'}`, borderLeft: `2px solid ${th.color}`, borderRadius: 1, cursor: 'grab' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink }}>{th.name}</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{th.severity} · {th.beats.length} beats</div>
            </div>
          </div>
        ))}
      </CollapseSection>

      {/* Relationships */}
      {(c.relationships || []).length > 0 && (
      <CollapseSection title="Relationships" count={(c.relationships || []).length} accent={c.color}>
        {(c.relationships || []).map((r, i) => {
          const other = WR.CAST.find(x => x.id === r.to);
          if (!other) return null;
          return (
            <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => select('character', other.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'transparent', border: `1px solid ${other.color}`, borderRadius: 1, cursor: 'pointer', fontFamily: t.display, fontSize: 12, color: t.ink }}>
                  <span style={{ width: 6, height: 6, background: other.color, borderRadius: '50%' }} />
                  {other.name}
                </button>
                <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{r.kind}</span>
                <div style={{ flex: 1 }} />
                <div style={{ width: 48, height: 3, background: t.rule, borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ width: `${r.strength * 100}%`, height: '100%', background: c.color }} />
                </div>
              </div>
              {r.note && <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>{r.note}</div>}
            </div>
          );
        })}
      </CollapseSection>
      )}

      {/* Traits + voice */}
      {((c.traits || []).length > 0 || c.voice || c.wants) && (
      <CollapseSection title="Traits & voice" defaultOpen={false} accent={c.color}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {(c.traits || []).map(tr => <span key={tr} style={{ padding: '3px 8px', background: t.paper2, border: `1px solid ${t.rule}`, fontFamily: t.display, fontSize: 11, color: t.ink2, borderRadius: 1 }}>{tr}</span>)}
        </div>
        {c.voice && <><div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 6, marginBottom: 3 }}>Voice</div>
        <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5, fontStyle: 'italic' }}>{c.voice}</div></>}
        {c.wants && <><div style={{ fontFamily: t.mono, fontSize: 9, color: c.color, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 10, marginBottom: 3 }}>Wants</div>
        {c.wants.surface && <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}><i>Surface:</i> {c.wants.surface}</div>}
        {c.wants.true && <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}><i>True:</i> {c.wants.true}</div>}</>}
      </CollapseSection>
      )}

      {/* Knows / hides / fears */}
      {((c.knows || []).length > 0 || (c.hides || []).length > 0 || (c.fears || []).length > 0) && (
      <CollapseSection title="Knows · Hides · Fears" defaultOpen={false} accent={c.color}>
        {(c.knows || []).length > 0 && <><div style={{ fontFamily: t.mono, fontSize: 9, color: t.good, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }}>Knows</div>
        {(c.knows || []).map((k, i) => <div key={i} style={{ padding: '4px 0', fontSize: 12, color: t.ink2, lineHeight: 1.5, borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>· {k}</div>)}</>}
        {(c.hides || []).length > 0 && <><div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 10, marginBottom: 4 }}>Hides from others</div>
        {(c.hides || []).map((k, i) => <div key={i} style={{ padding: '4px 0', fontSize: 12, color: t.ink2, lineHeight: 1.5, borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>· {k}</div>)}</>}
        {(c.fears || []).length > 0 && <><div style={{ fontFamily: t.mono, fontSize: 9, color: t.warn, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 10, marginBottom: 4 }}>Fears</div>
        {(c.fears || []).map((k, i) => <div key={i} style={{ padding: '4px 0', fontSize: 12, color: t.ink2, lineHeight: 1.5, borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>· {k}</div>)}</>}
      </CollapseSection>
      )}

      {/* Arc */}
      {(c.arc || []).length > 0 && (
      <CollapseSection title="Arc across the book" count={(c.arc || []).length} accent={c.color}>
        <svg viewBox="0 0 100 40" style={{ width: '100%', marginBottom: 8 }}>
          <line x1="4" y1="20" x2="96" y2="20" stroke={t.rule} strokeWidth="0.4" />
          {Array.from({ length: arcMax }, (_, i) => {
            const x = 4 + (i / (arcMax - 1)) * 92;
            return <line key={i} x1={x} y1="19" x2={x} y2="21" stroke={t.ink3} strokeWidth="0.3" />;
          })}
          {(c.arc || []).map((b, i) => {
            const x = 4 + ((b.ch - 1) / (arcMax - 1)) * 92;
            const y = 20 - (i % 2 === 0 ? 10 : -10);
            return (
              <g key={i}>
                <line x1={x} y1="20" x2={x} y2={y} stroke={c.color} strokeWidth="0.4" strokeDasharray={b.projected ? '0.6 0.4' : ''} />
                <circle cx={x} cy={y} r="1.5" fill={b.projected ? 'transparent' : c.color} stroke={c.color} strokeWidth="0.4" />
                <text x={x} y={y > 20 ? y + 4 : y - 2} fontSize="2.2" textAnchor="middle" fill={t.ink2} fontFamily="'Fraunces', serif" fontStyle="italic">ch.{b.ch}</text>
              </g>
            );
          })}
          <line x1={4 + ((WR.BOOK.currentChapter - 1) / (arcMax - 1)) * 92} y1="6" x2={4 + ((WR.BOOK.currentChapter - 1) / (arcMax - 1)) * 92} y2="34" stroke={t.accent} strokeWidth="0.4" strokeDasharray="0.8 0.4" />
        </svg>
        {(c.arc || []).map((b, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 8, padding: '6px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none', opacity: b.projected ? 0.5 : 1 }}>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>CH.{String(b.ch).padStart(2, '0')}</div>
            <div>
              <div style={{ fontSize: 12, color: t.ink, fontFamily: t.display }}>{b.beat}</div>
              {b.warning && <div style={{ fontSize: 11, color: t.warn, fontStyle: 'italic', marginTop: 2 }}>⚠ {b.warning}</div>}
            </div>
          </div>
        ))}
      </CollapseSection>
      )}

      {c.notes && <div style={{ padding: '10px 16px 16px', borderTop: `1px solid ${t.rule}`, fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>{c.notes}</div>}
    </PanelFrame>
  );
}

window.CastPanel = CastPanel;
