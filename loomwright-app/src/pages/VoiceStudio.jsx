/**
 * VoiceStudio page — mount the Loomwright Voice Studio full-bleed.
 *
 * The underlying VoiceStudio component already wraps itself in a
 * LoomwrightShell, so we just size it to fill the Loomwright main area.
 */

import React from 'react';
import VoiceStudio from '../loomwright/voice/VoiceStudio';

export default function VoiceStudioPage({ worldState, setWorldState }) {
  return (
    <div style={{ height: '100%' }}>
      <VoiceStudio scoped worldState={worldState} setWorldState={setWorldState} />
    </div>
  );
}
