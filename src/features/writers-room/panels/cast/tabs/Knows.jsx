// Loomwright — Cast > Knows·Hides·Fears ledger.
// CODE-INSIGHT §8 + §12.7. Per-character timeline-aware ledger.
//
// Each KnowledgeEntry: { id, fact, kind ('knows'|'hides'|'fears'),
// learnedAtChapter, source, sourceCharacterId?, alsoKnownBy? }.
// All new fields are optional — legacy entries (just { fact }) still render.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { knowledgeByKind, characterById } from '../../../store/selectors';

const KIND_ORDER = ['knows', 'hides', 'fears'];
const KIND_LABEL = { knows: 'Knows', hides: 'Hides', fears: 'Fears' };
const SOURCE_OPTIONS = ['witnessed', 'told', 'inferred', 'born-knowing'];

function newEntry(kind) {
  return {
    id: `kw_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    kind,
    fact: '',
    learnedAtChapter: null,
    source: 'witnessed',
    sourceCharacterId: null,
    alsoKnownBy: [],
  };
}

export default function KnowsTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const [activeKind, setActiveKind] = React.useState('knows');

  const cast = store.cast || [];
  const chapterOrder = store.book?.chapterOrder || [];

  const entries = knowledgeByKind(c, activeKind);

  const setEntries = (kind, fn) => {
    const list = Array.isArray(c[kind]) ? c[kind] : [];
    const next = fn(list);
    update({ [kind]: next });
  };

  const accent = c.color || t.accent;

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {KIND_ORDER.map(k => {
          const count = (c[k] || []).length;
          const isActive = activeKind === k;
          return (
            <button key={k} onClick={() => setActiveKind(k)} style={{
              flex: 1, padding: '6px 8px',
              background: isActive ? accent : 'transparent',
              color: isActive ? t.onAccent : t.ink2,
              border: `1px solid ${isActive ? accent : t.rule}`,
              borderRadius: 2,
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
              textTransform: 'uppercase', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span>{KIND_LABEL[k]}</span>
              <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div style={{
          padding: '14px 0', fontFamily: t.display, fontSize: 13,
          color: t.ink3, fontStyle: 'italic', lineHeight: 1.5,
        }}>
          {activeKind === 'knows' && 'What does ' + (c.name || 'this character') + ' know? Add facts as you write.'}
          {activeKind === 'hides' && 'Secrets — what they conceal, and from whom.'}
          {activeKind === 'fears' && 'What they dread; what would unmake them.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e) => (
          <KnowsRow
            key={e.id}
            entry={e}
            cast={cast}
            chapterOrder={chapterOrder}
            chapters={store.chapters || {}}
            t={t}
            onPatch={(patch) => setEntries(activeKind, list =>
              list.map(x => x.id === e.id ? { ...x, ...patch } : x))}
            onRemove={() => setEntries(activeKind, list => list.filter(x => x.id !== e.id))}
          />
        ))}
      </div>

      <button onClick={() => setEntries(activeKind, list => [...list, newEntry(activeKind)])} style={{
        marginTop: 10, padding: '5px 10px', background: 'transparent',
        color: accent, border: `1px dashed ${accent}`,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
      }}>+ {KIND_LABEL[activeKind].toLowerCase()}</button>
    </div>
  );
}

function KnowsRow({ entry, cast, chapterOrder, chapters, t, onPatch, onRemove }) {
  const sourceChar = entry.sourceCharacterId
    ? cast.find(c => c.id === entry.sourceCharacterId)
    : null;

  return (
    <div style={{
      padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <textarea
          value={entry.fact || ''}
          onChange={e => onPatch({ fact: e.target.value })}
          placeholder="What is the fact?"
          rows={1}
          style={{
            flex: 1, fontFamily: t.display, fontSize: 13, color: t.ink,
            background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
            lineHeight: 1.4,
          }} />
        <button onClick={onRemove} aria-label="Remove" style={{
          background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 14, lineHeight: 1, padding: 2,
        }}>×</button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: 6,
        marginTop: 8, alignItems: 'center',
      }}>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}>Learned</span>
        <select value={entry.learnedAtChapter || ''}
          onChange={e => onPatch({ learnedAtChapter: e.target.value || null })}
          style={selectStyle(t)}>
          <option value="">—</option>
          {chapterOrder.map(id => {
            const ch = chapters[id];
            return <option key={id} value={id}>ch.{ch?.n ?? '?'}{ch?.title ? ' · ' + ch.title : ''}</option>;
          })}
        </select>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}>Via</span>
        <select value={entry.source || 'witnessed'}
          onChange={e => onPatch({ source: e.target.value })}
          style={selectStyle(t)}>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {entry.source === 'told' && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}>From</span>
          <select value={entry.sourceCharacterId || ''}
            onChange={e => onPatch({ sourceCharacterId: e.target.value || null })}
            style={selectStyle(t)}>
            <option value="">—</option>
            {cast.map(c => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>)}
          </select>
        </div>
      )}
      {(entry.alsoKnownBy?.length > 0 || cast.length > 1) && (
        <div style={{ marginTop: 6 }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
          }}>Also known by</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {cast.filter(c => c.id !== entry.sourceCharacterId).map(c => {
              const has = (entry.alsoKnownBy || []).includes(c.id);
              return (
                <button key={c.id} onClick={() => {
                  const list = entry.alsoKnownBy || [];
                  onPatch({ alsoKnownBy: has
                    ? list.filter(id => id !== c.id)
                    : [...list, c.id] });
                }} style={{
                  padding: '2px 6px',
                  background: has ? (c.color || t.accent) : 'transparent',
                  color: has ? t.onAccent : t.ink2,
                  border: `1px solid ${has ? (c.color || t.accent) : t.rule}`,
                  borderRadius: 999, cursor: 'pointer',
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1,
                }}>{c.name || '?'}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function selectStyle(t) {
  return {
    fontFamily: t.mono, fontSize: 10, color: t.ink2,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, padding: '2px 4px', minWidth: 0,
  };
}
