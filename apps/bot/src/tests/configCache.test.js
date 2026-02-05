const { setCache, getCache, invalidateCache } = require('../utils/configCache');

jest.mock('../utils/logger');

describe('ConfigCache', () => {
  const mockGuildId = '123456789';

  beforeEach(() => {
    // Clear cache by invalidating all entries for the test guild
    invalidateCache(mockGuildId);
  });

  describe('setCache and getCache', () => {
    it('should store and retrieve typed cache values', () => {
      const configData = { prefix: '!', language: 'pt-BR' };
      
      setCache(mockGuildId, 'config', configData);
      const result = getCache(mockGuildId, 'config');
      
      expect(result).toEqual(configData);
    });

    it('should return null for non-existent cache', () => {
      const result = getCache(mockGuildId, 'nonexistent');
      
      expect(result).toBeNull();
    });

    it('should store different types separately', () => {
      setCache(mockGuildId, 'config', { type: 'config' });
      setCache(mockGuildId, 'staff', { type: 'staff' });
      
      expect(getCache(mockGuildId, 'config')).toEqual({ type: 'config' });
      expect(getCache(mockGuildId, 'staff')).toEqual({ type: 'staff' });
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate specific type cache', () => {
      setCache(mockGuildId, 'config', { data: 'test' });
      setCache(mockGuildId, 'staff', { data: 'staff' });
      
      invalidateCache(mockGuildId, 'config');
      
      expect(getCache(mockGuildId, 'config')).toBeNull();
      expect(getCache(mockGuildId, 'staff')).toEqual({ data: 'staff' });
    });

    it('should invalidate all cache for a guild when type is null', () => {
      setCache(mockGuildId, 'config', { data: 'config' });
      setCache(mockGuildId, 'staff', { data: 'staff' });
      
      invalidateCache(mockGuildId, null);
      
      expect(getCache(mockGuildId, 'config')).toBeNull();
      expect(getCache(mockGuildId, 'staff')).toBeNull();
    });
  });
});
