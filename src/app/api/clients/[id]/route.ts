import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const allowed = ["name", "category", "document", "contactName", "email", "phone", "whatsapp", "city", "state", "address", "status", "notes"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in b) patch[k] = b[k];
  const [row] = await db.update(clients).set(patch).where(eq(clients.id, Number(id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, Number(id)));
  return NextResponse.json({ ok: true });
}
