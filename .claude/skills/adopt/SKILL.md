---
description: "Linha 3: Adocao de projeto existente. Mapeia, documenta e padroniza um projeto em andamento para uso completo do kit, sem impacto no codigo."
user-invocable: true
depends:
  - .claude/agents/discovery/codebase-mapper.md
  - .claude/agents/discovery/discovery.md
  - .claude/agents/architecture/adr-creator.md
  - .claude/agents/architecture/adr-validator.md
  - .claude/skills/validate/SKILL.md
---

# /adopt

Adota um projeto existente para dentro do ecossistema do kit. Cria todo o contexto que um projeto "nascido no kit" teria naturalmente — discovery, ADRs, constitution — sem modificar uma linha de codigo.

**Objetivo final**: Apos o `/adopt`, o usuario pode usar `/implement`, `/debug`, `/quickfix`, `/validate`, `/review` e todos os recursos do kit normalmente.

## Quando usar

- Projeto em andamento que nunca usou o kit
- Projeto herdado de outro dev/time
- Projeto pessoal que cresceu e precisa de organizacao
- Qualquer projeto onde o kit seria util mas falta o contexto

## O que NAO faz

- NAO modifica codigo existente
- NAO refatora nada
- NAO cria PRDs ou specs (isso vem depois, sob demanda)
- NAO corrige bugs ou violacoes encontradas
- NAO julga qualidade — documenta factos

## Input

`/adopt [caminho-do-projeto]`

Se nao especificado, assume o diretorio atual.

## Pipeline de Adocao (5 etapas)

### Etapa 1 — Mapeamento Estrutural

Delegar ao agent `@codebase-mapper`:
- Estrutura de pastas
- Stack tecnica (detectar de package.json, *.csproj, etc.)
- Dependencias
- Padroes de organizacao observados
- Metricas factuais

**Output**: `docs/project/codebase-map.md`

**Confirmacao**: Apresentar resumo ao usuario. "Este mapeamento esta correto? Faltou algo?"

### Etapa 2 — Discovery Adaptado

Delegar ao agent `@discovery` em **modo adocao** (nao modo projeto novo):

Diferenca do discovery normal:
- Etapa 1 (Natureza): Ja se sabe que e projeto existente — pular
- Etapa 2 (Negocio): Perguntar, mas aceitar respostas mais curtas — o projeto ja existe
- Etapa 3 (Stack): **Preencher automaticamente** a partir do codebase-map, confirmando com o usuario
- Etapa 4 (Time): Perguntar normalmente
- Etapa 5 (Restricoes): Perguntar normalmente + "Quais areas do codigo nao devem ser tocadas?"
- Etapa 6 (Modulos): **Inferir do codebase-map** + confirmar com usuario

**Output**: `docs/project/discovery.md`

**Confirmacao**: Validar com usuario antes de avancar.

### Etapa 3 — ADRs por Inferencia

Delegar ao agent `@adr-creator` em **modo inferencia**:

Em vez de propor boas praticas do zero, o agent:
1. Le o `codebase-map.md` e identifica os padroes JA usados no projeto
2. Para cada padrao encontrado:
   - Se e uma boa pratica de mercado → criar ADR "Accepted" documentando o padrao
   - Se e um padrao incomum → perguntar ao usuario: "O projeto usa {padrao}. Isso e intencional ou historico?"
     - Se intencional → criar ADR com justificativa
     - Se historico → criar ADR com o padrao de mercado como target e o atual como "estado atual"
3. Para padroes ausentes mas importantes (ex: nao tem convention de naming):
   - Propor ADR seguindo boas praticas como default

**Categorias a inferir**:
- Estrutura de pastas (feature-first? layer-first?)
- Naming conventions (PascalCase? camelCase? kebab-case?)
- Arquitetura (Clean? MVC? sem padrao claro?)
- Testes (existe? qual framework? qual padrao?)
- Error handling (centralizado? espalhado?)
- State management (se frontend)
- API patterns (REST? GraphQL? convencoes de endpoint?)

**Output**: ADRs em `docs/adr/` + atualizacao do indice

**Confirmacao**: Apresentar todas as ADRs geradas para aprovacao.

### Etapa 4 — Constitution

Consolidar principios de todas as ADRs aceitas em `docs/project/constitution.md`:

```markdown
# Constitution do Projeto

**Versao**: 1.0.0
**Status**: Ativo
**Atualizado em**: {data}
**Origem**: Gerado via /adopt (adocao de projeto existente)

## Principios Core
{Extraidos das ADRs universais}

## Padroes Obrigatorios
{Regras OBRIGATORIO de todas as ADRs}

## Padroes Proibidos
{Regras PROIBIDO de todas as ADRs}

## Padroes Preferidos
{Regras PREFERIDO de todas as ADRs}

## Estado Atual vs Target
{Para ADRs onde o padrao atual diverge do target}
| Aspecto | Estado Atual | Target | ADR |
|---------|-------------|--------|-----|

## Governanca
- ADRs criadas via `/adopt` em {data}
- Para criar novas ADRs: `/architect`
- Para validar codigo: `/validate`
```

