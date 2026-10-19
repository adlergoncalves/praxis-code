---
description: "Sub-fase 5a: Planejamento tecnico. Le spec + ADRs e gera plan.md com Technical Context, data model e contracts."
user-invocable: true
depends:
  - .claude/agents/delivery/planner.md
---

# /plan

Planejamento tecnico de uma feature. Sub-fase 5a do `/implement`.

## Input

`/plan {spec} [--team front|back|db|full]` — caminho da spec ou nome da feature

## Pre-requisitos

- Spec existir em `docs/specs/{NNN}-{nome}/spec.md`
- ADRs existirem em `docs/adr/`

## Execucao

0. **(main loop, opcional) Pre-mapeamento do codebase**: para codebase grande/legado, o
   Claude Code (que tem Task/Agent) **dispara `@codebase-mapper`** ANTES de delegar e anexa
   o mapa como contexto. O `@planner` **nao** invoca subagents (nao tem o tool Agent) — ele
   confirma a maioria dos fatos sozinho com Grep/Glob.
1. Delegar ao agent `@planner` que executa:
   - **Phase 0 — Research + Grounding (Loop Engineering, ADR-0007)**:
     - Resolver itens `[REQUER RESPOSTA DO PM]` / `[REQUER CONFIRMACAO]`
     - **Fatos Confirmados no codebase**: confirmar via **Grep/Glob** (ou usando o mapa do passo 0), com `arquivo:linha` real, todo fato que o `/execute` usaria (faixa de error code livre, enums, roles/scopes, códigos HTTP, base config de entidade, projeto de testes, contratos base). Regra dura: **nada de "confirmar depois"** — valor pinado ou vira `[REQUER CONFIRMACAO]`. Fato que exige **execucao** (nao so leitura de fonte) tambem vira `[REQUER CONFIRMACAO]`.
     - **Módulo de Referência**: escolher o exemplar concreto mais próximo da **forma** da demanda (CRUD? motor de aprovação? wizard?) e pinar os paths. Se não existe, declarar explicitamente.
   - **Phase 1 — Technical Context**: Language, Dependencies, Storage, Testing
   - **Phase 2 — Data Model**: Extrair entidades → `docs/specs/{feature}/data-model.md`
   - **Phase 2.5 — Seguranca de Banco** (OBRIGATORIO se stack BaaS): policies por tabela (SELECT/INSERT/UPDATE/DELETE com WITH CHECK), CORS em funcoes serverless, claims JWT em `app_metadata` — secao propria do plan, nunca sub-item de Data Model
   - **Phase 3 — Contracts**: Definir contratos → `docs/specs/{feature}/contracts/`
   - **Phase 3.5 — Infra de Verificação** (OBRIGATORIO se a demanda tem e2e): personas/auth (storageState), fixtures determinísticas, seeds idempotentes, scopes OIDC, projeto de teste, sequenciamento — como pré-condição, não surpresa de fatia.
   - **Phase 4 — Implementation Strategy**: Ordem, dependencias, riscos
   - **Phase 5 — Team Scope**: Filtrar por `--team` se especificado

## Output

`docs/specs/{feature}/plan.md`

## Validacao pelo Usuario (OBRIGATORIO)

Apos gerar o plan, **apresentar ao usuario para validacao**:

1. Exibir resumo do plan (Technical Context, entidades, contratos)
2. Perguntar: **"O plan esta correto? Posso avancar para quebrar em tasks? (s/n/ajustar)"**
3. Se `s` → recomendar `/clear` e depois `/tasks`
4. Se `n` ou `ajustar` → usuario indica o que mudar, ajustar plan e re-apresentar
5. **NAO avancar para /tasks sem aprovacao explicita do usuario**

## Gestao de Contexto

Ao concluir o plan **e obter aprovacao**, recomende `/clear` antes de avancar para `/tasks`. O plan esta salvo em arquivo.

## Handoffs

- → `/clear` (limpar contexto apos aprovacao)
- → `/tasks` (quebrar plan em tasks — so apos aprovacao)
- → `/clarify` (se ambiguidades detectadas)
