# ADR-0010: Memória do projeto — regra ativa carregada por caminho, evidência sob demanda, validade e cobrança

**Status:** Aceito
**Data:** 2026-11-05
**Decisores:** Adler (dev)
**Escopo:** Como o que o projeto aprende (correções do usuário, decisões, descobertas) chega ao contexto de cada sessão, como deixa de valer e como vira regra formal. Vale para a sessão principal, para subagentes e para as sessões abertas pelo `loop-driver.mjs`. Revisa a parte de uso da memória descrita em `docs/project/learnings/README.md`; a captura no instante e os hooks de rede (ADR-0007, seção de learnings) continuam.

---

## Contexto e Problema

O kit promete que **o mesmo erro não se repete**: correção do usuário vira `[CORRECAO DO USUARIO]` no learning do domínio, e o hook `reconcile.mjs` injeta as correções em vigor no início de cada sessão. Na prática a promessa não se cumpria:

1. **A regra promovida era invisível.** O loop de melhoria do Praxis grava a "regra dura" num formato (`## [REGRA]`, campo `Regra`) que o parser do hook não reconhece — só `###` com `[CORRECAO DO USUARIO]` e `Regra derivada`. O nível mais forte da escada não chegava ao contexto.
2. **O corte descartava as correções mais novas.** O hook injeta as 12 primeiras pela ordem dos arquivos; entradas são acrescentadas no fim. Correção já consolidada em ADR (status `aplicado`) seguia ocupando vaga.
3. **Carga por posição, não por trabalho.** O roteiro do Praxis manda carregar os cinco arquivos de learning na sessão principal a cada despacho de `/execute`, `/implement`, `/plan`, `/tasks` e `/spec-from-prd`; cada `check-*` carrega o arquivo inteiro do domínio. A evidência sobre arquivos de contexto (SWE-bench com AGENTS.md; IFScale; estudos de *context rot*) aponta o oposto: texto sempre carregado reduz adesão e custa de 20% a mais por tarefa; instrução específica é seguida, visão geral não.
4. **Nada expira.** Learning não cita código, não tem data de verificação nem condição de validade. Um fato que mudou continua orientando até alguém notar.
5. **Três cópias de cada regra.** Learning, painel "Regras Aprendidas" do manifesto e ADR, sem fonte declarada; skills gravavam no painel eventos que não são regra (brief aprovado, mudança de escopo).
6. **Subagente e sessão de fatia dependiam do hook.** O `additionalContext` do `SessionStart` chega à sessão principal; os `check-*` e as sessões do driver só viam a correção se o prompt mandasse ler o arquivo.

O Claude Code oferece um mecanismo nativo que resolve 3 e 6 sem código: regras de projeto em `.claude/rules/*.md`, que carregam no início da sessão e, quando têm `paths:` no frontmatter, **só quando um arquivo correspondente é lido, escrito ou editado** — na sessão principal, nos subagentes e em sessões `claude -p`. O frontmatter é removido antes de ir ao contexto e só `paths` é lido; os demais campos são gratuitos. Verificado em 2026-11-05 (Claude Code 2.1.314): a regra carregou na sessão headless após o Read, não carregou sem tocar o caminho, e carregou dentro de um subagente customizado.

---

## Decisão

### 1. Regra ativa é um arquivo em `.claude/rules/learned/`

Toda correção do usuário, decisão ou descoberta que deva **mudar a implementação** vira um arquivo `.claude/rules/learned/<dominio>-<slug>.md`, no molde `docs/templates/rule-template.md`:

