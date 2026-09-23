---
description: "Fase 6: Validacao — Orquestrador principal. Despacha agents core + frontend + backend conforme stack do projeto."
user-invocable: true
depends:
  - .claude/agents/quality/solid-review.md
  - .claude/agents/architecture/adr-validator.md
  - .claude/skills/frontend-validate/SKILL.md
  - .claude/skills/backend-validate/SKILL.md
---

# /validate

Orquestra validacao completa do codigo contra ADRs e boas praticas.

## Input

`/validate [escopo] [--profile minimal|standard|full] [--team front|back|full]`

- `geral` — Todo o projeto
- `{modulo}` ou `{feature}` — Modulo/feature especifico
- `alteracoes` — Apenas arquivos modificados (git diff)
- Vazio → Pergunta o escopo

### Team Scope

- `--team front` — Executa apenas agents de frontend + core (SOLID, ADR)
- `--team back` — Executa apenas agents de backend + core (SOLID, ADR)
- `--team full` — Executa todos os agents aplicaveis (default)

## Profiles

`/validate [escopo] [--profile minimal|standard|full]`

| Profile | O que executa | Quando usar |
|---------|--------------|-------------|
| `minimal` | `@adr-validator` apenas | Checagem rapida, legados com muito ruido |
| `standard` (default) | `@solid-review` + `@adr-validator` + stack detectada | Uso normal |
| `full` | Todos os agents aplicaveis | Antes de release ou merge importante |

## Execucao

### 1. Selecao de Escopo

Determinar quais arquivos validar com base no input.

### 2. Selecao de Profile

- Se `--profile` especificado: usar o profile
- Se manifesto indica `Modo: lite`: forcar profile `minimal` (so `@adr-validator`), nao sugerir frontend-validate ou backend-validate
- Se nao: usar `standard`

### 3. Despacho de Agents

**Profile minimal**:
- `@adr-validator` — Regras dinamicas das ADRs

**Profile standard** (default):
- `@solid-review` — Principios SOLID
- `@adr-validator` — Regras dinamicas das ADRs
- Se `--team front` ou (`--team full` e projeto tem frontend): `/frontend-validate`
- Se `--team back` ou (`--team full` e projeto tem backend): `/backend-validate`

**Profile full**:
- Tudo do standard +
- Agents individuais de frontend/backend executados com relatorio detalhado
- Respeita `--team` scope (nao executa agents fora do team)

### 4. Consolidacao

Consolidar todos os relatorios em um unico:

```markdown
# Relatorio de Validacao — {escopo}

**Data**: {data}
**Escopo**: {descricao}

## Resumo Geral

| Agent | Erros | Avisos | OK |
|-------|-------|--------|----|
| SOLID Review | X | Y | Z |
| ADR Validator | X | Y | Z |
| Frontend | X | Y | Z |
| Backend | X | Y | Z |
| **TOTAL** | **X** | **Y** | **Z** |

## Detalhamento

{Relatorios individuais de cada agent}

## Glossario

- **ERRO**: Violacao que deve ser corrigida antes do merge
- **AVISO**: Recomendacao que deve ser revisada
- **PROIBIDO**: Pattern que NAO deve existir (definido em ADR)
- **OBRIGATORIO**: Pattern que DEVE existir (definido em ADR)

## Completion Promise (falsificavel — Loop Engineering, ADR-0007)

> {Emitir SO quando inequivocamente verdadeira — mesma frase falsificavel do `/execute` (ADR-0007):}
> "A conformidade foi verificada por «{agents que rodaram}» com {N} erros / {M} avisos —
> ou, para «{agents que NAO rodaram}», vale «auditoria equivalente», DECLARADO COMO TAL
> (NAO conformidade plena por agente que nao executou)."

```

> **Honestidade epistemica**: nunca afirmar conformidade plena por um agent que nao
> rodou. Se um verificador (ex.: `/frontend-validate`) nao executou, declarar "auditoria
> equivalente" para o escopo dele — esta e a regra dura do verificador (ADR-0007).

### 5. Salvar

Salvar em `docs/validation-reports/{data}-{escopo}.md`.

### 6. Promocao de aprendizados (OBRIGATORIO)

Os erros encontrados nesta validacao representam padroes que vao se repetir nos proximos modulos se nao forem capturados como regra. Um relatorio que nao alimenta os learnings perde metade do seu valor.

**Passo a passo**:

