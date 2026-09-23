---
description: "Roteador de scaffolding backend. Direciona para o agent correto (UseCase, Aggregate, Endpoint)."
user-invocable: true
depends:
  - .claude/agents/backend/scaffold-aggregate.md
---

# /backend-scaffold

Gera codigo backend a partir de templates.

## Input

`/backend-scaffold {tipo} {nome} [opcoes]`

- `aggregate {NomeEntidade}` → `@scaffold-aggregate` — Aggregate Root + Tests

## Exemplo

```
/backend-scaffold aggregate Order --properties "Number:string, Total:decimal, Status:OrderStatus"
```

## Comportamento

1. Identifica tipo de scaffold
2. Le ADRs para convencoes do projeto (namespace, paths, patterns)
3. Le `docs/project/discovery.md` para stack info
4. Delega ao agent especializado
5. Gera arquivos seguindo ADRs do projeto
