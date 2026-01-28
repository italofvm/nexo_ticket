const logger = require('./logger');

const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Sets a value in the cache with a timestamp and specific key.
 * @param {string} guildId 
 * @param {string} type - 'config', 'staff', 'open_tickets', etc.
 * @param {any} data 
 */
const setCache = (guildId, type, data) => {
  const key = `${guildId}_${type}`;
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Gets a value from the cache if it's not expired.
 * @param {string} guildId 
 * @param {string} type 
 */
const getCache = (guildId, type) => {
  const key = `${guildId}_${type}`;
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

/**
 * Invalidates the cache for a specific guild and type.
 * @param {string} guildId 
 * @param {string} type 
 */
const invalidateCache = (guildId, type) => {
  const key = type ? `${guildId}_${type}` : null;
  
  if (key) {
    cache.delete(key);
    logger.info(`Cache invalidated for guild ${guildId} [${type}]`);
  } else {
    // Invalidate ALL for this guild
    for (const cacheKey of cache.keys()) {
      if (cacheKey.startsWith(`${guildId}_`)) {
        cache.delete(cacheKey);
      }
    }
    logger.info(`All cache invalidated for guild ${guildId}`);
  }
};

module.exports = {
  setCache,
  getCache,
  invalidateCache
};
