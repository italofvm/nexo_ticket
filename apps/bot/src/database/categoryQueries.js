const { query } = require('./index');

/**
 * Create a new ticket category for a guild.
 */
const createCategory = async (guildId, { name, label, description, emoji, displayOrder }) => {
  try {
    const result = await query(
      `INSERT INTO ticket_categories (guild_id, name, label, description, emoji, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [guildId, name.toLowerCase(), label, description || null, emoji || null, displayOrder || 0]
    );
    return result[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new Error(`Categoria "${name}" já existe neste servidor.`);
    }
    throw err;
  }
};

/**
 * Get all categories for a guild, ordered by display_order.
 */
const getCategories = async (guildId) => {
  const result = await query(
    'SELECT * FROM ticket_categories WHERE guild_id = $1 ORDER BY display_order ASC, id ASC',
    [guildId]
  );
  return result;
};

/**
 * Get a single category by name.
 */
const getCategoryByName = async (guildId, name) => {
  const result = await query(
    'SELECT * FROM ticket_categories WHERE guild_id = $1 AND name = $2',
    [guildId, name.toLowerCase()]
  );
  return result[0] || null;
};

/**
 * Get a single category by ID.
 */
const getCategoryById = async (categoryId) => {
  const result = await query(
    'SELECT * FROM ticket_categories WHERE id = $1',
    [categoryId]
  );
  return result[0] || null;
};

/**
 * Update a category.
 */
const updateCategory = async (categoryId, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.label !== undefined) {
    fields.push(`label = $${idx++}`);
    values.push(updates.label);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description);
  }
  if (updates.emoji !== undefined) {
    fields.push(`emoji = $${idx++}`);
    values.push(updates.emoji);
  }
  if (updates.displayOrder !== undefined) {
    fields.push(`display_order = $${idx++}`);
    values.push(updates.displayOrder);
  }

  if (fields.length === 0) return null;

  values.push(categoryId);
  const result = await query(
    `UPDATE ticket_categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result[0] || null;
};

/**
 * Delete a category by ID.
 */
const deleteCategory = async (categoryId) => {
  await query('DELETE FROM ticket_categories WHERE id = $1', [categoryId]);
};

/**
 * Delete a category by name.
 */
const deleteCategoryByName = async (guildId, name) => {
  await query('DELETE FROM ticket_categories WHERE guild_id = $1 AND name = $2', [guildId, name.toLowerCase()]);
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryByName,
  getCategoryById,
  updateCategory,
  deleteCategory,
  deleteCategoryByName
};
