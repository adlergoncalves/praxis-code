# Feature Specification: {Titulo da Feature}

**Feature Branch**: `{NNN}-{nome}`
**Created**: {YYYY-MM-DD}
**Status**: Draft
**Input**: {Origem — ex: "Extracted from PRD: prd-modulo-X.md, FEATURE 1.3"}

> **Loop Engineering (ADR-0007).** Esta spec carrega os blocos de *fechamento de
> intenção* que tornam a execução em loop assertiva: **Escopo IN/OUT**, **Personas**,
> **Regras de Negócio (RN)**, **Decisões Fechadas (gate)**, **Decisões Diferidas** e
> **Armadilhas da Demanda**. O grounding no código (Fatos Confirmados, Módulo de
> Referência) vive no `plan.md`. As fatias verticais + DoD vivem no `tasks.md`.

---

## Escopo (OBRIGATORIO)

- **O que ESTÁ nesta entrega:** {bullets concretos}
- **O que NÃO está (futuro / outra demanda):** {bullets — fronteira explícita do mock/consumo, se houver}
- **Módulo / feature alvo:** {paths — ex: `backend/src/Modules/Xxx` · `frontend/src/features/xxx` · `db/...`}
- **Footprint** (camadas tocadas): `[ ] Domínio/Banco  [ ] API  [ ] RBAC  [ ] Frontend  [ ] E2E`

---

## Personas e Permissões (OBRIGATORIO)

| Persona | Quem é | Pode |
|---|---|---|
| {nome} | {descrição} | {ações permitidas} |

> Detalhe de RBAC (regras `modulo.recurso.acao`, seed, enforcement) vai no `plan.md` se a demanda tocar permissões.

---

## Regras de Negócio (canônicas) (OBRIGATORIO)

> Cada regra **testável**. Numerar `RN-NN`. Distinta de FR: RN é a regra do domínio;
> FR é o requisito de sistema que a implementa.

1. **RN-01** — {regra...}
2. **RN-02** — {...}

---

## Decisões Fechadas (gate) (OBRIGATORIO)

> Saída obrigatória da clarificação. **Toda ambiguidade de negócio resolvida ANTES
> da execução.** Item em aberto aqui = pacote não está pronto (trava o portão
> pré-execução do `/execute`). Substitui o registro solto de "Clarifications".

| # | Decisão | Resolução | Quando |
|---|---|---|---|
| D-01 | {pergunta de negócio} | {resposta canônica} | {YYYY-MM-DD} |

### Decisões Diferidas (se houver)

> Só o que for legitimamente decidir-durante-a-execução. **Sempre** com opções +
> default + critério, para o loop decidir sozinho sem parar.

| # | Decisão | Opções | Default | Critério | Fecha em |
|---|---|---|---|---|---|
| DA-01 | {...} | {A vs B} | {A} | {se ...} | {U_n} |

---

## ⚠️ Armadilhas da Demanda (OBRIGATORIA se houver)

> O conhecimento duro que o loop **não deve redescobrir por bug**. Une dois acervos:
> (a) **Armadilhas ADR** — onde o instinto do dev conflita com uma ADR; (b)
> **Armadilhas do repo** — gotchas de código (puxar de `learnings/` + ADRs do footprint).
> Formato: **Sintoma → Causa → Convenção obrigatória → Referência (`arquivo:linha`)**.

| Sintoma | Causa | Convenção obrigatória | Referência |
|---|---|---|---|
| {instinto/erro} | {por que acontece} | {o que fazer} | {ADR-XXX · arquivo:linha} |

> Se a feature é trivial e não tem armadilhas reais, omitir a tabela e justificar:
> "Nenhuma armadilha aplicável (só leitura simples, sem persistência, sem UI complexa)".
> **Não inventar armadilhas** para preencher.

---

## User Scenarios & Testing (OBRIGATORIO)

### User Story 1 — {Titulo} (Priority: P1)

{Narrativa expandida — contexto, necessidade, valor.}

**Why this priority**: {justificativa de negócio}

**Independent Test**: {como verificar esta US isoladamente, em 1-3 passos manuais}

**Acceptance Scenarios**:

1. **Given** {pre-condicao}, **When** {acao}, **Then** {comportamento}

> Critérios que tocam padrões governados por ADR devem **citar a restrição** (ex:
> "...validado conforme Zod schema (ADR-012)"). Esses cenários viram os testes
> `[B]`/`[F]`/`[E2E]` mapeados no `tasks.md`.

---

## Requirements (OBRIGATORIO)

### Functional Requirements

- **FR-001**: Sistema DEVE {comportamento testavel} {(ref ADR-XXX se aplicável)}

### Key Entities

- **{Entidade}**: {descricao}. Atributos-chave: {lista}

---

## Edge Cases (OBRIGATORIO)

- **O que acontece quando {cenario}?** {comportamento esperado}

---

<!-- Secoes condicionais abaixo — incluir conforme o tipo/footprint da spec -->

## Anatomia da Tela (se UI / Feature de tela)

> Contrato estrutural mínimo da tela (não mockup). Preenchido pelo `/spec-from-prd`.

### Régua de Fidelidade (condicional a protótipo)

- **Classificação do elemento**: `novo + protótipo` | `novo sem protótipo` | `reaproveita tela existente`
- **Barra de entrega**:
  - `novo + protótipo` → **idêntico à fonte de design** (divergiu, não entrega). **Embutir** a referência + valores exatos abaixo.
  - `novo sem protótipo` → conforme o **Design System**.
  - `reaproveita tela existente` → segue a existente (sem re-skin) e **AVISA** se divergir do protótipo.
- **Fonte de design**: {ferramenta de protótipo: link + IDs dos frames | página publicada (Artifact): link | HTML local: caminho | imagem: caminho | DS + memória de design (sem protótipo)}
- **Valores exatos embutidos** (quando a fonte expõe valores — estilos computados da ferramenta, CSS do HTML): {cores, ícones, posições, tipografia, espaçamento}

> A conferência é por **valores** quando a fonte os expõe (ferramenta de design, HTML); fonte só
> em imagem → conferência visual na revisão visual do `/execute`. Sem app rodando nem fonte
> acessível, a fidelidade degrada para verificação estrutural (`check-design`), declarada como
> "auditoria parcial".

## Padrão de Campo (se Form / Modal)

> Referencia o componente de campo do DS uma vez e lista só os campos com tipo, validação e
> notas. Explicita **quando validar** (onBlur, onSubmit, onChange com debounce) e o submit
> (disabled enquanto envia, double submit prevenido, o que acontece após o sucesso).

| Campo | Tipo | Validação | Obrigatório | Notas |
|---|---|---|---|---|
| {campo} | {tipo} | {regra} | {sim/não} | {nota} |

## Microinterações (se UI)

> Referencia o `motion.md` do projeto (não re-especifica duração/easing). Microinteração fora
> do padrão → justificar.

- {elemento + gatilho}: {movimento} — ver `motion.md`

## Success Criteria (opcional)

- **SC-001**: {criterio com metrica concreta}

## Assumptions (opcional)

- **A-001**: {premissa}. Se {condicao falhar}, {fallback}

## Implementation Notes (preenchido durante /execute)

<!-- Esta secao e preenchida automaticamente durante a implementacao (feedback loop) -->
