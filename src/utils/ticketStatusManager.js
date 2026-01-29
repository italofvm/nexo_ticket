const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const logger = require('./logger');

/**
 * Configuration object for ticket category IDs.
 * Replace these placeholders with your actual Discord Category IDs.
 */
const TICKET_CATEGORIES = {
    ABERTO: '1466455105388675275',      // Novos Ticket
    VERIFICACAO: 'ID_DA_CATEGORIA_VERIFICACAO',
    ACEITE: '1466455262243192922',      // Ticket Aceitos
    FECHADO: '1466455309613531268'      // Ticket Fechado
};

/**
 * Updates a ticket's status by moving it to the corresponding category
 * and optionally renaming it.
 * 
 * @param {import('discord.js').TextChannel} channel - The Discord channel object.
 * @param {keyof TICKET_CATEGORIES} status - The target status (e.g., 'ACEITE').
 * @param {import('discord.js').Interaction} [interaction] - Optional interaction for error reporting.
 * @returns {Promise<void>}
 */
async function updateTicketStatus(channel, status, interaction) {
    const categoryId = TICKET_CATEGORIES[status];

    if (!categoryId) {
        logger.error(`Status de ticket inválido: ${status}`);
        if (interaction) {
            return interaction.reply({ 
                content: `Status de categoria inválido: **${status}**.`, 
                flags: [MessageFlags.Ephemeral] 
            }).catch(() => {});
        }
        return;
    }

    try {
        // 1. Permission Check
        const botPermissions = channel.permissionsFor(channel.guild.members.me);
        if (!botPermissions.has(PermissionFlagsBits.ManageChannels)) {
            throw new Error('O bot não possui permissão de **Gerenciar Canais** para realizar esta ação.');
        }

        // 2. Move to target category and sync permissions
        await channel.setParent(categoryId, { lockPermissions: true });
        logger.info(`Canal ${channel.id} movido para categoria ${status} (${categoryId})`);

        // 3. Rename channel if status is CLOSED
        if (status === 'FECHADO' && !channel.name.startsWith('🔒-')) {
            const originalName = channel.name;
            await channel.setName(`🔒-${originalName}`);
            logger.info(`Canal ${channel.id} renomeado para incluir prefixo de fechado.`);
        }

    } catch (err) {
        logger.error(`Falha ao atualizar status do ticket (${status}): %o`, err);
        
        if (interaction) {
            const errorMessage = interaction.replied || interaction.deferred
                ? interaction.editReply.bind(interaction)
                : interaction.reply.bind(interaction);

            await errorMessage({ 
                content: `Não foi possível mover o ticket para **${status}**: ${err.message}`, 
                flags: [MessageFlags.Ephemeral] 
            }).catch(() => {});
        }
        
        throw err; // Re-throw to handle in caller if needed
    }
}

module.exports = {
    TICKET_CATEGORIES,
    updateTicketStatus
};
