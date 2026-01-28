const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addStaffRole, removeStaffRole, getStaffRoles } = require('../../database/ticketQueries');
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
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (group === 'staff') {
      await interaction.deferReply({ ephemeral: true });

      try {
        if (subcommand === 'add') {
          const role = interaction.options.getRole('role');
          await addStaffRole(interaction.guildId, role.id);
          return interaction.editReply(`Cargo ${role} adicionado à equipe de suporte.`);
        }

        if (subcommand === 'remove') {
          const role = interaction.options.getRole('role');
          await removeStaffRole(interaction.guildId, role.id);
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
      } catch (err) {
        logger.error('Error in /config staff: %o', err);
        return interaction.editReply('Erro ao processar as configurações de staff.');
      }
    }
  },
};
