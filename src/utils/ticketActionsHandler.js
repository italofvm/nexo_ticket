const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  MessageFlags,
  ChannelType
} = require('discord.js');
const { getStaffRoles } = require('../database/ticketQueries');
const { 
  closeTicket, 
  claimTicket, 
  transferTicket, 
  deleteTicketRecord, 
  saveTranscript,
  getTicketByChannel 
} = require('../database/managementQueries');
const { generateHTML } = require('./transcriptGenerator');
const { logAction } = require('./logHandler');
const { sendRatingRequest } = require('./ratingHandler');
const { updateTicketStatus, TICKET_CATEGORIES } = require('./ticketStatusManager');
const { incMetric } = require('./metrics');
const { getGuildConfig } = require('../database/repositories/configRepository');
const logger = require('./logger');

/**
 * Main dispatcher for ticket actions.
 */
const handleTicketAction = async (interaction) => {
  const customId = interaction.customId;

  // 1. Claim Action
  if (customId.startsWith('ticket_claim_')) {
    return await handleClaim(interaction);
  }

  // 2. Close Action
  if (customId.startsWith('ticket_close_')) {
    return await handleClose(interaction);
  }

  // 3. Delete Request Action (Show Modal)
  if (customId.startsWith('ticket_delete_')) {
    return await showDeleteModal(interaction);
  }

  // 4. Actual Delete Action (From Modal)
  if (customId === 'ticket_confirm_delete_modal') {
    return await handleDelete(interaction);
  }

  // 5. Show Transfer Menu
  if (customId.startsWith('ticket_transfer_menu_')) {
    return await handleTransferMenu(interaction);
  }

  // 6. Transfer Select Menu Submission
  if (customId.startsWith('ticket_transfer_select_')) {
    return await handleTransfer(interaction);
  }

  // 7. Accept Ticket Action
  if (customId.startsWith('ticket_accept_')) {
    return await handleAccept(interaction);
  }
};

/**
 * Show a Select Menu with staff members to transfer the ticket.
 */
async function handleTransferMenu(interaction) {
    const staffRoles = await getStaffRoles(interaction.guildId);
    const isStaff = interaction.member.roles.cache.some(r => staffRoles.includes(r.id)) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({ content: 'Apenas membros da equipe podem transferir tickets.', flags: [MessageFlags.Ephemeral] });
    }

    try {
        const members = await interaction.guild.members.fetch();
        const staffMembers = members.filter(m => 
            !m.user.bot && (m.roles.cache.some(r => staffRoles.includes(r.id)) || m.permissions.has(PermissionFlagsBits.Administrator))
        );

        if (staffMembers.size === 0) {
            return interaction.reply({ content: 'Nenhum membro da equipe encontrado para transferir.', flags: [MessageFlags.Ephemeral] });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId(`ticket_transfer_select_${interaction.channelId}`)
            .setPlaceholder('Selecione um membro da equipe')
            .addOptions(
                staffMembers.first(25).map(m => ({
                    label: m.user.username,
                    value: m.user.id,
                    emoji: '👤'
                }))
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({ 
            content: 'Selecione abaixo para quem deseja transferir este ticket:', 
            components: [row], 
            flags: [MessageFlags.Ephemeral] 
        });
    } catch (err) {
        logger.error('Error in handleTransferMenu: %s', err.message);
        await interaction.reply({ content: 'Erro ao buscar membros da equipe.', flags: [MessageFlags.Ephemeral] });
    }
}

/**
 * Handle Staff Claiming a ticket.
 */
async function handleClaim(interaction) {
  const staffRoles = await getStaffRoles(interaction.guildId);
  const isStaff = interaction.member.roles.cache.some(r => staffRoles.includes(r.id)) || 
                  interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (!isStaff) {
    return interaction.reply({ content: 'Apenas membros da equipe podem assumir tickets.', flags: [MessageFlags.Ephemeral] });
  }

  await interaction.deferReply();

  try {
    await claimTicket(interaction.channelId, interaction.user.id);
    
    // Update channel name
    const currentName = interaction.channel.name;
    if (!currentName.includes('claimed')) {
      await interaction.channel.setName(`${currentName}-claimed`);
    }

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`✋ O ticket foi assumido por ${interaction.user}.`);

    await interaction.editReply({ embeds: [embed] });
    
    // Log Action
    await logAction(interaction.guild, 'TICKET_CLAIM', interaction.user, { channel: interaction.channel });

    // Disable the claim button
    const originalMessage = interaction.message;
    const newRows = originalMessage.components.map(row => {
        const newRow = new ActionRowBuilder();
        row.components.forEach(comp => {
            const btn = ButtonBuilder.from(comp);
            if (comp.customId.startsWith('ticket_claim_')) {
                btn.setDisabled(true).setLabel('Assumido');
            }
            newRow.addComponents(btn);
        });
        return newRow;
    });

    await originalMessage.edit({ components: newRows });
    
  } catch (err) {
    incMetric('errorsCount');
    logger.error('Error in handleClaim: %s', err.message);
    await interaction.editReply('Erro ao assumir o ticket.');
  }
}

