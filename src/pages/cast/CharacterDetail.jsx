/**
 * CharacterDetail — the single character detail page.
 *
 * Collapses the old 15+ character/relationship components into internal tabs
 * on one page, all themed under Loomwright. Tabs:
 *   Profile • Arc • Progression • Timeline • Relationships • Voice •
 *   Dialogue • Plot • Wardrobe • Stats • Skills.
 */

import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from '../_shared/PageChrome';

// Legacy character widgets
import EnhancedCharacterCard from '../../components/EnhancedCharacterCard';
import CharacterArcMapper from '../../components/CharacterArcMapper';
import CharacterProgressionView from '../../components/CharacterProgressionView';
import CharacterTimelineView from '../../components/CharacterTimelineView';
import CharacterRelationshipHub from '../../components/CharacterRelationshipHub';
import CharacterRelationshipWeb from '../../components/CharacterRelationshipWeb';
import CharacterDialogueHub from '../../components/CharacterDialogueHub';
import CharacterDialogueAnalysis from '../../components/CharacterDialogueAnalysis';
import CharacterPlotInvolvement from '../../components/CharacterPlotInvolvement';
import CharacterStorylineCards from '../../components/CharacterStorylineCards';
import CallbacksAndMemoriesDisplay from '../../components/CallbacksAndMemoriesDisplay';
import EnhancedInventoryDisplay from '../../components/EnhancedInventoryDisplay';
import StatHistoryTimeline from '../../components/StatHistoryTimeline';

// Loomwright surfaces
import CharacterWardrobe from '../../loomwright/wardrobe/CharacterWardrobe';

const TABS = [
  { id: 'profile',       label: 'Profile' },
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
  onNavigate,
  onNavigateToCharacter,
}) {
  const t = useTheme();
  const [tab, setTab] = useState('profile');

  const actors = worldState?.actors || [];
  const books = worldState?.books || {};
  const itemBank = worldState?.itemBank || [];
  const skillBank = worldState?.skillBank || [];

  const character = useMemo(
    () => actors.find((a) => a.id === selectedCharacterId) || actors[0] || null,
    [actors, selectedCharacterId]
  );

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
            <CharacterStorylineCards character={character} books={books} />
            <CallbacksAndMemoriesDisplay character={character} books={books} />
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
            <CharacterRelationshipHub
              character={character}
              actors={actors}
              books={books}
              onActorSelect={(id) => onNavigateToCharacter?.(id)}
            />
            <CharacterRelationshipWeb
              actor={character}
              actors={actors}
              onActorSelect={(id) => onNavigateToCharacter?.(id)}
            />
          </div>
        );
      case 'voice':
        return <VoicePane character={character} />;
      case 'dialogue':
        return (
          <div style={{ display: 'grid', gap: 12 }}>
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
    </Page>
  );
}
