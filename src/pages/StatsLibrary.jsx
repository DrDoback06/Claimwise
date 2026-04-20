/**
 * StatsLibrary — the stat registry + helpful aggregate widgets.
 *
 * Stats come from worldState.statRegistry. Each stat shows how many actors,
 * items and skills reference it. Individual stat detail modules live on the
 * character detail page (Stats tab).
 */

import React, { useMemo } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody } from './_shared/PageChrome';

function StatTile({ stat, usage }) {
  const t = useTheme();
  return (
    <div
      style={{
        padding: 14,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: t.radius,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.2, textTransform: 'uppercase' }}>
            {stat.key}
          </div>
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink, marginTop: 2 }}>
            {stat.name}
          </div>
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2 }}>
          {stat.isCore ? 'core' : 'custom'}
        </div>
      </div>
      {stat.desc && (
        <div style={{ fontSize: 11, color: t.ink2, marginTop: 8, lineHeight: 1.4 }}>
          {stat.desc}
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
        <div>Actors <span style={{ color: t.ink }}>{usage.actors}</span></div>
        <div>Items <span style={{ color: t.ink }}>{usage.items}</span></div>
        <div>Skills <span style={{ color: t.ink }}>{usage.skills}</span></div>
      </div>
    </div>
  );
}

export default function StatsLibraryPage({ worldState }) {
  const t = useTheme();
  const stats = worldState?.statRegistry || [];
  const actors = worldState?.actors || [];
  const items = worldState?.itemBank || [];
  const skills = worldState?.skillBank || [];

  const usage = useMemo(() => {
    const out = {};
    stats.forEach((s) => {
      out[s.key] = {
        actors: actors.filter((a) => a.baseStats?.[s.key] !== undefined).length,
        items: items.filter((i) => i.stats?.[s.key] !== undefined || i.statMod?.[s.key] !== undefined).length,
        skills: skills.filter((sk) => sk.statMod?.[s.key] !== undefined || sk.stats?.[s.key] !== undefined).length,
      };
    });
    return out;
  }, [stats, actors, items, skills]);

  return (
    <Page>
      <PageHeader
        eyebrow="Track"
        title="Stats Library"
        subtitle={`${stats.length} ${stats.length === 1 ? 'stat' : 'stats'} in this world`}
      />
      <PageBody>
        {stats.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: t.ink2,
              border: `1px dashed ${t.rule}`,
              borderRadius: t.radius,
              background: t.paper,
            }}
          >
            No stats configured.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {stats.map((s) => (
              <StatTile key={s.id || s.key} stat={s} usage={usage[s.key] || { actors: 0, items: 0, skills: 0 }} />
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  );
}
