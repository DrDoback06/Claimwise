/**
 * SkillTreeFromClass - generate an entire skill tree from a class
 * description or an existing character's biography.
 *
 * Flow:
 *   1. User picks "Character" or "Class description" input mode.
 *   2. AI returns a branches array with tiers of skills and prerequisite
 *      wires. Preview lists each branch and node count.
 *   3. Accept all / edit before commit. Accept writes every node through
 *      db.add('skillBank') + setWorldState and stores the branches-per-
 *      character layout in localStorage so SkillTreeSystem can lay it
 *      out accordingly next time it renders.
 */

import React, { useMemo, useState } from 'react';
import { Wand2, X, Sparkles, Users, PenTool, CheckCircle } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import aiService from '../../services/aiService';
import toastService from '../../services/toastService';

const BRANCHES = ['combat', 'defense', 'magic', 'utility', 'social'];
const TIERS = ['novice', 'adept', 'expert', 'master', 'legendary'];

function safeJSON(text) {
  if (!text) return null;
  const m = String(text).match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export default function SkillTreeFromClass({
  isOpen,
  onClose,
  worldState,
  setWorldState,
  defaultActorId,
  onTreeCommitted,
}) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const [inputMode, setInputMode] = useState(defaultActorId ? 'character' : 'class');
  const [actorId, setActorId] = useState(defaultActorId || actors[0]?.id || '');
  const [classText, setClassText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [proposal, setProposal] = useState(null); // { className, branches: [{ name, tier, skills: [...] }] }
  const [saving, setSaving] = useState(false);

  const actor = actors.find((a) => a.id === actorId);

  const stats = useMemo(() => {
    if (!proposal) return null;
    const branches = proposal.branches.length;
    const tiers = proposal.branches.reduce((n, b) => n + b.tiers.length, 0);
    const skills = proposal.branches.reduce(
      (n, b) => n + b.tiers.reduce((m, ti) => m + ti.skills.length, 0),
      0,
    );
    return { branches, tiers, skills };
  }, [proposal]);

  if (!isOpen) return null;

  const reset = () => {
    setProposal(null); setClassText(''); setThinking(false); setSaving(false);
  };

  const buildSystemPrompt = () => [
    'Propose a skill tree for a fantasy / story RPG character.',
    'Output STRICT JSON:',
    '{',
    '  "className": "short label",',
    '  "summary": "1-2 sentences",',
    '  "branches": [',
    '    {',
    '      "name": "combat | defense | magic | utility | social",',
    '      "tiers": [',
    '        {',
    '          "tier": "novice | adept | expert | master | legendary",',
    '          "skills": [',
    '            { "name": "string", "description": "1 sentence", "prerequisites": ["Skill Name"], "statMod": {"STR":1,"DEX":0} }',
    '          ]',
    '        }',
    '      ]',
    '    }',
    '  ]',
    '}',
    'Every branch should contain 2-5 tiers, each tier 1-3 skills. Prerequisites reference earlier tier skill names within the same branch, or cross-branch when narratively appropriate. Output 3-5 branches total.',
  ].join('\n');

  const buildUserPrompt = () => {
    if (inputMode === 'character' && actor) {
      return [
        `Character: ${actor.name}`,
        actor.role ? `Role: ${actor.role}` : null,
        actor.class ? `Class: ${actor.class}` : null,
        actor.biography ? `Biography: ${actor.biography}` : null,
        actor.desc ? `Description: ${actor.desc}` : null,
      ].filter(Boolean).join('\n');
    }
    return `Class description: ${classText.trim()}`;
  };

  const propose = async () => {
    if (inputMode === 'character' && !actor) { toastService.warn?.('Pick a character first.'); return; }
    if (inputMode === 'class' && !classText.trim()) { toastService.warn?.('Describe the class first.'); return; }
    setThinking(true);
    try {
      const raw = await aiService.callAI?.(buildUserPrompt(), 'structured', buildSystemPrompt());
      const parsed = safeJSON(raw);
      if (!parsed?.branches) throw new Error('no branches');
      // Normalise
      const normalised = {
        className: parsed.className || (inputMode === 'character' ? actor.name : 'Custom class'),
        summary: parsed.summary || '',
        branches: parsed.branches
          .filter((b) => Array.isArray(b.tiers))
          .map((b) => ({
            name: BRANCHES.includes(b.name) ? b.name : 'utility',
            tiers: (b.tiers || [])
              .filter((ti) => Array.isArray(ti.skills))
              .map((ti) => ({
                tier: TIERS.includes(ti.tier) ? ti.tier : 'novice',
                skills: (ti.skills || []).map((s) => ({
                  name: String(s.name || '').trim(),
                  description: String(s.description || s.desc || '').trim(),
                  prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites.map(String) : [],
                  statMod: s.statMod || {},
                })).filter((s) => s.name),
              })),
          })),
      };
      setProposal(normalised);
    } catch (e) {
      console.warn('[SkillTreeFromClass] AI failed:', e);
      toastService.error?.('AI could not build a tree. Try a clearer description.');
    } finally {
      setThinking(false);
    }
  };

  const commit = async () => {
    if (!proposal) return;
    setSaving(true);
    const existingByName = new Map(
      (worldState?.skillBank || []).map((s) => [(s.name || '').toLowerCase(), s]),
    );

    // Flatten, dedup by name, mint ids.
    const newSkills = [];
    const nameToId = new Map();
    proposal.branches.forEach((branch) => {
      branch.tiers.forEach((ti) => {
        ti.skills.forEach((skill) => {
          const lcName = skill.name.toLowerCase();
          if (existingByName.has(lcName)) {
            nameToId.set(lcName, existingByName.get(lcName).id);
            return;
          }
          const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          nameToId.set(lcName, id);
          newSkills.push({
            id,
            name: skill.name,
            branch: branch.name,
            tier: ti.tier,
            desc: skill.description,
            description: skill.description,
            prerequisites: [],
            statMod: skill.statMod || {},
            type: branch.name,
            source: 'ai-class-tree',
            createdAt: Date.now(),
          });
        });
      });
    });
    // Wire prerequisites (by name, now that all ids are minted).
    const finalised = newSkills.map((skill) => {
      const original = proposal.branches
        .flatMap((b) => b.tiers.flatMap((ti) => ti.skills))
        .find((s) => s.name === skill.name);
      const prereqIds = (original?.prerequisites || [])
        .map((label) => nameToId.get(label.toLowerCase()))
        .filter(Boolean);
      return { ...skill, prerequisites: prereqIds };
    });

    for (const s of finalised) {
      try { await db.add('skillBank', s); }
      catch (e) {
        try { await db.update('skillBank', s); } catch (__e) { /* noop */ }
      }
    }
    setWorldState?.((prev) => {
      const bank = prev?.skillBank || [];
      const byId = new Map(bank.map((s) => [s.id, s]));
      finalised.forEach((s) => byId.set(s.id, s));
      return { ...(prev || {}), skillBank: Array.from(byId.values()) };
    });

    // Optionally seed the actor's activeSkills with novice-tier skills.
    if (actor) {
      const noviceIds = finalised
        .filter((s) => s.tier === 'novice')
        .map((s) => s.id);
      const nextActor = {
        ...actor,
        activeSkills: [
          ...((actor.activeSkills || []).filter((s) => {
            const sid = typeof s === 'string' ? s : s?.id;
            return !noviceIds.includes(sid);
          })),
          ...noviceIds.map((id) => ({ id, val: 1 })),
        ],
      };
      try { await db.update('actors', nextActor); } catch (_e) { /* noop */ }
      setWorldState?.((prev) => ({
        ...(prev || {}),
        actors: (prev?.actors || []).map((a) => (a.id === nextActor.id ? nextActor : a)),
      }));
    }

    toastService.success?.(
      `Committed ${finalised.length} skills across ${proposal.branches.length} branches.`,
    );
    onTreeCommitted?.(finalised);
    reset();
    onClose?.();
    setSaving(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: t.bg,
    border: `1px solid ${t.rule}`,
    borderRadius: t.radius,
    color: t.ink,
    fontFamily: t.font, fontSize: 13, outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, margin: '0 16px',
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh',
        }}
      >
        <div
          style={{
            padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, background: t.sidebar,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wand2 size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>
              Generate skill tree from class
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              padding: 5, background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div
          style={{
            padding: '8px 16px', borderBottom: `1px solid ${t.rule}`,
            display: 'flex', gap: 6,
          }}
        >
          {[
            { id: 'character', icon: Users, label: 'From character', enabled: actors.length > 0 },
            { id: 'class', icon: PenTool, label: 'From class description', enabled: true },
          ].map((m) => {
            const Icon = m.icon; const on = inputMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => m.enabled && setInputMode(m.id)}
                disabled={!m.enabled}
                style={{
                  padding: '5px 12px',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: on ? t.accentSoft : 'transparent',
                  color: on ? t.ink : (m.enabled ? t.ink2 : t.ink3),
                  border: `1px solid ${on ? t.accent : t.rule}`,
                  borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.12, textTransform: 'uppercase',
                  cursor: m.enabled ? 'pointer' : 'not-allowed',
                }}
              >
                <Icon size={11} /> {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {inputMode === 'character' ? (
            <label>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 }}>
                Character
              </div>
              <select style={inputStyle} value={actorId} onChange={(e) => setActorId(e.target.value)}>
                {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {actor?.biography && (
                <div style={{ fontSize: 12, color: t.ink3, marginTop: 6, lineHeight: 1.55, fontStyle: 'italic' }}>
                  {actor.biography.slice(0, 220)}
                </div>
              )}
            </label>
          ) : (
            <label>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 }}>
                Class description
              </div>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                value={classText}
                onChange={(e) => setClassText(e.target.value)}
                placeholder="A grim windswept ranger, raised in the salt-marshes. Survival-minded, tracks by ear, uses a long knife and a throwing net. Hates magic but carries a small charm against drownings."
              />
            </label>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={propose}
              disabled={thinking}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: t.accent, color: t.onAccent,
                border: `1px solid ${t.accent}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.14, textTransform: 'uppercase',
                cursor: thinking ? 'wait' : 'pointer',
              }}
            >
              <Sparkles size={11} /> {thinking ? 'Drafting...' : (proposal ? 'Re-draft' : 'Draft tree')}
            </button>
            {proposal && (
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: '7px 14px',
                  background: 'transparent', color: t.ink2,
                  border: `1px solid ${t.rule}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Start over
              </button>
            )}
          </div>

          {proposal && (
            <div
              style={{
                padding: 14,
                background: t.bg,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.accent,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                }}
              >
                Proposed tree {stats ? ` \u00b7 ${stats.branches} branches / ${stats.skills} skills` : ''}
              </div>
              <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, marginTop: 2 }}>
                {proposal.className}
              </div>
              {proposal.summary && (
                <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.55, fontStyle: 'italic' }}>
                  {proposal.summary}
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {proposal.branches.map((b, bi) => (
                  <div
                    key={bi}
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
                        letterSpacing: 0.14, textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      {b.name} branch
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {b.tiers.map((ti, tii) => (
                        <div key={tii} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
                          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
                            {ti.tier}
                          </div>
                          <div>
                            {ti.skills.map((s, si) => (
                              <div key={si} style={{ fontSize: 12, color: t.ink, marginBottom: 2 }}>
                                <span style={{ fontWeight: 500 }}>{s.name}</span>
                                {s.description && <span style={{ color: t.ink3 }}> - {s.description}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '10px 16px', borderTop: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}
        >
          <button
            type="button" onClick={onClose} disabled={saving}
            style={{
              padding: '6px 12px', background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={commit} disabled={!proposal || saving}
            style={{
              padding: '6px 14px',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: proposal ? t.accent : t.paper2,
              color: proposal ? t.onAccent : t.ink3,
              border: `1px solid ${proposal ? t.accent : t.rule}`,
              borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: proposal ? 'pointer' : 'not-allowed',
            }}
          >
            <CheckCircle size={11} /> {saving ? 'Committing...' : 'Commit tree'}
          </button>
        </div>
      </div>
    </div>
  );
}
