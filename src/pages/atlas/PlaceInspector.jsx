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

import React, { useEffect, useState } from 'react';
import {
  MapPin, Navigation, FileText, Wand2, Lock, Unlock, Trash2, Copy,
} from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { kindColor, KIND_OPTIONS } from './kindColors';
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
  onPatchPlace,
  onDeletePlace,
  onDuplicatePlace,
  onToggleLock,
}) {
  const t = useTheme();
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [draftName, setDraftName] = useState(place?.name || '');
  const [draftX, setDraftX] = useState(
    typeof place?.x === 'number' ? place.x.toFixed(2) : ''
  );
  const [draftY, setDraftY] = useState(
    typeof place?.y === 'number' ? place.y.toFixed(2) : ''
  );

  // Keep draft inputs in sync as the user switches between pins.
  useEffect(() => {
    setDraftName(place?.name || '');
    setDraftX(typeof place?.x === 'number' ? place.x.toFixed(2) : '');
    setDraftY(typeof place?.y === 'number' ? place.y.toFixed(2) : '');
    setMentionsOpen(false);
  }, [place?.id]);

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

  // Find every chapter that references this place - both by explicit
  // `place.chapterIds` and by scanning chapter scripts for the place name.
  const loadMentions = async () => {
    try {
      const booksArr = Object.values(worldState?.books || {});
      const lowerName = (place.name || '').toLowerCase();
      const hits = [];
      for (const book of booksArr) {
        for (const chapter of (book.chapters || [])) {
          const chapterId = chapter.id;
          const explicit = Array.isArray(place.chapterIds)
            && place.chapterIds.map(Number).includes(Number(chapterId));
          const content = String(chapter.content || chapter.script || '');
          if (!content) {
            if (explicit) hits.push({ bookId: book.id, chapterId, excerpt: '(linked via chapterIds)' });
            continue;
          }
          const idx = content.toLowerCase().indexOf(lowerName);
          if (idx >= 0 || explicit) {
            const start = Math.max(0, idx - 60);
            const end = Math.min(content.length, (idx >= 0 ? idx : 0) + lowerName.length + 60);
            hits.push({
              bookId: book.id,
              chapterId,
              chapterTitle: chapter.title,
              excerpt: idx >= 0 ? content.slice(start, end) : '(no inline match, listed on the pin)',
            });
          }
        }
      }
      setMentions(hits);
    } catch (err) {
      console.warn('[PlaceInspector] loadMentions failed:', err);
      setMentions([]);
    }
  };

  const openMentions = () => {
    if (!mentionsOpen) loadMentions();
    setMentionsOpen((v) => !v);
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
      {/* Kind dropdown: replaces the read-only label so the user can
          re-categorise a pin without leaving the inspector. */}
      <select
        value={place.kind || 'other'}
        onChange={(e) => onPatchPlace?.(place.id, { kind: e.target.value })}
        style={{
          fontFamily: t.mono, fontSize: 10,
          color: kindColor(place.kind),
          letterSpacing: 0.14, textTransform: 'uppercase',
          background: t.paper2,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: '3px 8px',
        }}
      >
        {KIND_OPTIONS.map((k) => (
          <option key={k.id} value={k.id}>{k.id}</option>
        ))}
      </select>

      {/* Inline rename. Commits on blur or Enter; Escape reverts. */}
      <input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onBlur={() => { if (draftName && draftName !== place.name) onPatchPlace?.(place.id, { name: draftName.trim() }); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.currentTarget.blur(); }
          else if (e.key === 'Escape') { setDraftName(place.name || ''); e.currentTarget.blur(); }
        }}
        style={{
          width: '100%',
          marginTop: 4,
          background: 'transparent',
          border: 'none',
          borderBottom: `1px dashed ${t.rule}`,
          color: t.ink,
          fontFamily: t.display, fontSize: 22, fontWeight: 500,
          padding: '2px 0',
          outline: 'none',
        }}
      />

      <textarea
        value={place.note || ''}
        onChange={(e) => onPatchPlace?.(place.id, { note: e.target.value })}
        placeholder="One-line flavour note&hellip;"
        rows={2}
        style={{
          marginTop: 8,
          width: '100%',
          background: t.bg,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 8,
          color: t.ink2,
          fontSize: 13,
          lineHeight: 1.5,
          fontStyle: 'italic',
          resize: 'vertical',
        }}
      />

      {/* Manual coord entry. x/y are percent of the region canvas. */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>X%</span>
          <input
            value={draftX}
            onChange={(e) => setDraftX(e.target.value)}
            onBlur={() => {
              const n = parseFloat(draftX);
              if (Number.isFinite(n)) onPatchPlace?.(place.id, { x: n });
            }}
            style={{
              background: t.paper2, border: `1px solid ${t.rule}`,
              borderRadius: t.radius, padding: '4px 6px', color: t.ink,
              fontFamily: t.mono, fontSize: 11,
            }}
          />
        </label>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Y%</span>
          <input
            value={draftY}
            onChange={(e) => setDraftY(e.target.value)}
            onBlur={() => {
              const n = parseFloat(draftY);
              if (Number.isFinite(n)) onPatchPlace?.(place.id, { y: n });
            }}
            style={{
              background: t.paper2, border: `1px solid ${t.rule}`,
              borderRadius: t.radius, padding: '4px 6px', color: t.ink,
              fontFamily: t.mono, fontSize: 11,
            }}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
        <StatCard k="Chapters" v={chapters.length ? chapters.join(', ') : '-'} />
        <StatCard k="Mentions" v={mentions || '-'} />
        <StatCard k="First appears" v={first ? `ch.${first}` : '-'} />
        <StatCard k="Most recent" v={last ? `ch.${last}` : '-'} />
      </div>

      {/* Management row: lock, duplicate, delete. */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button
          type="button"
          onClick={() => onToggleLock?.(place.id)}
          style={inspectorGhostBtn(t)}
          title={place.locked ? 'Unlock' : 'Lock position'}
        >
          {place.locked ? <Lock size={11} /> : <Unlock size={11} />}
          {place.locked ? 'Unlock' : 'Lock'}
        </button>
        <button
          type="button"
          onClick={() => onDuplicatePlace?.(place.id)}
          style={inspectorGhostBtn(t)}
          title="Duplicate this pin"
        >
          <Copy size={11} /> Duplicate
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete ${place.name}?`)) onDeletePlace?.(place.id);
          }}
          style={{ ...inspectorGhostBtn(t), color: '#d66', borderColor: '#a44' }}
          title="Delete this pin"
        >
          <Trash2 size={11} /> Delete
        </button>
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

      {/* Mentions drawer - scans every chapter in the book for the place
          name and lists snippets. Previous version only navigated to the
          Writer's Room without showing anything. */}
      {mentionsOpen && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: `1px solid ${t.rule}`,
          }}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.14, textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Mentions ({mentions.length})
          </div>
          {mentions.length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 12, fontStyle: 'italic' }}>
              No in-chapter mentions found. Link chapters via the sidebar or weave new prose via the Weaver.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflow: 'auto' }}>
              {mentions.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigate?.('write', { bookId: m.bookId, chapterId: m.chapterId })}
                  style={{
                    padding: 8, textAlign: 'left',
                    background: t.paper2,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    cursor: 'pointer',
                    color: t.ink,
                  }}
                >
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 9, color: t.accent,
                      letterSpacing: 0.14, textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    Ch.{m.chapterId}{m.chapterTitle ? ` \u00b7 ${m.chapterTitle}` : ''}
                  </div>
                  <div style={{ fontSize: 11, fontStyle: 'italic', color: t.ink2, lineHeight: 1.4 }}>
                    &hellip;{m.excerpt}&hellip;
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function inspectorGhostBtn(t) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 9px',
    background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: t.radius,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase',
    cursor: 'pointer',
  };
}
