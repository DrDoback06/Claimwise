/**
 * World — Explore > World, the "everything that isn't a person, on one page"
 * workspace. Loomwright-unified per redesign doc 00.
 *
 * Tabs (surface-switcher, not nav):
 *   - Wiki:     multi-type entity browser (Characters / Items / Skills / Factions / Places / Lore)
 *   - Factions: first-class faction view with member counts + a simple power diagram
 *   - Provenance: artefact chain-of-custody (origin  owners  current location)
 *   - Mind map: StoryMindMap rich graph
 *   - Audit:    "Lore consistency auditor" — fires a Canon Weaver sweep
 */

import React, { useMemo, useState } from 'react';
import { Search, ShieldAlert, Briefcase, Zap, BookOpen, Globe, Users, MapPin, Wand2 } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import WikiManager from '../components/WikiManager';
import WorldLoreTab from '../components/WorldLoreTab';
import StoryMindMap from '../components/StoryMindMap';
import toastService from '../services/toastService';
import { dispatchWeaver } from '../loomwright/weaver/weaverAI';

const TABS = [
  { id: 'wiki',       label: 'Wiki'        },
  { id: 'factions',   label: 'Factions'    },
  { id: 'provenance', label: 'Provenance'  },
  { id: 'mindmap',    label: 'Mind map'    },
  { id: 'audit',      label: 'Lore audit'  },
];

const WIKI_TYPES = [
  { id: 'characters', label: 'Characters', icon: Users,     source: (w) => w.actors || [],   entityType: 'character' },
  { id: 'items',      label: 'Items',      icon: Briefcase, source: (w) => w.itemBank || [], entityType: 'item' },
  { id: 'skills',     label: 'Skills',     icon: Zap,       source: (w) => w.skillBank || [], entityType: 'skill' },
  { id: 'factions',   label: 'Factions',   icon: ShieldAlert,source: (w) => w.factions || [],  entityType: 'faction' },
  { id: 'places',     label: 'Places',     icon: MapPin,    source: (w) => w.places || [],    entityType: 'place' },
  { id: 'lore',       label: 'Lore',       icon: BookOpen,  source: (w) => (w.wiki || w.loreEntries || []), entityType: 'lore' },
];

/**
 * Build backlink index: entity name → [{ kind: 'chapter'|'actor'|'item', label, bookId, chapterId }]
 * Very cheap substring scan across chapter scripts, summaries, and actor bios.
 * Good enough to show "what references this?" on any wiki entry.
 */
function buildBacklinkIndex(worldState) {
  const books = worldState?.books || {};
  const actors = worldState?.actors || [];
  const items = worldState?.itemBank || [];
  const entries = [];
  Object.values(books).forEach((book) => {
    (book.chapters || []).forEach((c) => {
      const text = `${c.title || ''}\n${c.summary || ''}\n${c.script || ''}`;
      if (text.trim()) {
        entries.push({ kind: 'chapter', bookId: book.id, chapterId: c.id, label: `${book.title || 'Book'} \u00b7 Ch.${c.id}`, text });
      }
    });
  });
  actors.forEach((a) => {
    const text = `${a.name || ''}\n${a.biography || ''}\n${a.desc || ''}`;
    entries.push({ kind: 'actor', label: a.name || 'Actor', actorId: a.id, text });
  });
  items.forEach((i) => {
    const text = `${i.name || ''}\n${i.desc || ''}\n${i.properties || ''}`;
    entries.push({ kind: 'item', label: i.name || 'Item', itemId: i.id, text });
  });
  return entries;
}

function findBacklinks(index, needle) {
  if (!needle) return [];
  const n = String(needle).toLowerCase();
  return index
    .filter((e) => e.text && e.text.toLowerCase().includes(n))
    .slice(0, 20);
}

