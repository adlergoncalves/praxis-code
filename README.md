# Praxis — Kit de Engenharia com IA para Claude Code

> **EN:** Praxis is an AI-assisted software engineering kit for [Claude Code](https://claude.com/claude-code): 41 skills and 45 subagents covering discovery → architecture (ADRs) → spec-driven development → vertical-slice execution loop → validation, orchestrated by a master agent. Documentation and agent output are in Brazilian Portuguese.

Pipeline completo de **discovery → arquitetura → especificação → implementação → validação**, com um **agente master Praxis** que lê o estado do projeto, despacha para a skill certa e interrompe quando vê risco.

- **41 skills** de orquestração e **45 agents** especializados, organizados em 8 domínios
- **13 templates de ADR** baseados em boas práticas de mercado
- **Loop Engineering** (ADR-0007): execução em loop por fatia vertical com gates objetivos
- **Sistema de learnings** por domínio + hooks que registram decisões e correções no instante em que acontecem

---

## Instalação

O kit **se monta dentro do projeto** ([ADR-0009](docs/adr/0009-distribuicao-catalogo-semente.md)): você instala uma **semente** pequena e, a partir do primeiro `/start`, as ferramentas entram no projeto na hora do uso, puxadas deste repositório numa versão fixa. O que o projeto tem no fim é o praxis dele — arquivos próprios, versionados com o projeto, editáveis.

**Projeto novo:**

```bash
npx degit adlergoncalves/praxis-code/seed meu-projeto
cd meu-projeto
git init
```

**Projeto existente:** copie a semente por cima, **sem sobrescrever** o que já existe:

```bash
npx degit adlergoncalves/praxis-code/seed /tmp/praxis
cp -rn /tmp/praxis/. .    # -n: não sobrescreve arquivos existentes
```

- Se o projeto **já tem** `CLAUDE.md`, não substitua: acrescente ao seu a linha `@.claude/praxis/rules.md` e a seção `## Projeto` de `/tmp/praxis/CLAUDE.md`.
- Se o projeto **já tem** `.claude/settings.json`, o `cp -n` mantém o seu: copie para ele os blocos `hooks`, `permissions.allow` (a linha do `praxis.mjs`), `enabledPlugins` e `extraKnownMarketplaces` da semente.
- O `/adopt` confere isso na Etapa 0 e completa o que faltar.

**Depois, no Claude Code:** `/start`. Ele monta o núcleo, pergunta a linha de trabalho, chama o `/setup` (stack e módulos) e puxa a trilha da linha. Daí em diante, cada ferramenta entra no projeto quando é usada — você não precisa saber o que existe no catálogo.

**Atualização:** patch e minor do catálogo entram sozinhos no início de uma sessão, com o loop parado, num commit separado; o que você personalizou fica como está (`node .claude/praxis/praxis.mjs status` e `diff` mostram). Major só com a sua decisão. Para congelar a versão: `"pin": "0.1.0"` em `.claude/praxis.json`.

**Requisitos:** Claude Code, Node.js ≥ 18 (hooks e scripts) e git (o catálogo é clonado para `~/.claude/praxis/cache/`). Opcional: Python 3.9+ para o scan de segurança do plugin Claude Security.

### O que roda na sua máquina

O kit é só texto (prompts em Markdown) mais alguns scripts Node — **sem dependências npm e sem telemetria própria**. O plugin declarado (Claude Security) e o módulo de marca, ambos opcionais, têm as condições descritas na tabela.

| O quê | Quando | O que faz |
|-------|--------|-----------|
| **Hooks de aprendizado** (`.claude/hooks/*.mjs`) | Automático: início de sessão, cada prompt, fim de turno | Escrevem em `docs/project/` (ledger, learnings, `state.md`) e num cursor local gitignored (`.claude/hooks/.capture-cursor.json`); leem o transcript da sessão para saber os arquivos alterados. A linha automática de cada turno vai para um arquivo local e gitignored, não para o ledger versionado. Não acessa rede nem executa comandos. Registra só caminhos de arquivos **dentro** do projeto. Se o Node não estiver instalado, não fazem nada. |
| **Hooks de qualidade** (`.claude/hooks/quality/`, **opt-in**) | Só se você aceitar no `/setup`: a cada edição | **Executam comandos do seu projeto** — os que você aprovar em `.claude/quality.json` (formatar, lintar, rodar o teste ao lado do arquivo) — e pedem confirmação antes de editar caminho crítico (ADRs, pipelines, configuração do kit). Ligados no `.claude/settings.local.json` de quem aceitou; nunca no `settings.json` versionado. |
| **Gates** (`.claude/scripts/`) | Quando o `/execute` ou o `/verify-all` pedem | Rodam o build/typecheck do **seu** projeto e checagens estáticas. Passam pelo pedido de permissão normal do Claude Code. |
| **Auditoria de dependências** (`.claude/scripts/deps-audit.mjs`) | Quando uma fatia do `/execute` toca um manifesto, e no `/verify-all` | Roda o audit do ecossistema (`npm audit`, `pnpm audit`, `dotnet list package --vulnerable`, `pip-audit`) — **consulta a rede** — e compara com `docs/project/security/deps-baseline.json`. |
| **Claude Security** (plugin da Anthropic, opcional) | No fechamento da feature, se o Preflight pedir | Declarado em `.claude/settings.json`: o Claude Code oferece a instalação pela loja oficial. Licença própria (não vem copiado no kit), exige **Python 3.9+** e envia contagens de uso pela telemetria do Claude Code — `DISABLE_TELEMETRY=1` desliga. Sem ele, o kit funciona e declara o scan como NÃO VERIFICADO. |
| **Módulo de marca** (taste-skill v2, opcional) | Só se você aceitar no `/setup` | Instalado de um commit fixado; seus scripts pedem Node 22+ e Chrome e consultam a rede para buscar imagens em acervos abertos. |
| **Mutantes** (`.claude/scripts/mutants.mjs`) | Quando o `/execute` precisa provar um teste que nasceu verde | Aplica cada mutante descrito num JSON, roda o comando de teste e **devolve o arquivo byte a byte** ao original em qualquer caso (inclusive Ctrl+C). |
| **Gate 0** (`.claude/scripts/loop-doctor.mjs`) | No início de toda corrida do `/execute` e no portão final do `/tasks` | Confere pacote aprovado, branch, se os `arquivo:linha` dos Fatos Confirmados ainda existem e as checagens de ambiente da feature (`docs/specs/<feature>/doctor.json`: porta, URL local, conteúdo de arquivo, comando do projeto). |
| **Loop driver** (`.claude/scripts/loop-driver.mjs`) | Só quando **você** roda | Abre um `claude -p` por fatia do `tasks.md`, com o modo de permissão que você escolher, e grava o JSON de cada sessão numa pasta temporária fora do projeto. |
| **Instalações** | Só em `/ds-init` e `/ds-component` | `npx shadcn@latest ...` para instalar componentes — pedido de permissão normal do Claude Code. |

Para desligar todos os hooks: `.claude/settings.local.json` com `{ "disableAllHooks": true }`. Para desligar só os de qualidade, remova o bloco deles do mesmo arquivo.

**Custo de contexto:** o Claude Code carrega o nome e a descrição de todas as skills e agents do projeto em cada sessão (o conteúdo completo só quando usados). Por isso o kit não chega inteiro: o projeto só tem o que usa ([ADR-0009](docs/adr/0009-distribuicao-catalogo-semente.md)).

> **Regra de ouro**: use `/clear` entre cada fase. Os artefatos ficam em disco — a próxima fase os lê automaticamente.

---

## 3 Linhas de Trabalho

| Linha | Descrição | Fluxo |
|-------|-----------|-------|
| **Novo Software** | Construir aplicação do zero | `/start` → `/discovery` → `/architect` → `/define` → `/implement` |
| **Modernizar Legado** | Documentar legado e reconstruir | `/start` → `/reverse-engineer` → `/discovery` → `/architect` → `/define` → `/implement` |
| **Adotar Projeto** | Trazer projeto existente para o kit | `/start` → `/adopt` → usar kit normalmente |

**Trilha mínima** — o dia a dia cabe em cinco comandos; o Praxis propõe os demais quando o estado pede, ou você pede em linguagem natural:

| Comando | Para quê |
|---|---|
| `/start` | Entrada única: linha de trabalho e próximo passo |
| `/define` | Da ideia ao PRD e à spec da feature |
| `/implement` | Da spec ao pacote aprovado e ao loop autônomo por fatia |
| `/quickfix` | Ajuste trivial, sem cerimônia |
| `/debug` | Investigação de bug |

---

## Pipeline de Fases

```
Fase 0:   /reverse-engineer → Engenharia reversa de legados (Linha 2)
Fase 0.5: /strategy         → Validar ideia, modelo de negócio, decisões (qualquer momento)
          /ux               → Decisões de experiência do usuário (qualquer momento)
Fase 1:   /discovery        → Entender o projeto
          /adopt            → Adotar projeto existente (Linha 3)
Fase 2:   /ddd-estrategico  → Modelagem de domínio (opcional — domínios complexos)
          /architect        → Criar ADRs (interativo + opinativo)
Fase 3:   /define           → PRDs, escopo, specs
          /detail           → Workspace pré-SDD para módulos grandes/ambíguos (opcional — ADR-006)
Fase 5:   /spec-review      → Validar spec antes de implementar
          /implement        → Plan → Tasks → Execute em LOOP por fatia vertical (suporta --team)
Fase 6:   /validate         → Checar conformidade (suporta --team)
          /verify-all       → Confrontar o Loop Log com os gates reais
Fase 7:   /revalidate       → Corrigir + revalidar cirurgicamente
```

> **Loop Engineering (ADR-0007)**: o pipeline SDD captura a informação que deixa a demanda
> "pronta" (Decisões Fechadas/Diferidas, Armadilhas, **Fatos Confirmados `arquivo:linha`**,
> Módulo de Referência) e o `/execute` roda **em loop por fatia vertical** (1 fatia = 1 User
> Story): implementa → gates → conserta até verde → verificador independente → DONE → **próxima fatia**,
> autônomo depois do pacote aprovado no portão final do `/tasks` (guia de validação + métricas de prontidão);
> só para no realmente bloqueante (`--checkpoint` para a cada fatia). Ver [ADR-0007](docs/adr/0007-loop-engineering-execucao.md).

**Team scope** — `/implement` e `/validate` aceitam `--team front|back|db|full` (default `full`). Fatia que depende de trabalho de outro team ainda não feito fica `BLOCKED` com o que a destrava, e o loop segue com as liberadas.

**Modos** — `/mode full` (default, pipeline completo) ou `/mode lite` (discovery rápido, ADRs default, `/implement` aceita descrição livre). O **Praxis** vem ligado: se apresenta no início da sessão e propõe o próximo passo ao fim de cada skill (`/mode praxis off` desliga).

---

## Domínios

Os agents vivem em `.claude/agents/<domínio>/`; as skills ficam flat em `.claude/skills/<nome>/`. Detalhes em [docs/kit-domains.md](docs/kit-domains.md).

| Domínio | Agents | Conteúdo |
|---------|-------:|----------|
| **orchestration** | 1 | Praxis — orquestrador |
| **discovery** | 4 | Discovery, Strategy, Codebase Mapper, Legacy Analyzer |
| **product** | 6 | PRD (create/validate/decompose), Spec from PRD, Clarifier, Module Detailer |
| **architecture** | 3 | ADR Creator, ADR Validator, DDD Estratégico |
| **delivery** | 2 | Planner, Task Breaker |
| **quality** | 4 | Spec Review, Analyzer, SOLID Review, Revalidator |
| **frontend** | 18 | UX, Design, Design System, Prototype + 13 agents de validação |
| **backend** | 7 | 6 agents de validação + Scaffold Aggregate |

Esses são os números do **catálogo**. Um projeto recebe só o que usa: o `/setup` puxa os módulos da stack e o resto entra na hora do uso.

---

## Templates de ADR

13 templates em `docs/adr/templates/`, usados pelo `/architect` como ponto de partida:

| Categoria | Templates |
|-----------|-----------|
| **universal/** | SOLID Principles, Naming Conventions, Cyclomatic Complexity |
| **backend-patterns/** | Clean Architecture, DDD Aggregates/Entities, Exception Propagation, Unit Testing Strategy |
| **frontend-patterns/** | Feature-first Structure, Forms Stack, i18n Lazy Loading, Loading Strategy, Design System, Visual Identity |

---

## Skills (41)

### Entrada, setup, estratégia e orquestração

| Skill | Descrição |
|-------|-----------|
| `/praxis` | Agente master — lê manifesto, despacha para a skill certa, interrompe quando vê risco |
| `/start` | Ponto de entrada — identifica linha de trabalho e guia o pipeline |
| `/setup` | Pergunta a stack, puxa do catálogo os módulos que se aplicam e preenche a seção do projeto no CLAUDE.md |
| `/forge` | Cria uma ferramenta do projeto (check com eval, comando ou subagente) nas convenções do kit |
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
| `/execute` | 5c | Executa o pacote aprovado **em loop autônomo por fatia** (micro-loop até verde, verificador independente; `--checkpoint`, `--driver`) |
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
| `/agent-eval` | Roda os agents de checagem contra fixtures com resposta conhecida (o agent ainda acha o que devia?) |

### Validação por stack

| Skill | Descrição |
|-------|-----------|
| `/frontend-validate` | 11 agents de validação frontend (paralelo por padrão; `--mode sequential` para corrigir entre agents) |
| `/backend-validate` | 6 agents backend (paralelo por padrão; `--mode sequential` para corrigir entre agents) |
| `/backend-scaffold` | Gera Aggregate Root + testes |

### Design e prototipagem

| Skill | Descrição |
|-------|-----------|
| `/ds-init` | Inicializa Design System a partir de screenshot |
| `/ds-component` | Adiciona componente ao Design System |
| `/prototype` | Protótipo hi-fi (ou 2-3 direções para escolher) no destino que a sessão tiver: ferramenta de protótipo (ex.: Paper MCP), página publicada (Artifact) ou HTML local — opcional |
| `/design` | Refinos sobre código já gerado, olhando a tela renderizada (polish, critique, deslop, animate…) |

---

## Estrutura de Pastas

```
.claude/
  agents/<domínio>/  — 45 subagents em 8 domínios
  skills/<nome>/     — 41 skills
  hooks/             — hooks de aprendizado (em settings.json) e, em quality/, hooks de qualidade opt-in
  scripts/           — gates e utilitários (build-gate, loop-doctor, loop-driver, deps-audit, mutants, learnings, clichês, screenshot)
  reference/         — conhecimento canônico (design, adapters de stack)

seed/                — a semente que o projeto instala (gerada por scripts/build-seed.mjs)
catalog.json         — catálogo: cada ferramenta com arquivos, hashes e dependências (gerado)
VERSION              — versão do catálogo (a tag é v + VERSION)

docs/
  kit-index.md|json  — inventário de skills/agents (gerado)
  adr/               — ADRs do projeto + templates/
  guide/             — manual, tutoriais e apresentação
  templates/         — templates de spec, plan, tasks e checklist
  project/           — manifesto, discovery, constitution, glossário, learnings/

scripts/             — manutenção do kit (generate-index, build-seed, validate-kit)
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
