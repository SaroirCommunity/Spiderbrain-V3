<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# core/\_\_tests\_\_

Built-in Node test runner. No framework. Zero npm dependencies - runs anywhere Node ≥ 18 runs.

## Run all tests

From `<SPIDERBRAIN_HOME>`:

```
node --test core/__tests__/*.test.mjs
```

Or one file at a time:

```
node --test core/__tests__/scan.test.mjs
node --test core/__tests__/cascade.test.mjs
node --test core/__tests__/recovery.test.mjs
```

## What's covered

| File | Asserts |
|---|---|
| `scan.test.mjs` | Every fixture code file becomes a node. The `@/utils/helpers` tsconfig alias resolves. Commented-out imports do not create false edges. The SQL parser tolerates a missing trailing semicolon. nodeCount + edgeCount are stable on the fixture. |
| `cascade.test.mjs` | `cascade(graph, ids)` is deterministic across repeated calls. Reordering `badIds` yields the same aggregate signature. A master firebreak trips `hardStop` and blocks downstream propagation. No master ⇒ no hard stop and full propagation. |
| `recovery.test.mjs` | Corrupt `spiderbrain.config.json` without a dragline **throws** (refuses to overwrite) and quarantines the file. Corrupt config **with** a dragline is restored. A missing config is a clean first-run, not a corruption. Corrupt `webscore-overrides.json` warns but doesn't block the build. |

## The fixture project

`fixtures/tiny-project/` - 5 code files + 1 SQL file + tsconfig:

- `src/worker.js` imports `./db/queries.js` and `@/utils/helpers` (alias).
- `src/db/queries.js` is a leaf (no imports).
- `src/utils/helpers.js` has one real import (`./tiny-helper.js`) and three commented-out imports (one `/* */` block, one `//`, one inside a JSDoc-style block).
- `src/utils/tiny-helper.js` is a leaf.
- `src/handlers/auth.js` imports `../worker.js`.
- `src/db/schema.sql` declares `leads;` and `posts` (the latter intentionally missing its trailing `;`).

If you change the fixture, expect the stability test in `scan.test.mjs` to fail until you update the expected counts.

## What is *not* tested

- The build script's curated-write atomicity (Council recommendation #6 - a separate task).
- The hook contracts (smoke-tested manually in the docs; not yet in this harness).
- End-to-end build + molt + consolidate on a real project (covered by manual benchmarks in `docs/benchmarks.md`).
- Cross-platform path quirks (the tests run on Windows and POSIX but rely on `tmpdir()` cleanup).

## Adding a test

The bar:

- Pure-function unit tests for `lib/*.mjs` are welcome.
- Anything that requires the network, a real LLM, or a long-running process belongs in `docs/benchmarks.md`, not here.
- Tests must not depend on git history of the running checkout.
- Tests must clean up any temp directories they create.
