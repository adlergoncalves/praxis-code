# Linha de base dos agent evals

Uma seção por execução, a mais recente no topo. Compare contra ela antes de concluir que um
agent regrediu — a queda pode ser da fixture.

## 2026-10-19 — linha de base da v0.1.0

**Modo de execução:** carga do arquivo do agent (subagente genérico seguindo `.claude/agents/<dominio>/<agent>.md`).
Um caso por chamada; o contrato é lido antes e nunca passado ao agent.

| Agent | Caso | Veredicto | Observação |
|---|---|---|---|
| `check-security-frontend` | 01-xss-html-dinamico | ✅ PASSOU | ERRO `Comentario.tsx:10`, exata |
| `check-security-frontend` | 02-token-localstorage | ✅ PASSOU | ERRO `sessao.ts:14`, exata |
| `check-security-frontend` | 90-conforme | ✅ PASSOU | 0 ERRO · 0 AVISO |
| `check-typescript` | 01-as-any | ✅ PASSOU | ERRO `pedido.ts:7`, exata |
| `check-typescript` | 02-ts-ignore | ✅ PASSOU | ERRO `desconto.ts:8`, exata |
| `check-typescript` | 90-conforme | ✅ PASSOU | 0 ERRO · 0 AVISO |
| `check-web-guidelines` | 01-div-clicavel | ✅ PASSOU | ERRO `CartaoProjeto.tsx:9`, exata |
| `check-web-guidelines` | 02-botao-icone-sem-nome | ✅ PASSOU | ERRO `BarraFerramentas.tsx:8`, exata |
| `check-web-guidelines` | 90-conforme | ✅ PASSOU | 0 ERRO · 0 AVISO |
| `check-naming` | 01-usecase-como-service | ✅ PASSOU | ERRO `CreateOrderService.cs:3`, exata |
| `check-naming` | 02-helper-generico | ✅ PASSOU | AVISO `OrderHelper.cs:3`, exata |
| `check-naming` | 90-conforme | ✅ PASSOU | 0 ERRO · 0 AVISO |
| `check-structure` | 01-import-cruzado | ✅ PASSOU | ERRO `OrderList.tsx:1`, exata |
| `check-structure` | 02-hook-fora-de-hooks | ✅ PASSOU | AVISO `useOrders.ts:3`, exata |
| `check-structure` | 90-conforme | ✅ PASSOU | 0 ERRO · 0 AVISO |
| `check-i18n` | 01-texto-fixo | ✅ PASSOU | ERRO `OrdersHeader.tsx:9`, exata |
| `check-i18n` | 02-moeda-a-mao | ✅ PASSOU | AVISO `OrderTotal.tsx:9`, exata |
| `check-i18n` | 90-conforme | ✅ PASSOU | 0 ERRO · 0 AVISO |

**Total:** 18/18.

**Como ler e como escrever fixture:**
- Nos casos 01 e 02 pode aparecer AVISO de uma regra vizinha; não reprova. O contrato exige o achado
  da regra testada e a ausência dos termos de `nao_deve_detectar` **como violação reportada** — o
  termo citado numa checagem sem achado ("não há `@ts-ignore`") não conta.
- Controle (`90-conforme`) com AVISO não prova nada: o resto do código da fixture precisa estar
  conforme com **todas** as regras do agent, não só com a testada (um `shared/` com 2 consumidores
  ou uma chave de i18n sem uso viram AVISO e sujam o controle).

**Candidatos de ajuste nos agents (fora desta linha de base):**
- `check-web-guidelines`: sem `stack-profile.json` nem `package.json`, aplicou as regras de hidratação
  por cautela; o esperado é declarar a stack inferida e pular as regras de SSR.
- `check-security-frontend`: `href` vindo de prop sem validar o esquema (`javascript:`) — regra nova,
  com fixture própria.
