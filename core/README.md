<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# spiderbrain

> An externalised, dependency-graphed second brain for any software project - a cure for the slow loss of project memory.

A `spiderbrain/` folder externalises a project's structure: every file scored (`webscore` = mass), grouped into a **column** of one slow master and eight fast legs, with a third edge direction (modulation) wired in, recency from git, blast radius computable, a hard-stop firebreak. It is both a **Claude Code skill** - invoke by saying *"spiderbrain"* - and a **runnable Node CLI** (zero npm dependencies, Node ≥ 18).

**In one sentence:** spiderbrain makes a project's implicit dependency graph **explicit, scored, queryable, and rhythm-aware** - so the project (and any agent working on it) stops forgetting.

---

## The benefits

Long, organised. Skim for what matters to you.

### 1 · For the codebase itself

- **A queryable map** of every file, its role, its blast radius. `query.mjs "<term>"` returns nodes ranked by webscore × recency.
- **Dead-code detection.** webscore near zero = nothing depends on it. (perform.digital surfaced `_parked/SaroirCaseStudy.jsx` at 0.5 instantly.)
- **Dependency hygiene.** Unintentional couplings (a low-level helper accidentally depended on by a high-level feature) become visible as edges.
- **Real blast radius for every node.** Not a guess - the transitive dependent count.
- **Refactor scoping made concrete.** Before touching a file: `cascade.mjs --inject` returns the exact set that breaks.
- **Pre-deploy impact prediction.** Simulate a fault before merging it.
- **Test priority ordering.** Test the high-amplitude nodes first; let the leaves trail.
- **Cache-candidate identification.** High mass + low rhythm = ideal to cache.
- **"God-file" identification.** High mass + high rhythm = a file that should be split.
- **Architectural enforcement** through per-cluster `rules.md` - the invariants live next to the cluster they govern.

### 2 · For working with AI agents (Claude Code, Cursor, Copilot, future models)

- **Persistent memory across sessions.** The brain survives the context window. An agent reads `synganglion.json` instead of re-deriving the project every time.
- **SessionStart hook** announces the brain at every session start - prey, hot files, top webscores injected as context.
- **PostToolUse journal** captures what the agent touched; the brain learns automatically.
- **Faster, more accurate, fewer rediscovery loops.** Agent grounding by construction.
- **Shared context across tools.** Claude Code today, a different model tomorrow - both read the same brain.
- **A passport for context-window travel.** When the conversation rolls over, the brain stays.
- **Multi-agent coordination.** Several agents working in parallel can read a single source of truth.

### 3 · Hallucination defense - by type

| Hallucination | spiderbrain catches it because… |
|---|---|
| **File hallucination** (invented paths) | every real path is a node in `synganglion.json` - verify before naming |
| **API/method hallucination** | each node's `role` + `dependsOn` describe what it actually exposes |
| **Dependency hallucination** | the edge list is derived from real imports, not guessed |
| **Path hallucination** (wrong slash/case) | one canonical posix form, exact-match |
| **Stale-knowledge hallucination** | git commit times mark currency; the agent sees what is old |
| **Cross-reference hallucination** (mixing two similar systems) | clusters disambiguate by feature; two auth flows are two clusters |
| **Confidence hallucination** (wrong, stated boldly) | webscore + amplitude quantify importance; uncertainty becomes visible |
| **Confabulation** (plausible explanation that is false) | claims can be checked against the brain - the brain is the oracle |
| **Drift-between-turns** | the curated layer pins facts; hooks keep them refreshed |
| **Version hallucination** | package.json is a node; rhythm shows churn; content hashes pin state |
| **Pattern misapplication** | `rules.md` per cluster documents the *project's* patterns, not the model's prior |
| **Authority hallucination** (cites a non-existent doc) | every doc is in the brain; agents only cite what exists |
| **Recency hallucination** (treats stale code as current) | `spideymove` ranks by git time |
| **Master/dependency mis-attribution** | the column makes governance explicit |

### 4 · Overlap, drift, redundancy - the silent killers

