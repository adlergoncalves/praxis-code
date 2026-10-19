---
name: start
description: "Ponto de entrada do kit. Identifica a linha de trabalho (novo, legado, adocao) e guia o usuario pelo pipeline correto."
user-invocable: true
depends:
  - .claude/agents/orchestration/praxis.md
---

# /start

Ponto de entrada principal do kit. Identifica a situacao do usuario e direciona para o pipeline correto.

## 3 Linhas de Trabalho

### Linha 1 — Novo Software
Construir uma aplicacao do zero com o kit completo.
```
/start → /discovery → /architect → /define → /implement → /validate
```

### Linha 2 — Modernizar Legado
Documentar um sistema legado e reconstrui-lo com o kit.
```
/start → /reverse-engineer → /discovery → /architect → /define → /implement → /validate
```

### Linha 3 — Adotar Projeto Existente
Trazer um projeto em andamento para dentro do ecossistema do kit, sem impacto no codigo. Depois, usar o kit normalmente para bugs, features e refatoracoes.
```
/start → /adopt → (projeto adotado) → /implement, /debug, /quickfix, /validate...
```

## Trilha minima

Depois da linha escolhida, o dia a dia cabe em cinco comandos — e o Praxis (ligado por padrao)
propoe os demais quando o estado do projeto pede:

| Comando | Para que |
|---|---|
| `/start` | Entrada unica: identifica a linha de trabalho e diz o proximo passo |
| `/define` | Da ideia ao PRD e a spec da feature |
| `/implement` | Da spec ao pacote aprovado e ao loop autonomo por fatia |
| `/quickfix` | Ajuste trivial, sem cerimonia |
| `/debug` | Investigacao de bug |

Ao terminar o `/start`, mostrar esta tabela uma vez (curta) junto do primeiro comando.

## Execucao

### Passo 0 — Montar o nucleo (ADR-0009)

A semente traz so este comando e o `praxis.mjs`. Se `.claude/agents/orchestration/praxis.md` nao existe, rodar **antes de qualquer pergunta**:

```bash
node .claude/praxis/praxis.mjs init
```

Puxa o nucleo (Praxis, `/mode`, `/setup`, hooks de aprendizado) e copia as sementes de projeto (`docs/project/`). Sem anuncio; so avisar se falhar (sem rede, repositorio fora do ar) — com o comando para rodar depois.

### Passo 1 — Identificar Situacao

Perguntar ao usuario:

```
Bem-vindo ao Praxis!

Qual e a sua situacao?

1. **Novo software** — Quero construir uma aplicacao do zero
   → Vou te guiar desde o entendimento do problema ate a implementacao

2. **Modernizar legado** — Tenho um sistema existente que quero reconstruir
   → Vou documentar o legado primeiro e depois construir o novo

3. **Adotar projeto existente** — Tenho um projeto em andamento e quero 
   passar a usar o kit para trabalhar nele (bugs, features, refatoracoes)
   → Vou mapear o projeto, criar o contexto e as regras para que voce 
     possa usar todos os recursos do kit
```

### Passo 1b — Modo de operacao

Apos identificar a linha, perguntar:

```
Qual o porte do seu projeto?

1. **Pequeno/MVP** (modo lite — rapido, simples, sem cerimonia)
   → Discovery rapido, ADRs default, /implement aceita descricao livre

2. **Medio/Grande** (modo full — pipeline completo, profissional)
   → Discovery completo, ADRs interativas, specs formais, validacao completa
```

- Se lite: executar `/mode lite` automaticamente apos o setup
- Se full: manter default (nao precisa rodar nada)

### Passo 2 — Verificar Estado Atual

Antes de direcionar, verificar o que ja existe:
- `docs/project/discovery.md` → discovery ja feito?
- `docs/adr/*.md` → ADRs ja existem?
- `docs/project/constitution.md` → constitution preenchida?
- `docs/prds/` → PRDs existem?
- `docs/specs/` → Specs existem?

