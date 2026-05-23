---
name: spiderbrain
description: Build and maintain a "spiderbrain" - an externalised, dependency-graphed second brain for a software project that cures project memory loss (forgetting why files exist, what depends on what, and what a past decision was for). Trigger when the user says "spiderbrain", or asks to build / create / refresh a project second brain, score files by importance (webscore), map a project's dependency graph, plan a change's blast radius, or keep project memory alive across sessions.
---
<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Spiderbrain

A **spiderbrain** is a software project's externalised memory - a structured
folder that holds what the project must not forget: why each file exists, how
important it is, what depends on it, and what changed when. It is a cure for
**project Alzheimer's**: the slow loss of project memory as knowledge leaves
people's heads and dependencies (synapses) decay silently until a change in one
place breaks another.

The design is grounded in real spider neuroanatomy. Read
`reference/neuroscience.md` for the science; here is the working vocabulary:

| Term | What it is |
|---|---|
| **spiderbrain** | the second-brain folder itself (the fused *synganglion*) |
| **prey** | the project's single goal - every webscore is judged against it |
| **webscore** | 0.0–10.0 - how much breaks if a file fails (thread tension) |
| **synganglion.json** | the master dependency graph (generated, never hand-edited) |
| **webmap** | one feature cluster's content map - its top-8 "legs" |
| **spideyorder** | every node ranked by webscore (the supraesophageal half) |
| **spideymove** | every node ranked by recency (the subesophageal half) |
| **cephalothorax** | the volatile hot-file journal of the current session |
| **movemap** | the permanent deploy log (long-term memory) |
| **molt** | the read-only drift audit - keeps the brain honest |
| **cell** | a node's polar boundary `r<ring>:<sector>` (webscore band × cluster) |
| **cascade** | the nerve net - propagates a fault, reports its blast radius |
| **dragline** | a snapshot of every curated file; the safety line and the backup |
| **rhythm** | how often a node changes (git commit count) - slow = theta, fast = gamma |
| **master / column** | a slow theta master + the fast gamma legs it governs - 1 + 8 = 9 |
| **amplitude** | live importance: webscore (mass) × how recently the master fired |
| **hard stop** | a gamma fault that climbs into its theta master - the cascade halts there |

## Modes

The skill has four modes. The scripts live in `<SPIDERBRAIN_HOME>/core/scripts/`
(where `<SPIDERBRAIN_HOME>` is the absolute path of your install - see
[`INSTALL.md`](../INSTALL.md) for the canonical conventions). All scripts are
zero-dependency Node and run with any Node ≥ 18.

### BUILD - turn a project into a spiderbrain

Needs a **project directory** and a **prey** (the goal). The brain folder is
created wherever the user wants (a sibling folder keeps it out of the repo).

```
node <SPIDERBRAIN_HOME>/core/scripts/build-brain.mjs \
  --project "<project dir>" --brain "<brain dir>" --prey "<the goal>"
```

This scans the project, derives the import + DB graph, computes webscores, and
scaffolds the whole brain. Then **do the judgement pass**: open
`webscore-overrides.json` and assign devil's-advocate webscores + one-line
roles to the meaningful nodes (see `reference/webscore-rubric.md`), then re-run
`build-brain.mjs` to apply them. Finally write the curated docs - `SPIDERBRAIN.md`
and each cluster's `rules.md` / `config.md` - following `reference/architecture.md`.

### MAINTAIN - keep the brain active

This is the default once a brain exists. Follow `reference/upkeep-protocol.md`:
before editing a file, read its cluster `webmap.md` and scan its dependents
(Portia's rule - plan the blast radius first); after a feature lands, add a
`changelog.md` entry saying **what and why**; at deploy, run consolidate:

```
node <SPIDERBRAIN_HOME>/core/scripts/consolidate.mjs --brain "<brain dir>" --deploy "<label>"
```

Run `molt.mjs` periodically to audit drift:

```
node <SPIDERBRAIN_HOME>/core/scripts/molt.mjs --brain "<brain dir>"
```

### QUERY - ask the brain

```
node <SPIDERBRAIN_HOME>/core/scripts/query.mjs --brain "<brain dir>" "<terms>"
```

Ranks nodes by webscore × recency. A bare cluster name prints that cluster's
card. No terms prints what matters and what is hot.

### CASCADE - test a fault

```
node <SPIDERBRAIN_HOME>/core/scripts/cascade.mjs --brain "<brain dir>" --inject "<nodeId>"
node <SPIDERBRAIN_HOME>/core/scripts/cascade.mjs --brain "<brain dir>" --self-test
```

`--inject` fires the **nerve net** at a node: it propagates a simulated fault
along dependent edges and prints the blast radius, the wavefront (the shockwave
shell by shell), and the polar address of the origin. Poke a node, read the
pain - the fault-injection test harness. `--self-test` sweeps every node and
flags where webscore and topology disagree (the brain auditing its own model).
The same `cascade()` runs on a *real* corruption during build and molt - one
engine, test mode and live defence.

> The import scanner is **JS/TS**. Other stacks are still indexed and scored,
> but their dependency graph must come from `config.extraEdges`.

## Staying active (the always-on contract)

Once installed, a spiderbrain is **active on every prompt, every edit, and
every session** - automatically. Three hooks make that true:

- **`SessionStart` → `session-brief.mjs`.** Once per session, the brain
  announces itself: prey, hottest unconsolidated files, top webscores. The
  agent boots already knowing what matters.
- **`UserPromptSubmit` → `prompt-brief.mjs`.** Per prompt. Reads what the user
  just typed, looks for any filename or cluster mentions in the brain, and
  surfaces the relevant nodes (webscore, master flag, depends-on, depended-on-
  by, cascade hint). Silent when nothing matches - never chatters. This is the
  hook that closes the per-prompt gap: without it, the brain is a library on
  the shelf; with it, the brain whispers when it has something to say.
- **`PostToolUse` (Edit | Write | MultiEdit) → `journal.mjs`.** Per edit.
  Appends one JSONL line to the cephalothorax. Dumb, fast, append-only,
  exit-0. A broken brain must never block a save.

Hook wiring is documented in [`platforms/claude/README.md`](../platforms/claude/README.md).
Every hook tolerates a missing or corrupt brain - they print a tiny warning
(or nothing) and exit 0; they never break a session, prompt, or edit.

The hooks do the mechanical bookkeeping; this skill's upkeep protocol does the
judgement. Together they keep the brain from rotting and keep it within
arm's reach every turn.

## The non-negotiables (lessons built into the design)

- **Derived data is recomputed, never trusted.** The import/DB graph and the
  auto webscores are re-derived from the filesystem on every build - they
  cannot go stale.
- **Curated data is sacred.** `rules.md`, `config.md`, `changelog.md`,
  `movemap.md`, `webscore-overrides.json` and `SPIDERBRAIN.md` are written by
  humans and **never** overwritten by a rebuild.
- **Generated files carry a banner.** Anything with `GENERATED by spiderbrain`
  is disposable - never hand-edit it; edit the curated source and rebuild.
- **Propagation points at dependents.** When a file changes, the files that
  *depend on it* are the ones that may break - that is the direction the brain
  tracks.
- **No hook ever blocks an edit, a prompt, or a session.** All three are
  append-only / read-only, swallow every error, and exit 0 on every path.
