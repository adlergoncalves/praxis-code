---
description: "Mostra progresso: quantas user stories do PRD foram transformadas em specs e quantas faltam."
user-invocable: true
---

# /prd-coverage

> **Read-only**: esta skill nao modifica arquivos. Apenas le PRDs e specs, faz match e gera relatorio.

Rastreia cobertura PRD → specs. Indexa PRDs taticos e specs existentes, faz match por referencia/nome/conteudo e gera relatorio com % por modulo + sugestao de proxima spec a criar.

## Input

`/prd-coverage {modulo}` ou `/prd-coverage` (todos os PRDs)

- Com `{modulo}`: analisa apenas o PRD do modulo informado
- Sem argumento: analisa todos os PRDs do projeto

## Workflow

### Passo 1 — Indexar PRDs

Ler PRDs taticos em `docs/prds/`, extrair estrutura FEATURE/US (Feature numero, titulo, lista de user stories).

### Passo 2 — Indexar Specs

Ler specs em `docs/specs/*/spec.md`, extrair:
- Numero da spec
- Nome
- USs incluidas (campo Input ou referencia explicita)
- Status

### Passo 3 — Match PRD ↔ Spec

Prioridade de match (do mais forte ao mais fraco):

1. Campo Input da spec referencia PRD + FEATURE explicitamente
2. Nome da spec corresponde ao titulo da Feature
3. Texto de US equivalente no conteudo da spec

Para cada Feature, marcar como:
- **Coberta** — todas as USs aparecem em alguma spec
- **Parcial** — algumas USs cobertas, outras pendentes
- **Pendente** — nenhuma US coberta ainda

### Passo 4 — Gerar Relatorio

```markdown
# Cobertura PRD → Specs

> Gerado em: {data}

## Resumo Geral

| PRD | Features | USs | Cobertas | Pendentes | % |
|-----|----------|-----|----------|-----------|---|

## Detalhamento — {Modulo}

### Cobertas
| Feature | USs | Spec | Status |

### Pendentes
| Feature | USs | Complexidade | Dependencias |

### Matches Provaveis (verificar)
| US | Spec Candidata | Confianca | Motivo |

## Proxima Spec Sugerida

1. **{nome}** — cobre FEATURE {X.Y} ({N} USs)
2. **Justificativa**: {motivo}
3. **Comando**: `/spec-from-prd prd-{x}.md FEATURE:{Y.Z}`
```

## Handoffs

- → `/spec-from-prd` (para criar a spec sugerida pelo relatorio)
