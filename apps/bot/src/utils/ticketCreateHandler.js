const {
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  PermissionFlagsBits,
  ChannelType,
  MessageFlags
} = require('discord.js');
const { getPanelByChannel } = require('../database/panelQueries');
const { hasOpenTicket, createTicket, getStaffRoles } = require('../database/ticketQueries');
const { getGuildConfig } = require('../database/repositories/configRepository');
const { getCategoryById } = require('../database/categoryQueries');
const { logAction } = require('./logHandler');
const { incMetric } = require('./metrics');
const { updateTicketStatus, TICKET_CATEGORIES } = require('./ticketStatusManager');
const logger = require('./logger');

const cooldowns = new Map();

/**
 * Handle category selection from dropdown menu and create ticket immediately.
 */
const handleCategorySelect = async (interaction) => {
  if (!interaction.customId.startsWith('category_select_')) return;

  const panelChannelId = interaction.customId.replace('category_select_', '');
  const guild = interaction.guild;
  const user = interaction.user;
  const selectedValue = interaction.values[0];

  // Performance metrics
  incMetric('interactionsCount');

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  // Cooldown check
  const lastUsed = cooldowns.get(user.id);
  if (lastUsed && Date.now() - lastUsed < 10000) {
    return interaction.editReply('Por favor, aguarde alguns segundos antes de abrir outro ticket.');
  }
  cooldowns.set(user.id, Date.now());

  try {
    const alreadyOpen = await hasOpenTicket(user.id, guild.id);
    if (alreadyOpen) {
      return interaction.editReply('Você já possui um ticket aberto neste servidor.');
    }

    const panel = await getPanelByChannel(panelChannelId);
    if (!panel) {
      return interaction.editReply('Configuração do painel não encontrada.');
    }

    // Extract category ID from value (format: cat_123)
    const categoryId = parseInt(selectedValue.replace('cat_', ''), 10);
    const category = await getCategoryById(categoryId);
    
    if (!category) {
      return interaction.editReply('Categoria não encontrada. O painel pode estar desatualizado.');
    }

    const config = await getGuildConfig(guild.id);
    
    // Resolve which Discord Category to use
    let targetCategoryId = panel.category_id;
    const globalAbertoId = TICKET_CATEGORIES.ABERTO && TICKET_CATEGORIES.ABERTO !== 'ID_DA_CATEGORIA_ABERTO' 
      ? TICKET_CATEGORIES.ABERTO 
      : null;

    if (!targetCategoryId || targetCategoryId === 'null') {
      targetCategoryId = globalAbertoId;
    }

    if (!targetCategoryId) {
      logger.error('No category configured for panel %s or globally.', panel.id);
      return interaction.editReply('Nenhuma categoria de tickets foi configurada para este painel.');
    }

    let discordCategory;
    try {
      discordCategory = await guild.channels.fetch(targetCategoryId).catch(() => null);
    } catch (fetchErr) {
      logger.error('Failed to fetch category %s: %s', targetCategoryId, fetchErr.message);
    }
    
    if (!discordCategory || discordCategory.type !== ChannelType.GuildCategory) {
      // One last try: if panel-specific failed, try global fallback
      if (targetCategoryId !== globalAbertoId && globalAbertoId) {
        logger.warn('Panel category %s invalid, trying global fallback %s', targetCategoryId, globalAbertoId);
        targetCategoryId = globalAbertoId;
        discordCategory = await guild.channels.fetch(targetCategoryId).catch(() => null);
      }
    }

    if (!discordCategory || discordCategory.type !== ChannelType.GuildCategory) {
      logger.warn('Invalid category ID %s on guild %s', targetCategoryId, guild.id);
      return interaction.editReply('A categoria de tickets não existe ou é inválida no seu servidor.');
    }

    if (discordCategory.children.cache.size >= 50) {
      return interaction.editReply('A categoria de tickets está cheia. Por favor, contate um administrador.');
    }

    const botPermissions = guild.members.me.permissions;
    if (!botPermissions.has(PermissionFlagsBits.ManageChannels) || !botPermissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply('O bot não possui as permissões necessárias para criar canais.');
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

    const finalCategoryId = discordCategory.id;

    // Create channel with category prefix
    const categoryPrefix = category.name.substring(0, 10);
    const ticketChannel = await guild.channels.create({
      name: `${categoryPrefix}-${user.username.substring(0, 12)}`,
      type: ChannelType.GuildText,
      parent: finalCategoryId,
      permissionOverwrites: permissionOverwrites,
    });

    // Sync permissions if it's the ABERTO category
    if (globalAbertoId && finalCategoryId === globalAbertoId) {
      await updateTicketStatus(ticketChannel, 'ABERTO', interaction).catch(err => {
        logger.error('Failed to sync TICKET_ABERTO category permissions: %o', err);
      });
    }

    // Role Management
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
      categoryId: discordCategory.id,
      ticketCategoryId: category.id
    });

    let welcomeMsg = config.welcome_message 
      ? config.welcome_message.replace('{user}', `${user}`)
      : `Olá ${user}, nossa equipe foi notificada e em breve você será atendido.`;

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 ${category.label}`)
      .setDescription(welcomeMsg)
      .setColor(panel.color || '#9d32ff')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_accept_${ticketChannel.id}`).setLabel('Aceitar').setStyle(ButtonStyle.Primary).setEmoji('✅'),
      new ButtonBuilder().setCustomId(`ticket_transfer_menu_${ticketChannel.id}`).setLabel('Transferir').setStyle(ButtonStyle.Secondary).setEmoji('📤'),
      new ButtonBuilder().setCustomId(`ticket_close_${ticketChannel.id}`).setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );

    await ticketChannel.send({ 
      content: `${user} ${staffRoleIds.map(id => `<@&${id}>`).join(' ')}`,
      embeds: [welcomeEmbed], 
      components: [row] 
    });

    incMetric('ticketsOpened');
    await logAction(guild, 'TICKET_CREATE', user, { 
      channel: ticketChannel, 
      id: ticket.id,
      category: category.label
    });

    return interaction.editReply(`Ticket criado com sucesso em ${ticketChannel}!`);

  } catch (err) {
    incMetric('errorsCount');
    logger.error('Error in handleCategorySelect: %o', err);
    return interaction.editReply(`Ocorreu um erro ao processar o seu ticket: ${err.message}`);
  }
};

/**
 * Legacy support for old panels (if any)
 */
const handleTicketButton = async (interaction) => {
  if (!interaction.customId.startsWith('open_ticket_')) return;
  // Let people know buttons are deprecated or just redirect to same logic if possible
  await interaction.reply({ content: 'Use o menu dropdown para abrir um ticket.', flags: [MessageFlags.Ephemeral] });
};

module.exports = { 
  handleTicketButton, 
  handleCategorySelect
};
