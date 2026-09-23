# ═══════════════════════════════════════════════════════════════════════════
#  DG MOBI MAGIC SYSTEM — Painel de Gestão Corporativa e Financeira
#  Versão Streamlit (arquivo único) — basta colar este código e executar.
#
#  Como rodar local:   pip install streamlit   →   streamlit run app.py
#  Como rodar online:  suba este arquivo no GitHub + requirements.txt com
#                      a linha "streamlit" e faça deploy no Streamlit Cloud.
#
#  Banco de dados: SQLite (arquivo dg_mobi.db criado automaticamente no 1º
#  boot, já semeado com 7 meses de dados de demonstração).
# ═══════════════════════════════════════════════════════════════════════════

import os
import sqlite3
import random
from datetime import date, datetime, timedelta

import pandas as pd
import streamlit as st

# ─────────────────────────────────────────────────────────────────────────
# 1. CONFIGURAÇÃO DA PÁGINA + TEMA
# ─────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="DG Mobi Magic System",
    page_icon=":material/directions_bus:",
    layout="wide",
    initial_sidebar_state="expanded",
)

MINT, AZURE, GOLD, ROSE = "#34d399", "#38bdf8", "#fbbf24", "#fb7185"

APP_CSS = """
.stApp { background: #06080a; }
main .block-container { padding-top: 2rem; max-width: 1380px; }
h1, h2, h3, h4, p, span, label, .stMarkdown { color: #d8dee4; }
[data-testid="stSidebar"] { background: #0a0d10; border-right: 1px solid rgba(255,255,255,.07); }
[data-testid="stSidebar"] * { color: #c8d0d8; }
.kicker { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:800;
  letter-spacing:.28em; text-transform:uppercase; color:#34d399; }
.kicker::before { content:""; width:7px; height:7px; border-radius:50%; background:#34d399;
  box-shadow:0 0 0 0 rgba(52,211,153,.5); animation:pulse 2s infinite; }
@keyframes pulse { 50% { box-shadow:0 0 0 7px rgba(52,211,153,0);} }
.page-title { font-size:30px; font-weight:800; color:#fff; letter-spacing:-.02em; margin:2px 0; }
.page-sub { font-size:13.5px; color:#7a8791; margin-bottom:22px; }
.panel { border:1px solid rgba(255,255,255,.07); border-radius:16px; padding:18px 20px;
  background:linear-gradient(160deg, rgba(255,255,255,.045), rgba(255,255,255,.015)); }
.kpi-label { font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#68747f; }
.kpi-value { font-size:26px; font-weight:800; color:#fff; font-variant-numeric:tabular-nums; margin-top:8px; }
.kpi-hint { font-size:11.5px; color:#727e89; margin-top:6px; }
.badge { display:inline-block; padding:2px 10px; border-radius:99px; font-size:10.5px;
  font-weight:700; border:1px solid; }
.b-mint{background:rgba(52,211,153,.1);color:#6ee7b7;border-color:rgba(52,211,153,.3)}
.b-azure{background:rgba(56,189,248,.1);color:#38bdf8;border-color:rgba(56,189,248,.3)}
.b-gold{background:rgba(251,191,36,.1);color:#fbbf24;border-color:rgba(251,191,36,.3)}
.b-rose{background:rgba(251,113,133,.1);color:#fb7185;border-color:rgba(251,113,133,.3)}
.b-zinc{background:rgba(255,255,255,.05);color:#98a4af;border-color:rgba(255,255,255,.12)}
.row-item { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px;
  border:1px solid rgba(255,255,255,.05); background:rgba(255,255,255,.02); margin-bottom:6px; }
.mono { font-variant-numeric:tabular-nums; }
.mint{color:#34d399} .azure{color:#38bdf8} .gold{color:#fbbf24} .rose{color:#fb7185}
.zinc{color:#8b98a3} .white{color:#fff}
.segbar { display:flex; height:12px; border-radius:99px; overflow:hidden; background:rgba(255,255,255,.05); }
.stButton>button { border-radius:12px; font-weight:700; }
.stButton>button[kind="primary"] { background:#34d399; color:#06080a; border:none; }
.stButton>button[kind="primary"]:hover { background:#6ee7b7; color:#06080a; }
[data-testid="stVerticalBlockBorderWrapper"] { border-radius:14px; }
hr { border-color: rgba(255,255,255,.08); }
"""
st.markdown(f"<style>{APP_CSS}</style>", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────
# 2. CONSTANTES DE DOMÍNIO
# ─────────────────────────────────────────────────────────────────────────
CATEGORY_LABEL = {"escola": "Escola", "empresa": "Empresa", "particular": "Particular", "parceiro": "Parceiro Turístico"}
STATUS_LABEL = {"lead": "Lead", "ativo": "Ativo", "inativo": "Inativo", "agendado": "Agendado",
                "confirmado": "Confirmado", "concluido": "Concluído", "cancelado": "Cancelado",
                "rascunho": "Rascunho", "enviado": "Enviado", "aprovado": "Aprovado", "recusado": "Recusado"}
STATUS_TONE = {"ativo": "mint", "lead": "azure", "inativo": "zinc", "agendado": "azure", "confirmado": "gold",
               "concluido": "mint", "cancelado": "rose", "rascunho": "zinc", "enviado": "azure",
               "aprovado": "mint", "recusado": "rose"}
CAT_TONE = {"escola": "azure", "empresa": "zinc", "particular": "gold", "parceiro": "mint"}
CATS_IN = ["Receita de Fretamento", "Receita Avulsa", "Outros"]
CATS_OUT = ["Combustível", "Pedágio", "Manutenção", "Seguro", "Equipe", "Impostos e Taxas",
            "Operacional", "Pró-labore", "Fundo de Frota", "Outros"]
DISTRIBUTION_CATS = {"Pró-labore", "Fundo de Frota"}
VEHICLES = ["Van Executiva 20 lugares", "Micro-ônibus 40 lugares", "Ônibus 46 lugares",
            "Ônibus 50 lugares (leito)", "2 veículos combinados"]
PRICE_MODES = {"fixo": "Valor fechado", "km": "Por quilômetro", "hora": "Por hora", "diaria": "Por diária"}
UNIT_LABEL = {"fixo": "pacote", "km": "km rodado", "hora": "hora de serviço", "diaria": "diária"}
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
         "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

# ─────────────────────────────────────────────────────────────────────────
# 3. HELPERS DE FORMATAÇÃO
# ─────────────────────────────────────────────────────────────────────────
def brl(cents: float) -> str:
    s = f"{abs(cents) / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−R$ " if cents < 0 else "R$ ") + s

def fmt_date(iso: str) -> str:
    if not iso:
        return "—"
    d = datetime.strptime(str(iso)[:10], "%Y-%m-%d")
    return d.strftime("%d/%m/%Y")

def fmt_date_long(iso: str) -> str:
    if not iso:
        return "—"
    d = datetime.strptime(str(iso)[:10], "%Y-%m-%d")
    return f"{d.day:02d} de {MESES[d.month - 1]} de {d.year}"

def mask_document(raw: str) -> str:
    d = "".join(ch for ch in str(raw) if ch.isdigit())
    if len(d) <= 11:
        d = d[:11]
        out = ""
        for i, ch in enumerate(d):
            if i in (3, 6): out += "."
            if i == 9: out += "-"
            out += ch
        return out
    d = d[:14]
    out = ""
    for i, ch in enumerate(d):
        if i in (2, 5): out += "."
        if i == 8: out += "/"
        if i == 12: out += "-"
        out += ch
    return out

def obfuscate(doc: str) -> str:
    d = "".join(ch for ch in str(doc) if ch.isdigit())
    if len(d) == 11: return f"{d[:3]}.***.***-{d[9:]}"
    if len(d) == 14: return f"{d[:2]}.***.***/{d[8:12]}-**"
    return "••••••••"

def badge(text: str, tone: str = "zinc") -> str:
    return f'<span class="badge b-{tone}">{text}</span>'

def kpi_card(label: str, value: str, hint: str = "", tone: str = "mint") -> str:
    return (f'<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center">'
            f'<span class="kpi-label">{label}</span>'
            f'<span style="width:9px;height:9px;border-radius:50%;background:{dict(mint=MINT,azure=AZURE,gold=GOLD,rose=ROSE)[tone]}"></span></div>'
            f'<div class="kpi-value">{value}</div>'
            f'<div class="kpi-hint">{hint}</div></div>')

def page_header(kicker: str, title: str, sub: str):
    st.markdown(f'<p class="kicker">{kicker}</p><p class="page-title">{title}</p><p class="page-sub">{sub}</p>',
                unsafe_allow_html=True)

def iso(days_offset: int = 0) -> str:
    return (date.today() + timedelta(days=days_offset)).isoformat()

