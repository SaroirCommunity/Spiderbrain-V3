#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// consolidate.mjs - the single-writer consolidation step ("sleep").
//
//   node consolidate.mjs --brain "<dir>" [--deploy "<label>"]
//
// Run at deploy. (1) Anchors a dragline. (2) Rebuilds the graph from the
// filesystem, regenerating every view. (3) Folds the cephalothorax session
// journals into the permanent movemap.md. (4) Clears the journals. Short-term
// memory consolidated into long-term, then the desk wiped clean.

import { join, resolve, relative } from 'node:path';
import { readdirSync, readFileSync, appendFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadCurated, rebuild } from './lib/brain.mjs';
import { anchorDragline } from './lib/dragline.mjs';
import { clusterOf } from './lib/graph.mjs';
import { toPosix } from './lib/scan.mjs';
import { parseArgs, ensureDir } from './lib/io.mjs';

function main() {
  const args = parseArgs(process.argv.slice(2));
  const brainDir = resolve(args.brain || process.cwd());

  const { config, overrides, notes } = loadCurated(brainDir);
  for (const n of notes) console.error('  ⚠ ' + n);
  if (!config) {
    console.error('No spiderbrain at ' + brainDir + ' - run build-brain first.');
    process.exit(1);
  }
  const projectDir = resolve(config.project);
  const cephDir = join(brainDir, 'cephalothorax');
  ensureDir(cephDir);

  // 1. read the session journals the hook has been appending to
  let journals = [];
  try {
    journals = readdirSync(cephDir)
      .filter((f) => f.startsWith('SESSION-') && f.endsWith('.jsonl'));
  } catch { /* no cephalothorax */ }
  const entries = [];
  for (const j of journals) {
    let text = '';
    try { text = readFileSync(join(cephDir, j), 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try { const e = JSON.parse(t); if (e && e.file) entries.push(e); }
      catch { /* torn last line */ }
    }
  }

  // 2. dragline + rebuild (single writer of the graph and views)
  anchorDragline(brainDir);
  const graph = rebuild(brainDir, config, overrides);

  // 3. fold the journal into movemap.md, grouped by cluster
  if (entries.length) {
    const byCluster = {};
    for (const e of entries) {
      let rel = e.file;
      try {
        const r = toPosix(relative(projectDir, e.file));
        if (r && !r.startsWith('..')) rel = r;
      } catch { /* keep raw */ }
      const cl = graph.nodes[rel]
        ? graph.nodes[rel].cluster
        : clusterOf(rel, config.clusterRules);
      (byCluster[cl] ||= {});
      byCluster[cl][rel] = (byCluster[cl][rel] || 0) + 1;
    }
    const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const label = typeof args.deploy === 'string' ? args.deploy : 'session consolidate';
    const fileCount = Object.values(byCluster)
      .reduce((acc, files) => acc + Object.keys(files).length, 0);
    let block = `\n## ${when} - ${label}\n\n` +
      `${fileCount} file(s) touched across ` +
      `${Object.keys(byCluster).length} cluster(s).\n\n`;
    for (const [cl, files] of Object.entries(byCluster).sort()) {
      const list = Object.entries(files)
        .sort((a, b) => b[1] - a[1])
        .map(([f, n]) => `\`${f}\`${n > 1 ? ' ×' + n : ''}`)
        .join(', ');
      block += `- **${cl}** (${Object.keys(files).length}) - ${list}\n`;
    }
    appendFileSync(join(brainDir, 'movemap.md'), block, 'utf8');
  }

  // 4. clear the journals - the desk is wiped
  for (const j of journals) {
    try { rmSync(join(cephDir, j)); } catch {}
  }

  console.log('consolidated: ' + entries.length + ' journal entr' +
    (entries.length === 1 ? 'y' : 'ies') + ', ' +
    journals.length + ' journal file(s) cleared.');
  console.log('graph rebuilt: ' + graph.stats.nodeCount + ' nodes, ' +
    graph.stats.edgeCount + ' synapses.');
  if (graph.warnings && graph.warnings.length) {
    console.log('⚠ ' + graph.warnings.length + ' warning(s) - see a build for detail.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (e) { console.error('consolidate failed: ' + e.message); process.exit(1); }
}
