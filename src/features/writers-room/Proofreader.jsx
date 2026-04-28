// Loomwright — Proofreader. Lists every spelling/grammar issue in the
// current chapter, with one-click apply. Two passes: instant local
// heuristics + on-demand AI sweep.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';
import { activeChapter } from './store/selectors';
import { localProofread, aiProofread, applyFix } from './utilities/proofread';

export default function Proofreader({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);
  const text = ch?.text || '';

  const local = React.useMemo(() => localProofread(text), [text]);
  const [ai, setAi] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [hidden, setHidden] = React.useState(new Set());

  const issues = [...local, ...ai].filter(i => !hidden.has(i.id));

  const runAI = async () => {
    setBusy(true);
    try {
      const out = await aiProofread(text, store.profile);
      setAi(out);
    } catch {}
    setBusy(false);
  };

  const apply = (issue) => {
    if (!ch) return;
    const next = applyFix(ch.text || '', issue);
    if (next === ch.text) {
      setHidden(s => new Set(s).add(issue.id));
      return;
    }
    store.setSlice('chapters', chs => ({
      ...chs,
      [ch.id]: { ...chs[ch.id], text: next, paragraphs: null, lastEdit: Date.now() },
    }));
    setHidden(s => new Set(s).add(issue.id));
  };

  const applyAll = () => {
    if (!ch) return;
    let next = ch.text || '';
    const seen = new Set();
    for (const issue of issues) {
      // applyFix replaces the first occurrence; do them in reverse
      // offset order so earlier offsets don't get invalidated.
    }
    // Reverse-offset apply to keep earlier indexes stable.
    const ordered = [...issues].sort((a, b) => b.span.start - a.span.start);
    for (const issue of ordered) {
      const idx = next.indexOf(issue.quote);
      if (idx < 0) continue;
      next = next.slice(0, idx) + issue.fix + next.slice(idx + issue.quote.length);
      seen.add(issue.id);
    }
    store.setSlice('chapters', chs => ({
      ...chs,
      [ch.id]: { ...chs[ch.id], text: next, paragraphs: null, lastEdit: Date.now() },
    }));
    setHidden(s => {
      const n = new Set(s);
      for (const id of seen) n.add(id);
      return n;
    });
  };

  const jumpTo = (issue) => {
    // Best-effort: scroll the editor into view at the matching paragraph.
    const editor = document.querySelector('.lw-prose-wrap [contenteditable="true"]');
    if (!editor) return;
    // Find paragraph containing this offset.
    const paragraphs = ch?.paragraphs || [];
    let cumulative = 0, target = null;
    for (const p of paragraphs) {
      const len = (p.text || '').length + 2;
      if (issue.span.start <= cumulative + len) { target = p.id; break; }
      cumulative += len;
    }
    const el = target ? document.querySelector(`[data-paragraph-id="${target}"]`) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const counts = {
    spelling: issues.filter(i => i.kind === 'spelling').length,
    grammar: issues.filter(i => i.kind === 'grammar').length,
  };

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(100%, 420px)',
      background: t.paper, borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', zIndex: 2500,
      animation: 'lw-slide-in 240ms ease',
      boxShadow: '0 0 24px rgba(0,0,0,0.08)',
    }}>
      <header style={{
        padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.language,
          letterSpacing: 0.16, textTransform: 'uppercase', flex: 1,
        }}>Proofreader · {ch?.title || 'no chapter'}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 18 }}>×</button>
      </header>

      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>
          {counts.spelling} spelling · {counts.grammar} grammar
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={runAI} disabled={busy} style={{
          padding: '5px 10px', background: busy ? t.rule : 'transparent',
          color: busy ? t.ink3 : t.ink2, border: `1px solid ${t.rule}`, borderRadius: 14,
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer',
        }}>{busy ? 'Reading…' : ai.length ? '↻ Run AI again' : 'Run AI sweep'}</button>
        {issues.length > 0 && (
          <button onClick={applyAll} style={{
            padding: '5px 10px', background: PANEL_ACCENT.language, color: t.onAccent,
            border: 'none', borderRadius: 14,
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          }}>Apply all</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {issues.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            {busy ? 'Reading the chapter…' : 'Looks clean. Hit "Run AI sweep" if you want a deeper pass.'}
          </div>
        )}
        {issues.map(i => (
          <div key={i.id} style={{
            marginBottom: 10, padding: 10,
            background: t.paper2,
            borderLeft: `2px solid ${i.severity === 'warn' ? t.warn : PANEL_ACCENT.language}`,
            borderRadius: 1,
          }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}>{i.kind} · {i.label}</div>
            <div style={{ marginTop: 6, lineHeight: 1.5 }}>
              <span style={{
                fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic',
                textDecoration: 'line-through', textDecorationColor: t.bad, textDecorationThickness: 1,
              }}>{i.quote}</span>
              <span style={{ color: t.ink3, margin: '0 6px', fontFamily: t.mono, fontSize: 11 }}>→</span>
              <span style={{
                fontFamily: t.display, fontSize: 13, color: t.good, fontWeight: 500,
              }}>{i.fix}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <button onClick={() => apply(i)} style={btnStyle(t, true)}>Apply</button>
              <button onClick={() => jumpTo(i)} style={btnStyle(t)}>Show in prose</button>
              <button onClick={() => setHidden(s => { const n = new Set(s); n.add(i.id); return n; })} style={btnStyle(t)}>Ignore</button>
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
