// Loomwright — manuscript export. Produces several formats from the
// store's chapter data:
//   • txt         — plain ascii
//   • markdown    — generic markdown
//   • html        — single-file styled HTML
//   • epub        — JSZip-built ePub3 (works in Calibre / Kindle / RR)
//   • royalRoad   — per-chapter Markdown formatted for RR's editor
//   • amazonDoc   — HTML disguised as .doc (KDP accepts this without
//                   needing a real DOCX builder)
//
// Plus a marketing pack (Markdown blob) with: blurb, KDP description,
// Royal Road landing-page copy, and a Kickstarter / GoFundMe template.

import JSZip from 'jszip';
import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';

function chapters(store) {
  const order = store.book?.chapterOrder || [];
  return order.map(id => store.chapters?.[id]).filter(Boolean);
}

export function buildPlainText(store) {
  const ch = chapters(store);
  const title = store.book?.title || 'Untitled';
  const author = (store.authors || [])[0]?.name || 'Author';
  const out = [`${title}`, `by ${author}`, '', ''];
  for (const c of ch) {
    out.push(`Chapter ${c.n} — ${c.title || ''}`);
    out.push('');
    out.push(c.text || '');
    out.push('');
    out.push('');
  }
  return out.join('\n');
}

export function buildMarkdown(store) {
  const ch = chapters(store);
  const title = store.book?.title || 'Untitled';
  const author = (store.authors || [])[0]?.name || 'Author';
  const out = [`# ${title}`, '', `*by ${author}*`, ''];
  for (const c of ch) {
    out.push(`## Chapter ${c.n} — ${c.title || ''}`);
    out.push('');
    const paragraphs = (c.text || '').split(/\n\n+/);
    for (const p of paragraphs) { out.push(p.trim()); out.push(''); }
    out.push('');
  }
  return out.join('\n');
}

export function buildHTML(store) {
  const ch = chapters(store);
  const title = escapeHtml(store.book?.title || 'Untitled');
  const author = escapeHtml((store.authors || [])[0]?.name || 'Author');
  const body = ch.map(c => {
    const paras = (c.text || '').split(/\n\n+/).map(p =>
      `<p>${escapeHtml(p)}</p>`).join('\n');
    return `<section class="chapter"><h2>Chapter ${c.n} — ${escapeHtml(c.title || '')}</h2>\n${paras}\n</section>`;
  }).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 60px auto; line-height: 1.7; color: #222; padding: 0 20px; }
  h1 { font-size: 2em; }
  h2 { font-size: 1.4em; margin-top: 3em; border-bottom: 1px solid #ccc; padding-bottom: .3em; }
  p { margin: 0 0 1.2em; text-indent: 1.5em; }
  p:first-of-type { text-indent: 0; }
  .chapter { page-break-before: always; }
</style>
</head>
<body>
<h1>${title}</h1>
<p style="text-align:center;font-style:italic">by ${author}</p>
${body}
</body></html>`;
}

export function buildAmazonDoc(store) {
  // Reuses the HTML output; .doc extension makes Word / KDP accept it.
  return buildHTML(store);
}

// Per-chapter markdown for Royal Road's editor. RR uses *italic*, **bold**,
// blank-line-paragraphs, and ___ for scene breaks.
export function buildRoyalRoadChapters(store) {
  const ch = chapters(store);
  return ch.map(c => ({
    n: c.n,
    title: c.title || `Chapter ${c.n}`,
    body: (c.text || '').replace(/\n\s*\n+/g, '\n\n').replace(/\*\*\*/g, '___'),
  }));
}

export async function buildEpub(store) {
  const zip = new JSZip();
  const ch = chapters(store);
  const title = store.book?.title || 'Untitled';
  const author = (store.authors || [])[0]?.name || 'Author';
  const id = `urn:uuid:${cryptoRandomUUID()}`;

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.folder('META-INF').file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);

  const oebps = zip.folder('OEBPS');
  // Spine items.
  const items = ch.map((c, i) => ({
    id: `chap${i + 1}`,
    href: `chap${i + 1}.xhtml`,
    title: c.title || `Chapter ${c.n}`,
    body: (c.text || '').split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join('\n'),
  }));

  for (const it of items) {
    oebps.file(it.href, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head><title>${escapeHtml(it.title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h2>${escapeHtml(it.title)}</h2>${it.body}</body>
</html>`);
  }
  oebps.file('style.css', `
    body { font-family: Georgia, serif; line-height: 1.7; }
    h2 { margin-top: 2em; }
    p { margin: 0 0 1em; text-indent: 1.5em; }
    p:first-of-type { text-indent: 0; }
  `);

  const manifestItems = items.map(it =>
    `<item id="${it.id}" href="${it.href}" media-type="application/xhtml+xml"/>`
  ).join('\n  ') + '\n  <item id="css" href="style.css" media-type="text/css"/>'
   + '\n  <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>';
  const spineItems = items.map(it => `<itemref idref="${it.id}"/>`).join('\n  ');

  oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${id}</dc:identifier>
    <dc:title>${escapeHtml(title)}</dc:title>
    <dc:creator>${escapeHtml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
  ${manifestItems}
  </manifest>
  <spine>
  ${spineItems}
  </spine>
</package>`);

  oebps.file('nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body><nav epub:type="toc"><h1>Contents</h1><ol>
${items.map(it => `<li><a href="${it.href}">${escapeHtml(it.title)}</a></li>`).join('\n')}
</ol></nav></body></html>`);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  return blob;
}

