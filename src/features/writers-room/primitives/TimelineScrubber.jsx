// Loomwright — Timeline Scrubber primitive (CODE-INSIGHT §2 / §12).
//
// Thin wrapper around ChapterStrip. Kept as a separate export so existing
// callers (Dossier, Atlas) don't have to be rewritten — they get the
// numbered scrollable strip "for free".
//
// Use mode='scrub' so the panel can time-travel without changing the
// editor's globally-active chapter (legacy behaviour).

import React from 'react';
import ChapterStrip from './ChapterStrip';

export default function TimelineScrubber({ value, onChange, label = 'Chapter' }) {
  return (
    <ChapterStrip
      mode="scrub"
      value={value}
      onChange={onChange}
      label={label}
    />
  );
}