# ─────────────────────────────────────────────────────────────────────────
# 4. BANCO DE DADOS (SQLite + seed automático)
# ─────────────────────────────────────────────────────────────────────────
DB_PATH = os.environ.get("DG_MOBI_DB", "dg_mobi.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS clients(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, document TEXT,
  contact TEXT, email TEXT, phone TEXT, whatsapp TEXT, city TEXT, state TEXT,
  address TEXT, status TEXT DEFAULT 'ativo', notes TEXT);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, title TEXT, event_date TEXT,
  origin TEXT, destination TEXT, passengers INTEGER, hours INTEGER, vehicle TEXT,
  status TEXT, gross_cents INTEGER, cost_cents INTEGER);
CREATE TABLE IF NOT EXISTS transactions(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tx_date TEXT, description TEXT, category TEXT,
  kind TEXT, amount_cents INTEGER);
CREATE TABLE IF NOT EXISTS quotes(
  id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT, client_id INTEGER, client_name TEXT,
  client_document TEXT, client_address TEXT, event_date TEXT, origin TEXT, destination TEXT,
  passengers INTEGER, hours INTEGER, vehicle TEXT, price_mode TEXT, quantity INTEGER,
  unit_price_cents INTEGER, total_cents INTEGER, valid_days INTEGER, notes TEXT,
  status TEXT DEFAULT 'rascunho', created_at TEXT);
CREATE TABLE IF NOT EXISTS registry(
  id INTEGER PRIMARY KEY AUTOINCREMENT, holder_name TEXT, doc_type TEXT, doc_number TEXT,
  person_type TEXT, rg_or_ie TEXT, email TEXT, phone TEXT, cep TEXT, address TEXT,
  city TEXT, state TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
"""

def seed_if_empty(conn: sqlite3.Connection):
    n = conn.execute("SELECT COUNT(*) FROM clients").fetchone()[0]
    if n > 0:
        return
    rng = random.Random(42)
    pick = lambda arr: arr[rng.randrange(len(arr))]
    between = lambda a, b: round(a + rng.random() * (b - a))
    cur = conn.cursor()

    cur.executemany("INSERT INTO settings(key,value) VALUES(?,?)", [
        ("prolaborePct", "55"), ("fleetPct", "45"),
        ("companyTradeName", "DG Mobi Magic"),
        ("companyLegalName", "DG Mobi Magic Turismo e Entretenimento LTDA"),
        ("companyCnpj", "27.412.889/0001-63"),
        ("companyPhone", "(11) 97410-2233"),
        ("companyEmail", "contato@dgmobimagic.com.br"),
        ("companyAddress", "Av. das Nações, 1200 — Vila Olímpia — São Paulo/SP — CEP 04547-002"),
        ("founderName", "Douglas Pereira"),
    ])

    cur.executemany("""INSERT INTO clients(name,category,document,contact,email,phone,whatsapp,city,state,address,status,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""", [
        ("Colégio Santa Luzia","escola","04.812.336/0001-20","Coord. Marcela Ribeiro","passeios@colegiosantaluzia.com.br","(11) 3322-4800","(11) 98812-3340","São Paulo","SP","Rua das Acácias, 455 — Moema","ativo","Contrato anual de passeios pedagógicos. Fatura via boleto."),
        ("E.E. Prof. Anísio Teixeira","escola","62.111.094/0001-77","Dir. Paulo Henrique","direcao@eanisio.te.gov.br","(11) 2976-1100","(11) 97455-9021","Guarulhos","SP","Av. Tiradentes, 1800 — Centro","ativo","Prefeitura exige nota empenho antes do embarque."),
        ("Escola Municipal Monteiro Lobato","escola","46.390.201/0001-54","Sec. Elaine Duarte","sec.mlobato@educacao.gov.br","(11) 4441-7731","(11) 96631-2210","Osasco","SP","Rua Primitiva Vianco, 90 — Jd. das Flores","ativo","Turmas do fundamental I — sempre 2 monitores."),
        ("Colégio Objetivo Unidade Sul","escola","60.478.552/0003-18","Dep. Pais & Mestres","eventos.sul@objetivo.br","(11) 5090-2100","(11) 99760-5532","São Paulo","SP","Av. Interlagos, 3500 — Interlagos","lead","Pediu tabela de valores 2026 — retornar em março."),
        ("Grupo Paineiras Turismo","parceiro","11.208.776/0001-05","Ricardo Paineira","operacoes@grupopaineiras.tur.br","(11) 3661-9080","(11) 98211-4407","São Paulo","SP","Rua do Rócio, 220 — Vila Olímpia","ativo","Repasse mensal de fretamentos para litoral. Comissão 8%."),
        ("Buffet Alegria Kids Eventos","parceiro","23.556.910/0001-66","Simone Alegria","contato@buffetalegriakids.com.br","(11) 4722-6115","(11) 97040-1188","São Bernardo do Campo","SP","Av. Jurubatuba, 890 — Centro","ativo","Indica transporte em pacotes de formatura infantil."),
        ("Pousada Vale Verde","parceiro","18.774.203/0001-39","Marcos Vieira","reservas@pousadavaleverde.com.br","(12) 3896-4471","(12) 98876-5561","Campos do Jordão","SP","Estr. do Capivari, km 4","ativo","Hospedagem preferencial nas excursões de inverno."),
        ("Ind. Metalúrgica Forte Aço","empresa","61.033.118/0001-82","RH — Fernanda Costa","rh@forteaco.ind.br","(11) 4455-3000","(11) 99330-7765","Diadema","SP","Rod. Anchieta, km 18 — Distrito Industrial","ativo","Fretamento de confraternizações e SIPAT."),
        ("Igreja Comunidade Vida Nova","empresa","05.927.441/0001-60","Pr. Josué Martins","eventos@vidanova.org.br","(11) 2991-6714","(11) 98177-3345","São Paulo","SP","Rua da Consolação, 1510 — Consolação","inativo","Sem eventos desde 2024 — reativar no retiro de julho."),
        ("Dona Marta Excursões (Família Alves)","particular","214.556.938-72","Marta Alves","marta.alves@gmail.com","(11) 98877-1022","(11) 98877-1022","São Paulo","SP","Rua das Palmeiras, 87 — Tatuapé","ativo","Organiza excursões de terceira idade — paga 50% antecipado."),
    ])

    rotas = ["Campos do Jordão","Aparecida do Norte","Holambra","São Roque","Hopi Hari",
             "Thermas dos Laranjais","Santos — Litoral","Museu do Ipiranga","Aquário de SP","Cidade da Criança"]
    rows = []
    for m in range(6, -1, -1):
        base = m * 30
        for i in range(between(4, 7)):
            d = base + 3 + i * 5
            valor = between(1900, 4600) * 100
            rows.append((iso(-d), f"Fretamento — {pick(rotas)}", "Receita de Fretamento", "entrada", valor))
            if rng.random() > 0.35:
                rows.append((iso(-d + 1), f"Sinal 30% — {pick(rotas)}", "Receita de Fretamento", "entrada",
                             round(valor * 0.3 / 100) * 100))
        for w in range(4):
            rows.append((iso(-(base + 5 + w * 7)), "Abastecimento diesel — frota", "Combustível", "saida", between(460, 720) * 100))
        rows.append((iso(-(base + 8)), "Pedágios do mês", "Pedágio", "saida", between(280, 520) * 100))
        rows.append((iso(-(base + 12)), pick(["Revisão preventiva van 01","Troca de óleo + filtros","Alinhamento e balanceamento",
                     "Jogo de pneus van 02","Freios — pastilhas e discos"]), "Manutenção", "saida", between(550, 1950) * 100))
        rows.append((iso(-(base + 3)), "Seguro frota — parcela", "Seguro", "saida", 89000))
        rows.append((iso(-(base + 15)), "Diárias motorista parceiro", "Equipe", "saida", between(600, 1100) * 100))
        rows.append((iso(-(base + 20)), "Licenciamento / taxas DETRAN", "Impostos e Taxas", "saida", between(180, 420) * 100))
        rows.append((iso(-(base + 25)), "Pró-labore — Douglas Pereira", "Pró-labore", "saida", between(2800, 4200) * 100))
        rows.append((iso(-(base + 26)), "Aporte Fundo de Frota", "Fundo de Frota", "saida", between(1500, 3000) * 100))
        if rng.random() > 0.5:
            rows.append((iso(-(base + 10)), "City tour corporativo avulso", "Receita Avulsa", "entrada", between(1200, 2200) * 100))
    rows += [(iso(0), "Fretamento — Colégio Santa Luzia (Aparecida)", "Receita de Fretamento", "entrada", 385000),
             (iso(0), "Abastecimento diesel — van 01", "Combustível", "saida", 64200),
             (iso(0), "Lanche e água — cortesia passageiros", "Operacional", "saida", 13150)]
    cur.executemany("INSERT INTO transactions(tx_date,description,category,kind,amount_cents) VALUES(?,?,?,?,?)", rows)

    cur.executemany("""INSERT INTO events(client_id,title,event_date,origin,destination,passengers,hours,vehicle,status,gross_cents,cost_cents)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)""", [
        (1,"Excursão pedagógica — Aparecida do Norte",iso(0),"São Paulo/SP","Aparecida/SP",44,14,"Ônibus 46L","concluido",385000,141000),
        (2,"Visita técnica — Museu do Ipiranga",iso(-4),"Guarulhos/SP","São Paulo/SP",48,8,"Ônibus 46L","concluido",240000,93000),
        (3,"Passeio pedagógico — Aquário de SP",iso(-12),"Osasco/SP","São Paulo/SP",38,9,"Micro-ônibus 40L","concluido",210000,78000),
        (8,"Confraternização anual — Forte Aço",iso(-20),"Diadema/SP","Sítio Santa Rita/SP",52,12,"Ônibus 46L + Van","concluido",420000,154000),
        (5,"Repasse Grupo Paineiras — Campos do Jordão",iso(-30),"São Paulo/SP","Campos do Jordão/SP",20,48,"Van Executiva 20L","concluido",360000,168000),
        (10,"Excursão 3ª idade — Holambra",iso(-35),"Tatuapé/SP","Holambra/SP",36,10,"Micro-ônibus 40L","concluido",228000,86000),
        (1,"Viagem de formatura — Thermas dos Laranjais",iso(6),"São Paulo/SP","Olímpia/SP",50,72,"Ônibus 46L","confirmado",980000,390000),
        (6,"Formatura infantil — Buffet Alegria Kids",iso(9),"São Bernardo/SP","Hotel Fazenda Mazzaropi",60,10,"Ônibus 46L + Micro","confirmado",560000,205000),
        (2,"Excursão cultural — Cidade de Santos",iso(16),"Guarulhos/SP","Santos/SP",46,12,"Ônibus 46L","agendado",310000,118000),
        (7,"Pacote inverno — Campos do Jordão (Pousada Vale Verde)",iso(23),"São Paulo/SP","Campos do Jordão/SP",18,60,"Van Executiva 20L","agendado",440000,196000),
        (3,"Passeio didático — Cidade da Criança",iso(30),"Osasco/SP","São Bernardo/SP",40,7,"Micro-ônibus 40L","agendado",195000,72000),
        (4,"Cotação passeio — Hopi Hari",iso(38),"Interlagos/SP","Hopi Hari — Vinhedo/SP",90,10,"2x Ônibus 46L","agendado",720000,284000),
    ])

    year, now = date.today().year, datetime.now().isoformat(timespec="seconds")
    cur.executemany("""INSERT INTO quotes(number,client_id,client_name,client_document,client_address,event_date,
        origin,destination,passengers,hours,vehicle,price_mode,quantity,unit_price_cents,total_cents,valid_days,notes,status,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", [
        (f"ORC-{year}-0001",4,"Colégio Objetivo Unidade Sul","60.478.552/0003-18","Av. Interlagos, 3500 — Interlagos, São Paulo/SP",
         iso(38),"Interlagos — São Paulo/SP","Hopi Hari — Vinhedo/SP",90,10,"2x Ônibus 46 lugares","fixo",1,720000,720000,15,
         "Inclui 2 monitores e seguro passageiro APP.","enviado",now),
        (f"ORC-{year}-0002",2,"E.E. Prof. Anísio Teixeira","62.111.094/0001-77","Av. Tiradentes, 1800 — Centro, Guarulhos/SP",
         iso(16),"Guarulhos/SP","Santos/SP",46,12,"Ônibus 46 lugares","hora",12,23000,310000,10,
         "Empenho municipal anexo obrigatório.","aprovado",now),
        (f"ORC-{year}-0003",9,"Igreja Comunidade Vida Nova","05.927.441/0001-60","Rua da Consolação, 1510 — São Paulo/SP",
         iso(52),"Consolação — São Paulo/SP","Águas de Lindoia/SP",44,48,"Ônibus 46 lugares","diaria",2,195000,390000,20,
         "Retiro anual — pagamento em 2x.","rascunho",now),
    ])

    cur.executemany("""INSERT INTO registry(holder_name,doc_type,doc_number,person_type,rg_or_ie,email,phone,cep,address,city,state,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""", [
        ("Marta Cristina Alves","cpf","214.556.938-72","particular","28.441.902-5","marta.alves@gmail.com","(11) 98877-1022","03309-040","Rua das Palmeiras, 87 — Tatuapé","São Paulo","SP","Titular — contratos avulsos de excursão."),
        ("Douglas Pereira","cpf","301.882.445-19","particular","31.207.556-8","douglas@dgmobimagic.com.br","(11) 97410-2233","04547-002","Av. das Nações, 1200 — Vila Olímpia","São Paulo","SP","Sócio-fundador — pró-labore mensal."),
        ("Colégio Santa Luzia","cnpj","04.812.336/0001-20","corporativo","Isento","financeiro@colegiosantaluzia.com.br","(11) 3322-4800","04076-011","Rua das Acácias, 455 — Moema","São Paulo","SP","Dados para faturamento mensal."),
        ("E.E. Prof. Anísio Teixeira","cnpj","62.111.094/0001-77","corporativo","Isento","direcao@eanisio.te.gov.br","(11) 2976-1100","07010-010","Av. Tiradentes, 1800 — Centro","Guarulhos","SP","Ente público — emitir NF para empenho."),
        ("Grupo Paineiras Turismo","cnpj","11.208.776/0001-05","corporativo","112.445.778.110","financeiro@grupopaineiras.tur.br","(11) 3661-9080","04552-000","Rua do Rócio, 220 — Vila Olímpia","São Paulo","SP","Parceiro — contrato de repasse com comissão."),
        ("Ind. Metalúrgica Forte Aço","cnpj","61.033.118/0001-82","corporativo","633.102.990.118","contasapagar@forteaco.ind.br","(11) 4455-3000","09950-550","Rod. Anchieta, km 18 — Distrito Industrial","Diadema","SP","NF-e com retenção ISS."),
        ("João Batista Luz (motorista parceiro)","cpf","178.445.201-03","particular","24.998.334-1","joaob.luz@outlook.com","(11) 96612-7813","08235-440","Rua Igaratinga, 210 — Itaim Paulista","São Paulo","SP","Diarista — pagamento por viagem."),
    ])
    conn.commit()

