const { sql } = require('./index');
const logger = require('../utils/logger');

/**
 * Checks if a user has an open ticket in a guild.
 */
const hasOpenTicket = async (userId, guildId) => {
  try {
    const results = await sql`
      SELECT id FROM tickets 
      WHERE user_id = ${userId} AND guild_id = ${guildId} AND status = 'open' 
      LIMIT 1;
    `;
    return results.length > 0;
  } catch (err) {
    logger.error('Error in hasOpenTicket: %o', err);
    throw err;
  }
};

/**
 * Increments and returns the next ticket number for a guild.
 * Uses a transaction-safe upsert.
 */
const getNextTicketNumber = async (guildId) => {
  try {
    const results = await sql`
      INSERT INTO guild_config (guild_id, ticket_count)
      VALUES (${guildId}, 1)
      ON CONFLICT (guild_id) 
      DO UPDATE SET ticket_count = guild_config.ticket_count + 1, updated_at = CURRENT_TIMESTAMP
      RETURNING ticket_count;
    `;
    return results[0].ticket_count;
  } catch (err) {
    logger.error('Error in getNextTicketNumber: %o', err);
    throw err;
  }
};

/**
 * Creates a new ticket record.
 */
const createTicket = async (data) => {
  try {
    const ticketNumber = await getNextTicketNumber(data.guildId);
    const results = await sql`
      INSERT INTO tickets (
        guild_id, channel_id, user_id, panel_id, ticket_number, category_id
      ) VALUES (
        ${data.guildId}, ${data.channelId}, ${data.userId}, ${data.panelId}, ${ticketNumber}, ${data.categoryId}
      ) RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in createTicket: %o', err);
    throw err;
  }
};

/**
 * Gets staff roles for a guild.
 */
const getStaffRoles = async (guildId) => {
  try {
    const results = await sql`
      SELECT role_id FROM staff_roles WHERE guild_id = ${guildId};
    `;
    return results.map(r => r.role_id);
  } catch (err) {
    logger.error('Error in getStaffRoles: %o', err);
    throw err;
  }
};

/**
 * Adds a staff role.
 */
const addStaffRole = async (guildId, roleId) => {
  try {
    // Ensure guild_config existence first due to FK
    await sql`INSERT INTO guild_config (guild_id) VALUES (${guildId}) ON CONFLICT DO NOTHING;`;
    
    await sql`
      INSERT INTO staff_roles (guild_id, role_id)
      VALUES (${guildId}, ${roleId})
      ON CONFLICT DO NOTHING;
    `;
    return true;
  } catch (err) {
    logger.error('Error in addStaffRole: %o', err);
    throw err;
  }
};

/**
 * Removes a staff role.
 */
const removeStaffRole = async (guildId, roleId) => {
  try {
    await sql`
      DELETE FROM staff_roles WHERE guild_id = ${guildId} AND role_id = ${roleId};
    `;
    return true;
  } catch (err) {
    logger.error('Error in removeStaffRole: %o', err);
    throw err;
  }
};

module.exports = {
  hasOpenTicket,
  createTicket,
  getStaffRoles,
  addStaffRole,
  removeStaffRole
};
