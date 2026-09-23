---
name: architect
description: "Fase 3: Arquitetura — Cria ADRs interativamente seguindo boas praticas de mercado. Questiona decisoes incomuns."
user-invocable: true
depends:
  - .claude/agents/architecture/adr-creator.md
---

# /architect

Cria ADRs do projeto interativamente usando o agent `@adr-creator`.

## O que faz

1. Le `docs/project/discovery.md` para contexto
2. Identifica categorias de ADR necessarias (backend, frontend, universal)
3. Propoe **boas praticas de mercado** como default
4. **Questiona decisoes incomuns** do usuario
5. Gera ADRs completas com regras para validacao
6. Atualiza `docs/project/constitution.md`

## Quando usar

- Apos `/discovery` estar completo
- Quando iniciar a arquitetura do projeto
- Quando uma nova decisao arquitetural precisar ser documentada

## Execucao

1. Verificar se `docs/project/discovery.md` existe
2. Delegar ao agent `@adr-creator`
3. Para cada categoria de decisao:
   - Apresentar template pre-definido de `docs/adr/templates/`
   - Perguntar se usuario concorda ou quer customizar
   - Gerar ADR em `docs/adr/NNNN-titulo.md`
4. Consolidar principios em `docs/project/constitution.md`
5. Atualizar `docs/adr/0000-adr-index.md`

## Gestao de Contexto

Ao concluir a criacao das ADRs, **recomende ao usuario executar `/clear`** antes de avancar para a proxima fase. As ADRs estao salvas em `docs/adr/` e a constitution em `docs/project/constitution.md`. Limpar o contexto garante qualidade maxima na proxima fase.

## Atualizacao do Manifesto

Ao concluir, atualizar `docs/project/manifest.md`:
- Estado do Pipeline: Architect → `completo`
- Arquitetura: listar todas as ADRs criadas (numero + titulo)

## Enriquecimento do CLAUDE.md (max 2 linhas)

Adicionar ao CLAUDE.md apenas ponteiro curto:
```markdown
**Arquitetura**: {N} ADRs | Constitution: `docs/project/constitution.md` | ADRs: `docs/adr/`
```
As regras OBRIGATORIO/PROIBIDO completas ficam na constitution e no manifesto.

## Hook Proativo — /strategy

Ao propor decisoes arquiteturais, verificar se alguma tem impacto direto no modelo de negocio:

**Sinal `DECISAO_ARQUITETURAL_COM_IMPACTO_NEGOCIO`**: Decisao envolve um dos temas abaixo:
- Multi-tenancy (impacta modelo de precificacao e segmentacao de clientes)
- Planos/tiers de acesso (freemium, limites por plano)
- Integracao com gateway de pagamento
- Modelo de dados que define o que pode ser cobrado
- Escala e custo de infra que impacta margem

→ Antes de gerar a ADR, avisar: "Esta decisao tem implicacoes no modelo de negocio (precificacao, margem, segmentacao). Quer alinhar com `/strategy` antes de definir a arquitetura?"

**Regra**: Sugerir no maximo UMA vez por sessao de `/architect`. Nao bloquear — apenas alertar.

## Hook Proativo — /ux (UX Charter)

A Constitution deve conter uma **secao curta** "UX Charter" que aponta para o arquivo `docs/project/ux-charter.md` (single source of truth). A Constitution **nao duplica** o conteudo — apenas referencia + resumo.

**Ao iniciar `/architect`, verificar**:
- Existe `docs/project/ux-charter.md`?
- A `docs/project/constitution.md` ja tem secao "UX Charter" apontando para ele?

**Cenarios**:

| Charter existe? | Constitution tem secao? | Acao |
|---|---|---|
| ✅ Sim | ✅ Sim | Verificar se a secao reflete o resumo atualizado do charter. Se nao, atualizar |
| ✅ Sim | ❌ Nao | Adicionar secao curta apontando para o charter (pointer + resumo do arquetipo + lista de atributos) |
| ❌ Nao | — | Sinal `PROJETO_SEM_UX_CHARTER` — oferecer handoff para `/ux personalidade` |

**Sinal `PROJETO_SEM_UX_CHARTER`**: Se o arquivo nao existe, avisar:

