# Legacy Code Reference

This folder contains old Claimwise / pre-consolidation code that is **not imported** by the active Loomwright app.

Rules:
1. Do not import from this folder directly into active app code.
2. If useful logic is needed, port it into `src/features/writers-room/...`.
3. Keep original files here for reference until the entity graph AI update is stable.
4. After the update is deployed, remove unused legacy files in a cleanup PR.
