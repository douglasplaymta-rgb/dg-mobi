import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CaixaClient } from "./caixa-client";

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const rows = await db.select().from(transactions).orderBy(desc(transactions.txDate), desc(transactions.id));
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  let todayIn = 0, todayOut = 0, monthIn = 0, monthOut = 0, saldo = 0;
  for (const t of rows) {
    const v = t.kind === "entrada" ? t.amountCents : -t.amountCents;
    saldo += v;
    if (t.txDate === today) {
      if (t.kind === "entrada") todayIn += t.amountCents; else todayOut += t.amountCents;
    }
    if (t.txDate.startsWith(thisMonth)) {
      if (t.kind === "entrada") monthIn += t.amountCents; else monthOut += t.amountCents;
    }
  }

  // agrupa por dia (mais recente primeiro)
  const groups = new Map<string, typeof rows>();
  for (const t of rows) {
    if (!groups.has(t.txDate)) groups.set(t.txDate, []);
    groups.get(t.txDate)!.push(t);
  }

  return (
    <CaixaClient
      groups={[...groups.entries()].map(([date, items]) => ({
        date,
        items: items.map((t) => ({ id: t.id, description: t.description, category: t.category, kind: t.kind, amountCents: t.amountCents })),
      }))}
      totals={{ todayIn, todayOut, monthIn, monthOut, saldo, today }}
    />
  );
}
