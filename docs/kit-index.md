# Kit Index - Praxis

> Inventario completo de skills e agents do kit. Gerado automaticamente por `node scripts/generate-index.mjs` — nao edite a mao.
> O agente Praxis consulta este indice para saber a qual dominio cada item pertence.

---

## Skills (39)

| Skill | Path | Descricao | Deps |
|-------|------|-----------|------|
| `/adopt` | `.claude/skills/adopt/SKILL.md` | Linha 3: Adocao de projeto existente. Mapeia, documenta e padroniza um projeto em andamento para uso completo do kit, sem impacto no codigo. | 5 |
| `/analyze` | `.claude/skills/analyze/SKILL.md` | Analise de consistencia cross-artefato (spec ↔ plan ↔ tasks). Detecta duplicacoes, gaps e inconsistencias. | 2 |
| `/architect` | `.claude/skills/architect/SKILL.md` | Fase 3: Arquitetura — Cria ADRs interativamente seguindo boas praticas de mercado. Questiona decisoes incomuns. | 1 |
| `/backend-scaffold` | `.claude/skills/backend-scaffold/SKILL.md` | Roteador de scaffolding backend. Direciona para o agent correto (UseCase, Aggregate, Endpoint). | 1 |
| `/backend-validate` | `.claude/skills/backend-validate/SKILL.md` | Orquestra os 6 agents de validacao backend. Suporta modo paralelo (rapido) e sequencial (interativo). | 6 |
| `/checklist` | `.claude/skills/checklist/SKILL.md` | Quality gates — 'testes unitarios para texto'. Gera checklists para validar qualidade dos requisitos. | - |
| `/clarify` | `.claude/skills/clarify/SKILL.md` | Detecta ambiguidades em specs usando taxonomia de 9 categorias. Faz perguntas priorizadas e integra respostas na spec. | 1 |
| `/ddd-estrategico` | `.claude/skills/ddd-estrategico/SKILL.md` | Fase 3 (opcional): Modelagem estrategica de dominio — Bounded Contexts, Context Map, classificacao Core/Supporting/Generic. Para dominios complexos com multiplos modulos interdependentes. | 1 |
| `/debug` | `.claude/skills/debug/SKILL.md` | Investigacao de bugs — entender, pesquisar, identificar causa raiz, propor e aplicar fix. Mais leve que /implement, mais pesado que /quickfix. | - |
| `/define` | `.claude/skills/define/SKILL.md` | Fase 2: Definicao — Orquestra workflow de PRD (discovery → create → validate → decompose → spec) | 4 |
| `/design` | `.claude/skills/design/SKILL.md` | Craftsman de design — refinamentos cirurgicos sobre codigo ja gerado (polish/critique/distill/animate/colorize/typeset/layout/bolder/quieter/delight/harden). Ancorado no Charter. | 13 |
| `/detail` | `.claude/skills/detail/SKILL.md` | Fase 2 (opcional): Detalhamento pre-SDD. Cria workspace canonico para modulos grandes/ambiguos antes do /prd-decompose. Entre /prd-validate e /prd-decompose. | 1 |
| `/discovery` | `.claude/skills/discovery/SKILL.md` | Fase 1: Discovery — Entendimento completo do projeto antes de qualquer decisao | 1 |
| `/ds-component` | `.claude/skills/ds-component/SKILL.md` | Adiciona componente ao Design System — Busca, instala, customiza e cria showcase no design-system. | 1 |
| `/ds-init` | `.claude/skills/ds-init/SKILL.md` | Inicializa Design System — Extrai tokens de screenshot, cria design-system isolado e gera ADR. | 1 |
| `/execute` | `.claude/skills/execute/SKILL.md` | Sub-fase 5c: Executa em LOOP por fatia vertical (1 fatia = 1 User Story): implementa, roda gates, conserta ate verde (micro-loop), marca DONE no Loop Log e PARA (checkpoint; --auto encadeia). Loop Engineering (ADR-0007). | 1 |
| `/frontend-validate` | `.claude/skills/frontend-validate/SKILL.md` | Orquestra os 10 agents de validacao frontend. Suporta modo paralelo (rapido) e sequencial (interativo). | 10 |
| `/implement` | `.claude/skills/implement/SKILL.md` | Fase 5: Implementacao — Plan + Tasks + Execute. Planeja tecnicamente, quebra em tasks e executa respeitando ADRs. | 3 |
| `/mode` | `.claude/skills/mode/SKILL.md` | Alterna entre modo lite (simples, rapido) e full (completo, profissional). Afeta como todo o pipeline se comporta. | - |
| `/plan` | `.claude/skills/plan/SKILL.md` | Sub-fase 5a: Planejamento tecnico. Le spec + ADRs e gera plan.md com Technical Context, data model e contracts. | 1 |
| `/praxis` | `.claude/skills/praxis/SKILL.md` | Agente principal do kit. Dev senior parceiro de projeto que conhece o estado real, despacha para a skill certa e interrompe quando ve risco. Le manifesto antes de qualquer resposta. | 1 |
| `/prd-coverage` | `.claude/skills/prd-coverage/SKILL.md` | Mostra progresso: quantas user stories do PRD foram transformadas em specs e quantas faltam. | - |
| `/prd-create` | `.claude/skills/prd-create/SKILL.md` | Cria PRD estrategico ou tatico seguindo template canonico. Questiona informacoes incompletas. | - |
| `/prd-decompose` | `.claude/skills/prd-decompose/SKILL.md` | Decompoe PRD tatico em specs independentes. Identifica dependencias e propoe ordem de implementacao. | - |
| `/prd-validate` | `.claude/skills/prd-validate/SKILL.md` | Valida PRD contra template canonico. Read-only — reporta mas nao corrige. | - |
| `/prototype` | `.claude/skills/prototype/SKILL.md` | Gera prototipos hi-fi no Paper (MCP) a partir de PRD ou descricao de tela, usando o Design System real do projeto. | 1 |
| `/quickfix` | `.claude/skills/quickfix/SKILL.md` | Escape hatch para trabalho trivial — bugfix, ajuste de CSS, correcao de typo. Sem cerimonia, com validacao minima. | - |
| `/revalidate` | `.claude/skills/revalidate/SKILL.md` | Fase 7: Revalidacao cirurgica. Le relatorio existente e re-checa apenas itens pendentes. Detecta regressoes. | 1 |
| `/reverse-engineer` | `.claude/skills/reverse-engineer/SKILL.md` | Fase 0: Engenharia reversa de projeto legado. Documenta logica de negocio, fluxos, telas e regras antes de modernizar. | 3 |
| `/review` | `.claude/skills/review/SKILL.md` | Self-review antes de commit — analisa git diff contra ADRs e SOLID. Mais leve que /validate. | 1 |
| `/setup` | `.claude/skills/setup/SKILL.md` | Setup interativo do template — pergunta stack, modulos e gera CLAUDE.md personalizado para o projeto. | - |
| `/spec-from-prd` | `.claude/skills/spec-from-prd/SKILL.md` | Transforma feature do PRD em spec tecnica detalhada para o dev. Le PRD, ADRs e specs existentes. | - |
| `/spec-review` | `.claude/skills/spec-review/SKILL.md` | Valida se uma spec tecnica esta pronta para implementacao — criterios de aceite, edge cases, alinhamento com ADRs e learnings aplicaveis. Gate leve antes do /implement. | 2 |
| `/start` | `.claude/skills/start/SKILL.md` | Ponto de entrada do kit. Identifica a linha de trabalho (novo, legado, adocao) e guia o usuario pelo pipeline correto. | 1 |
| `/strategy` | `.claude/skills/strategy/SKILL.md` | Estrategia de Negocio — Avalia ideias, prioriza features, discute modelos de negocio e questiona premissas antes de entrar no pipeline tecnico. | 1 |
| `/tasks` | `.claude/skills/tasks/SKILL.md` | Sub-fase 5b: Quebra o plan em fatias verticais (U0..Un = User Stories) com contrato (valor, PRONTO file-level, verificacao manual, refs) + DoD + mapa BDD. Loop Engineering (ADR-0007). | 1 |
| `/ux` | `.claude/skills/ux/SKILL.md` | Especialista em Experiencia do Usuario — avalia fluxos, decide componentes, questiona specs pela otica do usuario e aponta problemas de interface com sinceridade. Consultivo, proativo e orientado ao usuario real. | 1 |
| `/validate` | `.claude/skills/validate/SKILL.md` | Fase 6: Validacao — Orquestrador principal. Despacha agents core + frontend + backend conforme stack do projeto. | 4 |
| `/verify-all` | `.claude/skills/verify-all/SKILL.md` | Confronta o Loop Log (tasks.md) com os gates REAIS (exit codes). Veredito binário verde/vermelho — não 'o modelo acha que terminou'. Gate objetivo do Loop Engineering (ADR-0007). | - |

