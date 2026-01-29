const { MessageFlags } = require('discord.js');
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
            // Respond to interaction to avoid "Interaction failed"
            const msg = 'Você está clicando muito rápido! Aguarde um segundo.';
            if (interaction.isModalSubmit()) {
                await interaction.reply({ content: msg, flags: [MessageFlags.Ephemeral] }).catch(() => {});
            } else {
                await interaction.reply({ content: msg, flags: [MessageFlags.Ephemeral] }).catch(() => {});
            }
            return;
        }
        interactionCooldowns.set(cooldownKey, Date.now());
        
        // Cleanup old cooldowns occasionally (simplified)
        if (interactionCooldowns.size > 1000) {
            const now = Date.now();
            for (const [key, time] of interactionCooldowns.entries()) {
                if (now - time > COOLDOWN_TIME * 10) interactionCooldowns.delete(key);
            }
        }
    }

    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          logger.warn(`No command matching ${interaction.commandName} was found.`);
          return await interaction.reply({ content: 'Comando não encontrado.', flags: [MessageFlags.Ephemeral] });
        }

        incMetric('commandsExecuted');
        await command.execute(interaction);
      } else if (interaction.isButton()) {
        const { handleTicketButton } = require('../utils/ticketCreateHandler');
        const { handleTicketAction } = require('../utils/ticketActionsHandler');
        const { handleRatingClick } = require('../utils/ratingHandler');

        if (interaction.customId.startsWith('open_ticket_')) {
          await handleTicketButton(interaction);
        } else if (interaction.customId.startsWith('ticket_')) {
          await handleTicketAction(interaction);
        } else if (interaction.customId.startsWith('rate_')) {
          await handleRatingClick(interaction);
        } else {
            // Fallback for unknown buttons
            await interaction.reply({ content: 'Ação não reconhecida.', flags: [MessageFlags.Ephemeral] });
        }
      } else if (interaction.isModalSubmit()) {
        const { handleTicketAction } = require('../utils/ticketActionsHandler');
        const { handleRatingSubmit } = require('../utils/ratingHandler');
        const { handleTicketModal } = require('../utils/ticketCreateHandler');

        if (interaction.customId.startsWith('ticket_initial_questions_')) {
          await handleTicketModal(interaction);
        } else if (interaction.customId.startsWith('ticket_')) {
          await handleTicketAction(interaction);
        } else if (interaction.customId.startsWith('rating_modal_')) {
          await handleRatingSubmit(interaction);
        }
      } else if (interaction.isStringSelectMenu()) {
          const { handleTicketAction } = require('../utils/ticketActionsHandler');
          if (interaction.customId.startsWith('ticket_')) {
              await handleTicketAction(interaction);
          }
      }
    } catch (error) {
        incMetric('errorsCount');
        logger.error(`Error handling interaction ${interaction.customId || interaction.commandName}: %o`, error);
        await this.handleError(interaction);
    }
  },

  async handleError(interaction) {
    const msg = 'Houve um erro ao executar essa operação!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, flags: [MessageFlags.Ephemeral] }).catch(() => {});
    } else {
      await interaction.reply({ content: msg, flags: [MessageFlags.Ephemeral] }).catch(() => {});
    }
  },
};
