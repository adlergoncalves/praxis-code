# ADR-006: Workspace de Detalhamento de Modulo (pre-SDD)

**Status:** Aceito
**Data:** 2026-04-23
**Decisores:** Adler (dev)
**Escopo:** Processo de documentacao — agnostico a produto, stack e ferramenta de SDD

---

## Contexto e Problema

Modulos grandes, ambiguos ou com muitas fronteiras interinas de negocio nao cabem bem em um PRD monolitico e **nao estao prontos para entrar direto no fluxo de Spec-Driven Development** (`/spec-from-prd` / `/implement`). Tentar especificar cedo leva a tres problemas recorrentes:

1. **Decisoes de fronteira esquecidas** — "isto e responsabilidade deste modulo ou do vizinho?" ficam implicitas e voltam como retrabalho na implementacao.
2. **Duvidas soltas em conversas** — informacoes criticas ficam em chats, reunioes e commits dispersos, sem rastreabilidade.
3. **PRDs que envelhecem mal** — um documento unico de 80+ paginas vira fonte unica de verdade ilegivel; ninguem sabe o que esta decidido, o que esta pendente, o que foi descartado e por que.

**O metodo, validado em uso real em modulos grandes antes de ser formalizado,** consiste em criar um **workspace de detalhamento** — uma pasta com multiplos arquivos curtos e proposito unico — **antes** de escrever specs de implementacao. O workspace e descartavel ou arquivavel ao final: o que importa e chegar ao SDD com 100% da intencao explicitada.

Este ADR formaliza o metodo para que possa ser reaplicado em outros modulos e **outros projetos**. No kit, o metodo e automatizado pela skill `/detail` (Fase 3, entre `/prd-validate` e `/prd-decompose`).

---

## Decisao

Para modulos que atendam ao criterio de uso abaixo, criar uma pasta-workspace com a estrutura canonica descrita neste ADR. O workspace **complementa** os PRDs existentes (nao substitui por default) e **alimenta** o fluxo SDD quando a intencao estiver fechada. A skill `/detail` automatiza a criacao, a conducao interativa do preenchimento e o congelamento do workspace.

---

## Quando Usar (Criterio de Aplicacao)

Use o workspace quando **pelo menos 2** dos seguintes se aplicam:

- Modulo tem **>= 3 fronteiras** com outros bounded contexts ou modulos.
- Existe **PRD escrito mas desatualizado/conflitante** com entendimento atual.
- Ha **multiplas partes funcionais** que podem ser implementadas independentemente (ex: configuracao, CRUD, importacao, visualizacao).
- Existem **decisoes abertas** que o time nao consegue fechar em uma sessao.
- A implementacao sera **dividida em varias iteracoes de SDD** (multiplos `docs/specs/NNN-*`).
- Modulo envolve **vocabulario novo** ou termos que colidem com outros modulos.

**Quando NAO usar:**

- Feature pequena (1-2 telas, regras triviais) → ir direto para SDD via `/spec-from-prd`.
- Bug fix ou ajuste pontual → `/quickfix` ou PR + ADR se houver decisao.
- Modulo bem entendido, com PRD recente e sem fronteiras ambiguas → `/prd-decompose` direto.

---

## Estrutura Canonica

```
docs/prds/<modulo>/
├── README.md                       # Porta de entrada: status, indice, metodologia
├── 00-visao-geral.md               # Proposito, divisao em partes, visao macro
├── 01-fronteiras-e-decisoes.md     # F1..Fn — o que fica dentro vs fora
├── 10-parte1-<nome>.md             # Detalhamento da parte 1 (8 dimensoes)
├── 20-parte2-<nome>.md             # Detalhamento da parte 2
├── 30-parte3-<nome>.md             # Detalhamento da parte 3
├── 40-glossario.md                 # Linguagem ubiqua especifica do modulo
├── 50-integracoes.md               # Fronteiras com modulos externos
├── 60-regras-negocio.md            # Compilado de regras cross-parte
├── 70-duvidas-abertas.md           # Rastreamento vivo de decisoes pendentes
└── historico.md                    # Changelog cronologico de decisoes por sessao
```

