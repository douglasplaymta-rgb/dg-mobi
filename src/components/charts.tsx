"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { compactBRL, brl } from "@/lib/format";

// ── Tooltip dark compartilhado ──────────────────────────────
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
      {label && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="text-[11px] text-zinc-400">{p.name}</span>
          <span className="ml-auto pl-4 font-mono text-[11.5px] font-semibold text-white tabular">
            {brl(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Área: Bruto x Líquido (12m) ─────────────────────────────
export function FinancialAreaChart({ data }: { data: { name: string; bruto: number; liquido: number; custos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id="gBruto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gLiquido" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#5b6873", fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: "#5b6873", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => compactBRL(v)}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: "rgba(255,255,255,0.12)", strokeDasharray: "4 4" }} />
        <Area type="monotone" dataKey="bruto" name="Receita bruta" stroke="#34d399" strokeWidth={2.4} fill="url(#gBruto)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="liquido" name="Lucro líquido" stroke="#38bdf8" strokeWidth={2} fill="url(#gLiquido)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Donut: divisão de lucros ────────────────────────────────
export function DivisionDonut({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<DarkTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={86}
            paddingAngle={3}
            cornerRadius={6}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Distribuído</p>
        <p className="font-mono text-lg font-bold text-white tabular">{compactBRL(total)}</p>
      </div>
    </div>
  );
}

// ── Barras: fluxo diário do mês ─────────────────────────────
export function DailyCashChart({ data }: { data: { name: string; fluxo: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#5b6873", fontSize: 9 }} axisLine={false} tickLine={false} dy={6} interval={3} />
        <YAxis tick={{ fill: "#5b6873", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => compactBRL(v)} />
        <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
        <Bar dataKey="fluxo" name="Fluxo" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fluxo >= 0 ? "#34d399" : "#fb7185"} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
