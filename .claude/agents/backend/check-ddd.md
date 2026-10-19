---
name: check-ddd
description: Valida DDD tactical patterns — aggregates, entities, VOs, encapsulamento, domain events, acoplamento entre agregados. Detecta anemic models, public setters e oportunidades de evolucao arquitetural.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Aggregate Root
- Private setters em todas as propriedades de Entities e Aggregate Roots
- Factory methods obrigatorios para criacao (`Create`, `Register`, `From`) — construtor publico com params e proibido
- Aggregate Root controla todas as modificacoes de seus filhos — filhos nao sao criados ou modificados fora do root
- Referencia entre agregados apenas por ID (ValueObject ou primitivo) — nunca navegacao direta entre agregados
- Um Repository por Aggregate Root — proibido Repository de Entity filha diretamente

### Entities e Value Objects
- Entities com identidade (ID) — igualdade por ID, nao por atributos
- Value Objects imutaveis — sem setters, sem ID proprio, igualdade por atributos
- Validacao no construtor do Value Object — instancia invalida nunca deve existir
- Proibido: primitive obsession em propriedades de dominio criticas (Email, CPF, Money, Status devem ser VOs, nao strings/decimals/enums soltos)

### Modelo Rico (Anti-Anemic)
- Entities devem ter comportamento — metodos com nomes de negocio (`Approve()`, `Cancel()`, `AddItem()`)
- Proibido: classe com apenas getters/setters e sem metodos de comportamento (anemic model)
- Metodos de negocio devem guardar invariantes — validar estado antes de mudar

### Domain Events
- Side effects (envio de email, notificacao, sincronizacao) nao devem ser chamados diretamente pelo Aggregate
- Domain Events publicados pelo Aggregate Root apos mudanca de estado
- Events sao records imutaveis com dados suficientes para o handler processar sem consultar o banco

### Isolamento do Dominio
- Proibido: imports de ORM (DbContext, IDbConnection, EntityFrameworkCore) em classes de Domain
- Proibido: imports de infraestrutura (HttpClient, IConfiguration, ILogger) em Domain
- Proibido: acesso direto ao banco de dados a partir do dominio

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre DDD, Domain Events, CQRS, aggregates. Se existirem, aplicar regras OBRIGATORIO/PROIBIDO definidas.

## EXECUCAO

### 1. Mapear estrutura de dominio
- Glob arquivos em `Domain/`, `Core/`, `Entities/`, `Aggregates/` (ajustar por projeto)
- Identificar Aggregate Roots, Entities e Value Objects

### 2. Verificar encapsulamento
- Grep `public set` em arquivos de dominio → ERRO se encontrado em Entity ou Aggregate
- Grep `new {NomeAgregado}(` fora do proprio arquivo → ERRO se construtor publico com params usado externamente
- Verificar presenca de factory method (`static.*Create|static.*From|static.*Register`)

### 3. Verificar modelo rico
- Para cada Entity/Aggregate: verificar se existe pelo menos um metodo de comportamento alem de getters
- Classes com apenas propriedades e sem metodos → ERRO anemic model

### 4. Verificar referencias entre agregados
- Grep propriedades de navegacao tipadas como outro Aggregate Root (ex: `public Order Order { get; }` dentro de outro agregado)
- Referencia direta entre agregados → ERRO

### 5. Verificar Domain Events
- Detectar side effects diretos em agregados: chamadas a servicos, `ILogger`, `IEmailService`, `HttpClient` dentro de metodos de dominio
- Verificar se existem classes de Domain Event (`*Event`, `*DomainEvent`) ou se o projeto cresce sem elas

### 6. Verificar isolamento
- Grep imports de ORM/infra em arquivos de Domain/
- Grep `DbContext|IDbConnection|EntityFramework` em Domain/ → ERRO

### 7. Verificar Value Objects
- Identificar propriedades string/decimal/int em agregados que representam conceitos de dominio (Email, CPF, CNPJ, Money, Percentage)
- Verificar se existem VOs correspondentes ou se sao primitivos soltos

## CLASSIFICACAO
- **ERRO**: Public setter em entity, DB/infra access em Domain, anemic model, referencia direta entre agregados, construtor publico com params sem factory method
- **AVISO**: Entity sem factory method, filho criado fora do aggregate root, side effect direto sem domain event, primitive obsession em propriedade critica

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao separada com sugestoes contextuais baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao Arquitetural

### Domain Events
[Se detectado side effects diretos ou ausencia total de domain events em projeto com agregados ricos]
- **Situacao**: X agregados com side effects diretos (chamadas a servicos externos em metodos de dominio)
- **Sugestao**: Criar ADR de Domain Events definindo publicacao, contratos e handlers
- **Como**: `/architect` → criar ADR customizada de Domain Events (nao ha template pronto)
- **Beneficio**: Desacopla o dominio de side effects, facilita testes e auditoria

### CQRS
[Se detectado Use Cases com queries e commands misturados, ou repositorios sobrecarregados]
- **Situacao**: Use Cases misturando leitura e escrita, ou repositorios com muitos metodos de query
- **Sugestao**: Avaliar separacao de Read Models (queries otimizadas) dos Write Models (aggregates)
- **Como**: `/architect` → criar ADR de CQRS antes de escalar o numero de queries
- **Beneficio**: Queries de leitura sem overhead do modelo rico, escalabilidade independente

### Value Objects
[Se detectado primitive obsession em 3 ou mais propriedades criticas]
- **Situacao**: X propriedades que representam conceitos de dominio como primitivos (string, decimal)
- **Sugestao**: Criar Value Objects para encapsular validacao e semantica
- **Beneficio**: Validacao garantida por construcao, impossivel criar estado invalido
```

Emitir apenas as secoes relevantes ao que foi encontrado. Nao emitir sugestoes sem evidencia no codigo.
