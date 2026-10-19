---
name: check-structure
description: Valida estrutura de pastas frontend, imports, barrels e coesao de modulos. Verifica feature-first, imports cruzados, uso de shared/ e oportunidades de modularizacao.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho do frontend ou "geral"

## REGRAS EMBUTIDAS

### Estrutura Feature-First
- Cada feature em `src/features/<name>/` com: `components/`, `hooks/`, `api.ts` (ou `services/`), `store.ts` (se houver estado), `types.ts`, `index.ts` — `pages/` (ou `views/`) so quando a feature tem rota propria e o projeto decidiu assim
- Features sao unidades autonomas — sem dependencia cruzada entre features
- Proibido: `features/<A>` importar de `features/<B>` — comunicacao via shared/ ou state global
- Barrel exports obrigatorios: cada feature deve ter `index.ts` exportando API publica

### Shared
- `shared/` contem apenas codigo usado por 3+ features
- Proibido: logica de negocio especifica de uma feature em `shared/`
- `shared/` deve ser subdividido: `shared/components/`, `shared/hooks/`, `shared/utils/`, `shared/types/`
- Componentes em `shared/` devem ser genericos (sem conhecimento de dominio especifico)

### Organizacao de Arquivos
- Um componente por arquivo (exceto componentes pequenos auxiliares no mesmo arquivo)
- Nome do arquivo = nome do componente (PascalCase para componentes, camelCase para hooks/utils)
- Proibido: `index.tsx` para componentes (dificulta navegacao e busca no editor) — usar nome do componente
- Hooks customizados em `hooks/` com prefixo `use`

### Imports
- Imports de terceiros antes de imports internos (organizacao padrao)
- Path aliases obrigatorios para imports de `shared/` e entre features (nao `../../../shared/`)
- Proibido: imports circulares entre modulos

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre estrutura de pastas, monorepo, modularizacao. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar convencoes ja definidas no projeto.

## EXECUCAO

### 1. Mapear estrutura
- Glob `src/features/*/` para listar features existentes
- Para cada feature: verificar subdiretorios esperados (components/, hooks/, types.ts, index.ts)

### 2. Verificar imports cruzados entre features
- Para cada feature A: grep imports de outras features (`from ['"].*features/(?!A)`) **e** resolver os imports relativos — `'../../<outra>/...'` nao contem a palavra `features/`, mas sai da pasta da feature
- Import cruzado entre features → ERRO

### 3. Verificar shared/ com logica de dominio
- Ler arquivos em `shared/` e verificar se contem logica especifica de uma feature
- Logica de dominio em shared/ → ERRO

### 4. Verificar barrels (index.ts)
- Para cada feature: verificar existencia de `index.ts`
- Feature sem barrel → AVISO

### 5. Verificar index.tsx como nome de componente
- Glob `src/features/**/index.tsx`, `src/shared/**/index.tsx`
- Componente em index.tsx (sem ser barrel) → AVISO

### 6. Verificar hooks fora de hooks/
- Glob `src/**/*.ts` com prefixo `use` fora de diretorios `hooks/` → AVISO

### 7. Verificar imports relativos profundos para shared
- Grep `from ['"]\.\..*shared\/` → AVISO (usar path alias)

### 7b. Verificar uso real de shared/
- Item de `shared/` importado por menos de 3 features → AVISO (a regra: extrair para shared/ so com 3+ consumidores)

### 8. Verificar coesao de shared/
- Verificar se shared/ e subdividido por tipo
- `shared/` flat sem subdiretorios em projeto com 5+ shared items → AVISO

## CLASSIFICACAO
- **ERRO**: Import cruzado entre features, logica de dominio em shared/
- **AVISO**: Feature sem index.ts, componente em index.tsx, hook fora de hooks/, import relativo para shared, shared/ sem subdivisao, item de shared/ com menos de 3 consumidores

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao Arquitetural

### Monorepo / Workspace
[Se detectado: projeto frontend crescendo com 5+ features grandes e necessidade de compartilhar logica com outras apps]
- **Situacao**: X features com logica que poderia ser compartilhada com outras aplicacoes ou libs
- **Sugestao**: Avaliar migracao para monorepo (Turborepo, Nx) com workspace packages
- **Como**: `/architect` → criar ADR de Monorepo Strategy
- **Beneficio**: Compartilhamento de codigo tipado entre apps, build incremental, versioning independente

### Micro-frontends
[Se detectado: features muito independentes com times diferentes ou ciclos de deploy diferentes]
- **Situacao**: Features com ownership diferente sendo deployadas em conjunto forcadamente
- **Sugestao**: Avaliar Module Federation ou micro-frontends para features com deploys independentes
- **Como**: `/architect` → criar ADR de Micro-frontend Strategy (apenas se realmente necessario)
- **Beneficio**: Deploy independente por feature, isolamento de falhas, times autonomos

### Lazy Loading por Feature
[Se detectado: todas as features importadas estaticamente no bundle principal]
- **Situacao**: Bundle inicial carrega X features que nao sao necessarias no primeiro render
- **Sugestao**: Criar ADR de Code Splitting Strategy definindo quais rotas/features sao lazy-loaded
- **Como**: `/architect` → criar ADR de Bundle Strategy
- **Beneficio**: Bundle inicial menor, First Contentful Paint mais rapido
```

Emitir apenas as secoes com evidencia no codigo.
