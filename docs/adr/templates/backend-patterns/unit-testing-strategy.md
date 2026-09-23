# ADR-NNNN: Estrategia de Testes Unitarios

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Testes unitarios sao a primeira linha de defesa contra regressoes e bugs. Sem uma estrategia clara, testes acabam sendo frageis (testam implementacao), incompletos (sem cobertura de edge cases), ou ausentes. Definir convencoes de nomeacao, estrutura e cobertura minima garante consistencia e confianca no test suite.

## Decisao
Adotar AAA pattern, nomeacao descritiva e targets de cobertura por camada:

### Padrao AAA (Arrange-Act-Assert)

Todo teste segue a estrutura:

```csharp
[Fact]
public void MarkAsDeleted_WhenEntityIsActive_SetsDeletedToTrue()
{
    // Arrange
    var order = Order.Create(customerId, items);

    // Act
    order.MarkAsDeleted("admin");

    // Assert
    order.Deleted.ShouldBeTrue();
    order.DeletedBy.ShouldBe("admin");
    order.DeletedAt.ShouldNotBeNull();
}
```

### Nomeacao de Testes

Padrao: `MethodName_Scenario_ExpectedBehavior`

Exemplos:
- `Create_WithValidData_ReturnsNewOrder`
- `Create_WithEmptyItems_ThrowsValidationException`
- `Cancel_WhenAlreadyCancelled_ThrowsConflictException`
- `Execute_WhenOrderNotFound_ThrowsNotFoundException`

### Cobertura por Camada

| Camada | Target | Justificativa |
|---|---|---|
| **Domain** | 90% branch coverage | Nucleo do negocio, regras criticas |
| **Application (UseCases)** | 80% branch coverage | Orquestracao, caminhos feliz + erro |
| **Infrastructure** | Testes de integracao | Nao mockar o banco, testar com DB real |
| **Endpoints** | Testes de integracao | Testar pipeline completo |

### O Que Testar

**Domain:**
- Factory methods (criacao valida + invalida)
- Metodos de negocio (estado antes/depois)
- Value Objects (criacao, igualdade, validacao)
- Domain Events (publicados nos momentos corretos)
- Invariantes (excecoes para estados invalidos)

**Application (UseCases):**
- Caminho feliz (happy path)
- Caminho de erro (entidade nao encontrada, regra violada)
- Interacoes com dependencias (repositorio chamado, evento publicado)

### Mocking

- **Mockar apenas dependencias externas** (repositorios, services externos).
- **Nao mockar o que voce possui** — se o dominio e seu, teste com objetos reais.
- **Usar Moq, NSubstitute ou equivalente** para interfaces.

```csharp
[Fact]
public async Task Execute_WithValidRequest_CreatesOrderAndSaves()
{
    // Arrange
    var repo = new Mock<IOrderRepository>();
    var uow = new Mock<IUnitOfWork>();
    var useCase = new CreateOrderUseCase(repo.Object, uow.Object);
    var request = new CreateOrderRequest(customerId, items);

    // Act
    var result = await useCase.ExecuteAsync(request, CancellationToken.None);

    // Assert
    result.ShouldNotBeNull();
    repo.Verify(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
    uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
}
```

### Organizacao de Arquivos

- Testes colocados no mesmo projeto ou projeto `.Tests` espelhando a estrutura.
- Nomeacao: `{ClassName}Tests.cs`.
- Uma classe de teste por classe testada.

## Alternativas Consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Sem padrao definido** | Liberdade total | Inconsistencia, testes frageis, cobertura imprevisivel |
| **BDD (Given-When-Then)** | Legibilidade de cenarios complexos | Verbose, overhead de frameworks (SpecFlow), nem sempre necessario |
| **Property-Based Testing** | Descobre edge cases automaticamente | Curva de aprendizado, mais lento, nem sempre aplicavel |
| **Somente testes de integracao** | Testa o sistema real | Lentos, frageis, dificil isolar falhas, setup complexo |
| **TDD estrito** | Design guiado por testes, cobertura alta | Curva de aprendizado, pode tornar iteracao mais lenta em exploracoes |

## Consequencias

### Positivas
- Consistencia — todos os devs escrevem testes no mesmo padrao
- Nomeacao descritiva — teste falhou? o nome diz exatamente o que quebrou
- AAA torna testes legiveis e previsíveis
- Targets de cobertura garantem minimo de confianca por camada
- Domain testavel sem dependencias — feedback rapido

### Negativas
- Targets de cobertura podem incentivar testes de baixo valor para atingir numeros
- Mocking excessivo pode criar testes que passam sempre (false positives)
- Manutencao de testes ao refatorar codigo (custo natural)
- Nem todo codigo justifica 90% de cobertura (utils simples, mappings)

## Regras para Validacao
- PROIBIDO: Testes sem assertions (teste que sempre passa)
- PROIBIDO: Testar detalhes de implementacao (ordem de chamadas internas, campos privados)
- PROIBIDO: Mockar o que voce possui desnecessariamente (ex: mockar Entity para testar UseCase que pode usar Entity real)
- PROIBIDO: Nomes de teste genericos (`Test1`, `TestCreate`, `ShouldWork`)
- OBRIGATORIO: Padrao AAA (Arrange-Act-Assert) em todo teste
- OBRIGATORIO: Nomeacao `MethodName_Scenario_ExpectedBehavior`
- OBRIGATORIO: Domain com cobertura minima de 90% branch
- OBRIGATORIO: Application com cobertura minima de 80% branch
- PREFERIDO: Objetos reais de dominio em vez de mocks quando possivel
- PREFERIDO: Uma classe de teste por classe testada
