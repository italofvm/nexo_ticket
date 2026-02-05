const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { 
  createCategory, 
  getCategories, 
  getCategoryByName, 
  updateCategory, 
  deleteCategoryByName 
} = require('../../database/categoryQueries');
const { logAction } = require('../../utils/logHandler');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('category')
    .setDescription('Gerencia categorias de atendimento para o painel de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona uma nova categoria de atendimento')
        .addStringOption(opt => 
          opt.setName('name')
            .setDescription('Nome interno da categoria (sem espaços)')
            .setRequired(true)
            .setMaxLength(50)
        )
        .addStringOption(opt => 
          opt.setName('label')
            .setDescription('Texto exibido no menu (ex: Suporte ao Cliente)')
            .setRequired(true)
            .setMaxLength(100)
        )
        .addStringOption(opt => 
          opt.setName('description')
            .setDescription('Descrição exibida no menu')
            .setMaxLength(100)
        )
        .addStringOption(opt => 
          opt.setName('emoji')
            .setDescription('Emoji da categoria (ex: 📦 ou emoji ID)')
        )
        .addIntegerOption(opt => 
          opt.setName('order')
            .setDescription('Ordem de exibição (menor = primeiro)')
            .setMinValue(0)
            .setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove uma categoria existente')
        .addStringOption(opt => 
          opt.setName('name')
            .setDescription('Nome da categoria a remover')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lista todas as categorias configuradas')
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edita uma categoria existente')
        .addStringOption(opt => 
          opt.setName('name')
            .setDescription('Nome da categoria a editar')
            .setRequired(true)
        )
        .addStringOption(opt => 
          opt.setName('label')
            .setDescription('Novo texto exibido no menu')
            .setMaxLength(100)
        )
        .addStringOption(opt => 
          opt.setName('description')
            .setDescription('Nova descrição')
            .setMaxLength(100)
        )
        .addStringOption(opt => 
          opt.setName('emoji')
            .setDescription('Novo emoji')
        )
        .addIntegerOption(opt => 
          opt.setName('order')
            .setDescription('Nova ordem de exibição')
            .setMinValue(0)
            .setMaxValue(100)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      if (subcommand === 'add') {
        const name = interaction.options.getString('name');
        const label = interaction.options.getString('label');
        const description = interaction.options.getString('description');
        const emoji = interaction.options.getString('emoji');
        const order = interaction.options.getInteger('order');

        // Validate name format
        if (!/^[a-z0-9_-]+$/i.test(name)) {
          return interaction.editReply('Nome inválido. Use apenas letras, números, - ou _.');
        }

        const category = await createCategory(interaction.guildId, {
          name,
          label,
          description,
          emoji,
          displayOrder: order
        });

        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, {
          changes: `Categoria adicionada: ${label}`
        });

        return interaction.editReply(`✅ Categoria **${label}** criada com sucesso!`);
      }

      if (subcommand === 'remove') {
        const name = interaction.options.getString('name');
        
        const existing = await getCategoryByName(interaction.guildId, name);
        if (!existing) {
          return interaction.editReply(`Categoria "${name}" não encontrada.`);
        }

        await deleteCategoryByName(interaction.guildId, name);
        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, {
          changes: `Categoria removida: ${existing.label}`
        });

        return interaction.editReply(`🗑️ Categoria **${existing.label}** removida.`);
      }

      if (subcommand === 'list') {
        const categories = await getCategories(interaction.guildId);

        if (categories.length === 0) {
          return interaction.editReply(
            'Nenhuma categoria configurada.\n\n' +
            'Use `/category add` para criar categorias de atendimento que aparecerão no menu do painel.'
          );
        }

        const list = categories.map((cat, i) => {
          const emoji = cat.emoji ? `${cat.emoji} ` : '';
          const desc = cat.description ? ` - ${cat.description}` : '';
          return `${i + 1}. ${emoji}**${cat.label}**${desc} (\`${cat.name}\`)`;
        }).join('\n');

        return interaction.editReply(`**📋 Categorias de Atendimento:**\n\n${list}`);
      }

      if (subcommand === 'edit') {
        const name = interaction.options.getString('name');
        const label = interaction.options.getString('label');
        const description = interaction.options.getString('description');
        const emoji = interaction.options.getString('emoji');
        const order = interaction.options.getInteger('order');

        const existing = await getCategoryByName(interaction.guildId, name);
        if (!existing) {
          return interaction.editReply(`Categoria "${name}" não encontrada.`);
        }

        const updates = {};
        if (label) updates.label = label;
        if (description !== null) updates.description = description;
        if (emoji !== null) updates.emoji = emoji;
        if (order !== null) updates.displayOrder = order;

        if (Object.keys(updates).length === 0) {
          return interaction.editReply('Nenhuma alteração especificada.');
        }

        await updateCategory(existing.id, updates);
        await logAction(interaction.guild, 'CONFIG_UPDATE', interaction.user, {
          changes: `Categoria editada: ${existing.label}`
        });

        return interaction.editReply(`✏️ Categoria **${existing.label}** atualizada.`);
      }

    } catch (err) {
      logger.error('Error in /category: %o', err);
      return interaction.editReply(`Erro: ${err.message}`);
    }
  },
};
