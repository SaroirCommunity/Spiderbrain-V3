<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Contributing to spiderbrain

Thank you for considering a contribution. This document explains the process, what we expect, and the legal mechanics that apply because the core engine is BUSL-licensed.

The short version: read [`CHALLENGES.md`](./CHALLENGES.md), pick a challenge, open an issue, fork, build, submit a PR with the CLA acceptance line included. Names of accepted contributors are added to [`CONTRIBUTORS.md`](./CONTRIBUTORS.md).

## Before you start

Read in roughly this order:

1. [`README.md`](./README.md) - what spiderbrain does and why it exists.
2. [`CHALLENGES.md`](./CHALLENGES.md) - the explicit list of work the project wants, with tiered scope and acceptance criteria.
3. [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) - community standards. Participation in any project space is conditioned on accepting these.
4. [`GOVERNANCE.md`](./GOVERNANCE.md) - who decides what and how.
5. [`CLA.md`](./CLA.md) - the Contributor License Agreement you will accept by submitting a PR.
6. [`AGENTS.md`](./AGENTS.md) - operating manual if your contribution touches `core/` (also useful if you are an AI agent submitting on behalf of a human).

## What contributions are welcome

In rough order of frequency:

- **Platform adapters** for new LLM providers, IDEs, or coding agents. See `CHALLENGES.md` Tier 1 (A1 to A7).
- **Validation reports and benchmarks** on your own codebase. See Tier 2 (V1 to V5).
- **Screenshots, gifs, and demonstration recordings**. See Tier 3 (S1 to S5).
- **Translations, tutorials, recipes, and editor integrations**. See Tier 4 (T1 to T4).
- **Bug fixes** anywhere in the codebase.
- **Documentation improvements**: typos, clarifications, missing cross-references, fixing or expanding examples.
- **Test surface additions**, especially around the curated-data lifecycle and the hook contract.
- **Security disclosures**. These follow a private path, not a PR. See [`SECURITY.md`](./SECURITY.md).

The following require explicit maintainer approval before you start work. Open an issue first:

- Significant changes to the core engine in `core/scripts/`.
- Changes to the hooks contract.
- Changes to the curated-vs-derived data discipline (dragline, atomic writes, single-writer rule).
- Changes to the public API of any `core/scripts/*.mjs` entrypoint.
- Changes to the cost-reduction methodology in `docs/cost-reduction-analysis.md` or `docs/benchmarks.md`.

## The contribution workflow

### 1. Open an issue first (Tier 1 and Tier 2)

For Tier 1 (adapters) and Tier 2 (validation reports), open a GitHub issue titled `CHALLENGE: <id>` (for example, `CHALLENGE: A1 OpenAI adapter`). Confirm scope and informal assignment in the issue thread before investing significant time. Two contributors should not unknowingly build the same adapter.

Smaller contributions (typo fixes, documentation, single-file bug fixes) do not require a prior issue. A PR with a clear description is sufficient.

### 2. Fork and branch

Fork the repository on GitHub. Clone your fork locally. Create a topic branch from `main`:

```
git checkout -b feature/openai-adapter
git checkout -b fix/journal-windows-case
git checkout -b docs/install-troubleshooting
git checkout -b test/cascade-deterministic-fanout
```

Recommended branch prefixes: `feature/`, `fix/`, `docs/`, `perf/`, `test/`, `chore/`, `refactor/`.

### 3. Build

Follow the code-style guidance in [`AGENTS.md`](./AGENTS.md) §A.3:

- ESM only (`.mjs`); no CommonJS.
- Zero npm dependencies; Node standard library only. If a third-party module starts looking necessary, surface that as a design discussion before adding.
- One responsibility per script. `build-brain.mjs` does not consolidate; `consolidate.mjs` does not build.
- Library modules in `core/scripts/lib/` are pure; entrypoints handle I/O and CLI argument parsing.
- Comment density matches the surrounding file.
- No new abstractions without evidence. Name the failure mode the abstraction addresses.

Run the unit tests before opening a PR:

```
node --test core/__tests__/*.test.mjs
```

And the install integrity check:

```
node core/scripts/verify.mjs
```

If your contribution adds a new entrypoint, hook, library module, or behavioural invariant, add a corresponding test in `core/__tests__/`.

For new platform adapters, the per-prompt shim must replicate the sanitisation and untrusted-content-fence discipline in `platforms/claude/hooks/prompt-brief.mjs`. The threat-model details are in [`SECURITY.md`](./SECURITY.md).

### 4. Commit

Write clear, descriptive commit messages. The format is your choice; what matters is that someone reading `git log` in six months understands what changed and why.

A reasonable default is:

```
<area>: <one-line summary in present tense>

<optional longer body explaining why the change was made; the
code already shows what it does>
```

Examples:

- `journal: case-insensitive path comparison on Windows`
- `prompt-brief: invalidate cache when synganglion size changes`
- `docs: clarify the dragline restore order in concepts.md §2.2`
- `test: cover the no-master cascade-propagation path`

Use your real email address in commit metadata, or a stable pseudonymous address you control. The address may be referenced in `CONTRIBUTORS.md` and in release notes; see [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) for the removal policy.

