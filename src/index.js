const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');
const { loadEvents } = require('./utils/eventHandler');
const { loadCommands, registerCommands } = require('./utils/commandHandler');
const { query } = require('./database');

// 1. Validate environment
config.validateConfig();

// 2. Initialize Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// 3. Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at: %o, reason: %o', promise, reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception: %o', error);
  process.exit(1);
});

async function bootstrap() {
  try {
    logger.info('Initializing NexoTicket...');

    // Test Database Connection
    await query('SELECT NOW()');
    logger.info('Database connection established.');

    // Load Handlers
    loadEvents(client);
    loadCommands(client);

    // Register Commands (Development/Guild specific recommended for tests)
    await registerCommands();

    // Login
    await client.login(config.token);
  } catch (err) {
    logger.error('Bootstrap failed: %o', err);
    process.exit(1);
  }
}

bootstrap();
