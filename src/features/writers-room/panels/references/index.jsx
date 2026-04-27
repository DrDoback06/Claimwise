// Loomwright — Reference manager. Holds uploaded source documents (style
// passages, lore bibles, worldbuilding sketches) so they can be linked to
// onboarding sections, characters, or skill domains and read by AI prompts.
//
// Multi-file upload appends; each entry can be renamed, recategorised, and
// removed. The traffic-light system in the onboarding wizard reads
// `category` + `linkedTo.sectionIds` to score completeness.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { rid } from '../../store/mutators';
import { importFile } from '../../onboarding/file-importers';

export const REFERENCE_CATEGORIES = [
  { id: 'style',         label: 'Style', hint: 'Voice / prose samples to mimic' },
  { id: 'worldbuilding', label: 'Worldbuilding', hint: 'Maps, history, cultures' },
  { id: 'lore',          label: 'Lore', hint: 'Religion, magic, factions' },
  { id: 'characters',    label: 'Characters', hint: 'Cast briefs, backstories' },
  { id: 'mechanics',     label: 'Mechanics', hint: 'Stats, skills, item systems' },
  { id: 'plot',          label: 'Plot', hint: 'Outlines, beat sheets' },
  { id: 'other',         label: 'Other', hint: 'Anything else' },
];

