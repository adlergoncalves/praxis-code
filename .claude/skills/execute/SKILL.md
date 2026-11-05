---
description: "Sub-fase 5c: Executa o pacote aprovado em loop por fatia vertical (1 fatia = 1 User Story). Padrao: o loop-driver abre uma sessao nova por fatia (so o recorte dela), roda os gates por exit code e um verificador em outra sessao; a sessao principal trata as paradas e faz o fechamento. --checkpoint para a cada fatia; --interativo roda a fatia na sessao principal. Loop Engineering (ADR-0007)."
user-invocable: true
depends:
  - .claude/skills/execute/checklists.md
  - .claude/skills/execute/slice-session.md
  - .claude/skills/execute/verifier-session.md
  - .claude/scripts/loop-driver.mjs
  - .claude/scripts/loop-briefing.mjs
  - .claude/scripts/slice-gates.mjs
  - .claude/scripts/loop-doctor.mjs
  - .claude/scripts/mutants.mjs
  - .claude/scripts/deps-audit.mjs
  - .claude/skills/verify-all/SKILL.md
  - .claude/skills/frontend-validate/SKILL.md
  - .claude/skills/backend-validate/SKILL.md
  - .claude/agents/architecture/adr-validator.md
  - .claude/reference/frontend/third-party/design-review-playwright/design-review-agent.md
  - .claude/reference/frontend/third-party/interface-design/design-review.md
  - .claude/scripts/build-gate.mjs
  - .claude/scripts/frontend/check-learnings.mjs
---

# /execute

Executa o pacote aprovado (spec + plan + tasks) **em loop por fatia vertical** (Loop Engineering,
ADR-0007). Sub-fase 5c do `/implement`.

## Principio: a discussao acontece antes; a execucao nao para

O pacote aprovado no portao final do `/tasks` e o **contrato de execucao**: ali o usuario leu o
guia de validacao, viu as paradas provaveis eliminadas, aprovou o modelo de cada fatia e
respondeu o Preflight. Por isso o loop **encadeia as fatias sem pedir aprovacao entre elas**,
commita conforme o Preflight e so devolve o controle no que e realmente bloqueante (secao
"Quando o loop para"). Decisao que nao bloqueia vira registro e o loop segue.

## Como roda — o gerente e um script (ADR-0007)

Com o loop numa sessao so, cada chamada rele tudo o que veio antes: o custo cresce com o
contexto acumulado, nao com o trabalho. Por isso a sessao principal **nao implementa fatias**.
Ela confere as pre-condicoes, solta o driver e espera; quem faz o trabalho sao sessoes novas,
cada uma lendo so o recorte da sua fatia.

| Quem | O que faz | Tokens |
|---|---|---|
| `loop-driver.mjs` (script) | Gate 0 a cada iteracao, escolhe a proxima fatia liberada no grafo, monta o recorte, abre as sessoes, roda os gates, decide seguir, repetir ou parar, anota o custo | zero |
| Sessao da fatia (`claude -p`, nova) | Implementa uma fatia (ou um grupo liberado) pelo protocolo `.claude/skills/execute/slice-session.md`, com o recorte do pacote (`loop-briefing.mjs`), no "Modelo · esforço" da fatia, sem ler PRD nem guia | o da fatia |
| Gates (`slice-gates.mjs`) | Comandos da tabela Gates, so das camadas tocadas; decide pelo exit code; FALHOU reprova sem gastar o verificador | zero |
| Verificador (`claude -p`, outra sessao) | Sem o historico de quem implementou e sem edicao nem commit: criterio a criterio com evidencia, check agents da camada tocada, revisao visual, sinais de afrouxamento (`.claude/skills/execute/verifier-session.md`) | curto |
| Sessao principal (esta) | Regra 0, soltar o driver, tratar as paradas com o usuario, fechamento e promessa | so isso |

Reprovada (pelos gates ou pelo verificador), a fatia volta para `WIP` e repete **uma vez**, um
degrau de modelo acima, com os achados no prompt; reprovada de novo, o driver para. Fatia
`BLOCKED` nao para a rodada.

## Input

