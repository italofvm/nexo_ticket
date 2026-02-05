const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGlobalStats, getStaffStats, getUserStats, getGuildRating } = require('../../database/repositories/statsRepository');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Exibe estatísticas do sistema NexoTicket')
    .addSubcommand(sub =>
      sub.setName('global')
        .setDescription('Estatísticas gerais do servidor')
    )
    .addSubcommand(sub =>
      sub.setName('staff')
        .setDescription('Estatísticas de um membro da equipe')
        .addUserOption(opt => opt.setName('user').setDescription('Membro da staff').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Resumo de tickets de um usuário')
        .addUserOption(opt => opt.setName('user').setDescription('Usuário').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
      if (subcommand === 'global') {
        const stats = await getGlobalStats(interaction.guildId);
        const rating = await getGuildRating(interaction.guildId);

        const avgRes = stats.avg_resolution_time 
          ? `${Math.floor(stats.avg_resolution_time / 3600)}h ${Math.floor((stats.avg_resolution_time % 3600) / 60)}m`
          : 'N/A';

        const embed = new EmbedBuilder()
          .setTitle('📊 Estatísticas Globais')
          .setColor('#7289da')
          .addFields(
            { name: 'Total de Tickets', value: `${stats.total}`, inline: true },
            { name: 'Abertos', value: `${stats.open}`, inline: true },
            { name: 'Fechados/Deletados', value: `${parseInt(stats.closed) + parseInt(stats.deleted)}`, inline: true },
            { name: 'Tempo Médio Resolução', value: avgRes, inline: true },
            { name: 'Avaliação Média', value: rating.avg_rating ? `⭐ ${parseFloat(rating.avg_rating).toFixed(1)} (${rating.total_ratings})` : 'N/A', inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'staff') {
        const target = interaction.options.getUser('user');
        const stats = await getStaffStats(interaction.guildId, target.id);

        const embed = new EmbedBuilder()
          .setTitle(`👤 Status de Staff: ${target.username}`)
          .setColor('#3498db')
          .addFields(
            { name: 'Tickets Assumidos', value: `${stats.total_claimed}`, inline: true },
            { name: 'Avaliação Média', value: stats.avg_rating ? `⭐ ${parseFloat(stats.avg_rating).toFixed(1)}` : 'N/A', inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'user') {
        const target = interaction.options.getUser('user');
        const stats = await getUserStats(interaction.guildId, target.id);

        const lastTicket = stats.last_ticket 
          ? new Date(stats.last_ticket).toLocaleDateString('pt-BR')
          : 'Nunca';

        const embed = new EmbedBuilder()
          .setTitle(`📂 Histórico de Usuário: ${target.username}`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Total de Tickets', value: `${stats.total_tickets}`, inline: true },
            { name: 'Último Ticket', value: lastTicket, inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

    } catch (err) {
      logger.error('Error in /stats: %o', err);
      return interaction.editReply('Erro ao buscar as estatísticas.');
    }
  },
};
