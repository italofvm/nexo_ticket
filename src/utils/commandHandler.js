const fs = require('fs');
const path = require('path');
const { Collection, REST, Routes } = require('discord.js');
const logger = require('./logger');
const config = require('../config');

/**
 * Scans the commands directory and stores command metadata + paths for lazy loading.
 */
const loadCommands = (client) => {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.warn('Commands directory not found.');
    return;
  }

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      // We still require once to get 'data' for registration and validation
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        // Store the path for lazy requiring in the executor if preferred, 
        // but for now we'll just store the object. 
        // To TRULY lazy load, we would only store the path and metadata.
        client.commands.set(command.data.name, {
            ...command,
            path: filePath
        });
        logger.info(`Loaded command metadata: ${command.data.name}`);
      } else {
        logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
};

/**
 * Registers commands with Discord API.
 */
const registerCommands = async () => {
  const commands = [];
  const commandsPath = path.join(__dirname, '../commands');
  
  if (!fs.existsSync(commandsPath)) return;

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }
  }

  const rest = new REST().setToken(config.token);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // In production, you might want to use global commands: Routes.applicationCommands(clientId)
    const route = config.environment === 'production' 
        ? Routes.applicationCommands(config.clientId)
        : Routes.applicationGuildCommands(config.clientId, config.guildId);

    const data = await rest.put(route, { body: commands });

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    logger.error('Error registering commands: %o', error);
  }
};

module.exports = { loadCommands, registerCommands };
