---
name: check-security
description: Valida seguranca backend — SQL injection, autenticacao/autorizacao em endpoints, secrets, sanitizacao de input, audit trail e RBAC/ABAC. Detecta vulnerabilidades e oportunidades de evolucao de seguranca.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Injection
- Proibido: concatenacao de strings para montar queries SQL (`"SELECT * FROM " + tabela`, `string.Format("SELECT...{0}", id)`)
- Proibido: interpolacao de strings em queries SQL (`$"SELECT * FROM {tabela}"`)
- Obrigatorio: queries parametrizadas ou ORM com parametros tipados
- Proibido: interpolacao de strings em comandos de shell ou sistema operacional

### Autenticacao e Autorizacao
- Todos os endpoints devem ter atributo/middleware de autenticacao exceto rotas publicas explicitas (login, register, health, webhooks com validacao propria)
- Endpoints sem atributo de auth e sem anotacao explicita de "publico" → ERRO
- Proibido: logica de autorizacao hardcoded por papel/perfil espalhada em controllers (`if (user.Role == "Admin")`) sem ADR definindo estrategia

### Autorizacao a Nivel de Objeto (IDOR / BOLA)
- Endpoints que recebem um ID do cliente (path/query/body) e retornam ou alteram um recurso devem **escopar a consulta pelo dono/tenant autenticado** ou checar propriedade antes de responder/alterar
- Proibido: buscar por ID cru vindo do cliente e retornar sem validar que o recurso pertence ao usuario/tenant (`repo.GetById(id)` seguido de retorno direto, sem filtro por owner)
- Proibido: aceitar `userId`/`tenantId`/`ownerId` do body ou query para decidir escopo — o escopo vem do token/sessao, nunca do input do cliente
- Esta e a falha #1 em APIs (BOLA/IDOR): autenticado nao significa autorizado para *aquele* objeto

### CSRF
- Endpoints que alteram estado (POST/PUT/PATCH/DELETE) e usam autenticacao **baseada em cookie** devem ter protecao anti-CSRF (token anti-forgery ou cookie `SameSite=Lax/Strict`)
- Se a autenticacao e exclusivamente via header `Authorization: Bearer` (JWT/token), CSRF classico nao se aplica — registrar como N/A, nao como erro
- Proibido: cookie de sessao/autenticacao sem atributo `SameSite` e sem token anti-CSRF em endpoints de escrita

### Criptografia
- Senhas devem usar algoritmo de hash adaptativo com salt (bcrypt, argon2, scrypt, PBKDF2) — nunca armazenar em texto puro nem criptografia reversivel
- Proibido: hash de senha com MD5, SHA1 ou SHA256/SHA512 "puro" (sem KDF adaptativo) — vulneravel a brute force
- Proibido: algoritmos/modos quebrados ou fracos (DES, 3DES, RC4, modo ECB, `MD5`, `SHA1` para fins de seguranca)
- Proibido: desabilitar validacao de certificado TLS (`ServerCertificateValidationCallback = true`, `rejectUnauthorized: false`, `verify=False`)
- Proibido: chaves/IVs de criptografia hardcoded ou reutilizacao de IV fixo

### SSRF (Server-Side Request Forgery)
- Requisicoes HTTP do servidor (`HttpClient`, `fetch`, `requests`, `WebClient`) que usam URL/host vindos do cliente devem validar contra allowlist de destinos permitidos
- Proibido: montar URL de requisicao server-side concatenando input do cliente sem validacao (permite acesso a rede interna, metadados de cloud, etc.)

### Mass Assignment / Over-posting
- Proibido: bindar o body da request diretamente na entidade de dominio/model persistido (`entity = request` ou `_mapper.Map<Entity>(request)` gravando direto)
- Campos sensiveis (`Role`, `IsAdmin`, `Price`, `Status`, `Balance`, `OwnerId`) nunca devem ser setaveis via DTO de entrada do cliente
- Obrigatorio: usar DTO/Command explicito com apenas os campos que o cliente pode enviar

### Secrets e Configuracao
- Proibido: secrets hardcoded em codigo (passwords, tokens, connection strings, API keys, chaves privadas)
- Proibido: secrets em arquivos de configuracao versionados (`appsettings.json` com valores reais, `.env` commitado)
- Secrets devem vir de variaveis de ambiente ou secret manager

