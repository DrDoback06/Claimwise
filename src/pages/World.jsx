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
import WorkspaceMiniBrief from './_shared/WorkspaceMiniBrief';
import WikiManager from '../components/WikiManager';
import WorldLoreTab from '../components/WorldLoreTab';
import StoryMindMap from '../components/StoryMindMap';
import ConsistencyChecker from '../components/ConsistencyChecker';
import toastService from '../services/toastService';
import { runSweep } from '../loomwright/weaver/weaverAI';

// ProvenancePane was deleted from World in the consolidation pass - it now
// lives on the Items Library page where item chains belong. Audit is now a
// real in-line ConsistencyChecker (the old CTA-wrapper only queued a sweep).
const TABS = [
  { id: 'wiki',       label: 'Wiki'        },
  { id: 'factions',   label: 'Factions'    },
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

// ProvenancePane now lives at `pages/items/ProvenancePane.jsx` - Items
// Library is the right home for an item-chain-of-custody view.

function AuditHeader({ onNavigate }) {
  const t = useTheme();
  const sweep = () => runSweep({ scope: 'world', onNavigate, toast: toastService });
  return (
    <div
      style={{
        padding: 14,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 4,
          }}
        >
          Lore consistency auditor
        </div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.55 }}>
          The live checker below scans your canon for drift. For a deeper AI-assisted
          pass run a Canon Weaver continuity sweep &mdash; it proposes one-click
          reconciles without committing anything automatically.
        </div>
      </div>
      <button
        type="button"
        onClick={sweep}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: t.accent, color: t.onAccent,
          border: `1px solid ${t.accent}`, borderRadius: t.radius,
          fontFamily: t.mono, fontSize: 10,
          letterSpacing: 0.14, textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <Wand2 size={11} /> Run sweep
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
        miniBrief={<WorkspaceMiniBrief surface="world" worldState={worldState} />}
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
          <div style={{ display: 'grid', gap: 14 }}>
            <AuditHeader onNavigate={onNavigate} />
            <ConsistencyChecker
              actors={actors}
              books={worldState?.books || {}}
              itemBank={items}
              skillBank={skills}
              onClose={() => {}}
            />
          </div>
        )}
      </PageBody>
    </Page>
  );
}
