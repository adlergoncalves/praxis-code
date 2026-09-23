# {NN} — Parte {N}: {PARTE_NOME} — {MODULO}

> Estado: ⏳ Stub

## 1. Proposito

<!-- Qual problema esta parte resolve? Qual a jornada principal? Em 1-2 paragrafos. -->

## 2. Localizacao & Navegacao

<!-- Onde vive no app? Como o usuario chega aqui? Breadcrumb, rota, ponto de entrada. -->

- **Rota/Caminho**: {ex: /admin/configuracoes/categorias}
- **Entrada pelo usuario**: {como o usuario chega}
- **Saida natural**: {para onde vai ao concluir}

## 3. Atores & Permissoes

| Role | Pode ver | Pode criar | Pode editar | Pode excluir | Pode exportar |
|------|----------|------------|-------------|--------------|---------------|
| {role 1} | ✅ | ✅ | ✅ | ❌ | ✅ |
| {role 2} | ✅ | ❌ | ❌ | ❌ | ❌ |

## 4. Entidades & Conceitos

| Entidade | Definicao | Campos-chave | Relacoes |
|----------|-----------|--------------|----------|
| {entidade} | {1 frase} | {campos} | {com quem se relaciona} |

Referenciar termos no glossario (`40-glossario.md`) quando vocabulario novo.

## 5. Funcionalidades

<!-- Detalhe funcional por tela/acao/fluxo. Use subsecoes por tela. -->

### 5.1 — {Tela/Acao}
- **Objetivo**: {o que faz}
- **Entrada**: {inputs}
- **Saida**: {o que retorna/muda}
- **Comportamento**: {passo a passo}

### 5.2 — {Outra tela}
...

## 6. Regras de Negocio & Validacoes

<!-- O que e bloqueado/permitido/auditado? IDs D-{COD}-## registrados em 60-regras-negocio.md -->

| ID | Regra | Tipo | Estado |
|----|-------|------|--------|
| D-{COD}-## | {regra} | bloqueio/validacao/auditoria | ✅ |

## 7. Fronteiras & Integracoes

**Fica nesta parte:**
- {responsabilidade 1}
- {responsabilidade 2}

**NAO fica nesta parte** (fica em outra / em modulo externo):
- {responsabilidade} → {para onde vai}

**Integracoes externas:**
- {sistema X} → ver `50-integracoes.md`

## 8. Duvidas em Aberto

<!-- IDs Q-{COD}-## registrados em 70-duvidas-abertas.md. Apenas referenciar aqui. -->

| ID | Duvida | Impacto | Bloqueia SDD? |
|----|--------|---------|---------------|
| Q-{COD}-## | {duvida curta} | {o que depende} | 🚫 sim / ⚠️ nao |