1. **Filtrar findings recorrentes**: revisar todos os erros/avisos e identificar quais sao **violacoes de padrao** (nao bugs de logica especifica). Exemplos:
   - "Componente `Header.tsx` usa `useState` para guardar dados do servidor" → recorrente (todo componente tende a esse erro)
   - "Funcao `calcularImposto` tem off-by-one em fevereiro" → especifico (bug isolado, nao padrao)
   - "Migration `0042` falta `WITH CHECK` em policy UPDATE" → recorrente (vai aparecer em toda migration nova)
   - "Endpoint `/api/orders` sem rate limit" → recorrente se outros endpoints tambem nao tem

2. **Apresentar ao usuario** a lista de candidatos:

```
Encontrei 7 erros recorrentes nesta validacao que podem virar regra do projeto:

[1] [ADR-007] Uso de useState para dados do servidor — 3 ocorrencias
[2] [check-design] text-black puro em vez de variavel de tema — 2 ocorrencias
[3] [check-security] Endpoint sem rate limit — 4 ocorrencias
[4] [check-naming] Service com sufixo "Helper" em vez de "Service" — 1 ocorrencia
...

Quais devem virar regra do projeto? (numeros separados por virgula, "todas" ou "nenhuma")
```

3. **Registrar nos learnings corretos** conforme dominio do finding:

| Tipo de finding | Arquivo de learning |
|---|---|
| Frontend (UI, componentes, DS) | `docs/project/learnings/frontend-learnings.md` |
| Backend (API, dominio, infra) | `docs/project/learnings/backend-learnings.md` |
| Arquitetura (ADR, patterns recorrentes) | `docs/project/learnings/architecture-learnings.md` |
| Processo (kit, pipeline, fluxo) | `docs/project/learnings/process-learnings.md` |
| Negocio (regras de produto) | `docs/project/learnings/business-learnings.md` |

Formato do registro (Tipo 1 — Descoberta durante execucao):

```markdown
### {data} — @validate durante {escopo}
- **Descoberta**: {padrao recorrente identificado}
- **Decisao**: regra adotada pelo usuario — {regra clara}
- **Impacto**: aplica-se a {todo o frontend / todo o backend / todas as migrations / ...}
- **Acao sugerida**: {nenhuma / criar ADR via /architect / atualizar ADR-X}
- **Status**: aplicado
```

4. **Atualizar Manifesto**: adicionar entrada em "Regras Aprendidas" do `docs/project/manifest.md` com referencia ao learning registrado.

5. Se algum candidato e claramente **uma ADR nao escrita ainda** (ex: pattern de seguranca recorrente sem ADR cobrindo), sugerir ao usuario:
   > "A regra '{descricao}' parece arquitetural — talvez merece virar ADR formal via `/architect`. Quer abrir essa sessao agora ou registrar so como learning?"

**Regra**: o passo 5 (promocao) e obrigatorio mesmo que o usuario diga "nenhuma" — registrar a interacao em `process-learnings.md` ("validate rodada em {data}: nenhum padrao recorrente para promover").

### 7. Sugestao automatica de /revalidate

Apos salvar o relatorio e promover learnings, **sugerir explicitamente `/revalidate`** como proximo passo natural:

```
Relatorio salvo em docs/validation-reports/{data}-{escopo}.md
{N} erros e {M} avisos identificados.

Proximo passo recomendado:
1. Corrigir os {N} erros (ver lista acima)
2. Rodar `/revalidate` para re-checar APENAS os itens pendentes (mais rapido que `/validate` completo)

Quer abrir o relatorio para ver a lista completa de correcoes?
```

A sugestao e **explicita**, nao escondida em handoffs. Sem `/revalidate`, o relatorio vira snapshot inutil — o usuario perde o controle do que foi corrigido vs persiste vs regrediu.

## Gestao de Contexto

Ao concluir a validacao, **recomende ao usuario executar `/clear`** antes de corrigir os problemas. O relatorio esta salvo em `docs/validation-reports/` e os learnings em `docs/project/learnings/`. Limpar o contexto libera espaco para as correcoes.

## Atualizacao do Manifesto

Ao concluir, atualizar `docs/project/manifest.md`:
- Validate → `completo`, registrar relatorio (path, data, erros, avisos, pendentes)

## Handoffs

- → `/clear` (limpar contexto apos gerar relatorio)
- → `/revalidate` (para re-checar apos correcoes)
- → `/implement` (se tudo OK)
