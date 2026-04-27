// Loomwright — Today panel. Mounts on the LEFT side of the shell (between
// LeftRail and the editor). Stays open while the writer interacts with
// other panels on the right.
//
// Three sections: Morning brief · Sparks · Quick actions.
//
// Spark click routes:
//   - kind 'interview' + linkedCharacter → opens cast panel, selects
//     character, flips SpecialistChat to interview mode, pre-fills the body
//     as the first interviewer question.
//   - linkedChapter → jumps the editor to that chapter.
//   - linkedCharacter (any kind) → opens cast panel + selects character.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { useSelection } from '../selection';
import { generateSparks, generateMorningBrief, starterSparks, KIND_META } from './dailyAI';

const CACHE_KEY = (bookId) => `lw.today.cache.${bookId || 'default'}`;

export default function TodayPanel({ onOpenPanel, onClose }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const bookId = store.book?.id || 'default';

  const [sparks, setSparks] = React.useState([]);
  const [brief, setBrief] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CACHE_KEY(bookId) + '.dismissed') || '[]')); }
    catch { return new Set(); }
  });

  const persistDismissed = (next) => {
    setDismissed(next);
    try { localStorage.setItem(CACHE_KEY(bookId) + '.dismissed', JSON.stringify([...next])); } catch {}
  };

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try {
      const [s, b] = await Promise.all([
        generateSparks(store),
        generateMorningBrief(store),
      ]);
      setSparks(s || []);
      setBrief(b || null);
      try {
        localStorage.setItem(CACHE_KEY(bookId), JSON.stringify({
          sparks: s, brief: b, at: Date.now(),
        }));
      } catch {}
    } finally { setBusy(false); }
  }, [bookId, store]);

  // First load: hydrate from cache or fall through to starter sparks.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY(bookId));
      if (raw) {
        const cached = JSON.parse(raw);
        setSparks(cached.sparks || []);
        setBrief(cached.brief || null);
        return;
      }
    } catch {}
    setSparks(starterSparks(store));
  }, [bookId, store]);

  const onSparkClick = (s) => {
    // Route by spark kind / linked entities.
    if (s.linkedChapter && store.chapters?.[s.linkedChapter]) {
      store.setPath('ui.activeChapterId', s.linkedChapter);
      store.setPath('book.currentChapterId', s.linkedChapter);
    }
    if (s.linkedCharacter && store.cast?.find(c => c.id === s.linkedCharacter)) {
      select('character', s.linkedCharacter);
      onOpenPanel?.('cast');
    }
    if (s.kind === 'interview' && s.linkedCharacter) {
      // Pre-stage an interview turn for the writer in the cast specialist.
      // SpecialistChat picks up the most-recent draft from
      // `ui.specialistDraft[<historyKey>]` if present.
      const key = `cast-interview:${s.linkedCharacter}`;
      store.setPath(`ui.specialistDraft.${key}`, s.body || s.title || '');
    }
  };

  const dismissSpark = (id) => {
    const next = new Set(dismissed); next.add(id); persistDismissed(next);
  };
  const restoreAll = () => persistDismissed(new Set());

  const visibleSparks = sparks.filter(s => !dismissed.has(s.id));

  return (
    <aside style={{
      width: 320, minWidth: 280, maxWidth: 380,
      background: t.paper,
      borderRight: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column',
      animation: 'lw-slide-in 240ms ease',
      overflow: 'hidden',
    }}>
      <header style={{
        padding: '14px 16px 10px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0,
        background: t.paper2,
      }}>
        <div style={{ width: 4, alignSelf: 'stretch', background: PANEL_ACCENT.loom, borderRadius: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>Today</div>
          <div style={{
            fontFamily: t.display, fontSize: 17, color: t.ink, fontWeight: 500,
            marginTop: 2, lineHeight: 1.2,
          }}>{brief?.greeting || 'Welcome back.'}</div>
        </div>
        <button onClick={refresh} disabled={busy}
          title="Re-generate sparks from current chapters"
          style={iconBtn(t)}>{busy ? '…' : '↻'}</button>
        {onClose && (
          <button onClick={onClose} title="Close" style={iconBtn(t)}>×</button>
        )}
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {brief?.summary && (
          <div style={{
            padding: '10px 14px',
            fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5,
            borderBottom: `1px solid ${t.rule}`,
          }}>{brief.summary}</div>
        )}

        {brief?.sections?.length > 0 && (
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.rule}` }}>
            {brief.sections.map(sec => (
              <Section key={sec.kind} t={t} title={sec.title} items={sec.items || []} />
            ))}
          </div>
        )}

        <div style={{ padding: '10px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}>Sparks · {visibleSparks.length}</div>
            <span style={{ flex: 1 }} />
            {dismissed.size > 0 && (
              <button onClick={restoreAll} style={ghostBtn(t)}>Restore {dismissed.size} dismissed</button>
            )}
          </div>
          {visibleSparks.length === 0 && (
            <div style={{
              padding: '14px 0', textAlign: 'center',
              fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
            }}>
              No sparks. Hit ↻ to generate fresh ones from your latest chapter.
            </div>
          )}
          {visibleSparks.map(s => (
            <SparkCard key={s.id} t={t} s={s} onClick={() => onSparkClick(s)} onDismiss={() => dismissSpark(s.id)} />
          ))}
        </div>

        <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.rule}` }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8,
          }}>Quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button onClick={() => onOpenPanel?.('cast')} style={qaBtn(t, PANEL_ACCENT.cast)}>👤 Open cast</button>
            <button onClick={() => onOpenPanel?.('atlas')} style={qaBtn(t, PANEL_ACCENT.atlas)}>🗺 Open atlas</button>
            <button onClick={() => onOpenPanel?.('quests')} style={qaBtn(t, PANEL_ACCENT.threads)}>⚔ Open quests</button>
            <button onClick={() => onOpenPanel?.('continuity')} style={qaBtn(t, PANEL_ACCENT.atlas)}>🚩 Continuity</button>
            <button onClick={() => onOpenPanel?.('items')} style={qaBtn(t, PANEL_ACCENT.items)}>🧰 Open items</button>
            <button onClick={() => onOpenPanel?.('skills')} style={qaBtn(t, PANEL_ACCENT.items)}>✨ Open skills</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Section({ t, title, items }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
      }}>{title}</div>
      <ul style={{ margin: 0, padding: '0 0 0 16px', fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5 }}>
        {items.map(i => <li key={i.id}>{i.text}</li>)}
      </ul>
    </div>
  );
}

