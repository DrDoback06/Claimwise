// Loomwright — entity avatar generator. Drop in next to any entity name
// (character, item, place) and the writer can generate or upload an
// image; the result is saved as `entity[field]` (default: 'avatar').

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { generateImage, composePrompt } from './imageService';

export default function EntityImageButton({
  entity,           // the canonical entity (with id, name, etc)
  onSave,           // (dataUrl) => void
  size = 64,        // avatar preview size
  label = 'Avatar', // small label
  field = 'avatar', // entity field — used only for the placeholder hint
}) {
  const t = useTheme();
  const store = useStore();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [prompt, setPrompt] = React.useState('');
  const [error, setError] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const fileRef = React.useRef(null);

  const current = entity?.[field];

  const generate = async () => {
    setBusy(true); setError(null); setPreview(null);
    try {
      const url = await generateImage(store, entity, prompt);
      setPreview(url);
    } catch (err) {
      setError(err?.message || 'Image generation failed.');
    } finally { setBusy(false); }
  };

  const acceptPreview = () => {
    if (!preview) return;
    onSave(preview);
    setOpen(false);
    setPreview(null);
    setPrompt('');
  };

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onSave(reader.result);
      setOpen(false);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const composed = composePrompt(store, entity, prompt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: size, height: size, flexShrink: 0,
          background: current ? `url(${current}) center/cover no-repeat` : t.paper2,
          border: `1px solid ${t.rule}`, borderRadius: 4,
          display: 'grid', placeItems: 'center',
          fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase',
        }}>
          {!current && '—'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setOpen(o => !o)} style={btn(t, open)}>
            {open ? 'Cancel' : (current ? '✨ Re-generate' : '✨ Generate')}
          </button>
          <button onClick={() => fileRef.current?.click()} style={ghost(t)}>↑ Upload</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
          {current && (
            <button onClick={() => onSave(null)} style={ghost(t)}>× Clear</button>
          )}
        </div>
      </div>

      {open && (
        <div style={{
          padding: 10, background: t.paper2,
          border: `1px solid ${t.rule}`, borderLeft: `3px solid ${PANEL_ACCENT.loom}`,
          borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>{label} prompt — {entity?.name || 'entity'}</div>
          <textarea
            rows={2}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={`Describe the ${field} you want…`}
            style={{
              padding: '4px 6px', resize: 'vertical',
              fontFamily: t.display, fontSize: 12, color: t.ink, lineHeight: 1.4,
              background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
            }} />
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.12, lineHeight: 1.5,
          }}>
            <b style={{ color: t.ink2 }}>Final prompt:</b> {composed.slice(0, 220) || '(empty)'}
          </div>
          {!store.profile?.imageStyle && (
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.warn || '#d80', letterSpacing: 0.1,
            }}>
              No saga-wide image style set. Add one in Settings → Image style for consistent looks across all entities.
            </div>
          )}
          {error && (
            <div style={{
              padding: '4px 8px', background: 'transparent', color: t.bad || '#c44',
              border: `1px dashed ${t.bad || '#c44'}`, borderRadius: 1,
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1,
            }}>{error}</div>
          )}
          {preview && (
            <div style={{ marginTop: 4 }}>
              <img alt="preview" src={preview} style={{
                width: '100%', maxWidth: 256, borderRadius: 2,
                border: `1px solid ${t.rule}`,
              }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {preview && <button onClick={acceptPreview} style={btn(t, true)}>✓ Use this image</button>}
            <button onClick={generate} disabled={busy} style={btn(t)}>
              {busy ? 'Generating…' : (preview ? '↻ Try again' : '✨ Generate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function btn(t, primary) {
  return {
    padding: '4px 10px',
    background: primary ? PANEL_ACCENT.loom : 'transparent',
    color: primary ? t.onAccent : t.ink2,
    border: `1px solid ${primary ? PANEL_ACCENT.loom : t.rule}`,
    borderRadius: 1, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
    fontWeight: 600, whiteSpace: 'nowrap',
  };
}
function ghost(t) {
  return {
    padding: '3px 8px', background: 'transparent', color: t.ink3,
    border: `1px solid ${t.rule}`, borderRadius: 1, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
  };
}
