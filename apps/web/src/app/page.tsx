"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, ArrowRight } from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NexoManager",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Discord, Web",
    "description": "A interface definitiva para gerenciar seu bot de tickets no Discord.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-[#050505] to-[#0a0a0a] overflow-hidden relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[150px]" />
      </div>

      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-2xl opacity-30 rounded-full" />
          <div className="relative bg-[#0a0a0a] p-4 rounded-2xl border border-glass-border">
            <LayoutDashboard className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Nexo<span className="text-gradient">Manager</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-lg">
          A interface definitiva para gerenciar seu bot de tickets. 
          Configure painéis, categorias e logs com uma experiência visual premium.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8">
          <button
            onClick={() => signIn("discord")}
            className="group relative px-8 py-4 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 cursor-pointer">Entrar com Discord</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </main>
  );
}
