/**
 * Today — the Loomwright home dashboard.
 *
 * Combines Morning Brief (top) and Daily Spark (below) into a single feed,
 * with quick-action chips into Write / Cast / Atlas.
 */

import React from 'react';
import { PenTool, Users, Compass, BookMarked } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import MorningBrief from '../loomwright/daily/MorningBrief';
import DailySpark from '../loomwright/daily/DailySpark';
import { Page, PageHeader, PageBody } from './_shared/PageChrome';

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

export default function TodayPage({ worldState, onNavigate }) {
  const t = useTheme();
  const title = worldState?.meta?.title || 'your story';

  return (
    <Page>
      <PageHeader
        eyebrow="Today"
        title={`${greeting()}.`}
        subtitle={`Here's what's new in ${title}.`}
      />
      <PageBody>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            marginBottom: 24,
          }}
        >
          <QuickAction
            icon={PenTool}
            label="Continue writing"
            sublabel="Open the Writer's Room"
            onClick={() => onNavigate?.('write')}
          />
          <QuickAction
            icon={Users}
            label="Review the cast"
            sublabel="Characters, arcs and relationships"
            onClick={() => onNavigate?.('cast')}
          />
          <QuickAction
            icon={Compass}
            label="Explore the atlas"
            sublabel="Places, maps and floorplans"
            onClick={() => onNavigate?.('atlas')}
          />
          <QuickAction
            icon={BookMarked}
            label="World & lore"
            sublabel="Wiki entries and factions"
            onClick={() => onNavigate?.('world')}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 20,
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
              <MorningBrief worldState={worldState} />
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
              <DailySpark worldState={worldState} />
            </div>
          </section>
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
          fontFamily: t.mono,
          fontSize: 9,
          color: t.accent,
          letterSpacing: 0.2,
          textTransform: 'uppercase',
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
