# Praxis — Kit de Engenharia com IA para Claude Code

> **EN:** Praxis is an AI-assisted software engineering kit for [Claude Code](https://claude.com/claude-code): 39 skills and 45 subagents covering discovery → architecture (ADRs) → spec-driven development → vertical-slice execution loop → validation, orchestrated by a master agent. Documentation and agent output are in Brazilian Portuguese.

Pipeline completo de **discovery → arquitetura → especificação → implementação → validação**, com um **agente master Praxis** que lê o estado do projeto, despacha para a skill certa e interrompe quando vê risco.

- **39 skills** de orquestração e **45 agents** especializados, organizados em 8 domínios
- **13 templates de ADR** baseados em boas práticas de mercado
- **Loop Engineering** (ADR-0007): execução em loop por fatia vertical com gates objetivos
- **Sistema de learnings** por domínio + hooks que registram decisões e correções no instante em que acontecem

---

## Instalação

O kit é um **template de repositório**: você começa seu projeto a partir dele.

**Opção 1 — GitHub:** clique em **Use this template** → *Create a new repository*.

**Opção 2 — linha de comando:**

```bash
npx degit adlergoncalves/praxis-code meu-projeto
cd meu-projeto
git init
```

**Adotar em um projeto existente:** baixe o kit numa pasta temporária e copie para o seu projeto **sem sobrescrever** o que já existe:

```bash
npx degit adlergoncalves/praxis-code /tmp/praxis
cp -rn /tmp/praxis/.claude /tmp/praxis/docs .   # -n: não sobrescreve arquivos existentes
```

- Se o projeto **já tem** `CLAUDE.md`, não substitua: acrescente ao seu o conteúdo de `/tmp/praxis/CLAUDE.md`.
- Se o projeto **já tem** `.claude/settings.json`, o `cp -n` mantém o seu: copie manualmente o bloco `hooks` do kit para ele.
- Skills ou agents com o mesmo nome dos seus são mantidos na sua versão — revise antes de usar.

Depois rode `/start` → `/adopt`.

Depois, dentro do Claude Code:

```
/setup        # configura para a sua stack e remove módulos não aplicáveis
/start        # identifica a linha de trabalho e guia o pipeline
```

**Requisitos:** Claude Code e Node.js ≥ 18 (usado pelos hooks e scripts de gate).

### O que roda na sua máquina

O kit é só texto (prompts em Markdown) mais alguns scripts Node — **sem dependências npm, sem telemetria, sem downloads automáticos**.

| O quê | Quando | O que faz |
|-------|--------|-----------|
| **Hooks** (`.claude/hooks/*.mjs`) | Automático: início de sessão, cada prompt, fim de turno | Lê e escreve **apenas** em `docs/project/` (ledger, learnings, `state.md`). Não acessa rede nem executa comandos. Registra só caminhos de arquivos **dentro** do projeto. Se o Node não estiver instalado, não fazem nada. |
| **Gates** (`.claude/scripts/`) | Quando o `/execute` ou o `/verify-all` pedem | Rodam o build/typecheck do **seu** projeto e checagens estáticas. Passam pelo pedido de permissão normal do Claude Code. |
| **Instalações** | Só em `/ds-init` e `/ds-component` | `npx shadcn@latest ...` para instalar componentes — pedido de permissão normal do Claude Code. |

Para desligar os hooks: crie `.claude/settings.local.json` com `{ "disableAllHooks": true }`.

**Custo de contexto:** o Claude Code carrega o nome e a descrição de todas as skills e agents em cada sessão (o conteúdo completo só quando usados). Rode o `/setup` para remover os módulos que não se aplicam à sua stack.

> **Regra de ouro**: use `/clear` entre cada fase. Os artefatos ficam em disco — a próxima fase os lê automaticamente.

---

## 3 Linhas de Trabalho

| Linha | Descrição | Fluxo |
|-------|-----------|-------|
| **Novo Software** | Construir aplicação do zero | `/start` → `/discovery` → `/architect` → `/define` → `/implement` |
| **Modernizar Legado** | Documentar legado e reconstruir | `/start` → `/reverse-engineer` → `/discovery` → `/architect` → `/define` → `/implement` |
| **Adotar Projeto** | Trazer projeto existente para o kit | `/start` → `/adopt` → usar kit normalmente |

---

## Pipeline de Fases

```
Fase 0:   /reverse-engineer → Engenharia reversa de legados (Linha 2)
Fase 0.5: /strategy         → Validar ideia, modelo de negócio, decisões (qualquer momento)
          /ux               → Decisões de experiência do usuário (qualquer momento)
Fase 1:   /discovery        → Entender o projeto
          /adopt            → Adotar projeto existente (Linha 3)
Fase 2:   /define           → PRDs, escopo, specs
          /detail           → Workspace pré-SDD para módulos grandes/ambíguos (opcional — ADR-006)
Fase 3:   /ddd-estrategico  → Modelagem de domínio (opcional — domínios complexos)
          /architect        → Criar ADRs (interativo + opinativo)
Fase 5:   /spec-review      → Validar spec antes de implementar
          /implement        → Plan → Tasks → Execute em LOOP por fatia vertical (suporta --team)
Fase 6:   /validate         → Checar conformidade (suporta --team)
          /verify-all       → Confrontar o Loop Log com os gates reais
Fase 7:   /revalidate       → Corrigir + revalidar cirurgicamente
```

> **Loop Engineering (ADR-0007)**: o pipeline SDD captura a informação que deixa a demanda
> "pronta" (Decisões Fechadas/Diferidas, Armadilhas, **Fatos Confirmados `arquivo:linha`**,
> Módulo de Referência) e o `/execute` roda **em loop por fatia vertical** (1 fatia = 1 User
> Story): implementa → gates → conserta até verde → DONE → **para** para revisão humana
> (checkpoint; `--auto [N]` encadeia com guardrails). Ver [ADR-0007](docs/adr/0007-loop-engineering-execucao.md).

**Team scope** — `/implement` e `/validate` aceitam `--team front|back|db|full` (default `full`). Se uma alteração requer trabalho em outro team, o kit detecta e pergunta se quer delegar.

**Modos** — `/mode full` (default, pipeline completo) ou `/mode lite` (discovery rápido, ADRs default, `/implement` aceita descrição livre). `/mode praxis on` faz o Praxis se apresentar no início da sessão e propor o próximo passo ao fim de cada skill.

---

## Domínios

Os agents vivem em `.claude/agents/<domínio>/`; as skills ficam flat em `.claude/skills/<nome>/`. Detalhes em [docs/kit-domains.md](docs/kit-domains.md).

| Domínio | Agents | Conteúdo |
|---------|-------:|----------|
| **orchestration** | 1 | Praxis — orquestrador |
| **discovery** | 4 | Discovery, Strategy, Codebase Mapper, Legacy Analyzer |
| **product** | 6 | PRD (create/validate/decompose), Spec from PRD, Clarifier, Module Detailer |
| **architecture** | 3 | ADR Creator, ADR Validator, DDD Estratégico |
| **delivery** | 3 | Planner, Task Breaker, Executor |
| **quality** | 4 | Spec Review, Analyzer, SOLID Review, Revalidator |
| **frontend** | 17 | UX, Design, Design System, Paper Prototype + 12 agents de validação |
| **backend** | 7 | 6 agents de validação + Scaffold Aggregate |

O `/setup` remove `frontend/` e `backend/` quando não se aplicam à stack.

---

## Templates de ADR

13 templates em `docs/adr/templates/`, usados pelo `/architect` como ponto de partida:

| Categoria | Templates |
|-----------|-----------|
| **universal/** | SOLID Principles, Naming Conventions, Cyclomatic Complexity |
| **backend-patterns/** | Clean Architecture, DDD Aggregates/Entities, Exception Propagation, Unit Testing Strategy |
| **frontend-patterns/** | Feature-first Structure, Forms Stack, i18n Lazy Loading, Loading Strategy, Design System, Visual Identity |

---

## Skills (39)

### Entrada, setup, estratégia e orquestração

| Skill | Descrição |
|-------|-----------|
| `/praxis` | Agente master — lê manifesto, despacha para a skill certa, interrompe quando vê risco |
| `/start` | Ponto de entrada — identifica linha de trabalho e guia o pipeline |
| `/setup` | Configura template para sua stack (gera CLAUDE.md personalizado) |
| `/mode` | Alterna entre modo lite/full |
| `/strategy` | Estrategista de negócio — valida ideias, prioriza features, discute modelo |
| `/ux` | Especialista UX — avalia fluxos, decide componentes, mapeia estados de interface |

### Trabalho rápido

| Skill | Descrição |
|-------|-----------|
| `/quickfix` | Bug trivial, ajuste CSS, typo — sem cerimônia |
| `/debug` | Investigação de bugs (entender → pesquisar → causa raiz → fix) |
| `/review` | Self-review antes de commit (git diff vs ADRs + SOLID) |

### Engenharia reversa e adoção

| Skill | Descrição |
|-------|-----------|
| `/reverse-engineer` | Fase 0: Documenta lógica de negócio, fluxos, telas e regras implícitas |
| `/adopt` | Linha 3: Adota projeto existente para o kit (mapeia, cria ADRs, gera baseline) |

### Pipeline principal

| Skill | Fase | Descrição |
|-------|------|-----------|
| `/discovery` | 1 | Entendimento completo do projeto |
| `/define` | 2 | Orquestra workflow de PRD completo |
| `/ddd-estrategico` | 3 | Modelagem de domínio — Bounded Contexts (domínios complexos) |
| `/architect` | 3 | Cria ADRs interativamente |
| `/spec-review` | 5 | Valida spec antes de implementar — gate de qualidade |
| `/implement` | 5 | Orquestra Plan → Tasks → Execute (suporta `--team`) |
| `/plan` | 5a | Planejamento técnico |
| `/tasks` | 5b | Quebra em **fatias verticais** (U0…Un = User Stories) com contrato + DoD + BDD |
| `/execute` | 5c | Executa **em loop por fatia** (micro-loop até verde, checkpoint, `--auto`) |
| `/validate` | 6 | Valida conformidade — perfis: minimal/standard/full (suporta `--team`) |
| `/revalidate` | 7 | Revalidação cirúrgica dos itens pendentes |
| `/verify-all` | 6 | Confronta o Loop Log com os gates reais (exit codes) — veredito verde/vermelho |

### PRD workflow

| Skill | Descrição |
|-------|-----------|
| `/prd-create` | Cria PRD estratégico ou tático |
| `/prd-validate` | Valida PRD contra template canônico |
| `/detail` | Workspace pré-SDD para módulos grandes/ambíguos (opcional — ADR-006) |
| `/prd-decompose` | Decompõe PRD em specs independentes (detecta workspace `/detail` se existir) |
| `/prd-coverage` | Rastreia cobertura PRD → specs |
| `/spec-from-prd` | Gera spec técnica a partir de feature do PRD |

### Quality gates

| Skill | Descrição |
|-------|-----------|
| `/clarify` | Detecta ambiguidades em specs (9 categorias) |
| `/analyze` | Consistência cross-artefato (spec ↔ plan ↔ tasks) |
| `/checklist` | Quality gates — "testes unitários para texto" |

### Validação por stack

| Skill | Descrição |
|-------|-----------|
| `/frontend-validate` | Agents de validação frontend (sequencial — corrige entre agents) |
| `/backend-validate` | 6 agents backend (sequencial — corrige entre agents) |
| `/backend-scaffold` | Gera Aggregate Root + testes |

### Design e prototipagem

| Skill | Descrição |
|-------|-----------|
| `/ds-init` | Inicializa Design System a partir de screenshot |
| `/ds-component` | Adiciona componente ao Design System |
| `/prototype` | Protótipo hi-fi no Paper (MCP) — mock-gate antes do `/execute` |
| `/design` | Refinamentos cirúrgicos sobre código já gerado (polish, critique, animate…) |

---

## Estrutura de Pastas

```
.claude/
  agents/<domínio>/  — 45 subagents em 8 domínios
  skills/<nome>/     — 39 skills
  hooks/             — hooks de aprendizado (registrados em settings.json)
  scripts/           — gates determinísticos (build, learnings, clichês, screenshot)
  reference/         — conhecimento canônico (design, adapters de stack)

docs/
  kit-index.md|json  — inventário de skills/agents (gerado)
  adr/               — ADRs do projeto + templates/
  guide/             — manual, tutoriais e apresentação
  templates/         — templates de spec, plan, tasks e checklist
  project/           — manifesto, discovery, constitution, glossário, learnings/

scripts/             — manutenção do kit (generate-index, validate-kit)
```

Os artefatos do seu projeto (`docs/prds/`, `docs/specs/`, `docs/validation-reports/`) são criados pelas skills conforme o uso.

---

## Documentação

- [Apresentação](docs/guide/apresentacao.md) — O que é o Praxis, o pipeline e o porquê de cada fase
- [Manual de Uso](docs/guide/manual.md) — Referência completa de skills, agents e fases
- [Tutorial: Projeto do Zero](docs/guide/tutorial-projeto-do-zero.md)
- [Tutorial: Projeto Legado](docs/guide/tutorial-projeto-legado.md)
- [Tutorial: Correções e Features](docs/guide/tutorial-correcoes-e-novas-features.md)

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Mudanças por versão em [CHANGELOG.md](CHANGELOG.md).

## Licença

[MIT](LICENSE)
