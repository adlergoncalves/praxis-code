# Design System Anatomy — reference canônico (agnóstico)

> Estrutura visual canônica da página do Design System do projeto. Conhecimento universal de DS — sem stack.
> **Lido por**: `@ds-foundation` (Phase 6 do `/ds-init`), `@ds-component` (showcase de cada componente).
> **Materialização** (sintaxe específica de framework — Next.js routing, Vite + react-router, Angular routing, etc.) vive nos **adapters** em `.claude/reference/frontend/adapter-*.md`.

---

## Princípio

O DS do projeto vive como **artefato interno do dev**, isolado do app, na rota `/design-system`. Sua função: documentar visualmente o que existe (tokens + componentes), espelhando o estado do projeto. Não vai pra produção, não aparece em PRDs.

**Importante**: a página de tokens contém **apenas tokens**. Componentes ganham páginas dedicadas via `/ds-component`. NUNCA misturar showcase de componente na página de tokens.

---

## Estrutura geral

```
┌─────────────┬──────────────────────────────────────┐
│ Design      │                                      │
│ System      │   Conteúdo da página atual           │
│ {subtítulo} │   (Tokens / showcase do componente   │
│             │    selecionado / etc.)               │
│ FOUNDATION  │                                      │
│ > Tokens    │                                      │
│             │                                      │
│ COMPONENTS  │                                      │
│   Button    │                                      │
│   Input     │                                      │
│   ...       │                                      │
│             │                                      │
│ ─────────── │                                      │
│ Dark Mode   │                                      │
└─────────────┴──────────────────────────────────────┘
```

- **Sidebar fixa** à esquerda, ~256px de largura, scroll próprio quando ultrapassa.
- **Main area** flexível, padding generoso, scroll próprio.
- **Navegação por ROTA**, NÃO por scroll/scroll-spy.

---

## Sidebar

**Cabeçalho**:
- Título "Design System" (peso bold, tamanho grande).
- Subtítulo curto com nome/descrição do DS do projeto (ex.: "Earthy Olive DS"), em texto menor + cor muted.

**Seções de navegação**:
- Lidas de `navigation.ts` (ou equivalente da stack).
- Estrutura `NavSection[]` — seções com `title` + `items`. **NUNCA `NavItem[]` flat**.
- Cada seção tem título em **uppercase pequeno** + cor muted.
- Itens da seção são `Link` para rotas distintas.

**Seções padrão**:
1. **Foundation**
   - `Design Tokens` → `/design-system`
2. **Components** (começa **vazia** — populada uma entrada por vez via `/ds-component {nome}`)

**Estado ativo**:
- Item ativo: `background-color: primary` + `color: primary-foreground`.
- Itens inativos: hover em `muted`.
- Match: `pathname === item.href` (exato). Subrota só se necessário (`startsWith`).

**Rodapé**:
- Separador visual.
- Link fixo "Dark Mode" no final (alterna classe `dark` no `<html>`).

**REGRA CRÍTICA — navegação por rota, NUNCA por scroll**:
- **PROIBIDO**: `IntersectionObserver`, `scrollIntoView`, âncoras com hash (`#section`), single-page-with-scroll.
- Cada item da sidebar leva a uma URL distinta. Item ativo = comparar `pathname` com `item.href`.

---

## Página de Tokens (`/design-system`)

### Header

```
# Design Tokens                                    [☀/🌙 toggle]
{Subtítulo descritivo do DS — 1 frase}
```

- H1 bold, grande.
- Subtítulo em `text-muted-foreground`.
- Toggle de dark mode no canto superior direito (ícone sol/lua).

### Seção: Color Palette → Core Colors

Grid `4 colunas × 4 linhas` de swatches. Cada swatch:

```
┌──────────────┐
│              │  ← quadrado ~80×80px, rounded-lg, border sutil
│   {cor}      │
│              │
└──────────────┘
{Nome}            ← texto bold, pequeno
--{variável}      ← texto muted, menor, mostrando a CSS variable
```

