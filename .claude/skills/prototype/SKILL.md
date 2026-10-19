---
description: "Gera prototipo hi-fi de uma tela (ou 2-3 direcoes para escolher) no destino que a sessao tiver: ferramenta de prototipo do projeto (ex.: Paper MCP), pagina publicada (Artifact) ou HTML local. Usa o Design System e a memoria de design do projeto. Nenhum destino e obrigatorio."
user-invocable: true
depends:
  - .claude/agents/frontend/paper-prototype.md
  - .claude/reference/frontend/third-party/interface-design/interface-design.md
  - .claude/reference/frontend/third-party/frontend-design/frontend-design.md
  - .claude/scripts/frontend/screenshot.mjs
---

# /prototype

Gera o prototipo de uma tela antes do codigo. **Nao amarrado ao pipeline**: chamado quando ajuda —
tela nova e ambigua, direcao visual em aberto, aprovacao do usuario antes do `/execute`. Projeto
que desenvolve sem prototipo segue sem prototipo; a fonte de design da tela passa a ser o DS + a
memoria de design.

## Input

`/prototype {prd-path-ou-descricao} [--direcoes N] [--destino paper|artifact|html]`

- Arquivo `.md` → le como PRD/spec; texto livre → descricao da tela; vazio → pergunta
- `--direcoes N` (2-3) → em vez de uma tela, N direcoes distintas para o usuario escolher (metodo do `/ux direcao`)
- `--destino` → forca o destino; sem ele, o `/prototype` escolhe pelo que existe (abaixo)

## Onde roda

**Nesta sessao.** Desenhar no Paper usa as ferramentas do MCP, publicar pagina usa a ferramenta de
Artifacts e escolher entre direcoes e conversa — nada disso existe dentro de um subagente.
`.claude/agents/frontend/paper-prototype.md` e o **roteiro** (contexto do projeto, regras de
construcao, padroes por tipo de tela, multi-artboard).

## Destino — o primeiro que existir (ou o de `--destino`)

| Destino | Quando | Como |
|---|---|---|
| **Ferramenta de prototipo do projeto** (ex.: Paper MCP) | O projeto usa e o MCP responde (`get_basic_info`) | Seguir o roteiro do `paper-prototype.md` (Blocos A-C) |
| **Pagina publicada** (Artifacts do Claude) | A sessao publica paginas | HTML auto-contido da tela, com os tokens do projeto; publicar e guardar o link |
| **HTML local** | Sempre disponivel | `docs/design-system/prototypes/{slug}/index.html` (ou `{slug}-{direcao}.html`) + prints em 1440 e 390 com `node .claude/scripts/frontend/screenshot.mjs` |

Ferramenta indisponivel **nao bloqueia**: cai para o proximo destino e diz qual usou.

## Execucao

1. **Contexto do projeto** — Bloco A do roteiro (tokens do DS, shell do app, ADRs de UI, componentes, navegacao) + `docs/design-system/system.md` (memoria de design). Tela de um tipo que ja tem "Tela aprovada" na memoria parte dela.
2. **Ancora** — sem Charter e sem memoria de design: explorar o dominio (as quatro saidas de `register-product.md` › "Onde mora a identidade") antes de desenhar. Nao travar pedindo a entrevista do Charter.
3. **Construir** — conteudo real do dominio (nada de "Lorem", "John Doe", numeros redondos), estados relevantes (vazio, erro, carregando quando a tela tiver), desktop e mobile. No HTML: tokens como CSS custom properties com os valores do projeto, so `transform`/`opacity` em motion, foco visivel.
4. **`--direcoes N`** — N direcoes **distintas** (nao variacoes de cor da mesma), cada uma revisada contra o default antes de construir (plano em duas passadas de `third-party/frontend-design/frontend-design.md`). Apresentar lado a lado, recomendar uma, aguardar a escolha.
5. **Olhar o resultado** — print/screenshot do que foi construido e os testes swap/squint/assinatura/token (`register-product.md`). Corrigir o que falhar antes de mostrar.
6. **Registrar** — o prototipo aprovado vira a **fonte de design** da tela: link/caminho na spec (`Anatomia da Tela › Fonte de design`) e no Shape brief (se houver); a tela entra em "Telas aprovadas" da memoria de design; direcoes descartadas entram em "Recusas" com o motivo.

## Gestao de Contexto

O roteiro le muitos arquivos do projeto. Recomende `/clear` apos gerar o prototipo.

## Handoffs

- → `/clear` (limpar contexto)
- → `/tasks` (o portao final usa a fonte de design registrada) ou `/implement --team front`
- → `/ds-component` (se precisar adicionar componente ao DS antes)
