---
name: check-tests
description: Valida patterns de teste — AAA, naming, cobertura, mocks, isolamento de testes de integracao. Detecta testes sem assertions, nomes ruins, mocks excessivos e ausencia de testes em caminhos criticos.
tools: Read, Glob, Grep, Bash
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Estrutura e Naming
- Todo teste deve seguir o padrao AAA (Arrange-Act-Assert) — seccoes visivelmente separadas
- Naming obrigatorio: `MethodName_Scenario_ExpectedBehavior` (ex: `CreateOrder_WithEmptyItems_ThrowsValidationException`)
- Proibido: nomes genericos (`Test1`, `TestCreate`, `ShouldWork`, `Method_Test`)
- Uma classe de teste por classe testada (`OrderTests` testa `Order`)

### Assertions e Qualidade
- Todo teste deve ter pelo menos uma assertion
- Proibido: testes que sempre passam (assertion trivial como `Assert.True(true)`, assertion em variavel nao relacionada ao Act)
- Proibido: multiplos Acts em um unico teste (testar mais de uma coisa por metodo)
- Assertions devem verificar o resultado do Act, nao detalhes de implementacao interna

### Mocking
- Mockar apenas dependencias externas (repositorios, servicos externos, IDateTimeProvider)
- Proibido: mockar classes de dominio proprias (Entities, Aggregates, Value Objects) — usar objetos reais
- Proibido: mockar o que voce possui desnecessariamente — se e seu codigo, teste com o real
- Mocks devem verificar interacoes relevantes, nao todos os metodos chamados

### Cobertura por Camada
- Domain: minimo 90% branch coverage (nucleo do negocio — cada invariante deve ter teste)
- Application/UseCases: minimo 80% branch coverage (caminho feliz + caminhos de erro)
- Infrastructure: testes de integracao preferencialmente (nao mockar o banco)
- Endpoints/Controllers: testes de integracao cobrindo pipeline completo

### Testes de Integracao
- Testes de integracao devem usar banco de dados real (container, in-memory compativel ou test database)
- Proibido: mockar banco de dados em testes de integracao de repositorio
- Cada teste de integracao deve limpar o estado antes ou depois da execucao (sem dependencia de ordem)
- Fixture de banco deve ser resetada entre testes ou usar transacao rollback

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre testes, cobertura, integration test strategy, test fixtures. Aplicar regras OBRIGATORIO/PROIBIDO definidas. Carregar `docs/project/learnings/backend-learnings.md` para verificar patterns de teste ja identificados no projeto.

## EXECUCAO

### 1. Mapear arquivos de teste
- Glob `**/*Test*.cs`, `**/*Tests.cs`, `**/*Spec*.cs`, `**/*spec.ts`, `**/*.test.ts`, `**/__tests__/**` (ajustar por linguagem)
- Contar total de arquivos de teste vs arquivos de producao

### 2. Verificar naming
- Para cada metodo de teste: verificar se segue `MethodName_Scenario_ExpectedBehavior`
- Grep nomes genericos: `Test\d+|TestCreate|TestUpdate|ShouldWork|Method_Test` → AVISO

### 3. Verificar assertions
- Grep metodos de teste sem chamada de assert/should/expect/verify
- Grep `Assert.True(true)|Assert.IsTrue(true)|expect(true).toBe(true)` → ERRO (assertion trivial)

### 4. Verificar mocks de classes proprias
- Grep `Mock<Order>|Mock<Customer>|Mock<.*Entity>|Mock<.*Aggregate>` → AVISO
- Grep `mock.*domain|stub.*entity` → AVISO

### 5. Verificar isolamento em testes de integracao
- Glob arquivos de integration tests
- Verificar presenca de setup/teardown de banco (`BeforeEach`, `Setup`, `Cleanup`, `Dispose`, `RollbackTransaction`)
- Ausencia de cleanup em testes de integracao → AVISO

### 6. Verificar mock de banco em testes de integracao
- Grep `InMemoryDatabase|MockRepository|FakeRepository` em arquivos de integration test → AVISO

### 7. Executar coverage (se disponivel)
- Tentar rodar `dotnet test --collect:"XPlat Code Coverage"` ou equivalente
- Se coverage disponivel, verificar targets por camada
- Se nao disponivel, registrar como AVISO (ausencia de ferramenta de coverage configurada)

### 8. Verificar caminhos criticos sem teste
- Identificar Use Cases e Aggregate methods sem arquivo de teste correspondente
- Metodos de negocio sem cobertura de teste → AVISO

## CLASSIFICACAO
- **ERRO**: Teste sem assertion, assertion trivial, mock de banco em integration test sem justificativa
- **AVISO**: Naming inconsistente, mock de classe de dominio propria, ausencia de cleanup em integration test, caminho critico sem cobertura

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de Testes

### Integration Test Strategy
[Se detectado: testes de repositorio mockando banco, ou ausencia de testes de integracao]
- **Situacao**: X repositorios testados com mocks de banco, sem validacao do comportamento real de persistencia
- **Sugestao**: Criar ADR de Integration Test Strategy definindo: database container (Testcontainers, SQLite in-memory), fixtures, cleanup strategy
- **Como**: `/architect` → criar ADR de Integration Test Strategy
- **Beneficio**: Testes que encontram bugs reais de persistencia, migracao e query

### Contract Testing
[Se detectado: multiplos servicos ou bounded contexts se comunicando sem testes de contrato]
- **Situacao**: Comunicacao entre servicos sem garantia de compatibilidade de contrato
- **Sugestao**: Avaliar consumer-driven contract testing (Pact ou equivalente) para APIs publicas
- **Como**: `/architect` → criar ADR de Contract Testing
- **Beneficio**: Detecta breaking changes antes do deploy, desacopla ciclos de release

### Mutation Testing
[Se detectado: cobertura de linha alta mas suspeita de testes de baixo valor]
- **Situacao**: Cobertura numericamente boa mas patterns de assertions fracas detectados
- **Sugestao**: Avaliar mutation testing (Stryker.NET, PITest) para validar qualidade real dos testes
- **Como**: `/architect` → criar ADR de Mutation Testing como gate de qualidade
- **Beneficio**: Descobre testes que passam mesmo com bugs — cobertura que realmente protege
```

Emitir apenas as secoes com evidencia no codigo.
