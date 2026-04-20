/**
 * Settings — the one settings tab, with internal tabs for keys/providers,
 * data & history (backup / sync / version control) and preferences, and a
 * "Re-run story setup" entry point to launch the onboarding wizard again.
 */

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import Button from '../loomwright/primitives/Button';
import AIProviders from '../loomwright/providers/AIProviders';
import LegacySettings from '../components/Settings';
import BackupManager from '../components/BackupManager';
import SyncManager from '../components/SyncManager';
import VersionControl from '../components/VersionControl';

const TABS = [
  { id: 'providers', label: 'Keys & AI Providers' },
  { id: 'data', label: 'Data & History' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'setup', label: 'Story Setup' },
];

export default function SettingsPage({ worldState, setWorldState, onRerunOnboarding }) {
  const t = useTheme();
  const [tab, setTab] = useState('providers');
  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});

  return (
    <Page>
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        subtitle="Keys, data, preferences and story setup."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody>
        {tab === 'providers' && (
          <AIProviders worldState={worldState} setWorldState={setWorldState} />
        )}
        {tab === 'data' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <section>
              <SectionHeader title="Backup" subtitle="Export and import your story data." />
              <BackupManager />
            </section>
            <section>
              <SectionHeader title="Sync" subtitle="Sync your world across devices." />
              <SyncManager onClose={() => {}} onDataImported={() => window.location.reload()} />
            </section>
            <section>
              <SectionHeader title="Version History" subtitle="Rewind or restore previous states." />
              <VersionControl actors={actors} books={books} onClose={() => {}} />
            </section>
          </div>
        )}
        {tab === 'preferences' && (
          <LegacySettings
            onClose={() => {}}
            onRerunOnboarding={onRerunOnboarding}
          />
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
          </div>
        )}
      </PageBody>
    </Page>
  );
}

function SectionHeader({ title, subtitle }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink }}>{title}</div>
      <div style={{ fontSize: 11, color: t.ink2 }}>{subtitle}</div>
    </div>
  );
}
