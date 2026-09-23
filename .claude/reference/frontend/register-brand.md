# Register: Brand — reference canônico (agnóstico)

> Defaults de design para **superfícies de marca** — landing pages, sites institucionais, sequências editoriais onde o objetivo é comunicar identidade e gerar emoção.
> **Lido por**: `@ux`, `@ds-foundation`, `@ds-component`, `@design`, `@paper-prototype`, `@check-*` quando o Charter declara `register: brand`.
> **Par**: ver `register-product.md` para interfaces task-focused.

---

## Quando este register se aplica

- Landing pages, home institucional
- Páginas de pricing, about, blog, casos de uso
- Sequências editoriais (releases, manifestos, lançamentos)
- Onboarding antes do app (não dentro)
- Qualquer superfície onde o usuário **decide se entra ou não no produto**

Pergunta-chave: *o usuário precisa **terminar uma tarefa** ou precisa **sentir algo**?* Se é sentir, este register.

---

## Princípio central

> **A interface comunica identidade.**

Em brand, beleza **é** comunicação. A superfície existe para o usuário compreender quem somos e o que prometemos antes de comprometer atenção. Aqui, a "estranheza" pode ser sinal — desde que **intencional e justificada pelo Charter**.

**O teste**: a tela tem opinião própria, ou parece template de SaaS feito por IA? Personalidade aparece em escolhas — tipografia com voz, cor com identidade, motion que orquestra significado — não em decoração desconectada.

O modo de falha mais comum: **template-saaszão** — purple-blue gradient, Inter em tudo, hero metric row, rounded square icon antes de cada heading, "transformamos X em Y" como copy. Tudo isso aparenta brand mas é o oposto: é a média estatística da internet.

---

## Defaults

### Tipografia

- **Voz tipográfica permitida**. Display font como hero (`Fraunces`, `GT Sectra`, `Tiempos`, `Söhne`, custom). Pairing matter — display + workhorse (uma sans neutra).
- **Escala generosa** (1.333 — 1.618). Diferenças grandes entre hero e body criam ritmo editorial.
- **Tipografia como composição** — hero pode ser dominante na tela, body pode ter line-height alto, smallcaps e ligaduras OpenType são bem-vindos.
- Anti-default: NÃO Inter+Geist+Söhne pra tudo (clichê de 2024-2026). Se o Charter pede confiante/polido, **escolher um sans com personalidade** (Söhne, Untitled Sans, ABC Diatype) e ter razão pra escolher.

### Cor

- **Paleta expressiva**. Cor **é** identidade — não apenas estado funcional.
- Gradientes permitidos **com intenção** (e justificativa no Charter). NUNCA o gradiente roxo→azul / azul→ciano padrão de SaaS (ver `anti-patterns.md`).
- Acentos múltiplos OK. Família de cor pode ter 3-4 acentos relacionados (não 1 + cinza).
- Cor de fundo pode ser non-neutral (off-white com tom, cream, charcoal com tom).

### Layout & Composição

- **Liberdade editorial**. Layouts assimétricos, hero sections, scroll-driven sequences, parallax sutil.
- **Imagery e ilustração** são cidadãos de primeira classe — não decoração tardia. Investir.
- Grid pode ser quebrado intencionalmente. Whitespace generoso.
- Hero não precisa ser "captura de tela do app" — pode ser conceito visual.

### Motion

- **Orquestração permitida**. Stagger de elementos entrando, reveal por scroll, hero animations.
- `dramatic` (400-600ms+) usado em momentos: hero entrance, transição entre seções, reveal de pricing.
- `ease-in-out` e curvas customizadas (custom cubic-bezier) bem-vindas.
- `prefers-reduced-motion` segue obrigatório — orquestração some, conteúdo permanece.

### Densidade

- **Baixa densidade**. Respiro, espaço em branco como elemento ativo.
- Cada seção tem uma ideia. Não empilhar 8 KPIs num hero.

### Copy

- Voz autoral. Pode ter personalidade — humor seco, lirismo, manifesto direto.
- Frases curtas para ritmo. Punch lines.
- Headlines: opinião, não descrição. "O CRM que devs amam" > "Plataforma de CRM completa".
- Anti-default: "Transformamos X em Y", "Soluções inteligentes para...", "Revolucionando a forma como..." — frases morta-IA.

---

## Proibido neste register

- Gradiente roxo→azul / azul→ciano como hero background (clichê SaaS-IA)
- "Rounded square icon tile" antes de cada heading
- Hero metrics row (4 KPI cards em linha) sem razão de produto
- Inter (ou Geist/Söhne) para tudo sem pairing nem identidade
- Hero genérico tipo "transformamos X em Y"
- Gradient text via `background-clip` decorativo
- Templates óbvios (3 colunas idênticas com ícone+headline+texto pra "features")
- Glassmorphism como recurso visual principal

> Observação: alguns desses (gradient roxo, glassmorphism) **podem** funcionar se justificados pelo Charter (ex.: arquétipo lúdico/expressivo que pede saturação). O padrão a evitar é **uso default sem decisão**.

---

## Como usar este reference

Quando o Charter do projeto declara `register: brand` (ou a *surface* específica é brand mesmo num projeto híbrido), **todo agent de front carrega este arquivo antes de propor ou validar**. Os defaults aqui **convidam à expressão**, mas a expressão precisa estar ancorada no Charter (arquétipo, referências, anti-referências).

Surface brand SEM Charter → o módulo PARA e conduz `/ux charter`. Brand sem identidade declarada é receita pra SaaS-template genérico.
