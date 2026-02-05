const { sql } = require('./index');
const logger = require('../utils/logger');
const { getCache, setCache, invalidateCache } = require('../utils/configCache');

/**
 * Creates a new ticket panel.
 */
const createPanel = async (guildId, data) => {
  try {
    const results = await sql`
      INSERT INTO panels (
        guild_id, channel_id, message_id, title, description, color, button_label, button_emoji, category_id, image_url
      ) VALUES (
        ${guildId}, ${data.channelId}, ${data.messageId}, ${data.title}, ${data.description}, ${data.color}, ${data.buttonLabel}, ${data.buttonEmoji}, ${data.categoryId}, ${data.imageUrl || null}
      ) RETURNING id, message_id;
    `;
    invalidateCache(guildId, 'panel');
    return results[0];
  } catch (err) {
    logger.error('Error in createPanel: %s', err.message);
    throw err;
  }
};

/**
 * Retrieves a panel by channel ID. Use cache.
 */
const getPanelByChannel = async (channelId) => {
  const cached = getCache(channelId, 'panel');
  if (cached) return cached;

  try {
    const results = await sql`
      SELECT id, guild_id, channel_id, message_id, title, description, color, button_label, button_emoji, category_id, image_url 
      FROM panels WHERE channel_id = ${channelId} LIMIT 1;
    `;
    if (results[0]) {
      setCache(channelId, 'panel', results[0]);
    }
    return results[0];
  } catch (err) {
    logger.error('Error in getPanelByChannel: %s', err.message);
    throw err;
  }
};

/**
 * Updates an existing panel.
 */
const updatePanel = async (panelId, data) => {
  try {
    const results = await sql`
      UPDATE panels SET
        title = ${data.title},
        description = ${data.description},
        color = ${data.color},
        button_label = ${data.buttonLabel},
        button_emoji = ${data.buttonEmoji},
        category_id = ${data.categoryId},
        image_url = ${data.imageUrl || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${panelId}
      RETURNING id, channel_id;
    `;
    if (results[0]) {
      invalidateCache(results[0].channel_id, 'panel');
    }
    return results[0];
  } catch (err) {
    logger.error('Error in updatePanel: %s', err.message);
    throw err;
  }
};

/**
 * Deletes a panel.
 */
const deletePanel = async (panelId) => {
  try {
    const results = await sql`DELETE FROM panels WHERE id = ${panelId} RETURNING channel_id;`;
    if (results[0]) {
      invalidateCache(results[0].channel_id, 'panel');
    }
    return true;
  } catch (err) {
    logger.error('Error in deletePanel: %s', err.message);
    throw err;
  }
};

module.exports = {
  createPanel,
  getPanelByChannel,
  updatePanel,
  deletePanel
};
