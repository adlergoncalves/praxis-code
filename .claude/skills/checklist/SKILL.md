---
description: "Quality gates — 'testes unitarios para texto'. Gera checklists para validar qualidade dos requisitos."
user-invocable: true
---

# /checklist

Gera checklists de qualidade para specs — "testes unitarios para texto".

## Input

`/checklist {feature} [dominio]`

- `{feature}` — nome ou caminho da feature
- `[dominio]` — opcional: `ux`, `api`, `security`, `data`, etc.

## 9 Dimensoes de Qualidade

1. **Completude de requisitos** — Todos os cenarios cobertos?
2. **Clareza de requisitos** — Sem ambiguidade?
3. **Consistencia** — Sem contradições internas?
4. **Mensurabilidade** — Criterios tem metricas concretas?
5. **Cobertura de cenarios** — Happy path + edge cases?
6. **Cobertura de edge cases** — Falhas, limites, concorrencia?
7. **Requisitos nao-funcionais** — Performance, seguranca, acessibilidade?
8. **Dependencias e premissas** — Documentadas com fallbacks?
9. **Ambiguidades e conflitos** — Identificados e resolvidos?

## Execucao

1. Ler spec + plan + tasks (se existirem)
2. Gerar perguntas dinamicas baseadas nos sinais da feature
3. Max 3 perguntas iniciais, ate 5 total
4. Gerar checklist com itens no formato:

```markdown
## Checklist de Qualidade — {feature}

**Proposito**: {dominio}
**Criado em**: {data}
**Feature**: [{nome}](../spec.md)

### {Dimensao}

- [ ] **CHK001** [{Dimensao}] {Pergunta de validacao}
  > Referencia: spec.md, secao {X} / [Gap] / [Ambiguity]
```

## Regras

- IDs sequenciais: CHK001, CHK002...
- ≥80% dos itens referenciam secoes da spec
- Itens sem referencia usam markers: `[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]`
- Append-mode: preserva itens existentes, continua numeracao
- Salva em `docs/specs/{feature}/checklists/{dominio}.md`

## Gestao de Contexto

Ao concluir o checklist, **recomende `/clear`** se a proxima acao for implementar. O checklist esta salvo em arquivo.

## Handoffs

- → `/clear` (limpar contexto antes de implementar)
- → `/clarify` (se muitos [Gap] ou [Ambiguity])
- → `/implement` (se checklist completo e aprovado)
