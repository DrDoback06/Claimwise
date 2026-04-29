// Loomwright — items catalogue browser. Tabs: Affixes / Gems / Runewords / Sets.
// Read-only reference for the Diablo II layer.

import React from 'react';
import { useTheme } from '../theme';
import { ALL_AFFIXES } from '../data/affixes';
import { ALL_GEMS } from '../data/gems';
import { RUNEWORDS, RUNES } from '../data/runewords';
import { SETS } from '../data/sets';

const TABS = ['affixes', 'gems', 'runes', 'runewords', 'sets'];

export default function Catalog() {
  const t = useTheme();
  const [tab, setTab] = React.useState('affixes');

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {TABS.map(x => (
          <button key={x} onClick={() => setTab(x)} style={{
            padding: '4px 10px',
            background: tab === x ? t.accent : 'transparent',
            color: tab === x ? t.onAccent : t.ink2,
            border: `1px solid ${tab === x ? t.accent : t.rule}`,
            borderRadius: 999, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
          }}>{x}</button>
        ))}
      </div>
      {tab === 'affixes' && <AffixList t={t} list={ALL_AFFIXES} />}
      {tab === 'gems' && <GemList t={t} list={ALL_GEMS} />}
      {tab === 'runes' && <GemList t={t} list={RUNES} runes />}
      {tab === 'runewords' && <RunewordList t={t} list={RUNEWORDS} />}
      {tab === 'sets' && <SetList t={t} list={SETS} />}
    </div>
  );
}

function modBadges(t, mods) {
  return Object.entries(mods || {}).map(([k, v]) => (
    <span key={k} style={{
      padding: '1px 6px', background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 999,
      fontFamily: t.mono, fontSize: 9, color: v > 0 ? t.good : v < 0 ? t.bad : t.ink2,
    }}>{k} {v > 0 ? '+' : ''}{v}</span>
  ));
}

function AffixList({ t, list }) {
  const [filter, setFilter] = React.useState('');
  const filtered = list.filter(a =>
    !filter || a.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…"
        style={filterInput(t)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {filtered.map(a => (
          <div key={a.id} style={row(t)}>
            <span style={{
              minWidth: 70, fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{a.kind}</span>
            <span style={{
              minWidth: 140, fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500,
            }}>{a.name}</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3, flex: 1 }}>{modBadges(t, a.mods)}</span>
            <span style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12,
            }}>T{a.tier}{a.themed ? ' · ' + a.themed : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GemList({ t, list, runes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {list.map(g => (
        <div key={g.id} style={row(t)}>
          <span style={{
            minWidth: 130, fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500,
          }}>{g.name || g.label}</span>
          {!runes && <span style={{
            minWidth: 80, fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}>{g.colour} · {g.grade}</span>}
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3, flex: 1 }}>{modBadges(t, g.mods)}</span>
        </div>
      ))}
    </div>
  );
}

function RunewordList({ t, list }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {list.map(rw => (
        <div key={rw.id} style={{
          padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{rw.name}</span>
            <span style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{rw.fits.join(' / ')}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.accent }}>{rw.sequence.length} runes</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {rw.sequence.map((rid, i) => (
              <span key={i} style={{
                padding: '2px 8px', background: t.paper, border: `1px solid ${t.accent}55`,
                borderRadius: 2, fontFamily: t.mono, fontSize: 10, color: t.ink2,
              }}>{rid.replace('rune_', '').toUpperCase()}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{modBadges(t, rw.bonus)}</div>
          {rw.lore && (
            <div style={{
              marginTop: 6, fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5,
            }}>{rw.lore}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function SetList({ t, list }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {list.map(s => (
        <div key={s.id} style={{
          padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
        }}>
          <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500, marginBottom: 4 }}>{s.name}</div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, marginBottom: 6 }}>
            Pieces: {s.pieces.join(' · ')}
          </div>
          {Object.entries(s.bonuses).map(([n, mods]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                width: 26, height: 18, display: 'grid', placeItems: 'center',
                fontFamily: t.mono, fontSize: 9, color: t.accent,
                background: t.paper, border: `1px solid ${t.accent}55`, borderRadius: 999,
              }}>{n}p</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{modBadges(t, mods)}</span>
            </div>
          ))}
          {s.lore && (
            <div style={{ marginTop: 6, fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>{s.lore}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function row(t) {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 10px', background: t.paper2, border: `1px solid ${t.rule}`,
    borderRadius: 2,
  };
}
function filterInput(t) {
  return {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: t.paper, border: `1px solid ${t.rule}`,
    borderRadius: 2, outline: 'none',
  };
}
