---
name: implement
description: "Fase 5: Implementacao — Plan + Tasks + Execute. Planeja tecnicamente, quebra em tasks e executa respeitando ADRs."
user-invocable: true
depends:
  - .claude/skills/plan/SKILL.md
  - .claude/skills/tasks/SKILL.md
  - .claude/skills/execute/SKILL.md
---

# /implement

Orquestrador de implementacao. Executa 3 sub-fases em sequencia, recomendando `/clear` entre elas.

Cada sub-fase tambem pode ser invocada separadamente: `/plan`, `/tasks`, `/execute`.

## Input

`/implement {spec} [--team front|back|db|full]` — caminho da spec ou nome da feature

- `--team front` — Planeja e executa apenas frontend (componentes, pages, hooks)
- `--team back` — Planeja e executa apenas backend (entities, use cases, endpoints)
- `--team db` — Planeja e executa apenas banco (migrations, schema, seeds)
- `--team full` — Planeja e executa tudo (default)

## Pre-requisitos

### Modo Full
- Spec existir em `docs/specs/{NNN}-{nome}/spec.md`
- ADRs existirem em `docs/adr/`
- Constitution existir em `docs/project/constitution.md`

### Modo Lite
- Pre-requisitos relaxados: nao exige spec formal nem constitution
- Aceita descricao livre como input: `/implement "pagina de login com email e senha"`
- Se ADRs existirem, respeita. Se nao, implementa com boas praticas gerais

## Sub-fases

### 5a — Planejamento Tecnico (`/plan`)
Delegado ao agent `@planner` via skill `/plan`. Gera `plan.md` filtrado pelo team scope.

### 5b — Quebra em Fatias (`/tasks`)
Delegado ao agent `@task-breaker` via skill `/tasks`. Gera `tasks.md` com **fatias
verticais** (U0…Un = User Stories), cada uma com contrato (valor, PRONTO file-level,
verificacao manual, refs) + DoD + mapa BDD. Inclui tasks delegadas se team scope.

### 5c — Execucao em Loop (`/execute`)
Delegado ao agent `@executor` via skill `/execute`. Roda **em loop por fatia vertical**
(Loop Engineering, ADR-0007): uma fatia por iteracao → implementa → gates → conserta ate
verde → DONE no Loop Log → PARA (checkpoint). `--auto [N]` encadeia com guardrails.
Detecta dependencias cross-team. Passa pelo **Portao Pre-execucao** antes da 1ª fatia.

## Team Scope — Como funciona

Quando `--team` e especificado, todas as sub-fases respeitam o escopo:

1. **Plan** filtra estrategia de implementacao para o team
2. **Tasks** gera tasks apenas do team + lista tasks delegadas para outros teams
3. **Execute** implementa apenas tasks do team. Se detectar dependencia de outro team:
   - Pausa e pergunta: "Esta task precisa de {X} do team-{Y}. Criar stub/mock ou delegar?"

**Delegacao cross-team**: Tasks fora do escopo sao listadas em `## Tasks Delegadas` no tasks.md. O usuario pode rodar `/implement {spec} --team {outro}` separadamente para executá-las.

## Fluxo recomendado

```
/implement {spec} [--team {scope}]
  └─ /plan {spec} --team {scope}          → gera plan.md
     └─ USUARIO VALIDA                    → aprova ou ajusta
        └─ /clear
           └─ /tasks {feature} --team {scope}  → gera tasks.md
              └─ USUARIO VALIDA                → aprova ou ajusta
                 └─ /clear
                    └─ /execute {feature} --team {scope} → implementa
```

**REGRA CRITICA (modo full)**: Cada sub-fase requer **aprovacao explicita do usuario** antes de avancar. O `/implement` NAO avanca automaticamente.

**REGRA MODO LITE**: Se manifesto indica `Modo: lite`:
- **Input alternativo**: aceitar descricao livre em vez de exigir spec
- **Fluxo simplificado**: pular plan/tasks separados, delegar direto ao `@executor` com a descricao como contexto
- **Sem aprovacao intermediaria**: implementar direto, apresentar resultado ao final
- O `@executor` ainda respeita ADRs se existirem e registra learnings normalmente

## Gestao de Contexto

**Entre sub-fases**: Recomende `/clear` entre planejamento (5a), quebra em tasks (5b) e execucao (5c). Os outputs estao salvos em arquivos (plan.md, tasks.md) e serao lidos na proxima sub-fase.

**Apos implementacao**: Recomende `/clear` antes de rodar `/validate`.

## Atualizacao do Manifesto

Ao concluir cada sub-fase, atualizar `docs/project/manifest.md`:
- Plan → Implement → `em andamento`, spec registrada
- Execute completo → Implement → `completo`
- PRDs e Specs → atualizar lista de specs

## Hook Proativo — /spec-review

Ao receber o input da spec (modo full), antes de delegar ao `/plan`, verificar:

**Verificacao rapida da spec** — checar se tem os campos minimos:
- Pelo menos uma User Story com criterios de aceite no formato Given/When/Then
- Pelo menos um Functional Requirement testavel
- Edge Cases documentados

**Se qualquer campo obrigatorio estiver faltando:**
→ Avisar: "Esta spec tem gaps que vao gerar retrabalho durante a implementacao. Recomendo rodar `/spec-review {feature}` antes de continuar. Quer prosseguir mesmo assim?"

**Modo Lite**: Nao roda verificacao — aceita descricao livre e implementa diretamente.

**Regra**: Sugerir uma vez. Se o usuario confirmar que quer prosseguir, implementar normalmente sem insistir.

## Hook Proativo — /strategy

Ao receber o input da spec (ou descricao livre no modo lite), verificar:

**Sinal `FEATURE_SEM_VALOR`**: A spec ou descricao nao menciona:
- Por que esta feature importa para o usuario
- Qual metrica muda com ela
- Qual o criterio de sucesso

→ Perguntar antes de planejar: "Esta feature nao tem criterio de sucesso definido. Como saberemos se valeu a pena construir? Quer definir isso rapido com `/strategy` ou prefere continuar assim mesmo?"

**Sinal `PIVÔ_DE_ESCOPO`**: O `/implement` e chamado com algo que contradiz o que esta no discovery ou PRD (modulo diferente, abordagem diferente, feature nao prevista)
→ Alertar: "Esta implementacao parece divergir do que foi planejado. Quer revisar o impacto com `/strategy` antes de codar?"

**Regra**: Sugerir no maximo UMA vez. Nao bloquear — apenas alertar. Se o usuario prosseguir, implementar normalmente.

## Handoffs

- → `/clear` (limpar contexto entre sub-fases e apos conclusao)
- → `/spec-review` (quando spec tem gaps antes de planejar)
- → `/strategy` (quando feature sem criterio de sucesso ou pivo de escopo detectado)
- → `/clarify` (se ambiguidades detectadas durante planejamento)
- → `/analyze` (para verificar consistencia spec ↔ plan ↔ tasks)
- → `/checklist` (para gerar quality gates antes de executar)
- → `/validate` (apos implementacao completa)
