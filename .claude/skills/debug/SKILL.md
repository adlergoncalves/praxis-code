---
description: "Investigacao de bugs — entender, pesquisar, identificar causa raiz, propor e aplicar fix. Mais leve que /implement, mais pesado que /quickfix."
user-invocable: true
---

# /debug

Investigacao estruturada de bugs.

## Input

`/debug {descricao do bug}`

Opcionalmente: arquivo, mensagem de erro, stack trace, ou passos para reproduzir.

## Execucao

### Passo 1 — Entender o bug
- Ler a descricao
- Identificar sintoma vs causa provavel
- Se stack trace fornecido, analisar

### Passo 2 — Pesquisar no codebase
- Localizar arquivos relacionados ao bug
- Ler o codigo relevante
- Identificar fluxo de dados envolvido

### Passo 3 — Identificar causa raiz
- Formular hipotese
- Verificar hipotese no codigo
- Se hipotese falha, formular nova

### Passo 4 — Propor fix
- Descrever a correcao proposta ao usuario
- Explicar por que resolve o problema
- Identificar riscos da correcao (regressoes potenciais)

### Passo 5 — Aplicar fix (com aprovacao)
- Implementar a correcao
- Validar contra ADRs nos arquivos alterados
- Sugerir testes se aplicavel

### Passo 6 — Verificar
- Confirmar que o fix resolve o sintoma reportado
- Checar se nao introduziu novos problemas

## Regras

- NAO criar spec ou PRD para um bugfix
- Se o bug revelar problema arquitetural → recomendar `/architect` para ADR
- Se o fix for trivial (1-3 linhas, causa obvia) → pode agir como `/quickfix`
- Se o fix for complexo (multiplos arquivos, mudanca de contrato) → recomendar `/implement`

## Gestao de Contexto

Se a investigacao consumir muito contexto (muitos arquivos lidos), **recomende `/clear`** antes de aplicar o fix. Salvar hipoteses e causa raiz como comentario antes de limpar.