> "A Constitution define stack, padroes e nomenclatura, mas falta a **personalidade do produto** (preciso/elastico/luxuoso/etc.). Isso afeta tokens, motion e copy em todas as telas. Quer rodar `/ux personalidade` agora para definir o UX Charter antes de fechar a Constitution?"

**Se o usuario aceitar**: handoff para `/ux personalidade` que cria o `ux-charter.md`. Quando retornar, adicionar secao curta na Constitution (formato definido no `@adr-creator`).

**Se o usuario recusar**: prosseguir, mas marcar na Constitution:
```markdown
## UX Charter
> Pendente — rodar `/ux personalidade` quando a personalidade do produto for definida.
```

**Regra critica**: NUNCA copiar o conteudo de `ux-charter.md` para a Constitution. A Constitution e pointer + resumo, charter e conteudo. Mesma logica do `motion.md`.

**Regra de frequencia**: Sugerir no maximo UMA vez por sessao. Nao bloquear — apenas alertar e oferecer o handoff.

## Hook Proativo — Page Shell

A Constitution deve conter uma secao **"Page Shell"** que define a anatomia canonica de uma pagina interna do projeto. Sem ela, cada modulo implementado reinventa o layout — e o sistema perde consistencia visual mesmo com Design System correto.

**O que e o Page Shell**:
- E uma **convencao documentada**, nao um componente React
- Define: estrutura do header (titulo + subtitulo opcional + acao primaria), area de conteudo (padding, largura maxima), padrao de espacamento entre secoes, posicionamento de acoes secundarias
- Toda spec de tela interna gerada pelo `/spec-from-prd` referencia este Page Shell

**Quando criar**:
- Se o projeto tem frontend (verificar `discovery.md` + ADRs de frontend) e a Constitution ainda nao tem secao "Page Shell", propor cria-la durante a sessao
- **Idealmente apos o UX Charter** — porque o Page Shell aplica concretamente a personalidade definida pelo Charter (ex: charter "preciso" → header denso com h1 menor; charter "luxuoso" → header com escala generosa e muito espaco em branco)

**Formato da secao Page Shell na Constitution**:

```markdown
## Page Shell

Anatomia canonica de uma pagina interna deste projeto. Toda spec de tela interna deve referenciar esta estrutura.

### Header da pagina
- **Titulo** (h1): {tipografia, peso, tamanho}
- **Subtitulo** (opcional): {tipografia, cor}
- **Acao primaria**: alinhada a direita do header, usando componente `<Button variant="default">`
- **Acoes secundarias**: a esquerda da acao primaria, com `gap-2` (ou equivalente do projeto)
- **Espacamento abaixo do header**: {valor do scale, ex: `mb-8`}

### Area de conteudo
- **Padding horizontal**: {valor, ex: `px-6` em mobile, `px-12` em desktop}
- **Largura maxima**: {valor, ex: `max-w-6xl mx-auto` ou `none` se for full-width}
- **Espacamento entre secoes**: {valor, ex: `space-y-8`}

### Rodape (se aplicavel)
- {Posicao, conteudo padrao}

### Variantes
- **Tipo `auth`**: header centralizado, sem acao primaria, conteudo centrado vertical/horizontal
- **Tipo `pagina interna`**: estrutura padrao acima
- **Tipo `modal`**: header com titulo + botao close (X), acoes no footer do modal
- **Tipo `form-page`**: estrutura padrao + form full-width + acoes fixadas no rodape
```

**Sinal `PROJETO_SEM_PAGE_SHELL`**: se projeto tem frontend e nao tem secao "Page Shell" na Constitution, avisar UMA vez:

> "O projeto tem frontend mas a Constitution nao define o Page Shell — a anatomia canonica de uma pagina interna. Sem isso, cada modulo implementado vai reinventar o layout. Quer definir agora? Vai levar 5-10 min e toda spec daqui pra frente vai referenciar isso."

Se o usuario aceitar, conduzir interativamente: perguntar 4-5 questoes (tipografia do h1, padding default, max-width, posicao da acao primaria) e gerar a secao. Se recusar, marcar como pendente na Constitution.

**Regra**: nao bloquear. Apenas alertar e oferecer.

## Handoffs

- → `/clear` (limpar contexto apos gerar ADRs)
- → `/strategy` (quando decisao arquitetural tem impacto no modelo de negocio)
- → `/define` (para criar PRDs)
- → `/implement` (para implementar)
- → `/validate` (para validar codigo contra ADRs)
