import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.clientName || !String(b.clientName).trim()) {
    return NextResponse.json({ error: "Cliente é obrigatório" }, { status: 400 });
  }
  const [{ nextId }] = await db
    .select({ nextId: sql<number>`coalesce(max(id), 0) + 1` })
    .from(quotes);
  const number = `ORC-${new Date().getFullYear()}-${String(nextId).padStart(4, "0")}`;
  const [row] = await db
    .insert(quotes)
    .values({
      number,
      clientId: b.clientId ?? null,
      clientName: String(b.clientName).trim(),
      clientDocument: b.clientDocument ?? null,
      clientAddress: b.clientAddress ?? null,
      eventDate: b.eventDate ?? null,
      origin: b.origin ?? null,
      destination: b.destination ?? null,
      passengers: Number(b.passengers) || 0,
      hours: Number(b.hours) || 0,
      vehicle: b.vehicle ?? "Van Executiva",
      priceMode: b.priceMode ?? "fixo",
      quantity: Number(b.quantity) || 1,
      unitPriceCents: Number(b.unitPriceCents) || 0,
      totalCents: Number(b.totalCents) || 0,
      validDays: Number(b.validDays) || 15,
      notes: b.notes ?? null,
      status: "rascunho",
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
