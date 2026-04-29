/**
 * LoomwrightShell — top-level container for the redesign surfaces.
 * Provides the Loomwright theme, imports the Loomwright font stack, and
 * wraps children in a scoped flex container so the existing slate/tailwind
 * UI outside this shell is unaffected.
 */

import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from './theme';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';

function InjectFonts() {
  useEffect(() => {
    const id = 'lw-fonts';
    if (document.getElementById(id)) return undefined;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
    return () => {
      // don't remove — other loomwright mounts reuse it
    };
  }, []);
  return null;
}

function ShellBody({ children, scrollable = true, pad = true }) {
  const t = useTheme();
  return (
    <div
      className="loomwright-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100%',
        height: '100%',
        background: t.bg,
        color: t.ink,
        fontFamily: t.font,
        fontSize: 13,
        overflow: scrollable ? 'auto' : 'hidden',
        padding: pad ? 0 : 0,
      }}
    >
      {children}
    </div>
  );
}

export default function LoomwrightShell({ children, initial = 'night', scrollable = true, pad = true }) {
  return (
    <ThemeProvider initial={initial} scoped>
      <InjectFonts />
      <ShellBody scrollable={scrollable} pad={pad}>
        {children}
      </ShellBody>
    </ThemeProvider>
  );
}
