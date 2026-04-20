/**
 * ItemsLibrary - every item / artefact / equipment in the world.
 *
 * Two sub-tabs:
 *   - Vault: the legacy EnhancedItemVault (rich detail panels, rarity chips).
 *   - Matrix: the whole-book inventory-over-chapters matrix (doc 14 v2).
 *
 * "Create New Item" on the Vault opens NewItemModal which writes through
 * db.add('itemBank') AND setWorldState, so cross-page reactivity is robust
 * even when the legacy vault uses its internal selection state.
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import WorkspaceMiniBrief from './_shared/WorkspaceMiniBrief';
import EnhancedItemVault from '../components/EnhancedItemVault';
import NewItemModal from './items/NewItemModal';
import InventoryMatrix from './cast/InventoryMatrix';

const TABS = [
  { id: 'vault',  label: 'Vault' },
  { id: 'matrix', label: 'Life matrix' },
];

export default function ItemsLibraryPage({ worldState, setWorldState }) {
  const t = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('vault');

  const items = worldState?.itemBank || [];
  const books = worldState?.books || {};

  return (
    <Page>
      <PageHeader
        eyebrow="Track"
        title="Items Library"
        subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        miniBrief={<WorkspaceMiniBrief surface="items_library" worldState={worldState} />}
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'vault' ? 0 : 24}>
        {tab === 'vault' && (
          <EnhancedItemVault
            items={items}
            books={books}
            onItemSelect={() => { /* selection is internal to the vault */ }}
            onCreateNew={() => setShowCreate(true)}
          />
        )}
        {tab === 'matrix' && (
          <InventoryMatrix worldState={worldState} setWorldState={setWorldState} />
        )}
      </PageBody>

      <NewItemModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        setWorldState={setWorldState}
      />
    </Page>
  );
}
