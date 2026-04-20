/**
 * AINoticingsBrief — "what the Loom saw" panel for Today.
 *
 * Derives three ambient observations from worldState (no LLM required) so
 * the dashboard always has something useful to show on first load. Each
 * noticing has a one-click deep-link that takes the user to the right place.
 *
 * Kinds surfaced:
 *   - DANGLING THREAD   : an open plot thread that hasn't been touched for N chapters
 *   - SILENT CHARACTER  : a cast member who hasn't appeared in the last M chapters
 *   - PROMISING PLANT   : an item / wiki entry introduced recently with no follow-up
 *
 * When aiService is reachable, a second pass can enrich these with
 * AI-generated reasoning. That's wired through Canon Weaver's sweep so the
 * dashboard benefits from improvements made elsewhere.
 */

import React, { useMemo } from 'react';
import { AlertTriangle, UserX, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

function buildNoticings(worldState) {
  const books = Object.values(worldState?.books || {});
  const chapters = books[0]?.chapters || [];
  const actors = worldState?.actors || [];
  const threads = worldState?.plotThreads || [];
  const items = worldState?.itemBank || [];
  const last = chapters[chapters.length - 1]?.id || 1;

  const out = [];

  // 1) Dangling thread — oldest silent
  const dangling = threads
    .filter((th) => th.status !== 'closed')
    .map((th) => {
      const lastTouch = Number(th.lastChapter || th.opens || 1);
      return { th, silence: Math.max(0, last - lastTouch) };
    })
    .filter((x) => x.silence >= 4)
    .sort((a, b) => b.silence - a.silence)[0];
  if (dangling) {
    out.push({
      kind: 'thread',
      icon: AlertTriangle,
      title: `${dangling.th.name || 'A plot thread'} hasn\u2019t moved since ch.${Number(dangling.th.lastChapter || dangling.th.opens)}.`,
      body: `Silent for ${dangling.silence} chapters. Intentional build-up, or a loose end?`,
      action: 'plot_timeline',
      cta: 'Open Plot Lab',
    });
  }

  // 2) Silent character
  const silent = actors.map((a) => {
    let lastCh = 0;
    // Prefer explicit actor.chapters[] if present; else scan chapter text
    (chapters || []).forEach((c) => {
      const text = `${c.title || ''} ${c.summary || ''} ${c.script || ''}`.toLowerCase();
      const name = (a.name || '').toLowerCase();
      if (name && text.includes(name) && c.id > lastCh) lastCh = c.id;
    });
    return { a, silence: Math.max(0, last - (lastCh || 0)) };
  }).filter((x) => x.a.role !== 'supporting' && x.silence >= 5).sort((a, b) => b.silence - a.silence)[0];
  if (silent) {
    out.push({
      kind: 'silent',
      icon: UserX,
      title: `${silent.a.name} hasn\u2019t appeared in ${silent.silence} chapters.`,
      body: silent.a.role === 'lead'
        ? 'A lead has gone silent \u2014 probably worth a beat.'
        : 'A named character has drifted off-page.',
      action: 'cast_detail',
      actionPayload: { characterId: silent.a.id },
      cta: 'Open character',
    });
  }

  // 3) Promising plant — recent item with no history
  const recent = items
    .filter((i) => i.origin && Number(i.origin) > Math.max(1, last - 3))
    .filter((i) => !i.track || Object.keys(i.track).length <= 1)[0];
  if (recent) {
    out.push({
      kind: 'plant',
      icon: Sparkles,
      title: `${recent.name} was introduced recently.`,
      body: 'Drop an idea and let Canon Weaver propose where it surfaces next.',
      action: 'write',
      cta: 'Open Weaver',
    });
  }

  // Fallbacks so the panel is never empty on a fresh install.
  while (out.length < 3) {
    out.push({
      kind: 'idle',
      icon: Sparkles,
      title: 'Nothing flagged yet.',
      body: 'As you draft, the Loom will start noticing drift, silent characters and promising plants here.',
      action: 'write',
      cta: 'Start writing',
    });
  }

  return out.slice(0, 3);
}

export default function AINoticingsBrief({ worldState, onNavigate }) {
  const t = useTheme();
  const noticings = useMemo(() => buildNoticings(worldState), [worldState]);
  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.2, textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        What the Loom saw
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {noticings.map((n, i) => {
          const Icon = n.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onNavigate?.(n.action, n.actionPayload)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', textAlign: 'left',
                padding: '10px 12px',
                background: t.bg,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                color: t.ink,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 28, height: 28, borderRadius: t.radius,
                  background: t.accentSoft, color: t.accent,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}
              >
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: t.ink2, marginTop: 2 }}>{n.body}</div>
              </div>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: t.mono, fontSize: 10, color: t.accent,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.cta} <ArrowRight size={11} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
