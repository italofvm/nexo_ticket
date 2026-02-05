import { sql } from "@/lib/db";
import { getGuildChannels } from "@/lib/discord";
import FeedbackForm from "@/components/FeedbackForm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function FeedbackPage(props: {
  params: Promise<{ guildId: string }>;
}) {
  const params = await props.params;
  const guildId = params.guildId;

  // Get current config
  const configs = await sql`
    SELECT 
      rating_enabled, 
      rating_channel_id, 
      rating_embed_title, 
      rating_embed_description, 
      rating_embed_color, 
      rating_embed_footer,
      rating_highlight_feedback
    FROM guild_config 
    WHERE guild_id = ${guildId}
  `;

  if (configs.length === 0) {
    return notFound();
  }

  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as any)?.accessToken;
  const channels = await getGuildChannels(guildId, accessToken);
  const textChannels = channels.filter(c => c.type === 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configuração de Feedback</h2>
        <p className="text-gray-400">Configure como os usuários avaliam o atendimento.</p>
      </div>

      <FeedbackForm 
        guildId={guildId} 
        initialSettings={configs[0] as any} 
        channels={textChannels}
      />
    </div>
  );
}
