# Tutorial: Correções e Novas Features em Projeto Existente

Guia para usar o Praxis em projetos que já passaram pelo pipeline — corrigir bugs, adicionar features e manter a qualidade ao longo do tempo.

---

## Quando usar este fluxo

- O projeto já tem discovery, ADRs, specs e implementação
- Você precisa corrigir um bug
- Você precisa adicionar uma feature nova
- Você quer validar o estado atual do código

---

## Cenário 1 — Bug Rápido (Trivial)

Para bugs simples, typos, ajustes de CSS — sem cerimônia:

```
/quickfix
```

Descreva o problema. O agent entende, localiza o código, corrige e faz uma validação mínima.

**Quando usar**: O problema é óbvio, a correção é localizada, não precisa de investigação.

---

## Cenário 2 — Bug Complexo (Investigação)

Para bugs que precisam de investigação estruturada:

```
/debug
```

O agent segue um fluxo disciplinado:

1. **Entender** — O que deveria acontecer vs. o que acontece?
2. **Pesquisar** — Localizar o código envolvido, logs, traces
3. **Identificar causa raiz** — Não só o sintoma, mas a causa real
4. **Propor fix** — Apresenta a solução antes de aplicar
5. **Aplicar fix** — Implementa a correção

**Após o fix**:

```
/clear
/review
```

O `/review` analisa o `git diff` contra as ADRs e princípios SOLID — um self-review leve antes de commitar.

---

## Cenário 3 — Nova Feature (Completa)

Para features que precisam de planejamento.

### Passo 0 — Validar o valor e a experiência (opcional, mas recomendado)

Se a feature ainda está sendo definida ou você tem dúvidas sobre o que priorizar:

```
/strategy
```

O `/strategy` questiona premissas antes que virem código: a feature resolve um problema real? Vale construir agora ou existe algo mais impactante? O kit detecta automaticamente quando uma feature não tem critério de sucesso e sugere esta sessão.

Para features com interface:

```
/ux fluxo {descricao da feature}
```

O `/ux` mapeia o fluxo do usuário, aponta problemas antes de virar spec e decide quais componentes usar. Evita descobrir problemas de UX no meio da implementação.

### Passo 1 — Criar a spec da feature

```
/prd-create meu-modulo tactical
```

Ou se for uma feature dentro de um PRD existente:

```
/spec-from-prd docs/prds/prd-meu-modulo.md FEATURE:2.1
```

**Resultado**: o `/prd-create` gera o PRD em `docs/prds/`; a spec vem do `/spec-from-prd` (o segundo comando acima), em `docs/specs/NNN-feature/spec.md`.

```
/clear
```

### Passo 1a — Detalhamento pré-SDD (opcional — features grandes ou ambíguas)

Se a "feature" é na verdade um **módulo grande** com múltiplas partes, fronteiras implícitas e decisões abertas, não force uma spec única. Use o workspace antes de decompor (critério: >= 2 sinais — >= 3 fronteiras, PRD desatualizado, partes independentes, decisões abertas, vocabulário novo ou colidindo):

```
/detail meu-modulo
# ... iterações de preenchimento ...
/detail meu-modulo --action freeze
/prd-decompose meu-modulo              # Usa o workspace como fonte
```

Método canônico em `docs/adr/0006-workspace-detalhamento-modulo.md`.

```
/clear
```

### Passo 1b — Revisão de UX da spec (recomendado para features com interface)

```
/ux spec {modulo}
```

Verifica se a spec mapeia todos os estados (loading, erro, vazio, sucesso), se o usuário tem as informações necessárias e se o fluxo é lógico.

### Passo 1c — Validar a spec antes de implementar (recomendado)

```
/spec-review docs/specs/005-nova-feature/spec.md
```

Verifica critérios de aceite, edge cases e alinhamento com as ADRs. Resultado: `APROVADA`, `APROVADA COM RESSALVAS` ou `BLOQUEADA`. O `/implement` também sugere isso automaticamente.

### Passo 2 — Planejar

```
/plan docs/specs/005-nova-feature/
```

O plan leva em conta as ADRs existentes e o código já implementado.

**Revise o plan antes de prosseguir.**

```
/clear
```

### Passo 3 — Quebrar em tasks

```
/tasks docs/specs/005-nova-feature/
```

**Revise as tasks antes de prosseguir.**

```
/clear
```

### Passo 4 — Executar

```
/execute docs/specs/005-nova-feature/
```

```
/clear
```

### Passo 5 — Validar só o que mudou

```
/validate alteracoes
```

O escopo `alteracoes` valida apenas os arquivos modificados (`git diff`) — muito mais rápido que validar o projeto inteiro.

### Passo 6 — Corrigir e revalidar

```
/revalidate
```

---

## Cenário 4 — Nova Feature (Rápida)

Para features pequenas que não precisam de PRD completo:

**Crie a spec mínima diretamente**:

1. Crie a pasta `docs/specs/005-minha-feature/`
2. Crie o `spec.md` seguindo o template em `docs/templates/spec-template.md`
3. Preencha os blocos marcados OBRIGATORIO no template: Escopo, Personas e Permissões, Regras de Negócio, Decisões Fechadas, User Scenarios & Testing, Requirements e Edge Cases

