# ADR-NNNN: DDD — Aggregates, Entities e Value Objects

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Sistemas que modelam o dominio como simples containers de dados (classes com getters e setters publicos) perdem a capacidade de garantir invariantes de negocio em codigo. Regras ficam espalhadas em services, controllers e ate no frontend. Domain-Driven Design (DDD) oferece padroes taticos para encapsular regras de negocio diretamente nas entidades, garantindo consistencia por construcao.

## Decisao
Adotar padroes taticos de DDD para modelagem do dominio:

### Aggregate Root
- Fronteira de consistencia transacional. Toda modificacao no agregado passa pelo Root.
- Cada agregado e salvo/carregado como uma unidade atomica.
- Referencia entre agregados: apenas por ID (nunca por navegacao direta).
- Um Repository por Aggregate Root.

### Entity
- Possui identidade (ID) que persiste ao longo do tempo.
- Setters privados — estado mutado apenas via metodos com nome de negocio.
- Factory methods (`Create`, `Register`, etc.) para construcao com validacao.
- Igualdade baseada em identidade (ID), nao em atributos.

### Value Object
- Imutavel. Sem identidade propria.
- Igualdade baseada em atributos (structural equality).
- Exemplos: Email, CPF, Money, Address, DateRange.
- Validacao no construtor — instancia invalida nunca existe.

### Domain Events
- Efeitos colaterais modelados como eventos (records imutaveis).
- Publicados pelo Aggregate Root apos mudanca de estado.
- Consumidos por handlers que executam side effects (envio de email, sincronizacao, etc.).

### Exemplo de Estrutura

```csharp
// Aggregate Root
public class Order : AggregateRoot
{
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public static Order Create(CustomerId customerId) { ... }
    public void AddItem(ProductId productId, int quantity) { ... }
    public void Cancel(string reason) { ... }
}
```

## Alternativas Consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Anemic Domain Model** | Simples, facil de entender, rapido para CRUD | Regras espalhadas em services, impossivel garantir invariantes, duplicacao |
| **Active Record** | Entidade sabe se salvar, menos indireção | Acopla dominio com persistencia, dificil testar, viola SRP |
| **Transaction Script** | Procedural, direto ao ponto | Escala mal, regras duplicadas, sem encapsulamento |
| **DDD completo (com Bounded Contexts, Context Maps)** | Modelagem estrategica tambem | Complexidade alta, exige Domain Expert dedicado, overhead para equipes pequenas |

## Consequencias

### Positivas
- Invariantes de negocio garantidas em codigo — bugs de estado impossiveis
- Dominio auto-documentado (metodos com nomes de negocio)
- Testavel sem dependencias externas
- Aggregate Root como ponto unico de modificacao simplifica auditoria
- Value Objects eliminam primitive obsession e validam na construcao

### Negativas
- Curva de aprendizado para equipe nao familiarizada com DDD
- Mais classes comparado a abordagem anemica
- Mapeamento ORM de Value Objects e coleções pode ser complexo
- Decisoes de modelagem (limites de agregado) exigem conhecimento do dominio

## Regras para Validacao
- PROIBIDO: Setters publicos em Entities e Aggregate Roots
- PROIBIDO: Modelo anemico (classes apenas com getters/setters, sem comportamento)
- PROIBIDO: Acesso direto ao banco de dados a partir do dominio
- PROIBIDO: Navegacao direta entre agregados (usar referencia por ID)
- OBRIGATORIO: Aggregate Root controla todas as modificacoes de seus filhos
- OBRIGATORIO: Value Objects imutaveis com validacao no construtor
- OBRIGATORIO: Factory methods para criacao de entidades com validacao
- PREFERIDO: Domain Events para side effects em vez de chamadas diretas
- PREFERIDO: Metodos com nomes de negocio (`Approve()`, `Cancel()`) em vez de genericos (`Update()`, `Set()`)
