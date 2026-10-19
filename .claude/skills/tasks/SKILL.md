---
description: "Sub-fase 5b: Quebra o plan em fatias verticais (U0..Un = User Stories) com contrato + DoD + mapa BDD e fecha o pacote no portao final: consistencia, paradas provaveis eliminadas, metricas de prontidao, Preflight e guia de validacao para aprovacao. Depois dele o /execute roda autonomo. Loop Engineering (ADR-0007)."
user-invocable: true
depends:
  - .claude/agents/delivery/task-breaker.md
  - .claude/agents/quality/analyzer.md
  - docs/templates/guide-template.md
  - docs/templates/doctor-template.json
  - docs/templates/tasks-template.md
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

## Portao final — aprovacao do pacote (OBRIGATORIO, roda nesta sessao)

O `/tasks` fecha o pacote (spec + plan + tasks). Este portao e onde a discussao acontece —
**depois dele o `/execute` roda autonomo** e so para no realmente bloqueante. Por isso, tudo
o que o loop precisaria perguntar e perguntado **aqui**. Roda na sessao principal (publica o
guia e conversa com o usuario), apos o `@task-breaker` devolver o `tasks.md`.

1. **Consistencia** — despachar o `@analyzer` (o mesmo do `/analyze`) sobre spec ↔ plan ↔
   tasks. Achado de duplicacao, gap ou contradicao → corrigir no pacote antes de seguir.
2. **Paradas provaveis** — percorrer as fatias e preencher `tasks.md › Prontidao › Paradas
   provaveis`: decisao diferida sem default, credencial/servico externo, infra que nao existe,
   fonte de design ausente, dependencia de outro team, ancora de design (Charter ou memoria de design)/Shape faltando em feature de
   UI. **O que e do agente entra no pacote sem perguntar** (pinar fato, declarar default,
   sequenciar infra); **o que depende do usuario vira pergunta** neste portao. As pre-condicoes de
   ambiente que sobram (servico de pe, porta, seed, migration) viram **`docs/specs/{feature}/doctor.json`**
   (molde `docs/templates/doctor-template.json`, com `fatias` quando so algumas dependem dela) — e o
   Gate 0 do `/execute` que as confere antes de cada corrida. Rodar `node .claude/scripts/loop-doctor.mjs --feature {feature}`
   aqui mesmo: Fato Confirmado velho ja aparece antes da aprovacao.
3. **Metricas** — calcular a **cobertura de entendimento** e o **indice de execucao
   autonoma** (rubrica do `tasks-template`), com a decomposicao preenchida. O indice e a
   previsao **depois** de eliminadas as paradas — nunca ajustar o numero sem remover a causa.
4. **Preflight** — perguntar as definicoes de execucao, todas juntas, com opcoes + implicacao:
   branch (nome e base), politica de commit (default `commit autonomo`), push, modo de execucao
   (sequencial ou multi-agente nos grupos com pontos de colisao declarados) e **scan de seguranca**
   no fechamento (esforco; a resposta aceita o custo do scan, para o loop nao parar depois). Gravar no `tasks.md`.
5. **Guia de validacao** — gerar a partir de spec/plan/tasks pela estrutura de
   `docs/templates/guide-template.md` (derivado, nunca fonte). Com publicacao de paginas
   disponivel na sessao (Artifacts do Claude): publicar como pagina HTML com os diagramas
   Mermaid e gravar o link + data em `docs/specs/{feature}/guia-de-validacao.md`; sem ela,
   o guia e o proprio `guia-de-validacao.md`. Republicar = mesmo arquivo, mesmo endereco.
6. **Apresentar e aguardar o de-acordo** — link (ou caminho) do guia + resumo:

```
## Pacote — {feature}
Fatias: {n} (U0…U{n})   Grupos paralelizaveis: {…}
Consistencia (@analyzer): {ok | n achados corrigidos}
Cobertura de entendimento: {NN}% ({o que falta, ou "tudo fechado"})
Indice de execucao autonoma: {NN}% (top riscos: {1–3})
Paradas eliminadas: {n} — {as principais em poucas palavras}
Execucao: branch {…} · commit {…} · push {…} · modo {…} · scan de seguranca {…}
Guia de validacao: {link ou caminho} — leia antes de aprovar (secoes 8 e 9)
```

7. **De-acordo** → gravar `Pacote aprovado em` no Preflight e seguir para o `/execute` (autonomo).
   **Ajustar** → mudar o pacote, regenerar o guia, re-apresentar.

**Modo lite**: passos 2–4 em versao curta e resumo no chat, sem guia publicado.

**NAO avancar para o `/execute` sem o de-acordo do usuario** — e o unico portao humano entre
o pacote e o fim da implementacao.

## Gestao de Contexto

Aprovado o pacote, recomende `/clear` antes do `/execute` (ou rode pelo `loop-driver.mjs`). O tasks.md esta salvo.

## Handoffs

- → `/execute` (autonomo — so apos o de-acordo)
- → `/clear` (limpar contexto apos aprovacao)
- → `/checklist` (quality gates extras antes de executar, se o usuario quiser)
