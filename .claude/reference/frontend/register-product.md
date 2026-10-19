# Register: Product — reference canônico (agnóstico)

> Defaults de design para **superfícies de produto** — interfaces task-focused onde o objetivo do usuário é produtividade, não persuasão.
> **Lido por**: `@ux`, `@ds-foundation`, `@ds-component`, `@design`, `@paper-prototype`, `@check-*` e a revisão visual do `/execute` quando o Charter ou a memória de design (`docs/design-system/system.md`) declaram `register: product`.
> **Par**: ver `register-brand.md` para superfícies de marketing/identidade.
> **Método detalhado** (exploração de domínio, hierarquia, superfícies, polish): `third-party/interface-design/interface-design.md`. Este arquivo é a versão curta e a regra do kit; em conflito, este arquivo vence.

---

## Quando este register se aplica

- Dashboards, admin panels, ferramentas internas
- Apps autenticados (settings, perfis, listas, formulários)
- Data-heavy: tabelas, gráficos, filtros, configurações
- Interfaces que o usuário **usa repetidamente** para realizar trabalho

Pergunta-chave: *o usuário precisa **terminar uma tarefa** rapidamente ou precisa **sentir algo**?* Se é tarefa, este register.

---

## Princípio central

> **A interface some na tarefa — e ainda assim só poderia ser deste produto.**

