"use client";

import Link from "next/link";
import { ArrowLeft, Printer, FileCheck2 } from "lucide-react";
import { Badge, statusTone } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/format";

export function PrintBar({ quoteId, number, status }: { quoteId: number; number: string; status: string }) {
  return (
    <div className="no-print sticky top-0 z-50 border-b border-white/[0.07] bg-ink-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/orcamentos" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-zinc-300 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Voltar</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[13px] font-bold text-white">{number}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">Proposta comercial + contrato de fretamento</p>
        </div>
        <Badge tone={statusTone(status)}>{STATUS_LABEL[status]}</Badge>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-mint-400 px-4 py-2 text-[12.5px] font-bold text-ink-950 shadow-[0_8px_24px_-8px_rgba(52,211,153,0.6)] transition-all hover:bg-mint-300"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 pb-2 text-[10.5px] text-zinc-600">
        <FileCheck2 className="h-3 w-3 text-mint-400" />
        Dica: na janela de impressão, escolha “Salvar como PDF” para exportar o documento.
      </div>
    </div>
  );
}