@st.cache_resource
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    seed_if_empty(conn)
    return conn

conn = get_db()

def q(sql_: str, params: tuple = ()) -> pd.DataFrame:
    return pd.read_sql_query(sql_, conn, params=params)

def exec_(sql_: str, params: tuple = ()):
    with conn:
        conn.execute(sql_, params)

def settings_map() -> dict:
    return {r["key"]: r["value"] for r in conn.execute("SELECT key,value FROM settings").fetchall()}

# ─────────────────────────────────────────────────────────────────────────
# 5. CONSTRUTOR DO DOCUMENTO (Proposta + Contrato em HTML para impressão/PDF)
# ─────────────────────────────────────────────────────────────────────────
DOC_CSS = """
@page { size: A4; margin: 14mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; color:#27272a; font-size:12px; }
.sheet { page-break-after: always; border: 1px solid #e4e4e7; border-radius: 10px; padding: 34px; margin-bottom: 28px; }
.sheet:last-child { page-break-after: auto; }
.hdr { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #047857; padding-bottom:14px; }
.logo { font-size:20px; font-weight:800; letter-spacing:-.02em; }
.logo em { color:#059669; font-style:normal; }
.strip { background:#0a0a0a; color:#fff; border-radius:8px; padding:14px 18px; margin:20px 0 0; display:flex; justify-content:space-between; align-items:center; }
.strip small { color:#34d399; font-size:9px; letter-spacing:.25em; font-weight:700; }
.strip h1 { font-size:18px; }
.box { border:1px solid #e4e4e7; border-radius:8px; padding:14px; margin-top:14px; }
.grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:14px; }
.gcell { background:#fafafa; border-radius:8px; padding:10px; }
.lbl { font-size:8.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#059669; margin-bottom:6px; }
table { width:100%; border-collapse:collapse; margin-top:8px; }
th { background:#0a0a0a; color:#fff; font-size:9.5px; text-transform:uppercase; letter-spacing:.1em; padding:9px 10px; text-align:left; }
td { padding:10px; border-bottom:1px solid #e4e4e7; font-size:11.5px; }
.conds { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px; }
.notes { background:#fffbeb; border-radius:8px; padding:12px 14px; margin-top:14px; font-size:11px; }
.clause { margin:0 0 10px; text-align:justify; line-height:1.55; font-size:11.5px; }
.sign { display:grid; grid-template-columns:1fr 1fr; gap:56px; margin-top:64px; text-align:center; font-size:10.5px; }
.sign .line { border-top:1px solid #71717a; padding-top:6px; font-weight:700 }
.mono { font-variant-numeric:tabular-nums; }
"""

