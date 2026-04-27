// Loomwright — Items panel (CODE-INSIGHT §6 + Diablo II layer).
// Tabs: Bank · Forge · Catalog · Detail.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createItem } from '../../store';
import { useSelection } from '../../selection';
import { dragEntity } from '../../drag';
import { itemById, characterById, chapterList, derivedStats, itemTotalMods, activeRuneword } from '../../store/selectors';
import CraftWizard from '../../items/CraftWizard';
import Catalog from '../../items/Catalog';
import SpecialistChat from '../../specialist/SpecialistChat';
import QueuePanel from '../../review-queue/QueuePanel';
import EntityImageButton from '../../images/EntityImageButton';
import EntityTimeline from '../../timeline/EntityTimeline';

const RARITIES = ['common', 'magic', 'rare', 'legendary', 'unique', 'mythic'];
const RARITY_COLOR = {
  common: 'oklch(60% 0.02 0)',
  magic:  'oklch(60% 0.10 220)',
  rare:   'oklch(60% 0.13 50)',
  legendary: 'oklch(70% 0.13 80)',
  unique: 'oklch(60% 0.13 300)',
  mythic: 'oklch(60% 0.20 25)',
};
const SLOTS = ['', 'head', 'main-hand', 'off-hand', 'body', 'feet', 'hands', 'belt', 'pocket'];

export default function ItemsPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const items = store.items || [];
  const itemId = sel.item || items[0]?.id;
  const item = itemId ? itemById(store, itemId) : null;
  const [tab, setTab] = React.useState('bank'); // 'bank' | 'forge' | 'catalog'
  const [craftOpen, setCraftOpen] = React.useState(false);

  const addItem = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createItem({ setSlice }, { inBank: true });
    });
    if (id) select('item', id);
  };

  return (
    <PanelFrame
      title="Things, marked"
      eyebrow={`Items · ${items.length}`}
      accent={PANEL_ACCENT.items}
      panelId="inventory"
      onClose={onClose}
      width={460}>
      <div style={{
        padding: '8px 12px', display: 'flex', gap: 4, borderBottom: `1px solid ${t.rule}`,
        background: t.paper,
      }}>
        {['bank', 'forge', 'catalog', 'story'].map(x => (
          <button key={x} onClick={() => setTab(x)} style={{
            padding: '4px 10px',
            background: tab === x ? PANEL_ACCENT.items : 'transparent',
            color: tab === x ? t.onAccent : t.ink2,
            border: `1px solid ${tab === x ? PANEL_ACCENT.items : t.rule}`,
            borderRadius: 999, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
          }}>{x}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={() => setCraftOpen(true)} style={{
          padding: '4px 10px', background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
          textTransform: 'uppercase', fontWeight: 600,
        }}>✦ Forge</button>
      </div>

      <QueuePanel domain="items" accent={PANEL_ACCENT.items} title="Items review queue" />

      {tab === 'bank' && (
        <BankView t={t} store={store} sel={sel} select={select} addItem={addItem} item={item} />
      )}
      {tab === 'forge' && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{
            fontFamily: t.display, fontSize: 14, color: t.ink2, fontStyle: 'italic',
            lineHeight: 1.5, marginBottom: 12,
          }}>
            Open the items master to forge a fully RPG-tailored item — affixes,
            sockets, granted skills, and a wiki origin. Missing stats / skills
            get auto-created.
          </div>
          <button onClick={() => setCraftOpen(true)} style={{
            padding: '10px 18px', background: t.accent, color: t.onAccent,
            border: 'none', borderRadius: 2, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
            textTransform: 'uppercase', fontWeight: 600,
          }}>✦ Open the Forge</button>
        </div>
      )}
      {tab === 'catalog' && <Catalog />}
      {tab === 'story' && (
        item ? (
          <EntityTimeline kind="item" id={item.id} />
        ) : (
          <div style={{
            padding: '14px 16px', fontFamily: t.display, fontSize: 13,
            color: t.ink3, fontStyle: 'italic',
          }}>Select an item to see its story log.</div>
        )
      )}

      <SpecialistChat domain="items" accent={PANEL_ACCENT.items} />

      {craftOpen && <CraftWizard onClose={() => setCraftOpen(false)} />}
    </PanelFrame>
  );
}

