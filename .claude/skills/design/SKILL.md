---
description: "Craftsman de design — refinamentos cirurgicos sobre codigo ja gerado (polish/critique/deslop/distill/animate/colorize/typeset/layout/bolder/quieter/delight/harden), na sessao principal, olhando a tela renderizada. Ancorado no Charter e na memoria de design do projeto."
domain: frontend
user-invocable: true
depends:
  - .claude/agents/frontend/design.md
  - .claude/reference/frontend/heuristics.md
  - .claude/reference/frontend/cognitive-load.md
  - .claude/reference/frontend/anti-patterns.md
  - .claude/reference/frontend/patterns.md
  - .claude/reference/frontend/motion-design.md
  - .claude/reference/frontend/register-product.md
  - .claude/reference/frontend/register-brand.md
  - .claude/reference/frontend/design-system-anatomy.md
  - .claude/reference/frontend/adapter-react-vite-shadcn.md
  - .claude/reference/frontend/adapter-react-next-shadcn.md
  - .claude/reference/frontend/adapter-angular-material.md
  - .claude/reference/frontend/adapter-vue-vuetify.md
  - .claude/reference/frontend/third-party/interface-design/design-review.md
  - .claude/reference/frontend/third-party/interface-design/design-deslop.md
  - .claude/reference/frontend/third-party/redesign-audit/redesign-skill.md
  - docs/templates/design-memory-template.md
---

# /design

Ativa o **Design Craftsman** para refinamentos cirurgicos sobre codigo ja gerado.

## Diferenca para `/ux`

| Skill | Papel | Toca codigo? | Quando |
|---|---|---|---|
| `/ux` | Estrategia (70%) — charter, shape, direcao, critique de spec | **Nao** | Antes/durante o codigo |
| `/design` | Craftsman (30%) — polimento e refinos visuais | **Sim** | Apos o codigo |

`/ux` produz **artefatos de intencao** (charter, brief). `/design` produz **edits de refino** sobre codigo existente.

## Modos

| Modo | O que faz | Edita? |
|---|---|---|
| `polish` | Passe geral aplicando heuristicas Refactoring UI por ordem de impacto | sim |
| `critique` | Review estrito sem editar — lentes, severidade, regua de aprovacao (design review da interface-design) | nao |
| `deslop` | Passe rapido no diff da branch: squint na tela + tells linha a linha | sim |
| `distill` | Remove decoracao desnecessaria (sombras/gradientes/icones gratuitos) | sim |
| `animate` | Aplica motion grammar (microinteracoes, durations, easings) | sim |
| `colorize` | Introduz cor estrategica; remove cor que nao comunica | sim |
| `typeset` | Corrige tipografia (hierarquia por peso+cor, pairing, escala) | sim |
| `layout` | Corrige spacing/ritmo (escala nao-linear, gaps consistentes) | sim |
| `bolder` | Amplifica decisoes (peso/contraste/escala/saturacao) dentro do arquetipo | sim |
| `quieter` | Oposto de `bolder` — toca pra baixo, mais respiro | sim |
| `delight` | Momento de prazer (so se Charter permite — ludico/expressivo/brand) | sim |
| `harden` | Cobertura de edge cases (overflow, i18n, estados, touch target, focus) | sim |

## Entrada

```
/design <modo> [escopo]
```

- `modo` — obrigatorio. Um dos 12 acima.
- `escopo` — opcional. Arquivo, dir, ou feature. Sem escopo, o agent identifica componente/feature recente ou pergunta.

## Pre-requisitos

- **Ancora**: `docs/project/ux-charter.md` e/ou `docs/design-system/system.md` (memoria de design). Sem nenhum dos dois, a sessao comeca explorando o dominio e grava a memoria antes do primeiro edit — nao trava pedindo a entrevista do Charter.
- Codigo existente no escopo (este e o craftsman do "30%", opera sobre o que ja foi gerado).
- Recomendado (nao obrigatorio): `docs/design-system/stack-profile.json` para detalhes de stack.

## Execucao

Roda **nesta sessao**, usando `.claude/agents/frontend/design.md` como roteiro: o `/design` mostra o diff, espera a aprovacao e olha a tela renderizada — coisas que um subagente nao faz.

1. Identificar modo no argumento.
2. Carregar a ancora (Charter, memoria de design); sem nenhuma → explorar o dominio e gravar a memoria.
3. Carregar reference files do modo + adapter da stack.
4. **Ver a tela**: com o app rodando, prints em 1440/768/390 e por estado (Playwright MCP ou `screenshot.mjs`).
5. Analisar codigo + tela e propor **diff com justificativa por edit** (ou, em `critique`, o relatorio com veredito).
6. Apresentar ao usuario. Aprovar individual, todos, ou discutir.
7. Aplicar edits aprovados; registrar decisoes na memoria de design.
8. Sugerir handoffs (ex.: drift -> `@check-visual-consistency`, gap no DS -> `/ds-component`).

## Pipeline

```
/execute (feature implementada)
    → /design critique    → avaliacao honesta sem edit
    → /design polish      → passe geral aplicando heuristicas
    → /design <modo>      → refino especifico (animate, colorize, typeset, ...)
    → /frontend-validate  → validacao final
    → @check-ai-cliches e @check-visual-consistency (avulsos — nao fazem parte do /frontend-validate)
```

`/design` opera **entre** `/execute` e `/frontend-validate`. Nao substitui o `/execute`; complementa.

## Limites (regras de seguranca)

- **Maximo 10 edits por sessao** (default). Mais que isso vira refactor — sugere quebrar em passes ou criar spec.
- **Preview obrigatorio**. `@design` SEMPRE mostra diff antes de aplicar.
- **Nao toca logica de negocio**. So visual/interacao.
- **Nao toca testes** (a menos que o teste valide design).
- **Nao toca configuracao de build/deploy**.

## Artefatos gerados

- **Edits no codigo do projeto** (com commit logico por modo, mensagem `design({modo}): {resumo}`).
- **Entradas em `docs/project/learnings/frontend-learnings.md`** quando a sessao revela pattern.
- **Linhas no `ledger.md`** registrando cada sessao de refino.

## Handoffs

- → `@check-visual-consistency` (apos refino que tocou multiplas features — confirmar que nao introduziu drift)
- → `/ds-component` (se a sessao revelou gap no DS — variant nova precisa ser oficializada)
- → `/ux charter` (se a sessao revelou que o Charter esta incompleto ou impreciso)
- → `@check-ai-cliches` (apos refinos visuais grandes — confirmar zero clichês)
- → `/frontend-validate` (sempre, ao final de uma sessao de refino significativa)
