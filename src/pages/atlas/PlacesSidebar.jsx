/**
 * PlacesSidebar - scrollable list of every place in worldState.places,
 * typed by kind, with mention counts. Clicking selects the place in the
 * RegionView + the PlaceInspector.
 */

import React, { useMemo } from 'react';
import { useTheme } from '../../loomwright/theme';
import { KIND_COLORS, kindColor } from './kindColors';

export default function PlacesSidebar({
  places = [],
  proposals = [],
  selectedId,
  onSelect,
  onSelectProposal,
  showProposals,
  onToggleProposals,
  onAddProposal,
  onMergeProposal,
  onDismissProposal,
}) {
  const t = useTheme();

  const grouped = useMemo(() => {
    const by = new Map();
    places.forEach((p) => {
      const k = (p.kind || 'place').toLowerCase();
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(p);
    });
    return Array.from(by.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [places]);

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: t.sidebar,
        borderRight: `1px solid ${t.rule}`,
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
          padding: '4px 6px',
          marginBottom: 6,
        }}
      >
        Places &middot; {places.length}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {places.length === 0 && (
          <div style={{ color: t.ink3, fontSize: 11, padding: '8px 6px' }}>
            No places yet. Accept proposals below or generate from prose.
          </div>
        )}
        {grouped.map(([kind, list]) => (
          <div key={kind} style={{ marginBottom: 8 }}>
            <div
              style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.14, textTransform: 'uppercase',
                padding: '4px 6px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: kindColor(kind) }} />
              {kind}
              <span style={{ marginLeft: 'auto', color: t.ink3 }}>{list.length}</span>
            </div>
            {list.map((p) => {
              const active = selectedId === p.id;
              const chapterCount = (p.chapterIds || p.ch || []).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect?.(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', textAlign: 'left',
                    padding: '6px 8px', marginBottom: 2,
                    background: active ? t.paper : 'transparent',
                    border: 'none',
                    borderLeft: active ? `2px solid ${kindColor(kind)}` : '2px solid transparent',
                    cursor: 'pointer', color: t.ink,
                  }}
                >
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: kindColor(kind), flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </div>
                    {chapterCount > 0 && (
                      <div
                        style={{
                          fontFamily: t.mono, fontSize: 9, color: t.ink3,
                          letterSpacing: 0.1, textTransform: 'uppercase',
                        }}
                      >
                        {chapterCount} chapter{chapterCount === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.rule}` }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
          <input
            type="checkbox"
            checked={showProposals}
            onChange={(e) => onToggleProposals?.(e.target.checked)}
          />
          <span
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.ink2,
              letterSpacing: 0.12, textTransform: 'uppercase',
            }}
          >
            Show proposals
          </span>
        </label>
        <div
          style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.1, marginTop: 2, textTransform: 'uppercase',
          }}
        >
          {proposals.length} candidate{proposals.length === 1 ? '' : 's'} in prose
        </div>

        {showProposals && proposals.length > 0 && (
          <div style={{ marginTop: 10, maxHeight: 180, overflowY: 'auto' }}>
            {proposals.slice(0, 12).map((pr) => (
              <div
                key={pr.id}
                style={{
                  padding: 8, marginBottom: 6,
                  background: t.paper,
                  border: `1px dashed ${t.accent}`,
                  borderRadius: t.radius,
                  fontSize: 11, color: t.ink,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectProposal?.(pr)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', background: 'transparent', border: 'none',
                    cursor: 'pointer', color: t.ink, padding: 0,
                  }}
                >
                  <span style={{ fontFamily: t.display, fontSize: 12, fontWeight: 500, flex: 1, textAlign: 'left' }}>
                    {pr.name}
                  </span>
                  <span
                    style={{
                      fontFamily: t.mono, fontSize: 8,
                      padding: '1px 5px', border: `1px solid ${t.rule}`,
                      color: t.ink3, borderRadius: 1,
                      letterSpacing: 0.12, textTransform: 'uppercase',
                    }}
                  >
                    {pr.confidence}
                  </span>
                </button>
                <div
                  style={{
                    fontFamily: t.mono, fontSize: 9, color: t.ink3,
                    marginTop: 3, letterSpacing: 0.1, textTransform: 'uppercase',
                  }}
                >
                  {pr.kind} &middot; {pr.mentions.length} mention{pr.mentions.length === 1 ? '' : 's'}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => onAddProposal?.(pr)}
                    style={{
                      padding: '2px 7px', background: t.accent, color: t.onAccent,
                      border: 'none', borderRadius: 1,
                      fontFamily: t.mono, fontSize: 9,
                      letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => onMergeProposal?.(pr)}
                    style={{
                      padding: '2px 7px', background: 'transparent', color: t.ink3,
                      border: `1px solid ${t.rule}`, borderRadius: 1,
                      fontFamily: t.mono, fontSize: 9,
                      letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissProposal?.(pr)}
                    style={{
                      padding: '2px 7px', background: 'transparent', color: t.ink3,
                      border: `1px solid ${t.rule}`, borderRadius: 1,
                      fontFamily: t.mono, fontSize: 9,
                      letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export { KIND_COLORS };
