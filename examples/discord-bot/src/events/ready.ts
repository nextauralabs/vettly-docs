import type { Client } from 'discord.js';
import type { Logger } from 'pino';

export function onReady(client: Client<true>, logger: Logger) {
  logger.info(`Logged in as ${client.user.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} servers`);

  // Set bot status
  client.user.setActivity('Moderating content', { type: 3 }); // 3 = Watching
}
