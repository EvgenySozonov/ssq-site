---
title: Migrate SSQ-site wiring from graft to Trail-code (v0.23.0)
author: EvgenySozonov
date: 2026-10-19
branch: main
cost: { minutes: 12, tokens: 1169878 }
touches:
  - site/src/data/site.json
---

## Decided
- Trail-code is the same codebase as graft 0.23.0 (rebrand, both npm packages sync-published), so we migrate with `trail init --agents claude --no-statusline` right after installing `@trailhq/trail-code` globally.
- Telemetry is disabled first thing: `trail telemetry disable` (the machine-level switch), because the project forbids sending data to external services; the endpoint was events.nanonets.com. A leftover queued batch stays unsent — the gate sits before the flush.
- Keep the user's custom statusline (`ssq-statusline.mjs`) with `--no-statusline`: trail would otherwise write its own statusline shim.
- Prettier PostToolUse hook is hand-restored after init: trail init deletes the whole old graft hook group in `.claude/settings.json`, and our Prettier hook was inside that group (README prettier hook for `*/site/*` edits, timeout 30, jq file_path extraction).

## Tried and ruled out
- Day-one import (`trail init` reads past Claude sessions) from inside a Claude Code session: the nested headless `claude -p` returns empty here, so the import fails with "couldn't read your past sessions". It must be run by the person in their own terminal, where the interactive picker also appears so findings can be ticked.
- Editing `~/.zshrc` to make DO_NOT_TRACK persistent: blocked (outside-project file). `trail telemetry disable` alone is sufficient; the env var is only a belt-and-braces fallback.

## Watch out
- `trail init` (any future version bump) deletes graft hook entries wholesale — re-check the diff of `.claude/settings.json` after every init and restore custom hooks (Prettier) and the `ssq-protected-files` PreToolUse entry if it disappears.
- `.claude/handlers/graft-statusline.cjs` (actually `.claude/helpers/`) was deleted by init as an obsolete duplicate — correct, but verify custom statusline still resolves to `ssq-statusline.mjs`.
- MCP wiring for Claude Code is gone by design (v0.23 uses one SessionStart hook + `.trail/hook.cjs`); the graph lives in `.trail/cache/` (gitignored), learnings in `.trail/learnings/` (committed).
- The map moves without a rebuild, so a fresh `trail status` should say "in sync" — confirm before trusting after any init.
