"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Wallet,
  GraduationCap,
  FileSignature,
  ShieldCheck,
  Bus,
  CircleUser,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/format";

function logout() {
  window.dispatchEvent(new Event("dgmobi:logout"));
}

const NAV = [
  { href: "/", label: "Dashboard", sub: "Financeiro", icon: LayoutDashboard },
  { href: "/caixa", label: "Caixa Diário", sub: "Movimentações", icon: Wallet },
  { href: "/clientes", label: "CRM", sub: "Clientes & Escolas", icon: GraduationCap },
  { href: "/orcamentos", label: "Orçamentos", sub: "Propostas & Contratos", icon: FileSignature },
  { href: "/cadastros", label: "Cofre CPF/CNPJ", sub: "Documentos", icon: ShieldCheck },
];

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 shadow-[0_0_24px_-4px_rgba(52,211,153,0.55)] transition-transform duration-300 group-hover:scale-105">
        <Bus className="h-5 w-5 text-ink-950" strokeWidth={2.4} />
      </div>
      <div className="leading-none">
        <p className="font-display text-[15px] font-700 font-bold tracking-tight text-white">
          DG MOBI<span className="text-mint-400">MAGIC</span>
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          System · v2.0
        </p>
      </div>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrintDoc = /^\/orcamentos\/\d+/.test(pathname ?? "");

  if (isPrintDoc) {
    // Documento (proposta/contrato) renderizado sem chrome do app
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen">
      {/* brilho de fundo */}
      <div className="pointer-events-none fixed inset-0 no-print">
        <div className="absolute -top-40 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-mint-500/[0.07] blur-[120px]" />
        <div className="absolute inset-0 hero-grid" />
      </div>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.06] bg-ink-900/85 px-4 py-6 backdrop-blur-xl no-print lg:flex">
        <Logo />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                  active
                    ? "bg-mint-400/[0.09] text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-mint-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    active ? "text-mint-400" : "text-zinc-600 group-hover:text-zinc-400"
                  )}
                  strokeWidth={2.1}
                />
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold">{item.label}</span>
                  <span className="block text-[10px] text-zinc-600">{item.sub}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-400/80 to-amber-600/80">
              <CircleUser className="h-5 w-5 text-ink-950" />
            </div>
            <div className="leading-tight">
              <p className="text-[12.5px] font-semibold text-white">Douglas Pereira</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Fundador · CEO</p>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-mint-400 animate-pulse-dot" />
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[12px] font-semibold text-zinc-400 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/90 backdrop-blur-xl no-print lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                  active ? "bg-mint-400/15 text-mint-300" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="relative z-10 px-4 pb-16 pt-6 sm:px-6 lg:ml-60 lg:px-9 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