// Marketing pack — uses AI when keys present; falls back to a templated
// stub otherwise. Returns a Markdown string the writer pastes into KDP /
// Royal Road / their fund-me page.
export async function buildMarketingPack(store) {
  const profile = store.profile || {};
  const title = store.book?.title || 'Untitled';
  const premise = profile.premise || '';
  const tone = (profile.tone || []).join(', ');
  const genres = (profile.genres || []).join(', ');

  const fallback = templatedMarketingPack({ title, premise, tone, genres });

  try {
    const sys = composeSystem({
      state: store,
      persona: 'You write punchy marketing copy for novels — book-jacket blurbs, KDP descriptions, Royal Road landing pages, crowdfunding page copy.',
      slice: ['cast', 'quests'],
    });
    const prompt = [
      `Write the following five Markdown sections for "${title}":`,
      '',
      `## Logline (1 sentence, hooky)`,
      `## Back-cover blurb (~120 words; ends on a question or stakes)`,
      `## Amazon KDP description (HTML allowed: <p>, <b>, <i>, <br>; ~250-350 words; opens with the hook)`,
      `## Royal Road landing copy (~200 words; chapter-by-chapter teaser tone; uses the genre tags: ${genres || 'fantasy'})`,
      `## Crowdfunding page (~300 words, with: pitch · who-you-are · stretch goals · tier rewards)`,
      ``,
      `Premise: ${premise || '(unknown)'}`,
      `Tone: ${tone || 'balanced'}`,
      `Genres: ${genres || 'literary'}`,
      ``,
      'Return only Markdown.',
    ].join('\n');
    const raw = await aiService.callAI(prompt, 'creative', sys);
    return String(raw || '').trim() || fallback;
  } catch {
    return fallback;
  }
}

function templatedMarketingPack({ title, premise, tone, genres }) {
  return [
    `# Marketing pack — ${title}`,
    '',
    '## Logline',
    `> ${premise ? premise.slice(0, 140) : 'A story worth telling.'}`,
    '',
    '## Back-cover blurb',
    premise || `${title} — a ${genres || 'novel'} of ${tone || 'depth'}. Tell the world what's at stake.`,
    '',
    '## Amazon KDP description',
    `<p><b>${title}</b> — ${genres ? `a ${genres} novel` : 'a novel'} that …</p><p>${premise || 'Add your hook here.'}</p>`,
    '',
    '## Royal Road landing copy',
    `Tags: ${genres || 'fantasy'}, ${tone || 'serial'}.`,
    '',
    premise || 'Your serial-friendly pitch goes here.',
    '',
    '## Crowdfunding page',
    `### The pitch`,
    premise || 'What you\'re making, and why now.',
    '',
    `### About the author`,
    `Tell readers who you are in 3-4 sentences.`,
    '',
    `### Stretch goals`,
    `- £x — cover art commissioned`,
    `- £y — audiobook recording`,
    `- £z — print run + signed copies`,
    '',
    `### Tiers`,
    `- £5 — eBook on release`,
    `- £15 — Signed paperback`,
    `- £40 — Name in the acknowledgements`,
  ].join('\n');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

function cryptoRandomUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper: trigger a browser download for any of the produced outputs.
export function downloadBlob(filename, blobOrString, mime = 'application/octet-stream') {
  const blob = typeof blobOrString === 'string'
    ? new Blob([blobOrString], { type: mime })
    : blobOrString;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
