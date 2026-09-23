# ADR-0007 — Loop Engineering na Execução (loop por fatia vertical)

**Status**: Aceito
**Data**: 2026-06-30
**Decisores**: Adler
**Contexto técnico**: Kit Praxis — pipeline SDD (`/spec-from-prd` → `/plan` → `/tasks` → `/execute` → `/validate`)

---

## Contexto

O Praxis decide bem a **intenção** (pipeline SDD com gates humanos, rastreabilidade,
15+ agents de validação). Mas o **motor de execução** tem duas fraquezas:

1. **Baixa densidade de grounding.** A spec/plan descrevem o design, mas nunca
   confirmam um valor no código antes de implementar. O executor **re-adivinha**
   enums, faixas de erro, roles, convenções HTTP — e erra ou para pra perguntar.
2. **Execução horizontal sem auto-conserto.** A unidade é a *task* ("um arquivo"),
   a correção é 100% manual (só fecha se o usuário rodar `/revalidate`), e o
   critério de "pronto" não é verificável na mão por incremento.

O **Loop Engineering** resolve isso com duas
ideias: (a) um **pacote de informação fechada e ancorada no código** produzido
antes de codar, e (b) um **loop de execução por fatia vertical** — implementa →
verifica → corrige até verde → para para revisão humana.

Esta ADR adota o Loop Engineering **dentro do pipeline existente**, sem criar um
subsistema paralelo e sem violar a REGRA MÁXIMA ("nunca pular etapas").

---

## Decisão

Adotamos o Loop Engineering em duas frentes:

### A) Enriquecimento informacional (a demanda sai "pronta")

O pipeline SDD passa a capturar **9 blocos de informação de fechamento e grounding**,
distribuídos pelos artefatos existentes:

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
| 9 | **Régua de Fidelidade + protótipo embutido** (frame + valores exatos) | `spec.md` (Anatomia da Tela) | Condicional a protótipo |

### B) Execução em loop por fatia vertical

O `/execute` ganha um **modo loop**: a **unidade de iteração é a fatia vertical**
(= uma User Story). Por iteração, o executor:

1. Lê o `tasks.md` (estado durável) + git, pega a **próxima fatia não concluída**.
2. Implementa as tasks daquela fatia (test-first quando aplicável).
3. Roda os **gates** da(s) camada(s) e os verificadores de conformidade.
4. **Micro-loop de conserto:** se um gate falha, corrige e re-roda — até verde ou
   `BLOCKED`. **Nunca marca DONE com gate vermelho.**
5. Marca a fatia `DONE` no `tasks.md`, apresenta um **relatório de verificação**
   (o que entregou, saída dos gates, como verificar manualmente em 1-3 passos) e
   **PARA**.
6. O humano revisa e dispara a próxima ("próxima"/"continuar").

---

## As 4 travas (inegociáveis)

Estas travas são o que torna a adoção segura. Violar qualquer uma reabre os riscos
que o Loop Engineering carrega.

### T1 — Checkpoint por fatia, NUNCA autônomo por default

Uma iteração = uma fatia vertical → implementa+verifica+conserta → **PARA**. O
humano valida em 1-3 passos antes da próxima. Modo autônomo entre fatias só existe
sob `--auto` **explícito** e **com guardrails** (ver T4).

### T2 — Fonte única de verdade

**Proibido** `STATUS.md` concorrente. O estado durável do loop **é o `tasks.md`**
(checkboxes por task + status por fatia + Loop Log). O `manifest.md` continua sendo
a fonte única do estado do projeto; o loop adiciona apenas um ponteiro de 1 linha.
As fatias mapeiam **1:1 para User Stories** — proibido criar uma segunda
decomposição paralela a specs/tasks.

### T3 — Loop é execução DEPOIS do SDD, nunca atalho

O modo loop só roda quando `spec.md` + `plan.md` + `tasks.md` existem e passam no
**portão pré-execução**. Se faltar artefato, o `/execute` **PARA** e chama a skill
faltante — idêntico ao comportamento atual. A REGRA MÁXIMA permanece literal.

### T4 — Guardrails obrigatórios no modo autônomo

