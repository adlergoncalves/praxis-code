---
name: check-responsiveness
description: Valida responsividade — mobile-first, breakpoints via utility classes, ausencia de @media inline e widths fixos. Detecta abordagens desktop-first e oportunidades de melhoria de layout responsivo.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Mobile-First
- Estilos base devem ser para mobile — breakpoints adicionam estilos para telas maiores
- Proibido: abordagem desktop-first (estilos base para desktop + `max-width` para mobile)
- Imagens devem ter `width: 100%` ou equivalente por default, nao largura fixa

### Breakpoints
- Breakpoints via utility classes do framework CSS (`sm:`, `md:`, `lg:` no Tailwind ou equivalente)
- Proibido: `@media` inline em arquivos .tsx (CSS-in-JS com media query inline no componente)
- Proibido: `style={{}}` com logica de breakpoint (calcular layout via JS ao inves de CSS)
- Breakpoints canonicos a respeitar: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)

### Widths e Layout
- Proibido: `width` fixo em pixels em elementos de layout principal sem alternativa responsiva
- Containers devem ter `max-width` com `width: 100%` — nao largura fixa absoluta
- Tabelas em mobile devem ter estrategia: scroll horizontal, cards, ou colunas colapsaveis

### Touch e Mobile UX
- Elementos interativos devem ter area de toque minima de 44x44px (recomendacao Apple/Google)
- Proibido: hover-only interactions sem alternativa para touch
- Inputs e botoes devem ser grandes o suficiente para toque

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre responsividade, breakpoints, mobile strategy. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar patterns responsivos ja definidos no projeto.

## EXECUCAO

### 1. Verificar @media inline em .tsx
- Grep `@media` em arquivos .tsx → ERRO

### 2. Verificar style={{}} para breakpoints
- Grep `style=\{\{.*width.*window|style=\{\{.*screen` → ERRO
- Grep `useWindowSize|window\.innerWidth` em logica de layout → AVISO (preferir CSS)

### 3. Verificar desktop-first (max-width em vez de min-width)
- Grep `@media.*max-width` em arquivos CSS/SCSS → AVISO (pode indicar desktop-first)

### 4. Verificar width fixo em layout
- Grep `width:\s*\d{3,}px` em estilos de componentes de layout → AVISO
- Grep `w-\d+\b` (Tailwind fixed width) em containers principais → AVISO se sem sm:/md:/lg: responsivo

### 5. Verificar imagens sem responsividade
- Grep `<img` com `width="\d+"` sem `className.*w-full` ou `style.*width.*100` → AVISO

### 6. Verificar tabelas em mobile
- Glob componentes com `<table|<Table` — verificar se tem estrategia de responsividade (scroll, cards)
- Tabela sem `overflow-x-auto` ou alternativa mobile → AVISO

### 7. Verificar area de toque
- Grep botoes com `h-[0-9]|h-\d` (altura) abaixo de 44px em mobile (`h-8` = 32px, `h-10` = 40px) → AVISO

### 8. Verificar hover-only
- Grep `hover:` em elementos sem `active:` ou `focus:` correspondente → AVISO

## CLASSIFICACAO
- **ERRO**: @media inline em .tsx, style={{}} para breakpoints
- **AVISO**: Desktop-first com max-width, width fixo em layout, imagem sem responsividade, tabela sem estrategia mobile, area de toque pequena

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de Responsividade

### Progressive Web App (PWA)
[Se detectado: produto que tem ou planeja ter forte uso mobile]
- **Situacao**: Produto com UX mobile cuidadosa mas sem capacidades offline ou instalacao
- **Sugestao**: Avaliar PWA (Service Worker, manifest.json) para experiencia proxima de app nativo
- **Como**: `/architect` → criar ADR de PWA Strategy
- **Beneficio**: Instalacao na home screen, funcionamento offline basico, notificacoes push

### Estrategia de Imagens Responsivas
[Se detectado: imagens sem srcset ou sem next/image otimizacao]
- **Situacao**: X imagens carregadas sem otimizacao por resolucao/breakpoint
- **Sugestao**: Criar ADR de Image Strategy definindo: formatos (WebP/AVIF), lazy loading, srcset, CDN
- **Como**: `/architect` → criar ADR de Image Optimization
- **Beneficio**: Reducao de dados em mobile, LCP mais rapido, melhor Core Web Vitals
```

Emitir apenas as secoes com evidencia no codigo.
