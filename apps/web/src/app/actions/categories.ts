"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncPanels } from "./panels";

export interface TicketCategory {
  id: number;
  guild_id: string;
  name: string;
  label: string;
  description: string | null;
  emoji: string | null;
  display_order: number;
}

export async function getCategories(guildId: string): Promise<TicketCategory[]> {
  try {
    const result = await sql`SELECT id, guild_id, name, label, description, emoji, display_order FROM ticket_categories WHERE guild_id = ${guildId} ORDER BY display_order ASC`;
    return result as TicketCategory[];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function createCategory(guildId: string, data: Omit<TicketCategory, "id" | "guild_id" | "display_order">) {
  try {
    // Get max order
    interface MaxOrderResult { max_order: number | null }
    const maxOrderResult = await sql`SELECT MAX(display_order) as max_order FROM ticket_categories WHERE guild_id = ${guildId}` as MaxOrderResult[];
    const nextOrder = ((maxOrderResult[0]?.max_order) || 0) + 1;

    await sql`INSERT INTO ticket_categories (guild_id, name, label, description, emoji, display_order) VALUES (${guildId}, ${data.name}, ${data.label}, ${data.description}, ${data.emoji}, ${nextOrder})`;
    
    // Sync panels on Discord
    await syncPanels(guildId);

    revalidatePath(`/dashboard/${guildId}/categories`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: number, guildId: string, data: Partial<TicketCategory>) {
  try {
    await sql`UPDATE ticket_categories SET label = ${data.label}, description = ${data.description}, emoji = ${data.emoji}, name = ${data.name} WHERE id = ${id} AND guild_id = ${guildId}`;

    // Sync panels on Discord
    await syncPanels(guildId);

    revalidatePath(`/dashboard/${guildId}/categories`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: number, guildId: string) {
  try {
    await sql`DELETE FROM ticket_categories WHERE id = ${id} AND guild_id = ${guildId}`;
    
    // Sync panels on Discord
    await syncPanels(guildId);

    revalidatePath(`/dashboard/${guildId}/categories`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
