<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# AGENTS.md

> *Instructions for the agent walking into this web.*
>
> This file is the operating manual for any AI coding agent that touches the spiderbrain v3 codebase - whether you're **working on the brain** (contributing) or **wiring the brain into another project** (consuming). Read both sections. The cardinal rules apply to both.

---

## 0. First 60 seconds

You are reading this because you've been pointed at the spiderbrain v3 repository. Before you do anything:

1. **Read [`llms.txt`](llms.txt)** - the ~70-line skill summary. Tells you what this is.
2. **Read [`README.md`](README.md)** - the architectural overview with the Mermaid diagram.
3. **Read [`core/SKILL.md`](core/SKILL.md)** - the skill spec, BUILD / MAINTAIN / QUERY / CASCADE modes.
4. **Identify which job you have:**
   - *"Help me improve / fix / extend the spiderbrain code itself"* → §A
   - *"Help me use spiderbrain on a project (mine or someone else's)"* → §B

If you skip step 4 you will make wrong assumptions. The same vocabulary means different things in the two contexts.

---

## 1. Cardinal rules (read these even if you read nothing else)

These rules are non-negotiable. Violating any of them produces silent corruption, the worst class of bug for a memory system.

### 1.1 Derived data is **never hand-edited**
- `synganglion.json`, `spideyorder.md`, `spideymove.md`, per-cluster `webmap.md` - all generated.
- If you find yourself wanting to edit one of these, you actually want to edit the **source** it was generated from (a config file, an override file, a curated `changelog.md`, or a source file in the project being scanned), then re-run the generator.

### 1.2 Curated data is **never overwritten by the generator**
- `SPIDERBRAIN.md`, `spiderbrain.config.json`, `webscore-overrides.json`, `movemap.md`, per-cluster `changelog.md` / `rules.md` / `config.md` - all curated.
- The generators must **read** these and **fold them in**, never destroy them. If you're writing a generator, treat them as read-only inputs.

### 1.3 Every hook is **dumb, fast, and exit-0**
- Three hooks ship: `session-brief.mjs` (SessionStart, once per session), `prompt-brief.mjs` (UserPromptSubmit, per prompt, silent when nothing matches), `journal.mjs` (PostToolUse, per edit, append-only).
- Every hook swallows every error and exits 0 on every path. **Do not add validation, ordering, locks, or back-pressure** to any hook. A broken brain must never block a session, a prompt, or an edit.
- The journal is write-side. `prompt-brief` is read-side. `session-brief` is read-side. None of them mutate the graph - only `consolidate.mjs` does.

### 1.4 Consolidation is **single-writer**
- Only `core/scripts/consolidate.mjs` mutates the graph from journal input. It runs on deploy or by hand, never from a hook, never concurrently with itself.
- If you need a second writer, you're solving the wrong problem - fix the consolidator instead.

### 1.5 Build before write - for masters
- Editing a **master** (high `mass`, high `rhythm`, `isMaster: true`) without a `cascade.mjs` pass first is the highest-blast-radius mistake possible. Run cascade. Read the output. Then edit.
- Cascades hitting a master **hard-stop**. That's a feature. Don't paper over it.

### 1.6 The prey is sacred
- The `prey` field in `spiderbrain.config.json` is the project's stated purpose. Every `webscore` is judged against it.
- If the prey changes, **every score is suspect** until re-judged. Don't quietly edit prey without flagging it.

### 1.7 Honesty over hype
- This repo's claims (cost reduction, hallucination defence, etc.) are tied to receipts in `docs/`. If you add a claim, add the receipt. If you can't substantiate, mark it **estimated** or remove it.
- See `docs/benchmarks.md` §0 honesty contract for the discipline.

---

## §A. You are working on the spiderbrain codebase

### A.1 What you're looking at

```
spiderbrain v3/
  core/                  ← the brain itself (BUSL-1.1)
    SKILL.md             ← skill spec (entry point)
    README.md            ← 16-benefit catalogue
    reference/           ← architecture, neuroscience, upkeep, webscore rubric
    scripts/             ← build-brain, consolidate, cascade, query, molt + lib/
    concepts.md          ← 11 design pillars, honestly tagged (shipped/partial/v4/commercial)
  platforms/             ← adapters (Apache 2.0)
    claude/              ← the only shipped adapter (hooks + README)
                            OpenAI / Gemini / Cursor / Mistral / DeepSeek / Grok
                            are open challenges - see CHALLENGES.md
  docs/                  ← cost-reduction-analysis, benchmarks
  enterprise/, benchmarks/, licensing/  ← descriptive READMEs
  CHALLENGES.md          ← contributor challenges (adapters, benchmarks, screenshots)
  LICENSE.md, COMMERCIAL.md, BRANDING.md  ← binding terms (authored separately)
```

