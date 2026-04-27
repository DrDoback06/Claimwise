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
import { pushDraftToQueue } from '../review-queue/operations';
import { layoutPlacesInPolygon, layoutOnDefaultCanvas } from '../panels/atlas/spatial-layout';
import { generateRegionBackground } from '../panels/atlas/procedural-bg';

function rid(prefix = 'm') { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6); }

// Map a returned JSON shape to the panel that owns it. Used both to detect
// cross-tab requests and to route drafts to the correct review queue.
const SHAPE_DOMAIN = [
  { key: 'character', domain: 'cast' },
  { key: 'characters', domain: 'cast' },
  { key: 'voiceProfile', domain: 'cast' },
  { key: 'relationships', domain: 'cast' },
  { key: 'place', domain: 'atlas' },
  { key: 'places', domain: 'atlas' },
  { key: 'item', domain: 'items' },
  { key: 'items', domain: 'items' },
  { key: 'quest', domain: 'quests' },
  { key: 'quests', domain: 'quests' },
  { key: 'nodes', domain: 'skills' },
  { key: 'skills', domain: 'skills' },
];

function domainOfJSON(json) {
  if (!json || typeof json !== 'object') return null;
  for (const { key, domain } of SHAPE_DOMAIN) if (json[key] != null) return domain;
  return null;
}

// Pre-parse `@items:` / `@cast:` etc directives so a writer can ask another
// specialist from inside the active tab. Returns { directedDomain, prompt }.
const DIRECTIVE_RE = /^@(cast|items|atlas|quests|skills|voice|language|tangle|stats)\s*:\s*/i;
function parseDirective(text) {
  const m = (text || '').match(DIRECTIVE_RE);
  if (!m) return { directedDomain: null, prompt: text };
  return { directedDomain: m[1].toLowerCase(), prompt: text.slice(m[0].length) };
}

// Map domain → kind used by the review queue routing.
const DOMAIN_TO_KIND = {
  cast: 'character',
  atlas: 'place',
  items: 'item',
  quests: 'quest',
  skills: 'skill',
};

