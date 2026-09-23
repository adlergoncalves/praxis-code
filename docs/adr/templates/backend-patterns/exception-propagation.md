# ADR-NNNN: Exception Propagation — Tratamento de Erros via Excecoes

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Existem duas abordagens principais para tratamento de erros em aplicacoes backend: Result Pattern (retornar objetos de resultado) e Exception Propagation (lancar excecoes que sobem ate o middleware). Ambas tem tradeoffs. Para a maioria dos projetos, excecoes oferecem um modelo mais simples e direto, onde o fluxo feliz fica limpo e os erros sao tratados de forma centralizada.

## Decisao
Adotar Exception Propagation como estrategia padrao de tratamento de erros:

### Hierarquia de Excecoes

```csharp
// Base
public abstract class DomainException : Exception
{
    public string Code { get; }
    protected DomainException(string code, string message) : base(message)
    {
        Code = code;
    }
}

// Especializacoes
public class NotFoundException : DomainException { }         // 404
public class ValidationException : DomainException { }       // 422
public class ConflictException : DomainException { }         // 409
public class UnauthorizedException : DomainException { }     // 401
public class ForbiddenException : DomainException { }        // 403
public class BusinessRuleException : DomainException { }     // 422
```

### Regras de Uso

1. **Domain e Application lancam excecoes** — nunca retornam codigos de erro.
2. **Excecoes sobem naturalmente** ate o middleware centralizado.
3. **Use Cases nao fazem try/catch** — deixam propagar.
4. **Endpoints/Handlers nao fazem try/catch** — middleware trata.
5. **Cada excecao carrega um `Code`** para i18n e identificacao programatica.

### Fluxo

```
Domain/Application lanca DomainException
    → Sobe pelo call stack (sem try/catch intermediario)
        → ExceptionHandlingMiddleware captura
            → Mapeia para HTTP status code + response body
```

## Alternativas Consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Result Pattern (Result\<T\>)** | Erros explicitos no tipo de retorno, compilador ajuda | Boilerplate em todo Use Case, pattern matching em cada chamada, complexidade |
| **Error codes (enums)** | Simples, sem overhead de excecoes | Facil esquecer de checar, fluxo poluido com ifs |
| **Tuple returns (success, error)** | Leve, sem classes extras | Sem tipagem forte, Go-style nao idiomatico em C# |
| **Notifications (lista de erros)** | Acumula multiplos erros | Complexidade de implementacao, ambiguidade sobre quando parar |

## Consequencias

### Positivas
- Fluxo feliz limpo e legivel (sem ifs de erro em cada linha)
- Tratamento centralizado em um unico ponto (middleware)
- Hierarquia de excecoes mapeia naturalmente para HTTP status codes
- Facil adicionar novas excecoes conforme o dominio cresce
- Pattern familiar para a maioria dos devs .NET

### Negativas
- Excecoes tem custo de performance (stack trace) — aceitavel para fluxos de erro
- Pode incentivar uso de excecoes para controle de fluxo (antipattern)
- Sem verificacao em tempo de compilacao de quais excecoes um metodo pode lancar
- Debug pode ser mais dificil se a hierarquia ficar muito profunda

## Regras para Validacao
- PROIBIDO: try/catch em endpoint handlers (middleware trata)
- PROIBIDO: Retornar codigos de erro em vez de lancar excecoes de dominio
- PROIBIDO: Engolir excecoes (catch vazio ou catch com apenas log)
- PROIBIDO: Usar `Exception` base generica — usar hierarquia tipada
- OBRIGATORIO: Middleware centralizado para capturar e mapear excecoes
- OBRIGATORIO: Toda excecao de dominio herda de `DomainException`
- OBRIGATORIO: Propriedade `Code` em toda excecao para identificacao programatica
- PREFERIDO: Mensagens de excecao descritivas e com contexto
- PREFERIDO: Excecoes especificas por regra de negocio quando aplicavel
