/**
 * Settings — Keys & AI Providers, Data & History (unified backup / sync /
 * versions), Preferences, Dev tools (Mobile Preview + Design & Docs behind
 * a flag per HANDOFF \u00a75.12), and Story Setup re-entry.
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Smartphone, FileText, Download, Archive, History } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import Button from '../loomwright/primitives/Button';
import AIProviders from '../loomwright/providers/AIProviders';
import LegacySettings from '../components/Settings';
import BackupManager from '../components/BackupManager';
import SyncManager from '../components/SyncManager';
import VersionControl from '../components/VersionControl';
import MobileLoomwright from '../loomwright/mobile/MobileLoomwright';
import LoomwrightDocs from '../loomwright/docs/LoomwrightDocs';

const TABS = [
  { id: 'providers',   label: 'Keys & AI Providers' },
  { id: 'data',        label: 'Data & History' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'dev',         label: 'Dev tools' },
  { id: 'setup',       label: 'Story Setup' },
];

const DATA_SECTIONS = [
  { id: 'backup',   label: 'Backup',     icon: Download, desc: 'Export and import a complete copy of your world.' },
  { id: 'sync',     label: 'Sync',       icon: Archive,  desc: 'Move your world across devices via QR code.' },
  { id: 'versions', label: 'Versions',   icon: History,  desc: 'Rewind or restore earlier states of the canon.' },
];

function Section({ title, subtitle, children }) {
  const t = useTheme();
  return (
    <section
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 18,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: t.ink2, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function DevFlag({ label, flag, children }) {
  const t = useTheme();
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem(flag) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(flag, on ? '1' : '0'); } catch { /* noop */ }
  }, [flag, on]);
  return (
    <div
      style={{
        padding: 12,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <label
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: t.font, fontSize: 13, color: t.ink, cursor: 'pointer',
        }}
      >
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
        {label}
      </label>
      {on && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

export default function SettingsPage({ worldState, setWorldState, onRerunOnboarding, onOpenTutorial }) {
  const t = useTheme();
  const [tab, setTab] = useState('providers');
  const [dataSection, setDataSection] = useState('backup');
  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});

  return (
    <Page>
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        subtitle="Keys, data & history, preferences, dev tools and story setup."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody>
        {tab === 'providers' && (
          <AIProviders scoped worldState={worldState} setWorldState={setWorldState} />
        )}

        {tab === 'data' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
            <aside
              style={{
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                padding: 10,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.ink3,
                  letterSpacing: 0.16, textTransform: 'uppercase',
                  padding: '4px 6px',
                }}
              >
                Data & History
              </div>
              {DATA_SECTIONS.map((s) => {
                const Icon = s.icon;
                const on = dataSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDataSection(s.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '8px 10px',
                      background: on ? t.accentSoft : 'transparent',
                      color: on ? t.ink : t.ink2,
                      border: `1px solid ${on ? t.accent : 'transparent'}`,
                      borderRadius: t.radius,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: t.font, fontSize: 12,
                    }}
                  >
                    <Icon size={14} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ color: t.ink, fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                      <div style={{ color: t.ink3, fontSize: 10, marginTop: 2 }}>{s.desc}</div>
                    </div>
                  </button>
                );
              })}
            </aside>
            <div style={{ minWidth: 0 }}>
              {dataSection === 'backup' && (
                <Section title="Backup" subtitle="Export and import your entire Loomwright world as a JSON file.">
                  <BackupManager />
                </Section>
              )}
              {dataSection === 'sync' && (
                <Section title="Sync" subtitle="Move your data between devices via a local QR transfer.">
                  <SyncManager onClose={() => {}} onDataImported={() => window.location.reload()} />
                </Section>
              )}
              {dataSection === 'versions' && (
                <Section title="Versions" subtitle="Snapshots taken every time you weave. Rewind or restore.">
                  <VersionControl actors={actors} books={books} onClose={() => {}} />
                </Section>
              )}
            </div>
          </div>
        )}

        {tab === 'preferences' && (
          <LegacySettings
            onClose={() => {}}
            onRerunOnboarding={onRerunOnboarding}
          />
        )}

        {tab === 'dev' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Section
              title="Dev tools"
              subtitle="Internal surfaces preserved behind flags so you can verify Loomwright changes without polluting the user nav."
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <DevFlag label="Show Mobile Preview" flag="lw-dev-mobile-preview">
                  <div
                    style={{
                      marginTop: 10,
                      height: 560,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                      overflow: 'hidden',
                    }}
                  >
                    <MobileLoomwright
                      scoped
                      worldState={worldState}
                      setWorldState={setWorldState}
                    />
                  </div>
                </DevFlag>
                <DevFlag label="Show Design & Docs" flag="lw-dev-docs">
                  <div
                    style={{
                      marginTop: 10,
                      height: 560,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                      overflow: 'hidden',
                    }}
                  >
                    <LoomwrightDocs scoped />
                  </div>
                </DevFlag>
                <div
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: 12,
                    background: t.paper,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    fontSize: 12, color: t.ink2,
                  }}
                >
                  <Smartphone size={14} color={t.accent} />
                  Mobile build:&nbsp;<code>npm run cap:build:ios</code> /&nbsp;
                  <code>npm run cap:build:android</code>.
                </div>
                <div
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: 12,
                    background: t.paper,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    fontSize: 12, color: t.ink2,
                  }}
                >
                  <FileText size={14} color={t.accent} />
                  SW cache version auto-stamps at build via <code>scripts/prebuild-sw.js</code>.
                </div>
              </div>
            </Section>
          </div>
        )}

        {tab === 'setup' && (
          <div
            style={{
              padding: 20,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              color: t.ink,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink }}>Story Setup</div>
            <div style={{ color: t.ink2, fontSize: 12, maxWidth: 560 }}>
              Re-run the Loomwright onboarding wizard to adjust your premise,
              characters, world rules, plot beats, style rules and AI keys.
              Your existing data is preserved; the wizard only updates fields
              you change.
            </div>
            <Button variant="primary" icon={<RefreshCw size={12} />} onClick={onRerunOnboarding}>
              Re-run story setup
            </Button>
            <div style={{ color: t.ink3, fontSize: 11, marginTop: 6 }}>
              Want a refresher on each workspace? Replay the tutorial tour.
            </div>
            <Button variant="default" onClick={() => onOpenTutorial?.()}>
              Replay tutorial tour
            </Button>
          </div>
        )}
      </PageBody>
    </Page>
  );
}
