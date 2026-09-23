"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  UserRound,
  Handshake,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Pencil,
  History,
  Users,
  Wallet,
  MessageCircle,
  StickyNote,
  IdCard,
} from "lucide-react";
import { brl, formatDate, maskDocument, CATEGORY_LABEL, STATUS_LABEL, cn } from "@/lib/format";
import { PageHeader, Badge, statusTone, Modal, PrimaryButton, GhostButton, EmptyState } from "@/components/ui";

type ClientRow = {
  id: number; name: string; category: string; document: string; contactName: string;
  email: string; phone: string; whatsapp: string; city: string; state: string;
  address: string; status: string; notes: string;
};
type EventRow = {
  id: number; clientId: number | null; title: string; eventDate: string;
  destination: string; passengers: number; status: string; grossCents: number; costCents: number;
};

const TABS = [
  { key: "todos", label: "Todos", icon: Users },
  { key: "escola", label: "Escolas", icon: GraduationCap },
  { key: "empresa", label: "Empresas", icon: Building2 },
  { key: "particular", label: "Particulares", icon: UserRound },
  { key: "parceiro", label: "Parceiros", icon: Handshake },
];
const CAT_ICON: Record<string, typeof GraduationCap> = { escola: GraduationCap, empresa: Building2, particular: UserRound, parceiro: Handshake };
const CAT_TONE: Record<string, string> = { escola: "azure", empresa: "violet", particular: "gold", parceiro: "mint" };
const emptyForm = { name: "", category: "escola", document: "", contactName: "", email: "", phone: "", whatsapp: "", city: "", state: "", address: "", status: "ativo", notes: "" };

