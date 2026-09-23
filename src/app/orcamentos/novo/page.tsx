import { db } from "@/db";
import { quotes, registry, settings } from "@/db/schema";
import { redirect } from "next/navigation";
import { Bus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const clientList = await db.select().from(registry);

  async function createQuoteAction(formData: FormData) {
    "use server";
    const clientName = formData.get("clientName") as string;
    const eventDate = formData.get("eventDate") as string;
    const origin = formData.get("origin") as string;
    const destination = formData.get("destination") as string;
    const passengers = Number(formData.get("passengers") || 0);
    const hours = Number(formData.get("hours") || 0);
    const vehicle = formData.get("vehicle") as string;
    const totalCents = Math.round(Number(formData.get("total") || 0) * 100);

    const [inserted] = await db.insert(quotes).values({
      number: `ORC-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      eventDate,
      origin,
      destination,
      passengers,
      hours,
      vehicle,
      totalCents,
      status: "pendente",
    }).returning();

    redirect(`/orcamentos/${inserted.id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-2xl rounded-xl bg-zinc-900 p-8 shadow-xl border border-zinc-800">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Novo Orçamento</h1>
            <p className="text-xs text-zinc-400">Preencha os dados para gerar a proposta comercial e o contrato</p>
          </div>
        </div>

        <form action={createQuoteAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Nome do Cliente / Empresa</label>
            <input name="clientName" required placeholder="Ex: Empresa Exemplo Ltda" className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Data do Evento</label>
              <input type="date" name="eventDate" required className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Veículo</label>
              <input name="vehicle" required placeholder="Ex: Micro-ônibus Executivo" className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Origem</label>
              <input name="origin" required placeholder="Ex: Fortaleza - CE" className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Destino</label>
              <input name="destination" required placeholder="Ex: Jericoacoara - CE" className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Passageiros</label>
              <input type="number" name="passengers" defaultValue={25} className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Horas</label>
              <input type="number" name="hours" defaultValue={8} className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Valor Total (R$)</label>
              <input type="number" step="0.01" name="total" placeholder="1500.00" required className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <a href="/orcamentos" className="rounded-lg bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-700">Cancelar</a>
            <button type="submit" className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500">Gerar Proposta e Contrato</button>
          </div>
        </form>
      </div>
    </div>
  );
}