`/execute {feature} [--team front|back|db|full] [--from U{N}] [--max N] [--checkpoint] [--interativo]`

- `{feature}` — nome da feature (deve ter `docs/specs/{feature}/tasks.md`)
- `--team` — escopo do team (default `full`), repassado as sessoes: fatia que depende de outro team vira `BLOCKED`
- `--from U{N}` — comecar por uma fatia especifica (liberada)
- `--max N` — teto de sessoes de fatia nesta rodada
- `--checkpoint` — uma fatia por rodada; relatorio e aguarda "proxima" (opt-in)
- `--interativo` — a fatia roda nesta sessao (excecao: fatia que precisa do usuario no meio)
- Opcoes do driver passam adiante quando o usuario pede: `--model` (forca um modelo), `--verifier-model`, `--verifier-effort`, `--budget`, `--permission-mode`, `--deny`, `--timeout`

## Pre-requisitos (ADR-0007 T2)

- **spec + plan + tasks** existirem — sem isso, NAO executa: indicar a skill faltante (`/spec-from-prd`, `/plan`, `/tasks`)
- **Pacote aprovado** — `tasks.md › Preflight › Pacote aprovado em` preenchido pelo portao final do `/tasks`. Sem aprovacao: rodar o portao final do `/tasks` antes
- **Modo lite**: spec minima + tasks por fatia + DoD minimal; a aprovacao e o resumo no chat. O verificador roda so o `@adr-validator`

---

## REGRA 0 — antes de soltar o driver (nesta sessao)

0. **Gate 0 — `node .claude/scripts/loop-doctor.mjs --feature {feature}`**: pacote aprovado, branch, frescor dos Fatos Confirmados, ambiente da feature (`doctor.json`). **Exit 1/2** → apresentar os `[FALHOU]` e corrigir antes da corrida (Fato velho → re-pinar no plan). **Exit 3** → as fatias listadas ficam `BLOCKED` de largada (o driver marca) e a corrida segue com as demais. O driver repete o Gate 0 a cada iteracao.
1. **Preflight respondido** — linha `—` e falha de geracao do pacote: perguntar **todas juntas, uma vez**, antes da corrida.
2. **Branch** — estar na branch do Preflight; nao existe → criar a partir da base declarada. Arvore suja com trabalho alheio a feature → parar e perguntar. Nunca implementar na branch principal (`main`/`master`/`develop`).
3. **Ambiente** — o que o Gate 0 nao cobre: itens da Infra de Verificacao (plan) e o que as fatias pendentes exigem (runner de e2e, banco e servicos locais, **app rodando** para a revisao visual das fatias de UI). Subir o que for do projeto e deixar de pe durante a corrida — as sessoes do driver o usam. O que estiver morto e nao puder subir → a fatia que depende dele vira `BLOCKED` de largada.
4. **Learnings** — carregar os arquivos de `docs/project/learnings/` e as `[CORRECAO DO USUARIO]`. As sessoes do driver recebem as correcoes pelo hook de inicio de sessao. Conflito com **regra de negocio** → perguntar antes da corrida.
5. **Gate de frontend** (feature que toca UI) — ver secao Gate de frontend; faltando ancora ou Shape, as fatias de UI ficam `BLOCKED` de largada (marcar no Loop Log com o motivo).
6. **Permissoes** — a sessao do driver nao tem quem aprove: o que o `settings.json` nao libera e negado. Na primeira corrida do projeto, rodar o **ensaio** (`--max 1`) e conferir no log se houve negacao; acrescentar a regra que faltou antes de soltar a corrida inteira.

## Corrida

1. Soltar o driver **em segundo plano** (Bash com `run_in_background`) e avisar o usuario em uma
   linha: o que esta rodando, onde acompanhar (Loop Log e "Custo por sessão (driver)" no
   `tasks.md`; JSON de cada sessao na pasta de log que o driver imprime) e que pode fechar o
   editor so depois do fim — o processo em segundo plano morre com a sessao. Corrida longa: o
   usuario pode rodar o mesmo comando num terminal.

   ```
   node .claude/scripts/loop-driver.mjs --feature {feature} [--team {t}] [--from U{N}] [--max N]
   ```

