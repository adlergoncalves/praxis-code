---
name: check-ux
description: Valida patterns UX — loading states, feedback visual, empty states, error handling, acessibilidade basica e consistencia de interacao.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Loading States
- Toda operacao assincrona deve ter estado de loading visivel
- Proibido: spinner full-page para carga inicial de conteudo — usar skeleton screens
- Botoes de submit devem ser desabilitados e indicar loading durante submissao (prevenir double submit)
- Proibido: tela em branco enquanto dados carregam (sem loader)

### Feedback de Acoes
- Toda acao do usuario com efeito deve ter feedback: sucesso, erro ou confirmacao
- Toasts/notificacoes para feedback nao-bloqueante
- Mensagens de erro inline para validacao de formularios
- Proibido: `window.confirm()` ou `window.alert()` — usar componentes de Dialog/Modal proprios

### Empty States
- Listas devem ter estado vazio com mensagem e, idealmente, call-to-action
- Proibido: lista vazia sem nenhum conteudo (tela em branco ou apenas titulo)
- Tabelas sem dados devem comunicar o motivo e proxima acao

### Error States
- Componentes que fazem fetch devem tratar o estado de erro
- Erros de rede devem ter opcao de retry
- Proibido: erro silencioso (catch sem feedback visual)
- Proibido: mensagem de erro tecnica exposta ao usuario (`Network Error`, `TypeError: ...`)

### Acessibilidade Basica
- Imagens devem ter atributo `alt` descritivo (nao vazio para imagens informativas)
- Botoes de icone (sem texto visivel) devem ter `aria-label`
- Inputs de formulario devem ter `<label>` associado (via `for`/`htmlFor` ou wrapping)
- Foco visivel nos elementos interativos (nao `outline: none` sem substituto)
- Links devem ter texto descritivo (nao apenas "clique aqui")

### Consistencia de Interacao
- Comportamento de click/submit deve ser consistente entre formularios similares
- Mensagens de erro devem usar linguagem consistente (nao misturar tecnico com usuario-friendly)

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre UX patterns, loading strategy, acessibilidade, toast/notification patterns. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar patterns ja definidos no projeto.

## EXECUCAO

### 1. Verificar loading states
- Glob componentes que usam fetch/query
- Verificar presenca de condicional `isLoading` ou `isPending` renderizando skeleton/spinner
- Fetch sem loading state → ERRO

### 2. Verificar spinner full-page
- Grep `Spinner|LoadingSpinner|CircularProgress` em paginas (nao em botoes) → AVISO

### 3. Verificar double submit
- Glob formularios — verificar se botao de submit tem `disabled={isSubmitting}` ou equivalente → AVISO se ausente

### 4. Verificar window.confirm e window.alert
- Grep `window\.confirm\(|window\.alert\(` → ERRO

### 5. Verificar empty states
- Glob listas (map, Table, List components)
- Verificar condicional para array vazio com JSX → AVISO se ausente

### 6. Verificar error states
- Glob componentes com fetch
- Verificar condicional `isError|error` com JSX de feedback → AVISO se ausente

### 7. Verificar erros silenciosos
- Grep `catch.*\{\s*\}` ou `catch.*console\.log` em componentes (sem setError ou toast) → ERRO

### 8. Verificar acessibilidade basica
- Grep `<img` sem `alt=` → ERRO
- Grep botoes com apenas icone sem `aria-label` → AVISO
- Grep `outline:\s*none|outline:\s*0` sem `outline.*focus` substituto → AVISO
- Grep `<a.*>clique aqui|<a.*>aqui<|<a.*>link<` → AVISO

### 9. Verificar mensagens de erro tecnicas
- Grep strings como `"Network Error"|"TypeError"|"undefined is not"` em JSX → ERRO

## CLASSIFICACAO
- **ERRO**: Fetch sem loading state, window.confirm/alert, erro silencioso, mensagem tecnica ao usuario, img sem alt, tela em branco sem loader
- **AVISO**: Spinner full-page, lista sem empty state, botao sem aria-label, double submit possivel, foco sem outline

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de UX

### Acessibilidade (a11y) Formal
[Se detectado: 3+ problemas de acessibilidade basica]
- **Situacao**: X problemas de acessibilidade detectados (alt ausente, aria-label faltando, foco invisivel)
- **Sugestao**: Criar ADR de Acessibilidade definindo nivel de conformidade WCAG alvo (AA recomendado) e ferramentas de auditoria
- **Como**: `/architect` → criar ADR de Accessibility Strategy
- **Beneficio**: Inclusao, requisito legal em varios mercados, melhor SEO

### Design System de UX Patterns
[Se detectado: patterns de loading/error/empty inconsistentes entre features]
- **Situacao**: X features com patterns de loading/error/empty implementados de forma diferente
- **Sugestao**: Criar componentes canonicos de estado (LoadingState, ErrorState, EmptyState) no Design System
- **Como**: `/ds-component` → adicionar componentes de estado ao DS
- **Beneficio**: Consistencia visual, menos codigo duplicado, UX previsivel para o usuario

### Otimistic UI
[Se detectado: acoes que esperam confirmacao do servidor antes de atualizar a UI em fluxos de alta frequencia]
- **Situacao**: Acoes do usuario com latencia visivel onde Optimistic UI melhoraria a experiencia
- **Sugestao**: Avaliar Optimistic Updates para acoes de alta frequencia (toggle, like, reorder)
- **Como**: `/architect` → criar ADR de Optimistic UI Strategy
- **Beneficio**: UI responsiva instantanea, melhor percepcao de performance
```

Emitir apenas as secoes com evidencia no codigo.
