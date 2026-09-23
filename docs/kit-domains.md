# Domínios do kit Praxis — o monólito modular

> O kit é organizado como um **monólito modular**: cada domínio é quase um sub-projeto coeso, e o **Praxis** é a camada fina que junta tudo. Os agents vivem em `.claude/agents/<dominio>/`; as skills ficam flat em `.claude/skills/<nome>/` com o campo `domain:` no frontmatter.

## Modelo mental

```
        VOCÊ
         ↕   (100% do tempo)
       PRAXIS        ← único agent com quem você conversa (orquestrador/maestro)
         │  lê o manifesto + a conversa e escolhe o comando certo
         ▼
       SKILL (/discovery, /implement, /validate…)   ← o comando/playbook
         │  quando o trabalho é pesado, dispara…
         ▼
  SUBAGENTES (@discovery, @executor, @check-*, …)   ← trabalhadores isolados
         │  fazem o pesado em janela própria e devolvem o resultado
         ▲
         └──────────►  volta pro Praxis  ──►  Praxis fala com VOCÊ
```

**Praxis = costura · domínios = módulos · subagentes = operários · skills = comandos que os acionam.**

## Os 8 domínios

| Domínio | Responsabilidade | Removível pelo `/setup`? |
|---|---|---|
| **orchestration** | A costura: o agente Praxis, ponto de entrada, modo, setup, adoção | nunca |
| **discovery** | Entender o terreno antes de decidir (novo, legado, negócio) | nunca |
| **product** | Definição de produto: PRD → spec | nunca |
| **architecture** | Decisões estruturais: ADRs e modelagem de domínio | nunca (ddd-estrategico é `optional`) |
| **delivery** | Transformar spec em código: plan → tasks → execute | nunca |
| **quality** | Validação e revisão cross-stack (gates, checklists, review) | nunca |
| **frontend** | Módulo de stack completo: UX, protótipo, design system e seus validadores | pasta inteira se sem frontend |
| **backend** | Módulo de stack completo: scaffolding e seus validadores | pasta inteira se sem backend |
| _utilities_ | Capacidades genéricas, agnósticas de domínio (ex.: docx) | conforme uso |

### Agents por domínio (`.claude/agents/<dominio>/`)

- **orchestration/**: praxis
- **discovery/**: discovery, codebase-mapper, legacy-analyzer, strategy
- **product/**: clarifier, module-detailer, prd-create, prd-validate, prd-decompose, spec-from-prd
- **architecture/**: adr-creator, adr-validator, ddd-estrategico `[optional]`
- **delivery/**: planner, task-breaker, executor
- **quality/**: analyzer, solid-review, spec-review, revalidator
- **frontend/**: ux, design, paper-prototype, ds-foundation, ds-component, check-{design, forms, i18n, react, responsiveness, routing, structure, typescript, ux, ai-cliches, visual-consistency}
- **backend/**: scaffold-aggregate, check-{architecture, ddd, errors, naming, security, tests}

### Skills por domínio (flat, campo `domain:`)

- **orchestration**: praxis, start, mode, setup, adopt
- **discovery**: discovery, strategy, reverse-engineer
- **product**: define, prd-create, prd-validate, prd-decompose, prd-coverage, detail, spec-from-prd
- **architecture**: architect, ddd-estrategico `[optional]`
- **delivery**: implement, plan, tasks, execute, debug, quickfix
- **quality**: validate, revalidate, review, spec-review, analyze, clarify, checklist, frontend-validate, backend-validate
- **frontend**: ux, design, prototype, ds-init, ds-component
- **backend**: backend-scaffold

> **Os módulos de stack são sub-projetos.** `frontend/` e `backend/` contêm tudo da sua stack — construção, design system e validadores. O `/setup` remove o módulo inteiro quando a stack não se aplica. Os 6 domínios de núcleo nunca são removidos.

### Módulos de stack — núcleo agnóstico + adapter (Fase 3)

Os módulos `frontend/` e `backend/` operam com **núcleo agnóstico de stack + adapters plugáveis**. A stack vem do `discovery`/`manifest`, **nunca é assumida**. Adicionar uma nova stack = criar um adapter, sem mexer no núcleo.

No frontend (Fase 3):

- **Conhecimento agnóstico (núcleo)** em `.claude/reference/frontend/`: 9 reference files (motion-design, cognitive-load, personas, patterns, heuristics, register-product, register-brand, anti-patterns, design-system-anatomy).
- **Adapters por stack** em `.claude/reference/frontend/adapter-*.md`: react-vite-shadcn, react-next-shadcn, angular-material, vue-vuetify. Cada um carrega o `stack-profile.json` seed.
- **`stack-profile.json`** (em `docs/design-system/`, no projeto cliente): materializa "o que é token nesta stack" — lido pelo detector para aplicar a regra `tokens/hardcoded-color` agnóstica.
- **Scripts Node** em `.claude/scripts/frontend/`: `detect-cliches.mjs` (detector determinístico de clichês de IA) e `screenshot.mjs` (captura para o loop visual via Playwright dinâmico — degrada gracioso).
- **Gates de intenção→implementação**: `/ux charter` (identidade do produto) → `/ux shape <feature>` (brief da feature) → `/prototype` (mock-gate visual) → `/execute` (com gate enforcement no `@executor`).

## Learnings espelham os domínios

A memória evolutiva (`docs/project/learnings/`) é organizada pelos mesmos eixos: `frontend`, `backend`, `business` (discovery/product), `architecture`, `process` (orchestration/delivery/quality). Cada agent carrega apenas o learning do seu domínio antes de executar.

## Princípio que rege tudo (70/30)

Ver `CLAUDE.md`. **70%** definição/intenção/aprendizado · **30%** implementação/validação. A organização por domínios existe para que a intenção de cada área fique localizável e consumível na hora certa — pré-condição para a fidelidade intenção→implementação.

## Fontes derivadas

- `docs/kit-index.{md,json}` são **gerados** por `node scripts/generate-index.mjs` a partir dos frontmatters. Não edite à mão.
- Contrato skill↔agent: ver `docs/kit-architecture.md`.
