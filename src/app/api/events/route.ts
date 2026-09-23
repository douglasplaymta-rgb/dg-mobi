import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(events).orderBy(asc(events.eventDate));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title || !b.eventDate) {
    return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });
  }
  const [row] = await db
    .insert(events)
    .values({
      clientId: b.clientId ?? null,
      title: String(b.title).trim(),
      eventDate: b.eventDate,
      origin: b.origin ?? null,
      destination: b.destination ?? null,
      passengers: Number(b.passengers) || 0,
      hours: Number(b.hours) || 0,
      vehicle: b.vehicle ?? "Van Executiva",
      status: b.status ?? "agendado",
      grossCents: Number(b.grossCents) || 0,
      costCents: Number(b.costCents) || 0,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
