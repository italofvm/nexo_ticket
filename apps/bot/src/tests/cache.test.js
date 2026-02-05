const SimpleCache = require('../utils/cache');

describe('SimpleCache', () => {
  beforeEach(() => {
    SimpleCache.flush();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      SimpleCache.set('testKey', { data: 'testData' });
      
      const result = SimpleCache.get('testKey');
      
      expect(result).toEqual({ data: 'testData' });
    });

    it('should return null for non-existent keys', () => {
      const result = SimpleCache.get('nonExistentKey');
      
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove a key from cache', () => {
      SimpleCache.set('keyToDelete', 'value');
      
      SimpleCache.delete('keyToDelete');
      
      expect(SimpleCache.get('keyToDelete')).toBeNull();
    });
  });

  describe('flush', () => {
    it('should clear all cached values', () => {
      SimpleCache.set('key1', 'value1');
      SimpleCache.set('key2', 'value2');
      
      SimpleCache.flush();
      
      expect(SimpleCache.get('key1')).toBeNull();
      expect(SimpleCache.get('key2')).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', () => {
      // Create a cache with very short TTL for testing
      const cache = SimpleCache.cache;
      
      // Manually set an expired entry
      cache.set('expiredKey', {
        value: 'expiredValue',
        expiry: Date.now() - 1000 // Expired 1 second ago
      });
      
      const result = SimpleCache.get('expiredKey');
      
      expect(result).toBeNull();
    });
  });
});