Se ja tem artefatos, mostrar resumo do estado e sugerir retomada do ponto correto.

### Passo 2b — Puxar a trilha da linha

Com a linha escolhida, puxar de uma vez as skills do caminho comum (idempotente, sem anuncio):

| Linha | Comando |
|---|---|
| Novo Software | `node .claude/praxis/praxis.mjs add --module linha-novo` |
| Modernizar Legado | `node .claude/praxis/praxis.mjs add --module linha-legado` |
| Adotar Projeto | `node .claude/praxis/praxis.mjs add --module linha-adocao` |

Os modulos de stack (frontend, backend, DS, DDD) sao puxados pelo `/setup`. Tudo o mais entra na hora do uso (regra em `.claude/praxis/rules.md`).

### Passo 3 — Direcionar

#### Se Linha 1 (Novo Software):
1. Verificar se `/setup` ja foi rodado (CLAUDE.md personalizado existe?)
   - Se nao: "Primeiro, vamos configurar o template: `/setup`"
   - Se sim: "Setup ja feito. Proximo passo: `/discovery`"
2. Explicar o pipeline completo brevemente:
   ```
   /discovery → /architect → [/ds-init] → /define → /implement → /validate
   ```
   Se o projeto tem frontend e Design System habilitado, mencionar:
   "Apos as ADRs, voce pode criar o Design System com `/ds-init` usando um screenshot de referencia."
3. Sugerir o primeiro comando

#### Se Linha 2 (Modernizar Legado):
1. Perguntar onde esta o projeto legado (caminho no workspace)
2. Verificar se `/setup` ja foi rodado
   - Se nao: "Primeiro, `/setup`"
   - Se sim: "Setup OK. Proximo: `/reverse-engineer {caminho-do-legado}`"
3. Explicar que a engenharia reversa documenta sem modificar o legado
4. Se tem frontend: mencionar que apos `/architect` pode criar DS com `/ds-init`

#### Se Linha 3 (Adotar Projeto Existente):
1. Explicar o que vai acontecer:
   ```
   O /adopt vai:
   1. Mapear seu projeto (estrutura, stack, padroes)
   2. Fazer discovery adaptado (entender o negocio + documentar o existente)
   3. Criar ADRs baseadas nos padroes JA usados no projeto
   4. Gerar constitution com as regras do projeto
   5. Rodar validacao baseline (sem corrigir nada)
   
   Ao final, seu projeto tera todo o contexto necessario para usar:
   - /implement para novas features
   - /debug e /quickfix para correcoes
   - /validate para checar qualidade
   - /review antes de commits
   ```
2. Perguntar onde esta o projeto (se nao e o diretorio atual)
3. Direcionar para `/adopt`

## Hook Proativo — /strategy

Apos identificar a linha de trabalho e o modo, verificar:

**Se Linha 1 (Novo Software) e o projeto ainda nao tem `docs/project/discovery.md`:**
- Perguntar em 1-2 frases se o usuario ja tem clareza sobre o problema de negocio
- Se a resposta for vaga (ex: "quero fazer um app de X", "tenho uma ideia de...") → sugerir:

> "Antes de entrar no pipeline tecnico, posso te ajudar a pensar melhor sobre o negocio.
> Quer uma sessao rapida de `/strategy` para validar a ideia antes de comecar?"

**Se Linha 2 (Modernizar Legado):**
- Nao sugerir `/strategy` automaticamente — o negocio ja existe

**Se Linha 3 (Adotar Projeto Existente):**
- Nao sugerir `/strategy` automaticamente — foco e em adotar, nao em redefinir

**Regra**: Sugerir `/strategy` no maximo UMA vez. Se o usuario recusar, prosseguir sem insistir.

## Regras

- NAO pular o `/setup` se ainda nao foi rodado
- NAO assumir a linha — sempre perguntar
- Mostrar estado atual se ja tem artefatos
- Ser acolhedor — este e o primeiro contato do usuario com o kit
