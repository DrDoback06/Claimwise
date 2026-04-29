/**
 * Design & Docs — links to the source design HTMLs (copied into public/).
 * Loads each doc in an iframe inside the shell when selected.
 */

import React, { useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';

const DOCS = [
  {
    id: 'ia-spec',
    title: 'IA Spec & Audit',
    subtitle: 'Information architecture rationale and decision log',
    href: '/loomwright-docs/ia-spec.html',
    icon: 'book',
  },
  {
    id: 'ia-diagram',
    title: 'IA Diagram',
    subtitle: 'Current vs proposed information architecture diagram',
    href: '/loomwright-docs/ia-diagram.html',
    icon: 'layers',
  },
  {
    id: 'aesthetic',
    title: 'Aesthetic Directions',
    subtitle: 'Three visual directions on a Figma-style canvas',
    href: '/loomwright-docs/aesthetic-directions.html',
    icon: 'sparkle',
  },
  {
    id: 'roadmap',
    title: 'Enhancement Roadmap',
    subtitle: 'Flagship pitches and per-area enhancement notes',
    href: '/loomwright-docs/enhancement-roadmap.html',
    icon: 'flag',
  },
];

function DocCard({ doc, onOpen }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={() => onOpen(doc)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 16,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        textAlign: 'left',
        cursor: 'pointer',
        color: t.ink,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={doc.icon} size={14} color={t.accent} />
        <span style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          Document
        </span>
      </div>
      <div style={{ fontFamily: t.display, fontSize: 18, fontWeight: 500 }}>{doc.title}</div>
      <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.6 }}>{doc.subtitle}</div>
    </button>
  );
}

function DocsBody() {
  const t = useTheme();
  const [open, setOpen] = useState(null);
  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
            Loomwright
          </div>
          <div style={{ fontFamily: t.display, fontSize: 24, fontWeight: 500, color: t.ink }}>
            Design & Docs
          </div>
        </div>
        {open && (
          <Button variant="ghost" onClick={() => setOpen(null)} icon={<Icon name="x" size={12} />}>
            Close viewer
          </Button>
        )}
        <ThemeToggle />
      </div>
      {open ? (
        <div
          style={{
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            overflow: 'hidden',
            height: 'calc(100vh - 180px)',
            minHeight: 480,
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              borderBottom: `1px solid ${t.rule}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: t.paper2,
            }}
          >
            <Icon name={open.icon} size={12} color={t.accent} />
            <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{open.title}</span>
            <div style={{ flex: 1 }} />
            <a
              href={open.href}
              target="_blank"
              rel="noreferrer"
              style={{
                color: t.accent,
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Open in new tab \u2197
            </a>
          </div>
          <iframe
            title={open.title}
            src={open.href}
            style={{
              width: '100%',
              height: 'calc(100% - 40px)',
              border: 'none',
              background: '#fff',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {DOCS.map((d) => (
            <DocCard key={d.id} doc={d} onOpen={setOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LoomwrightDocs() {
  return (
    <LoomwrightShell>
      <DocsBody />
    </LoomwrightShell>
  );
}
