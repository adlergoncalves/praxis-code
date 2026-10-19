# Catálogo de Patterns — reference canônico (agnóstico)

> 33 patterns modernos de UI categorizados. Vocabulário estável do kit Praxis.
> **Lido por**: `@ux` (modo consultoria, decisão de componente, direção), `@design` (critique, layout), `@paper-prototype`, `@check-ux`.

---

## Princípio

Patterns são **soluções nomeadas** para problemas recorrentes. Cada pattern abaixo traz:
- **Quando usar** — o caso em que ele é a melhor escolha.
- **Quando evitar** — o caso em que ele é o pattern errado (e qual usar no lugar).

Patterns são agnósticos de stack — a implementação varia, o conceito não.

---

## Apresentação / Overlay

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Modal** | Confirmação crítica, formulário focado <8 campos, dado isolado | Em mobile com formulário longo (use page); 2+ níveis de modal aninhados |
| **Drawer** (sheet lateral) | Edição paralela ao conteúdo, listas longas, filtros avançados | Conteúdo principal — drawer é ferramenta secundária |
| **Bottom Sheet** | Mobile-first ações contextuais, alternativa a modal em telas pequenas | Desktop (use popover ou modal) |
| **Toast / Snackbar** | Notificações temporárias, undo recente, feedback de ação concluída | Mensagens críticas que exigem atenção (use banner ou dialog) |
| **Banner persistente** | Alertas que exigem atenção mas não bloqueiam (assinatura expirando) | Notificações efêmeras (use toast) |
| **Tooltip** | Info contextual em ícones, dicas curtas (<8 palavras) | Conteúdo essencial — ninguém faz hover em mobile |
| **Popover** | Micro-ações contextuais (filtro inline, color picker, mini-form) | Conteúdo longo (vire drawer ou modal) |

---

## Navegação

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Command Palette** (Cmd+K) | Power users, app com muitas ações, navegação + busca + ações | Apps consumer simples (atrito sem retorno) |
| **Breadcrumbs** | Hierarquia >3 níveis, conteúdo navegável até o topo | Hierarquia plana ou flow linear |
| **Tabs** | Conteúdo paralelo no mesmo contexto (Profile/Settings/Activity de um user) | Conteúdo não paralelo (use sidebar) |
| **Stepper** | Flow sequencial >3 passos com necessidade de mostrar progresso | <3 passos (use form único) ou flow não-linear (use sidebar) |
| **Sidebar fixa** | Nav primária com 5-15 destinos | <5 destinos (use topbar) ou >15 (use mega menu ou search) |
| **Mega menu** | Site com >15 sections e categorização importante | App interno simples |

---

## Edição / Input

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Inline Edit** | Edição rápida em campo único (rename, label, comment) | Form complexo com validação cruzada (use modal/page) |
| **Multi-select + Bulk Action** | Listas onde operações em massa são frequentes | Listas <10 itens raramente editados |
| **Drag-and-drop** | Reordenar, kanban, file upload | Ações destrutivas (ambiguidade alta) |
| **Optimistic UI** | Operações que falham <1% das vezes, valor de UX > custo de rollback | Operações críticas (pagamento, delete) — espere confirmação |
| **Auto-save** | Conteúdo do usuário (docs, drafts, formulários longos) | Ações destrutivas ou que precisam de revisão |
| **Composer / Chat input** | Mensagens, comentários, queries em LLM | Form estruturado |

---

## Feedback / Estados

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Skeleton** | Loading de conteúdo conhecido (lista de cards, perfil) — **DEFAULT em 2026** | Loading curto <200ms (sem indicador) |
| **Empty State** com ilustração + CTA | Primeira visita, dado zerado, busca sem resultado | Erro do sistema (use error state específico) |
| **Progress Indicator** | Operações >2s com progresso conhecido (upload, exportação) | Operações curtas (use skeleton) |
| **Confirmation Dialog** | Ações destrutivas e irreversíveis | Ações reversíveis (use undo via toast) |
| **Undo via toast** | Delete, archive, dismiss — qualquer ação reversível | Operações que precisam confirmação imediata |

---

## Colaboração

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Presence Indicator** | Apps colaborativos (docs, design) — mostrar quem está online | Apps single-user |
| **Live Cursors** | Apps tipo Figma, Notion — colaboração em tempo real | Apps onde colaboração é assíncrona (use comments) |
| **Mentions @** | Comentários, mensagens, atribuição em tasks | Conteúdo não colaborativo |
| **Threads / Comments** | Code review, docs, feedback aninhado | Chat linear (use composer simples) |

---

## Data viz / Dashboards

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Sparkline** | Tendência inline em listas/tabelas (sem precisar dashboard) | Quando precisa precisão (use gráfico completo) |
| **Bento Grid** | Dashboards com módulos heterogêneos de tamanhos diferentes | Dashboards com grade uniforme (use grid simples) |
| **Kanban** | Workflow visual com poucos estados (3-6 colunas) | Muitos itens >50 por coluna (vire lista filtrável) |

---

## Mobile-specific

| Pattern | Quando usar | Quando evitar |
|---|---|---|
| **Pull-to-refresh** | Listas que mostram conteúdo cronológico (feed, inbox) | Pages estáticas |
| **Swipe Actions** | List items com 1-2 ações contextuais (archive, delete) | >2 ações (use overflow menu) |

---

## Como usar este reference

Ao decidir um pattern (no `/ux componente`, `/ux direção`, ou ao criticar uma tela), **cite o pattern pelo nome** e **justifique pela coluna "quando usar"**. Se a alternativa do usuário cai na coluna "quando evitar", explicite com a razão.

> "Você está propondo um modal pra um form de 12 campos — isso cai em 'quando evitar' do Modal. Sugiro Page nova ou Stepper se houver dependências entre seções."
