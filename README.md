# DG Mobi Magic System

Painel de gestão corporativa e financeira para empresas de turismo e entretenimento (fretamento, excursões e eventos).

## Módulos

| Módulo | Rota | Descrição |
|---|---|---|
| Dashboard Financeiro | `/` | Rendimento bruto × líquido em tempo real, fluxo diário, KPIs e **regra automática de divisão de lucros** (custos operacionais → pró-labore do fundador → Fundo de Frota), com percentuais editáveis |
| Caixa Diário | `/caixa` | Lançamentos de entrada/saída, extrato agrupado por dia, saldo acumulado |
| CRM Clientes & Escolas | `/clientes` | Diretório unificado (escolas, empresas, particulares, parceiros), histórico de eventos, status de atendimento |
| Orçamentos & Documentos | `/orcamentos` | Gerador instantâneo de proposta comercial **+ contrato** numerados, prontos para impressão/PDF (A4) |
| Cofre CPF/CNPJ | `/cadastros` | Cadastros sensíveis com exibição mascarada, revelação sob demanda e cópia segura |

## Executando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o banco (PostgreSQL)
#    Crie um arquivo .env com:
#    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# 3. Criar as tabelas
npx drizzle-kit push

# 4. Subir o servidor
npm run dev        # desenvolvimento → http://localhost:3000
# ou
npm run build && npm run start   # produção
```

> **Dados de demonstração:** na primeira execução o sistema semeia automaticamente
> clientes, escolas, parceiros, 7 meses de caixa, eventos, orçamentos e cadastros,
> para que o painel já nasça funcional.

## Stack

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL + Drizzle ORM · Recharts · Lucide Icons

## Estrutura

```
src/
├── app/
│   ├── page.tsx                  # Dashboard (agregações financeiras)
│   ├── caixa/                    # Controle de caixa diário
│   ├── clientes/                 # CRM + histórico de eventos
│   ├── orcamentos/               # Gerador + lista
│   │   └── [id]/                 # Documento A4 (proposta + contrato)
│   ├── cadastros/                # Cofre de CPF/CNPJ
│   └── api/                      # Rotas REST (CRUD + settings)
├── components/                   # Shell, gráficos, primitivas de UI
├── db/                           # Schema, conexão e seed
└── lib/format.ts                 # Máscaras BRL/CPF/CNPJ e datas pt-BR
```
