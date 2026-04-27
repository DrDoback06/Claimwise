// writers-room/panel-threads.jsx — Threads + Voice + Items + Language + Mind Map + Interview

// ═══════════════════════════════════════════════════════════════
// THREADS PANEL — plot board with character filter, beats, severity
// ═══════════════════════════════════════════════════════════════
function ThreadsPanel({ onClose, onSendToWeaver }) {
  const t = useTheme();
  const { sel, select } = useSelection();
  const store = useStore();
  const [filter, setFilter] = React.useState('all'); // all | character

  const addThread = () => {
    const id = window.createThread(store, {});
    select('thread', id);
  };

  if (!WR.THREADS.length) {
    return (
      <PanelFrame title="Threads in play" eyebrow="Threads · empty" accent="oklch(72% 0.13 78)" onClose={onClose} width={460}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, marginBottom: 8 }}>No threads yet</div>
          <div style={{ fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 20px' }}>
            Threads are promises the book makes to the reader — stakes, secrets, debts. Add one manually, or the Loom will offer to name threads it notices.
          </div>
          <button onClick={addThread} style={{ padding: '10px 18px', background: 'oklch(72% 0.13 78)', color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>+ Add thread</button>
        </div>
      </PanelFrame>
    );
  }

  const visible = filter === 'character'
    ? WR.THREADS.filter(th => (th.characters || []).includes(sel.character))
    : WR.THREADS;
  const active = visible.filter(th => th.active !== false);
  const dormant = visible.filter(th => th.active === false);

  const th = WR.THREADS.find(x => x.id === sel.thread) || WR.THREADS[0];
  const arcMax = WR.BOOK.totalChapters || 1;

  return (
    <PanelFrame title="Threads in play" eyebrow={`Threads · ${active.length} active`} accent="oklch(72% 0.13 78)" onClose={onClose} width={460}>
      <div style={{ padding: '10px 16px', display: 'flex', gap: 4, borderBottom: `1px solid ${t.rule}` }}>
        <button onClick={() => setFilter('all')} style={{ padding: '4px 10px', background: filter === 'all' ? t.paper2 : 'transparent', border: `1px solid ${filter === 'all' ? t.ink3 : t.rule}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', color: t.ink, cursor: 'pointer', borderRadius: 1 }}>All</button>
        <button onClick={() => setFilter('character')} style={{ padding: '4px 10px', background: filter === 'character' ? t.paper2 : 'transparent', border: `1px solid ${filter === 'character' ? t.ink3 : t.rule}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', color: t.ink, cursor: 'pointer', borderRadius: 1 }}>Threads with {WR.CAST.find(c => c.id === sel.character)?.name.split(' ')[0]}</button>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {active.map(x => (
          <div key={x.id} onClick={() => select('thread', x.id)} draggable onDragStart={e => dragEntity(e, 'thread', x.id)} style={{ marginBottom: 10, padding: 12, borderLeft: `3px solid ${x.color}`, background: sel.thread === x.id ? t.paper2 : 'transparent', border: `1px solid ${sel.thread === x.id ? t.ink3 : t.rule}`, borderRadius: 1, cursor: 'grab' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500, flex: 1 }}>{x.name}</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{x.severity}</div>
            </div>
            {x.description && <div style={{ fontSize: 12, color: t.ink2, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 6 }}>{x.description}</div>}
            <svg viewBox="0 0 100 10" style={{ width: '100%' }}>
              <line x1="2" y1="5" x2="98" y2="5" stroke={t.rule} strokeWidth="0.3" />
              {x.beats.map((b, i) => {
                const px = 2 + ((b.ch - 1) / (arcMax - 1)) * 96;
                return <circle key={i} cx={px} cy="5" r="1" fill={x.color} />;
              })}
              <line x1={2 + ((WR.BOOK.currentChapter - 1) / (arcMax - 1)) * 96} y1="1" x2={2 + ((WR.BOOK.currentChapter - 1) / (arcMax - 1)) * 96} y2="9" stroke={t.accent} strokeWidth="0.4" strokeDasharray="0.6 0.3" />
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
              opens ch.{x.opens} · {x.beats.length} beats
              <div style={{ flex: 1 }} />
              {x.characters.map(cid => <span key={cid} style={{ width: 6, height: 6, borderRadius: '50%', background: WR.CAST.find(c => c.id === cid)?.color }} />)}
            </div>
            {x.warning && <div style={{ fontSize: 11, color: t.warn, fontStyle: 'italic', marginTop: 6 }}>⚠ {x.warning}</div>}
          </div>
        ))}

        {dormant.length > 0 && (
          <>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', margin: '14px 0 6px' }}>Dormant</div>
            {dormant.map(x => (
              <div key={x.id} onClick={() => select('thread', x.id)} draggable onDragStart={e => dragEntity(e, 'thread', x.id)} style={{ marginBottom: 6, padding: '8px 12px', borderLeft: `3px solid ${x.color}`, background: 'transparent', border: `1px solid ${t.rule}`, borderRadius: 1, cursor: 'grab', opacity: 0.7 }}>
                <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2 }}>{x.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>last: ch.{x.beats[x.beats.length - 1].ch}</div>
              </div>
            ))}
          </>
        )}

        <button onClick={addThread} style={{ width: '100%', padding: '8px 12px', background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1, marginTop: 6 }}>+ New thread</button>
      </div>

      {/* Selected thread detail */}
      {th && (
        <div style={{ borderTop: `1px solid ${t.rule}`, padding: '14px 16px' }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: th.color, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }}>Thread focus</div>
          <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginBottom: 6 }}>{th.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {th.characters.map(cid => <EntityChip key={cid} kind="character" id={cid} size="sm" />)}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Beats</div>
          {th.beats.map((b, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '46px 1fr', padding: '5px 0', gap: 8, borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>CH.{String(b.ch).padStart(2, '0')}</div>
              <div style={{ fontSize: 12, color: t.ink }}>{b.label}</div>
            </div>
          ))}
          <button onClick={onSendToWeaver} style={{ width: '100%', marginTop: 12, padding: '8px 12px', background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>✦ Weave next beat →</button>
        </div>
      )}
    </PanelFrame>
  );
}

