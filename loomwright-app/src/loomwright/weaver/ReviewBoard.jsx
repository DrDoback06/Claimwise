/**
 * ReviewBoard - a lanes-first view of Canon Weaver proposals.
 *
 * Groups the current review-stage edits by system (Cast / Items / Chapter /
 * Plot / World / Atlas) and lays them out as columns. Each lane has a
 * header count + a batch accept/reject so the writer can sweep through a
 * wide proposal in one pass. Clicking a card edits its decision.
 *
 * Designed to be mounted from the CanonWeaver rail header as a modal, OR
 * as a standalone page. Pure presentational - the decisions map + the
 * apply callback are owned by the CanonWeaver parent.
 */

import React, { useMemo } from 'react';
import { useTheme } from '../theme';
import { Check, X } from 'lucide-react';
import { SYSTEM_COLORS } from './weaverAI';

function laneLabel(system) {
  return String(system || 'Other');
}

function EditCard({ edit, decision, onSet, t }) {
  const color = SYSTEM_COLORS[edit.system] || t.ink2;
  return (
    <div
      style={{
        padding: 10,
        background: t.bg,
        border: `1px solid ${t.rule}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: t.radius,
        marginBottom: 8,
        opacity: decision === 'reject' ? 0.6 : 1,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 9, color,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}
      >
        {edit.action}
      </div>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, marginTop: 2 }}>
        {edit.title || edit.target}
      </div>
      {edit.target && edit.title && edit.target !== edit.title && (
        <div style={{ fontSize: 11, color: t.ink3, marginTop: 2 }}>{edit.target}</div>
      )}
      {edit.reasoning && (
        <div style={{ fontSize: 11, color: t.ink2, marginTop: 6, lineHeight: 1.5 }}>
          {edit.reasoning.slice(0, 180)}{edit.reasoning.length > 180 ? '\u2026' : ''}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => onSet(edit.id, 'accept')}
          style={{
            flex: 1,
            padding: '3px 6px',
            background: decision === 'accept' ? t.accent : 'transparent',
            color: decision === 'accept' ? t.onAccent : t.ink2,
            border: `1px solid ${decision === 'accept' ? t.accent : t.rule}`,
            borderRadius: 2,
            fontFamily: t.mono, fontSize: 9,
            letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          <Check size={9} /> Accept
        </button>
        <button
          type="button"
          onClick={() => onSet(edit.id, 'reject')}
          style={{
            flex: 1,
            padding: '3px 6px',
            background: decision === 'reject' ? t.bad : 'transparent',
            color: decision === 'reject' ? t.paper : t.ink2,
            border: `1px solid ${decision === 'reject' ? t.bad : t.rule}`,
            borderRadius: 2,
            fontFamily: t.mono, fontSize: 9,
            letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          <X size={9} /> Reject
        </button>
      </div>
    </div>
  );
}

export default function ReviewBoard({
  edits = [],
  decisions = {},
  onSetDecision,
  onBatchDecide,
  onApply,
  onCancel,
}) {
  const t = useTheme();

  const lanes = useMemo(() => {
    const map = new Map();
    edits.forEach((e) => {
      const k = laneLabel(e.system);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [edits]);

  const acceptedCount = edits.filter((e) => (decisions[e.id] || 'accept') === 'accept').length;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${t.rule}`,
          background: t.sidebar,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.18, textTransform: 'uppercase',
          }}
        >
          Review board &middot; {edits.length} proposals across {lanes.length} systems
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '5px 10px',
            background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10,
            letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={acceptedCount === 0}
          style={{
            padding: '6px 14px',
            background: acceptedCount > 0 ? t.accent : t.paper2,
            color: acceptedCount > 0 ? t.onAccent : t.ink3,
            border: `1px solid ${acceptedCount > 0 ? t.accent : t.rule}`, borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10,
            letterSpacing: 0.14, textTransform: 'uppercase',
            cursor: acceptedCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Apply {acceptedCount} accepted
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          padding: 14,
          gap: 12,
        }}
      >
        {lanes.map(([lane, laneEdits]) => {
          const color = SYSTEM_COLORS[lane] || t.accent;
          const accepted = laneEdits.filter((e) => (decisions[e.id] || 'accept') === 'accept').length;
          return (
            <div
              key={lane}
              style={{
                width: 300, flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: `1px solid ${t.rule}`,
                  borderTop: `3px solid ${color}`,
                  background: t.sidebar,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: t.mono, fontSize: 10, color,
                    letterSpacing: 0.14, textTransform: 'uppercase',
                    flex: 1,
                  }}
                >
                  {lane} &middot; {laneEdits.length}
                </div>
                <button
                  type="button"
                  onClick={() => laneEdits.forEach((e) => onBatchDecide?.(e.id, 'accept'))}
                  title="Accept all in lane"
                  style={{
                    padding: '2px 6px',
                    background: 'transparent', color: t.good,
                    border: `1px solid ${t.rule}`, borderRadius: 2,
                    fontFamily: t.mono, fontSize: 9,
                    letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => laneEdits.forEach((e) => onBatchDecide?.(e.id, 'reject'))}
                  title="Reject all in lane"
                  style={{
                    padding: '2px 6px',
                    background: 'transparent', color: t.bad,
                    border: `1px solid ${t.rule}`, borderRadius: 2,
                    fontFamily: t.mono, fontSize: 9,
                    letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  None
                </button>
              </div>
              <div style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
                {laneEdits.map((e) => (
                  <EditCard
                    key={e.id}
                    edit={e}
                    decision={decisions[e.id] || 'accept'}
                    onSet={onSetDecision}
                    t={t}
                  />
                ))}
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderTop: `1px solid ${t.rule}`,
                  fontFamily: t.mono, fontSize: 9, color: t.ink3,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                }}
              >
                {accepted} / {laneEdits.length} accepted
              </div>
            </div>
          );
        })}
        {lanes.length === 0 && (
          <div style={{ padding: 20, color: t.ink3, fontSize: 12 }}>
            No proposals to review.
          </div>
        )}
      </div>
    </div>
  );
}
