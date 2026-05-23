<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# platforms

Adapters that wire the brain (`core/`) into specific LLM platforms and coding agents. The brain itself is platform-agnostic; every adapter is a thin shim that translates between the brain's plain-text + JSON outputs and the platform's hook / tool / context API.

> **Licensing note.** Adapters ship under a separate, permissive license (Apache 2.0 intent) so any platform can integrate freely. The `core/` brain is dual-licensed (see root README). Read the root `LICENSE` and the per-adapter notices for binding terms; those legal documents are authored separately, not generated here.

## Adapters

| Adapter | Status | What it does |
|---|---|---|
| [claude/](claude/) | **shipped** | Three hooks: `SessionStart` brief, `UserPromptSubmit` whisper, `PostToolUse` journal. Always-on against Claude Code. |

That's the whole shipped surface. Every other platform integration is open as a community challenge; see [`../CHALLENGES.md`](../CHALLENGES.md) for the list of wanted adapters and what shipping one earns you.

If you're integrating with a self-hosted model, a private API, or an internal coding agent that isn't a public platform, build it locally to the contract below. Open an issue if you want to upstream it.

## The adapter contract

The brain is **always-on** by contract. Steps 1, 2, 3 fire automatically. Steps 4, 5 are on-demand / lifecycle:

1. **Boot.** Once per session. Read at minimum:
   - `<brain>/SPIDERBRAIN.md`
   - `<brain>/spideyorder.md` (top N entries; N depends on your context budget)
   - The current cluster's `webmap.md` if the agent has a current cluster

   Emit these in whatever format your platform consumes as system context.

2. **Per-prompt brief.** Once per user prompt. Receive the prompt text, scan it for filename or cluster mentions, look those up in `<brain>/synganglion.json`, and emit a compact context block:
   - For each matched file: `cluster`, `webscore`, `isMaster`, top of `dependsOn`, top of `dependedOnBy` (with overflow count), plus a `⚠ cascade` warning if it's a master or high-fanout node.
   - For each matched cluster: the top N by webscore.
   - **Silent when nothing matches.** The brain whispers, never chatters.

   See [`claude/hooks/prompt-brief.mjs`](claude/hooks/prompt-brief.mjs) for the canonical implementation.

3. **Journal.** On every tool call that mutates code (Edit, Write, MultiEdit, or your platform's equivalent), append exactly one JSONL line to the current `<brain>/cephalothorax/SESSION-<ts>.jsonl` file:

   ```json
   {"ts":"2026-05-23T12:34:56Z","file":"src/foo.js","tool":"Edit"}
   ```

   **Rules:** dumb, fast, never blocks, swallows all errors, always exits 0.

4. **Query.** Expose the three brain scripts as platform-native tools:
   - `query.mjs <target>` returns relevance-ranked context for a target file or symbol.
   - `cascade.mjs <changed-files...>` returns the blast radius of a proposed change.
   - `molt.mjs` returns the current drift audit.

   All three take `--brain <abs path>` and `--json` for machine-readable output.

5. **Consolidate (optional).** If your platform has a deploy hook or session-end signal, call `consolidate.mjs --brain <abs path>` to fold the cephalothorax journal into permanent `movemap.md`.

The three always-on hooks (1, 2, 3) are **dumb, fast, exit-0**: they never block a session, prompt, or edit. A broken brain must never block a save. The brain itself never imports anything platform-specific; adapters import from `core/` only.

## Minimal skeleton for a new adapter

```
platforms/<your-platform>/
  README.md                  what this adapter does, how to wire it
  hooks/                     (or shim/ - pick a name appropriate to the platform)
    inject-brief.mjs         boot: read the brain on session start, emit in your format
    prompt-brief.mjs         per-prompt: read the prompt, surface targeted brain context
    journal-bridge.mjs       journal: translate your tool-call event to a JSONL append
  tools/                     (if your platform has a function-tool / function-call surface)
    spiderbrain_query.*      tool spec in your platform's format
    spiderbrain_cascade.*    tool spec
    spiderbrain_molt.*       tool spec
```

## Reference

[claude/](claude/) is the smallest working reference. Start by reading the three hooks: `session-brief.mjs`, `prompt-brief.mjs`, `journal.mjs`.

## Shipping yours

[`../CHALLENGES.md`](../CHALLENGES.md) lists the wanted adapters and what landing one earns you. Open an issue titled `CHALLENGE: <adapter-name>` first to coordinate scope. Submit a PR referencing the issue. Apache 2.0 license applies; major contributors are credited in the adapter's README in perpetuity.
