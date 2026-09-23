# Arquitetura do kit Praxis — skills, agents e o contrato entre eles

> Como as peças se encaixam no Claude Code. Para o mapa dos domínios, ver `docs/kit-domains.md`.

## As três peças

| Peça | O que é | Onde roda | Como é invocada |
|---|---|---|---|
| **Skill** | Comando / playbook (o "o quê fazer") | Contexto de quem dirige (Praxis / thread principal) | `/<nome>` — é a porta de entrada do usuário |
| **Agent (subagente)** | Trabalhador especializado (o "quem faz") | Janela de contexto **isolada** | Delegado pelo orquestrador via a ferramenta Agent |
| **Hook** | Automação determinística (shell) | Eventos do harness (sessão, turno, compactação) | Configurado em `.claude/settings.json` |

> **Comando = skill.** O kit usa **skills** como camada de comando (não `.claude/commands/`). São mais ricas: auto-disparam por descrição, agrupam arquivos e declaram dependências.

## Contrato skill↔agent

- **Skill** é fina: resolve input, **verifica pré-condições**, **delega** ao agent, salva onde combinado, **atualiza o manifesto** e propõe handoffs. Roda no contexto principal (onde vive o estado).
- **Agent** é "fundo de loja": faz o trabalho pesado em janela isolada e devolve só o resultado — preservando a janela principal (serve o princípio 70/30).
- **Regra de ouro**: a skill **nunca** descreve o "como" do agent. Sem duplicação de conteúdo — só orquestra e delega.
- **Skills são biblioteca compartilhada**: tanto o thread principal quanto **subagentes** podem usá-las (ex.: o `@executor` usando uma skill de teste).
- **Mesmo nome** (`/discovery` ↔ `@discovery`) é **pareamento intencional** (fachada ↔ fundo de loja), não redundância.

## Quando uma skill tem agent (e quando não tem)

- **Tem agent** quando o trabalho é **pesado/gerativo/multi-arquivo** (preserva a janela principal) **ou** a lógica é **reusada por ≥2 skills**.
  - Ex.: `/discovery`→`@discovery`, `/spec-from-prd`→`@spec-from-prd`, `/plan`→`@planner`, `/validate`→vários `@check-*`.
- **Roda inline** (sem agent) quando é **orquestração pura ou trivial**.
  - Ex.: `/mode`, `/checklist`, `/debug`, `/quickfix`, `/start` (despacha), `/define`/`/implement` (orquestram outras skills).

## Convenção de nomes

- **Clusters** compartilham prefixo: `prd-*`, `check-*`, `ds-*`.
- **Standalone** usa verbo/substantivo curto: `ux`, `debug`, `plan`.
- O **agrupamento lógico vem do `domain:`**, não do nome. Não se renomeia `name:` de skills/agents existentes (o playbook do Praxis e o Claude Code resolvem por nome).

## Hooks de aprendizado (Fase 2)

Os hooks tornam a captura de aprendizado **redundante e independente do `/compact`** — gravam no disco no instante em que o trabalho acontece. Vivem em `.claude/hooks/` (Node, cross-platform):

| Script | Eventos | Papel |
|---|---|---|
| `reconcile.mjs` | `SessionStart`, `UserPromptSubmit` | **Uso**: injeta estado reconciliado + correções/pendências como contexto de fundo; faz o nag de "trabalho não registrado" |
| `capture.mjs` | `Stop`, `SubagentStop`, `PreCompact`, `SessionEnd` | **Captura**: grava a linha `(auto)` por turno no `ledger.md` + reescreve o snapshot `state.md` |
| `_lib.mjs` | — | Helpers compartilhados pelos dois |

- **A instrução é a fonte primária** (CLAUDE.md / agents gravam o conteúdo semântico no instante); os hooks são **redes**. Hooks rodam shell determinístico — não invocam o LLM.
- Os hooks já vêm registrados em `.claude/settings.json` (bloco `hooks`). `.claude/hooks/hooks.manifest.json` é a fonte canônica desse bloco — ao alterar um, alterar o outro (o CI verifica).
- Detalhe do ciclo de captura/uso e do gate: `docs/project/learnings/README.md`.

## Módulos de stack — núcleo agnóstico + adapter (Fase 3)

Os módulos de stack (`frontend/`, futuro `backend/`) operam com **núcleo agnóstico + adapters plugáveis**. A stack vem do `discovery`/`manifest` — **nunca assumida**. Adicionar uma nova stack = criar um adapter `.md` + (opcional) `stack-profile` seed, **sem mexer no núcleo**.

### Camadas (frontend, Fase 3)

| Camada | Localização | Conteúdo | Agnóstico? |
|---|---|---|---|
| **Conhecimento de design** | `.claude/reference/frontend/*.md` | 9 reference files: motion-design, cognitive-load, personas, patterns, heuristics, register-{brand,product}, anti-patterns, design-system-anatomy | sim |
| **Adapters de stack** | `.claude/reference/frontend/adapter-*.md` | 4 templates: react-vite-shadcn, react-next-shadcn, angular-material, vue-vuetify | per-stack |
| **`stack-profile.json`** | `docs/design-system/stack-profile.json` (no projeto) | Materializa "o que é token nesta stack". Criado pelo `@ds-foundation` a partir do adapter casado. Editável pelo dev. | per-projeto |
| **Scripts Node (kit-owned, runtime no projeto)** | `.claude/scripts/frontend/` | `detect-cliches.mjs` (detector determinístico de clichês de IA, sem LLM) e `screenshot.mjs` (captura via Playwright dinâmico, degrada gracioso) | sim |

### Gates de intenção→implementação (Charter & Shape)

A Fase 3 introduz dois gates que materializam o 70/30 no front:

- **`/ux charter`** (entrevista de identidade do produto) → `docs/project/ux-charter.md` com register/arquétipo/refs/anti-refs/scene.
- **`/ux shape <feature>`** (brief da feature) → `docs/project/ux-shape-{slug}.md` com checklist de aprovação.
- **`/prototype`** = mock-gate visual (Paper MCP). Mock aprovado destrava `/execute`.
- **`@executor`** valida ambos antes de declarar feature de front concluída (gate enforcement, `agents/delivery/executor.md`).

## O índice do kit

- `docs/kit-index.json` (machine) e `docs/kit-index.md` (humano) são **gerados** por `node scripts/generate-index.mjs` a partir dos frontmatters (o CI falha se estiverem desatualizados).
- Campos por item: `name`, `domain`, `optional`, `path`, `description`, `depends` (e `category`=pasta, para agents).
- O Praxis lê o índice para saber a qual domínio cada item pertence. Por isso **mover um agent** exige regenerar o índice e atualizar os `depends:` que apontem para ele.
