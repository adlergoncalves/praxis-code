---
description: "Cria uma ferramenta DO PROJETO (skill, agent de checagem ou subagente de trabalho) nas convencoes do kit, a partir do que o projeto precisa. Use quando uma regra se repete, um fluxo do projeto vira rotina, ou o Praxis propoe transformar um learning recorrente em check — 'cria um check para X', 'quero um comando para Y', 'isso devia ser automatico'."
user-invocable: true
domain: orchestration
depends:
  - .claude/evals/agents/README.md
---

# /forge — o projeto cria as proprias ferramentas

O kit chega generico e se especializa no projeto (ADR-0009). A maior parte da especializacao vem
por dado — ADRs, learnings, manifesto, memoria de design. Quando o dado nao basta (uma regra do
projeto precisa de quem a cobre, um fluxo do projeto se repete), esta skill cria a ferramenta
**do projeto**: um arquivo novo em `.claude/`, nas convencoes do kit, que o catalogo nunca toca.

Roda **nesta sessao**: entender o que o projeto precisa e conversa, e o resultado e mostrado antes de gravar.

## Input

```
/forge {descricao livre}       # "check: todo endpoint de escrita registra auditoria"
/forge                         # sem descricao: perguntar o que se repete
```

Chamada pelo Praxis no LOOP DE MELHORIA (2a ocorrencia de uma correcao) com a regra derivada ja escrita.

## Execucao

### 1. Entender e decidir o tipo

Ler, antes de propor: `docs/project/manifest.md`, as ADRs do projeto e os learnings do dominio
(a regra pode ja estar escrita la — nesse caso a ferramenta **cita** a fonte, nao copia).

| O projeto precisa de... | Tipo | Onde nasce |
|---|---|---|
| Alguem que **cobre** uma regra no codigo (ERRO/AVISO) | agent de checagem `check-{nome}` | `.claude/agents/{dominio}/check-{nome}.md` |
| Um **comando** que o usuario chama (fluxo do projeto) | skill | `.claude/skills/{nome}/SKILL.md` |
| Um **trabalhador** isolado para leitura ou geracao pesada | subagente | `.claude/agents/{dominio}/{nome}.md` |
| Regra **mecanicamente** verificavel (rota, import proibido, token) | script de gate do projeto | `scripts/` do projeto + linha na tabela de Gates |

Na duvida entre skill e agent: **se conversa com o usuario, e skill** (subagente nao conversa —
`.claude/praxis/rules.md`). Agent so faz o nao interativo e devolve perguntas.

Uma pergunta por vez, so o que muda a ferramenta: o que exatamente e violacao, a excecao aceita, a
severidade, o escopo (que pastas). O resto sai do projeto.

### 2. Conferir o nome

`node .claude/praxis/praxis.mjs list --json`: o nome nao pode existir no catalogo nem no projeto.
Nome do catalogo seria confundido com a ferramenta do kit (e o `praxis.mjs` trataria o arquivo como
do projeto, sem nunca atualiza-lo). Convencao: verbo ou substantivo curto, kebab-case, em ingles
como as do kit; checks com prefixo `check-`.

### 3. Escrever nas convencoes do kit

**Frontmatter** — skill: `description` (o que faz + quando usar, com as frases que o usuario diria),
`user-invocable: true`, `depends` (todo arquivo que ela cita). Agent: `name`, `description`,
`tools` (o minimo; checagem = `Read, Glob, Grep`).

**Agent de checagem** — copiar a estrutura dos `check-*` do kit:
- `## ENTRADA` (caminho ou "geral"), `## REGRAS EMBUTIDAS` (a regra, com excecoes aceitas),
  `## REGRAS DINAMICAS` (as ADRs e o learning que a originaram — cita, nao copia),
  `## EXECUCAO` (passos com o grep/glob concreto de cada um e a severidade de cada achado),
  `## CLASSIFICACAO` (o que e ERRO, o que e AVISO), saida com `arquivo:linha`.
- Escopo sempre exclui `.claude/`, `node_modules/`, `bin/`, `obj/`, `dist/`.
- **Eval junto** (`.claude/evals/agents/README.md`): uma fixture que viola (`01-...`) e uma conforme
  (`90-conforme`), com contrato. Rodar `/agent-eval check-{nome}` e mostrar o resultado — check
  sem eval regride em silencio.

**Skill** — `# /{nome}`, `## Input`, `## Execucao` em passos, `## Regras`. Se conversa: "roda nesta
sessao". Se despacha agent: o agent no `depends`.

**Idioma**: conteudo em PT-BR; identificadores e nomes de arquivo como o kit.

### 4. Mostrar e gravar

Mostrar o arquivo (e a fixture, se check) antes de gravar. Aprovado: gravar, e registrar:
- `docs/project/manifest.md` → secao de ferramentas do projeto: nome, tipo, data, de onde veio (learning/ADR);
- learning de origem → `Check: {nome}` e status `aplicado`;
- uma linha `(llm)` no `ledger.md`: `<ts> | decisao | domain:<d> | "ferramenta do projeto {nome} criada" | (llm)`.

Check novo entra no verificador independente do `/execute` quando os arquivos da fatia caem no
escopo dele — dizer isso na entrega.

## Regras

- A ferramenta e **do projeto**: nao entra no lock, o catalogo nunca a atualiza nem a apaga.
- NUNCA editar uma ferramenta do kit para "encaixar" a regra do projeto — o kit le a regra do projeto por dado (ADR/learning). Precisou divergir de verdade? Editar o arquivo do kit e permitido (ele vira personalizado e sai das atualizacoes); dizer isso ao usuario antes.
- NUNCA criar ferramenta para algo que uma ADR ou learning ja cobre e um check do kit ja le — so apontar.
- Sem placeholder: a ferramenta nasce funcionando, com o grep/glob real do projeto.
