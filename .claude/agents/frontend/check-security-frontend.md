---
name: check-security-frontend
description: Valida seguranca frontend — XSS (dangerouslySetInnerHTML, innerHTML), armazenamento inseguro de token/credencial, secrets expostos no bundle, open redirect, dados sensiveis no client e tabnabbing. Detecta vulnerabilidades client-side e oportunidades de evolucao.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### XSS (Cross-Site Scripting)
- Proibido: `dangerouslySetInnerHTML` com conteudo dinamico nao sanitizado (React)
- Proibido: `innerHTML =`, `outerHTML =`, `insertAdjacentHTML` com dados dinamicos
- Proibido: `v-html` com dados do usuario/API sem sanitizacao (Vue)
- Proibido: `[innerHTML]` e `bypassSecurityTrustHtml`/`bypassSecurityTrustScript` (Angular) sem justificativa
- Proibido: `eval(`, `new Function(`, `document.write(` com input dinamico
- Se houver renderizacao de HTML dinamico, deve haver sanitizacao (DOMPurify ou equivalente)

### Armazenamento de Token / Credencial
- Proibido: guardar tokens de autenticacao (JWT, access/refresh token) em `localStorage` ou `sessionStorage` — sao acessiveis por qualquer XSS. Preferir cookie `httpOnly` + `Secure` + `SameSite`
- Proibido: guardar senhas, secrets, dados de cartao ou PII em `localStorage`/`sessionStorage`/IndexedDB sem necessidade

### Secrets Expostos no Bundle
- Proibido: API keys, secrets, tokens ou connection strings hardcoded no codigo frontend
- Proibido: valores sensiveis expostos via variaveis de ambiente publicas do bundler (`VITE_`, `NEXT_PUBLIC_`, `REACT_APP_`, `PUBLIC_`) — qualquer coisa com esses prefixos vai para o bundle e e publica
- Chaves de servicos que exigem segredo (secret key de pagamento, API admin) nunca vivem no frontend

### Open Redirect
- Proibido: redirecionar (`window.location = ...`, `router.push(...)`, `res.redirect(...)`) para URL vinda de query param/input do usuario sem validar contra allowlist ou garantir que e caminho interno

### Dados Sensiveis no Client
- Proibido: logar dados sensiveis (token, senha, CPF, cartao) via `console.log`/`console.error` em producao
- Proibido: enviar PII/token para ferramentas de analytics/tracking de terceiros sem consentimento
- Proibido: dados sensiveis em query string da URL (ficam em historico, logs de servidor, referer)

### Tabnabbing e Links Externos
- Proibido: `target="_blank"` sem `rel="noopener noreferrer"` (reverse tabnabbing e vazamento de referer)

### Autorizacao no Client
- Ocultar UI por perfil/role e UX, **nao seguranca** — toda regra de acesso precisa ser reforcada no backend
- Confiar em flag do client (`isAdmin` no estado) para liberar acao sensivel sem validacao no servidor → AVISO

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre seguranca, autenticacao, armazenamento de sessao, LGPD e privacidade (ex: `0008-seguranca-e-lgpd.md`). Carregar `docs/project/learnings/frontend-learnings.md` para aplicar convencoes de seguranca ja definidas no projeto.

## EXECUCAO

### 1. Verificar XSS
- Grep `dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|v-html|bypassSecurityTrust|document\.write\(` em arquivos de componente → ERRO se conteudo dinamico
- Grep `eval\(|new Function\(` → ERRO
- Verificar se ha `DOMPurify`/sanitizacao proximo a renderizacao de HTML dinamico

### 2. Verificar armazenamento de token
- Grep `localStorage\.setItem|sessionStorage\.setItem` com chaves `token|jwt|auth|access|refresh|password|secret` → ERRO
- Grep `localStorage`/`sessionStorage` guardando objeto de usuario com dados sensiveis → AVISO

### 3. Verificar secrets no bundle
- Grep `apiKey|api_key|secret|token\s*=\s*["']|password\s*=\s*["']` em `.ts/.tsx/.js/.jsx/.vue` → ERRO se valor real
- Grep env publicas com nomes sensiveis: `(VITE_|NEXT_PUBLIC_|REACT_APP_|PUBLIC_).*(SECRET|PASSWORD|PRIVATE|API_KEY|TOKEN)` → ERRO
- Verificar `-----BEGIN.*PRIVATE KEY` → ERRO

### 4. Verificar open redirect
- Grep `window\.location\s*=|location\.href\s*=|router\.push\(` recebendo valor de `searchParams`/`query`/`params` sem validacao → AVISO

### 5. Verificar dados sensiveis em log/URL
- Grep `console\.(log|error|warn|info)\(` com `token|senha|password|cpf|cartao|secret` → AVISO
- Grep dados sensiveis concatenados em URL/query string → AVISO

### 6. Verificar tabnabbing
- Grep `target=["']_blank["']` sem `rel=` proximo com `noopener` → AVISO

### 7. Verificar autorizacao so no client
- Grep acoes sensiveis (delete, aprovar, pagar) liberadas apenas por checagem de role no estado client, sem chamada validada no backend → AVISO

## CLASSIFICACAO
- **ERRO**: XSS (innerHTML/dangerouslySetInnerHTML/v-html/eval com dado dinamico), token/credencial em localStorage/sessionStorage, secret hardcoded ou em env publica, private key no bundle
- **AVISO**: open redirect por input, dados sensiveis em console/URL, `target="_blank"` sem `rel="noopener"`, PII em localStorage, autorizacao apenas no client

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de Seguranca (Frontend)

### Content Security Policy (CSP)
[Se detectado: ausencia de CSP e uso de HTML dinamico ou scripts inline]
- **Situacao**: App sem Content-Security-Policy configurada
- **Sugestao**: Definir CSP (via header no backend/edge ou meta tag) restringindo origens de script/style
- **Como**: `/architect` → criar ADR de CSP / Security Headers
- **Beneficio**: Reduz drasticamente o impacto de XSS mesmo quando uma falha passa

### Sessao via Cookie httpOnly
[Se detectado: tokens em localStorage/sessionStorage]
- **Situacao**: Tokens de autenticacao acessiveis por JavaScript (vulneraveis a exfiltracao por XSS)
- **Sugestao**: Migrar sessao para cookie `httpOnly + Secure + SameSite`
- **Como**: `/architect` → ADR de Estrategia de Sessao / Autenticacao
- **Beneficio**: Token deixa de ser roubavel por XSS

### Auditoria de Dependencias (Supply Chain)
[Se detectado: projeto com muitas dependencias e sem scan automatizado]
- **Situacao**: Sem verificacao de vulnerabilidades em pacotes (`npm audit`, Dependabot, Snyk)
- **Sugestao**: Adicionar scan de dependencias ao pipeline/CI
- **Beneficio**: Detecta CVEs em pacotes antes de chegar em producao
```

Emitir apenas as secoes com evidencia no codigo.
