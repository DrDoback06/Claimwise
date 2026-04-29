// interview/app.jsx — character interview + group chat + prompt deck

function App() {
  const t = useTheme();
  const [tab, setTab] = React.useState('solo');
  const [activeChar, setActiveChar] = React.useState('mira');
  const [groupChars, setGroupChars] = React.useState(['mira', 'edrick', 'tobyn']);
  const [showDeck, setShowDeck] = React.useState(true);
  const [input, setInput] = React.useState('');

  const character = CHARACTERS.find(c => c.id === activeChar);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.bg, color: t.ink, fontFamily: t.font }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: t.sidebar, borderRight: `1px solid ${t.rule}`, padding: '20px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${t.rule}`, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: 2 }}>L<span style={{ fontSize: 13, opacity: 0.6 }}>w</span></div>
          <div>
            <div style={{ fontFamily: t.display, fontWeight: 500, fontSize: 15, color: t.ink }}>Loomwright</div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 2 }}>Interview Mode</div>
          </div>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 3, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          {[
            { id: 'solo',  label: 'Solo' },
            { id: 'group', label: 'Group' },
            { id: 'saved', label: 'Saved' },
          ].map(m => (
            <button key={m.id} onClick={() => setTab(m.id)} style={{
              flex: 1, padding: '6px 8px',
              background: tab === m.id ? t.accent : 'transparent',
              color: tab === m.id ? t.onAccent : t.ink2,
              border: 'none', borderRadius: 2,
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}>{m.label}</button>
          ))}
        </div>

        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Cast</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {CHARACTERS.map(c => {
            const inGroup = groupChars.includes(c.id);
            const selected = tab === 'group' ? inGroup : activeChar === c.id;
            return (
              <button key={c.id} onClick={() => {
                if (tab === 'group') {
                  setGroupChars(g => g.includes(c.id) ? g.filter(x => x !== c.id) : [...g, c.id]);
                } else setActiveChar(c.id);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 3,
                background: selected ? t.paper : 'transparent',
                border: 'none', borderLeft: selected ? `2px solid ${c.color}` : '2px solid transparent',
                cursor: 'pointer', color: t.ink,
              }}>
                <div style={{ width: 28, height: 28, background: c.color, color: 'rgba(0,0,0,0.7)', fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 12, borderRadius: '50%', flexShrink: 0 }}>{c.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{c.role}</div>
                </div>
                {tab === 'group' && inGroup && <span style={{ fontFamily: t.mono, fontSize: 10, color: c.color }}>●</span>}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.rule}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
            <input type="checkbox" checked={showDeck} onChange={e => setShowDeck(e.target.checked)} />
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>Show prompt deck</span>
          </label>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ padding: '14px 28px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {tab === 'solo' && (
            <>
              <div style={{ width: 40, height: 40, background: character.color, color: 'rgba(0,0,0,0.7)', fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: '50%' }}>{character.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
              <div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Interview · solo · ch.14 context</div>
                <div style={{ fontFamily: t.display, fontSize: 19, fontWeight: 500, marginTop: 2, color: t.ink }}>{character.name}<span style={{ fontSize: 13, color: t.ink3, fontWeight: 400, marginLeft: 8 }}>· {character.oneliner}</span></div>
              </div>
            </>
          )}
          {tab === 'group' && (
            <div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Group chat · {groupChars.length} characters</div>
              <div style={{ fontFamily: t.display, fontSize: 19, fontWeight: 500, marginTop: 2, color: t.ink }}>War-room, night before the parley</div>
            </div>
          )}
          {tab === 'saved' && (
            <div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Saved · interview insights</div>
              <div style={{ fontFamily: t.display, fontSize: 19, fontWeight: 500, marginTop: 2, color: t.ink }}>{SAVED.length} captured moments</div>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button style={{ padding: '6px 12px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>↓ Export transcript</button>
          <ThemeToggle />
        </header>

        {tab === 'solo'  && <SoloChat character={character} input={input} setInput={setInput} showDeck={showDeck} />}
        {tab === 'group' && <GroupChat groupChars={groupChars} input={input} setInput={setInput} showDeck={showDeck} />}
        {tab === 'saved' && <SavedView />}
      </main>
    </div>
  );
}

function MessageBubble({ by, text, meta, kind, character, showName }) {
  const t = useTheme();
  if (kind === 'stage') {
    return (
      <div style={{ padding: '12px 20px', margin: '16px 0', background: t.paper2, border: `1px dashed ${t.rule}`, borderRadius: t.radius, fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 13, color: t.ink3, lineHeight: 1.6, textAlign: 'center' }}>{text}</div>
    );
  }
  const isYou = by === 'you';
  const char = !isYou && character;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', flexDirection: isYou ? 'row-reverse' : 'row' }}>
      <div style={{ width: 32, height: 32, background: isYou ? t.rule : (char?.color || t.accent), color: isYou ? t.ink2 : 'rgba(0,0,0,0.7)', fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 11, borderRadius: '50%', flexShrink: 0 }}>{isYou ? 'YOU' : (char?.name.split(' ').map(s => s[0]).join('').slice(0, 2) || '')}</div>
      <div style={{ maxWidth: '74%', display: 'flex', flexDirection: 'column', alignItems: isYou ? 'flex-end' : 'flex-start' }}>
        {showName && !isYou && char && (
          <div style={{ fontFamily: t.mono, fontSize: 9, color: char.color, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 3 }}>{char.name}</div>
        )}
        <div style={{
          padding: '10px 14px',
          background: isYou ? t.paper2 : t.paper,
          border: `1px solid ${isYou ? t.rule : (char?.color || t.rule)}`,
          borderLeft: !isYou ? `3px solid ${char?.color || t.accent}` : `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: isYou ? t.font : "'Fraunces', serif",
          fontSize: 14, lineHeight: 1.65, color: t.ink,
        }}>{text}</div>
        {meta?.revealsTrait && (
          <div style={{ marginTop: 5, padding: '3px 8px', background: t.accentSoft, border: `1px dashed ${t.accent}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.12, textTransform: 'uppercase' }}>✦ Reveals trait · {meta.revealsTrait}</div>
        )}
        {meta?.note && (
          <div style={{ marginTop: 5, padding: '3px 8px', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, fontStyle: 'italic' }}>{meta.note}</div>
        )}
        {!isYou && (
          <div style={{ marginTop: 5, display: 'flex', gap: 5 }}>
            <button style={{ padding: '3px 7px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>↑ Save line</button>
            <button style={{ padding: '3px 7px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>→ To chapter</button>
            <button style={{ padding: '3px 7px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>↻ Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptDeck({ onPick }) {
  const t = useTheme();
  return (
    <div style={{ padding: 18, background: t.paper, borderLeft: `1px solid ${t.rule}`, width: 280, overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }}>Prompt deck</div>
      <div style={{ fontSize: 12, color: t.ink3, lineHeight: 1.55, marginBottom: 14 }}>Curated starters. Click to drop into the input — edit before sending, or fire it as-is.</div>
      {PROMPT_DECK.map(section => (
        <div key={section.category} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>{section.category}</div>
          {section.prompts.map(p => (
            <button key={p} onClick={() => onPick(p)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 10px', marginBottom: 4,
              background: t.paper2, color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontSize: 12, lineHeight: 1.5, cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>
      ))}
      <button style={{ width: '100%', padding: '8px 12px', marginTop: 4, background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer' }}>+ Add your own prompt</button>
    </div>
  );
}

function SoloChat({ character, input, setInput, showDeck }) {
  const t = useTheme();
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Canon context strip */}
        <div style={{ padding: '10px 28px', background: t.paper, borderBottom: `1px solid ${t.rule}`, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Canon · Mira knows:</div>
          {character.knows.slice(0, 3).map(k => <span key={k} style={{ fontSize: 11, color: t.ink2, fontStyle: 'italic' }}>"{k}"</span>)}
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.warn, letterSpacing: 0.1 }}>+ {character.hiddenFromOthers.length} private</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px' }}>
          {SOLO_TRANSCRIPT.map((m, i) => (
            <MessageBubble key={i} {...m} character={character} />
          ))}
          <div style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
            <div style={{ width: 32, height: 32, background: character.color, color: 'rgba(0,0,0,0.7)', fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 11, borderRadius: '50%' }}>{character.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
            <div style={{ padding: '10px 14px', background: t.paper, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${character.color}`, borderRadius: t.radius, display: 'flex', gap: 4 }}>
              <span className="typing-dot" style={{ width: 6, height: 6, background: t.ink3, borderRadius: '50%' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, background: t.ink3, borderRadius: '50%' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, background: t.ink3, borderRadius: '50%' }} />
            </div>
          </div>
        </div>
        <ChatInput input={input} setInput={setInput} hint={`Ask ${character.name} anything…`} />
      </div>
      {showDeck && <PromptDeck onPick={setInput} />}
    </div>
  );
}

function GroupChat({ groupChars, input, setInput, showDeck }) {
  const t = useTheme();
  const chars = groupChars.map(id => CHARACTERS.find(c => c.id === id));
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Scene setter strip */}
        <div style={{ padding: '10px 28px', background: t.paper, borderBottom: `1px solid ${t.rule}`, display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Director</div>
          <input defaultValue="War-room, night before the parley" style={{ flex: 1, background: 'transparent', border: 'none', color: t.ink, fontSize: 13, outline: 'none', fontStyle: 'italic' }} />
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1 }}>PACE</div>
          <select style={{ padding: '4px 8px', background: t.bg, color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontSize: 11 }}>
            <option>Tense</option><option>Flowing</option><option>Explosive</option><option>Guarded</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px' }}>
          {GROUP_TRANSCRIPT.map((m, i) => {
            const character = CHARACTERS.find(c => c.id === m.by);
            const prev = i > 0 ? GROUP_TRANSCRIPT[i - 1].by : null;
            return <MessageBubble key={i} {...m} character={character} showName={m.by !== prev} />;
          })}
          <div style={{ padding: '10px 28px', marginTop: 8, background: t.paper2, border: `1px dashed ${t.accent}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.1, textAlign: 'center' }}>
            ✦ THE LOOM · NUDGE THE SCENE
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {['Mira pushes harder', 'Edrick loses his composure', 'Tobyn reveals something small', 'Scene ends on silence', '+ Custom nudge'].map(n => (
              <button key={n} style={{ padding: '5px 11px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, cursor: 'pointer' }}>{n}</button>
            ))}
          </div>
        </div>

        <ChatInput input={input} setInput={setInput} hint={`Direct the scene, or speak as a character…`} chars={chars} />
      </div>
      {showDeck && <PromptDeck onPick={setInput} />}
    </div>
  );
}

function ChatInput({ input, setInput, hint, chars }) {
  const t = useTheme();
  return (
    <div style={{ padding: '14px 28px', borderTop: `1px solid ${t.rule}`, background: t.sidebar, flexShrink: 0 }}>
      {chars && (
        <div style={{ display: 'flex', gap: 5, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>Speak as</span>
          <button style={{ padding: '3px 9px', background: t.paper, color: t.ink, border: `1px solid ${t.accent}`, borderRadius: 1, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Director</button>
          {chars.map(c => (
            <button key={c.id} style={{ padding: '3px 9px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>{c.name.split(' ')[0]}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={hint} rows={2} style={{
          flex: 1, padding: '10px 12px',
          background: t.paper, color: t.ink,
          border: `1px solid ${t.rule}`, borderRadius: t.radius,
          fontSize: 13, lineHeight: 1.55, resize: 'none', outline: 'none',
        }} />
        <button style={{ padding: '10px 18px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: t.radius, fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer', alignSelf: 'stretch' }}>Send →</button>
      </div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginTop: 6 }}>ENTER TO SEND · SHIFT+ENTER NEWLINE · THE LOOM STAYS IN CANON</div>
    </div>
  );
}

function SavedView() {
  const t = useTheme();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
      <div style={{ maxWidth: 820 }}>
        <p style={{ fontSize: 13, color: t.ink2, maxWidth: '60ch', lineHeight: 1.65, marginTop: 0 }}>
          Every line you save from an interview lands here. Tag it, send it to a chapter, flag it for the Canon Weaver, or just keep it as a note. Interview transcripts themselves are kept for 90 days unless pinned.
        </p>
        <div style={{ marginTop: 18, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, overflow: 'hidden' }}>
          {SAVED.map((s, i) => {
            const c = CHARACTERS.find(x => x.id === s.char);
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, padding: 16, borderTop: i > 0 ? `1px solid ${t.rule}` : 'none', alignItems: 'start' }}>
                <div style={{ width: 32, height: 32, background: c.color, color: 'rgba(0,0,0,0.7)', fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 12, borderRadius: '50%' }}>{c.name.split(' ').map(x => x[0]).join('').slice(0, 2)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink }}>{c.name}</span>
                    <span style={{ fontFamily: t.mono, fontSize: 9, padding: '2px 6px', border: `1px solid ${t.rule}`, color: t.ink3, borderRadius: 1, letterSpacing: 0.12, textTransform: 'uppercase' }}>{s.kind}</span>
                    <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1 }}>· saved from {s.savedAt}</span>
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: t.ink, lineHeight: 1.65, fontStyle: 'italic' }}>"{s.quote}"</div>
                  <div style={{ fontSize: 12, color: t.ink3, marginTop: 5 }}>{s.note}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button style={{ padding: '4px 9px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>→ Chapter</button>
                  <button style={{ padding: '4px 9px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>→ Weaver</button>
                  <button style={{ padding: '4px 9px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Dossier</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ThemeProvider><App /></ThemeProvider>);