/**
 * Handle Closing a ticket.
 */
async function handleClose(interaction) {
  const staffRoles = await getStaffRoles(interaction.guildId);
  const isStaff = interaction.member.roles.cache.some(r => staffRoles.includes(r.id)) || 
                  interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                  interaction.channel.name.includes(interaction.user.username);

  if (!isStaff) {
    return interaction.reply({ content: 'Você não tem permissão para fechar este ticket.', flags: [MessageFlags.Ephemeral] });
  }

  await interaction.deferReply();

  try {
    const ticket = await getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.editReply('Informações do ticket não encontradas no banco.');

    await closeTicket(interaction.channelId, interaction.user.id);
    
    // Change permissions: prevent user from sending messages
    await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
        SendMessages: false,
    });

    // 1. Move to CLOSED category and rename (via status manager)
    const hasClosedConfig = TICKET_CATEGORIES.FECHADO && TICKET_CATEGORIES.FECHADO !== 'ID_DA_CATEGORIA_FECHADO';
    if (hasClosedConfig) {
        await updateTicketStatus(interaction.channel, 'FECHADO', interaction).catch(err => {
            logger.warn('Failed to move ticket to CLOSED category: %s', err.message);
        });
    } else {
        // Fallback: Just rename if no category is configured
        await interaction.channel.setName(`closed-${ticket.ticket_number}`);
    }

    const durationMs = Date.now() - new Date(ticket.created_at).getTime();
    const durationMin = Math.floor(durationMs / 60000);
    const durationStr = durationMin > 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin}m`;

    const embed = new EmbedBuilder()
      .setTitle('Ticket Fechado')
      .setColor('#f1c40f')
      .setDescription(`🔒 Ticket fechado por ${interaction.user}.\n\nPara deletar permanentemente e gerar a transcrição, use o botão abaixo.`)
      .addFields({ name: 'Duração', value: durationStr, inline: true })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_delete_${interaction.channelId}`).setLabel('Deletar').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
      new ButtonBuilder().setCustomId(`ticket_transfer_menu_${interaction.channelId}`).setLabel('Transferir').setStyle(ButtonStyle.Secondary).setEmoji('📤')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    incMetric('ticketsClosed');

    // Send Rating Request
    const creator = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
    if (creator) {
        await sendRatingRequest(creator.user, ticket, interaction.guild);
    }

    // Log Action
    await logAction(interaction.guild, 'TICKET_CLOSE', interaction.user, { 
        number: ticket.ticket_number, 
        duration: durationStr 
    });

    // Role Management: Revert to Client Role, Remove Active Client Role
    try {
      const config = await getGuildConfig(interaction.guildId);
      const member = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
      if (member && config) {
        if (config.client_role_id) {
          await member.roles.add(config.client_role_id).catch(e => logger.warn(`Failed to add client role on close: ${e.message}`));
        }
        if (config.active_client_role_id) {
          await member.roles.remove(config.active_client_role_id).catch(e => logger.warn(`Failed to remove active client role on close: ${e.message}`));
        }
      }
    } catch (roleErr) {
      logger.error('Error managing roles on ticket close: %o', roleErr);
    }

  } catch (err) {
    incMetric('errorsCount');
    logger.error('Error in handleClose: %s', err.message);
    await interaction.editReply('Erro ao fechar o ticket.');
  }
}

