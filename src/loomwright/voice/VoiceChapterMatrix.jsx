/**
 * VoiceChapterMatrix - grid of chapters x voice profiles. Click a cell
 * to assign that profile to that chapter; default profile is coloured
 * distinct. Writes through setWorldState so the Voice Drift banner on
 * the Writer's Room picks up the assignment immediately.
 */

import React from 'react';
import { useTheme } from '../theme';
import db from '../../services/database';
import toastService from '../../services/toastService';

export default function VoiceChapterMatrix({ worldState, setWorldState }) {
  const t = useTheme();
  const books = Object.values(worldState?.books || {});
  const profiles = worldState?.voiceProfiles || [];

  if (!books.length || !profiles.length) {
    return (
      <div
        style={{
          padding: 20,
          background: t.paper,
          border: `1px dashed ${t.rule}`,
          borderRadius: t.radius,
          color: t.ink3,
          fontSize: 12,
        }}
      >
        Create at least one voice profile and add chapters to assign voice
        profiles chapter by chapter.
      </div>
    );
  }

  const assign = async (book, chapter, profileId) => {
    const next = {
      ...book,
      chapters: book.chapters.map((c) =>
        Number(c.id) === Number(chapter.id) ? { ...c, voiceProfileId: profileId } : c,
      ),
    };
    try { await db.update('books', next); } catch (_e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      books: { ...(prev?.books || {}), [book.id]: next },
    }));
    toastService.success?.(`Chapter ${chapter.id} assigned to ${profiles.find((p) => p.id === profileId)?.name || 'profile'}.`);
  };

  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.14, textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Per-chapter voice assignment
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontFamily: t.mono, fontSize: 10, color: t.ink3,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                  borderBottom: `1px solid ${t.rule}`,
                }}
              >
                Chapter
              </th>
              {profiles.map((p) => (
                <th
                  key={p.id}
                  style={{
                    padding: '6px 8px',
                    fontFamily: t.mono, fontSize: 9, color: t.ink3,
                    letterSpacing: 0.1, textTransform: 'uppercase',
                    borderBottom: `1px solid ${t.rule}`,
                  }}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              (book.chapters || []).map((chapter) => (
                <tr key={`${book.id}-${chapter.id}`}>
                  <td
                    style={{
                      padding: '6px 10px',
                      borderBottom: `1px solid ${t.rule}`,
                      color: t.ink, fontSize: 12,
                    }}
                  >
                    {book.title || `Book ${book.id}`} &middot; Ch.{chapter.id}
                    {chapter.title ? ` \u2014 ${chapter.title}` : ''}
                  </td>
                  {profiles.map((p) => {
                    const active = chapter.voiceProfileId === p.id || (!chapter.voiceProfileId && p.isDefault);
                    return (
                      <td
                        key={p.id}
                        style={{
                          padding: '3px 6px',
                          borderBottom: `1px solid ${t.rule}`,
                          textAlign: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => assign(book, chapter, p.id)}
                          style={{
                            width: 18, height: 18,
                            padding: 0,
                            background: active ? t.accent : 'transparent',
                            border: `1px solid ${active ? t.accent : t.rule}`,
                            borderRadius: t.radius,
                            cursor: 'pointer',
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
