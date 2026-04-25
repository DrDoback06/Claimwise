// Loomwright — Settings panel.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';
import { exportBackup, importBackup, clearAll, downloadBackup } from './store/persistence';

const PROVIDERS = ['auto', 'anthropic', 'openai', 'gemini', 'offline'];
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
      cast: store.cast, places: store.places, threads: store.threads,
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
        cast: store.cast, places: store.places, threads: store.threads,
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
      cast: store.cast, places: store.places, threads: store.threads,
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
      display: 'flex', flexDirection: 'column', zIndex: 1100,
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

        <Section t={t} title="Auto-track movement on the Atlas">
          <Chips t={t} items={ATLAS_AUTO} selected={[tweaks.atlasAuto || 'conservative']} onChange={v => set('ui.tweaks.atlasAuto', v[0])} />
          <Toggle t={t} label="Show every character's journey at once" value={tweaks.atlasShowAll === true} onChange={v => set('ui.tweaks.atlasShowAll', v)} />
        </Section>

        <Section t={t} title="AI provider">
          <Chips t={t} items={PROVIDERS} selected={[profile.aiProvider || 'auto']} onChange={v => set('profile.aiProvider', v[0])} />
          <p style={pStyle(t)}>You can paste API keys into the legacy Settings panel for now. Loomwright will use whichever provider Claimwise has configured.</p>
        </Section>

        <Section t={t} title="Margin & ribbons">
          <Toggle t={t} label="Show margin noticings" value={tweaks.showMargin !== false} onChange={v => set('ui.tweaks.showMargin', v)} />
          <Toggle t={t} label="Show ritual bar" value={tweaks.showRitualBar !== false} onChange={v => set('ui.tweaks.showRitualBar', v)} />
          <Toggle t={t} label="Show readability badges" value={tweaks.showReadability === true} onChange={v => set('ui.tweaks.showReadability', v)} />
          <Toggle t={t} label="Highlight named entities inline" value={tweaks.highlightMargin !== false} onChange={v => set('ui.tweaks.highlightMargin', v)} />
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