### 5. Accept the CLA

The core engine is licensed under the Business Source License 1.1 (see [`LICENSE.md`](./LICENSE.md)). Platform adapters under `platforms/` are intended to be licensed under the Apache License, Version 2.0. To contribute to either part of the project, you must agree to the terms of the Contributor License Agreement (see [`CLA.md`](./CLA.md)).

Acceptance is performed inline in your PR. Add the following block at the end of your PR description, with the placeholders replaced:

```
I have read and agree to the terms of the Contributor License Agreement
(CLA.md) governing this contribution.

Contribution submitted on behalf of: myself
Signed: <Full Name> <<email-used-in-commits>>
Date: <YYYY-MM-DD>
```

If you are contributing on behalf of an organisation (employer, client, university, or other entity), use this form instead:

```
I have read and agree to the terms of the Contributor License Agreement
(CLA.md) governing this contribution, and I represent that I am authorised
to submit this contribution on behalf of the organisation named below.

Contribution submitted on behalf of: <Organisation Legal Name>
Signed: <Full Name> <<email-used-in-commits>>, authorised representative
of <Organisation Legal Name>
Date: <YYYY-MM-DD>
```

In addition, by submitting a PR you certify the [Developer Certificate of Origin, version 1.1](https://developercertificate.org/): the contribution is your original work (or you have the right to submit work that is not your own under the applicable open-source licenses), and the contribution may be redistributed under this project's licenses.

If your CLA acceptance block is missing from your PR description, the maintainer will request it before review begins. PRs without a valid CLA acceptance cannot be merged.

### 6. Open the PR

PR title format: `<area>: <one-line summary>`, mirroring the commit-message convention.

Your PR description should include:

- A clear statement of what changed and why.
- A reference to the related issue, if any (`Closes #<n>` for issue closure).
- For Tier 1 and Tier 2 challenges: a brief mapping from `CHALLENGES.md` acceptance criteria to how each is met in your PR.
- The CLA acceptance block from step 5.

Mark the PR as draft if it is not yet ready for review.

### 7. Review

The maintainer reviews PRs in roughly first-in-first-out order. There is no priority queue (see `GOVERNANCE.md`).

Reasonable expectations:

- Initial acknowledgement within 14 calendar days.
- Substantive review within 30 calendar days for most contributions.
- For Tier 1 challenges (significant adapters or core changes), allow longer; these are 4 to 8 hours of careful review and may take multiple rounds.

If your PR has been waiting more than 30 days without acknowledgement, leave a polite comment on the thread asking for status. We will respond with either a review, an honest timeline, or (rarely) a decision to decline with reasoning.

If your PR is declined, the reasoning is documented in the review thread. You are welcome to revise and resubmit. You are also welcome to fork the project and develop the change independently under the BUSL terms.

## Code review standards

- Reviewers will assume good intent. A first-pass review may include questions and suggestions; these are not rejections.
- The maintainer makes the final call on merge or decline (per `GOVERNANCE.md`) and documents the reasoning. If you disagree with the call, continued discussion is welcome; forking is also legitimate.
- The project's standing claim of honesty is enforced on contributions. Numbers need receipts. Claims need explicit qualifiers (`[measured]`, `[modelled]`, `[estimated]`). New abstractions need named failure modes they fix.

## After merge

- Your name is added to [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) in chronological order, with your consent on how it is displayed.
- For Tier-1 first-of-kind adapter authors: you additionally retain first-author byline on the adapter's README, per `CHALLENGES.md` "Recognition." This byline is preserved unless and until a fundamental rewrite is merged, at which point you are credited as the original author alongside the rewriter.
- For benchmark contributions: your row in `docs/benchmarks.md` carries your byline.
- For screenshot, image, and recording contributions: alt-text or image caption carries your byline.

If you ever wish your name removed from any of these credit lines, see [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) "Removal." No justification is required.

## License of contributions

- Contributions to `core/` are accepted under the terms of [`CLA.md`](./CLA.md) and become part of a BUSL-1.1-licensed work, automatically converting to Apache 2.0 four years after the public release date (the Change Date in `LICENSE.md`).
- Contributions to `platforms/` (adapters) are accepted under Apache 2.0 as documented in `platforms/README.md`. The CLA still applies; the redistribution license differs.
- Documentation contributions are accepted under the same license as the document they amend. Most documentation in this repository is under the project's standard licensing; the document header indicates the applicable terms.

## Security and sensitive disclosures

Do not open a public issue or PR for a security vulnerability. The private disclosure flow is in [`SECURITY.md`](./SECURITY.md).

## Code of conduct

Participation in any project space is conditioned on the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Reports of violations go to `contact@perform.digital` with `[CONDUCT]` in the subject line.

## Questions

- General contribution questions: comment on the issue you opened, or open a new issue with the `question` label.
- Licensing or commercial questions: `contact@perform.digital`.
- Security: `security@perform.digital` (see `SECURITY.md`).

Thank you again. The brain gets sharper every time a contributor brings honest data, careful code, or a fresh perspective.
