# Tutorial: Novo Projeto a Partir de um Legado

Guia passo a passo para usar o Praxis quando você precisa modernizar, refatorar ou reconstruir um sistema existente.

---

## Quando usar este fluxo

- Você tem um sistema existente que precisa ser modernizado
- Quer reconstruir com nova stack mas preservar a lógica de negócio
- Precisa entender o legado antes de tomar qualquer decisão arquitetural
- O sistema tem regras implícitas que ninguém documentou

---

## Pré-requisitos

- Claude Code instalado (CLI, VS Code ou desktop app)
- Template clonado e inicializado
- **Acesso ao código-fonte do sistema legado** (pode estar em outro diretório)

---

## Passo 1 — Setup do Template

```
/setup
```

Configure para a stack do **novo projeto** — não do legado. O setup pergunta qual será a stack alvo da modernização.

```
/clear
```

---

## Passo 2 — Engenharia Reversa do Legado (Fase 0)

```
/reverse-engineer {caminho-do-legado}
```

Esta é a fase mais importante para projetos legados. O problema clássico: ninguém sabe exatamente o que o sistema faz. As regras de negócio estão na cabeça das pessoas ou espalhadas no código. Mexer sem entender é arriscado.

O skill orquestra dois agents:

### @legacy-analyzer — Documenta a lógica de negócio

Faz engenharia reversa completa:
- **Lógica de negócio**: Regras, cálculos, validações
- **Fluxos**: Caminhos do usuário no sistema
- **Telas**: Descrição de cada tela e seus elementos
- **Regras implícitas**: Comportamentos que não estão documentados em lugar nenhum

O agent pode pedir que você descreva telas ou confirme comportamentos que ele não consegue inferir só pelo código.

### @codebase-mapper — Mapeia a estrutura (sem julgamento)

Documentação factual do código:
- Estrutura de pastas
- Frameworks e dependências
- Patterns identificados (descritos, **não julgados**)
- Métricas objetivas (linhas, complexidade, cobertura)

> O mapeamento é neutro de propósito. O julgamento — "isso é ruim", "isso precisa mudar" — vem na Fase 3 (Arquitetura), não aqui. Isso evita vieses prematuros.

**O output desta fase deve ser suficiente para reconstruir o sistema sem precisar consultar o código original novamente.**

```
/clear
```

---

## Passo 2b — Estratégia e UX (opcional, mas recomendado)

Antes do discovery, avalie se a reconstrução faz sentido de negócio:

```
/strategy
```

Útil para alinhar: o que vai mudar vs. preservar? Qual o ROI esperado da modernização? Quais módulos são Core vs. Generic? O kit detecta automaticamente quando o problema está vago e sugere esta sessão.

Para projetos com interface, avalie também a experiência atual — para não repetir os erros do legado:

```
/ux interface {descricao do sistema legado}
```

O `/ux` aponta problemas de UX do sistema atual com sinceridade e sugere como o novo sistema deve resolver esses problemas. Isso alimenta o discovery e as ADRs com decisões de UX já validadas.

```
/clear
```

---

## Passo 3 — Discovery do Novo Projeto (Fase 1)

```
/discovery
```

O discovery agora é sobre o **novo projeto** — mas usa a documentação da Fase 0 como input. O agent já conhece o sistema existente e faz perguntas focadas em:

| Foco | Exemplos de perguntas |
|------|----------------------|
| Escopo | Vai reconstruir tudo ou só parte? |
| Prioridades | Quais módulos são mais críticos? |
| Mudanças | O que vai mudar em relação ao legado? |
| Restrições | Precisa manter compatibilidade com algo? |
| Stack alvo | Qual a stack do novo sistema? |

**Resultado**: `docs/project/discovery.md` com contexto do legado + visão do novo projeto.

```
/clear
```

---

## Passo 3b — DDD Estratégico (opcional — domínios complexos)

Se o discovery ou a engenharia reversa revelou 4+ módulos interdependentes ou regras de negócio ricas:

```
/ddd-estrategico
```

Mapeia Bounded Contexts, classifica subdomínios (Core/Supporting/Generic) e propõe Context Map. Roda **antes do `/architect`** para que as ADRs sejam mais precisas. Legados costumam ter Bounded Contexts implícitos que só ficam evidentes quando mapeados.

```
/clear
```

---

## Passo 4 — Arquitetura do Novo Sistema (Fase 3)

```
/architect
```

O agent propõe ADRs para o **novo sistema**, considerando o que o legado fazia, as boas práticas de mercado e as restrições do discovery.

| Decisão | O que o agent propõe |
|---------|---------------------|
| Arquitetura | Clean Architecture como default |
| Estrutura frontend | Feature-first (não Atomic Design) |
| Testes | Estratégia de testes para o novo sistema |
| Migração de dados | Estratégia se necessário |

> Se o legado tinha decisões arquiteturais que funcionavam bem, mencione durante a interação. O agent pode manter o que faz sentido e modernizar o resto.

**Resultado**: ADRs em `docs/adr/` + `docs/project/constitution.md`

```
/clear
```

---

## Passo 5 — Definição por Módulo (Fase 2)

Para legados, recomenda-se definir e implementar **módulo por módulo** em vez de tudo de uma vez.

```
/define
```

### Detalhamento pré-SDD para módulos complexos do legado (opcional)

Legados frequentemente têm módulos com fronteiras implícitas, decisões esquecidas e vocabulário ambíguo — situações ideais para o `/detail`. Se o módulo atender **>= 2 sinais** (>= 3 fronteiras, PRD desatualizado, partes funcionais independentes, decisões abertas, implementação em várias iterações, vocabulário colidindo):

