import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Shell } from "@/components/shell";
import { AuthGate } from "@/components/auth-gate";
import { ensureSeed } from "@/db/seed";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "DG Mobi Magic System — Gestão Corporativa",
  description: "Painel de gestão corporativa e financeiro para turismo e entretenimento.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  try {
    await ensureSeed();
  } catch {
    // banco ainda não migrado — o painel continua renderizando
  }
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}>
      <body className="bg-ink-950 font-sans text-zinc-200 antialiased">
        <AuthGate>
          <Shell>{children}</Shell>
        </AuthGate>
      </body>
    </html>
  );
}
