# 01 — Fronteiras e Decisoes Estruturais — {MODULO}

> **Prioridade**: este arquivo deve ser o primeiro a ficar ✅. Fronteiras mal definidas contaminam todas as partes.

## Fronteiras Internas (entre partes do modulo)

| ID | Fronteira | Lado A | Lado B | Decisao | Estado |
|----|-----------|--------|--------|---------|--------|
| F1 | {titulo} | Parte {N} | Parte {M} | {o que fica onde} | 🟡 |
| F2 | ... | | | | |

## Fronteiras Externas (com outros modulos)

| ID | Fronteira | Modulo vizinho | O que fica neste modulo | O que sai daqui | Estado |
|----|-----------|----------------|-------------------------|-----------------|--------|
| FE1 | {titulo} | {modulo} | {responsabilidade aqui} | {responsabilidade la} | 🟡 |

## Decisoes Estruturais Firmadas

<!-- Decisoes cross-parte que afetam toda a arquitetura do modulo. IDs do tipo D-{COD}-##. Regras de negocio especificas vao em 60-regras-negocio.md -->

| ID | Decisao | Data | Justificativa |
|----|---------|------|---------------|
| D-{COD}-01 | {decisao} | {data} | {por que} |

## Decisoes em Discussao

<!-- Snapshot das fronteiras/decisoes estruturais que ainda nao fecharam. Duvidas pontuais vao em 70-duvidas-abertas.md -->

| ID | Tema | O que precisa decidir | Impacto | Estado |
|----|------|----------------------|---------|--------|
| Q-{COD}-01 | {tema} | {duvida} | {o que depende disso} | 🟡 |
