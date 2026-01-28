const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error('Error executing command %s: %o', interaction.commandName, error);
        await this.handleError(interaction);
      }
    } else if (interaction.isButton()) {
      const { handleTicketButton } = require('../utils/ticketCreateHandler');
      const { handleTicketAction } = require('../utils/ticketActionsHandler');

      if (interaction.customId.startsWith('open_ticket_')) {
        await handleTicketButton(interaction);
      } else if (interaction.customId.startsWith('ticket_')) {
        await handleTicketAction(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      const { handleTicketAction } = require('../utils/ticketActionsHandler');
      if (interaction.customId.startsWith('ticket_')) {
        await handleTicketAction(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
        const { handleTicketAction } = require('../utils/ticketActionsHandler');
        if (interaction.customId.startsWith('ticket_')) {
            await handleTicketAction(interaction);
        }
    }
  },

  async handleError(interaction) {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Houve um erro ao executar essa operação!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Houve um erro ao executar essa operação!', ephemeral: true });
    }
  },
};
