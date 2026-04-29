// language/app.jsx — Language Workbench: grammar/spell/style, thesaurus, rewrite, metrics.

const ISSUE_COLORS = {
  grammar: 'oklch(70% 0.15 25)',
  spell:   'oklch(65% 0.18 20)',
  style:   'oklch(72% 0.12 200)',
  echo:    'oklch(78% 0.13 78)',
};

function renderLineWithIssues(line, onIssueClick, activeIssueId) {
  const parts = [];
  let cursor = 0;
  const sorted = [...line.issues].sort((a, b) => a.start - b.start);
  sorted.forEach((iss, idx) => {
    if (iss.start > cursor) parts.push(line.text.slice(cursor, iss.start));
    const key = `${line.id}-${idx}`;
    parts.push(
      <span key={key}
        className={`squiggle-${iss.type}`}
        onClick={(e) => { e.stopPropagation(); onIssueClick({ ...iss, lineId: line.id, issueIdx: idx }); }}
        style={{ background: activeIssueId === key ? 'oklch(78% 0.13 78 / 0.35)' : undefined, borderRadius: 2 }}>
        {line.text.slice(iss.start, iss.end)}
      </span>
    );
    cursor = iss.end;
  });
  if (cursor < line.text.length) parts.push(line.text.slice(cursor));
  return parts;
}

