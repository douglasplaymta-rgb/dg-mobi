import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b.name || !String(b.name).trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }
  const [row] = await db
    .insert(clients)
    .values({
      name: String(b.name).trim(),
      category: b.category ?? "escola",
      document: b.document ?? null,
      contactName: b.contactName ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      whatsapp: b.whatsapp ?? null,
      city: b.city ?? null,
      state: b.state ?? null,
      address: b.address ?? null,
      status: b.status ?? "ativo",
      notes: b.notes ?? null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
