import { sql } from "@/lib/db";
import { getGuildChannels } from "@/lib/discord";
import SettingsForm from "@/components/SettingsForm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage(props: {
  params: Promise<{ guildId: string }>;
}) {
  try {
      const params = await props.params;
      const guildId = params.guildId;

      // Get current config
      const configs = await sql`
        SELECT 
          bot_prefix,
          language,
          timezone,
          log_channel_id,
          log_channel_members,
          log_channel_tickets,
          log_channel_moderation,
          log_channel_sales,
          log_channel_general,
          visitor_role_id,
          client_role_id,
          active_client_role_id
        FROM guild_config 
        WHERE guild_id = ${guildId}
      `;

      if (configs.length === 0) {
        // Should probably create default config if not exists, but usually it's created on bot join
        // For now, let's just show an error or a default state
        // Actually, according to src/database/repositories/configRepository.js, it's created on get
        // Since this is the web dashboard, we can just insert if not exists
        await sql`INSERT INTO guild_config (guild_id) VALUES (${guildId}) ON CONFLICT (guild_id) DO NOTHING`;
        // Fetch again
        const newConfigs = await sql`
            SELECT 
              bot_prefix,
              language,
              timezone,
              log_channel_id,
              log_channel_members,
              log_channel_tickets,
              log_channel_moderation,
              log_channel_sales,
              log_channel_general,
              visitor_role_id,
              client_role_id,
              active_client_role_id
            FROM guild_config WHERE guild_id = ${guildId}
        `;
        if (newConfigs.length === 0) return notFound();
        configs.push(newConfigs[0]);
      }

      const session = await getServerSession(authOptions);
      const channels = await getGuildChannels(guildId, (session?.user as any)?.accessToken);
      const textChannels = channels.filter(c => c.type === 0); // 0 is GuildText

      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Configurações</h2>
            <p className="text-gray-400">Personalize o comportamento do bot no seu servidor.</p>
          </div>

          <SettingsForm 
            guildId={guildId} 
            initialSettings={configs[0] as any} 
            channels={textChannels}
          />
        </div>
      );
  } catch (error) {
    console.error("Error in SettingsPage:", error);
    return (
        <div className="p-4 text-red-500 bg-red-500/10 rounded-xl">
            Erro ao carregar configurações.
        </div>
    );
  }
}
