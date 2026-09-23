---
name: ddd-estrategico
description: "Fase 3 (opcional): Modelagem estrategica de dominio — Bounded Contexts, Context Map, classificacao Core/Supporting/Generic. Para dominios complexos com multiplos modulos interdependentes."
user-invocable: true
depends:
  - .claude/agents/architecture/ddd-estrategico.md
---

# /ddd-estrategico

Ativa o agente especialista em DDD Estrategico para modelar o dominio antes de definir a arquitetura.

## Quando usar

Este modulo e **opcional** e recomendado apenas quando o projeto tem sinais de dominio complexo:

- Multiplos modulos com regras de negocio ricas e independentes
- Mais de um time trabalhando em partes diferentes do sistema
- Risco de acoplamento semantico entre areas do negocio
- Projeto que pode evoluir para microservicos no futuro
- Linguagem diferente usada por areas diferentes do negocio (ex: "cliente" significa coisas diferentes para vendas e suporte)

Para projetos simples (CRUD, MVPs, ferramentas internas), pular direto para `/architect`.

## O que faz

1. Le `docs/project/discovery.md` e PRDs existentes para entender o negocio
2. Identifica subdominios e os classifica (Core / Supporting / Generic)
3. Define Bounded Contexts com fronteiras semanticas justificadas
4. Propoe Context Map com padroes de integracao
5. Salva modelagem em `docs/project/ddd-estrategico.md`
6. Alimenta o `/architect` com contexto para criar ADRs mais precisas

## Posicao no pipeline

```
/discovery → /ddd-estrategico → /architect → /define → /implement
```

O DDD estrategico entra **antes** do `/architect` — as ADRs serao mais precisas quando as fronteiras de dominio estao claras.

## Execucao

1. Verificar se `docs/project/discovery.md` existe
   - Se nao: pedir para rodar `/discovery` primeiro
2. Delegar ao agent `@ddd-estrategico`
3. O agent conduz 7 camadas: negocio → subdominios → classificacao → linguagem ubiqua → fronteiras → bounded contexts → context map
4. Ao final, salvar `docs/project/ddd-estrategico.md` e `docs/project/context-map.md`
5. Atualizar glossario em `docs/project/glossary.md` com termos identificados

## Gestao de Contexto

Ao concluir, **recomende `/clear`** antes de `/architect`. Os artefatos estao salvos e serao lidos na proxima fase.

## Atualizacao do Manifesto

Ao concluir, atualizar `docs/project/manifest.md`:
- Estado do Pipeline: DDD Estrategico → `completo`
- Artefatos: registrar `ddd-estrategico.md` e `context-map.md`

## Atualizacao de Learnings

Registrar em `docs/project/learnings/business-learnings.md`:
- Bounded contexts identificados
- Classificacao estrategica dos subdominios
- Decisoes de fronteira que nao eram obvias

## Handoffs

- → `/clear` (limpar contexto apos modelagem)
- → `/architect` (com contexto de bounded contexts definidos)