**Convencao de prefixos numericos:**

- `00-09`: estruturais (visao geral, fronteiras).
- `10, 20, 30`: partes funcionais (uma casa decimal por parte permite subarquivos `11-`, `12-` se uma parte crescer). Modulo com mais de 3 partes: subdividir dentro das dezenas (`31-`, `32-`), sem invadir a faixa `40`.
- `40-69`: transversais (glossario, integracoes, regras).
- `70+`: meta (duvidas, historico, rascunhos).

Ajuste conforme necessario — o importante e **ordenacao visual no explorador de arquivos** e nomes autoexplicativos.

---

## As 8 Dimensoes por Parte

Cada arquivo `NN-parteN-<nome>.md` detalha a parte em **8 dimensoes fixas**, sempre na mesma ordem:

| # | Dimensao | Pergunta que responde |
|---|----------|----------------------|
| 1 | **Proposito** | Qual problema resolve? Qual a jornada principal? |
| 2 | **Localizacao & Navegacao** | Onde vive no app? Como o usuario chega? |
| 3 | **Atores & Permissoes** | Quem faz o que? (por perfil/role) |
| 4 | **Entidades & Conceitos** | O que e configurado/cadastrado/manipulado? |
| 5 | **Funcionalidades** | Detalhe funcional por tela/acao/fluxo |
| 6 | **Regras de Negocio & Validacoes** | O que e bloqueado/permitido/auditado? |
| 7 | **Fronteiras & Integracoes** | O que fica nesta parte? O que sai? |
| 8 | **Duvidas em Aberto** | Pontos que o time precisa decidir |

Manter a ordem torna as partes comparaveis e facilita revisao cruzada.

---

## Convencoes de Identificadores

Toda decisao, duvida e fronteira recebe um **ID estavel** para referencia cruzada.

| Prefixo | Significado | Exemplo |
|---------|-------------|---------|
| `D-<MOD>-##` | Decisao especifica do modulo | `D-CAT-01` (Catalogo), `D-PAG-07` (Pagamento) |
| `Q-<MOD>-##` | Duvida em aberto | `Q-CAT-14` |
| `F#` | Fronteira entre partes do proprio modulo | `F1`, `F2`, `F3` |
| `D##` (sem prefixo) | Referencia a decisao herdada do PRD original | `D09`, `D41` |

**Ciclo de vida:**

```
Duvida surge → Q-<MOD>-## em 70-duvidas-abertas.md (aberta)
  ↓
Investigacao/discussao → permanece em 70-duvidas-abertas (em investigacao)
  ↓
Decisao tomada → sai de 70-duvidas-abertas, vira D-<MOD>-## em 60-regras-negocio.md
  ↓
Entrada em historico.md com data, contexto, decisao e impacto
```

IDs **nunca sao reutilizados**, mesmo quando a duvida e descartada. `Q-CAT-05` descartada continua `~~Q-CAT-05~~` no historico.

---

## Estados

Para qualquer item (decisao, duvida, secao), use o mesmo vocabulario visual:

| Icone | Significado | Uso |
|-------|-------------|-----|
| 🟡 | Em discussao | Ainda nao decidido |
| 🔍 | Em investigacao | Alguem esta apurando (tem owner) |
| ✅ | Aprovado | Decidido e documentado |
| ⚠️ | Revisao pendente | Mudanca proposta, aguarda confirmacao |
| ❌ | Descartado/Prejudicado | Avaliado e nao adotado — **manter com justificativa** |
| ⏳ | Stub | Arquivo existe mas aguarda detalhamento |

Manter itens descartados e tao importante quanto registrar aprovados: impede que a mesma discussao volte seis meses depois.

---

## Fluxo de Trabalho

### Por sessao

