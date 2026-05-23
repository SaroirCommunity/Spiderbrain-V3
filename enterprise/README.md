<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# enterprise

This folder describes the commercial / hosted offerings built on top of the open `core/` brain. Everything described here goes **beyond** what the open-source v3 ships - that's the line.

The open core (`core/`) is everything you need to run a local, single-project brain forever, on your own machine, at no cost (subject to the license terms in the root `LICENSE` and `COMMERCIAL.md` - see those documents for binding terms; this README is descriptive only).

The enterprise offerings exist for teams that need scale, automation, multi-tenant operation, or premium tuning that the open core deliberately doesn't include.

> **Important.** This README *describes* what's available commercially. It is not a licensing document. For binding terms - who can use what, when, for what fee - see the root `LICENSE`, `COMMERCIAL.md`, and `BRANDING.md` once published.

## Offerings

### 1. Hosted optimiser

The closed feedback loop documented in [`core/concepts.md` §6](../core/concepts.md#6-optimisation-engine--manual-in-v3--commercial-automated), run as a managed service. Watches your brain over time and re-tunes:

- `webscore` overrides as the project shifts.
- `masterMassMin` and `rings` thresholds as the graph grows.
- Cluster boundaries when cross-cluster edges dominate.
- Display K per cluster.

Includes a human-approval gate by default. Re-tuning produces a config diff that ships back to your brain.

### 2. Analytics dashboards

Push-mode telemetry from [`core/concepts.md` §7](../core/concepts.md#7-telemetry--shipped-read-mode--commercial-push-mode) into a hosted dashboard:

- Per-cluster activity over time.
- Drift trending - which clusters are shifting fastest.
- Wrong-fix events and the brain rules that caught (or missed) them.
- Token / cost / wall-clock trends per agent, per project, per team.
- Master churn - how often masters move.

### 3. Enterprise tuning

Premium [heuristics](../core/concepts.md#5-heuristics--shipped--commercial-premium-packs) and [scoring](../core/concepts.md#8-scoring--shipped--commercial-premium-packs) packs tuned for common production stacks:

- Next.js + tRPC + Prisma
- Cloudflare Workers + D1
- NestJS + Postgres
- Django + Celery
- Rails 7
- FastAPI + SQLAlchemy
- Spring Boot
- (others on request)

Drop-in `spiderbrain.config.json` presets that ship with calibrated formulas and cluster definitions for the stack. No manual calibration needed.

### 4. Auto-routing infrastructure

The routing layer from [`core/concepts.md` §3](../core/concepts.md#3-routing--partial--planned-v4--commercial), shipped as a proxy / sidecar that sits between your agent and your model providers:

- Reads brain signals on every request.
- Routes by blast radius, master proximity, cluster mass.
- Self-tunes routing rules from observed outcomes.
- Supports multi-provider failover.
- Reports cost & correctness per route in the dashboard.

### 5. Premium heuristics

Curated tuning packs the open core doesn't ship:

- Domain-specific cascade-stop policies.
- Pre-calibrated `webscoreAuto` formulas.
- Cluster auto-assignment for common monorepo layouts.
- Drift-detection thresholds calibrated per stack.

### 6. Multi-agent orchestration

Managed orchestration of multi-agent workflows (see [`core/concepts.md` §4](../core/concepts.md#4-orchestration--partial--planned-v4--commercial)):

- Topologically order a multi-cluster change.
- Fan sub-tasks out to multiple agents with the right cluster context each.
- Re-stitch results, run cross-cluster validation.
- Roll back on cascade failure.

### 7. Support SLAs

Commercial support, response-time SLAs, escalation paths, and named engineering contacts. The open `core/` is community-supported; enterprise customers get direct response.

### 8. Inference orchestration

Multi-provider inference layer with:

- Brain-driven model selection.
- Adaptive caching keyed on brain query signatures.
- Cost / latency / correctness optimisation per query.
- Compliance & audit logs.

## Status

These offerings are at varying stages of maturity. Some are productionised today; others are roadmap. Contact Perform Digital Private Limited for current availability and procurement.

## How this differs from the open core

| | Open `core/` | Enterprise |
|---|---|---|
| Brain build & maintenance | yes | yes |
| Hooks & journal | yes | yes |
| Manual heuristic tuning | yes | yes |
| Automated tuning loop | no (manual) | **yes (managed)** |
| Multi-project, multi-tenant | no | **yes** |
| Dashboards | no (local files only) | **yes (hosted)** |
| Premium heuristic packs | no | **yes** |
| Auto-routing infrastructure | no (signals only) | **yes** |
| Multi-agent orchestration | no (manual) | **yes** |
| Support SLAs | community | **commercial** |

## See also

- Root `LICENSE` and `COMMERCIAL.md` for binding licensing terms.
- `BRANDING.md` for naming and trademark guidance.
- [`benchmarks/`](../benchmarks/) for reproducibility methodology.
