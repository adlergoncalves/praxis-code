---
description: "Roda os check agents contra as fixtures de .claude/evals/agents/ e verifica se cada um ainda detecta o que promete — teste de regressao de prompt. Use ao alterar um agent check-*, quando pedirem 'testar os agents', 'os checks ainda funcionam?', 'rodar os evals', ou antes de confiar num /validate depois de mexer no .claude/."
user-invocable: true
domain: quality
depends:
  - .claude/evals/agents
---

# /agent-eval — testes de regressao dos check agents

Os agents `check-*` sao prompts. Prompt regride em silencio: quem quebrar uma deteccao nao
recebe erro nenhum — o agent segue rodando e segue dizendo "conforme". Esta skill e o RED → GREEN
de quem cobra o RED → GREEN. Contrato das fixtures, formato do `.yml` e como adicionar caso:
`.claude/evals/agents/README.md`.

## Uso

```
/agent-eval check-typescript     # um agent
/agent-eval                      # todos os agents com fixtures
```

Roda **nesta sessao**: despacha um subagente por caso e julga o resultado contra o contrato —
quem julga nao e quem e testado.

## Procedimento

### 1. Descobrir os casos
Listar `.claude/evals/agents/fixtures/<agent>/*/` — cada subdiretorio e um caso. O contrato vive em
`.claude/evals/agents/contratos/<agent>/<caso>.yml`. Agent pedido sem fixtures → dizer isso e parar;
nao inventar caso na hora.

> **Nunca passe o caminho de `contratos/` ao agent sob teste**, nem o cite no prompt dele.

### 2. Ler o contrato ANTES de rodar
Ler todos os `.yml` do agent antes de despachar. Lendo a saida primeiro, o julgamento ancora no que
o agent produziu em vez do que devia produzir. O contrato e a fonte da verdade.

### 3. Despachar o agent, um caso por vez
Agent tool com `subagent_type` = nome do agent (quando o agent esta registrado na sessao). O prompt
forca o escopo:

> Valide **exclusivamente** os arquivos em `.claude/evals/agents/fixtures/<agent>/<caso>/`. Ignore o
> glob padrao do seu arquivo — nao varra `src/`, `app/` nem o resto do projeto. Aplique suas regras
> normais e devolva o relatorio no formato de sempre.

Um caso por chamada — o isolamento e o que permite atribuir um falso positivo a regra certa. Casos
independentes podem ir em paralelo.

**Agent nao registrado na sessao** (ex.: avaliando o kit a partir de outro projeto): despachar um
subagente generico com o arquivo do agent como instrucao ("siga exatamente `.claude/agents/<dominio>/<agent>.md`")
e declarar no relatorio que a execucao foi por **carga do arquivo**, nao pelo agent registrado.

### 4. Avaliar

| Verificacao | Criterio |
|---|---|
| `sinal` | **Obrigatorio.** O termo aparece na violacao reportada. |
| `severidade` | Bate exatamente (ERRO × AVISO). Inflar severidade quebra o gate tanto quanto perder o achado. |
| `linha` | ±2. Fora disso e aviso de precisao, nao reprovacao. |
| `nao_deve_detectar` | Nenhum termo **como violacao reportada** (item de ERRO ou AVISO). Termo listado como checagem sem achado ("nao ha X") nao conta. |
| `deve_detectar: []` | Controle: **zero** ERRO. |

Veredictos: **PASSOU** · **FALHOU (perdeu)** · **FALHOU (falso positivo)** · **FALHOU (severidade)** ·
**ESCOPO IGNORADO** (o relatorio cita arquivos de fora do caso — o caso nao foi testado; nunca conta
como aprovacao).

### 5. Relatar e registrar

```markdown
# Agent Eval — {agent} — {data}

| Caso | Regra | Veredicto | Observacao |
|---|---|---|---|
| 01-as-any | Tipos — as any | ✅ PASSOU | linha 7, exata |
| 90-conforme | controle | ✅ PASSOU | 0 ERRO |
```

Em falha, apontar **qual regra do arquivo do agent** devia ter capturado o caso. Acrescentar o
resultado em `.claude/evals/agents/linha-base.md` (data, agent, casos, passou/falhou, modo de execucao).

## O que NAO fazer

- **Nao ajustar o contrato para casar com a saida.** E o `ajuste-para-passar`. Se um caso falha, a fixture ou o agent esta errado — decida qual e diga qual.
- **Nao consertar o agent na mesma passada.** Medir e intervir juntos apaga a linha de base. Relatar primeiro.
- **Nao tratar ESCOPO IGNORADO como aprovacao.**

## Custo

Cada caso e uma invocacao de subagente. Prefira rodar so o agent que voce alterou.