function EntityBrowser({ worldState, onNavigate }) {
  const t = useTheme();
  const [activeType, setActiveType] = useState('items');
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const current = WIKI_TYPES.find((x) => x.id === activeType) || WIKI_TYPES[1];
  const entities = current.source(worldState) || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e) =>
      (e.name || e.title || '').toLowerCase().includes(q) ||
      (e.desc || e.description || '').toLowerCase().includes(q),
    );
  }, [entities, query]);

  const backlinkIndex = useMemo(() => buildBacklinkIndex(worldState), [worldState]);
  const backlinks = useMemo(
    () => (selectedName ? findBacklinks(backlinkIndex, selectedName) : []),
    [backlinkIndex, selectedName],
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 12 }}>
      <aside
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
            padding: '4px 6px',
          }}
        >
          Entity types
        </div>
        {WIKI_TYPES.map((x) => {
          const Icon = x.icon;
          const on = activeType === x.id;
          const count = x.source(worldState)?.length || 0;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => { setActiveType(x.id); setSelectedName(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px',
                background: on ? t.accentSoft : 'transparent',
                color: on ? t.ink : t.ink2,
                border: `1px solid ${on ? t.accent : 'transparent'}`,
                borderRadius: t.radius,
                cursor: 'pointer',
                fontFamily: t.font, fontSize: 12,
                textAlign: 'left',
              }}
            >
              <Icon size={13} />
              <span style={{ flex: 1 }}>{x.label}</span>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{count}</span>
            </button>
          );
        })}
      </aside>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: 8,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
          }}
        >
          <Search size={13} color={t.ink3} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${current.label.toLowerCase()}`}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: t.ink,
              fontFamily: t.font,
              fontSize: 13,
            }}
          />
        </div>

        {filtered.length === 0 ? (
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
            No {current.label.toLowerCase()} yet.
          </div>
        ) : (
          <WikiManager entities={filtered} entityType={current.entityType} onClose={() => {}} />
        )}

        <div
          style={{
            padding: 10,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
          }}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.accent,
              letterSpacing: 0.16, textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Check backlinks
          </div>
          <input
            type="text"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            placeholder="Type any entity name to see every chapter/actor/item that mentions it"
            style={{
              width: '100%',
              padding: '6px 10px',
              background: t.bg,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              color: t.ink,
              fontFamily: t.font,
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <aside
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 12,
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.16, textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          References
        </div>
        {!selectedName ? (
          <div style={{ color: t.ink3, fontSize: 12 }}>
            Type a name in the panel to see everywhere it&rsquo;s referenced.
          </div>
        ) : backlinks.length === 0 ? (
          <div style={{ color: t.ink3, fontSize: 12 }}>
            No references found for &ldquo;{selectedName}&rdquo;.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {backlinks.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (b.kind === 'chapter') onNavigate?.('write');
                  else if (b.kind === 'actor') onNavigate?.('cast_detail');
                  else if (b.kind === 'item') onNavigate?.('items_library');
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  background: t.bg,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  cursor: 'pointer',
                  color: t.ink,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: t.mono, fontSize: 9, color: t.ink3,
                    letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 2,
                  }}
                >
                  {b.kind}
                </div>
                <div>{b.label}</div>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function FactionsPane({ worldState }) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const factions = worldState?.factions || [];
  // Fallback: derive factions from actors' .faction field if the store is empty.
  const derived = useMemo(() => {
    if (factions.length) return factions;
    const map = new Map();
    actors.forEach((a) => {
      const name = a.faction || a.allegiance;
      if (!name) return;
      if (!map.has(name)) map.set(name, { id: `f_${name}`, name, members: [] });
      map.get(name).members.push(a.id);
    });
    return Array.from(map.values());
  }, [factions, actors]);

  const withCounts = useMemo(() => derived.map((f) => ({
    ...f,
    memberCount: f.members?.length
      || actors.filter((a) => a.faction === f.name || a.allegiance === f.name).length,
  })), [derived, actors]);

  const max = Math.max(1, ...withCounts.map((f) => f.memberCount || 0));

  if (withCounts.length === 0) {
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
        <ShieldAlert size={18} style={{ opacity: 0.5, marginBottom: 6 }} />
        <div>No factions yet. Add a wiki entry of type &ldquo;faction&rdquo; or tag characters with a `faction` / `allegiance` field.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.16, textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Faction power (member count)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {withCounts.map((f) => {
          const pct = (f.memberCount / max) * 100;
          return (
            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 40px', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink }}>{f.name}</div>
              <div
                style={{
                  height: 10,
                  background: t.bg,
                  border: `1px solid ${t.rule}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: t.accent,
                    transition: 'width 200ms ease',
                  }}
                />
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 11, color: t.ink2, textAlign: 'right' }}>
                {f.memberCount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProvenancePane({ worldState }) {
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

function AuditPane({ onNavigate }) {
  const t = useTheme();
  const runSweep = () => {
    dispatchWeaver({ mode: 'sweep', autoRun: true });
    toastService.info?.('Canon Weaver continuity sweep queued. Opening the Writer\'s Room.');
    onNavigate?.('write');
  };
  return (
    <div
      style={{
        padding: 24,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 680,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.18, textTransform: 'uppercase',
        }}
      >
        Lore consistency auditor
      </div>
      <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, lineHeight: 1.25 }}>
        Spot drift before a reader does.
      </div>
      <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.55 }}>
        Runs a Canon Weaver continuity sweep across every chapter, character, and
        world-entry. Flags things like &ldquo;Harrow is 3 days east in ch.4 but 5
        days east in ch.11&rdquo; and proposes one-click reconciles. Nothing is
        changed without your accept.
      </div>
      <button
        type="button"
        onClick={runSweep}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          background: t.accent, color: t.onAccent,
          border: `1px solid ${t.accent}`, borderRadius: t.radius,
          fontFamily: t.mono, fontSize: 11,
          letterSpacing: 0.14, textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <Wand2 size={13} /> Run continuity sweep
      </button>
    </div>
  );
}

export default function WorldPage({ worldState, setWorldState, onNavigate }) {
  const t = useTheme();
  const [tab, setTab] = useState('wiki');

  const actors = worldState?.actors || [];
  const items = worldState?.itemBank || [];
  const skills = worldState?.skillBank || [];
  const books = Object.values(worldState?.books || {});

  return (
    <Page>
      <PageHeader
        eyebrow="Explore"
        title="World"
        subtitle="Everything that isn't a person: wiki, factions, provenance, the mind map and continuity audits."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'mindmap' ? 0 : 28}>
        {tab === 'wiki' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <EntityBrowser worldState={worldState} onNavigate={onNavigate} />
            <WorldLoreTab actors={actors} books={books} />
          </div>
        )}
        {tab === 'factions' && (
          <FactionsPane worldState={worldState} />
        )}
        {tab === 'provenance' && (
          <ProvenancePane worldState={worldState} />
        )}
        {tab === 'mindmap' && (
          <div style={{ height: '100%', minHeight: 540 }}>
            <StoryMindMap
              actors={actors}
              items={items}
              skills={skills}
              books={books}
              onClose={() => {}}
            />
          </div>
        )}
        {tab === 'audit' && (
          <AuditPane onNavigate={onNavigate} />
        )}
      </PageBody>
    </Page>
  );
}
