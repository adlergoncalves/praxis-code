# Mapa de Paralelismo — Agents e Skills

**Atualizado em**: 2026-04-09

## Legenda

- **PARALELO**: Agents independentes, sem dependencia de resultado entre eles
- **SINCRONO**: Output de um e input do proximo — ordem obrigatoria
- **SEMI-PARALELO**: Podem rodar em paralelo mas o resultado final precisa ser consolidado

---

## Pipeline Principal

```
/discovery → /architect → /define → /implement → /validate → /revalidate
   SINC        SINC        SINC       SINC         SINC         SINC
```

**Motivo**: Cada fase depende dos artefatos da anterior.
- discovery.md → lido pelo architect
- ADRs → lidas pelo define e implement
- specs → lidas pelo implement
- codigo → lido pelo validate

---

## Dentro de /implement

```
/plan → /tasks → /execute
 SINC     SINC     SINC
```

**Motivo**: plan.md → lido pelo task-breaker → tasks.md lido pelo `/execute`

### Dentro de /execute (entre fatias)

```
Fatias (U0…Un)       → em sequencia, na ordem do grafo de dependencias do tasks.md
Grupos G«n»          → multi-agente SO se o Preflight liberar: um subagente por fatia do
                       grupo, pontos de colisao declarados; integracao e verificacao
                       independente na sessao principal
Sub-tasks [P]        → paralelizaveis dentro da fatia
```

### Implementacao cross-team

```
/implement --team front  ←→  /implement --team back
        PARALELO (se nao houver dependencia cross-team)
        SINCRONO (se front depende de endpoint do back)
```

**Regra**: fatia que depende de trabalho de outro team ainda nao feito fica `BLOCKED` (motivo + o que destrava) e o loop segue com as liberadas.

---

## Dentro de /validate

### Agents de validacao — PODEM ser paralelos

```
@solid-review      ─┐
@adr-validator     ─┤── PARALELO (leem codigo e ADRs independentemente)
@check-structure   ─┤
@check-typescript  ─┤
@check-react       ─┤
@check-forms       ─┤
@check-i18n        ─┤
@check-routing     ─┤
@check-responsiveness─┤
@check-design      ─┤
@check-ux          ─┤
@check-architecture─┤
@check-ddd         ─┤
@check-naming      ─┤
@check-tests       ─┤
@check-errors      ─┤
@check-security    ─┘
```

**Todos sao read-only e independentes.** Nenhum agent de validacao depende do resultado de outro. A unica dependencia e: todos leem as ADRs (leitura, nao escrita).

### Estrategia de paralelismo para validacao

| Profile | Estrategia | Motivo |
|---------|-----------|--------|
| `minimal` | Sequencial (1 agent) | So @adr-validator, sem ganho de paralelismo |
| `standard` | **Paralelo em 2 blocos** | Bloco 1: core (solid + adr). Bloco 2: stack (front OU back) |
| `full` | **Paralelo maximo** | Todos os agents aplicaveis em paralelo |

---

## Dentro de /adopt

```
Etapa 1: @codebase-mapper     → SINC (output usado pela etapa 2)
Etapa 2: @discovery            → SINC (output usado pela etapa 3)
Etapa 3: @adr-creator          → SINC (output usado pela etapa 4)
Etapa 4: Constitution          → SINC (consolidacao das ADRs)
Etapa 5: @adr-validator        → SINC (precisa das ADRs da etapa 3)
```

**Tudo sincrono** — cada etapa depende da anterior.

---

## Dentro de /define

```
/prd-create → /prd-validate → [/detail] → /prd-decompose → /spec-from-prd
    SINC          SINC         SINC          SINC              SINC
```

`/detail` e opcional — entra apenas para modulos grandes/ambiguos (criterio >= 2 sinais, ADR-006). Quando presente, o `/prd-decompose` usa o workspace `docs/prds/{modulo}/` como fonte primaria em vez do PRD monolitico.

**Mas**: Se o PRD tem multiplas features (ou o workspace tem multiplas partes), as specs podem ser geradas em **paralelo**:
```
/spec-from-prd FEATURE:1.1  ─┐
/spec-from-prd FEATURE:1.2  ─┤── PARALELO (specs independentes)
/spec-from-prd FEATURE:1.3  ─┘
```

### Dentro de /detail

```
init → continue (n sessoes) → freeze
SINC       SINC                SINC
```

**Motivo**: cada sessao depende dos arquivos criados/editados na anterior. Dentro de uma sessao, preencher **uma parte por vez** — nao saltar entre partes (ADR-006).

---

## Quality gates — Podem ser paralelos

```
/clarify {spec}    ─┐
/analyze {spec}    ─┤── SEMI-PARALELO
/checklist {spec}  ─┘
```

Podem rodar em paralelo porque leem a spec sem modificar. Mas `/clarify` pode EDITAR a spec (integrar respostas), entao se rodar junto com `/analyze`, pode haver conflito.

**Recomendacao**: Rodar `/clarify` primeiro (pode editar), depois `/analyze` + `/checklist` em paralelo.

---

## Impacto em Tokens

### Sequencial (atual) — alto consumo
```
Agent A roda → resultado fica no contexto → Agent B roda → resultado acumula → ...
Contexto cresce linearmente: O(n) onde n = numero de agents
```

### Paralelo (otimizado) — baixo consumo no contexto principal
```
Agent A ─┐
Agent B ─┤── rodam em contextos isolados
Agent C ─┘
         └── resultados voltam compactos → consolidacao
Contexto principal: O(1) + resultados resumidos
```

### Economia estimada na validacao full
- **Sequencial (10 agents)**: ~10x tamanho de relatorio individual no contexto
- **Paralelo (10 agents)**: contexto principal so recebe os resumos consolidados
- **Economia**: ~60-70% do consumo de contexto na fase de validacao
