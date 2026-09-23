/* ═══════════════════════════════════════════════════════════════════════
   DG MOBI MAGIC · script.js  (camada de autenticação + interface)
   -----------------------------------------------------------------------
   ▸ Autenticação em 2 etapas:
       1) E-mail corporativo + senha
       2) Código do Google Authenticator (TOTP de 6 dígitos, real)
   ▸ O código TOTP é validado localmente com Web Crypto (HMAC-SHA1),
     exatamente como o Google Authenticator gera — sem bibliotecas.
   ▸ Sessão persistida em localStorage.
   -----------------------------------------------------------------------
   ⚠️  IMPORTANTE (segurança): este é um DEMO de front-end. Em produção,
       valide senha e TOTP no BACKEND (nunca exponha segredos no navegador).
       Veja o README para o passo a passo de produção.
   ═══════════════════════════════════════════════════════════════════════ */

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 1. CONFIGURAÇÃO — edite aqui os usuários e o segredo do Authenticator │
// └─────────────────────────────────────────────────────────────────────┘
const CONFIG = {
  // Usuários autorizados (em produção isto vem do banco, via backend)
  users: [
    {
      email: "contato@dgmobimagic.com.br",
      password: "magic2026",          // troque por algo forte
      name: "Douglas Pereira",
      // Segredo compartilhado com o Google Authenticator (Base32).
      // Gere um novo em produção. Este é apenas de demonstração.
      totpSecret: "JBSWY3DPEHPK3PXP",
    },
  ],

  // Exija o 2FA? (false = pula a etapa do Authenticator, útil para testar)
  require2FA: true,

  issuer: "DG Mobi Magic",
};

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 2. TOTP (RFC 6238) — mesmo algoritmo do Google Authenticator          │
// └─────────────────────────────────────────────────────────────────────┘
function base32ToBytes(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  const clean = base32.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function generateTOTP(secret, timeStep = 30, digits = 6, forCounter = null) {
  const counter = forCounter ?? Math.floor(Date.now() / 1000 / timeStep);
  const keyBytes = base32ToBytes(secret);

  // Contador em 8 bytes big-endian
  const counterBytes = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) { counterBytes[i] = tmp & 0xff; tmp = Math.floor(tmp / 256); }

  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** digits).toString().padStart(digits, "0");
}

// Valida aceitando ±1 janela (tolera relógios levemente dessincronizados)
async function verifyTOTP(secret, code) {
  if (!/^\d{6}$/.test(code)) return false;
  const step = Math.floor(Date.now() / 1000 / 30);
  for (const c of [step - 1, step, step + 1]) {
    if ((await generateTOTP(secret, 30, 6, c)) === code) return true;
  }
  return false;
}