function SparkCard({ t, s, onClick, onDismiss }) {
  const meta = KIND_META[s.kind] || KIND_META.editor;
  return (
    <div onClick={onClick} style={{
      marginBottom: 8, padding: 10,
      background: t.paper2,
      borderRadius: 2,
      border: `1px solid ${t.rule}`,
      borderLeft: `3px solid ${meta.color}`,
      cursor: 'pointer',
      transition: 'background 120ms',
    }}
    onMouseOver={e => { e.currentTarget.style.background = t.paper; }}
    onMouseOut={e => { e.currentTarget.style.background = t.paper2; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          padding: '1px 6px', background: meta.color, color: t.onAccent,
          fontFamily: t.mono, fontSize: 8, letterSpacing: 0.16, textTransform: 'uppercase',
          borderRadius: 1,
        }}>{meta.label}</span>
        <span style={{ flex: 1 }} />
        <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} title="Dismiss" style={{
          background: 'transparent', border: 'none', color: t.ink3,
          cursor: 'pointer', padding: '0 2px', fontSize: 12, lineHeight: 1,
        }}>×</button>
      </div>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500, marginBottom: 2 }}>{s.title}</div>
      <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>{s.body}</div>
    </div>
  );
}

function iconBtn(t) {
  return {
    width: 22, height: 22, borderRadius: 999,
    border: `1px solid ${t.rule}`, background: 'transparent',
    color: t.ink3, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    fontFamily: t.mono, fontSize: 11, lineHeight: 1, padding: 0,
  };
}

function ghostBtn(t) {
  return {
    padding: '2px 8px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

function qaBtn(t, color) {
  return {
    padding: '6px 8px', background: 'transparent', color: color,
    border: `1px solid ${color}55`, borderRadius: 2, cursor: 'pointer',
    fontFamily: t.display, fontSize: 12, fontWeight: 500,
    textAlign: 'left',
  };
}
