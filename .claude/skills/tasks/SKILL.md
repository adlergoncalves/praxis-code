---
description: "Sub-fase 5b: Quebra o plan em fatias verticais (U0..Un = User Stories) com contrato (valor, PRONTO file-level, verificacao manual, refs) + DoD + mapa BDD. Loop Engineering (ADR-0007)."
user-invocable: true
depends:
  - .claude/agents/delivery/task-breaker.md
---

# /tasks

Quebra um plan em **fatias verticais** (U0…Un) executaveis em loop. Sub-fase 5b do
`/implement`. Segue o `docs/templates/tasks-template.md` (Loop Engineering, ADR-0007).

## Input

`/tasks {feature} [--team front|back|db|full]` — nome da feature (deve ter plan.md)

## Pre-requisitos

- Plan existir em `docs/specs/{feature}/plan.md` (incl. Fatos Confirmados + Modulo de Referencia)
- Spec existir em `docs/specs/{feature}/spec.md`

## Execucao

Delegar ao agent `@task-breaker` que:

1. Le plan (Fatos Confirmados, Modulo de Referencia) + spec (User Stories, Decisoes, Armadilhas)
2. Gera **fatias verticais U0…Un** — **1 fatia = 1 User Story**; fundacao (U0) como excecao
   declarada. **A unidade de iteracao do loop e a fatia**, nao a task horizontal.
3. Para cada fatia, preenche o **contrato**: valor entregavel, camadas, depende de, inicio,
   **criterio de PRONTO file-level**, **verificacao manual (1-3 passos)**, fora de escopo,
   ADRs + Ref(`arquivo:linha`), **sub-tasks** (`[T00N]` DENTRO da fatia) e **mapa BDD** `[B]`/`[F]`/`[E2E]`.
4. Escreve o **DoD uniforme**, a tabela de **Gates**, o **grafo de dependencias** e o
   **Estado durável (Loop Log)** — fonte unica (T2: sem STATUS.md concorrente).
5. Roda o **checker da decomposicao** (vira o portao pre-execucao do `/execute`).
6. Se `--team` especificado, filtra por escopo e lista `## Tasks Delegadas` separadamente.

## Formato

A unidade e a **fatia** (contrato completo); as tasks horizontais sao **sub-tasks dentro dela**:

```
### U«n» — {título} (= US X.Y)
- Valor entregável / Camadas / Depende de / Início / Critério de PRONTO (file-level)
- Verificação MANUAL (1-3 passos) / Fora de escopo / ADRs + Ref(arquivo:linha)
- Sub-tasks: [ ] [T00N] [P] {desc} — {arquivo}
- BDD: [B]/[F]/[E2E] → testes nomeados
```

Itens fora do escopo do team vao em `## Tasks Delegadas` (ex: `[D001] [team-back] … — necessario para U«n»`).

## Output

`docs/specs/{feature}/tasks.md` (conforme `docs/templates/tasks-template.md`)

## Validacao pelo Usuario (OBRIGATORIO)

Apos gerar, **apresentar ao usuario para validacao**:

1. Exibir as **fatias U0…Un** com seu valor entregavel + grafo de dependencias
2. Mostrar o resultado do **checker da decomposicao** (toda fatia vertical? verificavel na mao? criterio→teste?)
3. Mostrar o mapeamento **fatia ↔ user story**
4. Perguntar: **"As fatias estao corretas? Posso iniciar o loop de execucao? (s/n/ajustar)"**
5. Se `s` → recomendar `/clear` e depois `/execute`
6. Se `n` ou `ajustar` → usuario indica o que mudar, ajustar e re-apresentar
7. **NAO avancar para /execute sem aprovacao explicita do usuario**

## Gestao de Contexto

Ao concluir as tasks **e obter aprovacao**, recomende `/clear` antes de avancar para `/execute`. O tasks.md esta salvo.

## Handoffs

- → `/clear` (limpar contexto apos aprovacao)
- → `/execute` (executar as tasks — so apos aprovacao)
- → `/analyze` (verificar consistencia spec ↔ plan ↔ tasks)
- → `/checklist` (gerar quality gates antes de executar)