export default function SpecialistChat({ domain, accent, entityId }) {
  const t = useTheme();
  const store = useStore();
  // Mode toggle — only meaningful for the cast panel right now. When
  // 'interview', the AI speaks as the focused character; when 'director'
  // (default), it acts as the casting director who creates them.
  const [mode, setMode] = React.useState('director');
  const effectiveDomain = (domain === 'cast' && mode === 'interview' && entityId)
    ? 'cast-interview' : domain;
  const persona = personaFor(effectiveDomain);
  // Per-entity history so two characters in the cast tab don't share a
  // conversation. Mode is also part of the key so director/interview are
  // remembered separately.
  const historyKey = entityId
    ? `${effectiveDomain}:${entityId}`
    : effectiveDomain;
  const messages = store.ui?.specialistHistory?.[historyKey] || [];
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages.length, busy]);

  // Pre-staged drafts from the Today panel (interview cues etc) seed the
  // input box so the writer can edit before sending.
  React.useEffect(() => {
    const draft = store.ui?.specialistDraft?.[historyKey];
    if (!draft) return;
    setInput(draft);
    setOpen(true);
    store.setPath(`ui.specialistDraft.${historyKey}`, '');
  }, [historyKey, store.ui?.specialistDraft]);

  const setHistory = (next) =>
    store.setPath(`ui.specialistHistory.${historyKey}`,
      typeof next === 'function' ? next(messages) : next);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    const { directedDomain, prompt } = parseDirective(trimmed);
    const userMsg = { id: rid(), role: 'user', text: trimmed, at: Date.now() };
    const nextHistory = [...messages, userMsg];
    setHistory(nextHistory);
    setInput('');
    setBusy(true);
    try {
      // Cross-tab directive: route this turn to the directed specialist's
      // persona; the resulting JSON is pushed to that domain's review queue
      // rather than committed inline so the writer reviews it on the
      // appropriate panel.
      const askDomain = directedDomain || effectiveDomain;
      const reply = await ask({
        domain: askDomain,
        history: nextHistory,
        prompt: directedDomain ? prompt : trimmed,
        store,
      });
      const replyMsg = {
        id: rid(),
        role: 'specialist',
        text: reply,
        at: Date.now(),
        // Stamp so we know later whether this turn was directed elsewhere.
        directedDomain: directedDomain || null,
      };
      setHistory(h => [...h, replyMsg]);
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
        {domain === 'cast' && entityId && (
          <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
            <button onClick={() => setMode('director')}
              title="Casting director — creates and shapes characters"
              style={modeBtn(t, accentColor, mode === 'director')}>
              Director
            </button>
            <button onClick={() => setMode('interview')}
              title="Interview — speak AS this character; replies can route stat / item / fact changes to the queue"
              style={modeBtn(t, accentColor, mode === 'interview')}>
              Interview
            </button>
          </div>
        )}
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
            <div style={{ marginTop: 8, fontStyle: 'normal', fontSize: 11 }}>
              Cross-tab: prefix with <code style={kbdStyle(t)}>@items:</code>,&nbsp;
              <code style={kbdStyle(t)}>@cast:</code>,&nbsp;
              <code style={kbdStyle(t)}>@atlas:</code>,&nbsp;
              <code style={kbdStyle(t)}>@quests:</code>, or&nbsp;
              <code style={kbdStyle(t)}>@skills:</code> to ask another specialist
              from here. The result lands in that panel's review queue.
            </div>
          </div>
        )}
        {messages.map(m => {
          const json = m.role === 'specialist' ? extractJSON(m.text) : null;
          // Interview mode emits {"actions":[...]} — route each action to
          // its appropriate review queue rather than committing inline.
          const interviewActions = (json && Array.isArray(json.actions)) ? json.actions : null;
          const shapeDomain = json ? domainOfJSON(json) : null;
          // Route to a different tab's queue when:
          //   • the user used an @<domain>: directive (m.directedDomain), OR
          //   • the AI returned JSON whose shape is owned by another panel.
          const targetQueueDomain = m.directedDomain
            || (shapeDomain && shapeDomain !== domain ? shapeDomain : null);
          const commit = json && !targetQueueDomain && !interviewActions
            ? buildCommit(domain, json, store) : null;
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
              {targetQueueDomain && json && !interviewActions && (
                <RouteChip
                  t={t}
                  accent={accentColor}
                  targetDomain={targetQueueDomain}
                  json={json}
                  store={store}
                  onDone={(label) => setHistory(h => [...h, { id: rid(), role: 'system', text: `✓ ${label}`, at: Date.now() }])} />
              )}
              {interviewActions && (
                <InterviewActionsChip
                  t={t}
                  accent={accentColor}
                  actions={interviewActions}
                  characterId={entityId}
                  store={store}
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

      {/* Quick-action chips — pre-load a strict-JSON instruction so the
          AI returns a shape buildCommit() can recognise. */}
      {(persona.quick || []).length > 0 && (
        <div style={{
          padding: '6px 8px', borderTop: `1px solid ${t.rule}`,
          display: 'flex', flexWrap: 'wrap', gap: 4,
          background: t.paper2,
        }}>
          {persona.quick.map(q => (
            <button key={q.label} onClick={() => setInput(q.prompt)} style={{
              padding: '4px 10px', background: 'transparent',
              color: accentColor, border: `1px solid ${accentColor}55`,
              borderRadius: 999, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
              textTransform: 'uppercase',
            }}>{q.label}</button>
          ))}
        </div>
      )}

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

function modeBtn(t, accent, on) {
  return {
    padding: '2px 8px',
    background: on ? accent : 'transparent',
    color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? accent : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
    fontWeight: 600,
  };
}

function kbdStyle(t) {
  return {
    padding: '1px 5px', borderRadius: 2,
    background: t.paper2, color: t.ink2,
    border: `1px solid ${t.rule}`,
    fontFamily: t.mono, fontSize: 10,
  };
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

  // Cartographer: {"region": {...}, "places": [...]} — auto-lay out the
  // settlements inside the polygon and stamp a procedural background.
  if (json.region && typeof json.region === 'object' && Array.isArray(json.places)) {
    const placeCount = json.places.length;
    return {
      label: `Add region "${json.region.name || 'region'}" with ${placeCount} place${placeCount === 1 ? '' : 's'}`,
      run: async () => {
        const regionId = 'rg_' + Date.now().toString(36);
        const poly = Array.isArray(json.region.poly) && json.region.poly.length >= 3
          ? json.region.poly
          : defaultRegionPoly();
        const bg = generateRegionBackground({ ...json.region, poly });
        const region = {
          id: regionId,
          name: json.region.name || 'New region',
          biome: bg?.biome || json.region.biome || null,
          description: json.region.description || '',
          color: bg?.palette?.accent || '#7d6a5a',
          poly,
          bgImage: bg?.dataUrl || null,
          createdAt: Date.now(),
          draftedByLoom: true,
        };
        store.setSlice('regions', rs => [...(Array.isArray(rs) ? rs : []), region]);

        // Auto-place settlements inside the polygon.
        const layout = layoutPlacesInPolygon(poly, placeCount);
        const places = json.places.map((p, i) => {
          const xy = layout[i] || layoutOnDefaultCanvas(placeCount)[i];
          return {
            ...p,
            id: 'pl_' + Date.now().toString(36) + '_' + i,
            x: xy.x, y: xy.y,
            kind: p.kind || 'settlement',
            realm: region.name,
            regionId,
            visits: [],
            children: [],
            parentId: null,
            proposed: false,
            hasFloorplan: false,
            createdAt: Date.now(),
            draftedByLoom: true,
          };
        });
        store.setSlice('places', ps => [...(Array.isArray(ps) ? ps : []), ...places]);

        return `Region "${region.name}" added with ${places.length} place${places.length === 1 ? '' : 's'}.`;
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
        // Spread bare-places on a sensible ring rather than letting AI
        // dump them at duplicate / origin coordinates.
        const layout = layoutOnDefaultCanvas(json.places.length);
        json.places.forEach((p, i) => {
          const xy = layout[i] || { x: 500, y: 350 };
          createPlace(helper, {
            ...p,
            x: typeof p.x === 'number' && p.x !== 0 ? p.x : xy.x,
            y: typeof p.y === 'number' && p.y !== 0 ? p.y : xy.y,
            draftedByLoom: true,
          });
        });
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

  // Bulk character list.
  if (Array.isArray(json.characters) && json.characters.length) {
    return {
      label: `Add ${json.characters.length} character${json.characters.length === 1 ? "" : "s"}`,
      run: async () => {
        for (const c of json.characters) createCharacter(helper, { ...c, draftedByLoom: true });
        return `${json.characters.length} character${json.characters.length === 1 ? "" : "s"} added.`;
      },
    };
  }

  // Bulk items list.
  if (Array.isArray(json.items) && json.items.length) {
    return {
      label: `Add ${json.items.length} item${json.items.length === 1 ? "" : "s"} to bank`,
      run: async () => {
        for (const it of json.items) createItem(helper, { ...it, draftedByLoom: true, inBank: true });
        return `${json.items.length} item${json.items.length === 1 ? "" : "s"} added.`;
      },
    };
  }

  // Bulk quests list.
  if (Array.isArray(json.quests) && json.quests.length) {
    return {
      label: `Add ${json.quests.length} quest${json.quests.length === 1 ? "" : "s"}`,
      run: async () => {
        for (const q of json.quests) createQuest(helper, { ...q, draftedByLoom: true });
        return `${json.quests.length} quest${json.quests.length === 1 ? "" : "s"} added.`;
      },
    };
  }

  // Bulk skills list (different from {nodes} — these are stand-alone skills,
  // not a tree).
  if (Array.isArray(json.skills) && json.skills.length) {
    return {
      label: `Add ${json.skills.length} skill${json.skills.length === 1 ? "" : "s"}`,
      run: async () => {
        const placed = json.skills.map(s => ({
          id: "sk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
          name: s.name || "Skill",
          tier: s.tier || "novice",
          position: s.position || { x: 100 + Math.random() * 700, y: 100 + Math.random() * 400 },
          description: s.description || "",
          unlockReqs: s.unlockReqs || { prereqIds: [] },
          effects: s.effects || { stats: {}, flags: [] },
          level: 0, maxLevel: s.maxLevel || 5,
          draftedByLoom: true,
        }));
        store.setSlice("skills", xs => [...(xs || []), ...placed]);
        return `${placed.length} skill${placed.length === 1 ? "" : "s"} added.`;
      },
    };
  }

  // Voice analysis: {"voiceProfile": {description, fingerprint, tics, dialect, hooks, dials}}
  if (json.voiceProfile && typeof json.voiceProfile === "object") {
    const charId = store.ui?.selection?.character;
    if (!charId) return null;
    return {
      label: `Apply voice profile`,
      run: async () => {
        store.setSlice("voice", vs => {
          const arr = vs || [];
          const i = arr.findIndex(v => v.characterId === charId);
          const merged = {
            id: arr[i]?.id || `voice_${charId}`,
            characterId: charId,
            ...(arr[i] || {}),
            ...json.voiceProfile,
            analyzedAt: Date.now(),
          };
          if (i >= 0) return arr.map((x, j) => j === i ? merged : x);
          return [...arr, merged];
        });
        return `Voice profile applied.`;
      },
    };
  }

  // Relationship analyst: {"relationships":[{from, to, kind, strength, note}]}
  if (Array.isArray(json.relationships) && json.relationships.length) {
    const cast = store.cast || [];
    const resolveId = (s) => {
      if (!s) return null;
      if (cast.find(c => c.id === s)) return s;
      const m = cast.find(c => (c.name || '').toLowerCase() === String(s).toLowerCase());
      return m?.id || null;
    };
    const valid = json.relationships
      .map(r => ({ ...r, fromId: resolveId(r.from), toId: resolveId(r.to) }))
      .filter(r => r.fromId && r.toId && r.fromId !== r.toId);
    if (!valid.length) return null;
    return {
      label: `Apply ${valid.length} relationship${valid.length === 1 ? "" : "s"}`,
      run: async () => {
        store.setSlice("cast", cs => cs.map(c => {
          const outgoing = valid.filter(r => r.fromId === c.id);
          if (!outgoing.length) return c;
          const next = [...(c.relationships || [])];
          for (const r of outgoing) {
            const exists = next.find(x => x.to === r.toId);
            if (exists) {
              Object.assign(exists, { kind: r.kind || exists.kind, strength: r.strength ?? exists.strength, note: r.note || exists.note });
            } else {
              next.push({ to: r.toId, kind: r.kind || 'connected', strength: r.strength ?? 0, note: r.note || '' });
            }
          }
          return { ...c, relationships: next };
        }));
        return `${valid.length} relationship${valid.length === 1 ? "" : "s"} applied.`;
      },
    };
  }

  return null;
}

// Pushes one or many entity drafts into another panel's review queue. Used
// when the user issued an `@items:` style cross-tab directive, or when the
// AI's JSON shape doesn't belong to the active panel.
function RouteChip({ t, accent, targetDomain, json, store, onDone }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  if (done) return null;

  // Flatten the JSON into one or more drafts of `kind` for the target panel.
  const drafts = collectDrafts(targetDomain, json);
  if (!drafts.length) return null;

  const kind = DOMAIN_TO_KIND[targetDomain];
  const label = drafts.length === 1
    ? `Send to ${targetDomain} queue: ${drafts[0].name || 'draft'}`
    : `Send ${drafts.length} drafts to ${targetDomain} queue`;

  return (
    <button
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          for (const d of drafts) {
            pushDraftToQueue(store, kind, d, { confidence: 0.9, source: 'specialist' });
          }
          setDone(true);
          onDone?.(`Routed ${drafts.length} draft${drafts.length === 1 ? '' : 's'} to ${targetDomain}`);
        } finally { setBusy(false); }
      }}
      style={{
        alignSelf: 'flex-start',
        padding: '5px 12px', background: 'transparent', color: accent,
        border: `1px dashed ${accent}`, borderRadius: 999,
        cursor: busy ? 'wait' : 'pointer',
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', fontWeight: 600,
        opacity: busy ? 0.6 : 1,
      }}>{busy ? 'Routing…' : '⇢ ' + label}</button>
  );
}

function collectDrafts(domain, json) {
  const out = [];
  const single = (key) => json[key] && typeof json[key] === 'object' && out.push(json[key]);
  const many = (key) => Array.isArray(json[key]) && json[key].forEach(x => x && typeof x === 'object' && out.push(x));
  if (domain === 'cast') { single('character'); many('characters'); }
  else if (domain === 'atlas') { single('place'); many('places'); }
  else if (domain === 'items') { single('item'); many('items'); }
  else if (domain === 'quests') { single('quest'); many('quests'); }
  else if (domain === 'skills') { single('skill'); many('skills'); many('nodes'); }
  return out;
}

// Reads {"actions":[...]} from an interview reply and pushes each action
// into the right review queue (skill_gained → skills, item_gained →
// items, fact → continuity, stat_change → still attached to character).
function InterviewActionsChip({ t, accent, actions, characterId, store, onDone }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  if (done || !Array.isArray(actions) || actions.length === 0) return null;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '6px 8px', borderRadius: 2,
      border: `1px dashed ${accent}`,
      background: 'transparent',
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: accent,
        letterSpacing: 0.14, textTransform: 'uppercase',
      }}>{actions.length} action{actions.length === 1 ? '' : 's'} suggested</div>
      <ul style={{ margin: 0, padding: '0 0 0 14px', fontFamily: t.display, fontSize: 12, color: t.ink2 }}>
        {actions.map((a, i) => (
          <li key={i}>
            <code style={{ fontFamily: t.mono, fontSize: 11, color: t.ink }}>
              {a.type}
            </code>
            {' '}{describeAction(a)}
          </li>
        ))}
      </ul>
      <button
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          try {
            for (const a of actions) {
              applyInterviewAction(store, a, characterId);
            }
            setDone(true);
            onDone?.(`Routed ${actions.length} interview action${actions.length === 1 ? '' : 's'} to queues`);
          } finally { setBusy(false); }
        }}
        style={{
          alignSelf: 'flex-start', marginTop: 4,
          padding: '4px 12px', background: accent, color: t.onAccent,
          border: 'none', borderRadius: 999, cursor: busy ? 'wait' : 'pointer',
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
          fontWeight: 600, opacity: busy ? 0.6 : 1,
        }}>{busy ? 'Routing…' : '⇢ Send to review queues'}</button>
    </div>
  );
}

