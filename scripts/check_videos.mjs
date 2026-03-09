import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const sql = neon(env.DATABASE_URL);
const rows = await sql`SELECT id, title, duration_seconds, status, script, metadata FROM shortgen.videos ORDER BY created_at`;
for (const v of rows) {
  console.log(v.id, '|', v.status, '|', (v.duration_seconds ?? 0) + 's', '|', (v.title ?? '').slice(0, 50));
  console.log('  meta:', JSON.stringify(v.metadata));
  console.log('  script_chars:', v.script?.length ?? 0);
}
