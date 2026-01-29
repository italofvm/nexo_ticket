const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  ChannelType,
  MessageFlags 
} = require('discord.js');
const { createPanel, getPanelByChannel, updatePanel, deletePanel } = require('../../database/panelQueries');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Gerencia os painéis de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Cria um novo painel de tickets')
        .addChannelOption(opt => opt.setName('channel').setDescription('Canal onde o painel será enviado').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addChannelOption(opt => opt.setName('category').setDescription('Categoria onde os tickets serão abertos').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Título do painel').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Descrição do painel').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Cor do embed (Hex, ex: #ff0000)'))
        .addStringOption(opt => opt.setName('button_label').setDescription('Texto do botão'))
        .addStringOption(opt => opt.setName('button_emoji').setDescription('Emoji do botão'))
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
        .addStringOption(opt => opt.setName('button_label').setDescription('Novo texto do botão'))
        .addStringOption(opt => opt.setName('button_emoji').setDescription('Novo emoji do botão'))
        .addChannelOption(opt => opt.setName('category').setDescription('Nova categoria').addChannelTypes(ChannelType.GuildCategory))
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

        const category = interaction.options.getChannel('category');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description').replace(/\\n/g, '\n');
        const color = interaction.options.getString('color') || '#0099ff';
        const buttonLabel = interaction.options.getString('button_label') || 'Abrir Ticket';
        const buttonEmoji = interaction.options.getString('button_emoji') || null;

        // Validation
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          return interaction.editReply('Cor inválida. Use o formato Hexadecial (ex: #0099ff).');
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setFooter({ text: 'NexoTicket - Sistema de Suporte', iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        const button = new ButtonBuilder()
          .setCustomId(`open_ticket_${channel.id}`)
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Primary);

        if (buttonEmoji) button.setEmoji(buttonEmoji);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await channel.send({ embeds: [embed], components: [row] });

        await createPanel(interaction.guildId, {
          channelId: channel.id,
          messageId: message.id,
          title,
          description,
          color,
          buttonLabel,
          buttonEmoji,
          categoryId: category.id
        });

        logger.info(`Panel created in ${channel.name} for guild ${interaction.guildId}`);
        return interaction.editReply(`Painel criado com sucesso em ${channel}!`);
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
        return interaction.editReply('Painel removido com sucesso.');
      }

      if (subcommand === 'edit') {
        const panel = await getPanelByChannel(channel.id);
        if (!panel) {
          return interaction.editReply('Não foi encontrado nenhum painel configurado para este canal.');
        }

        const title = interaction.options.getString('title') || panel.title;
        const description = (interaction.options.getString('description') || panel.description).replace(/\\n/g, '\n');
        const color = interaction.options.getString('color') || panel.color;
        const buttonLabel = interaction.options.getString('button_label') || panel.button_label;
        const buttonEmoji = interaction.options.getString('button_emoji') || panel.button_emoji;
        const category = interaction.options.getChannel('category') || { id: panel.category_id };

        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          return interaction.editReply('Cor inválida. Use o formato Hexadecial (ex: #0099ff).');
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setFooter({ text: 'NexoTicket - Sistema de Suporte', iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        const button = new ButtonBuilder()
          .setCustomId(`open_ticket_${channel.id}`)
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Primary);

        if (buttonEmoji) button.setEmoji(buttonEmoji);

        const row = new ActionRowBuilder().addComponents(button);

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
          buttonLabel,
          buttonEmoji,
          categoryId: category.id
        });

        return interaction.editReply('Painel atualizado com sucesso.');
      }
    } catch (err) {
      logger.error('Error in /panel command: %o', err);
      return interaction.editReply('Ocorreu um erro interno ao processar esta operação.');
    }
  },
};
