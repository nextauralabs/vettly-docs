import { EmbedBuilder, type Message, type TextChannel } from 'discord.js';
import type { Logger } from 'pino';
import type { DiscordServer } from '../services/config-store.ts';
import type { ModerationResult } from '../services/vettly-client.ts';

const ACTION_COLORS = {
  blocked: 0xED4245, // Red
  flagged: 0xFEE75C, // Yellow
} as const;

const ACTION_TITLES = {
  blocked: 'Message Blocked',
  flagged: 'Message Flagged for Review',
} as const;

export async function sendModLog(
  config: DiscordServer,
  message: Message,
  result: ModerationResult,
  action: 'blocked' | 'flagged',
  logger: Logger
) {
  if (!config.logChannelId) {
    logger.warn({ guildId: config.guildId }, 'No logChannelId configured');
    return;
  }

  logger.info({ 
    guildId: config.guildId, 
    logChannelId: config.logChannelId,
    action 
  }, 'Attempting to send mod log');

  try {
    const logChannel = await message.client.channels.fetch(config.logChannelId) as TextChannel | null;
    if (!logChannel) {
      logger.warn({ 
        channelId: config.logChannelId,
        guildId: config.guildId 
      }, 'Log channel not found - bot may lack access or channel was deleted');
      return;
    }
    
    if (!logChannel.isTextBased()) {
      logger.warn({ 
        channelId: config.logChannelId,
        channelType: logChannel.type 
      }, 'Log channel is not text-based');
      return;
    }

    logger.debug({ channelId: config.logChannelId }, 'Log channel fetched successfully');

    // Check bot permissions
    const permissions = logChannel.permissionsFor(message.client.user!);
    if (!permissions?.has(['ViewChannel', 'SendMessages'])) {
      logger.error({
        channelId: config.logChannelId,
        guildId: config.guildId,
        hasViewChannel: permissions?.has('ViewChannel'),
        hasSendMessages: permissions?.has('SendMessages'),
      }, 'Bot lacks permissions in log channel');
      return;
    }

    // Aggregate categories from all results
    const allCategories = result.results?.flatMap(r => r.categories) || [];
    const triggeredCategories = allCategories
      .filter(c => c.triggered)
      .map(c => `${c.category} (${(c.score * 100).toFixed(0)}%)`)
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(ACTION_COLORS[action])
      .setTitle(ACTION_TITLES[action])
      .setDescription(truncate(message.content || '*No text content*', 1024))
      .addFields(
        {
          name: 'User',
          value: `<@${message.author.id}> (${message.author.username})`,
          inline: true,
        },
        {
          name: 'Channel',
          value: `<#${message.channel.id}>`,
          inline: true,
        },
        {
          name: 'Categories',
          value: triggeredCategories || 'None',
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({
        text: `Decision ID: ${result.decisionId}`,
      });

    // Add image preview if there were images
    const images = message.attachments.filter(a => a.contentType?.startsWith('image/'));
    if (images.size > 0) {
      const firstImage = images.first();
      if (firstImage) {
        embed.setImage(firstImage.url);
        if (images.size > 1) {
          embed.addFields({
            name: 'Images',
            value: `${images.size} image(s) attached`,
            inline: true,
          });
        }
      }
    }

    // Add link to original message (if not deleted)
    if (action === 'flagged') {
      embed.addFields({
        name: 'Jump to Message',
        value: `[Click here](${message.url})`,
        inline: true,
      });
    }

    await logChannel.send({ embeds: [embed] });
    logger.info({ 
      guildId: config.guildId, 
      channelId: config.logChannelId,
      action 
    }, 'Mod log sent successfully');
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      guildId: config.guildId,
      channelId: config.logChannelId
    }, 'Failed to send mod log');
  }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
