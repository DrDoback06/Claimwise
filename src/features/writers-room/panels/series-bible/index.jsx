// Loomwright — Series Bible drawer (plan §20).

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createChapter, removeChapter, reorderChapters } from '../../store';
import { chapterList } from '../../store/selectors';

const TABS = ['Chapters', 'Plot', 'Cast', 'Places', 'Threads', 'Items', 'Lore audit'];

export default function SeriesBible({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const [tab, setTab] = React.useState('Chapters');

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(100%, 720px)',
      background: t.paper, borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', zIndex: 900,
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
        }}>Series Bible</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 18 }}>×</button>
      </header>
      <div style={{
        display: 'flex', gap: 0, padding: '0 12px',
        borderBottom: `1px solid ${t.rule}`, overflowX: 'auto',
      }}>
        {TABS.map(x => (
          <button key={x} onClick={() => setTab(x)} style={{
            padding: '10px 12px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === x ? t.accent : 'transparent'}`,
            color: tab === x ? t.ink : t.ink3,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{x}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', animation: 'lw-tab-fade 200ms' }} key={tab}>
        {tab === 'Chapters' && <ChaptersTab />}
        {tab === 'Plot' && <PlotTab />}
        {tab === 'Cast' && <RegistryTab kind="cast" />}
        {tab === 'Places' && <RegistryTab kind="places" />}
        {tab === 'Threads' && <RegistryTab kind="threads" />}
        {tab === 'Items' && <RegistryTab kind="items" />}
        {tab === 'Lore audit' && <LoreAuditTab />}
      </div>
    </aside>
  );
}

function ChaptersTab() {
  const t = useTheme();
  const store = useStore();
  const chapters = chapterList(store);
  const order = store.book?.chapterOrder || [];

  const wordCount = (text) => (text || '').trim().match(/\S+/g)?.length || 0;

  return (
    <div>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16,
        textTransform: 'uppercase', marginBottom: 8,
      }}>{chapters.length} chapter{chapters.length !== 1 ? 's' : ''}</div>
      {chapters.map((ch, i) => (
        <div key={ch.id} style={{
          padding: '8px 10px', marginBottom: 4,
          background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', width: 50 }}>CH.{String(ch.n).padStart(2, '0')}</span>
          <input value={ch.title} onChange={e => store.setSlice('chapters', cs => ({ ...cs, [ch.id]: { ...cs[ch.id], title: e.target.value } }))}
            style={{ flex: 1, fontFamily: t.display, fontSize: 14, color: t.ink, background: 'transparent', border: 'none', outline: 'none' }} />
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>{wordCount(ch.text)} w</span>
          <button onClick={() => removeChapter(store, ch.id)} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
        </div>
      ))}
      <button onClick={() => createChapter(store, {})} style={{
        marginTop: 12, padding: '6px 12px', background: 'transparent',
        color: t.accent, border: `1px dashed ${t.accent}`, borderRadius: 1,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
      }}>+ Chapter</button>
    </div>
  );
}

function PlotTab() {
  const t = useTheme();
  const store = useStore();
  const threads = store.quests || [];
  return (
    <div>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16,
        textTransform: 'uppercase', marginBottom: 8,
      }}>{threads.length} thread{threads.length !== 1 ? 's' : ''}</div>
      {threads.map(th => {
        const beats = th.beats || [];
        return (
          <div key={th.id} style={{
            padding: 12, marginBottom: 8,
            background: t.paper2, borderLeft: `3px solid ${th.color || t.accent}`, borderRadius: 1,
          }}>
            <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{th.name}</div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
              {beats.length} beat{beats.length !== 1 ? 's' : ''} · {th.severity || 'medium'}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {beats.map((b, i) => (
                <div key={i} style={{
                  padding: '3px 8px', background: t.paper, borderLeft: `2px solid ${th.color || t.accent}`,
                  fontFamily: t.display, fontSize: 12, color: t.ink2,
                }}>ch.{b.chapterN || '?'}: {b.text}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RegistryTab({ kind }) {
  const t = useTheme();
  const store = useStore();
  const list = store[kind] || [];
  return (
    <div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8 }}>
        {list.length} {kind}
      </div>
      {list.map(x => (
        <div key={x.id} style={{
          padding: '8px 10px', marginBottom: 4,
          background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1,
        }}>
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{x.name}</div>
          {x.role && <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{x.role}</div>}
          {x.kind && <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{x.kind}</div>}
          {x.severity && <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{x.severity}</div>}
        </div>
      ))}
    </div>
  );
}

function LoreAuditTab() {
  const t = useTheme();
  const store = useStore();
  const issues = [];
  // Cast: characters with same name.
  const names = {};
  for (const c of store.cast || []) {
    if (!c.name) continue;
    names[c.name.toLowerCase()] = (names[c.name.toLowerCase()] || 0) + 1;
  }
  for (const [n, count] of Object.entries(names)) if (count > 1) issues.push(`Duplicate character name: ${n} (${count})`);
  // Items without owner that are mentioned.
  for (const it of store.items || []) {
    if (!it.owner) issues.push(`Item "${it.name}" has no owner.`);
  }
  // Threads with no beats.
  for (const th of store.quests || []) {
    if ((th.beats || []).length === 0) issues.push(`Thread "${th.name}" has no beats.`);
  }
  return (
    <div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8 }}>
        {issues.length} issue{issues.length !== 1 ? 's' : ''}
      </div>
      {issues.length === 0 ? (
        <div style={{ fontFamily: t.display, fontSize: 14, color: t.good, fontStyle: 'italic' }}>Looks clean.</div>
      ) : (
        issues.map((iss, i) => (
          <div key={i} style={{
            padding: '6px 10px', marginBottom: 4,
            background: t.paper2, borderLeft: `2px solid ${t.warn}`, borderRadius: 1,
            fontFamily: t.display, fontSize: 13, color: t.ink2,
          }}>{iss}</div>
        ))
      )}
    </div>
  );
}
