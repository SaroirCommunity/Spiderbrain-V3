<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Design Concepts

The 11 design pillars of spiderbrain, honestly tagged. Read this page to understand what v3 actually does, what is planned, what lives commercially, and where each pillar is implemented in the code.

This page replaces an earlier set of 19 single-concept README files (`core/hallucinationdefense/`, `core/overlapdriftredundency/`, etc.). Those folders read as a sales surface; they have been collapsed into this single honest page.

## How to read this page

Each pillar carries one of four tags:

- `[shipped]` - implemented in v3 today. The receipt is a pointer to the code.
- `[partial]` - the primitive or data layer exists; the automation around it is planned for v4.
- `[planned v4]` - designed; not yet in v3 even in primitive form.
- `[commercial]` - built on the open core but lives in the enterprise modules, not in this repo.

A pillar can carry multiple tags. *Routing*, for example, is `[partial]` in v3 (the signals exist), `[planned v4]` for a reference router, and `[commercial]` for the auto-tuning sidecar.

If a feature is described here without a tag, treat it as **not implemented** by default. Promises require receipts.

---

## 1. Hallucination defense

The brain's defence against the model inventing a fact that contradicts the project. Specifically: claims about file paths, function names, edges, blast radius, or behaviour that the graph or the cluster rules can falsify.

### 1.1 Cross-reference  `[shipped]`

Every model claim about a file or edge can be cross-referenced against `synganglion.json`, which is the source of truth for the import + FK graph. The agent never paraphrases the graph from memory; it reads the actual edges.

- **Code:** [`scripts/lib/scan.mjs`](scripts/lib/scan.mjs) (extraction), [`scripts/lib/graph.mjs`](scripts/lib/graph.mjs) (build), [`scripts/query.mjs`](scripts/query.mjs) (lookup).
- **Mechanism:** pre-rendered `webmap.md` per cluster is the agent's reading surface; the underlying JSON is the audit trail.
- **What it catches:** false-positive grep hits; phantom imports; blast-radius understatements ("this only affects one file" when `dependedOnBy` lists 14).
- **What it doesn't catch:** edges that aren't expressible as imports or FKs (runtime monkeypatching, dynamic SQL strings). The graph is honest about these - they are missing edges, not hallucinated ones - but the agent can still hallucinate around them.

### 1.2 Confabulation detection  `[partial]`

A confabulation is a claim made without supporting evidence in the brain. Distinct from a cross-reference failure (where the graph actively contradicts), this is the silent kind: an invented function name, a made-up cluster boundary, a "rule" the agent invented.

- **What v3 has:** cluster `rules.md` files carry explicit invariants ("never write email to contrib_db", "the database boundary is sacred"). When the agent reads a cluster's `rules.md` on entry and later proposes a violation, the rule sits in its context window and it self-corrects.
- **Receipt:** the Saroir cross-boundary test (scenario S3 in [`../docs/benchmarks.md`](../docs/benchmarks.md)) - the agent refused a hallucinated boundary violation that the control run committed.
- **What v4 adds:** symbol-level scanning so the graph carries exported symbol nodes, not just file nodes. Confabulation then becomes "claim references a symbol with no node," automatically detectable.
- **What v4 also adds:** auto-load of the current cluster's `rules.md` into every prompt context (today the agent reads it on demand).

### 1.3 Validation loops  `[partial]`

Before the agent commits an edit, replay the proposed change through `cascade.mjs` and refuse the write if the cascade hits a master without an explicit re-validation pass.

- **What v3 has:** the cascade engine ([`scripts/lib/nervenet.mjs`](scripts/lib/nervenet.mjs)) is correct, deterministic, and produces the `hardStop` signal when a gamma fault climbs into a non-bad master. Discipline is documented in [`reference/upkeep-protocol.md`](reference/upkeep-protocol.md).
- **What is not in v3:** a `PreToolUse` hook that refuses the write automatically. Today the validation is the agent's responsibility, not enforced.
- **What v4 adds:** a `PreToolUse` Edit/Write hook that runs cascade for the target file and refuses the write (with a clear "re-validate" message) if it hits a master and no validation marker is in the current session journal.

