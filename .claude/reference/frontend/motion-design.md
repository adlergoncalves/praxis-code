# Motion Design — reference canônico (agnóstico)

> Vocabulário estável de motion do kit Praxis. Conhecimento de design, sem stack.
> **Lido por**: `@ux` (modo motion, direção, critique), `@check-design`, `@check-ai-cliches`, `@check-visual-consistency`, `@design`, `@paper-prototype`.
> **Materializado por projeto** em `docs/project/motion.md` (gerado por `/ux motion`), que pode customizar/restringir o aqui contido.

---

## Princípio

Motion comunica **estado, causalidade e personalidade** — não decora. Cada animação responde a uma das três:

- **Estado** — o que mudou? (mostrar a transição entre dois estados)
- **Causalidade** — o quê causou o quê? (efeito segue ação)
- **Personalidade** — como esse produto se sente? (parte do register/charter)

Motion sem motivo é ruído. Motion decorativo em `product` register é anti-pattern; em `brand` pode ser intencional.

---

## Durações por intent

| Intent | Duração | Quando usar |
|---|---|---|
| `instant` | 100ms | Feedback imediato de input (button press, toggle, checkbox) |
| `fast` | 150-200ms | Micro state change (hover, focus, ripple) |
| `normal` | 250-300ms | Overlay aparecendo (tooltip, popover, dropdown) |
| `slow` | 400-500ms | Page transition, modal open/close, sheet slide |
| `dramatic` | 600ms+ | Large transition, hero animation, celebration (use com moderação) |

---

## Easings por contexto

| Easing | Curva CSS | Quando usar |
|---|---|---|
| `linear` | `linear` | Progress bars, loaders contínuos |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elementos **ENTRANDO** na tela (parte rápido, desacelera) — **DEFAULT para a maioria** |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elementos **SAINDO** da tela (parte lento, acelera) |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transição entre dois estados visíveis |
| `spring` | (framework-specific) | Interações naturais — drag, dismiss, dialog drop |
| `bounce` | (custom) | Celebração, ênfase em sucesso |

---

## Microinterações padrão (catálogo de baseline)

| Evento | Animação sugerida | Duração + Easing |
|---|---|---|
| Botão hover | scale leve + bg tint | fast + ease-out |
| Botão click | scale down 0.97 | instant + ease-out |
| Input focus | ring + border | fast + ease-out |
| Modal open | fade + slide up 8px | normal + ease-out |
| Modal close | fade out | fast + ease-in |
| Toast aparecer | slide up + fade | normal + ease-out |
| Page transition | fade through | slow + ease-in-out |
| Success state | check icon + bounce | normal + bounce |
| Error shake | shake horizontal | fast + spring |
| Skeleton pulse | opacity loop | normal + ease-in-out (loop infinito) |

---

## Regras universais (anti-padrões a evitar)

- **Animar apenas `transform` e `opacity`** quando possível (GPU-accelerated). Animar `width/top/left` causa layout thrashing.
- **Máximo 3 propriedades animadas por elemento simultaneamente** — mais que isso vira ruído.
- **Respeitar `prefers-reduced-motion`** — desabilitar ou simplificar para usuários sensíveis. Não negociável.
- **Stagger entre items** de uma lista: 50-100ms. Mais que isso = espera; menos = parece simultâneo.
- **Nunca passar de 600ms** exceto em hero/celebration intencional. Motion longo em microinteração é o clichê mais comum de "tema dark+spring exagerado".
- **`bounce` em microinteração de produto** é quase sempre errado — reserve para celebração ou register brand.

---

## Register × Motion

| Register | Caráter do motion |
|---|---|
| **product** | Discreto. 150-250ms. ease-out. Comunica estado, não decora. Zero orquestração de carregamento. |
| **brand** | Pode ser orquestrado. Hero animations, stagger expressivo, dramatic permitido com intenção. |

---

## Como usar este reference

Quando estiver propondo motion (no `/ux motion`, no `/design animate`, ao validar em `@check-design`), **carregue este arquivo + `motion.md` do projeto** (se existir). O motion.md do projeto **estreita** o que este catálogo permite — nunca expande além das regras universais acima.
