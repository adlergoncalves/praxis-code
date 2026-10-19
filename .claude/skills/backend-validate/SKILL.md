---
description: "Orquestra os 6 agents de validacao backend. Suporta modo paralelo (rapido) e sequencial (interativo)."
user-invocable: true
depends:
  - .claude/agents/backend/check-architecture.md
  - .claude/agents/backend/check-ddd.md
  - .claude/agents/backend/check-naming.md
  - .claude/agents/backend/check-tests.md
  - .claude/agents/backend/check-errors.md
  - .claude/agents/backend/check-security.md
---

# /backend-validate

Executa agents de checagem backend.

## Input

`/backend-validate [escopo] [--mode parallel|sequential]`

- `--mode parallel` — Roda todos os agents em paralelo (rapido, menos tokens). **Default.**
- `--mode sequential` — Roda um por vez, perguntando entre cada (interativo, mais controle)

**Fora do escopo, sempre**: `.claude/` (as fixtures de `.claude/evals/` sao codigo propositalmente errado), `node_modules/`, `bin/`, `obj/`, `dist/`. Passar essa exclusao aos agents despachados.

## Agents Disponiveis

1. `@check-architecture` — Camadas e dependencias
2. `@check-ddd` — DDD tactical patterns
3. `@check-naming` — Convencoes de nomes
4. `@check-tests` — Testes e cobertura
5. `@check-errors` — Exception handling e logging
6. `@check-security` — Seguranca e auth

## Modo Paralelo (default)

Todos os agents sao **read-only e independentes**. Podem rodar em paralelo.

1. Lancar todos os 6 agents simultaneamente via `Agent()` com `run_in_background: true`
2. Aguardar todos completarem
3. Consolidar resultados em relatorio unico

## Modo Sequencial

Executar um agent por vez. Ao concluir cada agent:
1. Exibir findings daquele agent
2. Perguntar: "Proximo: `@check-{proximo}`. Continuar? (s/n/pular para {outro})"
3. Se `n` → encerrar e consolidar
4. Se `s` → executar proximo

## Relatorio

Consolidar resultados de todos os agents executados com checkboxes, severidade e "como resolver".
