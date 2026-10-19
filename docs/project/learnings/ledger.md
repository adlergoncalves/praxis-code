# Ledger de Aprendizado — caixa-preta append-only

> **NAO edite manualmente o corpo abaixo.** Este arquivo e a caixa-preta do projeto:
> sobrevive a qualquer fechamento (abrupto ou limpo) porque e gravado no disco no instante
> em que o trabalho acontece — nao depende de `/compact` nem do fim de uma skill.
>
> Este arquivo e **versionado** e recebe so as linhas **semanticas**:
> - `(llm)` — o assistente grava a linha no instante em que ha decisao, correcao ou descoberta.
>
> As linhas `(auto)` (uma por turno com arquivo alterado, gravadas pelo hook `capture.mjs`) vao
> para `ledger-auto.md` ao lado — **local e gitignored**, para nao gerar alteracao versionada a cada
> turno. Os hooks leem os dois arquivos numa linha do tempo so.

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

Quando passar de ~500 linhas, o hook `capture.mjs` arquiva as mais antigas em
`docs/project/learnings/ledger-archive/AAAA-MM.md` e mantem aqui as ~250 mais recentes.

---

<!-- LEDGER:START -->
<!-- As linhas de evento sao apensadas abaixo desta marca. Nao remova a marca. -->
