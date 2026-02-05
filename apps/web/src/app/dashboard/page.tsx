import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserGuilds, getIconUrl } from "@/lib/discord";
import { sql } from "@/lib/db";
import { ExternalLink, Settings, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).accessToken) {
    redirect("/");
  }

  // Fetch users guilds from Discord API
  const guilds = await getUserGuilds((session.user as any).accessToken);

  if (guilds.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Nenhum servidor encontrado</h2>
        <p className="text-gray-400">Você precisa ser Administrador de algum servidor.</p>
      </div>
    );
  }

  // Check which guilds have the bot installed (exist in guild_config)
  const guildIds = guilds.map(g => g.id);
  // Neon/Postgres query with ANY array
  const installedGuildsResult = await sql`SELECT guild_id FROM guild_config WHERE guild_id = ANY(${guildIds})`;
  
  const installedSet = new Set(installedGuildsResult.map((row: any) => row.guild_id));

  // Bot Invite URL (replace CLIENT_ID with env var later if needed)
  const INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Meus Servidores
        </h1>
        <span className="text-sm text-gray-400">{guilds.length} servidores encontrados</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {guilds.map((guild) => {
          const isInstalled = installedSet.has(guild.id);
          const iconUrl = getIconUrl(guild);

          return (
            <div 
              key={guild.id} 
              className="glass-card p-6 flex flex-col items-center text-center hover:border-primary/50 transition-all group"
            >
              <div className="relative mb-4">
                {iconUrl ? (
                  <img 
                    src={iconUrl} 
                    alt={guild.name} 
                    className="w-20 h-20 rounded-2xl shadow-lg group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-2xl font-bold text-gray-500 shadow-lg group-hover:scale-105 transition-transform">
                    {guild.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {isInstalled && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-[#050505]">
                     <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                )}
              </div>

              <h3 className="font-bold text-lg mb-1 truncate w-full" title={guild.name}>
                {guild.name}
              </h3>
              <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-semibold">
                {isInstalled ? "Configurado" : "Não Instalado"}
              </p>

              <div className="mt-auto w-full">
                {isInstalled ? (
                  <Link 
                    href={`/dashboard/${guild.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Gerenciar
                  </Link>
                ) : (
                  <a 
                    href={`${INVITE_URL}&guild_id=${guild.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 rounded-xl font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Bot
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
