/**
 * GenerateView - describe-a-place flow.
 *
 * Matches doc 13 Generate tab: freeform description + kind chips +
 * constraint preview (what we tell the AI about the world) + a Draft
 * proposal action that dispatches to Canon Weaver. The returned proposal
 * lands in the Atlas proposals layer on the Region view.
 */

import React, { useMemo, useState } from 'react';
import { Wand2, ChevronRight } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { dispatchWeaver } from '../../loomwright/weaver/weaverAI';
import toastService from '../../services/toastService';
import { KIND_OPTIONS, kindColor } from './kindColors';

const GENERATION_KINDS = [
  { id: 'place',     label: 'Place',     hint: 'A single named location' },
  { id: 'city',      label: 'City',      hint: 'A city with districts' },
  { id: 'village',   label: 'Village',   hint: 'Small settlement' },
  { id: 'castle',    label: 'Castle',    hint: 'Fortified seat' },
  { id: 'region',    label: 'Region',    hint: 'An area with places' },
  { id: 'floorplan', label: 'Floorplan', hint: 'Vector room layout' },
  { id: 'battlefield', label: 'Battlefield', hint: 'Scene geometry' },
];

function buildConstraintPreview(worldState) {
  const places = worldState?.places || [];
  const factions = worldState?.factions || [];
  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});
  const chapterCount = books.reduce((n, b) => n + (b.chapters?.length || 0), 0);
  const lines = [];
  if (places.length) {
    const kinds = {};
    places.forEach((p) => { kinds[p.kind || 'place'] = (kinds[p.kind || 'place'] || 0) + 1; });
    lines.push(`Atlas: ${places.length} places (${Object.entries(kinds).map(([k, v]) => `${v} ${k}`).join(', ')}).`);
  } else {
    lines.push('Atlas: empty.');
  }
  if (factions.length) lines.push(`Factions: ${factions.length}.`);
  if (actors.length) lines.push(`Cast: ${actors.length} actors${actors.length > 3 ? ` (lead: ${actors.filter((a) => a.role === 'lead').map((a) => a.name).slice(0, 3).join(', ') || 'unclassified'}).` : '.'}`);
  if (books.length) lines.push(`Canon: ${books.length} book${books.length === 1 ? '' : 's'}, ${chapterCount} chapters.`);
  return lines;
}

export default function GenerateView({ worldState, onNavigate, onReturnToRegion }) {
  const t = useTheme();
  const [text, setText] = useState('');
  const [kind, setKind] = useState('place');
  const [sending, setSending] = useState(false);

  const constraints = useMemo(() => buildConstraintPreview(worldState), [worldState]);

  const send = async () => {
    if (!text.trim()) {
      toastService.warn?.('Describe a place first.');
      return;
    }
    setSending(true);
    const prompt = [
      `Propose a new atlas entry.`,
      `Requested kind: ${kind}.`,
      `Description: ${text.trim()}`,
      ``,
      `Constraints from the current atlas:`,
      ...constraints.map((c) => `- ${c}`),
      ``,
      `Return it as an atlas proposal: { name, kind, note, suggestedChapterIds, geometry?, roads? }. For floorplan/battlefield add a rooms array of { name, w, h, note }.`,
    ].join('\n');
    dispatchWeaver({
      mode: 'single',
      text: prompt,
      autoRun: true,
      entity: { kind: 'atlas', requestedKind: kind },
    });
    toastService.info?.('Canon Weaver is drafting the place. Check the review board.');
    setSending(false);
    onNavigate?.('write');
  };

  return (
    <div
      style={{
        flex: 1,
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: t.bg,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          padding: 22,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Generate a place from prose
        </div>
        <div
          style={{
            fontFamily: t.display, fontSize: 22, color: t.ink,
            marginTop: 4, marginBottom: 14,
          }}
        >
          Describe what you want on the map
        </div>

        <div
          style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12,
          }}
        >
          {GENERATION_KINDS.map((k) => {
            const on = kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                title={k.hint}
                style={{
                  padding: '5px 10px',
                  background: on ? t.accent : 'transparent',
                  color: on ? t.onAccent : t.ink2,
                  border: `1px solid ${on ? t.accent : t.rule}`,
                  borderRadius: 999,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {k.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. A grey shrine on the salt shore, windblown, abandoned after the burning; the villagers still leave offerings."
          style={{
            width: '100%',
            minHeight: 140,
            padding: 14,
            background: t.bg,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink,
            fontFamily: t.font,
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
          }}
        />

        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: t.bg,
            border: `1px dashed ${t.rule}`,
            borderRadius: t.radius,
            fontSize: 12, color: t.ink2, lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.ink3,
              letterSpacing: 0.14, textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Constraints read from the atlas
          </div>
          {constraints.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <ChevronRight size={11} color={t.accent} style={{ marginTop: 3, flexShrink: 0 }} />
              <span>{c}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 11,
              letterSpacing: 0.14, textTransform: 'uppercase', cursor: sending ? 'wait' : 'pointer',
            }}
          >
            <Wand2 size={12} /> {sending ? 'Drafting...' : 'Draft via Canon Weaver'}
          </button>
          <button
            type="button"
            onClick={onReturnToRegion}
            style={{
              padding: '8px 14px',
              background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 11,
              letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Back to region
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${t.rule}`,
            fontSize: 12, color: t.ink3, lineHeight: 1.6,
          }}
        >
          <strong style={{ color: t.ink }}>What happens next.</strong>{' '}
          Canon Weaver drafts a proposal + any implied cross-system edits
          (new chapter references, faction ties, inventory links). You review
          in the Weaver review board; accepted proposals appear as pins on
          the Region tab with the <span style={{ color: kindColor(kind) }}>{kind}</span>{' '}
          kind. Floorplans also flow into the Floorplan tab once the place
          exists.
        </div>
      </div>
    </div>
  );
}

export { KIND_OPTIONS };
