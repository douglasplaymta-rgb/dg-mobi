import Link from "next/link";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Bus, Plus, FileText, ArrowRight, Trash2 } from "lucide-react";
import { brl, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage() {
  const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.createdAt));

  async function deleteQuote(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    if (id) {
      await db.delete(quotes).where(eq(quotes.id, id));
      revalidatePath("/orcamentos");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-16 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Bus className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Orçamentos e Contratos</h1>
              <p className="text-xs text-zinc-400">Gestão de propostas de fretamento</p>
            </div>
          </div>
          <Link
            href="/orcamentos/novo"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" /> Novo Orçamento
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        {allQuotes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-zinc-600" />
            <h2 className="mt-4 text-sm font-semibold text-zinc-300">Nenhum orçamento encontrado</h2>
            <p className="mt-1 text-xs text-zinc-500">Crie o seu primeiro orçamento para começar.</p>
            <Link
              href="/orcamentos/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Criar Orçamento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {allQuotes.map((q) => {
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">{q.number}</span>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        {q.status ?? "rascunho"}
                      </span>
                    </div>
                    <h2 className="mt-1 text-sm font-semibold text-zinc-100">{q.clientName}</h2>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {q.origin ?? "—"} → {q.destination ?? "—"} · {q.eventDate ? formatDate(q.eventDate) : "—"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">Valor Total</p>
                      <p className="font-mono text-sm font-bold text-emerald-400">{brl(q.totalCents)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orcamentos/${q.id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
                      >
                        Ver Proposta <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      {/* Botão de Excluir Integrado */}
                      <form action={deleteQuote}>
                        <input type="hidden" name="id" value={q.id} />
                        <button
                          type="submit"
                          title="Excluir proposta"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition hover:bg-rose-500/20 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}