## Agents (45)

### architecture (3)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@adr-creator` | `.claude/agents/architecture/adr-creator.md` | Agente interativo e opinativo que cria ADRs seguindo boas praticas de mercado. Questiona decisoes incomuns do usuario e pede justificativa. Usa templates pre-definidos como ponto de partida. | - |
| `@adr-validator` | `.claude/agents/architecture/adr-validator.md` | Agente dinamico que le TODAS as ADRs do projeto e valida codigo contra as regras definidas nelas. Funciona com qualquer ADR — nao tem regras hardcoded. | - |
| `@ddd-estrategico` | `.claude/agents/architecture/ddd-estrategico.md` | Especialista Senior em DDD Estrategico e Identificacao de Bounded Contexts. Use para modelagem de dominio, identificacao de subdominios, classificacao estrategica (Core/Supporting/Generic), analise de linguagem ubiqua, definicao de Bounded Contexts e construcao de Context Maps. | - |

### backend (7)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@check-architecture` | `.claude/agents/backend/check-architecture.md` | Valida dependencias entre camadas arquiteturais. Detecta violacoes de Clean Architecture, imports invertidos, Service Locator, Leaky Abstractions e ausencia de patterns estruturais importantes. | - |
| `@check-ddd` | `.claude/agents/backend/check-ddd.md` | Valida DDD tactical patterns — aggregates, entities, VOs, encapsulamento, domain events, acoplamento entre agregados. Detecta anemic models, public setters e oportunidades de evolucao arquitetural. | - |
| `@check-errors` | `.claude/agents/backend/check-errors.md` | Valida exception handling, logging estruturado e observabilidade. Detecta try/catch em handlers, swallowing de excecoes, logging nao estruturado e ausencia de correlation ID. | - |
| `@check-naming` | `.claude/agents/backend/check-naming.md` | Valida convencoes de nomes em qualquer linguagem OO — classes, metodos, variaveis, sufixos. Detecta nomes genericos, abreviacoes, inconsistencias e violacoes de linguagem ubiqua do dominio. | - |
| `@check-security` | `.claude/agents/backend/check-security.md` | Valida seguranca backend — SQL injection, autenticacao/autorizacao em endpoints, secrets, sanitizacao de input, audit trail e RBAC/ABAC. Detecta vulnerabilidades e oportunidades de evolucao de seguranca. | - |
| `@check-tests` | `.claude/agents/backend/check-tests.md` | Valida patterns de teste — AAA, naming, cobertura, mocks, isolamento de testes de integracao. Detecta testes sem assertions, nomes ruins, mocks excessivos e ausencia de testes em caminhos criticos. | - |
| `@scaffold-aggregate` | `.claude/agents/backend/scaffold-aggregate.md` | Gera Aggregate Root com private setters, factory method, audit fields e unit tests. | - |

