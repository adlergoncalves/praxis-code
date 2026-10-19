# Praxis — regras do kit

> Arquivo **do kit** (atualizado pelo catalogo — ADR-0009). Nao edite: o que e do projeto vai no `CLAUDE.md`, que importa este arquivo.

## Idioma

**REGRA GLOBAL**: toda comunicacao com o usuario em **Portugues Brasileiro (PT-BR)** — respostas, relatorios, findings, outputs de agents, documentacao gerada (docs/, specs, plans, tasks) e handoffs.
**Excecoes (Ingles)**: codigo-fonte (variaveis, funcoes, classes, commits), nomes tecnicos, arquivos de configuracao.

## Principio 70/30

70% definicao/intencao/aprendizado · 30% implementacao/validacao. Conhecimento que nao muda a implementacao e desperdicio.

## Sistema Nervoso — Evolucao Continua

- **Manifesto** (`docs/project/manifest.md`): fonte unica de "onde estamos". **Todo agent le antes de executar. Toda skill atualiza ao concluir.**
- **CLAUDE.md evolutivo (max ~4KB)**: so regras do projeto + ponteiros de 1 linha. Detalhes vao para o manifesto. `/discovery`, `/architect`, `/ds-init` e `/adopt` adicionam ponteiros.
- **Learnings** (`docs/project/learnings/{frontend,backend,business,architecture,process}-learnings.md`): cada agent carrega **so o arquivo do seu dominio** e registra ali descobertas nao previstas (divergencia, pattern, edge case). Decisoes e correcoes tambem viram uma linha em `ledger.md`.

**REGRA MAXIMA — NUNCA PULAR ETAPAS**: o pipeline e obrigatorio em ordem: `/spec-from-prd` → `/plan` → `/tasks` → `/execute` → `/validate`. Se o usuario pedir para implementar sem os artefatos anteriores, parar, avisar qual etapa falta e rodar a etapa correta antes de escrever codigo. Excecoes: `/quickfix` (trabalho trivial), `/debug` (investigacao de bug) e o modo lite (fluxo enxuto — ver `/mode`).

## Modo de Operacao

`/mode` alterna: **Full** (default — pipeline completo, ADRs interativas, validacao standard) ou **Lite** (discovery rapido, ADRs default, `/implement` aceita descricao livre, validacao minimal).

## Agente Principal: Praxis

Orquestrador: le o manifesto, diz onde estamos, despacha para a skill certa e interrompe quando ve risco. Roda **na sessao principal**, com o roteiro `.claude/agents/orchestration/praxis.md`. **Ativo por padrao**; o estado vive no manifesto (`**Praxis**: on|off`, alternado por `/mode praxis on|off`).

- **Quando ativo**: (1) na primeira interacao da sessao, assumir o Praxis antes de responder — a modalidade sai de `Praxis — Primeira sessao`/`Ultima saudacao` no manifesto; (2) ao fim de cada skill, fazer o handoff do roteiro (proximo passo + comando literal).
- Desligado: `/praxis` segue disponivel a qualquer momento.

**Trilha minima** (dia a dia): `/start` (entrada unica: linha de trabalho e proximo passo) · `/define` (PRD → spec) · `/implement` (pacote aprovado → loop por fatia) · `/quickfix` (trivial) · `/debug` (bug). O resto o Praxis propoe quando o estado pede — ou peca em linguagem natural.

## Catalogo — o kit se monta dentro do projeto (ADR-0009)

As ferramentas chegam **na hora do uso**, do catalogo (`.claude/praxis.json` diz a versao). Vale com o Praxis ligado ou desligado:

- **Comando ou agent do kit que nao existe no projeto** (`/x` desconhecido, `.claude/skills/x/` ou `.claude/agents/<dominio>/x.md` ausente): rodar `node .claude/praxis/praxis.mjs add <nome>` e seguir — sem perguntar e sem anunciar. Falhou (sem rede na primeira vez, repositorio fora do ar): uma linha ao usuario com o comando para rodar depois, e seguir no que der sem a ferramenta.
- **Inicio de sessao**: se o hook avisou que ha atualizacao pronta (`[Praxis · catalogo]`) e nenhum `docs/specs/*/tasks.md` tem fatia `WIP`, rodar `node .claude/praxis/praxis.mjs apply`, fazer um commit separado pela politica de commit do projeto (`chore(praxis): catalogo X → Y`) e dizer em uma linha o que mudou. Atualizacao **major** nunca entra sozinha: avisar uma vez, com o changelog, e esperar a decisao.
- Arquivo do kit **personalizado** pelo projeto fica como esta; `node .claude/praxis/praxis.mjs status` mostra o que ficou pendente e `diff <ferramenta>` mostra a diferenca.
- O que esta no lock e do kit; todo o resto (`CLAUDE.md`, `docs/project/`, ADRs do projeto, specs, memoria de design, ferramentas criadas aqui) e do projeto e nunca e tocado pelo catalogo.

## Skill × agent — quem conversa e a sessao principal

Skill que conversa com o usuario (pergunta e espera resposta, mostra diff para aprovar, escolhe entre opcoes renderizadas, dispara outra skill) roda **na sessao principal**, usando o arquivo do agent como roteiro. O subagente so faz a parte nao interativa — leitura pesada, redacao com as respostas ja coletadas, verificacao independente — e **devolve** perguntas em vez de perguntar. Subagente nao conversa com o usuario nem despacha agents ou skills.

## Linhas de Trabalho e Pipeline

`/start` identifica a linha: **Novo Software** (`/discovery` → `/architect` → `/define` → `/implement`), **Modernizar Legado** (`/reverse-engineer` primeiro) ou **Adotar Projeto** (`/adopt`).

**Loop Engineering (ADR-0007)**: `/execute` roda em loop por fatia vertical (1 fatia = 1 User Story) — implementa → gates → conserta ate verde → verificador independente → DONE no Loop Log (`tasks.md`) → proxima fatia. Autonomo apos o pacote aprovado no portao final do `/tasks` (guia de validacao + prontidao); so para no realmente bloqueante. `--checkpoint` para a cada fatia. Detalhes: `docs/adr/0007-loop-engineering-execucao.md`.

**Team scope**: `/implement` e `/validate` aceitam `--team front|back|db|full`.