// A blob-shaped fallback polygon if the AI doesn't return a sensible one.
// Centred on the canvas (500, 350) with a soft, organic outline.
function defaultRegionPoly() {
  const cx = 500, cy = 350, rx = 240, ry = 180;
  const pts = [];
  const sides = 12;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const wobble = 0.85 + (Math.sin(a * 3) * 0.1);
    pts.push([cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble]);
  }
  return pts;
}

function describeAction(a) {
  const p = a.payload || {};
  if (a.type === 'stat_change') return `${p.stat} ${p.delta >= 0 ? '+' : ''}${p.delta} (${p.reason || 'no reason'})`;
  if (a.type === 'skill_gained') return `${p.name}${p.tier ? ' · ' + p.tier : ''}`;
  if (a.type === 'item_gained') return `${p.name}${p.kind ? ' · ' + p.kind : ''}`;
  if (a.type === 'item_lost') return `lost ${p.name}`;
  if (a.type === 'fact') return `${p.kind || 'knows'}: ${p.text}`;
  if (a.type === 'relationship') return `${p.kind || 'connected'} ${p.to}`;
  return JSON.stringify(p);
}

function applyInterviewAction(store, a, characterId) {
  const p = a.payload || {};
  const chapterId = store.book?.currentChapterId || null;
  if (a.type === 'skill_gained' && p.name) {
    pushDraftToQueue(store, 'skill', { name: p.name, notes: p.detail || '', tier: p.tier }, { confidence: 0.85 });
    return;
  }
  if (a.type === 'item_gained' && p.name) {
    pushDraftToQueue(store, 'item', { name: p.name, kind: p.kind, notes: p.note || '' }, { confidence: 0.85 });
    return;
  }
  if (a.type === 'item_lost' && p.name) {
    // Track as a continuity finding so the writer notices.
    store.setSlice('continuity', c => {
      const cur = c || { findings: [], lastScanAt: null };
      return {
        ...cur,
        findings: [...(cur.findings || []), {
          id: 'cf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          kind: 'item-lost',
          chapterId,
          text: `${p.name}${p.note ? ' — ' + p.note : ''}`,
          severity: 'info',
          createdAt: Date.now(),
        }],
      };
    });
    return;
  }
  if (a.type === 'stat_change' && characterId && p.stat) {
    // Stamp directly onto the character's stats (interview is in-character,
    // so the speaker is the source of truth).
    store.setSlice('cast', cs => (cs || []).map(c => {
      if (c.id !== characterId) return c;
      const stats = { ...(c.stats || {}) };
      const delta = Number(p.delta) || 0;
      stats[p.stat] = (stats[p.stat] || 0) + delta;
      return { ...c, stats };
    }));
    // Also append a timeline event.
    store.setSlice('timelineEvents', xs => [...(Array.isArray(xs) ? xs : []), {
      id: 'te_' + Date.now().toString(36),
      actorId: characterId,
      eventType: 'stat_change',
      chapterId,
      data: { stat: p.stat, delta: p.delta, reason: p.reason },
      createdAt: Date.now(),
    }]);
    return;
  }
  if (a.type === 'fact' && characterId && p.text) {
    const kind = ['knows', 'hides', 'fears'].includes(p.kind) ? p.kind : 'knows';
    store.setSlice('cast', cs => (cs || []).map(c => {
      if (c.id !== characterId) return c;
      const next = [...(c[kind] || []), { fact: p.text, kind }];
      return { ...c, [kind]: next };
    }));
    return;
  }
  if (a.type === 'relationship' && characterId && p.to) {
    // Routed to the cast tangle slice as a draft.
    pushDraftToQueue(store, 'character', {
      name: `${characterId} ↔ ${p.to}`,
      notes: `Relationship: ${p.kind || 'connected'} (${p.strength ?? 0}). ${p.note || ''}`,
    }, { confidence: 0.7 });
    return;
  }
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

