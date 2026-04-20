/**
 * SkillsLibrary — skills and skill tree in one tabbed surface.
 *
 * Two sub-views:
 *   1. Bank — flat list of skills (read-only summary for now; CRUD still
 *      happens inline via WritingCanvasPro / CharacterDetail > Skills).
 *   2. Tree — SkillTreeSystem visual.
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import SkillTreeSystem from '../components/SkillTreeSystem';

const TABS = [
  { id: 'bank', label: 'Skill bank' },
  { id: 'tree', label: 'Skill tree' },
];

function SkillBankGrid({ skills }) {
  const t = useTheme();
  if (!skills.length) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
          color: t.ink2,
          fontSize: 12,
          border: `1px dashed ${t.rule}`,
          borderRadius: t.radius,
          background: t.paper,
        }}
      >
        No skills yet.
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 10,
      }}
    >
      {skills.map((s) => (
        <div
          key={s.id}
          style={{
            padding: 12,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink,
          }}
        >
          <div style={{ fontFamily: t.display, fontSize: 14, fontWeight: 500, color: t.ink }}>
            {s.name}
          </div>
          {s.desc && (
            <div style={{ fontSize: 11, color: t.ink2, marginTop: 4, lineHeight: 1.4 }}>
              {s.desc}
            </div>
          )}
          {s.type && (
            <div
              style={{
                marginTop: 8,
                fontFamily: t.mono,
                fontSize: 9,
                color: t.accent,
                letterSpacing: 0.14,
                textTransform: 'uppercase',
              }}
            >
              {s.type}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SkillsLibraryPage({ worldState, setWorldState }) {
  const t = useTheme();
  const [tab, setTab] = useState('bank');
  const skills = worldState?.skillBank || [];
  const actors = worldState?.actors || [];

  return (
    <Page>
      <PageHeader
        eyebrow="Track"
        title="Skills Library"
        subtitle={`${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`}
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'tree' ? 0 : 28}>
        {tab === 'bank' && <SkillBankGrid skills={skills} />}
        {tab === 'tree' && (
          <SkillTreeSystem
            skills={skills}
            actors={actors}
            onClose={() => {}}
            onUpdateSkills={(next) => {
              if (!setWorldState) return;
              setWorldState((prev) => ({ ...prev, skillBank: next }));
            }}
          />
        )}
      </PageBody>
    </Page>
  );
}
