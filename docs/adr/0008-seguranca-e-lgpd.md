# ADR-0008: Seguranca da Informacao e Conformidade LGPD

**Status:** Aceito
**Data:** 2026-10-19
**Decisores:** Adler (dev)
**Escopo:** Baseline de seguranca — aplicavel a qualquer projeto do kit (frontend e backend), agnostico a stack

---

## Contexto e Problema

Regras de seguranca embutidas so no prompt de um agent cobrem os classicos (SQL injection, secrets, auth em endpoints, validacao de input, headers), mas deixam de fora:

1. **Uma decisao arquitetural explicita** que sirva de fonte unica de verdade para o que o projeto considera "seguro o suficiente" — com o "por que" de cada regra.
2. **Cobertura de seguranca no frontend** — XSS, armazenamento inseguro de token, secrets vazados no bundle.
3. **Conformidade com a LGPD** — um kit em PT-BR, voltado ao mercado brasileiro, precisa de diretriz sobre tratamento de dados pessoais.
4. **Riscos modernos** alinhados ao OWASP Top 10 (2021) e OWASP API Top 10 — IDOR/BOLA, SSRF, criptografia fraca, mass assignment, supply chain.

Esta ADR estabelece o **baseline de seguranca** do projeto. Ela e a "Regras para Validacao" que os agents `@check-security` (backend) e `@check-security-frontend` leem na Fase 6. Decisoes especificas por dominio (estrategia de autenticacao concreta, algoritmo de hash, gestao de chaves, rate limiting) podem gerar ADRs proprias que **complementam** esta.

---

## Decisao

Adotar um baseline de seguranca em profundidade (defense in depth) com quatro principios norteadores, um conjunto de requisitos por area e diretrizes de LGPD. Todo codigo novo deve respeitar as "Regras para Validacao" ao final deste documento; excecoes exigem justificativa registrada (comentario no codigo + nota na spec ou ADR complementar).

### Principios

| Principio | Significado pratico |
|-----------|---------------------|
| **Secure by default** | O default e negar. Endpoint nasce autenticado; recurso nasce escopado ao dono. Abrir e decisao explicita. |
| **Least privilege** | Cada ator/servico tem o minimo de acesso necessario. Sem "admin para tudo". |
| **Defense in depth** | Nunca uma unica barreira. Validacao no client **e** no server; autorizacao em rota **e** em objeto. |
| **Privacy by design** | Dado pessoal so e coletado se necessario, com base legal, minimizado e com retencao definida. |

---

## Aplicabilidade

- **Sempre** para projetos que expoem API, autenticam usuarios ou tratam dados pessoais.
- Projetos internos/baixo risco podem **classificar** requisitos como N/A com justificativa (ex: sem cookie → CSRF N/A), mas nao podem ignorar silenciosamente.
- Requisitos de LGPD aplicam-se sempre que houver **dado pessoal** (nome, CPF/CNPJ, email, telefone, endereco, IP, geolocalizacao, dado de saude/financeiro).

---

## Requisitos por Area

### 1. Injection
Queries parametrizadas / ORM com parametros tipados. Sem concatenacao/interpolacao de input em SQL, comandos de SO ou templates.

### 2. Autenticacao
Todo endpoint autenticado por default. Rotas publicas (login, register, health, webhook com validacao propria) explicitamente marcadas. Segredos de sessao fora do codigo.

### 3. Autorizacao
- **Por rota**: middleware/atributo cobrindo endpoints privados.
- **Por objeto (IDOR/BOLA)**: operacoes por ID escopadas ao dono/tenant do token — nunca confiar em `ownerId`/`tenantId` vindo do cliente.
- Estrategia de autorizacao (RBAC/ABAC/policy) definida em ADR quando houver mais de 2 perfis — sem `if (role == "Admin")` espalhado.

### 4. Criptografia
- Senha: hash adaptativo com salt (bcrypt/argon2/scrypt/PBKDF2). Nunca texto puro, reversivel, MD5/SHA1 ou SHA "puro".
- Sem algoritmos/modos fracos (DES, RC4, ECB). Sem desabilitar validacao de certificado TLS. Sem chave/IV hardcoded.
- Dados sensiveis em repouso: avaliar criptografia (ver Oportunidade no `@check-security`).

### 5. Secrets
Secrets (senha, token, connection string, API key, chave privada) sempre em variavel de ambiente ou secret manager. Nunca no codigo nem em config versionado. No frontend, nunca em env publica (`VITE_`, `NEXT_PUBLIC_`, `REACT_APP_`, `PUBLIC_`).