`--auto` exige, sob pena de loop infinito / custo descontrolado:
- **Teto de iterações** (default: 1 fatia em modo checkpoint; N declarado em `--auto`).
- **Detecção de "sem progresso"** (mesmo erro / diff vazio em 2 iterações → `BLOCKED`).
- **Escape hatch** (`BLOCKED` com motivo de 1 linha + o que destrava; escala, não improvisa).
- O *enforcement* real é responsabilidade do **harness** (o comando `/loop`,
  re-invocação manual ou triggers). O kit define o **contrato**; não promete um
  motor de loop próprio em Markdown.

---

## Completion promise (falsificável)

O `/execute` (e o `/validate`) só podem declarar conclusão com uma frase
**falsificável**, e devem declarar **"auditoria equivalente"** quando um verificador
não rodou:

> *"Todas as fatias U0…Un estão DONE no tasks.md com seus cenários `[B]`/`[F]`/`[E2E]`
> passando; os gates (build/test, lint/type-check, e2e quando aplicável) estão verdes;
> e a conformidade foi verificada por «`/backend-validate` + `/frontend-validate`
> (agentes rodaram)» — ou, se não rodaram, «auditoria equivalente», DECLARADO COMO TAL."*

**Proibido** afirmar conformidade plena por agente que não executou.

---

## Regras para Validação

> Usadas pelos agents de checagem (`@adr-validator`) e pelo portão pré-execução.

- **OBRIGATÓRIO**: todo fato do codebase citado em `plan.md › Fatos Confirmados`
  tem valor real + `arquivo:linha` confirmado por grep. **PROIBIDO** "confirmar
  depois" em plan aprovado.
- **OBRIGATÓRIO**: `plan.md` declara um **Módulo de Referência** (ou justifica a
  ausência: "demanda sem exemplar próximo").
- **OBRIGATÓRIO**: cada fatia em `tasks.md` tem **critério de PRONTO file-level** e
  **verificação manual em 1-3 passos**.
- **OBRIGATÓRIO**: cada critério de aceite mapeia a ≥1 teste nomeado (`[B]`/`[F]`/`[E2E]`).
- **OBRIGATÓRIO**: zero ambiguidade de negócio aberta — tudo em `spec.md › Decisões Fechadas`.
- **PROIBIDO**: marcar fatia `DONE` com gate vermelho.
- **PROIBIDO**: `STATUS.md` concorrente ao `manifest.md`/`tasks.md` (T2).
- **PROIBIDO**: rodar o modo loop sem `spec`+`plan`+`tasks` aprovados (T3).
- **PROIBIDO**: modo `--auto` sem teto de iterações + detecção de sem-progresso (T4).

---

## Modo lite vs full

- **Full**: enriquecimento informacional completo + loop checkpoint por fatia.
- **Lite**: pacote enxuto — `spec` mínima + tasks por fatia + DoD minimal; o loop
  ainda é checkpoint por fatia, mas Fatos Confirmados/Infra de Verificação/Fidelidade
  entram só se a demanda exigir. Itens condicionais (8, 9) seguem desligados por default.

---

## Consequências

**Positivas:**
- A demanda chega ao executor com grounding pinado → menos adivinhação, menos paradas, menos retrabalho.
- O auto-conserto por fatia fecha o gap "marcou `[x]` e largou pro humano".
- Completion promise honesta substitui o relatório que não asserta "pronto".

**Negativas / a vigiar:**
- Mais campos a preencher no SDD (mitigado: condicionais por footprint; lite enxuto).
- Risco de loop autônomo descontrolado (mitigado: T1 + T4; autônomo é opt-in).
- Dependências de stack (Playwright/ferramenta de protótipo) não existem no núcleo
  genérico → itens 8/9 são **condicionais** e degradam honestamente.

---

## Referências

- Templates afetados: `docs/templates/{spec,plan,tasks}-template.md`.
- Skills/agents afetados: `spec-from-prd`, `plan`, `task-breaker`, `executor`, `execute`.
- [ADR-0006](0006-workspace-detalhamento-modulo.md) — Workspace de Detalhamento (pré-SDD).
