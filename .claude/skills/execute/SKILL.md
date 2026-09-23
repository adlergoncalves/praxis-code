---
description: "Sub-fase 5c: Executa em LOOP por fatia vertical (1 fatia = 1 User Story): implementa, roda gates, conserta ate verde (micro-loop), marca DONE no Loop Log e PARA (checkpoint; --auto encadeia). Loop Engineering (ADR-0007)."
user-invocable: true
depends:
  - .claude/agents/delivery/executor.md
---

# /execute

Executa a implementacao **em loop por fatia vertical** (Loop Engineering, ADR-0007).
Sub-fase 5c do `/implement`.

## Input

`/execute {feature} [--team front|back|db|full] [--from U{N}] [--auto [N]]` — nome da feature (deve ter tasks.md)

- `--from U{N}` — retomar a partir de uma fatia especifica
- `--auto [N]` — encadear ate N fatias sem parar (default = **checkpoint por fatia**: para apos cada uma). **`--auto` exige os GUARDRAILS** (ADR-0007 T4): teto de iteracoes (N), deteccao de "sem progresso" (mesmo erro/diff vazio em 2 iteracoes → `BLOCKED`) e escape hatch (`BLOCKED` com motivo + o que destrava). Detalhe na secao GUARDRAILS do `@executor`.

## Pre-requisitos

- **spec + plan + tasks** existirem e aprovados (ADR-0007 T3 — sem isso, NAO executa: chamar a skill faltante)
- Checklists aprovados (se existirem) em `docs/specs/{feature}/checklists/`

## Modelo de execucao (loop por fatia)

A **unidade de iteracao e a fatia vertical** (= uma User Story do tasks.md). Por iteracao:
implementa → roda gates → **conserta ate verde** (micro-loop) → marca DONE no Loop Log →
apresenta relatorio de verificacao → **PARA** (salvo `--auto`). O estado duravel e o
proprio `tasks.md` (Loop Log) — **sem `STATUS.md` concorrente** (T2).

### Portao Pre-execucao (TRAVA — roda uma vez antes da 1ª fatia)

O loop so comeca com tudo "sim" (ver checklist completo no `@executor`): spec+plan+tasks
aprovados; zero ambiguidade de negocio; Fatos Confirmados pinados (`arquivo:linha`); toda
fatia vertical com verificacao manual; criterios mapeados a testes nomeados; decisoes
diferidas com default; infra de verificacao (se e2e); verificador disponivel. Item "nao"
→ PARAR e voltar a etapa correta (`/spec-from-prd`, `/plan`, `/tasks` ou `/clarify`).

> **Modo lite**: o portao roda em versao minima (spec + tasks por fatia + DoD minimal);
> itens condicionais (Infra de Verificacao, Fidelidade pixel-perfect) so se a demanda exigir.

## Execucao

Delegar ao agent `@executor` que:

1. **Pre-flight**: rodar o **Portao Pre-execucao** + verificar branch
   - Se portao vermelho → bloquear e indicar a etapa faltante
   - Se nao esta em branch de feature → propor criacao
   - **NAO implementar na branch principal (main/master/develop)**
2. **Team scope**: Se `--team` especificado, executar apenas fatias/sub-tasks do team
   - Itens de outros teams sao pulados com log
   - Se uma fatia depende de outro team → pausar e perguntar
3. **Loop por fatia**: pegar a proxima fatia `TODO`/`WIP` no grafo, implementar, rodar gates
4. Sub-tasks marcadas `[P]` podem rodar em paralelo dentro da fatia
5. **Test-first**: RED→GREEN para mudanca de comportamento em codigo testado
6. **Micro-loop de conserto**: gate vermelho → corrigir → re-rodar ate verde ou `BLOCKED`
7. Marcar a fatia `DONE` no **Loop Log** + relatorio de verificacao + **PARAR** (checkpoint)
8. **Retomada**: Se `--from U{N}`, retomar a partir daquela fatia
9. **Antes da promessa, `/verify-all`**: confronta o Loop Log com os gates reais (exit codes) —
   o veredito objetivo autoriza (ou barra) a promessa. Quando o projeto expoe um hook de gate
   (`Stop` no settings.json), o proprio harness ja barra `DONE`/fim-de-turno com gate vermelho.
10. **Completion promise** falsificavel ao fim de todas as fatias (com "auditoria equivalente" se um verificador nao rodou), emitida **apos** o `/verify-all` verde

## Checklists embutidos

O executor roda dois checklists automaticos durante o fluxo:

**Checklist 1 — Seguranca BaaS** (apos cada **fatia que toca a camada de banco**, se stack inclui Supabase/Firebase/Amplify/etc.):
- Tabelas novas com RLS habilitado
- Policies de UPDATE com `WITH CHECK` completo
- Funcoes serverless com CORS configurado
- Claims JWT em `app_metadata` (nao `user_metadata`)
- Service role / API keys nao expostas no client

**Checklist 2 — Pre-finalizacao** (uma vez, antes de declarar execucao completa):
- **Casing de imports**: detecta divergencias entre `import './X'` e arquivo real no filesystem (quebra silenciosamente em deploy Linux — Vercel, Railway, etc.). Aplicado se projeto tem deploy em Linux

Se um item falha, o executor pausa, lista o problema e oferece correcao. Nao avanca sem resolucao ou justificativa explicita.

## Feedback Loop (spec ← implementacao)

**REGRA CRITICA**: Durante a execucao, se detectar que:
- Um requisito e inviavel tecnicamente
- Uma decisao de design precisa mudar
- Um edge case nao previsto foi descoberto
- A estimativa de complexidade estava errada

Entao:
1. **Pausar** a execucao
2. **Documentar** a divergencia na spec em secao `## Implementation Notes`
3. **Perguntar** ao usuario se deseja ajustar o requisito ou manter
4. **Continuar** apos decisao

Formato da nota na spec:
```markdown
## Implementation Notes

### {data} — {titulo}
- **Requisito original**: FR-{NNN} — {descricao}
- **Divergencia**: {o que mudou e por que}
- **Decisao**: {ajustado/mantido} — {justificativa}
```

## Gestao de Contexto

Como o loop **para a cada fatia** (checkpoint), aproveite para **recomendar `/clear`** entre fatias quando a execucao for longa. O estado esta no Loop Log do tasks.md — a proxima invocacao retoma da proxima fatia `TODO`.

## Handoffs

- → `/verify-all` (gate objetivo: confronta Loop Log com exit codes — antes da promessa)
- → `/clear` (limpar contexto entre fases ou apos conclusao)
- → `/validate` (apos implementacao completa)
- → `/review` (para self-review antes de commit)