export default function ReferencesPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const refs = store.references || [];
  const [busy, setBusy] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState(refs[0]?.id || null);

  const list = filter === 'all' ? refs : refs.filter(r => (r.category || 'other') === filter);
  const selected = refs.find(r => r.id === selectedId) || null;

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const records = [];
    for (const f of files) {
      try {
        const out = await importFile(f);
        if (out.kind === 'document') {
          records.push(makeRef(f.name, out.paragraphs));
        } else if (out.kind === 'archive' && Array.isArray(out.documents)) {
          for (const d of out.documents) records.push(makeRef(d.name, d.paragraphs));
        }
      } catch (err) { console.warn('[refs] import failed', f.name, err); }
    }
    if (records.length) {
      store.setSlice('references', xs => [...(Array.isArray(xs) ? xs : []), ...records]);
      // Auto-select the newest if nothing was picked yet.
      if (!selectedId && records[0]) setSelectedId(records[0].id);
    }
    if (e.target) e.target.value = ''; // allow re-selecting the same file
    setBusy(false);
  };

  const update = (id, patch) =>
    store.setSlice('references', xs => (xs || []).map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id) => {
    store.setSlice('references', xs => (xs || []).filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <PanelFrame
      title="References"
      eyebrow={`Library · ${refs.length}`}
      accent={PANEL_ACCENT.loom}
      panelId="references"
      onClose={onClose}
      width={520}>
      <div style={{
        padding: '10px 12px', borderBottom: `1px solid ${t.rule}`,
        background: t.paper2,
      }}>
        <label style={{
          display: 'block', padding: '12px 14px', textAlign: 'center',
          border: `2px dashed ${t.rule}`, borderRadius: 2,
          cursor: busy ? 'wait' : 'pointer',
          background: busy ? t.paper : 'transparent',
        }}>
          <input type="file" multiple disabled={busy}
            accept=".docx,.pdf,.txt,.md,.markdown,.zip"
            onChange={onPick} style={{ display: 'none' }} />
          <div style={{ fontFamily: t.display, fontSize: 13, color: busy ? t.ink3 : t.ink2 }}>
            {busy ? 'Reading…' : 'Drop reference files (DOCX · PDF · TXT · MD · ZIP)'}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, marginTop: 4, textTransform: 'uppercase' }}>
            Multiple files OK · added to library
          </div>
        </label>
      </div>

      <div style={{
        padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4,
        borderBottom: `1px solid ${t.rule}`,
      }}>
        <button onClick={() => setFilter('all')} style={chip(t, filter === 'all')}>All</button>
        {REFERENCE_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={chip(t, filter === c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', minHeight: 320 }}>
        <div style={{ borderRight: `1px solid ${t.rule}`, overflowY: 'auto', maxHeight: 480 }}>
          {list.length === 0 && (
            <div style={{
              padding: 30, textAlign: 'center',
              fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
            }}>{filter === 'all' ? 'No references yet. Drop a file above.' : 'Nothing in this category.'}</div>
          )}
          {list.map(r => (
            <button key={r.id}
              onClick={() => setSelectedId(r.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', cursor: 'pointer',
                background: selectedId === r.id ? t.paper2 : 'transparent',
                border: 'none', borderBottom: `1px solid ${t.rule}`,
                borderLeft: `3px solid ${selectedId === r.id ? PANEL_ACCENT.loom : 'transparent'}`,
              }}>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.label || r.name || 'Untitled'}
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
                {r.category || 'other'} · {(r.paragraphs || []).length}p
              </div>
            </button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 480 }}>
          {selected ? (
            <Detail t={t} ref={selected} update={update} remove={remove} />
          ) : (
            <div style={{
              padding: 30, textAlign: 'center',
              fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
            }}>Pick a reference to inspect.</div>
          )}
        </div>
      </div>
    </PanelFrame>
  );
}

function Detail({ t, ref, update, remove }) {
  const preview = (ref.paragraphs || []).slice(0, 8).map(p => p.text).join('\n\n');
  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Field t={t} label="Display label">
        <input value={ref.label || ''} onChange={e => update(ref.id, { label: e.target.value })}
          placeholder={ref.name || 'Reference'} style={inp(t)} />
      </Field>
      <Field t={t} label="Original filename">
        <input value={ref.name || ''} onChange={e => update(ref.id, { name: e.target.value })} style={inp(t)} />
      </Field>
      <Field t={t} label="Category">
        <select value={ref.category || 'other'} onChange={e => update(ref.id, { category: e.target.value })} style={inp(t)}>
          {REFERENCE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field t={t} label={`Preview · first ${(ref.paragraphs || []).slice(0, 8).length} paragraph${(ref.paragraphs || []).length === 1 ? '' : 's'}`}>
        <div style={{
          padding: 10, maxHeight: 220, overflowY: 'auto',
          background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1,
          fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>{preview || '(empty)'}</div>
      </Field>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={() => remove(ref.id)} style={{
          padding: '4px 12px', background: 'transparent', color: t.bad || t.ink3,
          border: `1px solid ${t.bad || t.rule}`, borderRadius: 1, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
        }}>Remove</button>
      </div>
    </div>
  );
}

function Field({ t, label, children }) {
  return (
    <div>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      {children}
    </div>
  );
}

function inp(t) {
  return {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
  };
}

function chip(t, on) {
  return {
    padding: '3px 10px',
    background: on ? PANEL_ACCENT.loom : 'transparent',
    color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? PANEL_ACCENT.loom : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

function makeRef(name, paragraphs) {
  return {
    id: rid('ref'),
    name: name || 'untitled',
    label: name ? name.replace(/\.[^.]+$/, '') : '',
    category: detectCategory(name),
    paragraphs: paragraphs || [],
    sourceKind: 'upload',
    importedAt: Date.now(),
    linkedTo: { sectionIds: [], characterIds: [] },
  };
}

function detectCategory(name) {
  const n = (name || '').toLowerCase();
  if (/(style|prose|voice)/.test(n)) return 'style';
  if (/(world|map|atlas|geography)/.test(n)) return 'worldbuilding';
  if (/(lore|myth|religion|magic)/.test(n)) return 'lore';
  if (/(charact|cast|persona|bio)/.test(n)) return 'characters';
  if (/(stat|skill|class|item|loot|combat)/.test(n)) return 'mechanics';
  if (/(plot|outline|beat|synopsis)/.test(n)) return 'plot';
  return 'other';
}