2. **Nao acompanhar enquanto roda.** A notificacao chega quando o driver termina; ate la esta
   sessao nao gasta nada. Ao ser notificado, ler so o fim da saida (as linhas `RESULTADO:` e o
   resumo) e agir pelo codigo:

| Saida | O que fazer |
|---|---|
| `0` acabou | Fechamento (seguranca → `/verify-all` → learnings → promessa) |
| `3` parada pedida pela sessao | Ler o relatorio da sessao (caminho na saida) e levar a pergunta ao usuario: decisao de negocio, watchdog (abandonar · `BLOCKED` · tentar mais N), acao destrutiva. Registrar a resposta (spec › Decisoes ou Implementation Notes; Loop Log no watchdog) e soltar o driver de novo |
| `4` fora do contrato | Ler o log da sessao: permissao negada, ferramenta ausente, relatorio sem a linha do driver, verificador sem veredito. Corrigir a causa e soltar de novo; sem causa corrigivel, levar ao usuario |
| `5` so BLOCKED / nada liberado | Listar o motivo de cada uma (Notas). O que bloqueava mudou (servico de pe, decisao tomada) → voltar a fatia para `TODO` e soltar de novo; senao, "bloqueado, preciso de X" |
| `6` reprovada duas vezes | Apresentar os achados do verificador (log) e perguntar: tentar de novo com abordagem nova (`--model` acima, se for o caso), `BLOCKED` ou `ABANDONADA` |
| `7` chegou ao `--max` | Relatorio das fatias da rodada; no `--checkpoint`, aguardar "proxima" |
| `1` pre-condicao | Apresentar e corrigir (Regra 0) |

---

## Quando o loop para (so estes casos)

| Situacao | Quem detecta |
|---|---|
| Todas as fatias liberadas `DONE`/`BLOCKED`/`ABANDONADA`, ou nenhuma liberada | driver (`0` ou `5`) |
| Watchdog: 3ª tentativa da mesma fatia sem progresso | sessao da fatia (`DRIVER: PARAR` → `3`) |
| Decisao de **negocio** que o pacote nao fechou e que bloqueia a fatia | sessao da fatia (`3`) |
| Acao destrutiva ou fora do escopo do pacote | sessao da fatia (`3`) |
| Fatia reprovada duas vezes pelo verificador | driver (`6`) |
| `--max N` atingido ou `--checkpoint` | driver (`7`) |

Fora desses casos o loop **nao para**: nao pede ok para commitar, nao espera "proxima", nao
pergunta o que o pacote ja respondeu. Ao fim, as fatias `BLOCKED` cujo bloqueio mudou voltam
para `TODO` e o driver roda de novo.

## Modos

### Padrao — driver
O descrito acima. Uma sessao nova por fatia, o verificador em outra, a sessao principal so trata
paradas e fecha.

### `--checkpoint` (opt-in)
O driver roda com `--max 1`: uma fatia (com o verificador) por rodada; relatorio e aguarda
"proxima". So quando o usuario pede — por exemplo, a primeira feature num projeto recem-adotado.

### `--interativo` (excecao)
Para a fatia que precisa do usuario no meio (prototipo, decisao de UI). Esta sessao segue o
protocolo `.claude/skills/execute/slice-session.md` para **uma** fatia, lendo o recorte
(`node .claude/scripts/loop-briefing.mjs --feature {feature} --fatias U{N}`) em vez dos artefatos
inteiros, e pode perguntar onde o protocolo manda parar. A verificacao independente e daqui:
gates (`slice-gates.mjs`), depois os check agents da camada tocada sobre os arquivos da fatia
(`/frontend-validate`, `/backend-validate`, `@adr-validator`, na mesma mensagem) e a revisao
visual pelo protocolo do verificador. Fechada a fatia, relatorio e `/clear` antes da proxima — a
sessao que atravessa fatias carrega o contexto de todas.

