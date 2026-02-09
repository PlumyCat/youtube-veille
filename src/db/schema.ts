import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const channels = sqliteTable('channels', {
  id: text('id').primaryKey(), // YouTube channel ID
  name: text('name').notNull(),
  thumbnail: text('thumbnail'),
  addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(), // YouTube video ID
  channelId: text('channel_id').references(() => channels.id),
  title: text('title').notNull(),
  thumbnail: text('thumbnail'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  duration: integer('duration'), // seconds
  status: text('status').$type<'new' | 'transcribing' | 'transcribed' | 'read' | 'unavailable'>().default('new'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transcripts = sqliteTable('transcripts', {
  videoId: text('video_id').primaryKey().references(() => videos.id),
  content: text('content').notNull(),
  source: text('source'), // youtube_captions, whisper_ai
  segmentsCount: integer('segments_count'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Veille items - track discovered features/updates
export const veilleItems = sqliteTable('veille_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: text('video_id').references(() => videos.id), // Source video (optional)
  title: text('title').notNull(), // Feature name
  description: text('description'), // Details
  source: text('source'), // "youtube", "changelog", "manual"
  status: text('status').$type<'discovered' | 'testing' | 'applied' | 'rejected'>().default('discovered'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  appliedAt: integer('applied_at', { mode: 'timestamp' }),
});

// Types for TypeScript
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
export type VeilleItem = typeof veilleItems.$inferSelect;
export type NewVeilleItem = typeof veilleItems.$inferInsert;
