/**
 * PlotInsights — the analytical surfaces that live under the Plot Lab:
 *   - DanglingThreads (threads that haven't been touched in N chapters)
 *   - ThreadDensityHeatmap (per-chapter thread activity)
 *   - ParallelPOV (where every character is at chapter N)
 *   - PlantPayoff (simple registry of plants and their resolution status)
 *
 * These read from existing worldState fields and degrade gracefully if the
 * underlying data isn't there yet. The "Run continuity sweep" button on the
 * Plot Lab page fires Canon Weaver which enriches this data over time.
 */

import React, { useMemo, useState } from 'react';
import { AlertTriangle, TrendingUp, Users, Anchor, CheckCircle } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

function Panel({ title, icon: Icon, children }) {
  const t = useTheme();
  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {Icon && <Icon size={13} color={t.accent} />}
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

export function DanglingThreads({ worldState, quietThreshold = 4 }) {
  const t = useTheme();
  const threads = worldState?.plotThreads || [];
  const books = Object.values(worldState?.books || {});
  const lastChapter = books[0]?.chapters?.[books[0].chapters.length - 1]?.id || 1;

  const alerts = threads
    .map((th) => {
      const lastTouch = th.lastChapter || th.opens || th.created || 1;
      const silence = Math.max(0, lastChapter - Number(lastTouch));
      return { ...th, lastTouch, silence };
    })
    .filter((x) => x.status !== 'closed' && x.silence >= quietThreshold)
    .sort((a, b) => b.silence - a.silence);

  return (
    <Panel title={`Dangling threads (\u2265 ${quietThreshold} chapters silent)`} icon={AlertTriangle}>
      {alerts.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>
          No dangling threads. All open plots have been touched recently.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map((th) => (
            <div
              key={th.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: t.bg,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                fontSize: 12,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.warn }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: t.ink }}>{th.name || th.title || 'Untitled thread'}</div>
                <div style={{ color: t.ink3, fontSize: 10 }}>
                  Last touched ch.{th.lastTouch} &middot; silent {th.silence} chapters
                </div>
              </div>
              {th.severity && (
                <div
                  style={{
                    fontFamily: t.mono, fontSize: 9, color: t.warn,
                    letterSpacing: 0.12, textTransform: 'uppercase',
                  }}
                >
                  {th.severity}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function ThreadDensityHeatmap({ worldState }) {
  const t = useTheme();
  const threads = worldState?.plotThreads || [];
  const book = Object.values(worldState?.books || {})[0];
  const chapters = book?.chapters || [];

  // Density: count how many threads mention each chapter (via references or
  // explicit `.chapters` array). No chapters = empty state.
  const counts = useMemo(() => {
    const map = new Map();
    chapters.forEach((c) => map.set(c.id, 0));
    threads.forEach((th) => {
      const refs = th.chapters || th.references || [];
      refs.forEach((r) => {
        const n = typeof r === 'number' ? r : parseInt(String(r).replace(/[^0-9]/g, ''), 10);
        if (n && map.has(n)) map.set(n, (map.get(n) || 0) + 1);
      });
      const last = Number(th.lastChapter || th.opens);
      if (last && map.has(last)) map.set(last, (map.get(last) || 0) + 1);
    });
    return map;
  }, [chapters, threads]);

  const values = Array.from(counts.values());
  const max = Math.max(1, ...values);

  return (
    <Panel title="Thread density per chapter" icon={TrendingUp}>
      {chapters.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>No chapters yet.</div>
      ) : (
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', overflowX: 'auto', paddingBottom: 6 }}>
          {chapters.map((c) => {
            const v = counts.get(c.id) || 0;
            const h = 8 + Math.round((v / max) * 60);
            return (
              <div
                key={c.id}
                title={`Ch.${c.id}${c.title ? ` \u2014 ${c.title}` : ''}: ${v} thread activity`}
                style={{
                  width: 14,
                  height: h,
                  background: v === 0 ? t.rule : v / max > 0.66 ? t.warn : t.accent,
                  borderRadius: 2,
                  opacity: v === 0 ? 0.5 : 0.4 + 0.6 * (v / max),
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 11, color: t.ink3 }}>
        Saggy middles and pile-ups are visible at a glance. Low bars mean few
        threads are active; very tall bars mean many open plots are converging.
      </div>
    </Panel>
  );
}

export function ParallelPOV({ worldState }) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const book = Object.values(worldState?.books || {})[0];
  const chapters = book?.chapters || [];
  const maxChapter = chapters[chapters.length - 1]?.id || 1;
  const [ch, setCh] = useState(maxChapter);

  return (
    <Panel title={`Parallel POV slice (ch. ${ch})`} icon={Users}>
      {chapters.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>No chapters yet.</div>
      ) : (
        <>
          <input
            type="range"
            min={1}
            max={maxChapter}
            value={ch}
            onChange={(e) => setCh(Number(e.target.value))}
            style={{ width: '100%', accentColor: t.accent, marginBottom: 10 }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {actors.slice(0, 20).map((a) => {
              // Each actor's most recent known location at or before `ch`
              let location = null;
              let knowledge = null;
              (a.timeline || []).forEach((e) => {
                const n = Number(e.chapter);
                if (!n || n > ch) return;
                if (e.location) location = e.location;
                if (e.knowledge) knowledge = e.knowledge;
              });
              return (
                <div
                  key={a.id}
                  style={{
                    padding: 10,
                    background: t.bg,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: t.ink, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ color: t.ink3, fontSize: 11, marginTop: 2 }}>
                    {location ? `\u25CE ${location}` : 'Location unknown'}
                  </div>
                  {knowledge && (
                    <div style={{ color: t.ink2, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                      &ldquo;{knowledge}&rdquo;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}

export function PlantPayoff({ worldState }) {
  const t = useTheme();
  const threads = worldState?.plotThreads || [];
  const plants = threads.filter((th) => th.kind === 'plant' || th.type === 'plant' || (th.tags || []).includes('plant'));

  return (
    <Panel title="Plants & payoffs" icon={Anchor}>
      {plants.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>
          No plants marked yet. Tag any plot-thread with <code>type: "plant"</code>
          {' '}or include &ldquo;plant&rdquo; in its tags to track it here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plants.map((p) => {
            const resolved = p.payoffChapter || p.resolvedAt;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: t.bg,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  fontSize: 12,
                }}
              >
                {resolved ? (
                  <CheckCircle size={12} color={t.good} />
                ) : (
                  <AlertTriangle size={12} color={t.warn} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ color: t.ink }}>{p.name || p.title || 'Plant'}</div>
                  <div style={{ color: t.ink3, fontSize: 10 }}>
                    {resolved ? `Paid off ch.${resolved}` : `Planted ch.${p.opens || p.chapter || '?'} &mdash; awaiting payoff`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
