---
description: "Transforma feature do PRD em spec tecnica detalhada para o dev. Le PRD, ADRs e specs existentes."
user-invocable: true
---

# /spec-from-prd

Transforma features de PRDs em specs tecnicas prontas para implementacao. Le PRD, ADRs e specs existentes para gerar uma spec completa, numerada e rastreavel.

**Idioma**: Toda comunicacao e specs geradas em **Portugues Brasileiro (PT-BR)**.

## Input

`/spec-from-prd {prd} FEATURE:{X.Y}`

Exemplo: `/spec-from-prd prd-pessoa.md FEATURE:1.3`

## Dependencias automaticas

1. **PRD tatico (OBRIGATORIO)**
2. PRD estrategico (melhora qualidade da spec)
3. ADRs relevantes: `docs/adr/`
4. Glossario: `docs/project/glossary.md`
5. Specs existentes (referencia de formato): `docs/specs/*/spec.md`
6. Learnings: `docs/project/learnings/business-learnings.md`
7. **Gate report**: `docs/prds/gate-reports/gate-{modulo}-*.md` (se existe — usar o **mais recente**). Importante para:
   - **Decisoes em aberto** do Gate viram linhas `[REQUER RESPOSTA DO PM]` em Decisoes Fechadas (ex: "Pagamento adiado — gateway sera escolhido depois")
   - **Dependencias futuras** sinalizam aspectos da spec que dependem de modulos nao definidos ainda
8. **Ancora de design**: `docs/project/ux-charter.md` (`## Register`) ou `docs/design-system/system.md` (Register, Direcao, Dominio) — o que existir
9. **Motion grammar**: `docs/project/motion.md` (se existe) — microinteracoes referenciaveis

## Workflow

1. **Carrega dependencias** (PRD + ADRs + glossario + learnings + ancora de design + motion.md + Constitution Page Shell)
2. **Le TODAS as ADRs do projeto** — necessario para gerar a secao "Armadilhas ADR" com base real, nao generica
3. **Determina tipo da spec** inferindo do PRD: `UI` | `Feature` | `Form` | `Modal` | `Backend-only` | `Integration` | `Scaffold`. O tipo decide quais secoes condicionais incluir:
   - `UI` ou `Feature` com tela → inclui **Anatomia da Tela**
   - `Form` ou `Modal` → inclui **Padrao de Campo**
   - `Backend-only` / `Integration` → pula Anatomia e Padrao de Campo
4. Determina numero da spec (proximo disponivel em `docs/specs/`) e nome (kebab-case)
5. Gera spec completa seguindo o formato abaixo (spec grande: pode despachar o `@spec-from-prd`, que segue este mesmo formato, para gerar em janela propria)
6. Cria checklist de rastreabilidade PRD → spec
7. Salva em `docs/specs/{NNN}-{nome}/`

## Formato da Spec

### Header

```markdown
# Feature Specification: {Titulo}

**Feature Branch**: `{NNN}-{nome}`
**Created**: {YYYY-MM-DD}
**Status**: Draft
**Input**: Extracted from PRD: {prd}, FEATURE {X.Y} — {titulo}
```

### Escopo (OBRIGATORIO)

Preencher o bloco **Escopo** do template: o que ESTÁ na entrega, o que NÃO está
(fronteira do mock/consumo, se houver), módulo/feature alvo (paths) e o **footprint**
(camadas tocadas — domínio/banco, API, RBAC, frontend, e2e). O footprint decide quais
secoes condicionais entram (Anatomia da Tela só se toca frontend, etc).

### Personas e Permissões (OBRIGATORIO)

Tabela `Persona | Quem é | Pode`. Derivar do PRD e das ADRs de RBAC. O detalhe de
enforcement (regras `modulo.recurso.acao`, seed) vai no `plan.md`, não aqui.

### Regras de Negócio (canônicas) (OBRIGATORIO)

Numerar `RN-NN`, cada uma **testável**. Distinta de FR: RN é a regra do domínio
(linguagem do PRD); FR é o requisito de sistema que a implementa. Toda RN deve ter
≥1 Acceptance Scenario que a cubra.

### Decisões Fechadas (gate) (OBRIGATORIO — Loop Engineering, ADR-0007)

Substitui o registro solto de "Clarifications". Converter as decisões do PRD + ADRs +
respostas do PM em uma **tabela de decisões fechadas**: `# | Decisão | Resolução | Quando`.

**Esta seção é um GATE**: toda ambiguidade de **negócio** deve estar resolvida aqui
antes de a demanda entrar em execução. Ambiguidade aberta:
- Se tem dono → registrar como `[REQUER RESPOSTA DO PM]` e sugerir `/clarify`.
- **Não inventar regra de negócio** para fechar o gate.

