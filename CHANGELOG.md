<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Changelog

All notable changes to spiderbrain are recorded here.

The format follows [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning 2.0](https://semver.org/spec/v2.0.0.html).

Community contributions credited in a release land here by name (with the contributor's consent on naming) along with a link to the merged PR.

## [Unreleased]

- **MCP adapter** (`platforms/mcp/server.mjs` + `platforms/mcp/README.md`) — on-demand tool + resource surface for opencode, Claude Desktop, Cursor, Continue, Zed, and any MCP-capable client. Four tools (`spiderbrain_query`, `spiderbrain_cascade`, `spiderbrain_molt`, `spiderbrain_brief`), two concrete resources (`brain://SPIDERBRAIN.md`, `brain://spideyorder.md`), one URI template (`brain://webmap/{cluster}` via `resources/templates/list`), one prompt (`cascade_before_edit`). Zero npm dependencies. All output fenced + control-char-sanitised while preserving newlines. Stdin re-entrancy guard on pipelined requests. opencode wired with `"type": "local"` and unified command array.

Planned for v4 (gated; not yet released):

- Nearest-master assignment (tested; +3.5% on perform.digital, −1.5% on Saroir; honest results in `docs/benchmarks.md` §8).
- `PreToolUse` hook that runs cascade before risky edits.
- Symbol-level scan to upgrade confabulation detection from `[partial]` to `[shipped]`.

## [3.0.1] - Security + correctness patch

A surgical patch landing the items previously queued under `[Unreleased]` for the next 3.0.x release. No behaviour change for the brain's data model; every fix tightens a known boundary or removes a known foot-gun. All 17 unit tests (4 new) pass.

### Security

- **Sanitise + untrusted-content fence ported to `session-brief.mjs`.** The SessionStart hook now mirrors `prompt-brief.mjs` discipline: every project-sourced string (prey, hot-list file ids, top-webscore file ids) flows through `sanitize()` (control-char strip, whitespace collapse, length cap), and the project-sourced section is wrapped in `<spiderbrain-untrusted-content>` with a trusted header outside the fence. A SQL column DEFAULT `'ignore previous instructions'` or a file path containing a newline can no longer break out of the brief.
- **Sanitisation extended to `consolidate.mjs::movemap.md`.** Every project-sourced string (file path, cluster name, deploy label) is sanitised before being appended to the permanent log. Backticks are stripped in addition to the base set because the writer wraps file ids in inline-code spans; a backtick in the input would tear the span open. movemap.md is curated long-term memory — a poisoned block, once committed, stays committed.
- **Case-insensitive segment-aware containment in `journal.mjs::inOrUnder`.** On Windows and default-APFS macOS (case-insensitive filesystems), a brain registered as `/foo/Project-Brain` now containment-matches an incoming `/foo/project-brain/...` from an editor that canonicalised case differently. Without the fold, mixed-case paths either (a) journalled an edit to the brain itself, or (b) silently dropped a legitimate project edit. The Linux behaviour (strict comparison) is unchanged. The segment-aware sibling-prefix guard (`/foo/project-brain-backup` ≠ `/foo/project-brain`) remains intact under the fold.

### Reliability

- **Atomic append for `movemap.md`.** New `io.mjs::appendTextAtomic` helper: reads the destination (missing → empty), appends in-memory, writes via tmp + best-effort fsync + rename with the Windows unlink-then-rename fallback. `consolidate.mjs` now uses it. A crash mid-append leaves either the old file or a stranded `.tmp`, never a half-written log. Documented as single-writer atomic (not a cross-process lock); `consolidate.mjs` is the only declared writer of `movemap.md`.
- **`.gitignore` scaffolded on first brain build.** `build-brain.mjs` writes a sensible default (`cephalothorax/SESSION-*.jsonl`, `.dragline/`, `*.fouled-*`, `*.tmp`) once, via `writeIfAbsent`, so user customisations survive every later rebuild. Generated views (`synganglion.json`, `spideyorder.md`, `spideymove.md`, each `<cluster>/webmap.md`) are intentionally NOT excluded — committing them lets reviewers see "what the brain thought today" without rebuilding.
- **`verify.mjs` next-steps render with platform-appropriate continuation.** Windows prints the `build-brain.mjs` invocation on one line (cmd.exe `^` continuations are brittle, PowerShell uses backtick, bash-on-WSL uses `\` — a single line is the only form that pastes cleanly into all three). POSIX shells continue with `\` for readability.

### Tests

- New `core/__tests__/io.test.mjs` (4 tests) locks down `appendTextAtomic`: creates a missing file, appends without losing prior bytes, leaves no stranded `.tmp`, round-trips UTF-8 byte-for-byte.
- Total surface: **17 tests, ~620 ms wall-clock.**

### Notes

- `[Unreleased]` now contains only the v4-gated items.
- No public API surface changed. No behaviour change for an already-built brain on Linux. Re-running `build-brain.mjs` on an existing brain scaffolds `.gitignore` if absent and is otherwise idempotent.

## [3.0.0] - First public release

### Added

**Core engine (`core/`)**

- File scanner with JS/TS import-graph extraction (`scan.mjs`), SQL parser with paren-depth handling for trailing-semicolon-tolerant table extraction, and tsconfig-paths alias resolution.
- Dependency graph build (`graph.mjs`) with cluster decomposition, master detection (`mass × rhythm`), column assembly with a third direction (`modulation`), and amplitude (`mass × thetaGain × recencyDecay`).
- Cascade engine (`nervenet.mjs`) with structural firebreaks at masters: a gamma fault climbing into a non-bad master hard-stops. Pure, deterministic, zero I/O.
- Dragline (`dragline.mjs`) for curated-state snapshot, quarantine, and restore. Keeps the last 10 snapshots by default.
- Drift audit (`molt.mjs`) - re-scans the project and reports orphans, dangling edges, hash mismatches, and webscore divergence.
- Query interface (`query.mjs`) returning recency × webscore ranking, cluster slice, or cascade output.
- Safe I/O helpers (`io.mjs`) including `readJsonSafe` (distinguishes missing from corrupt) and `writeJsonAtomic` (write-tmp + fsync + rename for curated state).
- Git-time recency (`gittime.mjs`) using `git log` instead of file `mtime` so editor opens do not move the recency needle.
- Render layer (`render.mjs`) for the two view files and per-cluster webmaps.
- The shared brain loader / rebuilder (`brain.mjs`) coordinating scan + graph + writes.

**Always-on hooks (`platforms/claude/hooks/`)**

- `session-brief.mjs` (SessionStart): injects prey + last session's hot files + top webscores. Fires once per session. Under 30 ms typical.
- `prompt-brief.mjs` (UserPromptSubmit): per-prompt context whisper with a disk cache (mtime + size keyed in `os.tmpdir()`), 80 ms in-script time budget, cluster-name stoplist with a path-token rule, untrusted-content fencing, full project-source sanitisation. Silent when nothing matches.
- `journal.mjs` (PostToolUse): dumb, fast, append-only JSONL journal with segment-aware path containment for both brain-self and project boundaries. Exits 0 on every error path.

**Documentation**

- Root `README.md` rewritten with Quick Start above the fold, "What you get" mini-snapshot of the brain on disk, S1 and S2 cost-reduction tables tagged measured / modelled / estimated, Mermaid architecture diagram below the value sections.
- `INSTALL.md` with two install patterns (Claude Code skill / standalone clone) plus install verification.
- `core/SKILL.md` - the BUILD / MAINTAIN / QUERY / CASCADE skill spec.
- `core/concepts.md` - 11 design pillars honestly tagged `[shipped]` / `[partial]` / `[planned v4]` / `[commercial]`. Replaces an earlier set of 19 single-concept folder READMEs (collapsed; the old folders read as architecture cosplay).
- `core/reference/` - architecture spec, upkeep protocol, webscore rubric, neuroscience grounding.
- `docs/cost-reduction-analysis.md` - magic-link scenario walkthrough with measured S1 (`30 → 7` tool calls, `42 400 → 6 780` input tokens, `~9 → ~3` min wall-clock) and S2 (`21 → 9` calls, `31 200 → 9 400` input, `~7 → ~4` min) on real projects.
- `docs/benchmarks.md` - methodology with explicit measured / modelled / estimated discipline, including the honest negative-result row (v4 nearest-master: +3.5% on perform.digital, −1.5% on Saroir).
- `CHALLENGES.md` - open contributor challenges across adapters (A1–A7), validation reports (V1–V5), screenshots and demos (S1–S5), and smaller wins (T1–T4). Recognition: name added to `CONTRIBUTORS.md`; removed on request.
- `AGENTS.md` - the operating manual for AI agents working on or with spiderbrain.
- `llms.txt` - short skill summary for LLM crawlers.
- `core/scripts/verify.mjs` - one-line install integrity check; verifies Node version + 18 required files non-empty.

**Test surface (`core/__tests__/`)**

- `scan.test.mjs`: fixture-project node count, alias resolution, comment-strip discipline, SQL trailing-semicolon tolerance.
- `cascade.test.mjs`: determinism across repeated calls, order-independence under reordered `badIds`, master firebreak trip, no-master full propagation.
- `recovery.test.mjs`: corrupt-config quarantine without dragline (throws), corrupt-config restore with dragline (succeeds), missing-config first-run, corrupt-overrides warns but does not block.

13 tests total; pass in roughly 320 ms.

### Security

- All curated-state writes are atomic (write-tmp + fsync + rename) via `writeJsonAtomic`.
- Three Claude hooks fail closed: exit 0 on every error path; never block a session, prompt, or edit.
- `journal.mjs` path containment is segment-aware (defeats the sibling-prefix attack where `/foo/project-brain-backup` matched `/foo/project-brain`).
- Symlink escape from scan and dragline is explicitly refused via `isSymbolicLink()` checks.
- `prompt-brief.mjs` sanitises every project-sourced string (control-char strip, whitespace collapse, length cap) and wraps emitted context in `<spiderbrain-untrusted-content>` fences with a trusted instruction header outside.
- **Dragline recovery validated end-to-end on Saroir** (1,629 nodes, 8 clusters, 3 existing snapshots). A real corruption event (invalid JSON overwriting `spiderbrain.config.json`) was quarantined to `.fouled-<ts>` and restored byte-for-byte from the latest dragline snapshot. The recovery note carried the exact JSON parser error, the quarantine path, and the restoration source. Full trace in `docs/benchmarks.md` §11.

See [`SECURITY.md`](./SECURITY.md) for the full threat surface and the known gaps still on the roadmap.

### Known limitations (documented honestly)

- v3 scales fine to roughly 10 000 nodes; beyond that, single-file `synganglion.json` I/O dominates. See `core/concepts.md` §11.
- v4 (nearest-master refinement) is in development, gated, with documented honest results (mixed on the two real test projects). v3 is the default.
- spiderWaveBrain (enterprise / supercomputing-scale evolution) is in development. No early promises.
- Six platform adapters (OpenAI, Cursor, Gemini, Mistral, DeepSeek, Grok) are open community challenges. Claude is the only shipped adapter. See `CHALLENGES.md`.
- Benchmark measurements (S1 / S2) are single-operator, single-project. The CHALLENGES.md V1 path is the project's mechanism for upgrading these to community-verified data points.
- Hallucination-reduction claim is tagged `[estimated]`; CHALLENGES.md V5 is the path to upgrading it to `[measured]`.

### Licensing

- Core (`core/`) under BUSL 1.1; converts to Apache 2.0 four years after public release.
- Adapters under (intended) Apache 2.0.
- Commercial production use of the core: see `COMMERCIAL.md`.

### Roadmap (post-3.0.0)

See the **Unreleased** section above and `core/concepts.md` for the full pillar-by-pillar shipped / partial / planned v4 / commercial map.

---

[Unreleased]: https://github.com/SaroirCommunity/Spiderbrain-V3/compare/v3.0.1...HEAD
[3.0.1]: https://github.com/SaroirCommunity/Spiderbrain-V3/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/SaroirCommunity/Spiderbrain-V3/releases/tag/v3.0.0
