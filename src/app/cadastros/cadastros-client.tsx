"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Pencil,
  Building2,
  UserRound,
  Lock,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  IdCard,
} from "lucide-react";
import { maskDocument, obfuscateDoc, cn } from "@/lib/format";
import { PageHeader, KpiCard, Badge, Modal, PrimaryButton, GhostButton, EmptyState } from "@/components/ui";

type Entry = {
  id: number; holderName: string; docType: string; docNumber: string; personType: string;
  rgOrIe: string; email: string; phone: string; cep: string; address: string;
  city: string; state: string; notes: string;
};

const emptyForm = { holderName: "", docNumber: "", rgOrIe: "", email: "", phone: "", cep: "", address: "", city: "", state: "", notes: "" };

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); }}
      className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-mint-400"
      title="Copiar documento"
    >
      {ok ? <Check className="h-3.5 w-3.5 text-mint-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function CadastrosClient({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<"todos" | "cpf" | "cnpj">("todos");
  const [search, setSearch] = useState("");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "todos" && e.docType !== filter) return false;
      if (!q) return true;
      return [e.holderName, e.docNumber, e.city, e.email].join(" ").toLowerCase().includes(q);
    });
  }, [entries, filter, search]);

  const toggleReveal = (id: number) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const counts = {
    total: entries.length,
    cpf: entries.filter((e) => e.docType === "cpf").length,
    cnpj: entries.filter((e) => e.docType === "cnpj").length,
    corp: entries.filter((e) => e.personType === "corporativo").length,
  };

  const openNew = () => { setEditingId(null); setForm(emptyForm); setFormError(""); setFormOpen(true); };
  const openEdit = (e: Entry) => {
    setEditingId(e.id);
    setForm({ holderName: e.holderName, docNumber: e.docNumber, rgOrIe: e.rgOrIe, email: e.email, phone: e.phone, cep: e.cep, address: e.address, city: e.city, state: e.state, notes: e.notes });
    setFormError("");
    setFormOpen(true);
  };

  const save = () => {
    setFormError("");
    if (!form.holderName.trim()) return setFormError("Informe o titular do documento.");
    const digits = form.docNumber.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) return setFormError("Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.");
    start(async () => {
      if (editingId) {
        const { docNumber, ...rest } = form;
        await fetch(`/api/registry/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) });
      } else {
        const res = await fetch("/api/registry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) { const j = await res.json(); setFormError(j.error ?? "Erro ao salvar."); return; }
      }
      setFormOpen(false);
      router.refresh();
    });
  };

  const remove = (id: number) => {
    start(async () => {
      await fetch(`/api/registry/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      router.refresh();
    });
  };

  const f = (k: keyof typeof emptyForm) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: k === "docNumber" ? maskDocument(e.target.value) : e.target.value })),
  });

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader kicker="Dados sensíveis" title="Cofre de CPFs & CNPJs" subtitle="Cadastros de clientes corporativos e particulares com exibição mascarada">
        <PrimaryButton onClick={openNew}><Plus className="h-4 w-4" /> Novo documento</PrimaryButton>
      </PageHeader>

      {/* aviso de segurança */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-mint-400/20 bg-mint-400/[0.05] px-4 py-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <span className="rounded-xl bg-mint-400/15 p-2 text-mint-400"><Lock className="h-4 w-4" /></span>
        <p className="text-[12px] leading-relaxed text-zinc-400">
          <strong className="text-mint-300">Ambiente protegido.</strong> Os números de documentos são exibidos parcialmente ofuscados por padrão, em conformidade com boas práticas de LGPD. Use o ícone de olho para revelar apenas quando necessário.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon={IdCard} label="Total de cadastros" value={String(counts.total)} tone="azure" />
        <KpiCard icon={UserRound} label="CPFs" value={String(counts.cpf)} tone="mint" delay={50} />
        <KpiCard icon={Building2} label="CNPJs" value={String(counts.cnpj)} tone="gold" delay={100} />
        <KpiCard icon={ShieldCheck} label="Corporativos" value={String(counts.corp)} tone="rose" delay={150} />
      </div>

      {/* filtros */}
      <div className="mt-5 flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-ink-900 p-1">
          {([["todos", "Todos"], ["cpf", "CPF"], ["cnpj", "CNPJ"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={cn("rounded-lg px-4 py-1.5 text-[12px] font-bold transition-all",
                filter === k ? "bg-mint-400 text-ink-950" : "text-zinc-500 hover:text-zinc-200")}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input className="field pl-9" placeholder="Buscar titular, documento, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* tabela */}
      <section className="panel mt-4 overflow-hidden animate-fade-up" style={{ animationDelay: "260ms" }}>
        {filtered.length === 0 && <EmptyState icon={ShieldCheck} title="Nenhum documento encontrado" hint="Cadastre um CPF ou CNPJ no botão acima." />}
        {filtered.length > 0 && (
          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((e) => {
              const isRevealed = revealed.has(e.id);
              return (
                <li key={e.id} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    e.docType === "cpf" ? "border-mint-400/25 bg-mint-400/10 text-mint-400" : "border-gold-400/25 bg-gold-400/10 text-gold-400")}>
                    {e.docType === "cpf" ? <UserRound className="h-4.5 w-4.5 h-[18px] w-[18px]" /> : <Building2 className="h-[18px] w-[18px]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13.5px] font-bold text-white">{e.holderName}</p>
                      <Badge tone={e.docType === "cpf" ? "mint" : "gold"}>{e.docType.toUpperCase()}</Badge>
                      <Badge tone={e.personType === "corporativo" ? "azure" : "zinc"}>{e.personType === "corporativo" ? "Corporativo" : "Particular"}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className={cn("font-mono text-[12.5px] tabular transition-all", isRevealed ? "text-mint-300" : "tracking-wider text-zinc-500")}>
                        {isRevealed ? e.docNumber : obfuscateDoc(e.docNumber)}
                      </span>
                      <button onClick={() => toggleReveal(e.id)} className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-white" title={isRevealed ? "Ocultar" : "Revelar"}>
                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <CopyButton text={e.docNumber} />
                    </div>
                  </div>
                  <div className="hidden min-w-0 flex-1 lg:block">
                    <p className="truncate text-[12px] text-zinc-400">{e.email || "—"}</p>
                    <p className="truncate text-[11px] text-zinc-600">{[e.city, e.state].filter(Boolean).join("/") || "—"} · {e.phone || "s/ telefone"}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openEdit(e)} className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-azure-400" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(e.id)} className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-blaze-400/10 hover:text-blaze-400" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* confirmação de exclusão */}
      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Excluir documento?" subtitle="Esta ação remove permanentemente o registro do cofre.">
        <div className="flex justify-end gap-2">
          <GhostButton onClick={() => setConfirmDelete(null)}>Cancelar</GhostButton>
          <button onClick={() => confirmDelete && remove(confirmDelete)} disabled={pending}
            className="rounded-xl bg-blaze-400 px-4 py-2.5 text-[13px] font-bold text-ink-950 transition-colors hover:bg-rose-300 disabled:opacity-40">
            Sim, excluir
          </button>
        </div>
      </Modal>

      {/* formulário */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? "Editar cadastro" : "Novo documento"} subtitle="CPF (11 dígitos) ou CNPJ (14 dígitos) — o tipo é detectado automaticamente" wide>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Titular *</span><input className="field" placeholder="Nome completo ou razão social" {...f("holderName")} /></label>
          <label className="block"><span className="label">Documento (CPF/CNPJ) *</span>
            <input className="field font-mono tabular" placeholder="000.000.000-00" inputMode="numeric" disabled={!!editingId} {...f("docNumber")} />
          </label>
          <label className="block"><span className="label">RG / Inscrição Estadual</span><input className="field" {...f("rgOrIe")} /></label>
          <label className="block"><span className="label">Telefone</span><input className="field" placeholder="(11) 90000-0000" {...f("phone")} /></label>
          <label className="block"><span className="label">E-mail</span><input className="field" type="email" {...f("email")} /></label>
          <label className="block"><span className="label">CEP</span><input className="field" placeholder="00000-000" {...f("cep")} /></label>
          <label className="block sm:col-span-2"><span className="label">Endereço</span><input className="field" placeholder="Rua, número, bairro" {...f("address")} /></label>
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <label className="col-span-2 block"><span className="label">Cidade</span><input className="field" {...f("city")} /></label>
            <label className="block"><span className="label">UF</span><input className="field" maxLength={2} {...f("state")} /></label>
          </div>
          <label className="block sm:col-span-2"><span className="label">Observações</span><textarea className="field min-h-16 resize-none" placeholder="Finalidade do cadastro, condições de faturamento…" {...f("notes")} /></label>
        </div>
        {formError && <p className="mt-3 text-[12px] font-semibold text-blaze-400">{formError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton onClick={() => setFormOpen(false)}>Cancelar</GhostButton>
          <PrimaryButton onClick={save} disabled={pending}>{editingId ? "Salvar alterações" : "Salvar no cofre"}</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
