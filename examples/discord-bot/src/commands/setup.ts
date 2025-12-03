import {
  type ChatInputCommandInteraction,
  type StringSelectMenuInteraction,
  type ChannelSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import type { Logger } from 'pino';
import {
  getServerConfig,
  createServerConfig,
  updateServerConfig,
} from '../services/config-store.ts';

// Temporary storage for setup flow (guildId -> selected policy)
const setupState = new Map<string, { policyPreset: string; userId: string }>();

const POLICY_OPTIONS = [
  {
    label: 'Strict',
    value: 'strict',
    description: 'Maximum safety - blocks most potentially harmful content',
    emoji: '🛡️',
  },
  {
    label: 'Balanced',
    value: 'balanced',
    description: 'Recommended - balances safety with allowing normal discussion',
    emoji: '⚖️',
  },
  {
    label: 'Permissive',
    value: 'permissive',
    description: 'Minimal intervention - only blocks clearly harmful content',
    emoji: '💬',
  },
];

export async function handleSetupCommand(
  interaction: ChatInputCommandInteraction,
  logger: Logger
) {
  // Check permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'You need **Manage Server** permission to configure moderation.',
      ephemeral: true,
    });
    return;
  }

  const guildId = interaction.guildId!;
  const existingConfig = await getServerConfig(guildId);

  // Create embed
  const embed = new EmbedBuilder()
    .setColor(0x5865F2) // Discord blurple
    .setTitle('Vettly Content Moderation Setup')
    .setDescription(
      existingConfig
        ? `Current policy: **${existingConfig.policyPreset}**\nSelect a new policy below to update your settings.`
        : 'Welcome! Choose a moderation policy for your server.\n\nVettly will automatically moderate text messages and images in all channels.'
    )
    .addFields(
      {
        name: '🛡️ Strict',
        value: 'Best for family-friendly or professional communities. Blocks hate speech, harassment, NSFW, spam, and more.',
        inline: false,
      },
      {
        name: '⚖️ Balanced (Recommended)',
        value: 'Good for most communities. Blocks severe violations, flags borderline content for review.',
        inline: false,
      },
      {
        name: '💬 Permissive',
        value: 'Best for mature communities. Only blocks clearly harmful content like hate speech and harassment.',
        inline: false,
      }
    );

  // Create policy select menu
  const policySelect = new StringSelectMenuBuilder()
    .setCustomId('policy_select')
    .setPlaceholder('Select a moderation policy...')
    .addOptions(POLICY_OPTIONS);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(policySelect);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });

  logger.info({ guildId, userId: interaction.user.id }, 'Setup command initiated');
}

export async function handlePolicySelect(
  interaction: StringSelectMenuInteraction,
  logger: Logger
) {
  const guildId = interaction.guildId!;
  const selectedPolicy = interaction.values[0]!;

  // Store the selection temporarily
  setupState.set(guildId, {
    policyPreset: selectedPolicy,
    userId: interaction.user.id,
  });

  // Ask for log channel
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Select Log Channel')
    .setDescription(
      `Policy set to **${selectedPolicy}**.\n\nNow select a channel where moderation logs will be sent.\n\nThis is where you'll see blocked and flagged messages.`
    );

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('log_channel_select')
    .setPlaceholder('Select a log channel...')
    .setChannelTypes(ChannelType.GuildText);

  const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);

  await interaction.update({
    embeds: [embed],
    components: [row],
  });

  logger.info({ guildId, policy: selectedPolicy }, 'Policy selected');
}

export async function handleChannelSelect(
  interaction: ChannelSelectMenuInteraction,
  logger: Logger
) {
  const guildId = interaction.guildId!;
  const logChannelId = interaction.values[0]!;

  // Get the stored policy selection
  const state = setupState.get(guildId);
  if (!state) {
    await interaction.update({
      content: 'Setup session expired. Please run `/setup` again.',
      embeds: [],
      components: [],
    });
    return;
  }

  // Defer the reply immediately to avoid timeout
  await interaction.deferUpdate();

  // Clear the state
  setupState.delete(guildId);

  // Check if server already has config
  const existingConfig = await getServerConfig(guildId);

  if (existingConfig) {
    // Update existing config
    await updateServerConfig(guildId, {
      policyPreset: state.policyPreset,
      logChannelId,
      enabled: true,
      guildName: interaction.guild?.name,
    });
  } else {
    // Create new config
    await createServerConfig(
      guildId,
      interaction.guild?.name || 'Unknown Server',
      state.policyPreset,
      logChannelId
    );
  }

  // Send success message
  const embed = new EmbedBuilder()
    .setColor(0x57F287) // Green
    .setTitle('Setup Complete!')
    .setDescription('Vettly is now moderating your server.')
    .addFields(
      {
        name: 'Policy',
        value: state.policyPreset.charAt(0).toUpperCase() + state.policyPreset.slice(1),
        inline: true,
      },
      {
        name: 'Log Channel',
        value: `<#${logChannelId}>`,
        inline: true,
      },
      {
        name: 'Status',
        value: 'Active',
        inline: true,
      }
    )
    .setFooter({
      text: 'Run /setup again to change settings',
    });

  await interaction.editReply({
    embeds: [embed],
    components: [],
  });

  logger.info({
    guildId,
    policy: state.policyPreset,
    logChannelId,
    isNew: !existingConfig,
  }, 'Setup complete');
}
