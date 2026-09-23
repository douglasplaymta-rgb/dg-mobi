import { notFound } from "next/navigation";
import { db } from "@/db";
import { quotes, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Bus } from "lucide-react";
import { brl, formatDate } from "@/lib/format";
import { PrintBar } from "./print-bar";
import { PixButton } from "@/components/PixButton";

export const dynamic = "force-dynamic";

const UNIT_LABEL: Record<string, string> = { fixo: "pacote", km: "km rodado", hora: "hora de serviço", diaria: "diária" };

function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`print-sheet mx-auto mb-8 w-full max-w-[210mm] bg-white p-[14mm] text-zinc-800 shadow-2xl shadow-black/60 sm:rounded-lg ${className}`} style={{ minHeight: "280mm" }}>
      {children}
    </div>
  );
}

function DocHeader({ number, company }: { number: string; company: Record<string, string> }) {
  return (
    <header className="flex items-start justify-between border-b-2 border-emerald-700 pb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
          <Bus className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-zinc-900">
            DG MOBI<span className="text-emerald-600">MAGIC</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Turismo & Entretenimento
          </p>
        </div>
      </div>
      <div className="text-right text-[11px] leading-relaxed text-zinc-600">
        <p className="font-bold text-zinc-900">{company.companyLegalName}</p>
        <p>CNPJ: {company.companyCnpj}</p>
        <p>{company.companyPhone} · {company.companyEmail}</p>
      </div>
    </header>
  );
}

function Divider() {
  return <div className="my-5 h-px bg-zinc-200" />;
}

function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11.5px] leading-relaxed text-zinc-700 text-justify">
      <strong className="text-zinc-900">CLÁUSULA {n}ª — {title}.</strong> {children}
    </p>
  );
}

function SignatureBlock({ company }: { company: Record<string, string> }) {
  return (
    <div className="mt-14 grid grid-cols-2 gap-10">
      <div className="text-center">
        <div className="mb-1 border-b border-zinc-400 pb-8" />
        <p className="text-[11px] font-bold text-zinc-900">{company.companyLegalName}</p>
        <p className="text-[10.5px] text-zinc-500">{company.founderName} — Sócio-fundador · CNPJ {company.companyCnpj}</p>
      </div>
      <div className="text-center">
        <div className="mb-1 border-b border-zinc-400 pb-8" />
        <p className="text-[11px] font-bold text-zinc-900">CONTRATANTE</p>
        <p className="text-[10.5px] text-zinc-500">Assinatura do responsável legal</p>
      </div>
    </div>
  );
}

