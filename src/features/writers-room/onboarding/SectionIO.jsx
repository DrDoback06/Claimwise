// Loomwright — per-section JSON I/O panel for the onboarding wizard.
//
// Renders three things:
//   • a traffic-light pill ( red / amber / green ) that reflects current
//     completeness for the section,
//   • a "Copy prompt" button that yields a strict instruction + the
//     existing answers, ready to paste into ChatGPT/Claude/etc,
//   • a paste-back textarea that strict-parses JSON and applies it to
//     the wizard state, surfacing schema errors inline.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { TRAFFIC_LIGHT_COLOR } from './completeness';

export default function SectionIO({
  section,                 // schema object from ./schemas
  data,                    // current wizard state
  evaluation,              // { status, reasons } from completeness
  onApply,                 // (mergedState) => void
}) {
  const t = useTheme();
  const [copied, setCopied] = React.useState(false);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState('');
  const [pasteError, setPasteError] = React.useState(null);

  const copy = async () => {
    const prompt = section.prompt(data);
    try { await navigator.clipboard.writeText(prompt); }
    catch { /* fall through */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const apply = () => {
    setPasteError(null);
    let parsed;
    try {
      parsed = JSON.parse(stripFences(pasteText));
    } catch (err) {
      setPasteError('Not valid JSON. Strip prose and code fences.');
      return;
    }
    if (section.validate && !section.validate(parsed)) {
      setPasteError(`Doesn't match the ${section.title} schema. Required keys may be missing or wrong type.`);
      return;
    }
    onApply(section.applyTo(data, parsed));
    setPasteOpen(false);
    setPasteText('');
  };

  const status = evaluation?.status || 'red';
  const tooltip = (evaluation?.reasons || []).join(' · ') || 'Complete';

  return (
    <div style={{
      marginTop: 16, padding: '10px 12px',
      background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrafficLight status={status} title={tooltip} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>External AI</div>
          <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink2, lineHeight: 1.4 }}>
            Paste the prompt into ChatGPT/Claude/etc, then paste the JSON
            it returns back here. We validate strictly.
          </div>
        </div>
        <button onClick={copy} style={btn(t)}>
          {copied ? '✓ Copied' : '📋 Copy prompt'}
        </button>
        <button onClick={() => setPasteOpen(o => !o)} style={btn(t, true)}>
          {pasteOpen ? 'Cancel' : '↩ Paste JSON'}
        </button>
      </div>

      {pasteOpen && (
        <div style={{ marginTop: 8 }}>
          <textarea
            rows={6}
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setPasteError(null); }}
            placeholder='Paste only the JSON object, e.g. { "premise": "..." }'
            style={{
              width: '100%', padding: '6px 8px', resize: 'vertical',
              fontFamily: t.mono, fontSize: 11, color: t.ink, lineHeight: 1.4,
              background: t.paper, border: `1px solid ${pasteError ? (t.bad || '#c44') : t.rule}`,
              borderRadius: 1, outline: 'none',
            }}
          />
          {pasteError && (
            <div style={{
              marginTop: 4, padding: '4px 8px',
              background: 'transparent', color: t.bad || '#c44',
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1,
            }}>{pasteError}</div>
          )}
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={apply} disabled={!pasteText.trim()} style={btn(t, true)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrafficLight({ status, title }) {
  const t = useTheme();
  const color = TRAFFIC_LIGHT_COLOR[status] || TRAFFIC_LIGHT_COLOR.red;
  const label = status.toUpperCase();
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 8px',
      background: color + '22',
      border: `1px solid ${color}`,
      borderRadius: 999,
      fontFamily: t.mono, fontSize: 9, letterSpacing: 0.16, textTransform: 'uppercase',
      color: color,
    }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: color,
      }} />
      {label}
    </span>
  );
}

function stripFences(text) {
  let s = String(text || '').trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  }
  // Pull the outermost {...} when the AI adds prose.
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

function btn(t, primary) {
  return {
    padding: '4px 10px',
    background: primary ? PANEL_ACCENT.loom : 'transparent',
    color: primary ? t.onAccent : t.ink2,
    border: `1px solid ${primary ? PANEL_ACCENT.loom : t.rule}`,
    borderRadius: 1, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
    fontWeight: 600, whiteSpace: 'nowrap',
  };
}