def build_document_html(quote: sqlite3.Row, c: dict) -> str:
    unit = UNIT_LABEL.get(quote["price_mode"], "pacote")
    total, unit_price = quote["total_cents"], quote["unit_price_cents"]
    sinal, restante = round(total * 0.3), total - round(total * 0.3)
    created = (quote["created_at"] or datetime.now().isoformat())[:10]
    valid_until = (datetime.strptime(created, "%Y-%m-%d") + timedelta(days=quote["valid_days"] or 15)).date().isoformat()

    proposta = f"""
    <div class="sheet">
      <div class="hdr">
        <div><div class="logo">DG MOBI<em>MAGIC</em></div>
        <div style="font-size:9.5px;letter-spacing:.2em;color:#71717a;font-weight:700">TURISMO &amp; ENTRETENIMENTO</div></div>
        <div style="text-align:right;font-size:10.5px;color:#52525b">
          <b style="color:#18181b">{c.get('companyLegalName','')}</b><br>CNPJ: {c.get('companyCnpj','')}<br>
          {c.get('companyPhone','')} · {c.get('companyEmail','')}</div>
      </div>
      <div class="strip"><div><small>DOCUMENTO 1 DE 2</small><h1>Proposta Comercial</h1></div>
        <div style="text-align:right"><b class="mono" style="color:#34d399">{quote['number']}</b><br>
        <span style="font-size:10px;color:#a1a1aa">Emissão: {fmt_date_long(created)}</span></div></div>
      <div class="box"><div class="lbl">À contratante</div>
        <div style="font-size:14px;font-weight:800">{quote['client_name']}</div>
        <div style="font-size:11px;color:#52525b;margin-top:3px">{('CNPJ/CPF: <b>' + quote['client_document'] + '</b> · ') if quote['client_document'] else ''}{quote['client_address'] or ''}</div></div>
      <div class="grid4">
        <div class="gcell"><div class="lbl">Data do evento</div><b>{fmt_date_long(quote['event_date'])}</b></div>
        <div class="gcell"><div class="lbl">Rota</div><b>{quote['origin'] or '—'} → {quote['destination'] or '—'}</b></div>
        <div class="gcell"><div class="lbl">Passageiros</div><b>{quote['passengers']} pessoas</b></div>
        <div class="gcell"><div class="lbl">Veículo</div><b>{quote['vehicle']}</b></div>
      </div>
      <div class="box"><div class="lbl">Investimento</div>
        <table><tr><th>Descrição do serviço</th><th style="text-align:center">Qtd.</th>
          <th style="text-align:right">Valor unit.</th><th style="text-align:right">Total</th></tr>
        <tr><td><b>Fretamento exclusivo — {quote['vehicle']}</b><br>
            <span style="color:#71717a;font-size:10.5px">{quote['origin']} → {quote['destination']} · {fmt_date_long(quote['event_date'])} · até {quote['hours']}h de serviço</span></td>
            <td style="text-align:center" class="mono">{quote['quantity']} {unit}</td>
            <td style="text-align:right" class="mono">{brl(unit_price)}</td>
            <td style="text-align:right" class="mono"><b>{brl(total)}</b></td></tr>
        <tr><td colspan="3" style="text-align:right;font-size:9.5px;font-weight:800;letter-spacing:.18em;color:#71717a">TOTAL DA PROPOSTA</td>
            <td style="text-align:right" class="mono"><b style="color:#047857;font-size:15px">{brl(total)}</b></td></tr></table></div>
      <div class="conds">
        <div class="box" style="margin:0"><div class="lbl">Condições de pagamento</div>
          <div style="font-size:11px;line-height:1.7">· Sinal de reserva (30%): <b>{brl(sinal)}</b> na assinatura.<br>
          · Saldo restante: <b>{brl(restante)}</b> até 48h antes do embarque.<br>· Pix, transferência ou boleto faturado (CNPJ).</div></div>
        <div class="box" style="margin:0"><div class="lbl">Incluso no valor</div>
          <div style="font-size:11px;line-height:1.7">· Motorista profissional (categoria D/E) e seguro APP.<br>
          · Combustível, ar-condicionado e som ambiente.<br>
          · Validade: <b>{quote['valid_days']} dias</b> — até {fmt_date_long(valid_until)}.</div></div>
      </div>
      {('<div class="notes"><div class="lbl" style="color:#b45309">Observações</div>' + quote['notes'] + '</div>') if quote['notes'] else ''}
      <div style="margin-top:18px;text-align:center;font-size:9.5px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:10px">
        {c.get('companyLegalName','')} · {c.get('companyAddress','')}<br>
        Proposta válida até {fmt_date_long(valid_until)} · Sujeita a disponibilidade de frota</div>
    </div>"""

    contrato = f"""
    <div class="sheet">
      <div class="hdr">
        <div><div class="logo">DG MOBI<em>MAGIC</em></div>
        <div style="font-size:9.5px;letter-spacing:.2em;color:#71717a;font-weight:700">TURISMO &amp; ENTRETENIMENTO</div></div>
        <div style="text-align:right;font-size:10.5px;color:#52525b"><b style="color:#18181b">{c.get('companyLegalName','')}</b><br>
          CNPJ: {c.get('companyCnpj','')}</div>
      </div>
      <div class="strip"><div><small>DOCUMENTO 2 DE 2 · REF. {quote['number']}</small>
        <h1 style="font-size:16px">Contrato de Prestação de Serviços de Fretamento</h1></div></div>
      <p class="clause" style="margin-top:18px"><b>CONTRATADA:</b> {c.get('companyLegalName','')}, pessoa jurídica de direito privado,
        inscrita no CNPJ sob o nº {c.get('companyCnpj','')}, com sede em {c.get('companyAddress','')}, neste ato representada por seu
        sócio-fundador, <b>{c.get('founderName','')}</b>.</p>
      <p class="clause"><b>CONTRATANTE:</b> {quote['client_name']}{(', inscrita no CNPJ/CPF sob o nº ' + quote['client_document']) if quote['client_document'] else ''}{(', com endereço em ' + quote['client_address']) if quote['client_address'] else ''}.</p>
      <p class="clause">As partes acima identificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços de Transporte e Fretamento, que se regerá pelas cláusulas seguintes:</p>
      <p class="clause"><b>CLÁUSULA 1ª — DO OBJETO.</b> A CONTRATADA prestará à CONTRATANTE serviço de fretamento exclusivo com {quote['vehicle']},
        para até {quote['passengers']} passageiros, na rota {quote['origin']} → {quote['destination']}, a ser realizado em {fmt_date_long(quote['event_date'])},
        com duração estimada de {quote['hours']} horas.</p>
      <p class="clause"><b>CLÁUSULA 2ª — DO VALOR E DO PAGAMENTO.</b> Pelos serviços descritos na Cláusula 1ª, a CONTRATANTE pagará à CONTRATADA
        o valor total de <b>{brl(total)}</b> ({quote['quantity']} {unit} × {brl(unit_price)}), sendo {brl(sinal)} (30%) como sinal de reserva e o saldo
        de {brl(restante)} até 48 (quarenta e oito) horas antes do embarque. O não pagamento do saldo no prazo autoriza a CONTRATADA a suspender o serviço,
        sem devolução do sinal.</p>
      <p class="clause"><b>CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CONTRATADA.</b> Disponibilizar veículo em perfeitas condições mecânicas, higienizado, com
        documentação e vistorias em dia, motorista habilitado na categoria exigida e seguro de responsabilidade civil e APP (Acidentes Pessoais de
        Passageiros), bem como cumprir os horários acordados.</p>
      <p class="clause"><b>CLÁUSULA 4ª — DAS OBRIGAÇÕES DA CONTRATANTE.</b> Informar a lista nominal de passageiros até 24h antes da viagem; garantir
        que menores de idade estejam com autorização legal dos responsáveis; zelar pelo patrimônio do veículo, respondendo por danos causados por seus
        passageiros; e efetuar os pagamentos nas condições da Cláusula 2ª.</p>
      <p class="clause"><b>CLÁUSULA 5ª — DO CANCELAMENTO.</b> O cancelamento pela CONTRATANTE com mais de 7 (sete) dias de antecedência implica
        devolução de 80% do sinal; entre 7 e 3 dias, o sinal ficará retido a título de ressarcimento; com menos de 72 horas, será devido o valor integral
        do contrato. A CONTRATADA poderá cancelar por caso fortuito ou força maior, devolvendo integralmente os valores recebidos.</p>
      <p class="clause"><b>CLÁUSULA 6ª — DAS DISPOSIÇÕES GERAIS.</b> Alterações de rota, horários ou quantidade de passageiros deverão ser acordadas por
        escrito e poderão implicar reajuste do valor. É vedada a subcontratação do serviço pela CONTRATANTE. A tolerância máxima de espera no embarque é
        de 60 (sessenta) minutos.</p>
      <p class="clause"><b>CLÁUSULA 7ª — DO FORO.</b> Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas deste
        contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
      <p class="clause" style="margin-top:14px">E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor.</p>
      <p style="font-weight:700;margin-top:8px">São Paulo, {fmt_date_long(created)}.</p>
      <div class="sign">
        <div class="line">{c.get('companyLegalName','')}<br><span style="font-weight:400;color:#52525b">{c.get('founderName','')} — Sócio-fundador · CNPJ {c.get('companyCnpj','')}</span></div>
        <div class="line">CONTRATANTE<br><span style="font-weight:400;color:#52525b">Assinatura do responsável legal</span></div>
      </div>
    </div>"""

    return f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>{quote['number']} — DG Mobi Magic</title><style>{DOC_CSS}</style></head>
