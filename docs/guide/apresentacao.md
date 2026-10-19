# Praxis — Kit de Engenharia com IA

## O problema que esse kit resolve

Todo dev já passou por isso: você começa a implementar, aí no meio do caminho descobre que a spec estava ambígua, a arquitetura não foi decidida, o colega fez algo diferente do combinado — e aí a "feature simples" vira retrabalho.

O Praxis resolve isso com processo. Não burocracia — processo. Cada fase tem uma razão de existir. Cada artefato alimenta o próximo. O contexto não se perde entre sessões, entre pessoas nem entre fases.

---

## O pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Fase 0 (só para legados)                                           │
│  /reverse-engineer ──► Documenta lógica, fluxos, telas, regras     │
│                                                                     │
│  Qualquer momento                                                   │
│  /strategy  ──► Valida ideia, modelo de negócio, premissas         │
│  /ux        ──► Decisões de experiência do usuário                 │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                       │
│  │ Fase 1   │──►│ Fase 2   │──►│ Fase 3   │                       │
│  │/discovery│   │/architect│   │ /define  │                       │
│  │          │   │          │   │          │                       │
│  │Entender  │   │ADRs      │   │PRDs      │                       │
│  │o projeto │   │Decisões  │   │Specs     │                       │
│  └──────────┘   └──────────┘   └──────────┘                       │
│                                     │                              │
│                                     ▼                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                       │
│  │ Fase 7   │◄──│ Fase 6   │◄──│ Fase 5   │                       │
│  │/revalidate│  │/validate │   │/implement│                       │
│  │          │   │          │   │          │                       │
│  │Corrigir e│   │Checar    │   │Plan      │                       │
│  │re-checar │   │conformid.│   │Tasks     │                       │
│  └──────────┘   └──────────┘   │Execute   │                       │
│                                └──────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

Você não precisa usar todas as fases em todo projeto. Projeto novo do zero? Fase 1 em diante. Refatorar legado? Começa na Fase 0. Já tem código e quer validar? Vai direto pra Fase 6. Feature pontual? Fases 3 + 5 + 6.

---

## Fase 0 — Engenharia reversa de legado

**Quando usar**: só em projetos existentes que você quer entender antes de tocar.

O problema clássico de legado: ninguém sabe exatamente o que o sistema faz. As regras de negócio estão na cabeça das pessoas ou espalhadas no código. Mexer sem entender é arriscado.

O `/reverse-engineer` documenta tudo isso antes de qualquer mudança: lógica de negócio, fluxos, telas, regras, dependências. O output é suficiente para entender o sistema sem precisar ler o código original.

**Artefato**: `docs/project/legacy/` + `docs/project/codebase-map.md` — documentação completa do legado.

---

## Fase 1 — Discovery

**Skill**: `/discovery`

O discovery responde a pergunta mais simples e mais ignorada do desenvolvimento: *o que exatamente estamos construindo e por quê?*

Sem esse entendimento claro, cada fase seguinte acumula imprecisão. A spec reflete mal o negócio. A arquitetura não serve o domínio. A implementação resolve o problema errado.

O agent conduz uma entrevista estruturada em 6 etapas: natureza do projeto, problema de negócio, stack, time, restrições, módulos e prioridades. Ele não avança se detectar respostas vagas — isso é intencional.

Para projetos com domínio complexo (4+ módulos, regras ricas), o `/discovery` sugere automaticamente um `/ddd-estrategico` antes de seguir — para mapear Bounded Contexts e evitar decisões de arquitetura prematuras.

**Artefato**: `docs/project/discovery.md`

---

## Fase 2 — Arquitetura

**Skill**: `/architect`

Decisões de arquitetura tomadas sem documentação são uma dívida técnica silenciosa. Meses depois, ninguém lembra por que aquela escolha foi feita, e o time começa a divergir.

O `/architect` cria ADRs (Architecture Decision Records) de forma interativa. Para cada categoria de decisão, ele propõe o padrão de mercado como default e questiona quando você diverge:

> "Zustand é mais adotado para projetos novos — menos boilerplate. Tem motivo para Redux?"  
> "onChange causa UX ruim. O padrão é onBlur. Quer manter?"

Se você tiver uma boa justificativa, a ADR documenta. Se for fraca, o agent recomenda a alternativa padrão.

A seção **"Regras para Validação"** em cada ADR é o que os agents de checagem leem na Fase 6:

| Tipo | Significado | Violação |
|------|-------------|---------|
| `PROIBIDO` | Pattern que NÃO deve existir | ERRO |
| `OBRIGATÓRIO` | Pattern que DEVE existir | ERRO |
| `PREFERIDO` | Recomendação | AVISO |

**Artefatos**: `docs/adr/NNNN-titulo.md`, `docs/project/constitution.md`