### Input Validation
- DTOs de entrada (Request, Command, Query) devem ter validacao declarativa (DataAnnotations, FluentValidation ou equivalente)
- Proibido: confiar em input do cliente sem validar antes de usar no dominio

### Dados Sensiveis
- Proibido: logar dados sensiveis (senhas, tokens, CPF, CNPJ, cartao de credito, chaves)
- Respostas de API nao devem expor dados sensiveis desnecessariamente (ex: hash de senha, tokens internos)
- Proibido: dados sensiveis em URLs (query strings, path params) — usar body

### Protecao de Headers
- APIs HTTP devem retornar headers de seguranca (Content-Security-Policy, X-Content-Type-Options, X-Frame-Options) — verificar se middleware de seguranca existe

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre seguranca, autenticacao, autorizacao, RBAC, ABAC, audit trail. Aplicar regras OBRIGATORIO/PROIBIDO definidas.

## EXECUCAO

### 1. Verificar SQL Injection
- Grep concatenacao em queries: `"SELECT|INSERT|UPDATE|DELETE" +|string.Format.*SELECT|$".*SELECT`
- Grep em arquivos de Infrastructure/Repository → ERRO se encontrado

### 2. Verificar autenticacao em endpoints
- Glob arquivos de controllers/endpoints
- Grep endpoints sem `[Authorize]`, `[RequireAuthorization]` ou equivalente
- Verificar se existe middleware global de autenticacao (pode cobrir todos os endpoints)
- Endpoints sem cobertura e sem anotacao de publico → ERRO

### 3. Verificar autorizacao hardcoded
- Grep `user.Role ==|user.IsAdmin|claims.*Admin|user.Type ==` em controllers/handlers → AVISO (preferir policy-based)

### 4. Verificar secrets hardcoded
- Grep patterns de secrets: `password\s*=\s*"|Password\s*=\s*"|token\s*=\s*"|ApiKey\s*=\s*"|connectionString\s*=\s*"Server=`
- Grep `-----BEGIN|PRIVATE KEY` → ERRO

### 5. Verificar arquivos de config versionados com secrets
- Ler `appsettings.json`, `appsettings.Production.json` → verificar se contem valores reais de senha/token
- Verificar `.gitignore` cobre arquivos de secret

### 6. Verificar validacao de input
- Glob DTOs de Request/Command
- Verificar presenca de DataAnnotations (`[Required]`, `[MaxLength]`, `[Range]`) ou FluentValidation
- DTOs sem nenhuma validacao → AVISO

### 7. Verificar dados sensiveis em logs e respostas
- Grep `password|senha|token|cpf|cartao|credit` em chamadas de log → ERRO
- Grep propriedades de senha/token em classes de Response → AVISO

### 8. Verificar headers de seguranca
- Grep `UseSecurityHeaders|SecurityHeaders|X-Content-Type|Content-Security-Policy` em Startup/Program
- Ausencia de middleware de security headers em projeto web → AVISO

### 9. Verificar IDOR / BOLA
- Glob handlers/controllers com operacoes por ID (GetById, Update, Delete)
- Grep `GetById\(|FindById\(|\.Find\(id|where.*Id ==` seguido de retorno sem filtro por owner/tenant → AVISO (verificar se ha escopo por usuario)
- Grep uso de `userId`/`tenantId`/`ownerId` lido de `request`/`query`/`body` para decidir escopo (em vez de `User.Claims`/`context.User`) → ERRO

### 10. Verificar CSRF
- Verificar estrategia de auth: se cookie-based, grep `AddAntiforgery|ValidateAntiForgeryToken|SameSite` → ausencia em endpoints de escrita → AVISO
- Se auth exclusivamente Bearer/JWT em header → registrar CSRF como N/A

### 11. Verificar criptografia fraca
- Grep `MD5|SHA1|new SHA256.*password|DES\(|TripleDES|RC4|CipherMode.ECB` → ERRO se usado para senha/seguranca
- Grep hashing de senha sem KDF adaptativo (senha passando por SHA/MD5 direto) → ERRO
- Grep `ServerCertificateValidationCallback\s*=\s*.*true|rejectUnauthorized:\s*false|verify\s*=\s*False` → ERRO

