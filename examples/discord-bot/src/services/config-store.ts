import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, uuid, varchar, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// Discord servers schema (matches the migration)
export const discordServers = pgTable('discord_servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  guildId: varchar('guild_id', { length: 255 }).notNull().unique(),
  guildName: varchar('guild_name', { length: 255 }),
  policyPreset: varchar('policy_preset', { length: 50 }).notNull().default('balanced'),
  logChannelId: varchar('log_channel_id', { length: 255 }),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  guildIdIdx: index('discord_servers_guild_id_idx').on(table.guildId),
}));

export type DiscordServer = typeof discordServers.$inferSelect;
export type NewDiscordServer = typeof discordServers.$inferInsert;

// Policy preset to policyId mapping
export const POLICY_PRESETS: Record<string, string> = {
  strict: 'discord-strict',
  balanced: 'discord-balanced',
  permissive: 'discord-permissive',
};

// Database connection
const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

// Cache for server configs (TTL: 5 minutes)
const configCache = new Map<string, { config: DiscordServer | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getServerConfig(guildId: string): Promise<DiscordServer | null> {
  // Check cache first
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  // Query database
  const result = await db
    .select()
    .from(discordServers)
    .where(eq(discordServers.guildId, guildId))
    .limit(1);

  const config = result[0] || null;

  // Update cache
  configCache.set(guildId, { config, timestamp: Date.now() });

  return config;
}

export async function createServerConfig(
  guildId: string,
  guildName: string,
  policyPreset: string,
  logChannelId: string
): Promise<DiscordServer> {
  const [result] = await db
    .insert(discordServers)
    .values({
      guildId,
      guildName,
      policyPreset,
      logChannelId,
      enabled: true,
    })
    .returning();

  // Invalidate cache
  configCache.delete(guildId);

  return result!;
}

export async function updateServerConfig(
  guildId: string,
  updates: Partial<Pick<DiscordServer, 'policyPreset' | 'logChannelId' | 'enabled' | 'guildName'>>
): Promise<DiscordServer | null> {
  const [result] = await db
    .update(discordServers)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(discordServers.guildId, guildId))
    .returning();

  // Invalidate cache
  configCache.delete(guildId);

  return result || null;
}

export async function deleteServerConfig(guildId: string): Promise<boolean> {
  const result = await db
    .delete(discordServers)
    .where(eq(discordServers.guildId, guildId))
    .returning();

  // Invalidate cache
  configCache.delete(guildId);

  return result.length > 0;
}

export function getPolicyId(preset: string): string {
  return POLICY_PRESETS[preset] || POLICY_PRESETS['balanced']!;
}
