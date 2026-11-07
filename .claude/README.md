# .claude/

Conteudo do kit Praxis consumido pelo Claude Code.

| Pasta | Conteudo |
|-------|----------|
| `praxis/` | `praxis.mjs` (puxa e atualiza as ferramentas do catalogo — ADR-0009) e `rules.md` (regras do kit, importadas pelo `CLAUDE.md` do projeto) |
| `skills/<nome>/SKILL.md` | Skills (comandos `/nome`) — flat, uma pasta por skill |
| `agents/<dominio>/<nome>.md` | Subagents organizados por dominio (ver `docs/kit-domains.md`) |
| `hooks/` | Hooks de aprendizado (captura + reconciliacao) — registrados em `settings.json`; em `hooks/quality/`, hooks de qualidade opt-in (ligados pelo `/setup` no `settings.local.json`) |
| `rules/learned/` | Regras ativas do projeto (ADR-0010): uma por arquivo, carregadas pelo Claude Code por `paths`. Do projeto — fora do catalogo; molde em `docs/templates/rule-template.md`. Nada alem de regra nesta pasta |
| `scripts/` | Gates e utilitarios: build-gate, loop-doctor (Gate 0), loop-driver (gerente do loop), loop-briefing (recorte da fatia), slice-gates (gates por exit code), memory-check (cobranca da memoria), deps-audit, mutants, check-learnings, detect-cliches, screenshot |
| `evals/` | Fixtures e contratos dos agent evals (`/agent-eval`) |
| `reference/` | Conhecimento canonico carregado pelos agents (design, adapters de stack) |
| `assets/` | Imagens de referencia |

O inventario completo (nome, caminho, descricao e dependencias de cada skill/agent) fica em
[`docs/kit-index.md`](../docs/kit-index.md), gerado por `node scripts/generate-index.mjs`.
