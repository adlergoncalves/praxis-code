---
name: scaffold-aggregate
description: Gera Aggregate Root com private setters, factory method, audit fields e unit tests.
tools: Read, Write, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Nome da entidade + propriedades
Ex: "Order --properties Number:string, Total:decimal, Status:OrderStatus"

## CONTEXTO
1. Ler `docs/adr/` para convencoes de DDD
2. Detectar base classes existentes (AggregateRoot, Entity)
3. Detectar namespace e paths do projeto

## O QUE GERA (2-3 arquivos)

### 1. Aggregate Root
```
{Entity} : AggregateRoot
```
- Private setters
- Factory method `Create(...)`
- Audit fields (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy)
- Soft delete (Deleted flag)
- Domain events quando apropriado
- Metodos de comportamento (nao anemic)

### 2. Unit Tests
```
{Entity}Tests
```
- Testa factory method
- Testa invariantes
- Testa domain events

### 3. Value Objects (se necessario)
Se propriedades complexas detectadas (Email, CPF, Money), gerar VOs imutaveis.

## REGRAS
- Nunca public setters
- Sempre factory method (nunca construtor publico com params)
- Sempre audit fields via base class
- Comportamento junto com dados
