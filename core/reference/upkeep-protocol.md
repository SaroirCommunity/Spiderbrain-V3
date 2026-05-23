<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# The upkeep protocol

A spiderbrain is only worth having if it stays true. This is the protocol that
keeps it active. Hooks do the mechanical bookkeeping; the agent does the
judgement. Both are required - neither alone is enough.

## What the hooks do (mechanical, automatic)

- **`SessionStart` → `session-brief.mjs`** - at the start of every session the
  brain announces itself: the prey, the hot files still in the cephalothorax,
  the top of spideyorder. The brain speaks first, so it is never forgotten.
- **`PostToolUse` (Edit/Write) → `journal.mjs`** - every edited project file is
  appended to the current `cephalothorax/SESSION-*.jsonl`. Append-only, no
  graph parse, always exits 0 - it can never slow down or block an edit.

The hooks capture *what happened*. They do not judge. That is the agent's job.

## What the agent does (judgement, every time the skill is active)

### At the start of work

Read `SPIDERBRAIN.md`. Read the `webmap.md` of the cluster you are about to
work in. You now know the feature's legs and what is wired to what.

### Before editing a file - Portia's rule

A Portia spider scans the whole route before it moves. Do the same:

1. Find the file's node in `synganglion.json` (or its cluster `webmap.md`).
2. Read its **`dependedOnBy`** - the files that will be affected if you change
   its behaviour. That list *is* the blast radius.
3. Check **`dependencyChangedAt`** - has something this file relies on already
   moved? If so, this file may already be stale.
4. Now you can estimate the change: not just this file, but the cascade. Plan,
   then move.

### After a feature lands

Add an entry to the cluster's `changelog.md`: a `###` heading
`YYYY-MM-DD - title`, then **what changed** and, above all, **why**. The why is
the one thing no tool can ever re-derive - it is the whole reason the curated
layer exists. If a file's responsibility changed, re-judge its webscore in
`webscore-overrides.json` and say so in the changelog.

### At deploy - consolidate ("sleep")

```
node <skill>/scripts/consolidate.mjs --brain "<brain>" --deploy "<label>"
```

This rebuilds the graph from the filesystem, folds the session's cephalothorax
journals into the permanent `movemap.md` grouped by cluster, and clears the
journals. A brain that never consolidates is a brain that never sleeps - it
will not remember the day. Run it on every deploy.

### Periodically - molt (the drift audit)

```
node <skill>/scripts/molt.mjs --brain "<brain>"
```

`molt.mjs` rescans the project and diffs reality against the stored brain. It
**never mutates** anything - it only reports. Read `molt-report.md`:

- **orphan nodes** - a file was deleted; remove it from the brain or restore it.
- **unindexed files** - new files the brain has not seen; run `build-brain.mjs`.
- **dangling edges** - an edge points at a node that no longer exists.
- **webscore divergence** - informational; confirm each big gap is a deliberate
  runtime-entrypoint judgement, not an oversight.

A clean molt means the brain still matches the code. Run it weekly, and always
after a large refactor.

### Before a risky change - inject the fault

```
node <skill>/scripts/cascade.mjs --brain "<brain>" --inject "<nodeId>"
```

Before touching a load-bearing node, fire the nerve net at it: the cascade
report is the blast radius made concrete - every node that breaks, how fast,
across which cells. `cascade.mjs --self-test` sweeps every node and flags where
webscore and topology disagree; run it after re-judging scores or adding edges.

## The rebuild discipline

- **Generated files** (`synganglion.json`, `spideyorder.md`, `spideymove.md`,
  every `webmap.md`, `molt-report.md`) - never hand-edit. They carry a banner.
  To change them, change the curated source and rebuild.
- **Curated files** (`spiderbrain.config.json`, `webscore-overrides.json`,
  `SPIDERBRAIN.md`, every `rules.md` / `config.md` / `changelog.md`,
  `movemap.md`) - edit these freely. A rebuild will never overwrite them.
- After editing `webscore-overrides.json` or `spiderbrain.config.json`, re-run
  `build-brain.mjs` so the graph and views pick up the change.

## Why this works against project Alzheimer's

Memory is lost three ways; the protocol blocks each one:

1. **Knowledge leaves with people** → it is externalised in curated files that
   outlive any session.
2. **Synapses decay silently** → every dependency is an explicit, recomputed
   edge; `dependencyChangedAt` makes a moved dependency visible from the
   dependent's side.
3. **The record itself rots** → derived data is always recomputed (it cannot go
   stale), and `molt.mjs` continuously audits the curated layer against
   reality. A brain that reports its own holes stays honest.
