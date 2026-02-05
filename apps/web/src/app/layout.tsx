import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    template: "%s | NexoManager",
    default: "NexoManager | Premium Ticket Management",
  },
  description: "Gerencie seu bot de tickets com uma interface visual e intuitiva. Crie painéis, categorias e automatize seu atendimento no Discord.",
  keywords: ["discord bot", "ticket system", "atendimento", "dashboard", "nexo manager"],
  authors: [{ name: "NexoTicket Team" }],
  creator: "Italo FVM",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://nexo-manager.vercel.app",
    siteName: "NexoManager",
    title: "NexoManager | Premium Ticket Management",
    description: "Gerencie seu bot de tickets com uma interface visual e intuitiva.",
    images: [
      {
        url: "/og-image.png", // Ensure this exists or use a generic one
        width: 1200,
        height: 630,
        alt: "NexoManager Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexoManager | Premium Ticket Management",
    description: "Gerencie seu bot de tickets com uma interface visual e intuitiva.",
    creator: "@italofvm",
  },
  metadataBase: new URL("https://nexo-manager.vercel.app"), 
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="bg-[#050505] text-white antialiased font-inter scroll-smooth" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
