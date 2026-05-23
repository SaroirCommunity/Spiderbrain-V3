<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Open challenges

**Spiderbrain does two things that matter most: it cuts input tokens by 80%+ on a real codebase, and it removes the classes of hallucination that come from a model not knowing the project.**

Both numbers are conservative. The 80% was measured on a 154-node Next.js project ([full receipt](./docs/cost-reduction-analysis.md)); on bigger codebases the savings tend to climb. Hallucination reduction is still tagged `[estimated]` because the labelled-prompt benchmark hasn't been built yet - one challenge below changes that.

**We would be genuinely happy to be proved wrong** - higher *or* lower - on your stack. Bring numbers, we publish them, you get credit.

The engine ships. The Claude adapter ships. Everything else is open.

---

## How a challenge works

1. Pick one below.
2. Open an issue titled `CHALLENGE: <id>` so we can avoid duplicate work.
3. Build it on a fork.
4. Submit a PR.
5. Reviewed against the acceptance criteria stated here.
6. Merged. Your name lands in `CONTRIBUTORS.md`.

If you claim and don't ship in 60 days the challenge releases back to the pool. Say so in the thread if you need more time; that's usually fine.

---

## Recognition

If your PR is accepted, your name is added to `CONTRIBUTORS.md`. If you later want it removed, ask. That's it.

No bounties, no priority queues, no perpetual claims. Just credit, while you want it.

---

## Adapter challenges - port the brain to another platform

Claude is the shipped reference. The contract is in [`platforms/README.md`](./platforms/README.md); the smallest working example is the three hooks in [`platforms/claude/hooks/`](./platforms/claude/hooks/). Mirror that shape for your platform.

Required for every adapter: a `boot` injector (SessionStart-equivalent), a `prompt-brief` shim (per-prompt context with the same sanitisation discipline shown in `prompt-brief.mjs` - control-char strip, untrusted-content fence, time budget, silent-when-no-match), a journal bridge, and tool-spec definitions for `query.mjs` / `cascade.mjs` / `molt.mjs`. Realistic effort: 20-40 hours.

| ID | Platform | Notes |
|---|---|---|
| A0 | **MCP server validation** | The scaffold (`platforms/mcp/server.mjs`) exists. Run it on a 50+ file real project, confirm all four tools return valid output, and attach a terminal recording. First to land earns top-of-table byline. |
| A1 | **OpenAI** (Assistants / Responses API) | Tool-spec format here is reusable for most other providers; landing this first accelerates everything after. The MCP scaffold covers the query/cascade/molt tool surface; the native adapter still owns boot + per-prompt whisper + journal. |
| A2 | **Cursor** (.cursor/rules + composer) | The IDE-side reference. The before/after gif from this one is the most-watchable artefact the project will ship. The MCP scaffold covers the query/cascade/molt tool surface; the native adapter still owns boot + per-prompt whisper + journal. |
| A3 | **Gemini** (Code Assist + API) | Opens the Google Workspace + Vertex surface. The MCP scaffold covers the query/cascade/molt tool surface; the native adapter still owns boot + per-prompt whisper + journal. |
| A4 | **Mistral / Codestral** | Coding-specialist model with a real niche. The MCP scaffold covers the query/cascade/molt tool surface; the native adapter still owns boot + per-prompt whisper + journal. |
| A5 | **DeepSeek Coder** | Cost-aware audience; bonus if you ship a side-by-side cost comparison. The MCP scaffold covers the query/cascade/molt tool surface; the native adapter still owns boot + per-prompt whisper + journal. |
| A6 | **Grok (xAI)** | The X-ecosystem integration. The MCP scaffold covers the query/cascade/molt tool surface; the native adapter still owns boot + per-prompt whisper + journal. |
| A7 | **Your platform** | Self-hosted LLM, internal agent, anything that satisfies the contract. Open an issue first to confirm scope. |
| A8 | **opencode native shim** | The MCP scaffold covers ~80% of the opencode integration. The remaining 20% is a native `inject-brief` shim wired to opencode's session-start event so the boot brief (prey + hot list + top webscores) fires automatically. See `platforms/README.md` for the full adapter contract. |

**Acceptance for any adapter:** working end-to-end on a real project of 50+ files; the journal contains valid JSONL after a session; the per-prompt shim matches the sanitisation discipline in `prompt-brief.mjs`; a 30-second screen recording or terminal capture demonstrating the brief loading and the agent acting on it.

---

## Validation challenges - prove us right or wrong

These are the challenges where we genuinely don't know what numbers you'll find. **Run the brain on your codebase, log the deltas, publish.** Lower numbers than ours, higher numbers than ours, or "no measurable effect on my stack" - all three get the same credit and the same row in `docs/benchmarks.md`.

### V1 - Reproduce S1 (or refute it) on your codebase

Pick a real bug or refactor you handled in the last month. Build a brain on the project. Run the task cold (no brain) and warm (brain loaded). Log tool calls, input tokens, output tokens, wall-clock, wrong-edits. Diff against the S1 baseline (30 → 7 calls, 42.4k → 6.8k input tokens, ~67% wall-clock).

**Realistic effort:** half a day. **Acceptance:** a PR adding a row + methodology + project profile to `docs/benchmarks.md` under "Community-contributed scenarios," with both transcripts attached (redact as needed).

