const { loadEvents } = require('../utils/eventHandler');
const fs = require('fs');

jest.mock('fs');
jest.mock('../utils/logger');

// Mock the database module to prevent connection attempts
jest.mock('../database/index', () => ({
  sql: jest.fn(),
  query: jest.fn()
}));

// Mock configRepository to prevent database access
jest.mock('../database/repositories/configRepository', () => ({
  getGuildConfig: jest.fn().mockResolvedValue(null),
  setGuildConfig: jest.fn().mockResolvedValue(null)
}));

describe('EventHandler', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      on: jest.fn(),
      once: jest.fn()
    };
  });

  it('should warn if events directory does not exist', () => {
    const logger = require('../utils/logger');
    fs.existsSync.mockReturnValue(false);
    
    loadEvents(mockClient);
    
    expect(logger.warn).toHaveBeenCalledWith('Events directory not found.');
  });

  it('should read events directory when it exists', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    
    loadEvents(mockClient);
    
    expect(fs.readdirSync).toHaveBeenCalled();
  });
});
