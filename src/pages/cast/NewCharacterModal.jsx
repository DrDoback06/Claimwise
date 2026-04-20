/**
 * NewCharacterModal — create a new actor directly from Cast.
 *
 * Fills HANDOFF §5.7 (Cast didn't have a way to create characters outside the
 * Writer's Room / Canon Weaver). Minimal form: name, role, class, a one-line
 * biography, and optional "seed stats" pulled from the current stat registry.
 * On save, writes through `db` AND through `setWorldState` so the new actor
 * appears in the list instantly and is persisted.
 */

import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';

function field(t, label, children, { hint } = {}) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: t.ink3,
          letterSpacing: 0.12,
          textTransform: 'uppercase',
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

export default function NewCharacterModal({ isOpen, onClose, worldState, setWorldState, onCreated }) {
  const t = useTheme();
  const stats = worldState?.statRegistry || [];
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [klass, setKlass] = useState('');
  const [bio, setBio] = useState('');
  const [seed, setSeed] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(''); setRole(''); setKlass(''); setBio('');
    const init = {};
    stats.forEach((s) => { init[s.key || s.id] = 10; });
    setSeed(init);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault?.();
    if (!name.trim()) {
      toastService.warn?.('Name is required.');
      return;
    }
    setSaving(true);
    const id = `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const actor = {
      id,
      name: name.trim(),
      role: role.trim(),
      class: klass.trim(),
      biography: bio.trim(),
      baseStats: seed,
      additionalStats: {},
      equipment: {},
      inventory: [],
      activeSkills: [],
      relationships: [],
      createdAt: Date.now(),
    };
    try {
      await db.add('actors', actor);
      setWorldState?.((prev) => ({
        ...prev,
        actors: [...(prev?.actors || []), actor],
      }));
      toastService.success?.(`Added ${actor.name} to the cast.`);
      onCreated?.(actor);
      onClose?.();
    } catch (err) {
      console.error('[NewCharacterModal] save failed', err);
      toastService.error?.('Could not save character.');
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
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: 6,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>New character</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: 5, background: 'transparent',
              color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: 16, overflow: 'auto', maxHeight: '70vh' }}>
          {field(t, 'Name', (
            <input style={inputStyle} type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field(t, 'Role', (
              <input
                style={inputStyle}
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. protagonist, antagonist"
              />
            ))}
            {field(t, 'Class', (
              <input
                style={inputStyle}
                type="text"
                value={klass}
                onChange={(e) => setKlass(e.target.value)}
                placeholder="e.g. knight, mage"
              />
            ))}
          </div>
          {field(t, 'One-line biography', (
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: t.font }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Who are they, at a glance."
            />
          ), { hint: 'You can flesh this out later on the character detail page.' })}
          {stats.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.ink3,
                  letterSpacing: 0.12, textTransform: 'uppercase',
                  marginTop: 6, marginBottom: 4,
                }}
              >
                Seed stats
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: 8,
                }}
              >
                {stats.map((s) => {
                  const key = s.key || s.id;
                  return (
                    <label key={key} style={{ fontSize: 11, color: t.ink2 }}>
                      <div
                        style={{
                          fontFamily: t.mono, fontSize: 9, color: t.accent,
                          letterSpacing: 0.12, textTransform: 'uppercase',
                          marginBottom: 3,
                        }}
                      >
                        {s.key || s.name}
                      </div>
                      <input
                        style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}
                        type="number"
                        min={1}
                        max={99}
                        value={seed[key] ?? 10}
                        onChange={(e) => setSeed({ ...seed, [key]: Number(e.target.value) })}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '6px 12px', background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '6px 14px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Saving\u2026' : 'Add to cast'}
          </button>
        </div>
      </form>
    </div>
  );
}
