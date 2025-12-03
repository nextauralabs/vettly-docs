import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { pino } from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Validate required environment variables
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
  logger.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
  process.exit(1);
}

// Define commands
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure Vettly content moderation for this server')
    .setDMPermission(false),
].map(command => command.toJSON());

// Register commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    logger.info(`Registering ${commands.length} slash commands...`);

    // Register globally (takes up to an hour to propagate)
    // For faster testing, use guild-specific registration
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    );

    logger.info(`Successfully registered ${(data as unknown[]).length} commands`);
  } catch (error) {
    logger.error({ error }, 'Failed to register commands');
    process.exit(1);
  }
}

registerCommands();
