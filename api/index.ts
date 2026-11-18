import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('content-type', 'text/plain');
  res.end('DIAG_STATIC_OK express=' + typeof express + ' Pool=' + typeof Pool + ' dotenv=' + typeof dotenv);
}