<body>{proposta}{contrato}
<script>/* Ao abrir o arquivo, use Ctrl+P / Cmd+P e escolha "Salvar como PDF" */</script>
</body></html>"""

# ─────────────────────────────────────────────────────────────────────────
# 6. SIDEBAR / NAVEGAÇÃO
# ─────────────────────────────────────────────────────────────────────────
st.session_state.setdefault("revealed", set())
st.session_state.setdefault("doc_id", None)

with st.sidebar:
    st.markdown("""<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#34d399,#059669);
                  display:flex;align-items:center;justify-content:center;font-weight:800;color:#06080a;font-size:15px">DG</div>
      <div><div style="font-weight:800;color:#fff;font-size:15px;letter-spacing:-.01em">DG MOBI<span style="color:#34d399">MAGIC</span></div>
      <div style="font-size:9px;letter-spacing:.26em;color:#64748b;font-weight:700">SYSTEM · v2.0</div></div></div>""",
                unsafe_allow_html=True)
    page = st.radio("Módulos", ["Dashboard Financeiro", "Caixa Diário", "CRM — Clientes & Escolas",
                                "Orçamentos & Documentos", "Cofre CPF/CNPJ"],
                    label_visibility="collapsed", key="nav")
    st.divider()
    s_cfg = settings_map()
    st.markdown(f"""<div class="panel" style="padding:14px">
      <div style="font-size:12.5px;font-weight:700;color:#fff">{s_cfg.get('founderName','Douglas Pereira')}</div>
      <div style="font-size:10px;letter-spacing:.12em;color:#64748b;text-transform:uppercase;font-weight:700">Fundador · CEO</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10.5px;color:#34d399;font-weight:700">
        <span style="width:7px;height:7px;border-radius:50%;background:#34d399"></span>Sistema operacional</div></div>""",
                unsafe_allow_html=True)

# ═════════════════════════════════════════════════════════════════════════
# PÁGINA 1 — DASHBOARD FINANCEIRO
# ═════════════════════════════════════════════════════════════════════════
if page == "Dashboard Financeiro":
    cfg = settings_map()
    pct_p, pct_f = int(cfg.get("prolaborePct", 55)), int(cfg.get("fleetPct", 45))
    founder = cfg.get("founderName", "Douglas Pereira")

    tx = q("SELECT * FROM transactions")
    tx["kind_norm"] = tx["kind"]
    tx["op"] = tx.apply(lambda r: r["amount_cents"] if r["kind"] == "entrada"
                        else (-r["amount_cents"] if r["category"] not in DISTRIBUTION_CATS else 0), axis=1)
    tx["month"] = tx["tx_date"].str[:7]

    today = date.today().isoformat()
    cur_month = today[:7]

    page_header("Visão geral · tempo real", "Dashboard Financeiro",
                f"Competência {MESES[date.today().month - 1]} de {date.today().year} · dados consolidados do caixa")

    # série 7 meses
    months = []
    d0 = date.today().replace(day=1)
    for i in range(6, -1, -1):
        m = (d0.month - i - 1) % 12 + 1
        y = d0.year + (d0.month - i - 1) // 12
        months.append(f"{y:04d}-{m:02d}")
    gm = tx.groupby(["month", "kind_norm"])["amount_cents"].sum().unstack(fill_value=0)
    custos_m = tx[~tx["category"].isin(DISTRIBUTION_CATS) & (tx["kind"] == "saida")].groupby("month")["amount_cents"].sum()
    bruto_s = pd.Series([float(gm.loc[m, "entrada"]) if m in gm.index and "entrada" in gm.columns else 0.0 for m in months], index=months)
    custo_s = pd.Series([float(custos_m.get(m, 0.0)) for m in months], index=months)
    names = [f"{m[5:7]}/{m[2:4]}" for m in months]
    serie = pd.DataFrame({"Bruto": bruto_s.values, "Líquido": (bruto_s - custo_s).values}, index=names)

    bruto, custos = float(bruto_s.iloc[-1]), float(custo_s.iloc[-1])
    liquido = bruto - custos
    prolabore = max(0, liquido) * pct_p / 100
    fundo = max(0, liquido) * pct_f / 100
    prev_bruto = float(bruto_s.iloc[-2]) or 1
    delta = (bruto - prev_bruto) / prev_bruto * 100
    fundo_acum = max(0.0, float(tx["op"].sum())) * pct_f / 100

    k1, k2, k3, k4 = st.columns(4)
    k1.markdown(kpi_card("Receita bruta", brl(bruto), f"{'▲' if delta >= 0 else '▼'} {abs(delta):.1f}% vs. mês anterior", "mint"), unsafe_allow_html=True)
    k2.markdown(kpi_card("Custos operacionais", brl(custos), f"{(custos / max(bruto, 1) * 100):.0f}% da receita do mês", "rose"), unsafe_allow_html=True)
    k3.markdown(kpi_card("Lucro líquido", brl(liquido), f"Margem de {(liquido / max(bruto, 1) * 100):.0f}%", "azure"), unsafe_allow_html=True)
    k4.markdown(kpi_card("Fundo de Frota", brl(fundo), f"Reserva acumulada: {brl(fundo_acum)}", "gold"), unsafe_allow_html=True)

    st.write("")
    col_chart, col_split = st.columns([2, 1])
    with col_chart:
        st.markdown('<div class="panel"><span class="kpi-label">Rendimento bruto × líquido · últimos 7 meses</span>', unsafe_allow_html=True)
        st.area_chart(serie, color=[MINT, AZURE], height=280)
        st.markdown("</div>", unsafe_allow_html=True)

    with col_split:
        seg = [("Custos operacionais", custos, ROSE), (f"Pró-labore — {founder}", prolabore, GOLD), ("Fundo de Frota", fundo, MINT)]
        base = max(bruto, 1)
        rows_html = "".join(
            f'<div style="display:flex;align-items:center;gap:8px;margin:9px 0;font-size:12px">'
            f'<span style="width:9px;height:9px;border-radius:50%;background:{c}"></span>'
            f'<span style="flex:1;color:#9aa5b0">{n}</span>'
            f'<b style="color:{c};font-size:11px">{v / base * 100:.0f}%</b>'
            f'<b class="mono" style="color:#fff">{brl(v)}</b></div>' for n, v, c in seg)
        bar = "".join(f'<div style="width:{max(v, 0) / base * 100}%;background:{c}"></div>' for _, v, c in seg)
        st.markdown(f"""<div class="panel" style="margin-bottom:12px">
          <span class="kpi-label">Divisão automática de lucros</span>
          <div style="font-size:11px;color:#727e89;margin:2px 0 10px">Regra sobre o resultado de {MESES[date.today().month - 1]}</div>
          {rows_html}
          <div style="font-size:9px;letter-spacing:.16em;color:#68747f;font-weight:800;text-transform:uppercase;margin:14px 0 6px">
            Para onde vai cada R$ 1,00</div>
          <div class="segbar">{bar}</div></div>""", unsafe_allow_html=True)

        with st.expander("Ajustar percentuais da divisão"):
            with st.form("division_form"):
                np_ = st.number_input("Pró-labore (%)", 0, 100, pct_p)
                nf = st.number_input("Fundo de Frota (%)", 0, 100, pct_f)
                ok = st.form_submit_button("Salvar regra", type="primary")
            if np_ + nf != 100:
                st.warning(f"A soma deve ser 100% (atual: {np_ + nf}%).")
            if ok and np_ + nf == 100:
                exec_("INSERT INTO settings(key,value) VALUES('prolaborePct',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (str(np_),))
                exec_("INSERT INTO settings(key,value) VALUES('fleetPct',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (str(nf),))
                st.toast("Regra de divisão atualizada!", icon=":material/check:")
                st.rerun()

    c1, c2, c3 = st.columns(3)
    with c1:
        last30 = tx[tx["tx_date"] >= iso(-30)].copy()
        flow = last30.groupby(["tx_date", "kind"])["amount_cents"].sum().unstack(fill_value=0)
        flow["fluxo"] = flow.get("entrada", 0) - flow.get("saida", 0)
        flow_df = pd.DataFrame({"Fluxo": flow["fluxo"].values}, index=[d[8:10] + "/" + d[5:7] for d in flow.index])
        st.markdown('<div class="panel"><span class="kpi-label">Fluxo diário · últimos 30 dias</span>', unsafe_allow_html=True)
        st.bar_chart(flow_df, color=MINT, height=190)
        st.markdown("</div>", unsafe_allow_html=True)
    with c2:
        today_tx = tx[tx["tx_date"] == today]
        tin = float(today_tx.loc[today_tx["kind"] == "entrada", "amount_cents"].sum())
        tout = float(today_tx.loc[today_tx["kind"] == "saida", "amount_cents"].sum())
        rows_h = "".join(
            f'<div class="row-item"><span style="color:{MINT if r.kind == "entrada" else ROSE};font-weight:800">{"▲" if r.kind == "entrada" else "▼"}</span>'
            f'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:#e5e9ee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{r.description}</div>'
            f'<div style="font-size:10px;color:#68747f">{r.category}</div></div>'
            f'<b class="mono" style="color:{MINT if r.kind == "entrada" else ROSE}">{brl(r.amount_cents)}</b></div>'
            for r in today_tx.itertuples()) or '<p style="font-size:12px;color:#68747f;padding:18px 0">Sem movimentações hoje.</p>'
        st.markdown(f"""<div class="panel" style="min-height:280px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span class="kpi-label">Caixa de hoje</span>{badge(brl(tin - tout), "mint" if tin >= tout else "rose")}</div>{rows_h}</div>""",
                    unsafe_allow_html=True)
    with c3:
        ev = q("""SELECT e.*, c.name AS client FROM events e LEFT JOIN clients c ON c.id=e.client_id
                  WHERE e.event_date >= ? AND e.status != 'cancelado' ORDER BY e.event_date LIMIT 6""", (today,))
        pipeline = float(ev["gross_cents"].sum()) if len(ev) else 0
        rows_ev = "".join(
            f'<div class="row-item" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px">'
            f'<span style="font-size:12px;font-weight:600;color:#e5e9ee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{r.title}</span>'
            f'{badge(STATUS_LABEL.get(r.status, r.status), STATUS_TONE.get(r.status, "zinc"))}</div>'
            f'<div style="display:flex;gap:10px;font-size:10.5px;color:#68747f;margin-top:4px">'
            f'<span style="color:{AZURE}">{fmt_date(r.event_date)}</span><span>{r.passengers} pax</span>'
            f'<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{r.client or "—"}</span>'
            f'<b class="mono zinc">{brl(r.gross_cents)}</b></div></div>'
            for r in ev.itertuples()) or '<p style="font-size:12px;color:#68747f;padding:18px 0">Nenhum evento futuro.</p>'
        st.markdown(f"""<div class="panel" style="min-height:280px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span class="kpi-label">Próximos eventos</span><b class="mono mint" style="font-size:12px">{brl(pipeline)}</b></div>{rows_ev}</div>""",
                    unsafe_allow_html=True)

