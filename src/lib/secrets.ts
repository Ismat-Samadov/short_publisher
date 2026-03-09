/**
 * Unified secret resolution: env var → database.
 * This lets the app run with minimal env vars (just DATABASE_URL + bootstrap keys).
 * All other secrets (API keys, tokens, etc.) are managed from the dashboard and stored
 * in the settings table with a `secret_` prefix.
 */
import { db, settings } from './db/schema';

const PREFIX = 'secret_';
const CACHE_TTL_MS = 60_000; // 1 minute

let cache: Record<string, string> | null = null;
let cacheTs = 0;

/** Load all secrets from DB, with short-lived in-process cache. */
async function loadFromDb(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_TTL_MS) return cache;

  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      if (row.key.startsWith(PREFIX)) {
        result[row.key.slice(PREFIX.length)] = row.value;
      }
    }
    cache = result;
    cacheTs = now;
    return result;
  } catch {
    return cache ?? {};
  }
}

/**
 * Get a secret by its canonical env-var name.
 * Priority: process.env → database.
 * Falls back to '' so callers can check truthiness.
 */
export async function getSecret(key: string): Promise<string> {
  if (process.env[key]) return process.env[key]!;
  const db = await loadFromDb();
  return db[key] ?? '';
}

/**
 * Get all secrets as a plain object (env overrides DB).
 * Used by the /api/secrets pipeline endpoint.
 */
export async function getAllSecrets(): Promise<Record<string, string>> {
  const fromDb = await loadFromDb();
  const result: Record<string, string> = { ...fromDb };
  // env vars override DB (allows local dev overrides)
  for (const key of Object.keys(result)) {
    if (process.env[key]) result[key] = process.env[key]!;
  }
  return result;
}

/** Invalidate cache — call after saving new secrets. */
export function invalidateSecretsCache() {
  cache = null;
  cacheTs = 0;
}
