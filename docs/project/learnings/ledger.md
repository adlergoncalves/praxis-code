# Ledger de Aprendizado — caixa-preta append-only

> **NAO edite manualmente o corpo abaixo.** Este arquivo e a caixa-preta do projeto:
> sobrevive a qualquer fechamento (abrupto ou limpo) porque e gravado no disco no instante
> em que o trabalho acontece — nao depende de `/compact` nem do fim de uma skill.
>
> Duas fontes escrevem aqui (redundancia proposital):
> - `(auto)` — o hook `capture.mjs` grava uma linha determinista por turno (timestamp + arquivos alterados).
> - `(llm)` — o assistente grava a linha semantica no instante em que ha decisao, correcao ou descoberta.

## Formato (pipe-delimited, uma linha por evento)

```
<timestamp ISO> | <tipo> | <escopo> | <detalhe> | <origem>
```

- **timestamp**: ISO 8601 UTC (ex: `2026-05-27T14:03Z`)
- **tipo**: `turn` | `correcao` | `decisao` | `descoberta`
- **escopo**: `files: a, b` (para `turn`) ou `domain:<dominio>` (para entradas semanticas)
- **detalhe**: resumo curto; para `correcao`/`decisao`, a regra ou decisao entre aspas
- **origem**: `(auto)` (hook) ou `(llm)` (assistente)

## Rotacao

Quando passar de ~500 linhas ou virar o mes, o hook arquiva o corpo em
`docs/project/learnings/ledger-archive/AAAA-MM.md` e mantem so o cabecalho-resumo aqui.

---

<!-- LEDGER:START -->
<!-- As linhas de evento sao apensadas abaixo desta marca. Nao remova a marca. -->
