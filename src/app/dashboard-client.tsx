"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  CircleDollarSign,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart as PieIcon,
  CalendarClock,
  Wallet,
  ChevronRight,
  Users,
  Pencil,
  Check,
  X,
  BusFront,
} from "lucide-react";
import { brl, formatDate, STATUS_LABEL, cn } from "@/lib/format";
import { PageHeader, KpiCard, Badge, statusTone, GhostButton, EmptyState } from "@/components/ui";
import { FinancialAreaChart, DivisionDonut, DailyCashChart } from "@/components/charts";

type Props = {
  monthName: string;
  series: { name: string; bruto: number; liquido: number; custos: number }[];
  dailyFlow: { name: string; fluxo: number }[];
  todayTx: { id: number; description: string; category: string; kind: string; amountCents: number }[];
  todayIn: number;
  todayOut: number;
  upcoming: { id: number; title: string; eventDate: string; client: string; status: string; grossCents: number; passengers: number; destination: string }[];
  pipeline: number;
  kpis: { bruto: number; custos: number; liquido: number; prolabore: number; fundo: number; deltaBruto: number; fundoAcumulado: number };
  division: { prolaborePct: number; fleetPct: number; founderName: string };
  counts: { clients: number; eventosAtivos: number };
};

export function DashboardClient(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [pctP, setPctP] = useState(String(p.division.prolaborePct));
  const [pctF, setPctF] = useState(String(p.division.fleetPct));
  const sumOk = Number(pctP) + Number(pctF) === 100;

  const saveDivision = () => {
    if (!sumOk) return;
    start(async () => {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prolaborePct: Number(pctP), fleetPct: Number(pctF) }),
      });
      setEditing(false);
      router.refresh();
    });
  };

  const k = p.kpis;
  const base = Math.max(k.bruto, 1);
  const segments = [
    { name: "Custos operacionais", value: k.custos, pct: (k.custos / base) * 100, fill: "#fb7185", text: "text-blaze-400", dot: "bg-blaze-400" },
    { name: `Pró-labore — ${p.division.founderName}`, value: k.prolabore, pct: (k.prolabore / base) * 100, fill: "#fbbf24", text: "text-gold-400", dot: "bg-gold-400" },
    { name: "Fundo de Frota", value: k.fundo, pct: (k.fundo / base) * 100, fill: "#34d399", text: "text-mint-400", dot: "bg-mint-400" },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="Visão geral · tempo real"
        title="Dashboard Financeiro"
        subtitle={`Competência ${p.monthName} · ${p.counts.clients} clientes ativos · ${p.counts.eventosAtivos} eventos no funil`}
      >
        <GhostButton onClick={() => start(async () => router.refresh())} disabled={pending}>
          <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
          Atualizar
        </GhostButton>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Banknote} label="Receita bruta" value={brl(k.bruto)} tone="mint"
          hint={`${k.deltaBruto >= 0 ? "▲" : "▼"} ${Math.abs(k.deltaBruto).toFixed(1)}% vs. mês anterior`} />
        <KpiCard icon={TrendingDown} label="Custos operacionais" value={brl(k.custos)} tone="rose" delay={60}
          hint={`${((k.custos / base) * 100).toFixed(0)}% da receita do mês`} />
        <KpiCard icon={CircleDollarSign} label="Lucro líquido" value={brl(k.liquido)} tone="azure" delay={120}
          hint={`Margem de ${k.bruto > 0 ? ((k.liquido / k.bruto) * 100).toFixed(0) : 0}%`} />
        <KpiCard icon={PiggyBank} label="Fundo de Frota" value={brl(k.fundo)} tone="gold" delay={180}
          hint={`Reserva acumulada: ${brl(k.fundoAcumulado)}`} />
      </div>

      {/* Gráfico principal + Divisão de lucros */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="panel p-5 animate-fade-up xl:col-span-2" style={{ animationDelay: "200ms" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[15px] font-bold text-white">Rendimento bruto × líquido</h2>
              <p className="text-[11px] text-zinc-500">Últimos 7 meses · caixa consolidado</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-mint-400" /> Bruto</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-azure-400" /> Líquido</span>
            </div>
          </div>
          <FinancialAreaChart data={p.series} />
        </section>

        {/* Divisão automática de lucros */}
        <section className="panel relative overflow-hidden p-5 animate-fade-up" style={{ animationDelay: "260ms" }}>
          <div className="mb-1 flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-white">
                <PieIcon className="h-4 w-4 text-mint-400" />
                Divisão automática de lucros
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">Regra aplicada sobre o resultado de {p.monthName}</p>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition-colors hover:border-mint-400/40 hover:text-mint-400">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={saveDivision} disabled={!sumOk || pending} className="rounded-lg border border-mint-400/40 p-1.5 text-mint-400 disabled:opacity-30">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-white/10 p-1.5 text-zinc-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <DivisionDonut data={segments.map((s) => ({ name: s.name, value: s.value, fill: s.fill }))} />

          {editing && (
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-mint-400/20 bg-mint-400/[0.04] p-3 animate-fade-up">
              <label className="block">
                <span className="label">Pró-labore %</span>
                <input className="field" inputMode="numeric" value={pctP} onChange={(e) => setPctP(e.target.value.replace(/\D/g, "").slice(0, 3))} />
              </label>
              <label className="block">
                <span className="label">Fundo de Frota %</span>
                <input className="field" inputMode="numeric" value={pctF} onChange={(e) => setPctF(e.target.value.replace(/\D/g, "").slice(0, 3))} />
              </label>
              <p className={cn("col-span-2 text-[10.5px] font-semibold", sumOk ? "text-mint-400" : "text-blaze-400")}>
                {sumOk ? "Distribuição válida — soma 100%" : `A soma deve ser 100% (atual: ${Number(pctP) + Number(pctF)}%)`}
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {segments.map((s) => (
              <div key={s.name} className="flex items-center gap-2.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-400">{s.name}</span>
                <span className={cn("text-[11px] font-bold", s.text)}>{s.pct.toFixed(0)}%</span>
                <span className="font-mono text-[12px] font-bold text-white tabular">{brl(s.value)}</span>
              </div>
            ))}
          </div>

          {/* barra "para onde vai cada real" */}
          <div className="mt-4">
            <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-zinc-600">Para onde vai cada R$ 1,00</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
              {segments.map((s, i) => (
                <div
                  key={s.name}
                  className="h-full origin-left animate-grow-bar transition-all"
                  style={{ width: `${Math.max(s.pct, 0)}%`, background: s.fill, animationDelay: `${300 + i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Linha 2 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="panel p-5 animate-fade-up" style={{ animationDelay: "320ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[15px] font-bold text-white">Fluxo diário</h2>
              <p className="text-[11px] text-zinc-500">Entradas − saídas · últimos 30 dias</p>
            </div>
            <Link href="/caixa" className="flex items-center gap-1 text-[11px] font-bold text-mint-400 hover:text-mint-300">
              Caixa <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <DailyCashChart data={p.dailyFlow} />
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-600">Hoje · entradas</p>
              <p className="font-mono text-sm font-bold text-mint-400 tabular">{brl(p.todayIn)}</p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-600">Hoje · saídas</p>
              <p className="font-mono text-sm font-bold text-blaze-400 tabular">{brl(p.todayOut)}</p>
            </div>
          </div>
        </section>

        <section className="panel p-5 animate-fade-up" style={{ animationDelay: "380ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-white">
              <Wallet className="h-4 w-4 text-mint-400" /> Caixa de hoje
            </h2>
            <Badge tone={p.todayIn - p.todayOut >= 0 ? "mint" : "rose"}>{brl(p.todayIn - p.todayOut)}</Badge>
          </div>
          <div className="space-y-1.5">
            {p.todayTx.length === 0 && <EmptyState icon={Wallet} title="Sem movimentações hoje" hint="Lance a primeira entrada no módulo Caixa Diário." />}
            {p.todayTx.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.045]">
                <span className={cn("rounded-lg p-1.5", t.kind === "entrada" ? "bg-mint-400/10 text-mint-400" : "bg-blaze-400/10 text-blaze-400")}>
                  {t.kind === "entrada" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-zinc-200">{t.description}</p>
                  <p className="text-[10.5px] text-zinc-600">{t.category}</p>
                </div>
                <p className={cn("font-mono text-[12.5px] font-bold tabular", t.kind === "entrada" ? "text-mint-400" : "text-blaze-400")}>
                  {t.kind === "entrada" ? "+" : "−"}{brl(t.amountCents)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-5 animate-fade-up" style={{ animationDelay: "440ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-white">
              <CalendarClock className="h-4 w-4 text-mint-400" /> Próximos eventos
            </h2>
            <span className="text-right">
              <span className="block text-[9.5px] font-bold uppercase tracking-widest text-zinc-600">Pipeline</span>
              <span className="font-mono text-[12px] font-bold text-mint-400 tabular">{brl(p.pipeline)}</span>
            </span>
          </div>
          <div className="space-y-1.5">
            {p.upcoming.length === 0 && <EmptyState icon={BusFront} title="Nenhum evento futuro" hint="Gere um orçamento e converta em viagem." />}
            {p.upcoming.map((e) => (
              <div key={e.id} className="group rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.045]">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-zinc-200">{e.title}</p>
                  <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status]}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10.5px] text-zinc-600">
                  <span className="text-azure-400">{formatDate(e.eventDate)}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.passengers}</span>
                  <span className="min-w-0 flex-1 truncate">{e.client}</span>
                  <span className="font-mono font-bold text-zinc-300 tabular">{brl(e.grossCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