### Multi-agente (pelo Preflight)
So nos grupos liberados no Preflight e com pontos de colisao declarados no grafo. O driver abre
**uma sessao para o grupo**: ela despacha um subagente por fatia, integra na ordem declarada e
roda os gates depois da integracao; o verificador confere o grupo e pode reprovar so parte
(`REPROVADAS:`), que repete sozinha.

---

## Learnings — registrar no instante

**No instante, nunca no fim**. Descoberta nao prevista → entrada Tipo 1 no arquivo do dominio (`docs/project/learnings/`) + uma linha `(llm)` no `ledger.md` (`<ts> | descoberta | domain:<d> | "<resumo>" | (llm)`). Correcao do usuario (nas paradas, no fechamento) → entrada `[CORRECAO DO USUARIO]` (com **Regra derivada**) + linha `(llm)` (`<ts> | correcao | domain:<d> | "<regra derivada>" | (llm)`) **antes de seguir**. Formatos em `docs/project/learnings/README.md`.

| Origem | Arquivo |
|---|---|
| `--team front` | `frontend-learnings.md` |
| `--team back` / `--team db` | `backend-learnings.md` |
| decisao de arquitetura | `architecture-learnings.md` |
| comportamento do kit / processo | `process-learnings.md` |

## Gate de uso de aprendizado (TRAVA — antes de declarar a feature concluida)

O aprendizado so vale se muda a implementacao. No fechamento, produzir (e gravar na spec, em `## Implementation Notes` ou secao propria):

```markdown
## Learnings aplicados — {feature}

| Learning | Dominio | Status | Como foi aplicado / por que nao se aplica |
|---|---|---|---|
| [CORRECAO 2026-05-16] nunca pular etapas | process | resolvido (aplicado) | pipeline seguido: plan→tasks→execute |
| [pendente] {descoberta} | {dominio} | aplicado / descartado | {o que foi feito} |
```

1. **Toda** `[CORRECAO DO USUARIO]` do escopo aparece com como foi respeitada.
2. Todo learning Tipo 1 `pendente` do dominio vira `aplicado` (flipar no arquivo) ou `descartado` (com motivo).
3. Cada correcao aplicada → uma linha `(llm)` no `ledger.md` (`<ts> | correcao | domain:<d> | "aplicada em {feature}" | (llm)`).

Learning relevante nao aplicado → corrigir antes de concluir; se a correcao exigir decisao de negocio, perguntar. Sem learnings no escopo → escrever "Nenhum learning aplicavel ao escopo desta feature".

## Gate de frontend (features de UI — conferido na Regra 0)

Quando a feature toca UI (`--team front` ou spec/tasks com telas/componentes/DS), **antes da corrida** (o portao final do `/tasks` ja deveria ter resolvido; aqui e a rede):

1. **Ancora de design** — Charter (`docs/project/ux-charter.md` com `## Register`) **ou** memoria de design (`docs/design-system/system.md` com Register, Direcao e Dominio preenchidos). Um basta.
2. **Shape brief** — `docs/project/ux-shape-{slug}.md` com o checklist de aprovacao marcado: brief aprovado + (mock aprovado **ou** mock dispensado com razao explicita).

Faltando → as fatias de UI ficam `BLOCKED` ("sem ancora de design / Shape — rodar `/ux shape {feature}`, que explora o dominio e grava a memoria quando nao ha ancora") e o loop segue com as fatias sem UI. Ao concluir: duas linhas extras em "Learnings aplicados" (`[GATE] Ancora` — Charter ou memoria, com register — e `[GATE] Shape brief`, com datas) + no `ledger.md`: `{ts} | decisao | domain:frontend | "Feature {slug}: ancora+shape gate passados; implementacao concluida" | (llm)`. Padrao de componente usado 2+ vezes na feature → memoria de design (`docs/design-system/system.md`).

---

## Fechamento (driver saiu com `0`)

