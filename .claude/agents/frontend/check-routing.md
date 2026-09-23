---
name: check-routing
description: Valida patterns de rotas — URLs semanticas, navegacao via router, lazy loading, CRUD pattern e protecao de rotas autenticadas.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Navegacao
- Proibido: `window.location.href` em componentes — usar hook de navegacao do router (`useNavigate`, `useRouter`, `router.push`)
- Proibido: `<a href="...">` para rotas internas — usar componente `<Link>` do router
- Proibido: reload de pagina para navegacao interna

### URLs e Estrutura de Rotas
- CRUD pattern obrigatorio: 3 rotas por entidade
  - `/entities` → lista
  - `/entities/new` → criacao
  - `/entities/:id` → detalhe/edicao (mesma tela, modo determinado pelo estado)
- Proibido: `/view/:id` e `/edit/:id` como rotas separadas para a mesma entidade
- URLs em kebab-case (nao camelCase ou snake_case)
- Parametros de ID em path, filtros e paginacao em query string

### Lazy Loading
- Rotas devem ser lazy-loaded (`React.lazy`, `dynamic()` no Next.js, ou equivalente)
- Excecao: rota inicial (home/dashboard) pode ser eager para melhor FCP
- Suspense boundary obrigatorio ao usar lazy loading

### Protecao de Rotas
- Rotas autenticadas devem ter guard/middleware de autenticacao
- Redirect para login quando nao autenticado (nao apenas ocultar o link)
- Redirect para pagina correta apos login (preservar `returnUrl` ou equivalente)

### Organizacao
- Definicao de rotas centralizada (nao espalhada em varios pontos da aplicacao)
- Rotas aninhadas usando layout compartilhado quando apropriado

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre routing, URL patterns, autenticacao de rotas. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar convencoes de rota ja definidas no projeto.

## EXECUCAO

### 1. Verificar window.location
- Grep `window\.location` em arquivos .tsx → ERRO

### 2. Verificar links internos com <a>
- Grep `<a\s+href=["']/` em .tsx (link interno com tag <a>) → AVISO (usar <Link>)

### 3. Verificar rotas /view e /edit separadas
- Grep `path.*\/view\/|path.*\/edit\/|route.*view|route.*edit` na definicao de rotas → ERRO

### 4. Verificar URLs em camelCase/snake_case
- Grep `path.*[a-z][A-Z]|path.*_[a-z]` em definicao de rotas → AVISO

### 5. Verificar lazy loading
- Glob arquivo(s) de definicao de rotas
- Verificar proporcao de rotas com `React.lazy` ou `dynamic()` vs importacao direta
- Mais de 3 rotas sem lazy loading → AVISO

### 6. Verificar Suspense boundary
- Grep `React.lazy|lazy(` sem `<Suspense` proximo → AVISO

### 7. Verificar protecao de rotas
- Identificar rotas que deveriam ser autenticadas (dashboard, perfil, admin)
- Verificar se existe PrivateRoute, AuthGuard, middleware de auth ou verificacao no layout
- Rota claramente privada sem protecao detectada → AVISO

### 8. Verificar centralizacao de rotas
- Verificar se definicao de rotas esta em arquivo(s) dedicados vs espalhada em componentes
- Rotas definidas dentro de componentes de pagina → AVISO

## CLASSIFICACAO
- **ERRO**: window.location em componente, rotas /view/:id e /edit/:id separadas
- **AVISO**: Link interno com <a>, URL em camelCase, rotas sem lazy loading, Suspense sem boundary, rota privada sem guard, rotas espalhadas

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao

### File-based Routing
[Se detectado: projeto Next.js/Remix sem aproveitar file-based routing, ou muita configuracao manual de rotas]
- **Situacao**: Rotas definidas manualmente quando o framework suporta file-based routing
- **Sugestao**: Migrar para convencao de file-based routing do framework
- **Beneficio**: Menos boilerplate, convencao clara, code splitting automatico por rota

### Route Guards Centralizados
[Se detectado: verificacoes de autenticacao duplicadas em multiplas rotas ou componentes]
- **Situacao**: X rotas com verificacoes de auth duplicadas
- **Sugestao**: Criar ADR de Route Protection Strategy centralizando guards
- **Como**: `/architect` → criar ADR de Authentication / Route Guards
- **Beneficio**: Logica de auth em um unico lugar, mais facil de auditar e manter
```

Emitir apenas as secoes com evidencia no codigo.