# ═════════════════════════════════════════════════════════════════════════
# PÁGINA 2 — CAIXA DIÁRIO
# ═════════════════════════════════════════════════════════════════════════
elif page == "Caixa Diário":
    page_header("Financeiro operacional", "Caixa Diário", "Lance entradas e saídas e acompanhe o saldo em tempo real")
    tx = q("SELECT * FROM transactions ORDER BY tx_date DESC, id DESC")
    today = date.today().isoformat()
    this_month = today[:7]

    today_in = float(tx.loc[(tx["tx_date"] == today) & (tx["kind"] == "entrada"), "amount_cents"].sum())
    today_out = float(tx.loc[(tx["tx_date"] == today) & (tx["kind"] == "saida"), "amount_cents"].sum())
    month_in = float(tx.loc[(tx["tx_date"].str.startswith(this_month)) & (tx["kind"] == "entrada"), "amount_cents"].sum())
    month_out = float(tx.loc[(tx["tx_date"].str.startswith(this_month)) & (tx["kind"] == "saida"), "amount_cents"].sum())
    saldo = float(tx.loc[tx["kind"] == "entrada", "amount_cents"].sum() - tx.loc[tx["kind"] == "saida", "amount_cents"].sum())

    a, b, c_, d = st.columns(4)
    a.markdown(kpi_card("Entradas hoje", brl(today_in), fmt_date(today), "mint"), unsafe_allow_html=True)
    b.markdown(kpi_card("Saídas hoje", brl(today_out), f"Saldo do dia: {brl(today_in - today_out)}", "rose"), unsafe_allow_html=True)
    c_.markdown(kpi_card("Resultado do mês", brl(month_in - month_out), f"Entradas {brl(month_in)}", "azure"), unsafe_allow_html=True)
    d.markdown(kpi_card("Saldo acumulado", brl(saldo), "Todo o histórico do caixa", "gold"), unsafe_allow_html=True)

    st.write("")
    with st.container(border=True):
        st.markdown("**Novo lançamento**")
        kind = st.radio("Tipo", ["entrada", "saida"], horizontal=True, format_func=str.capitalize,
                        label_visibility="collapsed", key="tx_kind")
        c1, c2, c3, c4, c5 = st.columns([3, 2, 1.6, 1.4, 1])
        desc = c1.text_input("Descrição", placeholder="Ex.: Fretamento — Excursão Colégio",
                             label_visibility="visible", key="tx_desc")
        cat = c2.selectbox("Categoria", CATS_IN if kind == "entrada" else CATS_OUT, key="tx_cat")
        val = c3.number_input("Valor (R$)", min_value=0.0, step=50.0, format="%.2f", key="tx_val")
        dt_ = c4.date_input("Data", value=date.today(), format="DD/MM/YYYY", key="tx_date")
        c5.write("")
        if c5.button("Lançar", type="primary", key="tx_add"):
            if not desc.strip():
                st.warning("Informe uma descrição.")
            elif val <= 0:
                st.warning("Informe um valor maior que zero.")
            else:
                exec_("INSERT INTO transactions(tx_date,description,category,kind,amount_cents) VALUES(?,?,?,?,?)",
                      (dt_.isoformat(), desc.strip(), cat, kind, round(val * 100)))
                st.toast("Lançamento registrado no caixa!", icon=":material/check:")
                st.rerun()

    st.markdown("#### Extrato por dia")
    recent = tx.head(80)
    for day, group in recent.groupby("tx_date", sort=False):
        din = float(group.loc[group["kind"] == "entrada", "amount_cents"].sum())
        dout = float(group.loc[group["kind"] == "saida", "amount_cents"].sum())
        st.markdown(f"""<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px 4px;
          border-bottom:1px solid rgba(255,255,255,.08);margin-top:10px">
          <b style="font-size:13px;color:#fff">{fmt_date(day)}{' · <span style="color:#34d399">hoje</span>' if day == today else ''}</b>
          <span class="mono" style="font-size:11.5px"><span class="mint">+{brl(din)}</span> ·
          <span class="rose">−{brl(dout)}</span> · <b class="white">{brl(din - dout)}</b></span></div>""",
                    unsafe_allow_html=True)
        for r in group.itertuples():
            cols = st.columns([0.35, 5, 2, 1.6, 0.8])
            cols[0].markdown(f'<span style="color:{MINT if r.kind == "entrada" else ROSE};font-weight:800">{"▲" if r.kind == "entrada" else "▼"}</span>', unsafe_allow_html=True)
            cols[1].markdown(f"**{r.description}**")
            cols[2].markdown(f'<span class="zinc" style="font-size:12px">{r.category}</span>', unsafe_allow_html=True)
            cols[3].markdown(f'<span class="mono {"mint" if r.kind == "entrada" else "rose"}" style="font-weight:700">{"+" if r.kind == "entrada" else "−"}{brl(r.amount_cents)}</span>', unsafe_allow_html=True)
            if cols[4].button("Excluir", key=f"txdel_{r.id}"):
                exec_("DELETE FROM transactions WHERE id=?", (r.id,))
                st.rerun()

