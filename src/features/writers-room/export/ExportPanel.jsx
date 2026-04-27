// Loomwright — manuscript & marketing export buttons.
// Lives in Settings; produces files via manuscriptExport.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import {
  buildPlainText, buildMarkdown, buildHTML, buildAmazonDoc,
  buildRoyalRoadChapters, buildEpub, buildMarketingPack, downloadBlob,
} from './manuscriptExport';

export default function ExportPanel() {
  const t = useTheme();
  const store = useStore();
  const [busy, setBusy] = React.useState(null);
  const [marketing, setMarketing] = React.useState('');

  const slug = (store.book?.title || 'manuscript').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'manuscript';

  const wrap = async (kind, fn) => {
    setBusy(kind);
    try { await fn(); }
    catch (err) { window.alert('Export failed: ' + (err?.message || err)); }
    finally { setBusy(null); }
  };

  const exportTxt   = () => wrap('txt',   () => downloadBlob(`${slug}.txt`, buildPlainText(store), 'text/plain'));
  const exportMd    = () => wrap('md',    () => downloadBlob(`${slug}.md`, buildMarkdown(store), 'text/markdown'));
  const exportHtml  = () => wrap('html',  () => downloadBlob(`${slug}.html`, buildHTML(store), 'text/html'));
  const exportDoc   = () => wrap('doc',   () => downloadBlob(`${slug}.doc`, buildAmazonDoc(store), 'application/msword'));
  const exportEpub  = () => wrap('epub',  async () => downloadBlob(`${slug}.epub`, await buildEpub(store), 'application/epub+zip'));
  const exportRr    = () => wrap('rr',    () => {
    const chapters = buildRoyalRoadChapters(store);
    const merged = chapters.map(c => `# Chapter ${c.n} — ${c.title}\n\n${c.body}\n\n---\n`).join('\n');
    downloadBlob(`${slug}-royalroad.md`, merged, 'text/markdown');
  });
  const exportMarketing = () => wrap('mk', async () => {
    const text = await buildMarketingPack(store);
    setMarketing(text);
    downloadBlob(`${slug}-marketing-pack.md`, text, 'text/markdown');
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginTop: 0 }}>
        Pull the manuscript into the format your destination wants. The
        marketing pack uses your AI provider to draft a logline, blurb,
        KDP description, Royal Road landing copy, and a crowdfunding page —
        all in one Markdown blob you can split.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <ExpBtn t={t} label=".txt — plain text"           onClick={exportTxt}   busy={busy === 'txt'} />
        <ExpBtn t={t} label=".md — Markdown"              onClick={exportMd}    busy={busy === 'md'} />
        <ExpBtn t={t} label=".html — single-file"         onClick={exportHtml}  busy={busy === 'html'} />
        <ExpBtn t={t} label=".doc — Amazon KDP"           onClick={exportDoc}   busy={busy === 'doc'} />
        <ExpBtn t={t} label=".epub — Kindle / Calibre"    onClick={exportEpub}  busy={busy === 'epub'} accent />
        <ExpBtn t={t} label="Royal Road .md — per-chapter" onClick={exportRr}    busy={busy === 'rr'} />
      </div>

      <div style={{ marginTop: 6 }}>
        <button onClick={exportMarketing} disabled={busy === 'mk'} style={{
          padding: '8px 14px', background: PANEL_ACCENT.loom, color: t.onAccent,
          border: 'none', borderRadius: 2, cursor: busy === 'mk' ? 'wait' : 'pointer',
          fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
          textTransform: 'uppercase', fontWeight: 600,
          opacity: busy === 'mk' ? 0.6 : 1,
        }}>{busy === 'mk' ? 'Drafting…' : '✨ Generate marketing pack'}</button>
      </div>

      {marketing && (
        <div style={{
          padding: 10, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
          maxHeight: 280, overflowY: 'auto',
          fontFamily: t.mono, fontSize: 11, color: t.ink2, lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}>{marketing}</div>
      )}
    </div>
  );
}

function ExpBtn({ t, label, onClick, busy, accent }) {
  return (
    <button onClick={onClick} disabled={busy} style={{
      padding: '6px 12px',
      background: accent ? (t.accent || '#7d6a5a') : 'transparent',
      color: accent ? t.onAccent : t.ink2,
      border: `1px solid ${accent ? (t.accent || '#7d6a5a') : t.rule}`,
      borderRadius: 1, cursor: busy ? 'wait' : 'pointer',
      fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
      textAlign: 'left',
      opacity: busy ? 0.6 : 1,
    }}>
      {busy ? '⌛ ' : ''}{label}
    </button>
  );
}
