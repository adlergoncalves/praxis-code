---
description: "Valida PRD contra template canonico. Read-only — reporta mas nao corrige."
user-invocable: true
---

# /prd-validate

> **Read-only**: esta skill nao modifica arquivos. Apenas le o PRD e reporta — correcoes sao feitas via `/prd-create` ou edicao manual.

Valida PRDs contra o template canonico. Distingue automaticamente entre PRD estrategico e tatico pelo conteudo.

## Input

`/prd-validate {modulo}` ou `/prd-validate {caminho-do-prd}`

## Auto-deteccao

Distingue tipo pelo conteudo:
- Contem "Contexto e Visao de Negocio" → **Estrategico**
- Contem "EPICO" ou "FEATURE" → **Tatico**

## Validacao Estrategico

**Header metadata** (ERRO se ausente): Tipo, Modulo, Publico, Status, Atualizado em

**11 secoes obrigatorias** (ERRO se ausente):

1. Contexto e Visao de Negocio
2. Problema / Dor Principal
3. Objetivos do Produto
4. Stakeholders e Personas
5. Proposta de Valor
6. Escopo Funcional (deve ter IN, OUT, FUTURE)
7. User Stories — Visao Executiva
8. Requisitos Nao Funcionais (tabela)
9. Metricas de Sucesso (tabela com Baseline, Meta, Prazo)
10. Riscos, Premissas e Dependencias (tabela, >= 3 riscos)
11. Narrativa Final

## Validacao Tatico

- >= 1 EPICO com descricao + tabela "Atores impactados"
- Cada FEATURE com descricao + criterios
- Cada US com "Como/Quero/Para" + criterios em tabela `| Cenario | Comportamento |`
- Decisoes no formato D{NN} (sem prefixo de modulo)

## Cross-checks

- ADRs referenciadas existem em `docs/adr/`
- Links relativos apontam para arquivos existentes
- Personas mencionadas tem contexto

## Relatorio

```markdown
# Relatorio de Validacao — {arquivo}

> **Tipo detectado**: {Estrategico / Tatico}
> **Validado em**: {data}

| Severidade | Quantidade |
|---|---|
| ERRO | {N} |
| AVISO | {N} |
| INFO | {N} |

## Erros
## Avisos
## Informacoes
## Proximos Passos
```

**Veredito**:
- 0 ERROs → **PRD aprovado** (pronto para `/prd-decompose`)
- >0 ERROs → **PRD reprovado** (corrigir via `/prd-create` ou edicao manual)

## Handoffs

- → `/prd-decompose` (se aprovado)
- → `/prd-create` (se reprovado, para corrigir)
