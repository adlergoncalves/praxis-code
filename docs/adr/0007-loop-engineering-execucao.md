# ADR-0007 — Loop Engineering na Execução (loop por fatia vertical)

**Status**: Aceito
**Data**: 2026-10-19 · **Revisão**: 2026-11-04 — execução pelo driver (uma sessão por fatia) como caminho padrão
**Decisores**: Adler
**Contexto técnico**: Kit Praxis — pipeline SDD (`/spec-from-prd` → `/plan` → `/tasks` → `/execute` → `/validate`)

---

## Contexto

Execução assistida por IA costuma falhar em dois pontos, mesmo com uma boa spec:

1. **Baixa densidade de grounding.** Spec e plan descrevem o design, mas não confirmam
   nenhum valor no código antes de implementar. Quem implementa **re-adivinha** enums,
   faixas de erro, roles e convenções HTTP — e erra ou para para perguntar.
2. **Execução horizontal sem auto-conserto.** Com a *task* ("um arquivo") como unidade,
   a correção fica manual e o critério de "pronto" não é verificável na mão a cada
   incremento.

O **Loop Engineering** responde com duas ideias: (a) um **pacote de informação fechada e
ancorada no código**, produzido antes de codar; (b) um **loop de execução por fatia
vertical** — implementa → verifica → corrige até verde → segue para a próxima.

O loop vive **dentro do pipeline SDD**, sem subsistema paralelo e sem violar a REGRA
MÁXIMA ("nunca pular etapas").

---

## Decisão

### A) A demanda sai "pronta" do planejamento

O pipeline captura **9 blocos de informação de fechamento e grounding**, distribuídos pelos
artefatos:

| # | Bloco | Artefato | Obrigatório? |
|---|---|---|---|
| 1 | **Fatos Confirmados no codebase** (`arquivo:linha`) | `plan.md` | Sim |
| 2 | **Módulo de Referência** (exemplar a copiar) | `plan.md` | Sim |
| 3 | **Decisões Diferidas** (opção + default + critério + fecha em) | `spec.md` | Quando houver |
| 4 | **Critério de PRONTO file-level + Verificação manual (1-3 passos)** por fatia | `tasks.md` | Sim |
| 5 | **DoD uniforme + gates como bloqueio + mapa critério→teste `[B]`/`[F]`/`[E2E]`** | `tasks.md` | Sim |
| 6 | **Armadilhas da Demanda** (sintoma→causa→convenção→ref) | `spec.md` | Quando houver |
| 7 | **Escopo IN/OUT explícito + Personas + Regras de Negócio (RN) + Decisões Fechadas (gate)** | `spec.md` | Sim |
| 8 | **Infra de Verificação** (personas/fixtures/seeds/scopes/sequenciamento) | `plan.md` | Condicional a e2e |
| 9 | **Régua de Fidelidade + fonte de design embutida** (referência + valores exatos) | `spec.md` (Anatomia da Tela) | Condicional a protótipo |

### B) Portão final do `/tasks` — aprovação do pacote

Antes do loop, numa só conversa com o usuário:

- **Consistência** spec ↔ plan ↔ tasks (`@analyzer`).
- **Paradas prováveis** levantadas e eliminadas: o que é do agente entra no pacote sem
  perguntar; o que depende do usuário vira pergunta ali, não no meio da corrida.
- **Cobertura de entendimento** e **índice de execução autônoma**, com decomposição auditável.
- **Preflight** (branch, política de commit, push, modo de execução, scan de segurança) e o
  **modelo · esforço de cada fatia**, proposto na quebra e aprovado aqui.
- **Guia de validação** (`docs/templates/guide-template.md`), derivado do pacote e publicado
  como página quando a sessão tem essa ferramenta.

O de-acordo grava `Pacote aprovado em` no `tasks.md`. Sem ele, o `/execute` não começa.

### C) Execução em loop por fatia vertical, uma sessão por fatia, autônoma

A **unidade de iteração é a fatia vertical** (= uma User Story). Com o loop inteiro numa
sessão, cada chamada relê tudo o que veio antes: o custo cresce com o contexto acumulado, não
com o trabalho, e a sessão passa a compactar e reler. Por isso o **gerente do loop é um script**
(`.claude/scripts/loop-driver.mjs`), sem token e sem contexto, e cada fatia roda numa **sessão
nova** do Claude Code que lê só o que a fatia usa. Por iteração:

1. **Gate 0** e escolha da **próxima fatia liberada** no grafo (dependências `DONE`), lendo o
   `tasks.md` + git. Grupo liberado no Preflight vai inteiro numa sessão.
2. **Sessão da fatia** (`claude -p`, nova), no **modelo · esforço** aprovado para a fatia, com o
   protocolo da sessão de fatia (`slice-session.md`, da skill `/execute`) e o **recorte do pacote**
   (`.claude/scripts/loop-briefing.mjs`: a fatia, DoD, Gates, Preflight, Loop Log, regras,
   decisões e armadilhas da spec, Módulo de Referência e Fatos do plan). Leitura de PRD e guia
   de validação bloqueada por regra de permissão. Implementa test-first (RED → CLASSIFY →
   JUSTIFY → GREEN → REFACTOR), **micro-loop de conserto** até verde ou `BLOCKED`, commita
   conforme o Preflight e marca `DONE`. **Nunca marca DONE com gate vermelho.**
