import { db } from "@/db";
import { registry } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CadastrosClient } from "./cadastros-client";

export const dynamic = "force-dynamic";

export default async function CadastrosPage() {
  const rows = await db.select().from(registry).orderBy(desc(registry.createdAt));
  return (
    <CadastrosClient
      entries={rows.map((r) => ({
        id: r.id,
        holderName: r.holderName,
        docType: r.docType,
        docNumber: r.docNumber,
        personType: r.personType,
        rgOrIe: r.rgOrIe ?? "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        cep: r.cep ?? "",
        address: r.address ?? "",
        city: r.city ?? "",
        state: r.state ?? "",
        notes: r.notes ?? "",
      }))}
    />
  );
}
