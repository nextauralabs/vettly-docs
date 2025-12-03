import { Client, GatewayIntentBits, Events, Partials } from 'discord.js';
import { pino } from 'pino';
import { onReady } from './events/ready.ts';
import { onMessageCreate } from './events/messageCreate.ts';
import { onInteractionCreate } from './events/interactionCreate.ts';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'VETTLY_API_URL', 'VETTLY_API_KEY', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// Register event handlers
client.once(Events.ClientReady, (readyClient) => onReady(readyClient, logger));
client.on(Events.MessageCreate, (message) => onMessageCreate(message, logger));
client.on(Events.InteractionCreate, (interaction) => onInteractionCreate(interaction, logger));

// Login to Discord
logger.info('Starting Vettly Discord bot...');
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  client.destroy();
  process.exit(0);
});
