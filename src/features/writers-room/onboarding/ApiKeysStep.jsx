// Loomwright — onboarding "AI keys" step. Mirrors the Settings ApiKeys
// row layout but is wired to live store-saving so the keys are usable
// immediately for any AI feature the writer hits later in the wizard
// (style sample analysis, manuscript scan, etc).
//
// Same KEY_PROVIDERS list as Settings — single source of truth.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import aiService from '../../../services/aiService';
import { KEY_PROVIDERS, badgeColor } from '../api-keys/providers';

export default function ApiKeysStep({ data, set }) {
  const t = useTheme();
  const store = useStore();
  const persisted = store.profile?.apiKeys || {};
  // Wizard-local working values — typing flows through here; on Save we
  // commit to both `store.profile.apiKeys` (persisted) and the runtime
  // aiService (immediately usable for the rest of the wizard).
  const initial = {};
  for (const p of KEY_PROVIDERS) initial[p.id] = persisted[p.id] || '';
  const [keys, setKeys] = React.useState(initial);
  const [revealed, setRevealed] = React.useState({});
  const [saved, setSaved] = React.useState({});
  const provider = data.aiProvider || 'auto';

  const onSave = (id) => {
    const k = (keys[id] || '').trim();
    if (!k) return;
    try { aiService.setApiKey(id, k); } catch {}
    store.setPath(`profile.apiKeys.${id}`, k);
    setSaved(s => ({ ...s, [id]: Date.now() }));
    setTimeout(() => setSaved(s => { const n = { ...s }; delete n[id]; return n; }), 1500);
  };
  const onClear = (id) => {
    setKeys(k => ({ ...k, [id]: '' }));
    try { aiService.setApiKey(id, ''); } catch {}
    store.setPath(`profile.apiKeys.${id}`, '');
  };

  const haveAnyKey = Object.values(keys).some(v => (v || '').trim());

  return (
    <div>
      <p style={pStyle(t)}>
        Loomwright runs against your own AI keys — kept in your browser only,
        never sent to a Loom server. Free tiers (Groq, Hugging Face) are
        plenty to start. Add a paid key only when you want stronger prose
        from Claude or GPT-4.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {KEY_PROVIDERS.map(p => {
          const value = keys[p.id] || '';
          const isRevealed = !!revealed[p.id];
          const wasSaved = !!saved[p.id];
          const hasKey = !!(persisted[p.id] || '').trim();
          return (
            <form key={p.id}
              onSubmit={e => { e.preventDefault(); onSave(p.id); }}
              autoComplete="off"
              style={{
                padding: 10,
                background: t.paper2,
                border: `1px solid ${hasKey ? (t.good || '#2a8') : t.rule}`,
                borderLeft: `3px solid ${badgeColor(t, p.badge)}`,
                borderRadius: 2, margin: 0,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{
                  fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500,
                }}>{p.label}</span>
                <span style={{
                  padding: '1px 6px', background: badgeColor(t, p.badge), color: t.onAccent,
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, borderRadius: 999,
                }}>{p.badge}</span>
                {hasKey && (
                  <span style={{
                    padding: '1px 6px', background: 'transparent',
                    color: t.good || '#2a8', border: `1px solid ${t.good || '#2a8'}`,
                    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, borderRadius: 999,
                  }}>✓ saved</span>
                )}
                <span style={{ flex: 1 }} />
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                  fontFamily: t.mono, fontSize: 9, color: t.accent,
                  letterSpacing: 0.14, textTransform: 'uppercase', textDecoration: 'none',
                }}>Get key →</a>
              </div>
              <div style={{
                fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', marginBottom: 6,
              }}>{p.note}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type={isRevealed ? 'text' : 'password'}
                  value={value}
                  onChange={e => setKeys(k => ({ ...k, [p.id]: e.target.value }))}
                  placeholder={`Paste your ${p.label} key`}
                  spellCheck={false}
                  autoComplete="off"
                  style={{
                    flex: 1, padding: '6px 8px',
                    fontFamily: t.mono, fontSize: 12, color: t.ink,
                    background: t.paper, border: `1px solid ${t.rule}`,
                    borderRadius: 2, outline: 'none',
                  }}
                />
                <button type="button" onClick={() => setRevealed(r => ({ ...r, [p.id]: !r[p.id] }))} style={ghost(t)}>
                  {isRevealed ? 'Hide' : 'Show'}
                </button>
                {hasKey && (
                  <button type="button" onClick={() => onClear(p.id)} style={ghost(t)}>Clear</button>
                )}
                <button type="submit" disabled={!value.trim()} style={{
                  padding: '0 12px',
                  background: wasSaved ? (t.good || '#2a8') : t.accent, color: t.onAccent,
                  border: 'none', borderRadius: 2, cursor: value.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
                  textTransform: 'uppercase', fontWeight: 600, opacity: value.trim() ? 1 : 0.5,
                }}>{wasSaved ? '✓ Saved' : 'Save'}</button>
              </div>
            </form>
          );
        })}
      </div>

      <div style={{
        padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
        }}>Preferred provider</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['auto', 'anthropic', 'openai', 'gemini', 'groq', 'huggingface', 'offline'].map(p => (
            <button key={p} onClick={() => set({ aiProvider: p })} style={{
              padding: '4px 12px',
              background: provider === p ? PANEL_ACCENT.loom : 'transparent',
              color: provider === p ? t.onAccent : t.ink2,
              border: `1px solid ${provider === p ? PANEL_ACCENT.loom : t.rule}`,
              borderRadius: 999, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{p}</button>
          ))}
        </div>
        <div style={{
          fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5, marginTop: 6,
        }}>
          <b style={{ color: t.ink2, fontStyle: 'normal' }}>auto</b> tries the cheapest free provider first and falls back as quotas exhaust. Pin a specific provider only if you want a particular model's voice.
        </div>
      </div>

      {!haveAnyKey && (
        <div style={{
          marginTop: 14, padding: 10,
          background: 'transparent',
          color: t.warn || '#d80',
          border: `1px dashed ${t.warn || '#d80'}`, borderRadius: 2,
          fontFamily: t.display, fontSize: 13, lineHeight: 1.5,
        }}>
          You can skip this step, but every AI feature will be inert until at
          least one provider is set. Groq is free and takes 30 seconds to set up.
        </div>
      )}
    </div>
  );
}

function pStyle(t) {
  return { fontFamily: t.display, fontSize: 16, color: t.ink2, lineHeight: 1.7, marginBottom: 12 };
}

function ghost(t) {
  return {
    padding: '0 10px', background: 'transparent', color: t.ink3,
    border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 11,
  };
}