#### Decisões Diferidas (se houver)

Só decisões legitimamente **decidir-durante-a-execução**. **Sempre** com `Opções +
Default + Critério + Fecha em U_n`, para o loop decidir sozinho sem parar. Decisão de
negócio NUNCA é diferida — só design/implementação.

### ⚠️ Armadilhas da Demanda (OBRIGATORIA se houver)

Antes de avancar para User Stories, o agente le **todas as ADRs do projeto** + os
`learnings/` do dominio e identifica onde o caminho natural de implementacao desta
feature vai **conflitar** com uma ADR/convenção. Une dois acervos: **Armadilhas ADR**
(instinto × restrição da ADR) e **Armadilhas do repo** (gotchas de código vindos dos
learnings). Listar 2-5 reais — nao genericas. Formato preferido: **Sintoma → Causa →
Convenção obrigatória → Referência**.

**O que e uma armadilha ADR**:
- Um ponto onde o "instinto" do dev vai numa direcao que a ADR proibe
- Listar formato: "instinto natural → restricao da ADR → caminho correto"

**Exemplos** (do projeto fictício):

```markdown
- **Cache de dados do banco**: o instinto e usar `useState` para guardar a lista carregada. ADR-007 PROIBE `useState` para dados do banco — usar `useQuery` (TanStack) que ja resolve cache, refetch e revalidacao.
- **Validacao de formulario**: o instinto e fazer `if/else` inline no submit. ADR-012 OBRIGA Zod schema com `zodResolver` no `react-hook-form` — validar campo a campo no submit nao e suficiente.
- **Strings de UI**: o instinto e escrever `"Confirmar"` direto no JSX. ADR-009 OBRIGA externalizacao via `t('common.confirm')` — toda string user-facing passa pelo i18n.
- **Soft delete**: o instinto e usar `DELETE FROM` ou `repo.delete()`. ADR-015 PROIBE delete fisico — usar metodo `markAsDeleted()` que seta `Deleted=true` + audit fields.
```

**Regra de geracao**:
- Ler **todas** as ADRs em `docs/adr/` antes de gerar esta secao
- Identificar quais sao **relevantes a esta feature** (filtrar por dominio: frontend/backend/db/cross)
- Para cada ADR relevante, perguntar: "qual o caminho natural que um dev iniciante seguiria? a ADR proibe esse caminho? entao isso e uma armadilha"
- Se a feature nao tem armadilhas reais (ex: feature trivial), pode omitir a secao — mas justificar: "Nenhuma armadilha ADR aplicavel a esta feature (so leitura simples, sem persistencia, sem UI complexa)"
- **Nao inventar armadilhas** apenas para preencher a secao

**Acoplamento com Acceptance Scenarios**: criterios de aceite que envolvem padroes governados por ADR devem **citar a restricao** explicitamente.

Exemplo:
```markdown
- ❌ Ruim: "Given o usuario clica em Salvar, When os campos sao validos, Then o registro e criado"
- ✅ Bom: "Given o usuario clica em Salvar, When os campos sao validos conforme Zod schema (ADR-012), Then o registro e criado via repository com `markAsDeleted()` desativavel (ADR-015)"
```

### User Stories (por prioridade P1/P2/P3)

Para cada US do PRD:

- **Narrativa expandida** — contexto, necessidade, valor
- **Why this priority** — justificativa de negocio
- **Independent Test** — como testar isoladamente
- **Acceptance Scenarios** — Given/When/Then
  - Cada linha da tabela do PRD → 1 GWT
  - Preservar **mensagens de erro exatas** do PRD

### Edge Cases

Cenarios de erro, infraestrutura, permissao, concorrencia.

### Functional Requirements

- FR-001, FR-002... numerados, **testaveis**, com referencia a ADRs
- **FRs obrigatorios** (se aplicavel conforme ADRs do projeto):
  - **i18n**: strings externalizadas
  - **Acessibilidade**: WCAG 2.1 AA
  - **Auditoria**: campos automaticos (CreatedAt, CreatedBy, etc.)
  - **Soft delete**: nenhum registro apagado fisicamente

### Anatomia da Tela (se spec for UI / Feature de tela)

**Aplica-se a**: specs do tipo `UI`, `Feature` que envolve renderizar uma tela. Pular se a spec e backend-only, integracao, scaffold de API, etc.

E o **contrato estrutural minimo** da tela — nao um mockup detalhado. Garante consistencia visual entre telas mesmo sem prototipo, alinhada com o Page Shell da Constitution.

