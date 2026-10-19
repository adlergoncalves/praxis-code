# Anti-patterns / AI Slop — reference canônico (agnóstico)

> Catálogo de clichês recorrentes em UI gerada por IA. **Conhecimento que alimenta o detector** (`detect-cliches.mjs`).
> **Lido por**: `@check-ai-cliches` (interpreta findings), `@check-visual-consistency`, `@ux` (interface, direção), `@design` (critique, deslop, distill, polish), revisão visual do `/execute`.
> **Implementado em código** por `.claude/scripts/frontend/detect-cliches.mjs` (regras determinísticas) — este arquivo é a **base de conhecimento** que justifica cada regra.

---

## Princípio

Modelos de IA treinaram nos mesmos templates de SaaS. Sem direção forte, o output cai num conjunto pequeno de "tells" reconhecíveis: as mesmas escolhas, no mesmo gosto, em produto após produto. Este arquivo cataloga essas escolhas e por que cada uma é problema.

Cada anti-pattern tem:
- **Sintoma** — como aparece na tela / no código
- **Por que é slop** — razão técnica/estética/contextual
- **Detecção** — se é determinístico (regex/output-level) ou exige julgamento
- **Substituto sugerido** — o caminho ancorado em decisão

> Nem todo anti-pattern é proibição absoluta. Se o Charter justifica (ex.: arquétipo lúdico permite saturação), o anti-pattern pode ser intencional. A regra: **uso default sem decisão = slop; uso ancorado no Charter = escolha**.

---

## 1. Tipográficos

### 1.1 Inter (ou Geist / Söhne) para tudo, sem pairing
- **Sintoma**: stack tipográfica única do projeto inteiro é `Inter, sans-serif`.
- **Por que é slop**: é a fonte que toda IA escolhe quando não tem ordem em contrário. Não comunica identidade.
- **Detecção**: determinística (info) — `font-family` com Inter/Geist/Söhne (`typography/overused-font`). Julgamento: é clichê quando é a única fonte **sem decisão registrada** na memória de design, em qualquer register.
- **Substituto**: pairing display+workhorse em brand; em product, system stack (`-apple-system, BlinkMacSystemFont, ...`) é até melhor — comunica "ferramenta nativa".

### 1.2 Display font em label/valor/dado
- **Sintoma**: mesma fonte do hero usada em label de input, valor numérico em card, breadcrumb.
- **Por que é slop**: display fonts são para hierarquia top; em labels viram ruído.
- **Detecção**: julgamento (heurístico via output-level + contexto).
- **Substituto**: display só em H1/H2 hero; workhorse para todo o resto.

