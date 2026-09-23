---
description: "Setup interativo do template — pergunta stack, modulos e gera CLAUDE.md personalizado para o projeto."
user-invocable: true
---

# /setup

Configura o template para um projeto especifico. Gera CLAUDE.md personalizado.

## Quando usar

- Ao clonar o template para um projeto novo
- Ao adotar o template num projeto existente

## Execucao

### Passo 1 — Perguntas de setup

Perguntar ao usuario:

1. **Nome do projeto**: Como se chama o projeto?
2. **Linha de trabalho**:
   - Novo software (construir do zero)
   - Modernizar legado (reconstruir sistema existente)
   - Adotar projeto existente (organizar projeto em andamento)
3. **Stack frontend**: (nenhum / React / Vue / Angular / outro)
4. **Stack backend**: (nenhum / .NET / Java / Node / Python / outro)
5. **Banco de dados**: (nenhum / PostgreSQL / MySQL / MongoDB / outro)
6. **Design System**: O projeto tera Design System? (s/n) — so perguntar se tem frontend
7. **Porte do projeto**: Pequeno/MVP ou Medio/Grande?
   → Pequeno: configurar modo lite automaticamente (apos setup)
   → Medio/Grande: manter modo full (default)
8. **Modulos a ativar**:
   - Core (sempre ativo)
   - Docs/PM (sempre ativo)
   - Frontend validation (se tem frontend)
   - Design System (se tem frontend e usuario quer DS)
   - Backend validation (se tem backend)
   - DDD Estrategico (se dominio complexo)

### Passo 2 — Gerar CLAUDE.md personalizado (evolutivo)

Com base nas respostas, gerar `CLAUDE.md` customizado. **Este CLAUDE.md vai CRESCER com o projeto** — cada fase do pipeline enriquece ele.

**Secoes fixas (geradas pelo setup)**:
- `## Idioma` — regra PT-BR (copiar do template)
- `## Sistema Nervoso — Evolucao Continua` — manifesto, learnings, CLAUDE.md evolutivo (copiar do template)
- `## Projeto — Identificacao` — nome, descricao, linha de trabalho
- `## Projeto — Stack` — tabela de stack (frontend, backend, db, infra)
- `## Projeto — Modulos Ativos` — quais modulos foram ativados
- `## Projeto — Skills Disponiveis` — tabela filtrada pela stack
- `## 3 Linhas de Trabalho` — tabela com os 3 fluxos (copiar do template)
- `## Team Scope` — documentacao do --team (copiar do template)

**Secoes evolutivas (adicionadas pelas skills ao longo do tempo)**:
- `## Projeto — Regras Arquiteturais` — adicionada pelo `/architect`
- `## Projeto — Design System` — adicionada pelo `/ds-init`
- `## Projeto Adotado` — adicionada pelo `/adopt`
- `## Projeto — Stack e Modulos` — enriquecida pelo `/discovery`

**REGRA DE TAMANHO**: O CLAUDE.md deve ficar abaixo de ~4KB. So regras e ponteiros curtos (1-2 linhas por artefato). Detalhes completos vao para o manifesto.

**REGRA DE FORMATO**: Incluir marcadores onde as secoes evolutivas serao inseridas:
```markdown
<!-- EVOLUI: /discovery adiciona ponteiro de stack aqui -->
<!-- EVOLUI: /architect adiciona ponteiro de ADRs aqui -->
<!-- EVOLUI: /ds-init adiciona ponteiro de DS aqui -->
```

**REGRA DE ALERTA**: Ao enriquecer o CLAUDE.md, as skills devem verificar o tamanho. Se > 4KB apos a insercao, mover o conteudo mais detalhado para o manifesto e substituir por ponteiro.

### Passo 2b — Inicializar Manifesto

Atualizar `docs/project/manifest.md` com:
- Linha de trabalho escolhida
- Stack preenchida
- Setup → `completo`

### Passo 3 — Limpar artefatos nao utilizados

**Templates de ADR**:
- Se nao tem frontend: remover `docs/adr/templates/frontend-patterns/`
- Se nao tem backend: remover `docs/adr/templates/backend-patterns/`

**Agents de validacao**:
- Se nao tem frontend: remover `.claude/agents/frontend/` **exceto `ux.md`** (o `@ux` e usado em qualquer projeto)
- Se nao tem backend OO: remover `.claude/agents/backend/` (6 agents de check-* + scaffold)
- **NUNCA** remover `orchestration/`, `discovery/`, `product/`, `architecture/`, `delivery/` nem `quality/` — sao o nucleo do kit (ver `docs/kit-domains.md`)

**Skills de validacao**:
- Se nao tem frontend: remover `.claude/skills/frontend-validate/`
- Se nao tem backend: remover `.claude/skills/backend-validate/` e `.claude/skills/backend-scaffold/`

**Design System e Prototipagem**:
- Se nao tem frontend OU nao quer DS: remover `.claude/agents/frontend/ds-foundation.md`, `.claude/agents/frontend/ds-component.md`
- Se nao tem frontend OU nao quer DS: remover `.claude/skills/ds-init/`, `.claude/skills/ds-component/`
- Se nao tem frontend: remover `.claude/agents/frontend/paper-prototype.md`, `.claude/skills/prototype/`

### Passo 4 — Proximos passos

Sugerir ao usuario via `/start`:
- "Agora rode `/start` para iniciar o pipeline correto para sua situacao."

Ou diretamente:
- Se projeto novo: `/discovery`
- Se legado para modernizar: `/reverse-engineer`
- Se projeto existente para adotar: `/adopt`

## Regras

- NAO assumir stack — sempre perguntar
- NAO remover agents core ou docs — eles sao sempre uteis
- Gerar CLAUDE.md funcional, nao um template com placeholders
- Listar ao final o que foi removido para transparencia