**Estrutura obrigatoria** (preencher cada campo):

```markdown
- **Tipo de tela**: `auth` | `pagina interna` | `modal` | `form-page` | `dashboard` | `lista` | `detalhe`
- **Referencia ao Page Shell**: segue `Page Shell` da Constitution? (sim/nao + justificativa se nao)

#### Header da tela
- **Titulo**: {string ou regra para deriva-lo, ex: "Pedido #{numero}"}
- **Subtitulo** (opcional): {string ou regra, ex: "Criado em {data}"}
- **Acao primaria**: {label do botao, ex: "Confirmar pedido"} — alinhada conforme Page Shell
- **Acoes secundarias** (se houver): {labels}, posicao: {esquerda do CTA primario | menu overflow}

#### Corpo da tela
- **Layout principal**: {1 coluna | 2 colunas | grid | bento | lista | tabela}
- **Densidade**: {compacta | normal | confortavel} — coerente com a ancora de design (atributo X)
- **Pattern principal**: {pattern do catalogo /ux, ex: "Inline Edit", "Optimistic UI", "Skeleton + lista"}

#### Estados
- **Loading**: {pattern, ex: "Skeleton com 3 cards"}
- **Empty**: {ilustracao + CTA, descricao}
- **Erro**: {pattern, ex: "Banner persistente no topo + retry"}
- **Sucesso/concluido**: {pattern, ex: "Toast com Undo"}

#### Rodape ou acoes flutuantes (se aplicavel)
- {Posicao, conteudo}
```

**Regras**:
- **Nao** especificar cores, fontes ou tamanhos exatos — isso vem do DS via tokens. Aqui e apenas estrutura
- **Sim** referenciar componentes do DS pelo nome se ja existem (`<Button variant="default">`, `<Card>`, `<Modal>`)
- Se a tela tem desvio do Page Shell, **justificar** (ex: "tela de checkout usa layout customizado porque exige foco — Page Shell padrao subverte a hierarquia desejada")

#### Régua de Fidelidade (Loop Engineering, ADR-0007 — condicional a protótipo)

Para cada elemento de tela, classificar e definir a barra de entrega:

| Caso | Regra | Barra |
|---|---|---|
| **Novo + tem protótipo** | idêntico à fonte de design | divergiu → NÃO entrega |
| **Novo + sem protótipo** | seguir o Design System | conformidade DS |
| **Reaproveita tela existente** | seguir a existente (sem re-skin); **AVISA** se ela divergir do protótipo | igual à existente |

- **Fonte de design**: ferramenta de protótipo (link + IDs dos frames) · página publicada
  (Artifact) · HTML local · imagem · ou DS + memória de design (sem protótipo).
- Quando há protótipo de elemento novo, **embutir na spec** a referência + os **valores
  exatos** que a fonte expõe (cores, cor de ícone, posição, tipografia, espaçamento) — para
  o gate de fidelidade comparar sem depender da ferramenta conectada na hora. Fonte só em
  imagem → conferência visual na revisão visual do `/execute`.
- **Degradação honesta**: se o projeto não tem ferramenta de protótipo / Playwright,
  a fidelidade vira verificação estrutural (`check-design`), declarada como
  "auditoria parcial". Não prometer pixel-perfect sem o tooling.

### Padrao de Campo (se spec for Form / Modal)

**Aplica-se a**: specs que envolvem formulario (Form, Modal com inputs, multi-step wizard). Pular se a spec nao tem formulario.

**Nao descrever cada campo individualmente** — referenciar o componente de campo do Design System e listar apenas os campos com suas validacoes.

**Estrutura**:

```markdown
#### Componente de campo
- **Padrao**: `<FormField label htmlFor> <Input id aria-describedby> <FormMessage role="alert" />` — anatomia herdada do DS, nao reinventada por spec
- **Componente DS de referencia**: `@/design-system/components/form-field` (ou equivalente do projeto)

#### Campos da feature

| Campo | Tipo | Validacao (Zod) | Required | Notas |
|---|---|---|---|---|
| email | `email` | `z.string().email("Email invalido")` | sim | autocomplete=email |
| telefone | `tel` | `z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato (XX) XXXX-XXXX")` | nao | aplicar mask |
| CPF | `text` | `z.string().refine(isCPF, "CPF invalido")` | sim | aplicar mask 000.000.000-00 |

