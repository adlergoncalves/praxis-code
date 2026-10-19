---
description: "Cria PRD estrategico ou tatico seguindo template canonico. Questiona informacoes incompletas."
user-invocable: true
depends:
  - .claude/agents/product/prd-create.md
---

# /prd-create

Cria PRDs de alta qualidade seguindo o template canonico do projeto. Atua como **Especialista Senior em Product Management** — questiona premissas vagas, nao aceita "a definir", e prioriza clareza acima de tudo.

## Principios

- **CLAREZA ACIMA DE TUDO** — perguntar antes de documentar
- **Customer-centric** — centrado no usuario e no negocio
- **Questionar premissas vagas** — nao aceitar "a definir"
- **Nunca documentar decisoes em aberto como resolvidas**
- **Estilo**: narrativa fluida (contexto → problema → oportunidade → solucao → impacto)
- **Idioma**: PRDs em **Portugues Brasileiro (PT-BR)**

## Input

`/prd-create {modulo} [strategic|tactical]`

- `{modulo} strategic` → PRD estrategico (11 secoes)
- `{modulo} tactical` → PRD tatico (Epico→Feature→US)
- `{modulo}` → Pergunta qual tipo
- Vazio → Pergunta modulo e tipo

## Dependencias automaticas

1. **Briefing**: `docs/prds/briefings/briefing-{modulo}.md` (se existe, usar sem re-perguntar)
2. **Gate report**: `docs/prds/gate-reports/gate-{modulo}-*.md` (se existe, ler para **detalhe** das decisoes em aberto, dependencias futuras e contexto das resolucoes do Gate. Briefing resume; gate-report tem nuance)
3. ADRs: `docs/adr/`
4. Glossario: `docs/project/glossary.md`
5. PRD complementar (estrategico se criando tatico, vice-versa)
6. Learnings: `docs/project/learnings/business-learnings.md`

> **Por que ler o gate-report**: o briefing sumariza para iniciar o PRD rapido, mas o gate-report preserva o **porque** de cada decisao adiada. Ex: briefing diz "Pagamento: pendente". Gate-report diz "Pagamento: pendente porque CNPJ ainda nao foi definido; revisar quando regularizacao completar". Sem o gate-report, o PRD perde memoria institucional e a equipe esquece o contexto em 3 meses.

## Workflow

### Passo 1 — Pre-flight

Carregar dependencias, apresentar resumo do contexto. Se ja existe briefing, nao re-perguntar o que esta documentado.

### Passo 2 — Discovery

Perguntar 5 questoes-chave ao PM:

1. **Features no escopo** desta versao (IN/OUT/FUTURE)
2. **Decisoes de negocio/tecnicas** confirmadas
3. **KPIs e baselines** (marcar `[A PREENCHER]` se desconhecido)
4. **Restricoes** (prazo, tech, dependencias)
5. **Priorizacao** de features (P1/P2/P3)

### Passo 3 — Gerar PRD

Seguir o template canonico correspondente ao tipo. As perguntas ao PM ficam nesta sessao (subagente nao conversa — `.claude/praxis/rules.md`); a redacao de um PRD grande pode ir ao `@prd-create` com as respostas ja coletadas, para nao encher a janela.

#### Template — PRD Estrategico (11 secoes — as mesmas que o `/prd-validate` cobra)

Header de metadados: **Tipo**: Estrategico · **Modulo** · **Publico** · **Status** · **Atualizado em**

1. Contexto e Visao de Negocio
2. Problema / Dor Principal
3. Objetivos do Produto
4. Stakeholders e Personas
5. Proposta de Valor
6. Escopo Funcional (IN / OUT / FUTURE)
7. User Stories — Visao Executiva
8. Requisitos Nao Funcionais (tabela)
9. Metricas de Sucesso (tabela: Baseline · Meta · Prazo)
10. Riscos, Premissas e Dependencias (tabela, >= 3 riscos)
11. Narrativa Final

#### Template — PRD Tatico (Epico → Feature → US)

```markdown
## Epico: {nome}
**Descricao**: {o que o epico entrega e por que}

| Ator impactado | Como e afetado |
|----------------|----------------|
| {persona} | {o que muda para ela} |

### Feature {X.Y}: {titulo}
**Descricao**: {o que faz e por que}

#### User Stories
| ID | Como... | Quero... | Para... | Prioridade |
|----|---------|----------|---------|------------|
| US-{X.Y.Z} | {persona} | {acao} | {beneficio} | P1/P2/P3 |

##### Criterios de Aceite — US-{X.Y.Z}
| # | Given | When | Then |
|---|-------|------|------|
```

### Passo 4 — Validacao Inline

Verificar regras de qualidade (abaixo) antes de salvar.

### Passo 5 — Salvar

- **Estrategico**: `docs/prds/prd-{nome}-estrategico.md`
- **Tatico**: `docs/prds/prd-{nome}.md`

### Passo 6 — Proximo Passo

- Se estrategico criado → sugerir `/prd-create {modulo} tactical`
- Se tatico criado → sugerir `/prd-validate` depois `/prd-decompose`

## Regras de Qualidade

- **Nao gerar secoes genericas** — se nao ha conteudo substantivo, perguntar
- **Nao usar placeholders** (exceto KPI baselines marcados como `[A PREENCHER]`)
- **Cada US >= 3 criterios concretos**
- **Cada Feature com descricao substantiva** (>= 2 frases que justificam a feature)
- **Se PM nao respondeu uma pergunta → nao gerar, re-perguntar**
- **Contar `[A PREENCHER]`** — se mais de 5 no PRD final, alertar o PM antes de salvar

## Handoffs

- → `/prd-validate` (validar PRD criado)
- → `/prd-decompose` (decompor em specs)
