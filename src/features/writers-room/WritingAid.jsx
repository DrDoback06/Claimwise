// Loomwright — Writing Aid panel: Continue / Brainstorm / What-if / Show, don't tell.
//
// Thin, opinionated AI surface that always inserts at cursor or appends to
// the current chapter. Grounded in the active POV character (or narrator)
// and recent prose context.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';
import { useSelection } from './selection';
import { activeChapter, characterById } from './store/selectors';
import aiService from '../../services/aiService';

const MODES = [
  { id: 'continue',  label: 'Continue this scene', icon: '→', task: 'creative' },
  { id: 'brainstorm', label: 'Brainstorm what is next', icon: '✦', task: 'creative' },
  { id: 'what-if',   label: 'What if…',             icon: '?', task: 'creative' },
  { id: 'show',      label: 'Show, do not tell',     icon: '☺', task: 'analytical' },
  { id: 'sensory',   label: 'Add sensory grounding', icon: '◉', task: 'creative' },
  { id: 'tighten',   label: 'Tighten this paragraph', icon: '⌃', task: 'analytical' },
];

export default function WritingAid({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const ch = activeChapter(store);
  const focus = sel.character ? characterById(store, sel.character) : null;

  const [mode, setMode] = React.useState('continue');
  const [results, setResults] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [extra, setExtra] = React.useState('');

  const recentText = (() => {
    const text = ch?.text || '';
    return text.length > 1500 ? text.slice(text.length - 1500) : text;
  })();

  const persona = focus
    ? `POV: ${focus.name} (${focus.role || 'character'}). Voice: ${focus.dossier?.voice || focus.voice || 'natural'}. Wants: ${focus.wants?.true || focus.wants?.surface || 'unstated'}. Fears: ${(focus.fears || []).join('; ') || 'unstated'}. `
    : 'Narrator: third-person omniscient. ';

  const buildPrompt = (m) => {
    const base = `${persona}\nGenre: ${store.profile?.genre || 'literary'}.\nTone: ${(store.profile?.tone || []).join(', ') || 'natural'}.\nRecent prose:\n"""\n${recentText}\n"""\n`;
    const seasoning = extra ? `Steer: ${extra}\n` : '';
    if (m === 'continue')   return `${base}${seasoning}Write the next 1-2 paragraphs in the same voice. Show, do not tell. Stay grounded.`;
    if (m === 'brainstorm') return `${base}${seasoning}Propose 4 possible next beats. One sentence each. Vary stakes.`;
    if (m === 'what-if')    return `${base}${seasoning}List 4 "what if…" provocations grounded in the dossier. One sentence each.`;
    if (m === 'show')       return `${base}${seasoning}Find the most "telling" sentence above and rewrite it as showing. Reply with only the rewrite.`;
    if (m === 'sensory')    return `${base}${seasoning}Rewrite the last paragraph to ground it in two more senses (sound, smell, touch, taste — pick what fits). Reply with only the rewrite.`;
    if (m === 'tighten')    return `${base}${seasoning}Rewrite the last paragraph more tightly without losing voice or meaning. Reply with only the rewrite.`;
    return base;
  };

  const run = async () => {
    setBusy(true);
    setResults([]);
    try {
      const p = buildPrompt(mode);
      const taskMap = Object.fromEntries(MODES.map(m => [m.id, m.task]));
      const r = await aiService.callAI(p, taskMap[mode] || 'creative', '');
      const text = typeof r === 'string' ? r : (r?.text || r?.content || '');
      // For brainstorm / what-if, split into bullet lines.
      let items = [];
      if (mode === 'brainstorm' || mode === 'what-if') {
        items = (text || '').split(/\n+/).map(s => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 6);
      } else {
        items = [(text || '').trim()].filter(Boolean);
      }
      if (items.length === 0) items = ['(no response)'];
      setResults(items);
    } catch (err) {
      setResults([`(error: ${err?.message || err})`]);
    }
    setBusy(false);
  };

  const insertAtCursor = (line) => {
    // Append to the active paragraph or insert at current cursor position.
    const editor = document.querySelector('.lw-prose-wrap [contenteditable="true"]');
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(document.createTextNode(' ' + line + ' '));
      r.collapse(false);
      // Trigger an input event so the editor's debounced save fires.
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  };

  const appendToChapter = (line) => {
    if (!ch) return;
    store.setSlice('chapters', chs => ({
      ...chs,
      [ch.id]: { ...chs[ch.id], text: (chs[ch.id].text || '') + '\n\n' + line, lastEdit: Date.now() },
    }));
  };

  const saveAsNote = (line) => {
    store.setSlice('tangle', tg => ({
      ...tg,
      nodes: [...(tg?.nodes || []), {
        id: `mn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        kind: 'note', entityId: null, text: line,
        x: 220 + Math.random() * 200, y: 220 + Math.random() * 200,
      }],
    }));
  };

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: t.paper, borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      animation: 'lw-slide-in 240ms ease',
      boxShadow: '0 0 24px rgba(0,0,0,0.08)',
    }}>
      <header style={{
        padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
          letterSpacing: 0.16, textTransform: 'uppercase', flex: 1,
        }}>The Loom · Writing aid</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 18 }}>×</button>
      </header>

      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>
          Grounded in {focus ? focus.name : 'the narrator'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              padding: '7px 10px',
              background: mode === m.id ? PANEL_ACCENT.loom : 'transparent',
              color: mode === m.id ? t.onAccent : t.ink2,
              border: `1px solid ${mode === m.id ? PANEL_ACCENT.loom : t.rule}`,
              borderRadius: 1, cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: t.display, fontSize: 12,
            }}>
              <span style={{ fontFamily: t.mono, fontSize: 14 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
        <input
          value={extra}
          onChange={e => setExtra(e.target.value)}
          placeholder="Optional steer (a tone, a beat, a question…)"
          style={{
            width: '100%', marginTop: 10, padding: '7px 10px',
            background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
            fontFamily: t.display, fontSize: 12, color: t.ink,
          }}
        />
        <button onClick={run} disabled={busy} style={{
          marginTop: 10, padding: '8px 14px',
          background: busy ? t.rule : PANEL_ACCENT.loom,
          color: busy ? t.ink3 : t.onAccent,
          border: 'none', borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
          width: '100%',
        }}>{busy ? 'Listening…' : 'Run'}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {results.length === 0 && !busy && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Pick a mode and let the Loom listen to the last few hundred words.
          </div>
        )}
        {results.map((line, i) => (
          <div key={i} style={{
            padding: '10px 12px', marginBottom: 8,
            background: t.paper2, borderLeft: `2px solid ${PANEL_ACCENT.loom}`, borderRadius: 1,
          }}>
            <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{line}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              <button onClick={() => insertAtCursor(line)} style={btnStyle(t, true)}>Insert at cursor</button>
              <button onClick={() => appendToChapter(line)} style={btnStyle(t)}>Append</button>
              <button onClick={() => saveAsNote(line)} style={btnStyle(t)}>Save as note</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function btnStyle(t, primary) {
  return {
    padding: '4px 10px',
    background: primary ? t.accent : 'transparent',
    color: primary ? t.onAccent : t.ink2,
    border: primary ? 'none' : `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}
