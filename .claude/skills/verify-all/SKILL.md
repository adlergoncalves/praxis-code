---
description: "Confronta o Loop Log (tasks.md) com os gates REAIS (exit codes). Veredito binário verde/vermelho — não 'o modelo acha que terminou'. Gate objetivo do Loop Engineering (ADR-0007)."
user-invocable: true
depends:
  - .claude/skills/execute
---

# /verify-all

Verificação objetiva de que uma feature está realmente pronta — o gate que autoriza a
**Completion Promise** (ADR-0007, seção Completion promise). Não confia no julgamento do modelo: relê o estado
declarado e o confronta com o **exit code** dos gates reais.

Boris Cherny (Loop Engineering): o fator nº 1 de qualidade é o agente ter como **verificar o
próprio trabalho** — o loop avança "porque o gate passou", não "porque o modelo disse que
terminou". Esta skill é esse gate.

## Input

```
/verify-all {feature}
```
`{feature}` = nome/número da spec (ex.: `041-...`). Se omitido, usa a feature em andamento
(último Loop Log com fatias `WIP`/`DONE` recentes).

## O que faz

1. **Lê o Loop Log** em `docs/specs/{feature}/tasks.md` (seção "Estado durável (Loop Log)" —
   fonte única, ADR-0007 T1). Lista o status de cada fatia (`TODO`/`WIP`/`DONE`/`BLOCKED`/`ABANDONADA`).
2. **Lê a tabela de Gates** do mesmo `tasks.md` — os comandos literais da stack do projeto
   (o kit é agnóstico; o comando concreto vem daqui).
3. **Roda os gates objetivos** e captura o **exit code** de cada um:
   - o comando agregado do projeto, se existir (ex.: `npm run check` / `make check`);
   - `node .claude/scripts/build-gate.mjs .` (se o script existe no projeto);
   - `node .claude/scripts/frontend/check-learnings.mjs <path>` (se existe);
   - os comandos de teste declarados na tabela de Gates (unit sempre; integração/e2e
     quando o ambiente estiver disponível — senão reporta como NÃO VERIFICADO, sem inventar);
   - `node .claude/scripts/deps-audit.mjs . --dry-run` (dependência vulnerável nova desde o
     baseline — informativo, não derruba o veredito; `--dry-run` porque esta skill é read-only).
4. **Confronta**: para cada fatia `DONE`, os gates que a cobrem devem estar **verdes**.
5. **Anti-gaming (ADR de testes)**: inspeciona o diff/arquivos de teste por sinais de
   afrouxamento — `.only`/`.skip` deixados, asserts removidos ou relaxados (`toBe(x)` →
   `toBeDefined()`), testes deletados sem fonte que justifique, mudança de teste classificada como
   `ajuste-para-passar` nas Notas do Loop Log. Reporta como suspeita (não bloqueia sozinho, mas
   entra no veredito).

## Saída — veredito binário

- **✅ VERDE** — todas as fatias `DONE` têm gates verdes (exit 0); nenhuma suspeita de gaming;
  fatias não-`DONE` listadas honestamente. **Autoriza a Completion Promise.**
- **🔴 VERMELHO** — ao menos um gate com exit != 0, ou fatia `DONE` sem gate que a cubra, ou
  gaming detectado. Lista o que falhou com o exit code real. **Bloqueia a promessa.**
- **⚠️ NÃO VERIFICADO** — gate que não pôde rodar (ex.: integração sem Docker). Declarado como
  tal, nunca contado como verde (honestidade epistêmica — ADR-0007, seção Completion promise).

O veredito é **declarado com os exit codes reais**, não com adjetivos. Ex.:
`check: exit 0 · build-gate: exit 0 · test:integration: NÃO VERIFICADO (Docker down)`.

## Quando usar

- Pelo `/execute` **no fechamento**, depois de todas as fatias liberadas fechadas e antes da
  Completion Promise (pré-condição — ver `.claude/skills/execute/SKILL.md`).
- Manualmente, para auditar se uma feature marcada como pronta realmente passa nos gates.
- Antes de um merge/PR de uma feature que rodou no modo autônomo.

## Regras

- **NUNCA** reportar verde sem ter rodado o gate e visto exit 0.
- **NUNCA** contar um gate NÃO VERIFICADO como verde.
- O comando de cada gate vem do `tasks.md`/projeto — **não inventar** comando (kit agnóstico de stack).
- Read-only sobre o código: não conserta, só verifica e reporta. Correção é do `/execute`.

## Handoffs

- → `/execute {feature}` (se VERMELHO — voltar ao micro-loop de conserto)
- → `/validate {feature}` (conformidade plena por agentes, após VERDE)
- → commit/PR (se VERDE e conformidade ok)
