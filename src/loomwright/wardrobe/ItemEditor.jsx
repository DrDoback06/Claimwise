/**
 * ItemEditor — full-schema item editor modal.
 * Supports the extended Loomwright schema plus the original Claimwise fields.
 * Includes an "Enrich with AI" button that calls suggestItemProperties().
 */

import React, { useEffect, useState } from 'react';
import Modal from '../primitives/Modal';
import Button from '../primitives/Button';
import Icon from '../primitives/Icon';
import { useTheme } from '../theme';
import { ensureItemWardrobeShape, ITEM_CATEGORIES, STATE_PRESETS, SLOT_DEFS } from './schema';
import { suggestItemProperties } from '../ai/inventoryAI';

const RARITY = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

function Field({ label, children, hint }) {
  const t = useTheme();
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: t.ink3, marginTop: 4 }}>{hint}</div>
      )}
    </label>
  );
}

function Input({ value, onChange, type = 'text', placeholder, multiline, rows = 3 }) {
  const t = useTheme();
  const style = {
    width: '100%',
    padding: '8px 10px',
    background: t.paper2,
    color: t.ink,
    border: `1px solid ${t.rule}`,
    borderRadius: t.radius,
    fontFamily: t.font,
    fontSize: 13,
    boxSizing: 'border-box',
    resize: multiline ? 'vertical' : 'none',
  };
  if (multiline) {
    return (
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={style}
      />
    );
  }
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  const t = useTheme();
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        width: '100%',
        padding: '8px 10px',
        background: t.paper2,
        color: t.ink,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        fontFamily: t.mono,
        fontSize: 12,
        boxSizing: 'border-box',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

function Chips({ values, onChange, options }) {
  const t = useTheme();
  const set = new Set(values || []);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => {
        const id = opt.value ?? opt;
        const label = opt.label ?? opt;
        const active = set.has(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              const next = new Set(set);
              if (active) next.delete(id);
              else next.add(id);
              onChange(Array.from(next));
            }}
            style={{
              padding: '3px 8px',
              background: active ? t.accentSoft : 'transparent',
              color: active ? t.accent : t.ink2,
              border: `1px solid ${active ? t.accent : t.rule}`,
              borderRadius: 2,
              fontFamily: t.mono,
              fontSize: 9,
              letterSpacing: 0.12,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function ItemEditor({
  open,
  item,
  worldState,
  onSave,
  onClose,
  onDelete,
}) {
  const t = useTheme();
  const [draft, setDraft] = useState(() => ensureItemWardrobeShape(item || {}));
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setDraft(ensureItemWardrobeShape(item || {}));
  }, [item]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const actorOptions = (worldState?.actors || []).map((a) => ({
    value: a.id,
    label: a.name || `Actor ${a.id}`,
  }));

  const enrich = async () => {
    setEnriching(true);
    try {
      const enriched = await suggestItemProperties(draft, worldState);
      setDraft(ensureItemWardrobeShape(enriched));
    } finally {
      setEnriching(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      subtitle="Loomwright \u00B7 Item editor"
      title={draft.name || 'New item'}
      width={820}
      footer={
        <>
          {onDelete && draft.id && (
            <Button variant="danger" onClick={() => onDelete(draft.id)}>
              Delete
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button
            variant="ghost"
            onClick={enrich}
            disabled={enriching}
            icon={<Icon name="sparkle" size={12} />}
          >
            {enriching ? 'Enriching\u2026' : 'Enrich with AI'}
          </Button>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(draft)}>
            Save
          </Button>
        </>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: 18,
        }}
      >
        <div>
          <Field label="Name">
            <Input value={draft.name} onChange={(v) => set({ name: v })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 140px', gap: 10 }}>
            <Field label="Icon">
              <Input
                value={draft.icon}
                onChange={(v) => set({ icon: (v || '').slice(0, 2) })}
              />
            </Field>
            <Field label="Type / category">
              <Select
                value={draft.type}
                onChange={(v) => set({ type: v })}
                options={ITEM_CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="(choose)"
              />
            </Field>
            <Field label="Rarity">
              <Select
                value={draft.rarity}
                onChange={(v) => set({ rarity: v })}
                options={RARITY}
              />
            </Field>
          </div>
          <Field label="Description">
            <Input
              multiline
              rows={4}
              value={draft.desc}
              onChange={(v) => set({ desc: v })}
              placeholder="Concrete, sensory \u2014 what the item feels like in hand."
            />
          </Field>
          <Field label="Special properties">
            <Input
              multiline
              rows={3}
              value={draft.properties}
              onChange={(v) => set({ properties: v })}
              placeholder="How it behaves, what it does, unusual traits."
            />
          </Field>
          <Field label="Symbolism / motif">
            <Input
              multiline
              rows={2}
              value={draft.symbolism}
              onChange={(v) => set({ symbolism: v })}
              placeholder="What it represents thematically."
            />
          </Field>
        </div>
        <div>
          <Field label="Origin chapter">
            <Input
              type="number"
              value={draft.origin}
              onChange={(v) => set({ origin: v })}
              placeholder="e.g. 1"
            />
          </Field>
          <Field label="Value / worth">
            <Input
              value={draft.value}
              onChange={(v) => set({ value: v })}
              placeholder="Heirloom, priceless, 20 silver\u2026"
            />
          </Field>
          <Field label="Plot flag" hint="Warn when something dramatic is unresolved.">
            <Input
              value={draft.flag}
              onChange={(v) => set({ flag: v })}
              placeholder="\u26A0 left at the inn, never retrieved"
            />
          </Field>
          <Field label="Known to">
            <Chips
              values={draft.knownTo}
              onChange={(v) => set({ knownTo: v })}
              options={actorOptions}
            />
          </Field>
          <Field label="Custom states" hint="Per-item states in addition to the defaults.">
            <Input
              value={(draft.customStates || []).map((s) => s.label).join(', ')}
              onChange={(v) =>
                set({
                  customStates: v
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((label) => ({
                      id: label.toLowerCase().replace(/\s+/g, '_'),
                      label,
                      tone: 'neutral',
                    })),
                })
              }
              placeholder="e.g. Cursed, Blooded, Whispers"
            />
          </Field>
          <div
            style={{
              marginTop: 8,
              padding: 10,
              background: t.paper2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
            }}
          >
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                color: t.ink3,
                letterSpacing: 0.14,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Track summary
            </div>
            {draft.track && Object.keys(draft.track).length ? (
              Object.keys(draft.track)
                .map(Number)
                .sort((a, b) => a - b)
                .map((ch) => {
                  const entry = draft.track[ch];
                  const owner = actorOptions.find((o) => o.value === entry.actorId);
                  const slot = SLOT_DEFS.find((s) => s.id === entry.slotId);
                  const state = STATE_PRESETS.find((s) => s.id === entry.stateId);
                  return (
                    <div
                      key={ch}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr',
                        gap: 8,
                        fontSize: 12,
                        color: t.ink2,
                        padding: '4px 0',
                        borderTop: `1px solid ${t.rule}`,
                      }}
                    >
                      <span style={{ fontFamily: t.mono, color: t.accent, fontSize: 10 }}>
                        CH.{String(ch).padStart(2, '0')}
                      </span>
                      <span>
                        {owner ? owner.label : <em style={{ color: t.ink3 }}>unowned</em>}{' '}
                        &middot; {slot?.label || '\u2014'} &middot;{' '}
                        {state?.label || entry.stateId}{' '}
                        {entry.note && (
                          <span style={{ color: t.ink3, fontStyle: 'italic' }}>
                            \u2014 {entry.note}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
            ) : (
              <div style={{ fontSize: 12, color: t.ink3 }}>
                No track entries yet. Use the wardrobe paper-doll to record which
                chapter this item changes hands, slots, or state.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