### 6. Validacao e Sanitizacao de Input
DTOs de entrada com validacao declarativa. Nunca bindar request direto em entidade de dominio (mass assignment). Campos sensiveis (`Role`, `IsAdmin`, `Status`, `Price`, `Balance`) nao setaveis pelo cliente.

### 7. XSS e Renderizacao (Frontend)
Sem `dangerouslySetInnerHTML`/`innerHTML`/`v-html`/`eval` com dado dinamico nao sanitizado. HTML dinamico passa por sanitizador (DOMPurify ou equivalente). CSP recomendada.

### 8. Sessao no Cliente (Frontend)
Token de autenticacao preferencialmente em cookie `httpOnly + Secure + SameSite`. Evitar token/credencial/PII em `localStorage`/`sessionStorage` (exfiltravel por XSS).

### 9. SSRF e Redirects
Requisicoes server-side com host do cliente validadas contra allowlist. Redirects (client ou server) para destino do usuario validados contra allowlist / caminho interno.

### 10. Exposicao de Dados Sensiveis
Sem dados sensiveis em logs, respostas desnecessarias, URLs/query strings ou analytics de terceiros sem consentimento.

### 11. Headers de Seguranca
APIs/apps web devem enviar CSP, X-Content-Type-Options, X-Frame-Options (e HSTS quando aplicavel).

### 12. Supply Chain
Recomendado scan de dependencias (`npm audit`, Dependabot, Snyk ou equivalente) no CI. Nao e gate bloqueante por default nesta ADR.

---

## LGPD — Protecao de Dados Pessoais

| Diretriz | O que exige |
|----------|-------------|
| **Base legal** | Todo tratamento de dado pessoal tem base legal (consentimento, execucao de contrato, obrigacao legal, legitimo interesse). Registrar qual. |
| **Minimizacao** | Coletar apenas o dado necessario para a finalidade. Sem "guardar por guardar". |
| **Finalidade** | Dado coletado para uma finalidade nao e reusado para outra sem nova base legal. |
| **Retencao** | Definir por quanto tempo cada dado pessoal e mantido e como e descartado/anonimizado. |
| **Direitos do titular** | Arquitetura deve permitir atender acesso, correcao, portabilidade e exclusao de dados de um titular. |
| **Seguranca** | Dado pessoal sensivel criptografado em transito (TLS) e avaliado para repouso. Acesso auditavel. |
| **Consentimento (frontend)** | Cookies/analytics/tracking nao essenciais so apos consentimento explicito. |
| **Incidentes** | Ter plano/registro para notificacao de vazamento (titular + ANPD) quando aplicavel. |

Dados pessoais **nunca** em logs, URLs ou ferramentas de terceiros sem base legal e consentimento.

---

## Regras para Validacao

> Lidas pelos agents `@check-security` (backend) e `@check-security-frontend` na Fase 6.

**OBRIGATORIO:**
- Queries parametrizadas ou ORM tipado.
- Endpoints privados com autenticacao; rotas publicas marcadas explicitamente.
- Operacoes por ID escopadas ao dono/tenant do token (nao do input do cliente).
- Senha com hash adaptativo + salt (bcrypt/argon2/scrypt/PBKDF2).
- Secrets em env/secret manager; nunca em codigo, config versionado ou env publica de frontend.
- DTO de entrada com validacao; campos sensiveis nao setaveis pelo cliente.
- HTML dinamico sanitizado antes de renderizar.
- TLS para trafego de dados sensiveis/pessoais.
- Base legal + minimizacao + retencao definidas para cada dado pessoal tratado.

**PROIBIDO:**
- Concatenar/interpolar input em SQL, shell ou template.
- Endpoint sem auth e sem marcacao de publico.
- Confiar em `userId`/`tenantId`/`ownerId`/`role` vindos do input do cliente para escopo/autorizacao.
- Hash de senha com MD5/SHA1/SHA "puro", ou senha reversivel/texto puro.
- Algoritmo/modo fraco (DES, RC4, ECB); desabilitar validacao de certificado TLS.
- Secret hardcoded (codigo, config versionado, `VITE_/NEXT_PUBLIC_/REACT_APP_/PUBLIC_` com valor sensivel).
- `dangerouslySetInnerHTML`/`innerHTML`/`v-html`/`eval` com dado dinamico nao sanitizado.
- Token/credencial/PII em `localStorage`/`sessionStorage` sem justificativa.
- Requisicao server-side ou redirect para destino do cliente sem allowlist.
- Dados sensiveis/pessoais em log, URL/query string ou analytics de terceiros sem consentimento.
- Bindar request diretamente em entidade de dominio (mass assignment).

---

## Alternativas Consideradas

