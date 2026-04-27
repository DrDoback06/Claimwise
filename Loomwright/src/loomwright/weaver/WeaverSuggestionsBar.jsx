/**
 * WeaverSuggestionsBar — shows Canon Weaver's accepted Chapter-level edits
 * sitting on the chapter (chapter.weaverSuggestions[]) and lets the writer
 * apply (before->after substitution into chapter.text) or dismiss each one.
 *
 * Mount inside the Writer's Room / chapter view. It's self-contained: give it
 * the current chapter, bookId, worldState setter, and it handles the rest.
 */

import React, { useState } from 'react';

function tryApplySubstitution(text, before, after) {
  if (!text || !before) return { ok: false, text };
  // Try exact match first.
  if (text.includes(before)) {
    return { ok: true, text: text.replace(before, after || '') };
  }
  // Try trimmed match (cheap fuzzy for "before" copy-paste drift).
  const trimmed = before.trim();
  if (trimmed && text.includes(trimmed)) {
    return { ok: true, text: text.replace(trimmed, (after || '').trim()) };
  }
  return { ok: false, text };
}

export default function WeaverSuggestionsBar({ chapter, bookId, setWorldState }) {
  const [expanded, setExpanded] = useState(new Set());
  const suggestions = chapter?.weaverSuggestions || [];
  if (!suggestions.length) return null;

  const persist = (mutator) => {
    setWorldState((prev) => {
      const book = prev?.books?.[bookId];
      if (!book) return prev;
      const nextChapters = book.chapters.map((c) => (c.id === chapter.id ? mutator(c) : c));
      return {
        ...prev,
        books: { ...prev.books, [bookId]: { ...book, chapters: nextChapters } },
      };
    });
  };

  const accept = (sug) => {
    persist((c) => {
      const { ok, text } = tryApplySubstitution(c.text || '', sug.before, sug.after);
      const baseNote = { ...sug, acceptedAt: Date.now(), applied: ok };
      return {
        ...c,
        text: ok ? text : c.text,
        weaverSuggestions: (c.weaverSuggestions || []).filter((s) => s.id !== sug.id),
        weaverApplied: [...(c.weaverApplied || []), baseNote],
      };
    });
  };

  const reject = (sug) => {
    persist((c) => ({
      ...c,
      weaverSuggestions: (c.weaverSuggestions || []).filter((s) => s.id !== sug.id),
    }));
  };

  const toggleExpand = (id) => {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-4 mt-3 mb-2 rounded border border-amber-500/40 bg-amber-500/5">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/30">
        <span className="text-amber-400 text-xs font-mono tracking-widest uppercase">
          Canon Weaver
        </span>
        <span className="text-slate-400 text-xs">
          {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'} for this chapter
        </span>
      </div>
      <div className="divide-y divide-amber-500/20">
        {suggestions.map((sug) => {
          const isOpen = expanded.has(sug.id);
          return (
            <div key={sug.id} className="px-3 py-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">
                      {sug.intrusion ? `intrusion: ${sug.intrusion}` : 'suggestion'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {sug.source === 'canon-weaver' ? 'via Canon Weaver' : sug.source || ''}
                    </span>
                  </div>
                  {sug.reasoning && (
                    <div className="text-xs text-slate-300 leading-snug mt-1">{sug.reasoning}</div>
                  )}
                  {isOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-[12px]">
                      <div className="rounded bg-slate-900/70 border border-slate-700 p-2">
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Before</div>
                        <div className="text-slate-300 whitespace-pre-wrap">{sug.before || <em>(empty)</em>}</div>
                      </div>
                      <div className="rounded bg-slate-900/70 border border-amber-500/40 p-2">
                        <div className="text-[10px] font-mono text-amber-400 uppercase mb-1">After</div>
                        <div className="text-slate-100 whitespace-pre-wrap">{sug.after || <em>(empty)</em>}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(sug.id)}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    {isOpen ? 'Hide' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => accept(sug)}
                    className="text-[10px] px-2 py-1 rounded bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400"
                    title="Apply the before \u2192 after substitution to the chapter text"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(sug)}
                    className="text-[10px] px-2 py-1 rounded bg-transparent border border-slate-700 text-slate-400 hover:bg-slate-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
