/**
 * OnboardingHost — small Loomwright-themed chrome around the onboarding wizard.
 *
 * The wizard itself is a large multi-step form (kept intact) that already
 * writes to the shared db / contextEngine; this wrapper only adds a
 * Loomwright header so returning users know the app is Loomwright, and
 * provides the "skip" / "exit" affordance.
 */

import React from 'react';
import OnboardingWizard from '../components/OnboardingWizard';
import { useTheme } from '../loomwright/theme';

export default function OnboardingHost({ onComplete, onExit }) {
  const t = useTheme();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: t.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: `1px solid ${t.rule}`,
          background: t.sidebar,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: t.radius,
              background: t.accent, color: t.onAccent,
              display: 'grid', placeItems: 'center',
              fontFamily: t.display, fontWeight: 600, fontSize: 13, lineHeight: 1,
            }}
          >
            Lw
          </div>
          <div>
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, lineHeight: 1 }}>LOOMWRIGHT</div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.22, textTransform: 'uppercase', marginTop: 3 }}>
              Story Setup
            </div>
          </div>
        </div>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            style={{
              padding: '5px 12px',
              background: 'transparent',
              color: t.ink2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        )}
      </header>
      <div style={{ flex: 1 }}>
        <OnboardingWizard onComplete={onComplete} />
      </div>
    </div>
  );
}
