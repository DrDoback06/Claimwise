/**
 * WeaverStashDrawer - right-pane list of AI-generated drafts pending review.
 *
 * Any surface that generates prose proposals (Canon Weaver chapter edits,
 * Chapter Templates, future Atlas suggestions) pushes into weaverStash
 * instead of dropping straight into the chapter. The author can preview,
 * edit, copy, bring over (= insert at cursor via the LW writer seek bus), or
 * discard each item.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../loomwright/theme';
import {
  Sparkles, FileText, Copy, Edit3, Trash2, ArrowDownToLine, CheckCircle, Pin,
} from 'lucide-react';
import {
  listStashItems, updateStashItem, markStashItem, deleteStashItem,
} from '../../services/weaverStashService';
import toastService from '../../services/toastService';

function sourceIcon(src) {
  if (src === 'template') return FileText;
  if (src === 'weaver') return Sparkles;
  return Sparkles;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

export default function WeaverStashDrawer({ bookId, chapterId }) {
  const t = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // id currently being edited
  const [editedContent, setEditedContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listStashItems({ bookId, chapterId });
      setItems(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].id);
    } finally { setLoading(false); }
  }, [bookId, chapterId, selectedId]);

  useEffect(() => { load(); }, [load]);

  // Reload when anything writes to the stash from elsewhere.
  useEffect(() => {
    const handler = (ev) => {
      if (ev?.detail?.storeName === 'weaverStash') load();
    };
    window.addEventListener('loomwright:db-change', handler);
    return () => window.removeEventListener('loomwright:db-change', handler);
  }, [load]);

  const active = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  const visible = useMemo(
    () => items.filter((i) => i.status !== 'discarded'),
    [items]
  );

  const handleBringOver = async (item) => {
    // WriterSeekRegistrar listens for `loomwright:insert-at-cursor` custom
    // events. Dispatch the stash content and mark the item brought-over.
    try {
      window.dispatchEvent(new CustomEvent('loomwright:insert-at-cursor', {
        detail: { text: item.content, source: item.source || 'stash' },
      }));
      await markStashItem(item.id, 'brought-over');
      toastService.success('Brought over to the editor.');
      await load();
    } catch (err) {
      console.error('[WeaverStash] bring over failed:', err);
      toastService.error(`Bring over failed: ${err?.message || 'unknown error'}`);
    }
  };

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      toastService.success('Copied to clipboard.');
    } catch (_e) {
      toastService.error('Could not copy to clipboard.');
    }
  };

  const handleDiscard = async (item) => {
    if (!window.confirm(`Discard "${item.title}"?`)) return;
    try {
      await deleteStashItem(item.id);
      toastService.info('Stash item discarded.');
      if (selectedId === item.id) setSelectedId(null);
      await load();
    } catch (err) {
      console.error('[WeaverStash] discard failed:', err);
    }
  };

  const beginEdit = (item) => {
    setEditing(item.id);
    setEditedContent(item.content || '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateStashItem(editing, { content: editedContent, status: 'edited' });
      toastService.success('Draft updated.');
      setEditing(null);
      await load();
    } catch (err) {
      console.error('[WeaverStash] save edit failed:', err);
      toastService.error(`Could not save: ${err?.message || 'unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 18, color: t.ink2, fontFamily: t.mono, fontSize: 12 }}>
        Loading stash&hellip;
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          fontSize: 13,
          color: t.ink2,
          fontFamily: t.sans,
          lineHeight: 1.6,
        }}
      >
        <div style={{ color: t.ink, fontFamily: t.display, fontSize: 14, marginBottom: 8 }}>
          Weaver Stash is empty
        </div>
        <div>
          Anything Canon Weaver proposes, and any chapter template you let the AI fill in,
          will land here first. You can edit it, preview it, and bring it into the chapter
          only when you&rsquo;re happy.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
        {/* Left: list */}
        <div
          style={{
            width: 260, flexShrink: 0,
            borderRight: `1px solid ${t.rule}`,
            overflow: 'auto', background: t.paper,
          }}
        >
          {visible.map((item) => {
            const Icon = sourceIcon(item.source);
            const isActive = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  width: '100%', padding: '10px 14px',
                  background: isActive ? t.accentSoft : 'transparent',
                  borderBottom: `1px solid ${t.rule}`,
                  border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: isActive ? `3px solid ${t.accent}` : '3px solid transparent',
                }}
              >
                <Icon size={14} style={{ color: t.accent, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: t.display, fontSize: 13, color: t.ink,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 9, color: t.ink3,
                      marginTop: 2, letterSpacing: 0.12, textTransform: 'uppercase',
                    }}
                  >
                    {item.source} &middot; {timeAgo(item.createdAt)}
                    {item.status && item.status !== 'proposed' ? ` \u00b7 ${item.status}` : ''}
                  </div>
                </div>
                {item.status === 'brought-over' ? (
                  <CheckCircle size={12} style={{ color: t.accent, marginTop: 2 }} />
                ) : item.status === 'edited' ? (
                  <Pin size={12} style={{ color: t.accent, marginTop: 2 }} />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Right: preview / editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {active ? (
            <>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 14px',
                  borderBottom: `1px solid ${t.rule}`,
                  background: t.sidebar,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500,
                  }}
                >
                  {active.title}
                </div>
                {editing === active.id ? (
                  <>
                    <button type="button" onClick={saveEdit} style={btn(t, true)}>Save</button>
                    <button
                      type="button"
                      onClick={() => { setEditing(null); setEditedContent(''); }}
                      style={btn(t)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => beginEdit(active)} style={btn(t)}>
                      <Edit3 size={11} /> Edit
                    </button>
                    <button type="button" onClick={() => handleCopy(active)} style={btn(t)}>
                      <Copy size={11} /> Copy
                    </button>
                    <button type="button" onClick={() => handleBringOver(active)} style={btn(t, true)}>
                      <ArrowDownToLine size={11} /> Bring over
                    </button>
                    <button type="button" onClick={() => handleDiscard(active)} style={btn(t)}>
                      <Trash2 size={11} /> Discard
                    </button>
                  </>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 16, background: t.bg }}>
                {editing === active.id ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    style={{
                      width: '100%', height: '100%',
                      minHeight: 240,
                      background: t.paper,
                      color: t.ink,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                      padding: 12,
                      fontFamily: t.serif || t.sans,
                      fontSize: 14, lineHeight: 1.6,
                      resize: 'none',
                    }}
                  />
                ) : (
                  <article
                    style={{
                      color: t.ink, fontSize: 14, lineHeight: 1.7,
                      fontFamily: t.serif || t.sans,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {active.content || '(empty)'}
                  </article>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: 20, color: t.ink2, fontSize: 13 }}>
              Select a stash item to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function btn(t, active = false) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 8px',
    background: active ? t.accentSoft : 'transparent',
    color: active ? t.ink : t.ink2,
    border: `1px solid ${active ? t.accent : t.rule}`,
    borderRadius: t.radius,
    cursor: 'pointer',
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase',
  };
}