/**
 * Show Modal for Deletion.
 */
async function showDeleteModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('ticket_confirm_delete_modal')
    .setTitle('Confirmar Deleção');

  const confirmInput = new TextInputBuilder()
    .setCustomId('confirm_input')
    .setLabel('Digite "DELETAR" para confirmar')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('DELETAR')
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(confirmInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

/**
 * Handle Final Deletion with Transcript.
 */
async function handleDelete(interaction) {
  const input = interaction.fields.getTextInputValue('confirm_input');
  if (input.toUpperCase() !== 'DELETAR') {
    return interaction.reply({ content: 'Confirmação inválida. Operação cancelada.', flags: [MessageFlags.Ephemeral] });
  }

  await interaction.deferReply();
  await interaction.editReply('Gerando transcrição e deletando canal em 5 segundos...');

  try {
    const ticket = await getTicketByChannel(interaction.channelId);
    const htmlContent = await generateHTML(interaction.channel);
    
    await saveTranscript({
      ticketId: ticket ? ticket.id : null,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      generatedBy: interaction.user.id,
      content: htmlContent,
      format: 'html'
    });

    const buffer = Buffer.from(htmlContent, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.html` });
    
    // Send DM to Destroy-er
    await interaction.user.send({ 
        content: `Transcrição do ticket **${interaction.channel.name}** deletado em **${interaction.guild.name}**.`,
        files: [attachment] 
    }).catch(() => logger.warn('Could not send DM to staff who deleted the ticket.'));

    // Send DM to creator
    if (ticket && ticket.user_id !== interaction.user.id) {
        try {
            const creator = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
            if (creator) {
                await creator.send({
                    content: `Seu ticket **#${ticket.ticket_number}** em **${interaction.guild.name}** foi finalizado e deletado. Aqui está a transcrição:`,
                    files: [attachment]
                });
            }
        } catch (e) {
            logger.warn(`Could not send transcript to ticket creator ${ticket.user_id}: ${e.message}`);
        }
    }

    // Log Action
    await logAction(interaction.guild, 'TICKET_DELETE', interaction.user, { 
        number: ticket ? ticket.ticket_number : 'Unknown',
        userId: ticket ? ticket.user_id : 'Unknown',
        files: [attachment]
    });

    await deleteTicketRecord(interaction.channelId);

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (e) {
        logger.error('Failed to delete channel: %s', e.message);
      }
    }, 5000);

  } catch (err) {
    incMetric('errorsCount');
    logger.error('Error in handleDelete: %s', err.message);
    await interaction.followUp({ content: 'Erro ao deletar o ticket.', flags: [MessageFlags.Ephemeral] });
  }
}

/**
 * Handle Staff Transferring a ticket.
 */
async function handleTransfer(interaction) {
    const newStaffId = interaction.values[0];
    await interaction.deferUpdate();

    try {
        await transferTicket(interaction.channelId, newStaffId);
        
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setDescription(`📤 Ticket transferido para <@${newStaffId}>.`);

        await interaction.editReply({ embeds: [embed] });

        // Log Action
        await logAction(interaction.guild, 'TICKET_TRANSFER', interaction.user, { 
            channel: interaction.channel,
            newStaffId: newStaffId
        });
    } catch (err) {
        incMetric('errorsCount');
        logger.error('Error in handleTransfer: %s', err.message);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'Erro ao transferir o ticket.' });
        } else {
            await interaction.reply({ content: 'Erro ao transferir o ticket.', flags: [MessageFlags.Ephemeral] });
        }
    }
}

/**
 * Handle Staff Accepting a ticket.
 */
