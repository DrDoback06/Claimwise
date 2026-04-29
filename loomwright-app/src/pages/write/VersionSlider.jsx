/**
 * VersionSlider - chapter version time-scrubber for the Writer's Room.
 *
 * Pulls per-chapter snapshots from the `snapshots` IndexedDB store
 * (already provisioned in DB v20) and presents them on a horizontal
 * ribbon. Scrub across revisions, diff any two with a side-by-side view,
 * restore any past version inline. Sits as a collapsible strip above the
 * editor so it never steals focus when not in use.
 *
 * Snapshot shape (legacy + new):
 *   { id, bookId, chapterId, script, timestamp, note? }
 */

import React, { useEffect, useMemo, useState } from 'react';
import { GitBranch, Clock, RotateCcw, ArrowLeftRight, X } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';

function relTime(ts) {
  if (!ts) return 'unknown';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function tokenise(script) {
  return (script || '').split(/(\s+)/);
}

function diffTokens(a, b) {
  // Longest-common-subsequence based token diff. Fast enough for chapter
  // length text and avoids an npm dep.
  const A = tokenise(a);
  const B = tokenise(b);
  const m = A.length;
  const n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (A[i - 1] === B[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out = [];
  let i = m; let j = n;
  while (i > 0 && j > 0) {
    if (A[i - 1] === B[j - 1]) { out.unshift({ op: 'eq', tok: A[i - 1] }); i -= 1; j -= 1; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) { out.unshift({ op: 'del', tok: A[i - 1] }); i -= 1; }
    else { out.unshift({ op: 'add', tok: B[j - 1] }); j -= 1; }
  }
  while (i > 0) { out.unshift({ op: 'del', tok: A[i - 1] }); i -= 1; }
  while (j > 0) { out.unshift({ op: 'add', tok: B[j - 1] }); j -= 1; }
  return out;
}

export default function VersionSlider({ bookId, chapterId, worldState, setWorldState }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [compareIdx, setCompareIdx] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const all = await db.getAll('snapshots').catch(() => []);
        const scoped = (all || [])
          .filter((s) => s.bookId === bookId && Number(s.chapterId) === Number(chapterId) && s.script)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setSnapshots(scoped);
        setSelectedIdx(Math.max(0, scoped.length - 1));
      } catch (e) {
        console.warn('[VersionSlider] load failed', e);
        setSnapshots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, bookId, chapterId]);

  const selected = snapshots[selectedIdx] || null;
  const compare = compareIdx != null ? snapshots[compareIdx] : null;

  const diff = useMemo(
    () => (selected && compare ? diffTokens(compare.script, selected.script) : null),
    [selected, compare],
  );

  const restore = async () => {
    if (!selected) return;
    if (!window.confirm(`Restore chapter to the version from ${new Date(selected.timestamp || Date.now()).toLocaleString()}?`)) return;
    const books = worldState?.books || {};
    const book = books[bookId];
    if (!book) { toastService.error?.('Book not found.'); return; }
    const nextBook = {
      ...book,
      chapters: book.chapters.map((c) =>
        Number(c.id) === Number(chapterId) ? { ...c, script: selected.script } : c,
      ),
    };
    try { await db.update('books', nextBook); } catch (_e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      books: { ...(prev?.books || {}), [book.id]: nextBook },
    }));
    toastService.success?.('Chapter restored. Reopen to see the change.');
    setOpen(false);
  };

  if (!open) {
    return (
      <div
        style={{
          padding: '6px 14px',
          borderBottom: `1px solid ${t.rule}`,
          background: t.paper,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <GitBranch size={11} color={t.ink3} />
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
          Versions
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: '3px 10px',
            background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10,
            letterSpacing: 0.12, textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          title="Scrub past versions of this chapter"
        >
          Show
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        borderBottom: `1px solid ${t.rule}`,
        background: t.paper,
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GitBranch size={13} color={t.accent} />
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.18, textTransform: 'uppercase',
          }}
        >
          Versions {snapshots.length > 0 && `\u00b7 ${snapshots.length}`}
        </div>
        <div style={{ flex: 1 }} />
        {selected && (
          <button
            type="button"
            onClick={restore}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <RotateCcw size={10} /> Restore
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: 4,
            background: 'transparent', color: t.ink2,
            border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
          }}
        >
          <X size={11} />
        </button>
      </div>

      {loading ? (
        <div style={{ color: t.ink3, fontSize: 11 }}>Loading versions...</div>
      ) : snapshots.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 11 }}>
          No snapshots for this chapter yet. Snapshots are taken automatically on weave / save.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={11} color={t.ink3} />
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              style={{ flex: 1, accentColor: t.accent }}
            />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.ink2,
                letterSpacing: 0.14, minWidth: 100, textAlign: 'right',
              }}
            >
              {selected ? relTime(selected.timestamp) : '-'}
            </div>
            <button
              type="button"
              onClick={() => setCompareIdx((cur) => (cur == null ? 0 : null))}
              title="Diff against another version"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                background: compareIdx != null ? t.accentSoft : 'transparent',
                color: compareIdx != null ? t.ink : t.ink2,
                border: `1px solid ${compareIdx != null ? t.accent : t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <ArrowLeftRight size={10} /> Diff
            </button>
          </div>

          {compareIdx != null && snapshots[compareIdx] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>
                Compare to
              </span>
              <input
                type="range"
                min={0}
                max={snapshots.length - 1}
                value={compareIdx}
                onChange={(e) => setCompareIdx(Number(e.target.value))}
                style={{ flex: 1, accentColor: t.accent_2 || t.accent }}
              />
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.ink2,
                  letterSpacing: 0.14, minWidth: 100, textAlign: 'right',
                }}
              >
                {relTime(snapshots[compareIdx].timestamp)}
              </div>
            </div>
          )}

          {diff && (
            <div
              style={{
                maxHeight: 180,
                overflow: 'auto',
                padding: 10,
                background: t.bg,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.font,
                fontSize: 13,
                lineHeight: 1.55,
                color: t.ink,
              }}
            >
              {diff.map((chunk, i) => {
                if (chunk.op === 'eq') return <span key={i}>{chunk.tok}</span>;
                if (chunk.op === 'add') return (
                  <span key={i} style={{ background: 'rgba(111, 191, 124, 0.22)', color: t.ink }}>
                    {chunk.tok}
                  </span>
                );
                return (
                  <span key={i} style={{ background: 'rgba(199, 107, 90, 0.22)', color: t.ink, textDecoration: 'line-through' }}>
                    {chunk.tok}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
