---
description: "Sub-fase 5c: Executa o pacote aprovado em LOOP AUTONOMO por fatia vertical (1 fatia = 1 User Story), NA SESSAO PRINCIPAL: implementa test-first, roda gates, conserta ate verde, despacha verificadores independentes, marca DONE e segue para a proxima — so para no realmente bloqueante. --checkpoint para a cada fatia; --driver roda uma fatia por sessao nova. Loop Engineering (ADR-0007)."
user-invocable: true
depends:
  - .claude/skills/execute/checklists.md
  - .claude/scripts/loop-doctor.mjs
  - .claude/scripts/mutants.mjs
  - .claude/skills/verify-all/SKILL.md
  - .claude/skills/frontend-validate/SKILL.md
  - .claude/skills/backend-validate/SKILL.md
  - .claude/agents/architecture/adr-validator.md
  - .claude/reference/frontend/third-party/design-review-playwright/design-review-agent.md
  - .claude/reference/frontend/third-party/interface-design/design-review.md
---

# /execute

Executa o pacote aprovado (spec + plan + tasks) **em loop autonomo por fatia vertical**
(Loop Engineering, ADR-0007). Sub-fase 5c do `/implement`.

## Principio: a discussao acontece antes; a execucao nao para

O pacote aprovado no portao final do `/tasks` e o **contrato de execucao**: ali o usuario
leu o guia de validacao, conferiu o entendimento, viu as paradas provaveis eliminadas e
respondeu o Preflight. Por isso o loop **encadeia as fatias sem pedir aprovacao entre
elas**, commita conforme o Preflight e so devolve o controle no que e realmente
bloqueante (secao "Quando o loop para"). Decisao pendente que **nao bloqueia** vira linha
no relatorio e o loop segue. Pausa "para o usuario decidir" nao existe: ou o loop segue
trabalhando, ou para e pergunta.

## Onde roda — sessao principal (ADR-0007)

O loop roda **na sessao principal**, nunca delegado a um subagente:

1. **Perguntar quando for preciso** — subagente nao fala com o usuario: decide sozinho ou encerra.
2. **Mostrar o RED** — a saida do teste falhando aparece, nao um resumo de quem implementou.
3. **Verificador independente** — so a sessao principal despacha os check agents. Quem implementa nao e quem confere (`maker ≠ checker`).

Subagentes entram so como **verificadores** e, no modo multi-agente, como **trabalhadores de uma fatia cada** — integracao e verificacao continuam aqui.

## Input

`/execute {feature} [--team front|back|db|full] [--from U{N}] [--max N] [--checkpoint] [--driver]`

- `{feature}` — nome da feature (deve ter `docs/specs/{feature}/tasks.md`)
- `--team` — escopo do team (default `full`); fatias/sub-tasks de outro team sao puladas com log
- `--from U{N}` — comecar a partir de uma fatia especifica
- `--max N` — teto de fatias nesta corrida (default: todas as liberadas)
- `--checkpoint` — para apos cada fatia e aguarda "proxima" (opt-in: so quando o usuario pede)
- `--driver` — sessao nao interativa aberta pelo `loop-driver.mjs` (uma fatia por sessao nova)

## Pre-requisitos (ADR-0007 T2)

- **spec + plan + tasks** existirem — sem isso, NAO executa: indicar a skill faltante (`/spec-from-prd`, `/plan`, `/tasks`)
- **Pacote aprovado** — `tasks.md › Preflight › Pacote aprovado em` preenchido pelo portao final do `/tasks`. Sem aprovacao: rodar o portao final do `/tasks` (guia de validacao + metricas + Preflight) antes de comecar
- **Modo lite**: spec minima + tasks por fatia + DoD minimal; a aprovacao e o resumo no chat, sem guia publicado

---

## REGRA 0 — Preflight (no inicio de toda corrida e de toda retomada de sessao)

Antes de qualquer codigo:

