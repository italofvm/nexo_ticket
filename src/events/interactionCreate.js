const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error('Error executing command %s: %o', interaction.commandName, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
      }
    }
  },
};
