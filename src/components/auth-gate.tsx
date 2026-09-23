"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bus, Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn } from "lucide-react";
import { cn } from "@/lib/format";

const SESSION_KEY = "dg_mobi_session";

// Credenciais de demonstração (em produção, valide no backend)
const ALLOWED_EMAILS = ["contato@dgmobimagic.com.br", "douglas@dgmobimagic.com.br", "admin@dgmobimagic.com.br"];
const DEMO_PASSWORD = "magic2026";

type Status = "loading" | "locked" | "unlocking" | "open";

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Restaura sessão existente
  useEffect(() => {
    const raw =
      window.localStorage.getItem(SESSION_KEY) || window.sessionStorage.getItem(SESSION_KEY);
    setStatus(raw ? "open" : "locked");
  }, []);

  // Logout disparado pelo botão do painel
  useEffect(() => {
    const onLogout = () => {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
      setEmail("");
      setPassword("");
      setError("");
      setStatus("locked");
    };
    window.addEventListener("dgmobi:logout", onLogout);
    return () => window.removeEventListener("dgmobi:logout", onLogout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 650)); // simula latência

    const emailOk = ALLOWED_EMAILS.includes(normalized);
    const passOk = password === DEMO_PASSWORD;
    if (!emailOk || !passOk) {
      setSubmitting(false);
      setError(
        !emailOk
          ? "E-mail não autorizado. Use um e-mail corporativo válido."
          : "Senha incorreta. Tente novamente."
      );
      return;
    }

    const payload = JSON.stringify({ email: normalized, ts: Date.now() });
    (remember ? window.localStorage : window.sessionStorage).setItem(SESSION_KEY, payload);
    setSubmitting(false);
    setStatus("unlocking"); // dispara animação de revelação
    setTimeout(() => setStatus("open"), 900);
  };

  // Enquanto carrega, evita flash do conteúdo
  if (status === "loading") {
    return <div className="fixed inset-0 z-[200] bg-[#06080a]" />;
  }

  const showLogin = status === "locked" || status === "unlocking";

  return (
    <>
      {/* Painel real — sempre montado; revelado com fade/scale */}
      <div
        className={cn(
          "transition-all duration-700 ease-out",
          status === "open" && "opacity-100",
          status === "unlocking" && "opacity-100",
          status === "locked" && "pointer-events-none select-none opacity-0"
        )}
        style={{
          transform: status === "locked" ? "scale(1.02)" : "scale(1)",
          filter: status === "locked" ? "blur(6px)" : "none",
        }}
        aria-hidden={showLogin}
      >
        {children}
      </div>

      {/* Tela de login — overlay full-screen */}
      {showLogin && (
        <div
          className={cn(
            "fixed inset-0 z-[150] grid place-items-center overflow-y-auto p-5 transition-all duration-700",
            status === "unlocking" ? "pointer-events-none opacity-0" : "opacity-100"
          )}
          style={{ transform: status === "unlocking" ? "scale(1.08)" : "scale(1)" }}
        >
          {/* Fundo humanizado do trenzinho */}
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{ backgroundImage: "url('/dg-magic/assets/background.jpg')" }}
          />
          {/* Escurecimento para leitura */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 0%, rgba(29,78,216,.35), transparent 60%), linear-gradient(180deg, rgba(10,30,94,.55), rgba(8,15,40,.85))",
            }}
          />

          <LoginCard
            email={email}
            password={password}
            showPass={showPass}
            remember={remember}
            error={error}
            submitting={submitting}
            onEmail={setEmail}
            onPassword={setPassword}
            onTogglePass={() => setShowPass((v) => !v)}
            onRemember={setRemember}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </>
  );
}

