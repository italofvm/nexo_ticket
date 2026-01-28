const config = require('./config');
const logger = require('./utils/logger');

// 1. Validate environment IMMEDIATELY
config.validateConfig();

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const { loadEvents } = require('./utils/eventHandler');
const { loadCommands, registerCommands } = require('./utils/commandHandler');
const { query } = require('./database');

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
  // Give some time for logs to be written
  setTimeout(() => process.exit(1), 1000);
});

// 4. Graceful Shutdown
const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    // Set a timeout to force exit if it takes too long
    const forceExit = setTimeout(() => {
        logger.warn('Forcefully exiting after 10s wait.');
        process.exit(1);
    }, 10000);

    try {
        if (client.user) {
            logger.info('Closing Discord client...');
            client.destroy();
        }
        
        logger.info('Clean exit.');
        clearTimeout(forceExit);
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown: %o', err);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 5. Optional Healthcheck Server (Railway/Uptime monitoring)
if (config.port) {
    http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
        } else {
            res.writeHead(404);
            res.end();
        }
    }).listen(config.port, () => {
        logger.info(`Healthcheck server running on port ${config.port}`);
    });
}

// 6. Bootstrap
async function bootstrap() {
  try {
    logger.info('Initializing NexoTicket in %s mode...', config.environment);

    // Test Database Connection
    await query('SELECT NOW()');
    logger.info('Database connection established.');

    // Load Handlers
    loadEvents(client);
    loadCommands(client);

    // Register Commands
    await registerCommands();

    // Start periodic metrics logging (every hour)
    const { startPeriodicReport } = require('./utils/metrics');
    startPeriodicReport();

    // Login
    await client.login(config.token);
  } catch (err) {
    logger.error('Bootstrap failed: %o', err);
    process.exit(1);
  }
}

bootstrap();
