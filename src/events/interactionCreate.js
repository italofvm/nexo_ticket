const logger = require('../utils/logger');
const { incMetric } = require('../utils/metrics');

const interactionCooldowns = new Map();
const COOLDOWN_TIME = 1000; // 1 second debounce for interactions

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // 1. Debounce system for buttons and menus
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        const cooldownKey = `${interaction.user.id}_${interaction.customId}`;
        const lastUsed = interactionCooldowns.get(cooldownKey);
        
        if (lastUsed && Date.now() - lastUsed < COOLDOWN_TIME) {
            return; // Ignore spam
        }
        interactionCooldowns.set(cooldownKey, Date.now());
        
        // Cleanup old cooldowns occasionally
        if (interactionCooldowns.size > 1000) {
            const now = Date.now();
            for (const [key, time] of interactionCooldowns.entries()) {
                if (now - time > COOLDOWN_TIME) interactionCooldowns.delete(key);
            }
        }
    }

    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        incMetric('commandsExecuted');
        await command.execute(interaction);
      } catch (error) {
        incMetric('errorsCount');
        logger.error(`Error executing command ${interaction.commandName}: %o`, error);
        await this.handleError(interaction);
      }
    } else if (interaction.isButton()) {
      const { handleTicketButton } = require('../utils/ticketCreateHandler');
      const { handleTicketAction } = require('../utils/ticketActionsHandler');
      const { handleRatingClick } = require('../utils/ratingHandler');

      try {
        if (interaction.customId.startsWith('open_ticket_')) {
          await handleTicketButton(interaction);
        } else if (interaction.customId.startsWith('ticket_')) {
          await handleTicketAction(interaction);
        } else if (interaction.customId.startsWith('rate_')) {
          await handleRatingClick(interaction);
        }
      } catch (error) {
          incMetric('errorsCount');
          logger.error('Error handling button interaction: %o', error);
      }
    } else if (interaction.isModalSubmit()) {
      const { handleTicketAction } = require('../utils/ticketActionsHandler');
      const { handleRatingSubmit } = require('../utils/ratingHandler');

      try {
        if (interaction.customId.startsWith('ticket_')) {
          await handleTicketAction(interaction);
        } else if (interaction.customId.startsWith('rating_modal_')) {
          await handleRatingSubmit(interaction);
        }
      } catch (error) {
          incMetric('errorsCount');
          logger.error('Error handling modal submission: %o', error);
      }
    } else if (interaction.isStringSelectMenu()) {
        const { handleTicketAction } = require('../utils/ticketActionsHandler');
        try {
            if (interaction.customId.startsWith('ticket_')) {
                await handleTicketAction(interaction);
            }
        } catch (error) {
            incMetric('errorsCount');
            logger.error('Error handling select menu: %o', error);
        }
    }
  },

  async handleError(interaction) {
    const msg = 'Houve um erro ao executar essa operação!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  },
};
