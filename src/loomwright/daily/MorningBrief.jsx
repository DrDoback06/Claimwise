/**
 * Morning Brief — start-of-day summary, generated from current worldState.
 */

import React, { useEffect, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import { generateMorningBrief } from './dailyAI';

const KIND_META = {
  noticed: { label: 'Noticed',    color: 'oklch(72% 0.10 200)', icon: 'eye' },
  worry:   { label: 'Worry about', color: 'oklch(65% 0.18 25)', icon: 'flag' },
  delight: { label: 'Delight in', color: 'oklch(72% 0.13 145)', icon: 'sparkle' },
  ahead:   { label: 'Look ahead', color: 'oklch(78% 0.13 78)', icon: 'arrow' },
};

const CACHE_KEY = (bookId) => `lw-brief-cache-${bookId}`;

function BriefBody({ worldState }) {
  const t = useTheme();
  const bookIds = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const [bookId, setBookId] = useState(bookIds[bookIds.length - 1] || 1);
  const [brief, setBrief] = useState(null);
  const [busy, setBusy] = useState(false);
  const [handled, setHandled] = useState(new Set());

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY(bookId)) || 'null');
      if (cached?.brief) setBrief(cached.brief);
    } catch {
      setBrief(null);
    }
  }, [bookId]);

  const generate = async () => {
    setBusy(true);
    const b = await generateMorningBrief(worldState, bookId);
    setBrief(b);
    try {
      localStorage.setItem(CACHE_KEY(bookId), JSON.stringify({ brief: b, at: Date.now() }));
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const toggleHandled = (id) => {
    setHandled((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
            Loomwright \u00B7 Morning Brief
          </div>
          <div style={{ fontFamily: t.display, fontSize: 28, fontWeight: 500, color: t.ink }}>
            {brief?.greeting || 'Good morning, writer.'}
          </div>
        </div>
        {bookIds.length > 1 && (
          <select
            value={bookId}
            onChange={(e) => setBookId(Number(e.target.value))}
            style={{
              padding: '6px 10px',
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
        <Button variant="primary" onClick={generate} disabled={busy} icon={<Icon name="sparkle" size={12} />}>
          {busy ? '\u2026' : brief ? 'Refresh' : 'Generate'}
        </Button>
        <ThemeToggle />
      </div>
      {brief?.summary && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.display,
            fontSize: 15,
            color: t.ink2,
            lineHeight: 1.7,
            fontStyle: 'italic',
          }}
        >
          {brief.summary}
        </div>
      )}
      {brief?.sections?.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {brief.sections.map((sec) => {
            const meta = KIND_META[sec.kind] || KIND_META.noticed;
            return (
              <div
                key={sec.kind}
                style={{
                  background: t.paper,
                  border: `1px solid ${t.rule}`,
                  borderLeft: `3px solid ${meta.color}`,
                  borderRadius: t.radius,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Icon name={meta.icon} size={12} color={meta.color} />
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 10,
                      color: meta.color,
                      letterSpacing: 0.14,
                      textTransform: 'uppercase',
                    }}
                  >
                    {sec.title || meta.label}
                  </span>
                </div>
                {(sec.items || []).length === 0 ? (
                  <div style={{ color: t.ink3, fontSize: 12 }}>Nothing here today.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sec.items.map((it) => {
                      const done = handled.has(it.id);
                      return (
                        <div
                          key={it.id}
                          onClick={() => toggleHandled(it.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: 8,
                            borderRadius: t.radius,
                            background: done ? t.paper2 : 'transparent',
                            cursor: 'pointer',
                            opacity: done ? 0.5 : 1,
                            textDecoration: done ? 'line-through' : 'none',
                          }}
                        >
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 2,
                              border: `1px solid ${done ? t.accent : t.rule}`,
                              background: done ? t.accent : 'transparent',
                              display: 'grid',
                              placeItems: 'center',
                              color: t.onAccent,
                              fontFamily: t.mono,
                              fontSize: 9,
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          >
                            {done ? '\u2713' : ''}
                          </div>
                          <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.5 }}>
                            {it.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!brief && (
        <div
          style={{
            marginTop: 20,
            padding: 22,
            background: t.paper,
            border: `1px dashed ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink3,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          No brief yet today. Click <strong>Generate</strong> to produce one from your current book.
        </div>
      )}
    </div>
  );
}

export { BriefBody };

export default function MorningBrief(props) {
  return (
    <LoomwrightShell>
      <BriefBody {...props} />
    </LoomwrightShell>
  );
}
