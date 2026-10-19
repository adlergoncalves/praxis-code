---
name: define
description: "Fase 3: Definicao — Orquestra workflow de PRD (discovery → create → validate → decompose → spec)"
user-invocable: true
depends:
  - .claude/skills/prd-create/SKILL.md
  - .claude/skills/prd-validate/SKILL.md
  - .claude/skills/prd-decompose/SKILL.md
  - .claude/skills/spec-from-prd/SKILL.md
  - docs/adr/0006-workspace-detalhamento-modulo.md
---

# /define

Orquestra o workflow completo de definicao de produto.

## Input

```
/define {modulo}                          → modulo unico
/define {modulo1} {modulo2}               → multiplos modulos na mesma sessao
/define {modulo} --skip-gate              → pular o Gate Pre-PRD (com aviso, nao recomendado)
/define                                   → pergunta interativamente qual modulo
```

## Pipeline

1. **Pre-requisitos** → discovery.md existe e e completo
2. **🚪 Gate Pre-PRD** → auditoria de base arquitetural + clareza de produto + **gera o Module Briefing como output** (OBRIGATORIO antes de qualquer PRD)
3. **PRD Create** → Cria PRD (estrategico e/ou tatico), consumindo o briefing do Gate
4. **PRD Validate** → Valida contra template canon
5. **Detail (opcional)** → Workspace de detalhamento pre-SDD para modulos grandes/ambiguos
6. **PRD Decompose** → Decompoe em specs independentes (detecta workspace se existir)
7. **Spec from PRD** → Gera spec tecnica por feature

> **Nota**: o Gate **gera o Module Briefing como output final** — em `docs/prds/briefings/briefing-{modulo}.md` — consumido pelo `/prd-create`. Nao ha passo separado de briefing.

## Pre-requisitos

- `docs/project/discovery.md` deve existir e estar completo
- Se nao existe: rodar `/discovery` primeiro

## 🚪 Gate Pre-PRD (OBRIGATORIO)

**Antes de criar qualquer PRD**, executar este gate. PRD mal fundamentado → spec errada → implementacao errada. **Nunca pular**, mesmo que os artefatos parecam completos.

### Passo 0 — Determinar tipo do PRD a criar

**Antes de iniciar os eixos**, perguntar ao usuario:

> "Qual tipo de PRD voce vai criar para {modulo} nesta sessao?
> - **Estrategico** — define o problema central, personas, KPIs, escopo macro
> - **Tatico** — quebra em Epicos → Features → User Stories com criterios de aceite
> - **Ambos** — comecaremos pelo estrategico, depois tatico"

A resposta afeta como o Eixo B avalia algumas dimensoes (especialmente B8). Se o usuario nao souber, default seguro: comecar pelo **estrategico**.

> **Por que perguntar agora**: o tipo decide qual e a barra mental do Gate. Estrategico foca em problema/audiencia/posicionamento (Eixo B leve). Tatico foca em fluxo/regras/casos de borda (Eixo B pesado).

### Estrutura do Gate

O gate avalia dois eixos em paralelo:

### Eixo A — Auditoria de base arquitetural

Ler e cruzar:
- `docs/project/discovery.md`
- `docs/project/constitution.md`
- **Todas as ADRs** em `docs/adr/`
- `docs/project/manifest.md`
- `docs/project/learnings/architecture-learnings.md`
- PRDs ja existentes (para evitar duplicacao)

Verificar **7 dimensoes**:

| # | Dimensao | Como verificar |
|---|---|---|
| A1 | **Decisoes arquiteturais abertas** que bloqueiam implementacao do modulo a definir | Constitution tem "A definir" para Deploy, Roteamento, Data Fetching, State Management? |
| A2 | **ADRs faltando** para o dominio que tera PRD | Modulo de Vendas vai ter PRD mas nao ha ADR sobre persistencia, pagamento ou eventos? |
| A3 | **Inconsistencias entre artefatos** | ADR descreve configuracao que nao foi implementada? Manifesto diz uma coisa, codigo outra? |
| A4 | **Modulos no discovery sem ADR correspondente** | Discovery menciona "Estoque" mas nao ha ADR sobre regras de estoque/inventario? |
| A5 | **Constitution com "A definir" resolvidos** | Items que ja foram decididos em ADR mas ainda aparecem como abertos na Constitution? |
| A6 | **Dependencias entre modulos nao mapeadas** | Modulo X depende de Y, mas Y nao tem PRD nem ADR? |
| A7 | **Discovery sem profundidade** | Discovery e quase-vazio, generico ou nao menciona dominio com clareza? Sem isso, A1-A6 retornam falsamente "OK". Se A7 dispara → handoff para `/discovery` antes de prosseguir |

