// helpers - has one real import and one commented-out import.
// The commented-out one must NOT create a false dependency edge.

/*
 * import { ghost } from './ghost.js';
 */
// import { otherGhost } from './ghost2.js';

import { capitalize } from './tiny-helper.js';

export function greet(name) {
  return 'hello, ' + capitalize(String(name || 'world'));
}