#### Comportamento de validacao
- **Quando validar**: `onBlur` (campo perde foco) — coerente com a ADR de forms do projeto (ADR-XXX)
- **Mensagem de erro**: visivel abaixo do campo via `<FormMessage>` — herdado do DS
- **Estado de erro visual**: borda vermelha + icone — herdado do DS, nao reinventar

#### Submit
- **Botao primario**: `<Button type="submit" disabled={isSubmitting}>` — disabled enquanto envia
- **Loading state**: substituir label por `<Spinner /> {loadingLabel}`
- **Double submit**: prevenir via `disabled={isSubmitting}` (ja resolvido pelo padrao)
- **Apos sucesso**: {acao: redirect | toast | modal close}
```

**Regras**:
- **Nao** repetir a anatomia `<Label> + <Input> + <ErrorMessage>` em cada campo — referenciar o `<FormField>` do DS uma vez
- **Sim** listar os campos com seus tipos, validacoes (Zod ou equivalente) e notas especificas
- **Sim** explicitar o **quando validar** (onBlur, onSubmit, onChange com debounce) — diferente por contexto

### Microinteracoes (se UI / Feature)

Se a ancora de design e o motion.md existem no projeto, listar microinteracoes principais da tela referenciando o motion.md:

```markdown
- **Botao primario click**: scale 0.97 + bg darken — fast + ease-out (ver motion.md)
- **Modal open**: fade + slide up 8px — normal + ease-out (ver motion.md)
- **Toast de sucesso**: slide up + check icon bounce — normal + bounce (ver motion.md)
```

Nao re-especificar duracoes/easings — apenas referenciar `motion.md`. Se a tela tem microinteracao **fora do padrao**, justificar.

### Aplicacao da ancora de design

Se ha ancora de design (Charter ou memoria de design), citar 1-2 atributos da personalidade ou da Direcao que esta tela materializa:

```markdown
- **Atributo "Preciso"**: hierarquia tipografica com peso (nao tamanho); spacing apertado
- **Atributo "Polido"**: animacoes ease-out 250ms; sombras sutis em cards de dados
```

### Key Entities

Atributos, relacionamentos.

### Success Criteria

SC-001, SC-002... com metricas concretas.

### Assumptions

Premissas com fallbacks.

### Out of Scope

Alinhado com PRD.

## Output

- `docs/specs/{NNN}-{nome}/spec.md`
- `docs/specs/{NNN}-{nome}/checklists/requirements.md` (rastreabilidade PRD → spec)

## Regras

- **NAO inventar dados** — se PRD nao documenta, marcar como `[REQUER RESPOSTA DO PM]`
- **NAO inventar regra de negocio** — ambiguidade de negocio vira `[REQUER RESPOSTA DO PM]` em Decisoes Fechadas, nunca chute
- **NAO incluir Fatos Confirmados / Modulo de Referencia** (grounding no codigo) — isso e papel de `/plan` (Loop Engineering, ADR-0007). **Excecao**: nomes de componentes do DS ja existentes (`<Button>`, `<Modal>`) podem ser citados em Anatomia da Tela e Padrao de Campo para garantir consistencia
- **NAO deixar secoes vazias** — cada secao deve ter conteudo substantivo
- **Secoes OBRIGATORIAS sempre**: Escopo (IN/OUT + footprint), Personas e Permissoes, Regras de Negocio (RN), **Decisoes Fechadas (gate)**, User Stories, Functional Requirements, Edge Cases
- **Secao "Decisoes Diferidas" e OBRIGATORIA se houver** decisao de design para decidir-durante-execucao — sempre com Opcoes + Default + Criterio + Fecha em U_n
- **Secao "⚠️ Armadilhas da Demanda" e OBRIGATORIA se houver** — so pode ser omitida se justificado (feature trivial). Nao inventar armadilhas para preencher
- **Secao "Anatomia da Tela" (com Régua de Fidelidade) e OBRIGATORIA** se tipo da spec envolve renderizar tela (`UI`, `Feature` com UI). Pular se backend-only
- **Secao "Padrao de Campo" e OBRIGATORIA** se spec envolve formulario. Pular caso contrario
- Se ha ambiguidades de negocio nao resolvidas (Decisoes Fechadas com `[REQUER RESPOSTA DO PM]`), sugerir `/clarify` antes de avancar para `/plan`

## Gestao de Contexto

Ao concluir a spec, **recomende `/clear`** antes de avancar. A spec esta salva em `docs/specs/{NNN}-{nome}/`.

## Handoffs

- → `/clear` (limpar contexto apos gerar spec)
- → `/clarify` (se ambiguidades detectadas)
- → `/spec-review` (validar spec antes do `/implement`)
- → `/implement` (quando spec pronta)
