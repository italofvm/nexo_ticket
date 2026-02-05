import { sql } from "@/lib/db";
import { Users, Ticket, CheckCircle, Clock } from "lucide-react";
import DashboardActions from "@/components/DashboardActions";

export const dynamic = "force-dynamic";


async function getStats(guildId: string) {
// ... (resto da função permanece igual)
  // Mock data for now, replace with real Queries later
  // We need to implement COUNT queries
  const ticketCountResult = await sql`SELECT count(*) FROM tickets WHERE guild_id = ${guildId}`;
  const openCountResult = await sql`SELECT count(*) FROM tickets WHERE guild_id = ${guildId} AND status = 'open'`;
  
  return {
    total: ticketCountResult[0].count,
    open: openCountResult[0].count,
    avgTime: "12m", // Placeholder
    satisfaction: "4.9/5" // Placeholder
  };
}

export default async function GuildOverview(props: {
  params: Promise<{ guildId: string }>;
}) {
  const params = await props.params;
  const stats = await getStats(params.guildId);

  const CARDS = [
    { label: "Total de Tickets", value: stats.total, icon: Ticket, color: "text-blue-400" },
    { label: "Em Aberto", value: stats.open, icon: CheckCircle, color: "text-green-400" },
    { label: "Tempo Médio", value: stats.avgTime, icon: Clock, color: "text-orange-400" },
    { label: "Satisfação", value: stats.satisfaction, icon: Users, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <DashboardActions guildId={params.guildId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-[#0a0a0a]/50 p-4 rounded-xl border border-glass-border">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-white/5 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-400 font-medium">{card.label}</span>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
        <h3 className="text-lg font-bold mb-2">💡 Dica Pro</h3>
        <p className="text-gray-300">
          Configure categorias personalizadas na aba <strong>Categorias</strong> para organizar melhor seus tickets e melhorar suas métricas.
        </p>
      </div>
    </div>
  );
}