function BankView({ t, store, sel, select, addItem, item }) {
  const items = store.items || [];
  const [filterRarity, setFilterRarity] = React.useState('all');
  const filtered = filterRarity === 'all' ? items : items.filter(i => (i.rarity || 'common') === filterRarity);

  return (
    <>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          <button onClick={() => setFilterRarity('all')} style={chip(t, filterRarity === 'all')}>All</button>
          {RARITIES.map(r => (
            <button key={r} onClick={() => setFilterRarity(r)} style={chip(t, filterRarity === r, RARITY_COLOR[r])}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              padding: '20px 0', textAlign: 'center',
              fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
            }}>{filterRarity === 'all' ? 'Bank empty — open the Forge to mint your first item.' : 'No items at that rarity.'}</div>
          )}
          {filtered.map(it => (
            <div key={it.id}
              onClick={() => select('item', it.id)}
              draggable
              onDragStart={e => dragEntity(e, 'item', it.id)}
              style={{
                padding: '8px 10px',
                background: sel.item === it.id ? t.paper2 : 'transparent',
                border: `1px solid ${sel.item === it.id ? RARITY_COLOR[it.rarity] || t.accent : t.rule}`,
                borderLeft: `3px solid ${RARITY_COLOR[it.rarity] || t.rule}`,
                borderRadius: 2, cursor: 'grab',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
              <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: RARITY_COLOR[it.rarity] || t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{it.rarity || 'common'}{it.slot ? ' · ' + it.slot : ''}</div>
              {(it.affixes?.length || 0) + (it.sockets?.length || 0) > 0 && (
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1 }}>
                  {(it.affixes?.length || 0) > 0 && `${it.affixes.length} affix `}
                  {(it.sockets?.length || 0) > 0 && `${it.sockets.length} sock`}
                </div>
              )}
            </div>
          ))}
          <button onClick={addItem} style={{
            padding: '8px 10px', background: 'transparent',
            color: t.accent, border: `1px dashed ${t.accent}`,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
          }}>+ Empty</button>
        </div>
      </div>

      {item && <ItemDetail item={item} />}
    </>
  );
}