export function CrmClient({ clients, events }: { clients: ClientRow[]; events: EventRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (tab !== "todos" && c.category !== tab) return false;
      if (!q) return true;
      return [c.name, c.document, c.contactName, c.city, c.email].join(" ").toLowerCase().includes(q);
    });
  }, [clients, tab, search]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const selectedEvents = useMemo(
    () => (selected ? events.filter((e) => e.clientId === selected.id).sort((a, b) => b.eventDate.localeCompare(a.eventDate)) : []),
    [selected, events]
  );

  const revenueOf = (id: number) => events.filter((e) => e.clientId === id && e.status !== "cancelado").reduce((s, e) => s + e.grossCents, 0);
  const countOf = (id: number) => events.filter((e) => e.clientId === id).length;

  const openNew = () => { setEditingId(null); setForm(emptyForm); setFormError(""); setFormOpen(true); };
  const openEdit = (c: ClientRow) => {
    setEditingId(c.id);
    setForm({ name: c.name, category: c.category, document: c.document, contactName: c.contactName, email: c.email, phone: c.phone, whatsapp: c.whatsapp, city: c.city, state: c.state, address: c.address, status: c.status, notes: c.notes });
    setFormError("");
    setFormOpen(true);
  };

  const save = () => {
    setFormError("");
    if (!form.name.trim()) return setFormError("Informe o nome da instituição/contratante.");
    start(async () => {
      const res = await fetch(editingId ? `/api/clients/${editingId}` : "/api/clients", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const j = await res.json(); setFormError(j.error ?? "Erro ao salvar."); return; }
      setFormOpen(false);
      router.refresh();
    });
  };

  const updateStatus = (id: number, status: string) => {
    start(async () => {
      await fetch(`/api/clients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      router.refresh();
    });
  };

  const remove = (id: number) => {
    start(async () => {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setSelectedId(null);
      router.refresh();
    });
  };

  const f = (k: keyof typeof emptyForm) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: k === "document" ? maskDocument(e.target.value) : e.target.value })),
  });

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader kicker="Relacionamento" title="CRM — Clientes & Escolas" subtitle="Diretório unificado de contratantes, instituições de ensino e parceiros de turismo">
        <PrimaryButton onClick={openNew}><Plus className="h-4 w-4" /> Novo cadastro</PrimaryButton>
      </PageHeader>

      {/* Tabs + busca */}
      <div className="mb-5 flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.07] bg-ink-900 p-1">
          {TABS.map((t) => {
            const count = t.key === "todos" ? clients.length : clients.filter((c) => c.category === t.key).length;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all",
                  tab === t.key ? "bg-mint-400 text-ink-950" : "text-zinc-500 hover:text-zinc-200")}>
                <t.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className={cn("rounded-full px-1.5 text-[10px]", tab === t.key ? "bg-ink-950/20" : "bg-white/[0.06]")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input className="field pl-9" placeholder="Buscar por nome, documento, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Grade de cartões */}
      {filtered.length === 0 && <section className="panel p-6"><EmptyState icon={Users} title="Nenhum registro encontrado" hint="Ajuste a busca ou cadastre um novo contato." /></section>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c, i) => {
          const Icon = CAT_ICON[c.category] ?? Users;
          const revenue = revenueOf(c.id);
          const count = countOf(c.id);
          return (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className="panel panel-hover group p-5 text-left animate-fade-up" style={{ animationDelay: `${120 + i * 40}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border",
                    c.category === "escola" && "border-azure-400/25 bg-azure-400/10 text-azure-400",
                    c.category === "empresa" && "border-violet-400/25 bg-violet-400/10 text-violet-300",
                    c.category === "particular" && "border-gold-400/25 bg-gold-400/10 text-gold-400",
                    c.category === "parceiro" && "border-mint-400/25 bg-mint-400/10 text-mint-400")}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <div>
                    <h3 className="max-w-44 truncate text-[14px] font-bold text-white transition-colors group-hover:text-mint-300">{c.name}</h3>
                    <p className="text-[11px] text-zinc-500">{CATEGORY_LABEL[c.category]}</p>
                  </div>
                </div>
                <Badge tone={statusTone(c.status)}>{STATUS_LABEL[c.status]}</Badge>
              </div>
              <div className="mt-4 space-y-1.5 text-[11.5px] text-zinc-500">
                {c.contactName && <p className="flex items-center gap-2"><UserRound className="h-3 w-3 text-zinc-600" />{c.contactName}</p>}
                {c.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-zinc-600" />{c.phone}</p>}
                {c.city && <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-zinc-600" />{c.city}{c.state ? `/${c.state}` : ""}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[10.5px] font-semibold text-zinc-600">{count} evento{count === 1 ? "" : "s"}</span>
                <span className="font-mono text-[12.5px] font-bold text-mint-400 tabular">{brl(revenue)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal de detalhe */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.name ?? ""} subtitle={selected ? CATEGORY_LABEL[selected.category] : ""} wide>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={CAT_TONE[selected.category]}>{CATEGORY_LABEL[selected.category]}</Badge>
              <div className="flex items-center gap-2">
                <span className="label mb-0">Status:</span>
                <select className="field w-auto py-1 text-[11.5px]" value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)} disabled={pending}>
                  <option value="lead">Lead</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="ml-auto flex gap-2">
                <GhostButton onClick={() => openEdit(selected)} className="px-3 py-1.5 text-[12px]"><Pencil className="h-3.5 w-3.5" /> Editar</GhostButton>
                <GhostButton onClick={() => remove(selected.id)} className="border-blaze-400/20 px-3 py-1.5 text-[12px] text-blaze-400 hover:border-blaze-400/50 hover:text-blaze-400"><Trash2 className="h-3.5 w-3.5" /></GhostButton>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: IdCard, label: "CPF/CNPJ", value: selected.document },
                { icon: UserRound, label: "Contato responsável", value: selected.contactName },
                { icon: Mail, label: "E-mail", value: selected.email },
                { icon: Phone, label: "Telefone", value: selected.phone },
                { icon: MessageCircle, label: "WhatsApp", value: selected.whatsapp },
                { icon: MapPin, label: "Endereço", value: [selected.address, selected.city && `${selected.city}/${selected.state}`].filter(Boolean).join(" — ") },
              ].filter((r) => r.value).map((r) => (
                <div key={r.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                  <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest text-zinc-600"><r.icon className="h-3 w-3" />{r.label}</p>
                  <p className="mt-1 text-[13px] font-medium text-zinc-200">{r.value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div className="rounded-xl border border-gold-400/15 bg-gold-400/[0.04] px-4 py-3">
                <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest text-gold-400/80"><StickyNote className="h-3 w-3" />Observações internas</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-300">{selected.notes}</p>
              </div>
            )}

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-display text-[13px] font-bold text-white">
                <History className="h-4 w-4 text-mint-400" /> Histórico de eventos
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-400">{selectedEvents.length}</span>
              </h4>
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {selectedEvents.length === 0 && <EmptyState icon={History} title="Nenhum evento registrado" hint="Os eventos vinculados a este contato aparecerão aqui." />}
                {selectedEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-zinc-200">{e.title}</p>
                      <p className="mt-0.5 flex items-center gap-3 text-[10.5px] text-zinc-600">
                        <span className="text-azure-400">{formatDate(e.eventDate)}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.passengers}</span>
                        <span className="truncate">{e.destination}</span>
                      </p>
                    </div>
                    <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status]}</Badge>
                    <span className="w-24 text-right font-mono text-[12px] font-bold text-mint-400 tabular">{brl(e.grossCents)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-mint-400/[0.05] px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500"><Wallet className="h-3.5 w-3.5 text-mint-400" />Faturamento acumulado</span>
                <span className="font-mono text-[14px] font-bold text-mint-400 tabular">{brl(selectedEvents.filter((e) => e.status !== "cancelado").reduce((s, e) => s + e.grossCents, 0))}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal novo/editar */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? "Editar cadastro" : "Novo cadastro"} subtitle="Dados do cliente, escola, empresa ou parceiro" wide>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="label">Nome / Razão social *</span><input className="field" placeholder="Ex.: Colégio Santa Luzia" {...f("name")} /></label>
          <label className="block"><span className="label">Categoria</span>
            <select className="field" {...f("category")}>
              <option value="escola">Escola / Instituição de ensino</option>
              <option value="empresa">Empresa</option>
              <option value="particular">Particular</option>
              <option value="parceiro">Parceiro de turismo</option>
            </select>
          </label>
          <label className="block"><span className="label">CPF ou CNPJ</span><input className="field font-mono tabular" placeholder="000.000.000-00" inputMode="numeric" {...f("document")} /></label>
          <label className="block"><span className="label">Contato responsável</span><input className="field" placeholder="Ex.: Coord. Marcela" {...f("contactName")} /></label>
          <label className="block"><span className="label">Status</span>
            <select className="field" {...f("status")}><option value="lead">Lead</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
          </label>
          <label className="block"><span className="label">E-mail</span><input className="field" type="email" placeholder="contato@empresa.com" {...f("email")} /></label>
          <label className="block"><span className="label">Telefone</span><input className="field" placeholder="(11) 3000-0000" {...f("phone")} /></label>
          <label className="block"><span className="label">WhatsApp</span><input className="field" placeholder="(11) 90000-0000" {...f("whatsapp")} /></label>
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 block"><span className="label">Cidade</span><input className="field" {...f("city")} /></label>
            <label className="block"><span className="label">UF</span><input className="field" maxLength={2} {...f("state")} /></label>
          </div>
          <label className="block sm:col-span-2"><span className="label">Endereço</span><input className="field" placeholder="Rua, número, bairro" {...f("address")} /></label>
          <label className="block sm:col-span-2"><span className="label">Observações internas</span><textarea className="field min-h-20 resize-none" placeholder="Preferências, condições de pagamento, histórico…" {...f("notes")} /></label>
        </div>
        {formError && <p className="mt-3 text-[12px] font-semibold text-blaze-400">{formError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton onClick={() => setFormOpen(false)}>Cancelar</GhostButton>
          <PrimaryButton onClick={save} disabled={pending}>{editingId ? "Salvar alterações" : "Cadastrar"}</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
