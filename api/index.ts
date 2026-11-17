// DIAGNOSTIC VERSION - akan dikembalikan ke versi semula
export default async function handler(_req: any, res: any) {
  const out: Record<string, unknown> = {
    moduleType: typeof module,
    vercel: process.env.VERCEL ?? null,
    node: process.version,
    cwd: process.cwd(),
    databaseUrlSet: !!process.env.DATABASE_URL,
  };
  try {
    out.importMetaUrl = import.meta && import.meta.url ? 'present' : 'absent';
  } catch {
    out.importMetaUrl = 'threw';
  }
  try {
    await import('express');
    out.express = 'ok';
  } catch (e: any) {
    out.expressErr = e.message;
  }
  try {
    await import('pg');
    out.pg = 'ok';
  } catch (e: any) {
    out.pgErr = e.message;
  }
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(out));
}
