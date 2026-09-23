"use client";

import { type ReactNode, useEffect } from "react";
import { X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

// ── Cabeçalho de página ─────────────────────────────────────
export function PageHeader({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-mint-400">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse-dot" />
          {kicker}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-[2rem]">{title}</h1>
        <p className="mt-1 text-[13px] text-zinc-500">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ── Badge de status ─────────────────────────────────────────
const BADGE_TONES: Record<string, string> = {
  mint: "bg-mint-400/10 text-mint-300 border-mint-400/25",
  azure: "bg-azure-400/10 text-azure-400 border-azure-400/25",
  gold: "bg-gold-400/10 text-gold-400 border-gold-400/25",
  rose: "bg-blaze-400/10 text-blaze-400 border-blaze-400/25",
  zinc: "bg-white/[0.05] text-zinc-400 border-white/10",
  violet: "bg-violet-400/10 text-violet-300 border-violet-400/25",
};

export function Badge({ tone = "zinc", children, className }: { tone?: keyof typeof BADGE_TONES | string; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold", BADGE_TONES[tone] ?? BADGE_TONES.zinc, className)}>
      {children}
    </span>
  );
}

export const statusTone = (status: string): string =>
  ({
    ativo: "mint",
    lead: "azure",
    inativo: "zinc",
    agendado: "azure",
    confirmado: "gold",
    concluido: "mint",
    cancelado: "rose",
    rascunho: "zinc",
    enviado: "azure",
    aprovado: "mint",
    recusado: "rose",
  }[status] ?? "zinc");

// ── Cartão KPI ──────────────────────────────────────────────
export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "mint",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "mint" | "azure" | "gold" | "rose";
  delay?: number;
}) {
  const tones = {
    mint: "from-mint-400/15 to-transparent text-mint-400 border-mint-400/20",
    azure: "from-azure-400/15 to-transparent text-azure-400 border-azure-400/20",
    gold: "from-gold-400/15 to-transparent text-gold-400 border-gold-400/20",
    rose: "from-blaze-400/15 to-transparent text-blaze-400 border-blaze-400/20",
  }[tone];
  return (
    <div className="panel panel-hover relative overflow-hidden p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl", tones)} />
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <span className={cn("rounded-lg border bg-gradient-to-br p-1.5", tones)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-3 font-mono text-[1.55rem] font-bold leading-none tracking-tight text-white tabular">{value}</p>
      {hint && <p className="mt-2 text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-850 p-6 shadow-2xl sm:rounded-2xl animate-fade-up",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Botões ──────────────────────────────────────────────────
export function PrimaryButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-mint-400 px-4 py-2.5 text-[13px] font-bold text-ink-950 shadow-[0_8px_24px_-8px_rgba(52,211,153,0.6)] transition-all hover:bg-mint-300 hover:shadow-[0_8px_30px_-6px_rgba(52,211,153,0.7)] disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Estado vazio ────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-zinc-600">
        <Icon className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <p className="text-[13px] font-semibold text-zinc-400">{title}</p>
      {hint && <p className="max-w-60 text-[11.5px] text-zinc-600">{hint}</p>}
    </div>
  );
}