### delivery (3)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@executor` | `.claude/agents/delivery/executor.md` | Executa em loop por fatia vertical (1 fatia = 1 User Story) — implementa, roda gates, conserta ate verde (micro-loop), marca DONE no Loop Log e PARA para revisao humana. Checkpoint por fatia; --auto encadeia com guardrails. Loop Engineering (ADR-0007). | - |
| `@planner` | `.claude/agents/delivery/planner.md` | Planejador tecnico que le spec + ADRs e gera plan.md com Technical Context, data model, contracts e guia de implementacao. | - |
| `@task-breaker` | `.claude/agents/delivery/task-breaker.md` | Quebra plan tecnico em fatias verticais (U0..Un = User Stories), cada uma com contrato completo (valor, criterio PRONTO file-level, verificacao manual, refs arquivo:linha) + DoD + mapa BDD. Loop Engineering (ADR-0007). | - |

### discovery (4)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@codebase-mapper` | `.claude/agents/discovery/codebase-mapper.md` | Documentarista de codebase para legados. Mapeia a estrutura, padroes e dependencias do codigo existente SEM julgar ou opinar. Apenas documenta o que existe. | - |
| `@discovery` | `.claude/agents/discovery/discovery.md` | Agente de Discovery que entende o projeto completamente antes de qualquer decisao. Faz perguntas estruturadas e progressivas sobre negocio, stack, time e restricoes. NAO avanca sem entendimento completo. | - |
| `@legacy-analyzer` | `.claude/agents/discovery/legacy-analyzer.md` | Engenharia reversa completa de projetos legados. Documenta logica de negocio, fluxos, telas, regras e estrutura. Pode solicitar prints e descricoes de telas ao usuario. Produz documentacao suficiente para reconstruir o sistema sem acessar o legado novamente. | 1 |
| `@strategy` | `.claude/agents/discovery/strategy.md` | Estrategista de Negocio Senior que pensa junto com o usuario para avaliar ideias, discutir features, priorizar, questionar premissas e garantir que o produto tem potencial real antes de entrar no pipeline tecnico. Conversacional, opinativo e orientado a resultados de negocio. | - |

