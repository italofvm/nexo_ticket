const {
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { getPanelByChannel } = require('../database/panelQueries');
const { hasOpenTicket, createTicket, getStaffRoles } = require('../database/ticketQueries');
const { getGuildConfig } = require('../database/repositories/configRepository');
const { logAction } = require('../utils/logHandler');
const { incMetric } = require('./metrics');
const { updateTicketStatus, TICKET_CATEGORIES } = require('./ticketStatusManager');
const logger = require('./logger');

const cooldowns = new Map();

const handleTicketButton = async (interaction) => {
  if (!interaction.customId.startsWith('open_ticket_')) return;

  const panelChannelId = interaction.customId.replace('open_ticket_', '');
  const guild = interaction.guild;
  const user = interaction.user;

  const lastUsed = cooldowns.get(user.id);
  if (lastUsed && Date.now() - lastUsed < 30000) {
    return interaction.reply({ content: 'Por favor, aguarde alguns segundos antes de abrir outro ticket.', flags: [MessageFlags.Ephemeral] });
  }

  try {
    const alreadyOpen = await hasOpenTicket(user.id, guild.id);
    if (alreadyOpen) return interaction.reply({ content: 'Você já possui um ticket aberto neste servidor.', flags: [MessageFlags.Ephemeral] });

    const panel = await getPanelByChannel(panelChannelId);
    if (!panel) return interaction.reply({ content: 'Configuração do painel não encontrada.', flags: [MessageFlags.Ephemeral] });

    const isSupport = panel.title.toLowerCase().includes('suporte');

    if (isSupport) {
      const modal = new ModalBuilder()
        .setCustomId(`ticket_initial_questions_${panelChannelId}`)
        .setTitle('Central de Suporte');

      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Qual o motivo do seu contato?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Descrição detalhada do problema/dúvida.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(reasonInput),
        new ActionRowBuilder().addComponents(descriptionInput)
      );

      await interaction.showModal(modal);
    } else {
      const modal = new ModalBuilder()
        .setCustomId(`ticket_initial_questions_${panelChannelId}`)
        .setTitle('Informações do Projeto');

      const serviceInput = new TextInputBuilder()
        .setCustomId('service')
        .setLabel('Qual serviço você deseja?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const goalInput = new TextInputBuilder()
        .setCustomId('goal')
        .setLabel('Qual o objetivo do projeto?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const deadlineInput = new TextInputBuilder()
        .setCustomId('deadline')
        .setLabel('Prazo desejado?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const budgetInput = new TextInputBuilder()
        .setCustomId('budget')
        .setLabel('Orçamento aproximado?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const referencesInput = new TextInputBuilder()
        .setCustomId('references')
        .setLabel('Referências (se houver)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(serviceInput),
        new ActionRowBuilder().addComponents(goalInput),
        new ActionRowBuilder().addComponents(deadlineInput),
        new ActionRowBuilder().addComponents(budgetInput),
        new ActionRowBuilder().addComponents(referencesInput)
      );

      await interaction.showModal(modal);
    }
  } catch (err) {
    logger.error('Error showing ticket modal: %o', err);
    await interaction.reply({ content: 'Ocorreu um erro ao tentar abrir o formulário.', flags: [MessageFlags.Ephemeral] }).catch(() => {});
  }
};

const handleTicketModal = async (interaction) => {
  if (!interaction.customId.startsWith('ticket_initial_questions_')) return;

  const panelChannelId = interaction.customId.replace('ticket_initial_questions_', '');
  const guild = interaction.guild;
  const user = interaction.user;

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  // Cooldown check again for submission
  const lastUsed = cooldowns.get(user.id);
  if (lastUsed && Date.now() - lastUsed < 5000) {
      return interaction.editReply('Por favor, aguarde um momento.');
  }
  cooldowns.set(user.id, Date.now());

  try {
    const panel = await getPanelByChannel(panelChannelId);
    if (!panel) return interaction.editReply('Configuração do painel não encontrada.');

    const isSupport = panel.title.toLowerCase().includes('suporte');
    let infoEmbed;

    if (isSupport) {
      const reason = interaction.fields.getTextInputValue('reason');
      const description = interaction.fields.getTextInputValue('description');

      infoEmbed = new EmbedBuilder()
        .setTitle('📋 Detalhes do Suporte')
        .setColor(panel.color || '#0099ff')
        .addFields(
          { name: '❓ Motivo', value: reason },
          { name: '📝 Descrição', value: description }
        )
        .setTimestamp();
    } else {
      const service = interaction.fields.getTextInputValue('service');
      const goal = interaction.fields.getTextInputValue('goal');
      const deadline = interaction.fields.getTextInputValue('deadline');
      const budget = interaction.fields.getTextInputValue('budget');
      const references = interaction.fields.getTextInputValue('references') || 'Nenhuma informada';

      infoEmbed = new EmbedBuilder()
        .setTitle('📋 Informações do Projeto')
        .setColor(panel.color || '#0099ff')
        .addFields(
          { name: '🛠 Serviço', value: service, inline: true },
          { name: '🎯 Objetivo', value: goal },
          { name: '⏳ Prazo', value: deadline, inline: true },
          { name: '💰 Orçamento', value: budget, inline: true },
          { name: '🔗 Referências', value: references }
        )
        .setTimestamp();
    }

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

    const botPermissions = guild.members.me.permissions;
    if (!botPermissions.has(PermissionFlagsBits.ManageChannels) || !botPermissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply('O bot não possui as permissões necessárias.');
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

    let finalCategoryId = category.id;
    const hasAbertoConfig = TICKET_CATEGORIES.ABERTO && TICKET_CATEGORIES.ABERTO !== 'ID_DA_CATEGORIA_ABERTO';
    
    if (hasAbertoConfig) {
      finalCategoryId = TICKET_CATEGORIES.ABERTO;
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username.substring(0, 15)}`,
      type: ChannelType.GuildText,
      parent: finalCategoryId,
      permissionOverwrites: permissionOverwrites,
    });

    if (hasAbertoConfig) {
      await updateTicketStatus(ticketChannel, 'ABERTO', interaction).catch(err => {
        logger.error('Failed to sync TICKET_ABERTO category permissions: %o', err);
      });
    }

    // Role Management: Add Client Role, Remove Visitor Role
    try {
      if (config.client_role_id) {
        await interaction.member.roles.add(config.client_role_id).catch(e => logger.warn(`Failed to add client role: ${e.message}`));
      }
      if (config.visitor_role_id) {
        await interaction.member.roles.remove(config.visitor_role_id).catch(e => logger.warn(`Failed to remove visitor role: ${e.message}`));
      }
    } catch (roleErr) {
      logger.error('Error managing roles on ticket creation: %o', roleErr);
    }

    const ticket = await createTicket({
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: user.id,
      panelId: panel.id,
      categoryId: category.id
    });

    let welcomeMsg = config.welcome_message 
        ? config.welcome_message.replace('{user}', `${user}`)
        : `Olá ${user}, nossa equipe foi notificada e em breve você será atendido.`;

    const welcomeEmbed = new EmbedBuilder()
      .setTitle('Boas-vindas ao seu Ticket')
      .setDescription(welcomeMsg)
      .setColor(panel.color || '#0099ff')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_accept_${ticketChannel.id}`).setLabel('Aceitar').setStyle(ButtonStyle.Primary).setEmoji('✅'),
      new ButtonBuilder().setCustomId(`ticket_transfer_menu_${ticketChannel.id}`).setLabel('Transferir').setStyle(ButtonStyle.Secondary).setEmoji('📤'),
      new ButtonBuilder().setCustomId(`ticket_close_${ticketChannel.id}`).setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );

    await ticketChannel.send({ 
      content: `${user} ${staffRoleIds.map(id => `<@&${id}>`).join(' ')}`,
      embeds: [welcomeEmbed, infoEmbed], 
      components: [row] 
    });

    incMetric('ticketsOpened');
    await logAction(guild, 'TICKET_CREATE', user, { channel: ticketChannel, id: ticket.id });

    return interaction.editReply(`Ticket criado com sucesso em ${ticketChannel}!`);

  } catch (err) {
    incMetric('errorsCount');
    logger.error('Error processing ticket modal: %o', err);
    return interaction.editReply(`Ocorreu um erro ao processar o seu ticket: ${err.message}`);
  }
};

module.exports = { handleTicketButton, handleTicketModal };
