// Loomwright — project (saga) switcher chip for the TopBar. Loads the
// projects list from IDB lazily; clicking opens a small popover with
// the full list + a "+ New saga" affordance + a rename pencil per row.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import {
  listProjects, createProject, renameProject, deleteProject,
  getCurrentProjectId, setCurrentProjectId,
} from './projects';

export default function ProjectSwitcher() {
  const t = useTheme();
  const store = useStore();
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const currentId = getCurrentProjectId();

  React.useEffect(() => {
    if (!open) return;
    listProjects().then(setProjects);
  }, [open]);

  const current = projects.find(p => p.id === currentId);
  const label = current?.name || (store.book?.title || 'Saga');

  const newSaga = async () => {
    const name = window.prompt('Name for the new saga:', 'New saga');
    if (!name) return;
    const id = await createProject(name);
    if (window.confirm(`Switch to "${name}" now? Unsaved drafts in the current saga are already persisted.`)) {
      setCurrentProjectId(id); // triggers reload
    } else {
      const list = await listProjects();
      setProjects(list);
    }
  };

  const rename = async (p) => {
    const next = window.prompt('Rename saga:', p.name);
    if (!next || next === p.name) { setEditingId(null); return; }
    await renameProject(p.id, next);
    setProjects(await listProjects());
    setEditingId(null);
  };

  const remove = async (p) => {
    if (p.id === 'default') { window.alert('The default saga cannot be deleted.'); return; }
    if (!window.confirm(`Delete "${p.name}"? Its IDB records remain on disk but become unreachable.`)) return;
    await deleteProject(p.id);
    setProjects(await listProjects());
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Switch saga / project"
        style={{
          padding: '3px 10px',
          background: 'transparent', color: t.ink2,
          border: `1px solid ${t.rule}`, borderRadius: 999, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: 999,
          background: PANEL_ACCENT.loom,
        }} />
        {label}
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2,
          boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
          minWidth: 240, padding: 4, zIndex: 4200,
        }}>
          {projects.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 8px', borderRadius: 1,
              background: p.id === currentId ? t.paper2 : 'transparent',
              borderLeft: `3px solid ${p.color || PANEL_ACCENT.loom}`,
            }}>
              <button onClick={() => { setOpen(false); setCurrentProjectId(p.id); }} style={{
                flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
                cursor: 'pointer', fontFamily: t.display, fontSize: 13, color: t.ink, padding: 0,
              }}>
                {p.name}
                {p.id === currentId && <span style={{
                  marginLeft: 6, fontFamily: t.mono, fontSize: 9, color: t.good || '#2a8',
                  letterSpacing: 0.14, textTransform: 'uppercase',
                }}>active</span>}
              </button>
              <button onClick={() => rename(p)} title="Rename" style={iconBtn(t)}>✎</button>
              {p.id !== 'default' && (
                <button onClick={() => remove(p)} title="Delete" style={iconBtn(t)}>×</button>
              )}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${t.rule}`, marginTop: 4, paddingTop: 4 }}>
            <button onClick={newSaga} style={{
              width: '100%', padding: '6px 8px', background: 'transparent',
              color: PANEL_ACCENT.loom, border: 'none', cursor: 'pointer',
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
              textAlign: 'left',
            }}>+ New saga</button>
          </div>
        </div>
      )}
    </div>
  );
}

function iconBtn(t) {
  return {
    padding: '0 6px', background: 'transparent', color: t.ink3,
    border: 'none', cursor: 'pointer',
    fontFamily: 'ui-monospace, monospace', fontSize: 11, lineHeight: 1,
  };
}
