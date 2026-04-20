/**
 * NewStatModal - manual + AI stat creation.
 *
 * Stats are small records: { id, key, name, desc, isCore, color }. Commit
 * writes via db.add('statRegistry') + setWorldState so every consumer
 * (Stats Library, Character > Stats, NewCharacterModal's seed stats
 * picker) sees it immediately.
 */

import React, { useState } from 'react';
import { BarChart2, X, Sparkles, Pencil } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import aiService from '../../services/aiService';
import toastService from '../../services/toastService';

const COLORS = ['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'teal', 'pink'];

function safeJSON(text) {
  if (!text) return null;
  const m = String(text).match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

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

export default function NewStatModal({ isOpen, onClose, worldState, setWorldState, onCreated }) {
  const t = useTheme();
  const [mode, setMode] = useState('manual');
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isCore, setIsCore] = useState(false);
  const [color, setColor] = useState('green');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const propose = async () => {
    if (!aiPrompt.trim()) { toastService.warn?.('Describe the stat first.'); return; }
    setAiThinking(true);
    try {
      const prompt = [
        'Propose ONE character stat for a fantasy / story RPG system.',
        'Return strict JSON: { key, name, desc, isCore, color }.',
        '- key: 3-letter uppercase (STR, VIT, INT, DEX, etc)',
        '- name: single short word',
        '- desc: one sentence describing what the stat governs',
        '- isCore: true for core stats (STR/VIT/INT/DEX), false otherwise',
        `- color: one of [${COLORS.join(', ')}]`,
        '',
        `Stat concept: ${aiPrompt.trim()}`,
      ].join('\n');
      const raw = await aiService.callAI?.(prompt, 'structured', 'Return only valid JSON.');
      const parsed = safeJSON(raw) || {};
      setKey((parsed.key || aiPrompt.trim().slice(0, 3)).toUpperCase());
      setName(parsed.name || aiPrompt.trim().slice(0, 24));
      setDesc(parsed.desc || '');
      setIsCore(!!parsed.isCore);
      setColor(COLORS.includes(parsed.color) ? parsed.color : 'green');
      toastService.success?.('Draft ready. Review and save.');
      setMode('manual');
    } catch (e) {
      console.warn('[NewStatModal] AI propose failed:', e);
      toastService.error?.('AI proposal failed. Try the Manual tab.');
    } finally {
      setAiThinking(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!key.trim() || !name.trim()) { toastService.warn?.('Key and name are required.'); return; }
    if ((worldState?.statRegistry || []).some((s) => (s.key || '').toLowerCase() === key.toLowerCase())) {
      toastService.warn?.(`Stat with key "${key}" already exists.`);
      return;
    }
    setSaving(true);
    const id = `st_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const stat = {
      id,
      key: key.trim().toUpperCase(),
      name: name.trim(),
      desc: desc.trim(),
      isCore,
      color,
      createdAt: Date.now(),
      source: mode === 'ai' ? 'ai-proposed' : 'manual',
    };
    try { await db.add('statRegistry', stat); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      statRegistry: [...(prev?.statRegistry || []), stat],
    }));
    toastService.success?.(`Added ${stat.key} / ${stat.name}.`);
    onCreated?.(stat);
    setKey(''); setName(''); setDesc(''); setIsCore(false); setColor('green');
    setAiPrompt(''); setMode('manual');
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
          width: '100%', maxWidth: 520, margin: '0 16px',
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh',
        }}
      >
        <div
          style={{
            padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, background: t.sidebar,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>New stat</div>
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
                  border: `1px solid ${on ? t.accent : t.rule}`, borderRadius: t.radius,
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
              {field(t, 'Describe the stat',
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="A stat that governs how much luck a character has in games of chance, gambling, close escapes."
                />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                {field(t, 'Key',
                  <input
                    type="text" style={inputStyle} value={key} maxLength={4}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="LUK"
                    autoFocus
                  />
                )}
                {field(t, 'Name',
                  <input type="text" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Luck" />
                )}
              </div>
              {field(t, 'Description',
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What does this stat govern in the story?"
                />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {field(t, 'Colour',
                  <select style={inputStyle} value={color} onChange={(e) => setColor(e.target.value)}>
                    {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, fontSize: 13, color: t.ink }}>
                  <input type="checkbox" checked={isCore} onChange={(e) => setIsCore(e.target.checked)} />
                  Core stat
                </label>
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
            type="submit" disabled={saving || !key.trim() || !name.trim()}
            style={{
              padding: '6px 14px',
              background: key.trim() && name.trim() ? t.accent : t.paper2,
              color: key.trim() && name.trim() ? t.onAccent : t.ink3,
              border: `1px solid ${key.trim() && name.trim() ? t.accent : t.rule}`,
              borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: key.trim() && name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving...' : 'Add stat'}
          </button>
        </div>
      </form>
    </div>
  );
}
