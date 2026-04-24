// writers-room/panel-groupchat.jsx — round-table with multiple characters.
//
// A group-chat interview. You pick two or more characters from the cast; you
// type a question; each selected character responds in their own voice using
// CW.aiService + CW.promptTemplates.characterVoice. Optionally, after the
// round, one character can ask another a follow-up — character-to-character
// conversation chained through the AI, each turn bounded by each speaker's
// dossier (knows, hides, wants, fears).

function GroupChatPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const CW = window.CW;

  const [selected, setSelected] = React.useState(() => (store.cast || []).slice(0, 3).map(c => c.id));
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [mode, setMode] = React.useState('author-asks'); // author-asks | round-robin | free
  const [autoChain, setAutoChain] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => { endRef.current?.parentElement?.scrollTo({ top: 9e6 }); }, [messages]);

  const cast = store.cast || [];

  if (!cast.length) {
    return (
      <PanelFrame title="Group chat" eyebrow="Empty · add characters first" accent="oklch(55% 0.10 220)" onClose={onClose} width={520}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 20, color: t.ink, marginBottom: 8 }}>Nobody to round-table with yet</div>
          <div style={{ fontFamily: t.display, fontSize: 13, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 20px' }}>
            Add at least two characters to the cast, then bring them together here to interrogate each other.
          </div>
          <button onClick={() => { const id = window.createCharacter(store, {}); setSelected([id]); }}
            style={{ padding: '10px 18px', background: 'oklch(55% 0.10 220)', color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>+ Add character</button>
        </div>
      </PanelFrame>
    );
  }

  if (cast.length < 2) {
    return (
      <PanelFrame title="Group chat" eyebrow="Need at least two" accent="oklch(55% 0.10 220)" onClose={onClose} width={520}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink2, fontStyle: 'italic', lineHeight: 1.6 }}>
            You have one character. Add another to start a group chat — or use the single-character Interview for now.
          </div>
        </div>
      </PanelFrame>
    );
  }

  const toggleSelect = (id) => {
    setSelected(xs => xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]);
  };

  const personaFor = (c) => {
    // CW.promptTemplates.characterVoice is for *analysing* a voice, not for
    // speaking as a character — so we build the roleplay persona ourselves.
    return (
      `You are ${c.name}, ${c.role || 'a character'} in "${store.book?.title || 'this book'}". ` +
      `Voice: ${c.dossier?.voice || c.voice || 'their own, natural'}. ` +
      `Known: ${(c.knows || []).join('; ') || 'unspecified'}. ` +
      `Hidden: ${(c.hides || []).join('; ') || 'nothing'}. ` +
      `Wants: ${c.wants?.true || c.wants?.surface || 'unclear'}. ` +
      `Fears: ${(c.fears || []).join('; ') || 'none stated'}. ` +
      `Traits: ${(c.traits || []).join(', ') || 'unstated'}. `
    );
  };

  const transcriptSoFar = () => messages.map(m => {
    if (m.role === 'author') return `Author: ${m.text}`;
    if (m.role === 'character') { const c = cast.find(x => x.id === m.charId); return `${c?.name || 'Character'}: ${m.text}`; }
    return '';
  }).filter(Boolean).join('\n');

  async function oneTurn(charId, question) {
    const c = cast.find(x => x.id === charId);
    if (!c) return null;
    const persona = personaFor(c);
    const others = selected.filter(x => x !== charId).map(id => cast.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    const sys = `${persona}\n\nYou are sitting with: ${others}. Respond in your own voice from your POV. Keep it to 2–4 sentences. Address people by name when you speak to them.\n\nConversation so far:\n${transcriptSoFar()}`;

    if (!CW?.aiService?.callAI) throw new Error('AI service unavailable — add a provider key in Settings.');
    const raw = await CW.aiService.callAI(question, 'creative', sys, { temperature: 0.75 });
    return { role: 'character', charId, text: String(raw).trim() };
  }

  async function authorAsk() {
    const q = input.trim();
    if (!q || busy || !selected.length) return;
    setInput('');
    setError(null);
    setMessages(m => [...m, { role: 'author', text: q }]);
    setBusy(true);
    try {
      // Round-robin: every selected character responds in turn
      let transcript = messages.concat({ role: 'author', text: q });
      for (const charId of selected) {
        const c = cast.find(x => x.id === charId);
        if (!c) continue;
        const persona = personaFor(c);
        const others = selected.filter(x => x !== charId).map(id => cast.find(x => x.id === id)?.name).filter(Boolean).join(', ');
        const sys = `${persona}\n\nYou are at a round-table with: ${others}. Respond in your own voice from your POV. Keep it to 2–4 sentences. Address people by name when you speak to them.\n\nConversation so far:\n` +
          transcript.map(m => m.role === 'author' ? `Author: ${m.text}` : `${cast.find(x => x.id === m.charId)?.name || 'Character'}: ${m.text}`).join('\n');
        try {
          const raw = await CW.aiService.callAI(q, 'creative', sys, { temperature: 0.75 });
          const turn = { role: 'character', charId, text: String(raw).trim() };
          transcript = [...transcript, turn];
          setMessages(m => [...m, turn]);
        } catch (e) {
          setMessages(m => [...m, { role: 'system', text: `${c.name} couldn't reach the AI: ${e.message}` }]);
        }
      }
      store.recordFeedback?.('groupchat', 'accept', { speakers: selected.length });
    } catch (e) {
      setError(e.message || 'Failed to run group chat.');
    }
    setBusy(false);
  }

  async function chainFollowup() {
    if (!selected.length || selected.length < 2 || busy) return;
    setBusy(true);
    setError(null);
    try {
      // Pick a speaker whose dossier suggests the most relevant follow-up. Simple
      // rule: pick a random other character and let them ask a question of another.
      const asker = cast.find(c => c.id === selected[Math.floor(Math.random() * selected.length)]);
      const others = selected.filter(id => id !== asker.id);
      const targetId = others[Math.floor(Math.random() * others.length)];
      const target = cast.find(c => c.id === targetId);
      const persona = personaFor(asker);
      const sys = `${persona}\n\nYou are at a round-table with ${cast.find(c => c.id === targetId)?.name} and others. You have just heard the last exchange. Ask a pointed, in-character follow-up question of ${target.name} — one sentence, no preamble, no quotes.\n\nConversation so far:\n${transcriptSoFar()}`;
      const raw = await CW.aiService.callAI(`Ask ${target.name} something.`, 'creative', sys, { temperature: 0.8 });
      const question = String(raw).trim().replace(/^["']|["']$/g, '');
      setMessages(m => [...m, { role: 'character', charId: asker.id, text: question, directed: target.id }]);
      // Now target responds
      const answerTurn = await oneTurn(target.id, question);
      if (answerTurn) setMessages(m => [...m, answerTurn]);
      store.recordFeedback?.('groupchat', 'accept', { chain: true });
    } catch (e) {
      setError(e.message || 'Follow-up failed.');
    }
    setBusy(false);
  }

  return (
    <PanelFrame title="Group chat" eyebrow={`${selected.length} at the table`} accent="oklch(55% 0.10 220)" onClose={onClose} width={520}>
      {/* Character picker */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Round-table · tap to add or remove</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {cast.map(c => {
            const on = selected.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleSelect(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px',
                  background: on ? (c.color + '22') : 'transparent',
                  border: `1px solid ${on ? c.color : t.rule}`,
                  borderRadius: 1, cursor: 'pointer',
                  fontFamily: t.display, fontSize: 12, color: t.ink,
                  opacity: on ? 1 : 0.7,
                }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, color: t.onAccent, display: 'grid', placeItems: 'center', fontFamily: t.display, fontWeight: 600, fontSize: 8 }}>{(c.name || '?')[0]}</div>
                {c.name || 'Unnamed'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transcript */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink3, lineHeight: 1.6 }}>
            Pick who's at the table, ask them something, and they'll answer in their own voices.
          </div>
        )}
        {messages.map((m, i) => {
          if (m.role === 'author') {
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 3 }}>You</div>
                <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.65 }}>{m.text}</div>
              </div>
            );
          }
          if (m.role === 'system') {
            return <div key={i} style={{ padding: 8, margin: '6px 0', background: t.paper, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn }}>{m.text}</div>;
          }
          const c = cast.find(x => x.id === m.charId);
          if (!c) return null;
          const target = m.directed ? cast.find(x => x.id === m.directed) : null;
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: c.color, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 3 }}>
                {c.name}{target ? ` → ${target.name}` : ''}
              </div>
              <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.65, fontStyle: 'italic', paddingLeft: 12, borderLeft: `2px solid ${c.color}` }}>{m.text}</div>
            </div>
          );
        })}
        {busy && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, fontStyle: 'italic' }}>…</div>}
        {error && <div style={{ padding: 10, background: t.paper, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn, marginTop: 8 }}>{error}</div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && authorAsk()}
            placeholder={`Ask the table something…`}
            style={{ flex: 1, padding: '8px 10px', background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.display, fontSize: 13, color: t.ink }} />
          <button onClick={authorAsk} disabled={busy || !input.trim() || !selected.length}
            style={{ padding: '0 14px', background: 'oklch(55% 0.10 220)', color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', opacity: (busy || !input.trim() || !selected.length) ? 0.5 : 1 }}>Ask</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <button onClick={chainFollowup} disabled={busy || selected.length < 2 || messages.length === 0}
            style={{ padding: '4px 10px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', cursor: (busy || selected.length < 2 || messages.length === 0) ? 'not-allowed' : 'pointer', opacity: (busy || selected.length < 2 || messages.length === 0) ? 0.4 : 1 }}>
            Let them question each other ↓
          </button>
          <button onClick={() => setMessages([])} disabled={!messages.length}
            style={{ padding: '4px 10px', background: 'transparent', color: t.ink3, border: 'none', fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', cursor: messages.length ? 'pointer' : 'not-allowed' }}>Clear</button>
        </div>
      </div>
    </PanelFrame>
  );
}

window.GroupChatPanel = GroupChatPanel;
