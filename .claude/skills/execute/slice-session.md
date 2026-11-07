# Sessao de fatia do /execute (Loop Engineering, ADR-0007)

> Protocolo de UMA iteracao do loop: uma fatia (ou um grupo liberado no Preflight). O
> `loop-driver.mjs` injeta este arquivo no prompt de cada sessao nova, seguido do cabecalho da
> rodada e do recorte do pacote (`loop-briefing.mjs`). O `/execute --interativo` segue o mesmo
> protocolo na sessao principal. Regra do pacote vence este texto onde divergir.

## Onde voce esta

- **Sessao nao interativa, que termina ao fim da fatia.** Ninguem responde no meio. Onde este
  protocolo manda parar e perguntar, encerre com a pergunta no relatorio e `DRIVER: PARAR - <motivo>`.
- **Quem confere nao e voce.** Depois desta sessao, o driver roda os gates
  (`slice-gates.mjs`) e abre o **verificador**, outra sessao, que le o diff desde o `BASE` do
  cabecalho. Reprovada, a fatia volta para `WIP` e repete uma vez, um degrau de modelo acima,
  com os achados no prompt. Por isso: **nao rode `/frontend-validate`, `/backend-validate` nem
  `@adr-validator` aqui** — e trabalho do verificador.
- **O recorte substitui a leitura do pacote.** Ele traz a fatia, DoD, Gates, Preflight, Loop Log,
  as linhas do Log de iteracoes, as regras, decisoes e armadilhas da spec, e o Modulo de
  Referencia, os Fatos Confirmados e a Infra do plan. Abra spec, plan ou tasks inteiros so se
  faltar algo, e diga no relatorio o que faltou. ADRs citados na fatia: abra-os.
- **Regras ativas do projeto** (`.claude/rules/learned/`, ADR-0010) carregam sozinhas quando voce
  le ou edita um arquivo do `paths` delas: sao restricoes antes de escrever codigo e prevalecem
  sobre spec e plan. Regra com `**Fonte**` que o codigo contradiz **nao se aplica**: nao a edite
  nem apague (fora do escopo da fatia) — registre no relatorio ("regra X: fonte nao bate") e a
  sessao principal derruba no fechamento. Conflito com **regra de negocio** → `DRIVER: PARAR`
  com a pergunta.

## Passos

1. **Watchdog anti-giro** — conte no Log de iteracoes (no recorte) as tentativas anteriores desta
   fatia **sem progresso** (nao virou `DONE` e nao gerou commit). Se esta for a **3ª**, nao tente:
   diagnostico curto (o que foi tentado, por que nao avancou) e `DRIVER: PARAR - watchdog <fatia>`,
   com as opcoes para o usuario: abandonar (`ABANDONADA`), `BLOCKED` ou tentar mais N vezes.
2. **Marcar `WIP`** no Loop Log. Respeite o `TEAM` do cabecalho: fatia que depende de trabalho de
   outro team ainda nao feito → `BLOCKED` (motivo + o que destrava) e encerre.
3. **Ler o contrato da fatia** — valor, criterio de PRONTO file-level, verificacao manual, ADRs,
   `Ref (arquivo:linha)`, Fatos Confirmados, Armadilhas. Use os valores reais: **nao re-adivinhe**
   enums, faixas, roles, codigos HTTP.
4. **Test-first** (mudanca de comportamento em codigo testado; arquivo novo tambem):
   1. **RED** — escreva/altere o teste, **rode e mostre a saida falhando**.
   2. **CLASSIFY** — `contrato-novo` · `especificacao-nova` · `refactor-puro` · `teste-de-implementacao` · `ajuste-para-passar`.
   3. **JUSTIFY** — uma frase, citando a fonte (FR, regra de negocio, decisao da spec).
   4. **GREEN** — producao ate passar. **REFACTOR** sem mexer no teste.

   **`ajuste-para-passar` nao fecha fatia**: teste mudado para acomodar o codigo, assertion
   relaxada, `.skip`/`.only` deixado ou teste apagado sem fonte → corrija a producao. Teste antigo
   que contradiz a spec e divergencia: Implementation Notes com a fonte, e a mudanca vira
   `especificacao-nova`. **Teste de regra de negocio que nasce verde nao provou nada**: ate 5
   mutantes da regra num JSON e `node .claude/scripts/mutants.mjs <arquivo.json>`; VIVO → reforce
   o teste ate matar. Placar nas Notas da fatia.

   **Teste que nao tem como falhar nao prova a regra:**
   - teste de "nao acontece" carrega o **controle positivo** — o caso vizinho em que o efeito
     acontece, para o **mesmo destinatario**, no mesmo teste ou ao lado dele;
   - efeito assincrono (notificacao, mensagem, fila, job) se confere **no destino**, pelo que quem
     recebe ve; registro gravado nao prova entrega;
   - o esperado e o que a acao produziu, aberto (documento, registro, tela resultante), nao o
     rotulo, o selo ou a mensagem de sucesso;
   - cada variacao que o contrato da fatia lista (configuracao, perfil) roda.
5. **Testes incrementais** — durante RED→GREEN, so os testes da area tocada. A suite da camada roda
   uma vez, no gate da fatia.
