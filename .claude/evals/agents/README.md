# Agent evals — testes para os check agents

Os agents `check-*` são **prompts**, e prompt regride em silêncio. Se alguém editar
`check-typescript.md` e quebrar a detecção de `as any`, nada acusa: o agent continua rodando,
continua devolvendo "conforme", e o `/frontend-validate` vira teatro. Este diretório é o
RED → GREEN aplicado a quem cobra o RED → GREEN. Quem roda: a skill `/agent-eval`.

## Como funciona

Cada caso tem duas metades, **em árvores separadas de propósito**:

```
fixtures/<agent>/<NN-caso>/...        # o código — é o que o agent enxerga
contratos/<agent>/<NN-caso>.yml       # o gabarito — FORA do escopo que o agent recebe
```

O runner escopa o agent no diretório do caso. Com o gabarito no mesmo diretório, o agent pode
ler a resposta antes de analisar o código — e aí o eval mede leitura, não detecção. Separar as
árvores torna o vazamento impossível por construção, em vez de depender do bom comportamento do
modelo. Não junte de volta.

Uma fixture pode ser um arquivo só ou uma árvore (o `tsconfig.json` ao lado do `.ts`, por
exemplo, existe para que as regras de configuração do `check-typescript` estejam satisfeitas e
não gerem achado fora do que o caso isola).

## Por que mora em `.claude/evals/`

O código daqui é **propositalmente errado**. Dentro de `.claude/`, ele fica fora do que o
`detect-cliches.mjs` varre e do escopo das skills de validação: `/validate`, `/frontend-validate`
e `/backend-validate` excluem `.claude/` e passam a exclusão aos agents — os agents backend, que
fazem glob no projeto inteiro (`**/*Tests.cs`), dependem dela. Nenhum build do projeto compila as
fixtures.

## O contrato

```yaml
agent: check-typescript
regra: "Tipos — proibido as any"
descricao: Resultado de JSON.parse convertido com as any

deve_detectar:
  - severidade: ERRO      # ERRO | AVISO — tem que bater exatamente
    arquivo: pedido.ts
    linha: 7              # tolerância de ±2
    sinal: as any         # OBRIGATÓRIO — termo que precisa aparecer na violação

nao_deve_detectar:        # falsos positivos que reprovam o caso
  - ts-ignore
```

`sinal` é a asserção dura; `linha` confere precisão com tolerância. `nao_deve_detectar` reprova
quando o termo aparece **como violação reportada** (um item de ERRO ou AVISO). Agents costumam
listar o que checaram e acharam limpo — em "conformidades verificadas" ou mesmo sob o título AVISO
("não há `@ts-ignore`"). Ali o termo é um não-achado e não reprova.

## Os dois tipos de caso

- **Violação** (`01`–`89`) — isola **uma** regra; o resto do arquivo é conforme, para que outro achado seja falso positivo sem ambiguidade.
- **Controle** (`90`+) — código limpo; o agent tem que reportar **zero ERRO**. Sem isso, um agent que grita em tudo passaria em todos os casos de violação e ainda estaria quebrado.

## Adicionando um caso

1. Crie `fixtures/<agent>/<NN-nome>/` com código que viole **uma** regra — e nada mais: o resto precisa estar conforme com **todas** as regras do agent (um arquivo por tipo, um idioma só nos identificadores...), senão o caso reprova por um achado legítimo que não é o testado.
2. Escreva `contratos/<agent>/<NN-nome>.yml` **antes** de rodar: é o RED — você declara o contrato, não descreve o que o agent fez.
3. Rode `/agent-eval <agent>`. Se falhar, decida qual dos dois está errado — a fixture ou o agent. Ajustar o contrato para casar com a saída é o `ajuste-para-passar`; não faça.

O `scripts/validate-kit.mjs` (CI) confere a estrutura: todo contrato tem fixture e vice-versa,
o `agent:` do contrato existe no kit e casa com a pasta.

## Limitação conhecida

Agent que ignora o escopo recebido e varre o projeto inteiro aparece como **ESCOPO IGNORADO**,
não como PASSOU/FALHOU. É achado sobre o agent: se ele não respeita o escopo, também não
consegue validar só os arquivos de uma fatia — que é como o `/execute` o usa.

## Cobertura e linha de base

| Agent | Casos | Regras cobertas |
|---|---|---|
| `check-security-frontend` | 3 | XSS por `dangerouslySetInnerHTML`, token em `localStorage` + controle |
| `check-typescript` | 3 | `as any`, `@ts-ignore` + controle |
| `check-web-guidelines` | 3 | `div` clicável, botão só com ícone sem nome + controle |
| `check-naming` | 3 | UseCase chamado de Service, `Helper` genérico + controle |
| `check-structure` | 3 | import cruzado entre features, hook fora de `hooks/` + controle |
| `check-i18n` | 3 | texto fixo no JSX, moeda montada à mão + controle |

Resultados datados por execução: [`linha-base.md`](linha-base.md). Compare contra ele antes de
concluir que um agent regrediu — a queda pode ser da fixture. Os demais agents ainda não têm
fixture: comece pelos de regra mecânica (`check-routing`, `check-forms`, `check-errors`).
