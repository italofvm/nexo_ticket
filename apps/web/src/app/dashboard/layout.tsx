import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-glass-border bg-[#050505]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl">
            <img src="/logo.png" alt="NexoManager" className="w-10 h-10 object-contain" />
            <span className="tracking-tight">Nexo<span className="text-primary">Manager</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-glass-border bg-glass">
              {session.user?.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-gray-300">
                {session.user?.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
