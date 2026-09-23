# ADR-NNNN: Loading Strategy

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Feedback visual de carregamento e essencial para a percepcao de performance. Porem, estrategias mal definidas criam experiencias ruins: spinners full-screen bloqueiam toda interacao, ausencia de feedback faz o usuario achar que a aplicacao travou, e loading states inconsistentes confundem.

Uma estrategia com tipos especificos de loading para cada situacao garante UX previsivel.

## Decisao
Definir 4 tipos de loading, cada um com sua representacao visual:

### 1. Navegacao entre rotas
**Visual:** Barra de progresso no topo da pagina (progress bar)
**Quando:** Transicao entre paginas/rotas
**Por que:** Nao bloqueia a UI atual, indica que algo esta acontecendo

### 2. Carregamento inicial de dados
**Visual:** Skeleton que reflete o layout da pagina
**Quando:** Primeira carga de dados de uma pagina
**Por que:** Comunica o layout esperado, reduz perceived loading time

### 3. Acao do usuario (submit, delete, etc.)
**Visual:** Spinner inline no botao que disparou a acao
**Quando:** Usuario clica em botao de acao
**Por que:** Feedback localizado, usuario sabe qual acao esta em progresso

### 4. Recarregamento de dados (refetch)
**Visual:** Overlay semi-transparente sobre o conteudo existente
**Quando:** Dados ja exibidos estao sendo atualizados
**Por que:** Mantem conteudo visivel enquanto atualiza, sem "piscar" skeleton

```
Navegacao          → Progress bar (topo)
Carga inicial      → Skeleton (layout da pagina)
Acao do usuario    → Spinner inline (no botao)
Refetch/reload     → Overlay semi-transparente
```

## Alternativas Consideradas
1. **Spinner full-screen para tudo:** Simples, mas bloqueia toda interacao e e visualmente agressivo.
2. **Skeleton para tudo:** Melhor que spinner, mas estranho para acoes de botao ou refetch.
3. **Sem loading state (otimistic UI):** Excelente UX quando funciona, mas complexo e arriscado para operacoes que podem falhar.
4. **Loading bar global unica:** Serve para navegacao, mas nao para acoes especificas do usuario.

## Consequencias
### Positivas
- UX previsivel: cada tipo de carregamento tem sua representacao visual
- Sem bloqueio total: nenhuma situacao usa overlay full-screen opaco
- Perceived performance melhorada com skeletons
- Feedback localizado para acoes do usuario (sabe qual botao clicou)

### Negativas
- Mais componentes de loading para implementar e manter
- Desenvolvedores precisam escolher o tipo correto para cada situacao
- Skeletons precisam ser atualizados quando o layout da pagina muda

## Regras para Validacao
- PROIBIDO: Spinner ou overlay full-screen opaco
- PROIBIDO: Ausencia total de feedback de carregamento
- OBRIGATORIO: Skeleton para carregamento inicial de dados (nunca spinner full-page)
- OBRIGATORIO: Spinner inline no botao para acoes do usuario
- PREFERIDO: Progress bar no topo para navegacao entre rotas
- PREFERIDO: Overlay semi-transparente para refetch de dados ja exibidos
