// DIAGNOSTIC 2 - static import server.ts
import app from '../server';

export default async function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, appType: typeof app, isFunction: typeof app === 'function' }));
}