0. **Gate 0 — `node .claude/scripts/loop-doctor.mjs --feature {feature}`**: pacote aprovado, branch do Preflight, **frescor dos Fatos Confirmados** (todo `arquivo:linha` do plan ainda existe) e as checagens de ambiente da feature (`docs/specs/{feature}/doctor.json`). **Exit 1** → parada de primeira classe: apresentar os `[FALHOU]` e parar antes de gastar iteracao (Fato velho → re-pinar no plan; em `--driver`: `DRIVER: PARAR - Gate 0`). **Exit 3** → as fatias listadas ficam `BLOCKED` de largada (motivo = a checagem) e a corrida segue com as demais. **Exit 2** → erro do proprio Gate 0 (uso invalido, `doctor.json` malformado): tratar como exit 1 — corrigir antes da corrida. `[AVISO]` vai para o relatorio.
1. **Retomada** — ler `tasks.md` (DoD, Gates, Preflight, Prontidao, **Loop Log**, **Log de iteracoes**), `spec.md` (Decisoes Fechadas/Diferidas, Armadilhas), `plan.md` (**Fatos Confirmados**, **Modulo de Referencia**, Infra de Verificacao), ADRs e constitution. Fatias `DONE` ficam; retomar da primeira `TODO`/`WIP` no grafo (ou `--from`). Conferir no `git log` que os commits citados no Loop Log existem.
2. **Preflight respondido** — linha `—` no Preflight e falha de geracao do pacote: perguntar **todas juntas, uma vez, antes de comecar a corrida** — nunca no meio dela. Em `--driver`: encerrar com `DRIVER: PARAR - Preflight sem resposta`.
3. **Branch** — estar na branch do Preflight. Nao existe → criar a partir da base declarada. Arvore suja com trabalho alheio a feature → parar e perguntar (unica situacao em que a branch trava a corrida). Nunca implementar na branch principal (`main`/`master`/`develop`).
4. **Ambiente** — o que o Gate 0 nao cobre: itens da Infra de Verificacao (plan) + ferramentas que as fatias pendentes exigem (runner de e2e, banco/servicos locais, **app rodando localmente para a revisao visual** das fatias de UI, fonte do prototipo quando houver). Subir o que for do proprio projeto; o que estiver morto e nao puder ser subido → a fatia que depende dele vira `BLOCKED` **de largada**, e o loop segue com as demais.
5. **Learnings** — carregar **todos** os arquivos de `docs/project/learnings/` e **todas** as `[CORRECAO DO USUARIO]`: sao restricoes antes de escrever codigo. Correcao do usuario prevalece sobre spec/plan; se o conflito for de **regra de negocio**, perguntar antes de comecar a corrida.
6. **Gate de frontend** (feature que toca UI) — conferido aqui, uma vez, nunca no meio da corrida (ver secao Gate de frontend).

---

## LOOP — uma iteracao = uma fatia

1. **Watchdog anti-giro (antes de comecar a fatia)** — contar no **Log de iteracoes** as tentativas anteriores desta fatia **sem progresso** (nao virou `DONE` e nao gerou commit novo). Se esta for a **3ª**, NAO tentar de novo: diagnostico curto (o que foi tentado, por que nao avancou) e perguntar ao usuario — (a) **abandonar** (status `ABANDONADA` + motivo nas Notas); (b) **`BLOCKED`** e seguir; (c) **tentar mais N vezes** (com abordagem nova, se ele quiser).
2. **Selecionar** a proxima fatia `TODO`/`WIP` liberada no grafo; marcar `WIP`. Respeitar `--team`. Fatia que depende de trabalho de outro team ainda nao feito → `BLOCKED` (motivo + o que destrava) e seguir com as liberadas.
3. **Ler o contrato da fatia** — valor entregavel, criterio de PRONTO file-level, verificacao manual, ADRs, `Ref (arquivo:linha)`, **Fatos Confirmados** e **Armadilhas**. Usar os valores reais — **NAO re-adivinhar** enums, faixas, roles, codigos HTTP.
4. **Test-first** (mudanca de comportamento em codigo testado; arquivo novo tambem):
   1. **RED** — escrever/alterar o teste → **rodar e mostrar a saida falhando**.
   2. **CLASSIFY** — classificar a mudanca do teste: `contrato-novo` · `especificacao-nova` · `refactor-puro` · `teste-de-implementacao` · `ajuste-para-passar`.
   3. **JUSTIFY** — uma frase: por que a mudanca e legitima, citando a fonte (FR, regra de negocio, decisao da spec).
   4. **GREEN** — producao ate passar. **REFACTOR** — limpar sem mexer no teste (se o teste mudar, a etapa e invalida).

   **`ajuste-para-passar` nao fecha fatia.** Teste mudado para acomodar o codigo, assertion relaxada (`toBe(x)` → `toBeDefined()`), `.skip`/`.only` deixado ou teste apagado sem fonte → voltar e corrigir a producao. Se o teste antigo contradiz a spec, e divergencia: Implementation Notes (feedback loop) com a fonte, e a mudanca vira `especificacao-nova`.

   **Teste que nasce verde nao provou nada.** Quando nao ha RED possivel (regra que ja existia, teste de caracterizacao) e o teste cobre **regra de negocio**: ate 5 mutantes da regra num JSON e `node .claude/scripts/mutants.mjs <arquivo.json>` (aplica, roda o teste, reverte byte a byte). **VIVO** = o teste nao protege a regra → reforcar o teste ate matar. **NAO COMPILA** = reescrever o mutante. Placar nas Notas da fatia.

   Auto-revisao antes do commit: (a) o teste mudado testa comportamento publico ou detalhe interno? (b) a assertion mudou de **valor** (legitimo) ou de **natureza** (relaxada — suspeito)? (c) revertendo so a producao, o teste antigo falharia? Se nao, ele nao protegia nada.
