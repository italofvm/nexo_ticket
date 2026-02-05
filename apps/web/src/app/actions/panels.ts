"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendDiscordMessage } from "@/lib/discord";

export interface Panel {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string;
  title: string;
  description: string;
  color: string;
  image_url: string | null;
  button_label: string; 
  button_emoji: string;
}

const DISCORD_API = "https://discord.com/api/v10";

export async function getPanels(guildId: string): Promise<Panel[]> {
  try {
    const result = await sql`SELECT * FROM panels WHERE guild_id = ${guildId} ORDER BY id DESC`;
    return result as Panel[];
  } catch (error) {
    console.error("Failed to fetch panels:", error);
    return [];
  }
}

export async function buildPanelPayload(guildId: string, panel: Partial<Panel>) {
  const categoriesWithId = await sql`SELECT id, label, description, emoji FROM ticket_categories WHERE guild_id = ${guildId} ORDER BY display_order ASC`;
  
  if (categoriesWithId.length === 0) {
    throw new Error("Não existem categorias criadas. Crie categorias antes de criar um painel.");
  }
  
  const finalOptions = categoriesWithId.map((cat: any) => {
    // Robust Emoji Logic:
    // If emoji string is purely digits, treat as Custom Emoji ID.
    // Otherwise, treat as Unicode/Name.
    let emojiObj;
    if (cat.emoji) {
      if (/^\d+$/.test(cat.emoji)) {
        emojiObj = { id: cat.emoji };
      } else {
        emojiObj = { name: cat.emoji };
      }
    }

    return {
      label: cat.label,
      value: `cat_${cat.id}`,
      description: cat.description?.substring(0, 100) || "Clique para abrir um ticket",
      emoji: emojiObj
    };
  });

  const embed = {
    title: panel.title,
    description: panel.description || "Selecione uma categoria abaixo para iniciar o atendimento.",
    color: parseInt(panel.color?.replace("#", "") || "5865F2", 16),
    image: panel.image_url ? { url: panel.image_url } : undefined,
    footer: { text: "NexoTicket • Sistema Inteligente" }
  };

  const components = [
    {
      type: 1, 
      components: [
        {
          type: 3, 
          custom_id: `category_select_${panel.channel_id}`, 
          options: finalOptions,
          placeholder: "Selecione a categoria de atendimento...",
          min_values: 1,
          max_values: 1
        }
      ]
    }
  ];

  return {
    embeds: [embed],
    components
  };
}

export async function createPanel(guildId: string, data: any) {
  try {
    const payload = await buildPanelPayload(guildId, data);
    payload.components[0].components[0].custom_id = `category_select_${data.channel_id}`;

    const message = await sendDiscordMessage(data.channel_id, payload);

    await sql`INSERT INTO panels (guild_id, channel_id, message_id, title, description, color, image_url, button_label, button_emoji) VALUES (${guildId}, ${data.channel_id}, ${message.id}, ${data.title}, ${data.description}, ${data.color}, ${data.image_url}, ${"Abrir Ticket"}, ${"🎫"})`;

    revalidatePath(`/dashboard/${guildId}/panels`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create panel:", error);
    return { success: false, error: error.message || "Failed to create panel" };
  }
}

export async function syncPanels(guildId: string) {
  try {
    const panels = await getPanels(guildId);
    if (panels.length === 0) return { success: true };

    console.log(`Syncing ${panels.length} panels for guild ${guildId}...`);

    for (const panel of panels) {
        try {
            const payload = await buildPanelPayload(guildId, panel);
            payload.components[0].components[0].custom_id = `category_select_${panel.channel_id}`;

            const response = await fetch(`${DISCORD_API}/channels/${panel.channel_id}/messages/${panel.message_id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error(`Failed to sync panel ${panel.id}:`, await response.text());
            }
        } catch (err) {
            console.error(`Error processing panel ${panel.id} during sync:`, err);
        }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to sync panels:", error);
    return { success: false, error: "Sync failed" };
  }
}

export async function deletePanel(id: number, channelId: string, messageId: string, guildId: string) {
  try {
    try {
        await fetch(`${DISCORD_API}/channels/${channelId}/messages/${messageId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bot ${process.env.DISCORD_TOKEN}` }
        });
    } catch (ignore) { console.warn("Failed to delete discord message:", ignore); }

    await sql`DELETE FROM panels WHERE id = ${id}`;
    
    revalidatePath(`/dashboard/${guildId}/panels`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete panel:", error);
    return { success: false, error: "Failed to delete panel" };
  }
}

export async function updatePanel(id: number, guildId: string, data: any) {
  try {
    const payload = await buildPanelPayload(guildId, data);
    payload.components[0].components[0].custom_id = `category_select_${data.channel_id}`;

    // Update Discord message
    const response = await fetch(`${DISCORD_API}/channels/${data.channel_id}/messages/${data.message_id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update Discord message: ${errorText}`);
      throw new Error("Falha ao atualizar a mensagem no Discord. Verifique as permissões do bot.");
    }

    // Update Database
    await sql`
      UPDATE panels 
      SET title = ${data.title}, 
          description = ${data.description}, 
          color = ${data.color}, 
          image_url = ${data.image_url}
      WHERE id = ${id} AND guild_id = ${guildId}
    `;

    revalidatePath(`/dashboard/${guildId}/panels`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update panel:", error);
    return { success: false, error: error.message || "Failed to update panel" };
  }
}
