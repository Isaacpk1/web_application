import type { IncomingMessage, ServerResponse } from 'http';

import { app } from '../src/app';

// A Vercel espera que o default export seja uma funcao handler.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
