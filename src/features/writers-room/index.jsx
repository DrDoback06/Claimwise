// Loomwright — public entry. Wraps the shell in providers.

import React from 'react';
import { ThemeProvider } from './theme';
import { StoreProvider } from './store';
import { SelectionProvider } from './selection';
import Shell from './Shell';

export default function WritersRoom() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <SelectionProvider>
          <Shell />
        </SelectionProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