**Output**: `docs/project/constitution.md`

### Etapa 5 — Validacao Baseline

Rodar `/validate geral --profile minimal` para gerar um relatorio baseline:

1. Executar `@adr-validator` contra o codigo existente usando as ADRs recem-criadas
2. **NAO corrigir nada** — apenas documentar o estado atual
3. Classificar findings como:
   - **Divergencia conhecida**: O codigo existe assim e as ADRs documentam o target
   - **Violacao**: O codigo viola uma ADR que documenta um padrao que ja e usado no projeto
4. Salvar relatorio em `docs/validation-reports/{data}-baseline.md`

**Output**: Relatorio baseline

## Pos-Adocao

Ao final das 5 etapas, apresentar resumo e **guiar o usuario para o proximo passo concreto**:

```
Projeto adotado com sucesso!

Artefatos criados:
- docs/project/codebase-map.md    — Mapeamento estrutural
- docs/project/discovery.md       — Contexto do projeto
- docs/adr/0001-*.md ... 000N-*.md — {N} ADRs criadas
- docs/project/constitution.md    — Regras consolidadas
- docs/validation-reports/{data}-baseline.md — Estado atual

Divergencias encontradas no baseline: {N}
- Para corrigir gradualmente: corrija e rode /revalidate
- Para aceitar como divida: marque como [ACCEPTED] no relatorio
```

### Guia Pos-Adocao — "O que faco agora?"

Perguntar ao usuario qual e a proxima necessidade e direcionar:

```
Agora que o projeto esta adotado, o que voce precisa fazer?

1. **Corrigir um bug** → /debug {descricao}
   Investiga, identifica causa raiz e propoe fix seguindo as ADRs.

2. **Ajuste rapido** (typo, CSS, config) → /quickfix {descricao}
   Correcao direta sem cerimonia.

3. **Nova feature** → /define → /spec-from-prd → /implement
   Cria PRD e spec da feature, depois implementa com o pipeline completo.
   (Ou se for feature simples, pode ir direto para /implement com spec leve.)

4. **Refatorar parte do codigo** → /implement {descricao} --team {scope}
   Crie uma spec descrevendo o que quer refatorar e por que.
   O kit planeja, quebra em tasks e executa respeitando as ADRs.

5. **Validar qualidade do codigo atual** → /validate
   Roda todos os agents de validacao contra o codigo existente.

6. **Melhorar as regras do projeto** → /architect
   Adiciona ou modifica ADRs interativamente.

7. **Nada agora, so queria organizar** → OK!
   Quando precisar, volte e use qualquer comando acima.
```

### Fluxos pos-adocao detalhados

#### Bug fix em projeto adotado
```
/debug {descricao do bug}
  → Investiga no codebase (agora com contexto do discovery + ADRs)
  → Propoe fix respeitando constitution
  → /review antes de commit
```

#### Feature nova em projeto adotado
```
/define {modulo}              → Cria PRD da feature
/spec-from-prd {prd} FEATURE:{X.Y}  → Gera spec tecnica
/implement {spec} --team {scope}     → Planeja e implementa
/validate --team {scope}             → Valida o resultado
```

#### Refatoracao em projeto adotado
```
# Criar spec descrevendo a refatoracao
# (pode ser feito manualmente ou via /define)

/implement refatoracao-auth --team back
  → Plan foca nos arquivos a refatorar
  → Tasks preservam comportamento existente (testes primeiro)
  → Execucao segue ADRs do projeto
/validate --team back
```

## Atualizacao do Manifesto

Ao concluir cada etapa, atualizar `docs/project/manifest.md`:
- Etapa 1 → Codebase Map existente, Stack preenchida
- Etapa 2 → Discovery completo
- Etapa 3 → ADRs listadas
- Etapa 4 → Constitution existente
- Etapa 5 → Relatorio baseline registrado
- Linha de trabalho → `Adotar Projeto`

## Enriquecimento do CLAUDE.md (max 3 linhas)

Adicionar ao CLAUDE.md apenas ponteiros curtos:
```markdown
**Projeto adotado**: {nome} | Stack: {frontend} + {backend} + {db}
**ADRs**: {N} criadas | **Baseline**: {N} divergencias | Detalhes: `docs/project/manifest.md`
```
Tudo detalhado (lista de ADRs, divergencias, stack completa) fica no manifesto.

## Gestao de Contexto

**Recomende `/clear` entre as etapas 2 e 3** (discovery para ADRs), e entre 4 e 5 (constitution para validacao). Os outputs estao salvos em arquivos.

## Handoffs

- → `/clear` (entre etapas)
- → `/debug` (bug fix imediato)
- → `/quickfix` (ajuste rapido)
- → `/define` → `/implement` (feature nova)
- → `/implement` (refatoracao)
- → `/validate` (checar qualidade)
- → `/architect` (modificar ADRs)
