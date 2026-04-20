/**
 * CharacterDetail — the single character detail page.
 *
 * Collapses the old 15+ character/relationship components into internal tabs
 * on one page, all themed under Loomwright. Tabs:
 *   Profile • Arc • Progression • Timeline • Relationships • Voice •
 *   Dialogue • Plot • Wardrobe • Stats • Skills.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Trash2, Edit3, Quote } from 'lucide-react';
import db from '../../services/database';
import { useTheme } from '../../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from '../_shared/PageChrome';

// Legacy character widgets
import EnhancedCharacterCard from '../../components/EnhancedCharacterCard';
import CharacterArcMapper from '../../components/CharacterArcMapper';
import CharacterProgressionView from '../../components/CharacterProgressionView';
import CharacterTimelineView from '../../components/CharacterTimelineView';
import CharacterRelationshipHub from '../../components/CharacterRelationshipHub';
import CharacterRelationshipWeb from '../../components/CharacterRelationshipWeb';
import RelationshipNetworkGraph from '../../components/RelationshipNetworkGraph';
import CharacterDialogueHub from '../../components/CharacterDialogueHub';
import CharacterDialogueAnalysis from '../../components/CharacterDialogueAnalysis';
import CharacterPlotInvolvement from '../../components/CharacterPlotInvolvement';
import CharacterStorylineCards from '../../components/CharacterStorylineCards';
import CallbacksAndMemoriesDisplay from '../../components/CallbacksAndMemoriesDisplay';
import EnhancedInventoryDisplay from '../../components/EnhancedInventoryDisplay';
import StatHistoryTimeline from '../../components/StatHistoryTimeline';

// Loomwright surfaces
import CharacterWardrobe from '../../loomwright/wardrobe/CharacterWardrobe';
import InventoryOverChapters from './InventoryOverChapters';
import InventoryMatrix from './InventoryMatrix';
import DialogueExtract from './DialogueExtract';
import RelationshipTimeline from './RelationshipTimeline';
import PullFromVaultModal from './PullFromVaultModal';

const TABS = [
  { id: 'profile',       label: 'Profile' },
  { id: 'journey',       label: 'Journey' },
  { id: 'arc',           label: 'Arc' },
  { id: 'progression',   label: 'Progression' },
  { id: 'timeline',      label: 'Timeline' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'voice',         label: 'Voice' },
  { id: 'dialogue',      label: 'Dialogue' },
  { id: 'plot',          label: 'Plot' },
  { id: 'wardrobe',      label: 'Wardrobe' },
  { id: 'stats',         label: 'Stats' },
  { id: 'skills',        label: 'Skills' },
];

const RELATIONSHIP_VIEWS = [
  { id: 'hub',   label: 'Hub'   },
  { id: 'web',   label: 'Web'   },
  { id: 'graph', label: 'Graph' },
];

function BackLink({ onNavigate }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={() => onNavigate?.('cast')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'transparent', border: `1px solid ${t.rule}`,
        color: t.ink2, borderRadius: t.radius,
        padding: '5px 10px',
        fontFamily: t.mono, fontSize: 10,
        letterSpacing: 0.12, textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <ArrowLeft size={12} /> Cast
    </button>
  );
}

function VoicePane({ character }) {
  const t = useTheme();
  const voice = character?.voiceProfile || null;
  return (
    <div style={{ color: t.ink, fontFamily: t.font, fontSize: 12 }}>
      <div
        style={{
          padding: 16,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
        }}
      >
        <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginBottom: 6 }}>
          {character?.name}'s voice
        </div>
        <div style={{ color: t.ink2, marginBottom: 12 }}>
          Voice profiles are tuned globally in the Voice Studio. This tab shows
          the current assignment for this character.
        </div>
        {voice ? (
          <pre
            style={{
              background: t.bg,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              padding: 12,
              color: t.ink2,
              fontFamily: t.mono,
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(voice, null, 2)}
          </pre>
        ) : (
          <div style={{ color: t.ink3, fontStyle: 'italic' }}>
            No voice profile assigned. Open the Voice Studio to create one.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BiographyChaptersPane - shows the per-chapter biography snippets that the
 * chapterApplyService / extraction appended to `actor.biographyChapters[]`.
 * Each entry can be accepted (promoted into the main `biography`), edited
 * inline, or discarded. Keeps the hand-written `biography` separate so auto
 * suggestions never clobber an author-curated bio.
 */
