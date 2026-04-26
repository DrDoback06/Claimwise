// Loomwright — Interview panel: 1-on-1 with a single character.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import aiService from '../../../../services/aiService';

const QUESTION_BANK = [
  'What did you not say in this scene?',
  'What are you afraid will happen next?',
  'When did you first realise you were on this path?',
  'Tell me one thing you have never told anyone.',
  'If everything went wrong, what would you do?',
];

export default function InterviewPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const cast = store.cast || [];
  const charId = sel.character || cast[0]?.id;
  const character = cast.find(c => c.id === charId);

  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    setMessages([]);
  }, [charId]);

  React.useEffect(() => {
    endRef.current?.parentElement?.scrollTo({ top: 9e6 });
  }, [messages]);

  if (!character) {
    return (
      <PanelFrame title="Interview" eyebrow="Pick a character" accent={PANEL_ACCENT.cast} onClose={onClose} width={460}>
        <div style={{ padding: 30, textAlign: 'center', color: t.ink3, fontStyle: 'italic', fontFamily: t.display }}>
          Select someone from your cast first.
        </div>
      </PanelFrame>
    );
  }

  const personaFor = (c) => {
    const profile = store.profile || {};
    const worldName = profile.seriesName || profile.workingTitle || 'your world';
    const genre = (profile.genres?.[0] || profile.genre || 'realistic').toLowerCase();
    const premise = profile.premise || '';
    const worldRules = (profile.worldRules || []).slice(0, 3).join(' · ');
    return [
      `You are ${c.name}. You are a real person living in ${worldName} (a ${genre} world).`,
      premise && `Setting: ${premise}`,
      worldRules && `World rules: ${worldRules}`,
      c.role && `Your role here: ${c.role}.`,
      c.oneliner && `${c.oneliner}.`,
      c.dossier?.bio && `Background: ${c.dossier.bio}`,
      `Voice: ${c.dossier?.voice || c.voice || 'natural, your own'}.`,
      (c.knows || []).length && `You know: ${(c.knows || []).map(k => k.fact || k).filter(Boolean).join('; ')}.`,
      (c.hides || []).length && `You hide: ${(c.hides || []).map(k => k.fact || k).filter(Boolean).join('; ')}.`,
      (c.fears || []).length && `You fear: ${(c.fears || []).map(k => k.fact || k).filter(Boolean).join('; ')}.`,
      c.wants?.true && `You want: ${c.wants.true}.`,
      (c.traits || []).length && `Traits: ${(c.traits || []).join(', ')}.`,
      (c.relationships || []).length && `Relationships: ${(c.relationships || []).map(r => `${r.kind || 'knows'} ${cast.find(x => x.id === r.to)?.name || '?'}`).join(', ')}.`,
      '',
      'STAY IN CHARACTER. Never break the fourth wall. Never refer to "the book", "the author", "the writer", "the story", or "the manuscript". You exist inside your world and only inside your world. The person speaking to you is another voice you can hear — call them "stranger" or by whatever name they give. Speak in your own voice with 1–3 sentences.',
    ].filter(Boolean).join('\n');
  };

  async function ask(question) {
    setMessages(prev => [...prev, { id: `m_${Date.now()}`, role: 'author', text: question }]);
    setBusy(true);
    const persona = personaFor(character);
    const prior = messages.map(m => m.role === 'author' ? `Stranger: ${m.text}` : `${character.name}: ${m.text}`).join('\n');
    const prompt = `${prior ? prior + '\n' : ''}Stranger: ${question}\n\n${character.name}:`;
    try {
      let reply = '';
      if (typeof aiService?.callAI === 'function') {
        const r = await aiService.callAI(prompt, 'creative', persona, { useCache: false });
        reply = typeof r === 'string' ? r : (r?.text || r?.content || '');
      }
      reply = (reply || '').trim() || `*${character.name} stays silent.*`;
      setMessages(prev => [...prev, { id: `m_${Date.now()}_r`, role: 'character', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: `m_${Date.now()}_e`, role: 'system', text: `(unable to reach ${character.name}: ${err?.message || err})` }]);
    }
    setBusy(false);
  }

  const submit = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    ask(q);
  };

  return (
    <PanelFrame
      title={`Interview · ${character.name}`}
      eyebrow="One on one"
      accent={character.color || PANEL_ACCENT.cast}
      onClose={onClose}
      width={460}>

      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {cast.map(c => (
          <button key={c.id} onClick={() => select('character', c.id)} style={{
            padding: '4px 10px',
            background: c.id === charId ? (c.color || t.accent) + '22' : 'transparent',
            border: `1px solid ${c.id === charId ? (c.color || t.accent) : t.rule}`,
            borderRadius: 1, cursor: 'pointer',
            fontFamily: t.display, fontSize: 12, color: t.ink,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, background: c.color || t.accent, borderRadius: '50%' }} />
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {messages.length === 0 && (
          <>
            <div style={{
              fontFamily: t.display, fontSize: 14, color: t.ink3,
              fontStyle: 'italic', lineHeight: 1.5, marginBottom: 14,
            }}>Ask {character.name} anything. Try one of these to start:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUESTION_BANK.map(q => (
                <button key={q} onClick={() => ask(q)} style={{
                  textAlign: 'left', padding: '8px 12px',
                  background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1,
                  fontFamily: t.display, fontSize: 13, color: t.ink, cursor: 'pointer',
                }}>{q}</button>
              ))}
            </div>
          </>
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
          if (m.role === 'character') return (
            <div key={m.id} style={{
              padding: '8px 10px', marginBottom: 8,
              background: t.paper2, borderLeft: `2px solid ${character.color || t.accent}`, borderRadius: 1,
              fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
            }}>
              <span style={{
                fontFamily: t.mono, fontSize: 9, color: character.color || t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}>{character.name}</span>
              <div style={{ fontStyle: 'italic' }}>{m.text}</div>
            </div>
          );
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
          onKeyDown={e => { if (e.key === 'Enter' && !busy) submit(); }}
          placeholder={`Ask ${character.name}…`}
          style={{
            flex: 1, padding: '8px 10px',
            fontFamily: t.display, fontSize: 13, color: t.ink,
            background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
          }}
        />
        <button onClick={submit} disabled={busy || !input.trim()} style={{
          padding: '8px 14px',
          background: busy || !input.trim() ? t.rule : (character.color || t.accent),
          color: busy || !input.trim() ? t.ink3 : t.onAccent,
          border: 'none', borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}>{busy ? '…' : 'Ask'}</button>
      </div>
    </PanelFrame>
  );
}