### 12. Verificar SSRF
- Grep `HttpClient|WebClient|fetch\(|requests.get\(|requests.post\(` com URL montada a partir de input do cliente sem allowlist → AVISO

### 13. Verificar Mass Assignment / Over-posting
- Grep `_mapper.Map<.*Entity>\(request|entity = request|Map<Domain` bindando request direto em entidade de dominio → AVISO
- Verificar se DTOs de entrada expoem campos sensiveis (`Role`, `IsAdmin`, `Status`, `Price`, `Balance`, `OwnerId`) → AVISO

## CLASSIFICACAO
- **ERRO**: SQL injection, secret hardcoded, endpoint sem auth sem justificativa, dados sensiveis em log, escopo (owner/tenant) vindo do input do cliente, criptografia/hash de senha fraco, validacao de certificado TLS desabilitada
- **AVISO**: Autorizacao hardcoded por role, DTO sem validacao, ausencia de security headers, dados sensiveis em response, possivel IDOR/BOLA (busca por ID sem filtro por owner), ausencia de anti-CSRF em auth por cookie, SSRF (URL server-side a partir de input), mass assignment (request bindado em entidade)

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de Seguranca

### RBAC / ABAC — Autorizacao Baseada em Politicas
[Se detectado: autorizacao hardcoded por role em multiplos lugares, ou projeto crescendo com mais perfis]
- **Situacao**: X ocorrencias de autorizacao hardcoded por role/perfil em controllers ou handlers
- **Sugestao**: Criar ADR de Autorizacao definindo estrategia (RBAC simples, ABAC por atributo, ou policy-based do framework)
- **Como**: `/architect` → criar ADR de Authorization Strategy
- **Beneficio**: Autorizacao centralizada, auditavel, facil de evoluir sem tocar codigo de negocio

### Audit Trail
[Se detectado: operacoes criticas (delete, update financeiro, mudanca de status) sem registro de auditoria]
- **Situacao**: Operacoes sensiveis sem registro de quem fez, quando e o que mudou
- **Sugestao**: Criar ADR de Audit Trail definindo quais operacoes auditar, formato do log e onde persistir
- **Como**: `/architect` → criar ADR de Audit Trail
- **Beneficio**: Rastreabilidade para compliance, investigacao de incidentes, requisito regulatorio

### Rate Limiting e Protecao de Endpoints Publicos
[Se detectado: endpoints publicos (login, register, forgot-password) sem rate limiting]
- **Situacao**: Endpoints de autenticacao sem protecao contra brute force
- **Sugestao**: Criar ADR de Rate Limiting e DDoS Protection
- **Como**: `/architect` → criar ADR customizada para a stack do projeto
- **Beneficio**: Protecao contra ataques de força bruta e abuso de API

### Protecao de Dados Pessoais (LGPD)
[Se detectado: dados pessoais (CPF, CNPJ, email, telefone, endereco) persistidos ou trafegados sem controles de privacidade]
- **Situacao**: Dados pessoais tratados sem base legal explicita, anonimizacao, minimizacao ou politica de retencao
- **Sugestao**: Adotar/estender o ADR de Seguranca e LGPD (`docs/adr/0008-seguranca-e-lgpd.md`)
- **Como**: `/architect` → revisar ADR 0008 e mapear onde dados pessoais entram/saem
- **Beneficio**: Conformidade regulatoria, reducao de superficie de vazamento, direito do titular atendivel

### Criptografia de Dados em Repouso
[Se detectado: dados sensiveis (documentos, dados financeiros, PII) em texto puro no banco]
- **Situacao**: Dados sensiveis armazenados sem criptografia em repouso
- **Sugestao**: Criar/estender ADR definindo o que criptografar, gestao de chaves e algoritmo
- **Como**: `/architect` → criar ADR de Criptografia e Gestao de Chaves
- **Beneficio**: Mitiga impacto de vazamento de banco; requisito de compliance
```

Emitir apenas as secoes com evidencia no codigo.