# ═════════════════════════════════════════════════════════════════════════
# PÁGINA 3 — CRM
# ═════════════════════════════════════════════════════════════════════════
elif page == "CRM — Clientes & Escolas":
    page_header("Relacionamento", "CRM — Clientes & Escolas",
                "Diretório unificado de contratantes, escolas e parceiros de turismo")

    with st.expander("＋ Novo cadastro", expanded=False):
        n1, n2, n3 = st.columns(3)
        f_name = n1.text_input("Nome / Razão social *", key="crn")
        f_cat = n2.selectbox("Categoria", list(CATEGORY_LABEL.keys()),
                             format_func=lambda k: CATEGORY_LABEL[k], key="crc")
        f_doc = n3.text_input("CPF ou CNPJ", key="crd")
        n4, n5, n6 = st.columns(3)
        f_contact = n4.text_input("Contato responsável", key="crk")
        f_phone = n5.text_input("Telefone", key="crp")
        f_zap = n6.text_input("WhatsApp", key="crw")
        n7, n8, n9 = st.columns(3)
        f_email = n7.text_input("E-mail", key="cre")
        f_city = n8.text_input("Cidade", key="crci")
        f_state = n9.text_input("UF", max_chars=2, key="cru")
        f_addr = st.text_input("Endereço", key="cra")
        f_notes = st.text_area("Observações internas", key="crno", height=70)
        if st.button("Cadastrar contato", type="primary", key="crsave"):
            if not f_name.strip():
                st.warning("Informe o nome da instituição/contratante.")
            else:
                exec_("""INSERT INTO clients(name,category,document,contact,email,phone,whatsapp,city,state,address,status,notes)
                         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                      (f_name.strip(), f_cat, mask_document(f_doc), f_contact, f_email, f_phone, f_zap,
                       f_city, f_state, f_addr, "ativo", f_notes))
                st.toast("Cadastro criado com sucesso!", icon=":material/check:")
                st.rerun()

    clients = q("SELECT * FROM clients ORDER BY name")
    events = q("SELECT * FROM events ORDER BY event_date DESC")

    f1, f2 = st.columns([1.4, 1])
    tab = f1.radio("Filtro", ["todos"] + list(CATEGORY_LABEL.keys()), horizontal=True,
                   format_func=lambda k: "Todos" if k == "todos" else CATEGORY_LABEL[k],
                   label_visibility="collapsed", key="crfilter")
    search = f2.text_input("Buscar", placeholder="Buscar por nome, documento, cidade…",
                           label_visibility="collapsed", key="crsearch")

    df = clients.copy()
    if tab != "todos":
        df = df[df["category"] == tab]
    if search.strip():
        s = search.strip().lower()
        df = df[df.apply(lambda r: s in str(r[["name", "document", "contact", "city", "email"]]).lower(), axis=1)]

    st.caption(f"{len(df)} registro(s) encontrados · {int((clients['status'] == 'ativo').sum())} ativos no total")

    for r in df.itertuples(index=False):
        hist = events[events["client_id"] == r.id]
        revenue = float(hist.loc[hist["status"] != "cancelado", "gross_cents"].sum())
        header_html = (f'{badge(CATEGORY_LABEL.get(r.category, r.category), CAT_TONE.get(r.category, "zinc"))} '
                       f'{badge(STATUS_LABEL.get(r.status, r.status), STATUS_TONE.get(r.status, "zinc"))}')
        with st.expander(f"{r.name} — {CATEGORY_LABEL.get(r.category, r.category)}"):
            st.markdown(header_html, unsafe_allow_html=True)
            c1, c2 = st.columns([1.3, 1])
            with c1:
                st.markdown(f"""<div style="font-size:12.5px;line-height:2;color:#9aa5b0">
                  <b class="white">Documento:</b> {r.document or '—'}<br>
                  <b class="white">Responsável:</b> {r.contact or '—'}<br>
                  <b class="white">E-mail:</b> {r.email or '—'} · <b class="white">Fone:</b> {r.phone or '—'} · <b class="white">WhatsApp:</b> {r.whatsapp or '—'}<br>
                  <b class="white">Endereço:</b> {r.address or '—'} {('— ' + str(r.city) + '/' + str(r.state)) if r.city else ''}</div>""",
                            unsafe_allow_html=True)
                if r.notes:
                    st.info(str(r.notes), icon=":material/sticky_note_2:")
            with c2:
                st.markdown(kpi_card("Faturamento acumulado", brl(revenue), f"{len(hist)} evento(s) registrado(s)", "mint"), unsafe_allow_html=True)
                ns = st.selectbox("Status de atendimento", ["lead", "ativo", "inativo"],
                                  index=["lead", "ativo", "inativo"].index(r.status if r.status in ("lead", "ativo", "inativo") else "ativo"),
                                  format_func=lambda k: STATUS_LABEL[k], key=f"st_{r.id}")
                b1, b2 = st.columns(2)
                if b1.button("Atualizar status", key=f"sts_{r.id}"):
                    exec_("UPDATE clients SET status=? WHERE id=?", (ns, r.id))
                    st.rerun()
                if b2.button("Excluir contato", key=f"cldel_{r.id}"):
                    exec_("DELETE FROM clients WHERE id=?", (r.id,))
                    st.toast("Contato removido.", icon=":material/delete:")
                    st.rerun()
            st.markdown("**Histórico de eventos**")
            if len(hist):
                show = hist.copy()
                show["Data"] = show["event_date"].map(fmt_date)
                show["Evento"] = show["title"]
                show["Destino"] = show["destination"].fillna("—")
                show["Pax"] = show["passengers"]
                show["Status"] = show["status"].map(lambda s: STATUS_LABEL.get(s, s))
                show["Valor"] = show["gross_cents"].map(brl)
                st.dataframe(show[["Data", "Evento", "Destino", "Pax", "Status", "Valor"]], hide_index=True)
            else:
                st.caption("Nenhum evento registrado para este contato.")

# ═════════════════════════════════════════════════════════════════════════
# PÁGINA 4 — ORÇAMENTOS & DOCUMENTOS
# ═════════════════════════════════════════════════════════════════════════
elif page == "Orçamentos & Documentos":
    page_header("Comercial", "Orçamentos & Documentos",
                "Gere proposta comercial + contrato numerados, prontos para impressão/PDF")

    clients = q("SELECT * FROM clients ORDER BY name")
    col_gen, col_list = st.columns([1.25, 1])

    with col_gen:
        st.markdown("##### Gerador instantâneo")
        client_opts = ["— digitar manualmente —"] + clients["name"].tolist()
        sel = st.selectbox("Contratante (CRM)", client_opts, key="qc")
        pre = clients[clients["name"] == sel].iloc[0] if sel != client_opts[0] and len(clients[clients["name"] == sel]) else None
        g1, g2 = st.columns(2)
        q_name = g1.text_input("Nome do contratante *", value=("" if pre is None else pre["name"]), key="qn")
        q_doc = g2.text_input("CNPJ/CPF do contratante", value=("" if pre is None else (pre["document"] or "")), key="qd")
        q_addr = st.text_input("Endereço do contratante",
                               value=("" if pre is None else " — ".join(x for x in [pre["address"], f"{pre['city']}/{pre['state']}" if pre["city"] else ""] if x)),
                               key="qa")

        g3, g4, g5, g6 = st.columns(4)
        q_origin = g3.text_input("Origem", placeholder="São Paulo/SP", key="qo")
        q_dest = g4.text_input("Destino", placeholder="Campos do Jordão/SP", key="qds")
        q_date = g5.date_input("Data do evento", value=date.today(), format="DD/MM/YYYY", key="qdt")
        q_pax = g6.number_input("Passageiros", 0, 400, 46, key="qp")
        g7, g8 = st.columns([2, 1])
        q_vehicle = g7.selectbox("Veículo", VEHICLES, index=2, key="qv")
        q_hours = g8.number_input("Duração (h)", 0, 240, 10, key="qh")

        st.markdown("**Precificação**")
        pm = st.radio("Modelo de cobrança", list(PRICE_MODES.keys()), horizontal=True,
                      format_func=lambda k: PRICE_MODES[k], label_visibility="collapsed", key="qpm")
        p1, p2, p3 = st.columns(3)
        qty = 1 if pm == "fixo" else (int(q_hours) if pm == "hora" else p2.number_input(f"Qtd. ({UNIT_LABEL[pm]}s)", 1, 5000, 120 if pm == "km" else 2, key="qqty"))
        unit_val = p1.number_input("Valor total (R$)" if pm == "fixo" else f"Valor por {UNIT_LABEL[pm]} (R$)",
                                   min_value=0.0, step=100.0, format="%.2f", key="qu")
        valid = p3.number_input("Validade (dias)", 1, 90, 15, key="qvd")
        qty_cents, total_cents = round(unit_val * 100), round(unit_val * 100) * (1 if pm == "fixo" else int(qty))
        if pm == "fixo":
            p2.markdown("")
        st.markdown(f"""<div class="panel" style="display:flex;justify-content:space-between;align-items:center">
          <div><span class="kpi-label">Total da proposta</span>
          <div class="kpi-value mint">{brl(total_cents)}</div>
          <div class="kpi-hint">{'' if pm == 'fixo' else f'{qty} {UNIT_LABEL[pm]} × {brl(qty_cents)}'}</div></div>
          <span style="font-size:11px;color:#68747f">Cálculo atualizado em tempo real</span></div>""",
                    unsafe_allow_html=True)
        q_notes = st.text_area("Observações (aparecem na proposta)",
                               placeholder="Ex.: Inclui seguro APP, 1 monitor, pedágios inclusos…", height=68, key="qno")
        if st.button("Gerar proposta + contrato", type="primary", key="qgen"):
            if not q_name.strip():
                st.warning("Selecione ou digite o nome do contratante.")
            elif total_cents <= 0:
                st.warning("Informe o valor da proposta.")
            else:
                nxt = conn.execute("SELECT COALESCE(MAX(id),0)+1 FROM quotes").fetchone()[0]
                number = f"ORC-{date.today().year}-{nxt:04d}"
                cur = conn.execute("""INSERT INTO quotes(number,client_id,client_name,client_document,client_address,event_date,
                    origin,destination,passengers,hours,vehicle,price_mode,quantity,unit_price_cents,total_cents,valid_days,notes,status,created_at)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (number, None if pre is None else int(pre["id"]), q_name.strip(), q_doc, q_addr, q_date.isoformat(),
                     q_origin, q_dest, int(q_pax), int(q_hours), q_vehicle, pm, 1 if pm == "fixo" else int(qty),
                     qty_cents, total_cents, int(valid), q_notes, "rascunho", datetime.now().isoformat(timespec="seconds")))
                conn.commit()
                st.session_state.doc_id = cur.lastrowid
                st.toast(f"Documento {number} gerado!", icon=":material/description:")
                st.rerun()

    with col_list:
        st.markdown("##### Documentos gerados")
        quotes = q("SELECT * FROM quotes ORDER BY id DESC")
        if not len(quotes):
            st.caption("Nenhuma proposta ainda — use o gerador ao lado.")
        for r in quotes.itertuples(index=False):
            st.markdown(f"""<div class="row-item" style="display:block">
              <div style="display:flex;justify-content:space-between">
                <b class="mono azure" style="font-size:11px">{r.number}</b>
                {badge(STATUS_LABEL.get(r.status, r.status), STATUS_TONE.get(r.status, "zinc"))}</div>
              <div style="font-size:12.5px;font-weight:600;color:#e5e9ee;margin-top:4px">{r.client_name}</div>
              <div style="display:flex;gap:10px;font-size:10.5px;color:#68747f;margin-top:3px">
                <span>{fmt_date(str(r.event_date))}</span><span>{r.passengers} pax</span>
                <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{r.destination or '—'}</span>
                <b class="mono mint">{brl(r.total_cents)}</b></div></div>""", unsafe_allow_html=True)
            b1, b2, b3 = st.columns([1.4, 1.6, 1])
            if b1.button("Ver documento", key=f"qview_{r.id}"):
                st.session_state.doc_id = r.id
            ns = b2.selectbox("Status", ["rascunho", "enviado", "aprovado", "recusado"],
                              index=["rascunho", "enviado", "aprovado", "recusado"].index(r.status if r.status in ("rascunho", "enviado", "aprovado", "recusado") else "rascunho"),
                              format_func=lambda k: STATUS_LABEL[k], key=f"qsel_{r.id}", label_visibility="collapsed")
            if b2.button("Salvar", key=f"qst_{r.id}"):
                exec_("UPDATE quotes SET status=? WHERE id=?", (ns, r.id))
                st.rerun()
            if b3.button("Excluir", key=f"qdel_{r.id}"):
                exec_("DELETE FROM quotes WHERE id=?", (r.id,))
                st.session_state.doc_id = None
                st.rerun()

    # Pré-visualização e exportação do documento
    if st.session_state.doc_id:
        row = conn.execute("SELECT * FROM quotes WHERE id=?", (st.session_state.doc_id,)).fetchone()
        if row:
            st.divider()
            d1, d2 = st.columns([2, 1])
            d1.markdown(f"### Documento {row['number']} — pronto para PDF")
            html_doc = build_document_html(row, settings_map())
            d2.download_button("Baixar documento (HTML) — abra e salve como PDF",
                               data=html_doc.encode("utf-8"), file_name=f"{row['number']}.html",
                               mime="text/html", type="primary", key="qdl")
            d1.caption("Dica: o botão ao lado baixa o arquivo. Abra-o no navegador e use Ctrl+P → “Salvar como PDF”.")
            st.iframe(html_doc, height=1200)