6. **Gates antes do commit** — o sinal e o **exit code**:
   - `node .claude/scripts/slice-gates.mjs --feature <FEATURE> --since <BASE>` (os comandos da
     tabela Gates, so das camadas tocadas). Exit 1 → corrija e rode de novo. Exit 2 (comando
     inexistente) → registre no relatorio; nao e defeito da fatia, mas tambem nao e verde;
   - camada com Caminhos `—` na tabela (ex.: e2e com o app de pe): rode voce, quando o ambiente
     estiver de pe — senao, NAO VERIFICADO no relatorio. Cenario que o ambiente local nao tem como
     fechar (provedor externo real, worker, rotina agendada): NAO VERIFICADO com **onde fecha**
     ("confirmar em <ambiente>"), nunca `Passou`;
   - `node .claude/scripts/build-gate.mjs .` e `node .claude/scripts/frontend/check-learnings.mjs <path>`, quando existirem no projeto;
   - fatia tocou manifesto de dependencia (`package.json`, lockfile, `*.csproj`,
     `requirements*.txt`, `pyproject.toml`...) → `node .claude/scripts/deps-audit.mjs .`: achado
     novo → versao corrigida dentro da fatia; sem versao corrigida, registre no relatorio e siga.
   **Flaky**: no maximo 2 re-execucoes; na 3ª falha e falha real.
7. **Micro-loop de conserto** — gate vermelho → diagnostico, correcao, gate de novo, ate verde.
   **Nunca `DONE` com gate vermelho.** Nao destrava (dependencia ou credencial ausente,
   contradicao de spec que exige decisao de negocio) → `BLOCKED` (passo 10).
   Depois de 10 minutos de tentativa e erro sem achar a causa: pare de tentar e siga uma hipotese
   por vez (hipotese, previsao escrita antes, experimento, observacao), registrando cada uma nas
   Notas da fatia.
8. **DoD da fatia** — o checklist do `tasks.md`, incluindo a **verificacao manual** do contrato e a
   **fidelidade** (tela com fonte de design), executadas quando o ambiente permite; senao, NAO
   VERIFICADO no relatorio. Checklist de seguranca BaaS (`.claude/skills/execute/checklists.md`,
   Checklist 1) quando a fatia toca a camada de banco de uma stack BaaS.
9. **Commit conforme o Preflight** — `test(...)` e depois `feat|fix(...)`, `git add` com caminhos
   explicitos, sem pedir ok (o Preflight e a autorizacao); push conforme o Preflight. Politica
   `staged`: nao commite — deixe staged e feche `DONE (staged)`.
10. **Fechar a iteracao no `tasks.md`**:
    - concluida → `DONE` no Loop Log (data + commit);
    - `BLOCKED` → uma linha de motivo + o que destrava nas Notas;
    - **sempre** uma linha no Log de iteracoes: data · fatia · resultado (`DONE`/`BLOCKED`/
      `PARCIAL`/`SEM PROGRESSO`) · gates · commits. O custo, o driver anota na tabela dele.

## Decisoes no meio da fatia

- **Default claro dentro do escopo aprovado** (decisao diferida com default, convencao do projeto,
  Fato Confirmado) → aplique, registre em `spec.md › ## Implementation Notes` (requisito original,
  divergencia, decisao) e siga.
- **Decisao de negocio que bloqueia a fatia** → `DRIVER: PARAR - <pergunta>`.
- **Decisao que nao bloqueia esta fatia** → registre e siga.
- **Acao destrutiva ou fora do escopo do pacote** → `DRIVER: PARAR - <o que e por que>`.
- **Descoberta nao prevista** → no instante: entrada Tipo 1 no learning do dominio
  (`docs/project/learnings/`) + uma linha `(llm)` no `ledger.md`. Nao crie regra ativa aqui
  (`.claude/rules/learned/` e da sessao principal, com o usuario); proponha no relatorio.

## Execucao sem humano

- **Nada em segundo plano.** Encerrar o turno encerra a sessao, e nesta sessao nao existe
  notificacao depois do fim do turno: `run_in_background`, Monitor e agente em segundo plano
  morrem com a tarefa pela metade. Comando longo (suite, mutantes, e2e) roda em **primeiro
  plano**, com timeout de ate 600000 ms; passou disso, divida em partes. Nunca encerre "aguardando".
- **Subagente** (grupo, abaixo): varias chamadas na mesma mensagem rodam em paralelo; nunca com
  `run_in_background`.
- **Recurso compartilhado** (app local, banco, portas) que outra sessao esta usando: faca antes o
  que nao depende dele e depois espere em primeiro plano. Nunca derrube o que outra sessao subiu.
  Suba e derrube o que for seu.

## Grupo (Preflight multi-agente)

Quando o cabecalho traz mais de uma fatia, elas sao um grupo liberado no Preflight, com pontos
de colisao declarados. Despache **um subagente por fatia**, todos na mesma mensagem. Brief de
cada um = protocolo deste arquivo para a fatia dele + o recorte dela
(`node .claude/scripts/loop-briefing.mjs --feature <FEATURE> --fatias <Ux>`): ele implementa
test-first e devolve o diff e a saida do RED, **sem commitar e sem mexer no `tasks.md`**. Voce
integra na ordem de integracao declarada, tocando os pontos de colisao uma fatia por vez, roda os
gates **depois** da integracao, commita fatia a fatia e fecha cada uma no `tasks.md` (passo 10).
O relatorio cobre todas.

## Relatorio e ultima linha

```markdown
✅ Fatia U«n» — {titulo} — DONE            (ou: ⛔ BLOCKED / ⏸ PARADA)

- **Entregue**: {o que passou a funcionar}
- **Gates**: {comando → exit code}; NAO VERIFICADO: {o que e por que}
- **Verifique na mao (1-3 passos)**: 1. {…}; 2. {…}
- **Decisoes tomadas sem parar**: {defaults aplicados, Implementation Notes}
- **Faltou no recorte**: {secao que precisou abrir, ou "nada"}
```

A **ultima linha** do relatorio e sempre uma destas, sozinha:

```
DRIVER: CONTINUAR
DRIVER: PARAR - <motivo em uma frase>
```
