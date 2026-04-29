/**
 * StarterKitWizard — shown when an actor has no inventory track and is new.
 * Three paths:
 *   1. Generate with AI (calls suggestStarterInventory)
 *   2. Build manually (close, user adds via PaperDoll)
 *   3. Skip for now (dismiss permanently for this actor until re-opened)
 *
 * Calls onApply({ items, trackUpdates }) with the output so the host can
 * merge into worldState.itemBank and persist.
 */

import React, { useState } from 'react';
import Modal from '../primitives/Modal';
import Button from '../primitives/Button';
import Icon from '../primitives/Icon';
import { useTheme } from '../theme';
import { suggestStarterInventory } from '../ai/inventoryAI';
import { SLOT_DEFS } from './schema';

function PathCard({ title, description, cta, onClick, disabled, active, icon }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 16,
        background: active ? t.accentSoft : t.paper2,
        border: `1.5px solid ${active ? t.accent : t.rule}`,
        borderRadius: t.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        color: t.ink,
        fontFamily: t.font,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          {cta}
        </span>
      </div>
      <div
        style={{
          fontFamily: t.display,
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>{description}</div>
    </button>
  );
}

export default function StarterKitWizard({
  open,
  actor,
  worldState,
  chapter = 1,
  onApply,
  onClose,
  onSkip,
}) {
  const t = useTheme();
  const [mode, setMode] = useState(null); // 'generating' | 'preview' | null
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setMode('generating');
    setError(null);
    try {
      const out = await suggestStarterInventory(actor, worldState, { chapter, count: 7 });
      setPreview(out);
      setMode('preview');
    } catch (e) {
      setError(e?.message || 'Generation failed.');
      setMode(null);
    }
  };

  const applyAndClose = () => {
    if (!preview) return;
    onApply?.(preview);
    onClose?.();
  };

  const slotLabel = (id) => SLOT_DEFS.find((s) => s.id === id)?.label || id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      subtitle="Loomwright \u00B7 Starter kit"
      title={actor?.name ? `New character \u2014 ${actor.name}` : 'New character'}
      width={720}
      footer={
        mode === 'preview' ? (
          <>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Back
            </Button>
            <Button variant="ghost" onClick={handleGenerate}>
              Re-roll
            </Button>
            <div style={{ flex: 1 }} />
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={applyAndClose}>
              Accept {preview?.items?.length || 0} items
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onSkip} title="Hide this prompt for this character">
              Skip for now
            </Button>
            <div style={{ flex: 1 }} />
            <Button onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      {mode === 'preview' ? (
        <div>
          <div style={{ marginBottom: 14, color: t.ink2, lineHeight: 1.6 }}>
            Here's what we picked for <strong>{actor?.name || 'this character'}</strong> at
            chapter {chapter}. Accept to add them to the item bank and wardrobe, or re-roll
            for a different set.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(preview?.items || []).map((it) => (
              <div
                key={it.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 140px',
                  gap: 10,
                  padding: 10,
                  background: t.paper2,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    fontFamily: t.display,
                    fontSize: 18,
                    display: 'grid',
                    placeItems: 'center',
                    color: t.accent,
                  }}
                >
                  {it.icon || '\u25A1'}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: t.display,
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    {it.name}
                  </div>
                  {it.desc && (
                    <div
                      style={{
                        fontSize: 12,
                        color: t.ink2,
                        lineHeight: 1.5,
                        marginBottom: 4,
                      }}
                    >
                      {it.desc}
                    </div>
                  )}
                  {it.symbolism && (
                    <div style={{ fontSize: 11, color: t.ink3, fontStyle: 'italic' }}>
                      {it.symbolism}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 9,
                    color: t.ink3,
                    letterSpacing: 0.12,
                    textTransform: 'uppercase',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ color: t.accent }}>
                    {slotLabel(it.track?.[chapter]?.slotId)}
                  </div>
                  <div style={{ marginTop: 3 }}>{it.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: t.ink2, lineHeight: 1.6 }}>
            Every character in Loomwright carries something when they enter the story.
            How would you like to set up <strong>{actor?.name || 'this character'}</strong>?
          </p>
          {error && (
            <div
              style={{
                padding: 10,
                marginBottom: 12,
                background: t.paper2,
                border: `1px solid ${t.bad}`,
                borderRadius: t.radius,
                color: t.bad,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
              marginTop: 14,
            }}
          >
            <PathCard
              icon={<Icon name="sparkle" size={14} color={t.accent} />}
              cta="Auto"
              title="Generate with AI"
              description="Pick 7 plausible items based on their role, class, and the world's period. You can edit anything after."
              onClick={handleGenerate}
              disabled={mode === 'generating'}
            />
            <PathCard
              icon={<Icon name="edit" size={14} color={t.accent} />}
              cta="Manual"
              title="Build manually"
              description="Open an empty wardrobe. Add items yourself from the bank or create new ones."
              onClick={() => {
                onClose?.();
              }}
            />
            <PathCard
              icon={<Icon name="clock" size={14} color={t.ink3} />}
              cta="Later"
              title="Skip for now"
              description="Close without adding anything. You can re-open this wizard any time from the Inventory tab."
              onClick={onSkip}
            />
          </div>
          {mode === 'generating' && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: t.paper2,
                border: `1px dashed ${t.rule}`,
                borderRadius: t.radius,
                color: t.ink2,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icon name="sparkle" size={12} color={t.accent} />
              Asking the model for a starter kit\u2026
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