```
/detail meu-modulo                      # Scaffolda workspace canônico
# ... iterações de preenchimento ...
/detail meu-modulo --action freeze      # Congela antes do decompose
```

O workspace rastreia decisões (`D-<COD>-##`) e dúvidas (`Q-<COD>-##`) com IDs estáveis — útil quando o time do legado lembra de regras em reuniões esparsas. Método canônico em `docs/adr/0006-workspace-detalhamento-modulo.md`.

### Revisão antes de implementar

Antes de implementar cada spec:

```
/ux spec {modulo}
/spec-review docs/specs/NNN-modulo/spec.md
```

O `/ux` garante que os estados de interface estão mapeados e o fluxo faz sentido para o usuário. O `/spec-review` garante que a spec tem critérios de aceite concretos e está alinhada com as ADRs.

### Estratégia recomendada

1. **Identifique o módulo mais crítico** (o que dá mais problema ou tem mais valor)
2. **Crie o PRD desse módulo** usando o conhecimento do legado
3. **Gere specs** para as features desse módulo
4. **Implemente e valide** antes de passar para o próximo módulo

**Sub-skills úteis**:

```bash
/prd-create pedidos tactical           # PRD tático do módulo
/prd-decompose pedidos                 # Decompõe em specs
/spec-from-prd prd-pedidos.md FEATURE:1.1   # Spec de feature específica
/prd-coverage pedidos                  # Acompanha cobertura
```

```
/clear
```

---

## Passo 6 — Implementação Modular (Fase 5)

**Opção A — Orquestrador completo**:

```
/implement docs/specs/001-pedidos/
```

Executa Plan → Tasks → Execute com validação entre cada etapa.

**Opção B — Sub-skills granulares** (para mais controle):

```bash
/plan docs/specs/001-pedidos/     # Planejamento técnico
# Revise o plan
/clear
/tasks docs/specs/001-pedidos/    # Quebra em tasks
# Revise as tasks
/clear
/execute docs/specs/001-pedidos/  # Executa
```

**Scaffolding para backend** (se estiver construindo backend OO):

```bash
/backend-scaffold aggregate Order --properties "Number:string, Total:decimal"
```

```
/clear
```

---

## Passo 7 — Validação por Módulo (Fase 6)

Valide cada módulo após implementar:

```bash
/validate pedidos              # Valida o módulo específico
/validate alteracoes           # Só arquivos modificados — mais rápido
```

**Validação sequencial por stack** (para mais controle):

```bash
/frontend-validate    # 10 agents frontend, um por vez
/backend-validate     # 6 agents backend, um por vez
```

```
/clear
```

---

## Passo 8 — Revalidação e Próximo Módulo (Fase 7)

```
/revalidate
```

Corrija, revalide, repita até tudo OK. Depois passe para o próximo módulo:

```
/clear
/define                                  # PRD do próximo módulo
/clear
/plan docs/specs/002-estoque/
/clear
/tasks docs/specs/002-estoque/
/clear
/execute docs/specs/002-estoque/
/clear
/validate estoque
/revalidate
```

---

## Fluxo Resumido para Legados

```
/setup                          → Stack do NOVO projeto
/clear
/reverse-engineer {legado}      → Documenta o legado (Fase 0)
/clear
/strategy                       → (opcional) Valida decisão de modernizar
/ux interface {legado}          → (opcional) Mapeia problemas de UX do sistema atual
/clear
/discovery                      → Discovery do NOVO projeto (usa docs do legado)
/clear
/ddd-estrategico                → (opcional) Bounded Contexts — domínios complexos
/clear
/architect                      → ADRs para o NOVO sistema
/clear

# Para cada módulo (do mais crítico ao menos):
/define                         → PRD do módulo
/detail {modulo}                → (opcional) Workspace pré-SDD — módulos complexos
/ux spec {modulo}               → (recomendado) Revisão de UX da spec
/spec-review docs/specs/NNN/spec.md  → Valida spec antes de implementar
/clear
/plan docs/specs/NNN-modulo/    → Plano técnico
/clear
/tasks docs/specs/NNN-modulo/   → Tasks
/clear
/execute docs/specs/NNN-modulo/ → Implementar
/clear
/validate modulo                → Validar
/revalidate                     → Corrigir
/clear
# Próximo módulo...
```

---

## Dicas para Projetos Legados

1. **Não pule a Fase 0** — o `/reverse-engineer` documenta regras que ninguém lembra. Sem isso, você vai redescobrir bugs e edge cases durante a implementação.
2. **A documentação da Fase 0 deve ser suficiente** para reconstruir o sistema sem consultar o código legado novamente.
3. **Valide a decisão de modernizar com `/strategy`** — antes de começar, confirme que o investimento faz sentido de negócio.
4. **Implemente módulo por módulo** — não tente reconstruir tudo de uma vez.
5. **Comece pelo módulo mais crítico** — o que dá mais problema ou tem mais valor para o negócio.
6. **O julgamento vem na Fase 3, não na Fase 0** — a engenharia reversa documenta o que existe, sem classificar como bom ou ruim.
7. **Preserve regras de negócio que funcionam** — modernizar não significa jogar tudo fora.
8. **Use `/spec-review` antes de cada módulo** — specs mal definidas em projetos legados custam caro, pois há menos contexto para corrigi-las no meio da implementação.
9. **Use `/ddd-estrategico` se o domínio for complexo** — legados costumam ter Bounded Contexts implícitos que só ficam evidentes quando mapeados.
10. **Use `/prd-coverage`** para garantir que todas as funcionalidades do legado foram cobertas pelas specs do novo projeto.
11. **Use `/ux interface` no legado** — entender os problemas de UX do sistema atual orienta quais melhorias são prioritárias no novo. Não repita os erros do legado sem querer.
