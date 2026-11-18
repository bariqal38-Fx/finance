import express from 'express';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://u:***@127.0.0.1:5432/db',
  ssl: { rejectUnauthorized: false },
});

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('content-type', 'text/plain');
  res.end('DIAG6_OK express=' + typeof express + ' pool=' + typeof pool + ' bcrypt=' + typeof bcrypt + ' fs=' + typeof fs + ' dir=' + __dirname);
}
