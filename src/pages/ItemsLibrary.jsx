/**
 * ItemsLibrary — every item / artifact / equipment in the world.
 *
 * Wraps EnhancedItemVault (the richest legacy item surface). Clicking an item
 * opens its editor through the same inline flow the legacy app used.
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody } from './_shared/PageChrome';
import EnhancedItemVault from '../components/EnhancedItemVault';

export default function ItemsLibraryPage({ worldState, setWorldState }) {
  const t = useTheme();
  const [selectedItem, setSelectedItem] = useState(null);

  const items = worldState?.itemBank || [];
  const books = worldState?.books || {};

  return (
    <Page>
      <PageHeader
        eyebrow="Track"
        title="Items Library"
        subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
      />
      <PageBody padding={0}>
        <EnhancedItemVault
          items={items}
          books={books}
          onItemSelect={(item) => setSelectedItem(item)}
          onCreateNew={() => setSelectedItem({ isNew: true })}
        />
      </PageBody>
    </Page>
  );
}
