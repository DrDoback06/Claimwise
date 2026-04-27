// Loomwright — file importers (plan §19). DOCX/PDF/TXT/MD/ZIP → paragraph arrays.

import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure pdfjs worker for CRA: serve the worker from /public/ so it
// always matches the installed pdfjs-dist version. The cdnjs CDN doesn't
// host every pdf.js patch release, so version-pinned CDN URLs 404.
if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.mjs`;
  } catch {}
}

function rid(prefix = 'p') { return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`; }

function paragraphsFromText(text) {
  return (text || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(t => ({ id: rid('p'), text: t, state: 'written' }));
}

function htmlToText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || '';
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

export async function importTxt(file) {
  const text = await file.text();
  return paragraphsFromText(text);
}

export async function importMarkdown(file) {
  // We don't render markdown — we just preserve paragraphs and let writer keep formatting.
  const text = await file.text();
  return paragraphsFromText(text);
}

export async function importDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const text = htmlToText(result.value || '');
  return paragraphsFromText(text);
}

export async function importPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    // Environments that block worker/CDN scripts can fail with "reading then disappear".
    pdf = await pdfjs.getDocument({ data: arrayBuffer, disableWorker: true }).promise;
  }
  const all = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const lines = [];
    let cur = '';
    for (const item of tc.items) {
      const s = item.str;
      if (item.hasEOL) { lines.push((cur + ' ' + s).trim()); cur = ''; }
      else cur += ' ' + s;
    }
    if (cur.trim()) lines.push(cur.trim());
    all.push(lines.join('\n'));
  }
  // Heuristic paragraph-rejoin: short lines that don't end with punctuation are joined.
  const joined = all.join('\n\n').replace(/([^.!?])\n([a-z])/g, '$1 $2');
  return paragraphsFromText(joined);
}

export async function importZip(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const out = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const lower = name.toLowerCase();
    let paragraphs = [];
    try {
      if (lower.endsWith('.docx')) {
        const ab = await entry.async('arraybuffer');
        const r = await mammoth.convertToHtml({ arrayBuffer: ab });
        paragraphs = paragraphsFromText(htmlToText(r.value || ''));
      } else if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.markdown')) {
        const text = await entry.async('string');
        paragraphs = paragraphsFromText(text);
      } else if (lower.endsWith('.pdf')) {
        const ab = await entry.async('arraybuffer');
        let pdf;
        try {
          pdf = await pdfjs.getDocument({ data: ab }).promise;
        } catch {
          pdf = await pdfjs.getDocument({ data: ab, disableWorker: true }).promise;
        }
        const all = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          all.push(tc.items.map(it => it.str).join(' '));
        }
        paragraphs = paragraphsFromText(all.join('\n\n'));
      } else {
        continue;
      }
    } catch (e) {
      console.warn('[lw-zip] failed to import', name, e?.message);
      continue;
    }
    if (paragraphs.length) out.push({ name, paragraphs });
  }
  return out;
}

export async function importFile(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.docx')) return { kind: 'document', paragraphs: await importDocx(file) };
  if (lower.endsWith('.pdf'))  return { kind: 'document', paragraphs: await importPdf(file) };
  if (lower.endsWith('.txt'))  return { kind: 'document', paragraphs: await importTxt(file) };
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return { kind: 'document', paragraphs: await importMarkdown(file) };
  if (lower.endsWith('.zip'))  return { kind: 'archive',  documents: await importZip(file) };
  throw new Error(`Unsupported file: ${file.name}`);
}