- **`paths:`** com os globs da área em que a regra vale. Regra de frontend carrega no trabalho de frontend, não ao escrever spec; regra de negócio carrega ao tocar `docs/specs/**` e `docs/prds/**`. Omitir `paths` é decisão explícita: a regra passa a custar contexto em toda sessão, e o orçamento (abaixo) limita quantas podem ser assim.
- **Corpo de 2 a 5 linhas:** `**Regra**` (imperativo), `**Escopo**` (onde mais se aplica — nunca "neste componente"), `**Fonte**` (`arquivo:linha` que sustenta a regra, quando há) e `**Por que**`. Sem visão geral, sem narrativa: a forma é o que a evidência mostrou ser seguido.
- **Validade no frontmatter:** `medido_em` (data da última verificação), `derruba_com` (comando, arquivo ou pergunta que prova que a regra deixou de valer), `vale_enquanto` (premissa que, caída, leva a regra junto), `check` (quem a cobre no código, ou `manual`) e `origem` (a entrada de evidência).
- A pasta é **do projeto** (ADR-0009): o catálogo nunca a toca. Nada além de regras entra em `.claude/rules/` — todo `.md` ali é carregado.

### 2. Learning é evidência, buscado sob demanda

`docs/project/learnings/*-learnings.md` guarda o histórico: a descoberta, a correção, o contexto, por que a regra mudou ou caiu. Nenhum agent carrega esses arquivos por obrigação; abre a entrada que uma regra cita (`origem`) ou o arquivo quando investiga. O hook deixa de injetar correções e pendências.

### 3. Validade na leitura; derrubar, não apagar

Regra com `**Fonte**` é conferida antes de ser aplicada: se o código contradiz a fonte, a regra não se aplica e é **derrubada** — o arquivo sai de `.claude/rules/learned/` e a entrada de origem registra a invalidação com data e motivo (o git preserva o arquivo). Sessão não interativa (fatia do driver) não derruba: não aplica, registra no relatório, e a sessão principal derruba no fechamento.

### 4. Cobrança determinística

`.claude/scripts/memory-check.mjs` confere a pasta e reporta por exit code: frontmatter inválido (**erro** — a regra carregaria em toda sessão, em silêncio), campo obrigatório ausente, `Fonte` apontando para arquivo ou linha que não existe (**erro**), `medido_em` vencido (aviso; prazo em `PRAXIS_RULE_MAX_DIAS`, padrão 90), corpo acima de 8 linhas, regras sem `paths` acima do orçamento (`PRAXIS_RULES_SEMPRE_MAX`, padrão 10) e correções `[CORRECAO DO USUARIO]` sem regra correspondente (migração). Roda no `SessionStart` pelo `reconcile.mjs` (uma linha de resumo; problemas detalhados no máximo uma vez por dia), no fechamento do `/execute` e no `/verify-all`.

### 5. Escada com fonte única

| Ocorrência | O que acontece | Fonte da regra |
|---|---|---|
| 1ª correção do usuário | arquivo de regra + entrada de evidência + linha `(llm)` no ledger, **no mesmo turno** | a regra |
| Regressão (correção que bate com regra existente) | ampliar `paths`/`Escopo`; se mecanicamente verificável, `/forge` cria o check e preenche `check:` | a regra + o check |
| 3ª ocorrência ou `Acao sugerida: criar ADR` | `/architect`; a ADR passa a ser a fonte, o `adr-validator` cobra, **a regra sai** e as evidências ficam `aplicado` | a ADR |

O painel "Regras Aprendidas" do manifesto deixa de existir: o índice é a própria pasta. Eventos que não são regra (brief aprovado, escopo alterado, risco aceito) vão para o ledger e para a evidência, não para regra.

### 6. O que continua

Captura no instante (quem corrige grava antes de seguir), `ledger.md` versionado com linhas `(llm)`, `ledger-auto.md` local com as linhas `(auto)`, o nag do `UserPromptSubmit`, `state.md` reduzido ao que é gravado de fato (checkpoint, evento, arquivos do turno, pendências), rotação do ledger e os checks mecânicos já existentes (`check-learnings.mjs`).

### 7. Migração de projeto existente

Na primeira sessão após a atualização, o `memory-check` reporta as correções sem regra; o Praxis propõe converter uma por vez (escopo e `paths` exigem julgamento), gravando a regra e apontando `origem` para a entrada existente.

---

## Alternativas Consideradas

