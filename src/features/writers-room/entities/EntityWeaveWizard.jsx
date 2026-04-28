import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import aiService from '../../../services/aiService';
import { safeParseJson } from '../ai/jsonExtract';

const ENTITY_TAGS = [
  { id: 'cast', label: 'Cast', kind: 'character' },
  { id: 'items', label: 'Items', kind: 'item' },
  { id: 'skills', label: 'Skills', kind: 'skill' },
  { id: 'quests', label: 'Quests', kind: 'quest' },
  { id: 'atlas', label: 'Places', kind: 'place' },
];

const RISK_OPTIONS = [
  { id: 'blue', label: 'Blue (default auto-added)' },
  { id: 'green', label: 'Green (suggested)' },
  { id: 'amber', label: 'Amber (needs review)' },
  { id: 'red', label: 'Red (canon risk)' },
];

export default function EntityWeaveWizard({ onClose, seed }) {
  const t = useTheme();
  const store = useStore();
  const [step, setStep] = React.useState(1);
  const [prompt, setPrompt] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState(['cast', 'items', 'skills', 'quests']);
  const [riskBand, setRiskBand] = React.useState('blue');
  const [busy, setBusy] = React.useState(false);
  const [generated, setGenerated] = React.useState([]);
  const [selected, setSelected] = React.useState([]);

  React.useEffect(() => {
    if (!seed) return;
    if (typeof seed.prompt === 'string') setPrompt(seed.prompt);
    if (Array.isArray(seed.tags) && seed.tags.length) {
      const valid = seed.tags.filter(tag => ENTITY_TAGS.some(t => t.id === tag));
      if (valid.length) setSelectedTags(valid);
    }
    if (typeof seed.riskBand === 'string' && RISK_OPTIONS.some(r => r.id === seed.riskBand)) {
      setRiskBand(seed.riskBand);
    }
  }, [seed]);

  const toggleTag = (id) => setSelectedTags(xs => xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const schema = `Return ONLY JSON:\n{\n  "entities": [\n    {"kind":"character|item|skill|quest|place","name":"string","summary":"string","notes":"string","suggestedTag":"cast|items|skills|quests|atlas","stats":{},"skills":[],"items":[],"quests":[]}\n  ]\n}`;
      const instruction = [
        'You are the Loomwright Entity Studio assistant.',
        'Generate candidate story entities from this user request.',
        'Prefer practical canon-safe additions.',
        'Do not output markdown. JSON only.',
        schema,
        `Allowed target tags: ${selectedTags.join(', ') || 'cast,items,skills,quests,atlas'}`,
        `User request: ${prompt}`,
      ].join('\n\n');
      const raw = await aiService.callAI(instruction, 'analytical', null, { useCache: false });
      const parsed = safeParseJson(raw);
      const entries = Array.isArray(parsed?.entities) ? parsed.entities : [];
      const normalized = entries.map((x, i) => ({
        id: `wiz_${Date.now().toString(36)}_${i}`,
        kind: x.kind || 'character',
        name: x.name || 'Unnamed',
        summary: x.summary || x.notes || '',
        notes: x.notes || '',
        suggestedTag: selectedTags.includes(x.suggestedTag) ? x.suggestedTag : selectedTags[0] || 'cast',
        stats: x.stats || {},
        skills: Array.isArray(x.skills) ? x.skills : [],
        items: Array.isArray(x.items) ? x.items : [],
        quests: Array.isArray(x.quests) ? x.quests : [],
      }));
      setGenerated(normalized);
      setSelected(normalized.map(x => x.id));
      setStep(2);
    } catch (err) {
      window.alert('Entity generation failed: ' + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const commitToQueues = () => {
    const selectedRows = generated.filter(x => selected.includes(x.id));
    if (!selectedRows.length) {
      window.alert('Select at least one generated entry.');
      return;
    }
    store.setSlice('reviewQueue', xs => {
      const arr = Array.isArray(xs) ? xs : [];
      const now = Date.now();
      const items = selectedRows.map((row, idx) => ({
        id: `rq_wiz_${now.toString(36)}_${idx}`,
        kind: row.kind,
        status: 'pending',
        name: row.name,
        notes: [row.summary, row.notes].filter(Boolean).join(' — '),
        confidence: 0.95,
        riskBand,
        source: 'entity-wizard',
        draft: {
          name: row.name,
          notes: [row.summary, row.notes].filter(Boolean).join(' — '),
          tag: row.suggestedTag,
          stats: row.stats,
          skills: row.skills,
          items: row.items,
          quests: row.quests,
        },
        addedAt: now + idx,
      }));
      return [...arr, ...items];
    });
    onClose?.();
  };

  return (
    <div style={overlay()}>
      <div style={modal(t)}>
        <header style={head(t)}>
          <div>
            <div style={eyebrow(t)}>Entity Studio</div>
            <div style={title(t)}>Weave Entity Wizard</div>
          </div>
          <button onClick={onClose} style={closeBtn(t)}>×</button>
        </header>

        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
          <StepPill n={1} active={step === 1} done={step > 1} label="Describe + tag" />
          <StepPill n={2} active={step === 2} done={false} label="Review + queue" />
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <>
              <p style={help(t)}>Describe what you want. Everything defaults to <b>Blue</b>. You can change risk colour before queueing.</p>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} placeholder="e.g. New villain: female, 10ft tall, dual chainsaws, attacks Steve then seduces him later..." style={input(t)} />
              <div style={label(t)}>Target tabs (tags)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ENTITY_TAGS.map(tag => (
                  <button key={tag.id} onClick={() => toggleTag(tag.id)} style={chip(t, selectedTags.includes(tag.id))}>{tag.label}</button>
                ))}
              </div>
              <div style={label(t)}>Risk colour</div>
              <select value={riskBand} onChange={e => setRiskBand(e.target.value)} style={select(t)}>
                {RISK_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </>
          )}

          {step === 2 && (
            <>
              <p style={help(t)}>Pick what to keep, optionally tweak tag + risk, then send to tab queues.</p>
              {generated.length === 0 && <div style={help(t)}>No entities generated.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generated.map(row => (
                  <div key={row.id} style={card(t)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={selected.includes(row.id)} onChange={() => setSelected(xs => xs.includes(row.id) ? xs.filter(x => x !== row.id) : [...xs, row.id])} />
                      <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>{row.name}</div>
                      <span style={kindPill(t)}>{row.kind}</span>
                    </div>
                    <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, marginTop: 6 }}>{row.summary}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <select value={row.suggestedTag} onChange={e => setGenerated(xs => xs.map(it => it.id === row.id ? { ...it, suggestedTag: e.target.value } : it))} style={select(t)}>
                        {ENTITY_TAGS.map(tag => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <footer style={foot(t)}>
          {step === 2 && <button onClick={() => setStep(1)} style={btn(t)}>Back</button>}
          <span style={{ flex: 1 }} />
          {step === 1 && <button onClick={generate} disabled={busy || !prompt.trim()} style={btn(t, true)}>{busy ? 'Generating…' : 'Generate entities'}</button>}
          {step === 2 && <button onClick={commitToQueues} style={btn(t, true)}>Send to tab queues</button>}
        </footer>
      </div>
    </div>
  );
}

function StepPill({ n, active, done, label }) {
  return <span style={{ marginRight: 8, fontFamily: 'monospace', fontSize: 11, opacity: active ? 1 : 0.7 }}>{done ? '✓' : n}. {label}</span>;
}
const overlay = () => ({ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 2100, display: 'grid', placeItems: 'center' });
const modal = (t) => ({ width: 'min(980px, 94vw)', height: 'min(760px, 92vh)', background: t.paper, border: `1px solid ${t.rule}`, display: 'flex', flexDirection: 'column' });
const head = (t) => ({ padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center' });
const eyebrow = (t) => ({ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase' });
const title = (t) => ({ fontFamily: t.display, fontSize: 22, color: t.ink, marginTop: 2 });
const closeBtn = (t) => ({ marginLeft: 'auto', border: `1px solid ${t.rule}`, background: 'transparent', width: 28, height: 28, cursor: 'pointer', color: t.ink3 });
const help = (t) => ({ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5 });
const label = (t) => ({ fontFamily: t.mono, fontSize: 9, color: t.ink3, marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: .14 });
const input = (t) => ({ width: '100%', background: t.paper2, border: `1px solid ${t.rule}`, padding: 10, fontFamily: t.display, fontSize: 14, color: t.ink });
const select = (t) => ({ padding: '6px 8px', background: t.paper2, border: `1px solid ${t.rule}`, fontFamily: t.mono, fontSize: 11, color: t.ink2 });
const chip = (t, on) => ({ padding: '6px 10px', border: `1px solid ${on ? t.accent : t.rule}`, background: on ? t.accent : 'transparent', color: on ? t.onAccent : t.ink2, fontFamily: t.mono, fontSize: 10, cursor: 'pointer' });
const card = (t) => ({ border: `1px solid ${t.rule}`, padding: 10, background: t.paper2 });
const kindPill = (t) => ({ marginLeft: 'auto', fontFamily: t.mono, fontSize: 9, border: `1px solid ${t.rule}`, padding: '1px 6px' });
const foot = (t) => ({ padding: 12, borderTop: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center' });
const btn = (t, primary = false) => ({ padding: '7px 12px', border: `1px solid ${primary ? t.accent : t.rule}`, background: primary ? t.accent : 'transparent', color: primary ? t.onAccent : t.ink2, fontFamily: t.mono, fontSize: 10, cursor: 'pointer' });
