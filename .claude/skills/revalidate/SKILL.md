---
description: "Fase 7: Revalidacao cirurgica. Le relatorio existente e re-checa apenas itens pendentes. Detecta regressoes."
user-invocable: true
depends:
  - .claude/agents/quality/revalidator.md
---

# /revalidate

Revalidacao cirurgica usando o agent `@revalidator`.

## Input

`/revalidate [caminho-do-relatorio]`

- Com caminho: usa o relatorio especificado
- Sem caminho: usa o mais recente em `docs/validation-reports/`

## Execucao

1. **Passada 1** — Re-checar itens pendentes (checkboxes desmarcados)
   - Identifica agent responsavel por cada item
   - Re-executa APENAS esses agents nos arquivos afetados
   - Atualiza status: corrigido ou ainda pendente

2. **Passada 2** — Detectar regressoes
   - Identifica arquivos alterados desde o relatorio original
   - Valida esses arquivos com todos os agents aplicaveis
   - Reporta novas violacoes como "Regressao"

## Gestao de Contexto

Ao concluir a revalidacao, **recomende `/clear`** se houver correcoes a fazer. O relatorio atualizado esta salvo em arquivo.

## Handoffs

- → `/clear` (limpar contexto apos revalidacao)
- → `/validate` (se muitas regressoes, rodar validacao completa)
