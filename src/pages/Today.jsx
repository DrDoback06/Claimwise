/**
 * Today — the Loomwright home dashboard.
 *
 * Layout (per redesign doc 00):
 *   Resume card (active book/chapter, daily goal ring, CTA)
 *   3-card AI Noticings brief ("what the Loom saw") with deep-links
 *   Two-up: Morning Brief  +  Daily Spark
 *   Ritual-aware quick actions tuned to the time of day
 */

import React from 'react';
import { PenTool, Users, Compass, BookMarked, GitBranch, Wand2 } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import MorningBrief from '../loomwright/daily/MorningBrief';
import DailySpark from '../loomwright/daily/DailySpark';
import { Page, PageHeader, PageBody } from './_shared/PageChrome';
import ResumeCard from './today/ResumeCard';
import AINoticingsBrief from './today/AINoticingsBrief';
import { dispatchWeaver } from '../loomwright/weaver/weaverAI';

function QuickAction({ icon: Icon, label, sublabel, onClick }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        color: t.ink,
        cursor: 'pointer',
        fontFamily: t.font,
        textAlign: 'left',
        minWidth: 220,
        transition: 'border-color 120ms, background 120ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.rule; }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: t.radius,
          background: t.accentSoft, color: t.accent,
          display: 'grid', placeItems: 'center',
          border: `1px solid ${t.rule}`,
        }}
      >
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{label}</div>
        <div style={{ fontSize: 11, color: t.ink2, marginTop: 2 }}>{sublabel}</div>
      </div>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function ritualActions(onNavigate) {
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun 6=Sat
  const weekend = day === 0 || day === 6;
  // Morning: open yesterday's chapter. Evening: idea capture on mobile.
  // Weekend: world building.
  if (h < 11) {
    return [{
      icon: PenTool, label: 'Pick up where you left off',
      sublabel: 'Jump straight back into yesterday\'s chapter',
      onClick: () => onNavigate?.('write'),
    }];
  }
  if (h >= 20) {
    return [{
      icon: Wand2, label: 'Capture an idea for Canon Weaver',
      sublabel: 'Drop a thought; it routes across your canon overnight.',
      onClick: () => { dispatchWeaver({ mode: 'single' }); onNavigate?.('write'); },
    }];
  }
  if (weekend) {
    return [{
      icon: BookMarked, label: 'Weekend world-building',
      sublabel: 'Open the World workspace \u2014 new lore + continuity sweep.',
      onClick: () => onNavigate?.('world'),
    }];
  }
  return [];
}

export default function TodayPage({ worldState, onNavigate, onNavigateToCharacter }) {
  const t = useTheme();
  const title = worldState?.meta?.title || 'your story';

  const handleNoticingAction = (action, payload) => {
    if (action === 'cast_detail' && payload?.characterId) {
      onNavigateToCharacter?.(payload.characterId);
      return;
    }
    onNavigate?.(action);
  };

  const ritual = ritualActions(onNavigate);

  return (
    <Page>
      <PageHeader
        eyebrow="Today"
        title={`${greeting()}.`}
        subtitle={`Here's what's new in ${title}.`}
      />
      <PageBody>
        <div style={{ display: 'grid', gap: 14 }}>
          <ResumeCard worldState={worldState} onNavigate={onNavigate} />

          <AINoticingsBrief worldState={worldState} onNavigate={handleNoticingAction} />

          {ritual.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 10,
              }}
            >
              {ritual.map((a, i) => (
                <QuickAction
                  key={i}
                  icon={a.icon}
                  label={a.label}
                  sublabel={a.sublabel}
                  onClick={a.onClick}
                />
              ))}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            <QuickAction
              icon={PenTool}
              label="Writer's Room"
              sublabel="Editor + Canon Weaver rail + story analysis strip"
              onClick={() => onNavigate?.('write')}
            />
            <QuickAction
              icon={Users}
              label="Cast"
              sublabel="Characters, arcs, relationships, journey"
              onClick={() => onNavigate?.('cast')}
            />
            <QuickAction
              icon={Compass}
              label="Atlas"
              sublabel="Globe, custom maps, pins, travel"
              onClick={() => onNavigate?.('atlas')}
            />
            <QuickAction
              icon={BookMarked}
              label="World"
              sublabel="Wiki, factions, provenance, lore audit"
              onClick={() => onNavigate?.('world')}
            />
            <QuickAction
              icon={GitBranch}
              label="Plot Lab"
              sublabel="Threads, beats, consistency, timeline"
              onClick={() => onNavigate?.('plot_timeline')}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 16,
              alignItems: 'start',
            }}
          >
            <section>
              <SectionLabel eyebrow="Briefing" title="Morning brief" />
              <div
                style={{
                  background: t.paper,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  overflow: 'hidden',
                }}
              >
                <MorningBrief scoped worldState={worldState} />
              </div>
            </section>
            <section>
              <SectionLabel eyebrow="Sparks" title="Daily spark" />
              <div
                style={{
                  background: t.paper,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  overflow: 'hidden',
                }}
              >
                <DailySpark scoped worldState={worldState} />
              </div>
            </section>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}

function SectionLabel({ eyebrow, title }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontFamily: t.mono, fontSize: 9, color: t.accent,
          letterSpacing: 0.2, textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink, marginTop: 2 }}>
        {title}
      </div>
    </div>
  );
}
