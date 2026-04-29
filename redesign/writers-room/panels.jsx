// writers-room/panels.jsx — Summoning Ring, Command Palette, Inline Weaver only.
// Panel components moved to panel-atlas/cast/threads/mindmap.jsx

function SummoningRing({ open, center, onClose, onPick }) {
  const t = useTheme();
  if (!open) return null;
  const items = [
    { k: 'atlas',    label: 'Atlas',   color: 'oklch(60% 0.10 145)', icon: 'map' },
    { k: 'cast',     label: 'Cast',    color: 'oklch(55% 0.10 220)', icon: 'users' },
    { k: 'voice',    label: 'Voice',   color: 'oklch(55% 0.15 45)',  icon: 'pen' },
    { k: 'threads',  label: 'Threads', color: 'oklch(62% 0.16 25)',  icon: 'flag' },
    { k: 'weaver',   label: 'Weave',   color: 'oklch(78% 0.13 78)',  icon: 'sparkle' },
    { k: 'mindmap',  label: 'Tangle',  color: 'oklch(58% 0.12 145)', icon: 'web' },
  ];
  const R = 88;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, animation: 'fadeIn 180ms' }}>
      <div style={{ position: 'absolute', left: center.x, top: center.y, transform: 'translate(-50%,-50%)', animation: 'ringPop 260ms cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ position: 'absolute', left: -24, top: -24, width: 48, height: 48, border: `1px solid ${t.accent}`, borderRadius: '50%', background: t.paper, display: 'grid', placeItems: 'center', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Here</div>
        {items.map((it, i) => {
          const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * R, y = Math.sin(angle) * R;
          return (
            <button key={it.k} onClick={(e) => { e.stopPropagation(); onPick(it.k); }} style={{
              position: 'absolute', left: x - 32, top: y - 32, width: 64, height: 64, borderRadius: '50%',
              background: t.paper, color: it.color, border: `1px solid ${it.color}`, cursor: 'pointer',
              display: 'grid', placeItems: 'center', fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
              boxShadow: `0 6px 20px ${it.color}33`,
            }}>
              <Icon name={it.icon} size={18} color={it.color} />
              <span style={{ marginTop: 3 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose, onRun }) {
  const t = useTheme();
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); else setQ(''); }, [open]);
  if (!open) return null;
  const filtered = WR.COMMANDS.filter(c => !q || c.label.toLowerCase().includes(q.toLowerCase()) || c.hint.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 300, animation: 'fadeIn 160ms', display: 'grid', placeItems: 'start center', paddingTop: '18vh' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 580, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 3, boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="sparkle" size={16} color={t.accent} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Ask the Loom…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: t.display, fontSize: 17, color: t.ink }} />
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>ESC to close</span>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 6 }}>
          {filtered.map(c => (
            <button key={c.k} onClick={() => { onRun(c.k); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Icon name={c.icon} size={15} color={t.ink3} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{c.label}</div>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 2 }}>{c.hint}</div>
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>↵</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Note: `InlineWeaver` used to live here as a stub with hardcoded demo
// proposals. The real Weaver — which calls `CW.integrationService.generatePreview`
// and writes through our store — is defined in `inline.jsx` (loaded after this
// file) and is what gets assigned to `window.InlineWeaver`.

window.SummoningRing = SummoningRing;
window.CommandPalette = CommandPalette;
