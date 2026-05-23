#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// build-brain.mjs - turn a project directory into a spiderbrain.
//
//   node build-brain.mjs --project "<dir>" --brain "<dir>" [--prey "<goal>"]
//
// Re-runnable and safe. GENERATED files (synganglion.json, the views, every
// webmap.md) are always rewritten from the filesystem. CURATED files (config,
// overrides, SPIDERBRAIN.md, movemap.md, each cluster's rules/config/changelog)
// are written ONCE as stubs and never overwritten. Before the run, a dragline
// snapshots all curated files; a corrupt curated file is repaired from it, not
// demolished.

import { join, resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadCurated, rebuild } from './lib/brain.mjs';
import { anchorDragline } from './lib/dragline.mjs';
import {
  parseArgs, writeJson, writeJsonAtomic, writeIfAbsent, ensureDir, existsSync,
} from './lib/io.mjs';

const DEFAULT_IGNORE = [
  'node_modules', '.git', '.next', '.nuxt', '.svelte-kit', 'out', 'dist',
  'build', '.wrangler', '.claude', '.cache', '.turbo', 'coverage', 'vendor',
  '.vercel', '.idea', '.vscode',
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
];

function defaultConfig(projectDir, prey) {
  const rules = [];
  try {
    for (const e of readdirSync(projectDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (DEFAULT_IGNORE.includes(e.name) || e.name.startsWith('.')) continue;
      rules.push({ cluster: e.name, patterns: [e.name] });
    }
  } catch { /* unreadable root - caller errors out */ }
  rules.push({ cluster: 'shell', patterns: ['**'] });
  return {
    spiderbrain: 1,
    prey: prey || '(unset - describe the single goal of this project here)',
    project: projectDir,
    displayK: 8,
    webscoreScale: [0, 10],
    rings: [8.5, 7, 5, 3],
    ignore: DEFAULT_IGNORE,
    collapseDirs: [],
    extraEdges: [],
    clusterRules: rules,
    clusterTitles: {},
    clusterWebscores: {},
  };
}

const today = () => new Date().toISOString().slice(0, 10);

const changelogStub = (name) =>
  `# ${name} - changelog\n\n` +
  `Curated and append-only, newest entry first. A \`spiderbrain\` rebuild ` +
  `never touches this file - it is long-term memory.\n\n` +
  `Each entry is a \`###\` heading \`YYYY-MM-DD - title\`, then bullets for ` +
  `**what changed** and, above all, **why**.\n\n` +
  `### ${today()} - brain initialised\n` +
  `- Spiderbrain indexed the \`${name}\` cluster for the first time.\n`;

const rulesStub = (name) =>
  `# ${name} - rules\n\nCurated. Conventions and invariants for the ` +
  `**${name}** cluster. A rebuild never touches this file.\n\n` +
  `## Invariants\n- _What must always be true for this cluster._\n\n` +
  `## Conventions\n- _How code in this cluster is written._\n\n` +
  `## Gotchas\n- _Traps; things that have bitten before._\n`;

const configStub = (name) =>
  `# ${name} - config\n\nCurated. Configuration facts for the **${name}** ` +
  `cluster - env vars, bindings, build flags, external services. A rebuild ` +
  `never touches this file.\n\n` +
  `## Settings\n- _Key configuration values and where they live._\n\n` +
  `## External dependencies\n- _Services, APIs, secrets this cluster needs._\n`;

const spiderbrainStub = (graph) =>
  `# SPIDERBRAIN\n\nThe externalised memory of this project - a cure for ` +
  `project Alzheimer's.\n\n**Prey:** ${graph.prey}\n\n` +
  `## How to read this brain\n\n` +
  `- \`synganglion.json\` - the master graph (generated, never hand-edit).\n` +
  `- \`spideyorder.md\` - every node by webscore. \`spideymove.md\` - by recency.\n` +
  `- \`<cluster>/webmap.md\` - each feature's content map (generated).\n` +
  `- \`<cluster>/{rules,config,changelog}.md\` - curated memory you own.\n` +
  `- \`movemap.md\` - the permanent deploy log. \`.dragline/\` - curated backups.\n\n` +
  `## Upkeep\n\nRun \`molt.mjs\` to audit drift, \`cascade.mjs --inject\` to ` +
  `test a fault, \`consolidate.mjs\` at deploy. See the \`spiderbrain\` ` +
  `skill's \`reference/upkeep-protocol.md\`.\n`;

const movemapStub = () =>
  `# movemap - the permanent deploy log\n\nLong-term memory. Every ` +
  `consolidation (run at deploy) appends one block here. \`consolidate.mjs\` ` +
  `is the only writer; nothing here is ever rewritten or deleted.\n\n---\n`;

const cephalothoraxReadme = () =>
  `# cephalothorax - the session working set\n\nVolatile. The \`PostToolUse\` ` +
  `hook appends one JSONL line here per edited file (\`SESSION-*.jsonl\`). ` +
  `\`consolidate.mjs\` folds these into \`movemap.md\` and clears them.\n`;

// Scaffolded on first build. Written once via writeIfAbsent so a user who
// hand-edits this file keeps their changes through later rebuilds.
//
// What it excludes by default:
//   - cephalothorax SESSION-*.jsonl (volatile; wiped on every consolidate).
//   - .dragline/ (local snapshots for curated-state recovery; regenerate on
//     the next build, and committing them just bloats history).
//   - quarantine + tmp leftovers from corruption recovery and atomic writes.
//
// What it intentionally does NOT exclude:
//   - synganglion.json and the rendered views (spideyorder.md, spideymove.md,
//     each cluster's webmap.md). They are GENERATED, but committing them
//     lets reviewers see "what the brain thought today" without rebuilding.
//   - the CURATED files (spiderbrain.config.json, webscore-overrides.json,
//     SPIDERBRAIN.md, movemap.md, and each cluster's rules/config/changelog).
//     These are long-term memory; they belong in version control.
const gitignoreStub = () =>
  `# spiderbrain .gitignore\n` +
  `# Scaffolded by build-brain.mjs (written once; customise freely).\n` +
  `#\n` +
  `# Excluded by default - volatile, regeneratable, or local-only:\n` +
  `cephalothorax/SESSION-*.jsonl\n` +
  `.dragline/\n` +
  `*.fouled-*\n` +
  `*.tmp\n` +
  `\n` +
  `# Intentionally NOT excluded:\n` +
  `#   synganglion.json and the rendered views (spideyorder.md,\n` +
  `#   spideymove.md, <cluster>/webmap.md) are generated, but committing\n` +
  `#   them lets reviewers see "what the brain thought today" without a\n` +
  `#   rebuild. The curated files (config, overrides, SPIDERBRAIN.md,\n` +
  `#   movemap.md, each cluster's rules/config/changelog) are long-term\n` +
  `#   memory and belong in version control.\n`;

function main() {
  const args = parseArgs(process.argv.slice(2));
  const brainDir = resolve(args.brain || process.cwd());
  ensureDir(brainDir);
  const configPath = join(brainDir, 'spiderbrain.config.json');

  // Load curated state - repairs a corrupt config/overrides from the dragline;
  // throws (caught below) if the config is corrupt and unrepairable.
  let { config, overrides, notes } = loadCurated(brainDir);
  for (const n of notes) console.error('  ⚠ ' + n);

  // Compute every config mutation IN-MEMORY first, then write once. The
  // earlier code wrote spiderbrain.config.json up to three times in
  // succession (first-run, --prey, --project), each a non-atomic truncate-
  // then-rewrite; a crash mid-sequence could leave a half-written config
  // with no dragline yet anchored to recover from.
  const isFirstRun = !config;
  let configDirty = false;
  if (isFirstRun) {
    if (!args.project) {
      console.error('First build needs --project "<dir>"  (and ideally --prey "<goal>").');
      process.exit(1);
    }
    config = defaultConfig(resolve(args.project), args.prey);
    configDirty = true;
  }
  if (args.prey)    { config.prey    = args.prey;             configDirty = true; }
  if (args.project) { config.project = resolve(args.project); configDirty = true; }

  // Anchor the dragline BEFORE any curated write. If a write crashes we have
  // a snapshot to climb back to. On a true first-run nothing exists to
  // snapshot - the call is a cheap no-op then.
  const drag = anchorDragline(brainDir);

  // ONE atomic write of the (possibly mutated) config.
  if (configDirty) {
    writeJsonAtomic(configPath, config);
    if (isFirstRun) {
      console.log('Created ' + configPath + '  - review its clusterRules + prey.');
    }
  }

  writeIfAbsent(join(brainDir, 'webscore-overrides.json'), '{}\n');

  // Scaffold cluster dirs + curated stubs (written once; never overwritten).
  const clusterNames = [...new Set((config.clusterRules || []).map((r) => r.cluster))];
  for (const name of clusterNames) {
    const dir = join(brainDir, name);
    ensureDir(dir);
    writeIfAbsent(join(dir, 'changelog.md'), changelogStub(name));
    writeIfAbsent(join(dir, 'rules.md'), rulesStub(name));
    writeIfAbsent(join(dir, 'config.md'), configStub(name));
  }
  writeIfAbsent(join(brainDir, 'movemap.md'), movemapStub());
  writeIfAbsent(join(brainDir, '.gitignore'), gitignoreStub());
  ensureDir(join(brainDir, 'cephalothorax'));
  writeIfAbsent(join(brainDir, 'cephalothorax', 'README.md'), cephalothoraxReadme());

  // Derive the graph and rewrite every generated view.
  const graph = rebuild(brainDir, config, overrides);
  writeIfAbsent(join(brainDir, 'SPIDERBRAIN.md'), spiderbrainStub(graph));

  // Summary.
  console.log('\n  spiderbrain built  →  ' + brainDir);
  console.log('  prey: ' + graph.prey);
  console.log('  ' + graph.stats.nodeCount + ' nodes, ' +
    graph.stats.edgeCount + ' synapses, ' + graph.stats.clusterCount +
    ' clusters, ' + graph.stats.cellCount + ' polar cells');
  if (drag) console.log('  dragline anchored → ' + drag);
  console.log('');
  const rows = Object.entries(graph.clusters)
    .sort((a, b) => b[1].webscore - a[1].webscore);
  for (const [name, c] of rows) {
    console.log('  ' + String(c.webscore).padStart(5) + '  ' +
      name.padEnd(12) + ' ' + String(c.nodeCount).padStart(4) + ' nodes');
  }
  if (graph.warnings && graph.warnings.length) {
    console.log('\n  ⚠ ' + graph.warnings.length + ' warning(s):');
    for (const w of graph.warnings) console.log('    - ' + w);
  }
  console.log('');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (e) { console.error('\nbuild-brain failed: ' + e.message + '\n'); process.exit(1); }
}