# ═════════════════════════════════════════════════════════════════════════
# PÁGINA 5 — COFRE CPF/CNPJ
# ═════════════════════════════════════════════════════════════════════════
elif page == "Cofre CPF/CNPJ":
    page_header("Dados sensíveis", "Cofre de CPFs & CNPJs",
                "Cadastros corporativos e particulares com exibição mascarada (LGPD)")

    st.markdown(f"""<div class="panel" style="display:flex;gap:12px;align-items:center;border-color:rgba(52,211,153,.25)">
      <span style="color:{MINT};font-weight:800">LGPD</span>
      <span style="font-size:12px;color:#9aa5b0">Os documentos são exibidos parcialmente ofuscados por padrão.
      Use “Revelar” apenas quando necessário e evite compartilhar a tela.</span></div>""", unsafe_allow_html=True)
    st.write("")

    entries = q("SELECT * FROM registry ORDER BY holder_name")
    a, b, c_, d = st.columns(4)
    a.markdown(kpi_card("Total de cadastros", str(len(entries)), "no cofre", "azure"), unsafe_allow_html=True)
    b.markdown(kpi_card("CPFs", str(int((entries["doc_type"] == "cpf").sum())), "pessoas físicas", "mint"), unsafe_allow_html=True)
    c_.markdown(kpi_card("CNPJs", str(int((entries["doc_type"] == "cnpj").sum())), "pessoas jurídicas", "gold"), unsafe_allow_html=True)
    d.markdown(kpi_card("Corporativos", str(int((entries["person_type"] == "corporativo").sum())), "uso empresarial", "rose"), unsafe_allow_html=True)

    st.write("")
    with st.expander("＋ Novo documento", expanded=False):
        r1, r2, r3 = st.columns(3)
        e_name = r1.text_input("Titular *", key="rgn")
        e_doc = r2.text_input("CPF (11) ou CNPJ (14 dígitos) *", key="rgd")
        e_rgie = r3.text_input("RG / Inscrição Estadual", key="rgie")
        r4, r5, r6 = st.columns(3)
        e_email = r4.text_input("E-mail", key="rge")
        e_phone = r5.text_input("Telefone", key="rgp")
        e_cep = r6.text_input("CEP", key="rgcep")
        e_addr = st.text_input("Endereço", key="rga")
        r7, r8 = st.columns([2, 1])
        e_city = r7.text_input("Cidade", key="rgc")
        e_state = r8.text_input("UF", max_chars=2, key="rgu")
        e_notes = st.text_area("Observações", height=60, key="rgno")
        if st.button("Salvar no cofre", type="primary", key="rgsave"):
            digits = "".join(ch for ch in e_doc if ch.isdigit())
            if not e_name.strip():
                st.warning("Informe o titular do documento.")
            elif len(digits) not in (11, 14):
                st.warning("Documento deve ter 11 dígitos (CPF) ou 14 (CNPJ).")
            else:
                doc_type = "cpf" if len(digits) == 11 else "cnpj"
                exec_("""INSERT INTO registry(holder_name,doc_type,doc_number,person_type,rg_or_ie,email,phone,cep,address,city,state,notes)
                         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                      (e_name.strip(), doc_type, mask_document(e_doc),
                       "corporativo" if doc_type == "cnpj" else "particular",
                       e_rgie, e_email, e_phone, e_cep, e_addr, e_city, e_state.upper(), e_notes))
                st.toast("Documento armazenado com segurança!", icon=":material/lock:")
                st.rerun()

    f1, f2 = st.columns([1, 2])
    rf = f1.radio("Filtro", ["todos", "cpf", "cnpj"], horizontal=True, format_func=str.upper, label_visibility="collapsed", key="rgfilter")
    rs = f2.text_input("Buscar", placeholder="Buscar titular, documento, cidade…", label_visibility="collapsed", key="rgsearch")

    fe = entries.copy()
    if rf != "todos":
        fe = fe[fe["doc_type"] == rf]
    if rs.strip():
        s = rs.strip().lower()
        fe = fe[fe.apply(lambda r: s in str(r[["holder_name", "doc_number", "city", "email"]]).lower(), axis=1)]

    for r in fe.itertuples(index=False):
        revealed = r.id in st.session_state.revealed
        c1, c2, c3 = st.columns([2.4, 1.8, 1.1])
        with c1:
            st.markdown(f"""<div style="padding:6px 0"><b style="color:#fff;font-size:13.5px">{r.holder_name}</b>
              {' ' + badge(r.doc_type.upper(), "mint" if r.doc_type == "cpf" else "gold")}
              {' ' + badge("Corporativo" if r.person_type == "corporativo" else "Particular", "azure" if r.person_type == "corporativo" else "zinc")}
              <div style="font-size:11px;color:#68747f;margin-top:4px">{r.email or '—'} · {(str(r.city) + '/' + str(r.state)) if r.city else '—'}</div></div>""",
                        unsafe_allow_html=True)
        with c2:
            if revealed:
                st.code(r.doc_number, language=None)
            else:
                st.markdown(f'<div class="mono zinc" style="padding:10px 0;letter-spacing:.08em">{obfuscate(r.doc_number)}</div>',
                            unsafe_allow_html=True)
        with c3:
            b1, b2 = st.columns(2)
            if b1.button("Ocultar" if revealed else "Revelar", key=f"rgrev_{r.id}"):
                st.session_state.revealed.discard(r.id) if revealed else st.session_state.revealed.add(r.id)
                st.rerun()
            if b2.button("Excluir", key=f"rgdel_{r.id}"):
                exec_("DELETE FROM registry WHERE id=?", (r.id,))
                st.session_state.revealed.discard(r.id)
                st.rerun()
        st.markdown('<div style="border-bottom:1px solid rgba(255,255,255,.05)"></div>', unsafe_allow_html=True)

st.markdown("""<div style="text-align:center;margin-top:48px;font-size:10.5px;color:#3f4a54">
  DG Mobi Magic System · Gestão corporativa para turismo &amp; entretenimento · Dados armazenados localmente (SQLite)</div>""",
            unsafe_allow_html=True)
