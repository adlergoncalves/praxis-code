---
name: check-typescript
description: Valida configuracao TypeScript strict, uso de tipos, generics e type safety. Detecta any, ts-ignore, tipos implicitos e oportunidades de melhorar type safety.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Configuracao
- `strict: true` obrigatorio em tsconfig.json
- `noUncheckedIndexedAccess: true` recomendado — acesso a array retorna `T | undefined`
- `noImplicitReturns: true` recomendado — toda funcao deve retornar explicitamente
- `exactOptionalPropertyTypes: true` recomendado — diferencia propriedade ausente de `undefined`
- Proibido: `"skipLibCheck": true` sem justificativa (esconde erros de tipos de libs)

### Tipos
- Proibido: `any` explicito em declaracoes de tipo — usar `unknown` e narrowing
- Proibido: `as any` — casting inseguro elimina type safety
- Proibido: `@ts-ignore` — usar `@ts-expect-error` com comentario obrigatorio explicando motivo
- Proibido: funcoes sem tipo de retorno declarado quando nao obvio pelo contexto
- Proibido: `object` generico — usar interface ou tipo especifico
- Proibido: `Function` como tipo — usar assinatura especifica `(param: Type) => ReturnType`

### Imports e Aliases
- Imports relativos com 3+ niveis (`../../../`) → usar path aliases (`@/features/`, `@/shared/`)
- Proibido: arquivos `.js` ou `.jsx` em projeto TypeScript (exceto configs)
- Tipos compartilhados entre features → definir em `shared/types/` ou barrel do modulo

### Generics e Narrowing
- Evitar type assertions (`as Type`) quando narrowing resolve (`typeof`, `instanceof`, discriminated unions)
- Preferir generics a duplicar tipos similares

### Enums
- Preferir `const enum` ou `as const` objects a `enum` regular (evita emissao de JS desnecessaria)
- Proibido: `enum` numerico sem valor explicito (fragil a reordenacao)

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre TypeScript, type safety, generics. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar correcoes ja identificadas no projeto.

## EXECUCAO

### 1. Verificar tsconfig.json
- Ler `tsconfig.json` (ou `tsconfig.base.json`, `tsconfig.app.json`)
- Verificar presenca de `strict: true` → ERRO se ausente ou false
- Verificar `noUncheckedIndexedAccess`, `noImplicitReturns` → AVISO se ausentes
- Verificar `skipLibCheck: true` → AVISO se presente sem justificativa

### 2. Verificar any
- Grep `: any\b|<any>|as any` em arquivos .ts e .tsx (excluir node_modules, dist) → ERRO

### 3. Verificar @ts-ignore e @ts-expect-error
- Grep `@ts-ignore` → ERRO (usar @ts-expect-error com comentario)
- Grep `@ts-expect-error` sem linha de comentario antes → AVISO

### 4. Verificar imports relativos profundos
- Grep `from ['"]\.\.\/\.\.\/\.\.\/` → AVISO (3+ niveis)

### 5. Verificar arquivos .js/.jsx
- Glob `src/**/*.js` e `src/**/*.jsx` → AVISO se encontrados em projeto TS

### 6. Verificar tipos genericos proibidos
- Grep `: object\b|: Function\b|: Object\b` em declaracoes de tipo → AVISO

### 7. Verificar enum numerico sem valor
- Grep `enum.*\{[^=]*\}` (enum sem = nos valores) → AVISO

### 8. Verificar type assertions excessivas
- Grep `as [A-Z][a-zA-Z]+` em arquivos de logica (nao apenas em testes) → contar ocorrencias, muitas = AVISO

## CLASSIFICACAO
- **ERRO**: any explicito, as any, @ts-ignore, strict:false
- **AVISO**: imports relativos 3+ niveis, .js em projeto TS, object/Function como tipo, @ts-expect-error sem comentario, noUncheckedIndexedAccess ausente

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de Type Safety

### Strict Mode Completo
[Se detectado: strict:true mas flags adicionais de seguranca ausentes]
- **Situacao**: TypeScript strict ativo mas noUncheckedIndexedAccess e noImplicitReturns desativados
- **Sugestao**: Criar ADR de TypeScript Config definindo conjunto completo de flags e justificativa de cada escolha
- **Como**: `/architect` → criar ADR de TypeScript Configuration
- **Beneficio**: Captura bugs de null/undefined em acesso a arrays e retornos implicitos

### Branded Types / Nominal Typing
[Se detectado: IDs de entidades diferentes trocaveis entre si (userId passado onde orderId esperado)]
- **Situacao**: IDs representados como `string` ou `number` sem diferenciacao de tipo
- **Sugestao**: Avaliar Branded Types para IDs de entidades de dominio
- **Beneficio**: Impossivel passar `UserId` onde `OrderId` e esperado — bug detectado em compile time

### Schema Validation com Inferencia de Tipo (Zod)
[Se detectado: tipos de API response definidos manualmente sem validacao em runtime]
- **Situacao**: Tipos de resposta de API apenas como interface TS sem validacao de runtime
- **Sugestao**: Adotar Zod (ou equivalente) para validar e inferir tipos de boundaries externos
- **Como**: `/architect` → criar ADR de Runtime Type Validation
- **Beneficio**: Type safety em runtime para dados externos (API, localStorage, forms)
```

Emitir apenas as secoes com evidencia no codigo.
