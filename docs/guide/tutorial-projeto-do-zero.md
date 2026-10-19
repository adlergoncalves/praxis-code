# Tutorial: Construindo um Projeto do Zero

Guia passo a passo para usar o Praxis desde a concepção até a entrega de um projeto novo.

---

## Pré-requisitos

- Claude Code instalado (CLI, VS Code ou desktop app)
- Template clonado e inicializado:

```bash
git clone <url-do-template> meu-projeto
cd meu-projeto
rm -rf .git && git init
```

---

## Passo 0 — Estratégia e UX (opcional, mas recomendado)

Antes de entrar no pipeline técnico, vale perguntar: *a ideia faz sentido de negócio?*

```
/strategy
```

Sessão conversacional que avalia o problema, questiona premissas, prioriza o que construir primeiro e discute modelos de monetização. O `/start` sugere automaticamente quando detecta problema vago ou persona genérica.

Para projetos com interface, use também para mapear a experiência do usuário antes de qualquer especificação:

```
/ux
```

O `/ux` decide navegação, patterns de interface e jornadas. Feito agora, evita retrabalho de spec e implementação por decisões de UX tardias.

---

## Passo 1 — Instalar e montar o kit

```bash
npx degit adlergoncalves/praxis-code/seed meu-projeto && cd meu-projeto && git init
```

No Claude Code, `/start`: ele monta o núcleo do kit e chama o `/setup`, que configura o kit para a sua stack:

- Tem frontend? Qual framework?
- Tem backend? Qual linguagem?
- Qual banco de dados?
- Infra e deploy?

**Resultado**: o `CLAUDE.md` com a seção do projeto preenchida e só os módulos da sua stack no projeto. Se o projeto só tem frontend, os agents de backend nem chegam — e vice-versa.

```
/clear
```

---

## Passo 2 — Discovery (Fase 1)

```
/discovery
```

O discovery responde a pergunta mais ignorada do desenvolvimento: *o que exatamente estamos construindo e por quê?* Sem esse entendimento claro, cada fase seguinte acumula imprecisão.

O agent conduz uma entrevista estruturada em 6 etapas:

| Etapa | O que pergunta |
|-------|---------------|
| 1. Natureza | Que tipo de projeto é? |
| 2. Negócio | Qual problema resolve? Quem são os usuários? |
| 3. Stack | Tecnologias, frameworks, infraestrutura |
| 4. Time | Quantas pessoas? Nível de experiência? |
| 5. Restrições | Prazos, budget, compliance, integração |
| 6. Módulos | Domínios do sistema, prioridades |

Não apresse esta fase. O agent não avança se detectar lacunas nas respostas. Se o domínio for complexo (4+ módulos, regras ricas), ele sugere `/ddd-estrategico` antes do `/architect`.

**Resultado**: `docs/project/discovery.md`

```
/clear
```

---

## Passo 2b — DDD Estratégico (opcional — domínios complexos)

Se o discovery revelou 4+ módulos interdependentes ou regras de negócio ricas:

```
/ddd-estrategico
```

Identifica Bounded Contexts, classifica subdomínios (Core/Supporting/Generic) e propõe Context Map. Roda **antes do `/architect`** para que as ADRs sejam mais precisas.

```
/clear
```

---

## Passo 3 — Arquitetura (Fase 2)

```
/architect
```

Decisões de arquitetura tomadas sem documentação são dívida técnica silenciosa. Meses depois, ninguém lembra o motivo, e o time começa a divergir.

O agent lê o discovery e propõe ADRs baseadas em boas práticas de mercado. Para cada decisão, propõe o padrão como default e questiona quando você diverge:

| Você propõe | Agent questiona |
|-------------|----------------|
| Redux | "Zustand é mais adotado. Tem motivo para Redux?" |
| localStorage para tokens | "HttpOnly cookies são mais seguros. Qual o motivo?" |
| Atomic Design | "Feature-first é mais adotado. Quer manter?" |

Se você tiver justificativa válida, ele aceita e documenta. Se não, recomenda a alternativa padrão.

**Resultado**:
- ADRs em `docs/adr/NNNN-titulo.md`
- `docs/project/constitution.md` com princípios consolidados
- Cada ADR tem uma seção "Regras para Validação" que os agents usam automaticamente na Fase 6

```
/clear
```

---

## Passo 4 — Definição (Fase 3)

```
/define
```

O entendimento do negócio vira especificação técnica. O fluxo completo:

