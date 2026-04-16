import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  pgSchema,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Use shortgen schema — all tables live in shortgen, not public
export const shortgen = pgSchema('shortgen');

// Enums (must be in the same schema)
export const topicStatusEnum = shortgen.enum('topic_status', [
  'queued',
  'processing',
  'used',
  'skipped',
]);

export const videoStatusEnum = shortgen.enum('video_status', [
  'pending',
  'generating',
  'uploading',
  'published',
  'failed',
]);

// Topics table
export const topics = shortgen.table('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  niche: text('niche'),
  keywords: text('keywords').array(),
  status: topicStatusEnum('status').default('queued').notNull(),
  priority: integer('priority').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Videos table
export const videos = shortgen.table('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic_id: uuid('topic_id').references(() => topics.id),
  title: text('title'),
  script: text('script'),
  youtube_url: text('youtube_url'),
  youtube_id: text('youtube_id'),
  r2_key: text('r2_key'),
  thumbnail_r2_key: text('thumbnail_r2_key'),
  duration_seconds: integer('duration_seconds'),
  status: videoStatusEnum('status').default('pending').notNull(),
  error_message: text('error_message'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  published_at: timestamp('published_at'),
});

// Settings table
export const settings = shortgen.table('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// DB instance
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Type exports
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Setting = typeof settings.$inferSelect;