- **Duplicate code/data detection.** perform.digital's first build surfaced three real redundancies on day one - two launch-post lists, triplicated product pricing, a DB column no code writes.
- **Schema-code drift.** A field with no writer becomes visible; the cascade self-test flags it.
- **Multiple sources of truth.** When the same fact appears in two places, both become nodes; the cross-reference exposes the duplication.
- **Pattern-variant drift.** Three different ways to do auth become three patterns in three `rules.md` files - visibly inconsistent.
- **API ↔ frontend ↔ backend drift.** Field references can be traced through the third direction.
- **Configuration drift between environments.** Each config a node; differences become explicit edges.
- **Naming inconsistency.** Cross-cluster modulation surfaces when the same concept has two names.
- **Mock ↔ real drift.** Mocks become nodes; cascade can show what depends on the mock vs the real.
- **Documentation rot.** Generated views carry source hashes - out-of-date docs are visible.
- **Migration ↔ schema drift.** Per-column source-file tracking shows which migration last touched a field.
- **Test ↔ implementation drift.** Tests are nodes; content hash divergence shows when a test stopped tracking its target.
- **The molt audit** continuously catches drift between the stored brain and the filesystem (orphans, unindexed, dangling, modified-since-build, probable renames).

### 5 · Team and organisational

- **Onboarding.** A new hire reads `SPIDERBRAIN.md` + 8 webmaps and has the mental model in an hour, not a month.
- **Knowledge transfer.** When someone leaves, the brain stays. Their decisions are in the changelogs.
- **Ownership clarity.** Per-cluster `rules.md` names conventions and who decided them.
- **Cross-team coordination.** Cross-cluster modulation makes shared chokepoints visible (e.g. the shared worker that the chat AND the lead form depend on).
- **Code review prioritization.** Review high-mass changes hardest; high-amplitude changes urgently.
- **Project-manager visibility.** Risk = webscore × amplitude, surfaced without reading code.
- **Open-source contributors** get up to speed in hours, not weeks.
- **Acquisition due diligence.** A brain shows what the org actually owns.
- **Succession planning.** The project outlives any individual.
- **Auditability.** The brain is a readable snapshot at any moment.

### 6 · Risk, security, compliance

- **Security blast-radius.** Change `auth.js`, see *every* transitive dependent before deploying.
- **Vulnerability impact.** A CVE in a package → cascade from its node → exactly the features that fall.
- **Compliance.** Sensitive fields (`db:leads.email`) are nodes; reachability shows where they flow.
- **Change-freeze candidates.** Masters (theta nodes) shouldn't move without deliberation; the brain identifies them.
- **Disaster recovery.** The `.dragline/` folder is a built-in backup of the curated layer (configs, overrides, rules, changelogs).
- **Audit trail.** `movemap.md` is an append-only deploy log no one can quietly edit away.
- **The hard stop.** A gamma fault that climbs into its master halts at the master - a structural firebreak that bounds cascade damage.
- **Tamper detection.** Content hashes per node; modifications surface in molt.

### 7 · Cross-domain - the model is bigger than code

The current scanner is JS/TS-focused, but the *architecture* - nodes + scored edges + master/cluster columns + cascade - is domain-agnostic. With a domain-specific scanner, spiderbrain applies to:

- **Data pipelines / DAGs** - stages = nodes, data flow = edges, broken stage = cascade.
- **ML training pipelines** - features, models, training scripts; the master = the contract a model exposes.
- **DB schema design** - already first-class (table + field nodes, FK as edges).
- **DevOps / infrastructure-as-code** - Terraform modules, k8s manifests, the same dependency graph.
- **Documentation systems** - docs that reference docs; deprecated docs visible as drift.
- **Personal knowledge management** - a Zettelkasten with explicit topology + scoring + recall ranking.
- **Scientific research projects** - papers, experiments, datasets; reproducibility = zero orphaned dependencies.
- **Game development** - assets, scenes, scripts; "if this asset breaks, which scenes fall?"
- **Curriculum design** - modules + prerequisites = the same model.
- **Product management** - features and their dependencies (a feature flag is a master).
- **Manufacturing / supply chains** - components, blast radius of a part failure.
- **Legal / regulatory codebases** - statutes referencing statutes; a struck-down ruling cascades.
- **Government policy** - policies and their dependencies; the cost of a single policy change.
- **Music production** - tracks, samples, plugins; the bus is a master, channels the column.
- **Construction Gantt charts** - tasks + prerequisites; the heaviest column is the critical path.
- **Healthcare pathways** - treatments, contraindications, dependencies between protocols.
- **Financial portfolios** - assets and correlations; risk = blast radius.
- **Career / CV planning** - skills, projects, prerequisites.
- **Story/narrative design** - scenes, characters, plot threads; cascade = "if I cut this scene, what falls?"