### Eixo B — Validacao de entendimento do produto

Para o(s) modulo(s) que terao PRD nesta sessao, verificar **8 dimensoes**:

| # | Dimensao | Como verificar |
|---|---|---|
| B1 | **Fluxo principal claro** | O que o usuario faz? O que o sistema responde? Existe sequencia clara de passos? |
| B2 | **Telas com profundidade suficiente** | Consigo escrever **acceptance scenarios concretos** a partir do que existe? Critério funcional, nao "pixel-perfect". Mockup ajuda mas nao e obrigatorio — descricao textual detalhada vale |
| B3 | **Regras de negocio explicitas** | Calculos, validacoes, fluxos condicionais estao documentados em prosa ou tabela? |
| B4 | **Casos de borda identificados** | "O que acontece se X falhar?", "E se o usuario fizer Y?", "Quais sao os limites?" |
| B5 | **Ambiguidades resolvidas** | Termos do dominio definidos no glossario? Decisoes em aberto fechadas? |
| B6 | **KPIs / metricas de sucesso definidas** | Como medir se essa feature deu certo? Sem KPI, dificil priorizar. Se faltar → sinal `KPI_AUSENTE` → handoff `/strategy` |
| B7 | **Persona concreta vs generica** | A persona e especifica o suficiente para gerar criterios de aceite distintos? "Usuario" e generico — "comprador iniciante em E-commerce B2C" e concreto. Se generica → sinal `PERSONA_GENERICA` → handoff `/strategy` |
| B8 | **PRD estrategico existe** *(condicional ao Passo 0)* | **Aplica-se apenas quando o usuario escolheu 'tatico' isolado no Passo 0.** Se nao ha PRD estrategico em `docs/prds/prd-{modulo}-estrategico.md` → sinal `PRD_SEM_ESTRATEGICO` → recomendar criar estrategico primeiro ou rodar `/strategy`. **B8 e SKIPPED nos casos 'estrategico' e 'ambos'**: em 'estrategico' nao faz sentido pedir o que esta sendo criado agora; em 'ambos' o estrategico sera criado em sequencia nesta mesma sessao (Gate roda uma vez para os dois PRDs). |

**Quando houver lacunas em B**, solicitar ativamente ao usuario:
- Prints de telas, prototipos, wireframes, esbocos a mao, descricoes textuais detalhadas
- Exemplos do sistema legado (se aplicavel)
- Regras de negocio em prosa ou planilha
- KPIs com baseline e meta (ainda que estimativa inicial)
- Recorte mais especifico da persona

**Sinais que disparam handoff `/strategy`**: `KPI_AUSENTE` (B6), `PERSONA_GENERICA` (B7), `PRD_SEM_ESTRATEGICO` (B8). Sugerir handoff **uma vez por sessao**, respeitar a decisao do usuario.

### Diagnostico em 3 severidades

Apresentar relatorio consolidado:

```markdown
# Gate Pre-PRD — Diagnostico

> Modulo(s) a definir: {modulo1, modulo2, ...}
> Avaliado em: {data}

## 🔴 Bloqueantes ({N})

Nao criar PRD ate resolver. Cada item lista: dimensao + descricao + acao sugerida.

- **[A2]** Falta ADR de persistencia para o modulo Vendas
  - Acao: `/architect` → criar ADR-XXX antes de prosseguir
- **[B2]** Tela principal de checkout nao foi descrita nem exemplificada
  - Acao: usuario deve fornecer mockup ou descricao detalhada antes de criar PRD

## 🟡 Importantes ({N})

Resolver em paralelo com os primeiros PRDs ou logo apos. Nao bloqueia o gate, mas marca debito tecnico.

- **[A4]** Modulo "Notificacoes" mencionado no discovery sem ADR
  - Acao: criar ADR conforme proximos modulos forem definidos
- **[B4]** Casos de borda de "saldo insuficiente" nao foram explorados
  - Acao: registrar como `[REQUER RESPOSTA DO PM]` no PRD e fechar na clarificacao

## 🟢 Menores ({N})

Podem aguardar. Documentar para revisao futura.

- **[A5]** Constitution ainda lista "Caching strategy: A definir" — ja foi resolvido em ADR-007
  - Acao: atualizar a Constitution no proximo `/architect`
```

### Resolucao iterativa

