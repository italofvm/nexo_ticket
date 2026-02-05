const { neon } = require('@neondatabase/serverless');
const config = require('../config');
const logger = require('../utils/logger');

const cache = require('../utils/cache');

const sql = neon(config.databaseUrl);

/**
 * Executes a SQL query securely using prepared statements pattern.
 * Use SQL template literals from @neondatabase/serverless for safety.
 * 
 * @param {string} queryText - The SQL query
 * @param {any[]} params - Query parameters
 * @param {string} [cacheKey] - Optional cache key. If provided, result is cached.
 */
const query = async (queryText, params = [], cacheKey = null) => {
  const start = Date.now();
  
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) {
      // logger.debug('Cache hit for %s', cacheKey);
      return cached;
    }
  }

  try {
    // Note: @neondatabase/serverless neon() function handles parameters safely
    // to prevent SQL injection when used correctly.
    const result = await sql.query(queryText, params);
    const duration = Date.now() - start;
    logger.info('Executed query in %dms', duration);
    
    if (cacheKey && result) {
      cache.set(cacheKey, result);
    }

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
