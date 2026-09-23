# ADR-NNNN: Feature-First Project Structure

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Projetos frontend crescem rapidamente e a organizacao por tipo de arquivo (components/, hooks/, services/) se torna insustentavel. Encontrar todos os arquivos de uma funcionalidade exige navegar multiplas pastas. A coesao cai e o acoplamento entre features aumenta silenciosamente.

Uma organizacao por feature agrupa tudo o que pertence a uma capacidade do produto em um unico diretorio, facilitando manutencao, code review e exclusao segura de funcionalidades.

## Decisao
Adotar estrutura feature-first em `src/features/<name>/`:

```
src/
  features/
    <feature-name>/
      components/       # Componentes React da feature
      hooks/            # Hooks especificos da feature
      api.ts            # Chamadas HTTP da feature
      store.ts          # Estado local (Zustand ou equivalente)
      types.ts          # Tipos TypeScript da feature
      index.ts          # Barrel export (API publica da feature)
      *.test.tsx        # Testes colocalizados
```

**Codigo compartilhado:** Somente apos 3+ features utilizarem o mesmo codigo, extrair para `shared/`. Codigo em `shared/` nao deve conter logica de dominio.

**Imports entre features:** Estritamente proibidos. Se feature A precisa de algo de feature B, o codigo deve ser promovido para `shared/` ou a arquitetura deve ser revista.

## Alternativas Consideradas
1. **Organizacao por tipo** (`components/`, `hooks/`, `pages/`): Simples no inicio, mas escala mal. Dificil entender o escopo de uma feature.
2. **Organizacao por dominio/modulo** (DDD-style): Similar a feature-first, mas com mais cerimonia. Adequado para projetos maiores com dominio complexo.
3. **Flat structure** (tudo em `src/`): Inviavel para qualquer projeto nao-trivial.

## Consequencias
### Positivas
- Alta coesao: todos os arquivos de uma feature estao juntos
- Facil de deletar features inteiras sem efeitos colaterais
- Code review focado: PRs tocam poucos diretorios
- Onboarding mais rapido: desenvolvedores encontram tudo em um lugar
- Barrel exports (`index.ts`) definem a API publica da feature

### Negativas
- Exige disciplina para nao criar imports cruzados entre features
- Codigo utilitario pode ser duplicado antes de atingir o threshold de 3 features
- Estrutura inicial pode parecer excessiva para features muito pequenas

## Regras para Validacao
- PROIBIDO: Importar de `features/<A>` dentro de `features/<B>`
- PROIBIDO: Colocar logica de dominio/negocio em `shared/`
- OBRIGATORIO: Cada feature deve ter `index.ts` como barrel export
- OBRIGATORIO: Nenhum import cruzado entre features
- PREFERIDO: Extrair para `shared/` somente apos 3+ features utilizarem o mesmo codigo
