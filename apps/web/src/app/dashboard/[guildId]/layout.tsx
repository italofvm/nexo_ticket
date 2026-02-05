import Link from "next/link";
import { LayoutDashboard, Layers, Monitor, FileText, ArrowLeft, Settings, MessageSquare } from "lucide-react";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  const NAV_ITEMS = [
    { label: "Visão Geral", href: `/dashboard/${guildId}`, icon: LayoutDashboard },
    { label: "Categorias", href: `/dashboard/${guildId}/categories`, icon: Layers },
    { label: "Painéis", href: `/dashboard/${guildId}/panels`, icon: Monitor },
    { label: "Configurações", href: `/dashboard/${guildId}/settings`, icon: Settings },
    { label: "Feedback", href: `/dashboard/${guildId}/feedback`, icon: MessageSquare },
    { label: "Logs", href: `/dashboard/${guildId}/logs`, icon: FileText },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-100px)]">
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-2">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors px-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Servidores
          </Link>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              // Simple active state check logic would go here ideally using usePathname
              // but server components don't have usePathname easily without client wrapper.
              // For now, simple links.
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-glass hover:text-white text-gray-400 transition-all font-medium"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="glass-card p-6 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