function LoginCard(props: {
  email: string;
  password: string;
  showPass: boolean;
  remember: boolean;
  error: string;
  submitting: boolean;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onTogglePass: () => void;
  onRemember: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <section
      className="relative w-full max-w-md rounded-3xl border border-white/25 p-8 shadow-2xl animate-fade-up"
      style={{
        background: "rgba(255,255,255,0.13)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
      }}
    >
      {/* Logo */}
      <header className="mb-6 text-center">
        <div className="relative mx-auto mb-3 h-28 w-28">
          <img
            src="/dg-magic/assets/logo.png"
            alt="DG Mobi Magic"
            className="h-28 w-28 object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
            style={{ animation: "float 5s ease-in-out infinite" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = "flex";
            }}
          />
          <div
            className="absolute inset-0 hidden flex-col items-center justify-center rounded-full border-2 border-gold-400"
            style={{ background: "radial-gradient(circle at 50% 35%, #2563eb, #0a1e5e)" }}
          >
            <Bus className="h-9 w-9 text-white" />
          </div>
        </div>
        <p className="text-[12.5px] italic text-white/85">
          A arte de transformar caminhos em momentos mágicos
        </p>
      </header>

      <h1 className="text-center font-display text-2xl font-bold text-white">Acesso ao Sistema</h1>
      <p className="mb-6 mt-1 text-center text-[13px] text-white/75">
        Entre com suas credenciais corporativas
      </p>

      <form onSubmit={props.onSubmit} noValidate className="space-y-4">
        {/* E-mail */}
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold text-white/90">E-mail Corporativo</span>
          <div className="relative flex items-center">
            <Mail className="pointer-events-none absolute left-3.5 h-4.5 w-4.5 text-white/55" />
            <input
              type="email"
              autoComplete="username"
              value={props.email}
              onChange={(e) => props.onEmail(e.target.value)}
              placeholder="voce@dgmobimagic.com.br"
              className="w-full rounded-xl border border-white/30 bg-white/10 py-3 pl-11 pr-3 text-[14.5px] text-white placeholder-white/45 outline-none transition focus:border-gold-400 focus:bg-white/15 focus:ring-4 focus:ring-gold-400/20"
            />
          </div>
        </label>

        {/* Senha */}
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold text-white/90">Senha</span>
          <div className="relative flex items-center">
            <Lock className="pointer-events-none absolute left-3.5 h-4.5 w-4.5 text-white/55" />
            <input
              type={props.showPass ? "text" : "password"}
              autoComplete="current-password"
              value={props.password}
              onChange={(e) => props.onPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/30 bg-white/10 py-3 pl-11 pr-11 text-[14.5px] text-white placeholder-white/45 outline-none transition focus:border-gold-400 focus:bg-white/15 focus:ring-4 focus:ring-gold-400/20"
            />
            <button
              type="button"
              onClick={props.onTogglePass}
              className="absolute right-2 rounded-lg p-2 text-white/60 transition hover:text-gold-400"
              aria-label={props.showPass ? "Ocultar senha" : "Mostrar senha"}
            >
              {props.showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between text-[12.5px]">
          <label className="flex cursor-pointer items-center gap-2 text-white/85">
            <input
              type="checkbox"
              checked={props.remember}
              onChange={(e) => props.onRemember(e.target.checked)}
              className="h-4 w-4 accent-gold-500"
            />
            Manter conectado
          </label>
          <span className="font-semibold text-gold-300">Esqueci a senha</span>
        </div>

        {props.error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-400/50 bg-rose-500/15 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-200"
          >
            {props.error}
          </div>
        )}

        <button
          type="submit"
          disabled={props.submitting}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-[14px] font-bold tracking-wider text-[#0a1e5e] shadow-[0_12px_26px_-8px_rgba(245,158,11,0.65)] transition hover:brightness-105 disabled:opacity-80"
          style={{ background: "linear-gradient(135deg, #ffd34d, #f59e0b)" }}
        >
          {props.submitting ? (
            <>
              <span className="h-4.5 w-4.5 animate-spin rounded-full border-[2.5px] border-[#0a1e5e]/35 border-t-[#0a1e5e]" />
              VALIDANDO…
            </>
          ) : (
            <>
              <LogIn className="h-4.5 w-4.5" />
              ENTRAR NO SISTEMA
            </>
          )}
        </button>
      </form>

      <footer className="mt-6 flex items-center justify-center gap-2 border-t border-white/15 pt-4 text-center text-[11px] text-white/70">
        <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
        Plataforma Segura · Acesso Restrito · Protegida por Google Authenticator
      </footer>

      <p className="mt-3 text-center text-[10.5px] text-white/45">
        Demo: contato@dgmobimagic.com.br · senha: magic2026
      </p>
    </section>
  );
}