---

## Fase 3 — Definição

**Skill**: `/define`  
**Sub-skills**: `/prd-create`, `/prd-validate`, `/prd-decompose`, `/spec-from-prd`

Aqui o entendimento do negócio vira especificação técnica. O fluxo completo é:

```
Briefing do módulo
    │
    ▼
PRD estratégico (visão, problema, valor)
    │
    ▼
PRD tático (épicos → features → user stories + critérios de aceite)
    │
    ▼
Validação do PRD (aprovado / reprovado com gaps apontados)
    │
    ▼
Decomposição em specs independentes
    │
    ▼
Spec técnica por feature (requirements, edge cases, success criteria)
```

Para módulos grandes ou ambíguos — com muitas fronteiras, decisões em aberto, múltiplas partes funcionais — existe o `/detail`. Ele cria um workspace pré-SDD com ~11 arquivos curtos e propósito único, rastreando decisões e dúvidas com IDs estáveis antes de gerar specs. Evita o erro clássico de forçar uma spec monolítica antes de entender bem o escopo.

**Artefatos**: `docs/prds/`, `docs/specs/NNN-feature/spec.md`

---

## Fase 5 — Implementação

**Skill principal**: `/implement {spec}`  
**Sub-skills**: `/plan`, `/tasks`, `/execute`

A fase de implementação tem três etapas com validação do usuário entre cada uma:

### 5a — Planejamento técnico (`/plan`)

Lê a spec + ADRs e gera o plano técnico: contexto, decisões, modelo de dados, contratos de API. Nenhuma linha de código ainda — só o mapa do que será construído.

O usuário revisa e aprova antes de avançar.

**Artefatos**: `plan.md`, `data-model.md`, `contracts/`

### 5b — Quebra em tasks (`/tasks`)

Transforma o plano em tasks disciplinadas com IDs, mapeamento a user stories e marcação de paralelismo:

```
- [ ] [T001] [P] [US1] Criar componente de listagem — src/features/orders/components/OrderList.tsx
- [ ] [T002] [P] [US1] Criar hook de dados — src/features/orders/hooks/useOrders.ts
- [ ] [T003] [US2] Integrar com API — depende de T001, T002
```

A unidade é a **fatia vertical** (U0…Un, 1 fatia = 1 User Story): atravessa as camadas para um
comportamento completo, com critério de PRONTO e verificação manual. As tasks `[P]` viram
sub-tasks dentro da fatia. Fundação (U0) é exceção declarada. (Loop Engineering, ADR-0007.)

O usuário revisa as fatias e aprova antes de avançar.

**Artefato**: `tasks.md` (inclui o Loop Log — fonte única de estado)

### 5c — Execução em loop (`/execute`)

Roda **em loop por fatia**: implementa uma fatia → roda os gates → **conserta até verde**
(micro-loop) → verificador independente → marca **DONE no Loop Log** → segue para a próxima
fatia. Roda autônomo depois que você aprova o pacote no portão final do `/tasks` (guia de
validação + métricas de prontidão) e só para no realmente bloqueante. Quando encontra
divergências, atualiza a spec com "Implementation Notes" — mantendo rastreabilidade mesmo
quando a realidade muda o plano.

---

## Fase 6 — Validação

**Skill**: `/validate [escopo]`

Esta é a fase que fecha o ciclo. O que foi decidido nas ADRs é o que é cobrado aqui.

O `/validate` orquestra até 21 agents especializados dependendo da stack:

**Frontend (13 agents)**: estrutura, TypeScript, React, formulários, i18n, roteamento, responsividade, design system, UX patterns, segurança client-side, Web Interface Guidelines, clichês de IA e consistência visual.

**Backend (6 agents)**: arquitetura em camadas, DDD, naming, testes, error handling, segurança.

**Universal (2 agents)**: SOLID review, ADR validator.

O ADR validator é dinâmico — não tem regras hardcoded. Ele lê todas as ADRs do projeto com status "Accepted", extrai as regras de cada uma e verifica o código. Qualquer ADR que você criar passa a ser cobrada automaticamente.

```bash
/validate geral          # todo o projeto
/validate alteracoes     # só o que mudou (git diff)
/validate geral --profile full     # todos os agents (antes de release)
```

**Artefato**: `docs/validation-reports/YYYY-MM-DD-modulo.md`

---

## Fase 7 — Revalidação

**Skill**: `/revalidate [relatorio]`

Depois de corrigir os problemas apontados no relatório, você não precisa rodar tudo de novo. O `/revalidate` é cirúrgico:

1. Lê o relatório e identifica checkboxes desmarcados `- [ ]`
2. Re-executa **apenas** os agents responsaveis por esses itens
3. Detecta regressões — se uma correção quebrou algo em outro lugar, aparece aqui

