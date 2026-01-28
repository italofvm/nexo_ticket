const { sql } = require('./index');
const logger = require('../utils/logger');

/**
 * Creates a new ticket panel.
 */
const createPanel = async (guildId, data) => {
  try {
    const results = await sql`
      INSERT INTO panels (
        guild_id, channel_id, message_id, title, description, color, button_label, button_emoji, category_id
      ) VALUES (
        ${guildId}, ${data.channelId}, ${data.messageId}, ${data.title}, ${data.description}, ${data.color}, ${data.buttonLabel}, ${data.buttonEmoji}, ${data.categoryId}
      ) RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in createPanel: %o', err);
    throw err;
  }
};

/**
 * Retrieves a panel by channel ID.
 */
const getPanelByChannel = async (channelId) => {
  try {
    const results = await sql`
      SELECT * FROM panels WHERE channel_id = ${channelId} LIMIT 1;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in getPanelByChannel: %o', err);
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${panelId}
      RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in updatePanel: %o', err);
    throw err;
  }
};

/**
 * Deletes a panel.
 */
const deletePanel = async (panelId) => {
  try {
    await sql`DELETE FROM panels WHERE id = ${panelId};`;
    return true;
  } catch (err) {
    logger.error('Error in deletePanel: %o', err);
    throw err;
  }
};

module.exports = {
  createPanel,
  getPanelByChannel,
  updatePanel,
  deletePanel
};