1. **Checklist de pre-finalizacao** — `.claude/skills/execute/checklists.md`, Checklist 2.
2. **Seguranca** (`Preflight › Scan de seguranca` = `sim`):
   1. Invocar a skill do plugin **Claude Security** com o pedido completo — *"scan changes: o diff desta branch contra `{base}`, esforco `{esforco do Preflight}`; o custo de tempo e tokens ja foi aceito"* — para que ela nao abra menu nem confirmacao (o Preflight e o aceite).
   2. Achado **CRITICAL/HIGH** confirmado → pedir ao plugin o patch verificado do achado ("suggest patches" sobre o relatorio recem-gerado), aplicar com `git apply`, re-rodar os gates das camadas tocadas e commitar `fix(security): ...`. Patch recusado pelo proprio plugin (ele explica por que) → registrar e seguir.
   3. **MEDIUM/LOW** → vao para o relatorio final, com o caminho do relatorio do scan (`CLAUDE-SECURITY-<timestamp>/`, ignorado pelo git).
   4. Plugin nao instalado, Python ausente ou scan com falha → **NAO VERIFICADO**, declarado no relatorio e na promessa. Nao bloqueia.
   `Scan de seguranca` = `nao` → registrar "scan de seguranca nao solicitado" no relatorio final.
3. **`/verify-all {feature}`** — confronta o Loop Log com os gates reais (exit codes); so com veredito VERDE a promessa sai.
4. **Gate de uso de aprendizado** (acima).
5. **Calibracao** — preencher a Prontidao no `tasks.md`: indice previsto × realizado (iteracoes sem intervencao humana / total, pelo Log de iteracoes) e o custo total da tabela do driver.

## Completion promise (falsificavel)

> *"Todas as fatias U0…Un estao DONE no tasks.md com seus cenarios `[B]`/`[F]`/`[E2E]`
> passando; os gates (build/test, lint/type-check, e2e quando aplicavel) estao verdes; e a
> conformidade foi verificada por «verificadores que rodaram» — ou, para «os que nao
> rodaram», «auditoria equivalente», DECLARADO COMO TAL; e o scan de seguranca «rodou com N
> achados (X corrigidos) | nao foi solicitado | NAO VERIFICADO: motivo»."*

**PROIBIDO** afirmar conformidade por verificador que nao executou: a tabela "Custo por sessão
(driver)" mostra quais sessoes de verificador rodaram e o veredito de cada uma. Fatias
`BLOCKED`/`ABANDONADA` entram no relatorio final, nunca na promessa como concluidas.

## Regras de implementacao

1. Seguir as ADRs (OBRIGATORIO/PROIBIDO) e o Modulo de Referencia
2. Nao inventar features nem refatorar fora do que a fatia pede
3. Nomes conforme as convencoes das ADRs
4. Usar os Fatos Confirmados — nunca re-adivinhar
5. Nunca `DONE` com gate vermelho ou com ERRO de verificador em aberto

## Nivel de autonomia

| Acao | Autonomia |
|------|-----------|
| Soltar o driver com o pacote aprovado | **Alta** — sem pedir |
| Implementar, micro-loop de conserto, commit e push conforme o Preflight (sessao da fatia) | **Alta** |
| Decisao **diferida** (com default) / divergencia com default claro | **Alta** — aplica, registra, segue |
| Marcar `BLOCKED` e seguir com as liberadas | **Alta** |
| Decisao de **negocio** nao fechada que bloqueia | **ZERO** — pergunta |
| Acao destrutiva ou fora do escopo do pacote | **ZERO** — pergunta |
| Marcar `DONE` com gate vermelho ou ERRO de verificador | **ZERO** — proibido |
| Abandonar fatia | **ZERO** — so o usuario, no watchdog ou na reprovacao dupla |

## Estado duravel (ADR-0007 T1)

O estado do loop **e o `tasks.md`**: Preflight, Prontidao, Loop Log (`TODO`/`WIP`/`DONE`/`BLOCKED`/`ABANDONADA`), Log de iteracoes (a sessao da fatia escreve) e "Custo por sessão (driver)" (so o driver escreve). **PROIBIDO** `STATUS.md` concorrente. O `manifest.md` recebe so o ponteiro de 1 linha (Implement em andamento/completo).

## Handoffs

- → `/verify-all` (gate objetivo antes da promessa)
- → `/validate` (conformidade completa da feature, apos a ultima fatia)
- → `/review` (self-review antes de PR)
