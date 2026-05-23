<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# The webscore rubric

A **webscore** is a decimal `0.0–10.0` answering one question:

> If this node were silently corrupted, how much of the **user experience**
> would break - weighted toward the **prey** (the project's goal)?

This is a **devil's-advocate** measure. Do not score what a file *is*; score
what its *failure* costs. When unsure, imagine the file deleted at 2am on the
busiest day and ask how many users notice.

## The bands

| Band | Meaning | A file scores here when… |
|---|---|---|
| **9.0–10.0** | Catastrophic | the whole site/app, or all dynamic features, fail. Request entrypoints, the root layout, the DB schema, deploy config. |
| **7.0–8.9** | Severe | a primary revenue/prey path breaks, or a global surface (nav, footer, the main conversion flow) breaks. |
| **5.0–6.9** | Major | one whole feature is down, but the rest of the site is fine. |
| **3.0–4.9** | Contained | one page or one secondary component degrades. Most leaf components. |
| **1.0–2.9** | Minor | cosmetic, or a dev-only tool not in the runtime path. |
| **0.0–0.9** | Inert | dead, parked, or unreferenced code. Failure changes nothing. |

Use the decimal. `8.4` and `8.0` carry real ordering information - that is how
a webmap picks which leg is the strongest.

## Two scopes: node vs cluster

- **Node webscore** - one file or field. Lives in `webscore-overrides.json`.
- **Cluster webscore** - a whole feature's importance to the project. Lives in
  `config.clusterWebscores`. A blog might be `4.0` even though the company site
  it lives in is critical - the company does many things and the blog is one of
  them. Score the *feature among features*, not the file among files.

## webscore vs webscoreAuto

`build-brain.mjs` computes `webscoreAuto` from the import graph - essentially
fan-in depth. It is honest but **blind to runtime importance**: a Worker
entrypoint, an HTTP handler, or a CLI's `main` has almost no *import* fan-in,
yet failing it kills everything. The import scan literally cannot see a browser
`fetch()`.

So: trust `webscoreAuto` for **leaf and library files**. **Override** it for
anything load-bearing at runtime. A large gap between the two is not an error -
`molt.mjs` lists it as informational. The override is the judgement; the auto
is the sanity check.

## Worked examples (a Next.js + Cloudflare Worker site)

| Node | webscore | Reasoning |
|---|--:|---|
| `src/worker.js` | 9.9 | every request routes through it; failure = total outage |
| `src/db/schema.sql` | 9.7 | the shape every dynamic feature depends on |
| `app/layout.js` | 9.4 | wraps every page; failure breaks all rendering |
| `app/globals.css` | 9.2 | all styling; every page looks broken |
| `wrangler.jsonc` | 9.0 | wrong config = nothing deploys at all |
| `system-prompt.js` | 8.8 | the chatbot's whole brain; it drives the prey (leads) |
| `LeadModal.js` | 8.0 | the primary conversion surface - directly the prey |
| `blogs/content.js` | 7.0 | breaks the blog feature; rest of the site is fine |
| `blogs/[slug]/page.js` | 6.0 | breaks blog *posts* only |
| `Comments.js` | 4.0 | one secondary component on one feature |
| a single blog draft | ~2.5 | one page of many; collectively the feature still stands |
| `gen-logo.mjs` | 2.0 | dev tool; never in the runtime path |
| `_parked/Old.jsx` | 0.5 | not imported anywhere; failure changes nothing |

## How to run the judgement pass

1. `build-brain.mjs` first - it produces every node with a `webscoreAuto`.
2. Open `spideyorder.md` and read it top to bottom. For each node that is
   load-bearing at runtime, or whose auto score feels wrong, add an entry to
   `webscore-overrides.json`: either a bare number, or `{ "webscore": n,
   "role": "<one line>" }` (always add the role - it is the file's memory).
3. Re-run `build-brain.mjs`. The overrides apply; the views regenerate.
4. Run `molt.mjs`. Review the divergence list: every large gap should be a
   *deliberate* runtime-entrypoint call, not an oversight.

Scoring is not once-and-done. When a file's responsibility changes, re-judge
it - and write the reason in the cluster `changelog.md`.
