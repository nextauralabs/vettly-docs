# Discord Bot Quick Start

Get the Vettly Discord bot running in 5 minutes.

## Prerequisites

- Bun 1.3+ (or Node.js 18+)
- PostgreSQL database
- Discord bot token
- Vettly API key

## Steps

### 1. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "Vettly Moderator"
3. Go to "Bot" tab → "Add Bot"
4. Enable these intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy bot token (save it!)
6. Copy Application ID from "General Information"

### 2. Configure Environment

```bash
cd apps/discord-bot
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
VETTLY_API_KEY=vettly_your_api_key_here
VETTLY_API_URL=https://api.vettly.dev
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 3. Install & Setup

```bash
# From repo root
bun install

# Apply database migration
bun run db:migrate

# Register Discord commands
bun run discord:register

# Seed moderation policies
bun run discord:seed
```

### 4. Invite Bot to Server

Use this URL (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8192&scope=bot%20applications.commands
```

### 5. Start Bot

```bash
# Development mode (from repo root)
bun run dev:discord

# Or from discord-bot directory
cd apps/discord-bot
bun run dev
```

### 6. Configure in Discord

1. Type `/setup` in your server
2. Choose a policy (Balanced recommended)
3. Select a log channel
4. Done! 🎉

## Test It

Send a test message with harmful content (e.g., "I hate everyone") and watch it get moderated.

## Troubleshooting

**Commands not appearing?**
- Wait 1 hour for global propagation, or
- Kick and re-invite the bot

**Bot offline?**
- Check logs for errors
- Verify token is correct
- Ensure database is running

**Database errors?**
- Make sure migrations are applied
- Check DATABASE_URL is correct

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Customize policies in Vettly dashboard

## Common Commands

```bash
# Development
bun run dev:discord

# Production
bun run start:discord

# Register commands
bun run discord:register

# Seed policies
bun run discord:seed

# View logs
docker logs -f vettly-discord-bot  # if using docker
```

## Support

- Docs: https://docs.vettly.dev
- Issues: https://github.com/nextauralabs/vettly/issues
- Email: support@vettly.dev