1. **Abrir `historico.md`** e registrar data + participantes da sessao.
2. **Trabalhar em uma parte ou transversal por vez** — nao saltar entre partes.
3. **Sempre que uma decisao for tomada:**
   - Remover da `70-duvidas-abertas.md` (risca com `~~`, nao apaga).
   - Registrar em `60-regras-negocio.md` com ID `D-<MOD>-##`.
   - Anotar em `historico.md` com 1 frase: o que foi decidido e por que.
4. **Toda duvida nova** entra em `70-duvidas-abertas.md` com ID, descricao curta e "por que importa".
5. **Ao final da sessao**, atualizar `README.md` → "Estado Atual" e "Proximos Passos".

### Encerramento do workspace

Quando todas as partes estao ✅ e as duvidas criticas fechadas:

1. Revisao final com stakeholders (produto + arquitetura).
2. Decidir governanca documental (ver "Relacao com PRDs" abaixo).
3. Gerar specs SDD via `/prd-decompose` + `/spec-from-prd` — uma spec por parte ou agrupamento logico.
4. Marcar `README.md` como "Congelado em AAAA-MM-DD — ver specs X, Y, Z".

---

## Relacao com PRDs Existentes

O workspace **nao substitui o PRD de origem** por default. A skill `/detail`, ao congelar o workspace, pergunta explicitamente qual governanca adotar:

| Opcao | Quando usar |
|-------|-------------|
| **(a) Coexistir (DEFAULT)** | PRD permanece como "visao executiva"; workspace como "visao de detalhe". Cross-link obrigatorio nos dois sentidos. |
| **(b) Workspace substitui PRD monolitico** | PRD original ficou muito desatualizado; workspace cobre tudo. PRD vira `prd-<modulo>-arquivado.md`. |
| **(c) PRD e regenerado a partir do workspace** | Politica de governanca exige PRD consolidado em documento unico. Skill agrega o workspace em novo PRD. |

**Regras para coexistencia (default):**
- Ao criar o workspace, a skill adiciona no PRD original: `> 🔗 Detalhamento tecnico em docs/prds/<modulo>/`.
- Ao congelar, atualiza o PRD com: `> 🔒 Detalhamento congelado em AAAA-MM-DD. Specs geradas: X, Y, Z.`.
- Decisoes de negocio que surgem no workspace devem ser **promovidas** para o PRD (nao ficam so no workspace).
- Workspace pode referenciar o PRD por secao, mas **nao duplica** conteudo do PRD.

**Registrar a decisao** em `historico.md` e atualizar `README.md` do PRD original apontando para o workspace.

---

## Relacao com Spec-Driven Development

O workspace **antecede** o SDD — nao compete com ele:

```
Workspace (este ADR)          SDD (/spec-from-prd → /implement)
─────────────────────         ─────────────────────────
Pergunta: "o que?"      →     Pergunta: "como implementar?"
Saida: intencao 100%    →     Entrada: plan → tasks → execute
fechada e rastreavel
```

**Regra de ouro:** nao rodar `/spec-from-prd` (ou `/implement`) **enquanto houver duvidas bloqueadoras abertas** em `70-duvidas-abertas.md`. Duvidas nao-bloqueadoras (ex: decisoes que podem ser tomadas em `/plan`) nao impedem o SDD — sinalizar explicitamente no `README.md`.

---

## Exemplo Ilustrativo

Num modulo de catalogo detalhado com este metodo, os pontos que mais pesaram:

- **Reescopos explicitos**: no meio do detalhamento, a parte de "Precificacao" saiu e a parte de "Importacao" entrou. O reescopo foi registrado em `historico.md`, duvidas da parte removida foram marcadas ❌ "Prejudicada" (nao apagadas), e o README atualizou a tabela de partes.
- **Fronteiras como primeira preocupacao**: `01-fronteiras-e-decisoes.md` foi o primeiro arquivo a ficar estavel — resolver "o que e de quem" desbloqueou as outras partes.
- **Duvidas priorizadas por impacto**: `70-duvidas-abertas.md` tem coluna "Por que importa" — forcou o time a separar duvida real de ruido.
- **IDs como chave de discussao**: em reunioes, referir-se a "Q-CAT-14" e mais rapido e menos ambiguo que reexplicar o contexto da duvida toda vez.

