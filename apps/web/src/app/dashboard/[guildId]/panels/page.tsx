import { getPanels } from "@/app/actions/panels";
import { getGuildChannels } from "@/lib/discord";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PanelList from "@/components/PanelList";

export const dynamic = "force-dynamic";

export default async function PanelsPage(props: {
  params: Promise<{ guildId: string }>;
}) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  console.log("PanelsPage Params:", params);
  console.log("Guild ID:", params?.guildId);
  
  if (!params?.guildId || params.guildId === "undefined") {
    console.error("Guild ID is missing or invalid (undefined string)!");
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
        <h3 className="text-xl font-bold text-red-500 mb-2">Erro de Navegação</h3>
        <p className="text-gray-400 mb-4">O ID do servidor não foi identificado na URL.</p>
        <a href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors">Voltar para Servidores</a>
      </div>
    );
  }

  // Fetch data in parallel
  const [panels, channels] = await Promise.all([
    getPanels(params.guildId),
    getGuildChannels(params.guildId, (session?.user as any)?.accessToken)
  ]);

  return (
    <>
      <PanelList 
        initialPanels={panels} 
        channels={channels}
        guildId={params.guildId} 
      />
    </>
  );
}
