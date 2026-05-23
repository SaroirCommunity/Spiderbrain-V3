<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Benchmarks - methodology and honest results

This document is the audit trail for every performance number quoted in the README. We publish the methodology, the raw counts, and the things that *did not* work.

> **Honesty contract.** Numbers labelled **measured** were captured on a real project, real codebase, real LLM call. Numbers labelled **modelled** were projected from a measured per-incident baseline. Numbers labelled **estimated** are educated guesses we're working to upgrade. We never present modelled numbers as measured.

---

## 1. Test projects

| Project | Surface | Nodes | Synapses | Masters | Used for |
|---|---|---:|---:|---:|---|
| **perform.digital** | Next.js 16 + 2 Cloudflare Workers + D1 (7 tables / ~60 fields) + 201 blog posts | 154 | ~310 | 11 | anchor scenario, hook-cost measurement |
| **Saroir (saroirspiderbrain)** | TypeScript Next.js with strict identity / contrib / collab DB boundaries | 1,629 | 2,227 | 60 | scaling test, alias-resolution test |

Both projects have actively-maintained second brains under their respective sibling folders. perform.digital is the project we know the deepest, so it's the anchor for cost claims; Saroir is the scale test (10× the node count).

---

## 2. Scenarios

### S1 - Magic-link auth bug (perform.digital)
Anchor scenario for `docs/cost-reduction-analysis.md`. Two-file fix surfaced amid ~40 candidate files. Measured cold vs. brain-loaded.

### S2 - DB schema add (perform.digital)
Add a new column to `leads`, expose it via the worker, render it in the admin panel. Three-cluster ripple (`database` → `shell` → `admin`). Measured.

### S3 - Cross-boundary credential write (Saroir)
Attempt a fix that *looks* like it should write user identity into `contrib_db`. Brain's `rules.md` for the `credentials` cluster explicitly forbids this. Measures whether the brain stops a hallucinated boundary-violation before the edit.

### S4 - Onboarding cold-start (both)
A fresh agent (no memory) asked to summarise "what does this project do, where would I add feature X". Wall-clock to first useful summary.

---

## 3. Methodology

For each scenario, we run **two passes**:

1. **Control:** fresh agent session, `--no-skill spiderbrain`, no `SessionStart` hook. Same model, same temperature, same prompt.
2. **Treatment:** same agent, brain loaded via `SessionStart`, `PostToolUse` journal enabled, relevant `webmap.md` injected as needed.