export default async function QuoteDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === "novo") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Criar Novo Orçamento</h1>
          <p className="mt-2 text-zinc-400">O formulário de criação de orçamentos deve estar implementado num componente próprio ou modal.</p>
        </div>
      </div>
    );
  }

  const numericId = Number(id);
  if (isNaN(numericId)) {
    notFound();
  }

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, numericId));
  if (!quote) notFound();

  const settingRows = await db.select().from(settings);
  const c = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));

  const issueDate = new Date(quote.createdAt ?? Date.now());
  const validUntil = new Date(issueDate.getTime() + ((quote.validDays ?? 15) * 86400000));
  const unitLabel = UNIT_LABEL[quote.priceMode ?? "fixo"] ?? "pacote";
  const unitCents = quote.unitPriceCents ?? 0;
  const sinal = Math.round(quote.totalCents * 0.3);
  const restante = quote.totalCents - sinal;

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <PrintBar quoteId={quote.id} number={quote.number} status={quote.status ?? "rascunho"} />

      <div className="mt-8 px-3 sm:px-6">
        {/* FOLHA 1 — PROPOSTA COMERCIAL */}
        <Sheet className="print-break">
          <DocHeader number={quote.number} company={c} />

          <div className="mt-6 flex items-center justify-between rounded-lg bg-zinc-950 px-5 py-3.5 text-white">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-400">Documento 1 de 2</p>
              <h1 className="text-xl font-bold tracking-tight">Proposta Comercial</h1>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold text-emerald-400">{quote.number}</p>
              <p className="text-[10px] text-zinc-400">Emissão: {formatDate(issueDate.toISOString())}</p>
            </div>
          </div>

          <section className="mt-6 rounded-lg border border-zinc-200 p-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-700">À contratante</p>
            <p className="text-[15px] font-bold text-zinc-900">{quote.clientName}</p>
            <div className="mt-1 flex flex-wrap gap-x-6 text-[11.5px] text-zinc-600">
              {quote.clientDocument && <p>CNPJ/CPF: <strong className="text-zinc-800">{quote.clientDocument}</strong></p>}
              {quote.clientAddress && <p>{quote.clientAddress}</p>}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Data do evento", value: formatDate(quote.eventDate) },
              { label: "Rota", value: `${quote.origin ?? "—"} → ${quote.destination ?? "—"}` },
              { label: "Passageiros", value: `${quote.passengers ?? 0} pessoas` },
              { label: "Veículo", value: quote.vehicle ?? "—" },
            ].map((d) => (
              <div key={d.label} className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-zinc-400">{d.label}</p>
                <p className="mt-1 text-[11.5px] font-semibold leading-snug text-zinc-900">{d.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-700">Investimento</p>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-zinc-950 text-left text-[10px] uppercase tracking-widest text-white">
                  <th className="rounded-tl-md px-3 py-2.5">Descrição do serviço</th>
                  <th className="px-3 py-2.5 text-center">Qtd.</th>
                  <th className="px-3 py-2.5 text-right">Valor unit.</th>
                  <th className="rounded-tr-md px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-200">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-zinc-900">Fretamento exclusivo — {quote.vehicle}</p>
                    <p className="mt-0.5 text-[10.5px] text-zinc-500">
                      {quote.origin} → {quote.destination} · {formatDate(quote.eventDate)} · até {quote.hours}h de serviço · {quote.passengers} passageiros
                    </p>
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-zinc-700">{quote.quantity} {unitLabel}</td>
                  <td className="px-3 py-3 text-right font-mono text-zinc-700">{brl(unitCents)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-zinc-900">{brl(quote.totalCents)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total da proposta</td>
                  <td className="px-3 py-3 text-right font-mono text-base font-bold text-emerald-700">{brl(quote.totalCents)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* PAINEL DE PAGAMENTO PIX INTEGRADO */}
          <section className="mt-6 rounded-lg bg-zinc-950 p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-400">Pagamento Instantâneo</p>
              <h2 className="text-sm font-semibold text-zinc-100">Pix para Reserva da Proposta</h2>
              <p className="text-[11px] text-zinc-400">Escaneie o QR Code ou utilize o código Copia e Cola para efetuar o pagamento com segurança.</p>
            </div>
            <PixButton 
              quoteId={quote.id} 
              amountCents={quote.totalCents} 
              clientDocument={quote.clientDocument} 
            />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-700">Condições de pagamento</p>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-zinc-600">
                <li>· Sinal de reserva (30%): <strong className="text-zinc-900">{brl(sinal)}</strong> na assinatura.</li>
                <li>· Saldo restante: <strong className="text-zinc-900">{brl(restante)}</strong> até 48h antes do embarque.</li>
                <li>· Pix, transferência ou boleto faturado (CNPJ).</li>
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-700">Incluso no valor</p>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-zinc-600">
                <li>· Motorista profissional (categoria D/E) e seguro APP.</li>
                <li>· Combustível, ar-condicionado e som ambiente.</li>
                <li>· Validade da proposta: <strong className="text-zinc-900">{quote.validDays} dias</strong> — até {formatDate(validUntil.toISOString())}.</li>
              </ul>
            </div>
          </section>

          {quote.notes && (
            <section className="mt-4 rounded-lg bg-amber-50 p-4">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em] text-amber-700">Observações</p>
              <p className="text-[11px] leading-relaxed text-zinc-700">{quote.notes}</p>
            </section>
          )}

          <footer className="mt-auto pt-8 text-center text-[9.5px] text-zinc-400">
            <Divider />
            <p>{c.companyLegalName} · {c.companyAddress}</p>
            <p className="mt-0.5">Proposta válida até {formatDate(validUntil.toISOString())} · Sujeita a disponibilidade de frota</p>
          </footer>
        </Sheet>

        {/* FOLHA 2 — CONTRATO */}
        <Sheet>
          <DocHeader number={quote.number} company={c} />

          <div className="mt-6 rounded-lg bg-zinc-950 px-5 py-3.5 text-white">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-400">Documento 2 de 2 · Ref. {quote.number}</p>
            <h1 className="text-lg font-bold tracking-tight">Contrato de Prestação de Serviços de Fretamento</h1>
          </div>

          <div className="mt-6 space-y-1 text-[11.5px] leading-relaxed text-zinc-700 text-justify">
            <p>
              <strong className="text-zinc-900">CONTRATADA:</strong> {c.companyLegalName}, pessoa jurídica de direito privado,
              inscrita no CNPJ sob o nº {c.companyCnpj}, com sede em {c.companyAddress}, neste ato representada por seu
              sócio-fundador, <strong className="text-zinc-900">{c.founderName}</strong>.
            </p>
            <p className="mt-2">
              <strong className="text-zinc-900">CONTRATANTE:</strong> {quote.clientName}
              {quote.clientDocument ? `, inscrita no CNPJ/CPF sob o nº ${quote.clientDocument}` : ""}
              {quote.clientAddress ? `, com endereço em ${quote.clientAddress}` : ""}.
            </p>
            <p className="mt-2">As partes acima identificadas têm, entre si, justo e acordado o presente Contrato de Prestação
              de Serviços de Transporte e Fretamento, que se regerá pelas cláusulas seguintes:</p>
          </div>

          <Divider />

          <Clause n={1} title="DO OBJETO">
            A CONTRATADA prestará à CONTRATANTE serviço de fretamento exclusivo com {quote.vehicle}, para até{" "}
            {quote.passengers} passageiros, na rota {quote.origin} → {quote.destination}, a ser realizado em{" "}
            {formatDate(quote.eventDate)}, com duração estimada de {quote.hours} horas.
          </Clause>
          <Clause n={2} title="DO VALOR E DO PAGAMENTO">
            Pelos serviços descritos na Cláusula 1ª, a CONTRATANTE pagará à CONTRATADA o valor total de{" "}
            <strong>{brl(quote.totalCents)}</strong> ({quote.quantity} {unitLabel} × {brl(unitCents)}), sendo{" "}
            {brl(sinal)} (30%) como sinal de reserva e o saldo de {brl(restante)} até 48 (quarenta e oito) horas antes do embarque.
            O não pagamento do saldo no prazo autoriza a CONTRATADA a suspender o serviço, sem devolução do sinal.
          </Clause>
          <Clause n={3} title="DAS OBRIGAÇÕES DA CONTRATADA">
            Disponibilizar veículo em perfeitas condições mecânicas, higienizado, com documentação e vistorias em dia, motorista
            habilitado na categoria exigida e seguro de responsabilidade civil e APP (Acidentes Pessoais de Passageiros), bem como
            cumprir os horários de embarque e desembarque acordados.
          </Clause>
          <Clause n={4} title="DAS OBRIGAÇÕES DA CONTRATANTE">
            Informar a lista nominal de passageiros até 24h antes da viagem; garantir que menores de idade estejam com
            autorização legal dos responsáveis; zelar pelo patrimônio do veículo, respondendo por danos causados por seus
            passageiros; e efetuar os pagamentos nas condições da Cláusula 2ª.
          </Clause>
          <Clause n={5} title="DO CANCELAMENTO">
            O cancelamento pela CONTRATANTE com mais de 7 (sete) dias de antecedência implica devolução de 80% do sinal; entre 7
            e 3 dias, o sinal ficará retido a título de ressarcimento; com menos de 72 horas, será devido o valor integral do
            contrato. A CONTRATADA poderá cancelar por caso fortuito ou força maior, devolvendo integralmente os valores recebidos.
          </Clause>
          <Clause n={6} title="DAS DISPOSIÇÕES GERAIS">
            Alterações de rota, horários ou quantidade de passageiros deverão ser acordadas por escrito e poderão implicar
            reajuste do valor. É vedada a subcontratação do serviço pela CONTRATANTE. A tolerância máxima de espera no embarque
            é de 60 (sessenta) minutos, após o que o serviço poderá ser encerrado sem reembolso.
          </Clause>
          <Clause n={7} title="DO FORO">
            Fica eleito o foro da Comarca de Fortaleza/CE para dirimir quaisquer controvérsias oriundas deste contrato, com
            renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </Clause>

          <p className="mt-6 text-[11.5px] text-zinc-700">
            E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor.
          </p>
          <p className="mt-4 text-[11.5px] font-semibold text-zinc-900">
            Fortaleza Ceara, {formatDate(issueDate.toISOString())}.
          </p>

          <SignatureBlock company={c} />
        </Sheet>
      </div>
    </div>
  );
}