import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually since drizzle-kit doesn't pick it up automatically
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] ??= rest.join('=').trim();
    }
  } catch {}
}

loadEnvLocal();

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  schemaFilter: ['shortgen'],
});
