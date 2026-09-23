---
name: discovery
description: "Fase 1: Discovery — Entendimento completo do projeto antes de qualquer decisao"
user-invocable: true
depends:
  - .claude/agents/discovery/discovery.md
---

# /discovery

Inicia ou retoma o processo de Discovery do projeto.

## O que faz

1. Ativa o agent `@discovery` que faz perguntas estruturadas sobre o projeto
2. Para legados: le codigo existente e mapeia estrutura
3. Para novos: entende problema de negocio, stakeholders, restricoes
4. **NAO avanca sem entendimento completo** — se detectar gaps, faz mais perguntas

## Quando usar

- No inicio de qualquer projeto novo
- Ao assumir um projeto legado para refatoracao
- Quando novos stakeholders ou requisitos surgem

## Workflow

```
/discovery → perguntas → respostas → mais perguntas → discovery.md completo
                                                            ↓
                                                    Proximo: /define ou /architect
```

## Execucao

1. Verificar se `docs/project/discovery.md` ja existe com conteudo
   - Se sim: retomar de onde parou, mostrar o que ja sabemos
   - Se nao: iniciar do zero

2. Delegar ao agent `@discovery` que segue 6 etapas:
   - Natureza do projeto
   - Negocio
   - Stack tecnica
   - Time e processo
   - Restricoes
   - Modulos e dominios

3. Ao final, salvar `docs/project/discovery.md` completo

4. Sugerir proximos passos:
   - Se dominio complexo: `/architect` para DDD estrategico + ADRs
   - Se dominio simples: `/define` para criar PRDs diretamente

## Gestao de Contexto

Ao concluir o discovery, **recomende ao usuario executar `/clear`** antes de avancar para a proxima fase. O output esta salvo em `docs/project/discovery.md` e sera lido pela proxima skill. Limpar o contexto garante qualidade maxima na proxima fase.

## Atualizacao do Manifesto

Ao concluir, atualizar `docs/project/manifest.md`:
- Estado do Pipeline: Discovery → `completo`
- Stack do Projeto: preencher com stack detectada
- Artefatos: marcar discovery.md como existente

## Enriquecimento do CLAUDE.md (max 2 linhas)

Adicionar ao CLAUDE.md apenas ponteiros curtos:
```markdown
## Projeto
**Stack**: {frontend} + {backend} + {db} | **Modulos**: {lista} | Detalhes: `docs/project/manifest.md`
```
Todos os detalhes (tabela de stack completa, modulos, restricoes) vao para o manifesto.

## Hook Proativo — /ddd-estrategico

Ao sugerir proximos passos, avaliar sinais de dominio complexo:

**Sinal `DOMINIO_COMPLEXO`**: Qualquer combinacao dos itens abaixo:
- 4 ou mais modulos identificados na Etapa 6
- Modulos com regras de negocio independentes e ricas (nao so CRUD)
- Mencao a multiplos times ou squads trabalhando em paralelo
- Possibilidade de microservicos no futuro
- Termos do negocio que significam coisas diferentes em areas diferentes

→ Sugerir antes de `/architect`: "Seu dominio tem varios modulos interdependentes. Recomendo `/ddd-estrategico` antes de definir a arquitetura — vai deixar as ADRs muito mais precisas."

**Sinal `DOMINIO_SIMPLES`**: Projeto com 1-3 modulos, regras simples, time pequeno
→ Pular sugestao. Ir direto para `/architect`.

**Regra**: Sugestao nao bloqueante. Se usuario recusar, seguir para `/architect` normalmente.

## Hook Proativo — /strategy

Ao final do discovery, antes de sugerir proximo passo, avaliar os seguintes sinais:

**Sinal `PROBLEMA_VAGO`**: A secao "Problema de Negocio" esta com respostas genericas (ex: "resolver ineficiencias", "facilitar processos", "ajudar pessoas com X")
→ Sugerir: "O problema de negocio ainda esta um pouco aberto. Quer uma sessao de `/strategy` para aprofundar antes de definir a arquitetura?"

**Sinal `PERSONA_GENERICA`**: Usuarios definidos como "qualquer pessoa", "todo mundo", "empresas em geral"
→ Sugerir: "A persona ainda esta muito ampla. `/strategy` pode ajudar a segmentar quem realmente vai usar e pagar."

**Sinal `MODELO_AUSENTE`**: Nenhuma mencao a como o produto gera valor economico (receita, retencao, aquisicao)
→ Sugerir: "Nao ficou claro o modelo de negocio. Quer discutir isso com `/strategy` antes de comecar a arquitetura?"

**Regra**: Sugerir no maximo UMA vez, de forma nao bloqueante. Se o usuario ignorar, prosseguir normalmente.

## Handoffs

- → `/clear` (limpar contexto apos gerar output)
- → `/strategy` (quando sinais de risco de negocio detectados)
- → `/ddd-estrategico` (quando dominio complexo detectado — antes do /architect)
- → `/architect` (quando discovery completo)
- → `/define` (quando discovery completo e dominio simples, sem necessidade de ADRs)