### A.2 Build / run / verify

Zero npm dependencies. Node ≥ 18, ESM throughout.

```
# Build a brain on a project (smoke test)
node core/scripts/build-brain.mjs --project <abs/path/to/project> --brain <abs/path/to/brain>

# Run the drift audit on that brain
node core/scripts/molt.mjs --brain <abs/path/to/brain>

# Query
node core/scripts/query.mjs --brain <abs/path/to/brain> "auth"

# Cascade (blast radius for a proposed edit)
node core/scripts/cascade.mjs --brain <abs/path/to/brain> path/to/changed/file.js

# Run the unit test surface
node --test core/__tests__/scan.test.mjs core/__tests__/cascade.test.mjs core/__tests__/recovery.test.mjs

# Verify the install is intact
node core/scripts/verify.mjs
```

There is no `npm test` (and no `package.json`). Unit tests use Node's built-in `node --test` runner - see [`core/__tests__/README.md`](core/__tests__/README.md) for what's covered (scan + alias + comment-strip + SQL semicolon-tolerance, cascade determinism, corruption recovery). Integration verification is by running the entrypoint scripts above against `perform.digital` or Saroir-style projects and confirming the outputs match the receipts in `docs/benchmarks.md`.

### A.3 Code style

- **ESM only** (`.mjs`). No CommonJS.
- **Zero npm dependencies.** Node stdlib only. If a third-party module starts looking necessary, surface that as a design discussion before adding.
- **One responsibility per script.** `build-brain.mjs` doesn't consolidate; `consolidate.mjs` doesn't build.
- **Lib modules are pure.** `core/scripts/lib/*.mjs` exports functions; entrypoints do I/O and CLI argv parsing.
- **Comment density matches the surrounding file** - read before you write. The lib modules are densely commented; the entrypoints are leaner.
- **No new abstractions without evidence.** The brain went through 12 design phases to land at this shape. If you want to add a layer, find the failure mode it fixes and document it.

### A.4 Things that will break if you're not careful

- **Tsconfig alias resolution** in [`core/scripts/lib/scan.mjs`](core/scripts/lib/scan.mjs). Naive regex JSONC strippers eat `/*` inside string literals (e.g. inside `"@/*"` paths blocks). Use the state-aware tokenizer that's already there. Don't replace it with a regex.
- **SQL parser paren-depth matching** in `scan.mjs::scanSql`. A lazy regex (`[\s\S]*?\)\s*;`) silently truncates table bodies. Don't "simplify" it.
- **The cascade firebreak.** Masters block propagation. Don't add code that unblocks them; that's the whole point of the structure.
- **Git commit times, not mtimes.** Recency is computed from `git log`, not file system mtime. Editor opens shouldn't move the recency needle. See [`core/scripts/lib/gittime.mjs`](core/scripts/lib/gittime.mjs).
- **Content hashing**, not mtime, for drift detection. mtime lies; hashes don't.
- **`prompt-brief.mjs` whispers, never chatters.** It must stay silent when no filename or cluster matches the prompt; emitting a "no matches" footer on every prompt would balloon context. The current implementation already does this (exits 0 with no output) - don't "fix" it to always emit.

### A.5 Where to add things

| You want to add… | Put it here |
|---|---|
| A new heuristic | document it in [`core/concepts.md`](core/concepts.md) §5; implement in `core/scripts/lib/graph.mjs` or `nervenet.mjs` |
| A new platform adapter | `platforms/<name>/` - read [`platforms/README.md`](platforms/README.md) for the contract + skeleton; see [`CHALLENGES.md`](CHALLENGES.md) for the open list of wanted adapters and the recognition that comes with shipping one |
| A new conceptual area | `core/<area>/README.md` - match the existing README shape (Purpose / How it works in v3 / Status / Planned / Related) |
| A new benchmark | `docs/benchmarks.md` - add a measured row, link from `benchmarks/README.md` |
| A new claim in the root README | First add the receipt in `docs/`, then cite it |
| A platform-specific tool spec | `platforms/<platform>/tools/` |