### frontend (17)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@check-ai-cliches` | `.claude/agents/frontend/check-ai-cliches.md` | Detecta cliches de IA no frontend (Inter onipresente, gradiente roxo-azul, cards aninhados, hero metrics row, glassmorphism decorativo, etc.). Roda o detector deterministico (.claude/scripts/frontend/detect-cliches.mjs) + aplica heuristicas que regex nao pega + contextualiza findings contra o Charter do projeto. | - |
| `@check-design` | `.claude/agents/frontend/check-design.md` | Valida Design System compliance — tokens de tema, componentes consistentes, sem reimplementacao de componentes existentes, spacing e tipografia via tokens. | - |
| `@check-forms` | `.claude/agents/frontend/check-forms.md` | Valida patterns de formularios — validacao, masks, UX, acessibilidade de form. Detecta useState por campo, onChange prematuro, falta de schema validation e double submit. | - |
| `@check-i18n` | `.claude/agents/frontend/check-i18n.md` | Valida internacionalizacao — detecta strings user-facing hardcoded, verifica namespaces por feature, lazy loading de traducoes e consistencia de chaves. | - |
| `@check-react` | `.claude/agents/frontend/check-react.md` | Valida patterns React — hooks, composicao, estado, performance, key props. Detecta anti-patterns comuns, re-renders desnecessarios e oportunidades de evolucao arquitetural. | - |
| `@check-responsiveness` | `.claude/agents/frontend/check-responsiveness.md` | Valida responsividade — mobile-first, breakpoints via utility classes, ausencia de @media inline e widths fixos. Detecta abordagens desktop-first e oportunidades de melhoria de layout responsivo. | - |
| `@check-routing` | `.claude/agents/frontend/check-routing.md` | Valida patterns de rotas — URLs semanticas, navegacao via router, lazy loading, CRUD pattern e protecao de rotas autenticadas. | - |
| `@check-security-frontend` | `.claude/agents/frontend/check-security-frontend.md` | Valida seguranca frontend — XSS (dangerouslySetInnerHTML, innerHTML), armazenamento inseguro de token/credencial, secrets expostos no bundle, open redirect, dados sensiveis no client e tabnabbing. Detecta vulnerabilidades client-side e oportunidades de evolucao. | - |
| `@check-structure` | `.claude/agents/frontend/check-structure.md` | Valida estrutura de pastas frontend, imports, barrels e coesao de modulos. Verifica feature-first, imports cruzados, uso de shared/ e oportunidades de modularizacao. | - |
| `@check-typescript` | `.claude/agents/frontend/check-typescript.md` | Valida configuracao TypeScript strict, uso de tipos, generics e type safety. Detecta any, ts-ignore, tipos implicitos e oportunidades de melhorar type safety. | - |
| `@check-ux` | `.claude/agents/frontend/check-ux.md` | Valida patterns UX — loading states, feedback visual, empty states, error handling, acessibilidade basica e consistencia de interacao. | - |
| `@check-visual-consistency` | `.claude/agents/frontend/check-visual-consistency.md` | Valida consistencia visual entre features/surfaces do projeto contra Charter + Design System + reference files. Detecta drift visual ("tela A != tela B"), uso divergente de componentes/variants/motion/densidade. Comparativo, nao absoluto. | - |
| `@design` | `.claude/agents/frontend/design.md` | Craftsman de design — opera sobre codigo ja gerado para refinar (polish/critique/distill/animate/colorize/typeset/layout/bolder/quieter/delight/harden). Ancora-se no Charter + reference files + adapter da stack. Diferente do @ux (estrategia, 70%), o @design e execucao de refino (30%). | - |
| `@ds-component` | `.claude/agents/frontend/ds-component.md` | Busca componente no registry, instala, customiza com variants e CSS variables, cria showcase no design-system. Tambem documenta componentes existentes e remove showcases orfaos. | - |
| `@ds-foundation` | `.claude/agents/frontend/ds-foundation.md` | Extrai design tokens de screenshot, inicializa biblioteca de componentes, configura CSS variables, cria design-system isolado e gera ADR do Design System. | - |
| `@paper-prototype` | `.claude/agents/frontend/paper-prototype.md` | Designer de produto senior que gera prototipos hi-fi no Paper (MCP) a partir de PRD ou descricao de tela, usando o Design System e contexto real do projeto. | - |
| `@ux` | `.claude/agents/frontend/ux.md` | Especialista Senior em Experiencia do Usuario que pensa junto com o dev para garantir que interfaces sao claras, funcionais, bonitas e intuitivas. Tambem propoe direcao criativa, motion grammar e personalidade do produto. Conversacional, opinativo e sincero. | - |

