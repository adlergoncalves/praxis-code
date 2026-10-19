---
name: ux
description: "Especialista em Experiencia do Usuario — avalia fluxos, decide componentes, questiona specs pela otica do usuario e aponta problemas de interface com sinceridade. Consultivo, proativo e orientado ao usuario real."
user-invocable: true
depends:
  - .claude/agents/frontend/ux.md
  - .claude/reference/frontend/third-party/interface-design/interface-design.md
  - .claude/reference/frontend/third-party/frontend-design/frontend-design.md
  - docs/templates/design-memory-template.md
  - .claude/reference/frontend/cognitive-load.md
  - .claude/reference/frontend/personas.md
  - .claude/reference/frontend/motion-design.md
  - .claude/reference/frontend/patterns.md
  - .claude/reference/frontend/heuristics.md
  - .claude/reference/frontend/anti-patterns.md
  - .claude/reference/frontend/register-product.md
  - .claude/reference/frontend/register-brand.md
  - .claude/reference/frontend/design-system-anatomy.md
---

# /ux

Ativa o agente Especialista em Experiencia do Usuario para pensar junto com o dev sobre o que vai ser construido e como o usuario vai interagir com o sistema.

## O que faz

O `/ux` nao gera codigo. Ele conduz **sessoes de UX** em dois eixos:

**Consultivo (reativo)** — responde ao que voce traz:
- Avalia fluxos e jornadas antes de implementar
- Decide qual componente usar para cada caso (stepper vs. form, modal vs. drawer, etc.)
- Questiona specs e PRDs pela otica do usuario — o que falta? O que esta confuso?
- Aponta problemas de interface com sinceridade: se nao esta bom, diz o motivo
- Sugere os melhores patterns modernos para cada tipo de interface
- Garante que todos os estados da interface estao mapeados (loading, erro, vazio, sucesso)
- Pensa em mobile, acessibilidade e hierarquia visual desde o inicio

**Generativo (proativo)** — propoe direcao criativa do zero:
- **Direcao Criativa** — explora o dominio do produto (conceitos, mundo de cor, assinatura, defaults rejeitados) e propoe 2-3 direcoes **renderizadas** quando a sessao permite (Artifact, ferramenta de prototipo ou HTML local) para o usuario escolher; a escolhida vai para a memoria de design
- **Motion** — define a linguagem de movimento do projeto (duracoes, easings, microinteracoes padrao), salva como referencia para toda a implementacao
- **Personalidade** — define os atributos de personalidade do produto (preciso/elastico/luxuoso/etc.) e como cada um se materializa em tokens, copy, motion, hierarquia

## Quando usar

**Proativamente** (o proprio kit sugere):
- Quando uma spec descreve uma tela mas nao mapeia os estados de erro/vazio/loading
- Quando um formulario tem muitos campos sem decisao de layout
- Quando um fluxo de multiplas etapas nao tem decisao de navegacao
- Quando ha uma acao destrutiva sem pattern de confirmacao definido

**A qualquer momento** (usuario chama direto):
- Antes de comecar a implementar uma tela — para definir o fluxo certo
- Quando precisar decidir entre dois componentes ou patterns
- Quando quiser feedback honesto sobre uma interface descrita ou existente
- Quando quiser saber qual e o pattern mais moderno para um tipo de tela

## Modos de uso

**Consultivo (reativo)**:
```
/ux                              → Sessao livre (agente pergunta o contexto)
/ux fluxo {descricao}            → Avaliacao de fluxo ou jornada
/ux componente {caso}            → Decisao de componente para o caso
/ux spec {modulo}                → Revisao de spec pela otica do usuario
/ux interface {descricao}        → Avaliacao de interface existente
/ux patterns {tipo}              → Consulta sobre melhores patterns modernos
```

**Generativo (proativo)**:
```
/ux direcao {tela ou modulo}     → Explora o dominio e propoe 2-3 direcoes (renderizadas quando der)
/ux shape {feature}              → Brief da feature (docs/project/ux-shape-{slug}.md), exigido pelo gate de UI do /execute
/ux charter                      → Entrevista de identidade do produto (UX Charter) — opcional
/ux motion                       → Define a linguagem de motion do projeto
```

## Pipeline

```
inicio do projeto     → /ux charter          → docs/project/ux-charter.md (opcional; a Constitution recebe so um ponteiro via /architect)
                      → /ux motion           → motion.md criado
/architect            → consulta UX Charter para refinar Page Shell
/ds-init              → consulta personality charter para extrair tokens com intencao
/spec-from-prd        → referencia motion.md e UX Charter em cada spec
/implement            → segue motion grammar e personality nas microinteracoes
/define     → /ux spec       → specs com UX validado antes de implementar
/implement  → /ux fluxo      → decisoes de UX durante a implementacao
qualquer    → /ux direcao    → propor direcao quando ha tela sem mockup nem spec visual
qualquer    → /ux componente → decisao pontual de componente ou pattern
qualquer    → /ux interface  → feedback honesto sobre tela existente
```

