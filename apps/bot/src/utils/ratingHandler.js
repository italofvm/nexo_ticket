const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
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
      .setTitle(config.rating_embed_title || 'Avalie seu atendimento')
      .setDescription(config.rating_embed_description || `Seu ticket **#${ticket.ticket_number}** em **${guild.name}** foi finalizado.\nComo você avalia o suporte recebido?`)
      .setColor(config.rating_embed_color || '#9d32ff')
      .setFooter({ text: config.rating_embed_footer || 'Sua opinião nos ajuda a melhorar!' });

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

  const [, ticketId, ratingValue] = interaction.customId.split('_');

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

  const [, , ticketId, rating] = interaction.customId.split('_');
  const feedback = interaction.fields.getTextInputValue('feedback_input') || '';

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  try {
    // We need the guild_id from the ticket because this might be a DM interaction
    const tickets = await sql`
      SELECT guild_id, ticket_number FROM tickets WHERE id = ${ticketId} LIMIT 1
    `;

    if (tickets.length === 0) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const { guild_id } = tickets[0];

    // Save to DB
    await sql`
      INSERT INTO ratings (ticket_id, guild_id, user_id, rating, feedback)
      VALUES (${ticketId}, ${guild_id}, ${interaction.user.id}, ${rating}, ${feedback})
    `;

    await interaction.editReply('Obrigado pela sua avaliação!');
    
    // Send to ratings channel if configured
    if (!guild_id) {
      logger.warn(`No guild_id found for ticket ${ticketId} during rating submission.`);
      return;
    }
    
    const config = await getGuildConfig(guild_id);
    if (config && config.rating_channel_id) {
      const guild = await interaction.client.guilds.fetch(guild_id).catch(err => {
        logger.error(`Error fetching guild ${guild_id} for feedback: %o`, err);
        return null;
      });
      
      if (guild) {
        const channel = await guild.channels.fetch(config.rating_channel_id).catch(err => {
          logger.error(`Error fetching channel ${config.rating_channel_id} in guild ${guild_id} for feedback: %o`, err);
          return null;
        });

        if (channel) {
          const userName = interaction.user.globalName || interaction.user.username;
          const stars = '⭐'.repeat(parseInt(rating));
          let description = '';

          if (feedback) {
            description = `## ${userName}\n### ${feedback}\n\n**Nota:** ${stars} (${rating}/5)`;
          } else {
            description = `## ${userName}\n*Usuário não deixou um comentário.*\n\n**Nota:** ${stars} (${rating}/5)`;
          }

          const ratingEmbed = new EmbedBuilder()
            .setDescription(description)
            .setColor(config.rating_embed_color || (rating >= 4 ? '#00d4ff' : rating >= 3 ? '#9d32ff' : '#ff0055'))
            .setTimestamp()
            .setFooter({ text: config.rating_embed_footer || `ID do Usuário: ${interaction.user.id}` });

          await channel.send({ embeds: [ratingEmbed] }).catch(err => {
            logger.error(`Failed to send rating embed to channel ${config.rating_channel_id}: %o`, err);
          });
        } else {
          logger.warn(`Feedback channel ${config.rating_channel_id} not found in guild ${guild_id}`);
        }
      }
    } else {
      logger.debug(`Feedback channel not configured for guild ${guild_id}`);
    }

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
