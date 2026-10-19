---
name: detail
description: "Fase 3 (opcional): Detalhamento pre-SDD. Cria workspace canonico para modulos grandes/ambiguos antes do /prd-decompose. Entre /prd-validate e /prd-decompose."
user-invocable: true
depends:
  - .claude/agents/product/module-detailer.md
  - docs/adr/0006-workspace-detalhamento-modulo.md
---

# /detail

Cria e conduz o **workspace de detalhamento** de um modulo — pasta com arquivos curtos e proposito unico que fecha a intencao antes de gerar specs SDD. Automatiza o metodo descrito em `docs/adr/0006-workspace-detalhamento-modulo.md` usando o agent `@module-detailer`.

## Quando usar

Modulo qualifica se **>= 2 sinais** se aplicam:

- Modulo tem >= 3 fronteiras com outros modulos/contextos
- PRD existe mas esta desatualizado/conflitante
- Multiplas partes funcionais independentes (CRUD, importacao, visualizacao, etc.)
- Decisoes abertas que nao fecham em uma sessao
- Implementacao sera dividida em varias iteracoes SDD
- Vocabulario novo ou que colide com outros modulos

**Nao usar quando:** feature pequena (1-2 telas), bug fix, modulo bem entendido → ir direto para `/prd-decompose` ou `/quickfix`.

## Input

`/detail {modulo} [--action init|continue|freeze]`

- `/detail catalogo` → se workspace nao existe, faz `init`; se existe, faz `continue`
- `/detail catalogo --action freeze` → encerra workspace e escolhe governanca documental
- `/detail catalogo --action init` → forca scaffolding (falha se workspace ja existe)

## Posicao no pipeline

```
/prd-create → /prd-validate → /detail (opcional) → /prd-decompose → /spec-from-prd → /implement
```

O `/detail` entra **entre** `/prd-validate` e `/prd-decompose`. O `/prd-decompose` detecta automaticamente se existe workspace em `docs/prds/{modulo}/` e usa como fonte em vez do PRD monolitico.

## Pre-requisitos

- PRD do modulo criado e validado (recomendado, nao obrigatorio)
- `docs/project/discovery.md` completo

## O que faz

1. Le ADR-006 (`docs/adr/0006-workspace-detalhamento-modulo.md`) — metodo canonico
2. Conduz o modo (init / continue / freeze) **nesta sessao**, usando `.claude/agents/product/module-detailer.md` como roteiro
3. Scaffolda `docs/prds/{modulo}/` com estrutura canonica (11+ arquivos)
4. Conduz preenchimento das **8 dimensoes** por parte funcional
5. Rastreia decisoes (`D-<COD>-##`) e duvidas (`Q-<COD>-##`) com IDs estaveis
6. Ao congelar, decide governanca documental (coexistir/substituir/regenerar)
7. Atualiza PRD original com cross-link para o workspace

## Estrutura gerada

```
docs/prds/{modulo}/
├── README.md
├── 00-visao-geral.md
├── 01-fronteiras-e-decisoes.md
├── 10-parte1-{nome}.md        # 8 dimensoes
├── 20-parte2-{nome}.md
├── 30-parte3-{nome}.md
├── 40-glossario.md
├── 50-integracoes.md
├── 60-regras-negocio.md
├── 70-duvidas-abertas.md
└── historico.md
```

## Execucao

1. Verificar se o usuario passou o modulo; se nao, perguntar
2. Validar criterio de aplicacao (>= 2 sinais). Se < 2, recomendar `/prd-decompose` direto
3. Conduzir **nesta sessao** o `--action` pedido, seguindo `.claude/agents/product/module-detailer.md` como roteiro — o detalhamento e conversa (perguntas por dimensao, fechamento de duvidas) e subagente nao conversa (`.claude/praxis/rules.md`). O scaffolding do `init` pode ir ao `@module-detailer` como subagente.
4. Ao final de cada sessao, recomendar `/clear` antes da proxima

## Governanca documental (no freeze)

Ao congelar, escolher:
- **[1] Coexistir (default)** — PRD continua como visao executiva, workspace como detalhe
- **[2] Workspace substitui PRD** — PRD arquivado como `prd-{modulo}-arquivado.md`
- **[3] Regenerar PRD consolidado** a partir do workspace

Decisao fica registrada em `historico.md`.

## Gestao de Contexto

Workspace gera volume — recomendar `/clear` entre sessoes longas de detalhamento. Os arquivos estao salvos e serao re-lidos pelo agent na proxima sessao.

## Atualizacao do Manifesto

Ao concluir (init ou freeze), atualizar `docs/project/manifest.md`:
- Artefatos: `docs/prds/{modulo}/` com estado (`iniciado` / `em detalhamento` / `congelado`)
- Estado do Pipeline: Define — workspace `{modulo}` → estado atual

## Atualizacao de Learnings

Registrar em `docs/project/learnings/process-learnings.md`:
- Padroes de duvidas recorrentes (alimentam o `/clarify`)
- Reescopos observados durante o detalhamento

Registrar em `docs/project/learnings/business-learnings.md`:
- Decisoes de fronteira nao obvias
- Termos de glossario que colidem entre modulos

## Handoffs

- → `/clear` (entre sessoes longas e apos congelar)
- → `/prd-decompose {modulo}` (apos congelar — decomposer detecta e usa o workspace)
- → `/ddd-estrategico` (se o detalhamento revelar complexidade estrategica nao prevista)
- → `/architect` (se surgirem decisoes arquiteturais durante o detalhamento)

## Referencia

Metodo canonico: `docs/adr/0006-workspace-detalhamento-modulo.md`
