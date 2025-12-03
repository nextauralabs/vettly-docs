import {
  type Interaction,
  type ChatInputCommandInteraction,
  type StringSelectMenuInteraction,
  type ChannelSelectMenuInteraction,
  type ButtonInteraction,
} from 'discord.js';
import type { Logger } from 'pino';
import { handleSetupCommand, handlePolicySelect, handleChannelSelect } from '../commands/setup.ts';

export async function onInteractionCreate(interaction: Interaction, logger: Logger) {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      await handleChatCommand(interaction, logger);
      return;
    }

    // String select menus (policy selection)
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'policy_select') {
        await handlePolicySelect(interaction, logger);
      }
      return;
    }

    // Channel select menus
    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === 'log_channel_select') {
        await handleChannelSelect(interaction, logger);
      }
      return;
    }

    // Button interactions
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction, logger);
      return;
    }
  } catch (error) {
    logger.error({ error, interactionId: interaction.id }, 'Interaction handling failed');

    // Try to respond with error
    if (interaction.isRepliable()) {
      const content = 'An error occurred while processing your request.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content, ephemeral: true }).catch(() => {});
      }
    }
  }
}

async function handleChatCommand(interaction: ChatInputCommandInteraction, logger: Logger) {
  const { commandName } = interaction;

  switch (commandName) {
    case 'setup':
      await handleSetupCommand(interaction, logger);
      break;
    default:
      logger.warn({ commandName }, 'Unknown command');
      await interaction.reply({
        content: `Unknown command: ${commandName}`,
        ephemeral: true,
      });
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction, logger: Logger) {
  const { customId } = interaction;

  // Handle disable/enable buttons
  if (customId === 'disable_moderation') {
    // Import here to avoid circular dependency
    const { updateServerConfig } = await import('../services/config-store.ts');
    await updateServerConfig(interaction.guildId!, { enabled: false });
    await interaction.reply({
      content: 'Moderation has been **disabled** for this server. Run `/setup` to re-enable.',
      ephemeral: true,
    });
    return;
  }

  logger.warn({ customId }, 'Unknown button interaction');
}
