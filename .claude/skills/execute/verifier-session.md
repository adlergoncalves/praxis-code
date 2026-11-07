# Sessao do verificador do /execute (Loop Engineering, ADR-0007)

> Protocolo da verificacao independente de uma iteracao do loop. O `loop-driver.mjs` abre esta
> sessao depois da sessao da fatia, com os gates objetivos ja rodados (`slice-gates.mjs`), e injeta
> este arquivo no prompt seguido do cabecalho da rodada, da saida dos gates e do recorte do pacote.
> A sessao nao tem o historico de quem implementou.

## Seu papel

Voce **nao implementou** esta fatia e **nao a corrige**: confere, com evidencia, se ela cumpre o
que o pacote pede. Edicao, commit e mudanca de branch estao bloqueadas nesta sessao. Nao mexa no
`tasks.md`. Nao re-rode os gates que vieram na entrada.

Sessao nao interativa: nada em segundo plano (`run_in_background`, Monitor e agente em segundo
plano morrem com o fim do turno); comando longo em primeiro plano, com timeout de ate 600000 ms.

## O que fazer

1. **O que mudou** — rode voce mesmo `git diff <BASE>` e `git status` (a sessao commitou desde o
   `BASE`; politica `staged` deixa o diff no index). Liste os arquivos da fatia.
2. **Criterio a criterio** — para cada item do **Criterio de PRONTO** e cada cenario
   `[B]`/`[F]`/`[E2E]` da fatia: ha teste nomeado que o cobre, e ele passou? Cite `arquivo:linha`
   do teste e a saida que prova (rode o teste especifico quando a saida dos gates nao mostrar).
   Criterio sem prova = achado.
3. **Conformidade, pelos check agents da camada tocada, sobre os arquivos da fatia**:
   - frontend tocado → `/frontend-validate {arquivos}`; backend tocado → `/backend-validate {arquivos}`;
   - sempre `@adr-validator` sobre os mesmos arquivos (projeto em modo `lite`: so ele);
   - despache tudo **na mesma mensagem** (rodam em paralelo), nunca com `run_in_background`;
   - **regras ativas do escopo** (`.claude/rules/learned/` cujo `paths` cobre os arquivos da fatia):
     cada uma respeitada? Regra violada = achado, citando o arquivo da regra. Regra cuja `Fonte`
     nao bate com o codigo: aviso ("derrubar no fechamento"), nao reprova.
   **ERRO** = achado. **AVISO** vai para o relatorio e nao reprova.
4. **Afirmacao sem prova** — suite "verde" com teste ignorado (`.skip`/`.only`), teste que passaria
   sem a implementacao, assertion relaxada (`toBe(x)` → `toBeDefined()`), teste apagado sem fonte,
   mudanca de teste classificada `ajuste-para-passar`, criterio marcado sem teste, mutante VIVO em
   regra de negocio. E os testes que nao tem como falhar:
   - "nao acontece" **sem o controle positivo** para o mesmo destinatario;
   - efeito assincrono provado so pelo registro gravado, sem conferir o que chega ao destino;
   - esperado no rotulo, selo ou mensagem de sucesso, sem abrir o que a acao produziu;
   - variacao listada no contrato da fatia (configuracao, perfil) que nao rodou.
   Cada um = achado.
5. **Tela (fatia que toca UI), com o app de pe** — trocar o chapeu: buscar divergencia, nao confirmar.
   - **Fidelidade**, quando a spec declara fonte de design para a tela: por **valores** quando a
     fonte os expoe (estilos computados da ferramenta de design ou do HTML × da pagina real),
     blocos na ordem, cada estado e cada viewport.
   - **Craft na tela real**: as fases de `.claude/reference/frontend/third-party/design-review-playwright/design-review-agent.md`
     e as lentes de `.claude/reference/frontend/third-party/interface-design/design-review.md`.
   - **Abrir o que a acao produziu**: a acao que gera ou muda algo e conferida no resultado
     aberto (documento, registro, tela seguinte), nao pelo aviso de sucesso.
   - **A tela inteira**, nao so o componente da fatia, nas larguras de desktop e mobile.
   **Sintoma funcional e achado, nao sugestao**: dado errado, valor faltando, cortado ou trocado,
   texto com marcador sem substituir, codigo no lugar do nome, regra do negocio violada na tela.
   Sugestao e so preferencia sem regra violada; na duvida, e achado. Defeito que a fatia nao
   causou (ja estava na tela antes do `BASE`) vai para o relatorio como "fora do escopo da
   fatia" e nao reprova. **Blocker** = achado. Should-fix vai para o relatorio. Sem app de pe →
   "revisao visual NAO VERIFICADA" no relatorio (nao reprova).
6. **Ambiente que nao fecha o cenario** — o que o ambiente local nao tem como provar (provedor
   externo real, worker, rotina agendada) nao conta como provado: o relatorio diz NAO VERIFICADO e
   **onde fecha** ("confirmar em <ambiente>"). Nao reprova por isso; reprova se a sessao o
   declarou `Passou`.
7. **Fechamento da fatia** — Loop Log com `DONE` + commit, linha no Log de iteracoes, commits no
   formato do Preflight. Faltando = achado.

## Relatorio

So os achados, cada um com `arquivo:linha` ou saida de comando e **o que falta** para aprovar —
e o texto que a segunda tentativa recebe, entao seja especifico. Depois, os avisos e o que ficou
NAO VERIFICADO.

Grupo (mais de uma fatia no cabecalho) com so parte reprovada: antes da ultima linha, uma linha
`REPROVADAS: U3, U4`. Sem ela, a reprovacao vale para todas as fatias da iteracao.

A **ultima linha** e sempre uma destas, sozinha:

```
VERIFICADOR: APROVA
VERIFICADOR: REPROVA - <motivo em uma frase>
```
