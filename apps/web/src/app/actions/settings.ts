"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSettings(guildId: string, settings: any) {
  try {
    const ALLOWED_COLUMNS = [
      'rating_enabled',
      'rating_channel_id',
      'rating_embed_title',
      'rating_embed_description',
      'rating_embed_color',
      'rating_embed_footer',
      'rating_highlight_feedback',
      'bot_prefix',
      'language',
      'timezone',
      'log_channel_id',
      'log_channel_members',
      'log_channel_tickets',
      'log_channel_moderation',
      'log_channel_sales',
      'log_channel_general'
    ];

    const columns = Object.keys(settings).filter(col => ALLOWED_COLUMNS.includes(col));
    if (columns.length === 0) return { success: true };

    const setClauses = columns.map((col, index) => `${col} = $${index + 2}`);
    const values = columns.map(col => settings[col]);

    const query = `
      UPDATE guild_config 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE guild_id = $1
    `;

    // Using query helper from @/lib/db or direct sql depends on driver.
    // In @/lib/db, sql is defined as neon(process.env.DATABASE_URL).
    // (sql as any).query is used for parameterized queries with placeholders.
    await (sql as any).query(query, [guildId, ...values]);
    revalidatePath(`/dashboard/${guildId}/settings`);
    revalidatePath(`/dashboard/${guildId}/feedback`); // Added for the new route
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Falha ao salvar configurações." };
  }
}
