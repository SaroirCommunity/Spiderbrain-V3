<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# benchmarks

This folder is the index for everything performance-related. The actual numbers, methodology, and reproducibility instructions live in [`docs/benchmarks.md`](../docs/benchmarks.md) and [`docs/cost-reduction-analysis.md`](../docs/cost-reduction-analysis.md).

## Why this folder exists

We want every performance claim in this repo to be checkable. That means:

1. **Methodology is public.** Anyone can read how we measured.
2. **Raw counts are published.** Every percentage maps back to a number.
3. **Test projects are named.** We don't benchmark on synthetic toys; we benchmark on real projects.
4. **Negative results are published.** Things that didn't work are documented next to things that did.

This is the discipline; the docs are the receipts.

## Where to read

| You want to know... | Read |
|---|---|
| What does the brain save per incident? | [`../docs/cost-reduction-analysis.md`](../docs/cost-reduction-analysis.md) |
| What's the measured methodology? | [`../docs/benchmarks.md`](../docs/benchmarks.md) |
| What did *not* work? | [`../docs/benchmarks.md` §8](../docs/benchmarks.md#8-things-that-did-not-work-negative-results) |
| How do I reproduce these on my own project? | [`../docs/benchmarks.md` §9](../docs/benchmarks.md#9-reproducing-these-benchmarks) |
| What's the version under test? | [`../docs/benchmarks.md` §10](../docs/benchmarks.md#10-versioning) |

## Honesty contract

From [`../docs/benchmarks.md`](../docs/benchmarks.md):

> **Measured** - captured on a real project, real codebase, real LLM call.
> **Modelled** - projected from a measured per-incident baseline.
> **Estimated** - educated guesses we're working to upgrade.

Numbers in the root README cite this discipline. If you find a claim that doesn't map back to a row here, open an issue - we'll either fix the number or fix the receipt.

## Contributing benchmarks

Run the methodology from [`../docs/benchmarks.md` §9](../docs/benchmarks.md#9-reproducing-these-benchmarks) on your own project. Open a PR adding your numbers, methodology, and project profile to `../docs/benchmarks.md` under a new "Community-contributed" section. We want third-party numbers more than first-party ones.

## What's not yet here

- A standalone reproducibility script (`./benchmarks/run.mjs`) that takes a project path and a prompt and emits a control/treatment diff. Planned for v4.
- A labelled hallucination benchmark set so we can move "80% hallucination reduction" from estimated to measured.
- A multi-provider routing benchmark (waiting on the routing adapter to ship).
