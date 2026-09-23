# ADR-NNNN: Naming Conventions

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Convencoes de nomenclatura inconsistentes geram confusao, dificultam a navegacao no codigo e aumentam o tempo necessario para entender a base de codigo. Nomes claros e padronizados funcionam como documentacao viva, reduzindo a necessidade de comentarios e facilitando o onboarding de novos membros da equipe.

## Decisao
Adotar convencoes universais de nomenclatura aplicaveis a qualquer linguagem ou framework, com regras especificas por contexto.

### Casing por Contexto

| Contexto | Convencao | Exemplo |
|---|---|---|
| Classes, Interfaces, Types, Enums | PascalCase | `UserRepository`, `IPaymentService` |
| Variaveis, parametros, propriedades | camelCase | `userName`, `orderTotal` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| Arquivos de componente/classe | PascalCase | `UserProfile.tsx`, `OrderService.cs` |
| Arquivos utilitarios/helpers | camelCase | `formatDate.ts`, `stringUtils.ts` |
| Arquivos de configuracao | kebab-case | `eslint-config.js`, `docker-compose.yml` |

### Regras de Nomeacao

#### Nomes Significativos
- Nomes devem revelar intencao sem necessidade de comentarios
- Evitar nomes de uma unica letra (exceto variaveis de loop como `i`, `j`, `k`)
- Evitar abreviacoes (`usr` -> `user`, `btn` -> `button`, `msg` -> `message`)
- Nomes de funcoes/metodos devem ser verbos ou frases verbais (`getUserById`, `calculateTotal`)
- Nomes de classes devem ser substantivos (`OrderProcessor`, `UserValidator`)

#### Booleanos
Prefixos obrigatorios para variaveis e propriedades booleanas:
- `is` — estado atual (`isActive`, `isVisible`, `isLoading`)
- `has` — posse/existencia (`hasPermission`, `hasChildren`)
- `can` — capacidade (`canEdit`, `canDelete`)
- `should` — recomendacao/condicao (`shouldRetry`, `shouldValidate`)

#### Colecoes
- Pluralizar nomes de arrays e listas (`users`, `orderItems`)
- Maps e dicionarios: usar prefixo que indique o mapeamento (`userById`, `ordersByStatus`)

#### Arquivos
- Nome do arquivo deve corresponder a entidade principal exportada
- Um arquivo = uma responsabilidade principal
- Testes colocados junto ao arquivo testado com sufixo `.test` ou `.spec`

### Anti-patterns de Nomenclatura
- Prefixos/sufixos de tipo redundantes (`strName`, `nameString`)
- Nomes genericos (`data`, `info`, `temp`, `result`, `value`, `item`) sem contexto
- Numeros em nomes (`handler2`, `processV2`) — indicam necessidade de refatoracao
- Negacoes duplas (`isNotInvalid` -> `isValid`)

## Alternativas Consideradas

### Cada equipe define suas convencoes
- **Pro:** Autonomia das equipes
- **Contra:** Inconsistencia entre modulos, dificuldade de mobilidade

### Adotar convencoes especificas de cada linguagem apenas
- **Pro:** Segue idiomas naturais de cada ecossistema
- **Contra:** Inconsistencia em projetos multi-linguagem

### Convencoes universais + adaptacoes por linguagem (escolhida)
- **Pro:** Base consistente com flexibilidade para idiomas especificos
- **Contra:** Requer documentacao por linguagem adotada

## Consequencias
### Positivas
- Codigo auto-documentado, reduzindo necessidade de comentarios
- Navegacao e busca mais eficientes na base de codigo
- Onboarding acelerado para novos membros
- Diffs mais legiveis em code reviews

### Negativas
- Renames iniciais em codigo existente
- Divergencia ocasional com convencoes de bibliotecas terceiras
- Discussoes de estilo durante a adocao inicial

## Regras para Validacao
- PROIBIDO: Variaveis de uma unica letra fora de loops (`for`, `while`, `map`)
- PROIBIDO: Abreviacoes em nomes de classes, metodos ou variaveis publicas
- PROIBIDO: Nomes genericos sem qualificador (`data`, `info`, `temp`, `result`)
- PROIBIDO: Negacoes duplas em booleanos (`isNotDisabled`, `isNotInvalid`)
- PROIBIDO: Numeros sequenciais em nomes (`handler2`, `processV3`)
- OBRIGATORIO: PascalCase para classes, interfaces, types e enums
- OBRIGATORIO: camelCase para variaveis, parametros e propriedades
- OBRIGATORIO: UPPER_SNAKE_CASE para constantes
- OBRIGATORIO: Prefixo `is`, `has`, `can` ou `should` em booleanos
- OBRIGATORIO: Nome do arquivo corresponde a entidade principal exportada
- PREFERIDO: Nomes de funcoes como verbos ou frases verbais
- PREFERIDO: Nomes de classes como substantivos
- PREFERIDO: Colecoes no plural
