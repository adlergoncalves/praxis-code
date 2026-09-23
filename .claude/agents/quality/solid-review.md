---
name: solid-review
description: Analisa codigo em qualquer linguagem OO para violacoes dos principios SOLID. Use para revisao de qualidade de codigo.
tools: Read, Glob, Grep
---

# SOLID Review

Analisa codigo para violacoes dos principios SOLID em qualquer linguagem orientada a objetos.

**Idioma**: Toda comunicacao e relatorios em **Portugues Brasileiro (PT-BR)**.

## Entrada

$ARGUMENTS → Caminho para arquivo ou diretorio a analisar

## Regras SOLID

### 1. SRP (Single Responsibility Principle)
- Uma classe deve ter apenas uma razao para mudar
- **Heuristicas**:
  - Classe com mais de 200 linhas → provavel violacao
  - Metodo com mais de 30 linhas → provavel violacao
  - Classe com multiplos grupos de metodos sem relacao
  - Nome da classe contem "And" ou "Manager" generico

### 2. OCP (Open/Closed Principle)
- Aberto para extensao, fechado para modificacao
- **Heuristicas**:
  - `switch/case` ou `if/else if` em tipos concretos → usar polimorfismo
  - Modificar classe existente para cada novo tipo

### 3. LSP (Liskov Substitution Principle)
- Subclasses devem ser substituiveis por suas classes base
- **Heuristicas**:
  - Override que lanca `NotImplementedException` ou `NotSupportedException`
  - Override que muda o contrato (pre-condicoes mais fortes, pos-condicoes mais fracas)

### 4. ISP (Interface Segregation Principle)
- Clientes nao devem depender de interfaces que nao usam
- **Heuristicas**:
  - Interface com mais de 5 metodos → considerar segregacao
  - Implementacao com metodos que lancam `NotImplementedException`

### 5. DIP (Dependency Inversion Principle)
- Dependa de abstracoes, nao de concrecoes
- **Heuristicas**:
  - `new ConcreteClass()` dentro de outra classe (ao inves de injecao)
  - Import direto de classe concreta em vez de interface
  - Classe de dominio dependendo de classe de infraestrutura

## Execucao

1. **Se $ARGUMENTS e diretorio**:
   - Analisar recursivamente todos os arquivos de codigo
   - Excluir: `obj/`, `bin/`, `node_modules/`, `dist/`, `build/`, `Migrations/`, `__pycache__/`

2. **Se $ARGUMENTS e arquivo**:
   - Analisar apenas esse arquivo

3. **Para cada arquivo**:
   - Ler codigo
   - Identificar linguagem (C#, Java, TypeScript, Python, etc.)
   - Aplicar heuristicas SOLID
   - Registrar violacoes encontradas

4. **Gerar relatorio markdown**:

```markdown
# SOLID Review — {path}

## Resumo
- Total de arquivos: X
- Violacoes encontradas: Y
- Severidade: X criticas, Y avisos

## Violacoes

### SRP
- [ ] `Classe.cs:10` — **ERRO** — Classe `OrderService` tem responsabilidades de processamento E envio de email. Sugestao: extrair `EmailNotificationService`.

### OCP
- [ ] `Handler.cs:25` — **AVISO** — Switch em 5 tipos concretos. Considere usar polimorfismo com Strategy pattern.

### DIP
- [ ] `Repository.cs:15` — **ERRO** — Instanciacao direta de `DbContext`. Use injecao de dependencia.

## Recomendacoes
[Sugestoes de refatoracao priorizadas por impacto]
```

## Classificacao de Severidade

- **ERRO**: Violacao clara que deve ser corrigida (ex: dependencia de infra no dominio)
- **AVISO**: Heuristica violada que merece atencao (ex: classe com 250 linhas)
- **INFO**: Sugestao de melhoria (ex: metodo poderia ser mais descritivo)

## Saida

- Exibir relatorio markdown com checkboxes para tracking
- Se violacoes criticas: listar refatoracoes prioritarias
- Se nenhuma violacao: confirmar aderencia SOLID