### 8 · Extended cognition / memory - the Alzheimer's frame

- **Externalised memory** survives session loss, people loss, conversation loss.
- **Captures the *why*.** The curated changelog holds rationale no tool can re-derive from code.
- **Forces explicit dependency thinking.** The act of scoring forces architectural awareness.
- **The brain audits itself.** `molt.mjs` reports drift; `cascade.mjs --self-test` flags webscore-vs-topology disagreements (the model auditing its own model).
- **Reduced theta-gamma coupling** is a documented Alzheimer's biomarker - the column layer measures coupling health in code.
- **Long-term institutional memory.** `movemap.md` accumulates without losing.
- **The dragline** lets a corrupt curated file be repaired from its last-good snapshot, not demolished by defaults.
- **Web as extended cognition** (Japyassú & Laland 2017): the brain *is* the project's web - thought happens outside the head.

### 9 · Decision-making and planning

- **Pre-change planning (Portia's rule).** Scan a node's dependents before editing it.
- **Effort estimation** from cascade breadth + weighted severity.
- **Multi-fault analysis.** `--inject "a,b,c"` finds topological origins among multiple simultaneous faults.
- **Change-order constraint surfacing.** The third direction creates a *second* ordering (rhythm) that can conflict with dependency order - the brain shows the conflict.
- **Prioritization** by amplitude (live importance), not just webscore (static mass).
- **The hard stop as a planning veto.** A planned change that would force a master change = escalate.
- **"What if" simulation** without touching production.

### 10 · Educational

- **A new dev reads the brain to learn the system.** Self-explanatory architecture, no separate doc to maintain.
- **Senior eng teaches with it.** "Here's why this matters - see its cascade."
- **Pattern recognition across the project.** Similar shapes become visible.
- **Codebase as textbook.** The brain is the table of contents.

### 11 · Performance and observability

- **Performance hotspots** are visible in spideymove + high-mass.
- **Critical path** = the heaviest column.
- **Caching candidates.** High mass + low rhythm = stable, valuable; cache it.
- **Load-bearing columns** show what to monitor most.
- **Performance regression hunting.** A modified high-mass node = the prime suspect.

### 12 · Migration and refactoring

- **Migration cascade prediction.** A DB migration → cascade shows every code path that touches the field.
- **Refactor scoping** before commitment.
- **Framework upgrade planning.** A framework master moving cascades through every gamma; total effort surfaces.
- **Renaming with confidence.** `molt`'s rename-pairing surfaces orphan/unindexed pairs sharing a name.
- **Decommissioning planning.** A feature retiring = the whole column folds.
- **Big-bang vs incremental.** Cascade breadth shows whether a change can be staged.

### 13 · Quality assurance

- **Test prioritization** by webscore. Test the masters first.
- **Coverage targets** - aim coverage at high-amplitude nodes.
- **Regression risk** ranks with amplitude.
- **Flaky-test identification.** A test with very high rhythm in a low-rhythm cluster is suspect.
- **Test debt visibility.** A high-mass node with no test dependents = an exposure.

### 14 · Documentation

- **A documented project for free.** Every node has a role; every cluster has rules and config.
- **Auto-generated webmaps per feature.** No more "where do I start?"
- **`spideyorder` / `spideymove` as living documentation.**
- **Rules and config curated, not lost** - even after a rebuild.
- **Generated views carry source hashes** - out-of-date docs are visibly stale.

### 15 · Long-term project survival

- A real **cure for project Alzheimer's** - the slow forgetting that kills systems.
- **Successor-friendly.** Hand over the brain instead of "let me show you around."
- **Acquisition asset.** Due diligence reads itself.
- **IP / asset visibility.** What does the org actually own? The brain answers.
- **Resilient to churn.** People leave; the brain stays.
- **Time-capsule readability.** Open the brain in five years and the project is still legible.

### 16 · Costs it eliminates

- The "rediscovery tax" - every contributor re-learning the system.
- The "context-switch tax" - a session re-reading the codebase.
- The "tribal knowledge tax" - paying senior eng to explain.
- The "stale-doc tax" - out-of-date docs misleading new contributors.
- The "blast-radius surprise tax" - a small change that breaks production.
- The "duplicate-fix tax" - fixing the same thing in three places.
- The "agent rediscovery tax" - every AI session re-exploring.

---

## Quick start

```bash
node "<path-to-skill>/scripts/build-brain.mjs" \
  --project "<path to your project>" \
  --brain "<path for the brain>" \
  --prey "<the one goal>"
```

Then the judgement pass on `webscore-overrides.json`, re-run, write the curated docs.

| Mode | Command | When |
|---|---|---|
| **BUILD** | `build-brain.mjs --project X --brain Y --prey Z` | once, then to refresh |
| **MAINTAIN** | hooks + the upkeep protocol | continuously |
| **QUERY** | `query.mjs --brain Y "<terms>"` | ask the brain |
| **CASCADE** | `cascade.mjs --brain Y --inject "<node>"` | simulate a fault, read the blast |
| **MOLT** | `molt.mjs --brain Y` | weekly audit |
| **CONSOLIDATE** | `consolidate.mjs --brain Y --deploy "<label>"` | at every deploy |

---

## What's in the folder

```
spiderbrain/
  README.md                you are here
  SKILL.md                 the Claude Code skill entry - triggers on "spiderbrain"
  reference/
    neuroscience.md        spider anatomy + theta-gamma cortical rhythms (sourced)
    architecture.md        folder spec + reflex arc + the theta-gamma column layer
    webscore-rubric.md     how to score a node 0.0–10.0 (devil's-advocate)
    upkeep-protocol.md     the discipline that keeps the brain alive
  scripts/
    build-brain.mjs        turn a project into a brain
    consolidate.mjs        "sleep" - fold the session into permanent memory
    cascade.mjs            inject a fault, read the blast (incl. self-test, multi-inject)
    query.mjs              ask
    molt.mjs               drift audit (orphans, unindexed, dangling, modified, renames)
    lib/{io,scan,graph,render,nervenet,dragline,gittime,brain}.mjs
  hooks/
    journal.mjs            PostToolUse - append-only hot-file journal
    session-brief.mjs      SessionStart - the brain announces itself
```

Zero npm dependencies. Node ≥ 18. Cross-platform (Windows paths with spaces handled).

---

## Where it works best

- **Best fit:** medium-to-large JS/TS projects (a few dozen to a few thousand meaningful files).
- **Excellent for:** any project with a real dependency graph and a curated layer of decisions worth preserving.
- **Overkill for:** trivial scripts (under a dozen files), throwaways.
- **Honest limit:** the scanner is JS/TS; other stacks index file/config nodes but need `config.extraEdges` for their dependency graph (or a per-language scanner). The architecture is general; the current scanner is specific.

---

## What it isn't

- **Not a linter.** It does not enforce style.
- **Not a build tool.** It does not compile, bundle, or deploy.
- **Not a CI gate** (yet - though it could be: a failed `molt` or a hard-stop is a natural fail signal).
- **Not a memory-replacement for humans.** It is a *prosthesis*, not a substitute. The why still has to be written.
- **Not magic.** The curated layer requires discipline - the brain rots if no one writes the changelog. molt and the self-test help, but they can audit structure, not meaning.

---

## Roadmap

- **spiderbrain v3** (current, shipped). Webscore + reflex arc (cascade · dragline · molt) + theta-gamma column layer (masters · columns · the third direction · amplitude · the cluster-breaks-master hard-stop). Tested on perform.digital and Saroir; the fresh-project build path verified.
- **v4** (in development, gated). A refinement layer on master selection (nearest-master assignment). Tested on two real projects with honest results documented in [`../docs/cost-reduction-analysis.md`](../docs/cost-reduction-analysis.md) and [`../docs/benchmarks.md`](../docs/benchmarks.md) §8: +3.5% on perform.digital, **−1.5% on Saroir**. Not yet exposed in this release pending the broader rebalancing work it depends on.
- **spiderWaveBrain** (in development). The planned enterprise- and supercomputing-scale evolution. Aimed at codebases beyond the v3 working range and at orchestration over planetary-scale projects. Concept and methodology will be published when proven; no early promises.

---

## Status

**v3 - shipped.** Webscore + reflex arc + theta-gamma column layer. Tested on perform.digital and Saroir; receipts in [`../docs/benchmarks.md`](../docs/benchmarks.md).

**v4 - gated, in development.** See roadmap above.

**spiderWaveBrain - in development.** See roadmap above.

Invoke with **"spiderbrain"** in Claude Code, or run the scripts directly with Node.
