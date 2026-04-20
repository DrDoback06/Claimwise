/**
 * LoomwrightShell — top-level container for the redesign surfaces.
 *
 * Two modes:
 *   1. Standalone (default)     → owns its own ThemeProvider + font injection.
 *      Used when a Loomwright component is mounted at the top of an isolated tree
 *      (e.g. the prototype HTML docs, tests).
 *   2. Scoped (`scoped` prop)   → inherits the parent ThemeProvider, skips the
 *      inner theme context + shell body wrapping. Used by every Loomwright
 *      surface (CanonWeaver, LanguageWorkbench, AtlasAI, Voice, Daily, etc.)
 *      when rendered INSIDE the Loomwright app shell. This fixes HANDOFF §5.2
 *      and §5.20 — no more nested ThemeProvider stealing the theme toggle, no
 *      more duplicate scroll containers.
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
    return () => {};
  }, []);
  return null;
}

function ShellBody({ children, scrollable = true }) {
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
      }}
    >
      {children}
    </div>
  );
}

export default function LoomwrightShell({
  children,
  initial = 'night',
  scrollable = true,
  scoped = false,
}) {
  if (scoped) {
    // Bare mount: inherit parent ThemeProvider, skip shell wrapper entirely.
    // This is the path every in-app mount takes.
    return <>{children}</>;
  }
  return (
    <ThemeProvider initial={initial} scoped={false}>
      <InjectFonts />
      <ShellBody scrollable={scrollable}>{children}</ShellBody>
    </ThemeProvider>
  );
}
