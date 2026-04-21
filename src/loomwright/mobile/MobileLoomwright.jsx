/**
 * Mobile Loomwright — three mobile screens (Today / Writing / Capture)
 * inside an iOS-style device frame. Uses real worldState for chapter/actor
 * counts, atlas-style pings from manuscript prose, and persisted capture queue.
 */

import React, { useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import { generateMorningBrief, generateSparks } from '../daily/dailyAI';
import { proposePlaces } from '../../services/atlasProposals';
import { dispatchWeaver } from '../weaver/weaverAI';

const CAPTURE_KEY = 'lw-mobile-capture-queue';

function loadCaptureQueue() {
  try {
    const raw = localStorage.getItem(CAPTURE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCaptureQueue(items) {
  try {
    localStorage.setItem(CAPTURE_KEY, JSON.stringify(items));
  } catch { /* noop */ }
}

function Device({ children, title }) {
  const t = useTheme();
  return (
    <div
      style={{
        width: 390,
        height: 760,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: 44,
        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: 32,
          background: t.bg,
          color: t.ink2,
          fontFamily: t.mono,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          letterSpacing: 0.1,
        }}
      >
        <span>9:41</span>
        <span style={{ width: 100, height: 18, background: t.ink, opacity: 0.7, borderRadius: 12 }} />
        <span>100%</span>
      </div>
      <div
        style={{
          padding: '6px 18px',
          borderBottom: `1px solid ${t.rule}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          Loomwright
        </span>
        <span style={{ fontFamily: t.display, fontSize: 15, color: t.ink, fontWeight: 500 }}>{title}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>\u2630</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>{children}</div>
      <div
        style={{
          height: 24,
          borderTop: `1px solid ${t.rule}`,
          display: 'grid',
          placeItems: 'center',
          background: t.paper2,
        }}
      >
        <div style={{ width: 120, height: 4, background: t.ink3, borderRadius: 2, opacity: 0.6 }} />
      </div>
    </div>
  );
}

function Today({ worldState }) {
  const t = useTheme();
  const bookIds = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const [bookId] = useState(bookIds[bookIds.length - 1] || 1);
  const book = worldState?.books?.[bookId];
  const chapters = book?.chapters || [];
  const lastChapter = chapters[chapters.length - 1];
  const [brief, setBrief] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sparkBusy, setSparkBusy] = useState(false);
  const [spark, setSpark] = useState(null);

  const wordCount = useMemo(() => {
    let n = 0;
    Object.values(worldState?.books || {}).forEach((b) => {
      (b.chapters || []).forEach((c) => {
        const body = c.content || c.script || c.text || '';
        n += String(body).split(/\s+/).filter(Boolean).length;
      });
    });
    return n;
  }, [worldState?.books]);

  const pings = useMemo(() => proposePlaces(worldState).slice(0, 4), [worldState]);

  const go = async () => {
    setBusy(true);
    setBrief(await generateMorningBrief(worldState, bookId));
    setBusy(false);
  };

  const rollSpark = async () => {
    setSparkBusy(true);
    const sparks = await generateSparks(worldState, bookId);
    setSpark(sparks[0] || null);
    setSparkBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          padding: 14,
          background: t.paper2,
          border: `1px solid ${t.rule}`,
          borderRadius: 14,
        }}
      >
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          {book?.title || worldState?.meta?.title || 'Current book'}
        </div>
        <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginTop: 2 }}>
          {chapters.length} chapter{chapters.length === 1 ? '' : 's'}
          <span style={{ fontSize: 12, color: t.ink3, fontFamily: t.mono, marginLeft: 8 }}>
            {wordCount.toLocaleString()} words
          </span>
        </div>
        {lastChapter && (
          <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Last: Ch.{lastChapter.id} \u2014 {lastChapter.title || '(untitled)'}
          </div>
        )}
      </div>
      <Button variant="primary" onClick={go} disabled={busy} icon={<Icon name="sparkle" size={12} />}>
        {busy ? '\u2026' : "Today's brief"}
      </Button>
      {brief && (
        <div
          style={{
            padding: 14,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderLeft: `3px solid ${t.accent}`,
            borderRadius: 8,
            fontFamily: t.display,
            fontSize: 14,
            color: t.ink2,
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          {brief.summary}
        </div>
      )}

      {pings.length > 0 && (
        <div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>
            Atlas pings (from prose)
          </div>
          {pings.map((p) => (
            <div
              key={p.id}
              style={{
                marginBottom: 6,
                padding: '10px 12px',
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: 10,
                fontSize: 12,
                color: t.ink2,
              }}
            >
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, textTransform: 'uppercase' }}>
                {p.kind} · {p.confidence}
              </div>
              <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, marginTop: 4 }}>{p.name}</div>
              {p.mentions?.[0] && (
                <div style={{ fontSize: 11, color: t.ink3, marginTop: 4, fontStyle: 'italic' }}>
                  ch.{p.mentions[0].chapterId} · {String(p.mentions[0].excerpt || '').slice(0, 120)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ghost" onClick={rollSpark} disabled={sparkBusy} icon={<Icon name="sparkle" size={11} />}>
          {sparkBusy ? '\u2026' : "Today's spark"}
        </Button>
      </div>
      {spark && (
        <div
          style={{
            padding: 14,
            background: t.bg,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, textTransform: 'uppercase' }}>
            {spark.kind || 'spark'}
          </div>
          <div style={{ fontFamily: t.display, fontSize: 15, marginTop: 6, lineHeight: 1.45 }}>
            {spark.body || spark.title}
          </div>
        </div>
      )}

      <div
        style={{
          padding: 12,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: 10,
        }}
      >
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>
          Cast
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(worldState?.actors || []).length === 0 ? (
            <span style={{ fontSize: 12, color: t.ink3 }}>No characters yet.</span>
          ) : (
            (worldState?.actors || []).slice(0, 8).map((a) => (
              <span
                key={a.id}
                style={{
                  padding: '3px 8px',
                  background: t.paper2,
                  border: `1px solid ${t.rule}`,
                  borderRadius: 999,
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: t.ink2,
                  letterSpacing: 0.1,
                  textTransform: 'uppercase',
                }}
              >
                {a.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Writing({ worldState }) {
  const t = useTheme();
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        New note
      </div>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Start writing\u2026"
        style={{
          flex: 1,
          padding: 12,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          color: t.ink,
          borderRadius: 8,
          fontFamily: t.display,
          fontSize: 16,
          lineHeight: 1.6,
          resize: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <Button size="sm" variant="ghost" icon={<Icon name="sparkle" size={10} />}>Prompt</Button>
        <Button size="sm" variant="ghost" icon={<Icon name="mic" size={10} />}>Voice</Button>
        <Button size="sm" variant="ghost" icon={<Icon name="book" size={10} />}>Context</Button>
        <div style={{ flex: 1 }} />
        <Button size="sm" variant="primary">Save</Button>
      </div>
    </div>
  );
}

function Capture() {
  const t = useTheme();
  const [items, setItems] = useState(() => loadCaptureQueue());
  const [text, setText] = useState('');
  const sync = (next) => {
    setItems(next);
    saveCaptureQueue(next);
  };
  const add = () => {
    if (!text.trim()) return;
    sync([{ id: Date.now(), text: text.trim(), at: Date.now() }, ...items]);
    setText('');
  };
  const remove = (id) => sync(items.filter((x) => x.id !== id));
  const sendToWeaver = (line) => {
    try {
      dispatchWeaver({ text: line });
    } catch { /* noop */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        Capture (synced locally)
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A thought\u2026"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: t.paper,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: 8,
            fontFamily: t.font,
            fontSize: 14,
          }}
        />
        <Button variant="primary" onClick={add}>Add</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 12, color: t.ink3, padding: 8 }}>No captures yet.</div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              style={{
                padding: 10,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: 8,
                color: t.ink,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div>{it.text}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Button size="sm" variant="ghost" onClick={() => sendToWeaver(it.text)}>
                  Send to Weaver
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(it.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MobileBody({ worldState, setWorldState: _setWorldState }) {
  const t = useTheme();
  const [screen, setScreen] = useState('today');
  return (
    <div
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
            Loomwright
          </div>
          <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink }}>
            Mobile preview
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          {[
            { id: 'today',   label: 'Today'   },
            { id: 'writing', label: 'Writing' },
            { id: 'capture', label: 'Capture' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScreen(s.id)}
              style={{
                padding: '6px 12px',
                background: screen === s.id ? t.accent : 'transparent',
                color: screen === s.id ? t.onAccent : t.ink2,
                border: 'none',
                borderRadius: 2,
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </div>
      <Device title={screen === 'today' ? 'Today' : screen === 'writing' ? 'Writing' : 'Capture'}>
        {screen === 'today' && <Today worldState={worldState} />}
        {screen === 'writing' && <Writing worldState={worldState} />}
        {screen === 'capture' && <Capture />}
      </Device>
      <div style={{ fontSize: 12, color: t.ink3, maxWidth: 420, textAlign: 'center' }}>
        These components are Capacitor-ready. They already use the existing worldState; when
        built with <code>npm run cap:build:ios</code> or <code>cap:build:android</code> they
        boot natively on device.
      </div>
    </div>
  );
}

export default function MobileLoomwright({ scoped = false, worldState, setWorldState, ...rest }) {
  return (
    <LoomwrightShell scrollable scoped={scoped}>
      <MobileBody worldState={worldState} setWorldState={setWorldState} {...rest} />
    </LoomwrightShell>
  );
}
