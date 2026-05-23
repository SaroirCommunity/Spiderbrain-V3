#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// verify.mjs - confirm the spiderbrain v3 install is intact.
//
// Run with:
//   node <SPIDERBRAIN_HOME>/core/scripts/verify.mjs
//
// Checks the Node version, that every expected entrypoint, lib module and
// hook file is present, and prints a clean PASS/FAIL table plus next-steps.
// Exits 0 on success, 1 on failure.

import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF       = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SELF);          // .../core/scripts
const CORE_DIR   = dirname(SCRIPT_DIR);    // .../core
const ROOT       = dirname(CORE_DIR);      // <SPIDERBRAIN_HOME>

const MIN_NODE_MAJOR = 18;

// rel path -> short label. Order = display order.
const REQUIRED = [
  ['core/SKILL.md',                              'skill spec'],
  ['core/README.md',                             'core overview'],
  ['core/scripts/build-brain.mjs',               'BUILD'],
  ['core/scripts/consolidate.mjs',               'MAINTAIN - consolidate'],
  ['core/scripts/cascade.mjs',                   'CASCADE'],
  ['core/scripts/query.mjs',                     'QUERY'],
  ['core/scripts/molt.mjs',                      'MAINTAIN - molt'],
  ['core/scripts/lib/scan.mjs',                  'scan + dependency extraction'],
  ['core/scripts/lib/graph.mjs',                 'graph + masters + amplitude'],
  ['core/scripts/lib/nervenet.mjs',              'cascade engine'],
  ['core/scripts/lib/dragline.mjs',              'dragline snapshot/restore'],
  ['core/scripts/lib/gittime.mjs',               'git-time recency'],
  ['core/scripts/lib/render.mjs',                'markdown renderer'],
  ['core/scripts/lib/io.mjs',                    'safe I/O helpers'],
  ['core/scripts/lib/brain.mjs',                 'brain loader / rebuilder'],
  ['platforms/claude/hooks/session-brief.mjs',   'Claude SessionStart hook'],
  ['platforms/claude/hooks/prompt-brief.mjs',    'Claude UserPromptSubmit hook'],
  ['platforms/claude/hooks/journal.mjs',         'Claude PostToolUse hook'],
];

let ok = true;
const lines = [];

lines.push('spiderbrain v3 verify');
lines.push('  root: ' + ROOT);
lines.push('');

// ---- Node version ----
const ver = process.versions.node;
const major = parseInt(ver.split('.')[0], 10);
if (Number.isFinite(major) && major >= MIN_NODE_MAJOR) {
  lines.push('  [PASS] Node ' + ver + ' (need >= ' + MIN_NODE_MAJOR + ')');
} else {
  lines.push('  [FAIL] Node ' + ver + ' - need >= ' + MIN_NODE_MAJOR);
  ok = false;
}

lines.push('');

// ---- file existence ----
const maxLen = Math.max(...REQUIRED.map(([p]) => p.length));
for (const [rel, label] of REQUIRED) {
  const abs = join(ROOT, rel);
  let present = false;
  let size = 0;
  try {
    if (existsSync(abs)) {
      const st = statSync(abs);
      present = st.isFile() && st.size > 0;
      size = st.size;
    }
  } catch { /* present stays false */ }
  if (present) {
    lines.push('  [PASS] ' + rel.padEnd(maxLen) + '  ' + label);
  } else {
    const why = size === 0 && existsSync(abs) ? ' - empty file' : ' - MISSING';
    lines.push('  [FAIL] ' + rel.padEnd(maxLen) + '  ' + label + why);
    ok = false;
  }
}

lines.push('');

if (ok) {
  lines.push('Install OK.');
  lines.push('');
  lines.push('Next steps:');
  lines.push('  1. Wire the 3 hooks in your project\'s .claude/settings.local.json');
  lines.push('     (see ' + join(ROOT, 'platforms/claude/README.md') + ')');
  lines.push('  2. Build a brain on your project:');
  lines.push('       node "' + join(ROOT, 'core/scripts/build-brain.mjs') + '" \\');
  lines.push('         --project "<abs path to your project>" \\');
  lines.push('         --brain   "<abs path for the brain folder>" \\');
  lines.push('         --prey    "<the single goal this project serves>"');
  lines.push('  3. Read the BUILD / MAINTAIN / QUERY / CASCADE modes:');
  lines.push('       ' + join(ROOT, 'core/SKILL.md'));
} else {
  lines.push('Install INCOMPLETE - one or more required files are missing or empty.');
  lines.push('Re-clone or re-copy the package and re-run this script.');
}

console.log(lines.join('\n'));
process.exit(ok ? 0 : 1);
