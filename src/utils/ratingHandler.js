const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { getGuildConfig } = require('../database/repositories/configRepository');
const { sql } = require('../database/index');
const logger = require('./logger');

/**
 * Sends a rating request via DM to the user who opened the ticket.
 */
const sendRatingRequest = async (user, ticket, guild) => {
  try {
    const config = await getGuildConfig(guild.id);
    if (!config || !config.rating_enabled) return;

    const embed = new EmbedBuilder()
      .setTitle('Avalie seu atendimento')
      .setDescription(`Seu ticket **#${ticket.ticket_number}** em **${guild.name}** foi finalizado.\nComo você avalia o suporte recebido?`)
      .setColor('#f1c40f')
      .setFooter({ text: 'Sua opinião nos ajuda a melhorar!' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rate_${ticket.id}_1`).setLabel('1').setStyle(ButtonStyle.Danger).setEmoji('⭐'),
      new ButtonBuilder().setCustomId(`rate_${ticket.id}_2`).setLabel('2').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId(`rate_${ticket.id}_3`).setLabel('3').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId(`rate_${ticket.id}_4`).setLabel('4').setStyle(ButtonStyle.Primary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId(`rate_${ticket.id}_5`).setLabel('5').setStyle(ButtonStyle.Success).setEmoji('⭐')
    );

    await user.send({ embeds: [embed], components: [row] }).catch(() => {
        logger.warn(`Could not send rating DM to user ${user.id}`);
    });
  } catch (err) {
    logger.error('Error in sendRatingRequest: %o', err);
  }
};

/**
 * Handles the button click for rating.
 */
const handleRatingClick = async (interaction) => {
  if (!interaction.customId.startsWith('rate_')) return;

  const [_, ticketId, ratingValue] = interaction.customId.split('_');

  const modal = new ModalBuilder()
    .setCustomId(`rating_modal_${ticketId}_${ratingValue}`)
    .setTitle('Feedback Adicional');

  const feedbackInput = new TextInputBuilder()
    .setCustomId('feedback_input')
    .setLabel('O que poderíamos melhorar? (Opcional)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(500)
    .setRequired(false);

  const row = new ActionRowBuilder().addComponents(feedbackInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
};

/**
 * Handles the modal submission for rating.
 */
const handleRatingSubmit = async (interaction) => {
  if (!interaction.customId.startsWith('rating_modal_')) return;

  const [_, __, ticketId, rating] = interaction.customId.split('_');
  const feedback = interaction.fields.getTextInputValue('feedback_input') || '';

  await interaction.deferReply({ ephemeral: true });

  try {
    // Save to DB
    await sql`
      INSERT INTO ratings (ticket_id, guild_id, user_id, rating, feedback)
      VALUES (${ticketId}, ${interaction.guildId || 'DM'}, ${interaction.user.id}, ${rating}, ${feedback})
    `;

    await interaction.editReply('Obrigado pela sua avaliação!');
    
    // Update the message to remove buttons
    await interaction.message.edit({ components: [] }).catch(() => {});
    
  } catch (err) {
    logger.error('Error in handleRatingSubmit: %o', err);
    await interaction.editReply('Ocorreu um erro ao salvar sua avaliação.');
  }
};

module.exports = {
  sendRatingRequest,
  handleRatingClick,
  handleRatingSubmit
};
