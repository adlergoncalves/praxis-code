# .claude/

Conteudo do kit Praxis consumido pelo Claude Code.

| Pasta | Conteudo |
|-------|----------|
| `skills/<nome>/SKILL.md` | Skills (comandos `/nome`) — flat, uma pasta por skill |
| `agents/<dominio>/<nome>.md` | Subagents organizados por dominio (ver `docs/kit-domains.md`) |
| `hooks/` | Hooks de aprendizado (captura + reconciliacao) — registrados em `settings.json` |
| `scripts/` | Gates deterministicos (build, learnings, detector de cliches, screenshot) |
| `reference/` | Conhecimento canonico carregado pelos agents (design, adapters de stack) |
| `assets/` | Imagens de referencia |

O inventario completo (nome, caminho, descricao e dependencias de cada skill/agent) fica em
[`docs/kit-index.md`](../docs/kit-index.md), gerado por `node scripts/generate-index.mjs`.
