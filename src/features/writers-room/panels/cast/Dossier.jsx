// Loomwright — Cast dossier (CODE-INSIGHT §2 / artboard 02-dossier).
//
// Replaces the old horizontal tab scroller with vertical collapsible sections.
// Order: Stats · Skills · Inventory · Threads · Relationships · Traits & Voice ·
// Knows·Hides·Fears · Arc.
//
// Default: Stats / Inventory / Threads OPEN, rest collapsed.
// Open state persists per-character to ui.dossierOpen[charId].

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { characterById } from '../../store/selectors';
import IdentityTab from './tabs/Identity';
import StatsTab from './tabs/Stats';
import SkillsTab from './tabs/Skills';
import ItemsTab from './tabs/Items';
import RelationshipsTab from './tabs/Relationships';
import VoiceTab from './tabs/Voice';
import ArcsTab from './tabs/Arcs';
import AppearancesTab from './tabs/Appearances';
import KnowsTab from './tabs/Knows';

// Each section maps to an existing tab component as its body.
// `count` returns a number for the badge; `desc` is a one-line subtitle.
const SECTIONS = [
  {
    id: 'identity', label: 'Identity', cmp: IdentityTab,
    desc: 'Aliases · pronouns · bio',
    count: c => [c.aliases?.length, c.traits?.length].filter(Boolean).reduce((a, b) => a + b, 0) || null,
  },
  {
    id: 'stats', label: 'Stats', cmp: StatsTab,
    desc: 'Core attributes',
    count: c => Object.keys(c.stats || {}).length || 6,
  },
  {
    id: 'skills', label: 'Skills', cmp: SkillsTab,
    desc: 'Trained abilities',
    count: c => (c.skills || []).length,
  },
  {
    id: 'items', label: 'Inventory', cmp: ItemsTab,
    desc: 'Carried & equipped',
    count: c => (c.inventory || []).length,
  },
  {
    id: 'threads', label: 'Threads', cmp: ThreadsSection,
    desc: 'Filtered to this character',
    count: (c, store) => (store.threads || []).filter(t => (t.characters || []).includes(c.id)).length,
  },
  {
    id: 'rels', label: 'Relationships', cmp: RelationshipsTab,
    desc: 'Connections',
    count: c => (c.relationships || []).length,
  },
  {
    id: 'voice', label: 'Traits & Voice', cmp: VoiceTab,
    desc: 'Speech & tics',
    count: c => (c.voice?.tics || []).length + (c.traits || []).length,
  },
  {
    id: 'knows', label: 'Knows · Hides · Fears', cmp: KnowsTab,
    desc: 'Timeline-aware ledger',
    count: c => (c.knows?.length || 0) + (c.hides?.length || 0) + (c.fears?.length || 0),
  },
  {
    id: 'arcs', label: 'Arc', cmp: ArcsTab,
    desc: 'Want · need · lie · truth',
    count: c => (c.arcs || c.arc?.beats || []).length,
  },
  {
    id: 'appears', label: 'Appearances', cmp: AppearancesTab,
    desc: 'Where they show up',
    count: null,
  },
];

const DEFAULT_OPEN = {
  identity: false,
  stats: true,
  skills: false,
  items: true,
  threads: true,
  rels: false,
  voice: false,
  knows: false,
  arcs: false,
  appears: false,
};

