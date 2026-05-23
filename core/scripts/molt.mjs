#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// molt.mjs - the read-only drift audit.
//
//   node molt.mjs --brain "<dir>"
//
// A spider moults to shed an exoskeleton it has outgrown. The brain moults to
// surface indexing that no longer matches the code. This NEVER mutates the
// brain or the project - it rescans, diffs against the stored graph, and writes
// a report. It does not repair a corrupt config (that stays read-only); it
// reports it and stops.

import { join, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { computeGraph } from './lib/brain.mjs';
import { renderMolt } from './lib/render.mjs';
import { parseArgs, readJson, readJsonSafe, writeText } from './lib/io.mjs';

function main() {
  const args = parseArgs(process.argv.slice(2));
  const brainDir = resolve(args.brain || process.cwd());

  const stored = readJson(join(brainDir, 'synganglion.json'), null);
  if (!stored) {
    console.error('No synganglion.json at ' + brainDir + ' - build the brain first.');
    process.exit(1);
  }
  const cfg = readJsonSafe(join(brainDir, 'spiderbrain.config.json'));
  if (cfg.status !== 'ok') {
    console.error('spiderbrain.config.json is ' + cfg.status +
      (cfg.error ? ' (' + cfg.error + ')' : '') +
      ' - cannot audit. Run build-brain; it will repair it from the dragline.');
    process.exit(1);
  }
  const ov = readJsonSafe(join(brainDir, 'webscore-overrides.json'));
  const overrides = ov.status === 'ok' ? ov.data : {};

  let fresh;
  try {
    fresh = computeGraph(brainDir, cfg.data, overrides);
  } catch (e) {
    console.error('molt could not rescan the project: ' + e.message);
    process.exit(1);
  }

  const storedIds = new Set(Object.keys(stored.nodes));
  const freshIds = new Set(Object.keys(fresh.nodes));

  const orphanIds = [...storedIds].filter((id) => !freshIds.has(id)).sort();
  const unindexed = [...freshIds].filter((id) => !storedIds.has(id)).sort();
  const orphans = orphanIds.map((id) => ({
    id, blast: stored.nodes[id].blastRadius || 0,
  }));

  // probable renames - an orphan and an unindexed file sharing a basename
  const renames = [];
  for (const o of orphanIds) {
    const b = basename(o);
    const match = unindexed.find((u) => basename(u) === b);
    if (match) renames.push({ from: o, to: match });
  }

  // dangling - a stored edge whose endpoint no longer exists in reality
  const dangling = (stored.edges || [])
    .filter(([f, t]) => !freshIds.has(f) || !freshIds.has(t));

  // modified - common nodes whose content hash changed since the last build
  const modified = [];
  for (const id of storedIds) {
    if (!freshIds.has(id)) continue;
    const a = stored.nodes[id].contentHash;
    const b = fresh.nodes[id].contentHash;
    if (a && b && a !== b) modified.push({ id, from: a, to: b });
  }
  modified.sort((a, b) => a.id.localeCompare(b.id));

  // divergence - informational: a curated override far from the auto baseline
  const divergence = [];
  for (const [id, n] of Object.entries(stored.nodes)) {
    const d = Math.abs((n.webscore || 0) - (n.webscoreAuto || 0));
    if (d > 3.0) {
      divergence.push({
        id, webscore: n.webscore, webscoreAuto: n.webscoreAuto,
        delta: Math.round(d * 10) / 10,
      });
    }
  }
  divergence.sort((a, b) => b.delta - a.delta);

  const report = { orphans, unindexed, renames, dangling, modified, divergence };
  writeText(join(brainDir, 'molt-report.md'), renderMolt(fresh, report));

  const clean = orphans.length + unindexed.length + dangling.length === 0;
  console.log('\n  molt ' + (clean ? '✅ clean - the brain matches reality'
    : '⚠ drift found - see molt-report.md'));
  console.log('  orphan nodes (file gone)   : ' + orphans.length);
  console.log('  unindexed files (no node)  : ' + unindexed.length);
  console.log('  dangling edges             : ' + dangling.length);
  console.log('  modified since build       : ' + modified.length +
    '   probable renames: ' + renames.length +
    '   webscore divergence: ' + divergence.length);
  console.log('  report → ' + join(brainDir, 'molt-report.md') + '\n');
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (e) { console.error('molt failed: ' + e.message); process.exit(0); }
}
