---
name: strategy
description: "Estrategia de Negocio — Avalia ideias, prioriza features, discute modelos de negocio e questiona premissas antes de entrar no pipeline tecnico."
user-invocable: true
depends:
  - .claude/agents/discovery/strategy.md
---

# /strategy

Ativa o agente Estrategista de Negocio para pensar junto com o usuario sobre o que vale a pena construir e como fazer o produto crescer.

## O que faz

O `/strategy` nao gera codigo nem documentacao tecnica. Ele conduz **sessoes de pensamento estrategico**:

- Avalia ideias e valida se fazem sentido de negocio
- Questiona premissas antes que virem features
- Prioriza o que construir primeiro (e o que cortar)
- Discute modelos de negocio, monetizacao e crescimento
- Simula cenarios de sucesso e fracasso
- Identifica riscos de produto (nao tecnicos)

## Quando usar

**Proativamente** (o proprio kit sugere):
- Quando o problema descrito no `/discovery` esta vago
- Quando um PRD tem muitos campos sem definicao
- Quando uma feature chega ao `/implement` sem criterio de sucesso
- Quando uma decisao de arquitetura impacta o modelo de negocio
- Quando ha mudanca grande de escopo em relacao ao discovery

**A qualquer momento** (usuario chama direto):
- Antes do `/discovery` — para validar se a ideia tem tracao
- Durante o `/define` — para questionar o escopo de um PRD
- Quando surgir uma nova ideia de feature
- Quando quiser um segundo olhar estrategico antes de decidir

## Modos de uso

```
/strategy                          → Sessao livre (agente pergunta o contexto)
/strategy ideia                    → Avaliacao de ideia nova
/strategy features                 → Priorizacao de lista de features
/strategy prd {modulo}             → Revisao estrategica de PRD existente
/strategy modelo                   → Discussao de modelo de negocio
/strategy cenario {decisao}        → Simulacao de cenarios antes de decidir
```

## Pipeline

```
Qualquer fase → /strategy → decisoes mais solidas → continua pipeline
```

O `/strategy` nao substitui nenhuma fase — ele alimenta todas elas com melhores decisoes.

## Execucao

1. Verificar se ha contexto existente:
   - `docs/project/discovery.md` → carregar silenciosamente
   - `docs/prds/` → listar PRDs existentes
   - `docs/project/manifest.md` → fase atual

2. Identificar o modo de operacao pelo argumento ou perguntar:
   > "Sobre o que voce quer pensar hoje? Tenho alguns modos:
   > - **Avaliar uma ideia** — voce descreve, a gente analisa juntos
   > - **Priorizar features** — o que fazer primeiro no produto
   > - **Revisar um PRD** — checar se o escopo faz sentido estrategico
   > - **Modelo de negocio** — como o produto vai crescer e gerar valor
   > - **Simular cenarios** — testar uma decisao antes de tomar"

3. Conduzir o modo **nesta sessao**, usando `.claude/agents/discovery/strategy.md` como roteiro — e conversa em rodadas, e subagente nao conversa (`.claude/praxis/rules.md`)

4. Ao final da sessao, perguntar se quer salvar resumo em `docs/project/`

## Gestao de Contexto

O `/strategy` e uma sessao conversacional — nao requer `/clear` antes ou depois. Os artefatos gerados (resumos de sessao) sao salvos em `docs/project/strategy-{topico}.md`.

## Atualizacao do Manifesto

Se a sessao gerar decisoes relevantes (mudanca de escopo, nova prioridade, risco identificado), atualizar `docs/project/manifest.md` na secao de Regras Aprendidas.

## Handoffs

- → `/discovery` (se a sessao revelar que o projeto precisa de mais entendimento)
- → `/define` (se as decisoes tomadas precisam virar PRD)
- → `/architect` (se a sessao gerou decisoes arquiteturais)
- → `/implement` (quando as decisoes estao claras e vale codar)