// ═══════════════════════════════════════════════════════════════
// VOICE PANEL — profiles, sliders, paragraph match, history
// ═══════════════════════════════════════════════════════════════
function VoicePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const v = WR.VOICE;
  const [profileId, setProfileId] = React.useState((v.profiles[0] && v.profiles[0].id) || null);
  const [compareId, setCompareId] = React.useState(null);
  const [teaching, setTeaching] = React.useState(false);
  const [sample, setSample] = React.useState('');
  const [analysing, setAnalysing] = React.useState(false);
  const [error, setError] = React.useState(null);

  const teachFromSample = async () => {
    if (!sample.trim()) { setError('Paste a passage first.'); return; }
    const CW = window.CW;
    if (!CW?.aiService?.callAI) { setError('AI service unavailable — add a provider key in Settings.'); return; }
    setAnalysing(true); setError(null);
    try {
      const prompt = CW.promptTemplates?.styleAnalysis?.(sample) || `Analyse this prose sample and extract a voice profile in JSON: narratorTone, sentenceStructure, wordChoice, dialogueStyle, uniquePatterns. Sample:\n\n${sample}`;
      const raw = await CW.aiService.callAI(prompt, 'style_analysis', '', {});
      const parsed = CW.parseExternalAIResponse?.(raw) || (() => { try { return JSON.parse(raw); } catch { return { raw }; } })();
      const name = prompt && parsed?.voiceProfile?.name ? parsed.voiceProfile.name : `Voice · ${new Date().toLocaleDateString()}`;
      const newProfile = {
        id: window.rid('vp'),
        name,
        source: 'teach',
        styleProfile: parsed,
        sliders: {},
        createdAt: Date.now(),
        lastMatch: 1,
      };
      store.setSlice('voice', vs => [newProfile, ...(vs || [])]);
      setProfileId(newProfile.id);
      setSample('');
      setTeaching(false);
      store.recordFeedback?.('voice', 'accept', { source: 'teach' });
    } catch (e) {
      setError(e.message || 'Analysis failed.');
    }
    setAnalysing(false);
  };

  if (!(v.profiles || []).length && !teaching) {
    return (
      <PanelFrame title="Voice · The Loom" eyebrow="Voice · empty" accent="oklch(62% 0.16 25)" onClose={onClose} width={440}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, marginBottom: 8 }}>No voice profile yet</div>
          <div style={{ fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 20px' }}>
            Paste a passage that feels like you. The Loom will learn the rhythm, word-choice and tone — and match new prose against it.
          </div>
          <button onClick={() => setTeaching(true)} style={{ padding: '10px 18px', background: 'oklch(62% 0.16 25)', color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>✦ Teach voice</button>
        </div>
      </PanelFrame>
    );
  }

  if (teaching) {
    return (
      <PanelFrame title="Teach voice" eyebrow="Paste a passage that feels like you" accent="oklch(62% 0.16 25)" onClose={onClose} width={480}>
        <div style={{ padding: 16 }}>
          <textarea value={sample} onChange={e => setSample(e.target.value)}
            placeholder="Paste a chapter, a scene, or a paragraph — the longer the better."
            style={{ width: '100%', minHeight: 240, padding: 12, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.55, outline: 'none', resize: 'vertical' }} />
          {error && <div style={{ marginTop: 8, padding: 8, background: t.paper, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={teachFromSample} disabled={analysing || !sample.trim()}
              style={{ padding: '10px 16px', background: 'oklch(62% 0.16 25)', color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', opacity: (analysing || !sample.trim()) ? 0.5 : 1 }}>
              {analysing ? 'Listening…' : '✦ Analyse & save'}
            </button>
            <button onClick={() => setTeaching(false)} style={{ padding: '10px 14px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </PanelFrame>
    );
  }

  const activeProfile = v.profiles.find(p => p.id === profileId) || v.profiles[0];
  const sliders = v.profileSliders[profileId] || {};
  const compare = compareId ? (v.profileSliders[compareId] || {}) : null;

  return (
    <PanelFrame title="Voice · The Loom" eyebrow={`${Math.round((v.match || 0) * 100)}% match`} accent="oklch(62% 0.16 25)" onClose={onClose}>
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${t.rule}` }}>
        <button onClick={() => setTeaching(true)} style={{ width: '100%', padding: '7px 10px', background: 'transparent', color: 'oklch(62% 0.16 25)', border: `1px dashed oklch(62% 0.16 25)`, borderRadius: 1, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>✦ Teach another voice</button>
      </div>
      {/* Profiles */}
      <CollapseSection title="Profiles" count={v.profiles.length} defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {v.profiles.map(p => (
            <button key={p.id} onClick={() => setProfileId(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: profileId === p.id ? t.paper2 : 'transparent', border: `1px solid ${profileId === p.id ? t.accent : t.rule}`, borderRadius: 1, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{p.note || '—'}</div>
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 11, color: p.match > 0.85 ? t.good : p.match > 0.7 ? t.warn : t.ink3 }}>{p.match ? Math.round(p.match * 100) + '%' : '—'}</div>
            </button>
          ))}
        </div>
        {v.profiles.length > 1 && (
          <>
            <div style={{ marginTop: 8, fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>Compare against:</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {v.profiles.filter(p => p.id !== profileId).map(p => (
                <button key={p.id} onClick={() => setCompareId(compareId === p.id ? null : p.id)} style={{ padding: '3px 8px', background: compareId === p.id ? t.accent + '22' : 'transparent', border: `1px solid ${compareId === p.id ? t.accent : t.rule}`, fontFamily: t.display, fontSize: 11, color: t.ink2, cursor: 'pointer', borderRadius: 1 }}>{p.name}</button>
              ))}
            </div>
          </>
        )}
      </CollapseSection>

      {/* Style profile details from the AI analysis */}
      {activeProfile?.styleProfile?.voiceProfile && (
        <CollapseSection title="Captured profile" defaultOpen>
          {Object.entries(activeProfile.styleProfile.voiceProfile).map(([k, val]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 2 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.55, fontStyle: 'italic' }}>{Array.isArray(val) ? val.join(' · ') : String(val)}</div>
            </div>
          ))}
        </CollapseSection>
      )}

      {/* Sliders (if any were recorded) */}
      {Object.keys(sliders).length > 0 && (
      <CollapseSection title={`Dials · ${activeProfile.name}`} defaultOpen>
        {Object.entries(sliders).map(([k, val]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1, textTransform: 'uppercase' }}>{k}</span>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{typeof val === 'number' ? Math.round(val * 100) + '%' : val}{compare && compare[k] != null && ` / ${typeof compare[k] === 'number' ? Math.round(compare[k] * 100) + '%' : compare[k]}`}</span>
            </div>
            <div style={{ position: 'relative', height: 4, background: t.rule, borderRadius: 1 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: `${typeof val === 'number' ? val * 100 : 0}%`, height: '100%', background: t.accent }} />
              {compare && compare[k] != null && typeof compare[k] === 'number' && <div style={{ position: 'absolute', left: `${compare[k] * 100}%`, top: -3, width: 2, height: 10, background: t.ink3 }} />}
            </div>
          </div>
        ))}
      </CollapseSection>
      )}
    </PanelFrame>
  );
}

// ═══════════════════════════════════════════════════════════════
// ITEMS PANEL — inventory tracking across chapters
// ═══════════════════════════════════════════════════════════════
function ItemsPanel({ onClose }) {
  const t = useTheme();
  const { sel, select } = useSelection();
  const store = useStore();

  const addItem = () => {
    const id = window.createItem(store, {});
    select('item', id);
  };

  if (!WR.ITEMS.length) {
    return (
      <PanelFrame title="Objects on the table" eyebrow="Items · empty" accent={t.accent} onClose={onClose} width={440}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, marginBottom: 8 }}>No objects yet</div>
          <div style={{ fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 20px' }}>
            Props, tokens, artefacts — things that move between hands and carry weight. Add one manually, or mention one in the prose and the Loom will offer to track it.
          </div>
          <button onClick={addItem} style={{ padding: '10px 18px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>+ Add item</button>
        </div>
      </PanelFrame>
    );
  }

  const it = WR.ITEMS.find(x => x.id === sel.item) || WR.ITEMS[0];
  const owner = WR.CAST.find(c => c.id === it.owner);

  return (
    <PanelFrame title="Objects on the table" eyebrow={`Items · ${WR.ITEMS.length}`} accent={t.accent} onClose={onClose}>
      {/* grid of all items */}
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderBottom: `1px solid ${t.rule}` }}>
        {WR.ITEMS.map(x => {
          const owner = WR.CAST.find(c => c.id === x.owner);
          const track = x.track || [];
          const last = track[track.length - 1];
          return (
            <button key={x.id} onClick={() => select('item', x.id)} draggable onDragStart={e => dragEntity(e, 'item', x.id)} style={{ display: 'flex', gap: 8, padding: 8, background: sel.item === x.id ? t.paper2 : 'transparent', border: `1px solid ${sel.item === x.id ? t.accent : t.rule}`, borderRadius: 1, cursor: 'grab', textAlign: 'left' }}>
              <div style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', background: t.paper2, fontSize: 14, color: owner?.color || t.ink2, borderRadius: 1 }}>{x.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.display, fontSize: 12, fontWeight: 500, color: t.ink, lineHeight: 1.2 }}>{x.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{x.kind}{last?.warning ? ' · ⚠' : ''}</div>
              </div>
            </button>
          );
        })}
        <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: 'transparent', border: `1px dashed ${t.accent}`, borderRadius: 1, cursor: 'pointer', color: t.accent, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase' }}>+ Add</button>
      </div>

      {/* detail */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', background: t.paper2, fontSize: 26, color: owner?.color, borderRadius: 1 }}>{it.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>{it.kind}</div>
            <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, fontWeight: 500, lineHeight: 1.1 }}>{it.name}</div>
            {owner && <div style={{ marginTop: 4 }}><EntityChip kind="character" id={owner.id} size="sm" /></div>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, marginTop: 10, fontStyle: 'italic' }}>{it.description || it.notes}</div>
        {it.symbolism && <div style={{ marginTop: 8, padding: '6px 10px', background: t.paper2, borderLeft: `2px solid ${t.accent}`, borderRadius: 1, fontSize: 12, color: t.ink2, fontStyle: 'italic' }}>
          <b style={{ fontStyle: 'normal', fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', color: t.accent }}>Symbolism ·</b> {it.symbolism}
        </div>}
      </div>

      {/* Track across chapters */}
      {(it.track || []).length > 0 && <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Track across the book</div>
        {it.track.map((step, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '46px 12px 1fr', gap: 8, padding: '6px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>CH.{String(step.ch).padStart(2, '0')}</div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ width: 8, height: 8, background: step.warning ? t.warn : t.accent, borderRadius: '50%' }} />
              {i < it.track.length - 1 && <span style={{ position: 'absolute', top: 8, bottom: -12, width: 1, background: t.rule }} />}
            </div>
            <div>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{step.act}</div>
              {step.detail && <div style={{ fontSize: 12, color: t.ink2, fontStyle: 'italic', marginTop: 2, lineHeight: 1.5 }}>{step.detail}</div>}
              {step.warning && typeof step.warning === 'string' && <div style={{ fontSize: 11, color: t.warn, marginTop: 3 }}>⚠ {step.warning}</div>}
            </div>
          </div>
        ))}
      </div>}
    </PanelFrame>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGE PANEL — wired to CW.writingEnhancementServices
// Runs checkContinuity · analyzePacing · checkVoiceConsistency ·
// trackEmotionalBeats · enhanceDialogue · injectSensoryDetails ·
// suggestForeshadowing against the current chapter's prose.
// ═══════════════════════════════════════════════════════════════
function LanguagePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const [running, setRunning] = React.useState(null);
  const [error, setError] = React.useState(null);

  const chapterId = store.ui.activeChapterId;
  const chapter = chapterId ? store.chapters[chapterId] : null;
  const chapterText = chapter?.text || '';

  // Read scan results out of store.noticings[chapterId].lang — that's where
  // the scans write their structured output so it survives panel teardown.
  const noticings = (chapterId && store.noticings?.[chapterId]?.lang) || {};

  const CW = window.CW;
  const svcs = CW?.writingEnhancementServices || {};
  const { sel } = useSelection();
  const selectedCharacter = (store.cast || []).find(c => c.id === sel?.character);
  const bookId = store.book?.id || 'lw.primary';

  // Each entry encodes what the real service actually needs. Panels that need
  // a character name disable themselves when no character is selected.
  const scans = [
    {
      k: 'continuity', label: 'Continuity',
      fn: svcs.checkContinuity,
      call: (text) => svcs.checkContinuity(text, chapterId, bookId, {
        characters: (store.cast || []).map(c => ({ name: c.name, role: c.role })),
        places: (store.places || []).map(p => p.name),
        threads: (store.threads || []).map(th => ({ name: th.name, active: th.active !== false })),
        items: (store.items || []).map(i => i.name),
      }),
    },
    {
      k: 'pacing', label: 'Pacing',
      fn: svcs.analyzePacing,
      call: (text) => svcs.analyzePacing(text),
    },
    {
      k: 'beats', label: 'Emotional beats',
      fn: svcs.trackEmotionalBeats,
      call: (text) => svcs.trackEmotionalBeats(text, chapterId, bookId),
    },
    {
      k: 'sensory', label: 'Sensory details',
      fn: svcs.injectSensoryDetails,
      call: (text) => svcs.injectSensoryDetails(text, ['sight','sound','smell','touch','taste'], chapterId, bookId),
    },
    {
      k: 'foreshadow', label: 'Foreshadowing ideas',
      fn: svcs.suggestForeshadowing,
      call: (text) => {
        const order = store.book?.chapterOrder || [];
        const idx = order.indexOf(chapterId);
        const futureChapters = idx >= 0
          ? order.slice(idx + 1, idx + 6).map(id => {
              const c = store.chapters[id];
              return c ? { n: c.n, title: c.title, text: (c.text || '').slice(0, 500) } : null;
            }).filter(Boolean)
          : [];
        return svcs.suggestForeshadowing(text, futureChapters, chapterId, bookId);
      },
    },
    // Dialogue-focused scans need a character in context
    {
      k: 'dialogue', label: 'Dialogue polish',
      fn: svcs.enhanceDialogue,
      requiresCharacter: true,
      call: (text) => svcs.enhanceDialogue(text, selectedCharacter?.name || '', chapterId, bookId),
    },
    {
      k: 'voice', label: 'Voice consistency',
      fn: svcs.checkVoiceConsistency,
      requiresCharacter: true,
      call: (text) => svcs.checkVoiceConsistency(text, selectedCharacter?.name || '', chapterId, bookId),
    },
  ];

  async function runScan(scan) {
    if (!chapter || !chapterText.trim()) { setError('Nothing in this chapter to scan yet.'); return; }
    if (!scan.fn) { setError(`${scan.label} isn't available — service not loaded.`); return; }
    if (scan.requiresCharacter && !selectedCharacter) {
      setError(`${scan.label} needs a character in focus. Open the Cast and pick one.`);
      return;
    }
    setRunning(scan.k); setError(null);
    try {
      const result = await scan.call(chapterText);
      store.setSlice('noticings', ns => {
        const next = { ...(ns || {}) };
        next[chapterId] = { ...(next[chapterId] || {}), lang: { ...(next[chapterId]?.lang || {}), [scan.k]: result } };
        return next;
      });
      store.recordFeedback?.('lang', 'accept', { scan: scan.k });
    } catch (e) {
      setError(e.message || `${scan.label} scan failed.`);
    }
    setRunning(null);
  }

  const resultKeys = Object.keys(noticings);
  const totalIssues = resultKeys.reduce((n, k) => {
    const r = noticings[k];
    if (Array.isArray(r)) return n + r.length;
    if (r?.issues?.length) return n + r.issues.length;
    return n + (r ? 1 : 0);
  }, 0);

  return (
    <PanelFrame title="Language workbench" eyebrow={`${totalIssues} notes${chapter ? ' · ch.' + chapter.n : ''}`} accent="oklch(58% 0.12 300)" onClose={onClose} width={480}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Run a scan</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {scans.map(s => (
            <button
              key={s.k}
              onClick={() => runScan(s)}
              disabled={running !== null || !chapterText.trim() || !s.fn}
              style={{
                padding: '8px 10px',
                background: noticings[s.k] ? t.paper2 : 'transparent',
                border: `1px solid ${noticings[s.k] ? 'oklch(58% 0.12 300)' : t.rule}`,
                borderLeft: `3px solid ${noticings[s.k] ? 'oklch(58% 0.12 300)' : t.rule}`,
                color: t.ink,
                fontFamily: t.display, fontSize: 12, textAlign: 'left',
                cursor: (running || !chapterText.trim() || !s.fn) ? 'not-allowed' : 'pointer',
                opacity: (running || !chapterText.trim() || !s.fn) ? 0.5 : 1,
                borderRadius: 1,
              }}>
              {running === s.k ? 'Running…' : s.label}
            </button>
          ))}
        </div>
        {error && <div style={{ marginTop: 8, padding: 8, background: t.paper, borderLeft: `3px solid ${t.warn}`, fontSize: 11, color: t.warn }}>{error}</div>}
        {!chapterText.trim() && <div style={{ marginTop: 8, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>Write something in this chapter first.</div>}
      </div>

      <div style={{ padding: 16, overflowY: 'auto' }}>
        {totalIssues === 0 && (
          <div style={{ fontSize: 13, color: t.ink3, fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
            Run any scan above. Results show here and on the margin.
          </div>
        )}
        {scans.map(s => {
          const r = noticings[s.k]; if (!r) return null;
          return <ScanResult key={s.k} label={s.label} result={r} t={t} accent="oklch(58% 0.12 300)" />;
        })}
      </div>
    </PanelFrame>
  );
}

function ScanResult({ label, result, t, accent }) {
  // Render whatever shape the service returned — most return arrays of
  // { type, label, note, fix, severity, paragraph }.
  let items = [];
  if (Array.isArray(result)) items = result;
  else if (Array.isArray(result?.issues)) items = result.issues;
  else if (Array.isArray(result?.suggestions)) items = result.suggestions;
  else if (result?.summary) items = [{ label: 'Summary', note: result.summary }];
  else items = [{ label: label, note: typeof result === 'string' ? result : JSON.stringify(result).slice(0, 240) }];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: t.mono, fontSize: 10, color: accent, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>{label} · {items.length}</div>
      {items.slice(0, 12).map((iss, i) => (
        <div key={i} style={{ marginBottom: 8, padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${iss.severity === 'high' ? t.warn : accent}`, borderRadius: 1 }}>
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500, marginBottom: 3 }}>{iss.label || iss.title || iss.type || 'Note'}</div>
          {iss.paragraph?.text && <div style={{ fontSize: 12, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 4 }}>"…{String(iss.paragraph.text).slice(0, 150)}…"</div>}
          {iss.note && <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.55 }}>{iss.note}</div>}
          {iss.description && <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.55 }}>{iss.description}</div>}
          {iss.fix && <div style={{ marginTop: 6, padding: '5px 9px', background: t.bg, borderLeft: `2px solid ${t.good}`, fontFamily: t.display, fontSize: 12, color: t.ink }}><b style={{ fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', color: t.good, fontWeight: 500 }}>Try · </b>{iss.fix}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INTERVIEW PANEL — chat with a character via CW.aiService
// ═══════════════════════════════════════════════════════════════
function InterviewPanel({ onClose }) {
  const t = useTheme();
  const { sel } = useSelection();
  const store = useStore();

  if (!WR.CAST.length) {
    return (
      <PanelFrame title="Interview" eyebrow="Interview · empty" accent={t.accent} onClose={onClose} width={440}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, marginBottom: 8 }}>No one to interview yet</div>
          <div style={{ fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 20px' }}>
            Add a character in the cast, then sit them down and ask them anything.
          </div>
          <button onClick={() => { const id = window.createCharacter(store, {}); (window.useSelection?.()?.select || (() => {}))('character', id); }} style={{ padding: '10px 18px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>+ Add a character</button>
        </div>
      </PanelFrame>
    );
  }

  const c = WR.CAST.find(x => x.id === sel.character) || WR.CAST[0];
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    const tr = c.traits || [];
    const intro = tr.length ? `. They are ${tr.slice(0, 2).map(x => x.toLowerCase()).join(', ')}.` : '.';
    setMessages([{ role: 'loom', text: `Interviewing ${c.name}${intro}` }]);
    setError(null);
  }, [c.id]);

  React.useEffect(() => { endRef.current?.parentElement?.scrollTo({ top: 9e6 }); }, [messages]);

  async function send(queryText) {
    const q = (queryText ?? input).trim();
    if (!q || busy) return;
    setInput('');
    setError(null);
    setMessages(m => [...m, { role: 'you', text: q }]);
    setBusy(true);
    try {
      const CW = window.CW;
      if (!CW?.aiService?.callAI) throw new Error('AI service unavailable. Add an API key in Settings.');

      // Persona prompt for roleplay (not CW.promptTemplates.characterVoice —
      // that template is for *analysing* a voice, not for speaking as one).
      const systemContext = (
        `You are ${c.name}, ${c.role || 'a character'} in "${WR.BOOK.title || 'this book'}". ` +
        `Voice: ${c.dossier?.voice || c.voice || 'their own, natural'}. ` +
        `Current state: ${c.oneliner || ''}. ` +
        `Known: ${(c.knows || []).join('; ') || 'unspecified'}. ` +
        `Hidden: ${(c.hides || []).join('; ') || 'nothing in particular'}. ` +
        `Wants: ${c.wants?.true || c.wants?.surface || 'unclear'}. ` +
        `Fears: ${(c.fears || []).join('; ') || 'none stated'}. ` +
        `Traits: ${(c.traits || []).join(', ') || 'unstated'}. ` +
        `Stay in character. Keep answers vivid, honest from their POV, no more than 3–4 sentences.`
      );

      const reply = await CW.aiService.callAI(q, 'creative', systemContext, {
        temperature: 0.7,
      });
      setMessages(m => [...m, { role: 'them', text: String(reply).trim() }]);
      store.recordFeedback?.('interview', 'accept', { character: c.id });
    } catch (e) {
      setError(e.message || 'The Loom couldn\'t reach an AI provider.');
      setMessages(m => m.slice(0, -1)); // pull back the user's unsent turn
      setInput(q);
    }
    setBusy(false);
  }

  // Prompts now derive from the character's own dossier — no hardcoded
  // demo-story names. Falls through to generic openers when the dossier is
  // thin so a brand-new character still gets useful starting questions.
  const buildPrompts = () => {
    const out = [];
    const fear = (c.fears || [])[0];
    const want = c.wants?.true || c.wants?.surface;
    const hidden = (c.hides || [])[0];
    const known = (c.knows || [])[0];
    const arc = (c.arc || [])[0]?.label;
    if (want)   out.push(`What are you really after?`);
    if (fear)   out.push(`What are you afraid will happen?`);
    if (hidden) out.push(`What are you not telling anyone?`);
    if (known)  out.push(`What do you know that the others don't?`);
    if (arc)    out.push(`Where does "${arc}" come from?`);
    if (out.length < 3) {
      if (!out.includes('What are you really after?')) out.push('What are you really after?');
      out.push(`Tell me about the last time you felt safe.`);
      out.push(`What do you regret most?`);
    }
    return out.slice(0, 3);
  };
  const prompts = buildPrompts();

  return (
    <PanelFrame title={`Interview · ${c.name}`} eyebrow={c.role} accent={c.color} onClose={onClose}>
      <div ref={endRef} style={{ padding: 16, overflowY: 'auto', minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: m.role === 'them' ? c.color : m.role === 'you' ? t.accent : t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 3 }}>
              {m.role === 'them' ? c.name : m.role === 'you' ? 'You' : 'The Loom'}
            </div>
            <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.65, fontStyle: m.role === 'them' ? 'italic' : 'normal', paddingLeft: m.role === 'them' ? 12 : 0, borderLeft: m.role === 'them' ? `2px solid ${c.color}` : 'none' }}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, fontStyle: 'italic' }}>{c.name} thinks…</div>}
        {error && <div style={{ padding: 10, background: t.paper, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn, marginTop: 8 }}>{error}</div>}
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {prompts.map((p, i) => <button key={i} onClick={() => send(p)} style={{ padding: '3px 8px', background: t.paper2, border: `1px solid ${t.rule}`, fontFamily: t.display, fontSize: 11, color: t.ink2, cursor: 'pointer', fontStyle: 'italic', borderRadius: 1 }}>{p}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={`Ask ${c.name}…`} style={{ flex: 1, padding: '8px 10px', background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.display, fontSize: 13, color: t.ink }} />
          <button onClick={() => send()} disabled={busy || !input.trim()} style={{ padding: '0 14px', background: c.color, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', opacity: (busy || !input.trim()) ? 0.5 : 1 }}>Ask</button>
        </div>
      </div>
    </PanelFrame>
  );
}

window.ThreadsPanel = ThreadsPanel;
window.VoicePanel = VoicePanel;
window.ItemsPanel = ItemsPanel;
window.LanguagePanel = LanguagePanel;
window.InterviewPanel = InterviewPanel;
