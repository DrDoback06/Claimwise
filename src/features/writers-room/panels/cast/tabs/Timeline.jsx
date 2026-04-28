// Loomwright — Cast dossier · Timeline section.
//
// Reuses the existing EntityTimeline component to surface every
// entityEvent (from the deep-extract pipeline) that references this
// character. Stat changes, status changes, decisions, emotional beats,
// relationship shifts — all in chapter order.

import React from 'react';
import EntityTimeline from '../../../entities/EntityTimeline';

export default function TimelineTab({ character: c }) {
  return <EntityTimeline entityType="character" entityId={c.id} title={`${c.name || 'Character'} · timeline`} />;
}
