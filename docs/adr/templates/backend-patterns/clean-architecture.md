# ADR-NNNN: Clean Architecture — 4 Camadas

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Projetos backend que crescem sem separacao clara de responsabilidades tendem a criar acoplamento forte entre regras de negocio, acesso a dados e infraestrutura. Isso dificulta testes, manutencao e evolucao independente de cada camada. A Clean Architecture oferece uma estrutura comprovada pelo mercado para organizar codigo em camadas com dependencias unidirecionais.

## Decisao
Adotar Clean Architecture com 4 camadas e regra de dependencia estrita:

### Camadas

1. **Domain** — Nucleo do negocio. Contem: Entities, Aggregates, Value Objects, Domain Events, interfaces de Repository, Domain Exceptions. Nao depende de nenhuma outra camada.

2. **Application** — Orquestracao. Contem: Use Cases, DTOs (Request/Response), Validators, Mappers. Depende apenas de Domain.

3. **Infrastructure** — Implementacoes tecnicas. Contem: Repository implementations, ORM configurations (EF/Dapper), external service clients, messaging. Depende de Domain e Application.

4. **API/Bootstrapper** — Ponto de entrada. Contem: Endpoints/Controllers, Dependency Injection configuration, Middleware, Startup. Depende de todas as camadas (composicao na raiz).

### Regra de Dependencia

```
Domain → (nada)
Application → Domain
Infrastructure → Domain + Application
API/Bootstrapper → Domain + Application + Infrastructure
```

As dependencias apontam sempre para dentro (em direcao ao Domain). Camadas internas nunca referenciam camadas externas.

### Inversao de Dependencia
Interfaces sao definidas na camada que as **consome** (Domain ou Application). Implementacoes ficam na camada externa (Infrastructure). O container de DI no Bootstrapper conecta interface a implementacao.

## Alternativas Consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Monolito sem camadas** | Simples para projetos pequenos, rapido para iniciar | Acoplamento total, impossivel testar isoladamente, refatoracao cara |
| **Hexagonal Architecture** | Mesma ideia de inversao de dependencia, ports/adapters explicitos | Mais complexo nomenclaturalmente, mesmo resultado pratico |
| **Vertical Slices** | Cada feature auto-contida, menos acoplamento lateral | Dificil compartilhar logica de dominio, duplicacao possivel |
| **3 camadas tradicionais (Presentation-Business-Data)** | Familiar, amplamente documentado | Business layer tende a acoplar com Data, sem inversao de dependencia clara |

## Consequencias

### Positivas
- Domain testavel sem dependencias externas (banco, HTTP, etc.)
- Troca de ORM ou banco de dados sem impacto no dominio
- Use Cases testaveis com mocks das interfaces definidas em Domain
- Cada camada pode evoluir independentemente desde que respeite os contratos
- Facilita onboarding — estrutura previsivel e padronizada

### Negativas
- Mais arquivos e pastas comparado a abordagem simples
- Curva de aprendizado para devs nao familiarizados com o padrao
- Para projetos muito pequenos (CRUD puro), pode ser over-engineering
- Mapeamento entre camadas (Entity ↔ DTO) adiciona boilerplate

## Regras para Validacao
- PROIBIDO: Domain importando Infrastructure ou API
- PROIBIDO: Application importando API/Bootstrapper
- PROIBIDO: Entities expostas diretamente em respostas de API (usar DTOs)
- OBRIGATORIO: Inversao de dependencia entre camadas (interfaces em Domain/Application, implementacoes em Infrastructure)
- OBRIGATORIO: Toda dependencia externa (ORM, HTTP client, messaging) confinada em Infrastructure
- PREFERIDO: Um projeto/assembly por camada por modulo para enforcement em tempo de compilacao