### A.6 Things never to add to this repo

- A package.json (zero-dep is a constraint, not a temporary state).
- A LICENSE / COMMERCIAL_LICENSE / BRANDING file with LLM-generated legal language. Those are authored by the licensor verbatim from canonical templates.
- A test framework with a network dependency.
- Code that imports from `platforms/` into `core/`. The arrow points one way: adapters depend on core; core depends on nothing.
- Any change that makes the journal hook do anything other than append one JSONL line.

---

## §B. You are using spiderbrain on a project

### B.1 You are now responsible for two things

1. **The project** (the thing being scanned - your codebase, or a client's, or an open-source repo).
2. **The brain** (a sibling folder that holds the externalised memory of the project).

The brain is **a separate folder, not committed to the project repo** unless you explicitly want it to be. The convention is `<project>spiderbrain/` as a sibling to the project root.

### B.2 First-time build (5 minutes)

1. Create the sibling folder.
2. Run `build-brain` with a `--prey` describing what the project is *for*. See [`INSTALL.md`](INSTALL.md) for the canonical install paths; substitute `<SPIDERBRAIN_HOME>` with the actual path you installed to:
   ```
   node <SPIDERBRAIN_HOME>/core/scripts/build-brain.mjs \
     --project /abs/path/to/yourproject \
     --brain /abs/path/to/yourprojectspiderbrain \
     --prey "Ship qualified leads from enterprise visitors while the site stays fast and credible"
   ```
3. Open the brain folder. Read `SPIDERBRAIN.md`, `spideyorder.md`, the top-3 cluster `webmap.md` files.
4. Disagree with any `webscore`? Add an override in `webscore-overrides.json` - it survives every rebuild.
5. Run `molt.mjs` to confirm zero drift, zero orphans, zero dangling edges. If non-zero, **fix before continuing**.

### B.3 Daily use

- **The three hooks do their job silently.** `SessionStart` injects the brief once; `UserPromptSubmit` whispers per prompt when filenames or clusters are mentioned; `PostToolUse` appends to the journal per edit. You shouldn't need to think about any of them.
- **When you start a task,** the per-prompt hook will usually have already surfaced the relevant cluster's top nodes. If the prompt was vague enough that the brain stayed silent, read the cluster `webmap.md` yourself.
- **Before any cross-cluster change,** run `cascade.mjs`. Read the blast radius. The prompt-brief flags blast-radius candidates with a ⚠ but does not run the cascade for you.
- **After a deploy,** run `consolidate.mjs` to fold the session journal into the permanent `movemap.md`.
- **Weekly (or after a big merge),** run `molt.mjs`. Address any drift the audit reports.

### B.4 When to escalate

| Symptom | Action |
|---|---|
| `molt.mjs` reports orphans / dangling edges | Re-run `build-brain.mjs` - the project moved, the graph hasn't caught up |
| `webscore` and `webscoreAuto` diverge > 2.0 on a node | Re-judge the override, or accept the new auto baseline |
| A cluster has > 30 members | Cluster definition is too coarse - split it in `spiderbrain.config.json::clusterRules` and rebuild |
| Cascade hits a master you don't recognise | **Stop.** Read the master's role. You are about to do something with consequences |
| The brain says "X imports Y" but you know it doesn't | Re-run scan. If the bug persists, file an issue with a repro project - this is a scan correctness bug |

### B.5 Things never to do when using the brain

- **Don't hand-edit `synganglion.json`.** It will be overwritten on the next build. Use `webscore-overrides.json` for score changes; edit the project source for everything else.
- **Don't commit the cephalothorax journal.** It's volatile working set; gitignore the brain folder or at minimum `cephalothorax/`.
- **Don't run `consolidate.mjs` concurrently with itself.** Single-writer; one consolidate per deploy.
- **Don't read into a cluster you've never touched and start editing.** Read the cluster `rules.md` and `changelog.md` first.
- **Don't trust the brain blindly.** It's an externalised memory. It's only as good as the last consolidation. When in doubt, re-scan.

---

## 2. The vocabulary (essential - same words mean these specific things)

| Word | What it is |
|---|---|
| **prey** | the project's stated purpose; every `webscore` judged against it |
| **synganglion** | the master graph file (`synganglion.json`) - every node, every edge |
| **webscore** | 0.0–10.0 mass of a node; how much of the user experience breaks if this file is corrupted, weighted by prey |
| **webscoreAuto** | computed baseline (fan-in × prey proximity × cluster mass); divergence from `webscore` = confidence signal |
| **cluster** | a sector - files grouped by role (auth, database, shell, blogs, etc.) |
| **ring** | a webscore band - files at similar mass float at the same radius |
| **cell** | the polar coordinate (ring × sector) - where a node lives in the layout |
| **master** | a high-mass, high-rhythm anchor file that blocks cascade propagation |
| **column** | master + its bonded members (the 1+8 structure in v4; in v3, mass-based assembly) |
| **rhythm** | how often a file is touched - high rhythm + high mass = likely master |
| **amplitude** | live importance = mass × thetaGain × recencyDecay |
| **cascade** | blast radius computation - given changed files, which downstream files are affected |
| **hard stop** | a cascade halts when it climbs into a non-bad master (firebreak) |
| **dragline** | snapshot before every consolidation; restore on corrupt write |
| **molt** | the read-only drift audit |
| **cephalothorax** | volatile session journal (one file per session) |
| **movemap** | permanent consolidated deploy log |
| **spideyorder** | nodes ranked by webscore (supraesophageal ganglion - order) |
| **spideymove** | nodes ranked by recency (subesophageal ganglion - movement) |
| **modulation** | the third edge direction - theta governance over dependency |

If you use these words to mean something else, the next agent reading the codebase will be confused, and the cycle of project Alzheimer's begins.

---

## 3. Data lifecycle (which file is born from which)

```
project source files
        │
        │   (scan)
        ▼
   raw nodes + edges
        │
        │   (graph.mjs: cluster, mass, master detection, polar layout)
        ▼
   synganglion.json  ←──── webscore-overrides.json (curated)
        │
        │   (render.mjs)
        ▼
   spideyorder.md, spideymove.md, per-cluster webmap.md
        │
        │   (read by agent, used to decide)
        ▼
   agent edits source ────────► PostToolUse hook ──► cephalothorax/SESSION-*.jsonl
                                                              │
                                                              │ (on deploy)
                                                              ▼
                                                       consolidate.mjs
                                                              │
                                                              ▼
                                                       movemap.md (curated, append-only)
```

Every arrow is one-way. Every box is either generated (recompute any time) or curated (never overwrite). The single-writer rule is what keeps the loop honest.

---

## 4. Where to find more

| You want to know… | Read |
|---|---|
| What this skill *is* | [`llms.txt`](llms.txt), [`README.md`](README.md), [`core/SKILL.md`](core/SKILL.md) |
| The full benefit catalogue | [`core/README.md`](core/README.md) |
| The architecture, with the JSON schema | [`core/reference/architecture.md`](core/reference/architecture.md) |
| The neuroscience (it's real, it's grounded) | [`core/reference/neuroscience.md`](core/reference/neuroscience.md) |
| How webscores are judged (devil's advocate rubric) | [`core/reference/webscore-rubric.md`](core/reference/webscore-rubric.md) |
| Per-turn / per-session / per-deploy upkeep | [`core/reference/upkeep-protocol.md`](core/reference/upkeep-protocol.md) |
| Measured cost reduction (per-incident + yearly) | [`docs/cost-reduction-analysis.md`](docs/cost-reduction-analysis.md) |
| Benchmark methodology + negative results | [`docs/benchmarks.md`](docs/benchmarks.md) |
| The adapter contract | [`platforms/README.md`](platforms/README.md) |
| The Claude reference adapter | [`platforms/claude/README.md`](platforms/claude/README.md) |
| Commercial offerings | [`enterprise/README.md`](enterprise/README.md) |
| Binding legal terms | `LICENSE`, `COMMERCIAL.md`, `BRANDING.md` |

---

## 5. The contract with the human

If you (the agent) are unsure, **say so to the human and stop**. Do not:
- Invent a fact the brain doesn't carry.
- Edit a master without showing the cascade first.
- Hand-edit a derived file.
- Add a claim without a receipt.
- Touch a cluster without reading its `rules.md`.

If you (the agent) are sure, **act with the receipts visible**. Quote the cluster rule. Cite the cascade output. Point at the webmap. The brain exists so you can be confident - use it.

The web you are walking into was built by an earlier generation of agent + human. It is not for free. It is for the prey.

*Hunt well.*
