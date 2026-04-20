/**
 * ProvenancePane - per-item chapter-by-chapter chain of custody.
 *
 * Moved out of the World page during the canon-consolidation pass. Fed from
 * `itemBank[].track` (a chapter-keyed dict of { actorId, slotId, note }) and
 * shown on the Items Library page where it actually belongs.
 */

import React from 'react';
import { useTheme } from '../../loomwright/theme';

export default function ProvenancePane({ worldState }) {
  const t = useTheme();
  const items = (worldState?.itemBank || []).filter((i) => i.track && Object.keys(i.track).length);
  if (items.length === 0) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
          color: t.ink3,
          fontSize: 12,
          border: `1px dashed ${t.rule}`,
          borderRadius: t.radius,
          background: t.paper,
        }}
      >
        No artefacts with chapter tracks yet. Canon Weaver logs provenance when
        items change hands &mdash; accept an edit like &ldquo;Mira hands the
        sword to Tobyn&rdquo; to see it appear here.
      </div>
    );
  }
  const actors = worldState?.actors || [];
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((it) => {
        const chapters = Object.keys(it.track).map(Number).sort((a, b) => a - b);
        return (
          <div
            key={it.id}
            style={{
              padding: 14,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
            }}
          >
            <div
              style={{
                fontFamily: t.display, fontSize: 16, color: t.ink,
                marginBottom: 8,
              }}
            >
              {it.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {chapters.map((ch, i) => {
                const rec = it.track[ch];
                const a = actors.find((x) => x.id === rec.actorId);
                return (
                  <React.Fragment key={ch}>
                    {i > 0 && <span style={{ color: t.ink3 }}>&rarr;</span>}
                    <div
                      style={{
                        padding: '4px 8px',
                        background: t.bg,
                        border: `1px solid ${t.rule}`,
                        borderRadius: t.radius,
                        fontSize: 11,
                        color: t.ink,
                      }}
                      title={rec.note || ''}
                    >
                      <span style={{ color: t.accent, fontFamily: t.mono, marginRight: 4 }}>ch.{ch}</span>
                      {a?.name || 'Unknown'}
                      {rec.slotId && rec.slotId !== 'pack' && (
                        <span style={{ color: t.ink3, marginLeft: 4 }}>&middot; {rec.slotId}</span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
