const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { addStaffRole, removeStaffRole, getStaffRoles } = require('../../database/ticketQueries');
const { updateGuildConfig, getGuildConfig } = require('../../database/repositories/configRepository');
const { logAction } = require('../../utils/logHandler');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurações do sistema NexoTicket')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup(group =>
      group.setName('staff')
        .setDescription('Gerencia os cargos da equipe')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Adiciona um cargo à equipe de suporte')
            .addRoleOption(opt => opt.setName('role').setDescription('Cargo a ser adicionado').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Remove um cargo da equipe de suporte')
            .addRoleOption(opt => opt.setName('role').setDescription('Cargo a ser removido').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('list')
            .setDescription('Lista os cargos da equipe configurados')
        )
    )
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Configura o canal de logs')
        .addChannelOption(opt => 
          opt.setName('channel')
            .setDescription('Canal de texto para os logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('rating')
        .setDescription('Habilita ou desabilita o sistema de avaliação')
        .addBooleanOption(opt => 
          opt.setName('enabled')
            .setDescription('Habilitar avaliações?')
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Canal onde as avaliações serão enviadas')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('welcome')
        .setDescription('Configura a mensagem de boas-vindas dos tickets')
        .addStringOption(opt => 
          opt.setName('message')
            .setDescription('Mensagem customizada (use {user} para mencionar o autor)')
            .setMaxLength(500)
            .setRequired(true)
        )
    )
    .addSubcommandGroup(group =>
      group.setName('roles')
        .setDescription('Gerencia os cargos automatizados')
        .addSubcommand(sub =>
          sub.setName('visitor')
            .setDescription('Define o cargo de visitante (dado ao entrar)')
            .addRoleOption(opt => opt.setName('role').setDescription('Cargo de visitante').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('client')
            .setDescription('Define o cargo de cliente (dado ao abrir ticket)')
            .addRoleOption(opt => opt.setName('role').setDescription('Cargo de cliente').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('active')
            .setDescription('Define o cargo de cliente ativo (dado ao aceitar projeto)')
            .addRoleOption(opt => opt.setName('role').setDescription('Cargo de cliente ativo').setRequired(true))
        )
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      // Group: Staff
      if (group === 'staff') {
        if (subcommand === 'add') {
          const role = interaction.options.getRole('role');
          await addStaffRole(interaction.guildId, role.id);
          await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, { changes: `Staff Role Added: ${role.name}` });
          return interaction.editReply(`Cargo ${role} adicionado à equipe de suporte.`);
        }

        if (subcommand === 'remove') {
          const role = interaction.options.getRole('role');
          await removeStaffRole(interaction.guildId, role.id);
          await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, { changes: `Staff Role Removed: ${role.name}` });
          return interaction.editReply(`Cargo ${role} removido da equipe de suporte.`);
        }

        if (subcommand === 'list') {
          const roles = await getStaffRoles(interaction.guildId);
          if (roles.length === 0) {
            return interaction.editReply('Nenhum cargo de equipe configurado.');
          }
          const roleMentions = roles.map(id => `<@&${id}>`).join(', ');
          return interaction.editReply(`Cargos da equipe: ${roleMentions}`);
        }
      }

      // Subcommand: Logs
      if (subcommand === 'logs') {
        const channel = interaction.options.getChannel('channel');
        await updateGuildConfig(interaction.guildId, { log_channel_id: channel.id });
        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, { changes: `Log Channel updated to ${channel.name}` });
        return interaction.editReply(`Canal de logs definido para ${channel}.`);
      }

      // Subcommand: Rating
      if (subcommand === 'rating') {
        const enabled = interaction.options.getBoolean('enabled');
        const channel = interaction.options.getChannel('channel');
        
        const settings = { rating_enabled: enabled };
        if (channel) settings.rating_channel_id = channel.id;

        await updateGuildConfig(interaction.guildId, settings);
        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, { 
          changes: `Ratings ${enabled ? 'Enabled' : 'Disabled'}${channel ? `, Channel: ${channel.name}` : ''}` 
        });
        
        let response = `Sistema de avaliação ${enabled ? 'habilitado' : 'desabilitado'}.`;
        if (channel) response += ` Canal definido para ${channel}.`;
        
        return interaction.editReply(response);
      }

      // Subcommand: Welcome Message
      if (subcommand === 'welcome') {
        const message = interaction.options.getString('message');
        await updateGuildConfig(interaction.guildId, { welcome_message: message });
        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, { changes: `Welcome message updated` });
        return interaction.editReply('Mensagem de boas-vindas atualizada com sucesso.');
      }

      // Group: Roles
      if (group === 'roles') {
        const role = interaction.options.getRole('role');
        const settings = {};
        let label = '';

        if (subcommand === 'visitor') {
          settings.visitor_role_id = role.id;
          label = 'Visitante';
        } else if (subcommand === 'client') {
          settings.client_role_id = role.id;
          label = 'Cliente';
        } else if (subcommand === 'active') {
          settings.active_client_role_id = role.id;
          label = 'Cliente Ativo';
        }

        await updateGuildConfig(interaction.guildId, settings);
        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, { changes: `Role Config Updated: ${label} -> ${role.name}` });
        return interaction.editReply(`Cargo de **${label}** definido para ${role}.`);
      }

    } catch (err) {
      logger.error('Error in /config: %o', err);
      return interaction.editReply('Erro ao processar as configurações.');
    }
  },
};
