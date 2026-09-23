import { db } from "@/db";
import { settings } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * INICIALIZAÇÃO — apenas configurações base do sistema.
 *
 * Nenhum dado de operação (clientes, escolas, caixa, eventos, orçamentos,
 * cadastros) é criado. O sistema começa TOTALMENTE ZERADO, pronto para o
 * primeiro lançamento real:
 *   • Todos os valores financeiros iniciam em R$ 0,00
 *   • Contador de escolas/clientes inicia em 0
 *   • Gráficos limpos
 *
 * As configurações abaixo (regra de divisão de lucros e dados cadastrais da
 * empresa) são usadas no painel e nos contratos — não são "dados de operação".
 */

const DEFAULT_SETTINGS: Record<string, string> = {
  prolaborePct: "55",
  fleetPct: "45",
  companyTradeName: "DG Mobi Magic",
  companyLegalName: "DG Mobi Magic Turismo e Entretenimento LTDA",
  companyCnpj: "27.412.889/0001-63",
  companyPhone: "(85) 99999-0000",
  companyEmail: "contato@dgmobimagic.com.br",
  companyAddress: "Av. Beira-Mar, 1000 — Meireles — Fortaleza/CE — CEP 60165-121",
  founderName: "Douglas Pereira",
};

export async function ensureSeed() {
  // Cria as configurações apenas se ainda não existirem — nunca sobrescreve.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(settings);
  if (count > 0) return;

  await db.insert(settings).values(
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }))
  );
}
