import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CheckCircle, XCircle, Edit3, HelpCircle, ChevronDown, ChevronRight,
  AlertTriangle, Shield, Zap, Users, Briefcase, Clock, MapPin,
  BookOpen, Layers, Flag, X, RotateCcw, Check, ChevronUp,
  Filter, ArrowRight, Eye, GitBranch, Undo2, Ban, CheckSquare
} from 'lucide-react';
import narrativeReviewQueueService from '../services/narrativeReviewQueueService';
import confidencePolicyService, { BAND_META } from '../services/confidencePolicyService';

const DOMAIN_CONFIG = {
  character:     { icon: Users,        color: '#a855f7', label: 'Character' },
  item:          { icon: Briefcase,    color: '#f59e0b', label: 'Item' },
  skill:         { icon: Zap,          color: '#3b82f6', label: 'Skill' },
  relationship:  { icon: GitBranch,    color: '#ec4899', label: 'Relationship' },
  plot:          { icon: BookOpen,     color: '#22c55e', label: 'Plot/Quest' },
  timeline:      { icon: Clock,        color: '#06b6d4', label: 'Timeline' },
  location:      { icon: MapPin,       color: '#84cc16', label: 'Location' },
  lore:          { icon: Layers,       color: '#8b5cf6', label: 'World/Lore' },
  faction:       { icon: Flag,         color: '#f97316', label: 'Faction' },
  retro_impact:  { icon: AlertTriangle,color: '#ef4444', label: 'Retro Impact' },
  failure:       { icon: Shield,       color: '#6b7280', label: 'Failure' }
};

const OPERATION_COLORS = {
  create: '#22c55e', update: '#3b82f6', merge: '#f59e0b',
  rename: '#a855f7', delete: '#ef4444', conflict: '#ef4444'
};

const ITEM_HEIGHT = 88;
const BUFFER_COUNT = 5;