---

## Alternativas Consideradas

### 1. PRD monolitico unico

**Rejeitada:** gera documento ilegivel para modulos grandes; misturar "o que esta decidido" com "o que esta pendente" em um unico arquivo embaralha leitura e edicao; conflitos de merge frequentes em times com multiplos colaboradores.

### 2. Issues/tickets para rastrear duvidas

**Rejeitada isoladamente:** tickets sao bons para trabalho executavel, ruins para documentacao viva. Duvida que vira decisao precisa ficar **perto do conteudo que ela afeta**, nao em outro sistema. Tickets **complementam** o workspace (para tarefas concretas), nao o substituem.

### 3. Direto para SDD sem workspace

**Rejeitada para modulos grandes:** `/spec-from-prd` funciona melhor quando a intencao ja esta fechada. Em modulos ambiguos, especificar cedo forca decisoes que depois precisam ser revistas — o workspace e o lugar barato para iterar.

### 4. Wiki/Confluence externo

**Rejeitada:** acopla a documentacao a uma ferramenta especifica. Markdown versionado junto do codigo e portavel, diffavel e acompanha a evolucao do produto.

---

## Consequencias

### Positivas

- **Rastreabilidade total** — toda decisao tem ID, data e justificativa.
- **Paralelizacao** — multiplas pessoas editam partes diferentes sem conflito.
- **Legibilidade preservada** — arquivos curtos, proposito unico.
- **Onboarding rapido** — `README.md` + `00-visao-geral.md` dao panorama em 10 minutos.
- **SDD mais previsivel** — entra no `/spec-from-prd` com intencao limpa.
- **Metodo portavel** — aplicavel em qualquer projeto com documentacao versionada em Markdown.

### Negativas

- **Overhead inicial** — criar 10+ arquivos estruturais custa ~30 min antes de comecar a produzir conteudo (mitigado pela skill `/detail`, que scaffolda a estrutura).
- **Requer disciplina** — sem habito de atualizar `historico.md` e migrar duvidas resolvidas, o workspace vira caos rapido.
- **Nao cabe em modulos pequenos** — para features simples, o overhead nao compensa.
- **Governanca documental precisa ser explicita no fim** — workspace + PRD podem divergir se a escolha (a/b/c) nao for feita e registrada.

### Riscos de Mitigacao

- **Arquivos orfaos:** revisar trimestralmente workspaces congelados; arquivar ou excluir.
- **IDs duplicados:** manter tabela de IDs no `60-regras-negocio.md` para auditoria.
- **Duvidas esquecidas:** `70-duvidas-abertas.md` deve ser consultado em toda sessao de trabalho no modulo.

---

## Regras para Validacao

**OBRIGATORIO:**
- Todo modulo que cumpre o criterio (>= 2 sinais) deve ter workspace antes de `/prd-decompose`.
- Todo workspace deve ter `README.md`, `00-visao-geral.md`, `70-duvidas-abertas.md` e `historico.md` no minimo.
- Toda decisao que fecha uma duvida deve gerar entrada em `historico.md` com data.
- IDs de decisao (`D-<MOD>-##`) nunca sao reutilizados.
- Ao congelar workspace, a governanca documental (a/b/c) deve ser registrada em `historico.md`.

**PROIBIDO:**
- Apagar duvidas descartadas (marcar `~~Q-###~~` e manter justificativa).
- Rodar `/spec-from-prd` com duvidas bloqueadoras abertas.
- Duplicar conteudo do PRD no workspace (referenciar por link).

---

## Relacionamentos

- **Nenhum ADR anterior** — este e o primeiro ADR de processo de documentacao neste repositorio.
- **Complementa:** metodologia SDD do kit (`/spec-from-prd` → `/plan` → `/tasks` → `/execute`).
- **Automatizado por:** skill `/detail` e agent `@module-detailer`.
- **Aplicavel a:** qualquer projeto do kit que use documentacao Markdown versionada.