function ItemDetail({ item }) {
  const t = useTheme();
  const store = useStore();
  const owner = item.owner ? characterById(store, item.owner) : null;
  const total = itemTotalMods(item);
  const rw = activeRuneword(item);

  const update = (patch) => store.setSlice('items', is => is.map(x => x.id === item.id ? { ...x, ...patch } : x));

  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 10,
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{
        padding: 10, background: t.paper2, borderLeft: `3px solid ${RARITY_COLOR[item.rarity] || t.accent}`,
        borderRadius: 2, marginBottom: 10,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input value={item.icon || '◆'} onChange={e => update({ icon: e.target.value })}
            style={{ width: 36, height: 36, fontSize: 20, textAlign: 'center', background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, color: PANEL_ACCENT.items }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={item.name || ''} onChange={e => update({ name: e.target.value })}
              style={{ width: '100%', fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <select value={item.rarity || 'common'} onChange={e => update({ rarity: e.target.value })}
                style={{ ...selectStyle(t), color: RARITY_COLOR[item.rarity || 'common'] }}>
                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={item.slot || ''} onChange={e => update({ slot: e.target.value })}
                style={selectStyle(t)}>
                {SLOTS.map(s => <option key={s} value={s}>{s || '—'}</option>)}
              </select>
              <input type="number" min={0} step={0.1} placeholder="kg"
                value={item.weight ?? ''} onChange={e => update({ weight: parseFloat(e.target.value) || 0 })}
                style={{ ...selectStyle(t), width: 70 }} />
            </div>
          </div>
        </div>
        <textarea value={item.description || ''} onChange={e => update({ description: e.target.value })}
          rows={2} placeholder="Description"
          style={{
            width: '100%', marginTop: 8, padding: '6px 8px',
            fontFamily: t.display, fontSize: 12, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5,
            background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
          }} />
      </div>

      {/* Total contribution */}
      {Object.keys(total).length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={lbl}>Total contribution{rw ? ` · runeword: ${rw.name}` : ''}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {Object.entries(total).map(([k, v]) => (
              <span key={k} style={{
                padding: '2px 8px', background: t.paper2,
                border: `1px solid ${v > 0 ? t.good : v < 0 ? t.bad : t.rule}`,
                borderRadius: 999, fontFamily: t.mono, fontSize: 10,
                color: v > 0 ? t.good : v < 0 ? t.bad : t.ink2,
              }}>{k} {v > 0 ? '+' : ''}{v}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sockets */}
      <SocketEditor item={item} update={update} />

      {/* Affixes (display-only — affix selection is via the Forge) */}
      {(item.affixes?.length || 0) > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={lbl}>Affixes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {item.affixes.map((a, i) => (
              <span key={i} style={{
                padding: '2px 8px', background: t.paper2, border: `1px solid ${t.rule}`,
                borderRadius: 999, fontFamily: t.mono, fontSize: 10, color: t.ink2,
              }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {owner && (
        <div style={{ marginTop: 10 }}>
          <div style={lbl}>Owner</div>
          <button style={{
            padding: '4px 10px', background: 'transparent',
            border: `1px solid ${owner.color || t.accent}`, borderRadius: 1,
            fontFamily: t.display, fontSize: 12, color: t.ink, cursor: 'pointer',
          }}>{owner.name}</button>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
        }}>Image</div>
        <EntityImageButton
          entity={item}
          size={64}
          field="image"
          label="Item art"
          onSave={(url) => update({ image: url })}
        />
      </div>

      {item.draftedByLoom && (
        <div style={{
          marginTop: 12, padding: '6px 10px', background: PANEL_ACCENT.loom + '22',
          borderLeft: `2px solid ${PANEL_ACCENT.loom}`,
          fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase',
        }}>Drafted by the Loom</div>
      )}
    </div>
  );
}

function SocketEditor({ item, update }) {
  const t = useTheme();
  const sockets = item.sockets || [];
  if (sockets.length === 0) {
    return (
      <button onClick={() => update({ sockets: [{ id: 'sock_' + Date.now() }] })} style={{
        marginTop: 10, padding: '4px 10px', background: 'transparent',
        color: t.accent, border: `1px dashed ${t.accent}`, borderRadius: 1,
        fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer',
      }}>+ Add socket</button>
    );
  }
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
      }}>Sockets · {sockets.length}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {sockets.map((s, i) => (
          <div key={s.id || i} style={{
            width: 32, height: 32, borderRadius: 999,
            background: s.gemId || s.runeId ? t.paper : 'transparent',
            border: `2px solid ${s.gemId || s.runeId ? t.accent : t.rule}`,
            display: 'grid', placeItems: 'center',
            fontFamily: t.mono, fontSize: 10, color: t.ink2,
          }}>{s.runeId ? s.runeId.replace('rune_', '').toUpperCase() : (s.gemId ? '◆' : i + 1)}</div>
        ))}
        <button onClick={() => update({ sockets: [...sockets, { id: 'sock_' + Date.now() }] })}
          style={{
            width: 32, height: 32, borderRadius: 999,
            background: 'transparent', color: t.ink3,
            border: `1px dashed ${t.rule}`, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 16, lineHeight: 1, padding: 0,
          }}>+</button>
        {sockets.length > 0 && (
          <button onClick={() => update({ sockets: sockets.slice(0, -1) })}
            style={{
              width: 32, height: 32, borderRadius: 999,
              background: 'transparent', color: t.ink3,
              border: `1px dashed ${t.rule}`, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 16, lineHeight: 1, padding: 0,
            }}>−</button>
        )}
      </div>
    </div>
  );
}

function chip(t, on, color) {
  return {
    padding: '3px 8px',
    background: on ? (color || t.accent) : 'transparent',
    color: on ? t.onAccent : (color || t.ink2),
    border: `1px solid ${on ? (color || t.accent) : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
function selectStyle(t) {
  return {
    padding: '3px 6px',
    fontFamily: t.mono, fontSize: 10, color: t.ink2,
    background: t.paper, border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none',
  };
}
