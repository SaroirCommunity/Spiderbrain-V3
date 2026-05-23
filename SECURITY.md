<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# Security policy

How to report a vulnerability in spiderbrain, what is in scope, what is out of scope, and how we respond.

## Supported versions

| Version | Supported |
|---|:--:|
| v3.x (current) | yes |
| v4 (gated, in development) | not yet |
| anything pre-v3 | no |

Security fixes ship as patch releases against v3 until v4 is generally available.

## Reporting a vulnerability

Email **security@perform.digital** with:

- A clear description of the issue.
- Steps to reproduce, ideally with a minimal example or a fixture project.
- The version or commit you observed it on (`git rev-parse HEAD` if you cloned).
- Your assessment of severity, if you have one.

**Do not file a public GitHub issue for security reports.** Public disclosure of an unpatched vulnerability is the most expensive failure mode for both the project and your fellow users.

If `security@perform.digital` bounces or you do not get an acknowledgement, email `contact@perform.digital` with `[SECURITY]` in the subject line.

PGP / age public keys are not yet published. If you need encrypted communication, ask for the current public key in your first message and we will respond.

## Response cadence

| Phase | Target |
|---|---|
| Acknowledgement of the report | within 5 business days |
| Initial triage and severity assessment | within 14 business days |
| Patch released or mitigation documented | before the standard 90-day disclosure window |

If we cannot meet a target, we say so in the thread and propose a revised timeline.

## What is in scope

The spiderbrain core engine and the shipped Claude adapter:

- `core/scripts/**/*.mjs` (the entrypoints and lib modules).
- `platforms/claude/hooks/*.mjs` (the three always-on hooks).
- The data lifecycle: what gets written where, who can write it, what gets read into agent context.
- The dragline / quarantine / restore path.
- The cluster, master, and cascade primitives where they affect agent decisions.

## What is out of scope

- Vulnerabilities in Node.js itself (report to nodejs.org).
- Vulnerabilities in platforms spiderbrain integrates with (Claude Code, OpenAI, Cursor, etc.) - report to those vendors directly.
- Issues that require local write access to the brain folder already: a local attacker who can write to `~/.claude/skills/spiderbrain/` can do worse things to the host directly.
- Reports based purely on theoretical attacks against the BUSL terms or commercial-license boundary.
- Community-built adapters that have not yet landed in `platforms/`. Adapter contributors are responsible for replicating the security discipline of `platforms/claude/hooks/`; the project does not warrant adapters it has not reviewed.

## Trust model

Spiderbrain operates as a deliberate untrusted-project to agent-context pipeline. The trust boundaries matter.

| Boundary | Stance |
|---|---|
| The brain folder | **Trusted.** You control the path; you control who can write to it. The brain may contain hashed source content, full SQL schemas, and recent edit history. Treat it like build output: keep it under your control. |
| The project being scanned | **Untrusted.** File contents, file names, SQL column DEFAULTs, the prey string - all may originate from any source. The scanner reads them; the prompt-brief surfaces them; all paths through this pipeline must sanitise. |
| Hooks | **Gateway.** All three fail closed (exit 0 silently on every error path). A broken hook never blocks an edit and never blocks a session. A compromised hook source is a separate threat - keep hook code under change review. |
| Agent context | **Downstream of the brain.** Anything emitted via `additionalContext` is text the model treats as instructions until told otherwise. The `<spiderbrain-untrusted-content>` fence pattern documents the trust boundary for the agent. |

When building a new adapter (see [`CHALLENGES.md`](./CHALLENGES.md)), the per-prompt shim **must** replicate the `prompt-brief.mjs` sanitisation + fence discipline. Failing to do so re-opens the project-context-injection vector for that platform.

## Threat surface and current mitigations

| Threat | Status in v3 |
|---|---|
| Prompt injection via SQL `DEFAULT`, file paths, prey, role strings flowing into `additionalContext` | **Mitigated in `prompt-brief.mjs`** (control-char strip, length cap, untrusted-content fence). **Not yet mitigated in `session-brief.mjs` or `consolidate.mjs::movemap.md`** - fix planned in next patch release. |
| Path traversal via tool-call file paths into the journal | **Mitigated.** Segment-aware containment in `journal.mjs` (`norm === root \|\| norm.startsWith(root + '/')`). |
| Sibling-prefix attack (`/foo/project-brain-backup` matching `/foo/project-brain`) | **Mitigated** by the segment-aware check above. |
| Symlink escape from scan or dragline | **Mitigated.** Explicit `isSymbolicLink()` skip in `scan.mjs::walk` and `dragline.mjs::curatedFiles`. |
| Silent curated-data corruption on crash | **Mitigated.** `writeJsonAtomic` (tmp + fsync + rename) for curated writes; dragline snapshot before every consolidation; quarantine + restore on read. |
| Hook starvation or DoS via large prompt | **Mitigated in `prompt-brief.mjs`.** 80 ms in-script time budget, 600 ms stdin timeout, 8 000-char prompt cap. |
| Windows case-sensitivity in path comparison | **Known gap.** `journal.mjs::inOrUnder` is byte-comparison; `C:` vs `c:` on Windows can defeat both the brain-self skip and the project-containment gate. Fix planned in next patch release. |
| Brain folder accidentally committed to a project repo | **Documentation only today.** Recommended `.gitignore` entries: `cephalothorax/`, `synganglion.json`, `*.fouled-*`. A scaffolded `.gitignore` in the brain folder is planned. |
| Saroir-style cross-database boundary enforcement | **Documentation only.** The cluster `rules.md` files carry the invariants; the cascade engine does not enforce them programmatically yet. |

## Recognition

Security researchers who report a valid vulnerability following this policy will be credited in:

- The patch release notes that fix the issue (with your consent on naming).
- A `SECURITY-HALL-OF-FAME.md` section, once we have more than one reporter (until then, you will be the first).
- A line in `CONTRIBUTORS.md`.

If you request anonymity in the report, we honour it across all three.

## Out-of-band

- **Primary contact:** `security@perform.digital`
- **Backup:** `contact@perform.digital` (use `[SECURITY]` in the subject line)
- **Public-key encrypted communication:** not yet published; ask in your first message.

If the vulnerability you found is in a community-contributed adapter that has not yet landed in `platforms/`, please CC the adapter's first-author byline if it is published. We will help coordinate.
