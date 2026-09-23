---
description: "Detecta ambiguidades em specs usando taxonomia de 9 categorias. Faz perguntas priorizadas e integra respostas na spec."
user-invocable: true
depends:
  - .claude/agents/product/clarifier.md
---

# /clarify

Deteccao e resolucao de ambiguidades em especificacoes.

## Input

`/clarify {spec}` — caminho da spec

## Taxonomia de Ambiguidade (9 categorias)

1. **Escopo funcional e comportamento** — O que o sistema faz/nao faz?
2. **Dominio e modelo de dados** — Entidades, atributos, relacionamentos ambiguos
3. **Interacao e fluxo UX** — Passos da jornada nao claros
4. **Atributos de qualidade nao-funcionais** — Performance, seguranca, disponibilidade
5. **Integracao e dependencias externas** — APIs, servicos terceiros
6. **Edge cases e tratamento de falhas** — O que acontece quando X falha?
7. **Restricoes e trade-offs** — Decisoes com impacto bidirecional
8. **Terminologia e consistencia** — Termos usados de forma ambigua
9. **Sinais de completude** — Como saber que esta pronto?

## Execucao

Delegar ao agent `@clarifier` que:

1. Le spec completa + constitution + ADRs
2. Para cada secao, aplica taxonomia de 9 categorias
3. Prioriza por **(Impacto x Incerteza)**
4. Gera **max 5 perguntas** por sessao
5. Para cada pergunta:
   - Apresenta resposta recomendada com raciocinio
   - Aguarda resposta do usuario
6. Integra respostas na spec (atualizacoes atomicas)
7. Registra em secao `## Clarifications` → `### Session {data}`

## Formato de Pergunta

```
**Categoria**: {categoria da taxonomia}
**Impacto**: Alto/Medio/Baixo
**Pergunta**: {pergunta clara e especifica}
**Resposta recomendada**: {sugestao com justificativa}
```

## Regras

- Max 5 perguntas por sessao
- Se spec nao tem ambiguidades → reportar que esta clara
- Constitution e fonte de autoridade (regras nao-negociaveis)
- Marcar items nao resolvidos como `[NEEDS CLARIFICATION: descricao]` (max 3)

## Gestao de Contexto

Ao concluir a clarificacao, **recomende `/clear`** se a proxima acao for implementar. As clarificacoes estao integradas na spec.

## Handoffs

- → `/clear` (limpar contexto antes de implementar)
- → `/implement` (quando spec clarificada)
- → `/analyze` (para verificar consistencia)