function App() {
  const t = useTheme();
  const [tab, setTab] = React.useState('check');
  const [activeIssue, setActiveIssue] = React.useState(null);
  const [selectedWord, setSelectedWord] = React.useState('seized');
  const [rewriteInput, setRewriteInput] = React.useState(MANUSCRIPT[0].text + ' ' + MANUSCRIPT[1].text);
  const [dismissed, setDismissed] = React.useState(new Set());

  const totalIssues = MANUSCRIPT.reduce((a, l) => a + l.issues.length, 0);
  const byType = MANUSCRIPT.flatMap(l => l.issues).reduce((m, i) => { m[i.type] = (m[i.type] || 0) + 1; return m; }, {});
  const visible = totalIssues - dismissed.size;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.bg, color: t.ink, fontFamily: t.font }}>
      {/* Sidebar */}
      <aside style={{ width: 230, background: t.sidebar, borderRight: `1px solid ${t.rule}`, padding: '20px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: `1px solid ${t.rule}`, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: 2 }}>L<span style={{ fontSize: 13, opacity: 0.6 }}>w</span></div>
          <div>
            <div style={{ fontFamily: t.display, fontWeight: 500, fontSize: 15, color: t.ink }}>Loomwright</div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 2 }}>Language Workbench</div>
          </div>
        </div>

        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Mode</div>
        {[
          { id: 'check',     label: 'Inline check',   desc: 'Grammar · spell · style' },
          { id: 'thesaurus', label: 'Thesaurus',      desc: 'Period-aware synonyms' },
          { id: 'rewrite',   label: 'Rewrite',        desc: 'Sentence workbench' },
          { id: 'metrics',   label: 'Metrics',        desc: 'Reading level & pace' },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 10px', marginBottom: 3,
            background: tab === tb.id ? t.paper : 'transparent',
            border: 'none', borderLeft: tab === tb.id ? `2px solid ${t.accent}` : '2px solid transparent',
            cursor: 'pointer', color: tab === tb.id ? t.ink : t.ink2,
          }}>
            <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500 }}>{tb.label}</div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginTop: 1 }}>{tb.desc.toUpperCase()}</div>
          </button>
        ))}

        {/* Issue counts */}
        <div style={{ marginTop: 20, padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>This page</div>
          {[
            { k: 'grammar', label: 'Grammar' },
            { k: 'spell',   label: 'Spelling' },
            { k: 'style',   label: 'Style' },
            { k: 'echo',    label: 'Echoes' },
          ].map(r => (
            <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <span style={{ width: 8, height: 8, background: ISSUE_COLORS[r.k], borderRadius: '50%' }} />
              <span style={{ flex: 1, fontSize: 12, color: t.ink2 }}>{r.label}</span>
              <span style={{ fontFamily: t.mono, fontSize: 11, color: t.ink }}>{byType[r.k] || 0}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${t.rule}` }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }}>Locale</div>
          <select style={{ width: '100%', padding: '5px 8px', background: t.bg, color: t.ink, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontSize: 11 }}>
            <option>English (UK)</option>
            <option>English (US)</option>
            <option>English (AU)</option>
          </select>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 10, marginBottom: 4 }}>Period</div>
          <select style={{ width: '100%', padding: '5px 8px', background: t.bg, color: t.ink, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontSize: 11 }}>
            <option>14th c. chivalric</option>
            <option>Modern</option>
            <option>Victorian</option>
            <option>Regency</option>
          </select>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ padding: '14px 28px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Language · Ch.14 · 142 words</div>
            <div style={{ fontFamily: t.display, fontSize: 20, fontWeight: 500, marginTop: 2, color: t.ink }}>
              {tab === 'check' && 'Inline checks — ' + visible + ' open'}
              {tab === 'thesaurus' && 'Thesaurus'}
              {tab === 'rewrite' && 'Rewrite workbench'}
              {tab === 'metrics' && 'Reading metrics'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {tab === 'check' && (
            <>
              <button style={{ padding: '6px 12px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Accept all safe</button>
              <button style={{ padding: '6px 12px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Review each</button>
            </>
          )}
          <ThemeToggle />
        </header>

        {tab === 'check'     && <CheckMode activeIssue={activeIssue} setActiveIssue={setActiveIssue} dismissed={dismissed} setDismissed={setDismissed} />}
        {tab === 'thesaurus' && <ThesaurusMode selectedWord={selectedWord} setSelectedWord={setSelectedWord} />}
        {tab === 'rewrite'   && <RewriteMode input={rewriteInput} setInput={setRewriteInput} />}
        {tab === 'metrics'   && <MetricsMode />}
      </main>
    </div>
  );
}

function CheckMode({ activeIssue, setActiveIssue, dismissed, setDismissed }) {
  const t = useTheme();
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 0 }}>
      <div style={{ overflowY: 'auto', padding: '32px 40px' }}>
        <div style={{ maxWidth: 620, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.85, color: t.ink }}>
          {MANUSCRIPT.map(line => (
            <p key={line.id} style={{ margin: '0 0 1em' }}>
              {renderLineWithIssues(line, setActiveIssue, activeIssue ? `${activeIssue.lineId}-${activeIssue.issueIdx}` : null)}
            </p>
          ))}
        </div>
      </div>

      {/* Issue inspector / stream */}
      <aside style={{ borderLeft: `1px solid ${t.rule}`, background: t.paper, overflowY: 'auto', padding: 20 }}>
        {activeIssue ? (
          <IssueInspector issue={activeIssue} onClose={() => setActiveIssue(null)}
            onDismiss={() => { setDismissed(s => new Set([...s, `${activeIssue.lineId}-${activeIssue.issueIdx}`])); setActiveIssue(null); }} />
        ) : (
          <IssueStream setActive={setActiveIssue} dismissed={dismissed} />
        )}
      </aside>
    </div>
  );
}

function IssueStream({ setActive, dismissed }) {
  const t = useTheme();
  const all = MANUSCRIPT.flatMap(line => line.issues.map((iss, idx) => ({ ...iss, lineId: line.id, issueIdx: idx, sentence: line.text })));
  return (
    <div>
      <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 10 }}>All issues · click to inspect</div>
      {all.map((iss, i) => {
        const isDismissed = dismissed.has(`${iss.lineId}-${iss.issueIdx}`);
        return (
          <button key={i} onClick={() => !isDismissed && setActive(iss)} disabled={isDismissed} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '10px 12px', marginBottom: 6,
            background: isDismissed ? 'transparent' : t.paper2,
            border: `1px solid ${isDismissed ? t.rule : ISSUE_COLORS[iss.type]}`,
            borderLeft: `3px solid ${ISSUE_COLORS[iss.type]}`,
            borderRadius: t.radius, cursor: isDismissed ? 'default' : 'pointer', opacity: isDismissed ? 0.4 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: t.mono, fontSize: 9, color: ISSUE_COLORS[iss.type], letterSpacing: 0.14, textTransform: 'uppercase' }}>{iss.type}</span>
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12 }}>· {iss.label}</span>
              {isDismissed && <span style={{ marginLeft: 'auto', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1 }}>DISMISSED</span>}
            </div>
            <div style={{ fontSize: 12, color: t.ink, lineHeight: 1.5 }}>"{iss.sentence.slice(iss.start, iss.end)}"</div>
            {iss.fix && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.good, letterSpacing: 0.1, marginTop: 4 }}>→ {iss.fix}</div>}
          </button>
        );
      })}
    </div>
  );
}

function IssueInspector({ issue, onClose, onDismiss }) {
  const t = useTheme();
  const color = ISSUE_COLORS[issue.type];
  const suggestions = issue.suggestions || (issue.fix ? [issue.fix] : []);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, background: color, borderRadius: '50%' }} />
        <span style={{ fontFamily: t.mono, fontSize: 10, color: color, letterSpacing: 0.14, textTransform: 'uppercase' }}>{issue.type} · {issue.label}</span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {issue.note && <p style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, margin: '0 0 14px', fontStyle: 'italic' }}>{issue.note}</p>}

      {suggestions.length > 0 && (
        <>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Suggestions</div>
          {suggestions.map((s, i) => (
            <button key={s} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 12px', marginBottom: 5,
              background: i === 0 ? t.accentSoft : t.paper2,
              border: `1px solid ${i === 0 ? t.accent : t.rule}`, borderRadius: t.radius,
              fontFamily: "'Fraunces', serif", fontSize: 14, color: t.ink, cursor: 'pointer',
            }}>
              {i === 0 && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.12, marginRight: 8 }}>BEST</span>}
              {s}
            </button>
          ))}
        </>
      )}

      <div style={{ marginTop: 16, padding: 12, background: t.bg, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 6 }}>Actions</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={{ padding: '6px 11px', background: t.good, color: t.onAccent, border: 'none', borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>✓ Accept</button>
          <button onClick={onDismiss} style={{ padding: '6px 11px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Dismiss</button>
          <button style={{ padding: '6px 11px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Ignore like this</button>
          <button style={{ padding: '6px 11px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Add to dictionary</button>
        </div>
      </div>

      {issue.type === 'echo' && (
        <div style={{ marginTop: 14, padding: 12, background: t.bg, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }}>Echo radius</div>
          <div style={{ fontSize: 12, color: t.ink2 }}>Other uses of "felt" nearby:</div>
          <div style={{ marginTop: 6, fontFamily: t.mono, fontSize: 11, color: t.ink3 }}>
            · 4 words earlier (same sentence)<br />
            · 18 words earlier (paragraph above)<br />
            · 43 words earlier (3 paragraphs up)
          </div>
        </div>
      )}
    </div>
  );
}

function ThesaurusMode({ selectedWord, setSelectedWord }) {
  const t = useTheme();
  const entry = THESAURUS[selectedWord] || THESAURUS['seized'];
  const [filters, setFilters] = React.useState({ period: true, register: 'any' });
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 440px', minHeight: 0 }}>
      <div style={{ overflowY: 'auto', padding: '32px 40px' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 10 }}>Context · click any word</div>
        <div style={{ maxWidth: 620, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.85, color: t.ink }}>
          {MANUSCRIPT[1].text.split(' ').map((w, i) => {
            const clean = w.replace(/[^a-z]/gi, '').toLowerCase();
            const active = clean === 'grabbed';
            return (
              <React.Fragment key={i}>
                <span className={active ? 'selected-word' : ''} onClick={() => active && setSelectedWord('seized')} style={{ cursor: active ? 'pointer' : 'default' }}>{w}</span>{' '}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ maxWidth: 620, marginTop: 18, padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${t.accent}`, borderRadius: t.radius }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Selected · "grabbed" → alternatives</div>
          <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.55 }}>The Loom has prioritised <em>"{entry.word}"</em> — it fits your 14th-century setting, isn't currently echoing anywhere nearby, and is closer in register to the rest of your prose.</div>
        </div>
      </div>

      <aside style={{ borderLeft: `1px solid ${t.rule}`, background: t.paper, overflowY: 'auto', padding: 22 }}>
        <div style={{ fontFamily: t.display, fontSize: 28, fontWeight: 500, color: t.ink }}>{entry.word}</div>
        <div style={{ fontStyle: 'italic', fontSize: 13, color: t.ink3, marginTop: 4 }}>{entry.definition}</div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          <button onClick={() => setFilters(f => ({ ...f, period: !f.period }))} style={{
            padding: '5px 10px', background: filters.period ? t.accentSoft : 'transparent', color: filters.period ? t.accent : t.ink3,
            border: `1px solid ${filters.period ? t.accent : t.rule}`, borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
          }}>{filters.period ? '✓ ' : ''}Period-safe only</button>
          <select value={filters.register} onChange={e => setFilters(f => ({ ...f, register: e.target.value }))}
            style={{ padding: '5px 10px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase' }}>
            <option value="any">Any register</option>
            <option value="formal">Formal</option>
            <option value="neutral">Neutral</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        {Object.entries(entry.synonyms).map(([cat, words]) => {
          const filtered = words.filter(w => (!filters.period || w.period !== 'modern') && (filters.register === 'any' || w.register === filters.register));
          if (!filtered.length) return null;
          return (
            <div key={cat} style={{ marginTop: 18 }}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>{cat} ({filtered.length})</div>
              {filtered.map(w => (
                <div key={w.word} style={{ padding: '8px 10px', marginBottom: 4, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: t.radius, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: t.ink }}>{w.word}</div>
                    {w.note && <div style={{ fontSize: 11, color: t.ink3, fontStyle: 'italic', marginTop: 2 }}>{w.note}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ fontFamily: t.mono, fontSize: 8, padding: '2px 5px', border: `1px solid ${w.period === 'modern' ? '#c88080' : w.period === 'archaic' ? t.warn : t.rule}`, color: w.period === 'modern' ? '#c88080' : w.period === 'archaic' ? t.warn : t.ink3, borderRadius: 1, letterSpacing: 0.12, textTransform: 'uppercase' }}>{w.period}</span>
                      <span style={{ fontFamily: t.mono, fontSize: 8, padding: '2px 5px', border: `1px solid ${t.rule}`, color: t.ink3, borderRadius: 1, letterSpacing: 0.12, textTransform: 'uppercase' }}>{w.register}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.rule}` }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>In your book</div>
          <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.65 }}>"{entry.word}" used <strong style={{ color: t.ink }}>{entry.bookUsage.used}×</strong> across Book I & II. Last used {entry.bookUsage.lastUsed}. Avg {entry.bookUsage.avgPerChapter}/chapter.</div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 8 }}>Period</div>
          <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.55, marginTop: 2 }}>{entry.periodNote}</div>
        </div>
      </aside>
    </div>
  );
}

function RewriteMode({ input, setInput }) {
  const t = useTheme();
  const [activeTone, setActiveTone] = React.useState('concise');
  const rewrites = {
    concise: { label: 'Concise', out: 'The horn sounded thrice. Mira knew it was time. She seized her father\'s sword from the mantelpiece and ran for the door.', delta: '–24 words' },
    lyrical: { label: 'Lyrical',  out: 'Three long notes of the horn unfurled across the mist-drowned valley, and at last Mira understood — the hour had come. From the mantelpiece she took her father\'s sword, and hurried toward the door.', delta: '+12 words' },
    taut:    { label: 'Taut',     out: 'Three horn blasts. Mira knew. She grabbed her father\'s sword and ran.', delta: '–38 words · losing "mantelpiece" detail' },
    ya:      { label: 'YA',       out: 'The horn went off three times. This was it — the moment Mira had been waiting for. She grabbed her dad\'s sword off the mantelpiece and bolted for the door.', delta: 'casual register · modernises voice' },
  };
  const current = rewrites[activeTone];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
      <div style={{ maxWidth: 940, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Original</div>
          <textarea value={input} onChange={e => setInput(e.target.value)} style={{
            width: '100%', minHeight: 220, padding: 16,
            background: t.paper, color: t.ink,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: "'Fraunces', serif", fontSize: 15, lineHeight: 1.75, resize: 'vertical', outline: 'none',
          }} />
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, marginTop: 6 }}>{input.split(/\s+/).filter(Boolean).length} WORDS · {input.split(/[.!?]+/).filter(s => s.trim()).length} SENTENCES</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Rewritten · {current.label}</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>{current.delta}</div>
          </div>
          <div style={{ minHeight: 220, padding: 16, background: t.paper, border: `1px solid ${t.accent}`, borderLeft: `3px solid ${t.accent}`, borderRadius: t.radius, fontFamily: "'Fraunces', serif", fontSize: 15, lineHeight: 1.75, color: t.ink }}>
            {current.out}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button style={{ padding: '7px 14px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: t.radius, fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Replace original</button>
            <button style={{ padding: '7px 14px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Copy</button>
            <button style={{ padding: '7px 14px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>↻ Another take</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 940, marginTop: 22 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Tone</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(rewrites).map(([k, r]) => (
            <button key={k} onClick={() => setActiveTone(k)} style={{
              padding: '8px 14px',
              background: activeTone === k ? t.accentSoft : t.paper,
              color: activeTone === k ? t.accent : t.ink2,
              border: `1px solid ${activeTone === k ? t.accent : t.rule}`, borderRadius: t.radius,
              fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer',
            }}>{r.label}</button>
          ))}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, marginTop: 14 }}>Custom instruction</div>
        <input placeholder="e.g. keep sensory details, cut dialogue, make it darker…" style={{
          width: '100%', marginTop: 4, padding: '9px 12px',
          background: t.paper, color: t.ink,
          border: `1px solid ${t.rule}`, borderRadius: t.radius, fontSize: 13, outline: 'none',
        }} />
      </div>
    </div>
  );
}

function MetricsMode() {
  const t = useTheme();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
      <div style={{ maxWidth: 940 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { k: 'Flesch reading ease', v: METRICS.flesch,           unit: '/ 100', note: 'Plain English' },
            { k: 'Grade level',         v: METRICS.fleschGrade.toFixed(1), unit: 'US grade', note: 'Your target: 8–10' },
            { k: 'Avg sentence',        v: METRICS.avgSentence.toFixed(1), unit: 'words',    note: METRICS.longSentences + ' long' },
            { k: 'Read time',           v: METRICS.readingMinutes,    unit: 'min',      note: '250 wpm assumed' },
          ].map(m => (
            <div key={m.k} style={{ padding: 16, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>{m.k}</div>
              <div style={{ fontFamily: t.display, fontSize: 30, color: t.ink, marginTop: 6, fontWeight: 500 }}>{m.v}</div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 2 }}>{m.unit.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: t.ink3, marginTop: 4 }}>{m.note}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, padding: 20, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 14 }}>Dials</div>
          {[
            { k: 'Passive voice',  v: METRICS.passive, max: 10, ideal: '≤ 3' },
            { k: 'Adverbs',        v: METRICS.adverbs, max: 10, ideal: '≤ 4' },
            { k: 'Long sentences', v: METRICS.longSentences, max: 5, ideal: '≤ 2' },
          ].map(d => (
            <div key={d.k} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.ink2, marginBottom: 4 }}>
                <span>{d.k}</span>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>{d.v} · IDEAL {d.ideal}</span>
              </div>
              <div style={{ height: 6, background: t.rule, borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${(d.v / d.max) * 100}%`, height: '100%', background: t.good }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, padding: 16, background: t.paper2, border: `1px dashed ${t.accent}`, borderRadius: t.radius, fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>
          <strong style={{ color: t.ink }}>This page vs. your book average:</strong> A shade denser (+1.2 avg sentence words), slightly more adverb-forward (+1), reading level on target. Nothing to fix — just note the rhythm is tighter than ch.11–13.
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ThemeProvider><App /></ThemeProvider>);
