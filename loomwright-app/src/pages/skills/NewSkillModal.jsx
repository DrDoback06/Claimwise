/**
 * NewSkillModal - manual + AI-assisted skill creation.
 *
 * Two tabs:
 *   - Manual: name / branch / tier / prerequisites / description / maxLevel
 *   - AI: a short prompt -> returns a full skill object the writer can
 *     accept / edit before committing.
 *
 * Commit writes via db.add('skillBank') + setWorldState so every consumer
 * (Skills Library, World > Skills, Skill Tree, Character > Skills) sees
 * the new record immediately.
 */

import React, { useMemo, useState } from 'react';
import { Zap, X, Sparkles, Pencil } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import aiService from '../../services/aiService';
import toastService from '../../services/toastService';

const BRANCHES = ['combat', 'defense', 'magic', 'utility', 'social'];
const TIERS = ['novice', 'adept', 'expert', 'master', 'legendary'];

function field(t, label, children, hint) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.ink3,
          letterSpacing: 0.12, textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: t.ink3, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

function safeJSON(text) {
  if (!text) return null;
  const m = String(text).match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export default function NewSkillModal({ isOpen, onClose, worldState, setWorldState, onCreated }) {
  const t = useTheme();
  const existingSkills = worldState?.skillBank || [];

  const [mode, setMode] = useState('manual'); // 'manual' | 'ai'
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('utility');
  const [tier, setTier] = useState('novice');
  const [desc, setDesc] = useState('');
  const [prereqIds, setPrereqIds] = useState([]);
  const [maxLevel, setMaxLevel] = useState(5);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [saving, setSaving] = useState(false);

  const prereqOptions = useMemo(
    () => existingSkills.map((s) => ({ value: s.id, label: s.name })),
    [existingSkills],
  );

  if (!isOpen) return null;

  const reset = () => {
    setMode('manual');
    setName(''); setBranch('utility'); setTier('novice');
    setDesc(''); setPrereqIds([]); setMaxLevel(5);
    setAiPrompt(''); setAiThinking(false);
  };

  const propose = async () => {
    if (!aiPrompt.trim()) { toastService.warn?.('Describe the skill first.'); return; }
    setAiThinking(true);
    try {
      const prompt = [
        'Propose ONE skill for a fantasy / story-writing RPG system.',
        'Return strict JSON shape: { name, branch, tier, description, prerequisites: [string], maxLevel, statMod: {STR?: n, ...} }.',
        'branch is one of: combat, defense, magic, utility, social.',
        'tier is one of: novice, adept, expert, master, legendary.',
        'prerequisites is an array of skill names that must be learned first (empty array if none).',
        'Keep the description short and evocative (one sentence).',
        '',
        `Skill concept: ${aiPrompt.trim()}`,
      ].join('\n');
      const raw = await aiService.callAI?.(prompt, 'structured', 'Return only valid JSON.');
      const parsed = safeJSON(raw) || {};
      setName(parsed.name || aiPrompt.trim().slice(0, 40));
      setBranch(BRANCHES.includes(parsed.branch) ? parsed.branch : 'utility');
      setTier(TIERS.includes(parsed.tier) ? parsed.tier : 'novice');
      setDesc(parsed.description || '');
      setMaxLevel(Number(parsed.maxLevel) || 5);
      // Match prereqs by name to existing skills if possible.
      const prereqs = Array.isArray(parsed.prerequisites) ? parsed.prerequisites : [];
      const mapped = prereqs
        .map((label) => existingSkills.find((s) => s.name?.toLowerCase() === String(label).toLowerCase()))
        .filter(Boolean)
        .map((s) => s.id);
      setPrereqIds(mapped);
      toastService.success?.('Draft ready. Review and edit, then save.');
      setMode('manual');
    } catch (e) {
      console.warn('[NewSkillModal] AI propose failed:', e);
      toastService.error?.('AI proposal failed. Try the Manual tab instead.');
    } finally {
      setAiThinking(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) { toastService.warn?.('Name is required.'); return; }
    setSaving(true);
    const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const skill = {
      id,
      name: name.trim(),
      branch, tier,
      desc: desc.trim(),
      description: desc.trim(),
      prerequisites: prereqIds,
      maxLevel: Number(maxLevel) || 5,
      type: branch,
      createdAt: Date.now(),
      source: mode === 'ai' ? 'ai-proposed' : 'manual',
    };
    try { await db.add('skillBank', skill); }
    catch (e) { console.warn('[NewSkillModal] db.add failed', e); }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      skillBank: [...(prev?.skillBank || []), skill],
    }));
    toastService.success?.(`Added ${skill.name} to the Skill Bank.`);
    onCreated?.(skill);
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
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh',
        }}
      >
        <div
          style={{
            padding: '12px 16px', borderBottom: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>New skill</div>
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
            { id: 'manual', icon: Pencil, label: 'Manual' },
            { id: 'ai', icon: Sparkles, label: 'AI propose' },
          ].map((m) => {
            const Icon = m.icon; const on = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                style={{
                  padding: '5px 12px',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: on ? t.accentSoft : 'transparent',
                  color: on ? t.ink : t.ink2,
                  border: `1px solid ${on ? t.accent : t.rule}`,
                  borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                <Icon size={11} /> {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 16, overflow: 'auto' }}>
          {mode === 'ai' ? (
            <div>
              {field(t, 'Describe the skill',
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="A defensive skill for a sea-born warrior - something that uses the tide, rhythm, and patience."
                />,
                'AI returns a full draft; you review and edit in the Manual tab before committing.',
              )}
              <button
                type="button"
                onClick={propose}
                disabled={aiThinking || !aiPrompt.trim()}
                style={{
                  padding: '7px 14px',
                  background: t.accent, color: t.onAccent,
                  border: `1px solid ${t.accent}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                  cursor: aiThinking ? 'wait' : 'pointer',
                }}
              >
                {aiThinking ? 'Thinking...' : 'Propose draft'}
              </button>
            </div>
          ) : (
            <div>
              {field(t, 'Name',
                <input type="text" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {field(t, 'Branch',
                  <select style={inputStyle} value={branch} onChange={(e) => setBranch(e.target.value)}>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
                {field(t, 'Tier',
                  <select style={inputStyle} value={tier} onChange={(e) => setTier(e.target.value)}>
                    {TIERS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
                {field(t, 'Max level',
                  <input type="number" min={1} max={99} style={inputStyle} value={maxLevel} onChange={(e) => setMaxLevel(Number(e.target.value))} />
                )}
              </div>
              {field(t, 'Description',
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="One short line that captures what this skill does."
                />
              )}
              {field(t, 'Prerequisites',
                <select
                  multiple
                  style={{ ...inputStyle, minHeight: 72 }}
                  value={prereqIds}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setPrereqIds(opts);
                  }}
                >
                  {prereqOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>,
                'Hold Ctrl / Cmd to select multiple.',
              )}
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
            type="button" onClick={onClose}
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
            type="submit" disabled={saving || !name.trim()}
            style={{
              padding: '6px 14px',
              background: name.trim() ? t.accent : t.paper2,
              color: name.trim() ? t.onAccent : t.ink3,
              border: `1px solid ${name.trim() ? t.accent : t.rule}`,
              borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving...' : 'Add skill'}
          </button>
        </div>
      </form>
    </div>
  );
}
