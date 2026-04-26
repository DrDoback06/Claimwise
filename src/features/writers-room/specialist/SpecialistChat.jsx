// Loomwright — reusable per-panel specialist chat.
// Mounts inside any panel as a collapsible bottom sheet. Each domain gets a
// distinct persona, a curated system context, and chat history persisted to
// `ui.specialistHistory[domain]`.
//
// When the specialist's reply contains entity-shaped JSON, a "Commit to canon"
// button appears so the writer can drop the result straight into the slice.
//
// Use: <SpecialistChat domain="items" panelId="inventory" />

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore, createCharacter, createPlace, createItem, createQuest } from '../store';
import { ask, extractJSON } from './service';
import { personaFor } from './personas';
import { ensureWikiEntry } from '../wiki/service';

function rid(prefix = 'm') { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6); }

export default function SpecialistChat({ domain, accent }) {
  const t = useTheme();
  const store = useStore();
  const persona = personaFor(domain);
  const messages = store.ui?.specialistHistory?.[domain] || [];
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages.length, busy]);

  const setHistory = (next) =>
    store.setPath(`ui.specialistHistory.${domain}`,
      typeof next === 'function' ? next(messages) : next);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    const userMsg = { id: rid(), role: 'user', text: trimmed, at: Date.now() };
    const nextHistory = [...messages, userMsg];
    setHistory(nextHistory);
    setInput('');
    setBusy(true);
    try {
      const reply = await ask({ domain, history: nextHistory, prompt: trimmed, store });
      setHistory(h => [...h, { id: rid(), role: 'specialist', text: reply, at: Date.now() }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
    if (e.key === 'Escape') setOpen(false);
  };

  const reset = () => setHistory([]);

  const accentColor = accent || PANEL_ACCENT.loom;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        margin: '8px 12px', padding: '7px 12px',
        background: 'transparent', color: accentColor,
        border: `1px dashed ${accentColor}`, borderRadius: 999,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        💬 Ask the {persona.label}
        {messages.length > 0 && (
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, marginLeft: 4 }}>
            · {messages.length} turn{messages.length === 1 ? '' : 's'}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={{
      margin: '8px 12px', display: 'flex', flexDirection: 'column',
      background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
      maxHeight: 420, animation: 'lw-card-in 200ms ease-out',
    }}>
      <div style={{
        padding: '8px 10px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 8,
        background: t.paper2,
      }}>
        <div style={{
          width: 4, alignSelf: 'stretch', background: accentColor, borderRadius: 1,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: accentColor,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>{persona.eyebrow}</div>
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500,
          }}>{persona.label}</div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} title="Clear history" style={iconBtn(t)}>↺</button>
        )}
        <button onClick={() => setOpen(false)} title="Close" style={iconBtn(t)}>×</button>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: 80, maxHeight: 280,
      }}>
        {messages.length === 0 && (
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink3,
            fontStyle: 'italic', lineHeight: 1.5, padding: '10px 4px',
          }}>
            Ask anything in scope. Try: "list the rare items", "make a legendary
            sword that grants Death Blow and +5 STR", "build a 10-node skill
            tree for a wheelwright".
          </div>
        )}
        {messages.map(m => {
          const json = m.role === 'specialist' ? extractJSON(m.text) : null;
          const commit = json ? buildCommit(domain, json, store) : null;
          return (
            <div key={m.id} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                padding: '6px 10px',
                background: m.role === 'user' ? t.paper2 : (t.sugg || t.paper),
                border: `1px solid ${m.role === 'user' ? t.rule : (t.suggInk || t.rule)}33`,
                borderLeft: m.role === 'user' ? `1px solid ${t.rule}` : `2px solid ${t.suggInk || accentColor}`,
                borderRadius: 4,
                fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
              }}>{m.text}</div>
              {commit && (
                <CommitChip t={t} accent={accentColor} commit={commit}
                  onDone={(label) => setHistory(h => [...h, { id: rid(), role: 'system', text: `✓ ${label}`, at: Date.now() }])} />
              )}
            </div>
          );
        })}
        {busy && (
          <div style={{
            alignSelf: 'flex-start', padding: '6px 10px',
            fontFamily: t.mono, fontSize: 10, color: t.ink3,
            letterSpacing: 0.12, textTransform: 'uppercase',
          }}>thinking…</div>
        )}
      </div>

      <div style={{
        borderTop: `1px solid ${t.rule}`, padding: 8, display: 'flex', gap: 6,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={`Ask the ${persona.label.toLowerCase()}…`}
          rows={1}
          style={{
            flex: 1, padding: '6px 8px',
            fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.4,
            background: t.paper, border: `1px solid ${t.rule}`,
            borderRadius: 2, outline: 'none', resize: 'vertical', minHeight: 32, maxHeight: 120,
          }}
        />
        <button onClick={send} disabled={busy || !input.trim()} style={{
          padding: '0 12px', background: accentColor, color: t.onAccent,
          border: 'none', borderRadius: 2, cursor: busy ? 'wait' : 'pointer',
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
          textTransform: 'uppercase', fontWeight: 600,
          opacity: busy || !input.trim() ? 0.5 : 1,
        }}>Send</button>
      </div>
    </div>
  );
}