### 1.3 Hierarquia só por tamanho
- **Sintoma**: H1 `48px`, H2 `36px`, H3 `28px`, body `16px` — todos mesma família, mesmo peso.
- **Por que é slop**: tamanho é a ferramenta menos refinada de hierarquia (ver `heuristics.md` #2 e #5).
- **Detecção**: heurístico (julgamento via output-level — pesos uniformes em níveis múltiplos).
- **Substituto**: peso + cor + posição + tamanho. Tamanho é o último recurso.

### 1.4 Tratamentos tipográficos de template
- **Sintoma**: uma palavra do título em itálico/negrito/outra cor; rótulo em CAIXA-ALTA espaçada acima de cada heading (eyebrow); rótulos supérfluos sobre o conteúdo; numeração `01 / 02 / 03` em conteúdo que não é sequência; meta-strings com ponto médio (`A · B · C`); `→` colado em todo link e botão.
- **Por que é slop**: são os marcadores mais frequentes de página gerada — aparecem qualquer que seja o assunto. Estrutura visual é informação: borda, numeração, eyebrow e divisor só entram quando codificam algo do conteúdo.
- **Detecção**: julgamento (`@check-ai-cliches`, revisão visual).
- **Substituto**: a ênfase vem das palavras e da hierarquia; numeração só em sequência real (passo a passo, linha do tempo). Fonte: `third-party/frontend-design/frontend-design.md`.

---

## 2. Cromáticos

### 2.1 Gradiente roxo→azul / azul→ciano
- **Sintoma**: hero com `linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)` ou variação.
- **Por que é slop**: o gradiente mais usado em SaaS-IA. Não comunica nada — só "moderno genérico".
- **Detecção**: **determinística** — regex detecta gradient com cores no espectro roxo-azul-ciano em background-image de seções grandes.
- **Substituto**: cor sólida com identidade; gradient com paleta autoral (justificada no Charter).

### 2.2 Preto puro `#000000`
- **Sintoma**: foreground / texto / dark mode bg = `#000`.
- **Por que é slop**: preto puro não existe na natureza; em UI digital parece amador (ver `heuristics.md` #1).
- **Detecção**: **determinística** — regex direta `#000(000)?` em foreground/background.
- **Substituto**: preto com tom (`#0a0e1a` em produto azul, `#1a0e0e` em vermelho). Acrescenta personalidade.

### 2.3 Cinza neutro absoluto sem tonalidade
- **Sintoma**: neutros em `hsl(0, 0%, X%)` — zero saturação.
- **Por que é slop**: neutros tintados (com saturação muito baixa do primary) fazem a paleta coesa.
- **Detecção**: julgamento (`@check-design`, revisão visual) — o detector ainda não tem regra para neutro sem saturação.
- **Substituto**: neutros com 2-4% de saturação do primary.

### 2.4 Gradient text via `background-clip`
- **Sintoma**: títulos em gradient (`background-clip: text`).
- **Por que é slop**: decorativo, geralmente desnecessário, sacrifica legibilidade.
- **Detecção**: **determinística** — regex `background-clip:\s*text` ou `-webkit-background-clip:\s*text` em elementos de texto.
- **Substituto**: cor sólida; se precisa enfase, usar peso/tamanho/espaço.

### 2.5 Glassmorphism decorativo
- **Sintoma**: `backdrop-filter: blur(...)` em painéis sem razão funcional.
- **Por que é slop**: clichê de "moderno" sem comunicar nada. Em produto, atrapalha contraste.
- **Detecção**: **determinística** — regex `backdrop-filter:\s*blur` em elementos não-overlay.
- **Substituto**: superfícies sólidas com hierarquia por sombra (`heuristics.md` #3).

### 2.6 Glow / "neon" sutil
- **Sintoma**: `box-shadow` com cor saturada e blur alto em botões/cards.
- **Por que é slop**: outro clichê de "futurista" genérico.
- **Detecção**: heurístico — `box-shadow` com cor não-neutra em blur >20px.
- **Substituto**: sombras neutras escaladas por elevação.

---

### 2.7 Tokens com nome de template
- **Sintoma**: `--gray-700`, `--surface-2`, `--primary-500` como vocabulário inteiro do produto; ou literais (`bg-white`, `border-gray-200`, `#fff`) onde o sistema tem tokens.
- **Por que é slop**: nomes de template produzem decisões de template. Quem lê só os tokens não consegue adivinhar o produto.
- **Detecção**: julgamento (teste do token — `register-product.md`); literais já são `tokens/hardcoded-color` no detector.
- **Substituto**: tokens semânticos com nome do domínio, mapeados a primitivos.

### 2.8 Paleta de assistente
- **Sintoma**: fundo creme (perto de `#F4F1EA`) com serifa de alto contraste e acento terracota/argila (perto de `#D97757`); ou fundo quase preto com um único acento verde-ácido ou vermelhão.
- **Por que é slop**: são as duas paletas para onde a geração por IA converge hoje. A terracota `#D97757` é a cor de interação do próprio Claude — num projeto de cliente, denuncia a origem.
- **Detecção**: **determinística** para os dois hex (`color/assistant-palette`, info); o resto é julgamento.
- **Substituto**: paleta tirada do mundo de cor do domínio (`register-product.md` › "Onde mora a identidade").

---

## 3. Composição

### 3.1 Cards aninhados em cards
- **Sintoma**: card com `border + shadow` dentro de outro card com `border + shadow`.
- **Por que é slop**: ruído de hierarquia. Borda dupla. Padding interno multiplicado.
- **Detecção**: heurístico — seletor de card dentro de outro seletor de card no DOM.
- **Substituto**: agrupar com espaço/divider/heading; reservar border+shadow para o card externo.

### 3.2 Hero metrics row (4 KPI cards em linha)
- **Sintoma**: 4 cards em linha no topo, cada um com número grande + label + ícone + (talvez) sparkline.
- **Por que é slop**: o template de dashboard mais clichê. Vira default sem motivo.
- **Detecção**: heurístico — grid horizontal de 3-4 cards com `value + label + icon` no topo de surface dashboard.
- **Substituto**: hierarquia editorial — uma métrica dominante + suporte; ou bento grid heterogêneo (`patterns.md` → bento).

### 3.3 Rounded square icon tile antes de cada heading
- **Sintoma**: ícone dentro de quadrado de cor com border-radius médio, antes de cada section heading.
- **Por que é slop**: o template de "feature section" mais clichê em landing SaaS-IA.
- **Detecção**: heurístico — grupo `flex` repetido `icon-tile + heading + paragraph` em N seções.
- **Substituto**: tipografia editorial; ilustrações reais; ícone apenas se ele significa algo.

### 3.4 Side-stripe colorido como acento
- **Sintoma**: borda colorida fina (3-4px) à esquerda de cards "destaque" / alerts / quotes.
- **Por que é slop**: clichê de Bootstrap-era.
- **Detecção**: **determinística** — `border-left` com cor saturada e width 2-6px em elemento `card` ou `alert`.
- **Substituto**: ícone + cor de fundo sutil; ou tipografia que carrega a ênfase.

### 3.5 Grid uniforme idêntico em todas as seções
- **Sintoma**: toda surface tem mesmo grid 12-col, mesmo gap, mesmo padding.
- **Por que é slop**: design sem ritmo; cada seção merece composição própria.
- **Detecção**: heurístico — mesmo grid/gap repetido em ≥4 seções consecutivas.
- **Substituto**: ritmo editorial — alternar densidades, alinhamentos, asimetrias.

---

### 3.6 Tela sem ponto focal
- **Sintoma**: tudo do mesmo tamanho, peso e espaçamento; o olho não tem onde pousar ("estacionamento").
- **Por que é slop**: é o maior separador entre "parece projetado" e "parece gerado" — e não aparece em nenhuma linha de CSS isolada, só na tela renderizada.
- **Detecção**: julgamento sobre a tela renderizada (teste squint na revisão visual do `/execute` e no `/design`).
- **Substituto**: nomear o elemento focal antes de construir e fazê-lo vencer; rebaixar o resto de propósito.

### 3.7 Profundidade misturada / bordas fazendo o trabalho do espaço
- **Sintoma**: bordas sólidas de 1px em tudo + sombras pesadas avulsas; estrutura desenhada com linhas em vez de espaço e degrau de superfície; sidebar de outra cor criando "dois mundos".
- **Por que é slop**: estrutura que grita; nenhuma estratégia de profundidade foi escolhida.
- **Detecção**: julgamento (lente "Surfaces & depth" do design review).
- **Substituto**: uma estratégia de profundidade só; bordas de baixa opacidade; espaço e tom antes de linha.

---

## 4. Acessibilidade

### 4.1 Texto colado na borda (sem padding lateral)
- **Sintoma**: texto encosta na borda do card / da viewport em mobile.
- **Por que é slop**: indica zero atenção ao detalhe.
- **Detecção**: heurístico (output-level) — revisão visual na tela renderizada; o detector de código não mede padding computado.
- **Substituto**: padding mínimo 16px em mobile, 24px+ em desktop.

### 4.2 Contraste <4.5:1 em texto
- **Sintoma**: cinza claro sobre fundo claro; cinza médio sobre cinza médio.
- **Por que é slop**: viola WCAG AA. Frequente em "muted text" exagerado.
- **Detecção**: heurístico (output-level) — revisão visual e `@check-web-guidelines`; o detector de código não calcula contraste renderizado.
- **Substituto**: muted-foreground com contraste mínimo 4.5:1 (AA) ou 7:1 (AAA) sobre seu bg.

### 4.3 Touch target <44x44px
- **Sintoma**: botões pequenos em mobile, ícones-clicáveis 24x24.
- **Por que é slop**: Fitts's Law (`cognitive-load.md`). Frustração tátil.
- **Detecção**: heurístico — interactive com computed area <44x44.
- **Substituto**: padding generoso em interactives mobile; mínimo 44x44 (Apple HIG) / 48x48 (Material).

---

## 5. Motion

### 5.1 `bounce` easing onipresente
- **Sintoma**: spring/bounce em hover, focus, e qualquer microinteração.
- **Por que é slop**: bounce em microinteração é "personalidade tatuada" — vira ruído rápido.
- **Detecção**: **determinística** — easing `cubic-bezier` com overshoot (`y > 1`) em transitions múltiplas.
- **Substituto**: `ease-out` default; bounce só em celebração ou register brand justificado.

### 5.2 Animação >600ms em microinteração
- **Sintoma**: hover com transição de 800ms; modal abre em 1s.
- **Por que é slop**: motion lento em microinteração trava a percepção de responsividade (Doherty Threshold).
- **Detecção**: **determinística** — `transition-duration: >600ms` em hover/focus/active.
- **Substituto**: respeitar `motion-design.md` buckets (150-300ms para interações).
- **Limiar por register**: 600ms é o limite universal que o detector acusa; em register **product** o teto é 300ms (`register-product.md`) — conferido no julgamento (revisão visual, `@check-design`).

### 5.3 Modal como primeira solução
- **Sintoma**: tudo abre em modal — edição rápida, confirmação, formulário longo, info contextual.
- **Por que é slop**: empilha contexto e atrapalha fluxo (`patterns.md` → Modal: quando evitar).
- **Detecção**: julgamento (heurístico — ratio modal/page muito alto).
- **Substituto**: inline edit, drawer, page nova, popover — escolher o pattern certo (`patterns.md`).

---

## 6. Comportamentais (detectáveis ao revisar features)

### 6.1 Decisão default sem âncora
- **Sintoma**: toda escolha de UI é "o default da lib" (shadcn-blue, Inter, radius 8px) sem ancoragem no Charter nem na memória de design.
- **Por que é slop**: é o sintoma raiz — sem âncora, tudo cai no template estatístico.
- **Detecção**: gate de frontend do `/execute` — feature de UI sem âncora de design (Charter ou memória de design).
- **Substituto**: a âncora conduz; toda decisão visual cita um atributo do Charter ou uma decisão da memória de design.

### 6.2 Inconsistência entre telas (drift visual)
- **Sintoma**: `Button` na tela A com `radius 8` e shadow; na tela B com `radius 4` e sem shadow. Mesmo componente, comportamento diferente.
- **Por que é slop**: marca não consolida; usuário sente "telas feitas por times diferentes".
- **Detecção**: `@check-visual-consistency` — comparar componentes equivalentes entre surfaces.
- **Substituto**: DS como fonte da verdade; `@check-visual-consistency` deve passar.

---

## 7. Clusters atuais (calibração)

> Para onde a geração de UI por IA converge **hoje** — atualizar quando as fontes mudarem.
> Fonte: `third-party/frontend-design/frontend-design.md` (seção "Process"). Todos são
> legítimos para algum briefing; o problema é aparecer **qualquer que seja o assunto**. Onde o
> briefing ou a memória de design pede um deles, segue o briefing.

1. **Creme + serifa + terracota** — ver 2.8.
2. **Quase preto + um acento ácido** — ver 2.8.
3. **Broadsheet** — fios finos, raio zero, colunas densas de jornal.
4. **Kit de cards SaaS** — conteúdo picado em cards idênticos, um raio em tudo, a mesma sombra cinza suave, gradiente como decoração (ver 3.5, 3.7).
5. **Cromo de template** — eyebrows em caixa-alta, meta-strings com ponto médio, monoespaçada em rótulo de dado, `→` em todo link, quase-preto tingido (`#0B0B0B`, `#111`) no lugar do preto (ver 1.4).

O substituto do 2.2 (preto com tom) **não pode virar o novo default**: o tom vem do mundo de cor do domínio, não de um valor fixo.

---

## Como o detector usa este arquivo

`detect-cliches.mjs` implementa **as regras marcadas como "determinística"** — escritas como código próprio, lendo `docs/design-system/stack-profile.json` para saber "o que é token" e rodar a regra de forma agnóstica.

As regras **heurísticas/julgamento** ficam no `@check-ai-cliches` (agent LLM) e na revisão visual (`/design critique`, `/execute`) — pegam o que regex não pega, mas com contexto.

**Calibração**: começar conservador. Falsos-positivos viram entradas em `frontend-learnings.md`; thresholds ajustam ao longo do tempo. Este arquivo evolui com as descobertas — não é estático.
