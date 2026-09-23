# Register: Product — reference canônico (agnóstico)

> Defaults de design para **superfícies de produto** — interfaces task-focused onde o objetivo do usuário é produtividade, não persuasão.
> **Lido por**: `@ux`, `@ds-foundation`, `@ds-component`, `@design`, `@paper-prototype`, `@check-*` quando o Charter declara `register: product`.
> **Par**: ver `register-brand.md` para superfícies de marketing/identidade.

---

## Quando este register se aplica

- Dashboards, admin panels, ferramentas internas
- Apps autenticados (settings, perfis, listas, formulários)
- Data-heavy: tabelas, gráficos, filtros, configurações
- Interfaces que o usuário **usa repetidamente** para realizar trabalho

Pergunta-chave: *o usuário precisa **terminar uma tarefa** rapidamente ou precisa **sentir algo**?* Se é tarefa, este register.

---

## Princípio central

> **A interface some na tarefa.**

Em produto, beleza não é decoração — é **previsibilidade**. Usuário experiente quer reconhecer padrões instantaneamente (Jakob's Law) e atravessar a interface sem pensar nela. Estranheza inexplicada custa caro: cada elemento "criativo" sem motivo é micro-atrito.

**O teste**: um especialista em ferramentas de categoria líder (Linear, Figma, Stripe, Notion) confiaria nessa interface imediatamente, ou notaria detalhes esquisitos?

O modo de falha **não é minimalismo** — é **estranheza inexplicada**: botões super-decorados, controles de formulário inconsistentes entre si, motion gratuito, display font onde label deveria estar, acento de cor em estado inativo.

---

## Defaults

### Tipografia

- **Família**: system font stacks são preferidos (`-apple-system`, `Segoe UI`, `Inter`, `Roboto`). Uma sans-serif única para todos os níveis.
- **Escala**: modesta (1.125 — 1.2). Layouts densos exigem diferenças pequenas entre níveis; escalas grandes (1.333+) introduzem ruído.
- **Display fonts**: proibido em labels, valores, dados. Reservado pra hero de landing (e isso é register brand, não product).
- **Hierarquia**: peso + cor + posição. Tamanho é o último recurso (ver `heuristics.md` #2).

### Cor

- **Paleta restrained**. Neutros tintados (não cinza puro, ver `heuristics.md` #1) + 1 cor de acento.
- **Acento reservado** para: ação primária, item selecionado, link, foco. Acento em decoração ou em estado inativo = ruído.
- **Vocabulário semântico rico de estados**:
  - `hover`, `focus`, `active`, `disabled`, `selected`, `loading`, `error`, `warning`, `success`, `info`
  - **Toda interativa precisa cobrir TODOS os estados aplicáveis**. Faltar um estado = bug de UX.
- **Cor = significado funcional**: vermelho = erro/destrutivo; verde = sucesso; amarelo = aviso; primária = ação. Não usar verde só "porque combina".

### Layout & Componentes

- **Grids previsíveis**. Padrões standard (top nav, sidebar fixa, breadcrumbs, tabs) são **features, não restrições**.
- **Estado pleno**: todo interativo (botão, input, card clicável) tem default + hover + focus + active + disabled + loading + error visualmente distintos.
- **Componentes consistentes entre telas**: o mesmo `Button` na tela A e na tela B se comporta e parece igual. Inconsistência entre telas é o sintoma #1 de drift visual.
- **Sem reinventar affordances**: scrollbar custom, cursor custom, dropdown que abre pra cima sem motivo = atrito sem retorno.

### Motion

- **150-250ms** para microinterações. `ease-out` default.
- Motion **comunica estado**, não decora. Cada animação responde "o que mudou?" ou "o que causou o quê?".
- **Zero orquestração de carregamento**. Stagger de KPI cards entrando em sequência é register brand, não product.
- `bounce`, `dramatic` (>500ms), animações em hover prolongadas → proibido em product.

### Densidade

- **Média-alta densidade**. Espaço em branco serve hierarquia, não decoração. Cards com muito padding interno em dashboard = telas precisam de mais scroll.
- Tabelas: linha compacta (40-48px), padding interno modesto, separação por `border` sutil ou zebra muito leve.

### Copy

- Direto, declarativo, terceira pessoa ou imperativo.
- Sem emoji em UI funcional. Sem "Oi! 👋" em onboarding de ferramenta.
- Erros: específicos e acionáveis ("CPF inválido — use formato 000.000.000-00"), não vagos ("Erro ao salvar").
- Labels: substantivo concreto ("Nome", "E-mail"), não pergunta ("Qual o seu nome?").

---

## Proibido neste register

- Motion decorativo (sem comunicar estado)
- Componentes inconsistentes entre telas
- Display fonts em labels/valores
- Affordances reinventadas (scrollbar custom, cursor custom sem motivo)
- Cor forte em estado inativo
- Hero metrics rows (4 KPI cards em linha como decoração)
- Gradientes em fundo de tela ou cards
- Glassmorphism decorativo
- Sombras excessivas em flat UI
- Ícones decorativos antes de cada heading (rounded square tile)

---

## Como usar este reference

Quando o Charter do projeto declara `register: product` (ou quando a *surface* específica é product mesmo num projeto híbrido), **todo agent de front carrega este arquivo antes de propor ou validar**. Os defaults aqui **são a baseline** — só são contradiabolizados se houver justificativa explícita no Charter.

Se o produto é híbrido (ex.: SaaS com landing brand + app product), declarar register **por superfície** no Charter.
