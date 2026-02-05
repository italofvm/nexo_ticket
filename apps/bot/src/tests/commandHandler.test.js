const { loadCommands, registerCommands } = require('../utils/commandHandler');
const fs = require('fs');
const path = require('path');
const { Collection, REST } = require('discord.js');

// Mock dependencies
jest.mock('fs');
jest.mock('../utils/logger');
jest.mock('../config', () => ({
  token: 'mock-token',
  clientId: 'mock-client-id',
  guildId: 'mock-guild-id',
  environment: 'development'
}));

// Mock REST separately to have control
jest.mock('discord.js', () => {
  const actual = jest.requireActual('discord.js');
  return {
    ...actual,
    Collection: actual.Collection,
    REST: jest.fn().mockImplementation(() => ({
      setToken: jest.fn().mockReturnThis(),
      put: jest.fn().mockResolvedValue([])
    })),
    Routes: {
      applicationGuildCommands: jest.fn().mockReturnValue('/mock-route'),
      applicationCommands: jest.fn().mockReturnValue('/mock-route')
    }
  };
});

describe('CommandHandler', () => {
  let mockClient;
  const realPath = jest.requireActual('path');

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      commands: new Collection(),
    };
  });

  describe('loadCommands', () => {
    it('should warn if commands directory does not exist', () => {
      const logger = require('../utils/logger');
      fs.existsSync.mockReturnValue(false);
      
      loadCommands(mockClient);
      
      expect(logger.warn).toHaveBeenCalledWith('Commands directory not found.');
    });

    it('should attempt to read commands directory when it exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);
      
      loadCommands(mockClient);
      
      expect(fs.readdirSync).toHaveBeenCalled();
    });
  });

  describe('registerCommands', () => {
    it('should call REST API to register commands', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);
      fs.statSync.mockReturnValue({ isDirectory: () => false });

      await registerCommands();

      expect(REST).toHaveBeenCalled();
    });
  });
});
