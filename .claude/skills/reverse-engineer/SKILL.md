---
description: "Fase 0: Engenharia reversa de projeto legado. Documenta logica de negocio, fluxos, telas e regras antes de modernizar."
user-invocable: true
depends:
  - .claude/agents/discovery/legacy-analyzer.md
  - .claude/agents/discovery/codebase-mapper.md
  - .claude/skills/discovery/SKILL.md
---

# /reverse-engineer

Engenharia reversa completa de um sistema legado. **Fase 0** — antes de tudo.

## Quando usar

Quando o objetivo e modernizar/refatorar um sistema legado existente. O usuario deve ter o projeto legado acessivel no mesmo workspace.

## Input

`/reverse-engineer {caminho-do-legado}`

Se nao especificado, perguntar onde esta o codigo legado.

## Pre-requisitos

- Projeto legado acessivel no workspace
- Usuario disponivel para responder perguntas e fornecer prints de telas

## Execucao

Delegar ao agent `@legacy-analyzer` que executa 6 etapas:

1. **Mapeamento estrutural** → `@codebase-mapper` → `docs/project/codebase-map.md`
2. **Logica de negocio** → `docs/project/legacy/business-logic.md`
3. **Fluxos e jornadas** → `docs/project/legacy/flows.md`
4. **Telas e interface** (interativa — pede prints) → `docs/project/legacy/screens.md`
5. **Conhecimento tribal** (interativa — perguntas ao usuario) → `docs/project/legacy/tribal-knowledge.md`
6. **Consolidacao** → `docs/project/legacy/README.md`

Cada etapa requer **confirmacao do usuario** antes de avancar.

## Gestao de Contexto

**Recomende `/clear` entre etapas**, especialmente apos etapas 1-3 (que consomem muito contexto lendo codigo). Os outputs estao salvos em arquivos.

## Output

```
docs/project/legacy/
├── README.md              — Visao geral consolidada
├── business-logic.md      — Regras de negocio
├── flows.md               — Fluxos mapeados
├── screens.md             — Telas documentadas
└── tribal-knowledge.md    — Conhecimento implicito
```

## Apos a Engenharia Reversa

Com a documentacao completa do legado, o fluxo normal do template pode comecar:

```
/reverse-engineer {legado}     — Fase 0: documentar o legado
        ↓
/discovery                     — Fase 1: discovery do NOVO projeto (usando docs do legado)
        ↓
/architect                     — Fase 3: ADRs do novo sistema
        ↓
/define                        — Fase 2: PRDs modulo por modulo
        ↓
/implement + /validate         — Fases 5-7: implementar o novo sistema
```

## Handoffs

- → `/clear` (entre etapas da engenharia reversa)
- → `/discovery` (apos engenharia reversa completa)
