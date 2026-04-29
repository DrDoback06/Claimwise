// writers-room/inline.jsx — inline Weaver dropzone, Command palette, Summoning Ring

function InlineWeaver({ onClose, onRunExample }) {
  const t = useTheme();
  const store = useStore();
  const [idea, setIdea] = React.useState('');
  const [phase, setPhase] = React.useState('capture'); // capture | analyzing | proposals
  const [proposals, setProposals] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [applying, setApplying] = React.useState(false);
  const [decisions, setDecisions] = React.useState({}); // { proposalId: 'accept' | 'reject' | 'edit' }

  const CW = window.CW;

  const run = async () => {
    if (idea.trim().length < 4) return;
    setPhase('analyzing');
    setError(null);
    try {
      if (!CW?.aiService?.callAI) {
        // No AI available — save the idea as a note so nothing is lost.
        setProposals([{
          id: 'p_note_' + Date.now(),
          sys: 'Notes',
          title: 'Save this idea as a note',
          body: idea,
          ch: store.book?.currentChapterId ? (store.chapters[store.book.currentChapterId]?.n || 1) : 1,
          kind: 'note',
          fallback: true,
        }]);
        setPhase('proposals');
        return;
      }

      // Build a compact story snapshot so the AI's proposals reference
      // things that actually exist in this book, not hallucinated entities.
      const snapshot = {
        title: store.book.title,
        genre: store.profile.genre || (store.profile.genres || [])[0],
        tone: (store.profile.tone || []).join(', '),
        cast: (store.cast || []).slice(0, 16).map(c => ({ name: c.name, role: c.role })),
        places: (store.places || []).slice(0, 12).map(p => ({ name: p.name, kind: p.kind })),
        threads: (store.threads || []).slice(0, 10).map(th => ({ name: th.name, active: th.active !== false })),
        items: (store.items || []).slice(0, 10).map(i => ({ name: i.name, kind: i.kind })),
        chapters: (store.book.chapterOrder || []).map((id, i) => {
          const c = store.chapters[id];
          return c ? { n: c.n || i + 1, title: c.title } : null;
        }).filter(Boolean).slice(0, 30),
      };

      const systemPrompt =
        `You are the Loom — a writing-assistant planner. Given a writer's idea and a snapshot of their story, ` +
        `propose discrete, specific edits that weave the idea into the canon. Each proposal must target exactly ` +
        `one system: "cast" (add/modify a character), "place" (add a setting), "thread" (open/modify a plot ` +
        `thread), "item" (track an object), "chapter-insert" (add a sentence or paragraph to a specific chapter), ` +
        `or "note" (capture as a sticky note).\n\n` +
        `Reply ONLY with valid JSON in this exact shape:\n` +
        `{"proposals": [{"system": "cast"|"place"|"thread"|"item"|"chapter-insert"|"note", "title": "short action label", "description": "one-sentence detail", "name": "entity name if applicable", "chapter": number or null, "insert": "text to insert if chapter-insert" }]}\n\n` +
        `Return 3–6 proposals. No commentary. No markdown.`;

      const userPrompt = `Story snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nThe writer's idea:\n"${idea.trim()}"\n\nPropose edits as JSON.`;

      const raw = await CW.aiService.callAI(userPrompt, 'creative', systemPrompt, { temperature: 0.6 });
      let parsed;
      try {
        parsed = CW.parseExternalAIResponse?.(raw);
      } catch (_) { parsed = null; }
      if (!parsed) {
        try { parsed = JSON.parse(String(raw).replace(/^```json\s*|```\s*$/g, '').trim()); }
        catch (_) { parsed = null; }
      }
      const items = parsed?.proposals || parsed?.changes || (Array.isArray(parsed) ? parsed : []);

      if (!items.length) {
        // No structured proposals came back — at least save the idea
        setProposals([{
          id: 'p_note_' + Date.now(), sys: 'Notes',
          title: 'Save this idea as a note',
          body: idea, ch: '?', kind: 'note', fallback: true,
        }]);
      } else {
        setProposals(items.map((p, i) => ({
          id: p.id || `p_${i}_${Date.now()}`,
          sys: capitalizeFirst(p.system || p.target || p.kind || 'Canon'),
          title: p.title || p.label || p.name || 'Weave edit',
          body: p.description || p.body || p.insert || '',
          ch: p.chapter ?? p.ch ?? '?',
          kind: p.system || p.kind || 'note',
          raw: p,
        })));
      }
      setPhase('proposals');
    } catch (e) {
      setError(e.message || 'The Loom couldn\'t reach a provider.');
      setPhase('capture');
    }
  };

  function capitalizeFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  const setDecision = (id, dec) => setDecisions(d => ({ ...d, [id]: dec }));

  const applyAll = async () => {
    setApplying(true);
    setError(null);
    try {
      const accepted = proposals.filter(p => decisions[p.id] !== 'reject');
      if (!accepted.length) { onClose(); return; }

      // Apply every accepted proposal through applyProposalToStore, which
      // routes to createCharacter / createPlace / createThread / createItem /
      // chapter-insert as appropriate, falling through to a Tangle note.
      for (const p of accepted) {
        try { await applyProposalToStore(p, store); } catch (e) { console.warn('[weaver] apply failed', p, e); }
      }

      store.recordFeedback?.('spark', 'apply', { count: accepted.length, idea });
      onClose();
    } catch (e) {
      setError(e.message || 'Apply failed.');
    }
    setApplying(false);
  };

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
      background: t.paper + 'f5', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', zIndex: 50,
      animation: 'fadeIn 180ms ease',
    }}>
      <div style={{ width: 680, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', background: t.paper, border: `1px solid ${t.accent}`, borderRadius: 3, padding: 28, boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
        {phase === 'capture' && <>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>Weave into the canon</div>
          <h2 style={{ fontFamily: t.display, fontSize: 30, fontWeight: 400, margin: '4px 0 10px', color: t.ink, letterSpacing: -0.015 }}>What should the Loom weave in?</h2>
          <p style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, margin: '0 0 14px' }}>A character, an item, a retcon, a thread. One sentence or a paragraph. It'll propose edits across chapters, cast, atlas, and threads — you approve each one.</p>
          <textarea value={idea} onChange={e => setIdea(e.target.value)} autoFocus
            placeholder="e.g. Rain on the quarry changes how the scene ends."
            style={{ width: '100%', minHeight: 110, padding: 14, background: t.paper2, color: t.ink, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.display, fontSize: 16, lineHeight: 1.55, outline: 'none', resize: 'vertical' }} />
          {error && <div style={{ marginTop: 10, padding: 10, background: t.paper2, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <button onClick={onRunExample} style={{ padding: '5px 10px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Try the spark</button>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
            <button onClick={run} disabled={idea.trim().length < 4} style={{ padding: '9px 16px', background: idea.trim().length < 4 ? t.rule : t.accent, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.display, fontSize: 13, fontWeight: 500, cursor: idea.trim().length < 4 ? 'not-allowed' : 'pointer' }}>✦ Weave →</button>
          </div>
        </>}
        {phase === 'analyzing' && <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>Reading your canon</div>
          <div style={{ fontFamily: t.display, fontSize: 26, color: t.ink, marginTop: 6, fontStyle: 'italic' }}>The Loom is listening…</div>
          <div style={{ marginTop: 18, display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[0,1,2,3,4].map(i => <div key={i} style={{ width: 6, height: 6, background: t.accent, borderRadius: '50%', animation: `pulseDot 1.4s ${i * 0.18}s infinite ease-in-out` }} />)}
          </div>
        </div>}
        {phase === 'proposals' && <>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>{proposals.length} proposed edit{proposals.length !== 1 ? 's' : ''}</div>
          <h2 style={{ fontFamily: t.display, fontSize: 26, fontWeight: 400, margin: '4px 0 14px', color: t.ink }}>Accept what fits.</h2>
          {proposals.length === 0 && (
            <div style={{ padding: 16, fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6 }}>
              The Loom didn't propose any edits for that idea. Try rewording, or save it as a note in the Tangle.
            </div>
          )}
          {proposals.map(p => {
            const dec = decisions[p.id];
            return (
              <div key={p.id} style={{ padding: 12, marginBottom: 8, background: t.paper2, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${dec === 'reject' ? t.bad : t.accent}`, borderRadius: 2, opacity: dec === 'reject' ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.12, textTransform: 'uppercase' }}>{p.sys} · ch.{p.ch}</div>
                    <div style={{ fontSize: 13, color: t.ink, marginTop: 2, fontWeight: 500 }}>{p.title}</div>
                    {p.body && <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>{p.body}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setDecision(p.id, dec === 'accept' ? null : 'accept')}
                      style={{ padding: '4px 9px', background: dec === 'accept' ? t.good : 'transparent', color: dec === 'accept' ? t.onAccent : t.ink3, border: `1px solid ${dec === 'accept' ? t.good : t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setDecision(p.id, dec === 'reject' ? null : 'reject')}
                      style={{ padding: '4px 9px', background: dec === 'reject' ? t.bad : 'transparent', color: dec === 'reject' ? t.onAccent : t.ink3, border: `1px solid ${dec === 'reject' ? t.bad : t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
          {error && <div style={{ marginTop: 10, padding: 10, background: t.paper2, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button onClick={() => setPhase('capture')} style={{ padding: '8px 14px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>← Revise idea</button>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>Dismiss all</button>
            <button onClick={applyAll} disabled={applying || !proposals.length} style={{ padding: '9px 16px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.display, fontSize: 13, fontWeight: 500, cursor: applying ? 'wait' : 'pointer', opacity: applying ? 0.5 : 1 }}>
              {applying ? 'Weaving…' : `✦ Apply ${proposals.filter(p => decisions[p.id] !== 'reject').length} edit${proposals.filter(p => decisions[p.id] !== 'reject').length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── Apply a Weaver proposal to the IndexedDB store ───────────────────────
// Takes the normalised proposal shape produced from the AI's JSON and routes
// it to the right creator. The `raw` field carries the original JSON (with
// system/name/description/chapter/insert) and takes precedence.
async function applyProposalToStore(p, store) {
  const raw = p.raw || p;
  const sys = String(raw.system || raw.target || p.kind || p.sys || '').toLowerCase();

  if (sys === 'cast' || sys === 'character') {
    const name = raw.name || p.title?.replace(/^add[^:]*[:\-]\s*/i, '').trim();
    if (name) {
      window.createCharacter(store, {
        name: name.slice(0, 80),
        role: raw.role || 'support',
        oneliner: raw.description || raw.oneliner || '',
        dossier: { bio: raw.description || '', quirks: [], voice: '', notes: raw.note || '' },
      });
      return;
    }
  }
  if (sys === 'place' || sys === 'atlas' || sys === 'location') {
    const name = raw.name || p.title?.replace(/^add[^:]*[:\-]\s*/i, '').trim();
    if (name) {
      window.createPlace(store, {
        name: name.slice(0, 80),
        kind: raw.kind || 'settlement',
        description: raw.description || '',
      });
      return;
    }
  }
  if (sys === 'thread' || sys === 'plot') {
    const name = raw.name || p.title?.slice(0, 80);
    if (name) {
      window.createThread(store, {
        name,
        description: raw.description || '',
      });
      return;
    }
  }
  if (sys === 'item' || sys === 'inventory' || sys === 'object') {
    const name = raw.name || p.title?.slice(0, 80);
    if (name) {
      window.createItem(store, {
        name,
        kind: raw.kind || 'object',
        description: raw.description || '',
      });
      return;
    }
  }
  if (sys === 'chapter-insert' && raw.insert) {
    // Find the target chapter. Prefer explicit chapter number; fall back to active.
    let chId = null;
    if (raw.chapter != null) {
      const order = store.book?.chapterOrder || [];
      for (const id of order) {
        if (store.chapters[id]?.n === raw.chapter) { chId = id; break; }
      }
    }
    chId = chId || store.ui.activeChapterId;
    if (chId && store.chapters[chId]) {
      store.setSlice('chapters', ch => ({
        ...ch,
        [chId]: { ...ch[chId], text: (ch[chId].text || '') + (ch[chId].text ? '\n\n' : '') + String(raw.insert) },
      }));
      return;
    }
  }

  // Default: drop the proposal into the Tangle as a sticky note so nothing
  // is lost — the writer can promote it into something concrete later.
  const note = (p.title || 'Weaver idea') + (p.body ? '\n' + p.body : '');
  store.setSlice('tangle', t => {
    const id = 'mn_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
    return {
      ...(t || {}),
      nodes: [...(t?.nodes || []), { id, kind: 'note', entityId: null, text: note, x: 360 + Math.random() * 160, y: 220 + Math.random() * 160 }],
      edges: t?.edges || [],
      layout: t?.layout || {},
    };
  });
}

function CommandPalette({ open, onClose, onRun }) {
  const t = useTheme();
  const [q, setQ] = React.useState('');
  const items = WR.COMMANDS.filter(c => !q || c.label.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.35)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'start center', paddingTop: '16vh', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '90vw', background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 3, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Ask the Loom anything — weave, interview, map, check…" style={{ width: '100%', padding: '18px 22px', background: 'transparent', color: t.ink, border: 'none', borderBottom: `1px solid ${t.rule}`, fontFamily: t.display, fontSize: 18, outline: 'none' }} />
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {items.map((c, i) => (
            <button key={c.k} onClick={() => { onRun(c.k); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 22px', background: i === 0 ? t.paper2 : 'transparent', border: 'none', borderBottom: `1px solid ${t.rule}`, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 24, height: 24, background: t.paper2, borderRadius: 2, display: 'grid', placeItems: 'center' }}><Icon name={c.icon} size={12} color={t.accent} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink }}>{c.label}</div>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 1 }}>{c.hint}</div>
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1 }}>↵</div>
            </button>
          ))}
        </div>
        <div style={{ padding: '8px 22px', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', display: 'flex', gap: 14 }}>
          <span>↑↓ navigate</span><span>↵ run</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}

// The Summoning Ring — radial menu of tools around the cursor.
function SummoningRing({ open, center, onClose, onPick }) {
  const t = useTheme();
  if (!open) return null;
  const tools = [
    { k: 'atlas',     label: 'Atlas',     icon: 'map',     color: 'oklch(60% 0.10 145)' },
    { k: 'cast',      label: 'Cast',      icon: 'users',   color: 'oklch(55% 0.10 220)' },
    { k: 'voice',     label: 'Voice',     icon: 'pen',     color: 'oklch(55% 0.15 45)' },
    { k: 'threads',   label: 'Threads',   icon: 'flag',    color: 'oklch(62% 0.16 25)' },
    { k: 'weaver',    label: 'Weave',     icon: 'sparkle', color: t.accent },
  ];
  const R = 96;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, cursor: 'pointer' }}>
      <div style={{ position: 'absolute', left: center.x - 180, top: center.y - 180, width: 360, height: 360, pointerEvents: 'none' }}>
        <svg width="360" height="360" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <circle cx="180" cy="180" r={R} fill="none" stroke={t.accent} strokeWidth="1" strokeDasharray="1 3" opacity="0.4">
            <animate attributeName="r" values={`${R-4};${R+4};${R-4}`} dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="180" cy="180" r="4" fill={t.accent} />
        </svg>
        {tools.map((tool, i) => {
          const angle = -Math.PI / 2 + (i / tools.length) * Math.PI * 2;
          const x = 180 + Math.cos(angle) * R;
          const y = 180 + Math.sin(angle) * R;
          return (
            <button key={tool.k} onClick={e => { e.stopPropagation(); onPick(tool.k); }} style={{
              position: 'absolute', left: x - 36, top: y - 36,
              width: 72, height: 72, borderRadius: '50%',
              background: t.paper, border: `1px solid ${tool.color}`,
              display: 'grid', placeItems: 'center',
              cursor: 'pointer', pointerEvents: 'auto',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              animation: `ringPop 280ms ${i * 40}ms cubic-bezier(.2,1.2,.3,1) backwards`,
            }}>
              <div style={{ display: 'grid', placeItems: 'center', gap: 3 }}>
                <Icon name={tool.icon} size={18} color={tool.color} />
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.14, textTransform: 'uppercase' }}>{tool.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.InlineWeaver = InlineWeaver;
window.CommandPalette = CommandPalette;
window.SummoningRing = SummoningRing;