Ordem dos 16 swatches (4 por linha):
```
Linha 1: Background    | Foreground       | Card           | Card Foreground
Linha 2: Primary       | Primary FG       | Secondary      | Secondary FG
Linha 3: Muted         | Muted FG         | Accent         | Accent FG
Linha 4: Border        | Input            | Ring           | Destructive
```

Cada swatch usa a CSS variable como `backgroundColor` (referência ao token, não literal).

### Seção: Semantic Colors

Mesmo grid `4 × 2`:
```
Linha 1: Success       | Success FG       | Warning        | Warning FG
Linha 2: Info          | Info FG          | Destructive    | Destructive FG
```

### Seção: Primary Scale

Escala horizontal da cor primary de 50 a 900. 10 blocos:
```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 50 │100 │200 │300 │400 │500 │600 │700 │800 │900 │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

- Layout: flex horizontal com gap pequeno.
- Cada bloco: ~64×64px, rounded-md.
- Label abaixo de cada bloco com o número.
- Do mais claro (50) ao mais escuro (900).

### Seção: Neutral Scale

Mesmo formato da Primary Scale, com a neutral color.

### Seção: Typography

Exemplos de cada nível tipográfico, com classe correspondente ao lado:

```
Heading 1     ← grande, bold
Heading 2     ← grande, semibold
Heading 3     ← médio, semibold
Heading 4     ← menor, medium
Body          ← tamanho base
Small         ← menor
Muted         ← menor, cor muted
```

### Seção: Border Radius

4 exemplos lado a lado mostrando os 4 níveis de radius do projeto (none, sm, md, lg). Cada box: ~64×64px, `bg-primary`.

### Seção: Shadows

3 exemplos lado a lado (sm, md, lg). Cada box: ~96×64px, `bg-card` com shadow correspondente.

### REGRA — NÃO incluir componentes nesta página

A página de tokens documenta **apenas fundamentos**. Componentes (Button, Input, Modal, etc.) têm páginas dedicadas criadas via `/ds-component`. Misturar tokens + componentes na mesma página é anti-pattern.

---

## Páginas de componente (criadas via `/ds-component`)

Estrutura canônica (cada componente em rota `/design-system/components/{nome}`):

1. **Header** — Nome do componente + descrição curta.
2. **Showcase** — variantes do componente em estados: default, hover (se aplicável), focus, active, disabled, loading, error, selected.
3. **Props / API** — tabela com props, tipos, defaults.
4. **Uso real** — 1-2 exemplos de uso no contexto do app.
5. **Code block** — snippet de uso mínimo.

Detalhes específicos da implementação (sintaxe da stack) vivem no adapter casado.

---

## Dark Mode Toggle

- Alterna classe `dark` no elemento root (`<html>` ou equivalente).
- Troca ícone (sol ↔ lua).
- Todos os swatches e componentes reagem automaticamente (CSS variables redefinidas em `.dark { ... }`).
- Implementação client-side (qualquer stack).

---

## O que muda por stack (vive no adapter)

- Sintaxe de roteamento (Next.js app router vs Vite + react-router vs Angular routing vs Vue Router).
- Diretivas específicas (`"use client"` em Next, ausente em Vite).
- Importação de fonte (`next/font` em Next.js, `<link>` ou `@import` em Vite).
- Sintaxe de componente (React JSX, Angular template, Vue template).
- Library de UI base (shadcn install, Angular Material `ng add`, Vuetify plugin, MUI ThemeProvider).

Tudo isso vive nos arquivos `.claude/reference/frontend/adapter-*.md` (criados no Passo 4 do plano-3).

---

## Como usar este reference

`@ds-foundation` na Phase 6 do `/ds-init` lê este arquivo + o adapter casado (baseado em `stack-profile.json`) e materializa o DS na stack do projeto. **A estrutura visual canônica (sidebar fixa, grid 4 cols, scales, etc.) é universal** — só a sintaxe muda.

`@ds-component` lê a seção de "páginas de componente" + adapter para criar o showcase de cada componente adicionado.