### 1. Manter seguranca apenas como regras embutidas nos agents
**Rejeitada:** sem ADR, as regras nao tem "porque", nao sao auditaveis pelo time e nao cobrem LGPD nem frontend. ADR + agents e a combinacao que o kit ja usa para tudo (regra dinamica lida na validacao).

### 2. Adotar um framework externo pesado de compliance (ex: ISO 27001 completo)
**Rejeitada para o baseline:** desproporcional para a maioria dos projetos do kit. Esta ADR e o piso pragmatico alinhado a OWASP + LGPD; projetos regulados podem criar ADRs complementares.

### 3. Gate de seguranca bloqueante no CI (falha build em qualquer finding)
**Rejeitada como default:** risca travar builds por findings pre-existentes ou falsos positivos das checagens heuristicas. O scan de dependencias e o SAST entram no loop de execucao de forma nao bloqueante (secao abaixo); gate bloqueante no CI fica decidivel por projeto.

---

## Consequencias

### Positivas
- Fonte unica de verdade sobre seguranca, lida pelos dois agents de validacao.
- Cobertura ampliada: frontend (XSS, storage, secrets no bundle) e riscos modernos (IDOR/BOLA, SSRF, mass assignment, criptografia).
- LGPD coberta desde o inicio num kit voltado ao Brasil.
- Baseline portavel: qualquer projeto do kit herda o mesmo piso.

### Negativas
- Mais findings na validacao — inclusive AVISOs que exigem triagem humana.
- Checagens sao heuristicas (grep/regex) — nao substituem SAST/DAST nem pentest. Podem gerar falsos positivos/negativos.
- Requisitos de LGPD dependem de decisao de negocio (base legal, retencao) que o agent nao consegue inferir sozinho — exigem preenchimento humano.

### Riscos de Mitigacao
- **Falsos positivos:** classificar como N/A com justificativa no codigo/spec, nao silenciar a regra.
- **Cobertura incompleta:** para projetos de alto risco, complementar com SAST/DAST e pentest — esta ADR e piso, nao teto.

---

## Seguranca dentro do loop de execucao

Com o loop autonomo (ADR-0007), a verificacao de seguranca acontece dentro da execucao, sem
parar a corrida — nao so na validacao (Fase 6) nem so por heuristica de texto. **Tres
camadas, do mais barato ao mais profundo:**

1. **Por fatia** — `@check-security` / `@check-security-frontend` entram entre os
   verificadores independentes do `/execute` sobre os arquivos da fatia. ERRO bloqueia o `DONE`.
2. **Por manifesto tocado** — `.claude/scripts/deps-audit.mjs` (npm, pnpm, .NET, Python via
   pip-audit) compara com o baseline versionado `docs/project/security/deps-baseline.json` e
   so reporta o que **entrou**. Informativo, nao bloqueante (mantem a decisao desta ADR): o
   loop tenta a versao corrigida; aceitar um achado e decisao humana (`--update-baseline`).
   Ecossistema nao suportado aparece como NAO VERIFICADO, nunca como limpo.
3. **No fechamento da feature** — scan das mudancas da branch pelo plugin **Claude Security**,
   quando o Preflight pede (`Scan de seguranca`, com o esforco; a resposta aceita o custo).
   CRITICAL/HIGH confirmados recebem o patch verificado do proprio plugin, aplicado pelo loop
   em commit `fix(security)`; MEDIUM/LOW vao para o relatorio.

**Por que o plugin e declarado e nao copiado.** A licenca do Claude Security e proprietaria e
proibe redistribuicao. O kit o declara em `.claude/settings.json` (`enabledPlugins` +
`extraKnownMarketplaces`): quem usa o kit recebe a oferta de instalar pela loja oficial. Exige
Python 3.9+ e envia contagens de uso pela telemetria do Claude Code (desligavel com
`DISABLE_TELEMETRY=1`). Sem o plugin, o fechamento declara NAO VERIFICADO e segue.

---

## Relacionamentos

- **Implementada por:** agents `@check-security` (`.claude/agents/backend/check-security.md`) e `@check-security-frontend` (`.claude/agents/frontend/check-security-frontend.md`), por `.claude/scripts/deps-audit.mjs` e pelo fechamento de seguranca do `/execute` (plugin Claude Security).
- **Orquestrada em:** verificador independente por fatia do `/execute`; `/backend-validate`, `/frontend-validate` e `/validate` (Fase 6).
- **Complementada por (quando o projeto crescer):** ADRs proprias de Estrategia de Autenticacao, RBAC/ABAC, Rate Limiting, Audit Trail, Criptografia/Gestao de Chaves, CSP.
- **Alinhada a:** OWASP Top 10 (2021), OWASP API Security Top 10, Lei 13.709/2018 (LGPD).
