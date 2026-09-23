import { db } from "@/db";
import { clients, events } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { CrmClient } from "./crm-client";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [rows, evs] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select().from(events).orderBy(asc(events.eventDate)),
  ]);

  return (
    <CrmClient
      clients={rows.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        document: c.document ?? "",
        contactName: c.contactName ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        whatsapp: c.whatsapp ?? "",
        city: c.city ?? "",
        state: c.state ?? "",
        address: c.address ?? "",
        status: c.status,
        notes: c.notes ?? "",
      }))}
      events={evs.map((e) => ({
        id: e.id,
        clientId: e.clientId,
        title: e.title,
        eventDate: e.eventDate,
        destination: e.destination ?? "",
        passengers: e.passengers,
        status: e.status,
        grossCents: e.grossCents,
        costCents: e.costCents,
      }))}
    />
  );
}