const NarrativeReviewQueue = ({ sessionId, chapterId, chapterNumber, onComplete, onClose, onUnresolvedChange, isRetroEdit }) => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBand, setFilterBand] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showSideBySide, setShowSideBySide] = useState(null);
  const [undoConfirm, setUndoConfirm] = useState(false);
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const loadData = useCallback(async () => {
    const all = await narrativeReviewQueueService.getSessionItems(sessionId);
    setItems(all);
    const sum = await narrativeReviewQueueService.getSessionSummary(sessionId);
    setSummary(sum);
    const unresolvedCount = all.filter(i => i.status === 'pending').length;
    if (onUnresolvedChange) onUnresolvedChange(unresolvedCount);
  }, [sessionId, onUnresolvedChange]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let f = items;
    if (filterDomain !== 'all') f = f.filter(i => i.domain === filterDomain);
    if (filterStatus !== 'all') f = f.filter(i => i.status === filterStatus);
    if (filterBand !== 'all') f = f.filter(i => i.confidenceBand === filterBand);
    return f;
  }, [items, filterDomain, filterStatus, filterBand]);

  // Windowed rendering
  const containerHeight = 520;
  const visibleStart = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_COUNT);
  const visibleEnd = Math.min(filtered.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_COUNT);
  const visibleItems = filtered.slice(visibleStart, visibleEnd);
  const totalHeight = filtered.length * ITEM_HEIGHT;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (editingItem) return;
      const item = filtered[selectedIndex];
      switch (e.key) {
        case 'j': setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); break;
        case 'k': setSelectedIndex(i => Math.max(i - 1, 0)); break;
        case 'a': if (item?.status === 'pending') resolveItem(item.id, 'accept'); break;
        case 'r': if (item?.status === 'pending') resolveItem(item.id, 'reject'); break;
        case 'e':
          if (item?.status === 'pending') {
            setEditingItem(item.id);
            setEditValue(JSON.stringify(item.suggestions?.proposedNode || {}, null, 2));
          }
          break;
        case 'Escape': setEditingItem(null); setShowSideBySide(null); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIndex, filtered, editingItem]);

  // Scroll selected into view
  useEffect(() => {
    if (scrollRef.current) {
      const itemTop = selectedIndex * ITEM_HEIGHT;
      const itemBottom = itemTop + ITEM_HEIGHT;
      const viewTop = scrollRef.current.scrollTop;
      const viewBottom = viewTop + containerHeight;
      if (itemTop < viewTop) scrollRef.current.scrollTop = itemTop;
      else if (itemBottom > viewBottom) scrollRef.current.scrollTop = itemBottom - containerHeight;
    }
  }, [selectedIndex]);

  const resolveItem = async (id, action, payload) => {
    await narrativeReviewQueueService.resolveItem(id, action, payload);
    await loadData();
  };

  const handleEditSubmit = async () => {
    try {
      const editedNode = JSON.parse(editValue);
      await resolveItem(editingItem, 'edit', { editedNode });
      setEditingItem(null);
    } catch { /* invalid JSON */ }
  };

  const handleBulk = async (mode) => {
    if (mode === 'undo_all') {
      if (!undoConfirm) { setUndoConfirm(true); return; }
      setUndoConfirm(false);
    }
    await narrativeReviewQueueService[
      mode === 'approve_all' ? 'approveAllForChapter' :
      mode === 'approve_edits' ? 'approveAllWithSuggestedEdits' :
      mode === 'deny_all' ? 'denyAllRemaining' :
      mode === 'undo_last' ? 'undoLast' : 'undoAll'
    ](mode === 'approve_all' ? chapterId : sessionId, mode === 'approve_all' ? sessionId : undefined);
    await loadData();
  };

  const canContinue = summary && summary.unresolvedCount === 0;

  const s = {
    container: { background: '#1a1a2e', color: '#eee', display: 'flex', flexDirection: 'column', height: '100%', position: 'absolute', inset: 0, zIndex: 60 },
    header: { padding: '12px 16px', borderBottom: '1px solid #2a2a4a', background: '#16213e' },
    title: { fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
    summaryBar: { display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px', background: '#0f1729', borderBottom: '1px solid #2a2a4a', fontSize: 11 },
    badge: (bg) => ({ padding: '2px 8px', borderRadius: 4, background: bg, fontSize: 10, fontWeight: 600 }),
    filterBar: { display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid #2a2a4a', fontSize: 11, flexWrap: 'wrap', alignItems: 'center' },
    select: { background: '#16213e', color: '#eee', border: '1px solid #2a2a4a', borderRadius: 4, padding: '3px 6px', fontSize: 11 },
    bulkBar: { display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid #2a2a4a', flexWrap: 'wrap' },
    bulkBtn: (bg) => ({ padding: '4px 10px', borderRadius: 4, background: bg, color: '#fff', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer' }),
    listContainer: { flex: 1, overflow: 'auto', position: 'relative' },
    item: (isSelected, isBlocking) => ({
      height: ITEM_HEIGHT - 4, margin: '2px 8px', padding: '8px 12px', borderRadius: 6,
      background: isSelected ? '#1e2d50' : '#16213e',
      border: `1px solid ${isBlocking ? '#ef4444' : isSelected ? '#3b82f6' : '#2a2a4a'}`,
      cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      transition: 'background 0.15s'
    }),
    domainBadge: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 6px', borderRadius: 3, background: color + '22', color, fontSize: 10, fontWeight: 600 }),
    opBadge: (color) => ({ padding: '1px 5px', borderRadius: 3, background: color + '22', color, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }),
    confBar: (color, pct) => ({ width: 60, height: 6, borderRadius: 3, background: '#2a2a4a', position: 'relative', overflow: 'hidden' }),
    confFill: (color, pct) => ({ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }),
    actionBtn: (bg) => ({ padding: '3px 8px', borderRadius: 3, background: bg, color: '#fff', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer' }),
    footer: { padding: '12px 16px', borderTop: '1px solid #2a2a4a', background: '#16213e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    continueBtn: (enabled) => ({ padding: '8px 20px', borderRadius: 6, background: enabled ? '#22c55e' : '#374151', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.5 }),
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#16213e', borderRadius: 8, padding: 16, width: '90%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', border: '1px solid #2a2a4a' }
  };

  const renderItem = (item, idx) => {
    const globalIdx = visibleStart + idx;
    const isSelected = globalIdx === selectedIndex;
    const dc = DOMAIN_CONFIG[item.domain] || DOMAIN_CONFIG.failure;
    const DomainIcon = dc.icon;
    const bandMeta = BAND_META[item.confidenceBand] || BAND_META.normal_review;
    const opColor = OPERATION_COLORS[item.operation] || '#6b7280';
    const pct = Math.round((item.confidence || 0) * 100);

    return (
      <div
        key={item.id}
        style={{ ...s.item(isSelected, item.blocking), position: 'absolute', top: globalIdx * ITEM_HEIGHT, left: 0, right: 0 }}
        onClick={() => setSelectedIndex(globalIdx)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <span style={s.domainBadge(dc.color)}><DomainIcon size={10} /> {dc.label}</span>
            <span style={s.opBadge(opColor)}>{item.operation}</span>
            {item.blocking && <span style={{ ...s.badge('#ef444433'), color: '#ef4444' }}>BLOCKING</span>}
            <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.targetEntityLabel || 'Unknown'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div title={`${pct}% — ${item.confidenceReason}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: bandMeta.color }}>{pct}%</span>
              <div style={s.confBar(bandMeta.color, pct)}>
                <div style={s.confFill(bandMeta.color, pct)} />
              </div>
            </div>
            {item.status !== 'pending' && (
              <span style={{
                ...s.badge(item.status === 'accepted' ? '#22c55e33' : item.status === 'rejected' ? '#ef444433' : '#3b82f633'),
                color: item.status === 'accepted' ? '#22c55e' : item.status === 'rejected' ? '#ef4444' : '#3b82f6'
              }}>{item.status}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {item.source?.snippet?.substring(0, 100) || item.confidenceReason || ''}
          </div>
          {item.status === 'pending' && (
            <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginLeft: 8 }}>
              <button style={s.actionBtn('#22c55e')} onClick={(e) => { e.stopPropagation(); resolveItem(item.id, 'accept'); }} title="Accept (a)">
                <Check size={10} />
              </button>
              <button style={s.actionBtn('#ef4444')} onClick={(e) => { e.stopPropagation(); resolveItem(item.id, 'reject'); }} title="Reject (r)">
                <X size={10} />
              </button>
              <button style={s.actionBtn('#3b82f6')} onClick={(e) => { e.stopPropagation(); setEditingItem(item.id); setEditValue(JSON.stringify(item.suggestions?.proposedNode || {}, null, 2)); }} title="Edit (e)">
                <Edit3 size={10} />
              </button>
              {item.disambiguationOptions && (
                <button style={s.actionBtn('#f59e0b')} onClick={(e) => { e.stopPropagation(); setShowSideBySide(item.id); }} title="Disambiguate (d)">
                  <HelpCircle size={10} />
                </button>
              )}
              {item.suggestions?.sideBySide && (
                <button style={s.actionBtn('#8b5cf6')} onClick={(e) => { e.stopPropagation(); setShowSideBySide(item.id); }} title="Compare">
                  <Eye size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={s.title}>
            <Shield size={18} style={{ color: '#e94560' }} />
            Canon Review Queue — Chapter {chapterNumber}
            {isRetroEdit && <span style={{ ...s.badge('#ef444433'), color: '#ef4444', fontSize: 11 }}>RETRO EDIT</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>
      </div>

      {/* Summary Bar */}
      {summary && (
        <div style={s.summaryBar}>
          <span>Total: <b>{summary.total}</b></span>
          <span style={s.badge('#22c55e22')}>Accepted: {summary.byStatus.accepted}</span>
          <span style={s.badge('#ef444422')}>Rejected: {summary.byStatus.rejected}</span>
          <span style={s.badge('#3b82f622')}>Pending: {summary.byStatus.pending}</span>
          <span style={{ marginLeft: 'auto' }} />
          {Object.entries(summary.byBand).filter(([,v]) => v > 0).map(([band, count]) => (
            <span key={band} style={{ ...s.badge(BAND_META[band]?.color + '22'), color: BAND_META[band]?.color }}>
              {band.replace('_', ' ')}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div style={s.filterBar}>
        <Filter size={12} style={{ color: '#94a3b8' }} />
        <select style={s.select} value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="all">All Domains</option>
          {Object.entries(DOMAIN_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="edited">Edited</option>
        </select>
        <select style={s.select} value={filterBand} onChange={e => setFilterBand(e.target.value)}>
          <option value="all">All Confidence</option>
          {Object.entries(BAND_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', color: '#64748b' }}>
          {filtered.length} items | j/k navigate, a=accept, r=reject, e=edit
        </span>
      </div>

      {/* Bulk Actions */}
      <div style={s.bulkBar}>
        <button style={s.bulkBtn('#22c55e')} onClick={() => handleBulk('approve_all')} title="Approve all pending for this chapter">
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CheckSquare size={10} /> Approve All</span>
        </button>
        <button style={s.bulkBtn('#3b82f6')} onClick={() => handleBulk('approve_edits')} title="Approve all with suggested edits applied">
          Approve + Edits
        </button>
        <button style={s.bulkBtn('#ef4444')} onClick={() => handleBulk('deny_all')} title="Deny all remaining pending items">
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Ban size={10} /> Deny All</span>
        </button>
        <button style={s.bulkBtn('#f59e0b')} onClick={() => handleBulk('undo_last')} title="Undo last action">
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Undo2 size={10} /> Undo Last</span>
        </button>
        <button
          style={s.bulkBtn(undoConfirm ? '#dc2626' : '#6b7280')}
          onClick={() => handleBulk('undo_all')}
          title={undoConfirm ? 'Click again to confirm undo all' : 'Undo all (double-click to confirm)'}
        >
          {undoConfirm ? 'Confirm Undo All?' : 'Undo All'}
        </button>
      </div>

      {/* Virtualized List */}
      <div ref={scrollRef} style={s.listContainer} onScroll={handleScroll}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((item, idx) => renderItem(item, idx))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            {items.length === 0 ? 'No extraction items found.' : 'No items match current filters.'}
          </div>
        )}
      </div>

      {/* Footer with Continue */}
      <div style={s.footer}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          {summary?.blockingCount > 0 && (
            <span style={{ color: '#ef4444' }}>{summary.blockingCount} blocking items must be resolved</span>
          )}
          {summary?.unresolvedCount > 0 && summary?.blockingCount === 0 && (
            <span>{summary.unresolvedCount} items remaining</span>
          )}
          {canContinue && <span style={{ color: '#22c55e' }}>All items resolved — ready to commit</span>}
        </div>
        <button
          style={s.continueBtn(canContinue)}
          disabled={!canContinue}
          onClick={onComplete}
        >
          Continue Writing →
        </button>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div style={s.overlay} onClick={() => setEditingItem(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700 }}>Edit Queue Item</span>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              style={{ width: '100%', height: 200, background: '#0f1729', color: '#eee', border: '1px solid #2a2a4a', borderRadius: 4, padding: 8, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button style={s.bulkBtn('#6b7280')} onClick={() => setEditingItem(null)}>Cancel</button>
              <button style={s.bulkBtn('#22c55e')} onClick={handleEditSubmit}>Save & Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side / Disambiguate Modal */}
      {showSideBySide && (() => {
        const item = items.find(i => i.id === showSideBySide);
        if (!item) return null;
        const hasSbs = item.suggestions?.sideBySide;
        const hasDisambig = item.disambiguationOptions;
        return (
          <div style={s.overlay} onClick={() => setShowSideBySide(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 700 }}>{hasDisambig ? 'Disambiguate' : 'Compare'}</span>
                <button onClick={() => setShowSideBySide(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              {hasSbs && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>ORIGINAL</div>
                    <pre style={{ background: '#0f1729', padding: 8, borderRadius: 4, fontSize: 10, overflow: 'auto', maxHeight: 300 }}>
                      {JSON.stringify(hasSbs.original, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>SUGGESTED</div>
                    <pre style={{ background: '#0f1729', padding: 8, borderRadius: 4, fontSize: 10, overflow: 'auto', maxHeight: 300 }}>
                      {JSON.stringify(hasSbs.suggested, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {hasDisambig && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.disambiguationOptions.map(opt => (
                    <button
                      key={opt.key}
                      style={{ ...s.bulkBtn('#16213e'), border: '1px solid #2a2a4a', textAlign: 'left', padding: '8px 12px' }}
                      onClick={() => { resolveItem(item.id, 'disambiguate', { selectedOption: opt }); setShowSideBySide(null); }}
                    >
                      <b>{opt.key})</b> {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {!hasDisambig && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <button style={s.bulkBtn('#ef4444')} onClick={() => { resolveItem(item.id, 'reject'); setShowSideBySide(null); }}>Reject</button>
                  <button style={s.bulkBtn('#22c55e')} onClick={() => { resolveItem(item.id, 'accept'); setShowSideBySide(null); }}>Accept</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default NarrativeReviewQueue;
