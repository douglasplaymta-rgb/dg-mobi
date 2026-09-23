import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(settings);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function PUT(req: Request) {
  const b = await req.json();
  const allowed = ["prolaborePct", "fleetPct"];
  for (const key of allowed) {
    if (key in b) {
      const value = String(Math.max(0, Math.min(100, Number(b[key]) || 0)));
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } });
    }
  }
  return NextResponse.json({ ok: true });
}
