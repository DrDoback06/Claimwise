/**
 * SkillsLibrary - skills and skill tree in one tabbed surface.
 *
 * Two sub-views:
 *   1. Bank - flat list of skills with manual + AI creation entry points.
 *   2. Tree - SkillTreeSystem visual, also offering the class -> tree AI
 *      generator.
 */

import React, { useState } from 'react';
import { Plus, Wand2 } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import WorkspaceMiniBrief from './_shared/WorkspaceMiniBrief';
import SkillTreeSystem from '../components/SkillTreeSystem';
import NewSkillModal from './skills/NewSkillModal';
import SkillTreeFromClass from './skills/SkillTreeFromClass';

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
        No skills yet. Click &ldquo;New skill&rdquo; to add one manually, or
        &ldquo;Generate tree&rdquo; to have the Loom propose a whole class tree.
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
          {(s.desc || s.description) && (
            <div style={{ fontSize: 11, color: t.ink2, marginTop: 4, lineHeight: 1.4 }}>
              {s.desc || s.description}
            </div>
          )}
          <div
            style={{
              display: 'flex', gap: 6, marginTop: 8,
              fontFamily: t.mono, fontSize: 9, color: t.accent,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}
          >
            {s.branch && <span>{s.branch}</span>}
            {s.tier && <span style={{ color: t.ink3 }}>{s.tier}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkillsLibraryPage({ worldState, setWorldState }) {
  const t = useTheme();
  const [tab, setTab] = useState('bank');
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [showTreeFromClass, setShowTreeFromClass] = useState(false);
  const skills = worldState?.skillBank || [];
  const actors = worldState?.actors || [];

  return (
    <Page>
      <PageHeader
        eyebrow="Track"
        title="Skills Library"
        subtitle={`${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`}
        miniBrief={<WorkspaceMiniBrief surface="skills_library" worldState={worldState} />}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setShowTreeFromClass(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
              }}
              title="Let the Loom build a whole branching tree from a class description"
            >
              <Wand2 size={11} /> Generate tree
            </button>
            <button
              type="button"
              onClick={() => setShowNewSkill(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: t.accent, color: t.onAccent,
                border: `1px solid ${t.accent}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Plus size={11} /> New skill
            </button>
          </div>
        }
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
              setWorldState((prev) => {
                const existing = prev?.skillBank || [];
                const byId = new Map(existing.map((s) => [s.id, s]));
                next.forEach((s) => {
                  if (!byId.has(s.id)) byId.set(s.id, s);
                });
                return { ...prev, skillBank: Array.from(byId.values()) };
              });
            }}
            onUpdateActor={(updated) => {
              if (!setWorldState) return;
              setWorldState((prev) => ({
                ...prev,
                actors: (prev?.actors || []).map((a) => (a.id === updated.id ? updated : a)),
              }));
            }}
          />
        )}
      </PageBody>

      <NewSkillModal
        isOpen={showNewSkill}
        onClose={() => setShowNewSkill(false)}
        worldState={worldState}
        setWorldState={setWorldState}
      />
      <SkillTreeFromClass
        isOpen={showTreeFromClass}
        onClose={() => setShowTreeFromClass(false)}
        worldState={worldState}
        setWorldState={setWorldState}
      />
    </Page>
  );
}