1. **Briefing** — Absorve contexto do módulo
2. **PRD Create** — Cria PRD estratégico (visão) e/ou tático (backlog)
3. **PRD Validate** — Valida contra template canônico
4. **PRD Decompose** — Quebra em specs independentes
5. **Spec from PRD** — Gera spec técnica por feature

**Tipos de PRD**:
- **Estratégico**: Visão, proposta de valor, KPIs — para liderança
- **Tático**: Épico → Feature → User Story — para o dev

**Usando sub-skills diretamente** (para controle granular):

```bash
/prd-create pedidos strategic    # PRD estratégico
/prd-create pedidos tactical     # PRD tático
/prd-validate pedidos            # Valida
/prd-decompose pedidos           # Decompõe em specs
/prd-coverage pedidos            # Acompanha cobertura
/spec-from-prd prd-pedidos.md FEATURE:1.3   # Spec de uma feature
```

**Resultado**: PRDs em `docs/prds/` e specs em `docs/specs/NNN-nome/spec.md`

```
/clear
```

---

## Passo 4a — Detalhamento pré-SDD (opcional — módulos grandes ou ambíguos)

Nem todo módulo está pronto para virar spec direto. Se o módulo atender **>= 2 sinais**:

- >= 3 fronteiras com outros módulos
- PRD desatualizado ou conflitante
- Múltiplas partes funcionais independentes (CRUD, importação, visualização, etc.)
- Decisões abertas que não fecham em uma sessão
- Implementação dividida em várias iterações SDD
- Vocabulário novo ou colidindo com outros módulos

Rode antes do `/prd-decompose`:

```
/detail meu-modulo                      # Scaffolda workspace canônico
# ... iterações de preenchimento ...
/detail meu-modulo --action freeze      # Congela e escolhe governança
```

O workspace cria ~11 arquivos curtos com propósito único, rastreando decisões e dúvidas com IDs estáveis. Ao congelar, o `/prd-decompose` detecta o workspace automaticamente e gera specs por parte funcional. Método canônico em `docs/adr/0006-workspace-detalhamento-modulo.md`.

```
/clear
```

---

## Passo 4b — Revisão de UX da Spec (recomendado para features com interface)

Antes de planejar, valide se a spec faz sentido do ponto de vista do usuário:

```
/ux spec {modulo}
```

O `/ux` questiona: o usuário tem todas as informações necessárias? Os estados de loading, erro e vazio estão mapeados? O fluxo é lógico? Pode revelar gaps que o `/spec-review` não cobre.

---

## Passo 4c — Validação da Spec (recomendado)

```
/spec-review docs/specs/001-feature/spec.md
```

Verifica estrutura técnica, critérios de aceite, edge cases e alinhamento com as ADRs. Resultado: `APROVADA`, `APROVADA COM RESSALVAS` ou `BLOQUEADA`. O `/implement` também sugere isso automaticamente se detectar campos obrigatórios ausentes.

---

## Passo 5 — Planejamento Técnico (Fase 5a)

```
/plan docs/specs/001-feature/
```

