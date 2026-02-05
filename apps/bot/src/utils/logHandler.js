const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../database/repositories/configRepository');
const logger = require('./logger');

/**
 * Mapping of actions to their preferred log channel.
 * Falls back to log_channel_id if specific channel not configured.
 */
const LOG_ROUTING = {
  // Ticket logs
  'TICKET_CREATE': 'log_channel_tickets',
  'TICKET_CLOSE': 'log_channel_tickets',
  'TICKET_DELETE': 'log_channel_tickets',
  'TICKET_CLAIM': 'log_channel_tickets',
  'TICKET_TRANSFER': 'log_channel_tickets',
  'TICKET_ACCEPT': 'log_channel_tickets',
  
  // Member logs
  'MEMBER_JOIN': 'log_channel_members',
  'MEMBER_LEAVE': 'log_channel_members',
  
  // Sales logs
  'SALE_COMPLETE': 'log_channel_sales',
  'PAYMENT_RECEIVED': 'log_channel_sales',
  'PROJECT_DELIVERED': 'log_channel_sales',
  
  // Moderation logs
  'CONFIG_UPDATE': 'log_channel_moderation',
  'PANEL_CREATE': 'log_channel_moderation',
  'PANEL_DELETE': 'log_channel_moderation',
  'CATEGORY_ADD': 'log_channel_moderation',
  'CATEGORY_REMOVE': 'log_channel_moderation',
  
  // General (default fallback)
  'GENERAL': 'log_channel_general'
};

/**
 * Gets the appropriate log channel for an action.
 */
const getLogChannel = async (guild, config, action) => {
  // Priority: specific channel -> fallback to log_channel_id
  const specificChannelKey = LOG_ROUTING[action] || 'log_channel_general';
  const specificChannelId = config[specificChannelKey];
  
  if (specificChannelId) {
    const channel = await guild.channels.fetch(specificChannelId).catch(() => null);
    if (channel) return channel;
  }
  
  // Fallback to general log channel
  if (config.log_channel_id) {
    return await guild.channels.fetch(config.log_channel_id).catch(() => null);
  }
  
  return null;
};

/**
 * Handles action logging to the configured log channel.
 */
const logAction = async (guild, action, performer, data = {}) => {
  try {
    const config = await getGuildConfig(guild.id);
    if (!config) return;
    
    const logChannel = await getLogChannel(guild, config, action);
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
      if (data.category) description += `\n**Categoria:** ${data.category}`;
      break;
    case 'MEMBER_JOIN':
      color = '#2ecc71';
      title = '📥 Membro Entrou';
      description = `**Usuário:** ${performer}\n**Tag:** ${data.memberTag}\n**ID:** ${data.memberId}`;
      if (data.accountCreated) description += `\n**Conta criada em:** <t:${Math.floor(new Date(data.accountCreated).getTime() / 1000)}:R>`;
      break;
    case 'MEMBER_LEAVE':
      color = '#e74c3c';
      title = '📤 Membro Saiu';
      description = `**Usuário:** ${performer}\n**Tag:** ${data.memberTag}\n**ID:** ${data.memberId}`;
      if (data.joinedAt) description += `\n**Estava no servidor desde:** <t:${Math.floor(new Date(data.joinedAt).getTime() / 1000)}:R>`;
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
    case 'TICKET_ACCEPT':
      color = '#27ae60';
      title = '✅ Projeto Aceito';
      description = `**Ticket:** ${data.channel}\n**Aceito por:** ${performer}`;
      break;
    case 'CONFIG_UPDATE':
      color = '#34495e';
      title = '⚙️ Configuração Alterada';
      description = `**Alterado por:** ${performer}\n**Configurações:** ${data.changes}`;
      break;
    case 'SALE_COMPLETE':
      color = '#2ecc71';
      title = '💰 Venda Concluída';
      description = `**Ticket:** ${data.channel}\n**Staff:** ${performer}\n**Valor:** ${data.amount || 'N/A'}`;
      break;
    case 'PAYMENT_RECEIVED':
      color = '#27ae60';
      title = '💵 Pagamento Recebido';
      description = `**Ticket:** ${data.channel}\n**Usuário:** ${performer}\n**Valor:** ${data.amount || 'N/A'}`;
      break;
    case 'PROJECT_DELIVERED':
      color = '#3498db';
      title = '📦 Projeto Entregue';
      description = `**Ticket:** ${data.channel}\n**Entregue por:** ${performer}`;
      break;
    case 'PANEL_CREATE':
      color = '#9b59b6';
      title = '📋 Painel Criado';
      description = `**Canal:** ${data.channel}\n**Criado por:** ${performer}`;
      break;
    case 'PANEL_DELETE':
      color = '#e74c3c';
      title = '🗑️ Painel Removido';
      description = `**Canal:** ${data.channel}\n**Removido por:** ${performer}`;
      break;
    case 'CATEGORY_ADD':
      color = '#2ecc71';
      title = '➕ Categoria Adicionada';
      description = `**Categoria:** ${data.name}\n**Adicionada por:** ${performer}`;
      break;
    case 'CATEGORY_REMOVE':
      color = '#e74c3c';
      title = '➖ Categoria Removida';
      description = `**Categoria:** ${data.name}\n**Removida por:** ${performer}`;
      break;
    default:
      title = `📝 ${action}`;
      description = `**Ação:** ${action}\n**Por:** ${performer}`;
    }

    embed.setColor(color).setTitle(title).setDescription(description);

    await logChannel.send({ embeds: [embed], files: data.files || [] });
  } catch (err) {
    logger.error('Error in logAction: %o', err);
  }
};

module.exports = { logAction, LOG_ROUTING };
