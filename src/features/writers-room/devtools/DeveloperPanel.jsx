// Loomwright — Developer panel (gated by ?dev=1).
//
// Lives inside Settings. Provides:
//   • Seed / clear demo manuscript (large)
//   • API keys for each AI provider (Anthropic / OpenAI / Gemini / Groq / HF)
//   • AI test harness — runs every writing-aid mode on a sample
//   • Wizard smoke test — verifies the WalkThrough end-to-end
//
// Nothing in here writes to user data without an explicit click. Demo
// data is tagged with `_demo: true` and removable with one button.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import aiService from '../../../services/aiService';
import { seedDemoManuscript, clearDemoData, isDemoActive, demoCounts } from './seed';
import { runOne, listModes, isProviderConfigured, smokeTestWizard, SAMPLE_TEXT } from './ai-test';
import { setDevMode } from './dev-mode';

const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'openai',    label: 'OpenAI (GPT)' },
  { id: 'gemini',    label: 'Google (Gemini)' },
  { id: 'groq',      label: 'Groq' },
  { id: 'huggingface', label: 'HuggingFace (free)' },
];

export default function DeveloperPanel() {
  const t = useTheme();
  const store = useStore();

  return (
    <div>
      <DevSection t={t} title="Demo manuscript">
        <DemoBlock />
      </DevSection>

      <DevSection t={t} title="AI providers">
        <KeyBlock />
      </DevSection>

      <DevSection t={t} title="AI test harness">
        <AITestBlock />
      </DevSection>

      <DevSection t={t} title="Wizard smoke test">
        <WizardSmoke />
      </DevSection>

      <DevSection t={t} title="Dev mode">
        <button onClick={() => { setDevMode(false); window.location.search = ''; }} style={btnStyle(t)}>
          Disable dev mode (reload)
        </button>
        <p style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', marginTop: 6 }}>
          Visit any URL with ?dev=1 to re-enable.
        </p>
      </DevSection>
    </div>
  );
}

function DemoBlock() {
  const t = useTheme();
  const store = useStore();
  const active = isDemoActive(store);
  const counts = demoCounts(store);
  const total = counts.characters + counts.places + counts.threads + counts.items + counts.chapters;

  const seed = () => {
    if (active && !window.confirm('Demo data is already loaded. Re-seed (replaces demo records)?')) return;
    seedDemoManuscript(store);
  };
  const clear = () => {
    if (!window.confirm('Clear all demo records? Real records you authored are kept.')) return;
    clearDemoData(store);
  };

  return (
    <div>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginBottom: 10 }}>
        Loads <strong>The Compliance Run</strong> — 4 characters with relationships, 5 places (one with a
        floorplan), 2 threads with beats, 2 items, 4 chapters of ~700 words each, woven journey visits.
        Every record is tagged <code style={{ fontFamily: t.mono, fontSize: 11 }}>_demo: true</code> and removable.
      </div>
      {active && (
        <div style={{
          padding: '6px 10px', marginBottom: 10,
          background: PANEL_ACCENT.loom + '22', borderLeft: `2px solid ${PANEL_ACCENT.loom}`,
          fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase',
        }}>
          Demo loaded · {total} records · {counts.characters} cast · {counts.places} places · {counts.threads} threads · {counts.items} items · {counts.chapters} chapters
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={seed} style={btnStyle(t, true)}>{active ? 'Re-seed' : 'Load demo manuscript'}</button>
        {active && <button onClick={clear} style={{ ...btnStyle(t), borderColor: t.bad, color: t.bad }}>Clear demo data</button>}
      </div>
    </div>
  );
}

