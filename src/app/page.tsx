import { db } from "@/db";
import { transactions, events, settings, clients } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { monthKey, monthLabel, MONTH_SHORT } from "@/lib/format";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

/** Categorias de saída que NÃO são custo operacional (são distribuições) */
const DISTRIBUTION_CATEGORIES = new Set(["Pró-labore", "Fundo de Frota"]);

export default async function DashboardPage() {
  const [txs, evs, settingRows, clientRows] = await Promise.all([
    db.select().from(transactions).orderBy(asc(transactions.txDate)),
    db.select().from(events).orderBy(asc(events.eventDate)),
    db.select().from(settings),
    db.select({ id: clients.id, name: clients.name }).from(clients),
  ]);

  const cfg = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));
  const prolaborePct = Number(cfg.prolaborePct ?? 55);
  const fleetPct = Number(cfg.fleetPct ?? 45);
  const founderName = cfg.founderName ?? "Douglas Pereira";

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = monthKey(today);

  // ── Série mensal (últimos 7 meses) ─────────────────────────
  const months: string[] = [];
  {
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
    }
  }
  const byMonth = new Map<string, { bruto: number; custos: number }>();
  months.forEach((m) => byMonth.set(m, { bruto: 0, custos: 0 }));
  for (const t of txs) {
    const key = monthKey(t.txDate);
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    if (t.kind === "entrada") bucket.bruto += t.amountCents;
    else if (!DISTRIBUTION_CATEGORIES.has(t.category)) bucket.custos += t.amountCents;
  }
  const series = months.map((m) => {
    const b = byMonth.get(m)!;
    return { name: monthLabel(m), bruto: b.bruto, custos: b.custos, liquido: b.bruto - b.custos };
  });

  // ── KPIs do mês corrente ───────────────────────────────────
  const cur = byMonth.get(currentMonth) ?? { bruto: 0, custos: 0 };
  const liquido = cur.bruto - cur.custos;
  const prolabore = Math.max(0, liquido) * (prolaborePct / 100);
  const fundo = Math.max(0, liquido) * (fleetPct / 100);
  const prevKey = months[months.length - 2];
  const prev = byMonth.get(prevKey);
  const deltaBruto = prev && prev.bruto > 0 ? ((cur.bruto - prev.bruto) / prev.bruto) * 100 : 0;

  // Fundo de frota acumulado (histórico inteiro, pela regra)
  let resultadoHistorico = 0;
  for (const t of txs) {
    if (t.kind === "entrada") resultadoHistorico += t.amountCents;
    else if (!DISTRIBUTION_CATEGORIES.has(t.category)) resultadoHistorico -= t.amountCents;
  }
  const fundoAcumulado = Math.max(0, resultadoHistorico) * (fleetPct / 100);

  // ── Fluxo diário (últimos 30 dias) ─────────────────────────
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const t of txs) {
    if (dayMap.has(t.txDate)) {
      dayMap.set(t.txDate, (dayMap.get(t.txDate) ?? 0) + (t.kind === "entrada" ? t.amountCents : -t.amountCents));
    }
  }
  const dailyFlow = [...dayMap.entries()].map(([iso, fluxo]) => {
    const day = new Date(`${iso}T12:00:00`);
    return { name: `${day.getDate()} ${MONTH_SHORT[day.getMonth()]}`, fluxo };
  });

  // ── Caixa de hoje ──────────────────────────────────────────
  const todayTx = txs
    .filter((t) => t.txDate === today)
    .reverse()
    .map((t) => ({ id: t.id, description: t.description, category: t.category, kind: t.kind, amountCents: t.amountCents }));
  const todayIn = todayTx.filter((t) => t.kind === "entrada").reduce((s, t) => s + t.amountCents, 0);
  const todayOut = todayTx.filter((t) => t.kind === "saida").reduce((s, t) => s + t.amountCents, 0);

  // ── Próximos eventos ───────────────────────────────────────
  const clientName = new Map(clientRows.map((c) => [c.id, c.name]));
  const upcoming = evs
    .filter((e) => e.eventDate >= today && e.status !== "cancelado")
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      title: e.title,
      eventDate: e.eventDate,
      client: e.clientId ? clientName.get(e.clientId) ?? "—" : "—",
      status: e.status,
      grossCents: e.grossCents,
      passengers: e.passengers,
      destination: e.destination ?? "",
    }));
  const pipeline = upcoming.reduce((s, e) => s + e.grossCents, 0);

  const monthNameLong = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <DashboardClient
      monthName={monthNameLong}
      series={series}
      dailyFlow={dailyFlow}
      todayTx={todayTx}
      todayIn={todayIn}
      todayOut={todayOut}
      upcoming={upcoming}
      pipeline={pipeline}
      kpis={{ bruto: cur.bruto, custos: cur.custos, liquido, prolabore, fundo, deltaBruto, fundoAcumulado }}
      division={{ prolaborePct, fleetPct, founderName }}
      counts={{ clients: clientRows.length, eventosAtivos: evs.filter((e) => e.eventDate >= today && e.status !== "cancelado").length }}
    />
  );
}
