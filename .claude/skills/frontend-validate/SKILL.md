---
description: "Orquestra os 11 agents de validacao frontend. Suporta modo paralelo (rapido) e sequencial (interativo)."
user-invocable: true
depends:
  - .claude/agents/frontend/check-structure.md
  - .claude/agents/frontend/check-typescript.md
  - .claude/agents/frontend/check-react.md
  - .claude/agents/frontend/check-forms.md
  - .claude/agents/frontend/check-i18n.md
  - .claude/agents/frontend/check-routing.md
  - .claude/agents/frontend/check-responsiveness.md
  - .claude/agents/frontend/check-design.md
  - .claude/agents/frontend/check-ux.md
  - .claude/agents/frontend/check-security-frontend.md
  - .claude/agents/frontend/check-web-guidelines.md
---

# /frontend-validate

Executa agents de checagem frontend.

## Input

`/frontend-validate [escopo] [--mode parallel|sequential]`

- `--mode parallel` — Roda todos os agents em paralelo (rapido, menos tokens). **Default.**
- `--mode sequential` — Roda um por vez, perguntando entre cada (interativo, mais controle)

**Fora do escopo, sempre**: `.claude/` (as fixtures de `.claude/evals/` sao codigo propositalmente errado), `node_modules/`, `bin/`, `obj/`, `dist/`. Passar essa exclusao aos agents despachados.

## Agents Disponiveis

1. `@check-structure` — Estrutura de pastas e imports
2. `@check-typescript` — TypeScript strict, tipos
3. `@check-react` — Patterns React
4. `@check-forms` — Formularios e validacao
5. `@check-i18n` — Internacionalizacao
6. `@check-routing` — Rotas e navegacao
7. `@check-responsiveness` — Responsividade
8. `@check-design` — Design System
9. `@check-ux` — UX patterns (loading, feedback)
10. `@check-security-frontend` — Seguranca client-side (XSS, storage de token, secrets, open redirect)
11. `@check-web-guidelines` — Web Interface Guidelines (Vercel): a11y, foco, formularios, navegacao/URL, estados, toque — snapshot fixado, filtrado por stack e idioma

## Modo Paralelo (default)

Todos os agents sao **read-only e independentes** — nenhum depende do resultado de outro. Por isso podem rodar em paralelo com seguranca.

1. Lancar todos os 11 agents simultaneamente via `Agent()` com `run_in_background: true`
2. Aguardar todos completarem
3. Consolidar resultados em relatorio unico

**Vantagens**: ~3x mais rapido, ~60% menos tokens no contexto principal.

## Modo Sequencial

Executar um agent por vez. Ao concluir cada agent:
1. Exibir findings daquele agent
2. Perguntar: "Proximo: `@check-{proximo}`. Continuar? (s/n/pular para {outro})"
3. Se `n` → encerrar e consolidar
4. Se `s` → executar proximo

**Vantagens**: mais controle, pode parar a qualquer momento.

## Relatorio

Consolidar resultados de todos os agents executados em formato padrao com checkboxes, severidade e "como resolver".
