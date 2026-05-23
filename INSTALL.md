<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# INSTALL - spiderbrain v3

> Two install patterns. Pick one. Verify it. Then wire the hooks.

Throughout the rest of the docs, `<SPIDERBRAIN_HOME>` refers to the absolute path where you installed this package. Substitute the literal path everywhere you see it.

---

## Prerequisites

- **Node ≥ 18** with ESM support. (`node --version` to check.)
- **Git** - spiderbrain reads `git log` to compute file recency, not file `mtime`.
- **A project to build the brain on** - your codebase, on disk.
- *(Optional but recommended)* **Claude Code** if you want the always-on hooks.

---

## Pick an install pattern

### Pattern A - Claude Code skill (recommended)

If you use Claude Code, install spiderbrain as a global skill so it activates whenever you say "spiderbrain" in any project.

```
git clone https://github.com/SaroirCommunity/Spiderbrain-V3 ~/.claude/skills/spiderbrain
```

Or just copy-paste the package folder into `~/.claude/skills/spiderbrain/`.

Then:
- **macOS / Linux:** `<SPIDERBRAIN_HOME>` = `~/.claude/skills/spiderbrain`
- **Windows:** `<SPIDERBRAIN_HOME>` = `C:\Users\<you>\.claude\skills\spiderbrain`

### Pattern B - Standalone clone (any platform)

If you're integrating with Cursor / OpenAI / Gemini / a custom agent - or you just want the brain without the Claude Code skill - clone the repo anywhere.

```
git clone https://github.com/SaroirCommunity/Spiderbrain-V3 ~/code/spiderbrain-v3
```

Then `<SPIDERBRAIN_HOME>` = `~/code/spiderbrain-v3` (or wherever you put it).

Optionally set it as an env var for convenience:
- **macOS / Linux:** `export SPIDERBRAIN_HOME=~/code/spiderbrain-v3`
- **Windows (PowerShell):** `$env:SPIDERBRAIN_HOME = "C:\Users\<you>\code\spiderbrain-v3"`

---

## Verify the install

One command, no arguments:

```
node <SPIDERBRAIN_HOME>/core/scripts/verify.mjs
```

Expected output ends with `Install OK.` and `exit 0`. If you see any `[FAIL]` rows, the package is incomplete - re-clone or re-copy and try again.

What it checks:
- Node version ≥ 18
- All five `core/scripts/*.mjs` entrypoints (`build-brain`, `consolidate`, `cascade`, `query`, `molt`)
- All eight `core/scripts/lib/*.mjs` modules
- All three Claude hook files (`session-brief`, `prompt-brief`, `journal`)
- The `core/SKILL.md` and `core/README.md` are present and non-empty

---

## Build your first brain

```
node <SPIDERBRAIN_HOME>/core/scripts/build-brain.mjs \
  --project "<abs path to your project>" \
  --brain   "<abs path for the brain folder>" \
  --prey    "<the single goal this project serves>"
```

**Conventions:**
- **Brain folder**: a sibling of the project, named `<projectname>spiderbrain/`. Keeps it out of the project's git tree.
- **Prey** is the project's single goal - what it exists to do. Example: *"Ship qualified leads from enterprise visitors while the site stays fast and credible."* Every webscore is judged against this; pick it carefully.

After the first build, open `webscore-overrides.json` in the brain folder and assign devil's-advocate scores to the meaningful nodes (see [`core/reference/webscore-rubric.md`](./core/reference/webscore-rubric.md)). Re-run `build-brain.mjs` to apply.

---

## Wire the hooks (Claude Code)

For the always-on contract - brain active **per session, per prompt, and per edit** - add the three hooks to your project's `.claude/settings.local.json`:

```jsonc
{
  "hooks": {
    "SessionStart": [
      { "command": "node",
        "args": [
          "<SPIDERBRAIN_HOME>/platforms/claude/hooks/session-brief.mjs",
          "--brain", "<abs path to your brain folder>"
        ] }
    ],
    "UserPromptSubmit": [
      { "command": "node",
        "args": [
          "<SPIDERBRAIN_HOME>/platforms/claude/hooks/prompt-brief.mjs",
          "--brain", "<abs path to your brain folder>"
        ] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write|MultiEdit",
        "command": "node",
        "args": [
          "<SPIDERBRAIN_HOME>/platforms/claude/hooks/journal.mjs",
          "--brain",   "<abs path to your brain folder>",
          "--project", "<abs path to your project>"
        ] }
    ]
  }
}
```

Substitute the *literal* absolute paths for `<SPIDERBRAIN_HOME>`, the brain folder, and the project. The hooks are **additive** - they merge with anything else in `settings.local.json`, never replace it.

Per-hook contract and behaviour guarantees in [`platforms/claude/README.md`](./platforms/claude/README.md).

---

## What now

- [`README.md`](./README.md) - conceptual overview, architecture diagram, cost reduction.
- [`core/SKILL.md`](./core/SKILL.md) - BUILD / MAINTAIN / QUERY / CASCADE modes.
- [`core/reference/`](./core/reference/) - architecture spec, neuroscience grounding, webscore rubric, upkeep protocol.
- [`AGENTS.md`](./AGENTS.md) - operating manual if you (or an AI agent) are about to *work on* spiderbrain itself.
- [`docs/cost-reduction-analysis.md`](./docs/cost-reduction-analysis.md) - the receipts behind every cost claim.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `node: command not found` when a hook fires | Node not in PATH at session start. Hooks exit 0 silently - session continues without the brain. | Add Node to PATH and reload the session. |
| `verify.mjs` reports `[FAIL]` rows | Incomplete clone / copy. | Re-clone or re-copy and re-run. |
| Hooks fire but `additionalContext` never reaches the prompt | `--brain` path mismatch in `settings.local.json`. | Re-check it's the absolute path to the *brain* folder, not the project. |
| `synganglion.json not found` style errors | `build-brain.mjs` hasn't been run yet, or `--brain` points to an empty folder. | Run `build-brain.mjs` first. |
| Prompt feels slower after wiring `UserPromptSubmit` | Hook is hitting its time budget (80 ms in-script). | Should be invisible on brains under a few MB. If you see it on a smaller brain, file an issue with `time node …/prompt-brief.mjs` output. |
| Cache feels stale (graph changed but hook still shows old context) | Cache invalidates on `synganglion.json` mtime+size. If you wrote the graph in a way that didn't bump mtime, force-touch it: `touch <brain>/synganglion.json` (macOS/Linux) or `(Get-Item synganglion.json).LastWriteTime = Get-Date` (PowerShell). | Or just re-run `build-brain.mjs`. |

---

## Uninstall

The brain is local files only. To remove:
- Delete `<SPIDERBRAIN_HOME>/` (the package).
- Delete `<brain folder>/` per project (the externalised memory).
- Remove the three hook blocks from any `.claude/settings.local.json`.

No registry entries, no daemons, no remote state. The brain is yours.
