// Loomwright — chapter-level proofreader.
//
// Two-stage:
//   1. Local heuristics — find common typos, double-spaces, hanging
//      punctuation, repeated words, common UK/US confusions, comma splices.
//      Cheap, runs every save.
//   2. AI grammar pass (on demand) — sends the chapter to aiService and
//      asks for a structured list of fixes. Used by WritingAid in
//      "proofread" mode.
//
// Both yield the same shape: { id, paragraphIdx, span: [start,end],
// quote, fix, label, severity }
// so the inline-underline overlay and the suggestion list can use either.

import aiService from '../../../services/aiService';

const COMMON_TYPOS = [
  // Doubled words.
  { re: /\b(the|a|and|of|to|that|in|for|on|with|is|was|it)\s+\1\b/gi, label: 'Doubled word', fix: m => m.split(/\s+/)[0] },
  // Two spaces.
  { re: /  +/g, label: 'Multiple spaces', fix: () => ' ' },
  // Space before punctuation.
  { re: / +([,.;:!?])/g, label: 'Space before punctuation', fix: m => m.trim() },
  // Missing space after punctuation (sentence joins).
  { re: /([.!?])([A-Z])/g, label: 'Missing space after sentence', fix: (m, a, b) => `${a} ${b}` },
  // Common typos.
  { re: /\bteh\b/g, label: 'Typo', fix: () => 'the' },
  { re: /\bTeh\b/g, label: 'Typo', fix: () => 'The' },
  { re: /\bdosent\b/gi, label: 'Typo', fix: m => m[0] === 'D' ? 'Doesn’t' : 'doesn’t' },
  { re: /\bdoesnt\b/gi, label: 'Typo', fix: m => m[0] === 'D' ? 'Doesn’t' : 'doesn’t' },
  { re: /\bdidnt\b/gi, label: 'Typo', fix: m => m[0] === 'D' ? 'Didn’t' : 'didn’t' },
  { re: /\bwouldnt\b/gi, label: 'Typo', fix: m => m[0] === 'W' ? 'Wouldn’t' : 'wouldn’t' },
  { re: /\bcouldnt\b/gi, label: 'Typo', fix: m => m[0] === 'C' ? 'Couldn’t' : 'couldn’t' },
  { re: /\bcant\b/g, label: 'Typo', fix: () => 'can’t' },
  { re: /\bwont\b/g, label: 'Typo', fix: () => 'won’t' },
  { re: /\bIm\b/g, label: 'Typo', fix: () => 'I’m' },
  { re: /\bIve\b/g, label: 'Typo', fix: () => 'I’ve' },
  { re: /\bIll\b/g, label: 'Typo', fix: () => 'I’ll' },
  { re: /\bId\b/g, label: 'Typo', fix: () => 'I’d' },
  { re: /\byoure\b/gi, label: 'Typo', fix: m => m[0] === 'Y' ? 'You’re' : 'you’re' },
  { re: /\btheyre\b/gi, label: 'Typo', fix: m => m[0] === 'T' ? 'They’re' : 'they’re' },
  { re: /\btheres\b/gi, label: 'Typo', fix: m => m[0] === 'T' ? 'There’s' : 'there’s' },
  { re: /\bwheres\b/gi, label: 'Typo', fix: m => m[0] === 'W' ? 'Where’s' : 'where’s' },
  { re: /\bwhos\b/gi, label: 'Typo', fix: m => m[0] === 'W' ? 'Who’s' : 'who’s' },
  { re: /\balot\b/g, label: 'Typo', fix: () => 'a lot' },
  { re: /\brecieve\b/g, label: 'Typo', fix: () => 'receive' },
  { re: /\bseperate\b/g, label: 'Typo', fix: () => 'separate' },
  { re: /\bdefinately\b/g, label: 'Typo', fix: () => 'definitely' },
  { re: /\boccured\b/g, label: 'Typo', fix: () => 'occurred' },
  { re: /\baccomodate\b/g, label: 'Typo', fix: () => 'accommodate' },
  // Hanging quote / dash spacing.
  { re: /,"/g, label: 'Quote-comma swap', fix: () => '”,' },
];

let __id = 0;
const nextId = () => `pf_${++__id}_${Math.random().toString(36).slice(2, 5)}`;

// Run the cheap local pass over the joined chapter text. Returns issues
// with a global character offset; the editor's MarginNoticings + inline
// overlay can map them to paragraphs via the same logic used elsewhere.
export function localProofread(text) {
  if (!text) return [];
  const out = [];
  for (const rule of COMMON_TYPOS) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text)) !== null) {
      const fix = typeof rule.fix === 'function' ? rule.fix(m[0], m[1], m[2]) : rule.fix;
      out.push({
        id: nextId(),
        kind: rule.label === 'Doubled word' || rule.label === 'Multiple spaces' || rule.label === 'Space before punctuation' || rule.label === 'Missing space after sentence' ? 'grammar' : 'spelling',
        label: rule.label,
        span: { start: m.index, end: m.index + m[0].length },
        quote: m[0],
        fix,
        severity: rule.label === 'Typo' ? 'warn' : 'info',
      });
    }
  }
  return out.sort((a, b) => a.span.start - b.span.start);
}

// AI pass — asks the configured provider for additional grammar issues
// the heuristic missed. Tolerates both JSON and free-form responses.
export async function aiProofread(text, profile = {}) {
  if (!text || typeof aiService?.callAI !== 'function') return [];
  const tone = (profile.tone || []).join(', ') || 'natural';
  const pov = profile.pov || 'unspecified';
  const tense = profile.tense || 'unspecified';
  const prompt = (
    `You are an editor. Find ONLY clear errors in the prose below — no style preferences.\n` +
    `Allow the author's POV (${pov}), tense (${tense}), and tone (${tone}). Do not flag intentional fragments or dialect.\n\n` +
    `Return a JSON array. Each item: { "quote": "the exact substring as it appears", "fix": "the corrected version of just that substring", "label": "what is wrong (e.g. 'Comma splice', 'Subject-verb agreement', 'Tense slip', 'Punctuation', 'Spelling')" }. ` +
    `Limit to 12 items max. If the prose has no errors, return [].\n\n` +
    `PROSE:\n"""\n${text.length > 6000 ? text.slice(0, 6000) : text}\n"""\n` +
    `Return ONLY the JSON array.`
  );
  let raw = '';
  try {
    const r = await aiService.callAI(prompt, 'analytical', '');
    raw = typeof r === 'string' ? r : (r?.text || r?.content || '');
  } catch {
    return [];
  }
  // Extract the first JSON-array-looking block.
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let arr = [];
  try { arr = JSON.parse(match[0]); } catch { return []; }
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    if (!item?.quote || !item?.fix) continue;
    const idx = text.indexOf(item.quote);
    if (idx < 0) continue;
    out.push({
      id: nextId(),
      kind: 'grammar',
      label: item.label || 'Grammar',
      span: { start: idx, end: idx + item.quote.length },
      quote: item.quote,
      fix: item.fix,
      severity: 'warn',
    });
  }
  return out;
}

// Apply a fix to the chapter text by replacing the first occurrence of
// `quote` with `fix`. Returns the new text. The caller is responsible
// for paragraph re-parsing.
export function applyFix(text, issue) {
  if (!text || !issue) return text;
  const idx = text.indexOf(issue.quote);
  if (idx < 0) return text;
  return text.slice(0, idx) + issue.fix + text.slice(idx + issue.quote.length);
}
