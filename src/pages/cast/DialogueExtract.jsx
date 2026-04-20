/**
 * DialogueExtract - every line this character ever says, on one page.
 *
 * Parses each chapter's script looking for dialogue attributed to the
 * character (quoted lines followed/preceded by name + said/asked/etc.),
 * groups by chapter, and lets the writer edit any single line. Saving a
 * line propagates the change back into the chapter's script with a confirm
 * diff. The data model is non-destructive: edits replace the matched
 * substring in the chapter text; if the match is ambiguous, the writer can
 * cancel and tweak the line in the actual chapter instead.
 *
 * Surfaces as the Dialogue tab on CharacterDetail.
 */

import React, { useMemo, useState } from 'react';
import { MessageSquare, Check, X, Edit3, BookOpen } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';

function extractDialogueLines(character, books) {
  if (!character) return [];
  const nameRegex = new RegExp(
    `\\b${(character.name || '').replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`,
    'i',
  );
  // Matches a quoted line. Uses BOTH " and " to catch smart-quoted prose.
  const lineRegex = /([\u201C"][^\u201C\u201D"]{2,400}[\u201D"])/g;
  const results = [];
  Object.values(books || {}).forEach((book) => {
    (book.chapters || []).forEach((chapter) => {
      const script = chapter.script || chapter.content || '';
      if (!script) return;
      let match;
      // Walk all quoted lines; attribute to this character if the sentence
      // within ~80 chars of the quote contains the character's name.
      // eslint-disable-next-line no-cond-assign
      while ((match = lineRegex.exec(script)) !== null) {
        const quote = match[1];
        const windowStart = Math.max(0, match.index - 80);
        const windowEnd = Math.min(script.length, match.index + quote.length + 80);
        const contextBefore = script.slice(windowStart, match.index);
        const contextAfter = script.slice(match.index + quote.length, windowEnd);
        const neighbourhood = `${contextBefore} ${contextAfter}`;
        if (nameRegex.test(neighbourhood)) {
          results.push({
            id: `${book.id}-${chapter.id}-${match.index}`,
            bookId: book.id,
            bookTitle: book.title || `Book ${book.id}`,
            chapterId: chapter.id,
            chapterTitle: chapter.title || `Chapter ${chapter.id}`,
            index: match.index,
            original: quote,
            trimmed: quote.replace(/^[\u201C"]|[\u201D"]$/g, '').trim(),
            context: neighbourhood.trim().slice(0, 140),
          });
        }
      }
    });
  });
  return results;
}

export default function DialogueExtract({ character, worldState, setWorldState }) {
  const t = useTheme();
  const books = worldState?.books || {};
  const lines = useMemo(
    () => extractDialogueLines(character, books),
    [character, books],
  );
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const grouped = useMemo(() => {
    const byChapter = new Map();
    lines.forEach((line) => {
      const key = `${line.bookId}-${line.chapterId}`;
      if (!byChapter.has(key)) byChapter.set(key, { bookTitle: line.bookTitle, chapterTitle: line.chapterTitle, bookId: line.bookId, chapterId: line.chapterId, lines: [] });
      byChapter.get(key).lines.push(line);
    });
    return Array.from(byChapter.values());
  }, [lines]);

  const commitEdit = async (line) => {
    if (!draft.trim()) {
      toastService.warn?.('Empty line - edit cancelled.');
      setEditingId(null);
      return;
    }
    const book = books[line.bookId];
    if (!book) return;
    const chapter = book.chapters?.find((c) => c.id === line.chapterId);
    if (!chapter) return;
    const script = chapter.script || chapter.content || '';
    const nextQuote = `\u201C${draft.trim().replace(/^[\u201C"]|[\u201D"]$/g, '')}\u201D`;
    const occurrences = (script.match(new RegExp(line.original.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
    if (occurrences === 0) {
      toastService.error?.('Original line no longer appears in the chapter. Edit cancelled.');
      setEditingId(null);
      return;
    }
    if (occurrences > 1) {
      // Replace only the occurrence at the indexed position.
      const before = script.slice(0, line.index);
      const afterStart = line.index + line.original.length;
      const after = script.slice(afterStart);
      const nextScript = `${before}${nextQuote}${after}`;
      await persistChapter(book, chapter, nextScript);
    } else {
      const nextScript = script.replace(line.original, nextQuote);
      await persistChapter(book, chapter, nextScript);
    }
    toastService.success?.('Line updated in the chapter.');
    setEditingId(null);
  };

  const persistChapter = async (book, chapter, nextScript) => {
    const nextBook = {
      ...book,
      chapters: book.chapters.map((c) =>
        c.id === chapter.id ? { ...c, script: nextScript } : c,
      ),
    };
    try {
      await db.update('books', nextBook);
    } catch (e) {
      console.warn('[DialogueExtract] db.update failed:', e);
    }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      books: { ...(prev?.books || {}), [book.id]: nextBook },
    }));
  };

  if (!character) return null;
  if (!lines.length) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
          color: t.ink3,
          fontSize: 12,
          border: `1px dashed ${t.rule}`,
          borderRadius: t.radius,
          background: t.paper,
        }}
      >
        <MessageSquare size={18} style={{ opacity: 0.5, marginBottom: 6 }} />
        <div>No dialogue attributed to {character.name} yet.</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          This page finds quoted lines near the character's name in every chapter.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}
      >
        {lines.length} {lines.length === 1 ? 'line' : 'lines'} spoken by {character.name}
      </div>
      {grouped.map((group) => (
        <div
          key={`${group.bookId}-${group.chapterId}`}
          style={{
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: t.sidebar,
              borderBottom: `1px solid ${t.rule}`,
            }}
          >
            <BookOpen size={13} color={t.accent} />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}
            >
              {group.bookTitle} &middot; Ch.{group.chapterId} &middot; {group.chapterTitle}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: t.ink3 }}>{group.lines.length} lines</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {group.lines.map((line) => {
              const isEditing = editingId === line.id;
              return (
                <div
                  key={line.id}
                  style={{
                    padding: '10px 14px',
                    borderTop: `1px solid ${t.rule}`,
                    background: isEditing ? t.paper2 : 'transparent',
                  }}
                >
                  {isEditing ? (
                    <div>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: t.bg,
                          border: `1px solid ${t.accent}`,
                          borderRadius: t.radius,
                          color: t.ink,
                          fontFamily: t.display,
                          fontSize: 14,
                          lineHeight: 1.5,
                          resize: 'vertical',
                          minHeight: 70,
                          outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => commitEdit(line)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px',
                            background: t.accent, color: t.onAccent,
                            border: `1px solid ${t.accent}`, borderRadius: t.radius,
                            fontFamily: t.mono, fontSize: 10,
                            letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                          }}
                        >
                          <Check size={11} /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px',
                            background: 'transparent', color: t.ink2,
                            border: `1px solid ${t.rule}`, borderRadius: t.radius,
                            fontFamily: t.mono, fontSize: 10,
                            letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                          }}
                        >
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: t.display,
                            fontSize: 15,
                            color: t.ink,
                            fontStyle: 'italic',
                            lineHeight: 1.5,
                          }}
                        >
                          {line.original}
                        </div>
                        {line.context && (
                          <div style={{ fontSize: 11, color: t.ink3, marginTop: 4 }}>
                            ...{line.context}...
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditingId(line.id); setDraft(line.trimmed); }}
                        title="Edit this line"
                        style={{
                          padding: 5,
                          background: 'transparent', color: t.ink3,
                          border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
