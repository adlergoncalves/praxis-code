# Praxis — Kit de Engenharia com IA

Pipeline de engenharia assistida por IA para Claude Code. Inventario completo de skills/agents: `docs/kit-index.md`. Manual: `docs/guide/manual.md`.

## Idioma

**REGRA GLOBAL**: toda comunicacao com o usuario em **Portugues Brasileiro (PT-BR)** — respostas, relatorios, findings, outputs de agents, documentacao gerada (docs/, specs, plans, tasks) e handoffs.
**Excecoes (Ingles)**: codigo-fonte (variaveis, funcoes, classes, commits), nomes tecnicos, arquivos de configuracao.

## Principio 70/30

70% definicao/intencao/aprendizado · 30% implementacao/validacao. Conhecimento que nao muda a implementacao e desperdicio.

## Sistema Nervoso — Evolucao Continua

- **Manifesto** (`docs/project/manifest.md`): fonte unica de "onde estamos". **Todo agent le antes de executar. Toda skill atualiza ao concluir.**
- **CLAUDE.md evolutivo (max ~4KB)**: aqui so regras globais + ponteiros de 1 linha. Detalhes vao para o manifesto. `/discovery`, `/architect`, `/ds-init` e `/adopt` adicionam ponteiros.
- **Learnings** (`docs/project/learnings/{frontend,backend,business,architecture,process}-learnings.md`): cada agent carrega **so o arquivo do seu dominio** e registra ali descobertas nao previstas (divergencia, pattern, edge case). Decisoes e correcoes tambem viram uma linha em `ledger.md`.

**REGRA MAXIMA — NUNCA PULAR ETAPAS**: o pipeline e obrigatorio em ordem: `/spec-from-prd` → `/plan` → `/tasks` → `/execute` → `/validate`. Se o usuario pedir para implementar sem os artefatos anteriores, parar, avisar qual etapa falta e rodar a etapa correta antes de escrever codigo. Sem excecoes. (Unica saida sem cerimonia: `/quickfix` para trabalho trivial.)

## Modo de Operacao

`/mode` alterna: **Full** (default — pipeline completo, ADRs interativas, validacao standard) ou **Lite** (discovery rapido, ADRs default, `/implement` aceita descricao livre, validacao minimal).

## Agente Principal: Praxis

Orquestrador (`.claude/agents/orchestration/praxis.md`): le o manifesto, despacha para a skill certa e interrompe quando ve risco. Design: `docs/project/praxis-design.md`.

**Status atual**: DESATIVADO (atualizado por `/mode praxis on|off`)

- Invocacao pontual: `/praxis` (qualquer momento)
- **Quando ativo**: (1) na primeira interacao da sessao, invocar `@praxis` antes de responder — ele decide a modalidade lendo `Praxis — Primeira sessao`/`Ultima saudacao` no manifesto; (2) ao fim de cada skill, invocar `@praxis` com o estado atualizado para propor o proximo passo.

## Linhas de Trabalho e Pipeline

`/start` identifica a linha: **Novo Software** (`/discovery` → `/architect` → `/define` → `/implement`), **Modernizar Legado** (`/reverse-engineer` primeiro) ou **Adotar Projeto** (`/adopt`).

**Loop Engineering (ADR-0007)**: `/execute` roda em loop por fatia vertical (1 fatia = 1 User Story) — implementa → gates → conserta ate verde → DONE no Loop Log (`tasks.md`) → PARA. `--auto [N]` encadeia com guardrails. Detalhes: `docs/adr/0007-loop-engineering-execucao.md`.

**Team scope**: `/implement` e `/validate` aceitam `--team front|back|db|full`.

<!-- EVOLUI: /discovery adiciona ponteiro de stack aqui -->
<!-- EVOLUI: /architect adiciona ponteiro de ADRs aqui -->
<!-- EVOLUI: /ds-init adiciona ponteiro de DS aqui -->
