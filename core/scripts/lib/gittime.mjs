/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// gittime.mjs - last-commit time per file, from git.
//
// The honest answer to "when did this logically change". Filesystem mtime is
// reset to *now* by every clone, checkout, and branch switch - so mtime makes
// the whole recency half of the brain (spideymove) collapse into noise on a
// fresh clone. A git commit time is a record of a real change and survives.
//
// Degrades gracefully: if git is missing or this is not a repo, the maps come
// back empty and every caller falls back to mtime.

import { execFileSync } from 'node:child_process';

const run = (args, cwd) => {
  try {
    return execFileSync('git', ['-C', cwd, ...args], {
      encoding: 'utf8',
      maxBuffer: 96 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
};

/** Map<posix-relpath, unix-seconds> - last commit that touched each file. */
export function gitFileTimes(projectDir) {
  return gitFileStats(projectDir).times;
}

/**
 * One git pass, two signals: the last-commit time AND the commit count per
 * file. Commit count is `rhythm` - how fast a file beats. Slow = theta
 * (master-tending); fast = gamma (executor).
 * @returns {{ times: Map<string,number>, counts: Map<string,number> }}
 */
export function gitFileStats(projectDir) {
  const times = new Map();
  const counts = new Map();
  const out = run(['log', '--no-merges', '--pretty=format:@%ct', '--name-only'], projectDir);
  if (out == null) return { times, counts };
  let cur = 0;
  for (const line of out.split('\n')) {
    if (!line) continue;
    if (line[0] === '@') { cur = parseInt(line.slice(1), 10) || 0; continue; }
    if (!times.has(line)) times.set(line, cur); // newest-first: first sighting = latest
    counts.set(line, (counts.get(line) || 0) + 1);
  }
  return { times, counts };
}

/** Commit count touching anything under a directory - a collapsed node's rhythm. */
export function gitDirCommits(projectDir, dirRel) {
  const out = run(['log', '--oneline', '--', dirRel], projectDir);
  if (out == null) return 0;
  return out.split('\n').filter((l) => l.trim()).length;
}

/** Last commit time (unix seconds) touching anything under a directory. */
export function gitDirTime(projectDir, dirRel) {
  const out = run(['log', '-1', '--pretty=format:%ct', '--', dirRel], projectDir);
  if (out == null) return 0;
  const t = parseInt(out.trim(), 10);
  return Number.isFinite(t) ? t : 0;
}

/** True if `projectDir` is inside a git work tree. */
export function isGitRepo(projectDir) {
  const out = run(['rev-parse', '--is-inside-work-tree'], projectDir);
  return out != null && out.trim() === 'true';
}