function otpauthURI(user) {
  const label = encodeURIComponent(`${CONFIG.issuer}:${user.email}`);
  const issuer = encodeURIComponent(CONFIG.issuer);
  return `otpauth://totp/${label}?secret=${user.totpSecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 3. ELEMENTOS                                                          │
// └─────────────────────────────────────────────────────────────────────┘
const $ = (id) => document.getElementById(id);
const loginScreen = $("login-screen");
const appScreen = $("app-screen");
const loginForm = $("login-form");
const twofaForm = $("twofa-form");
const btnLogin = $("btn-login");

let pendingUser = null; // usuário aguardando o 2FA

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 4. HELPERS DE UI                                                      │
// └─────────────────────────────────────────────────────────────────────┘
function showError(el, msg) { el.textContent = msg; el.hidden = false; }
function clearError(el) { el.hidden = true; }

function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 300);
  }, 2600);
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 5. SESSÃO                                                             │
// └─────────────────────────────────────────────────────────────────────┘
const SESSION_KEY = "dg_mobi_session";

function openApp(user) {
  $("user-name").textContent = user.name;
  $("user-email").textContent = user.email;
  $("welcome-name").textContent = user.name.split(" ")[0];
  $("user-avatar").textContent = initials(user.name);

  loginScreen.hidden = true;
  appScreen.hidden = false;
  window.scrollTo(0, 0);
  toast(`Bem-vindo, ${user.name.split(" ")[0]}! Acesso liberado.`);
}

function saveSession(user, remember) {
  const payload = { email: user.email, name: user.name, ts: Date.now() };
  const store = remember ? localStorage : sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify(payload));
}

function restoreSession() {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    const user = CONFIG.users.find((u) => u.email === s.email);
    if (user) openApp(user);
  } catch { /* ignora */ }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  pendingUser = null;
  appScreen.hidden = true;
  loginScreen.hidden = false;
  loginForm.hidden = false;
  twofaForm.hidden = true;
  loginForm.reset();
  twofaForm.reset();
  window.scrollTo(0, 0);
}

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 6. ETAPA 1 — LOGIN (e-mail + senha)                                   │
// └─────────────────────────────────────────────────────────────────────┘
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError($("login-error"));

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  if (!email || !password) {
    return showError($("login-error"), "Preencha e-mail e senha.");
  }

  btnLogin.classList.add("is-loading");
  await new Promise((r) => setTimeout(r, 650)); // simula latência de rede

  const user = CONFIG.users.find((u) => u.email.toLowerCase() === email && u.password === password);
  btnLogin.classList.remove("is-loading");

  if (!user) {
    return showError($("login-error"), "E-mail ou senha inválidos. Tente novamente.");
  }

  if (!CONFIG.require2FA) {
    saveSession(user, $("remember").checked);
    return openApp(user);
  }

  // Vai para a etapa do Google Authenticator
  pendingUser = user;
  loginForm.hidden = true;
  twofaForm.hidden = false;
  $("totp").focus();

  // Dica de configuração (apenas ambiente de demonstração)
  $("twofa-hint").innerHTML =
    `Ainda não configurou? Adicione esta chave no Google Authenticator: ` +
    `<code>${user.totpSecret}</code>`;
});

// Mostrar/ocultar senha
$("toggle-pass").addEventListener("click", () => {
  const input = $("password");
  input.type = input.type === "password" ? "text" : "password";
});

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 7. ETAPA 2 — GOOGLE AUTHENTICATOR (TOTP)                              │
// └─────────────────────────────────────────────────────────────────────┘
$("totp").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
});

twofaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError($("twofa-error"));
  const code = $("totp").value;

  if (!pendingUser) return logout();

  const ok = await verifyTOTP(pendingUser.totpSecret, code);
  if (!ok) {
    $("totp").value = "";
    return showError($("twofa-error"), "Código inválido ou expirado. Gere um novo no app.");
  }

  saveSession(pendingUser, $("remember").checked);
  const u = pendingUser;
  pendingUser = null;
  openApp(u);
});

$("btn-back").addEventListener("click", () => {
  twofaForm.hidden = true;
  loginForm.hidden = false;
  twofaForm.reset();
  clearError($("twofa-error"));
});

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 8. PAINEL — navegação, logout e relógio                               │
// └─────────────────────────────────────────────────────────────────────┘
$("btn-logout").addEventListener("click", logout);

$("nav-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".nav-card");
  if (!card) return;
  toast(`Abrindo módulo: ${card.dataset.module}…`);
  // Em produção, redirecione para a página do módulo, ex.:
  // window.location.href = `/modulos/${card.dataset.module.toLowerCase()}`;
});

function tickClock() {
  const el = $("clock");
  if (el) el.textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
setInterval(tickClock, 1000);
tickClock();

// ┌─────────────────────────────────────────────────────────────────────┐
// │ 9. BOOT                                                               │
// └─────────────────────────────────────────────────────────────────────┘
restoreSession();

// Utilitário de console: gere o código atual (para testar sem o app)
window.dgDebugCode = async () =>
  console.log("Código TOTP atual:", await generateTOTP(CONFIG.users[0].totpSecret));
console.log("%cDG Mobi Magic","color:#fbbf24;font-weight:bold;font-size:14px",
  "\nPara testar o 2FA sem o celular, rode:  await dgDebugCode()");
