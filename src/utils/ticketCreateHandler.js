const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const { getPanelByChannel } = require('../database/panelQueries');
const { hasOpenTicket, createTicket, getStaffRoles } = require('../database/ticketQueries');
const { getGuildConfig } = require('../database/repositories/configRepository');
const { logAction } = require('../utils/logHandler');
const { incMetric } = require('./metrics');
const logger = require('./logger');

const cooldowns = new Map();

const handleTicketButton = async (interaction) => {
  if (!interaction.customId.startsWith('open_ticket_')) return;

  const panelChannelId = interaction.customId.replace('open_ticket_', '');
  const guild = interaction.guild;
  const user = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  const lastUsed = cooldowns.get(user.id);
  if (lastUsed && Date.now() - lastUsed < 30000) {
    return interaction.editReply('Por favor, aguarde alguns segundos antes de abrir outro ticket.');
  }
  cooldowns.set(user.id, Date.now());

  try {
    const panel = await getPanelByChannel(panelChannelId);
    if (!panel) return interaction.editReply('Configuração do painel não encontrada.');

    const alreadyOpen = await hasOpenTicket(user.id, guild.id);
    if (alreadyOpen) return interaction.editReply('Você já possui um ticket aberto neste servidor.');

    const config = await getGuildConfig(guild.id);

    const categoryId = panel.category_id;
    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.editReply('A categoria de tickets não existe ou é inválida.');
    }

    if (category.children.cache.size >= 50) {
      return interaction.editReply('A categoria de tickets está cheia. Por favor, contate um administrador.');
    }

    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply('O bot não tem permissão para criar canais (`MANAGE_CHANNELS`).');
    }

    const staffRoleIds = await getStaffRoles(guild.id);
    
    const permissionOverwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
    ];

    staffRoleIds.forEach(roleId => {
      permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
    });

    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username.substring(0, 15)}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissionOverwrites,
    });

    const ticket = await createTicket({
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: user.id,
      panelId: panel.id,
      categoryId: category.id
    });

    let welcomeMsg = config.welcome_message 
        ? config.welcome_message.replace('{user}', `${user}`)
        : `Olá ${user}, nossa equipe foi notificada e em breve você será atendido.\nPor favor, descreva o seu problema antecipadamente.`;

    const embed = new EmbedBuilder()
      .setTitle('Boas-vindas ao seu Ticket')
      .setDescription(welcomeMsg)
      .setColor(panel.color || '#0099ff')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${ticketChannel.id}`).setLabel('Assumir').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'),
      new ButtonBuilder().setCustomId(`ticket_transfer_menu_${ticketChannel.id}`).setLabel('Transferir').setStyle(ButtonStyle.Secondary).setEmoji('📤'),
      new ButtonBuilder().setCustomId(`ticket_close_${ticketChannel.id}`).setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );

    await ticketChannel.send({ 
      content: `${user}, seu ticket foi aberto! ${staffRoleIds.map(id => `<@&${id}>`).join(' ')}`,
      embeds: [embed], 
      components: [row] 
    });

    incMetric('ticketsOpened');
    await logAction(guild, 'TICKET_CREATE', user, { channel: ticketChannel, id: ticket.id });

    logger.info(`Ticket channel ${ticketChannel.id} created for user ${user.id}`);
    return interaction.editReply(`Ticket criado com sucesso em ${ticketChannel}!`);

  } catch (err) {
    incMetric('errorsCount');
    logger.error('Error creating ticket: %s', err.message);
    return interaction.editReply('Ocorreu um erro ao tentar criar o seu ticket.');
  }
};

module.exports = { handleTicketButton };