5. **Testes incrementais** — durante RED→GREEN, so os testes do modulo/area tocado. A suite completa da(s) camada(s) roda **uma vez**, no gate da fatia.
6. **Gates objetivos** — o sinal e o **exit code**, nao o julgamento do modelo:
   - os comandos da tabela **Gates** do `tasks.md` (o kit e agnostico: NAO inventar comando);
   - `node .claude/scripts/build-gate.mjs .` e `node .claude/scripts/frontend/check-learnings.mjs <path>` quando existirem;
   - e2e quando aplicavel e o ambiente estiver de pe (senao: NAO VERIFICADO, declarado);
   - **fatia tocou um manifesto de dependencia** (`package.json`, lockfile, `*.csproj`, `requirements*.txt`, `pyproject.toml`...) → `node .claude/scripts/deps-audit.mjs .`: so fala do que **entrou** desde o baseline. Achado novo → tentar a versao corrigida dentro da fatia; sem versao corrigida, registrar no relatorio e seguir (aceitar no baseline e decisao humana, a posteriori — ADR-0008).
   **Flaky**: re-rodar no maximo 2×; na 3ª falha consecutiva e falha real — diagnosticar.
7. **Micro-loop de conserto** — gate vermelho → diagnosticar, corrigir, re-rodar ate verde. Nunca `DONE` com gate vermelho. Nao destrava (dependencia/credencial ausente, contradicao de spec que exige decisao de negocio) → `BLOCKED` (passo 12).
8. **Verificacao independente (verificador ≠ maker)** — com os gates verdes, despachar daqui, em paralelo, os verificadores da(s) camada(s) tocada(s) com **escopo = arquivos da fatia** (`git diff` desde o inicio da fatia):
   - frontend tocado → `/frontend-validate {arquivos}`; backend tocado → `/backend-validate {arquivos}`; sempre `@adr-validator` (modo lite: so ele).
   - **ERRO** → corrigir → re-rodar gates e o verificador que acusou. **AVISO** → vai para o relatorio.
   - **Revisao visual (toda fatia que toca UI)** — trocar o chapeu: buscar divergencia, nao confirmar o proprio trabalho. Com o app rodando:
     1. **Fidelidade** (so quando a spec declara fonte de design para a tela — prototipo nao e obrigatorio): conferir por **valores** quando a fonte os expoe (estilos computados da ferramenta de design ou CSS do HTML × estilos computados da pagina real), blocos na ordem, cada estado e cada viewport; fonte so em imagem → conferencia visual.
     2. **Craft na tela real**: fases de `third-party/design-review-playwright/design-review-agent.md` (fluxo principal e estados de interacao; 1440/768/375; teclado e foco; formulario invalido, overflow, vazio/erro/carregando; console) e as lentes + regua de aprovacao de `third-party/interface-design/design-review.md`, contra a intencao do Charter e da memoria de design.
     3. **Blocker** → corrigir → rever; no maximo **3 rodadas**. Should-fix restante → relatorio. Sem app rodando → "revisao visual NAO VERIFICADA" no relatorio (nao bloqueia).
     4. Registrar nas Notas da fatia o que foi conferido. Padrao de componente usado 2+ vezes na fatia → memoria de design (`docs/design-system/system.md`).
