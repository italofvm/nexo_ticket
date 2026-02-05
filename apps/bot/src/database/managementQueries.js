const { sql } = require('./index');
const logger = require('../utils/logger');

/**
 * Updates a ticket status to 'closed'.
 */
const closeTicket = async (channelId, _closedBy) => {
  try {
    const results = await sql`
      UPDATE tickets 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE channel_id = ${channelId}
      RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in closeTicket: %o', err);
    throw err;
  }
};

/**
 * Retrieves a ticket by channel ID.
 */
const getTicketByChannel = async (channelId) => {
  try {
    const results = await sql`
      SELECT * FROM tickets WHERE channel_id = ${channelId} LIMIT 1;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in getTicketByChannel: %o', err);
    throw err;
  }
};

/**
 * Updates a ticket to be claimed by a staff member.
 */
const claimTicket = async (channelId, staffId) => {
  try {
    const results = await sql`
      UPDATE tickets 
      SET claimed_by = ${staffId}
      WHERE channel_id = ${channelId}
      RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in claimTicket: %o', err);
    throw err;
  }
};

/**
 * Transfers a ticket to another staff member.
 */
const transferTicket = async (channelId, newStaffId) => {
  try {
    const results = await sql`
      UPDATE tickets 
      SET claimed_by = ${newStaffId}
      WHERE channel_id = ${channelId}
      RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in transferTicket: %o', err);
    throw err;
  }
};

/**
 * Marks a ticket as deleted.
 */
const deleteTicketRecord = async (channelId) => {
  try {
    const results = await sql`
      UPDATE tickets 
      SET status = 'deleted'
      WHERE channel_id = ${channelId}
      RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in deleteTicketRecord: %o', err);
    throw err;
  }
};

/**
 * Saves a transcript to the database.
 */
const saveTranscript = async (data) => {
  try {
    const results = await sql`
      INSERT INTO transcripts (ticket_id, channel_id, guild_id, generated_by, content, format)
      VALUES (${data.ticketId}, ${data.channelId}, ${data.guildId}, ${data.generatedBy}, ${data.content}, ${data.format})
      RETURNING *;
    `;
    return results[0];
  } catch (err) {
    logger.error('Error in saveTranscript: %o', err);
    throw err;
  }
};

module.exports = {
  closeTicket,
  getTicketByChannel,
  claimTicket,
  transferTicket,
  deleteTicketRecord,
  saveTranscript
};
