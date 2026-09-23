import { NextResponse } from "next/server";
import { db } from "@/db";
import { registry } from "@/db/schema";
import { desc } from "drizzle-orm";
import { maskDocument, isValidCPF, isValidCNPJ } from "@/lib/format";

export async function GET() {
  const rows = await db.select().from(registry).orderBy(desc(registry.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const doc = maskDocument(String(b.docNumber ?? ""));
  const docType = doc.replace(/\D/g, "").length > 11 ? "cnpj" : "cpf";
  const valid = docType === "cpf" ? isValidCPF(doc) : isValidCNPJ(doc);
  if (!b.holderName || !String(b.holderName).trim()) {
    return NextResponse.json({ error: "Titular é obrigatório" }, { status: 400 });
  }
  if (!valid) {
    return NextResponse.json({ error: "Documento inválido — verifique a quantidade de dígitos" }, { status: 400 });
  }
  const [row] = await db
    .insert(registry)
    .values({
      holderName: String(b.holderName).trim(),
      docType,
      docNumber: doc,
      personType: b.personType ?? (docType === "cnpj" ? "corporativo" : "particular"),
      rgOrIe: b.rgOrIe ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      cep: b.cep ?? null,
      address: b.address ?? null,
      city: b.city ?? null,
      state: b.state ?? null,
      notes: b.notes ?? null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
