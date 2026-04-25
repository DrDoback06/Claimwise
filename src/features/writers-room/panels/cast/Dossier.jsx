// Loomwright — Cast dossier with 8 tabs (plan §10).

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, clearDraftFlag } from '../../store';
import { useSelection } from '../../selection';
import {
  characterById, threadsForCharacter, itemsForCharacter, relationshipsForCharacter,
} from '../../store/selectors';
import CollapseSection from '../CollapseSection';
import IdentityTab from './tabs/Identity';
import StatsTab from './tabs/Stats';
import SkillsTab from './tabs/Skills';
import ItemsTab from './tabs/Items';
import RelationshipsTab from './tabs/Relationships';
import VoiceTab from './tabs/Voice';
import ArcsTab from './tabs/Arcs';
import AppearancesTab from './tabs/Appearances';

const TABS = [
  { id: 'identity', label: 'Identity', cmp: IdentityTab },
  { id: 'stats', label: 'Stats', cmp: StatsTab },
  { id: 'skills', label: 'Skills', cmp: SkillsTab },
  { id: 'items', label: 'Items', cmp: ItemsTab },
  { id: 'rels', label: 'Relationships', cmp: RelationshipsTab },
  { id: 'voice', label: 'Voice', cmp: VoiceTab },
  { id: 'arcs', label: 'Arcs', cmp: ArcsTab },
  { id: 'appears', label: 'Appearances', cmp: AppearancesTab },
];

export default function Dossier({ charId, onInterview, onWeave }) {
  const t = useTheme();
  const store = useStore();
  const c = characterById(store, charId);
  const tabPref = store.ui?.castDossierTab?.[charId] || 'identity';
  const [tab, setTab] = React.useState(tabPref);

  React.useEffect(() => {
    setTab(store.ui?.castDossierTab?.[charId] || 'identity');
  }, [charId, store.ui?.castDossierTab]);

  if (!c) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: t.ink3 }}>
        Pick a character above, or add a new one.
      </div>
    );
  }

  const onTabChange = (id) => {
    setTab(id);
    store.setPath(`ui.castDossierTab.${charId}`, id);
  };

  const updateChar = (patch) => {
    store.setSlice('cast', xs => xs.map(x => x.id === c.id ? { ...x, ...patch } : x));
    if (c.draftedByLoom) clearDraftFlag(store, 'character', c.id);
  };

  const TabCmp = TABS.find(x => x.id === tab)?.cmp || IdentityTab;

  return (
    <div>
      {/* "Drafted by the Loom" pill */}
      {c.draftedByLoom && (
        <div style={{
          margin: '8px 16px 0', padding: '6px 10px',
          background: PANEL_ACCENT.loom + '22',
          borderLeft: `2px solid ${PANEL_ACCENT.loom}`,
          fontFamily: t.mono, fontSize: 9, color: t.ink2,
          letterSpacing: 0.12, textTransform: 'uppercase',
        }}>Drafted by the Loom — confirm</div>
      )}

      {/* Header */}
      <div style={{
        padding: '16px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: c.color || t.accent, color: t.onAccent,
          display: 'grid', placeItems: 'center',
          fontFamily: t.display, fontWeight: 500, fontSize: 22, flexShrink: 0,
        }}>{(c.name || '?')[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={[c.role, c.age, c.pronouns].filter(Boolean).join(' · ') || c.role || 'support'}
            onChange={e => {
              const parts = e.target.value.split('·').map(s => s.trim()).filter(Boolean);
              updateChar({
                role: parts[0] || 'support',
                age: parts[1] || c.age,
                pronouns: parts[2] || c.pronouns,
              });
            }}
            style={{
              width: '100%', fontFamily: t.mono, fontSize: 9,
              color: c.color || t.accent, letterSpacing: 0.14, textTransform: 'uppercase',
              background: 'transparent', border: 'none', outline: 'none', padding: 0,
            }} />
          <input
            value={c.name || ''}
            onChange={e => updateChar({ name: e.target.value })}
            placeholder="Unnamed"
            style={{
              width: '100%', fontFamily: t.display, fontSize: 24, color: t.ink,
              fontWeight: 500, marginTop: 2, lineHeight: 1.1,
              background: 'transparent', border: 'none', outline: 'none', padding: 0,
            }} />
          <input
            value={c.oneliner || ''}
            onChange={e => updateChar({ oneliner: e.target.value })}
            placeholder="One-line description"
            style={{
              width: '100%', fontSize: 12, color: t.ink2, lineHeight: 1.5,
              fontStyle: 'italic', marginTop: 4,
              background: 'transparent', border: 'none', outline: 'none', padding: 0,
            }} />
        </div>
      </div>

      {/* Action row */}
      <div style={{
        padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <button onClick={onInterview} style={{
          padding: '7px 12px', background: c.color || t.accent, color: t.onAccent,
          border: 'none', borderRadius: 1,
          fontFamily: t.display, fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}>Interview</button>
        <button onClick={onWeave} style={{
          padding: '7px 12px', background: 'transparent',
          color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>✦ Weave</button>
      </div>

      {/* Tab strip */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 12px', borderBottom: `1px solid ${t.rule}`,
        overflowX: 'auto',
      }}>
        {TABS.map(x => (
          <button key={x.id} onClick={() => onTabChange(x.id)} style={{
            padding: '8px 10px', background: 'transparent',
            border: 'none', borderBottom: `2px solid ${tab === x.id ? (c.color || t.accent) : 'transparent'}`,
            color: tab === x.id ? t.ink : t.ink3,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>{x.label}</button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ animation: 'lw-tab-fade 200ms ease' }} key={tab}>
        <TabCmp character={c} update={updateChar} />
      </div>

      {c.notes && (
        <div style={{
          padding: '10px 16px 16px', borderTop: `1px solid ${t.rule}`,
          fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5,
        }}>{c.notes}</div>
      )}
    </div>
  );
}
