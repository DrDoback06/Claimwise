// Loomwright — WalkThroughWizard (plan §9). Right-rail slide-in.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore, createCharacter, createPlace, createThread, createItem } from '../store';
import { useSelection } from '../selection';
import aiService from '../../../services/aiService';

const FLOWS = {
  character: ['name', 'role', 'oneliner', 'voice', 'links'],
  place:     ['name', 'kind', 'description', 'tags'],
  thread:    ['name', 'severity', 'description', 'links'],
  item:      ['name', 'owner', 'description'],
};

const ROLES = ['protagonist', 'ally', 'foil', 'antagonist', 'minor', 'unknown'];
const PLACE_KINDS = ['city', 'village', 'manor', 'tavern', 'ship', 'dungeon', 'wilderness'];
const SEVERITIES = ['high', 'medium', 'low'];
const ITEM_KINDS = ['object', 'weapon', 'tool', 'document', 'token', 'symbol'];

export default function WalkThroughWizard({ kind, proposal, onClose }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState(() => ({
    name: proposal?.name || '',
    role: 'support',
    oneliner: '',
    voice: '',
    links: { places: [], threads: [], items: [] },
    kind: 'settlement',
    description: '',
    severity: 'medium',
    owner: null,
    ...proposal,
  }));
  const [aiSuggestions, setAiSuggestions] = React.useState([]);
  const [loadingAI, setLoadingAI] = React.useState(false);

  const flow = FLOWS[kind] || ['name'];
  const stepKey = flow[step];
  const total = flow.length;

  const onConfirm = () => {
    store.transaction(({ setSlice }) => {
      let id = null;
      if (kind === 'character') id = createCharacter({ setSlice }, { ...draft, draftedByLoom: true });
      else if (kind === 'place') id = createPlace({ setSlice }, { ...draft, draftedByLoom: true });
      else if (kind === 'thread') id = createThread({ setSlice }, { ...draft, draftedByLoom: true });
      else if (kind === 'item') id = createItem({ setSlice }, { ...draft, draftedByLoom: true });
      // Selection happens via select() outside transaction.
      if (id) setTimeout(() => select(kind, id), 0);
    });
    store.recordFeedback(kind, 'accept', { via: 'walkthrough' });
    onClose?.();
  };

  React.useEffect(() => {
    if (kind === 'character' && stepKey === 'oneliner' && !aiSuggestions.length) {
      setLoadingAI(true);
      const ctx = { genre: store.profile?.genre, setting: store.profile?.worldType };
      const prompt = `Suggest 3 one-line descriptions for a ${draft.role} character named "${draft.name}" in a ${ctx.genre || 'literary'} story. One per line.`;
      Promise.resolve(safeAI(prompt)).then(out => {
        const lines = (out || '').split(/\n+/).map(s => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 3);
        setAiSuggestions(lines);
        setLoadingAI(false);
      }).catch(() => setLoadingAI(false));
    }
  }, [stepKey, kind]);

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: t.paper, borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      animation: 'lw-slide-in 240ms ease',
      boxShadow: '0 0 24px rgba(0,0,0,0.08)',
    }}>
      <header style={{ padding: '14px 18px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 2,
        }}>The Loom · {kind}</div>
        <div style={{
          fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500,
        }}>{titleForStep(kind, stepKey)}</div>
        <div style={{ marginTop: 8, height: 2, background: t.rule, borderRadius: 1 }}>
          <div style={{
            width: `${((step + 1) / total) * 100}%`, height: '100%',
            background: PANEL_ACCENT.loom, transition: 'width 200ms',
          }} />
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
        <StepBody
          t={t}
          kind={kind}
          stepKey={stepKey}
          draft={draft}
          setDraft={setDraft}
          aiSuggestions={aiSuggestions}
          loadingAI={loadingAI}
        />
      </div>

      <footer style={{
        padding: '14px 18px', borderTop: `1px solid ${t.rule}`,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <button onClick={onClose} style={{
          padding: '7px 12px', background: 'transparent', color: t.ink3,
          border: `1px solid ${t.rule}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Cancel</button>
        <div style={{ flex: 1 }} />
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '7px 12px', background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: 1,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer',
          }}>Back</button>
        )}
        {step < total - 1 ? (
          <button onClick={() => setStep(s => s + 1)} style={{
            padding: '7px 14px', background: PANEL_ACCENT.loom, color: t.onAccent,
            border: 'none', borderRadius: 1,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          }}>Next</button>
        ) : (
          <button onClick={onConfirm} style={{
            padding: '7px 14px', background: PANEL_ACCENT.loom, color: t.onAccent,
            border: 'none', borderRadius: 1,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          }}>Confirm</button>
        )}
      </footer>
    </aside>
  );
}

function titleForStep(kind, key) {
  const map = {
    name: 'What is their name?',
    role: 'What is their role?',
    oneliner: 'A one-line description',
    voice: 'A taste of how they speak',
    links: 'Anything they are tied to?',
    kind: 'What kind of place?',
    description: 'Describe it briefly',
    tags: 'Tags (optional)',
    severity: 'How urgent is this thread?',
    owner: 'Who owns this?',
  };
  return map[key] || 'Continue';
}

function StepBody({ t, kind, stepKey, draft, setDraft, aiSuggestions, loadingAI }) {
  const inp = {
    width: '100%', padding: '8px 10px',
    fontFamily: t.display, fontSize: 14, color: t.ink,
    background: t.paper2, border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none',
  };
  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
  };

  if (stepKey === 'name') return (
    <div>
      <div style={lbl}>Name</div>
      <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={inp} autoFocus />
    </div>
  );
  if (stepKey === 'role') return (
    <div>
      <div style={lbl}>Role</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ROLES.map(r => (
          <button key={r} onClick={() => setDraft(d => ({ ...d, role: r }))} style={{
            padding: '6px 12px', borderRadius: 1, cursor: 'pointer',
            background: draft.role === r ? t.accent : 'transparent',
            color: draft.role === r ? t.onAccent : t.ink2,
            border: `1px solid ${draft.role === r ? t.accent : t.rule}`,
            fontFamily: t.display, fontSize: 12, textTransform: 'capitalize',
          }}>{r}</button>
        ))}
      </div>
    </div>
  );
  if (stepKey === 'oneliner') return (
    <div>
      <div style={lbl}>One-liner</div>
      <input value={draft.oneliner || ''} onChange={e => setDraft(d => ({ ...d, oneliner: e.target.value }))} style={inp} placeholder="Describe in one line…" />
      <div style={{ marginTop: 14 }}>
        <div style={lbl}>{loadingAI ? 'The Loom is thinking…' : 'Suggestions'}</div>
        {aiSuggestions.map((line, i) => (
          <button key={i} onClick={() => setDraft(d => ({ ...d, oneliner: line }))} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '8px 10px', marginBottom: 4,
            background: draft.oneliner === line ? t.paper2 : 'transparent',
            border: `1px solid ${draft.oneliner === line ? t.accent : t.rule}`,
            borderRadius: 1, cursor: 'pointer',
            fontFamily: t.display, fontSize: 13, color: t.ink, fontStyle: 'italic',
          }}>{line}</button>
        ))}
      </div>
    </div>
  );
  if (stepKey === 'voice') return (
    <div>
      <div style={lbl}>Voice (optional)</div>
      <textarea value={draft.voice || ''} onChange={e => setDraft(d => ({ ...d, voice: e.target.value }))} rows={4} style={{ ...inp, fontFamily: t.display, lineHeight: 1.5 }} placeholder="A line or two of dialogue…" />
    </div>
  );
  if (stepKey === 'links') return (
    <div>
      <div style={lbl}>Links (optional, can skip)</div>
      <div style={{ fontSize: 13, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>You can wire up relationships and threads later from the dossier.</div>
    </div>
  );
  if (stepKey === 'kind') return (
    <div>
      <div style={lbl}>Place kind</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PLACE_KINDS.map(k => (
          <button key={k} onClick={() => setDraft(d => ({ ...d, kind: k }))} style={{
            padding: '6px 12px', borderRadius: 1, cursor: 'pointer',
            background: draft.kind === k ? t.accent : 'transparent',
            color: draft.kind === k ? t.onAccent : t.ink2,
            border: `1px solid ${draft.kind === k ? t.accent : t.rule}`,
            fontFamily: t.display, fontSize: 12, textTransform: 'capitalize',
          }}>{k}</button>
        ))}
      </div>
    </div>
  );
  if (stepKey === 'description') return (
    <div>
      <div style={lbl}>Description</div>
      <textarea value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={5} style={{ ...inp, fontFamily: t.display, lineHeight: 1.5 }} placeholder="A few sentences…" />
    </div>
  );
  if (stepKey === 'tags') return (
    <div>
      <div style={lbl}>Tags (comma-separated)</div>
      <input value={(draft.tags || []).join(', ')} onChange={e => setDraft(d => ({ ...d, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} style={inp} />
    </div>
  );
  if (stepKey === 'severity') return (
    <div>
      <div style={lbl}>Severity</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {SEVERITIES.map(s => (
          <button key={s} onClick={() => setDraft(d => ({ ...d, severity: s }))} style={{
            padding: '6px 12px', borderRadius: 1, cursor: 'pointer',
            background: draft.severity === s ? t.accent : 'transparent',
            color: draft.severity === s ? t.onAccent : t.ink2,
            border: `1px solid ${draft.severity === s ? t.accent : t.rule}`,
            fontFamily: t.display, fontSize: 12, textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>
    </div>
  );
  if (stepKey === 'owner') return (
    <div>
      <div style={lbl}>Owner (optional)</div>
      <input value={draft.owner || ''} onChange={e => setDraft(d => ({ ...d, owner: e.target.value }))} style={inp} placeholder="Character name or leave blank" />
    </div>
  );
  return null;
}

async function safeAI(prompt) {
  try {
    if (typeof aiService?.callAI === 'function') {
      const r = await aiService.callAI(prompt, { maxTokens: 200 });
      return typeof r === 'string' ? r : (r?.text || r?.content || '');
    }
    if (typeof aiService?.complete === 'function') {
      return await aiService.complete('', prompt);
    }
  } catch {}
  return '';
}
