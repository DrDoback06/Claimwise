/**
 * Daily Spark — typed editorial prompts about the current book.
 * Generated on demand via dailyAI.generateSparks; dismissed sparks persisted
 * in localStorage under 'lw-spark-dismissed'.
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import { generateSparks, KIND_META, SEVERITY_META } from './dailyAI';
import { dispatchWeaver } from '../weaver/weaverAI';
import toastService from '../../services/toastService';

const REMIND_KEY = 'lw-spark-reminders';
const IDEAS_KEY  = 'lw-spark-ideas';

function addReminder(spark) {
  try {
    const raw = JSON.parse(localStorage.getItem(REMIND_KEY) || '[]');
    const next = [{ spark, remindAt: Date.now() + 7 * 86_400_000 }, ...raw].slice(0, 50);
    localStorage.setItem(REMIND_KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

function fileIdea(spark) {
  try {
    const raw = JSON.parse(localStorage.getItem(IDEAS_KEY) || '[]');
    const next = [{ spark, at: Date.now() }, ...raw].slice(0, 100);
    localStorage.setItem(IDEAS_KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

const DISMISS_KEY = 'lw-spark-dismissed';
const CACHE_KEY = (bookId) => `lw-spark-cache-${bookId}`;

function loadDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function SparkCard({ spark, onDismiss, onFocus }) {
  const t = useTheme();
  const k = KIND_META[spark.kind] || KIND_META.editor;
  const s = SEVERITY_META[spark.severity] || SEVERITY_META.low;
  return (
    <div
      style={{
        padding: 14,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderLeft: `3px solid ${k.color}`,
        borderRadius: t.radius,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name={k.icon} size={12} color={k.color} />
        <span style={{ fontFamily: t.mono, fontSize: 9, color: k.color, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          {k.label}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: t.mono, fontSize: 9, color: s.color, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          {s.label}
        </span>
      </div>
      <div style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500, color: t.ink }}>
        {spark.title}
      </div>
      <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>{spark.body}</div>
      {spark.linkedChapters?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
          {spark.linkedChapters.map((c) => (
            <span
              key={c}
              style={{
                padding: '2px 6px',
                background: t.paper2,
                border: `1px solid ${t.rule}`,
                borderRadius: 2,
                fontFamily: t.mono,
                fontSize: 9,
                color: t.ink3,
                letterSpacing: 0.1,
              }}
            >
              CH.{String(c).padStart(2, '0')}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        <Button size="sm" variant="ghost" onClick={() => onDismiss(spark.id)}>
          Dismiss
        </Button>
        <Button size="sm" variant="default" onClick={() => onFocus?.(spark)}>
          Focus
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            dispatchWeaver({
              mode: 'scene',
              text: `Draft a cold open inspired by this spark:\n\nTitle: ${spark.title}\n${spark.body}`,
              transcript: spark.body,
              autoRun: true,
            });
            toastService.info?.('Canon Weaver is drafting a cold open.');
          }}
        >
          Draft cold open
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            dispatchWeaver({
              mode: 'single',
              text: `Show two contrasting approaches to this idea so the writer can pick one:\n\n${spark.title}\n${spark.body}`,
              autoRun: true,
            });
            toastService.info?.('Weaver will propose two versions.');
          }}
        >
          Both versions
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            addReminder(spark);
            onDismiss(spark.id);
            toastService.success?.('Reminder set for a week.');
          }}
        >
          Remind in a week
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            fileIdea(spark);
            onDismiss(spark.id);
            toastService.success?.('Filed under ideas.');
          }}
        >
          File under ideas
        </Button>
      </div>
    </div>
  );
}

function SparkBody({ worldState }) {
  const t = useTheme();
  const bookIds = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const [bookId, setBookId] = useState(bookIds[bookIds.length - 1] || 1);
  const [sparks, setSparks] = useState([]);
  const [dismissed, setDismissed] = useState(() => loadDismissed());
  const [busy, setBusy] = useState(false);
  const [kindFilter, setKindFilter] = useState(null);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY(bookId)) || 'null');
      if (cached && Array.isArray(cached.sparks)) setSparks(cached.sparks);
    } catch {
      setSparks([]);
    }
  }, [bookId]);

  const refresh = async () => {
    setBusy(true);
    const out = await generateSparks(worldState, bookId);
    setSparks(out);
    try {
      localStorage.setItem(CACHE_KEY(bookId), JSON.stringify({ sparks: out, at: Date.now() }));
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const dismiss = (id) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(next))); } catch {}
  };

  const visible = useMemo(() => {
    return sparks.filter((s) => !dismissed.has(s.id) && (!kindFilter || s.kind === kindFilter));
  }, [sparks, dismissed, kindFilter]);

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
            Loomwright
          </div>
          <div style={{ fontFamily: t.display, fontSize: 24, fontWeight: 500, color: t.ink }}>
            Daily Spark
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
        <Button variant="primary" onClick={refresh} disabled={busy} icon={<Icon name="sparkle" size={12} />}>
          {busy ? '\u2026' : 'Generate sparks'}
        </Button>
        <ThemeToggle />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button
          type="button"
          onClick={() => setKindFilter(null)}
          style={{
            padding: '3px 8px',
            background: !kindFilter ? t.accentSoft : 'transparent',
            color: !kindFilter ? t.accent : t.ink2,
            border: `1px solid ${!kindFilter ? t.accent : t.rule}`,
            borderRadius: 2,
            fontFamily: t.mono,
            fontSize: 9,
            letterSpacing: 0.12,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {Object.entries(KIND_META).map(([k, m]) => {
          const active = kindFilter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(active ? null : k)}
              style={{
                padding: '3px 8px',
                background: active ? m.color + '30' : 'transparent',
                color: active ? m.color : t.ink2,
                border: `1px solid ${active ? m.color : t.rule}`,
                borderRadius: 2,
                fontFamily: t.mono,
                fontSize: 9,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <div
          style={{
            padding: 24,
            color: t.ink3,
            fontSize: 13,
            background: t.paper,
            border: `1px dashed ${t.rule}`,
            borderRadius: t.radius,
            textAlign: 'center',
          }}
        >
          {sparks.length === 0
            ? 'No sparks yet. Click "Generate sparks" to let the Loom scan your book.'
            : 'Everything dismissed or filtered out.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {visible.map((s) => (
            <SparkCard key={s.id} spark={s} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

export { SparkBody };

export default function DailySpark({ scoped = false, ...props }) {
  return (
    <LoomwrightShell scoped={scoped}>
      <SparkBody {...props} />
    </LoomwrightShell>
  );
}
