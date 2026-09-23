"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Wallet,
  CalendarDays,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
} from "lucide-react";
import { brl, formatDate, maskBRLInput, parseBRLToCents, todayISO, cn } from "@/lib/format";
import { PageHeader, KpiCard, Badge, PrimaryButton, EmptyState } from "@/components/ui";

const CATEGORIES_IN = ["Receita de Fretamento", "Receita Avulsa", "Outros"];
const CATEGORIES_OUT = ["Combustível", "Pedágio", "Manutenção", "Seguro", "Equipe", "Impostos e Taxas", "Operacional", "Pró-labore", "Fundo de Frota", "Outros"];

type TxItem = { id: number; description: string; category: string; kind: string; amountCents: number };
type Props = {
  groups: { date: string; items: TxItem[] }[];
  totals: { todayIn: number; todayOut: number; monthIn: number; monthOut: number; saldo: number; today: string };
};

export function CaixaClient({ groups, totals }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"entrada" | "saida">("entrada");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES_IN[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  const cats = kind === "entrada" ? CATEGORIES_IN : CATEGORIES_OUT;

  const pickKind = (k: "entrada" | "saida") => {
    setKind(k);
    setCategory((k === "entrada" ? CATEGORIES_IN : CATEGORIES_OUT)[0]);
  };

  const submit = () => {
    setError("");
    const cents = parseBRLToCents(amount);
    if (!description.trim()) return setError("Informe uma descrição.");
    if (cents <= 0) return setError("Informe um valor válido.");
    start(async () => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category, kind, amountCents: cents, txDate: date }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Erro ao lançar.");
        return;
      }
      setDescription("");
      setAmount("");
      router.refresh();
    });
  };

  const remove = (id: number) => {
    start(async () => {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader kicker="Financeiro operacional" title="Caixa Diário" subtitle="Controle de entradas, saídas e saldo em tempo real" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ArrowUpCircle} tone="mint" label="Entradas hoje" value={brl(totals.todayIn)} hint={formatDate(totals.today)} />
        <KpiCard icon={ArrowDownCircle} tone="rose" label="Saídas hoje" value={brl(totals.todayOut)} hint={`Saldo do dia: ${brl(totals.todayIn - totals.todayOut)}`} delay={60} />
        <KpiCard icon={CalendarDays} tone="azure" label="Resultado do mês" value={brl(totals.monthIn - totals.monthOut)} hint={`Entradas ${brl(totals.monthIn)} · Saídas ${brl(totals.monthOut)}`} delay={120} />
        <KpiCard icon={Scale} tone="gold" label="Saldo acumulado" value={brl(totals.saldo)} hint="Todo o histórico do caixa" delay={180} />
      </div>

      {/* Novo lançamento */}
      <section className="panel mt-4 p-5 animate-fade-up" style={{ animationDelay: "220ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-white">
            <Plus className="h-4 w-4 text-mint-400" /> Novo lançamento
          </h2>
          <div className="flex rounded-xl border border-white/10 bg-ink-900 p-1">
            {(["entrada", "saida"] as const).map((k) => (
              <button
                key={k}
                onClick={() => pickKind(k)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-[12px] font-bold transition-all",
                  kind === k
                    ? k === "entrada"
                      ? "bg-mint-400 text-ink-950"
                      : "bg-blaze-400 text-ink-950"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {k === "entrada" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <label className="block md:col-span-4">
            <span className="label">Descrição</span>
            <input className="field" placeholder="Ex.: Fretamento — Excursão Colégio" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </label>
          <label className="block md:col-span-3">
            <span className="label">Categoria</span>
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="label">Valor (R$)</span>
            <input className={cn("field font-mono tabular", kind === "entrada" ? "text-mint-300" : "text-blaze-400")} placeholder="0,00" inputMode="numeric" value={amount} onChange={(e) => setAmount(maskBRLInput(e.target.value))} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </label>
          <label className="block md:col-span-2">
            <span className="label">Data</span>
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="flex items-end md:col-span-1">
            <PrimaryButton onClick={submit} disabled={pending} className="w-full px-2">
              <Plus className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </div>
        {error && <p className="mt-2 text-[12px] font-semibold text-blaze-400">{error}</p>}
      </section>

      {/* Extrato agrupado por dia */}
      <div className="mt-4 space-y-4">
        {groups.length === 0 && (
          <section className="panel p-6"><EmptyState icon={Wallet} title="Caixa vazio" hint="Registre o primeiro lançamento acima." /></section>
        )}
        {groups.map((g, gi) => {
          const dayIn = g.items.filter((i) => i.kind === "entrada").reduce((s, i) => s + i.amountCents, 0);
          const dayOut = g.items.filter((i) => i.kind === "saida").reduce((s, i) => s + i.amountCents, 0);
          const net = dayIn - dayOut;
          const isToday = g.date === totals.today;
          return (
            <section key={g.date} className="panel overflow-hidden animate-fade-up" style={{ animationDelay: `${260 + gi * 40}ms` }}>
              <header className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-[13.5px] font-bold text-white">{formatDate(g.date)}</h3>
                  {isToday && <Badge tone="mint">hoje</Badge>}
                </div>
                <div className="flex items-center gap-4 text-[11.5px] font-semibold">
                  <span className="text-mint-400 tabular">+{brl(dayIn)}</span>
                  <span className="text-blaze-400 tabular">−{brl(dayOut)}</span>
                  <span className={cn("font-mono font-bold tabular", net >= 0 ? "text-white" : "text-blaze-400")}>{brl(net)}</span>
                </div>
              </header>
              <ul className="divide-y divide-white/[0.04]">
                {g.items.map((t) => (
                  <li key={t.id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                    <span className={cn("rounded-lg p-1.5", t.kind === "entrada" ? "bg-mint-400/10 text-mint-400" : "bg-blaze-400/10 text-blaze-400")}>
                      {t.kind === "entrada" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-zinc-200">{t.description}</p>
                    </div>
                    <Badge tone="zinc" className="hidden sm:inline-flex">{t.category}</Badge>
                    <p className={cn("w-28 text-right font-mono text-[13px] font-bold tabular", t.kind === "entrada" ? "text-mint-400" : "text-blaze-400")}>
                      {t.kind === "entrada" ? "+" : "−"}{brl(t.amountCents)}
                    </p>
                    <button
                      onClick={() => remove(t.id)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-zinc-700 opacity-0 transition-all hover:bg-blaze-400/10 hover:text-blaze-400 group-hover:opacity-100"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