- **Corrigir o hook (parser, ordem, filtro por status, `SubagentStart`).** Resolve os problemas 1, 2 e 6, mas mantém a carga por posição: o hook dispara antes de saber que arquivos a sessão vai tocar e teria de reimplementar o filtro por caminho. O contexto de hook chega como mensagem de turno; a regra de projeto entra junto das instruções, no início, onde a adesão medida é maior. Rejeitada como solução; o hook segue como rede e cobrança.
- **Auto memory do Claude Code.** Local à máquina, fora do git: outro dev não recebe. Rejeitada.
- **Serviço de memória externo (vetorial, grafo, temporal).** Fere o repositório como fonte e o agnosticismo do kit; a evidência favorece texto mínimo e curado, não mais volume recuperado. Rejeitada.
- **Índice sempre carregado (uma linha por regra), gerado pelo script.** Cobriria a limitação de a regra por `paths` só carregar no primeiro Read/Write do caminho. Adiada: o contrato da fatia já leva a sessão a ler referências antes de escrever, e o verificador pega o que escapar. Entra se a prática mostrar o gap.

---

## Consequências

**Positivas**
- Correção chega a toda sessão que toca a área — principal, subagente, driver — sem hook e sem código.
- Contexto proporcional ao trabalho: regra de frontend não pesa na escrita de spec.
- Toda regra tem data, condição de queda e, quando há, citação conferível. Regra morta sai; não vira mentira silenciosa.
- Uma fonte por fato; a escada termina na ADR com o check cobrando.

**Negativas / custos**
- Regra por `paths` carrega no primeiro acesso ao caminho, não antes. Mitigado pelo contrato da fatia e pelo verificador; o índice gerado é o plano B.
- Regra de código tende a glob largo (`src/**/*.tsx`): o corte útil é por área de trabalho, não por arquivo.
- Mais um artefato para manter (a regra). O `memory-check` cobra; a forma curta limita o custo.
- Projetos existentes precisam da migração interativa.

**Fora, de propósito:** canal de time, camadas de conhecimento entre projetos, serviço de memória externo — infraestrutura de organização, não do kit.

---

## Regras para o desenvolvimento do kit

- OBRIGATÓRIO: toda skill ou agent que grave regra usa `docs/templates/rule-template.md`; nenhum escreve no manifesto como se fosse regra.
- OBRIGATÓRIO: nenhuma skill ou agent manda carregar `*-learnings.md` por obrigação; a leitura é por citação (`origem`, `Fonte`) ou investigação.
- OBRIGATÓRIO: `memory-check.mjs` tem auto-teste (`--self-test`) rodado pelo `validate-kit`.
- PROIBIDO: qualquer arquivo que não seja regra em `.claude/rules/` (README, índice, rascunho).
- PROIBIDO: hook que apague ou edite uma regra; derrubar é ato do assistente, registrado na evidência.

> Esta ADR não traz "Regras para Validação" de código: governa o kit, não a aplicação.

---

## Critério de aceite

1. Regra com `paths` carrega na sessão principal ao tocar o caminho, não carrega sem tocá-lo, e carrega num subagente customizado e numa sessão `claude -p` (spike de 2026-11-05 repetido no fim).
2. `memory-check.mjs --self-test` cobre: regra válida, frontmatter quebrado, fonte morta, `medido_em` vencido, corpo longo, orçamento de regras sem `paths`, correção sem regra.
3. `reconcile.mjs` não injeta mais correções nem pendências; injeta a linha de resumo do `memory-check` e os problemas no máximo uma vez por dia.
4. Praxis, `/execute` (Regra 0, fechamento, sessão da fatia, verificador), `/validate`, `/forge`, `/ux`, `/strategy`, `@adr-creator`, `@adr-validator` e os `check-*` seguem a ADR: gravam regra pelo template, não carregam learnings por obrigação, não escrevem no painel do manifesto.
5. `docs/project/learnings/README.md`, `docs/project/manifest.md`, o manual e a arquitetura do kit descrevem o modelo novo; `catalog.json` e `seed/` regenerados; `validate-kit` verde.