async function handleAccept(interaction) {
    const staffRoles = await getStaffRoles(interaction.guildId);
    const isStaff = interaction.member.roles.cache.some(r => staffRoles.includes(r.id)) || 
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
        return interaction.reply({ content: 'Apenas membros da equipe podem aceitar tickets.', flags: [MessageFlags.Ephemeral] });
    }

    await interaction.deferReply();

    try {
        // 1. Mark as claimed in DB
        await claimTicket(interaction.channelId, interaction.user.id);

        const ticket = await getTicketByChannel(interaction.channelId);

        // 2. Move to ACEITE category and sync permissions
        await updateTicketStatus(interaction.channel, 'ACEITE', interaction);
        
        // 3. Restore client permissions (status sync with lockPermissions: true wipes specific user overwrites)
        if (ticket) {
            await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true
            }).catch(e => logger.warn(`Failed to restore creator permissions: ${e.message}`));
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`✅ O ticket foi aceito e assumido por ${interaction.user}. Movido para **Ticket Aceitos**.`);

        await interaction.editReply({ embeds: [embed] });

        // 4. Create Private Thread (Group Chat)
        try {
            const thread = await interaction.channel.threads.create({
                name: `bate-papo-${interaction.channel.name}`,
                autoArchiveDuration: 1440,
                type: ChannelType.PrivateThread,
                reason: 'Group chat for accepted ticket'
            });

            // Invite creator if found
            if (ticket) {
                await thread.members.add(ticket.user_id).catch(e => logger.warn(`Failed to add creator to thread: ${e.message}`));
            }
            
            // Add the staff member who accepted
            await thread.members.add(interaction.user.id).catch(e => logger.warn(`Failed to add staff to thread: ${e.message}`));

            const threadEmbed = new EmbedBuilder()
                .setTitle('🚀 Bate-papo do Projeto')
                .setDescription(`Este é o espaço privado para discussão do projeto entre <@${ticket?.user_id}> e a equipe.\n\n**Staff Responsável:** ${interaction.user}`)
                .setColor('#2ecc71')
                .setTimestamp();

            await thread.send({ 
                content: `Olá <@${ticket?.user_id}>! Este bate-papo foi criado para tratarmos os detalhes do seu pedido.`,
                embeds: [threadEmbed] 
            });

            logger.info(`Private thread created for ticket ${interaction.channelId}`);
        } catch (threadErr) {
            logger.error('Error creating private thread: %o', threadErr);
            await interaction.followUp({ content: 'O ticket foi aceito, mas houve um erro ao criar o bate-papo privado.', flags: [MessageFlags.Ephemeral] });
        }

        // 5. Disable the accept button and mark as claimed
        const originalMessage = interaction.message;
        const newRows = originalMessage.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(comp => {
                const btn = ButtonBuilder.from(comp);
                if (comp.customId.startsWith('ticket_accept_')) {
                    btn.setDisabled(true).setLabel('Aceito').setStyle(ButtonStyle.Success);
                }
                newRow.addComponents(btn);
            });
            return newRow;
        });

        await originalMessage.edit({ components: newRows });

        // 6. Log Action
        await logAction(interaction.guild, 'TICKET_CLAIM', interaction.user, { channel: interaction.channel });

        // 7. Role Management: Add Active Client Role, Remove Client Role
        try {
          const config = await getGuildConfig(interaction.guildId);
          if (ticket && config) {
            const member = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
            if (member) {
              if (config.active_client_role_id) {
                await member.roles.add(config.active_client_role_id).catch(e => logger.warn(`Failed to add active client role: ${e.message}`));
              }
              if (config.client_role_id) {
                await member.roles.remove(config.client_role_id).catch(e => logger.warn(`Failed to remove client role: ${e.message}`));
              }
            }
          }
        } catch (roleErr) {
          logger.error('Error managing roles on ticket accept: %o', roleErr);
        }

    } catch (err) {
        incMetric('errorsCount');
        logger.error('Error in handleAccept: %s', err.message);
    }
}

module.exports = { handleTicketAction };