3. **Gates objetivos** (`.claude/scripts/slice-gates.mjs`): os comandos da tabela Gates, só das
   camadas tocadas, decididos pelo exit code. Gate vermelho reprova sem gastar o verificador.
4. **Verificação independente**: outra sessão, **sem o histórico de quem implementou** e sem
   edição nem commit, confere critério a critério com evidência, roda os check agents da camada
   tocada sobre os arquivos da fatia, a revisão visual e a caça a afrouxamento
   (protocolo `verifier-session.md`, da skill `/execute`). Quem implementa não confere o próprio
   trabalho — e não escolhe o que o verificador vê.
5. **Reprovada**: a fatia volta para `WIP` e repete **uma vez**, um degrau de modelo acima, com os
   achados no prompt. Reprovada de novo, o loop para. Aprovada: segue para a próxima.
6. O driver anota custo, pico de contexto e resultado de cada sessão no `tasks.md`.

A **sessão principal** (`/execute`) confere a Regra 0, solta o driver, trata as paradas com o
usuário e faz o fechamento. Pergunta não se faz no meio da fatia: o portão final do `/tasks`
existe para que ela não exista; a que sobrar encerra a sessão com `DRIVER: PARAR` e chega ao
usuário pela sessão principal. A fatia que precisa do usuário no meio (protótipo, decisão de
UI) roda pelo `--interativo`, na sessão principal, com o mesmo protocolo e o mesmo recorte.

O loop **só para no realmente bloqueante**: nenhuma fatia liberada; watchdog (3ª tentativa
da mesma fatia sem progresso — o usuário decide entre abandonar, `BLOCKED` ou mais N
tentativas; status `ABANDONADA`); decisão de negócio não fechada que bloqueia; ação
destrutiva ou fora do escopo; fatia reprovada duas vezes pelo verificador; `--max`. Decisão
que não bloqueia vira registro e o loop segue; fatia `BLOCKED` não para a corrida.
`--checkpoint` faz o loop parar a cada fatia, quando o usuário quiser.

Complementos:
- **Gate 0** (`.claude/scripts/loop-doctor.mjs`) antes de toda iteração: pacote aprovado,
  branch, frescor dos Fatos Confirmados e o ambiente declarado pela feature (`doctor.json`).
  Falha global para a corrida antes de gastar iteração; falha restrita a fatias as deixa
  `BLOCKED` de largada.
- **Flaky com teto** (2 re-execuções) e **testes incrementais** (suíte completa uma vez, no gate da fatia).
- **Multi-agente opt-in** por grupo de fatias com pontos de colisão declarados: uma sessão para
  o grupo, um subagente por fatia, integração e gates nessa sessão, verificador sobre o grupo.
- **Continuação automática**: sessão que termina sem `DONE`, sem pedir parada, mas com trabalho
  feito ganha uma continuação (uma vez) antes de o driver parar.
- **Tabela Gates por caminho**: cada camada declara os globs dos seus arquivos; só a camada
  tocada roda. Sem a coluna, toda camada roda (pacote anterior a ela).
- **Calibração**: ao fim, índice previsto × realizado (iterações sem intervenção humana / total)
  e o custo por fatia, que calibra a tabela de modelo por fatia.

---

## As travas (inegociáveis)

### T1 — Fonte única de verdade

**Proibido** `STATUS.md` concorrente. O estado durável do loop **é o `tasks.md`**
(checkboxes por task + status por fatia + Loop Log + Log de iterações + a tabela de custo que só
o driver escreve). O `manifest.md` é a fonte única do
estado do projeto; o loop adiciona apenas um ponteiro de 1 linha. As fatias mapeiam **1:1
para User Stories** — proibida uma segunda decomposição paralela.

### T2 — Loop é execução DEPOIS do SDD, nunca atalho

O loop só roda quando `spec.md` + `plan.md` + `tasks.md` existem e o pacote foi aprovado.
Se faltar artefato, o `/execute` **para** e chama a skill faltante. A REGRA MÁXIMA permanece literal.

### T3 — Guardrails do modo autônomo

Sob pena de loop infinito ou custo descontrolado:
- **Teto de iterações** (fim das fatias liberadas, ou `--max N`).
- **Detecção de "sem progresso"** (mesmo erro / diff vazio em 2 iterações → `BLOCKED`) e o watchdog.
- **Escape hatch** (`BLOCKED` com motivo de 1 linha + o que destrava; escala, não improvisa).
- O *enforcement* é do `loop-driver.mjs` (Gate 0 por iteração, grafo de dependências, gates por
  exit code, verificador, uma repetição por reprovação, parada no "sem DONE", no pedido de
  decisão e no teto de sessões) e da sessão da fatia (watchdog, "sem progresso").

