/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// dragline.mjs - the spider's safety line.
//
// A spider never moves without paying out a dragline anchored behind it: if it
// falls, the line arrests it; if it is lost, the line leads home. Before any
// operation that could touch curated files, the brain anchors a dragline - a
// timestamped snapshot of every curated file. If a curated file is later found
// corrupt, the brain climbs the dragline back to the last good copy instead of
// demolishing and rebuilding. The dragline is also the brain's only backup.

import { readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ensureDir, existsSync } from './io.mjs';

const KEEP = 10;

/** The curated files (relative to the brain root) - the precious layer. */
function curatedFiles(brainDir) {
  const out = [];
  const add = (p) => { if (existsSync(join(brainDir, p))) out.push(p); };
  add('spiderbrain.config.json');
  add('webscore-overrides.json');
  add('SPIDERBRAIN.md');
  add('movemap.md');
  let dirs = [];
  try {
    dirs = readdirSync(brainDir, { withFileTypes: true })
      // Refuse symlinks explicitly. readdirSync populates Dirent via lstat,
      // so a symlinked-in directory has isDirectory()===false and is already
      // skipped - but we say it out loud so a refactor can't regress. The
      // dragline must only ever snapshot real curated state inside the brain.
      .filter((d) => d.isDirectory()
                  && !(d.isSymbolicLink && d.isSymbolicLink())
                  && !d.name.startsWith('.')
                  && d.name !== 'cephalothorax')
      .map((d) => d.name);
  } catch { /* no clusters yet */ }
  for (const d of dirs) {
    for (const f of ['rules.md', 'config.md', 'changelog.md', 'fields.md']) {
      add(d + '/' + f);
    }
  }
  return out;
}

function snapshots(brainDir) {
  try {
    return readdirSync(join(brainDir, '.dragline'))
      .filter((n) => !n.startsWith('.'))
      .sort();
  } catch {
    return [];
  }
}

/** Snapshot every curated file. Returns the snapshot dir, or null if nothing to save. */
export function anchorDragline(brainDir) {
  const files = curatedFiles(brainDir);
  if (!files.length) return null;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = join(brainDir, '.dragline', ts);
  for (const rel of files) {
    const dst = join(dir, rel);
    ensureDir(dirname(dst));
    try { copyFileSync(join(brainDir, rel), dst); } catch { /* skip unreadable */ }
  }
  // prune to the most recent KEEP snapshots
  const all = snapshots(brainDir);
  for (const old of all.slice(0, Math.max(0, all.length - KEEP))) {
    try { rmSync(join(brainDir, '.dragline', old), { recursive: true, force: true }); } catch {}
  }
  return dir;
}

/** The most recent dragline snapshot directory, or null. */
export function latestDragline(brainDir) {
  const all = snapshots(brainDir);
  return all.length ? join(brainDir, '.dragline', all[all.length - 1]) : null;
}

/** Restore one curated file from the most recent dragline. Returns true on success. */
export function restoreFromDragline(brainDir, rel) {
  const snap = latestDragline(brainDir);
  if (!snap) return false;
  const src = join(snap, rel);
  if (!existsSync(src)) return false;
  try {
    ensureDir(dirname(join(brainDir, rel)));
    copyFileSync(src, join(brainDir, rel));
    return true;
  } catch {
    return false;
  }
}