O agent lê a spec + ADRs e gera o mapa do que será construído — sem escrever uma linha de código ainda:
- **plan.md** — Plano técnico com decisões de design
- **data-model.md** — Entidades e relacionamentos
- **contracts/** — Contratos de API (se aplicável)

**Você revisa e aprova antes de avançar.** O pipeline não avança automaticamente.

```
/clear
```

---

## Passo 6 — Quebra em Tasks (Fase 5b)

```
/tasks docs/specs/001-feature/
```

Transforma o plano em tasks disciplinadas com IDs, mapeamento a user stories e marcação de paralelismo:

```
- [ ] [T001] [P] [US1] Criar componente de listagem — src/features/orders/OrderList.tsx
- [ ] [T002] [P] [US1] Criar hook de dados — src/features/orders/useOrders.ts
- [ ] [T003] [US2] Integrar com API — depende de T001, T002
```

| Marcador | Significado |
|----------|------------|
| `T001` | ID sequencial |
| `[P]` | Paralelizável (pode rodar junto com outras `[P]`) |
| `[US1]` | Mapeado à user story 1 |

Unidade = **fatia vertical** (U0…Un, 1 fatia = 1 User Story), com critério de PRONTO file-level
e verificação manual; as tasks `[T00N]` viram sub-tasks dentro da fatia. Fundação (U0) é
exceção declarada. (Loop Engineering, ADR-0007.)

**Quality gates antes de aprovar o pacote** — ambiguidade se fecha aqui, nunca com o loop rodando (o portão final do `/tasks` já roda a análise de consistência; estes são os avulsos):

```bash
/spec-review docs/specs/001-feature/spec.md  # Validar spec
/clarify docs/specs/001-feature/spec.md       # Detectar ambiguidades
/analyze 001-feature                           # Consistência spec <-> plan <-> tasks
/checklist 001-feature security                # Checklist de segurança
/checklist 001-feature ux                      # Checklist de UX
```

**Revise as fatias e o grafo de dependências antes de prosseguir.**

```
/clear
```

---

## Passo 7 — Execução em loop (Fase 5c)

```
/execute docs/specs/001-feature/
```

O agent executa **em loop por fatia**: implementa uma fatia → roda os gates → **conserta até
verde** (micro-loop) → verificador independente → marca **DONE no Loop Log** → segue para a
próxima fatia, sem pedir ok entre elas: a conversa aconteceu antes, no portão final do `/tasks`.
Só para no realmente bloqueante (`--checkpoint` se você quiser revisar fatia a fatia). Quando encontra
divergências entre o planejado e o possível, atualiza a spec com "Implementation Notes" —
mantendo rastreabilidade mesmo quando a realidade muda o plano.

```
/clear
```

---

## Passo 8 — Validação (Fase 6)

```
/validate
```

O que foi decidido nas ADRs é o que é cobrado aqui. O sistema roda agents de validação conforme sua stack:

- **Sempre**: SOLID review + ADR validator (valida contra todas as ADRs aceitas)
- **Frontend**: structure, typescript, react, forms, i18n, routing, responsiveness, design, ux
- **Backend**: architecture, ddd, naming, tests, errors, security

**Perfis disponíveis**:

```bash
/validate geral              # Perfil standard (default)
/validate geral --profile minimal      # Só ADR validator — check rápido
/validate geral --profile full         # Todos os agents — antes de release
```

**Resultado**: Relatório em `docs/validation-reports/` com ERROs, AVISOs e itens OK.

---

## Passo 9 — Correção e Revalidação (Fase 7)

Corrija os problemas apontados no relatório, depois:

```
/revalidate
```

O agent lê o relatório, re-checa **apenas** os itens pendentes e detecta regressões (correções que quebraram outra coisa).

**Ciclo típico**:

```
/validate → corrigir código → /revalidate → corrigir → /revalidate → tudo OK
```

**Dívida técnica aceita conscientemente**:

```markdown
- [ACCEPTED] **AVISO** `src/utils/helper.ts:10` — Não segue PREFERIDO: "usar unknown"
  - **Justificativa**: Será refatorado na sprint 12
```

Itens `[ACCEPTED]` não são re-checados nas próximas passadas.

---

## Fluxo Completo

```
/strategy       → (opcional) Valida ideia de negócio
/ux             → (opcional) Mapeia jornadas e patterns de interface
/start          → Monta o kit; o /setup configura stack e módulos
/clear
/discovery      → Entende o projeto
/clear
/ddd-estrategico → (opcional) Modelagem de domínio — domínios complexos
/clear
/architect      → Define ADRs
/clear
/define         → Cria PRDs e specs
/detail         → (opcional) Workspace pré-SDD para módulos grandes/ambíguos
/ux spec        → (recomendado) Revisão de UX da spec
/spec-review    → Valida spec antes de implementar
/clear
/plan           → Planejamento técnico
/clear
/tasks          → Quebra em tasks
/clear
/execute        → Implementa
/clear
/validate       → Valida conformidade
/revalidate     → Corrige e re-checa
```

> **Regra de ouro**: Use `/clear` entre cada fase. Os artefatos ficam em disco — a próxima fase os lê automaticamente. Não precisa carregar tudo no contexto.

---

## Dicas para Projetos Novos

1. **Não pule o discovery** — ele alimenta todas as fases seguintes. Uma spec ruim começa num discovery vago.
2. **Crie ADRs antes de implementar** — sem ADRs, o `/validate` só roda SOLID review.
3. **Valide cada sub-fase** antes de avançar: `/plan` → revisa → `/tasks` → revisa → `/execute`.
4. **Use `/prd-coverage`** para acompanhar quanto do PRD já foi transformado em specs.
5. **Comece pelo PRD estratégico** (visão geral) antes do tático (backlog detalhado).
6. **Use `/checklist`** antes de mergear — gera checklists de qualidade para security, UX, etc.
7. **Use `/ux` antes de cada tela** — decide componentes, mapeia estados e valida o fluxo antes de codar.
