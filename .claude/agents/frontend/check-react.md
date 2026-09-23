---
name: check-react
description: Valida patterns React — hooks, composicao, estado, performance, key props. Detecta anti-patterns comuns, re-renders desnecessarios e oportunidades de evolucao arquitetural.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Regras de Hooks
- Proibido: hooks dentro de condicionais (`if (condition) useState(...)`)
- Proibido: hooks dentro de loops ou callbacks aninhados
- `useEffect` com dependencias ausentes — warnings do linter devem ser respeitados, nao suprimidos com comentario
- Proibido: `// eslint-disable-next-line react-hooks/exhaustive-deps` sem justificativa documentada

### Composicao e Estrutura
- Composicao sobre heranca — sem `extends Component` em favor de composicao funcional
- Componentes grandes (mais de 200 linhas) → provavelmente violando SRP, candidato a decomposicao
- Proibido: logica de negocio diretamente em componentes de UI — extrair para hooks customizados
- Props drilling alem de 2 niveis → candidato a Context ou state manager

### Estado
- `useState` para dados de servidor (fetch manual) → substituir por query library (React Query, SWR, Apollo)
- Multiplos `useState` relacionados que mudam juntos → candidato a `useReducer`
- Estado derivado calculado no render sem `useMemo` em listas grandes → candidato a memoizacao

### Navegacao e DOM
- Proibido: `window.location.href` em componentes — usar hook de navegacao do router
- Proibido: `document.querySelector`, `document.getElementById` em componentes — usar refs
- Proibido: manipulacao direta do DOM via `ref.current.style` quando CSS/classes resolvem

### Listas e Keys
- Proibido: `key={index}` em listas cujos itens podem ser reordenados ou removidos
- `key` deve ser ID estavel e unico do item

### React 18+ / 19
- `forwardRef` deprecated no React 19 — usar `ref` como prop diretamente
- `React.FC` com `children` → no React 18+ usar `PropsWithChildren` ou declarar `children` explicitamente

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre React, state management, performance, Suspense, Server Components. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar correcoes ja identificadas no projeto.

## EXECUCAO

### 1. Verificar hooks condicionais
- Grep `if.*use[A-Z]|use[A-Z].*(if|for|while)` em arquivos .tsx → ERRO

### 2. Verificar eslint-disable em hooks
- Grep `eslint-disable.*react-hooks` → AVISO (verificar se tem justificativa)

### 3. Verificar window.location e DOM direto
- Grep `window\.location` em .tsx → ERRO
- Grep `document\.querySelector|document\.getElementById|document\.get` em .tsx → ERRO

### 4. Verificar useState para server data
- Grep padroes: `useState.*\[\]` + `useEffect.*fetch|axios|api\.get` no mesmo componente → AVISO

### 5. Verificar props drilling
- Identificar props que aparecem em 3+ niveis de componente aninhado → AVISO

### 6. Verificar key={index}
- Grep `key=\{.*index\}|key=\{index\}` em listas → AVISO

### 7. Verificar tamanho de componentes
- Para cada arquivo .tsx: contar linhas — acima de 200 → AVISO

### 8. Verificar logica de negocio em componentes
- Componentes com mais de 2 chamadas de API, calculos de negocio ou transformacoes de dados sem hook intermediario → AVISO

### 9. Verificar forwardRef deprecado (React 19)
- Grep `forwardRef` → AVISO se projeto usa React 19+

## CLASSIFICACAO
- **ERRO**: Hooks condicionais, window.location em componente, document.querySelector em componente
- **AVISO**: useState para server data, key={index}, props drilling 3+ niveis, componente com 200+ linhas, logica de negocio em componente

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao Arquitetural

### Server State Management (React Query / SWR)
[Se detectado: useState + useEffect para fetch em 3+ componentes]
- **Situacao**: X componentes gerenciando server state manualmente com useState + useEffect
- **Sugestao**: Criar ADR de Server State Management adotando React Query ou SWR
- **Como**: `/architect` → criar ADR de Data Fetching Strategy
- **Beneficio**: Cache automatico, refetch, loading/error states unificados, sem boilerplate

### Global State Management
[Se detectado: props drilling em 3+ niveis em 2+ features, ou Context sendo abusado para estado mutavel frequente]
- **Situacao**: Props passadas X niveis ou Context causando re-renders excessivos
- **Sugestao**: Avaliar Zustand, Jotai ou Redux Toolkit para estado global
- **Como**: `/architect` → criar ADR de State Management
- **Beneficio**: Estado previsivel, devtools, sem prop drilling

### React Server Components
[Se detectado: projeto Next.js sem uso de Server Components, ou muitos fetches no cliente]
- **Situacao**: Fetches de dados sendo feitos inteiramente no cliente sem aproveitamento de RSC
- **Sugestao**: Avaliar migracao para Server Components em paginas de leitura
- **Como**: `/architect` → criar ADR de RSC Strategy
- **Beneficio**: Bundle menor, dados buscados no servidor, melhor performance inicial
```

Emitir apenas as secoes com evidencia no codigo.