function ThreadsSection({ character: c }) {
  // Light reuse — full Threads panel is heavy. Render filtered list inline.
  const t = useTheme();
  const store = useStore();
  const threads = (store.threads || []).filter(th => (th.characters || []).includes(c.id));
  if (threads.length === 0) {
    return (
      <div style={{ padding: '8px 16px', fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic' }}>
        No threads carrying {c.name || 'this character'} yet.
      </div>
    );
  }
  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {threads.map(th => (
        <div key={th.id} style={{
          padding: '8px 12px', background: t.paper2, border: `1px solid ${t.rule}`,
          borderRadius: 2, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: th.color || t.warn }} />
          <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, flex: 1 }}>{th.title || th.name || 'Untitled thread'}</span>
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.12, textTransform: 'uppercase',
          }}>{(th.status || 'active').toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dossier({ charId, onInterview, onWeave }) {
  const t = useTheme();
  const store = useStore();
  const c = characterById(store, charId);

  const persisted = store.ui?.dossierOpen?.[charId];
  const initialOpen = React.useMemo(
    () => ({ ...DEFAULT_OPEN, ...(persisted || {}) }),
    [charId, persisted],
  );
  const [open, setOpen] = React.useState(initialOpen);

  // When charId changes, swap the open state to the persisted (or default) for that character.
  React.useEffect(() => {
    setOpen({ ...DEFAULT_OPEN, ...(store.ui?.dossierOpen?.[charId] || {}) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charId]);

  const toggleSection = (id) => {
    setOpen(prev => {
      const next = { ...prev, [id]: !prev[id] };
      store.setPath(`ui.dossierOpen.${charId}`, next);
      return next;
    });
  };

  if (!c) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: t.ink3 }}>
        Pick a character above, or add a new one.
      </div>
    );
  }

  const updateChar = (patch) => {
    store.setSlice('cast', xs => xs.map(x => x.id === c.id ? { ...x, ...patch, draftedByLoom: false } : x));
  };

  const accent = c.color || t.accent;

  return (
    <div>
      {c.draftedByLoom && (
        <div style={{
          margin: '8px 16px 0', padding: '6px 10px',
          background: PANEL_ACCENT.loom + '22',
          borderLeft: `2px solid ${PANEL_ACCENT.loom}`,
          fontFamily: t.mono, fontSize: 9, color: t.ink2,
          letterSpacing: 0.12, textTransform: 'uppercase',
        }}>Drafted by the Loom — confirm</div>
      )}

      {/* Header */}
      <div style={{
        padding: '16px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: accent, color: t.onAccent,
          display: 'grid', placeItems: 'center',
          fontFamily: t.display, fontWeight: 500, fontSize: 22, flexShrink: 0,
        }}>{(c.name || '?')[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={[c.role, c.age, c.pronouns].filter(Boolean).join(' · ') || c.role || 'support'}
            onChange={e => {
              const parts = e.target.value.split('·').map(s => s.trim()).filter(Boolean);
              updateChar({
                role: parts[0] || 'support',
                age: parts[1] || c.age,
                pronouns: parts[2] || c.pronouns,
              });
            }}
            style={{
              width: '100%', fontFamily: t.mono, fontSize: 9,
              color: accent, letterSpacing: 0.14, textTransform: 'uppercase',
              background: 'transparent', border: 'none', outline: 'none', padding: 0,
            }} />
          <input
            value={c.name || ''}
            onChange={e => updateChar({ name: e.target.value })}
            placeholder="Unnamed"
            style={{
              width: '100%', fontFamily: t.display, fontSize: 24, color: t.ink,
              fontWeight: 500, marginTop: 2, lineHeight: 1.1,
              background: 'transparent', border: 'none', outline: 'none', padding: 0,
            }} />
          <input
            value={c.oneliner || ''}
            onChange={e => updateChar({ oneliner: e.target.value })}
            placeholder="One-line description"
            style={{
              width: '100%', fontSize: 12, color: t.ink2, lineHeight: 1.5,
              fontStyle: 'italic', marginTop: 4,
              background: 'transparent', border: 'none', outline: 'none', padding: 0,
            }} />
        </div>
      </div>

      {/* Action row */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={onInterview} style={{
          padding: '7px 12px', background: accent, color: t.onAccent,
          border: 'none', borderRadius: 1,
          fontFamily: t.display, fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}>Interview</button>
        <button onClick={onWeave} style={{
          padding: '7px 12px', background: 'transparent',
          color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>✦ Weave</button>
        <span style={{ flex: 1 }} />
        <button onClick={() => {
          const allOpen = SECTIONS.reduce((m, s) => ({ ...m, [s.id]: true }), {});
          setOpen(allOpen);
          store.setPath(`ui.dossierOpen.${charId}`, allOpen);
        }} style={{
          padding: '4px 8px', background: 'transparent',
          color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Expand all</button>
        <button onClick={() => {
          const allClosed = SECTIONS.reduce((m, s) => ({ ...m, [s.id]: false }), {});
          setOpen(allClosed);
          store.setPath(`ui.dossierOpen.${charId}`, allClosed);
        }} style={{
          padding: '4px 8px', background: 'transparent',
          color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Collapse all</button>
      </div>

      {/* Sections */}
      <div style={{ padding: '0 0 24px' }}>
        {SECTIONS.map(s => {
          const isOpen = !!open[s.id];
          const Cmp = s.cmp;
          const count = typeof s.count === 'function' ? s.count(c, store) : s.count;
          return (
            <div key={s.id} style={{
              borderTop: `1px solid ${t.rule}`,
              background: isOpen ? t.paper : 'transparent',
            }}>
              <button onClick={() => toggleSection(s.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left',
              }}>
                <span style={{
                  display: 'inline-block', width: 10,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 180ms', color: accent,
                  fontFamily: t.mono, fontSize: 11, lineHeight: 1,
                }}>›</span>
                <span style={{
                  fontFamily: t.display, fontSize: 15, color: t.ink, fontWeight: 500,
                }}>{s.label}</span>
                {count != null && count > 0 && (
                  <span style={{
                    fontFamily: t.mono, fontSize: 9, color: accent,
                    padding: '1px 6px', border: `1px solid ${accent}55`, borderRadius: 2,
                  }}>{String(count).padStart(2, '0')}</span>
                )}
                <span style={{ flex: 1 }} />
                <span style={{
                  fontFamily: t.mono, fontSize: 9, color: t.ink3,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 200,
                }}>{s.desc}</span>
              </button>
              {isOpen && (
                <div style={{ animation: 'lw-tab-fade 200ms ease' }}>
                  <Cmp character={c} update={updateChar} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {c.notes && (
        <div style={{
          padding: '10px 16px 16px', borderTop: `1px solid ${t.rule}`,
          fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5,
        }}>{c.notes}</div>
      )}
    </div>
  );
}
