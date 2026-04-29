/**
 * NewItemModal - Loomwright-native "create an item" flow.
 *
 * Sits above the legacy EnhancedItemVault. The vault's "Create New Item"
 * button fires a prop up to the parent; the parent opens this modal, and
 * on save writes directly to `db.add('itemBank', ...)` AND to worldState
 * so every consumer (Items Library, World > Items, Provenance, Canon
 * Weaver, etc.) sees the new item at once.
 */

import React, { useState, useEffect } from 'react';
import { X, Briefcase, Pencil, Sparkles } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import aiService from '../../services/aiService';
import toastService from '../../services/toastService';

function safeJSON(text) {
  if (!text) return null;
  const m = String(text).match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const KINDS = [
  'weapon', 'armor', 'consumable', 'artefact', 'tome', 'trinket',
  'currency', 'relic', 'faction', 'other',
];

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

export default function NewItemModal({ isOpen, onClose, setWorldState, onCreated }) {
  const t = useTheme();
  const [mode, setMode] = useState('manual');
  const [name, setName] = useState('');
  const [type, setType] = useState('artefact');
  const [rarity, setRarity] = useState('Common');
  const [desc, setDesc] = useState('');
  const [properties, setProperties] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode('manual');
    setName(''); setType('artefact'); setRarity('Common');
    setDesc(''); setProperties('');
    setAiPrompt(''); setAiThinking(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const propose = async () => {
    if (!aiPrompt.trim()) { toastService.warn?.('Describe the item first.'); return; }
    setAiThinking(true);
    try {
      const system = [
        'Propose ONE story/RPG item.',
        'Return strict JSON: { name, type, rarity, desc, properties }.',
        `type is one of: ${KINDS.join(', ')}.`,
        `rarity is one of: ${RARITIES.join(', ')}.`,
        'desc: a short evocative paragraph.',
        'properties: a comma-separated list of notable mechanical or narrative properties.',
      ].join('\n');
      const raw = await aiService.callAI?.(aiPrompt.trim(), 'structured', system);
      const parsed = safeJSON(raw) || {};
      setName(parsed.name || aiPrompt.trim().slice(0, 40));
      setType(KINDS.includes(parsed.type) ? parsed.type : 'artefact');
      setRarity(RARITIES.includes(parsed.rarity) ? parsed.rarity : 'Common');
      setDesc(parsed.desc || '');
      setProperties(parsed.properties || '');
      toastService.success?.('Draft ready. Review and save.');
      setMode('manual');
    } catch (e) {
      console.warn('[NewItemModal] AI propose failed:', e);
      toastService.error?.('AI proposal failed. Try the Manual tab.');
    } finally {
      setAiThinking(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault?.();
    if (!name.trim()) { toastService.warn?.('Name is required.'); return; }
    setSaving(true);
    const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = {
      id,
      name: name.trim(),
      type: type || 'artefact',
      rarity,
      desc: desc.trim(),
      properties: properties.trim(),
      stats: {},
      grantsSkills: [],
      knownTo: [],
      customStates: [],
      track: {},
      flag: '',
      createdAt: Date.now(),
    };
    try {
      await db.add('itemBank', item);
      setWorldState?.((prev) => ({
        ...(prev || {}),
        itemBank: [...(prev?.itemBank || []), item],
      }));
      toastService.success?.(`Added ${item.name} to the Item Vault.`);
      onCreated?.(item);
      onClose?.();
    } catch (err) {
      console.error('[NewItemModal] save failed', err);
      toastService.error?.('Could not save item.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: t.bg,
    border: `1px solid ${t.rule}`,
    borderRadius: t.radius,
    color: t.ink,
    fontFamily: t.font,
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, margin: '0 16px',
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
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
            <Briefcase size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>New item</div>
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

        <div style={{ padding: 16, overflow: 'auto', maxHeight: '70vh' }}>
          {mode === 'ai' && (
            <div style={{ marginBottom: 16 }}>
              {field(t, 'Describe the item',
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 110, fontFamily: t.font }}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="An ancient sea-glass lantern that always points to the nearest lost ship; cold to the touch, hums when held over open water."
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
              <div
                style={{
                  marginTop: 12, fontSize: 11, color: t.ink3,
                  padding: '6px 10px', background: t.bg,
                  border: `1px dashed ${t.rule}`, borderRadius: t.radius,
                }}
              >
                The Loom fills the Manual form below with a draft. Review, edit,
                and commit.
              </div>
            </div>
          )}

          {field(t, 'Name',
            <input style={inputStyle} type="text" value={name}
              onChange={(e) => setName(e.target.value)} autoFocus />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field(t, 'Kind',
              <select
                style={inputStyle} value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            )}
            {field(t, 'Rarity',
              <select
                style={inputStyle} value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              >
                {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>
          {field(t, 'Description',
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: t.font }}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this thing? Where does it come from?"
            />,
            'You can flesh this out later in the Item Vault detail view.'
          )}
          {field(t, 'Properties',
            <input style={inputStyle} type="text" value={properties}
              onChange={(e) => setProperties(e.target.value)}
              placeholder="e.g. cursed, +3 strength, glows in the dark" />
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
            type="submit" disabled={saving}
            style={{
              padding: '6px 14px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Add to vault'}
          </button>
        </div>
      </form>
    </div>
  );
}
