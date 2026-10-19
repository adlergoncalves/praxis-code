# Arquétipos de Personalidade — reference canônico (agnóstico)

> 6 arquétipos para identificar e ancorar a personalidade de um produto. Vocabulário estável do kit Praxis.
> **Lido por**: `@ux` (modo charter), `@ds-foundation` (extração de tokens com intenção), `@check-visual-consistency`, `@paper-prototype`, `@design`.

---

## Princípio

Personalidade de produto não é "estilo visual" — é a forma como o produto **se comporta** sob estresse: como ele fala, como ele reage, como ele decora, como ele falha. Os 6 arquétipos abaixo são clusters comuns de comportamento que produtos modernos exibem.

Use para:
1. **Identificar** a personalidade dominante do projeto (no `/ux charter`).
2. **Ancorar decisões** — toda escolha de UI/UX deve ser justificável por um arquétipo.
3. **Validar coerência** — uma decisão fora do arquétipo é um sinal de drift.

---

## Os 6 arquétipos

| Arquétipo | Exemplos | Tokens | Motion | Copy | Densidade |
|---|---|---|---|---|---|
| **Preciso / Keyboard-first** | Linear, Raycast, Vim, Cron | Tipografia geometric ou mono; paleta sóbria (neutro + 1 cor); radius 4-6px; pouca sombra | instant 100ms; spring discreto; mínimas microinterações | Imperativo, curto, sem emoji, jargão técnico aceito | Alta densidade, espaço mínimo |
| **Confiante / Polido** | Stripe, Vercel, GitHub | Paleta sóbria com 1-2 acentos; sombras sutis; tipografia sans bem espaçada; radius 6-8px | ease-out 250ms; transições fluidas; sem bounce | Direto, declarativo, terceira pessoa | Média densidade, hierarquia forte |
| **Amigável / Elástico** | Notion, Calendly, Loom | Cores quentes ou pasteis; border-radius generoso (10-16px); sombras macias; ilustrações | bounce/spring 300-400ms; microinterações lúdicas | Conversacional, primeira pessoa, emojis ocasionais | Baixa-média densidade, respiro |
| **Luxuoso / Minimal** | Apple, Arc browser, Things, Linear (parcialmente) | Muito branco; escala tipográfica generosa; neutros profundos; radius pequeno (2-4px) ou nenhum | dramatic 400-600ms; ease-in-out; transições cinematográficas | Poética, precisa, segunda pessoa contemplativa | Baixa densidade, foco no que importa |
| **Lúdico / Expressivo** | Duolingo, Figma onboarding, Discord, Trello | Cores saturadas; ilustrações; ícones expressivos; gradientes; radius 12-20px | bounce, stagger 400-600ms+; celebrações visíveis | Humor, segunda pessoa, emojis frequentes | Variável, prioriza expressividade sobre densidade |
| **Utilitário / Denso** | Bloomberg Terminal, AWS Console, GitHub Actions, Excel | Tipografia mono; alta densidade; mínima decoração; paleta funcional (cor = significado) | Zero ou instant 100ms; sem microinterações decorativas | Técnica, jargão aceitável, telegráfica | Máxima densidade, expert-first |

---

## Como aplicar

**Identificação**: identificar **1 arquétipo dominante (60-80%) + 1 secundário (20-40%)**. Quase nenhum produto é 100% um arquétipo.

Exemplos:
- Linear = "Preciso 70% + Polido 30%"
- Stripe = "Polido 80% + Luxuoso 20%"
- Notion = "Amigável 70% + Polido 30%"
- Arc = "Luxuoso 60% + Lúdico 40%"

**Materialização**: cada atributo derivado do arquétipo deve virar:
- **Tokens** — cores, tipografia, spacing, radius.
- **Motion** — durações, easings.
- **Copy** — tom, formalidade, pessoa gramatical.
- **Hierarquia** — densidade, espaço em branco, peso visual.

---

## Anti-padrões comuns

- **Misturar arquétipos opostos**: Utilitário denso + Lúdico expressivo no mesmo produto = caos visual. Se precisar dos dois, separar por seção/feature.
- **Adotar arquétipo "sem decidir"**: produto que sai como Polido por default porque é o que a IA gera "por trás" — sem o usuário escolher. Esse é o clichê mais frequente em projetos sem charter.
- **Trocar de arquétipo entre telas**: tela A confiante + tela B amigável → marca não consolida. `@check-visual-consistency` pega isso.

---

## Como usar este reference

No `/ux charter`, este arquivo é carregado para **conduzir a entrevista**: o agent apresenta os 6, ajuda a identificar dominante + secundário, e amarra cada atributo do charter ao arquétipo escolhido. O resultado (charter) vira **a âncora narrativa** que todo agent de front consulta antes de propor algo.
