// Loomwright — Voice panel. 2026-04 simplification: paste-and-analyze is
// the primary path. The AI reads samples and returns a natural-language
// description + fingerprint + tics + dialect. Dials are hidden behind a
// "Tune" disclosure for power users.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import { characterById, activeChapter } from '../../store/selectors';
import { profileFromSamples, scoreParagraph } from './scoring';
import { analyzeVoice } from '../../voice/analyzeService';

const DIAL_KEYS = [
  { key: 'lyric',          label: 'Lyric ⇄ Plain' },
  { key: 'sentenceLen',    label: 'Short ⇄ Long sentences' },
  { key: 'subordination',  label: 'Parataxis ⇄ Subordination' },
  { key: 'sensoryDensity', label: 'Sparse ⇄ Sensory' },
  { key: 'distance',       label: 'Close ⇄ Distant' },
  { key: 'tension',        label: 'Calm ⇄ Tense' },
];

export default function VoicePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const cast = store.cast || [];
  const profiles = store.voice || [];
  const charId = sel.character || cast[0]?.id;
  const character = charId ? characterById(store, charId) : null;
  const profile = profiles.find(p => p.characterId === charId);

  const [sample, setSample] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showTune, setShowTune] = React.useState(false);

  const updateProfile = (patch) => {
    if (!charId) return;
    store.setSlice('voice', vs => {
      const arr = vs || [];
      const i = arr.findIndex(v => v.characterId === charId);
      const merged = {
        id: profile?.id || `voice_${charId}`,
        characterId: charId,
        ...(profile || {}),
        ...patch,
      };
      if (i >= 0) return arr.map((x, j) => j === i ? merged : x);
      return [...arr, merged];
    });
  };

  const teach = async () => {
    if (!sample.trim() || !charId || busy) return;
    setBusy(true); setError(null);
    const samples = [...(profile?.samples || []), { text: sample, at: Date.now() }];
    // Save the sample first, even if analysis fails.
    updateProfile({ samples });
    try {
      const r = await analyzeVoice(store, { character, samples });
      if (r.error) {
        setError(r.error);
        return;
      }
      updateProfile({
        description: r.description,
        fingerprint: r.fingerprint,
        tics: r.tics,
        dialect: r.dialect,
        hooks: r.hooks,
        dials: r.dials,
        analyzedAt: Date.now(),
      });
      setSample('');
    } catch (err) {
      setError(err?.message || 'analysis failed');
    } finally {
      setBusy(false);
    }
  };

  const reanalyze = async () => {
    if (!profile?.samples?.length || busy) return;
    setBusy(true); setError(null);
    try {
      const r = await analyzeVoice(store, { character, samples: profile.samples });
      if (r.error) { setError(r.error); return; }
      updateProfile({
        description: r.description,
        fingerprint: r.fingerprint,
        tics: r.tics,
        dialect: r.dialect,
        hooks: r.hooks,
        dials: r.dials,
        analyzedAt: Date.now(),
      });
    } finally { setBusy(false); }
  };

  return (
    <PanelFrame
      title="How they sound"
      eyebrow="Voice"
      accent={PANEL_ACCENT.voice}
      panelId="voice"
      onClose={onClose}
      width={460}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
        }}>Profiles</div>
        {cast.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Add a character first.
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {cast.map(c => {
            const p = profiles.find(x => x.characterId === c.id);
            const taught = p?.description || (p?.samples || []).length > 0;
            return (
              <button key={c.id} onClick={() => select('character', c.id)} style={{
                padding: '4px 10px',
                background: charId === c.id ? (c.color || t.accent) + '22' : 'transparent',
                border: `1px solid ${charId === c.id ? (c.color || t.accent) : t.rule}`,
                borderRadius: 1, cursor: 'pointer',
                fontFamily: t.display, fontSize: 12, color: t.ink,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, background: c.color || t.accent, borderRadius: '50%' }} />
                {c.name}
                {taught && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.good }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {character && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${t.rule}` }}>
          <div style={{
            fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginBottom: 4,
          }}>{character.name}</div>
          {profile?.fingerprint && (
            <div style={{
              fontFamily: t.mono, fontSize: 10, color: character.color || PANEL_ACCENT.voice,
              letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8,
            }}>{profile.fingerprint}</div>
          )}

          {/* Description — editable natural-language summary */}
          <div style={lbl(t)}>How they sound</div>
          <textarea
            rows={4}
            value={profile?.description || ''}
            onChange={e => updateProfile({ description: e.target.value })}
            placeholder={profile?.samples?.length
              ? 'Hit "Teach" with a sample below to have the AI fill this in.'
              : 'Paste a paragraph below in their voice and the AI will describe it here. Or write the description yourself.'}
            style={{
              width: '100%', padding: '8px 10px', marginTop: 4,
              fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.55,
              background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2, outline: 'none',
            }}
          />

          {/* Dialect */}
          <div style={lbl(t)}>Dialect & register</div>
          <input
            value={profile?.dialect || ''}
            onChange={e => updateProfile({ dialect: e.target.value })}
            placeholder="e.g. clipped, rural, rarely uses contractions"
            style={inp(t)}
          />

          {/* Tics & hooks */}
          {(profile?.tics?.length || profile?.hooks?.length) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              {profile?.tics?.length > 0 && (
                <div>
                  <div style={lbl(t)}>Tics</div>
                  <ChipList t={t} items={profile.tics} accent={t.accent}
                    onChange={tics => updateProfile({ tics })} />
                </div>
              )}
              {profile?.hooks?.length > 0 && (
                <div>
                  <div style={lbl(t)}>Hook phrases</div>
                  <ChipList t={t} items={profile.hooks} accent={character.color || t.accent}
                    onChange={hooks => updateProfile({ hooks })} />
                </div>
              )}
            </div>
          ) : null}

          {/* Tune (advanced dials) */}
          <button onClick={() => setShowTune(s => !s)} style={{
            marginTop: 14, padding: '4px 10px', background: 'transparent', color: t.ink3,
            border: `1px dashed ${t.rule}`, borderRadius: 999, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
          }}>{showTune ? 'Hide tune' : 'Tune (advanced)'}</button>

          {showTune && (
            <div style={{
              marginTop: 10, padding: 10, background: t.paper2,
              border: `1px solid ${t.rule}`, borderRadius: 2,
            }}>
              {DIAL_KEYS.map(d => {
                const v = profile?.dials?.[d.key] ?? 0.5;
                return (
                  <div key={d.key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>{d.label}</span>
                      <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{v.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={v}
                      onChange={e => updateProfile({ dials: { ...(profile?.dials || {}), [d.key]: Number(e.target.value) } })}
                      style={{ width: '100%', accentColor: character.color || t.accent }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Sample teach */}
          <div style={lbl(t)}>Teach with a sample</div>
          <textarea
            rows={3} placeholder="Paste a paragraph in this character's voice…"
            value={sample} onChange={e => setSample(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px', marginTop: 4,
              fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
              background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <button onClick={teach} disabled={!sample.trim() || busy} style={{
              padding: '7px 14px',
              background: sample.trim() && !busy ? PANEL_ACCENT.voice : t.rule,
              color: sample.trim() && !busy ? t.onAccent : t.ink3,
              border: 'none', borderRadius: 2,
              fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
              textTransform: 'uppercase', cursor: sample.trim() && !busy ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}>{busy ? 'Listening…' : '✦ Teach'}</button>
            {(profile?.samples || []).length > 0 && (
              <button onClick={reanalyze} disabled={busy} style={{
                padding: '6px 10px', background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
                fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase',
              }}>Re-analyse {profile.samples.length} sample{profile.samples.length === 1 ? '' : 's'}</button>
            )}
            {error && <span style={{ fontFamily: t.display, fontSize: 12, color: t.bad }}>{error}</span>}
          </div>
          {(profile?.samples || []).length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{
                cursor: 'pointer',
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.14, textTransform: 'uppercase',
              }}>{profile.samples.length} sample{profile.samples.length === 1 ? '' : 's'} on file</summary>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {profile.samples.map((s, i) => (
                  <div key={i} style={{
                    padding: 6, background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2,
                    fontFamily: t.display, fontSize: 11, color: t.ink2, fontStyle: 'italic',
                    whiteSpace: 'pre-wrap',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontFamily: t.mono, fontSize: 9, color: t.ink3, marginBottom: 2,
                    }}>
                      <span>#{i + 1}</span>
                      <button onClick={() => updateProfile({ samples: profile.samples.filter((_, j) => j !== i) })}
                        style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
                    </div>
                    {(s.text || '').slice(0, 240)}{(s.text || '').length > 240 ? '…' : ''}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {character && <ParagraphMatchList character={character} profile={profile} />}
    </PanelFrame>
  );
}

function ChipList({ t, items, accent, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {items.map((tic, i) => (
        <span key={i} style={{
          padding: '2px 8px', background: t.paper, border: `1px solid ${accent}55`,
          borderRadius: 999, fontFamily: t.mono, fontSize: 9, color: t.ink2,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {tic}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={{
            background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 11, padding: 0, lineHeight: 1,
          }}>×</button>
        </span>
      ))}
    </div>
  );
}

function ParagraphMatchList({ character, profile }) {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);

  const heuristicProfile = React.useMemo(() => {
    if (profile?.dials || profile?.samples?.length) {
      const samples = (profile?.samples || []).map(s => s.text).filter(Boolean);
      const text = [character?.voice, character?.dossier?.voice, ...samples].filter(Boolean).join('\n');
      return profileFromSamples(text);
    }
    return profileFromSamples([character?.voice, character?.dossier?.voice].filter(Boolean).join('\n'));
  }, [profile, character]);

  if (!heuristicProfile || !ch?.paragraphs?.length) return null;

  const scores = ch.paragraphs.map(p => ({
    id: p.id, text: p.text,
    score: scoreParagraph(p.text, heuristicProfile),
  })).filter(s => s.score != null);

  if (!scores.length) return null;
  const jumpTo = (pid) => {
    const el = document.querySelector(`[data-paragraph-id="${pid}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.rule}` }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
      }}>Per-paragraph match · this chapter</div>
      {scores.map(s => {
        const colour = s.score > 0.85 ? t.good : s.score > 0.7 ? t.warn : t.bad;
        return (
          <div key={s.id} onClick={() => jumpTo(s.id)}
            style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', cursor: 'pointer' }}>
            <span style={{ fontFamily: t.mono, fontSize: 10, color: colour, width: 30, textAlign: 'right' }}>
              {Math.round(s.score * 100)}
            </span>
            <span style={{ width: 80, height: 3, background: t.rule, borderRadius: 1, overflow: 'hidden' }}>
              <span style={{ display: 'block', width: `${s.score * 100}%`, height: '100%', background: colour }} />
            </span>
            <span style={{
              flex: 1, fontFamily: t.display, fontSize: 11, color: t.ink2, fontStyle: 'italic',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{(s.text || '').slice(0, 60)}{s.text?.length > 60 ? '…' : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

function lbl(t) {
  return {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 12,
  };
}
function inp(t) {
  return {
    width: '100%', padding: '6px 8px', marginTop: 4,
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2, outline: 'none',
  };
}