O `/ux` nao substitui nenhuma fase — ele alimenta todas com melhores decisoes de interface.

## Execucao

1. Verificar se ha contexto existente:
   - `docs/project/discovery.md` → carregar silenciosamente (publico-alvo)
   - `docs/project/manifest.md` → fase atual, stack, Design System em uso
   - `docs/project/learnings/frontend-learnings.md` → patterns ja decididos
   - `docs/prds/` → PRDs existentes (listar titulos)

2. Identificar o modo de operacao pelo argumento ou perguntar:
   > "Sobre o que voce quer pensar hoje? Posso te ajudar com:
   >
   > **Consultivo**:
   > - **Fluxo ou jornada** — avaliar o passo a passo que o usuario vai percorrer
   > - **Decisao de componente** — qual o melhor elemento para o seu caso (stepper, form, modal, etc.)
   > - **Revisao de spec** — checar se o que vai ser construido faz sentido para o usuario
   > - **Feedback de interface** — opiniao honesta sobre uma tela descrita ou existente
   > - **Patterns modernos** — quais as melhores abordagens para um tipo de tela
   >
   > **Generativo** (proponho direcao do zero):
   > - **Direcao criativa** — proponho como uma tela ou modulo deveria ser visual e interativamente
   > - **Motion** — definimos a linguagem de movimento do projeto (duracoes, easings, microinteracoes)
   > - **Personalidade** — definimos a personalidade do produto (preciso, elastico, luxuoso, ludico...) e como isso vira tokens, copy e motion"

3. **Conduzir o modo NESTA sessao**, usando `.claude/agents/frontend/ux.md` como roteiro (modos, fluxos, formatos de output). Os modos de `/ux` sao conversas — entrevista em rodadas, escolha entre direcoes renderizadas, aprovacao de brief — e subagente nao conversa: delegado, o modo vira inferencia a partir de uma frase. Publicar paginas (Artifacts) e usar a ferramenta de prototipo tambem so funcionam aqui.
   - O agent `@ux` continua disponivel para **parecer pontual** despachado por outra skill (sinais de risco: `SPEC_SEM_ESTADOS`, `DECISAO_DE_COMPONENTE`...), em que nao ha conversa.

4. Ao final: gravar o artefato do modo (charter, brief, direcao, motion) e, nos modos generativos, a **memoria de design** (`docs/design-system/system.md`). Resumo dos modos consultivos em `docs/project/` so se o usuario quiser.

## Gestao de Contexto

O `/ux` e uma sessao conversacional — nao requer `/clear` antes ou depois.

## Artefatos gerados

**Modos consultivos** (fluxo, componente, spec, interface, patterns):
- Resumos de sessao salvos em `docs/project/ux-{topico}.md` (opcional, pergunta antes)

**Modos generativos** (artefatos permanentes do projeto):

| Modo | Artefato gerado | Localizacao |
|---|---|---|
| `/ux direcao` | Brief criativo da tela/modulo | `docs/project/ux-direcao-{nome}.md` |
| `/ux motion` | Motion grammar do projeto | `docs/project/motion.md` (um por projeto) |
| `/ux charter` | UX Charter | `docs/project/ux-charter.md` (apenas — Constitution recebe pointer+resumo via `/architect`) |

Esses artefatos sao **consumidos por outras skills**:
- `/architect` → le UX Charter ao criar Page Shell
- `/ds-init` → le personality charter para extrair tokens com intencao
- `/ds-component` → consulta catalogo de patterns para escolher variantes
- `/spec-from-prd` → referencia motion.md em cada spec
- `@check-design` → valida uso de motion contra motion.md

## Atualizacao do Manifesto

Se a sessao gerar decisoes relevantes (pattern definido, componente escolhido, fluxo validado, **personalidade definida, motion grammar criada**), atualizar `docs/project/manifest.md` na secao de Regras Aprendidas e registrar em `docs/project/learnings/frontend-learnings.md`.

## Handoffs

- → `/spec-from-prd` (se a sessao revelar que a spec precisa ser reescrita com estados mapeados)
- → `/ds-component` (se a sessao indicar que falta um componente no Design System)
- → `/prototype` (se a sessao revelar que o fluxo precisa ser prototipado antes de implementar)
- → `/implement` (quando as decisoes de UX estao claras e vale codar)
- → `/strategy` (se uma decisao de UX tiver impacto estrategico no produto)
- → `/architect` (apos `/ux charter`, para registrar UX Charter na Constitution)
- → `/ds-init` (apos `/ux charter`, se o projeto ainda nao tem DS — tokens serao extraidos com a personalidade como guia)
