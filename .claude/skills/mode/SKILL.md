---
description: "Alterna entre modo lite (simples, rapido) e full (completo, profissional). Afeta como todo o pipeline se comporta."
user-invocable: true
---

# /mode

Alterna o modo de operacao do kit. Afeta como **todas as skills** se comportam.

## Input

- `/mode lite` → Ativa modo lite (simples, rapido, sem cerimonia)
- `/mode full` → Ativa modo full (pipeline completo, profissional)
- `/mode praxis on` → Ativa o agente Praxis como orquestrador padrao (todo input passa pelo Praxis)
- `/mode praxis off` → Desativa o Praxis (skills funcionam diretamente, sem orquestracao)
- `/mode` → Mostra modo atual (lite/full + Praxis on/off)

> **Eixos independentes**: `lite|full` e `praxis on|off` sao ortogonais. Voce pode ter qualquer combinacao (ex: `full + praxis on`, `lite + praxis off`).

## Os dois modos

### Lite — Para projetos pequenos, MVPs, prototipos

| Aspecto | Comportamento |
|---------|--------------|
| Discovery | 3 perguntas rapidas (problema, stack, escopo) |
| ADRs | 2-3 ADRs default geradas automaticamente pela stack |
| PRD/Spec | Nao necessario — `/implement` aceita descricao livre |
| /implement | Descricao → implementa direto (sem plan/tasks separados) |
| /validate | Profile minimal (so ADR validator) |
| Testes | Sem obrigatoriedade de TDD |
| DDD | Desativado |
| /clarify, /analyze, /checklist | Desativados |

### Full (default) — Para projetos medios/grandes, times

| Aspecto | Comportamento |
|---------|--------------|
| Discovery | 6 etapas interativas completas |
| ADRs | Sessao interativa com /architect |
| PRD/Spec | Pipeline formal: PRD → decompose → spec |
| /implement | Requer spec → plan → tasks → execute |
| /validate | Profile standard (SOLID + ADR + stack agents) |
| Testes | TDD quando aplicavel |
| DDD | Disponivel |
| /clarify, /analyze, /checklist | Disponiveis |

### O que NAO muda entre os modos

- Idioma PT-BR
- Sistema nervoso (manifesto, learnings, evolucao)
- /debug, /quickfix, /review (funcionam igual)
- Design System e prototipagem
- Team scope (--team)

## Execucao

### Se `/mode lite`

1. Atualizar manifesto: `Modo → lite`
2. Se **nao tem discovery**:
   - Fazer 3 perguntas rapidas ao usuario:
     1. "Qual o problema que o projeto resolve? (1-2 frases)"
     2. "Qual a stack? (ex: Next.js + Node + PostgreSQL)"
     3. "Qual o escopo principal? (ex: CRUD de usuarios com auth)"
   - Gerar `docs/project/discovery.md` minimo com as respostas
3. Se **nao tem ADRs**:
   - Detectar stack das respostas
   - Gerar ADRs default usando templates existentes:
     - **Sempre**: naming conventions (de `docs/adr/templates/universal/naming-conventions.md`)
     - **Se frontend**: feature-first structure (de `docs/adr/templates/frontend-patterns/feature-first-structure.md`)
     - **Se backend**: clean architecture (de `docs/adr/templates/backend-patterns/clean-architecture.md`)
   - Atualizar `docs/adr/0000-adr-index.md`
4. Se **nao tem constitution**:
   - Gerar constitution minima consolidando as ADRs default
5. Adicionar ponteiro no CLAUDE.md: `**Modo**: lite`
6. Informar ao usuario:
   ```
   Modo lite ativado!
   
   Contexto criado:
   - Discovery minimo gerado
   - {N} ADRs default criadas ({lista})
   - Constitution minima gerada
   
   Agora voce pode:
   - /implement "descricao da feature" → implementa direto
   - /debug "descricao do bug" → investiga e corrige
   - /quickfix "ajuste" → correcao rapida
   
   Para voltar ao modo completo: /mode full
   ```

### Se `/mode full`

1. Atualizar manifesto: `Modo → full`
2. Se vindo do lite:
   - Informar que ADRs e artefatos existentes continuam validos
   - Sugerir proximos passos:
     ```
     Modo full ativado!
     
     Seus artefatos do modo lite continuam validos.
     Para aproveitar o modo full ao maximo:
     - /discovery → aprofundar entendimento (expande o discovery minimo)
     - /architect → adicionar mais ADRs interativamente
     - /define → criar PRDs e specs formais
     ```
3. Atualizar ponteiro no CLAUDE.md: `**Modo**: full`

### Se `/mode praxis on`

1. Atualizar manifesto: linha `**Praxis**:` → `on`
2. Atualizar ponteiro no `CLAUDE.md`: na secao "Agente Principal: Praxis", linha `**Status atual**:` → `ATIVO`
3. Informar ao usuario:
   ```
   Praxis ativado como orquestrador padrao.

   A partir de agora:
   - Todo input do usuario passa pelo Praxis antes de qualquer skill
   - Toda skill que termina notifica o Praxis (regra global no CLAUDE.md)
   - Praxis propoe proximo passo e interrompe se ver risco

   Para invocar pontualmente: /praxis
   Para desativar: /mode praxis off
   ```

### Se `/mode praxis off`

1. Atualizar manifesto: linha `**Praxis**:` → `off`
2. Atualizar ponteiro no `CLAUDE.md`: na secao "Agente Principal: Praxis", linha `**Status atual**:` → `DESATIVADO`
3. Informar ao usuario:
   ```
   Praxis desativado.

   Skills voltam a funcionar diretamente, sem orquestracao.
   Voce ainda pode invocar pontualmente com: /praxis <mensagem>

   Para reativar: /mode praxis on
   ```

### Se `/mode` (sem argumento)

1. Ler manifesto para modo atual (lite/full) + status do Praxis
2. Mostrar:
   ```
   Modo atual: {lite|full}
   Praxis: {on|off}
   
   Lite: pipeline simples, /implement aceita descricao livre, validacao minimal
   Full: pipeline completo, specs formais, validacao standard
   Praxis: agente orquestrador acima das skills (despacha, interrompe, guia)
   
   Para alternar: /mode lite | /mode full | /mode praxis on | /mode praxis off
   ```

## Transicoes

| De → Para | O que acontece |
|-----------|---------------|
| lite → full | Artefatos mantidos. Sugestao de expandir discovery/ADRs |
| full → lite | Artefatos mantidos. /implement passa a aceitar descricao livre |
| full → full | Nada muda |
| lite → lite | Nada muda |

O modo pode ser alternado **quantas vezes quiser, a qualquer momento**.
Um projeto pode comecar lite e migrar para full quando crescer.
