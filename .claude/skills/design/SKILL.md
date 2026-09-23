---
description: "Craftsman de design — refinamentos cirurgicos sobre codigo ja gerado (polish/critique/distill/animate/colorize/typeset/layout/bolder/quieter/delight/harden). Ancorado no Charter."
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
| `critique` | Review honesto sem editar — aponta problemas e sugere correcoes | nao |
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

- `modo` — obrigatorio. Um dos 11 acima.
- `escopo` — opcional. Arquivo, dir, ou feature. Sem escopo, o agent identifica componente/feature recente ou pergunta.

## Pre-requisitos

- **`docs/project/ux-charter.md`** obrigatorio. Sem Charter, o agent para e conduz `/ux charter` antes (sem fallback generico).
- Codigo existente no escopo (este e o craftsman do "30%", opera sobre o que ja foi gerado).
- Recomendado (nao obrigatorio): `docs/design-system/stack-profile.json` para detalhes de stack.

## Execucao

1. Identificar modo no argumento.
2. Verificar Charter; se ausente → conduzir `/ux charter` antes.
3. Delegar a `@design` com `{modo, escopo}`.
4. `@design` carrega Charter + reference files do modo + adapter da stack.
5. `@design` analisa codigo + propoe **diff com justificativa por edit**.
6. Apresentar diff ao usuario. Aprovar individual, todos, ou discutir.
7. Aplicar edits aprovados.
8. Sugerir handoffs (ex.: drift -> `@check-visual-consistency`, gap no DS -> `/ds-component`).

## Pipeline

```
/execute (feature implementada)
    → /design critique    → avaliacao honesta sem edit
    → /design polish      → passe geral aplicando heuristicas
    → /design <modo>      → refino especifico (animate, colorize, typeset, ...)
    → /frontend-validate  → validacao final (inclui @check-ai-cliches e @check-visual-consistency)
```

`/design` opera **entre** `/execute` e `/frontend-validate`. Nao substitui o `@executor`; complementa.

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
