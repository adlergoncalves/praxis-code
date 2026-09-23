---
description: "Self-review antes de commit — analisa git diff contra ADRs e SOLID. Mais leve que /validate."
user-invocable: true
depends:
  - .claude/agents/quality/solid-review.md
---

# /review

Review local das mudancas antes de commit. Analisa apenas o diff, nao o projeto inteiro.

## Input

`/review [escopo]`

- Sem argumento: analisa `git diff` (staged + unstaged)
- `staged`: apenas arquivos staged (`git diff --cached`)
- `{arquivo}`: arquivo especifico

## Execucao

1. **Coletar diff**: Executar `git diff` para obter as mudancas
2. **Analisar contra ADRs**: Para cada arquivo alterado, verificar regras PROIBIDO/OBRIGATORIO das ADRs aplicaveis
3. **Analisar SOLID**: Verificar se as mudancas violam principios SOLID (foco nos trechos alterados)
4. **Verificar consistencia**: Nomes, patterns, imports seguem as convencoes do projeto?
5. **Reportar**: Gerar relatorio conciso

## Formato do Relatorio

```markdown
## Review — {data}

**Arquivos alterados**: {N}
**Linhas adicionadas**: {N} | **Removidas**: {N}

### Problemas encontrados

- **ERRO** `{arquivo}:{linha}` — {descricao} (ADR-{NNNN})
- **AVISO** `{arquivo}:{linha}` — {descricao}

### OK
Nenhum problema encontrado nos demais arquivos.
```

## Regras

- NAO analisar arquivos que nao foram alterados
- NAO gerar relatorio em arquivo (exibir inline)
- Se encontrar muitos problemas → sugerir `/validate` completo
- Foco em qualidade, nao em cobertura total
