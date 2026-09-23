---
name: spec-review
description: "Valida se uma spec tecnica esta pronta para implementacao — criterios de aceite, edge cases, alinhamento com ADRs e learnings aplicaveis. Gate leve antes do /implement."
user-invocable: true
depends:
  - .claude/agents/quality/spec-review.md
  - .claude/skills/clarify/SKILL.md
---

# /spec-review

Valida uma spec tecnica antes de entrar no pipeline de implementacao.

## O que faz

Roda o agente `@spec-review` que verifica:

1. **Estrutura minima** — todos os campos obrigatorios presentes
2. **Qualidade dos criterios** — aceite concreto e testavel (nao "deve funcionar bem")
3. **Alinhamento com ADRs** — sem conflitos com decisoes arquiteturais
4. **Sinais de risco de negocio** — criterio de sucesso, premissas, escopo
5. **Learnings aplicaveis** — descobertas anteriores que impactam esta feature

## Resultado

| Resultado | Significa |
|-----------|-----------|
| **APROVADA** | Pode ir direto para `/implement` |
| **APROVADA COM RESSALVAS** | Pode implementar, mas ha pontos que gerarao retrabalho |
| **BLOQUEADA** | Corrigir os gaps antes de implementar |

## Quando usar

**Proativamente** (o `/implement` sugere automaticamente):
- Quando a spec nao tem criterios de aceite claros
- Quando feature chega sem Success Criteria

**Manualmente** (usuario chama direto):
- Antes de qualquer `/implement` em modo full
- Apos corrigir gaps apontados em uma revisao anterior

## Uso

```
/spec-review {nome-da-feature}
/spec-review docs/specs/001-autenticacao/spec.md
```

## Execucao

1. Localizar a spec (por nome ou caminho)
   - Se nao encontrar: listar specs disponíveis em `docs/specs/`
2. Carregar learnings relevantes de `docs/project/learnings/`
3. Delegar ao agent `@spec-review`
4. Apresentar relatorio com resultado e proximos passos

## Gestao de Contexto

Nao requer `/clear` — e uma operacao leve de leitura. O relatorio e exibido na tela; nao e salvo em arquivo (a menos que o usuario peca).

## Handoffs

- → `/clarify` (se ambiguidades precisam ser resolvidas antes de corrigir a spec)
- → `/implement` (quando spec aprovada)
- → `/define` (se os gaps indicam que a spec precisa ser reescrita a partir do PRD)
