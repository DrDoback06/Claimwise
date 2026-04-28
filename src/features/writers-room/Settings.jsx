// Loomwright — Settings panel.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';
import { exportBackup, importBackup, clearAll, downloadBackup } from './store/persistence';
import { isDevMode } from './devtools/dev-mode';
import DeveloperPanel from './devtools/DeveloperPanel';
import aiService from '../../services/aiService';
import { KEY_PROVIDERS } from './api-keys/providers';
import AuthorsPanel from './authors/AuthorsPanel';
import { VoicePicker } from './utilities/ReadAloud';
import ExportPanel from './export/ExportPanel';

const PROVIDERS = ['auto', 'anthropic', 'openai', 'gemini', 'groq', 'huggingface', 'offline'];
const INTRUSION = ['quiet', 'medium', 'helpful', 'eager'];
const ATLAS_AUTO = ['off', 'conservative', 'helpful', 'eager'];

export default function Settings({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const profile = store.profile || {};
  const tweaks = store.ui?.tweaks || {};

  const set = (path, v) => store.setPath(path, v);

  const onExport = async () => {
    const json = await exportBackup({
      profile, book: store.book, chapters: store.chapters,
      cast: store.cast, places: store.places, threads: store.quests,
      items: store.items, voice: store.voice, tangle: store.tangle,
      ui: store.ui, noticings: store.noticings, snapshots: store.snapshots,
    });
    downloadBackup(json);
  };

  const fileRef = React.useRef(null);
  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Import will replace the current room. Continue?')) return;
    try {
      const json = await file.text();
      const state = await importBackup(json);
      // Pre-destructive backup first.
      const cur = await exportBackup({
        profile, book: store.book, chapters: store.chapters,
        cast: store.cast, places: store.places, threads: store.quests,
        items: store.items, voice: store.voice, tangle: store.tangle,
        ui: store.ui, noticings: store.noticings,
      });
      downloadBackup(cur);
      // Apply.
      store.transaction(({ setSlice }) => {
        for (const k of ['profile', 'book', 'chapters', 'cast', 'places', 'threads', 'items', 'voice', 'tangle', 'ui']) {
          if (state[k] != null) setSlice(k, state[k]);
        }
      });
      alert('Import complete.');
    } catch (err) {
      alert('Import failed: ' + (err?.message || err));
    }
  };

  const onClearAll = async () => {
    if (!window.confirm('CLEAR EVERYTHING? This cannot be undone.')) return;
    if (!window.confirm('Really? All cast, places, chapters, and prose will be erased.')) return;
    // Pre-destructive backup.
    const cur = await exportBackup({
      profile, book: store.book, chapters: store.chapters,
      cast: store.cast, places: store.places, threads: store.quests,
      items: store.items, voice: store.voice, tangle: store.tangle,
      ui: store.ui, noticings: store.noticings,
    });
    downloadBackup(cur);
    await clearAll();
    window.location.reload();
  };

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(100%, 480px)',
      background: t.paper, borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', zIndex: 2500,
      animation: 'lw-slide-in 240ms ease',
      boxShadow: '0 0 24px rgba(0,0,0,0.08)',
    }}>
      <header style={{
        padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase', flex: 1,
        }}>Settings</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 18 }}>×</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
        <Section t={t} title="Theme">
          <Chips t={t} items={['day', 'night']} selected={[t.mode]} onChange={v => t.setMode(v[0])} />
        </Section>

        <Section t={t} title="How vocal should the Loom be?">
          <Chips t={t} items={INTRUSION} selected={[profile.intrusion || 'medium']} onChange={v => set('profile.intrusion', v[0])} />
          <p style={pStyle(t)}>
            {profile.intrusion === 'quiet' && 'Only the most confident noticings.'}
            {(!profile.intrusion || profile.intrusion === 'medium') && 'A balanced cadence. The default.'}
            {profile.intrusion === 'helpful' && 'More margin noticings — good for first drafts.'}
            {profile.intrusion === 'eager' && 'Speaks freely. Best for brainstorming.'}
          </p>
        </Section>

        <Section t={t} title="AI review automation">
          <Toggle
            t={t}
            label="Enable autonomous extraction pipeline"
            value={profile.autonomousPipeline !== false}
            onChange={v => set('profile.autonomousPipeline', v)}
          />
          <Toggle
            t={t}
            label="Auto-apply BLUE (low-risk) findings"
            value={profile.reviewAutomation?.autoApplyBlue !== false}
            onChange={v => set('profile.reviewAutomation.autoApplyBlue', v)}
          />
          <Toggle
            t={t}
            label="Show BLUE auto-added items in queue"
            value={profile.reviewAutomation?.showAutoAdded !== false}
            onChange={v => set('profile.reviewAutomation.showAutoAdded', v)}
          />
          <Toggle
            t={t}
            label="Group queue by risk bands"
            value={profile.reviewAutomation?.groupByRiskBand !== false}
            onChange={v => set('profile.reviewAutomation.groupByRiskBand', v)}
          />
          <p style={pStyle(t)}>
            Blue = Auto-added · Green = Suggested · Amber = Needs review · Red = Canon risk.
          </p>
        </Section>

        <Section t={t} title="Auto-track movement on the Atlas">
          <Chips t={t} items={ATLAS_AUTO} selected={[tweaks.atlasAuto || 'conservative']} onChange={v => set('ui.tweaks.atlasAuto', v[0])} />
          <Toggle t={t} label="Show every character's journey at once" value={tweaks.atlasShowAll === true} onChange={v => set('ui.tweaks.atlasShowAll', v)} />
        </Section>

        <Section t={t} title="AI provider">
          <Chips t={t} items={PROVIDERS} selected={[profile.aiProvider || 'auto']} onChange={v => {
            set('profile.aiProvider', v[0]);
            try { aiService.preferredProvider = v[0]; } catch {}
          }} />
          <p style={pStyle(t)}>Auto tries the free providers first (Groq → HuggingFace) and falls back to whichever paid key you've saved.</p>
        </Section>

        <Section t={t} title="API keys & integrations">
          <ApiKeys t={t} store={store} />
        </Section>

        <Section t={t} title="Authors & collaborators">
          <AuthorsPanel />
        </Section>

        <Section t={t} title="Image style (saga-wide)">
          <p style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginTop: 0 }}>
            Stitched onto every "Generate avatar" prompt so all entity art
            shares a look. Try: <i>"oil-paint portrait, dramatic side
            lighting, dark sepia palette"</i>.
          </p>
          <textarea
            rows={3}
            value={profile.imageStyle || ''}
            onChange={e => set('profile.imageStyle', e.target.value)}
            placeholder="e.g. ink illustration · watercolour · cinematic photo · pixel art…"
            style={{
              width: '100%', padding: '6px 8px', resize: 'vertical',
              fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
              background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
            }} />
          <p style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, marginTop: 6 }}>
            Tries DALL-E 3 first if your OpenAI key is set; falls back to free Hugging Face SDXL.
          </p>
        </Section>

        <Section t={t} title="Read-aloud voices">
          <p style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginTop: 0 }}>
            The narrator voice handles all prose that isn't dialogue. Each
            character can also have its own voice (set in Cast → Identity);
            the read-aloud button in the top bar detects who's speaking
            line-by-line.
          </p>
          <VoicePicker
            value={store.book?.narratorVoiceId}
            onChange={(v) => store.setPath('book.narratorVoiceId', v)}
            label="Narrator"
          />
        </Section>

        <Section t={t} title="Margin & ribbons">
          <Toggle t={t} label="Show margin noticings" value={tweaks.showMargin !== false} onChange={v => set('ui.tweaks.showMargin', v)} />
          <Toggle t={t} label="Show ritual bar" value={tweaks.showRitualBar !== false} onChange={v => set('ui.tweaks.showRitualBar', v)} />
          <Toggle t={t} label="Show readability badges" value={tweaks.showReadability === true} onChange={v => set('ui.tweaks.showReadability', v)} />
          <Toggle t={t} label="Highlight named entities inline" value={tweaks.highlightMargin !== false} onChange={v => set('ui.tweaks.highlightMargin', v)} />
          <Toggle t={t} label="Show per-paragraph voice ribbon" value={tweaks.showVoiceRibbon === true} onChange={v => set('ui.tweaks.showVoiceRibbon', v)} />
          <Toggle t={t} label="Underline proofread issues inline" value={tweaks.showProofIssues !== false} onChange={v => set('ui.tweaks.showProofIssues', v)} />
        </Section>

        <Section t={t} title="Manuscript export & marketing">
          <ExportPanel />
        </Section>

        <Section t={t} title="Backup">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={onExport} style={btnStyle(t)}>Export backup</button>
            <input ref={fileRef} type="file" accept=".json,.lw.json" style={{ display: 'none' }} onChange={onImport} />
            <button onClick={() => fileRef.current?.click()} style={btnStyle(t)}>Import backup…</button>
          </div>
        </Section>

        <Section t={t} title="Danger zone">
          <button onClick={onClearAll} style={{ ...btnStyle(t), background: t.bad, color: t.onAccent, border: 'none' }}>Clear everything</button>
          <p style={pStyle(t)}>A backup is auto-saved before clearing.</p>
        </Section>

        {isDevMode() && (
          <Section t={t} title="Developer">
            <DeveloperPanel />
          </Section>
        )}
      </div>
    </aside>
  );
}

