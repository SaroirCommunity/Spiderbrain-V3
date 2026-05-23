/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// brain.mjs - the shared core: load curated state (corruption-safe), derive
// the graph, write the generated views. Behind build-brain / consolidate.
//
// computeGraph is pure (no writes). rebuild writes the generated views. Curated
// JSON is loaded through loadCuratedJson, which NEVER overwrites a corrupt file
// with defaults - it quarantines the corrupt file and climbs the dragline back
// to the last-good copy (findings #1, #2).

import { join, resolve } from 'node:path';
import { readFileSync as fsRead, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { scan, scanSql } from './scan.mjs';
import { buildGraph } from './graph.mjs';
import { renderSpideyorder, renderSpideymove, renderWebmap } from './render.mjs';
import { gitFileStats, gitDirTime, gitDirCommits, isGitRepo } from './gittime.mjs';
import { restoreFromDragline } from './dragline.mjs';
import {
  readJsonSafe, writeJson, writeText, ensureDir, existsSync,
} from './io.mjs';

/** The 3 most recent `### ` entries of a cluster changelog, for the webmap. */
export function changelogExcerpt(path) {
  let text = '';
  try { text = fsRead(path, 'utf8'); } catch { return ''; }
  return text.split(/^### /m).slice(1, 4).map((b) => '### ' + b.trimEnd()).join('\n\n');
}

/**
 * Load one curated JSON file. On corruption: quarantine it and restore the
 * last-good copy from the dragline. Never silently regenerates curated data.
 * @returns {{data, status:'ok'|'missing'|'repaired'|'unrepaired', fouled?, error?}}
 */
function loadCuratedJson(brainDir, rel, required) {
  const path = join(brainDir, rel);
  const r = readJsonSafe(path);
  if (r.status === 'ok') return { data: r.data, status: 'ok' };
  if (r.status === 'missing') return { data: null, status: 'missing' };

  // corrupt / unreadable - quarantine, then climb the dragline.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fouled = path + '.fouled-' + stamp;
  try { renameSync(path, fouled); } catch { /* leave it */ }
  if (restoreFromDragline(brainDir, rel)) {
    const again = readJsonSafe(path);
    if (again.status === 'ok') {
      return { data: again.data, status: 'repaired', fouled, error: r.error };
    }
  }
  if (required) {
    throw new Error(
      rel + ' is corrupt (' + r.error + ') and no dragline snapshot exists ' +
      'to restore it from. The broken file is preserved at ' + fouled +
      '. Fix the JSON by hand. Refusing to overwrite curated data with defaults.',
    );
  }
  return { data: null, status: 'unrepaired', fouled, error: r.error };
}

/**
 * Load config + overrides, repairing corruption from the dragline.
 * Returns { config|null, overrides, notes[] }. config is null only on a
 * genuine first run (file truly absent). Throws if config is corrupt and
 * unrepairable - the build must stop, not demolish.
 */
export function loadCurated(brainDir) {
  const notes = [];
  const cfg = loadCuratedJson(brainDir, 'spiderbrain.config.json', true);
  if (cfg.status === 'repaired') {
    notes.push('spiderbrain.config.json was CORRUPT (' + cfg.error + '). ' +
      'Quarantined to ' + cfg.fouled + ' and restored the last-good copy ' +
      'from the dragline.');
  }
  if (!cfg.data) return { config: null, overrides: {}, notes };

  const ov = loadCuratedJson(brainDir, 'webscore-overrides.json', false);
  let overrides = ov.data || {};
  if (ov.status === 'repaired') {
    notes.push('webscore-overrides.json was CORRUPT (' + ov.error + '). ' +
      'Quarantined to ' + ov.fouled + ' and restored from the dragline.');
  } else if (ov.status === 'unrepaired') {
    notes.push('webscore-overrides.json is CORRUPT (' + ov.error + ') and ' +
      'could not be repaired (no dragline). The broken file is at ' +
      ov.fouled + '. Building with NO overrides - fix it and rebuild.');
    overrides = {};
  }
  return { config: cfg.data, overrides, notes };
}

/** Derive the graph from the filesystem. Pure - writes nothing. */
export function computeGraph(brainDir, config, overrides) {
  const projectDir = resolve(config.project);
  if (!existsSync(projectDir)) {
    throw new Error('Project directory not found: ' + projectDir);
  }
  const scanResult = scan(projectDir, config);

  let db = { tables: new Map(), fks: [] };
  for (const [id, f] of scanResult.files) {
    if (f.kind !== 'sql') continue;
    try { db = scanSql(fsRead(join(projectDir, id), 'utf8'), id, db); } catch {}
  }

  // git commit times (recency) + commit counts (rhythm - the theta/gamma signal)
  const changeTimes = new Map();
  const commitCounts = new Map();
  if (isGitRepo(projectDir)) {
    const { times, counts } = gitFileStats(projectDir);
    for (const [rel, sec] of times) changeTimes.set(rel, sec);
    for (const [rel, n] of counts) commitCounts.set(rel, n);
    for (const [id, f] of scanResult.files) {
      if (f.kind === 'content') {
        const dir = id.replace(/\/$/, '');
        const t = gitDirTime(projectDir, dir);
        if (t) changeTimes.set(id, t);
        const cc = gitDirCommits(projectDir, dir);
        if (cc) commitCounts.set(id, cc);
      }
    }
  }

  // content-based sourceHash - a checkable "matches reality" claim (finding #4)
  const hashInput = [...scanResult.files.entries()]
    .map(([id, f]) => id + ':' + (f.contentHash || ''))
    .sort()
    .join('\n');
  const sourceHash = createHash('sha256').update(hashInput).digest('hex').slice(0, 12);

  return buildGraph(scanResult, db.tables.size ? db : null, config, overrides, {
    prey: config.prey,
    project: projectDir,
    sourceHash,
    generatedBy: 'spiderbrain',
    changeTimes,
    commitCounts,
  });
}

/** Derive the graph and rewrite every GENERATED file. The single graph writer. */
export function rebuild(brainDir, config, overrides) {
  const graph = computeGraph(brainDir, config, overrides);
  writeJson(join(brainDir, 'synganglion.json'), graph);
  writeText(join(brainDir, 'spideyorder.md'), renderSpideyorder(graph));
  writeText(join(brainDir, 'spideymove.md'), renderSpideymove(graph));
  for (const name of Object.keys(graph.clusters)) {
    const dir = join(brainDir, name);
    ensureDir(dir);
    writeText(join(dir, 'webmap.md'),
      renderWebmap(graph, name, changelogExcerpt(join(dir, 'changelog.md'))));
  }
  return graph;
}
