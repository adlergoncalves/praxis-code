---
description: "Inicializa Design System — Extrai tokens de screenshot, cria design-system isolado e gera ADR."
user-invocable: true
depends:
  - .claude/agents/frontend/ds-foundation.md
---

# /ds-init

Cria o Design System do projeto a partir de uma referencia visual (screenshot, print de Figma, paleta de cores).

O DS e um **artefato interno do dev** — documenta tokens e componentes, vive em pasta separada, nao vai pra producao e nao aparece em PRDs.

## O DS como espelho do projeto

O DS documenta o que existe no projeto. O fluxo de desenvolvimento e **livre**:
- Componentes podem ser importados de libs (shadcn, etc.), criados custom, ou removidos a qualquer momento
- O DS deve refletir o estado atual — se algo entra no projeto, documenta no DS; se sai, remove
- `/ds-component` e a forma rapida de adicionar + documentar, mas nao e a unica forma
- O `@check-design` valida sincronia: componentes no app sem showcase = aviso, showcase sem componente no app = aviso

## Input

`/ds-init [screenshot-path]`

- Com screenshot: analisa e extrai tokens automaticamente
- Sem screenshot: pergunta ao usuario por uma referencia visual

## Pre-requisitos

- `docs/project/discovery.md` deve existir (para detectar stack)
- ADRs devem existir em `docs/adr/` (ao menos a decisao de stack)

## Execucao

Delegar ao agent `@ds-foundation` que executa:

1. **Context**: Detecta stack e lib de componentes (default: shadcn se Next.js)
2. **Design Analysis**: Extrai cores, tipografia, spacing, radius, shadows do screenshot
3. **Component Library Init**: Inicializa a lib (shadcn init ou equivalente)
4. **Design Tokens**: Gera globals.css com CSS variables (light + dark + Tailwind theme)
5. **Font Setup**: Instala Google Font no layout
6. **Demo Components**: Instala componentes base para o design-system
7. **Design System Scaffold**: Cria design-system ISOLADO em pasta separada
8. **ADR**: Gera ADR do DS com regras de validacao
9. **Summary**: Resumo visual (primary color, font, style, radius, overall feel)

## Atualizacao do Manifesto

Ao concluir, atualizar `docs/project/manifest.md`:
- Design System → `completo`, preencher paths (globals.css, design-system page, DS ADR)
- Componentes no DS → listar demo components instalados
- MCPs → atualizar status do shadcn MCP

## Enriquecimento do CLAUDE.md (max 2 linhas)

Adicionar ao CLAUDE.md apenas ponteiro curto:
```markdown
**Design System**: `{path-globals.css}` | DS page: `{path-design-system}` | Regra: usar tokens CSS, nunca cores hardcoded
```
Detalhes completos (lista de tokens, componentes, cores) ficam no manifesto.

## Gestao de Contexto

Recomende `/clear` apos concluir. O DS esta salvo em arquivos.

## Handoffs

- → `/clear` (limpar contexto)
- → `/ds-component` (adicionar e documentar componentes no DS)
- → `/implement` (comecar features)
