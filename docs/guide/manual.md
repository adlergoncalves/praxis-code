# Manual de Uso — Praxis

## Índice

1. [O que é o Praxis](#1-o-que-é-o-praxis)
2. [Como iniciar um projeto](#2-como-iniciar-um-projeto)
3. [Pipeline de fases](#3-pipeline-de-fases)
4. [Fase 1 — Discovery](#4-fase-1--discovery)
5. [Fase 2 — Definição](#5-fase-2--definição)
6. [Fase 3 — Arquitetura](#6-fase-3--arquitetura)
7. [Fase 4 — Governança](#7-fase-4--governança)
8. [Fase 5 — Implementação](#8-fase-5--implementação)
9. [Fase 6 — Validação](#9-fase-6--validação)
10. [Fase 7 — Correção e Revalidação](#10-fase-7--correção-e-revalidação)
11. [Módulos disponíveis](#11-módulos-disponíveis)
12. [ADR Templates pré-definidos](#12-adr-templates-pré-definidos)
13. [Referência de skills](#13-referência-de-skills)
14. [Referência de agents](#14-referência-de-agents)
15. [Gestão de contexto e handoff](#15-gestão-de-contexto-e-handoff)
16. [Estrutura de pastas](#16-estrutura-de-pastas)
17. [Cenários de uso](#17-cenários-de-uso)
18. [Dicas e boas práticas](#18-dicas-e-boas-práticas)

---

## 1. O que é o Praxis

O Praxis é um **kit de engenharia assistida por IA** que guia você desde o entendimento de um projeto até a validação do código entregue. Funciona com qualquer stack e suporta 3 linhas de trabalho:

| Linha | Descrição | Entrada |
|-------|-----------|---------|
| **Novo Software** | Construir do zero | `/start` → `/discovery` → `/architect` → `/define` → `/implement` |
| **Modernizar Legado** | Documentar legado e reconstruir | `/start` → `/reverse-engineer` → `/discovery` → ... |
| **Adotar Projeto** | Trazer projeto existente para o kit | `/start` → `/adopt` → usar kit normalmente |

O kit inclui:
- **45 agents** especializados, organizados em 8 domínios (Praxis, Discovery, Planner, Executor, Strategy, UX, engenharia reversa, module detailer, validação, scaffolding e mais)
- **39 skills** de orquestração — a única forma de invocar workflows via `/`
- **13 ADR templates** baseados em boas práticas de mercado
- **4 templates de artefatos** (spec, plan, tasks, checklist)
- **Sistema de learnings** por domínio — o kit aprende e melhora com o uso
- **Team scope** (`--team front|back|db|full`) para trabalho focado por área
- **Hooks de aprendizado** — registram decisões e correções no instante em que acontecem

Tudo roda dentro do **Claude Code** (CLI, VS Code ou desktop app).

---

## 2. Como iniciar um projeto

### Passo 1 — Criar o projeto a partir do template

```bash
# Opção A: Clone direto
git clone <url-do-template> meu-projeto
cd meu-projeto
rm -rf .git && git init

# Opção B: GitHub "Use this template"
# Clique em "Use this template" no GitHub
```

### Passo 2 — Abrir no Claude Code

```bash
# Terminal
claude

# Ou abra no VS Code com a extensão Claude Code
```

### Passo 3 — Rodar o Setup

```
/setup
```

O skill faz perguntas sobre a stack do projeto (frontend, backend, banco, infra) e gera um `CLAUDE.md` personalizado com os módulos corretos ativados.

### Passo 4 — Iniciar pelo ponto de entrada

```
/start
```

O `/start` identifica sua situação (novo, legado, adotar projeto) e guia para o pipeline correto:

- **Novo software** → `/discovery` → `/architect` → `/define` → `/implement`
- **Modernizar legado** → `/reverse-engineer` → `/discovery` → `/architect` → `/define` → `/implement`
- **Adotar projeto existente** → `/adopt` (mapeia, cria ADRs, gera baseline) → usar kit normalmente

### Passo 5 — Seguir o pipeline

```
/discovery     # Entender o projeto
/architect     # Criar ADRs
/define        # Criar PRDs e specs
/implement     # Plan → Tasks → Execute (suporta --team)
/validate      # Checar conformidade (suporta --team)
```

> **Dica**: Use `/clear` entre cada fase para liberar contexto.

### Team Scope

Para trabalho focado em uma área, use `--team`:

```
/implement {spec} --team front    # Só frontend
/implement {spec} --team back     # Só backend
/implement {spec} --team db       # Só banco de dados
/validate --team front            # Valida só frontend
```

Se detectar dependência cross-team, o kit pausa e pergunta como prosseguir.

---

## 3. Pipeline de fases

```
+------------------------------------------------------------------+
|                                                                  |
|  Fase 0 (legados)                                                |
|  /reverse-engineer → Documenta lógica, fluxos, telas, regras    |
|                                                                  |
|  Qualquer momento                                                |
|  /strategy  → Valida ideia, modelo de negócio, decisões         |
|  /ux        → Decisões de experiência do usuário                |
|                                                                  |
|  Fase 1        Fase 2        Fase 3                              |
|  /discovery → /define    → /ddd-estrategico (opcional)          |
|  Entender     PRDs, specs    /architect → ADRs                   |
|                                                                  |
|  Fase 5                      Fase 6        Fase 7                |
|  /plan → /tasks → /execute  /validate  → /revalidate            |
|  Planejar  Quebrar  Codar    Checar        Corrigir              |
|                                                                  |
+------------------------------------------------------------------+
```

Você não precisa seguir todas as fases em ordem. Use o que faz sentido para o seu momento:

- Projeto novo do zero? → Comece pela Fase 1
- Refatorar legado? → Comece pela Fase 0 (`/reverse-engineer`)
- Já tem código e quer validar? → Vá direto para Fase 6
- Quer adicionar uma feature? → Fases 2 + 5 + 6
- Bug rápido? → `/quickfix`
- Bug complexo? → `/debug`

---

## 4. Fase 1 — Discovery

**Skill**: `/discovery`  
**Agent**: `@discovery`

### O que acontece

O agent faz perguntas em 6 etapas:

| Etapa | O que pergunta |
|-------|---------------|
| 1. Natureza | Projeto novo ou legado? |
| 2. Negócio | Qual problema resolve? Quem usa? |
| 3. Stack | Frontend? Backend? Banco? Infra? |
| 4. Time | Quantas pessoas? Senioridade? |
| 5. Restrições | Prazos? Budget? Compliance? |
| 6. Módulos | Quais domínios? Prioridades? |

### Regra fundamental

**O agent NÃO avança se detectar gaps.** Se você responder vagamente, ele pede mais detalhes. Isso é intencional — quanto melhor o discovery, melhores as ADRs e a implementação.

### Output

`docs/project/discovery.md` — documento completo com tudo que foi aprendido.

### Para legados (abordagem documentarista)

Se você apontar para um repositório existente, o discovery usa o `@codebase-mapper` para **mapear o código com linguagem factual** (sem julgamento):
- Estrutura de pastas
- Frameworks e dependências
- Patterns identificados (descritos, não julgados)
- Métricas objetivas (linhas, complexidade, cobertura)

### Hook proativo — /strategy

O `/discovery` detecta automaticamente sinais de risco de negócio (problema vago, persona genérica, modelo ausente) e sugere uma sessão de `/strategy` antes de avançar.

### Quando usar DDD Estratégico

Se o domínio for complexo (4+ módulos, regras de negócio ricas, times paralelos), o `/discovery` sugere automaticamente:

```
/ddd-estrategico
```

Esse agent identifica Bounded Contexts, classifica subdomínios (Core/Supporting/Generic) e propõe um Context Map. Roda **antes do `/architect`** para deixar as ADRs mais precisas.

---

## 5. Fase 2 — Definição

**Skill**: `/define`  
**Sub-skills**: `/prd-create`, `/prd-validate`, `/detail` (opcional), `/prd-decompose`, `/prd-coverage`, `/spec-from-prd`

### Fluxo completo

```
/define
   |
   +-- 1. Briefing do módulo (absorvido no próprio /define)
   |        +-- docs/prds/briefings/briefing-{modulo}.md
   |
   +-- 2. PRD Create → cria PRD estratégico e/ou tático
   |        +-- docs/prds/prd-{nome}-estrategico.md
   |        +-- docs/prds/prd-{nome}.md
   |
   +-- 3. PRD Validate → valida contra template canônico
   |        +-- Relatório: aprovado ou reprovado
   |
   +-- 4. Detail (opcional) → workspace pré-SDD para módulos grandes/ambíguos
   |        +-- docs/prds/{modulo}/ (11+ arquivos canônicos)
   |        +-- Ver ADR-006
   |
   +-- 5. PRD Decompose → quebra em specs independentes
   |        +-- detecta workspace /detail se existir
   |        +-- docs/prds/decomposicoes/decomposicao-{modulo}.md
   |
   +-- 6. Spec from PRD → gera spec técnica por feature
            +-- docs/specs/{NNN}-{nome}/spec.md
```

### Quando usar /detail

O workspace pré-SDD é recomendado quando o módulo atende **>= 2 sinais**:
- >= 3 fronteiras com outros módulos/contextos
- PRD desatualizado ou conflitante com entendimento atual
- Múltiplas partes funcionais independentes (CRUD, importação, visualização, etc.)
- Decisões abertas que não fecham em uma sessão
- Implementação dividida em várias iterações SDD
- Vocabulário novo ou colidindo entre módulos

O workspace cria ~11 arquivos curtos (visão, fronteiras, 8 dimensões por parte funcional, glossário, regras, dúvidas, histórico), rastreia decisões e dúvidas com IDs estáveis (`D-<COD>-##`, `Q-<COD>-##`) e fecha a intenção antes de gerar specs. Método canônico em `docs/adr/0006-workspace-detalhamento-modulo.md`.

### Tipos de PRD

**Estratégico** (para liderança):
- 11 seções obrigatórias
- Foco no "por que": problema, proposta de valor, KPIs
- Formato narrativo

**Tático** (para o dev):
- Hierarquia ÉPICO → FEATURE → USER STORY
- Formato: "Como [persona], quero [ação], para [benefício]"
- Critérios de aceite em tabela: `| Cenário | Comportamento esperado |`

### Usando sub-skills diretamente

```bash
/prd-create pedidos strategic          # PRD estratégico
/prd-create pedidos tactical           # PRD tático
/prd-validate pedidos                  # Valida PRD existente
/detail pedidos                        # init ou continue workspace
/detail pedidos --action freeze        # Encerrar e escolher governança
/prd-decompose pedidos                 # Decompõe em specs (detecta workspace)
/prd-coverage pedidos                  # Ver cobertura
/spec-from-prd prd-pedidos.md FEATURE:1.3   # Spec de feature específica
```

### Formato da spec gerada

**Obrigatório**:
- **Clarifications**: Decisões do PRD como Q&A
- **User Stories**: Com prioridade P1/P2/P3, Given/When/Then
- **Functional Requirements**: FR-001 numerados, testáveis
- **Success Criteria**: Métricas concretas

**Opcional**:
- **Edge Cases**: Cenários de erro e fronteira
- **Assumptions**: Com fallbacks
- **Out of Scope**: Alinhado com PRD

---

## 6. Fase 3 — Arquitetura

**Skill**: `/architect`  
**Agent**: `@adr-creator`

### O que acontece

1. O agent lê o `docs/project/discovery.md`
2. Identifica categorias de decisão necessárias
3. Para cada categoria, propõe o **padrão de mercado** como default
4. Usa os templates de `docs/adr/templates/` como ponto de partida
5. **Questiona decisões incomuns** do usuário

### Comportamento opinativo

O agent segue boas práticas como baseline. Exemplos de questionamentos:

| Você propõe | Agent questiona |
|-------------|----------------|
| Redux | "Zustand é mais adotado para projetos novos — menos boilerplate. Tem motivo para Redux?" |
| onChange validation | "onChange causa UX ruim. O padrão é onBlur. Quer manter?" |
| AutoMapper | "AutoMapper usa reflection e esconde bugs. Extension methods são mais seguras." |
| Atomic Design | "Atomic Design não é o padrão — feature-first é mais adotado." |
| localStorage tokens | "HttpOnly cookies são mais seguros. Qual o motivo?" |

**Se você tiver uma boa justificativa** → o agent aceita e documenta na ADR com seção "Divergência do Padrão de Mercado".

**Se a justificativa for fraca** → o agent recomenda a alternativa padrão.

### Output

- ADRs em `docs/adr/NNNN-titulo.md`
- `docs/adr/0000-adr-index.md` atualizado
- `docs/project/constitution.md` com princípios consolidados

### Formato de uma ADR

```markdown
# ADR-0001: Clean Architecture 4 Camadas

## Status
Accepted

## Contexto
{Por que essa decisão é necessária}

## Decisão
{O que foi decidido}

## Alternativas Consideradas
{Opções com pros/contras}

## Consequências
### Positivas / ### Negativas

## Regras para Validação          ← SEÇÃO CRÍTICA
- PROIBIDO: Domain importando Infrastructure
- OBRIGATÓRIO: Interface de Repository em Domain
- PREFERIDO: Extension methods para mapeamento
```

A seção **"Regras para Validação"** é o que os agents de checagem leem. Cada regra é classificada como:

| Tipo | Significado | Se violado |
|------|------------|-----------|
| **PROIBIDO** | Pattern que NÃO deve existir | ERRO |
| **OBRIGATÓRIO** | Pattern que DEVE existir | ERRO |
| **PREFERIDO** | Recomendação | AVISO |

---

## 7. Fase 4 — Governança

Essa fase é **automática** — não tem comando.

Quando você cria ADRs na Fase 3, os agents de validação da Fase 6 já passam a usar essas regras. A "governança" é o conjunto de ADRs aceitas + a constitution.

---

## 8. Fase 5 — Implementação

**Skill principal**: `/implement {spec}`  
**Sub-skills granulares**: `/plan`, `/tasks`, `/execute`  
**Skills auxiliares**: `/clarify`, `/analyze`, `/checklist`

A Fase 5 é composta por 3 sub-skills independentes que podem ser invocados separadamente. Cada um requer **validação do usuário** antes de avançar para o próximo.

### 5a — Planejamento Técnico (`/plan`)

**Skill**: `/plan {spec}`

O agent lê a spec + ADRs e gera:
- `plan.md` — Plano técnico (Technical Context, design decisions)
- `data-model.md` — Entidades e relacionamentos
- `contracts/` — Contratos de API
- `quickstart.md` — Guia de setup local

**O usuário revisa o plan antes de prosseguir.**

### 5b — Quebra em Tasks (`/tasks`)

**Skill**: `/tasks {spec}`

Gera `tasks.md` com formato disciplinado:

```
- [ ] [T001] [P] [US1] Criar componente de listagem — src/features/orders/components/OrderList.tsx
```

| Marcador | Significado |
|----------|------------|
| `T001` | ID sequencial |
| `[P]` | Paralelizável (pode rodar junto com outras `[P]`) |
| `[US1]` | Mapeado à user story 1 (P1) |

**Unidade = fatia vertical** (U0…Un, 1 fatia = 1 User Story): cada fatia atravessa as camadas
para um comportamento completo, com critério de PRONTO file-level e verificação manual (1-3
passos). Fundação (U0) é exceção declarada. As tasks horizontais (`[T00N]`) viram sub-tasks
DENTRO da fatia. (Loop Engineering, ADR-0007.)

**O usuário revisa as fatias (e o grafo de dependências) antes de prosseguir.**

### 5c — Execução em loop (`/execute`)

**Skill**: `/execute {spec} [--auto [N]]`

- Roda o **portão pré-execução** e verifica branch antes de começar
- **Loop por fatia**: implementa uma fatia → roda os gates → **conserta até verde** (micro-loop)
- Test-first quando aplicável (RED→GREEN); **nunca marca DONE com gate vermelho**
- Marca a fatia **DONE no Loop Log** (o tasks.md é a fonte única — sem STATUS.md concorrente)
- Apresenta o **relatório de verificação** e **PARA** para revisão humana (checkpoint).
  `--auto [N]` encadeia N fatias com guardrails (teto, sem-progresso, BLOCKED)
- Quando encontra divergências, atualiza a spec com "Implementation Notes"

### Usando /implement como orquestrador

O `/implement` executa `/plan` → `/tasks` → `/execute` em sequência, pedindo validação entre cada etapa.

### Hook proativo — /spec-review

O `/implement` verifica automaticamente se a spec tem os campos mínimos. Se detectar gaps, sugere:

```
/spec-review {feature}
```

Resultado: `APROVADA`, `APROVADA COM RESSALVAS` ou `BLOQUEADA`. Em modo lite, essa verificação é ignorada.

### Quality gates durante a implementação

```bash
/spec-review docs/specs/001-pedidos/spec.md  # Validar spec antes de implementar
/clarify docs/specs/001-pedidos/spec.md       # Detectar ambiguidades na spec
/analyze 001-pedidos                           # Consistência spec <-> plan <-> tasks
/checklist 001-pedidos ux                      # Checklist de UX
/checklist 001-pedidos security                # Checklist de segurança
```

#### /clarify — Taxonomia de 9 categorias

O agent detecta ambiguidades em 9 categorias:

1. Escopo funcional e comportamento
2. Domínio e modelo de dados
3. Interação e fluxo UX
4. Atributos de qualidade não-funcionais
5. Integração e dependências externas
6. Edge cases e tratamento de falhas
7. Restrições e trade-offs
8. Terminologia e consistência
9. Sinais de completude

Faz máx 5 perguntas por sessão, priorizadas por **(Impacto × Incerteza)**.

#### /analyze — 6 passes de detecção

1. **Duplicação** — Requisitos ou tasks repetidos
2. **Ambiguidade** — Adjetivos vagos ("rápido", "seguro")
3. **Sub-especificação** — Objetos referenciados mas não definidos
4. **Constitution** — Violações dos princípios do projeto
5. **Coverage gaps** — Requisitos sem tasks correspondentes
6. **Inconsistência** — Termos usados de forma diferente

#### /checklist — "Testes unitários para texto"

Gera checklists com 9 dimensões de qualidade: completude, clareza, consistência, mensurabilidade, cobertura de cenários, edge cases, NFRs, dependências, ambiguidades.

---

## 9. Fase 6 — Validação

**Skill**: `/validate [escopo]`  
**Sub-skills**: `/frontend-validate`, `/backend-validate`

### Escopos

```bash
/validate geral           # Todo o projeto
/validate pedidos          # Módulo/feature específico
/validate alteracoes       # Só arquivos modificados (git diff)
```

### Perfis de validação

| Perfil | O que executa | Quando usar |
|--------|--------------|-------------|
| **minimal** | Apenas ADR validator | Check rápido de conformidade |
| **standard** (default) | ADR + SOLID + agents da stack | Validação do dia a dia |
| **full** | Todos os agents disponíveis | Antes de release |

```bash
/validate geral              # usa perfil standard
/validate geral minimal      # só ADR validator
/validate geral full         # todos os agents
```

### O que executa (perfil standard)

| Agent | O que valida | Sempre? |
|-------|-------------|---------|
| `@solid-review` | Princípios SOLID | Sim |
| `@adr-validator` | Regras de TODAS as ADRs | Sim |
| `@check-structure` | Estrutura frontend | Se tem frontend |
| `@check-typescript` | TypeScript strict | Se tem frontend |
| `@check-react` | Patterns React | Se tem frontend |
| `@check-forms` | Formulários | Se tem frontend |
| `@check-i18n` | Internacionalização | Se tem frontend |
| `@check-routing` | Rotas | Se tem frontend |
| `@check-responsiveness` | Responsividade | Se tem frontend |
| `@check-design` | Design System | Se tem frontend |
| `@check-ux` | UX patterns | Se tem frontend |
| `@check-architecture` | Camadas | Se tem backend |
| `@check-ddd` | DDD patterns | Se tem backend |
| `@check-naming` | Naming conventions | Se tem backend |
| `@check-tests` | Testes | Se tem backend |
| `@check-errors` | Error handling | Se tem backend |
| `@check-security` | Segurança | Se tem backend |

### Validação sequencial (frontend e backend)

O `/frontend-validate` e o `/backend-validate` executam os agents **um de cada vez**. Ao concluir cada agent, o skill sugere o próximo. Isso permite corrigir problemas de um agent antes de rodar o próximo.

### Como funciona o ADR Validator

O `@adr-validator` é **dinâmico** — não tem regras hardcoded. Ele:

1. Lê TODAS as ADRs em `docs/adr/` com status "Accepted"
2. Extrai a seção "Regras para Validação" de cada uma
3. Para cada regra PROIBIDO: busca no código → se achar = ERRO
4. Para cada regra OBRIGATÓRIO: busca no código → se NÃO achar = ERRO
5. Para cada regra PREFERIDO: busca no código → se NÃO achar = AVISO

Isso significa que **qualquer ADR que você criar** será automaticamente validada.

### Formato do relatório

```markdown
# Relatório de Validação — pedidos

**Data**: 2026-04-02
**Arquivos analisados**: 47

## Resumo

| Severidade | Quantidade |
|------------|-----------|
| ERRO | 3 |
| AVISO | 7 |
| OK | 12 |

## Violações

### ADR-0001: Clean Architecture

- [ ] **ERRO** `src/Domain/OrderService.cs:15` — Viola PROIBIDO: "Domain importando Infrastructure"
  - **Como resolver**: Mover dependência para Application layer

### ADR-0005: TypeScript Strict

- [ ] **AVISO** `src/features/orders/api.ts:42` — Não segue PREFERIDO: "usar unknown ao invés de any"
  - **Como resolver**: Trocar `any` por `unknown` e adicionar type guard
```

O relatório é salvo em `docs/validation-reports/`.

---

## 10. Fase 7 — Correção e Revalidação

**Skill**: `/revalidate [caminho-do-relatorio]`  
**Agent**: `@revalidator`

### O que acontece

1. **Passada 1** — Lê o relatório e identifica checkboxes desmarcados `- [ ]`
   - Re-executa APENAS os agents responsáveis por esses itens
   - Atualiza: corrigido ou ainda pendente

2. **Passada 2** — Detecta regressões
   - Verifica se as correções não quebraram algo em outros arquivos
   - Reporta novas violações como "Regressão"

### Aceitação gradual de dívida técnica

O `/revalidate` suporta marcadores `[ACCEPTED]` para dívida técnica conhecida e aceita conscientemente:

```markdown
- [ACCEPTED] **AVISO** `src/utils/legacy.ts:10` — Não segue PREFERIDO: "usar unknown"
  - **Justificativa**: Código legado, será refatorado na sprint 12
```

Itens marcados com `[ACCEPTED]` não são re-checados nas próximas passadas.

### Ciclo típico

```
/validate → corrigir código → /revalidate → corrigir → /revalidate → tudo OK
```

---

## 11. Módulos disponíveis

O kit é **modular** — você usa só o que precisa.

### Core (sempre ativo)

| Agent | Função |
|-------|--------|
| `@discovery` | Entende o projeto |
| `@codebase-mapper` | Documentação factual de codebases legadas |
| `@strategy` | Estrategista de negócio — avalia ideias, prioriza, discute modelo |
| `@ux` | Especialista em UX — fluxos, componentes, specs, patterns de interface |
| `@adr-creator` | Cria ADRs |
| `@adr-validator` | Valida contra ADRs |
| `@solid-review` | Análise SOLID |
| `@spec-review` | Valida spec antes da implementação |
| `@revalidator` | Revalidação cirúrgica |

### Optional

| Agent | Função |
|-------|--------|
| `@ddd-estrategico` | DDD estratégico (Bounded Contexts, Context Map) — domínios complexos |

### Docs (sempre ativo)

| Agent | Função |
|-------|--------|
| `@module-detailer` | Conduz workspace pré-SDD (ADR-006) |

### Frontend (se o projeto tem frontend web)

10 agents de validação: structure, typescript, react, forms, i18n, routing, responsiveness, design, ux, security-frontend.

### Backend (se o projeto tem backend OO)

6 agents de validação: architecture, ddd, naming, tests, errors, security.  
Agents de scaffolding: aggregate.

---

## 12. ADR Templates pré-definidos

Em `docs/adr/templates/` estão 11 ADRs baseadas em boas práticas:

### Universal (3)

| Template | Regra principal |
|----------|----------------|
| SOLID Principles | SRP (200 linhas/classe), complexity max 10 |
| Naming Conventions | PascalCase, camelCase, UPPER_SNAKE |
| Cyclomatic Complexity | Máx 10 (warn 15), nesting máx 3 |

### Backend Patterns (4)

| Template | Regra principal |
|----------|----------------|
| Clean Architecture | 4 camadas, regras de dependência |
| DDD Aggregates | Aggregates, Entities, Value Objects |
| Exception Propagation | Propagação e tratamento de exceções |
| Unit Testing Strategy | Estratégia e cobertura de testes |

### Frontend Patterns (4)

| Template | Regra principal |
|----------|----------------|
| Feature-First Structure | Organização por feature, não por tipo |
| Forms Stack | Stack de formulários (validação, estado) |
| i18n Lazy Loading | Internacionalização com carregamento lazy |
| Loading Strategy | Estratégia de loading (skeleton, suspense) |

O `/architect` usa esses templates como ponto de partida e customiza com as suas respostas.

---

## 13. Referência de skills

Todas as interações com o pipeline são feitas via skills (invocados com `/`).

### Pipeline principal

| Skill | Fase | O que faz |
|-------|------|-----------|
| `/start` | — | Ponto de entrada — identifica linha e guia o pipeline |
| `/setup` | — | Setup interativo — pergunta stack, módulos, gera CLAUDE.md |
| `/strategy` | 0.5 | Estrategista de negócio — avalia ideias, prioriza, modelo de negócio |
| `/ux` | 0.5 | Especialista em UX — fluxos, componentes, specs, patterns de interface |
| `/reverse-engineer` | 0 | Engenharia reversa completa de legado (lógica, fluxos, telas) |
| `/adopt` | 1 | Adota projeto existente para o kit sem modificar código |
| `/discovery` | 1 | Entendimento completo do projeto |
| `/define` | 2 | Orquestra PRD workflow completo |
| `/ddd-estrategico` | 3 | Modelagem de domínio — Bounded Contexts, Context Map (opcional) |
| `/architect` | 3 | Cria ADRs interativamente |
| `/spec-review` | 5 | Valida spec antes de implementar |
| `/implement` | 5 | Orquestra Plan + Tasks + Execute |
| `/plan` | 5a | Planejamento técnico (gera plan.md) |
| `/tasks` | 5b | Quebra plan em fatias verticais (U0…Un = User Stories) com contrato + DoD + BDD |
| `/execute` | 5c | Executa em loop por fatia (micro-loop até verde, checkpoint, `--auto`) |
| `/validate` | 6 | Validação de conformidade |
| `/revalidate` | 7 | Revalidação cirúrgica |

### PRD workflow

| Skill | O que faz |
|-------|-----------|
| `/prd-create` | Cria PRD estratégico ou tático |
| `/prd-validate` | Valida PRD contra template canônico |
| `/detail` | Workspace pré-SDD para módulos grandes/ambíguos (opcional — ADR-006) |
| `/prd-decompose` | Decompõe PRD em specs (detecta workspace `/detail` se existir) |
| `/prd-coverage` | Cobertura PRD → specs |
| `/spec-from-prd` | Gera spec técnica de feature do PRD |

### Quality gates

| Skill | O que faz |
|-------|-----------|
| `/spec-review` | Valida spec — estrutura, critérios, ADRs, learnings |
| `/clarify` | Detecta ambiguidades (9 categorias) |
| `/analyze` | Consistência spec <-> plan <-> tasks |
| `/checklist` | Quality gates ("testes unitários para texto") |

### Validação por stack

| Skill | O que faz |
|-------|-----------|
| `/frontend-validate` | Validação sequencial dos 10 agents frontend |
| `/backend-validate` | Validação sequencial dos 6 agents backend |
| `/backend-scaffold` | Gera Aggregate Root + testes |

### Utilitários

| Skill | O que faz |
|-------|-----------|
| `/quickfix` | Escape hatch para trabalho trivial (bugfix, typo, CSS) |
| `/debug` | Investigação de bugs: entender, pesquisar, causa raiz, fix |
| `/review` | Self-review antes de commit (git diff vs ADRs e SOLID) |

---

## 14. Referência de agents

### Chamada direta

Você pode chamar qualquer agent diretamente com `@nome`:

```
@discovery          # Inicia discovery
@codebase-mapper    # Mapeia codebase legada (factual, sem julgamento)
@adr-creator        # Cria ADRs
@solid-review src/  # Review SOLID de uma pasta
@adr-validator      # Valida contra ADRs
```

### Agents de scaffolding

```
@scaffold-aggregate Order --properties "Number:string, Total:decimal"
```

---

## 15. Gestão de contexto e handoff

### /clear entre fases

O Claude Code tem um limite de contexto. Para manter a qualidade das respostas, **use `/clear` entre fases do pipeline**. Cada skill recomenda quando limpar o contexto:

```
/discovery        # Fase 1
/clear            # Limpar contexto
/architect        # Fase 3
/clear            # Limpar contexto
/define           # Fase 2
/clear            # Limpar contexto
/plan             # Fase 5a
/clear            # Limpar contexto
/tasks            # Fase 5b
/clear            # Limpar contexto
/execute          # Fase 5c
```

**Por que isso importa**: Se você rodar todas as fases sem limpar, o contexto acumula e o Claude perde qualidade nas respostas finais. Cada fase gera artefatos em disco que a próxima fase lê — o contexto da conversa não precisa carregar tudo.

### Handoff entre sessões (state.md)

O arquivo `docs/project/state.md` rastreia a fase atual e o progresso do projeto entre sessões. Quando você fecha o Claude Code e abre novamente, o agent lê o `state.md` para saber onde parou.

O `state.md` é atualizado automaticamente pelos skills e contém:
- Fase atual do pipeline
- Último artefato gerado
- Próxima ação recomendada
- Itens pendentes

---

## 16. Estrutura de pastas

```
meu-projeto/
+-- .claude/
|   +-- agents/
|   |   +-- orchestration/  # 1 agent (praxis)
|   |   +-- discovery/      # 4 agents (discovery, strategy, codebase-mapper, legacy-analyzer)
|   |   +-- product/        # 6 agents (prd-*, spec-from-prd, clarifier, module-detailer)
|   |   +-- architecture/   # 3 agents (adr-creator, adr-validator, ddd-estrategico)
|   |   +-- delivery/       # 3 agents (planner, task-breaker, executor)
|   |   +-- quality/        # 4 agents (spec-review, analyzer, solid-review, revalidator)
|   |   +-- frontend/       # 17 agents (ux, design, DS, prototype + 12 de validação)
|   |   +-- backend/        # 7 agents (6 de validação + scaffold-aggregate)
|   +-- skills/          # 39 skills de orquestração
|   +-- hooks/           # hooks de aprendizado
|   +-- scripts/         # gates determinísticos
|   +-- settings.json    # permissões + registro dos hooks
|
+-- docs/
|   +-- adr/             # ADRs do projeto
|   |   +-- templates/   # 13 templates pré-definidos
|   |   +-- 0000-adr-index.md
|   +-- prds/            # PRDs
|   |   +-- briefings/   # Briefings por módulo
|   |   +-- decomposicoes/
|   +-- specs/           # Specs técnicas
|   |   +-- NNN-nome/
|   |       +-- spec.md
|   |       +-- plan.md
|   |       +-- tasks.md
|   |       +-- data-model.md
|   |       +-- contracts/
|   |       +-- checklists/
|   +-- validation-reports/  # Relatórios de validação
|   +-- project/
|   |   +-- discovery.md     # Output do /discovery
|   |   +-- constitution.md  # Princípios (Fase 3)
|   |   +-- glossary.md      # Linguagem ubíqua
|   |   +-- manifest.md      # Estado vivo do pipeline
|   |   +-- learnings/       # Memória evolutiva por domínio
|   |       +-- frontend-learnings.md
|   |       +-- backend-learnings.md
|   |       +-- business-learnings.md
|   |       +-- architecture-learnings.md
|   |       +-- process-learnings.md
|   +-- guide/               # Documentação e tutoriais
|   +-- templates/           # Templates de artefatos
|
+-- CLAUDE.md            # Instruções para Claude Code
+-- README.md
```

---

## 17. Cenários de uso

### Cenário 1 — Projeto novo do zero

```
/setup                                  # Configurar stack e módulos
/clear
/discovery                              # Entender o projeto
/clear
/architect                              # Definir ADRs
/clear
/define                                 # Criar PRDs e specs
/clear
/plan docs/specs/001-feature/           # Planejamento técnico
/clear
/tasks docs/specs/001-feature/          # Quebrar em tasks
/clear
/execute docs/specs/001-feature/        # Implementar
/clear
/validate                               # Validar
/revalidate                             # Corrigir e re-checar
```

### Cenário 2 — Refatorar sistema legado

```
/reverse-engineer {caminho-do-legado}   # Fase 0: Documentar o legado completamente
/clear
/discovery                              # Fase 1: Discovery do NOVO projeto
/clear
/architect                              # Fase 3: ADRs para o novo sistema
/clear
/define                                 # Fase 2: PRDs por módulo
/clear
/plan                                   # Planejar módulo
/tasks                                  # Quebrar em tasks
/execute                                # Implementar módulo
/clear
/validate                               # Validar cada módulo
```

### Cenário 3 — Adicionar feature a projeto existente

```
/prd-create meu-modulo tactical
/spec-from-prd prd-meu-modulo.md FEATURE:2.1
/clear
/plan docs/specs/005-feature/
/tasks docs/specs/005-feature/
/execute docs/specs/005-feature/
/clear
/validate alteracoes                    # Valida só o que mudou
```

### Cenário 3b — Módulo grande/ambíguo (workspace pré-SDD)

```
/prd-create meu-modulo tactical
/prd-validate meu-modulo
/clear
/detail meu-modulo                      # Scaffolda workspace canônico
# ... sessões iterativas de detalhamento ...
/detail meu-modulo --action freeze      # Congela e escolhe governança
/clear
/prd-decompose meu-modulo               # Detecta workspace e usa como fonte
/spec-from-prd ...                      # Uma spec por parte funcional
```

### Cenário 4 — Só validar código existente

```
/architect                              # Criar ADRs primeiro (sem ADRs, só SOLID funciona)
/clear
/validate geral                         # Validar tudo
/revalidate                             # Após correções
```

### Cenário 5 — Gerar scaffolding backend

```
/backend-scaffold aggregate Order --properties "Number:string, Total:decimal"
```

### Cenário 6 — Bug rápido (sem cerimônia)

```
/quickfix                               # Descreva o bug, corrija, valide
```

### Cenário 7 — Bug complexo (investigação)

```
/debug                                  # Investigar causa raiz
/clear
/review                                 # Self-review antes de commit
```

### Cenário 8 — Self-review antes de commit

```
/review                                 # Analisa git diff vs ADRs e SOLID
```

---

## 18. Dicas e boas práticas

### Sobre Setup
- **Rode `/setup` antes de tudo** se for um projeto novo. Ele configura o CLAUDE.md correto para a sua stack.

### Sobre Contexto
- **Use `/clear` entre fases.** Cada fase gera artefatos em disco — a próxima fase os lê. O contexto da conversa não precisa acumular.
- Se o Claude parecer "esquecendo" coisas, o contexto provavelmente está saturado. Limpe e recomece a fase.

### Sobre Discovery
- **Não apresse o discovery.** Quanto mais completo, melhores as ADRs e specs.
- Para legados, o `@codebase-mapper` descreve o código sem julgamento — ideal para base neutra.

### Sobre ADRs
- **Crie ADRs antes de implementar.** Sem ADRs, o `/validate` só executa SOLID review.
- A seção "Regras para Validação" é o que os agents leem — capriche nela.
- Se divergir do padrão de mercado, documente o "por que" na ADR.

### Sobre PRDs
- Comece pelo estratégico (visão) e depois crie o tático (backlog).
- Cada User Story deve ter no mínimo 3 critérios de aceite concretos.
- Use `/prd-coverage` para acompanhar o progresso.

### Sobre Implementação
- Rode `/clarify` antes de `/plan` se a spec tiver ambiguidades.
- Use `/analyze` para verificar se spec, plan e tasks estão consistentes.
- Rode `/checklist` para security e UX antes de mergear.
- **Valide cada sub-fase** (`/plan` → `/tasks` → `/execute`) antes de avançar.

### Sobre Validação
- Use `alteracoes` como escopo para validar só o que mudou (mais rápido).
- Use perfil `minimal` para checks rápidos, `full` para releases.
- O `/revalidate` é cirúrgico — re-checa só os itens pendentes.
- Marque itens como `[ACCEPTED]` para dívida técnica aceita conscientemente.

### Sobre Utilitários
- `/quickfix` é para trabalho trivial — bugfix, typo, ajuste de CSS. Sem cerimônia.
- `/debug` é para bugs complexos — investiga causa raiz antes de corrigir.
- `/review` é um self-review leve antes de commit — mais rápido que `/validate`.

### Sobre Strategy
- Use `/strategy` **antes de entrar no pipeline técnico** para validar se a ideia faz sentido de negócio.
- O `/discovery`, `/define` e `/implement` sugerem `/strategy` automaticamente quando detectam sinais de risco.
- A sugestão é **não bloqueante** — você decide se quer a sessão ou não.

### Sobre UX
- Use `/ux` **antes de implementar qualquer tela** para validar o fluxo e decidir os componentes certos.
- Use `/ux componente {caso}` para decidir entre stepper vs. formulário, modal vs. drawer, toast vs. dialog.
- Use `/ux spec {modulo}` para revisar uma spec antes do `/implement` — garante que estados de loading, erro e vazio estão mapeados.
- Use `/ux interface {descricao}` para feedback honesto sobre uma tela já implementada.

### Sobre Learnings
- Os learnings são a **memória evolutiva** do kit — quanto mais o projeto avança, mais preciso o kit fica.
- Agents carregam **apenas o arquivo do seu domínio** — economizando tokens e contexto.
- O kit usa os learnings para evitar erros repetidos e sugerir patterns já validados.

### Sobre o kit
- O `.claude/` é parte do projeto — commite junto com o código.
- `settings.local.json` é pessoal — não commite (já está no .gitignore).
- Adapte os agents conforme necessidade — são markdown, fáceis de editar.