9. **Checklists de execucao** — os condicionais de `.claude/skills/execute/checklists.md` (seguranca BaaS por fatia que toca banco; pre-finalizacao antes de declarar a feature concluida). Item falho → corrigir; justificativa explicita so quando o item nao se aplica.
10. **Cumprir o DoD** da fatia (checklist do `tasks.md`) e a **verificacao manual** do contrato, executando-a quando o ambiente permite.
11. **Commit conforme o Preflight** — `test(...)` e depois `feat|fix(...)`, sem pedir ok (o Preflight e a autorizacao). Push conforme o Preflight. Politica `staged`: nao commitar; deixar staged e fechar `DONE (staged)`.
12. **Fechar a iteracao**:
    - fatia concluida → `DONE` no **Loop Log** (data + commit);
    - **BLOCKED** → 1 linha de motivo + o que destrava nas Notas; seguir para a proxima liberada;
    - **em TODA iteracao, concluida ou nao**, uma linha no **Log de iteracoes** (data · fatia · resultado `DONE`/`BLOCKED`/`PARCIAL`/`SEM PROGRESSO` · gates · commits · custo aproximado, se disponivel) — e o que alimenta o watchdog e a calibracao do indice de autonomia.
13. **Relatorio da fatia e seguir** — o relatorio sai e o loop **comeca a proxima fatia na mesma tomada**:

```markdown
✅ Fatia U«n» — {titulo} — DONE

- **Entregue**: {o que passou a funcionar}
- **Gates**: {comando → exit code}
- **Verificadores**: {quais rodaram → erros/avisos; o que foi corrigido}
- **Verifique na mao (1-3 passos)**: 1. {…}; 2. {…}
- **Decisoes tomadas sem parar**: {defaults aplicados, Implementation Notes — se houve}
- **Seguindo para**: U«n+1» — {titulo}
```

---

## Quando o loop para (so estes casos)

| Situacao | O que fazer |
|---|---|
| Todas as fatias liberadas `DONE`/`BLOCKED`/`ABANDONADA` | Fechamento: seguranca → `/verify-all` → completion promise → relatorio final |
| Nenhuma fatia liberada (todas as restantes dependem de `BLOCKED`) | "bloqueado, preciso de X" — lista do que destrava cada uma |
| Watchdog: 3ª tentativa da mesma fatia sem progresso | Diagnostico + pergunta (abandonar · BLOCKED · tentar mais N) |
| Decisao de **negocio** que o pacote nao fechou e que bloqueia a fatia | Pergunta direta ao usuario e aguarda a resposta (nao e pausa: e bloqueio) |
| Acao destrutiva ou fora do escopo do pacote | Pergunta antes de agir |
| `--max N` atingido ou `--checkpoint` ativo | Relatorio e para |

Fora desses casos o loop **nao para**: nao pede ok para commitar, nao espera "proxima", nao agenda espera, nao pergunta o que o pacote ja respondeu. Uma fatia `BLOCKED` nao para a corrida — o loop segue com as liberadas e re-tenta as `BLOCKED` no fim, se o que as bloqueava mudou.

## Feedback loop (spec ← implementacao)

Divergencia entre spec e realidade (requisito inviavel, edge case nao previsto, complexidade subestimada):

- **Tem default claro dentro do escopo aprovado** (decisao diferida com default, convencao do projeto, Fato Confirmado) → aplicar, registrar na spec em `## Implementation Notes`, citar no relatorio e **seguir**.
- **Exige decisao de negocio e bloqueia a fatia** → perguntar (secao acima). Em `--driver`: `DRIVER: PARAR - <pergunta>`.
- **Exige decisao mas nao bloqueia** (afeta outra fatia, ou e melhoria) → registrar e seguir; a fatia afetada vira `BLOCKED` quando chegar a vez dela, se a decisao ainda estiver aberta.

