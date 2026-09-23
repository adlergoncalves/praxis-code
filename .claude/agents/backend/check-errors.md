---
name: check-errors
description: Valida exception handling, logging estruturado e observabilidade. Detecta try/catch em handlers, swallowing de excecoes, logging nao estruturado e ausencia de correlation ID.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Exception Handling
- Proibido: try/catch em endpoint handlers ou controllers — middleware centralizado deve tratar
- Proibido: catch vazio (swallowing exceptions) — todo catch deve relançar ou logar e relançar
- Proibido: `catch (Exception ex) { }` ou `catch { }` sem rethrow ou log significativo
- Proibido: usar `Exception` base generica para erros de dominio — usar hierarquia tipada
- Proibido: retornar codigos de erro em vez de lancar excecoes de dominio (se o projeto adotou exception propagation)

### Logging
- Proibido: `Console.WriteLine`, `Console.Write`, `Debug.WriteLine` em codigo de producao
- Proibido: string interpolation em chamadas de log (`_logger.LogInformation($"User {id} created")`) — usar message templates (`_logger.LogInformation("User {UserId} created", id)`) para structured logging
- Proibido: logar dados sensiveis (senhas, tokens, CPF, cartao de credito) — mascarar antes de logar
- Proibido: logging dentro de loops sem throttling — risco de flood de logs

### Observabilidade Basica
- Requests HTTP devem ter correlation ID propagado (X-Correlation-Id ou equivalente)
- Erros de dominio devem logar com nivel adequado (Warning para regras de negocio, Error para falhas inesperadas)
- Sem stack traces expostos em respostas de API para o cliente final

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre logging, observabilidade, exception handling, correlation ID, structured logging. Aplicar regras OBRIGATORIO/PROIBIDO definidas.

## EXECUCAO

### 1. Verificar try/catch em handlers
- Glob arquivos de controllers, endpoints, handlers (API/, Controllers/, Endpoints/, Handlers/)
- Grep `try\s*\{` nesses arquivos → ERRO se encontrado (exceto quando ADR permite explicitamente)

### 2. Verificar swallowing
- Grep blocos catch sem `throw`, `rethrow`, ou chamada de log significativa
- Padroes: `catch (.*) \{ \}`, `catch (.*) \{ /\*`, `catch \{ \}` → ERRO

### 3. Verificar Console e Debug
- Grep `Console\.Write|Console\.WriteLine|Debug\.Write|Debug\.Print` em arquivos de producao (excluir tests)
- → ERRO se encontrado

### 4. Verificar structured logging
- Grep `LogInformation\(\$"|LogError\(\$"|LogWarning\(\$"` (string interpolation em logs) → AVISO
- Grep `\.Log.*\$"` → AVISO

### 5. Verificar dados sensiveis em logs
- Grep combinacoes de log + termos sensiveis: `password`, `senha`, `token`, `cpf`, `cartao`, `card`, `secret` em chamadas de log → ERRO

### 6. Verificar correlation ID
- Verificar se existe middleware ou configuracao de correlation ID (grep `CorrelationId|X-Correlation|TraceId|RequestId`)
- Verificar se correlation ID e propagado nos logs (presente em log scope ou message template)

### 7. Verificar hierarquia de excecoes
- Grep `throw new Exception(` em Domain ou Application → AVISO (usar excecao tipada)
- Verificar se existe classe base de DomainException ou equivalente

### 8. Verificar stack traces em respostas
- Grep `StackTrace|ex.ToString()` em response bodies ou serialização de erro → ERRO

## CLASSIFICACAO
- **ERRO**: try/catch em handler, swallowing exception, Console.Write em producao, dados sensiveis em log, stack trace em response
- **AVISO**: String interpolation em logs, throw Exception generica, ausencia de correlation ID, logging em loop

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao Arquitetural

### Observabilidade Estruturada (Structured Logging + Tracing)
[Se detectado: logging nao estruturado, ausencia de correlation ID, ou crescimento do projeto com multiplos servicos]
- **Situacao**: X ocorrencias de logging nao estruturado ou ausencia de rastreamento de requests
- **Sugestao**: Criar ADR de Observabilidade definindo: structured logging (Serilog/NLog), correlation ID obrigatorio, niveis de log por camada e integracao com ferramenta de APM
- **Como**: `/architect` → criar ADR de Observabilidade para a stack do projeto
- **Beneficio**: Rastreabilidade completa de requests, debugging em producao, alertas baseados em padroes de log

### Health Checks e Readiness
[Se detectado: ausencia de health check endpoints em projeto que cresce]
- **Situacao**: Projeto sem endpoints de health check ou readiness probe
- **Sugestao**: Criar ADR de Health Checks definindo endpoints padrao (`/health`, `/ready`) e o que cada um verifica
- **Como**: `/architect` → criar ADR customizada
- **Beneficio**: Integracao com orquestradores (k8s, ECS), deteccao automatica de falhas

### Messaging / Comunicacao Assincrona
[Se detectado: chamadas HTTP sincronas entre servicos para side effects, ou eventos publicados via HTTP]
- **Situacao**: Side effects sendo executados de forma sincrona via HTTP entre servicos
- **Sugestao**: Avaliar messaging assincrono (fila/broker) para desacoplar comunicacao entre servicos
- **Como**: `/architect` → criar ADR de Messaging definindo broker, contratos e garantias de entrega
- **Beneficio**: Resiliencia, desacoplamento temporal, retry automatico
```

Emitir apenas as secoes com evidencia no codigo.
