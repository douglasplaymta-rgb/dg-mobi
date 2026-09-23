import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

// ── Dinheiro (centavos → BRL) ────────────────────────────────
export function brl(cents: number, withSign = false): string {
  const v = (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return withSign && cents !== 0 ? (cents > 0 ? `+${v}` : v) : v;
}

export function compactBRL(cents: number): string {
  const v = cents / 100;
  if (Math.abs(v) >= 1000) {
    return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  }
  return brl(cents);
}

/** Converte "1.234,56" (ou "1234.56") → 123456 centavos */
export function parseBRLToCents(input: string): number {
  const clean = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Máscara progressiva de dinheiro enquanto digita: retorna "12,34" */
export function maskBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Datas ────────────────────────────────────────────────────
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateLong(iso?: string | null): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}`;
}

// ── Documentos ───────────────────────────────────────────────
export function maskCPF(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCNPJ(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskDocument(input: string): string {
  const d = input.replace(/\D/g, "");
  return d.length <= 11 ? maskCPF(d) : maskCNPJ(d);
}

/** Ofuscação parcial para exibição segura: 123.***.***-09 */
export function obfuscateDoc(doc: string): string {
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.***.***/${d.slice(8, 12)}-**`;
  return "••••••••";
}

export function isValidCPF(digits: string): boolean {
  return digits.replace(/\D/g, "").length === 11;
}

export function isValidCNPJ(digits: string): boolean {
  return digits.replace(/\D/g, "").length === 14;
}

// ── Labels de domínio ────────────────────────────────────────
export const CATEGORY_LABEL: Record<string, string> = {
  escola: "Escola",
  empresa: "Empresa",
  particular: "Particular",
  parceiro: "Parceiro Turístico",
};

export const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  ativo: "Ativo",
  inativo: "Inativo",
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export function quoteNumber(id: number, date?: Date): string {
  const y = (date ?? new Date()).getFullYear();
  return `ORC-${y}-${String(id).padStart(4, "0")}`;
}