- Se ha **🔴 Bloqueantes**: o gate **trava** ate o usuario resolver ou justificar explicitamente
- Para cada bloqueante: oferecer handoff (`/architect`, `/discovery`, solicitacao de artefato)
- Iterar quantas vezes for necessario — o gate roda novamente apos cada handoff
- Avancar **somente quando** todos os bloqueantes foram resolvidos ou explicitamente aceitos como risco

### Confirmacao explicita antes de criar PRDs

Apos resolucao, **sempre** apresentar um **checklist dinamico** que reflete o estado REAL — nao um modelo estatico. Cada item ganha um icone conforme foi tratado:

| Icone | Significado | Quando usar |
|---|---|---|
| ✅ | **Resolvido** — questao foi fechada nesta sessao ou ja estava OK | Item nao tinha pendencia, ou foi resolvido via handoff (ex: `/architect` criou ADR faltante) |
| ⚠️ | **Aceito como risco** — questao adiada, registrada como decisao aberta | Usuario escolheu seguir sem resolver, com a divida documentada |
| ❌ | **Ignorado** — questao nao foi tratada e nao foi explicitamente aceita | Nao deveria existir apos o gate; aparecer aqui = bug do agente, deve travar |

**Exemplo de checklist dinamico** (cenario real: modulo Vendas com 4 bloqueantes, 2 resolvidos e 2 aceitos como risco):

```
Estado final do Gate Pre-PRD para "vendas":

✅ Persistencia: ADR-004 criada nesta sessao
⚠️ Pagamento: pendente, registrado como decision aberta no PRD (Stripe sera escolhido depois)
⚠️ Estoque (dependencia): modulo subsequente, registrado como dependencia
✅ Telas: descricao textual em briefing-vendas.md §3 — profundidade suficiente para acceptance scenarios
✅ Persona: "comprador iniciante em E-commerce B2C" — concreta o suficiente
✅ KPI definido: conversao de checkout > 15%

Resumo: 4 resolvidos, 2 aceitos como risco, 0 ignorados.

Posso criar o(s) PRD(s) para vendas? (S/N)
```

> **Sobre evidencia para B2 (Telas)**: aceite **qualquer um** destes formatos — todos sao validos:
> - Mockup ou wireframe (ex: `docs/prds/assets/{modulo}-{tela}.png`)
> - Print de tela do sistema legado (engenharia reversa)
> - Descricao textual com profundidade (no briefing, glossario ou anexo)
> - Esboco a mao fotografado
>
> O criterio nao e "pixel-perfect" — e **"consigo escrever Given/When/Then concretos?"**. Um agente disciplinado **nao** exige mockup quando descricao textual ja sustenta os acceptance scenarios.

**Regra critica**: o checklist deve listar **cada item** que foi flagado no diagnostico, com seu desfecho real. Nao usar modelo generico. Sem essa transparencia, o usuario nao sabe o que esta confirmando.

**O usuario precisa confirmar explicitamente**. Sem confirmacao, o gate nao avanca.

### Persistencia do relatorio do Gate (OBRIGATORIO)

Apos confirmacao, **salvar o relatorio completo** em `docs/prds/gate-reports/gate-{modulo}-{YYYY-MM-DD}.md`. Esse arquivo:

- Documenta o estado da auditoria no momento do gate
- E lido por `/prd-decompose` (sabe que "Vendas depende de Estoque, aceito como risco")
- E lido por `/spec-from-prd` (sabe que "Pagamento foi adiado")
- Serve de referencia para revisitar decisoes depois ("por que aceitamos isso como risco?")

**Formato do arquivo**:

```markdown
# Gate Report — {modulo}

> Data: {YYYY-MM-DD}
> Modulo(s): {lista}

## Diagnostico
{copiar o diagnostico em 3 severidades aqui}

## Resolucoes
{lista de itens com seu desfecho: resolvido/aceito-risco/ignorado, ver checklist dinamico}

## Decisoes em aberto registradas
- {Item adiado 1}: contexto + plano de quando revisitar
- {Item adiado 2}: ...

## Dependencias futuras mapeadas
- {Modulo X} depende de {Modulo Y} (ainda nao definido)
- ...

## Bypass usado?
{sim/nao + motivo se sim}
```

Salvar **antes** de prosseguir para o PRD Create. Sem persistencia, informacao se perde na conversa.

### Output final: Module Briefing

Apos persistir o gate report, o Gate **gera o Module Briefing** consolidado em `docs/prds/briefings/briefing-{modulo}.md`. Esse briefing e o **input do `/prd-create`**. Agora e consequencia natural do Gate.

