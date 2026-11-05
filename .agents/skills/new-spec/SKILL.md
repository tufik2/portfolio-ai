---
name: new-spec
description: Create a new spec folder under specs/ named `${timestamp}-${spec-name}/` containing empty plan.md, spec.md and tasks.md files. Use when the user asks to create, start, generate or scaffold a new spec.
argument-hint: <spec-name>
---

# New spec

Scaffold a new spec folder inside `specs/`.

## Steps

1. Get the spec name from the arguments (`$ARGUMENTS`). If none was given, ask the user for one.
2. Normalize the name to kebab-case: lowercase, spaces/underscores → `-`, strip characters other than `a-z`, `0-9` and `-`, collapse repeated `-`, trim leading/trailing `-`.
3. Generate the timestamp in `YYYYMMDDHHMMSS` format (local time).
4. Create the folder and the three empty files from the project root:

```bash
name="<normalized-spec-name>"
ts="$(date +%Y%m%d%H%M%S)"
dir="specs/${ts}-${name}"
mkdir -p "$dir"
touch "$dir/plan.md" "$dir/spec.md" "$dir/tasks.md"
ls -la "$dir"
```

5. Report the created path to the user.

## Rules

- The files must be created **empty** — do not write any content into them.
- Never overwrite an existing folder; if the path already exists, stop and tell the user.
- Do not create anything under `specs/archived/`.
- If there is something out of scope, please suggest me a recomendation, like use this dependency to fullfill the requirement.