function iconBtn(t) {
  return {
    width: 22, height: 22, borderRadius: 999,
    border: `1px solid ${t.rule}`, background: 'transparent',
    color: t.ink3, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    fontFamily: t.mono, fontSize: 11, lineHeight: 1, padding: 0,
  };
}


// ── Domain commit helpers ────────────────────────────────────────────
// Inspect a JSON blob from the specialist and return a `{label, run}`
// commit handle if we recognise its shape.

function buildCommit(domain, json, store) {
  const helper = { setSlice: store.setSlice };
  if (!json) return null;

  // Items master: {"item": {...}, "missingStats": [...], "missingSkills": [...], "wikiDraft": "..."}
  if (json.item && typeof json.item === "object") {
    return {
      label: `Add "${json.item.name || "item"}" to bank`,
      run: async () => {
        const id = createItem(helper, { ...json.item, draftedByLoom: true, inBank: true });
        if (json.wikiDraft) {
          try { await ensureWikiEntry({ entityId: id, entityType: "item", entity: json.item, body: json.wikiDraft, draftedByLoom: true }); } catch {}
        }
        // Auto-create missing stats.
        if (Array.isArray(json.missingStats)) {
          store.setSlice("statCatalog", xs => {
            const cur = Array.isArray(xs) ? xs : [];
            const known = new Set(cur.map(c => c.key));
            const next = [...cur];
            for (const s of json.missingStats) if (s?.key && !known.has(s.key)) {
              next.push({ key: s.key, description: s.description || "", max: s.max || 100 });
            }
            return next;
          });
        }
        // Auto-create missing skills.
        if (Array.isArray(json.missingSkills)) {
          for (const sk of json.missingSkills) {
            if (!sk?.name) continue;
            const skId = "sk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
            store.setSlice("skills", xs => [...(xs || []), {
              id: skId, name: sk.name, tier: sk.tier || "novice",
              position: { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 },
              description: sk.description || "",
              unlockReqs: { prereqIds: [] },
              effects: sk.effects || { stats: {}, flags: [] },
              level: 0, maxLevel: sk.maxLevel || 5,
              draftedByLoom: true,
            }]);
          }
        }
        return `Item "${json.item.name}" added.`;
      },
    };
  }

  // Skill librarian: {"nodes": [...], "missingStats": [...], "wikiDrafts": {...}}
  if (Array.isArray(json.nodes) && json.nodes.length) {
    return {
      label: `Commit ${json.nodes.length} skill node${json.nodes.length === 1 ? "" : "s"}`,
      run: async () => {
        const placed = json.nodes.map(n => ({
          id: "sk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
          name: n.name || "Skill",
          tier: ["novice", "adept", "master", "unique"].includes(n.tier) ? n.tier : "novice",
          position: n.position || { x: 100 + Math.random() * 700, y: 100 + Math.random() * 400 },
          description: n.description || "",
          unlockReqs: n.unlockReqs || { prereqIds: [] },
          effects: n.effects || { stats: {}, flags: [] },
          level: 0, maxLevel: n.maxLevel || 5,
          costPoints: n.costPoints || 1,
          cooldown: n.cooldown || 0,
          draftedByLoom: true,
        }));
        store.setSlice("skills", xs => [...(xs || []), ...placed]);
        if (Array.isArray(json.missingStats)) {
          store.setSlice("statCatalog", xs => {
            const cur = Array.isArray(xs) ? xs : [];
            const known = new Set(cur.map(c => c.key));
            const next = [...cur];
            for (const s of json.missingStats) if (s?.key && !known.has(s.key)) {
              next.push({ key: s.key, description: s.description || "", max: s.max || 100 });
            }
            return next;
          });
        }
        for (const node of placed) {
          const draft = json.wikiDrafts?.[node.name];
          try { await ensureWikiEntry({ entityId: node.id, entityType: "skill", entity: { name: node.name, description: node.description }, body: draft, draftedByLoom: true }); } catch {}
        }
        return `${placed.length} skill node${placed.length === 1 ? "" : "s"} added.`;
      },
    };
  }

  // Quest architect: {"quest": {...}, "wikiDraft": "..."}
  if (json.quest && typeof json.quest === "object") {
    return {
      label: `Add quest "${json.quest.name || "quest"}"`,
      run: async () => {
        const id = createQuest(helper, { ...json.quest, draftedByLoom: true });
        if (json.wikiDraft) {
          try { await ensureWikiEntry({ entityId: id, entityType: "quest", entity: json.quest, body: json.wikiDraft, draftedByLoom: true }); } catch {}
        }
        return `Quest "${json.quest.name}" added.`;
      },
    };
  }

  // Casting director: {"character": {...}, "wikiDraft": "..."}
  if (json.character && typeof json.character === "object") {
    return {
      label: `Add character "${json.character.name || "character"}"`,
      run: async () => {
        const id = createCharacter(helper, { ...json.character, draftedByLoom: true });
        if (json.wikiDraft) {
          try { await ensureWikiEntry({ entityId: id, entityType: "character", entity: json.character, body: json.wikiDraft, draftedByLoom: true }); } catch {}
        }
        return `Character "${json.character.name}" added.`;
      },
    };
  }

  // Cartographer: {"place": {...}} or {"places": [...]}
  if (json.place && typeof json.place === "object") {
    return {
      label: `Add place "${json.place.name}"`,
      run: async () => {
        const id = createPlace(helper, { ...json.place, draftedByLoom: true });
        if (json.wikiDraft) {
          try { await ensureWikiEntry({ entityId: id, entityType: "place", entity: json.place, body: json.wikiDraft, draftedByLoom: true }); } catch {}
        }
        return `Place "${json.place.name}" added.`;
      },
    };
  }
  if (Array.isArray(json.places) && json.places.length) {
    return {
      label: `Add ${json.places.length} place${json.places.length === 1 ? "" : "s"}`,
      run: async () => {
        for (const p of json.places) createPlace(helper, { ...p, draftedByLoom: true });
        return `${json.places.length} place${json.places.length === 1 ? "" : "s"} added.`;
      },
    };
  }

  // Mechanics designer: {"stats": {...}}
  if (json.stats && typeof json.stats === "object" && !Array.isArray(json.stats)) {
    const keys = Object.keys(json.stats);
    if (keys.length) {
      return {
        label: `Add ${keys.length} stat${keys.length === 1 ? "" : "s"} to catalogue`,
        run: async () => {
          store.setSlice("statCatalog", xs => {
            const cur = Array.isArray(xs) ? xs : [];
            const known = new Set(cur.map(c => c.key));
            const next = [...cur];
            for (const [k, v] of Object.entries(json.stats)) {
              if (known.has(k)) continue;
              next.push({ key: k, description: v?.description || "", max: v?.max || 100 });
            }
            return next;
          });
          return `${keys.length} stat${keys.length === 1 ? "" : "s"} added.`;
        },
      };
    }
  }

  return null;
}

function CommitChip({ t, accent, commit, onDone }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  if (done) return null;
  return (
    <button
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try { const label = await commit.run(); setDone(true); onDone?.(label || commit.label); }
        finally { setBusy(false); }
      }}
      style={{
        alignSelf: "flex-start",
        padding: "5px 12px", background: accent, color: t.onAccent,
        border: "none", borderRadius: 999, cursor: busy ? "wait" : "pointer",
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
        textTransform: "uppercase", fontWeight: 600,
        opacity: busy ? 0.6 : 1,
      }}>{busy ? "Committing…" : "✦ " + commit.label}</button>
  );
}