O briefing inclui:
- **Resumo do modulo**: o que faz, fronteiras com outros modulos, personas envolvidas
- **Decisoes resolvidas** (cross-ref ao gate-report e ADRs relacionados)
- **Decisoes em aberto** (cross-ref a `[REQUER RESPOSTA DO PM]` no PRD)
- **Dependencias mapeadas** (cross-ref ao gate-report)
- **KPIs / personas definidas** no Eixo B
- **Artefatos visuais fornecidos** (mockups, prints, descricoes textuais)
- **Pointer para o gate-report** completo

**Regra**: o `/prd-create` **le este briefing como contexto principal** ao gerar o PRD. Sem briefing, `/prd-create` vai pedir contexto que ja foi resolvido — desperdiciando trabalho do Gate.

### Bypass do gate

O usuario pode pedir bypass explicito (`/define {modulo} --skip-gate`), mas:
- Avisar UMA vez sobre o risco: "Pular o gate aumenta a chance de retrabalho. Realmente prosseguir sem auditoria?"
- Registrar bypass em `docs/project/learnings/process-learnings.md` para posterior reflexao
- O gate **nao** e bypassado por default mesmo em modo `lite`

### Quando pular o gate (legitimamente)

- PRD ja existe e e apenas **atualizacao** (rodar `/prd-validate` em vez de `/prd-create`)
- Modulo trivial sem dependencias arquiteturais (e raro — defaultar para rodar o gate)

## Execucao

1. Verificar pre-requisitos (`discovery.md` existe e completo)
2. Identificar modulo(s) a definir (do argumento ou perguntando)
3. **Rodar Gate Pre-PRD**:
   a. **Passo 0** — perguntar tipo do PRD (estrategico / tatico / ambos). Default se ambiguo: estrategico
   b. Eixo A (7 dimensoes) + Eixo B (8 dimensoes, B8 condicional ao Passo 0)
   c. Diagnostico consolidado (🔴 / 🟡 / 🟢)
   d. Resolucao iterativa (handoffs para `/architect`, `/discovery`, `/strategy`, solicitacao de artefatos)
   e. Checklist dinamico de confirmacao explicita
   f. Persistir gate report em `docs/prds/gate-reports/`
   g. Gerar Module Briefing em `docs/prds/briefings/`
4. Verificar estado atual das sub-skills e pular etapas ja completas
5. Executar proxima etapa pendente (`/prd-create`, `/prd-validate`, `/detail`, `/prd-decompose`, `/spec-from-prd`)
6. Sugerir proxima etapa ao final

> **Bypass**: se argumento `--skip-gate` foi passado, pular passo 3 inteiro mas registrar bypass em `process-learnings.md` (ver "Bypass do gate" acima).

## Sub-skills

- `/prd-create {modulo} [strategic|tactical]`
- `/prd-validate {modulo}`
- `/detail {modulo}` — opcional, para modulos grandes/ambiguos (>= 2 sinais de complexidade). Ver `docs/adr/0006-workspace-detalhamento-modulo.md`
- `/prd-decompose {modulo}` — detecta automaticamente se ha workspace `/detail` congelado
- `/prd-coverage {modulo}`
- `/spec-from-prd {prd} FEATURE:{X.Y}`

## Quando usar /detail

Apos `/prd-validate`, avaliar se o modulo atende **>= 2 sinais**:
- >= 3 fronteiras com outros modulos
- PRD desatualizado/conflitante
- Multiplas partes funcionais independentes
- Decisoes abertas que nao fecham em uma sessao
- Implementacao dividida em varias iteracoes SDD
- Vocabulario novo ou colidente

Se sim → rodar `/detail {modulo}` antes de `/prd-decompose`.
Se nao → ir direto para `/prd-decompose`.

## Gestao de Contexto

Ao concluir cada sub-etapa (PRD criado, validado, decomposto, spec gerada), **recomende ao usuario executar `/clear`** antes da proxima etapa. Todos os outputs estao salvos em arquivos e serao lidos pela proxima skill. Limpar o contexto entre etapas garante qualidade maxima.

## Atualizacao do Manifesto

Ao concluir cada sub-etapa, atualizar `docs/project/manifest.md`:
- Define (PRDs) → atualizar status e listar PRDs criados
- Specs → listar specs geradas com modulo e status

## Handoffs

- → `/clear` (limpar contexto entre etapas e apos conclusao)
- → `/strategy` (quando sinais de risco de negocio detectados)
- → `/architect` (se ADRs nao existem)
- → `/implement` (quando specs prontas)