Para dívida técnica aceita conscientemente, você pode marcar `[ACCEPTED]` com justificativa. Esses itens não voltam nos próximos ciclos.

```
/validate → corrigir código → /revalidate → corrigir → /revalidate → tudo OK
```

---

## Os agentes transversais

Dois agentes podem ser chamados em qualquer momento do pipeline:

### /strategy — Estrategista de negócio

Antes de entrar no pipeline técnico, vale a pena perguntar: *essa feature faz sentido de negócio?*

O `/strategy` avalia ideias, questiona premissas, prioriza o que construir primeiro, discute modelos de monetização. O `/discovery`, `/define` e `/implement` sugerem automaticamente uma sessão quando detectam sinais de risco (problema vago, feature sem critério de sucesso, escopo divergindo do plano). A sugestão nunca é bloqueante.

### /ux — Especialista em experiência do usuário

Antes de implementar qualquer tela, o `/ux` valida fluxos, decide componentes (stepper vs. formulário, modal vs. drawer, toast vs. dialog), mapeia estados (loading, erro, vazio, sucesso) e aponta problemas com sinceridade. Se a interface não está boa, ele diz o motivo e propõe a alternativa.

---

## O kit aprende com o projeto

O Praxis não é uma ferramenta externa — vive dentro do repositório e evolui com ele.

**Manifesto central** (`docs/project/manifest.md`): estado vivo do projeto — stack, ADRs, specs, fase atual, artefatos. Todo agent lê antes de executar. Toda skill atualiza ao concluir.

**Learnings por domínio** (`docs/project/learnings/`): cinco arquivos especializados acumulam descobertas ao longo do tempo.

| Arquivo | O que acumula |
|---------|--------------|
| `frontend-learnings.md` | Patterns de UI, componentes, Design System |
| `backend-learnings.md` | Patterns de API, domínio, testes |
| `business-learnings.md` | Regras de negócio, produto, personas |
| `architecture-learnings.md` | Decisões arquiteturais, ADR patterns |
| `process-learnings.md` | O que funciona (ou não) no processo |

Agents carregam apenas o arquivo relevante ao seu escopo — sem desperdiçar contexto. Quanto mais o projeto avança, mais preciso o kit fica. O que foi aprendido num ciclo alimenta o próximo. Erros não se repetem. Padrões validados são reutilizados.

---

## Dois modos para momentos diferentes

**Lite** — para MVPs, provas de conceito e times menores. Discovery rápido, ADRs com defaults, implementação a partir de descrição livre, validação essencial. Menos cerimônia, mais velocidade.

**Full** — para produtos em crescimento. Pipeline completo com specs formais, ADRs interativas, validação rigorosa com relatório detalhado.

Use `/mode` para alternar a qualquer momento. Todos os artefatos existentes são preservados.

## Workspace pré-SDD para módulos grandes e ambíguos

Nem todo módulo está pronto para virar spec direto. Quando há múltiplas fronteiras com outros módulos, decisões em aberto, vocabulário ambíguo ou implementação que será dividida em várias iterações, forçar uma spec monolítica gera retrabalho.

`/detail` cria um workspace canônico (método formalizado na ADR-006) que antecede o Spec-Driven Development. Uma pasta com arquivos curtos e propósito único — visão geral, fronteiras, 8 dimensões por parte funcional, glossário, regras, dúvidas rastreadas com IDs estáveis, histórico por sessão.

O workspace fecha a intenção 100% antes de gerar specs. Decisões recebem ID (`D-<MOD>-##`), dúvidas são rastreadas e migradas quando decididas, descartes ficam documentados para não voltarem seis meses depois. Ao congelar, o `/prd-decompose` detecta o workspace automaticamente e gera specs uma por parte — entrada limpa para o SDD.

Método portável, agnóstico a produto e stack. Útil em qualquer projeto que use documentação Markdown versionada e pratique SDD.

---

## Para qualquer momento do produto

| Situação | Por onde entrar |
|----------|----------------|
| Projeto novo | `/start` → `/discovery` → `/architect` → `/define` → `/implement` |
| Modernizar legado | `/reverse-engineer` → `/discovery` → `/architect` → `/define` → `/implement` |
| Adotar projeto existente | `/adopt` (mapeia, cria ADRs, gera baseline) → pipeline normal |
| Feature nova | `/prd-create` → `/spec-from-prd` → `/implement` → `/validate` |
| Bug rápido | `/quickfix` |
| Bug complexo | `/debug` → `/review` |
| Só validar código existente | `/architect` (cria ADRs) → `/validate` |

---

## Compatibilidade

Qualquer stack — frontend, backend, mobile, fullstack.  
Roda no Claude Code CLI, VS Code e Claude Desktop.
