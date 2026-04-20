/**
 * Language Workbench — inline check, thesaurus, rewrite, metrics.
 * Reads real manuscript text from the current chapter.
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import {
  lintManuscript,
  rewriteSnippet,
  thesaurus,
  computeMetrics,
  ISSUE_COLOR,
  ISSUE_LABEL,
  ISSUE_TYPES,
} from './languageAI';

const MODES = [
  { id: 'check',     label: 'Inline check' },
  { id: 'thesaurus', label: 'Thesaurus'    },
  { id: 'rewrite',   label: 'Rewrite'      },
  { id: 'metrics',   label: 'Metrics'      },
];

function InlineCheck({ text, issues, enabledTypes, setEnabledTypes, onDismiss, working, onScan, selected, setSelected }) {
  const t = useTheme();
  const visible = issues.filter((i) => enabledTypes.has(i.type));
  const byStart = [...visible].sort((a, b) => a.start - b.start);
  // Render text with inline highlights
  let cursor = 0;
  const segments = [];
  byStart.forEach((iss) => {
    if (iss.start > cursor) segments.push({ text: text.slice(cursor, iss.start), iss: null });
    segments.push({ text: text.slice(iss.start, iss.end), iss });
    cursor = iss.end;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor), iss: null });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, padding: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={onScan} disabled={working || !text} icon={<Icon name="sparkle" size={12} />}>
            {working ? 'Scanning\u2026' : 'Scan for issues'}
          </Button>
          <div style={{ flex: 1 }} />
          {ISSUE_TYPES.map((it) => {
            const active = enabledTypes.has(it.id);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  const set = new Set(enabledTypes);
                  if (active) set.delete(it.id);
                  else set.add(it.id);
                  setEnabledTypes(set);
                }}
                style={{
                  padding: '3px 7px',
                  fontFamily: t.mono,
                  fontSize: 9,
                  letterSpacing: 0.12,
                  textTransform: 'uppercase',
                  background: active ? it.color + '30' : 'transparent',
                  color: active ? it.color : t.ink3,
                  border: `1px solid ${active ? it.color : t.rule}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            padding: 18,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink,
            fontFamily: t.display,
            fontSize: 15,
            lineHeight: 1.7,
            minHeight: 320,
            whiteSpace: 'pre-wrap',
          }}
        >
          {segments.length === 0 && <span style={{ color: t.ink3 }}>{text || '(no chapter text)'}</span>}
          {segments.map((seg, i) => {
            if (!seg.iss) return <span key={i}>{seg.text}</span>;
            const col = ISSUE_COLOR[seg.iss.type] || t.accent;
            const isSel = selected === seg.iss.id;
            return (
              <span
                key={i}
                onClick={() => setSelected(seg.iss.id)}
                title={seg.iss.reason}
                style={{
                  background: isSel ? col + '50' : col + '25',
                  borderBottom: `2px dotted ${col}`,
                  cursor: 'pointer',
                }}
              >
                {seg.text}
              </span>
            );
          })}
        </div>
      </div>
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Issues \u00B7 {visible.length}
        </div>
        {visible.map((iss) => (
          <div
            key={iss.id}
            onClick={() => setSelected(iss.id)}
            style={{
              padding: 10,
              background: selected === iss.id ? t.paper : t.paper2,
              border: `1px solid ${selected === iss.id ? ISSUE_COLOR[iss.type] : t.rule}`,
              borderRadius: t.radius,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                color: ISSUE_COLOR[iss.type],
              }}
            >
              {ISSUE_LABEL[iss.type] || iss.type}
            </div>
            <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, marginTop: 3, fontStyle: 'italic' }}>
              "{iss.quote}"
            </div>
            {iss.suggestion && (
              <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>
                \u2192 {iss.suggestion}
              </div>
            )}
            {iss.reason && (
              <div style={{ fontSize: 11, color: t.ink3, marginTop: 4, lineHeight: 1.5 }}>
                {iss.reason}
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDismiss(iss.id); }}>
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

function ThesaurusMode() {
  const t = useTheme();
  const [word, setWord] = useState('');
  const [alts, setAlts] = useState([]);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!word.trim()) return;
    setBusy(true);
    const out = await thesaurus(word.trim());
    setAlts(out);
    setBusy(false);
  };
  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Word..."
          onKeyDown={(e) => e.key === 'Enter' && go()}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: t.paper,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.display,
            fontSize: 15,
          }}
        />
        <Button variant="primary" onClick={go} disabled={busy} icon={<Icon name="sparkle" size={12} />}>
          {busy ? '\u2026' : 'Find'}
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
        {alts.map((a, i) => (
          <div
            key={i}
            style={{
              padding: 10,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
            }}
          >
            <div style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500, color: t.ink }}>
              {a.word}
            </div>
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                color: t.accent,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              {a.register}
            </div>
            {a.nuance && (
              <div style={{ fontSize: 11, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>
                {a.nuance}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RewriteMode({ text }) {
  const t = useTheme();
  const [src, setSrc] = useState(text || '');
  const [directive, setDirective] = useState('Tighten rhythm and remove filler words.');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setSrc(text || ''), [text]);
  const run = async () => {
    setBusy(true);
    const r = await rewriteSnippet(src, directive);
    setOut(r);
    setBusy(false);
  };
  return (
    <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Source
        </div>
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          rows={12}
          style={{
            width: '100%',
            padding: 12,
            background: t.paper,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.font,
            fontSize: 13,
            lineHeight: 1.6,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <input
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="Directive..."
          style={{
            width: '100%',
            marginTop: 8,
            padding: '8px 10px',
            background: t.paper2,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.font,
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ marginTop: 8 }}>
          <Button variant="primary" onClick={run} disabled={busy} icon={<Icon name="sparkle" size={12} />}>
            {busy ? 'Rewriting\u2026' : 'Rewrite'}
          </Button>
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Rewritten
        </div>
        <div
          style={{
            padding: 12,
            background: t.paper,
            border: `1px solid ${t.accent}`,
            borderRadius: t.radius,
            minHeight: 260,
            fontFamily: t.display,
            fontSize: 14,
            color: t.ink,
            lineHeight: 1.7,
            fontStyle: 'italic',
          }}
        >
          {out || '(click "Rewrite" to generate)'}
        </div>
      </div>
    </div>
  );
}

function MetricsMode({ text }) {
  const t = useTheme();
  const m = useMemo(() => computeMetrics(text || ''), [text]);
  if (!m) return <div style={{ padding: 20, color: t.ink3 }}>No text to analyze.</div>;
  const entries = [
    ['Words',           m.words],
    ['Sentences',       m.sentences],
    ['Paragraphs',      m.paragraphs],
    ['Characters',      m.chars],
    ['Avg sentence',    m.avgSentenceLength],
    ['Long sentences',  m.longSentences],
    ['Short sentences', m.shortSentences],
    ['Flesch Ease',     m.fleschReadingEase],
  ];
  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {entries.map(([k, v]) => (
          <div
            key={k}
            style={{
              padding: 14,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
            }}
          >
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                color: t.accent,
                letterSpacing: 0.14,
                textTransform: 'uppercase',
              }}
            >
              {k}
            </div>
            <div style={{ fontFamily: t.display, fontSize: 28, fontWeight: 500, color: t.ink, marginTop: 4 }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkbenchBody({ worldState }) {
  const t = useTheme();
  const bookIds = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const [bookId, setBookId] = useState(bookIds[bookIds.length - 1] || 1);
  const book = worldState?.books?.[bookId];
  const [chapterId, setChapterId] = useState(book?.chapters?.[0]?.id || 1);
  const chapter = book?.chapters?.find((c) => c.id === chapterId);
  const chapterText = chapter?.text || chapter?.summary || '';
  const [mode, setMode] = useState('check');
  const [issues, setIssues] = useState([]);
  const [working, setWorking] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState(() => new Set(ISSUE_TYPES.map((i) => i.id)));
  const [selected, setSelected] = useState(null);

  const scan = async () => {
    if (!chapterText) return;
    setWorking(true);
    const out = await lintManuscript(chapterText);
    setIssues(out);
    setWorking(false);
  };

  useEffect(() => {
    setIssues([]);
    setSelected(null);
  }, [chapterId, bookId]);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.rule}`,
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            Loomwright
          </div>
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink }}>
            Language Workbench
          </div>
        </div>
        {bookIds.length > 1 && (
          <select
            value={bookId}
            onChange={(e) => setBookId(Number(e.target.value))}
            style={{
              padding: '6px 8px',
              background: t.paper2,
              color: t.ink,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              fontFamily: t.mono,
              fontSize: 11,
            }}
          >
            {bookIds.map((id) => (
              <option key={id} value={id}>
                {worldState.books[id].title || `Book ${id}`}
              </option>
            ))}
          </select>
        )}
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            color: t.ink3,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Chapters
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(book?.chapters || []).map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChapterId(ch.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: chapterId === ch.id ? t.paper : 'transparent',
                border: 'none',
                borderLeft: chapterId === ch.id ? `2px solid ${t.accent}` : '2px solid transparent',
                color: t.ink,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: t.display,
                fontSize: 13,
              }}
            >
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.accent }}>
                {String(ch.id).padStart(2, '0')}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ch.title || '(untitled)'}
              </span>
            </button>
          ))}
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px 20px',
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                padding: '6px 12px',
                background: mode === m.id ? t.accent : 'transparent',
                color: mode === m.id ? t.onAccent : t.ink2,
                border: `1px solid ${mode === m.id ? t.accent : t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {mode === 'check' && (
            <InlineCheck
              text={chapterText}
              issues={issues}
              enabledTypes={enabledTypes}
              setEnabledTypes={setEnabledTypes}
              onDismiss={(id) => setIssues(issues.filter((i) => i.id !== id))}
              onScan={scan}
              working={working}
              selected={selected}
              setSelected={setSelected}
            />
          )}
          {mode === 'thesaurus' && <ThesaurusMode />}
          {mode === 'rewrite'   && <RewriteMode text={chapterText} />}
          {mode === 'metrics'   && <MetricsMode text={chapterText} />}
        </div>
      </main>
    </div>
  );
}

export { WorkbenchBody };

export default function LanguageWorkbench({ scoped = false, ...props }) {
  return (
    <LoomwrightShell scrollable={false} scoped={scoped}>
      <WorkbenchBody {...props} />
    </LoomwrightShell>
  );
}
