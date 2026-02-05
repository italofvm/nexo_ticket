const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ChannelType,
  MessageFlags,
  StringSelectMenuBuilder
} = require('discord.js');
const { createPanel, getPanelByChannel, updatePanel, deletePanel } = require('../../database/panelQueries');
const { getCategories } = require('../../database/categoryQueries');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Gerencia os painéis de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Cria um novo painel de tickets com menu de categorias')
        .addChannelOption(opt => opt.setName('channel').setDescription('Canal onde o painel será enviado').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addChannelOption(opt => opt.setName('category').setDescription('Categoria onde os tickets serão abertos').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Título do painel').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Descrição do painel').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Cor do embed (Hex, ex: #ff0000)'))
        .addStringOption(opt => opt.setName('image').setDescription('URL da imagem/banner do painel'))
        .addStringOption(opt => opt.setName('placeholder').setDescription('Texto do placeholder do menu'))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Remove um painel de tickets existente')
        .addChannelOption(opt => opt.setName('channel').setDescription('Canal do painel a ser removido').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edita um painel de tickets existente')
        .addChannelOption(opt => opt.setName('channel').setDescription('Canal do painel a ser editado').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Novo título'))
        .addStringOption(opt => opt.setName('description').setDescription('Nova descrição'))
        .addStringOption(opt => opt.setName('color').setDescription('Nova cor (Hex)'))
        .addStringOption(opt => opt.setName('image').setDescription('Nova URL da imagem/banner'))
        .addStringOption(opt => opt.setName('placeholder').setDescription('Novo texto do placeholder'))
        .addChannelOption(opt => opt.setName('category').setDescription('Nova categoria').addChannelTypes(ChannelType.GuildCategory))
    )
    .addSubcommand(sub =>
      sub.setName('refresh')
        .setDescription('Atualiza o menu do painel com as categorias atuais')
        .addChannelOption(opt => opt.setName('channel').setDescription('Canal do painel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel');

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      if (subcommand === 'create') {
        const existing = await getPanelByChannel(channel.id);
        if (existing) {
          return interaction.editReply('Já existe um painel configurado para este canal.');
        }

        // Check for categories
        const categories = await getCategories(interaction.guildId);
        if (categories.length === 0) {
          return interaction.editReply(
            '❌ Nenhuma categoria de atendimento configurada.\n\n' +
            'Primeiro, crie categorias com `/category add`. Exemplo:\n' +
            '```\n/category add name:suporte label:"Suporte ao Cliente" emoji:📦\n/category add name:duvidas label:"Dúvidas" emoji:💬\n```'
          );
        }

        const discordCategory = interaction.options.getChannel('category');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description').replace(/\\n/g, '\n');
        const color = interaction.options.getString('color') || '#0099ff';
        const imageUrl = interaction.options.getString('image');
        const placeholder = interaction.options.getString('placeholder') || 'Selecione uma opção...';

        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          return interaction.editReply('Cor inválida. Use o formato Hexadecimal (ex: #0099ff).');
        }

        // Build Embed
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setFooter({ text: 'NexoTicket - Sistema de Suporte', iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        if (imageUrl) {
          embed.setImage(imageUrl);
        }

        // Build Select Menu with categories
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`category_select_${channel.id}`)
          .setPlaceholder(placeholder)
          .addOptions(
            categories.map(cat => ({
              label: cat.label,
              description: cat.description || undefined,
              value: `cat_${cat.id}`,
              emoji: cat.emoji || undefined
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const message = await channel.send({ embeds: [embed], components: [row] });

        await createPanel(interaction.guildId, {
          channelId: channel.id,
          messageId: message.id,
          title,
          description,
          color,
          buttonLabel: placeholder,
          buttonEmoji: null,
          categoryId: discordCategory.id,
          imageUrl
        });

        logger.info(`Panel created in ${channel.name} for guild ${interaction.guildId}`);
        return interaction.editReply(`✅ Painel criado com sucesso em ${channel}!`);
      }

      if (subcommand === 'delete') {
        const panel = await getPanelByChannel(channel.id);
        if (!panel) {
          return interaction.editReply('Não foi encontrado nenhum painel configurado para este canal.');
        }

        try {
          const msg = await channel.messages.fetch(panel.message_id);
          if (msg) await msg.delete();
        } catch (e) {
          logger.warn(`Could not delete panel message: ${e.message}`);
        }

        await deletePanel(panel.id);
        return interaction.editReply('🗑️ Painel removido com sucesso.');
      }

      if (subcommand === 'edit') {
        const panel = await getPanelByChannel(channel.id);
        if (!panel) {
          return interaction.editReply('Não foi encontrado nenhum painel configurado para este canal.');
        }

        const categories = await getCategories(interaction.guildId);
        if (categories.length === 0) {
          return interaction.editReply('❌ Nenhuma categoria configurada. Adicione categorias com `/category add`.');
        }

        const title = interaction.options.getString('title') || panel.title;
        const description = (interaction.options.getString('description') || panel.description).replace(/\\n/g, '\n');
        const color = interaction.options.getString('color') || panel.color;
        const imageUrl = interaction.options.getString('image') !== null 
          ? interaction.options.getString('image') 
          : panel.image_url;
        const placeholder = interaction.options.getString('placeholder') || panel.button_label || 'Selecione uma opção...';
        const discordCategory = interaction.options.getChannel('category') || { id: panel.category_id };

        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          return interaction.editReply('Cor inválida. Use o formato Hexadecimal (ex: #0099ff).');
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setFooter({ text: 'NexoTicket - Sistema de Suporte', iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        if (imageUrl) {
          embed.setImage(imageUrl);
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`category_select_${channel.id}`)
          .setPlaceholder(placeholder)
          .addOptions(
            categories.map(cat => ({
              label: cat.label,
              description: cat.description || undefined,
              value: `cat_${cat.id}`,
              emoji: cat.emoji || undefined
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
          const msg = await channel.messages.fetch(panel.message_id);
          if (msg) await msg.edit({ embeds: [embed], components: [row] });
        } catch (e) {
          logger.warn(`Could not edit panel message: ${e.message}`);
        }

        await updatePanel(panel.id, {
          title,
          description,
          color,
          buttonLabel: placeholder,
          buttonEmoji: null,
          categoryId: discordCategory.id,
          imageUrl
        });

        return interaction.editReply('✏️ Painel atualizado com sucesso.');
      }

      if (subcommand === 'refresh') {
        const panel = await getPanelByChannel(channel.id);
        if (!panel) {
          return interaction.editReply('Não foi encontrado nenhum painel configurado para este canal.');
        }

        const categories = await getCategories(interaction.guildId);
        if (categories.length === 0) {
          return interaction.editReply('❌ Nenhuma categoria configurada.');
        }

        const embed = new EmbedBuilder()
          .setTitle(panel.title)
          .setDescription(panel.description)
          .setColor(panel.color)
          .setFooter({ text: 'NexoTicket - Sistema de Suporte', iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        if (panel.image_url) {
          embed.setImage(panel.image_url);
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`category_select_${channel.id}`)
          .setPlaceholder(panel.button_label || 'Selecione uma opção...')
          .addOptions(
            categories.map(cat => ({
              label: cat.label,
              description: cat.description || undefined,
              value: `cat_${cat.id}`,
              emoji: cat.emoji || undefined
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
          const msg = await channel.messages.fetch(panel.message_id);
          if (msg) await msg.edit({ embeds: [embed], components: [row] });
          return interaction.editReply('🔄 Painel atualizado com as categorias atuais.');
        } catch (e) {
          logger.warn(`Could not refresh panel message: ${e.message}`);
          return interaction.editReply('Erro ao atualizar o painel. A mensagem pode ter sido deletada.');
        }
      }
    } catch (err) {
      logger.error('Error in /panel command: %o', err);
      return interaction.editReply('Ocorreu um erro interno ao processar esta operação.');
    }
  },
};
