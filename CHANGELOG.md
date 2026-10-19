# Changelog

Todas as mudanças relevantes do kit são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.1.0] — 2026-10-19 — primeira versão pública

### Distribuição — o kit se monta dentro do projeto (ADR-0009)
- O repositório é um **catálogo** (`catalog.json`, tag `vX.Y.Z`). O projeto instala a **semente** (`seed/`) e as ferramentas entram na hora do uso, sem o usuário pedir: `/start` monta o núcleo e puxa a trilha da linha de trabalho; `/setup` puxa os módulos da stack.
- `.claude/praxis/praxis.mjs` (`init`, `add`, `list`, `status`, `check`, `apply`, `diff`), lock em `.claude/praxis.json`, cache por máquina em `~/.claude/praxis/cache/`.
- **Atualização:** checagem diária em background; patch e minor aplicados pelo Praxis com o loop parado, num commit separado; major só com decisão do usuário; arquivo personalizado nunca é sobrescrito; `"pin"` congela a versão.
- `CLAUDE.md` do projeto importa as regras do kit (`.claude/praxis/rules.md`); o texto do projeto nunca é tocado pelo catálogo.
- `/forge`: o projeto cria as próprias ferramentas (check com eval, comando, subagente) nas convenções do kit.

### Orquestração
- 41 skills e 45 agents em 8 domínios (`orchestration`, `discovery`, `product`, `architecture`, `delivery`, `quality`, `frontend`, `backend`).
- **Praxis** ligado por padrão, na sessão principal: lê o manifesto, despacha a skill certa, interrompe quando vê risco e faz o handoff com o comando literal do próximo passo. Trilha mínima: `/start`, `/define`, `/implement`, `/quickfix`, `/debug`.
- Skills que conversam com o usuário rodam na sessão principal, com o agent como roteiro; subagentes fazem só o trabalho não interativo.

### Loop Engineering (ADR-0007)
- Pacote de informação fechada e ancorada no código (Fatos Confirmados `arquivo:linha`, Módulo de Referência, Decisões Fechadas/Diferidas, Armadilhas, critério de PRONTO por fatia).
- **Portão final do `/tasks`:** consistência, paradas prováveis eliminadas, cobertura de entendimento, índice de execução autônoma, Preflight e guia de validação.
- `/execute` autônomo por fatia vertical na sessão principal: test-first classificado (RED → CLASSIFY → JUSTIFY → GREEN → REFACTOR), micro-loop de conserto, verificador independente (check agents), watchdog anti-giro, status `ABANDONADA`, multi-agente opt-in por grupo, `--checkpoint` para parar a cada fatia.
- **Gate 0** (`loop-doctor.mjs`), **mutantes** (`mutants.mjs`), driver de sessão nova por fatia (`loop-driver.mjs`), `/verify-all` contra exit codes reais.

### Segurança (ADR-0008)
- Baseline OWASP + LGPD; verificadores de segurança por fatia; auditoria de dependências por delta (`deps-audit.mjs`); scan da branch no fechamento pelo plugin Claude Security (declarado, não copiado).

### Front
- Âncora de design: Charter **ou** memória de design do projeto (`docs/design-system/system.md`).
- `/ux`, `/design` e `/prototype` na sessão principal; protótipo opcional, no destino que a sessão tiver (ferramenta de protótipo, Artifact ou HTML local).
- Fontes de terceiros fixadas em `.claude/reference/frontend/third-party/` (interface-design, frontend-design, web-interface-guidelines, design-review com Playwright, auditoria da redesign-skill) — `THIRD_PARTY_NOTICES.md`.
- `@check-web-guidelines`, `detect-cliches.mjs`, `screenshot.mjs`, adapters de stack e módulo de marca opcional.

### Qualidade do kit
- **Agent evals** (`/agent-eval`, `.claude/evals/agents/`): 6 agents, linha de base 18/18.
- Hooks de aprendizado (ledger versionado só com linhas semânticas; o automático fica local) e hooks de qualidade **opt-in**.
- CI: `validate-kit` (frontmatter, grafo de dependências completo, JSON, evals, caminhos pessoais), índice/catálogo e semente conferidos com `--check`.
