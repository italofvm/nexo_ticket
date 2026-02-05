require('dotenv').config();
const logger = require('../utils/logger');

const requiredEnvs = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'DATABASE_URL'
];

/**
 * Validates that all required environment variables are present.
 */
const validateConfig = () => {
  const missing = requiredEnvs.filter(env => !process.env[env]);

  if (missing.length > 0) {
    logger.error('CRITICAL ERROR: Missing mandatory environment variables: %s', missing.join(', '));
    logger.error('Please check your .env file or Railway environment settings.');
    process.exit(1);
  }

  // Basic validation for CLIENT_ID and GUILD_ID (should be numbers/snowflakes string)
  if (!/^\d{17,20}$/.test(process.env.CLIENT_ID)) {
    logger.error('Invalid CLIENT_ID format.');
    process.exit(1);
  }

  logger.info('Environment variables validated successfully.');
};

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || null,
  environment: process.env.NODE_ENV || 'development',
  validateConfig
};
