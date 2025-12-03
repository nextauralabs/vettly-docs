# Vettly Discord Bot

> **Automated content moderation for Discord servers powered by Vettly AI**

Protect your Discord community with real-time moderation of text messages and images. The Vettly bot automatically blocks or flags harmful content before it reaches your members.

## Features

- 🛡️ **Real-time Moderation** - Automatically moderates text and image content
- 🎯 **Flexible Policies** - Choose from Strict, Balanced, or Permissive moderation levels
- 📊 **Moderation Logs** - Get detailed reports in your designated log channel
- ⚡ **Multi-modal** - Handles both text and images in a single message
- 🚀 **Fast & Reliable** - Built with Discord.js and powered by Vettly's AI

## Prerequisites

- Node.js 18+ or Bun 1.3+
- PostgreSQL database
- Discord Bot Application (see setup below)
- Vettly API account and API key

## Setup

### 1. Create Discord Bot Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Vettly Moderator")
3. Go to the "Bot" tab and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Click "Reset Token" and copy your bot token (save it securely!)
6. Copy your "Application ID" from the "General Information" tab

### 2. Configure Environment Variables

Create a `.env` file in the `apps/discord-bot` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Discord Bot Credentials
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here

# Vettly API Configuration
VETTLY_API_URL=https://api.vettly.dev
VETTLY_API_KEY=your_vettly_api_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Logging
LOG_LEVEL=info
```

### 3. Install Dependencies

From the repository root:

```bash
bun install
```

Or if using npm/yarn:

```bash
npm install
# or
yarn install
```

### 4. Set Up Database

The bot needs the `discord_servers` table. Apply the migration:

```bash
# From repository root
bun run db:migrate

# Or from apps/api directory
cd apps/api
bun run db:migrate
```

### 5. Register Slash Commands

Register the `/setup` command with Discord:

```bash
cd apps/discord-bot
bun run register-commands
```

You should see: `Successfully registered 1 commands`

### 6. Seed Moderation Policies

Create the default Discord moderation policies in Vettly:

```bash
cd apps/discord-bot
bun run seed-policies
```

This creates three policies:
- `discord-strict` - Maximum protection
- `discord-balanced` - Recommended for most servers
- `discord-permissive` - Minimal intervention

### 7. Invite Bot to Your Server

Generate an invite link with the correct permissions:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8192&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your Application ID.

Required Permissions:
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Manage Messages (to delete harmful content)
- ✅ Read Message History

### 8. Start the Bot

Development mode (with hot reload):

```bash
cd apps/discord-bot
bun run dev
```

Production mode:

```bash
cd apps/discord-bot
bun run start
```

You should see: `Vettly Discord bot logged in as YourBot#1234`

## Usage

### Configure Your Server

1. In your Discord server, type `/setup`
2. Select a moderation policy:
   - **Strict** - Best for family-friendly or professional communities
   - **Balanced** - Good for most communities (recommended)
   - **Permissive** - Best for mature communities
3. Select a channel for moderation logs
4. Done! The bot will now moderate all messages

### How It Works

- Bot monitors all messages in all channels (unless whitelisted)
- Text and images are analyzed using Vettly's AI moderation
- Harmful content is automatically:
  - **Blocked** - Message deleted immediately
  - **Flagged** - Message stays but logged for review
- Moderation logs appear in your designated log channel

### Moderation Logs

The bot sends rich embed logs with:
- User information
- Channel where content was posted
- Triggered categories (hate speech, harassment, etc.)
- Content preview
- Decision ID for appeals/auditing

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start in development mode with hot reload |
| `bun run start` | Start in production mode |
| `bun run register-commands` | Register slash commands with Discord |
| `bun run seed-policies` | Create default moderation policies |

## Moderation Policies

### Strict Policy
Blocks:
- Hate speech (threshold: 0.3)
- Harassment (threshold: 0.4)
- Violence (threshold: 0.5)
- Self-harm (threshold: 0.3)
- Sexual content (threshold: 0.4)

### Balanced Policy (Recommended)
Blocks:
- Hate speech (threshold: 0.5)
- Harassment (threshold: 0.6)
- Self-harm (threshold: 0.5)
- Sexual content (threshold: 0.6)

Flags:
- Violence (threshold: 0.7)

### Permissive Policy
Blocks:
- Hate speech (threshold: 0.8)
- Self-harm (threshold: 0.7)

Flags:
- Harassment (threshold: 0.85)
- Violence (threshold: 0.9)
- Sexual content (threshold: 0.85)

## Architecture

```
apps/discord-bot/
├── src/
│   ├── commands/        # Slash commands (/setup)
│   ├── events/          # Discord event handlers
│   ├── services/        # Business logic (config, Vettly client)
│   ├── utils/           # Utilities (rate limiter, mod logging)
│   ├── index.ts         # Main entry point
│   ├── register-commands.ts  # Command registration script
│   └── seed-policies.ts # Policy seeding script
├── package.json
└── README.md
```

## Configuration Storage

Server configurations are stored in PostgreSQL:

- `guildId` - Discord server ID
- `policyPreset` - strict | balanced | permissive
- `logChannelId` - Where to send moderation logs
- `enabled` - Whether moderation is active

Configurations are cached for 5 minutes for performance.

## Rate Limiting

- 100 requests per minute per server
- Prevents API abuse and cost overruns
- Transparent to users

## Troubleshooting

### Bot doesn't respond to /setup command

- Make sure you ran `bun run register-commands`
- Commands can take up to 1 hour to propagate globally
- Try kicking and re-inviting the bot

### Bot doesn't delete messages

- Check bot has "Manage Messages" permission
- Make sure bot role is higher than user roles
- Check log channel for error messages

### "Rate limited" errors

- Default is 100 requests/minute per server
- Adjust in `src/utils/rate-limiter.ts` if needed
- Consider upgrading your Vettly plan

### Database connection errors

- Verify DATABASE_URL is correct
- Make sure migrations have been applied
- Check database is accessible from bot

## Production Deployment

### Using Docker

```bash
# Build image
docker build -f Dockerfile.discord-bot -t vettly-discord-bot .

# Run container
docker run -d \
  --name vettly-discord-bot \
  --env-file apps/discord-bot/.env \
  vettly-discord-bot
```

### Using Railway

1. Create new service in Railway
2. Connect your GitHub repository
3. Set root directory to `apps/discord-bot`
4. Add environment variables
5. Deploy!

### Environment Variables (Production)

Make sure to set all required environment variables in your deployment platform:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `VETTLY_API_URL`
- `VETTLY_API_KEY`
- `DATABASE_URL`
- `NODE_ENV=production` (recommended)

## Support

- **Documentation**: [docs.vettly.dev](https://docs.vettly.dev)
- **API Issues**: [github.com/nextauralabs/vettly/issues](https://github.com/nextauralabs/vettly/issues)
- **Email**: support@vettly.dev

## License

MIT - See LICENSE file for details
