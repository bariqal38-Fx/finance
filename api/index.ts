// DIAGNOSTIC 3 - static import per-dependency
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export default async function handler(_req: any, res: any) {
  const out: Record<string, unknown> = { ok: true };
  try { dotenv.config(); out.dotenv = 'ok'; } catch (e: any) { out.dotenvErr = e.message; }
  try { out.filename = fileURLToPath(import.meta.url); } catch (e: any) { out.filenameErr = e.message; }
  try { const a = express(); a.use(express.json()); out.express = 'ok'; } catch (e: any) { out.expressErr = e.message; }
  try { new Pool({ connectionString: 'postgresql://u:***@127.0.0.1:5432/d', ssl: { rejectUnauthorized: false } }); out.pool = 'ok'; } catch (e: any) { out.poolErr = e.message; }
  try { await bcrypt.hash('a', 4); out.bcrypt = 'ok'; } catch (e: any) { out.bcryptErr = e.message; }
  try { out.fs = typeof fs.existsSync + '/' + path.dirname('/a/b'); } catch (e: any) { out.fsErr = e.message; }
  try { await import('vite'); out.vite = 'ok'; } catch (e: any) { out.viteErr = e.message; }
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(out));
}
