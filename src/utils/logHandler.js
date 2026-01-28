const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../database/repositories/configRepository');
const logger = require('./logger');

/**
 * Handles action logging to the configured log channel.
 */
const logAction = async (guild, action, performer, data = {}) => {
  try {
    const config = await getGuildConfig(guild.id);
    if (!config || !config.log_channel_id) return;

    const logChannel = await guild.channels.fetch(config.log_channel_id).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: `Performer ID: ${performer.id}` });

    let color = '#7289da';
    let title = 'Log de Auditoria';
    let description = '';

    switch (action) {
      case 'TICKET_CREATE':
        color = '#2ecc71';
        title = '🎫 Ticket Criado';
        description = `**Ticket:** ${data.channel}\n**Usuário:** ${performer}\n**ID:** ${data.id}`;
        break;
      case 'TICKET_CLOSE':
        color = '#f1c40f';
        title = '🔒 Ticket Fechado';
        description = `**Ticket:** #${data.number}\n**Fechado por:** ${performer}\n**Duração:** ${data.duration}`;
        break;
      case 'TICKET_DELETE':
        color = '#e74c3c';
        title = '🗑️ Ticket Deletado';
        description = `**Ticket:** #${data.number}\n**Deletado por:** ${performer}\n**Usuário:** <@${data.userId}>`;
        break;
      case 'TICKET_CLAIM':
        color = '#3498db';
        title = '✋ Ticket Assumido';
        description = `**Ticket:** ${data.channel}\n**Staff:** ${performer}`;
        break;
      case 'TICKET_TRANSFER':
        color = '#9b59b6';
        title = '📤 Ticket Transferido';
        description = `**Ticket:** ${data.channel}\n**De:** ${performer}\n**Para:** <@${data.newStaffId}>`;
        break;
      case 'CONFIG_UPDATE':
        color = '#34495e';
        title = '⚙️ Configuração Alterada';
        description = `**Alterado por:** ${performer}\n**Configurações:** ${data.changes}`;
        break;
    }

    embed.setColor(color).setTitle(title).setDescription(description);

    await logChannel.send({ embeds: [embed], files: data.files || [] });
  } catch (err) {
    logger.error('Error in logAction: %o', err);
  }
};

module.exports = { logAction };
