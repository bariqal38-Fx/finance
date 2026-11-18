export default async function handler(_req: any, res: any) {
  try {
    const mod = await import('../server');
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end('DIAG8_OK ' + typeof mod.default);
  } catch (e: any) {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end('DIAG8_ERR ' + String(e && e.message) + '\n' + String((e && e.stack) || '').split('\n').slice(0, 8).join('\n'));
  }
}