### 1.4 Confidence scoring  `[shipped]`

Every node carries two scores: `webscore` (curated human judgement) and `webscoreAuto` (computed baseline from fan-in × prey proximity × cluster mass). The divergence between them is the confidence signal.

- **Code:** [`scripts/lib/graph.mjs`](scripts/lib/graph.mjs) computes both; [`scripts/molt.mjs`](scripts/molt.mjs) reports divergence above the threshold (default `|Δ| > 2.0`).
- **What it catches:** stale curated overrides (file used to matter; doesn't anymore); quiet importance drift (file now matters more than the override claims).
- **What v4 adds:** divergence as an explicit `confidenceLevel` field (high / medium / low) surfaced in query results, propagated along edges so a high-confidence master with low-confidence neighbours flags the neighbourhood for review.

---

## 2. Overlap, drift, and redundancy

The brain's defence against the agent re-deriving the same fact, operating from a stale mental model, reading the same file four times in a session, or burning tokens to rediscover what was already known.

### 2.1 Overlap detection  `[partial]`

Within one session: the `cephalothorax/` journal records every Edit/Write, so the agent has cheap awareness of its own recent history. Across sessions: the next `SessionStart` brief surfaces the previous session's hot files. Across agents in parallel: not yet - there is no coordination protocol.

- **Code:** [`platforms/claude/hooks/journal.mjs`](../platforms/claude/hooks/journal.mjs) (write), [`platforms/claude/hooks/session-brief.mjs`](../platforms/claude/hooks/session-brief.mjs) (read).
- **What v4 adds:** an in-session query cache so repeat `query.mjs auth` calls are free; a "what did the last 5 sessions touch most" rollup in the brief.
- **What commercial adds:** team-wide brain with a coordination layer for two agents working in parallel.

### 2.2 Drift correction  `[shipped]`

The brain's model of the project versus the project itself. When they diverge, the map is wrong, not the territory.

- **Code:** [`scripts/molt.mjs`](scripts/molt.mjs) is the user-facing audit. It re-scans against the current source and reports orphans (in graph, not in source), missing nodes (in source, not in graph), dangling edges, hash mismatches, and score divergence above threshold.
- **Why hashes, not mtimes:** mtime lies (editor opens, file copies). Hashes don't.
- **Why `git log`, not mtimes, for recency:** same reason. See [`scripts/lib/gittime.mjs`](scripts/lib/gittime.mjs).
- **What v4 adds:** auto-rebuild of obviously-drifted nodes (file moved, update path everywhere) without prompting; drift trend over time per cluster.

### 2.3 Redundancy collapse  `[partial]`

Within a session, a file or query result already resolved should not be paid for again.

- **What v3 has, passively:** pre-rendered structure does most of the work. The K=8 webmap subsumes per-node lookups; the two view files pre-render the global rankings; the session journal tells the agent "you have already touched this." The agent receives high-density context instead of re-deriving.
- **What is not in v3:** an explicit query-result cache. Two `query.mjs auth` calls in a 30-second window each do the full work.
- **What v4 adds:** in-session query cache, read-range memoization so reading lines 1–50 then lines 1–100 pays once.

### 2.4 Token efficiency  `[shipped]`

Reduce input/output token consumption by giving the agent a high-information, low-token starting context. Two structural knobs do most of the work.

- **Display K = 8.** Each cluster's `webmap.md` shows the K highest-mass neighbours of the cluster centre, not the full cluster. Measured 79–84% input reduction on the anchor scenario.
- **Polar scoping.** Nodes are placed in rings (mass bands) × sectors (clusters). `query.mjs` returns a sector slice by default; the agent passes `--global` to widen.
- **Amortised brief.** `SessionStart` injects ~2.4k tokens of prey + top webscores + last session's hot files once per session, then every task in that session inherits it for free.
- **Measured effect:** see [`../docs/cost-reduction-analysis.md`](../docs/cost-reduction-analysis.md) §4.
- **What v4 adds:** dynamic K based on cluster size; per-task scope inference (task description → which clusters are likely relevant → pre-load only those webmaps).

---

## 3. Routing  `[partial]` / `[planned v4]` / `[commercial]`

Send the right query to the right model. Use the brain to decide.

LLM-routing today is driven by heuristics that do not see the project. The brain does. A query that touches a master should go to the largest model; a query that touches a leaf in a low-mass cluster can go to a smaller one. Routing-by-blast-radius saves money and improves correctness.

The signals the brain exposes:

| Signal | Source in v3 | Routing implication |
|---|---|---|
| `webscore` of the target file | `synganglion.json` | high webscore → larger model |
| Cluster `webscore` | `spiderbrain.config.json::clusterWebscores` | high-mass cluster → larger model |
| `isMaster` flag | per-node | true → escalate + require a validation loop |
| Cascade depth | `cascade.mjs` output | deep cascade → larger model |
| Cross-cluster touch | comparing cluster of target vs clusters of `dependedOnBy` | cross-cluster → larger model, multi-cluster context |

- **What v3 has:** all signals, exposed via `query.mjs --json` for an external router to consume.
- **What is not in v3:** an automated router.
- **What v4 adds:** a reference `route.mjs` that takes a query plus available models and returns a routing decision with reasoning.
- **What commercial adds:** auto-routing with adaptive learning - route, observe outcome, re-tune the rules. Plus multi-provider failover with cost / latency / correctness reporting per route.

---

## 4. Orchestration  `[partial]` / `[planned v4]` / `[commercial]`

Decide which agent does what, in what order, with what context. A multi-cluster change done in the wrong order means wasted work and inconsistent intermediate states.

The brain provides the data: cluster boundaries, master map, dependency direction, cascade radius. A human (or an agent reading SPIDERBRAIN.md + cluster webmaps) sequences the work:

1. Edit upstream first - the masters that many files depend on.
2. Edit downstream last - the leaves that only consumers see.
3. Within a cluster, edit the centre before the neighbours.
4. Re-run `cascade.mjs` after each step to confirm the blast radius.

This discipline is documented in [`reference/upkeep-protocol.md`](reference/upkeep-protocol.md).

- **What v3 has:** the data layer, the discipline document.
- **What is not in v3:** an orchestration script that automates the topological sequencing.
- **What v4 adds:** `orchestrate.mjs` that takes a multi-file change description and returns a topologically ordered sub-task list with cluster-scoped context for each.
- **What commercial adds:** managed multi-agent orchestration. Sub-tasks fan out to multiple agents, each with the right cluster context, results re-stitched, rolled back on cascade failure.

---

## 5. Heuristics  `[shipped]` / `[commercial]` premium packs

The named, tunable rules that turn graph structure into decisions. The policy layer between the raw graph and the agent's experience.

| Name | Default | Controls | Lives in |
|---|--:|---|---|
| `displayK` | 8 | Number of nearest neighbours rendered per webmap | `spiderbrain.config.json` |
| `columnSize` | 9 | Master + 8 column members (1 + 8) for v4 nearest-master assembly | `spiderbrain.config.json` |
| `masterMassMin` | 8.5 | Minimum mass for a node to be considered for master | `spiderbrain.config.json` |
| `rings` | `[8.5, 7, 5, 3]` | Webscore band boundaries for polar layout rings | `spiderbrain.config.json` |
| Cascade stop policy | hard stop at master | Cascade halts when it climbs into a non-bad master | `scripts/lib/nervenet.mjs` |
| Recency × mass weighting | mass × thetaGain × recencyDecay | Amplitude formula | `scripts/lib/graph.mjs` |
| Cluster auto-assignment | first-match cluster rule | How nodes are bucketed when multiple cluster rules match | `scripts/lib/scan.mjs` |
| `ignore` globs | sane defaults | What is excluded from the scan | `spiderbrain.config.json` |
| `collapseDirs` | empty | Folders rendered as a single node (e.g. blog posts) | `spiderbrain.config.json` |

- **Per project:** edit `spiderbrain.config.json`. Re-run `build-brain.mjs`. Diff the result.
- **Globally:** edit `core/scripts/lib/*` defaults. Affects every new brain built.
- **What v4 adds:** named heuristic profiles (small project, monorepo, library, data pipeline) as config preset packs.
- **What commercial adds:** **premium heuristics** - domain-specific tuned packs for Next.js + tRPC + Prisma, Cloudflare Workers + D1, NestJS + Postgres, Django + Celery, Rails 7, FastAPI + SQLAlchemy, Spring Boot, and others on request.

---

## 6. Optimisation engine  `[manual in v3]` / `[commercial]` automated

Close the loop: use observed outcomes to re-tune the brain.

The brain is correct on day one. On day 365 it has drifted. Files moved, clusters grew, the prey shifted, heuristics that were right for the original project may no longer be. The optimisation engine is the loop that watches usage and feeds back into the heuristics.

What it observes:
- Query log (which queries, how often, returning what)
- Cascade results (which edits actually broke things vs were safe)
- Wrong-fix events (where the brain failed to prevent a wrong edit)
- Drift reports (how often `molt` finds drift, in which clusters)
- Score divergence over time (`webscore` vs `webscoreAuto` trajectory)

What it tunes:
- Per-cluster `webscore` overrides (raise/lower based on actual blast-radius observed)
- `masterMassMin` (too few masters means cascades don't stop; too many means no cascades happen)
- Display K per cluster
- `rings` thresholds
- Cluster boundaries (if cross-cluster edges dominate, the cluster definitions are wrong)

- **What v3 has:** the data, surfaced via `molt-report.md`. A human reads it and adjusts `spiderbrain.config.json` + `webscore-overrides.json`.
- **What is not in v3:** an automated tuner.
- **What v4 adds:** scripted `tune.mjs` that proposes a config diff based on the observed signals - human still approves.
- **What commercial adds:** fully automated tuning. The hosted optimiser watches your brain over time and re-tunes nightly, subject to a human-approval gate by default.

---

## 7. Telemetry  `[shipped]` read-mode / `[commercial]` push-mode

What the brain knows about itself. The schema and emission layer for the signals other systems (the optimisation engine, routing, dashboards) consume.

| Signal | Where | Consumer |
|---|---|---|
| Per-node `webscore`, `webscoreAuto`, `mass`, `amplitude`, `rhythm` | `synganglion.json` | query, optimiser, routing |
| Per-cluster centre + member roster | `synganglion.json` + `webmap.md` | orchestration, adaptive-context |
| Cascade results | `cascade.mjs --json` | validation loop, optimiser |
| Session journal | `cephalothorax/SESSION-*.jsonl` | consolidate, drift detection |
| Drift report | `molt-report.md` | optimiser, human review |
| Dragline diff | `dragline.mjs` | recovery, audit |

- **What v3 has:** all read-mode telemetry as local files. Plain text, JSON, JSONL. No daemon, no socket, no remote emission. The local-first contract is a constraint, not a temporary state.
- **What is not in v3:** per-query latency / cost (would feed routing); per-fix outcome (revert? CI fail?) requires an outcome callback; aggregate trends over time (cluster growth rate, master churn) require a time-series store.
- **What v4 adds:** a `telemetry.mjs` aggregator that produces a single time-series JSON (still local).
- **What commercial adds:** push-mode telemetry to a hosted dashboard, with team-level rollups, anomaly alerts, drift trending.

---

## 8. Scoring  `[shipped]` / `[commercial]` premium packs

How important is this file? Two answers, kept side by side.

| Score | Source | Survives rebuild? | Purpose |
|---|---|---|---|
| `webscore` | `webscore-overrides.json` | yes (curated) | what the brain actually uses |
| `webscoreAuto` | computed by `scripts/lib/graph.mjs::computeWebscoreAuto` | no (re-derived) | baseline + drift detector |

`webscoreAuto` is roughly `f(fan-in depth, prey proximity, cluster webscore, code-vs-asset)`:
- **Fan-in depth.** Logarithmic of transitive dependents - a `globals.css` with 200 dependents is not 200× more important than one with 20.
- **Prey proximity.** Files in clusters with high `clusterWebscore` get a bump.
- **Cluster floor.** A leaf in `shell` outranks a leaf in `admin`.
- **Asset penalty.** Static assets get a flat low score regardless of fan-in.

The override file `webscore-overrides.json` is one line per node:

```jsonc
{
  "src/worker.js": 9.9,
  "src/db/schema.sql": 9.7,
  "app/layout.js": 9.4
}
```

Overrides survive every rebuild. [`scripts/molt.mjs`](scripts/molt.mjs) reports when an override has drifted from its fresh `webscoreAuto` - that surfaces stale judgement.

- **What v4 adds:** `webscoreAuto v2` with per-cluster calibration (the formula has different optima in different cluster types).
- **What commercial adds:** **premium heuristics** packs for common stacks; pre-calibrated `webscoreAuto` formulas; no manual calibration needed.

---

## 9. Adaptive context  `[partial]` / `[planned v4]`

Give the agent exactly the context the task needs. No more, no less.

The classic agent-context failure mode is "loaded the whole project, ran out of context window, ended the session early." The opposite failure is "loaded too little, missed the master, made a wrong fix." Adaptive context picks the right slice based on what the task is about.

Three slice strategies, picked manually today:

| Slice | When to use | What is loaded |
|---|---|---|
| **Global brief** | Cold start, "what does this project do?" | `SPIDERBRAIN.md` + `spideyorder.md` top 20 |
| **Cluster slice** | Task is cluster-local ("fix auth", "edit blog") | The cluster's `webmap.md` + `rules.md` + `changelog.md` |
| **Cascade slice** | Task is cross-cluster ("rename column X everywhere") | `cascade.mjs` output: target + all reached nodes |

Token budget:
- Global brief: ~2.4k tokens (loaded once per session by the `SessionStart` hook).
- Cluster slice: ~1.5–3k tokens per cluster.
- Cascade slice: scales with blast radius; typical 1–4k tokens.

- **What is not in v3:** automated routing of the strategy choice - today the agent picks.
- **What v4 adds:** task-description → context-strategy classifier ("fix auth login" → cluster slice on auth); budget-aware shrinking - if the chosen slice would exceed a token budget, shrink K, drop oldest changelog entries.

---

## 10. Memory management  `[shipped]` / `[planned v4]` warm cache

What survives a session boundary, what consolidates, what gets re-derived. The policy layer for the three tiers of brain state.

| Tier | Location | Lifetime | Examples |
|---|---|---|---|
| **Volatile** | `cephalothorax/SESSION-*.jsonl` | one session | this session's tool calls, hot file working set |
| **Consolidated** | `movemap.md`, per-cluster `changelog.md` | permanent (append-only) | "on date X, deployed change Y, touching files Z" |
| **Derived** | `synganglion.json`, the view files | re-derivable on demand | the import graph, the rankings |

The lifecycle:
1. **PostToolUse hook** appends to the volatile cephalothorax journal - dumb, fast, exit-0.
2. **`consolidate.mjs`** (single writer, on deploy or by hand) folds the volatile journal into permanent `movemap.md` and clears the journal.
3. **`build-brain.mjs`** rebuilds `synganglion.json` from source - derived state is never trusted; always recomputed.
4. **`dragline.mjs`** snapshots curated state before consolidation so a botched fold can be reversed.

What survives a session:
- Everything in `movemap.md` and per-cluster `changelog.md` (curated, permanent).
- `webscore-overrides.json` (curated, permanent).
- The latest derived `synganglion.json` (the file is the cache; can always be regenerated).

What does not:
- The volatile cephalothorax journal once consolidation has run.
- Any in-session-only query cache (v4 will add this).

- **What v4 adds:** the missing tier - a session-level live memory that doesn't persist but isn't re-derived within a session either. Plus an opt-in long-running warm brain that holds the synganglion in memory across hooks for sub-second access.

---

## 11. Enterprise scaling  `[v3 limits]` / `[planned v4]` sharding / `[commercial]` federation / `[in development]` spiderWaveBrain

Where v3 stops being enough, and what the path forward looks like.

**Where v3 scales fine.** Empirically tested on:
- **perform.digital** - 154 nodes, ~310 synapses, 11 masters. Sub-second on everything.
- **Saroir** - 1,629 nodes, 2,227 synapses, 60 masters. `build-brain` ~19s, `query` <100ms, `molt` ~11s. All comfortably interactive.

The "synganglion as one JSON file" model is fine up to roughly **10,000 nodes** based on extrapolation. Beyond that, single-file I/O and graph traversal start to dominate.

**Where v3 will not scale.**
- **Tens of thousands of files** (large enterprise monorepos) - the single-file synganglion becomes too big to read on every query.
- **Multiple teams, one brain** - v3's local-file model has no notion of who edited what; concurrent writes are a manual concern.
- **Cross-repo brains** - v3 is one project per brain. Cross-repo dependencies aren't expressible.
- **Layered abstraction** - v3 is a single flat graph (with clusters). Some enterprise codebases have natural delta (architecture) / theta (subsystem) / gamma (file) layers that a flat graph flattens away.

**The path forward.**

| Need | Path |
|---|---|
| Single project, 10k+ nodes | **v4** per-cluster sharding of `synganglion.json` |
| Multi-team, one project | **commercial** hosted brain with auth + concurrent-write coordination |
| Multi-repo / monorepo federation | **commercial** federation layer |
| Layered abstraction (gamma / theta / delta / ...) | **spiderWaveBrain** (in development) |

`spiderWaveBrain` is the in-development layered model for projects where one flat graph is the wrong shape. The concept and methodology will be published when proven. No early promises.

---

## Summary table

| Pillar | shipped | partial | planned v4 | commercial |
|---|:--:|:--:|:--:|:--:|
| 1.1 Cross-reference | ✓ | | | |
| 1.2 Confabulation detection | | ✓ | ✓ | |
| 1.3 Validation loops | | ✓ | ✓ | |
| 1.4 Confidence scoring | ✓ | | ✓ | |
| 2.1 Overlap detection | | ✓ | ✓ | ✓ |
| 2.2 Drift correction | ✓ | | ✓ | |
| 2.3 Redundancy collapse | | ✓ | ✓ | |
| 2.4 Token efficiency | ✓ | | ✓ | |
| 3. Routing | | ✓ | ✓ | ✓ |
| 4. Orchestration | | ✓ | ✓ | ✓ |
| 5. Heuristics | ✓ | | ✓ | ✓ |
| 6. Optimisation engine | | ✓ | ✓ | ✓ |
| 7. Telemetry | ✓ | | ✓ | ✓ |
| 8. Scoring | ✓ | | ✓ | ✓ |
| 9. Adaptive context | | ✓ | ✓ | |
| 10. Memory management | ✓ | | ✓ | |
| 11. Enterprise scaling | (✓ small/medium) | | ✓ | ✓ |

---

## Where to read next

- [`SKILL.md`](SKILL.md) - the BUILD / MAINTAIN / QUERY / CASCADE entry point.
- [`README.md`](README.md) - the engine's own readme.
- [`reference/architecture.md`](reference/architecture.md) - the file-by-file architectural spec.
- [`reference/upkeep-protocol.md`](reference/upkeep-protocol.md) - per-turn / per-session / per-deploy discipline.
- [`reference/webscore-rubric.md`](reference/webscore-rubric.md) - how scores are judged.
- [`reference/neuroscience.md`](reference/neuroscience.md) - the spider biology that grounds the vocabulary.
- [`../docs/cost-reduction-analysis.md`](../docs/cost-reduction-analysis.md) - the per-incident receipts.
- [`../docs/benchmarks.md`](../docs/benchmarks.md) - methodology and reproducibility.
- [`../enterprise/README.md`](../enterprise/README.md) - what the commercial tier delivers.
