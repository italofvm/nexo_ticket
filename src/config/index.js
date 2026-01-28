require('dotenv').config();
const logger = require('../utils/logger');

const requiredEnvs = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'DATABASE_URL'
];

const validateConfig = () => {
  const missing = requiredEnvs.filter(env => !process.env[env]);

  if (missing.length > 0) {
    logger.error('Missing mandatory environment variables: %s', missing.join(', '));
    process.exit(1);
  }

  logger.info('Environment variables validated successfully.');
};

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  databaseUrl: process.env.DATABASE_URL,
  validateConfig
};