---

## Completion promise (falsificável)

O `/execute` (e o `/validate`) só declaram conclusão com uma frase **falsificável**, e
declaram **"auditoria equivalente"** quando um verificador não rodou:

> *"Todas as fatias U0…Un estão DONE no tasks.md com seus cenários `[B]`/`[F]`/`[E2E]`
> passando; os gates (build/test, lint/type-check, e2e quando aplicável) estão verdes;
> e a conformidade foi verificada por «check agents da fatia + `/verify-all`» — ou, se
> algum não rodou, «auditoria equivalente», DECLARADO COMO TAL."*

**Proibido** afirmar conformidade plena por agente que não executou.

---

## Regras para Validação

> Usadas pelos agents de checagem (`@adr-validator`) e pelo portão final do `/tasks`.

- **OBRIGATÓRIO**: todo fato do codebase citado em `plan.md › Fatos Confirmados`
  tem valor real + `arquivo:linha` confirmado por grep. **PROIBIDO** "confirmar
  depois" em plan aprovado.
- **OBRIGATÓRIO**: `plan.md` declara um **Módulo de Referência** (ou justifica a
  ausência: "demanda sem exemplar próximo").
- **OBRIGATÓRIO**: cada fatia em `tasks.md` tem **critério de PRONTO file-level** e
  **verificação manual em 1-3 passos**.
- **OBRIGATÓRIO**: cada critério de aceite mapeia a ≥1 teste nomeado (`[B]`/`[F]`/`[E2E]`).
- **OBRIGATÓRIO**: zero ambiguidade de negócio aberta — tudo em `spec.md › Decisões Fechadas`.
- **PROIBIDO**: marcar fatia `DONE` com gate vermelho ou com ERRO de verificador.
- **PROIBIDO**: a sessão que implementou a fatia despachar ou substituir o verificador dela (no
  driver, o verificador é outra sessão; no `--interativo`, são subagentes que não implementaram).
- **PROIBIDO**: `STATUS.md` concorrente ao `manifest.md`/`tasks.md` (T1).
- **PROIBIDO**: rodar o loop sem `spec`+`plan`+`tasks` e pacote aprovado (T2).
- **PROIBIDO**: modo autônomo sem teto de iterações + detecção de sem-progresso (T3).

---

## Modo lite vs full

- **Full**: pacote completo + portão final + loop autônomo.
- **Lite**: pacote enxuto — `spec` mínima + tasks por fatia + DoD mínimo; portão final em
  versão curta (resumo no chat); o loop continua por fatia, e o verificador roda só o
  `@adr-validator`. Fatos Confirmados, Infra de
  Verificação e Fidelidade entram só se a demanda exigir; os itens condicionais (8, 9)
  ficam desligados por default.

---

## Consequências

**Positivas:**
- A demanda chega à execução com grounding pinado → menos adivinhação, menos paradas, menos retrabalho.
- O auto-conserto por fatia e o verificador independente fecham o "marcou `[x]` e largou pro humano".
- A conversa acontece uma vez, no fim do planejamento — não N vezes no meio da corrida.
- Completion promise honesta no lugar de relatório que não asserta "pronto".
- O custo de uma fatia não depende de quantas vieram antes: cada sessão nasce vazia e lê só o
  recorte; o modelo segue o tipo de trabalho, e o custo de cada sessão fica medido no `tasks.md`.

**Negativas / a vigiar:**
- Mais campos a preencher no SDD (mitigado: condicionais por footprint; lite enxuto).
- A qualidade do portão final decide quantas vezes o loop para: pacote com paradas não
  levantadas vira loop interrompido.
- Cada sessão paga de novo a base fixa (sistema, regras, ferramentas): sessão enxuta é parte do
  contrato — protocolo curto, recorte em vez de artefato inteiro, leitura de PRD e guia bloqueada.
- A sessão do driver não tem quem aprove permissão: o que o `settings.json` não libera é negado.
  O ensaio (`--max 1`) mostra o que falta antes da corrida inteira.
- O verificador custa uma sessão por fatia; é o preço de a prova não depender de quem implementou.
- Dependências de stack (Playwright, ferramenta de protótipo) não existem no núcleo
  genérico → itens 8/9 são **condicionais** e degradam honestamente.

---

## Referências

- Templates: `docs/templates/{spec,plan,tasks,guide}-template.md`, `docs/templates/doctor-template.json`.
- Skills/agents: `spec-from-prd`, `plan`, `tasks` (`@task-breaker`, `@analyzer`), `execute`, `verify-all`.
- Scripts: `loop-driver.mjs` (gerente), `loop-briefing.mjs` (recorte), `slice-gates.mjs` (gates), `loop-doctor.mjs` (Gate 0), `mutants.mjs`.
- [ADR-0006](0006-workspace-detalhamento-modulo.md) — Workspace de Detalhamento (pré-SDD).
- [ADR-0008](0008-seguranca-e-lgpd.md) — verificação de segurança dentro do loop.
