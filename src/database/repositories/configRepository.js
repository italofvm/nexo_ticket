const { sql } = require('../index');
const { getCache, setCache, invalidateCache } = require('../../utils/configCache');
const logger = require('../../utils/logger');

/**
 * Gets the configuration for a guild. Use cache first.
 */
const getGuildConfig = async (guildId) => {
  const cached = getCache(guildId, 'config');
  if (cached) return cached;

  try {
    const results = await sql`
      SELECT guild_id, ticket_count, log_channel_id, rating_enabled, welcome_message 
      FROM guild_config WHERE guild_id = ${guildId} LIMIT 1;
    `;
    
    // If no config, create default
    if (results.length === 0) {
      const newConfig = await sql`
        INSERT INTO guild_config (guild_id) VALUES (${guildId})
        RETURNING guild_id, ticket_count, log_channel_id, rating_enabled, welcome_message;
      `;
      setCache(guildId, 'config', newConfig[0]);
      return newConfig[0];
    }

    setCache(guildId, 'config', results[0]);
    return results[0];
  } catch (err) {
    logger.error('Error in getGuildConfig: %s', err.message);
    throw err;
  }
};

/**
 * Updates the configuration for a guild.
 */
const updateGuildConfig = async (guildId, settings) => {
  try {
    const columns = Object.keys(settings);
    if (columns.length === 0) return;

    let query = 'UPDATE guild_config SET ';
    const params = [guildId];
    
    const setClauses = columns.map((col, index) => {
        return `${col} = $${index + 2}`;
    });

    query += setClauses.join(', ') + ' WHERE guild_id = $1 RETURNING guild_id, ticket_count, log_channel_id, rating_enabled, welcome_message;';

    const values = columns.map(col => settings[col]);
    
    const results = await sql.unsafe(query, params.concat(values));
    
    invalidateCache(guildId, 'config');
    return results[0];
  } catch (err) {
    logger.error('Error in updateGuildConfig: %s', err.message);
    throw err;
  }
};

module.exports = {
  getGuildConfig,
  updateGuildConfig
};