We log per-pass:
- Total tool calls
- Total input tokens (with and without amortising the SessionStart brief across a 5-task session)
- Total output tokens (including any retry overhead)
- Wall-clock from prompt to final assistant message
- Correctness verdict (passes the project's existing tests / linter / type-check)
- Files edited (correct vs. incorrect)

We **do not** count:
- Tool calls that happen during brain build/maintenance (those are documented separately under §5).
- Tokens spent reading the brain itself when explicitly queried (those are a real cost and *are* counted).

---

## 4. Results - measured

### S1 - Magic-link auth bug

| | Control | Treatment | Δ |
|---|---:|---:|---:|
| Tool calls | 30 | 7 | **-77%** |
| Input tokens | 42,400 | 8,700 (worst) / 6,780 (amortised) | **-79% / -84%** |
| Output tokens | 8,900 | 3,800 | **-57%** (-64% to -79% with retry penalty) |
| Wall-clock | ~9 min | ~3 min | **-67%** |
| Wrong edits | 1 | 0 | **-100%** |

Full breakdown in `docs/cost-reduction-analysis.md`.

### S2 - DB schema add

| | Control | Treatment | Δ |
|---|---:|---:|---:|
| Tool calls | 21 | 9 | -57% |
| Input tokens | 31,200 | 9,400 | -70% |
| Output tokens | 6,400 | 4,800 | -25% |
| Wall-clock | ~7 min | ~4 min | -43% |
| Wrong edits | 0 | 0 | - |

The brain helped most on orientation here. Editing-phase tokens were similar because the actual code change is the same size either way. Output reduction is modest by design.

### S3 - Cross-boundary credential write (Saroir)

| | Control | Treatment |
|---|---|---|
| Correctness | Wrote credential payload to `contrib_db`. **Boundary violation.** | Refused the edit citing `rules.md`. Proposed a safe alternative. |
| Tool calls | 18 | 11 |
| Wall-clock | ~6 min | ~5 min |

This is the scenario the brain exists for. Cost savings are modest; correctness gain is categorical.

### S4 - Onboarding cold-start

| Project | Control wall-clock | Treatment wall-clock | Δ |
|---|---|---|---:|
| perform.digital | ~14 min to first useful summary | ~45 sec (reads SPIDERBRAIN.md + spideyorder.md) | **-95%** |
| Saroir | ~38 min (1,629 nodes is a lot to grep) | ~70 sec | **-97%** |

These are the headline onboarding numbers in the README.

---

## 5. Build / maintain overhead - measured

| Operation | Project | Duration | Notes |
|---|---|---:|---|
| First-time `build-brain` | perform.digital | 4.8 s | Includes scan, graph, polar layout, webscore-auto, write |
| First-time `build-brain` | Saroir | 19.3 s | After alias-resolution + JSONC-strip fixes |
| `consolidate` (per session) | both | <1 s | Folds cephalothorax journal → movemap |
| `molt` (drift audit) | perform.digital | 2.6 s | Read-only |
| `molt` | Saroir | 11.4 s | Read-only |
| `PostToolUse` hook | both | <5 ms / call | Append-only JSONL line |
| `SessionStart` brief | both | <30 ms | Reads two files |

Hook overhead is below human-perceptible. `molt` is opt-in.

---

## 6. Results - modelled

These are extrapolations from measured per-incident numbers across a year of realistic usage. See `docs/cost-reduction-analysis.md` §6 for the model.

| Effect | Per-agent yearly estimate |
|---|---|
| API cost (Sonnet 4.6) | **$40–$60** |
| Engineering wall-clock returned | **~42 hours (~5 working days)** |
| Wrong-fix debug loops avoided | **~23 hours** |
| Onboarding compression per event | **~10 days** off each major onboarding |
| Rediscovery (re-reading the same files) | **~10 hours** |

Multiplies linearly with team size. Multi-model routing savings (15–25% additional) are not included here - those land with the routing adapter.

---

## 7. Results - estimated (work in progress)

These we want to upgrade to "measured" but currently can't.

| Claim | Status | Why we can't measure yet |
|---|---|---|
| 80% hallucination reduction across the 14 categories listed in core/README.md | Estimated | We have measured wrong-fix avoidance (S1, S3) but not per-category hallucination rates. Need a labelled benchmark set. |
| 70% review-cycle reduction | Estimated | We've observed it qualitatively (fewer review rounds when the brain enforces cluster rules) but haven't run a controlled review-pass count. |
| Routing / inference savings on multi-provider | Estimated | The router adapter isn't shipped. Numbers are from a non-public prototype. |

---

## 8. Things that did *not* work (negative results)

We publish these so you don't waste time re-discovering them.

- **Nearest-master assignment (v4).** Theoretically eliminates column lopsidedness. Measured uplift on perform.digital: **+3.5%** in column-balance score. On Saroir: **−1.5%**. The graphs were too shallow for the rebalancing to matter. v4 is in the codebase, gated behind a flag; v3 is the default. Honest answer: don't enable v4 yet on small/medium projects.
- **8 vs 9 nodes per cluster display (1+8).** Display-time choice; no measurable effect on cost or correctness. We kept 8 (the spider's legs).
- **Recency-only ranking.** Worse than `recency × webscore`. Surface noise dominates.
- **Per-file webscore auto without human judgement.** `webscoreAuto` alone misranks 18–24% of files vs. the human-curated overrides. Auto baseline is a starting point, not a substitute.
- **Naive JSONC regex stripper.** Ate `/*` inside string literals (e.g. `"@/*"` paths block). Replaced with a state-aware tokeniser. Listed here because someone will re-introduce the regex if we don't.

---

## 9. Reproducing these benchmarks

You'll need:

- Node ≥ 18.
- A real project (your own - synthetic projects don't have the file-surface noise that makes the brain useful).
- Two fresh agent sessions (Claude Code, Cursor, Aider - anything that logs tokens).
- A real bug or feature you can describe in one paragraph.

Then:

```
# Build the brain on your project
node ~/.claude/skills/spiderbrain/scripts/build-brain.mjs \
  --brain /abs/path/to/yourproject-spiderbrain

# Control pass - disable the skill, run your bug prompt cold
# Treatment pass - enable SessionStart hook, run the same prompt
# Diff the token / call / wall-clock counts
```

Open an issue with your numbers, methodology, and project profile. If our claims don't hold on your project, we want to know.

---

## 10. Versioning

These benchmarks were captured against:
- Spiderbrain core: v3 (locked)
- Claude Sonnet 4.6
- perform.digital commit `9ac921d`
- Saroir commit (private)

When the core ships v4 or spiderWaveBrain enters preview, this document gains a new section. Old numbers stay published with their version tag - we don't rewrite history.

---

## 11. Recovery validation - measured end-to-end

The single most operationally critical correctness property in the package is the curated-data recovery path: a corrupt `spiderbrain.config.json` (or any curated file) must be quarantined and restored from the dragline, not silently overwritten with defaults. The unit tests in [`core/__tests__/recovery.test.mjs`](../core/__tests__/recovery.test.mjs) cover this against synthetic data in a temp directory; this section records the result of running the same flow against a real production brain.

### Setup

Target brain: **Saroir** at `C:/Users/abhi/Documents/Saroir Master/saroirspiderbrain` (1,629 nodes, 8 clusters, 60 masters, 1.8 MB `synganglion.json`, 3 existing dragline snapshots).

Pre-test state:

| Artefact | Value |
|---|---|
| Live `spiderbrain.config.json` | 2.6 KB |
| Live config SHA-256 | `3a7661ffcb6b174743d2ab77d171bdaea3ce7d90a2216333a0ed54e6b3ed0396` |
| Latest dragline snapshot | `.dragline/2026-05-22T22-36-46/` |
| Snapshot's config SHA-256 | `3a7661ffcb6b174743d2ab77d171bdaea3ce7d90a2216333a0ed54e6b3ed0396` (matches live byte-for-byte) |

### Procedure

1. Backed up the live config to a safe location outside the brain folder.
2. Overwrote `spiderbrain.config.json` with intentionally invalid JSON: `{ "this is": not valid json, missing quotes, } trailing garbage`. Hash changed to `a32bf11c…`.
3. Verified no `.fouled-*` files existed in the brain folder before recovery.
4. Triggered the recovery path by calling `loadCurated('<saroir-brain>')` directly via Node.
5. Inspected the returned object and the on-disk state.
6. Cleaned up the test-artefact `.fouled-*` file and removed the safety-net backup.

### Result

| Check | Outcome |
|---|:--:|
| `loadCurated` returned a config (not `null`, did not throw) | ✓ |
| Returned `config.prey` matched the original Saroir prey string | ✓ |
| Returned `config.project` matched the original project path | ✓ |
| Recovery note emitted with the JSON parser's exact error | ✓ |
| Note named the quarantine path (`.fouled-2026-05-23T04-04-35`) | ✓ |
| Note named the dragline as the restoration source | ✓ |
| `spiderbrain.config.json` on disk restored to original SHA-256 | ✓ byte-for-byte (`3a7661ff…`) |
| `.fouled-2026-05-23T04-04-35` file created with the corrupted 64 bytes preserved | ✓ |
| No silent overwrite with defaults; no data loss | ✓ |

The emitted recovery note (verbatim):

```
spiderbrain.config.json was CORRUPT (Unexpected token 'o', ..."his is": not valid j"... is not valid JSON).
Quarantined to C:\Users\abhi\Documents\Saroir Master\saroirspiderbrain\spiderbrain.config.json.fouled-2026-05-23T04-04-35
and restored the last-good copy from the dragline.
```

### What this validates

1. `readJsonSafe` distinguishes missing from corrupt on real-world JSON parser errors, not just synthetic ones.
2. The corrupt file is quarantined (renamed with a `.fouled-<ts>` suffix) rather than deleted, preserving the bytes for forensic review.
3. The dragline restore correctly identifies the latest snapshot and copies the curated file back into place verbatim.
4. The recovery note carries the exact parser error (with character context), the quarantine path, and the restoration source - enough information for the operator to diagnose without re-running.
5. Caller code receives the restored data plus an honest note, and can proceed without manual intervention.

### Versioning

This trace was captured against:

- Spiderbrain core: v3 (locked)
- Saroir brain: `2026-05-23T04:04` corruption timestamp on the quarantine file
- Node: 24.14.0 (Node ≥ 18 required)

The same flow runs in the unit tests on every test pass (see [`core/__tests__/recovery.test.mjs`](../core/__tests__/recovery.test.mjs)). This section records that the flow also holds end-to-end on a real 1,629-node brain, not just on the 8-file fixture project.
