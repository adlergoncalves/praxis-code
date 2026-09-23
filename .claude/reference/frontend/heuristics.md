# Heurísticas Visuais — Refactoring UI (reference canônico, agnóstico)

> 8 heurísticas atemporais para refinar UI. Vocabulário estável do kit Praxis.
> **Lido por**: `@ux` (modo critique, direção), `@design` (polish, distill, layout, typeset, colorize), `@check-design`, `@check-ai-cliches`.

---

## Princípio

UI mediana vira UI excelente aplicando algumas heurísticas atemporais. Estas 8 vêm da prática de Adam Wathan e Steve Schoger (Refactoring UI) e da experiência acumulada — não são opinião nem tendência.

Use ao **criticar** interfaces, ao **polir** o que está bom mas pode ficar excelente, e ao **detectar drift** automático.

---

## As 8 heurísticas

| # | Heurística | Como aplicar |
|---|---|---|
| 1 | **Cor com tonalidade, nunca preto puro** | Em vez de `#000`, use cinza muito escuro com tom da cor primária. Ex.: em produto azul, `#0a0e1a`; em produto vermelho, `#1a0e0e`. Preto puro em UI digital parece amador. |
| 2 | **Hierarquia com peso e cor, não com tamanho** | Diferenciar título de subtítulo via `font-weight` (700 vs 500) e cor (foreground vs muted), não com `text-3xl vs text-2xl`. Tamanho é o último recurso. |
| 3 | **Sombras proporcionais à elevação** | Card = sombra pequena, popover = média, modal = grande. Sombras **nunca uniformes** entre níveis. Sombra uniforme = elevação ambígua. |
| 4 | **Design em grayscale primeiro, cor depois** | Layout deve funcionar em grayscale. Se não funciona, é a cor que está sustentando a hierarquia — e isso é frágil. Refazer hierarquia, depois adicionar cor. |
| 5 | **Tipografia: 4-5 níveis máximo** | h1, h2, h3, body, small — chega. Mais níveis = ruído visual. Hierarquia adicional vira peso/cor (heurística #2). |
| 6 | **Espaçamento em escala não-linear** | 4, 8, 12, 16, 24, 32, 48, 64. Nunca 10/20/30 linear — quebra ritmo. A escala não-linear cria diferenças perceptíveis entre níveis. |
| 7 | **Border-radius consistente por contexto** | Buttons e inputs com mesmo radius. Cards podem ter outro. **Nunca radius arbitrário por componente** — cria sensação de bagunça. |
| 8 | **Estados (hover/focus/active) com microvariação** | Mudar opacity 90%, scale 0.97, bg 5% mais escuro — não trocar a cor inteira. Estados devem ser **óbvios e sutis** ao mesmo tempo. |

---

## Como usar este reference

Ao **criticar** uma tela: percorra as 8 e identifique violações. Cada violação vira finding com a heurística citada.

> "A tela está em preto puro `#000000` — viola heurística #1. Sugiro `#0c0e14` (preto com toque do azul primário do Charter)."
> "Os títulos diferenciam por `text-3xl` vs `text-2xl` — viola #2. Manter mesmo tamanho e diferenciar por peso (700 vs 500)."
> "Cards e modais com mesma sombra — viola #3. Cards `shadow-sm`, modal `shadow-xl`."

Ao **polir** (modo `/design polish`): aplicar as heurísticas em ordem, do impacto maior pro menor.

Ao **detectar automaticamente**: o detector (`detect-cliches.mjs`) verifica heurísticas que dão pra checar deterministicamente (preto puro, sombras uniformes, escala de spacing linear). As que exigem julgamento (hierarquia por peso) ficam no `@check-design`/`@ux`.