function KeyBlock() {
  const t = useTheme();
  const store = useStore();
  const apiKeys = store.profile?.apiKeys || {};
  const [show, setShow] = React.useState({});

  const setKey = (provider, key) => {
    aiService.setApiKey(provider, key);
    store.setPath('profile.apiKeys', { ...apiKeys, [provider]: key });
  };

  return (
    <div>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginBottom: 10 }}>
        Keys are persisted in your local store and pushed into the legacy aiService at runtime.
      </div>
      {PROVIDERS.map(p => {
        const v = apiKeys[p.id] || '';
        const visible = !!show[p.id];
        return (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 }}>
              {p.label} {v && <span style={{ color: t.good }}>· key set</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type={visible ? 'text' : 'password'}
                value={v}
                onChange={e => setKey(p.id, e.target.value)}
                placeholder={`${p.label} API key`}
                style={{
                  flex: 1, padding: '6px 8px',
                  fontFamily: t.mono, fontSize: 12, color: t.ink,
                  background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
                }} />
              <button onClick={() => setShow(s => ({ ...s, [p.id]: !s[p.id] }))} style={btnStyle(t)}>
                {visible ? 'Hide' : 'Show'}
              </button>
              {v && (
                <button onClick={() => setKey(p.id, '')} style={{ ...btnStyle(t), color: t.bad, borderColor: t.bad }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 12, fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12 }}>
        Provider preference · {store.profile?.aiProvider || 'auto'}
      </div>
    </div>
  );
}

function AITestBlock() {
  const t = useTheme();
  const store = useStore();
  const [results, setResults] = React.useState({});
  const [busy, setBusy] = React.useState({});
  const [useMock, setUseMock] = React.useState(false);
  const [sample, setSample] = React.useState(SAMPLE_TEXT);
  const configured = isProviderConfigured();

  const runMode = async (mode) => {
    setBusy(b => ({ ...b, [mode]: true }));
    const r = await runOne({ mode, sample, profile: store.profile, useMock });
    setResults(rs => ({ ...rs, [mode]: r }));
    setBusy(b => ({ ...b, [mode]: false }));
  };

  const runAll = async () => {
    for (const m of listModes()) {
      // eslint-disable-next-line no-await-in-loop
      await runMode(m.id);
    }
  };

  return (
    <div>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginBottom: 6 }}>
        Provider · {configured ? <span style={{ color: t.good }}>configured</span> : <span style={{ color: t.warn }}>none reachable</span>}.
        Mock fallback: {useMock || !configured ? 'on' : 'off'}.
      </div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
      }}>
        <input type="checkbox" checked={useMock} onChange={e => setUseMock(e.target.checked)} />
        Force mock provider (ignore live keys)
      </label>
      <textarea
        rows={4}
        value={sample}
        onChange={e => setSample(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px',
          fontFamily: t.display, fontSize: 12, color: t.ink, lineHeight: 1.5,
          background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none', marginBottom: 10,
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        <button onClick={runAll} style={btnStyle(t, true)}>Run all</button>
        {listModes().map(m => (
          <button key={m.id} onClick={() => runMode(m.id)} disabled={busy[m.id]} style={{
            ...btnStyle(t),
            color: results[m.id]?.ok === false ? t.bad : (results[m.id]?.ok ? t.good : t.ink2),
            borderColor: results[m.id]?.ok === false ? t.bad : (results[m.id]?.ok ? t.good : t.rule),
          }}>{busy[m.id] ? `${m.label}…` : m.label}</button>
        ))}
      </div>
      {Object.entries(results).map(([mode, r]) => (
        <div key={mode} style={{
          marginBottom: 10, padding: 10,
          background: t.paper2,
          borderLeft: `2px solid ${r.ok ? (r.mock ? PANEL_ACCENT.loom : t.good) : t.bad}`,
          borderRadius: 1,
        }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase' }}>
            {mode}{r.mock ? ' · mock' : ''}{r.ok ? '' : ' · failed'} · {r.latencyMs}ms
          </div>
          {r.err && <div style={{ fontFamily: t.mono, fontSize: 11, color: t.bad, marginTop: 4 }}>{r.err}</div>}
          <pre style={{
            margin: '6px 0 0', padding: 8,
            background: t.paper, borderRadius: 1, border: `1px solid ${t.rule}`,
            fontFamily: t.mono, fontSize: 11, color: t.ink2, whiteSpace: 'pre-wrap',
            maxHeight: 220, overflowY: 'auto',
          }}>{(r.response || '').trim() || '(empty response)'}</pre>
          {Array.isArray(r.parsed) && r.parsed.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>parsed · {r.parsed.length} item{r.parsed.length === 1 ? '' : 's'}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WizardSmoke() {
  const t = useTheme();
  const store = useStore();
  const [out, setOut] = React.useState(null);
  const run = () => setOut(smokeTestWizard(store));
  return (
    <div>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginBottom: 8 }}>
        Calls the same `createCharacter` path the WalkThroughWizard uses. The created record is tagged
        <code style={{ fontFamily: t.mono, fontSize: 11 }}> _demo: true</code> so it sweeps with the demo clear.
      </div>
      <button onClick={run} style={btnStyle(t, true)}>Run smoke test</button>
      {out && (
        <pre style={{
          marginTop: 10, padding: 8,
          background: t.paper2, border: `1px solid ${out.ok ? t.good : t.bad}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 11, color: t.ink2, whiteSpace: 'pre-wrap',
        }}>{JSON.stringify(out, null, 2)}</pre>
      )}
    </div>
  );
}

function DevSection({ t, title, children }) {
  return (
    <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${t.rule}` }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 10,
      }}>{title}</div>
      {children}
    </div>
  );
}

function btnStyle(t, primary) {
  return {
    padding: '7px 12px',
    background: primary ? t.accent : 'transparent',
    color: primary ? t.onAccent : t.ink2,
    border: primary ? 'none' : `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}
