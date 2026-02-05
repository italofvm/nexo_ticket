const { sql } = require('../index');
const logger = require('../../utils/logger');

/**
 * Gets global statistics for a guild.
 */
const getGlobalStats = async (guildId) => {
  try {
    const results = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) FILTER (WHERE status = 'deleted') as deleted,
        AVG(EXTRACT(EPOCH FROM (closed_at - created_at))) FILTER (WHERE status = 'closed') as avg_resolution_time
      FROM tickets 
      WHERE guild_id = ${guildId};
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in getGlobalStats: %o', err);
    throw err;
  }
};

/**
 * Gets statistics for a specific staff member.
 */
const getStaffStats = async (guildId, staffId) => {
  try {
    const results = await sql`
      SELECT 
        COUNT(*) as total_claimed,
        AVG(rating) as avg_rating
      FROM tickets t
      LEFT JOIN ratings r ON t.id = r.ticket_id
      WHERE t.guild_id = ${guildId} AND t.claimed_by = ${staffId};
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in getStaffStats: %o', err);
    throw err;
  }
};

/**
 * Gets statistics for a specific user.
 */
const getUserStats = async (guildId, userId) => {
  try {
    const results = await sql`
      SELECT 
        COUNT(*) as total_tickets,
        MAX(created_at) as last_ticket
      FROM tickets 
      WHERE guild_id = ${guildId} AND user_id = ${userId};
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in getUserStats: %o', err);
    throw err;
  }
};

/**
 * Gets average rating for the guild.
 */
const getGuildRating = async (guildId) => {
  try {
    const results = await sql`
            SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
            FROM ratings
            WHERE guild_id = ${guildId};
        `;
    return results[0];
  } catch (err) {
    logger.error('Error in getGuildRating: %o', err);
    throw err;
  }
};

module.exports = {
  getGlobalStats,
  getStaffStats,
  getUserStats,
  getGuildRating
};