function Section({ t, title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8,
      }}>{title}</div>
      {children}
    </div>
  );
}
function Chips({ t, items, selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(v => (
        <button key={v} onClick={() => onChange([v])} style={{
          padding: '6px 12px', borderRadius: 1, cursor: 'pointer',
          background: selected.includes(v) ? t.accent : 'transparent',
          color: selected.includes(v) ? t.onAccent : t.ink2,
          border: `1px solid ${selected.includes(v) ? t.accent : t.rule}`,
          fontFamily: t.display, fontSize: 12, textTransform: 'capitalize',
        }}>{v}</button>
      ))}
    </div>
  );
}
function Toggle({ t, label, value, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer',
      fontFamily: t.display, fontSize: 13, color: t.ink2,
    }}>
      <span style={{
        width: 32, height: 18, borderRadius: 10, background: value ? t.accent : t.rule,
        position: 'relative', transition: 'background 160ms',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%', background: t.onAccent,
          transition: 'left 160ms',
        }} />
      </span>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      {label}
    </label>
  );
}
function pStyle(t) {
  return { fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 };
}
function btnStyle(t) {
  return {
    padding: '7px 14px', background: 'transparent',
    color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

function ApiKeys({ t, store }) {
  const persisted = store.profile?.apiKeys || {};
  const runtime = (() => { try { return aiService.getRuntimeKeys?.() || {}; } catch { return {}; } })();
  const initial = {};
  for (const p of KEY_PROVIDERS) initial[p.id] = persisted[p.id] || runtime[p.id] || '';
  const [keys, setKeys] = React.useState(initial);
  const [revealed, setRevealed] = React.useState({});
  const [saved, setSaved] = React.useState({});

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...pStyle(t), marginTop: 0 }}>
        Keys are kept in your browser only. Click "Get key →" to grab a fresh one
        from each provider's console.
      </p>
      {KEY_PROVIDERS.map(p => {
        const value = keys[p.id] || '';
        const isRevealed = !!revealed[p.id];
        const wasSaved = !!saved[p.id];
        return (
          // One <form> per provider row — each row is its own action
          // (one save button, one input). This stops Chromium complaining
          // about "multiple forms" inside a single form, and keeps the
          // password field properly contained.
          <form key={p.id}
            onSubmit={e => { e.preventDefault(); onSave(p.id); }}
            autoComplete="off"
            name={`provider-${p.id}`}
            style={{
              padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
              margin: 0,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{
                fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500,
              }}>{p.label}</span>
              <span style={{
                padding: '1px 6px',
                background: p.badge === 'FREE' ? t.good : (p.badge === 'OPTIONAL' ? t.ink3 : t.warn),
                color: t.onAccent,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
                borderRadius: 999,
              }}>{p.badge}</span>
              <span style={{ flex: 1 }} />
              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                fontFamily: t.mono, fontSize: 9, color: t.accent,
                letterSpacing: 0.14, textTransform: 'uppercase',
                textDecoration: 'none',
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
              <button type="button" onClick={() => setRevealed(r => ({ ...r, [p.id]: !r[p.id] }))} style={{
                padding: '0 10px', background: 'transparent', color: t.ink3,
                border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
                fontFamily: t.mono, fontSize: 11,
              }}>{isRevealed ? 'Hide' : 'Show'}</button>
              <button type="submit" disabled={!value.trim()} style={{
                padding: '0 12px',
                background: wasSaved ? t.good : t.accent, color: t.onAccent,
                border: 'none', borderRadius: 2, cursor: 'pointer',
                fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
                textTransform: 'uppercase', fontWeight: 600,
                opacity: value.trim() ? 1 : 0.4,
              }}>{wasSaved ? 'Saved ✓' : 'Save'}</button>
              {value && (
                <button type="button" onClick={() => onClear(p.id)} style={{
                  padding: '0 8px', background: 'transparent', color: t.ink3,
                  border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
                  fontFamily: t.mono, fontSize: 11,
                }}>×</button>
              )}
            </div>
          </form>
        );
      })}
      <a href="/#/legacy" target="_blank" rel="noopener noreferrer" style={{
        marginTop: 8, padding: '8px 12px',
        background: 'transparent', color: t.ink2,
        border: `1px dashed ${t.rule}`, borderRadius: 2,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', textAlign: 'center',
        textDecoration: 'none',
      }}>Open legacy settings (backup, TTS, canon control) →</a>
    </div>
  );
}