### orchestration (1)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@praxis` | `.claude/agents/orchestration/praxis.md` | Agente principal do kit. Dev senior parceiro de projeto que conhece o estado real, despacha para a skill certa e interrompe quando ve risco. Le manifesto antes de qualquer resposta. | - |

### product (6)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@clarifier` | `.claude/agents/product/clarifier.md` | Detecta ambiguidades em specs usando taxonomia de 9 categorias. Faz perguntas priorizadas por impacto x incerteza e integra respostas na spec. | - |
| `@module-detailer` | `.claude/agents/product/module-detailer.md` | Conduz o detalhamento de um modulo pre-SDD. Scaffolda workspace canonico, preenche as 8 dimensoes interativamente, rastreia decisoes/duvidas com IDs estaveis e congela o workspace para alimentar /prd-decompose. | - |
| `@prd-create` | `.claude/agents/product/prd-create.md` | Cria PRD estrategico ou tatico seguindo o template canonico. Atua como Especialista Senior em Product Management — questiona premissas vagas, nao aceita "a definir" e prioriza clareza. Trabalho gerativo pesado, roda isolado. | - |
| `@prd-decompose` | `.claude/agents/product/prd-decompose.md` | Decompoe PRD tatico (ou workspace de detalhamento) em specs independentes. Identifica dependencias, propoe ordem de implementacao e gera plano salvo em disco. | - |
| `@prd-validate` | `.claude/agents/product/prd-validate.md` | Valida PRD contra o template canonico. Read-only — reporta erros/avisos mas nao corrige. Distingue estrategico de tatico pelo conteudo. | - |
| `@spec-from-prd` | `.claude/agents/product/spec-from-prd.md` | Transforma uma feature do PRD em spec tecnica detalhada, numerada e rastreavel. Le PRD, TODAS as ADRs, glossario e specs existentes. Trabalho gerativo pesado, roda isolado. | - |

### quality (4)

| Agent | Path | Descricao | Deps |
|-------|------|-----------|------|
| `@analyzer` | `.claude/agents/quality/analyzer.md` | Analise de consistencia cross-artefato (spec ↔ plan ↔ tasks). Detecta duplicacoes, gaps, ambiguidades e inconsistencias em 6 passes. | - |
| `@revalidator` | `.claude/agents/quality/revalidator.md` | Agente de revalidacao cirurgica. Le um relatorio de validacao existente, identifica itens pendentes e re-executa apenas os agents responsaveis. Detecta regressoes nos arquivos corrigidos. | - |
| `@solid-review` | `.claude/agents/quality/solid-review.md` | Analisa codigo em qualquer linguagem OO para violacoes dos principios SOLID. Use para revisao de qualidade de codigo. | - |
| `@spec-review` | `.claude/agents/quality/spec-review.md` | Valida se uma spec tecnica esta pronta para implementacao. Verifica campos obrigatorios, criterios de aceite concretos, edge cases, entidades definidas e ausencia de ambiguidades bloqueantes. Read-only — reporta gaps mas nao corrige. | - |

---

## Dependencias detalhadas

Lista expandida apenas para items com `depends:` declarado.
Items omitidos sao folha (zero dependencias no kit).

### /adopt

