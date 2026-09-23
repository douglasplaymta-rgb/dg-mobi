import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(transactions).orderBy(desc(transactions.txDate), desc(transactions.id));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const amountCents = Number(b.amountCents) || 0;
  if (!b.description || !b.txDate || amountCents <= 0) {
    return NextResponse.json({ error: "Descrição, data e valor são obrigatórios" }, { status: 400 });
  }
  if (!["entrada", "saida"].includes(b.kind)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  const [row] = await db
    .insert(transactions)
    .values({
      txDate: b.txDate,
      description: String(b.description).trim(),
      category: b.category ?? "Operacional",
      kind: b.kind,
      amountCents,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
