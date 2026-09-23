# DG Mobi Magic — Tela de Login + Painel (HTML/CSS/JS)

Interface standalone com tela de login segura (2FA via Google Authenticator),
fundo temático de Fortaleza e painel interno com cards em glassmorphism
(Azul Royal + Amarelo Ouro).

## Arquivos

```
dg-magic/
├── index.html          # estrutura (login + painel)
├── style.css           # identidade visual, glassmorphism, responsivo
├── script.js           # autenticação (senha + TOTP) e interações
└── assets/
    ├── background.jpg   # fundo "Trenzinho Lokomotiva" na Beira-Mar de Fortaleza
    └── logo.png         # logomarca (substitua pela sua oficial)
```

> **Troque o logo:** salve sua arte oficial como `assets/logo.png` (mesmo nome).
> Se o arquivo não existir, a interface mostra um emblema textual de reserva.

---

## Como visualizar (3 formas)

**1. Pela URL do preview desta plataforma**
Acesse: `…/dg-magic/index.html`

**2. Servidor local (recomendado — o 2FA exige contexto seguro)**
```bash
cd dg-magic
python3 -m http.server 8080
# abra http://localhost:8080
```

**3. Abrindo o arquivo direto**
Dê duplo-clique no `index.html`. Observação: alguns navegadores bloqueiam o
`crypto.subtle` (usado no 2FA) em `file://`. Se o código não validar, use a
opção 2 (localhost) — lá funciona 100%.

---

## Credenciais de demonstração

| Campo | Valor |
|---|---|
| E-mail | `contato@dgmobimagic.com.br` |
| Senha | `magic2026` |
| Código 2FA | gerado pelo Google Authenticator (veja abaixo) |

---

## Como configurar a autenticação (Google Authenticator)

O 2FA usa **TOTP real (RFC 6238)** — o mesmo padrão do Google Authenticator,
Microsoft Authenticator e Authy — validado no navegador com Web Crypto.

### Passo 1 — Adicionar a conta no app
No **Google Authenticator** → **＋** → **Inserir chave de configuração**:
- **Nome da conta:** `DG Mobi Magic`
- **Chave:** `JBSWY3DPEHPK3PXP` (o segredo definido em `script.js`)
- **Tipo:** Baseado em tempo

### Passo 2 — Entrar
E-mail + senha → informe o código de 6 dígitos que aparece no app.

> **Testar sem o celular:** abra o Console do navegador (F12) e rode
> `await dgDebugCode()` — ele imprime o código TOTP válido no momento.

### Passo 3 — Personalizar usuários e segredo
Edite o bloco `CONFIG` no topo de `script.js`:
```js
const CONFIG = {
  users: [{
    email: "voce@dgmobimagic.com.br",
    password: "suaSenhaForte",
    name: "Seu Nome",
    totpSecret: "SEU_SEGREDO_BASE32", // gere um novo!
  }],
  require2FA: true,   // false = pula o 2FA (apenas para testes)
  issuer: "DG Mobi Magic",
};
```
Gere um novo segredo Base32 em qualquer gerador confiável de "TOTP secret".

---

## ⚠️ Importante para produção

Esta é uma camada de **demonstração front-end**. Para uso real:

1. **Nunca** deixe senhas ou o `totpSecret` no navegador — mantenha-os no
   **backend**.
2. Faça o login e a verificação do TOTP no servidor (Node, PHP, Python…),
   retornando apenas um **token de sessão** (JWT/cookie httpOnly).
3. Sirva o site sempre sob **HTTPS**.
4. Guarde as senhas com hash forte (bcrypt/argon2).

O algoritmo TOTP em `script.js` pode ser reaproveitado no backend com a mesma
lógica (HMAC-SHA1 + truncamento dinâmico).
