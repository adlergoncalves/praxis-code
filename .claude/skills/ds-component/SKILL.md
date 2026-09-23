---
description: "Adiciona componente ao Design System — Busca, instala, customiza e cria showcase no design-system."
user-invocable: true
depends:
  - .claude/agents/frontend/ds-component.md
---

# /ds-component

Adiciona um componente ao Design System. Busca no registry, instala, customiza se necessario e cria showcase page no design-system.

Tambem pode ser usado para **documentar** componentes que ja foram adicionados ao projeto fora do DS, ou para **remover** showcases de componentes que nao existem mais.

## Input

`/ds-component {component-name} [--remove]`

- `{component-name}` — nome do componente (ex: dialog, tabs, custom-card)
- `--remove` — remove o showcase do design-system (quando componente foi removido do app)

## Pre-requisitos

- Design System inicializado (globals.css com tokens, design-system existe)
- Se nao inicializado: recomendar `/ds-init` primeiro

## Verificacao de MCP

O shadcn MCP e **opcional** (tem fallback). Antes de delegar:

1. Tentar chamar `search_items_in_registries` do shadcn MCP
2. **Se funcionar** → usar MCP para busca e exemplos (melhor experiencia)
3. **Se nao funcionar** → avisar ao usuario e usar fallback CLI (`npx shadcn@latest add`):
   ```
   shadcn MCP nao detectado. Usando CLI diretamente (npx shadcn@latest add).
   Para busca e exemplos automaticos, configure o shadcn MCP.
   ```

## Execucao

Delegar ao agent `@ds-component` que:

1. Le DS ADR, globals.css e componentes ja documentados no design-system
2. Busca no registry (shadcn MCP ou equivalente)
3. Instala ou identifica componente ja existente no projeto
4. Customiza com variants se necessario
5. Cria showcase page no design-system com todos os estados
6. Atualiza navegacao do design-system
7. Documenta props, exemplos e acessibilidade

## Gestao de Contexto

Leve — nao precisa de `/clear` entre componentes. Pode adicionar varios em sequencia.