function BiographyChaptersPane({ character }) {
  const t = useTheme();
  const initial = Array.isArray(character?.biographyChapters) ? character.biographyChapters : [];
  const [entries, setEntries] = useState(initial);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState('');
  useEffect(() => {
    setEntries(Array.isArray(character?.biographyChapters) ? character.biographyChapters : []);
  }, [character?.id, character?.biographyChapters]);

  if (entries.length === 0) return null;

  const persist = async (next) => {
    setEntries(next);
    try {
      await db.update('actors', { ...character, biographyChapters: next });
    } catch (err) {
      console.warn('[Bio chapters] persist failed:', err?.message || err);
    }
  };

  const accept = async (entry) => {
    const base = (character.biography || '').trim();
    const merged = base ? `${base}\n\n${entry.text}` : entry.text;
    const next = entries.filter((e) => e.id !== entry.id);
    try {
      await db.update('actors', { ...character, biography: merged, biographyChapters: next });
      setEntries(next);
    } catch (err) { console.warn('[Bio chapters] accept failed:', err?.message || err); }
  };

  const discard = (id) => persist(entries.filter((e) => e.id !== id));

  const saveEdit = async () => {
    const id = editingId;
    if (!id) return;
    const next = entries.map((e) => (e.id === id ? { ...e, text: editedText } : e));
    await persist(next);
    setEditingId(null);
    setEditedText('');
  };

  return (
    <div
      style={{
        padding: 14,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>
          Auto-biography (per chapter)
        </div>
        <div
          style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          {entries.length} pending
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e) => (
          <div
            key={e.id}
            style={{
              padding: 10,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              background: t.bg,
            }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
              }}
            >
              Ch.{e.chapterNumber || e.chapterId || '?'}
              <span style={{ flex: 1 }} />
              {editingId === e.id ? (
                <>
                  <button type="button" onClick={saveEdit} style={pillBtn(t, true)}>Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditedText(''); }} style={pillBtn(t)}>Cancel</button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    title="Edit this auto-generated snippet"
                    onClick={() => { setEditingId(e.id); setEditedText(e.text || ''); }}
                    style={pillBtn(t)}
                  >
                    <Edit3 size={10} /> Edit
                  </button>
                  <button
                    type="button"
                    title="Merge this snippet into the main biography"
                    onClick={() => accept(e)}
                    style={pillBtn(t, true)}
                  >
                    <Check size={10} /> Accept
                  </button>
                  <button
                    type="button"
                    title="Discard"
                    onClick={() => discard(e.id)}
                    style={pillBtn(t)}
                  >
                    <Trash2 size={10} /> Discard
                  </button>
                </>
              )}
            </div>
            {editingId === e.id ? (
              <textarea
                value={editedText}
                onChange={(ev) => setEditedText(ev.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  background: t.paper,
                  color: t.ink,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  padding: 8,
                  fontFamily: t.serif || t.sans,
                  fontSize: 13, lineHeight: 1.5,
                }}
              />
            ) : (
              <div style={{ color: t.ink, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {e.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * QuotedLinesPane - shows lines the chapter-apply pipeline captured for this
 * character as `actor.snapshots[chapterId].quotedLines`. A fast way to see
 * their voice in action without digging through every chapter by hand.
 */
function QuotedLinesPane({ character }) {
  const t = useTheme();
  const lines = useMemo(() => {
    const snaps = character?.snapshots || {};
    const out = [];
    Object.entries(snaps).forEach(([chapterId, snap]) => {
      const qs = Array.isArray(snap?.quotedLines) ? snap.quotedLines : [];
      qs.forEach((text, i) => out.push({ chapterId, text, key: `${chapterId}_${i}` }));
    });
    return out;
  }, [character?.snapshots]);
  if (lines.length === 0) return null;
  return (
    <div
      style={{
        padding: 14,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Quote size={12} style={{ color: t.accent }} />
        <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>
          Quoted lines captured from chapters
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lines.slice(0, 40).map((q) => (
          <div key={q.key} style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.14, textTransform: 'uppercase',
                minWidth: 48,
              }}
            >
              Ch.{q.chapterId}
            </div>
            <div style={{ color: t.ink, fontSize: 13, lineHeight: 1.5, fontStyle: 'italic' }}>
              &ldquo;{q.text}&rdquo;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function pillBtn(t, active = false) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px',
    background: active ? t.accentSoft : 'transparent',
    color: active ? t.ink : t.ink2,
    border: `1px solid ${active ? t.accent : t.rule}`,
    borderRadius: t.radius,
    cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

function SkillsPane({ character, worldState }) {
  const t = useTheme();
  const skills = worldState?.skillBank || [];
  const active = character?.activeSkills || [];
  return (
    <div
      style={{
        padding: 16,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        color: t.ink,
      }}
    >
      <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginBottom: 10 }}>
        Skills
      </div>
      {active.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>No skills assigned yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map((ref) => {
            const s = skills.find((x) => x.id === ref.id);
            return (
              <div
                key={ref.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 10,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  background: t.bg,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s?.name || ref.id}</div>
                  {s?.desc && <div style={{ fontSize: 11, color: t.ink2 }}>{s.desc}</div>}
                </div>
                <div style={{ fontFamily: t.mono, fontSize: 11, color: t.accent }}>
                  Lv {ref.val ?? 1}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CharacterDetailPage({
  worldState,
  setWorldState,
  selectedCharacterId,
  bookTab,
  onNavigate,
  onNavigateToCharacter,
}) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const books = worldState?.books || {};
  const itemBank = worldState?.itemBank || [];
  const skillBank = worldState?.skillBank || [];

  const character = useMemo(
    () => actors.find((a) => a.id === selectedCharacterId) || actors[0] || null,
    [actors, selectedCharacterId]
  );

  // When chapter extraction has dropped things onto the character the
  // "Journey" tab is the most interesting landing view (auto-assigned
  // items show up there). Fall back to Profile when nothing has been
  // auto-populated yet.
  const hasInventory = Array.isArray(character?.inventory) && character.inventory.length > 0;
  const [tab, setTab] = useState(hasInventory ? 'journey' : 'profile');
  const [relView, setRelView] = useState('hub');
  const [showPull, setShowPull] = useState(false);

  if (!character) {
    return (
      <Page>
        <PageHeader eyebrow="Track" title="Character" actions={<BackLink onNavigate={onNavigate} />} />
        <PageBody>
          <div style={{ color: t.ink2 }}>No character selected.</div>
        </PageBody>
      </Page>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case 'profile':
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <EnhancedCharacterCard character={character} worldState={worldState} isSelected />
            <BiographyChaptersPane character={character} />
            <CharacterStorylineCards character={character} books={books} />
            <CallbacksAndMemoriesDisplay character={character} books={books} />
          </div>
        );
      case 'journey':
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            <InventoryOverChapters
              character={character}
              worldState={worldState}
              bookId={bookTab}
            />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
                marginTop: 6,
              }}
            >
              Item matrix {character.name ? `\u00b7 ${character.name}` : ''}
            </div>
            <InventoryMatrix
              worldState={worldState}
              setWorldState={setWorldState}
              filterOwnerId={character.id}
            />
          </div>
        );
      case 'arc':
        return <CharacterArcMapper actors={[character]} books={books} onClose={() => {}} />;
      case 'progression':
        return <CharacterProgressionView character={character} books={books} worldState={worldState} />;
      case 'timeline':
        return <CharacterTimelineView actor={character} books={books} items={itemBank} skills={skillBank} />;
      case 'relationships':
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: 8,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.ink3,
                  letterSpacing: 0.14, textTransform: 'uppercase', marginRight: 6,
                }}
              >
                View
              </div>
              {RELATIONSHIP_VIEWS.map((v) => {
                const on = relView === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setRelView(v.id)}
                    style={{
                      padding: '4px 10px',
                      background: on ? t.accentSoft : 'transparent',
                      color: on ? t.ink : t.ink2,
                      border: `1px solid ${on ? t.accent : t.rule}`,
                      borderRadius: t.radius,
                      cursor: 'pointer',
                      fontFamily: t.mono, fontSize: 10,
                      letterSpacing: 0.12, textTransform: 'uppercase',
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
            {relView === 'hub' && (
              <CharacterRelationshipHub
                character={character}
                actors={actors}
                books={books}
                onActorSelect={(id) => onNavigateToCharacter?.(id)}
              />
            )}
            {relView === 'web' && (
              <CharacterRelationshipWeb
                actor={character}
                actors={actors}
                onActorSelect={(id) => onNavigateToCharacter?.(id)}
              />
            )}
            {relView === 'graph' && (
              <div
                style={{
                  padding: 8,
                  background: t.paper,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                }}
              >
                <RelationshipNetworkGraph
                  relationships={(worldState?.relationships || [])
                    .filter((r) => r.actorA === character.id || r.actorB === character.id)
                    .map((r) => ({
                      id: r.id,
                      from: r.actorA,
                      to: r.actorB,
                      kind: r.kind,
                      strength: r.strength,
                    }))}
                  characters={actors}
                  onNodeClick={(id) => onNavigateToCharacter?.(id)}
                />
              </div>
            )}
            <RelationshipTimeline
              character={character}
              worldState={worldState}
              onNavigateToCharacter={onNavigateToCharacter}
              onNavigate={onNavigate}
            />
          </div>
        );
      case 'voice':
        return <VoicePane character={character} />;
      case 'dialogue':
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <QuotedLinesPane character={character} />
            <DialogueExtract
              character={character}
              worldState={worldState}
              setWorldState={setWorldState}
            />
            <CharacterDialogueHub character={character} books={books} />
            <CharacterDialogueAnalysis actor={character} books={books} />
          </div>
        );
      case 'plot':
        return <CharacterPlotInvolvement character={character} books={books} />;
      case 'wardrobe':
        return (
          <div
            style={{
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              overflow: 'hidden',
            }}
          >
            <CharacterWardrobe
              scoped
              actor={character}
              worldState={worldState}
              onPatchWorldState={(patch) => {
                if (!setWorldState) return;
                setWorldState((prev) => ({ ...prev, ...patch }));
              }}
            />
          </div>
        );
      case 'stats':
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: 10,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.ink3,
                  letterSpacing: 0.14, textTransform: 'uppercase', flex: 1,
                }}
              >
                {(character.inventory || []).length} item{(character.inventory || []).length === 1 ? '' : 's'} in inventory
              </div>
              <button
                type="button"
                onClick={() => setShowPull(true)}
                style={{
                  padding: '5px 10px',
                  background: t.accent, color: t.onAccent,
                  border: `1px solid ${t.accent}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                + Pull from vault
              </button>
            </div>
            <div
              style={{
                padding: 16,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginBottom: 8 }}>
                Base stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {Object.entries(character.baseStats || {}).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: '10px 12px',
                      background: t.bg,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                    }}
                  >
                    <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
                      {k}
                    </div>
                    <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <StatHistoryTimeline actor={character} books={books} statRegistry={worldState?.statRegistry || []} />
            <EnhancedInventoryDisplay actor={character} items={itemBank} books={books} />
          </div>
        );
      case 'skills':
        return <SkillsPane character={character} worldState={worldState} />;
      default:
        return null;
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Track · Cast"
        title={character.name || 'Character'}
        subtitle={character.role || character.class || 'Character'}
        actions={<BackLink onNavigate={onNavigate} />}
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody>{renderTab()}</PageBody>
      <PullFromVaultModal
        isOpen={showPull}
        character={character}
        worldState={worldState}
        setWorldState={setWorldState}
        onClose={() => setShowPull(false)}
      />
    </Page>
  );
}