- `.claude/agents/discovery/codebase-mapper.md`
- `.claude/agents/discovery/discovery.md`
- `.claude/agents/architecture/adr-creator.md`
- `.claude/agents/architecture/adr-validator.md`
- `.claude/skills/validate/SKILL.md`

### /analyze

- `.claude/agents/quality/analyzer.md`
- `.claude/skills/clarify/SKILL.md`

### /architect

- `.claude/agents/architecture/adr-creator.md`

### /backend-scaffold

- `.claude/agents/backend/scaffold-aggregate.md`

### /backend-validate

- `.claude/agents/backend/check-architecture.md`
- `.claude/agents/backend/check-ddd.md`
- `.claude/agents/backend/check-naming.md`
- `.claude/agents/backend/check-tests.md`
- `.claude/agents/backend/check-errors.md`
- `.claude/agents/backend/check-security.md`

### /clarify

- `.claude/agents/product/clarifier.md`

### /ddd-estrategico

- `.claude/agents/architecture/ddd-estrategico.md`

### /define

- `.claude/skills/prd-create/SKILL.md`
- `.claude/skills/prd-validate/SKILL.md`
- `.claude/skills/prd-decompose/SKILL.md`
- `.claude/skills/spec-from-prd/SKILL.md`

### /design

- `.claude/agents/frontend/design.md`
- `.claude/reference/frontend/heuristics.md`
- `.claude/reference/frontend/cognitive-load.md`
- `.claude/reference/frontend/anti-patterns.md`
- `.claude/reference/frontend/patterns.md`
- `.claude/reference/frontend/motion-design.md`
- `.claude/reference/frontend/register-product.md`
- `.claude/reference/frontend/register-brand.md`
- `.claude/reference/frontend/design-system-anatomy.md`
- `.claude/reference/frontend/adapter-react-vite-shadcn.md`
- `.claude/reference/frontend/adapter-react-next-shadcn.md`
- `.claude/reference/frontend/adapter-angular-material.md`
- `.claude/reference/frontend/adapter-vue-vuetify.md`

### /detail

- `.claude/agents/product/module-detailer.md`

### /discovery

- `.claude/agents/discovery/discovery.md`

### /ds-component

- `.claude/agents/frontend/ds-component.md`

### /ds-init

- `.claude/agents/frontend/ds-foundation.md`

### /execute

- `.claude/agents/delivery/executor.md`

### /frontend-validate

- `.claude/agents/frontend/check-structure.md`
- `.claude/agents/frontend/check-typescript.md`
- `.claude/agents/frontend/check-react.md`
- `.claude/agents/frontend/check-forms.md`
- `.claude/agents/frontend/check-i18n.md`
- `.claude/agents/frontend/check-routing.md`
- `.claude/agents/frontend/check-responsiveness.md`
- `.claude/agents/frontend/check-design.md`
- `.claude/agents/frontend/check-ux.md`
- `.claude/agents/frontend/check-security-frontend.md`

### /implement

- `.claude/skills/plan/SKILL.md`
- `.claude/skills/tasks/SKILL.md`
- `.claude/skills/execute/SKILL.md`

### /plan

- `.claude/agents/delivery/planner.md`

### /praxis

- `.claude/agents/orchestration/praxis.md`

### /prototype

- `.claude/agents/frontend/paper-prototype.md`

### /revalidate

- `.claude/agents/quality/revalidator.md`

### /reverse-engineer

- `.claude/agents/discovery/legacy-analyzer.md`
- `.claude/agents/discovery/codebase-mapper.md`
- `.claude/skills/discovery/SKILL.md`

### /review

- `.claude/agents/quality/solid-review.md`

### /spec-review

- `.claude/agents/quality/spec-review.md`
- `.claude/skills/clarify/SKILL.md`

### /start

- `.claude/agents/orchestration/praxis.md`

### /strategy

- `.claude/agents/discovery/strategy.md`

### /tasks

- `.claude/agents/delivery/task-breaker.md`

### /ux

- `.claude/agents/frontend/ux.md`

### /validate

- `.claude/agents/quality/solid-review.md`
- `.claude/agents/architecture/adr-validator.md`
- `.claude/skills/frontend-validate/SKILL.md`
- `.claude/skills/backend-validate/SKILL.md`

### @legacy-analyzer

- `.claude/agents/discovery/codebase-mapper.md`
