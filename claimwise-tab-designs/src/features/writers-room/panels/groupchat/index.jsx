// Loomwright — Group chat panel (round-table with multiple characters).

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import aiService from '../../../../services/aiService';

export default function GroupChatPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const cast = store.cast || [];

  const [selected, setSelected] = React.useState(() => cast.slice(0, 2).map(c => c.id));
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [autoChain, setAutoChain] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    endRef.current?.parentElement?.scrollTo({ top: 9e6 });
  }, [messages]);

  if (cast.length < 2) {
    return (
      <PanelFrame
        title="Group chat"
        eyebrow="Need at least two characters"
        accent={PANEL_ACCENT.cast}
        onClose={onClose}
        width={520}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink2, fontStyle: 'italic', lineHeight: 1.6 }}>
            Add another character to your cast, then bring them together here.
          </div>
        </div>
      </PanelFrame>
    );
  }

  const toggleSelect = (id) => setSelected(xs => xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]);

  const personaFor = (c) => (
    `You are ${c.name}, ${c.role || 'a character'} in "${store.book?.title || 'this book'}". ` +
    `Voice: ${c.dossier?.voice || c.voice || 'natural, their own'}. ` +
    `Known: ${(c.knows || []).join('; ') || 'unspecified'}. ` +
    `Hidden: ${(c.hides || []).join('; ') || 'nothing'}. ` +
    `Wants: ${c.wants?.true || c.wants?.surface || 'unclear'}. ` +
    `Fears: ${(c.fears || []).join('; ') || 'none stated'}. ` +
    `Traits: ${(c.traits || []).join(', ') || 'unstated'}. ` +
    `Stay in character. Reply in 1-3 sentences.`
  );

  const transcriptSoFar = () => messages.map(m => {
    if (m.role === 'author') return `Author: ${m.text}`;
    if (m.role === 'character') {
      const c = cast.find(x => x.id === m.charId);
      return `${c?.name || 'Character'}: ${m.text}`;
    }
    return '';
  }).filter(Boolean).join('\n');

  async function oneTurn(charId, question) {
    const c = cast.find(x => x.id === charId);
    if (!c) return;
    const persona = personaFor(c);
    const prompt = `${persona}\n\nThe author asks: "${question}"\n\nPrior conversation:\n${transcriptSoFar()}\n\nReply as ${c.name}.`;
    try {
      let reply = '';
      if (typeof aiService?.callAI === 'function') {
        const r = await aiService.callAI(prompt, { maxTokens: 200 });
        reply = typeof r === 'string' ? r : (r?.text || r?.content || '');
      }
      reply = (reply || '').trim() || `*${c.name} says nothing.*`;
      setMessages(prev => [...prev, { id: `m_${Date.now()}_${Math.random()}`, role: 'character', charId, text: reply, t: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: `m_${Date.now()}`, role: 'system', text: `(${c.name} could not be reached: ${err?.message || err})`, t: Date.now() }]);
    }
  }

  async function ask() {
    const q = input.trim();
    if (!q || selected.length === 0) return;
    setInput('');
    setMessages(prev => [...prev, { id: `m_${Date.now()}`, role: 'author', text: q, t: Date.now() }]);
    setBusy(true);
    for (const id of selected) {
      // sequential so the chain feels like a conversation
      // eslint-disable-next-line no-await-in-loop
      await oneTurn(id, q);
    }
    if (autoChain) {
      // pick a random character to ask another a follow-up
      const asker = selected[Math.floor(Math.random() * selected.length)];
      const others = selected.filter(x => x !== asker);
      const target = others[Math.floor(Math.random() * others.length)];
      const askerC = cast.find(c => c.id === asker);
      const targetC = cast.find(c => c.id === target);
      if (askerC && targetC) {
        const followUp = `${askerC.name} turns to ${targetC.name} and asks something probing about what they just said.`;
        setMessages(prev => [...prev, { id: `m_${Date.now()}`, role: 'system', text: followUp, t: Date.now() }]);
        await oneTurn(targetC.id, followUp);
      }
    }
    setBusy(false);
  }

  return (
    <PanelFrame
      title="Round table"
      eyebrow="Group chat"
      accent={PANEL_ACCENT.cast}
      onClose={onClose}
      width={520}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
        }}>Pick at least 2 characters</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {cast.map(c => (
            <button key={c.id} onClick={() => toggleSelect(c.id)} style={{
              padding: '4px 10px',
              background: selected.includes(c.id) ? (c.color || t.accent) + '22' : 'transparent',
              border: `1px solid ${selected.includes(c.id) ? (c.color || t.accent) : t.rule}`,
              borderRadius: 1, cursor: 'pointer',
              fontFamily: t.display, fontSize: 12, color: t.ink,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, background: c.color || t.accent, borderRadius: '50%' }} />
              {c.name}
            </button>
          ))}
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
          fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>
          <input type="checkbox" checked={autoChain} onChange={e => setAutoChain(e.target.checked)} />
          Let them question each other
        </label>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {messages.length === 0 && (
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink3,
            fontStyle: 'italic', lineHeight: 1.5,
          }}>Ask anything. The selected characters will reply in their own voice.</div>
        )}
        {messages.map(m => {
          if (m.role === 'author') return (
            <div key={m.id} style={{
              padding: '8px 10px', marginBottom: 8, background: t.paper3, borderRadius: 1,
              fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
            }}>
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase' }}>You</span>
              <div>{m.text}</div>
            </div>
          );
          if (m.role === 'character') {
            const c = cast.find(x => x.id === m.charId);
            return (
              <div key={m.id} style={{
                padding: '8px 10px', marginBottom: 8,
                background: t.paper2, borderLeft: `2px solid ${c?.color || t.accent}`, borderRadius: 1,
                fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
              }}>
                <span style={{
                  fontFamily: t.mono, fontSize: 9, color: c?.color || t.accent,
                  letterSpacing: 0.16, textTransform: 'uppercase',
                }}>{c?.name || 'Character'}</span>
                <div style={{ fontStyle: 'italic' }}>{m.text}</div>
              </div>
            );
          }
          return (
            <div key={m.id} style={{
              padding: '6px 10px', marginBottom: 8,
              fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic',
            }}>{m.text}</div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.rule}`, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !busy) ask(); }}
          placeholder="Ask the room…"
          style={{
            flex: 1, padding: '8px 10px',
            fontFamily: t.display, fontSize: 13, color: t.ink,
            background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
          }}
        />
        <button onClick={ask} disabled={busy || !input.trim() || selected.length === 0} style={{
          padding: '8px 14px',
          background: busy || !input.trim() ? t.rule : t.accent,
          color: busy || !input.trim() ? t.ink3 : t.onAccent,
          border: 'none', borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}>{busy ? 'Listening…' : 'Ask'}</button>
      </div>
    </PanelFrame>
  );
}
