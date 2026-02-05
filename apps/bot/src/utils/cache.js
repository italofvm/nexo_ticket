/**
 * Simple In-Memory LRU Cache
 * Used to reduce database load for frequently accessed data (e.g. guild settings)
 */
class SimpleCache {
  constructor(ttlSeconds = 60) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });

    // Simple cleanup if too big
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  delete(key) {
    this.cache.delete(key);
  }
    
  flush() {
    this.cache.clear();
  }
}

module.exports = new SimpleCache(60); // Default 60s TTL
