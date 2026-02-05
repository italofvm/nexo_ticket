"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getChannelMessages, bulkDeleteMessages, deleteDiscordChannel } from "@/lib/discord";

export async function clearFeedbacks(guildId: string) {
  try {
    // 1. Buscar o canal de feedback configurado
    const configs = await sql`SELECT rating_channel_id FROM guild_config WHERE guild_id = ${guildId}`;
    const channelId = configs[0]?.rating_channel_id;

    if (channelId) {
      // 2. Buscar últimas mensagens (limitando a 100 para evitar timeout excessivo)
      const messages = await getChannelMessages(channelId, 100);
      
      // 3. Filtrar mensagens enviadas pelo bot (opcional, mas seguro)
      // Se o canal for exclusivo para feedbacks, podemos tentar apagar tudo.
      const messageIds = messages.map((m: any) => m.id);
      
      if (messageIds.length > 0) {
        await bulkDeleteMessages(channelId, messageIds);
      }
    }

    // 4. Limpar banco de dados
    await (sql as any).query(`DELETE FROM ratings WHERE guild_id = $1`, [guildId]);
    
    revalidatePath(`/dashboard/${guildId}/feedback`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear feedbacks:", error);
    return { success: false, error: "Falha ao limpar histórico de feedbacks no Discord/DB." };
  }
}

export async function clearTickets(guildId: string) {
  try {
    // 1. Buscar todos os IDs de canais de tickets desta guild
    const tickets = await sql`SELECT channel_id FROM tickets WHERE guild_id = ${guildId}`;
    
    // 2. Deletar canais no Discord
    // Usamos Promise.allSettled para garantir que um erro em um canal não pare os outros
    if (tickets.length > 0) {
      await Promise.allSettled(tickets.map((t: any) => deleteDiscordChannel(t.channel_id)));
    }

    // 3. Limpar banco de dados
    await (sql as any).query(`DELETE FROM transcripts WHERE guild_id = $1`, [guildId]);
    await (sql as any).query(`DELETE FROM ticket_logs WHERE guild_id = $1`, [guildId]);
    await (sql as any).query(`DELETE FROM ratings WHERE guild_id = $1`, [guildId]);
    await (sql as any).query(`DELETE FROM tickets WHERE guild_id = $1`, [guildId]);

    revalidatePath(`/dashboard/${guildId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear tickets:", error);
    return { success: false, error: "Falha ao limpar histórico de tickets no Discord/DB." };
  }
}
