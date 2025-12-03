import { type Message, PermissionFlagsBits } from 'discord.js';
import type { Logger } from 'pino';
import { getServerConfig, getPolicyId } from '../services/config-store.ts';
import { getVettlyClient } from '../services/vettly-client.ts';
import { rateLimiter } from '../utils/rate-limiter.ts';
import { sendModLog } from '../utils/mod-log.ts';

export async function onMessageCreate(message: Message, logger: Logger) {
  // Skip bots and DMs
  if (message.author.bot || !message.guild) return;

  // Get server config
  const config = await getServerConfig(message.guild.id);
  if (!config?.enabled) return;

  // Check if there's content to moderate
  const hasText = message.content.trim().length > 0;
  const images = message.attachments
    .filter(a => a.contentType?.startsWith('image/'))
    .map(a => a.url);

  if (!hasText && images.length === 0) return;

  // Rate limit check
  if (rateLimiter.isLimited(message.guild.id)) {
    logger.warn({ guildId: message.guild.id }, 'Rate limited');
    return;
  }

  const vettly = getVettlyClient(logger);

  try {
    // Call Vettly multimodal endpoint
    const result = await vettly.checkMultimodal({
      text: hasText ? message.content : undefined,
      images: images.length > 0 ? images : undefined,
      policyId: getPolicyId(config.policyPreset),
      metadata: {
        platform: 'discord',
        guildId: message.guild.id,
        guildName: message.guild.name,
        channelId: message.channel.id,
        channelName: 'name' in message.channel ? message.channel.name : undefined,
        userId: message.author.id,
        username: message.author.username,
      },
    });

    // Take action based on result
    if (result.action === 'block') {
      // Check if bot has permission to delete messages in this channel
      const botPermissions = message.channel.isTextBased() && 'permissionsFor' in message.channel
        ? message.channel.permissionsFor(message.client.user!)
        : null;

      if (!botPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        logger.warn({
          guildId: message.guild.id,
          channelId: message.channel.id
        }, 'Bot lacks Manage Messages permission - cannot delete blocked message');

        // Try to notify in channel (if we can send messages)
        if (botPermissions?.has(PermissionFlagsBits.SendMessages)) {
          await message.channel.send({
            content: `⚠️ I detected a policy violation but I don't have **Manage Messages** permission to delete it. Please grant me this permission or ask a moderator to remove the message.`,
          }).catch(() => {});
        }
      } else {
        await message.delete().catch((err) => {
          logger.warn({ err, messageId: message.id }, 'Failed to delete message');
        });
      }
      await sendModLog(config, message, result, 'blocked', logger);

      const triggeredCategories = result.results
        ?.flatMap(r => r.categories)
        .filter(c => c.triggered)
        .map(c => c.category) || [];
      
      logger.info({
        guildId: message.guild.id,
        userId: message.author.id,
        action: 'blocked',
        categories: triggeredCategories,
      }, 'Message blocked');
    } else if (result.action === 'flag') {
      await sendModLog(config, message, result, 'flagged', logger);

      const triggeredCategories = result.results
        ?.flatMap(r => r.categories)
        .filter(c => c.triggered)
        .map(c => c.category) || [];
      
      logger.info({
        guildId: message.guild.id,
        userId: message.author.id,
        action: 'flagged',
        categories: triggeredCategories,
      }, 'Message flagged');
    }
  } catch (error) {
    logger.error({ error, guildId: message.guild.id }, 'Moderation failed');
  }
}
