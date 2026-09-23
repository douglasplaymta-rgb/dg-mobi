import { NextResponse } from "next/server";
import { db } from "@/db";
import { registry } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  const allowed = ["holderName", "rgOrIe", "email", "phone", "cep", "address", "city", "state", "notes", "personType"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in b) patch[k] = b[k];
  const [row] = await db.update(registry).set(patch).where(eq(registry.id, Number(id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(registry).where(eq(registry.id, Number(id)));
  return NextResponse.json({ ok: true });
}
