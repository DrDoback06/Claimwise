/**
 * Cast — character list page.
 *
 * Grid of all characters from worldState.actors. Clicking one opens the
 * character detail page. Includes a search box and a "Create new character"
 * affordance that reuses the legacy actor creator path.
 */

import React, { useMemo, useState } from 'react';
import { Users, Search, Plus } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody } from './_shared/PageChrome';
import NewCharacterModal from './cast/NewCharacterModal';

function ActorTile({ actor, onClick }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 14,
        cursor: 'pointer',
        color: t.ink,
        fontFamily: t.font,
        transition: 'border-color 120ms',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.rule; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: t.radius,
            background: t.accentSoft, color: t.accent,
            display: 'grid', placeItems: 'center',
            border: `1px solid ${t.rule}`,
            fontFamily: t.display, fontWeight: 600,
          }}
        >
          {actor.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {actor.name || 'Unnamed character'}
          </div>
          <div style={{ fontSize: 10, color: t.ink3, fontFamily: t.mono, letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 3 }}>
            {actor.class || actor.role || 'Character'}
          </div>
        </div>
      </div>
      {actor.biography || actor.desc ? (
        <div
          style={{
            fontSize: 12,
            color: t.ink2,
            lineHeight: 1.4,
            maxHeight: 52,
            overflow: 'hidden',
          }}
        >
          {actor.biography || actor.desc}
        </div>
      ) : null}
    </button>
  );
}

export default function CastPage({ worldState, setWorldState, onNavigateToCharacter }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const actors = worldState?.actors || [];
  const filtered = useMemo(() => {
    if (!query.trim()) return actors;
    const q = query.trim().toLowerCase();
    return actors.filter((a) =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.role || '').toLowerCase().includes(q) ||
      (a.class || '').toLowerCase().includes(q) ||
      (a.biography || '').toLowerCase().includes(q)
    );
  }, [actors, query]);

  return (
    <Page>
      <PageHeader
        eyebrow="Track"
        title="Cast"
        subtitle={`${actors.length} ${actors.length === 1 ? 'character' : 'characters'}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px',
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <Search size={12} color={t.ink3} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cast"
                style={{
                  border: 'none', outline: 'none',
                  background: 'transparent', color: t.ink,
                  fontFamily: t.font, fontSize: 12,
                  width: 180,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: t.accent, color: t.onAccent,
                border: `1px solid ${t.accent}`,
                borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.14, textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              title="Create a new character"
            >
              <Plus size={12} /> New character
            </button>
          </div>
        }
      />
      <PageBody>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: t.ink2,
              fontSize: 12,
              border: `1px dashed ${t.rule}`,
              borderRadius: t.radius,
              background: t.paper,
            }}
          >
            <Users size={20} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginBottom: 4 }}>
              No cast yet
            </div>
            <div style={{ marginBottom: 10 }}>
              Run the onboarding wizard to populate characters, add them from the
              Writer&rsquo;s Room as you draft, or create one directly.
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: t.accent, color: t.onAccent,
                border: `1px solid ${t.accent}`,
                borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.14, textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <Plus size={12} /> New character
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map((actor) => (
              <ActorTile
                key={actor.id}
                actor={actor}
                onClick={() => onNavigateToCharacter?.(actor.id)}
              />
            ))}
          </div>
        )}
      </PageBody>

      <NewCharacterModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        worldState={worldState}
        setWorldState={setWorldState}
        onCreated={(actor) => onNavigateToCharacter?.(actor.id)}
      />
    </Page>
  );
}
