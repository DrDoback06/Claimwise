// review.jsx — the review + apply stage of Canon Weaver.

function useViewportWidth() {
  const [w, setW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function WeaverReview({ idea, decisions, setDecisions, selectedEdit, setSelectedEdit, onApply, onCancel }) {
  const t = useTheme();
  const edits = WEAVER.EXAMPLE.edits;
  const cur = edits.find(e => e.id === selectedEdit) || edits[0];
  const vw = useViewportWidth();
  const narrow = vw < 1200;
  const veryNarrow = vw < 920;

  const setDecision = (id, val) => setDecisions(d => ({ ...d, [id]: val }));
  const counts = edits.reduce((acc, e) => {
    const v = decisions[e.id] || 'accept';
    acc[v] = (acc[v] || 0) + 1; return acc;
  }, {});
  const grouped = edits.reduce((acc, e) => {
    (acc[e.system] = acc[e.system] || []).push(e); return acc;
  }, {});

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* LEFT — list of proposed edits grouped by system */}
      <div style={{ width: veryNarrow ? 280 : (narrow ? 320 : 380), flexShrink: 0, borderRight: `1px solid ${t.rule}`, overflowY: 'auto', padding: '16px 0' }}>
        <div style={{ padding: '0 16px 14px', borderBottom: `1px solid ${t.rule}`, marginBottom: 10 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Your idea</div>
          <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' }}>"{idea}"</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.08 }}>
            <span>{edits.length} PROPOSED EDITS</span> · <span style={{ color: t.good }}>{counts.accept || 0} ACCEPT</span> · <span style={{ color: '#c88080' }}>{counts.reject || 0} REJECT</span>
          </div>
        </div>

        {Object.entries(grouped).map(([system, items]) => (
          <div key={system}>
            <div style={{ padding: '8px 16px', fontFamily: t.mono, fontSize: 9, color: SYSTEM_COLORS[system], letterSpacing: 0.14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={SYSTEM_ICON[system]} size={11} color={SYSTEM_COLORS[system]} /> {system} · {items.length}
            </div>
            {items.map(e => {
              const d = decisions[e.id] || 'accept';
              const isSel = selectedEdit === e.id;
              return (
                <button key={e.id} onClick={() => setSelectedEdit(e.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px',
                  background: isSel ? t.paper : 'transparent',
                  borderLeft: isSel ? `2px solid ${SYSTEM_COLORS[system]}` : '2px solid transparent',
                  border: 'none', borderBottom: `1px solid ${t.rule}`,
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500, lineHeight: 1.35 }}>{e.title}</div>
                    <div style={{ flexShrink: 0, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase',
                      color: d === 'accept' ? t.good : (d === 'reject' ? '#c88080' : t.warn),
                    }}>{d === 'accept' ? '✓' : d === 'reject' ? '✕' : '✎'}</div>
                  </div>
                  <div style={{ fontSize: 11, color: t.ink3, marginTop: 3, lineHeight: 1.4 }}>{e.reasoning.slice(0, 80)}…</div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* CENTER — the selected edit detail */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: narrow ? '24px 22px' : 32 }}>
        <EditDetail edit={cur} decision={decisions[cur.id] || 'accept'} setDecision={(v) => setDecision(cur.id, v)} />
      </div>

      {/* RIGHT — summary + apply (hidden on narrow; becomes bottom bar) */}
      {!narrow && <div style={{ width: 260, flexShrink: 0, borderLeft: `1px solid ${t.rule}`, background: t.paper2, padding: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 10 }}>Summary</div>
        <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.6, marginBottom: 18 }}>
          {counts.accept || 0} edits will be <span style={{ color: t.good }}>applied</span>.<br />
          {counts.reject || 0} will be <span style={{ color: '#c88080' }}>ignored</span>.<br />
          <span style={{ color: t.ink3 }}>All changes are undoable from Settings → Data & History.</span>
        </div>

        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Touched</div>
        {Object.entries(
          edits.filter(e => (decisions[e.id] || 'accept') === 'accept')
               .reduce((a, e) => { a[e.system] = (a[e.system] || 0) + 1; return a; }, {})
        ).map(([sys, n]) => (
          <div key={sys} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
            <span style={{ color: t.ink2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, background: SYSTEM_COLORS[sys], borderRadius: 1 }} /> {sys}
            </span>
            <span style={{ fontFamily: t.mono, color: t.ink3 }}>{n}</span>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <button onClick={onApply} style={{
          padding: '12px 16px',
          background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: t.radius,
          fontFamily: t.display, fontWeight: 500, fontSize: 14,
          cursor: 'pointer', marginTop: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Icon name="sparkle" size={14} /> Apply {counts.accept || 0} edits</button>
        <button onClick={onCancel} style={{
          padding: '10px', marginTop: 6,
          background: 'transparent', color: t.ink3,
          border: `1px solid ${t.rule}`, borderRadius: t.radius,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
        }}>Cancel weave</button>
      </div>}
    </div>

    {/* Narrow-viewport bottom bar */}
    {narrow && (
      <div style={{
        flexShrink: 0, borderTop: `1px solid ${t.rule}`, background: t.paper2,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>
          <span style={{ color: t.good }}>{counts.accept || 0} ACCEPT</span>
          {(counts.reject || 0) > 0 && <> · <span style={{ color: '#c88080' }}>{counts.reject} REJECT</span></>}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={{
          padding: '8px 14px', background: 'transparent', color: t.ink3,
          border: `1px solid ${t.rule}`, borderRadius: t.radius,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={onApply} style={{
          padding: '9px 18px', background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: t.radius,
          fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}><Icon name="sparkle" size={13} color={t.onAccent} /> Apply {counts.accept || 0} edits</button>
      </div>
    )}
    </div>
  );
}

function EditDetail({ edit, decision, setDecision }) {
  const t = useTheme();
  const color = SYSTEM_COLORS[edit.system];
  const [tweakNote, setTweakNote] = React.useState('');
  const [reproposed, setReproposed] = React.useState(false);
  const [reproposing, setReproposing] = React.useState(false);

  // Reset tweak state when switching edits
  React.useEffect(() => { setTweakNote(''); setReproposed(false); setReproposing(false); }, [edit.id]);

  const onRepropose = () => {
    setReproposing(true);
    setTimeout(() => { setReproposing(false); setReproposed(true); }, 1400);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
        <span style={{ fontFamily: t.mono, fontSize: 10, color: color, letterSpacing: 0.14, textTransform: 'uppercase' }}>{edit.system} · {edit.action}</span>
        {edit.target && <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>→ {edit.target}</span>}
      </div>
      <h2 style={{ fontFamily: t.display, fontSize: 30, fontWeight: 500, margin: '0 0 10px', letterSpacing: -0.015, lineHeight: 1.1, color: t.ink }}>{edit.title}</h2>

      {/* Reasoning */}
      <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderLeft: `2px solid ${color}`, padding: '14px 18px', borderRadius: t.radius, marginBottom: 20 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: color, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }}>Why the Loom suggests this</div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>{edit.reasoning}</div>
      </div>

      {/* Payload */}
      <div style={{ background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 18, marginBottom: 20 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 10 }}>What it does</div>
        <PayloadView edit={edit} />
      </div>

      {/* Decision buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { v: 'accept', label: 'Accept as-is', color: t.good },
          { v: 'edit',   label: 'Tweak first', color: t.warn },
          { v: 'reject', label: 'Reject',      color: '#c88080' },
        ].map(opt => (
          <button key={opt.v} onClick={() => setDecision(opt.v)} style={{
            flex: 1, padding: '10px 14px',
            background: decision === opt.v ? opt.color + '20' : t.paper,
            color: decision === opt.v ? opt.color : t.ink2,
            border: `1px solid ${decision === opt.v ? opt.color : t.rule}`, borderRadius: t.radius,
            fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${decision === opt.v ? opt.color : t.rule}`, display: 'grid', placeItems: 'center', fontSize: 10, color: opt.color }}>
              {decision === opt.v ? '●' : ''}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Inline tweak surface — appears when user picks "Tweak first" */}
      {decision === 'edit' && (
        <div style={{
          marginTop: 14, padding: 18,
          background: t.paper,
          border: `1px solid ${t.warn}`,
          borderLeft: `3px solid ${t.warn}`,
          borderRadius: t.radius,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.warn, letterSpacing: 0.14, textTransform: 'uppercase' }}>Your note to the Loom</span>
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.08 }}>— tell it what you'd change</span>
          </div>
          <textarea
            value={tweakNote}
            onChange={e => { setTweakNote(e.target.value); setReproposed(false); }}
            placeholder={tweakHintFor(edit)}
            style={{
              width: '100%', minHeight: 90, padding: 12,
              background: t.paper2, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.display, fontSize: 13, lineHeight: 1.55, resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {tweakChipsFor(edit).map(c => (
              <button key={c} onClick={() => setTweakNote(n => n ? n + ' ' + c : c)} style={{
                padding: '4px 9px', background: 'transparent', color: t.ink3,
                border: `1px solid ${t.rule}`, borderRadius: 1,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
              }}>+ {c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>
              {tweakNote.trim().split(/\s+/).filter(Boolean).length} WORDS · LOOM WILL RE-PROPOSE
            </div>
            <button onClick={onRepropose} disabled={!tweakNote.trim() || reproposing} style={{
              padding: '7px 14px',
              background: tweakNote.trim() ? t.warn : t.rule,
              color: t.onAccent,
              border: 'none', borderRadius: t.radius,
              fontFamily: t.display, fontWeight: 500, fontSize: 12,
              cursor: tweakNote.trim() ? 'pointer' : 'not-allowed', opacity: reproposing ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>{reproposing ? 'Re-proposing…' : (reproposed ? '↻ Re-propose again' : '✦ Re-propose')}</button>
          </div>

          {/* Re-proposed result */}
          {reproposed && (
            <div style={{ marginTop: 14, padding: 14, background: t.paper2, border: `1px dashed ${t.warn}`, borderRadius: t.radius }}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.warn, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Revised proposal · based on your note</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: t.ink, lineHeight: 1.65, fontStyle: 'italic' }}>
                {revisedFor(edit, tweakNote)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => setDecision('accept')} style={{
                  padding: '5px 11px', background: t.good, color: t.onAccent,
                  border: 'none', borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
                }}>✓ Accept revision</button>
                <button onClick={() => { setReproposed(false); }} style={{
                  padding: '5px 11px', background: 'transparent', color: t.ink3,
                  border: `1px solid ${t.rule}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
                }}>Keep tweaking</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Context-aware placeholder for the tweak textarea
function tweakHintFor(edit) {
  if (edit.system === 'Chapter') return 'e.g. "Keep the whistle metaphor but make the sentence shorter" or "drop the em-dash, match the chapter\'s voice more closely"';
  if (edit.action === 'create-thread') return 'e.g. "Open this thread earlier — chapter 4 not chapter 6" or "reduce severity to moderate"';
  if (edit.action === 'pin-place') return 'e.g. "Move it further north, closer to the mountains"';
  if (edit.action === 'trait-hint') return 'e.g. "Make the trait more subtle — she shouldn\'t know she\'s answering it"';
  if (edit.action === 'inventory-add') return 'e.g. "She hides it — doesn\'t put it on her belt openly"';
  return 'What would you change about this proposal?';
}

// Quick-add chip suggestions
function tweakChipsFor(edit) {
  if (edit.system === 'Chapter') return ['shorter', 'lower intrusion', 'change voice', 'different placement'];
  if (edit.action === 'create-thread') return ['open earlier', 'reduce severity', 'different tie-in'];
  if (edit.action === 'pin-place') return ['move north', 'move south', 'rename', 'different kind'];
  if (edit.action === 'trait-hint') return ['more subtle', 'stronger', 'different chapter'];
  return ['make it subtler', 'try again', 'different angle'];
}

// Simulated "revised" proposal text
function revisedFor(edit, note) {
  if (edit.system === 'Chapter' && edit.action === 'suggest-edit') {
    return `Revised ${edit.target} insertion — ${note.toLowerCase().includes('shorter') ? 'tightened to one sentence' : 'adjusted for your note'}: "${edit.payload.after.slice(edit.payload.before.length, edit.payload.before.length + 90).trim()}…" The Loom has also lowered intrusion to "low".`;
  }
  if (edit.action === 'create-thread') return `Revised thread — opens at ch.${Math.max(1, edit.payload.opens - 2)} (earlier per your note). Severity: moderate. Tie-in retained.`;
  if (edit.action === 'pin-place') return `Revised pin coords — shifted to reflect your note. Preview updated on the Atlas map above.`;
  return `The Loom has re-read your note ("${note.slice(0, 60)}${note.length > 60 ? '…' : ''}") and produced a revised proposal. Accept it, or keep tweaking.`;
}

function PayloadView({ edit }) {
  const t = useTheme();
  const p = edit.payload;

  if (edit.system === 'Chapter' && edit.action === 'suggest-edit') {
    return (
      <div style={{ fontFamily: "'Fraunces', serif" }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, marginBottom: 4, textTransform: 'uppercase' }}>Before · {edit.target}</div>
        <div style={{ padding: 12, background: t.paper, borderRadius: 2, fontSize: 14, color: t.ink3, lineHeight: 1.65, marginBottom: 10, borderLeft: `2px solid ${t.rule}` }}>{p.before}</div>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.12, marginBottom: 4, textTransform: 'uppercase' }}>After · with insertion</div>
        <div style={{ padding: 12, background: t.paper, borderRadius: 2, fontSize: 14, color: t.ink, lineHeight: 1.65, borderLeft: `2px solid ${t.accent}` }}>
          {(() => {
            const added = p.after.slice(p.before.length);
            return (<>
              {p.before}
              <span style={{ background: t.accent + '30', color: t.ink, padding: '1px 2px' }}>{added}</span>
            </>);
          })()}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginTop: 10 }}>INTRUSION · {p.intrusion}</div>
      </div>
    );
  }

  if (edit.system === 'World' && edit.action === 'create') {
    return (
      <div>
        <div style={{ fontFamily: t.display, fontSize: 20, color: t.ink, fontWeight: 500 }}>{p.name}</div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 2 }}>{p.type.toUpperCase()}</div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, marginTop: 10, fontStyle: 'italic' }}>{p.description}</div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.1, marginTop: 14, textTransform: 'uppercase' }}>Provenance</div>
        {p.provenance.map((l, i) => <div key={i} style={{ fontSize: 12, color: t.ink2, paddingLeft: 10, marginTop: 3 }}>· {l}</div>)}
        <div style={{ marginTop: 12, display: 'flex', gap: 5 }}>
          {p.tags.map(tag => <Chip key={tag}>{tag}</Chip>)}
        </div>
      </div>
    );
  }

  if (edit.action === 'inventory-add') {
    return (
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, background: t.paper, border: `1px solid ${t.accent}`, borderRadius: 2, display: 'grid', placeItems: 'center', fontSize: 24, color: t.accent }}>⚔</div>
        <div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.1, textTransform: 'uppercase' }}>CH.{p.chapter} · {p.change}</div>
          <div style={{ fontFamily: t.display, fontSize: 17, color: t.ink, marginTop: 2, fontWeight: 500 }}>{p.item}</div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 2 }}>Slot · {p.slot}</div>
        </div>
      </div>
    );
  }

  if (edit.action === 'trait-hint' || edit.action === 'backstory-link') {
    return (
      <div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.1, textTransform: 'uppercase' }}>From ch.{p.chapter} · {p.change}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: t.ink, marginTop: 8, lineHeight: 1.6, fontStyle: 'italic' }}>"{p.note}"</div>
      </div>
    );
  }

  if (edit.action === 'create-thread') {
    return (
      <div>
        <div style={{ fontFamily: t.display, fontSize: 19, color: t.ink, fontWeight: 500 }}>{p.name}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, fontFamily: t.mono, fontSize: 11, color: t.ink3 }}>
          <span>OPENS CH.{p.opens}</span> · <span>SEVERITY {p.severity.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 12, color: t.ink2, marginTop: 10 }}>Ties into existing thread: <span style={{ color: t.accent }}>{p.tieIn}</span></div>
        {/* Mini thread bar */}
        <div style={{ marginTop: 14, height: 10, background: t.rule, borderRadius: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: `${(p.opens / 18) * 100}%`, top: 0, bottom: 0, right: '5%', background: t.accent, borderRadius: 1 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.mono, fontSize: 9, color: t.ink3, marginTop: 3 }}>
          <span>CH.1</span><span>CH.18</span>
        </div>
      </div>
    );
  }

  if (edit.action === 'pin') {
    return (
      <div>
        {p.pins.map((pin, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < p.pins.length - 1 ? `1px solid ${t.rule}` : 'none' }}>
            <div style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, width: 100, letterSpacing: 0.1 }}>{pin.when}</div>
            <div style={{ fontSize: 13, color: t.ink2, flex: 1 }}>{pin.what}</div>
          </div>
        ))}
      </div>
    );
  }

  if (edit.action === 'pin-place') {
    return (
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <svg viewBox="0 0 400 260" width="200" height="130" style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2 }}>
          <path d="M 40 100 Q 30 60 80 40 Q 160 30 220 60 Q 280 50 340 90 L 360 140 Q 350 190 290 200 L 240 220 Q 160 230 110 210 Q 50 180 40 100 Z" fill={t.paper2} stroke={t.ink3} strokeWidth="1" opacity="0.6" />
          <circle cx={(p.x / 1000) * 400} cy={(p.y / 700) * 260} r="8" fill={t.accent} />
          <circle cx={(p.x / 1000) * 400} cy={(p.y / 700) * 260} r="16" fill="none" stroke={t.accent} strokeDasharray="3 3" opacity="0.6" />
        </svg>
        <div>
          <div style={{ fontFamily: t.display, fontSize: 17, color: t.ink, fontWeight: 500 }}>{p.name}</div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 4 }}>KIND · {p.kind.toUpperCase()}</div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>COORDS · {p.x}, {p.y}</div>
        </div>
      </div>
    );
  }

  return <div style={{ fontSize: 13, color: t.ink3 }}>{JSON.stringify(p)}</div>;
}

// Applied screen
function WeaverApplied({ decisions }) {
  const t = useTheme();
  const n = Object.values(decisions).filter(v => v === 'accept').length;
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 52, color: t.accent, marginBottom: 12 }}>✦</div>
        <h1 style={{ fontFamily: t.display, fontSize: 40, fontWeight: 400, letterSpacing: -0.02, margin: '0 0 10px', lineHeight: 1.1, color: t.ink }}>
          <em style={{ color: t.accent }}>{n} edits</em> woven.
        </h1>
        <p style={{ fontSize: 14, color: t.ink2, margin: 0, lineHeight: 1.6 }}>The canon is updated. Your next chapter, character sheet, wiki page, plot board, timeline, and atlas all reflect this change. You can undo any of it from Settings → Data & History at any time.</p>
      </div>
    </div>
  );
}

window.WeaverReview = WeaverReview;
window.WeaverApplied = WeaverApplied;

// Boot
ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider><WeaverApp /></ThemeProvider>
);
