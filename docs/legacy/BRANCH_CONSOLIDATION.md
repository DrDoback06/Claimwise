# Branch Consolidation Notes

## Base
- Source branch at implementation start: `work`
- Active update branch: `loomwright/chatgpt-ai-update-v1`

## Consolidation rules
- Active app updates are made only in `src/features/writers-room/...`.
- Legacy code can be staged under `src/legacy/...` for temporary reference only.
- No runtime imports from `src/legacy` unless explicitly ported.

## Planned salvage targets (reference only)
- `claude/plan-feature-enhancements-gAf4d` (services/components under nested `src/src/...`).
- `loomwright` (documentation/reference extraction only).

## This pass
- Added Loomwright risk-banded queue and entity-event graph foundations.
- Added review automation toggles in Settings.
- Added docs/legacy + src/legacy scaffolding for non-destructive consolidation.