Duas metades, e o kit falhava na segunda. **Previsibilidade**: o usuário experiente reconhece padrões na hora (Jakob's Law) e atravessa a interface sem pensar nela; estranheza inexplicada custa caro. **Identidade**: previsível não é genérico. Linear, Stripe e Vercel são previsíveis e inconfundíveis — porque cada decisão foi *tomada*, a hierarquia é inequívoca e cem detalhes estão certos ao mesmo tempo.

**O teste**: tire o nome do produto da tela. Dá para saber para que ela serve e de quem é? Se outra IA, com um pedido parecido, entregaria substancialmente a mesma tela, ela defaultou.

---

## Onde mora a identidade em produto

Produto não ganha identidade com ornamento. Ganha com decisões que o default não toma:

1. **Domínio antes de visual** — antes de qualquer layout: 5+ conceitos do mundo do produto, 5+ cores que existem nesse mundo, **uma assinatura** (elemento visual, estrutural ou de interação que só existiria aqui) e 3 defaults nomeados e rejeitados. Sem os quatro, a proposta não sai.
2. **Um ponto focal por tela** — a coisa que o usuário veio fazer domina (tamanho, peso, contraste ou espaço em volta). Promover sem rebaixar o resto não é hierarquia.
3. **O dado conta a história** — um número na tela não é design. "3 de 10" pode ser anel de progresso, delta, sparkline, linha do tempo, quadro. Escolher a expressão pelo significado para quem olha.
4. **Densidade decidida em px** — o mesmo número repetido em toda a superfície (painel de ferramenta 12–16px; respiro maior só onde o conteúdo pede). Ritmo desigual de propósito: zonas densas de controle cedem a zonas abertas de conteúdo.
5. **Tokens com nome do domínio** — quem lê só os tokens deveria adivinhar o produto (`--tinta`, `--pergaminho` × `--gray-700`, `--surface-2`).
6. **Cor que vem de algum lugar** — a paleta sai do mundo de cor do domínio, não de um tema aplicado por cima.

Antes de **cada** componente, declarar (curto): intenção · ponto focal e como vence · paleta e por quê · profundidade · superfícies · tipografia · espaçamento. Sem o porquê de cada item, é default.

**Os quatro testes antes de mostrar** (do método de origem):
- **Swap** — trocar a fonte pela de sempre e o layout por um template muda alguma coisa? Onde não mudaria, defaultou.
- **Squint** — com os olhos semicerrados, a hierarquia sobrevive? Nada salta com aspereza?
- **Assinatura** — apontar 5 lugares onde a assinatura aparece. "A sensação geral" não conta.
- **Token** — ler os tokens em voz alta: pertencem a este produto ou a qualquer um?

---

## Defaults

### Tipografia

- **Família escolhida por decisão, registrada na memória de design.** System stack (`-apple-system`, `Segoe UI`, `Roboto`) é escolha válida quando declarada como decisão ("ferramenta nativa"). Inter/Geist como única fonte **sem decisão registrada** é o clichê 1.1 do `anti-patterns.md`.
- **Escala por razão, não por gosto**: ~1.2 para UI densa/calma, ~1.25 para a maioria dos produtos. De um corpo de 14px a 1.25: `11 · 14 · 16 · 18 · 22 · 28 · 44+`.
- **Peso e cor fazem mais hierarquia que tamanho.** Um mesmo 14px sustenta três níveis: valor 600/primário, rótulo 500/secundário, meta 400/apagado. Rampa de texto em **4 níveis** (primário, secundário, terciário, apagado).
- **Números que mudam** em `tabular-nums`. Tracking negativo em títulos grandes.
- **Display fonts**: proibido em labels, valores, dados.

### Cor

- **~60/30/10**: superfície neutra dominante, um tom secundário, ~10% de acento.
- Neutros **tingidos** com um matiz só em todas as superfícies (muda a luminosidade, não o matiz).
- **Acento reservado** para ação primária, selecionado, link, foco. Acento em decoração ou em estado inativo = ruído.
- **Vocabulário semântico de estados**: `hover`, `focus`, `active`, `disabled`, `selected`, `loading`, `error`, `warning`, `success`, `info` — toda interativa cobre os estados aplicáveis. Faltar um estado = bug de UX.
- **Cor = significado funcional**: vermelho = erro/destrutivo; verde = sucesso; amarelo = aviso; primária = ação.

### Superfícies e profundidade

- **Uma estratégia de profundidade**, comprometida: só bordas (ferramenta densa), sombras sutis, sombras em camadas ou degraus de superfície. Misturar é o tell.
- **Elevação sussurrada**: poucos pontos percentuais de luminosidade por degrau. Bordas de baixa opacidade, encontráveis mas não gritantes.
- Sidebar no mesmo fundo do canvas, com borda sutil — não um "mundo da sidebar" de outra cor. Inputs levemente mais escuros que o entorno.
- **Raio concêntrico**: `externo = interno + padding`.

### Layout & Componentes

- **Padrões standard** (top nav, sidebar, breadcrumbs, tabs) são features — mas cada padrão tem expressões infinitas: a mesma largura de sidebar e o mesmo grid de cards em toda tela é o que denuncia geração automática.
- **Proporções dizem algo**: 280px de sidebar diz "a navegação serve o conteúdo"; 360px diz "são pares". Escolher a largura pelo que ela afirma.
- **Componentes consistentes entre telas** — o mesmo `Button` se comporta e parece igual. **Usar o que existe**: HTML nativo → primitivo acessível (headless) → componente do DS; nunca `<div onClick>` no lugar de `<button>`.
- **Sem reinventar affordances**: scrollbar custom, cursor custom, dropdown que abre pra cima sem motivo.

### Motion

- **< 300ms** em UI: press 100–160ms, tooltip/popover 125–200ms, dropdown 150–250ms, modal/drawer 200–300ms.
- **Ease-out customizado** (ex.: `cubic-bezier(0.23, 1, 0.32, 1)`); nunca `ease-in` em entrada. Só `transform` e `opacity`; nunca `transition: all`.
- Ação repetida 100+×/dia (atalho, command palette) **não anima**. Press feedback `scale(0.97)`. Popover nasce do gatilho.
- Motion **comunica estado**. Zero orquestração de carregamento; `bounce` e >300ms em microinteração → proibido neste register (o detector acusa acima de 600ms em qualquer register — `anti-patterns.md` 5.2).

### Densidade

- **Média-alta**, decidida e repetida. Espaço em branco serve hierarquia, não decoração.
- Tabelas: linha compacta (40-48px), padding modesto, separação por borda sutil ou zebra muito leve.

### Copy

- Do ponto de vista do usuário: ele gerencia "notificações", não "configuração de webhook".
- Voz ativa; o botão diz o que acontece ("Salvar alterações", não "Enviar") e a ação mantém o nome no fluxo inteiro ("Publicar" → "Publicado").
- Erros: específicos e acionáveis ("CPF inválido — use 000.000.000-00"), sem pedir desculpas, nunca vagos. Tela vazia é convite para agir.
- **Sentence case** em títulos e botões (Title Case só se o projeto decidir). Sem emoji em UI funcional.

---

## Proibido neste register

- Tela sem ponto focal; hierarquia só por tamanho
- Layout monótono (mesmo card, mesmo gap, mesma densidade de ponta a ponta)
- Estratégias de profundidade misturadas; bordas sólidas ásperas
- Motion decorativo (sem comunicar estado)
- Componentes inconsistentes entre telas; controle feito à mão onde um primitivo acessível existe
- Display fonts em labels/valores
- Affordances reinventadas (scrollbar custom, cursor custom sem motivo)
- Cor forte em estado inativo; mais de um acento
- Hero metrics rows (4 KPI cards em linha como decoração)
- Gradientes em fundo de tela ou cards; glassmorphism decorativo
- Ícones decorativos antes de cada heading (rounded square tile)

---

## Como usar este reference

Quando o Charter ou a memória de design do projeto declaram `register: product` (ou quando a *surface* específica é product mesmo num projeto híbrido), **todo agent de front carrega este arquivo antes de propor ou validar**, junto com `docs/design-system/system.md` (memória de design do projeto). Os defaults aqui **são a baseline**; a memória de design e o Charter podem decidir diferente, e o que eles decidem é decisão, não desvio.

Se o produto é híbrido (ex.: SaaS com landing brand + app product), declarar register **por superfície** no Charter.
