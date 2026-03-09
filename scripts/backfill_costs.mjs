/**
 * Backfill cost metadata for existing videos that were created before cost tracking was added.
 * Costs are estimated from available data (script length, duration, known pipeline behavior).
 */
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const sql = neon(env.DATABASE_URL);

// Claude Sonnet 4.6 pricing
const CLAUDE_INPUT_PER_M  = 3;   // $3 per 1M input tokens
const CLAUDE_OUTPUT_PER_M = 15;  // $15 per 1M output tokens
// ElevenLabs estimate
const EL_COST_PER_CHAR = 0.0002; // ~$0.0002/char (Starter plan)
// Kling 2.6 Pro
const KLING_COST_PER_CLIP = 0.70; // $0.07/s × 10s

function estimateClaudeCost(scriptChars) {
  // Rough token estimate: system prompt ~800 tok + user prompt ~300 tok input;
  // output ≈ scriptChars / 4 tokens
  const inputTokens  = 1100;
  const outputTokens = Math.round(scriptChars / 4);
  const cost = (inputTokens * CLAUDE_INPUT_PER_M + outputTokens * CLAUDE_OUTPUT_PER_M) / 1_000_000;
  return { inputTokens, outputTokens, cost: Math.round(cost * 1e6) / 1e6 };
}

function estimateClips(durationSeconds) {
  // Each clip is ~10s; pipeline generates one per script segment
  return Math.max(1, Math.ceil(durationSeconds / 10));
}

const rows = await sql`SELECT id, title, status, duration_seconds, script, metadata FROM shortgen.videos ORDER BY created_at`;

for (const video of rows) {
  if (video.metadata?.total_usd) {
    console.log(`SKIP  ${video.title?.slice(0, 50)} — already has cost data`);
    continue;
  }

  const scriptChars = video.script?.length ?? 0;
  const claude      = estimateClaudeCost(scriptChars);

  let metadata;

  if (video.status === 'failed') {
    // Pipeline failed — only Claude completed (audio/Kling never ran)
    metadata = {
      claude: {
        input_tokens:  claude.inputTokens,
        output_tokens: claude.outputTokens,
        cost_usd:      claude.cost,
      },
      elevenlabs: { chars: 0, cost_usd: 0 },
      kling:      { clips: 0, cost_usd: 0 },
      total_usd:  Math.round(claude.cost * 1e4) / 1e4,
      estimated:  true,
    };
  } else {
    // Published — all steps ran
    const elCost   = scriptChars * EL_COST_PER_CHAR;
    const clips    = estimateClips(video.duration_seconds ?? 55);
    const klingCost = clips * KLING_COST_PER_CLIP;
    const total    = claude.cost + elCost + klingCost;

    metadata = {
      claude: {
        input_tokens:  claude.inputTokens,
        output_tokens: claude.outputTokens,
        cost_usd:      Math.round(claude.cost * 1e6) / 1e6,
      },
      elevenlabs: {
        chars:    scriptChars,
        cost_usd: Math.round(elCost * 1e6) / 1e6,
      },
      kling: {
        clips,
        cost_usd: Math.round(klingCost * 1e4) / 1e4,
      },
      total_usd: Math.round(total * 1e4) / 1e4,
      estimated: true,
    };
  }

  await sql`UPDATE shortgen.videos SET metadata = ${JSON.stringify(metadata)}::jsonb WHERE id = ${video.id}`;

  console.log(`OK    ${video.title?.slice(0, 50)}`);
  console.log(`      Claude $${metadata.claude.cost_usd} | EL $${metadata.elevenlabs.cost_usd} | Kling $${metadata.kling.cost_usd} | Total $${metadata.total_usd} ${metadata.estimated ? '(estimated)' : ''}`);
}

console.log('\nDone.');
