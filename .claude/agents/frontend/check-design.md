---
name: check-design
description: Valida Design System compliance — tokens de tema, componentes consistentes, sem reimplementacao de componentes existentes, spacing e tipografia via tokens.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Tokens de Cor
- Proibido: cores hardcoded (`#hex`, `rgb()`, `hsl()`, `rgba()`) fora dos arquivos de token do DS
- Todas as cores devem vir de CSS variables (`var(--color-*)`) ou tokens do tema
- Proibido: nomes de cor semanticos hardcoded (`blue`, `red`, `green`) em estilos de componente

### Spacing e Tipografia
- Proibido: valores de espacamento magicos (px fixos nao pertencentes ao scale do DS) fora de casos especificos documentados
- Espacamento via tokens (`var(--spacing-*)`, classes Tailwind, ou tokens do tema)
- Tipografia via tokens (`var(--font-size-*)`, classes do DS) — nao definir font-size arbitrario em componentes

### Componentes
- Proibido: reimplementar componentes que ja existem no DS (Button, Input, Dialog, Table, Badge, etc.)
- Componentes do DS usados de forma consistente (mesma variante para o mesmo caso de uso)
- Extensoes ou customizacoes de componentes do DS devem ser feitas via props/variants, nao override de CSS

### CSS e Estilos
- Proibido: `!important` em estilos de componente de producao (exceto reset ou override intencional documentado)
- Proibido: CSS global que afeta seletores de componente especifico
- Inline styles (`style={{}}`) apenas para valores dinamicos que nao tem outro meio

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre Design System, tokens, componentes. Verificar se existe `design-system/` ou `src/design-system/` com tokens definidos. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar patterns do DS do projeto.

**Adicionalmente, carregar (se existirem)**:
- `docs/project/motion.md` — motion grammar do projeto (gerada via `/ux motion`). Define duracoes, easings e microinteracoes padrao. **Toda animacao no codigo deve ser validavel contra este documento**
- `docs/project/ux-charter.md` — personalidade do produto. Permite validar se decoracoes de UI (sombras, radius, densidade) estao coerentes com os atributos declarados

## EXECUCAO

### 1. Verificar cores hardcoded
- Grep `#[0-9a-fA-F]{3,6}|rgb\(|rgba\(|hsl\(` em arquivos .tsx, .css, .scss fora de token files → ERRO

### 2. Verificar nomes de cor semanticos
- Grep `color:\s*(blue|red|green|yellow|gray|black|white)\b` em estilos → AVISO

### 3. Verificar spacing magico
- Grep `padding:\s*\d+px|margin:\s*\d+px|gap:\s*\d+px` com valores fora do scale (nao 4, 8, 12, 16, 24, 32, 48, 64) → AVISO

### 4. Verificar reimplementacao de componentes
- Glob componentes custom com nomes que coincidem com DS: `Button.tsx`, `Input.tsx`, `Modal.tsx`, `Dialog.tsx`, `Badge.tsx`, `Table.tsx` fora do DS
- Componente custom que duplica DS → ERRO

### 5. Verificar !important
- Grep `!important` em arquivos de componente (.tsx, .module.css, .scss) → AVISO

### 6. Verificar inline styles para valores fixos
- Grep `style=\{\{[^}]*:\s*['"][^'"]+['"]` (inline style com valor string fixo, nao variavel) → AVISO

### 7. Verificar se DS existe e e importado
- Verificar se existe `design-system/` ou `@/design-system` no projeto
- Se DS existe: verificar se componentes de UI sao importados do DS ou de libs diretas
- Componente de lib (shadcn, MUI, etc.) importado diretamente sem passar pelo DS → AVISO

### 8. Verificar conformidade com motion.md (se existe)

Aplicar **apenas se** `docs/project/motion.md` existe.

- Grep `duration:\s*\d+|transition:.*\d+ms|transition-duration:.*\d+ms` em arquivos de componente
- Para cada duracao encontrada, comparar com tabela do motion.md:
  - Duracao fora dos buckets canonicos (instant 100ms, fast 150-200ms, normal 250-300ms, slow 400-500ms, dramatic 600ms+) → **AVISO**: "duracao Xms fora dos buckets definidos no motion.md"
  - Duracao >600ms em microinteracao (hover, focus, click) → **AVISO**: "animacao excessivamente longa para este intent"
  - Animacao em hover/focus sem easing definido (linear) → **AVISO**: "easing implicito linear — preferir ease-out conforme motion.md"
- Grep `animation:.*\d+s|transition:.*\d+s` (segundos em vez de ms) → **AVISO**: "usar ms para precisao, conforme motion.md"

### 9. Verificar coerencia com UX Charter (se existe)

Aplicar **apenas se** `docs/project/ux-charter.md` existe e declara atributos como "preciso", "minimal", "luxuoso".

- Charter "preciso/minimal" + projeto usa `shadow-2xl` ou `shadow-glow` em componentes simples → **AVISO**: "decoracao incompativel com personalidade declarada"
- Charter "luxuoso/minimal" + projeto usa muitas cores saturadas em componentes funcionais → **AVISO**: "paleta incompativel com personalidade declarada"
- Charter "ludico" + projeto sem nenhuma animacao em microinteracoes → **AVISO**: "personalidade declarada ludica mas projeto sem expressividade — motion subutilizado"

Estes avisos sao **soft signals** — sao gatilhos para discussao, nao erros bloqueantes. O dev pode justificar contextualmente.

## CLASSIFICACAO
- **ERRO**: Cor hardcoded em componente, reimplementacao de componente do DS
- **AVISO**: Spacing magico, !important em componente, inline style com valor fixo, componente de lib sem passar pelo DS, nome de cor semantico hardcoded, duracao fora dos buckets do motion.md, decoracao incompativel com UX Charter

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao do Design System

### Design System Nao Inicializado
[Se detectado: projeto sem DS formal mas com componentes e estilos espalhados]
- **Situacao**: Projeto sem Design System formal — X componentes de UI sem padronizacao de tokens
- **Sugestao**: Inicializar Design System com `/ds-init` a partir de uma referencia visual do produto
- **Como**: `/ds-init` → extrair tokens e criar base do DS
- **Beneficio**: Consistencia visual, manutencao centralizada de estilos, onboarding rapido

### Tokens Faltantes
[Se detectado: DS existe mas cores/spacing/tipografia sao hardcoded em alguns lugares]
- **Situacao**: X ocorrencias de valores hardcoded que deveriam ser tokens no DS
- **Sugestao**: Expandir tokens do DS para cobrir os valores encontrados
- **Como**: `/ds-component` ou editar tokens diretamente
- **Beneficio**: Theming, dark mode, consistencia visual garantida por construcao

### Storybook / Showcase
[Se detectado: DS com componentes mas sem documentacao visual]
- **Situacao**: DS sem showcase interativo ou Storybook
- **Sugestao**: Criar ADR de DS Documentation definindo ferramenta de showcase (Storybook, Ladle, catalogue)
- **Como**: `/architect` → criar ADR de Design System Documentation
- **Beneficio**: Catalogo visual de componentes, desenvolvimento isolado, comunicacao com design
```

Emitir apenas as secoes com evidencia no codigo.
