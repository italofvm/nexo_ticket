const { getGuildConfig } = require('../database/repositories/configRepository');
const logger = require('../utils/logger');

module.exports = {
  name: 'ready', // Standard discord.js event name
  once: true,
  async execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
    
    // Ensure all guilds have a default configuration in the database
    const guilds = client.guilds.cache;
    logger.info(`Syncing configuration for ${guilds.size} guilds...`);
    
    for (const [guildId, guild] of guilds) {
      try {
        await getGuildConfig(guildId);
      } catch (err) {
        logger.error(`Error syncing guild ${guild.name} (${guildId}): %s`, err.message);
      }
    }
    
    logger.info('Guild configuration sync completed.');
  },
};

