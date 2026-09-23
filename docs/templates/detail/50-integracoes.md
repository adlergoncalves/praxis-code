# 50 — Integracoes Externas — {MODULO}

> Fronteiras com outros modulos ou sistemas externos. Fronteiras internas (entre partes do modulo) ficam em `01-fronteiras-e-decisoes.md`.

## Integracoes com Outros Modulos

| Modulo Vizinho | Direcao | Contrato | Dado Trocado | Estado |
|----------------|---------|----------|--------------|--------|
| {modulo} | consome / expoe / bidirecional | {evento/API/tabela} | {o que} | 🟡 |

## Integracoes com Sistemas Externos

| Sistema | Direcao | Protocolo | Dado Trocado | Autenticacao | Estado |
|---------|---------|-----------|--------------|--------------|--------|
| {sistema} | consome / expoe | HTTP/webhook/fila | {o que} | {como} | 🟡 |

## Eventos Publicados

<!-- Se o modulo publica eventos de dominio -->

| Evento | Quando dispara | Payload | Consumidores |
|--------|----------------|---------|--------------|

## Eventos Consumidos

| Evento | Origem | Acao | Idempotencia |
|--------|--------|------|--------------|