```markdown
## Implementation Notes

### {data} — {titulo}
- **Requisito original**: FR-{NNN} — {descricao}
- **Divergencia**: {o que mudou e por que}
- **Decisao**: {default aplicado / ajustado pelo usuario / mantido} — {justificativa}
```

## Learnings — registrar no instante

**No instante, nunca no fim** (a janela pode fechar antes). Descoberta nao prevista → entrada Tipo 1 no arquivo do dominio (`docs/project/learnings/`) + uma linha `(llm)` no `ledger.md` (`<ts> | descoberta | domain:<d> | "<resumo>" | (llm)`). Correcao do usuario → entrada `[CORRECAO DO USUARIO]` (com **Regra derivada**) + linha `(llm)` (`<ts> | correcao | domain:<d> | "<regra derivada>" | (llm)`) **antes de seguir**. Formatos em `docs/project/learnings/README.md`.

| Origem | Arquivo |
|---|---|
| `--team front` | `frontend-learnings.md` |
| `--team back` / `--team db` | `backend-learnings.md` |
| decisao de arquitetura | `architecture-learnings.md` |
| comportamento do kit / processo | `process-learnings.md` |

---

## Modos

### Autonomo (default)
Encadeia todas as fatias liberadas (ou ate `--max N`) na mesma sessao, com os guardrails sempre ligados (ADR-0007 T3): teto (`--max` ou fim das liberadas), **sem progresso** (mesmo erro de gate / diff vazio em 2 iteracoes seguidas → `BLOCKED` e segue; ao re-tentar a `BLOCKED` no fim da corrida, a 3ª tentativa sem progresso aciona o watchdog do passo 1; nunca repetir a mesma correcao), watchdog e as paradas da tabela acima. Corrida longa enche a janela: o `loop-driver.mjs` resolve isso abrindo uma sessao por fatia.

### `--checkpoint` (opt-in)
Para apos cada fatia e aguarda "proxima"/"continuar". So quando o usuario pede — por exemplo, a primeira feature num projeto recem-adotado, para calibrar.

### `--driver` — uma fatia por sessao nova
Aberto por `node .claude/scripts/loop-driver.mjs --feature {feature}`: cada fatia roda num processo `claude -p` proprio, com contexto vazio; o `tasks.md` e o git dao a retomada, e a Regra 0 roda em toda sessao. Corta o custo de contexto acumulado.

A sessao **nao e interativa** e termina ao fim da fatia:
- Toda situacao da tabela "Quando o loop para" que exige pergunta → registrar a pergunta no relatorio e encerrar com `DRIVER: PARAR - <motivo>`.
- Nunca encerrar esperando tarefa em segundo plano (e2e, build longo): esperar em primeiro plano, ou registrar no `tasks.md` e seguir.
- A **ultima linha** do relatorio e sempre uma destas, sozinha: `DRIVER: CONTINUAR` ou `DRIVER: PARAR - <motivo em uma frase>`.

### Multi-agente (pelo Preflight)
So nos grupos liberados no Preflight, e so se o grafo declara os **pontos de colisao** do grupo. Uma iteracao despacha o grupo inteiro: **um subagente por fatia**, cada um com o contrato da fatia, os Fatos Confirmados, as Armadilhas e o DoD no brief (o subagente nao sabe nada desta conversa). A integracao segue a ordem declarada; os gates e a **verificacao independente rodam aqui, apos a integracao**; o relatorio cobre todas as fatias do grupo — e o loop segue.

---

## Gate de uso de aprendizado (TRAVA — antes de declarar a feature concluida)

O aprendizado so vale se muda a implementacao. Ao concluir a ultima fatia, produzir (e gravar na spec, em `## Implementation Notes` ou secao propria):

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

Faltando → as fatias de UI ficam `BLOCKED` ("sem ancora de design / Shape — rodar `/ux shape {feature}`, que explora o dominio e grava a memoria quando nao ha ancora") e o loop segue com as fatias sem UI. Ao concluir: duas linhas extras em "Learnings aplicados" (`[GATE] Ancora` — Charter ou memoria, com register — e `[GATE] Shape brief`, com datas) + no `ledger.md`: `{ts} | decisao | domain:frontend | "Feature {slug}: ancora+shape gate passados; implementacao concluida" | (llm)`.

---

## Fechamento de seguranca (antes da promessa)

