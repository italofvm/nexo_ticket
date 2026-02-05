const { getGuildConfig } = require('../database/repositories/configRepository');
const logger = require('../utils/logger');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    logger.info(`Bot joined a new guild: ${guild.name} (${guild.id})`);
    
    try {
      // getGuildConfig automatically creates a default config if it doesn't exist
      await getGuildConfig(guild.id);
      logger.info(`Default configuration initialized for guild: ${guild.id}`);
    } catch (err) {
      logger.error(`Error initializing config for new guild ${guild.id}: %o`, err);
    }
  },
};
