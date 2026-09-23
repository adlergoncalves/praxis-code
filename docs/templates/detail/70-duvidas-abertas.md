# 70 — Duvidas Abertas — {MODULO}

> Rastreamento vivo de decisoes pendentes. Cada duvida tem ID estavel `Q-{COD}-##`.
> Quando fecha, migra para `60-regras-negocio.md` como `D-{COD}-##` e entra no `historico.md`.

## Duvidas Ativas

| ID | Duvida | Por que importa | Estado | Owner | Bloqueia SDD? |
|----|--------|-----------------|--------|-------|---------------|
| Q-{COD}-01 | {duvida} | {o que depende disso} | 🟡 | {nome ou —} | 🚫 sim / ⚠️ nao |

## Duvidas em Investigacao

| ID | Duvida | Investigacao em curso | Owner | Prazo |
|----|--------|----------------------|-------|-------|
| Q-{COD}-## | {duvida} | {o que esta sendo apurado} | {nome} | {data} |

## Duvidas Descartadas (historico)

<!-- Nunca apagar. Marcar com ~~ e registrar motivo. -->

| ID | Duvida | Motivo do descarte | Data |
|----|--------|--------------------|------|
| ~~Q-{COD}-##~~ | ~~{duvida}~~ | Prejudicada por reescopo em {data} | {data} |

## Tabela de IDs Usados (auditoria)

| ID | Estado Atual |
|----|--------------|
| Q-{COD}-01 | 🟡 Aberta |
| Q-{COD}-02 | ✅ Fechada → D-{COD}-03 |
| Q-{COD}-03 | ❌ Descartada |
