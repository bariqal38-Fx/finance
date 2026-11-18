// Singkronisasi server.ts -> api/index.ts
// Vercel tidak membungkus import relatif (../server), jadi fungsi serverless
// harus berdiri sendiri. File api/index.ts digenerate dari server.ts.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'server.ts');
const dest = path.join(root, 'api', 'index.ts');

const header =
  '// FILE INI DIGENERATE DARI server.ts - jangan edit manual.\n' +
  '// Regenerasi otomatis saat `npm run build` ( lewat scripts/sync-api.mjs ).\n\n';

fs.writeFileSync(dest, header + fs.readFileSync(src, 'utf8'));
console.log('sync-api: server.ts -> api/index.ts');
