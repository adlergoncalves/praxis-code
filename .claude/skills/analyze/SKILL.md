---
description: "Analise de consistencia cross-artefato (spec ↔ plan ↔ tasks). Detecta duplicacoes, gaps e inconsistencias."
user-invocable: true
depends:
  - .claude/agents/quality/analyzer.md
  - .claude/skills/clarify/SKILL.md
---

# /analyze

Analise de consistencia entre spec, plan e tasks.

## Input

`/analyze {feature}` — nome ou caminho da feature em `docs/specs/`

## Execucao

Delegar ao agent `@analyzer` que executa 6 passes de deteccao nos artefatos da feature.

## 6 Passes de Deteccao

### Pass 1 — Duplicacao
- Near-duplicates entre requisitos (FRs com texto similar)
- Tasks que fazem a mesma coisa
- User stories sobrepostas

### Pass 2 — Ambiguidade
- Adjetivos vagos ("rapido", "seguro", "intuitivo") sem metrica
- Placeholders (`TBD`, `a definir`, `TODO`)
- Requisitos nao-testaveis

### Pass 3 — Sub-especificacao
- Objetos referenciados mas nao definidos
- Criterios de aceite ausentes
- Componentes mencionados sem definicao

### Pass 4 — Alinhamento com Constitution
- Principios OBRIGATORIOS violados
- Patterns PROIBIDOS usados
- ADRs contraditas

### Pass 5 — Gaps de Cobertura
- Requisitos (FR-###) sem task correspondente
- Tasks sem requisito de origem
- User stories sem cenarios de teste

### Pass 6 — Inconsistencia
- Drift terminologico (mesmo conceito, nomes diferentes)
- Entidades com atributos conflitantes entre spec e data-model
- Ordem de tasks que viola dependencias

## Severidade

- **CRITICAL**: Bloqueia implementacao (gap de cobertura, contradição)
- **HIGH**: Deve ser resolvido antes de implementar
- **MEDIUM**: Deveria ser resolvido
- **LOW**: Sugestao de melhoria

## Output

Relatorio com max 50 findings, cada um com:
- Severidade
- Descricao
- Localizacao (arquivo + secao)
- Remediacao sugerida

## Gestao de Contexto

Ao concluir a analise, **recomende `/clear`** se a proxima acao for implementar ou clarificar.

## Handoffs

- → `/clear` (limpar contexto antes da proxima fase)
- → `/clarify` (se ambiguidades encontradas)
- → `/implement` (se analise limpa)
