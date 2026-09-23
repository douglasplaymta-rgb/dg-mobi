"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileSignature,
  Sparkles,
  Route,
  CalendarDays,
  Users,
  Clock3,
  BusFront,
  Calculator,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";
import { brl, formatDate, maskBRLInput, parseBRLToCents, todayISO, STATUS_LABEL, CATEGORY_LABEL, cn } from "@/lib/format";
import { PageHeader, Badge, statusTone, PrimaryButton, EmptyState } from "@/components/ui";

type SimpleClient = { id: number; name: string; document: string; address: string };
type QuoteRow = {
  id: number; number: string; clientName: string; eventDate: string; destination: string;
  passengers: number; totalCents: number; status: string; createdAt: string;
};

const VEHICLES = ["Van Executiva 20 lugares", "Micro-ônibus 40 lugares", "Ônibus 46 lugares", "Ônibus 50 lugares (leito)", "2 veículos combinados"];
const PRICE_MODES = [
  { key: "fixo", label: "Valor fechado", unit: "pacote" },
  { key: "km", label: "Por quilômetro", unit: "km" },
  { key: "hora", label: "Por hora", unit: "horas" },
  { key: "diaria", label: "Por diária", unit: "diárias" },
] as const;

export function OrcamentosClient({ clients, quotes }: { clients: SimpleClient[]; quotes: QuoteRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [clientId, setClientId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [eventDate, setEventDate] = useState(todayISO());
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("");
  const [hours, setHours] = useState("");
  const [vehicle, setVehicle] = useState(VEHICLES[2]);
  const [priceMode, setPriceMode] = useState<(typeof PRICE_MODES)[number]["key"]>("fixo");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [validDays, setValidDays] = useState("15");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const qtyNum = useMemo(() => {
    if (priceMode === "fixo") return 1;
    if (priceMode === "hora") return Number(hours) || Number(quantity) || 1;
    return Number(quantity) || 1;
  }, [priceMode, hours, quantity]);

  const unitCents = parseBRLToCents(unitPrice);
  const totalCents = priceMode === "fixo" ? unitCents : unitCents * qtyNum;

  const pickClient = (id: string) => {
    if (!id) { setClientId(""); return; }
    const c = clients.find((x) => x.id === Number(id));
    if (!c) return;
    setClientId(c.id);
    setClientName(c.name);
    setClientDocument(c.document);
    setClientAddress(c.address);
  };

  const modeLabel = PRICE_MODES.find((m) => m.key === priceMode)!;

  const generate = () => {
    setError("");
    if (!clientName.trim()) return setError("Selecione ou digite o nome do contratante.");
    if (totalCents <= 0) return setError("Informe o valor da proposta.");
    start(async () => {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          clientName,
          clientDocument,
          clientAddress,
          eventDate,
          origin,
          destination,
          passengers: Number(passengers) || 0,
          hours: Number(hours) || 0,
          vehicle,
          priceMode,
          quantity: qtyNum,
          unitPriceCents: unitCents,
          totalCents,
          validDays: Number(validDays) || 15,
          notes,
        }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Erro ao gerar."); return; }
      const q = await res.json();
      router.push(`/orcamentos/${q.id}`);
    });
  };

  const setStatus = (id: number, status: string) => {
    start(async () => {
      await fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      router.refresh();
    });
  };

  const remove = (id: number) => {
    if (!confirm("Tens a certeza que pretendes excluir este orçamento?")) return;
    start(async () => {
      await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader kicker="Comercial" title="Orçamentos & Documentos" subtitle="Gere propostas comerciais e contratos prontos para impressão em segundos" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* ── Gerador ─────────────────────────────────── */}
        <section className="panel p-5 animate-fade-up xl:col-span-3" style={{ animationDelay: "80ms" }}>
          <h2 className="mb-1 flex items-center gap-2 font-display text-[15px] font-bold text-white">
            <Sparkles className="h-4 w-4 text-mint-400" /> Gerador instantâneo
          </h2>
          <p className="mb-5 text-[11.5px] text-zinc-500">Preencha os dados do evento. O documento sai numerado, datado e pronto para o PDF.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">Contratante (CRM)</span>
                <select className="field" value={clientId} onChange={(e) => pickClient(e.target.value)}>
                  <option value="">— digitar manualmente —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Nome do contratante *</span>
                <input className="field" placeholder="Ex.: Colégio Santa Luzia" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </label>
              <label className="block">
                <span className="label">CNPJ/CPF do contratante</span>
                <input className="field font-mono tabular" value={clientDocument} onChange={(e) => setClientDocument(e.target.value)} />
              </label>
              <label className="block">
                <span className="label">Endereço do contratante</span>
                <input className="field" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </label>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                <Route className="h-3.5 w-3.5 text-mint-400" /> Dados do evento
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="col-span-2 block">
                  <span className="label">Origem</span>
                  <input className="field" placeholder="Fortaleza/CE" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                </label>
                <label className="col-span-2 block">
                  <span className="label">Destino</span>
                  <input className="field" placeholder="Jericoacoara/CE" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Data</span>
                  <input type="date" className="field" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Passageiros</span>
                  <input className="field font-mono tabular" inputMode="numeric" placeholder="46" value={passengers} onChange={(e) => setPassengers(e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className="block">
                  <span className="label">Duração (h)</span>
                  <input className="field font-mono tabular" inputMode="numeric" placeholder="10" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className="block">
                  <span className="label">Veículo</span>
                  <select className="field" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                    {VEHICLES.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-mint-400/15 bg-mint-400/[0.03] p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                <Calculator className="h-3.5 w-3.5 text-mint-400" /> Precificação
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="col-span-2 block">
                  <span className="label">Modelo de cobrança</span>
                  <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-ink-900 p-1">
                    {PRICE_MODES.map((m) => (
                      <button key={m.key} onClick={() => setPriceMode(m.key)}
                        className={cn("rounded-lg py-1.5 text-[10.5px] font-bold transition-all",
                          priceMode === m.key ? "bg-mint-400 text-ink-950" : "text-zinc-500 hover:text-zinc-300")}>
                        {m.key === "fixo" ? "Fechado" : m.key === "km" ? "Km" : m.key === "hora" ? "Hora" : "Diária"}
                      </button>
                    ))}
                  </div>
                </label>
                {priceMode !== "fixo" && priceMode !== "hora" && (
                  <label className="block">
                    <span className="label">Qtd. ({modeLabel.unit})</span>
                    <input className="field font-mono tabular" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} />
                  </label>
                )}
                <label className="block">
                  <span className="label">{priceMode === "fixo" ? "Valor total (R$)" : `Valor por ${modeLabel.unit} (R$)`}</span>
                  <input className="field font-mono text-mint-300 tabular" placeholder="0,00" inputMode="numeric" value={unitPrice} onChange={(e) => setUnitPrice(maskBRLInput(e.target.value))} />
                </label>
                <label className="block">
                  <span className="label">Validade (dias)</span>
                  <input className="field font-mono tabular" inputMode="numeric" value={validDays} onChange={(e) => setValidDays(e.target.value.replace(/\D/g, ""))} />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-mint-400/10 pt-4">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total da proposta</p>
                  <p className="font-mono text-3xl font-bold text-mint-400 tabular">{brl(totalCents)}</p>
                  {priceMode !== "fixo" && unitCents > 0 && (
                    <p className="mt-0.5 text-[11px] text-zinc-500">{qtyNum} {modeLabel.unit} × {brl(unitCents)}</p>
                  )}
                </div>
                <PrimaryButton onClick={generate} disabled={pending || totalCents <= 0}>
                  <FileSignature className="h-4 w-4" />
                  {pending ? "Gerando…" : "Gerar proposta + contrato"}
                </PrimaryButton>
              </div>
            </div>

            <label className="block">
              <span className="label">Observações (aparecem na proposta)</span>
              <textarea className="field min-h-16 resize-none" placeholder="Ex.: Inclui seguro APP, 1 monitor, pedágios por conta da contratada…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            {error && <p className="text-[12px] font-semibold text-blaze-400">{error}</p>}
          </div>
        </section>

        {/* ── Histórico ───────────────────────────────── */}
        <section className="panel flex flex-col p-5 animate-fade-up xl:col-span-2" style={{ animationDelay: "140ms" }}>
          <h2 className="mb-1 flex items-center gap-2 font-display text-[15px] font-bold text-white">
            <FileText className="h-4 w-4 text-mint-400" /> Documentos gerados
          </h2>
          <p className="mb-4 text-[11.5px] text-zinc-500">{quotes.length} proposta{quotes.length === 1 ? "" : "s"} no histórico</p>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 240px)" }}>
            {quotes.length === 0 && <EmptyState icon={FileSignature} title="Nenhuma proposta ainda" hint="Use o gerador ao lado para criar a primeira." />}
            {quotes.map((q) => (
              <div key={q.id} className="group rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 transition-colors hover:border-mint-400/20 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-azure-400">{q.number}</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={q.status}
                      onChange={(e) => setStatus(q.id, e.target.value)}
                      disabled={pending}
                      className={cn("cursor-pointer rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-bold outline-none",
                        statusTone(q.status) === "mint" && "border-mint-400/30 text-mint-300",
                        statusTone(q.status) === "azure" && "border-azure-400/30 text-azure-400",
                        statusTone(q.status) === "rose" && "border-blaze-400/30 text-blaze-400",
                        statusTone(q.status) === "gold" && "border-gold-400/30 text-gold-400",
                        statusTone(q.status) === "zinc" && "border-white/15 text-zinc-400")}
                    >
                      {["rascunho", "enviado", "aprovado", "recusado"].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    {/* Botão de Excluir visível diretamente */}
                    <button 
                      onClick={() => remove(q.id)} 
                      title="Excluir proposta"
                      className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-blaze-400/10 hover:text-blaze-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-[13px] font-semibold text-zinc-200">{q.clientName}</p>
                <p className="mt-0.5 flex items-center gap-3 text-[10.5px] text-zinc-600">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(q.eventDate)}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{q.passengers}</span>
                  <span className="min-w-0 flex-1 truncate">{q.destination}</span>
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-2">
                  <span className="font-mono text-[13px] font-bold text-mint-400 tabular">{brl(q.totalCents)}</span>
                  <Link href={`/orcamentos/${q.id}`} className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 transition-colors hover:text-mint-300">
                    <Eye className="h-3.5 w-3.5" /> Ver documento
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}