---
description: "Escape hatch para trabalho trivial — bugfix, ajuste de CSS, correcao de typo. Sem cerimonia, com validacao minima."
user-invocable: true
---

# /quickfix

Trabalho leve sem cerimonia do pipeline completo. Para bugfixes, ajustes cosmeticos e correcoes rapidas.

## Input

`/quickfix {descricao do problema}`

## Quando usar

- Bugfix de poucas linhas
- Ajuste de CSS/estilo
- Correcao de typo ou texto
- Rename de variavel/funcao
- Qualquer mudanca que nao exige spec, plan ou PRD

## Quando NAO usar

- Feature nova (use `/implement`)
- Mudanca arquitetural (use `/architect`)
- Qualquer coisa que afete multiplos modulos

## Execucao

1. **Entender o problema**: Ler a descricao e identificar os arquivos afetados
2. **Pesquisar**: Localizar o codigo relevante no codebase
3. **Implementar**: Aplicar a correcao diretamente
4. **Validar (minimo)**: Verificar apenas contra ADRs aplicaveis (se existirem)
   - Rodar `@adr-validator` apenas nos arquivos alterados
   - Nao rodar validacao completa
5. **Reportar**: Resumir o que foi feito

## Regras

- NAO criar spec, plan ou tasks
- NAO rodar pipeline completo de validacao
- Validar apenas contra ADRs nos arquivos tocados
- Se durante o quickfix perceber que a mudanca e maior do que parece → **parar e recomendar `/implement`**

## Gestao de Contexto

Quickfix e leve — nao precisa de `/clear` apos conclusao a menos que o contexto esteja poluido.