### V2 - Cross-language coverage

Build a brain on a project in a language we haven't covered (Python, Rust, Go, Java, C#, PHP, Ruby, Elixir, Swift, Kotlin, OCaml, Haskell, anything). Measure S1-style and S2-style scenarios. Document any language-specific friction in the scanner.

**Realistic effort:** 1 day. **Acceptance:** numbers + methodology + a "friction notes" section.

### V3 - Large-project ceiling test  *(we expect failures - that's the point)*

`core/concepts.md` §11 documents the v3 ceiling at roughly 10,000 nodes. **We expect failure modes to surface at or before that.** A clean failure-mode report at 7k nodes is as valuable as a 12k success - bring whichever you find.

**Realistic effort:** 1-2 days. **Acceptance:** numbers + the project profile + an honest report on what broke first.

### V4 - A new scenario in the benchmark catalog

Pick a domain we haven't measured: security audit, schema migration, dependency upgrade, framework upgrade, flaky-test debugging, performance investigation, API contract change. Run it cold and warm. Publish.

**Realistic effort:** 1 day. **Acceptance:** a new scenario section in `docs/benchmarks.md` (S5, S6, ...) using the same table shape.

### V5 - Move hallucination reduction from `[estimated]` to `[measured]`

This is the highest-leverage benchmark contribution the project can absorb. The 80% hallucination-reduction claim is conservatively estimated - your work upgrades it to measured. **Split into V5a and V5b if you want; the project benefits from either piece landing alone.**

- **V5a (set construction):** build a labelled set of ≥ 20 prompts across the 14 hallucination categories listed in `core/README.md`. Real prompts that elicit known false file paths, invented functions, made-up APIs. Realistic effort: 1-2 weeks.
- **V5b (run + publish):** take V5a's set (or your own), run cold and warm, score by category, publish methodology + numbers. Realistic effort: 1 week.

**Acceptance:** PR adding `benchmarks/hallucination-set/` + scoring script + numbers in `docs/benchmarks.md`. Converts an `[estimated]` row into `[measured]`.

---

## Show-the-brain challenges

The brain is hard to grok from text. One good screenshot beats ten paragraphs.

### S1 - The brain folder on disk

A clean, well-composed screenshot of a real brain folder (sensitive content redacted). Tree-view plus syntax-highlighted previews of `SPIDERBRAIN.md` and one `webmap.md`. **Acceptance:** PR adding the image to `assets/` + a reference in the root README "What you get" section. PNG, 1920px+.

### S2 - Agent session in action

A 15-30 second recording of an AI session with the brain loaded: SessionStart brief appearing, agent reading a webmap or running `query.mjs`, a cascade output. Any platform. **Acceptance:** PR with the gif + alt-text + a one-line caption.

### S3 - Architecture visualisation

A clean render of one of: the data flow, the cascade engine with masters and firebreaks, the polar layout. SVG or PNG at 1920px+, dark-mode friendly. **Acceptance:** PR adding the image with attribution.

### S4 - Before / after of a hard bug fix

Two recordings of a real bug your team hit: cold-start session vs brain-loaded session. Honest, raw, no editing tricks. **Acceptance:** both recordings + a one-page writeup, redacted as needed.

### S5 - Spideyorder / webmap rendered beautifully

A typographically-strong render of one project's `spideyorder.md` or a cluster's `webmap.md`. Markdown editor screenshot, custom HTML render, Figma mock - whatever looks like something you'd hang on a wall. **Acceptance:** PR with the image + the source markdown + a brief on the rendering tool.

---

## Sharpen-the-surface challenges

Smaller, still credited.

| ID | What | Effort |
|---|---|---|
| T1 | Translate the root README to another language (`README.<lang>.md`, structurally aligned to the English version, back-link to original). | 2-4 hours |
| T2 | A 5-15 minute walk-through tutorial (text or video) from `git clone` to first brain to first cascade. | half a day |
| T3 | A cookbook recipe in `docs/recipes/<scenario>.md` for a real workflow: schema migration, multi-cluster ripple, onboarding a contractor, privacy-boundary check before a refactor. | 2-4 hours |
| T4 | An editor integration that surfaces brain context (VS Code, neovim, Emacs, JetBrains, Zed) - anything that puts the brain in front of the developer without a full LLM adapter. | scope varies; open an issue first |

---

## Currently claimed

| Challenge | Claimed by | Issue | Status |
|---|---|---|---|
| - | - | - | open |

*(Updated as issues open and contributors claim them. Empty at v3 launch - and that is the point. First contributor gets first byline.)*

---

## What you do not have to do

- Sign a CLA for adapters (Apache 2.0 covers them). The BUSL core has its own contributor terms documented separately; you only see them if your PR touches `core/`.
- Pay anything.
- Be a senior engineer. First-time OSS contributions are welcome; the bar is craft, not tenure.
- Commit long-term. One PR is enough.

## What we ask

- Open an issue before a Tier 1 or Tier 2 PR. Coordinate scope.
- One challenge per PR.
- Include the methodology, the numbers, the caveats - honesty is the project's standing claim.
- Don't ship anything that requires an LLM call inside the brain itself. The brain is deterministic; that's a load-bearing property.

---

Open an issue. Let's see what your numbers say.
