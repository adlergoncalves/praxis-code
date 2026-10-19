# ADR-0007 — Loop Engineering na Execução (loop por fatia vertical)

**Status**: Aceito
**Data**: 2026-10-19
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
- **Preflight** (branch, política de commit, push, modo de execução, scan de segurança).
- **Guia de validação** (`docs/templates/guide-template.md`), derivado do pacote e publicado
  como página quando a sessão tem essa ferramenta.

O de-acordo grava `Pacote aprovado em` no `tasks.md`. Sem ele, o `/execute` não começa.

### C) Execução em loop por fatia vertical, na sessão principal, autônoma

A **unidade de iteração é a fatia vertical** (= uma User Story). O `/execute` roda **na
sessão principal** — é ela que conversa com o usuário quando preciso, mostra o RED do
test-first e despacha os verificadores. Por iteração:

1. Lê o `tasks.md` (estado durável) + git e pega a **próxima fatia liberada**.
2. Implementa test-first quando há mudança de comportamento (RED → CLASSIFY → JUSTIFY → GREEN → REFACTOR).
3. Roda os **gates** da(s) camada(s); **micro-loop de conserto** até verde ou `BLOCKED`.
   **Nunca marca DONE com gate vermelho.**
4. **Verificação independente**: com os gates verdes, despacha os check agents da(s)
   camada(s) tocada(s) sobre os arquivos da fatia. ERRO bloqueia o `DONE`. Quem implementa
   não confere o próprio trabalho.
5. Marca `DONE`, registra o Log de iterações, commita conforme o Preflight e **segue para a
   próxima fatia liberada**.

O loop **só para no realmente bloqueante**: nenhuma fatia liberada; watchdog (3ª tentativa
da mesma fatia sem progresso — o usuário decide entre abandonar, `BLOCKED` ou mais N
tentativas; status `ABANDONADA`); decisão de negócio não fechada que bloqueia; ação
destrutiva ou fora do escopo; `--max`. Decisão que não bloqueia vira registro e o loop
segue; fatia `BLOCKED` não para a corrida. `--checkpoint` faz o loop parar a cada fatia,
quando o usuário quiser.

Complementos:
- **Gate 0** (`.claude/scripts/loop-doctor.mjs`) antes de toda corrida: pacote aprovado,
  branch, frescor dos Fatos Confirmados e o ambiente declarado pela feature (`doctor.json`).
  Falha global para a corrida antes de gastar iteração; falha restrita a fatias as deixa
  `BLOCKED` de largada.
- **Flaky com teto** (2 re-execuções) e **testes incrementais** (suíte completa uma vez, no gate da fatia).
- **Multi-agente opt-in** por grupo de fatias com pontos de colisão declarados: um
  subagente por fatia; integração e verificação na sessão principal.
- **Driver de sessão nova por fatia** (`.claude/scripts/loop-driver.mjs`, opcional): cada
  fatia num `claude -p` com contexto vazio; o `tasks.md` e o git dão a retomada.
- **Calibração**: ao fim, índice previsto × realizado (iterações sem intervenção humana / total).

---

## As travas (inegociáveis)

### T1 — Fonte única de verdade

**Proibido** `STATUS.md` concorrente. O estado durável do loop **é o `tasks.md`**
(checkboxes por task + status por fatia + Loop Log). O `manifest.md` é a fonte única do
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
- O *enforcement* é do `/execute` (guardrails, watchdog, Gate 0) e, quando usado, do
  `loop-driver.mjs` (para no "sem progresso", no pedido de decisão e no teto de sessões).

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
- **PROIBIDO**: `STATUS.md` concorrente ao `manifest.md`/`tasks.md` (T1).
- **PROIBIDO**: rodar o loop sem `spec`+`plan`+`tasks` e pacote aprovado (T2).
- **PROIBIDO**: modo autônomo sem teto de iterações + detecção de sem-progresso (T3).

---

## Modo lite vs full

- **Full**: pacote completo + portão final + loop autônomo.
- **Lite**: pacote enxuto — `spec` mínima + tasks por fatia + DoD mínimo; portão final em
  versão curta (resumo no chat); o loop continua por fatia. Fatos Confirmados, Infra de
  Verificação e Fidelidade entram só se a demanda exigir; os itens condicionais (8, 9)
  ficam desligados por default.

---

## Consequências

**Positivas:**
- A demanda chega à execução com grounding pinado → menos adivinhação, menos paradas, menos retrabalho.
- O auto-conserto por fatia e o verificador independente fecham o "marcou `[x]` e largou pro humano".
- A conversa acontece uma vez, no fim do planejamento — não N vezes no meio da corrida.
- Completion promise honesta no lugar de relatório que não asserta "pronto".

**Negativas / a vigiar:**
- Mais campos a preencher no SDD (mitigado: condicionais por footprint; lite enxuto).
- A qualidade do portão final decide quantas vezes o loop para: pacote com paradas não
  levantadas vira loop interrompido.
- O loop consome a janela da sessão principal (mitigado pelo `loop-driver.mjs`, ou por
  `--checkpoint` + `/clear` entre fatias).
- Dependências de stack (Playwright, ferramenta de protótipo) não existem no núcleo
  genérico → itens 8/9 são **condicionais** e degradam honestamente.

---

## Referências

- Templates: `docs/templates/{spec,plan,tasks,guide}-template.md`, `docs/templates/doctor-template.json`.
- Skills/agents: `spec-from-prd`, `plan`, `tasks` (`@task-breaker`, `@analyzer`), `execute`, `verify-all`.
- [ADR-0006](0006-workspace-detalhamento-modulo.md) — Workspace de Detalhamento (pré-SDD).
- [ADR-0008](0008-seguranca-e-lgpd.md) — verificação de segurança dentro do loop.
