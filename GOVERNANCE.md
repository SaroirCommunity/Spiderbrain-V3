<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Governance

How decisions get made in spiderbrain, who makes them, and how that changes as the project grows.

## Project status, plainly

Spiderbrain v3 is an **indie, single-maintainer** project of **Perform Digital Private Limited**. It is not VC-backed. There is no foundation behind it. It runs on a small team (founder + 1 developer at v3 launch).

The governance model is honest about that. Most decisions are made by the maintainer, with community input weighed seriously but not binding. As the project grows, this model is expected to evolve.

## Who decides what

| Decision area | Decider | Source of authority |
|---|---|---|
| Code merging - core (`core/`) | Maintainer at Perform Digital Pvt Ltd | Repository ownership; BUSL licensor |
| Code merging - adapters (`platforms/`) | Maintainer | Repository ownership; adapter contributors carry first-author byline in the adapter's README |
| Roadmap (v4, spiderWaveBrain, next features) | Maintainer | Documented in `core/concepts.md` and `CHANGELOG.md` |
| Licensing (BUSL terms, commercial licensing, Change Date) | Perform Digital Pvt Ltd | Licensor under BUSL 1.1 |
| Branding (the spiderbrain name, trademark, naming policy) | Perform Digital Pvt Ltd | `BRANDING.md` (when published) |
| PR review and conflict resolution | Maintainer | `CODE_OF_CONDUCT.md` |
| Community standards and norms | Maintainer with community input | This document; revised by the RFC process below |
| Security disclosure handling | Maintainer | `SECURITY.md` |

## How decisions get made

For ordinary issues (a bug fix, a small feature, a clarification):

1. **Lazy consensus.** Open an issue or PR. If no maintainer objects within 14 days, the proposal is considered accepted in principle. Implementation review still applies.
2. **Maintainer review.** PRs and design proposals are reviewed by the maintainer, who has final merge authority.
3. **Disagreement.** Two reasonable contributors can disagree about a design decision. The maintainer makes the call and documents the reasoning in the issue thread. The losing side is welcome to fork; that is the BUSL bargain.

For contentious decisions (a significant API change, breaking the honesty contract, changing the license, deprecating a feature):

1. Public RFC issue with at least 30 days of discussion.
2. Maintainer publishes a written decision with reasoning.
3. The decision can be reversed only by the same RFC process.

For security vulnerabilities, the path is the private disclosure flow in [`SECURITY.md`](./SECURITY.md), not the public RFC.

## How to become a maintainer

Maintainership is currently invitation-only. The path is:

1. **Ship at least one tier-1 challenge** from [`CHALLENGES.md`](./CHALLENGES.md) - an adapter, a measured validation report, or a major hardening contribution.
2. **Demonstrate sustained engagement over 3+ months.** Responsive on issues, willing to review others' PRs, aligned with the honesty discipline.
3. **Receive an explicit invitation** from the existing maintainer.

There is no committee, no vote, no quorum. Inviting a new maintainer is the existing maintainer's call.

When the project has more than one maintainer, this section will be revised to reflect the actual model in use (named maintainers, decision-quorum rules, etc.). The revision itself follows the RFC process.

## Project values

These are the values that decisions get weighed against. They are non-negotiable for the core. Adapters and community contributions can deviate only with explicit documentation of why.

1. **Honesty over hype.** Claims have receipts. Measured is not the same as modelled is not the same as estimated. Negative results are first-class. The honesty contract in `docs/benchmarks.md` §0 binds the whole project.
2. **Determinism over heuristics.** The brain is a deterministic function of its inputs. No LLM call inside the brain itself. Receipts are reproducible.
3. **Local-first.** The brain runs on your machine, reads your files, writes plain text and one JSON file. No daemon, no socket, no remote state. Network operations are explicit and opt-in.
4. **Curated data is sacred.** Generated files are recomputable; a corrupt one is fixed by a rebuild. Curated files (the human's judgement, the changelog, the rules, the prey) are never silently overwritten.
5. **Hooks fail closed.** A broken brain never blocks a session, a prompt, or an edit. Exit 0 on every error path. The journal is dumb and append-only.
6. **The spider biology is grounded, not decorative.** Where the metaphor pays for itself in a load-bearing concept (cascade with firebreaks, masters as theta anchors, dragline as the safety line, molt as drift audit), it stays. Where it would be decoration that obscures plain English, it goes.
7. **One brain, one project.** Spiderbrain is per-project memory. Multi-project / multi-tenant / federated brains are commercial-tier work and stay out of the open core's scope.

These values supersede convenience. A PR that violates a value will be rejected even if otherwise excellent.

## What community contributions can change

The community can contribute to (and influence) most of the project:

- New adapters (`platforms/<name>/`).
- New benchmark scenarios (S5, S6, ... in `docs/benchmarks.md`).
- Screenshots, gifs, tutorial recordings.
- Translations.
- Editor / IDE integrations.
- Cookbook recipes.
- Bug fixes anywhere in the codebase.
- Documentation improvements.
- Test surface additions.

What requires explicit maintainer approval (and may be declined):

- Significant changes to the core engine.
- Changes to the hooks contract.
- Changes to the data lifecycle (curated vs derived discipline, dragline, atomicity).
- Changes to the public API of any `core/scripts/*.mjs` entrypoint.
- Changes to the cost-reduction methodology.

What only the licensor can change:

- The license itself.
- The Change Date.
- The Additional Use Grant.
- The commercial-licence terms.
- The trademark and naming policy.

## How this document changes

`GOVERNANCE.md` is itself subject to the RFC process for substantial changes. Small clarifications (typos, link fixes, restructuring without policy change) can land via normal PR with maintainer review. Changes to who-decides-what, the project values, or the maintainer-onboarding path require a public RFC.

## Contact

- General governance questions: `contact@perform.digital`
- Maintainer-only matters (licensing, branding, legal): same address
- Code-of-conduct concerns: `[CONDUCT]` in subject line, same address (see `CODE_OF_CONDUCT.md`)
- Security vulnerabilities: `security@perform.digital` (see `SECURITY.md`)
