import { handle } from '../worker.js';

export function authHandler(req) {
  return handle(req);
}
