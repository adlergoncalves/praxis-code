---
name: check-naming
description: Valida convencoes de nomes em qualquer linguagem OO — classes, metodos, variaveis, sufixos. Detecta nomes genericos, abreviacoes, inconsistencias e violacoes de linguagem ubiqua do dominio.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Convencoes Gerais (OO)
- Classes e Interfaces: PascalCase
- Metodos e Propriedades: PascalCase (C#/Java) ou camelCase (TypeScript/JS)
- Parametros e variaveis locais: camelCase
- Constantes e campos readonly estaticos: UPPER_SNAKE_CASE ou PascalCase (conforme convencao da linguagem)
- Arquivos: mesmo nome da classe principal que contem

### Sufixos Obrigatorios por Tipo
- Use Cases / Handlers de comando: `{Verbo}{Entidade}UseCase` ou `{Verbo}{Entidade}Handler`
- Repositorios: `{Entidade}Repository`
- Validators: `{Entidade}Validator` ou `{Request}Validator`
- Requests/DTOs de entrada: `{Acao}{Entidade}Request` ou `{Acao}{Entidade}Command`
- Responses/DTOs de saida: `{Entidade}Response` ou `{Entidade}Dto`
- Controllers/Endpoints: `{Entidade}Controller` ou `{Entidade}Endpoints`
- Domain Events: `{Entidade}{Fato}Event` (ex: `OrderCreatedEvent`, `PaymentApprovedEvent`)
- Exceptions: `{Motivo}Exception` com sufixo Exception
- Interfaces: prefixo `I` (C#/Java) — `IOrderRepository`, `IUseCase`

### Nomes Proibidos (Genericos sem Contexto)
- `Manager` como sufixo sem qualificador de dominio (ex: `UserManager` sem contexto claro e ambiguo — preferir `UserRegistrationService`, `SessionManager`)
- `Helper`, `Utils`, `Utilities` como classe com multiplos metodos sem coesao
- `Data`, `Info`, `Model` como sufixo em entidades de dominio (ex: `UserData`, `OrderInfo` — usar `User`, `Order`)
- `Service` como sufixo sem qualificador claro do que faz (ex: `UserService` — preferir `UserAuthenticationService`, `UserNotificationService`)
- Variaveis de uma letra exceto: `i`, `j`, `k` em loops, `e` em catch, `_` em discard
- Abreviacoes nao universais (ex: `usrNm` para `userName`, `ord` para `order`)

### Linguagem Ubiqua
- Nomes de classes e metodos devem refletir o vocabulario do dominio definido no glossario
- Proibido: termos tecnicos genéricos onde existe termo de dominio (ex: `process()` quando o negocio chama de `approve()`)
- Consistencia: o mesmo conceito de negocio deve ter o mesmo nome em todo o codigo

### Verbos em Metodos
- Metodos de comando (mutam estado): verbos imperativos de negocio (`Approve`, `Cancel`, `Submit`, `AddItem`)
- Metodos de query (retornam valor sem mudar estado): `Get`, `Find`, `Calculate`, `Is`, `Has`, `Can`
- Proibido: `Update`, `Set`, `Process`, `Handle` como verbo principal sem qualificador (muito generico)

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre naming conventions. Carregar `docs/project/glossary.md` para verificar linguagem ubiqua do projeto. Carregar `docs/project/learnings/backend-learnings.md` para aplicar correcoes de naming ja identificadas anteriormente.

## EXECUCAO

### 1. Verificar sufixos de tipo
- Glob classes de Use Cases: verificar sufixo `UseCase` ou `Handler`
- Glob interfaces de Repository: verificar sufixo `Repository`
- Glob Domain Events: verificar sufixo `Event`
- Glob Validators: verificar sufixo `Validator`
- Inconsistencias → AVISO (ex: `CreateOrderService` onde deveria ser `CreateOrderUseCase`)

### 2. Detectar nomes genericos
- Grep `class.*Manager\b|class.*Helper\b|class.*Utils\b|class.*Utilities\b` → AVISO se sem qualificador de dominio claro
- Grep `class.*Service\b` → verificar se o nome e especifico o suficiente
- Grep `class.*Data\b|class.*Info\b|class.*Model\b` em dominio → AVISO

### 3. Verificar variaveis de uma letra fora de loops
- Grep variaveis de uma letra em metodos (exceto i, j, k, e, _) → AVISO

### 4. Verificar abreviacoes
- Grep abreviacoes comuns nao-universais: `\bord\b|\busr\b|\bprd\b|\bcust\b|\binv\b` em nomes de variaveis → AVISO

### 5. Verificar consistencia de linguagem ubiqua
- Se `docs/project/glossary.md` existe: verificar se termos do glossario sao usados consistentemente no codigo
- Detectar sinonimos para o mesmo conceito: ex: `Customer` e `Client` referindo ao mesmo agregado → AVISO

### 6. Verificar verbos genericos em metodos de dominio
- Grep `void Process\(|void Handle\(|void Update\(|void Set[A-Z]` em classes de dominio → AVISO (preferir verbo de negocio)

### 7. Verificar nome de arquivo vs classe
- Para cada arquivo de codigo: verificar se nome do arquivo corresponde ao nome da classe principal
- Inconsistencia → AVISO

## CLASSIFICACAO
- **ERRO**: Sufixo inconsistente em tipo critico (UseCase chamado de Service), abreviacao em nome de entidade de dominio
- **AVISO**: Nome generico sem qualificador, verbo generico em metodo de dominio, inconsistencia de linguagem ubiqua, variavel de uma letra fora de loop

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao

### Glossario e Linguagem Ubiqua
[Se detectado: sinonimos para o mesmo conceito, ou ausencia de glossario com projeto ja com dominio definido]
- **Situacao**: X termos com sinonimos detectados (ex: Customer/Client, Order/Purchase usados alternadamente)
- **Sugestao**: Criar ou atualizar `docs/project/glossary.md` com linguagem ubiqua consolidada e aplicar consistently
- **Como**: `/discovery` para levantamento ou editar o glossario diretamente
- **Beneficio**: Onboarding mais rapido, comunicacao sem ambiguidade entre time e stakeholders

### Convencoes de Naming Formalizadas
[Se detectado: sufixos inconsistentes em mais de 3 tipos diferentes]
- **Situacao**: Inconsistencia de sufixos em X tipos (UseCase vs Service vs Handler vs Manager)
- **Sugestao**: Criar ADR de Naming Conventions formalizando sufixos obrigatorios por tipo para o projeto
- **Como**: `/architect` → criar ADR de Naming Conventions
- **Beneficio**: Codigo previsivel, busca por tipo trivial, onboarding mais rapido
```

Emitir apenas as secoes com evidencia no codigo.
