/**
 * PlaceInspector - right-hand sidebar with the details for the selected
 * place or proposal. Shows name, note, chapter references, mention count,
 * first / last appearance stats, and quick actions:
 *   - Generate floorplan (switches to Floorplan tab, seeds the place)
 *   - Describe approach in prose (dispatches a Canon Weaver single-idea
 *     weave)
 *   - See all mentions (switches to a mentions drawer - v2 wires this
 *     through; for now jumps to the first chapter in the Writer's Room)
 *   - -> To Canon Weaver (opens Weaver capture seeded with the place)
 */

import React from 'react';
import { MapPin, Navigation, FileText, Wand2 } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { kindColor } from './kindColors';
import { dispatchWeaver } from '../../loomwright/weaver/weaverAI';
import toastService from '../../services/toastService';

function StatCard({ k, v }) {
  const t = useTheme();
  return (
    <div
      style={{
        padding: 10,
        background: t.paper2,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}
      >
        {k}
      </div>
      <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, marginTop: 2 }}>
        {v}
      </div>
    </div>
  );
}

export default function PlaceInspector({
  place,
  proposal,
  worldState,
  onOpenFloorplan,
  onNavigate,
}) {
  const t = useTheme();

  if (!place && !proposal) {
    return (
      <aside
        style={{
          width: 320, flexShrink: 0,
          borderLeft: `1px solid ${t.rule}`,
          background: t.paper, padding: 20,
          overflow: 'auto',
        }}
      >
        <div style={{ color: t.ink3, fontSize: 12 }}>
          Select a place on the map to see its details, or a proposal from the
          sidebar to review and commit it.
        </div>
      </aside>
    );
  }

  // Proposal detail
  if (proposal && !place) {
    return (
      <aside
        style={{
          width: 320, flexShrink: 0,
          borderLeft: `1px solid ${t.rule}`,
          background: t.paper, padding: 20,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Proposal &middot; {proposal.confidence}
        </div>
        <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginTop: 4 }}>
          {proposal.name}
        </div>
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.ink3,
            letterSpacing: 0.14, textTransform: 'uppercase',
            marginTop: 10, marginBottom: 6,
          }}
        >
          Mentions
        </div>
        {proposal.mentions.map((m, i) => (
          <div
            key={i}
            style={{
              padding: 8, marginBottom: 6,
              background: t.paper2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              fontSize: 11, color: t.ink,
            }}
          >
            <div
              style={{
                fontFamily: t.mono, fontSize: 9, color: t.accent,
                letterSpacing: 0.14, textTransform: 'uppercase',
                marginBottom: 3,
              }}
            >
              ch.{m.chapterId} paragraph {m.paragraph}
            </div>
            <div style={{ fontStyle: 'italic' }}>...{m.excerpt}...</div>
          </div>
        ))}
      </aside>
    );
  }

  // Existing place detail
  const chapters = place.chapterIds || place.ch || [];
  const first = chapters.length ? Math.min(...chapters.map(Number).filter(Number.isFinite)) : null;
  const last = chapters.length ? Math.max(...chapters.map(Number).filter(Number.isFinite)) : null;
  const mentions = place.mentions || chapters.length;

  const describe = () => {
    dispatchWeaver({
      mode: 'single',
      text: `Describe the approach to ${place.name} (${place.kind || 'place'}) in one paragraph of prose, in the author's voice.`,
      autoRun: true,
    });
    toastService.info?.('Canon Weaver queued a prose description.');
    onNavigate?.('write');
  };

  const toWeaver = () => {
    dispatchWeaver({
      mode: 'single',
      text: `Propose an edit pass centred on the place "${place.name}" (kind: ${place.kind || 'place'}). Consider cross-chapter continuity, mentions, and any thread that passes through.`,
      autoRun: true,
    });
    toastService.info?.('Canon Weaver queued a place-centred pass.');
    onNavigate?.('write');
  };

  const openMentions = () => {
    if (first) {
      onNavigate?.('write');
    } else {
      toastService.info?.('No chapter references for this place yet.');
    }
  };

  return (
    <aside
      style={{
        width: 320, flexShrink: 0,
        borderLeft: `1px solid ${t.rule}`,
        background: t.paper, padding: 20,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10,
          color: kindColor(place.kind),
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}
      >
        {place.kind || 'place'}
      </div>
      <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginTop: 4 }}>
        {place.name}
      </div>
      {place.note && (
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.65, marginTop: 8, fontStyle: 'italic' }}>
          {place.note}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
        <StatCard k="Chapters" v={chapters.length ? chapters.join(', ') : '-'} />
        <StatCard k="Mentions" v={mentions || '-'} />
        <StatCard k="First appears" v={first ? `ch.${first}` : '-'} />
        <StatCard k="Most recent" v={last ? `ch.${last}` : '-'} />
      </div>

      <div
        style={{
          marginTop: 14,
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Quick actions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={() => onOpenFloorplan?.(place)}
          style={{
            padding: '8px 11px', textAlign: 'left',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: t.accent, color: t.onAccent,
            border: 'none', borderRadius: t.radius,
            fontFamily: t.display, fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <MapPin size={12} /> Generate floorplan
        </button>
        <button
          type="button"
          onClick={describe}
          style={{
            padding: '8px 11px', textAlign: 'left',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.display, fontSize: 12, cursor: 'pointer',
          }}
        >
          <Navigation size={11} /> Describe the approach in prose
        </button>
        <button
          type="button"
          onClick={openMentions}
          style={{
            padding: '8px 11px', textAlign: 'left',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.display, fontSize: 12, cursor: 'pointer',
          }}
        >
          <FileText size={11} /> See all mentions
        </button>
        <button
          type="button"
          onClick={toWeaver}
          style={{
            padding: '8px 11px', textAlign: 'left',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.display, fontSize: 12, cursor: 'pointer',
          }}
        >
          <Wand2 size={11} /> To Canon Weaver
        </button>
      </div>
    </aside>
  );
}
