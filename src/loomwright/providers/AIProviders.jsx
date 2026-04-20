/**
 * AI Providers — provider list, per-task routing, usage and budget.
 *
 * Persistence: worldState.aiSettings = {
 *   providers: [{ id, name, model, apiKeyMasked, enabled, notes }],
 *   taskRouting: { [taskId]: providerId },
 *   budgetUSD: 25,
 *   usage: [{ taskId, providerId, at, tokens, costUSD }]
 * }
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import aiService from '../../services/aiService';
import toastService from '../../services/toastService';

const DEFAULT_PROVIDERS = [
  { id: 'p_anthropic', name: 'Anthropic',   model: 'claude-3.5-sonnet', enabled: true,  notes: 'Best for long-form prose, nuance.' },
  { id: 'p_openai',    name: 'OpenAI',      model: 'gpt-4o',             enabled: true,  notes: 'Strong structured output, fast.' },
  { id: 'p_gemini',    name: 'Google',      model: 'gemini-1.5-pro',     enabled: false, notes: 'Long context window.' },
  { id: 'p_mistral',   name: 'Mistral',     model: 'mistral-large-latest', enabled: false, notes: 'European data residency; crisp tone.' },
  { id: 'p_groq',      name: 'Groq',        model: 'llama-3.1-70b-versatile', enabled: false, notes: 'Free tier; very fast.' },
  { id: 'p_ollama',    name: 'Ollama',      model: 'llama3.1',           enabled: false, notes: 'Local model runner (macOS/Linux/Windows).' },
  { id: 'p_local',     name: 'Local',       model: 'llama-3-70b',        enabled: false, notes: 'Offline browser model. Privacy-first.' },
];

const TASKS = [
  { id: 'draft',     label: 'Chapter draft',          hint: 'Creative writing, long-form prose' },
  { id: 'weave',     label: 'Canon Weaver',           hint: 'Cross-system proposals' },
  { id: 'voice',     label: 'Voice Studio rewrite',   hint: 'Style-specific rewrites' },
  { id: 'lint',      label: 'Language linting',       hint: 'Issue extraction' },
  { id: 'interview', label: 'Character interview',    hint: 'Chat in character voice' },
  { id: 'inventory', label: 'Inventory AI',           hint: 'Starter kit, item properties' },
  { id: 'atlas',     label: 'Atlas proposals',        hint: 'Place extraction' },
  { id: 'brief',     label: 'Morning Brief',          hint: 'Daily summary' },
  { id: 'spark',     label: 'Daily Spark',            hint: 'Contradictions, what-ifs' },
];

function defaultSettings() {
  const routing = {};
  TASKS.forEach((t) => {
    routing[t.id] = 'p_anthropic';
  });
  return {
    providers: DEFAULT_PROVIDERS,
    taskRouting: routing,
    budgetUSD: 25,
    usage: [],
  };
}

function formatUSD(n) {
  return `$${(n || 0).toFixed(2)}`;
}

function readRealUsage() {
  try {
    const raw = localStorage.getItem('lw-ai-usage');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function ProvidersBody({ worldState, setWorldState, scoped = false }) {
  const t = useTheme();
  const settings = worldState?.aiSettings || defaultSettings();
  const { providers, taskRouting, budgetUSD } = settings;
  const [tab, setTab] = useState('routing');
  // Real usage from aiService's localStorage store. Refreshes every few seconds.
  const [realUsage, setRealUsage] = useState(() => readRealUsage());
  useEffect(() => {
    const h = setInterval(() => setRealUsage(readRealUsage()), 3000);
    return () => clearInterval(h);
  }, []);
  const usage = realUsage;

  const patch = (next) => {
    setWorldState?.((prev) => ({ ...prev, aiSettings: next }));
    // Mirror into localStorage so aiService can read routing + providers without
    // access to worldState.
    try {
      localStorage.setItem('lw-ai-routing', JSON.stringify(next.taskRouting || {}));
      localStorage.setItem('lw-ai-providers', JSON.stringify(next.providers || []));
    } catch {
      /* ignore */
    }
  };

  // Ensure localStorage is in sync on first mount (in case worldState was loaded
  // from IndexedDB without triggering patch()).
  useEffect(() => {
    try {
      localStorage.setItem('lw-ai-routing', JSON.stringify(taskRouting || {}));
      localStorage.setItem('lw-ai-providers', JSON.stringify(providers || []));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usedUSD = useMemo(
    () => (usage || []).reduce((a, b) => a + (b.costUSD || 0), 0),
    [usage]
  );

  const updateProvider = (id, patchP) => {
    const next = providers.map((p) => (p.id === id ? { ...p, ...patchP } : p));
    patch({ ...settings, providers: next });
  };

  const [probing, setProbing] = useState({});
  const probeProvider = async (p) => {
    setProbing((x) => ({ ...x, [p.id]: 'pending' }));
    const started = performance.now();
    try {
      // Temporarily set preferredProvider to the target, call a tiny probe.
      const prev = aiService.preferredProvider;
      if (typeof aiService.setPreferredProvider === 'function') {
        aiService.setPreferredProvider(p.name?.toLowerCase());
      } else {
        aiService.preferredProvider = p.name?.toLowerCase();
      }
      await aiService.callAI('Return the single word OK.', 'ping', 'Reply with just OK.', { useCache: false, skipQueue: true });
      aiService.preferredProvider = prev;
      const ms = Math.round(performance.now() - started);
      setProbing((x) => ({ ...x, [p.id]: { ok: true, ms } }));
      updateProvider(p.id, { lastProbeAt: Date.now(), lastProbeOk: true, lastProbeMs: ms });
      toastService.success?.(`${p.name}: ping ok (${ms}ms)`);
    } catch (e) {
      setProbing((x) => ({ ...x, [p.id]: { ok: false, error: e?.message || String(e) } }));
      updateProvider(p.id, { lastProbeAt: Date.now(), lastProbeOk: false, lastProbeError: e?.message || String(e) });
      toastService.error?.(`${p.name}: ${e?.message || 'ping failed'}`);
    }
  };

  const addProvider = () => {
    const id = `p_${Date.now()}`;
    patch({
      ...settings,
      providers: [...providers, { id, name: 'New provider', model: '', enabled: false, notes: '' }],
    });
  };

  const removeProvider = (id) => {
    patch({ ...settings, providers: providers.filter((p) => p.id !== id) });
  };

  const route = (taskId, providerId) => {
    patch({ ...settings, taskRouting: { ...taskRouting, [taskId]: providerId } });
  };

  const setBudget = (n) => {
    patch({ ...settings, budgetUSD: n });
  };

  const inner = (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.rule}`,
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            Loomwright
          </div>
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink }}>
            AI Providers
          </div>
        </div>
        {[
          { id: 'routing',   label: 'Task routing' },
          { id: 'providers', label: 'Providers'     },
          { id: 'usage',     label: 'Usage'         },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setTab(m.id)}
            style={{
              padding: '8px 10px',
              background: tab === m.id ? t.paper : 'transparent',
              color: tab === m.id ? t.ink : t.ink2,
              border: 'none',
              borderLeft: tab === m.id ? `2px solid ${t.accent}` : '2px solid transparent',
              textAlign: 'left',
              fontFamily: t.mono,
              fontSize: 11,
              letterSpacing: 0.12,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </aside>
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 24px' }}>
        {tab === 'routing' && (
          <div>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
              Task routing
            </div>
            <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginBottom: 14 }}>
              Which model handles what
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TASKS.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr 260px',
                    gap: 12,
                    padding: 10,
                    background: t.paper,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink }}>{task.label}</div>
                    <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase', marginTop: 2 }}>
                      {task.id}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: t.ink2 }}>{task.hint}</div>
                  <select
                    value={taskRouting[task.id] || ''}
                    onChange={(e) => route(task.id, e.target.value)}
                    style={{
                      padding: '6px 8px',
                      background: t.paper2,
                      color: t.ink,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                      fontFamily: t.mono,
                      fontSize: 11,
                    }}
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} \u00B7 {p.model}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'providers' && (
          <div>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
              Providers
            </div>
            <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginBottom: 14 }}>
              Connected models
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {providers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 14,
                    background: t.paper,
                    border: `1px solid ${p.enabled ? t.accent : t.rule}`,
                    borderRadius: t.radius,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 140px',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      value={p.name}
                      onChange={(e) => updateProvider(p.id, { name: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: `1px solid ${t.rule}`,
                        color: t.ink,
                        padding: '6px 8px',
                        fontFamily: t.display,
                        fontSize: 15,
                        fontWeight: 500,
                        borderRadius: t.radius,
                      }}
                    />
                    <input
                      value={p.model}
                      onChange={(e) => updateProvider(p.id, { model: e.target.value })}
                      placeholder="model-id"
                      style={{
                        width: '100%',
                        marginTop: 6,
                        background: 'transparent',
                        border: `1px solid ${t.rule}`,
                        color: t.ink2,
                        padding: '4px 8px',
                        fontFamily: t.mono,
                        fontSize: 11,
                        borderRadius: t.radius,
                      }}
                    />
                  </div>
                  <input
                    value={p.notes || ''}
                    onChange={(e) => updateProvider(p.id, { notes: e.target.value })}
                    placeholder="Notes"
                    style={{
                      background: t.paper2,
                      border: `1px solid ${t.rule}`,
                      color: t.ink,
                      padding: '8px 10px',
                      fontFamily: t.font,
                      fontSize: 12,
                      borderRadius: t.radius,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={(e) => updateProvider(p.id, { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => probeProvider(p)} icon={<Icon name="refresh" size={10} />}>
                      {probing[p.id] === 'pending' ? 'Pinging\u2026' : 'Test'}
                    </Button>
                    {probing[p.id] && probing[p.id] !== 'pending' && (
                      <div
                        style={{
                          fontFamily: t.mono, fontSize: 9,
                          color: probing[p.id].ok ? t.good : t.bad,
                          letterSpacing: 0.12, textTransform: 'uppercase',
                        }}
                      >
                        {probing[p.id].ok ? `OK \u00b7 ${probing[p.id].ms}ms` : 'Failed'}
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeProvider(p.id)} icon={<Icon name="trash" size={10} />}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="default" onClick={addProvider} icon={<Icon name="plus" size={12} />}>
                Add provider
              </Button>
            </div>
          </div>
        )}
        {tab === 'usage' && (
          <div>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
              Usage
            </div>
            <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginBottom: 14 }}>
              {formatUSD(usedUSD)} of {formatUSD(budgetUSD)}
            </div>
            <div
              style={{
                height: 10,
                background: t.paper2,
                border: `1px solid ${t.rule}`,
                borderRadius: 2,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (usedUSD / Math.max(budgetUSD, 1)) * 100)}%`,
                  background: usedUSD > budgetUSD ? t.bad : t.accent,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
              <label style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
                Monthly budget
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={budgetUSD}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                style={{
                  width: 120,
                  padding: '6px 10px',
                  background: t.paper,
                  color: t.ink,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  fontFamily: t.mono,
                  fontSize: 12,
                }}
              />
            </div>
            {(usage || []).length === 0 ? (
              <div style={{ color: t.ink3, fontSize: 13 }}>
                No usage recorded yet. As features call the model, entries will appear here.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 1fr 90px 90px',
                  gap: 0,
                  background: t.paper,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  overflow: 'hidden',
                }}
              >
                {['When', 'Task', 'Provider', 'Tokens', 'Cost'].map((h) => (
                  <div
                    key={h}
                    style={{
                      padding: '8px 10px',
                      borderBottom: `1px solid ${t.rule}`,
                      background: t.paper2,
                      fontFamily: t.mono,
                      fontSize: 9,
                      color: t.ink3,
                      letterSpacing: 0.14,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </div>
                ))}
                {usage.slice(0, 40).map((u, i) => (
                  <React.Fragment key={i}>
                    <div style={{ padding: '6px 10px', fontSize: 11, color: t.ink2 }}>
                      {new Date(u.at).toLocaleString()}
                    </div>
                    <div style={{ padding: '6px 10px', fontFamily: t.mono, fontSize: 11 }}>{u.taskId}</div>
                    <div style={{ padding: '6px 10px', fontSize: 12 }}>
                      {providers.find((p) => p.id === u.providerId)?.name || u.providerId}
                    </div>
                    <div style={{ padding: '6px 10px', fontFamily: t.mono, fontSize: 11 }}>{u.tokens || 0}</div>
                    <div style={{ padding: '6px 10px', fontFamily: t.mono, fontSize: 11 }}>{formatUSD(u.costUSD)}</div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );

  if (scoped) return inner;
  return (
    <LoomwrightShell scrollable={false}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 20px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }} />
            <ThemeToggle />
          </div>
          {inner}
        </div>
      </div>
    </LoomwrightShell>
  );
}

export { ProvidersBody };

export default function AIProviders(props) {
  return <ProvidersBody {...props} />;
}