Depois:

```
/spec-review docs/specs/005-minha-feature/spec.md   # (recomendado)
/implement docs/specs/005-minha-feature/
/clear
/validate alteracoes
```

O `/implement` orquestra Plan → Tasks → Execute com validação entre cada etapa.

---

## Cenário 5 — Self-Review Antes de Commit

Após qualquer alteração no código:

```
/review
```

Analisa o `git diff` e verifica conformidade com as ADRs, princípios SOLID e patterns da stack. É mais leve e rápido que `/validate` — ideal para o dia a dia antes de cada commit.

---

## Cenário 6 — Validação Completa do Projeto

Para checar o estado geral de conformidade:

```bash
/validate geral              # Perfil standard (default)
/validate geral --profile full         # Todos os agents — antes de release
/validate geral --profile minimal      # Só ADR validator — check rápido
```

**Validação por stack** (paralela por padrão; `--mode sequential` para corrigir entre agents):

```bash
/frontend-validate    # 11 agents frontend
/backend-validate     # 6 agents backend
```

---

## Cenário 7 — Adicionar Nova ADR

Se uma decisão arquitetural nova surgiu (novo provider de autenticação, nova estratégia de cache):

```
/architect
```

O agent lê as ADRs existentes e o discovery, e cria a nova ADR de forma consistente com as decisões anteriores. A nova ADR será automaticamente validada pelo `/validate` nas próximas execuções.

---

## Cenário 8 — Detectar Ambiguidades em Spec Existente

Antes de implementar, verifique se há ambiguidades:

```
/clarify docs/specs/005-feature/spec.md
```

O agent detecta ambiguidades em 9 categorias e faz até 5 perguntas priorizadas por **Impacto × Incerteza**. As respostas são integradas na spec.

---

## Cenário 9 — Verificar Consistência dos Artefatos

Se spec, plan e tasks parecem desalinhados:

```
/analyze 005-feature
```

O agent faz 6 passes de detecção:
1. Duplicação — Requisitos ou tasks repetidos
2. Ambiguidade — Adjetivos vagos
3. Sub-especificação — Objetos referenciados mas não definidos
4. Constitution — Violações dos princípios
5. Coverage gaps — Requisitos sem tasks
6. Inconsistência — Termos usados de forma diferente

---

## Cenário 10 — Gerar Checklist de Qualidade

Antes de mergear uma feature:

```bash
/checklist 005-feature security    # Checklist de segurança
/checklist 005-feature ux          # Checklist de UX
```

Gera checklists com 9 dimensões de qualidade — "testes unitários para texto".

---

## Fluxo por Tipo de Trabalho

### Bug trivial
```
/quickfix
```

### Bug complexo
```
/debug
/clear
/review
```

### Feature completa
```
/strategy                          (opcional — validar valor da feature)
/ux fluxo {descricao}              (recomendado — mapear fluxo e componentes)
/prd-create modulo tactical        (ou /spec-from-prd)
/detail modulo                     (opcional — módulos grandes, >= 2 sinais)
/clear
/ux spec {modulo}                  (recomendado — revisar spec pela ótica do usuário)
/spec-review docs/specs/NNN/spec.md
/plan docs/specs/NNN/
/clear
/tasks docs/specs/NNN/
/clear
/execute docs/specs/NNN/
/clear
/validate alteracoes
/revalidate
```

### Feature rápida
```
# Crie spec mínima manualmente
/spec-review docs/specs/NNN/spec.md
/implement docs/specs/NNN/
/clear
/validate alteracoes
```

### Antes de commit
```
/review
```

### Antes de release
```
/validate geral --profile full
/revalidate
```

---

## Dicas para Manutenção de Projetos

1. **Sempre use `/review` antes de commitar** — é rápido e pega problemas cedo.
2. **Use `alteracoes` como escopo do `/validate`** — muito mais rápido que validar o projeto inteiro.
3. **Novas ADRs são automaticamente validadas** — ao criar uma ADR via `/architect`, o `/validate` já passa a checar as novas regras.
4. **O `/execute` atualiza a spec** — se encontrar divergências durante a implementação, adiciona "Implementation Notes" na spec.
5. **Dívida técnica pode ser aceita** — marque `[ACCEPTED]` no relatório de validação para itens que serão tratados depois.
6. **Use `/clear` entre fases** — mesmo para features, limpar o contexto entre plan/tasks/execute melhora a qualidade.
7. **Use `/spec-review` antes de implementar** — evita descobrir gaps de especificação no meio da implementação.
8. **Use `/strategy` antes de definir** — features sem critério de sucesso claro costumam ser retrabalho depois.
9. **Use `/prd-coverage`** para acompanhar quantas features do PRD já têm specs implementadas.
10. **Use `/ux` antes de implementar qualquer tela** — estados de loading, erro e vazio esquecidos na spec geram retrabalho.
11. **Use `/ux interface {descricao}`** para feedback honesto sobre telas já implementadas — o agente aponta problemas críticos sem suavizar.
