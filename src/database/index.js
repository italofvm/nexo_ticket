const { neon } = require('@neondatabase/serverless');
const config = require('../config');
const logger = require('../utils/logger');

const sql = neon(config.databaseUrl);

/**
 * Executes a SQL query securely using prepared statements pattern.
 * Use SQL template literals from @neondatabase/serverless for safety.
 */
const query = async (queryText, params = []) => {
  const start = Date.now();
  try {
    // Note: @neondatabase/serverless neon() function handles parameters safely
    // to prevent SQL injection when used correctly.
    const result = await sql(queryText, params);
    const duration = Date.now() - start;
    logger.info('Executed query in %dms', duration);
    return result;
  } catch (err) {
    logger.error('Database query error: %o', { 
      message: err.message, 
      query: queryText.substring(0, 100) + '...' 
    });
    throw new Error('Internal database error');
  }
};

module.exports = {
  query,
  sql // Export direct sql for template literal usage: sql`SELECT...`
};
