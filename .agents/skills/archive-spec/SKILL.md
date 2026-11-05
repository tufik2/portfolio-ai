---
name: archive-spec
description: Archive a completed spec by moving its folder from specs/ into specs/archived/. Use when the user asks to archive, close or finish a spec.
argument-hint: <spec-folder-or-name>
---

# Archive spec

Move a completed spec folder from `specs/` to `specs/archived/`.

## Steps

1. Get the spec identifier from the arguments (`$ARGUMENTS`). It can be the full folder name (e.g. `20261104153000-user-login`) or just the spec name (e.g. `user-login`). If none was given, list the folders in `specs/` (excluding `archived`) and ask which one to archive.
2. Resolve it to exactly one folder directly under `specs/` (never inside `specs/archived/`):
   - Exact folder name match first.
   - Otherwise match folders ending in `-<spec-name>`.
   - If there are zero matches, tell the user and stop. If there are several, list them and ask which one.
3. Confirm the spec is complete: read `tasks.md` and check for unchecked items (`- [ ]`). If any remain, show them and ask the user whether to archive anyway.
4. Move it:

```bash
mkdir -p specs/archived
mv "specs/<folder>" "specs/archived/<folder>"
ls specs/archived
```

5. Report the new path to the user.

## Rules

- Never overwrite: if `specs/archived/<folder>` already exists, stop and tell the user.
- Only move the folder — do not edit or delete any of its files.