Com todas as fatias liberadas fechadas e `Preflight › Scan de seguranca` = `sim`:

1. Invocar a skill do plugin **Claude Security** com o pedido completo — *"scan changes: o diff desta branch contra `{base}`, esforco `{esforco do Preflight}`; o custo de tempo e tokens ja foi aceito"* — para que ela nao abra menu nem confirmacao (o Preflight e o aceite).
2. Achado **CRITICAL/HIGH** confirmado → pedir ao plugin o patch verificado do achado ("suggest patches" sobre o relatorio recem-gerado), aplicar com `git apply`, re-rodar os gates das camadas tocadas e commitar `fix(security): ...`. Patch recusado pelo proprio plugin (ele explica por que) → registrar e seguir.
3. **MEDIUM/LOW** → vao para o relatorio final, com o caminho do relatorio do scan (`CLAUDE-SECURITY-<timestamp>/`, ignorado pelo git).
4. Plugin nao instalado, Python ausente ou scan com falha → **NAO VERIFICADO**, declarado no relatorio e na promessa. Nao bloqueia.

`Scan de seguranca` = `nao` → registrar "scan de seguranca nao solicitado" no relatorio final.

## Completion promise (falsificavel)

Antes de emitir, rodar **`/verify-all {feature}`** — confronta o Loop Log com os gates reais (exit codes); so com veredito VERDE a promessa sai. Ao concluir TODAS as fatias:

> *"Todas as fatias U0…Un estao DONE no tasks.md com seus cenarios `[B]`/`[F]`/`[E2E]`
> passando; os gates (build/test, lint/type-check, e2e quando aplicavel) estao verdes; e a
> conformidade foi verificada por «verificadores que rodaram» — ou, para «os que nao
> rodaram», «auditoria equivalente», DECLARADO COMO TAL; e o scan de seguranca «rodou com N
> achados (X corrigidos) | nao foi solicitado | NAO VERIFICADO: motivo»."*

**PROIBIDO** afirmar conformidade por verificador que nao executou. Fatias `BLOCKED`/`ABANDONADA` entram no relatorio final, nunca na promessa como concluidas. Ao fim, preencher a **calibracao** da Prontidao no `tasks.md` (indice previsto × realizado: iteracoes sem intervencao humana / total, pelo Log de iteracoes).

## Regras de implementacao

1. Seguir as ADRs (OBRIGATORIO/PROIBIDO) e o Modulo de Referencia
2. Nao inventar features nem refatorar fora do que a fatia pede
3. Nomes conforme as convencoes das ADRs
4. Usar os Fatos Confirmados — nunca re-adivinhar
5. Nunca `DONE` com gate vermelho ou com ERRO de verificador em aberto

## Nivel de autonomia

| Acao | Autonomia |
|------|-----------|
| Ler tasks, spec, plan, ADRs, learnings | **Alta** |
| Implementar, micro-loop de conserto, verificadores | **Alta** — ate verde |
| Iniciar a proxima fatia | **Alta** — sem pedir (salvo `--checkpoint`) |
| Commit e push conforme o Preflight | **Alta** — o Preflight e a autorizacao |
| Decisao **diferida** (com default) / divergencia com default claro | **Alta** — aplica, registra, segue |
| Marcar `BLOCKED` e seguir com as liberadas | **Alta** |
| Decisao de **negocio** nao fechada que bloqueia | **ZERO** — pergunta |
| Acao destrutiva ou fora do escopo do pacote | **ZERO** — pergunta |
| Marcar `DONE` com gate vermelho ou ERRO de verificador | **ZERO** — proibido |
| Abandonar fatia | **ZERO** — so o usuario, no watchdog |

## Estado duravel (ADR-0007 T1)

O estado do loop **e o `tasks.md`**: Preflight, Prontidao, Loop Log (`TODO`/`WIP`/`DONE`/`BLOCKED`/`ABANDONADA`) e Log de iteracoes. **PROIBIDO** `STATUS.md` concorrente. O `manifest.md` recebe so o ponteiro de 1 linha (Implement em andamento/completo).

## Handoffs

- → `/verify-all` (gate objetivo antes da promessa)
- → `/validate` (conformidade completa da feature, apos a ultima fatia)
- → `/review` (self-review antes de PR)
