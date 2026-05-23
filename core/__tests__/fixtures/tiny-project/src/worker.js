// worker - the entry point. Imports a relative file and an alias-style file.
import { runQuery } from './db/queries.js';
import { greet } from '@/utils/helpers';

export function handle(req) {
  return greet(runQuery(req));
}
