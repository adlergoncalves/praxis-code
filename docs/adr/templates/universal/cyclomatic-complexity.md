# ADR-NNNN: Cyclomatic Complexity

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Codigo com alta complexidade ciclomatica e dificil de entender, testar e manter. Metodos longos com muitos caminhos de execucao geram maior probabilidade de bugs, exigem mais casos de teste e aumentam o custo de manutencao. Limites claros de complexidade permitem identificar codigo problematico antes que se torne ingerenciavel.

## Decisao
Estabelecer limites objetivos e mensuráveis para complexidade de codigo em todos os niveis: metodo, classe e parametros.

### Complexidade Ciclomatica por Metodo

| Faixa | Classificacao | Acao |
|---|---|---|
| 1-10 | Aceitavel | Nenhuma acao necessaria |
| 11-15 | Alerta | Refatoracao recomendada, documentar justificativa se mantido |
| 16+ | Critico | Refatoracao obrigatoria, bloqueia merge |

Cada ponto de decisao (`if`, `else if`, `case`, `&&`, `||`, `?.`, `??`, ternario, `catch`, loop) incrementa a complexidade em 1.

### Profundidade de Aninhamento (Nesting Depth)

| Nivel | Classificacao | Acao |
|---|---|---|
| 0-3 | Aceitavel | Nenhuma acao necessaria |
| 4 | Alerta | Refatorar usando early return, guard clause ou extracao de metodo |
| 5+ | Critico | Refatoracao obrigatoria |

### Tamanho de Metodos

| Metrica | Limite | Alerta |
|---|---|---|
| Linhas por metodo | 30 | 50 |
| Parametros por metodo | 4 | 6 |

Metodos com mais de 4 parametros devem considerar o uso de objetos de parametro (parameter objects) ou builders.

### Tamanho de Classes

| Metrica | Limite | Alerta |
|---|---|---|
| Linhas por classe | 200 | 300 |
| Metodos publicos por classe | 7 | 10 |
| Dependencias injetadas | 5 | 7 |

### Estrategias de Refatoracao

Quando os limites sao excedidos, aplicar uma ou mais das seguintes tecnicas:
1. **Extract Method** — isolar blocos logicos em metodos nomeados
2. **Guard Clauses / Early Returns** — reduzir aninhamento invertendo condicoes
3. **Replace Conditional with Polymorphism** — substituir switches/ifs por hierarquias
4. **Introduce Parameter Object** — agrupar parametros relacionados
5. **Decompose Conditional** — extrair condicoes complexas em metodos com nomes descritivos
6. **Split Class** — dividir classes com multiplas responsabilidades

## Alternativas Consideradas

### Sem limites formais, apenas code review
- **Pro:** Flexibilidade total
- **Contra:** Subjetivo, inconsistente entre revisores, problemas detectados tarde

### Limites muito restritivos (complexidade max 5)
- **Pro:** Codigo extremamente simples
- **Contra:** Over-engineering, excesso de indirection, produtividade reduzida

### Limites moderados com faixas de alerta (escolhida)
- **Pro:** Equilibrio entre qualidade e pragmatismo, automacao possivel
- **Contra:** Casos excepcionais precisam de documentacao/justificativa

## Consequencias
### Positivas
- Codigo mais facil de entender e revisar
- Menor probabilidade de bugs em metodos simples
- Cobertura de testes mais completa (menos caminhos por metodo)
- Metricas objetivas para code review

### Negativas
- Maior numero de metodos e classes (mais arquivos)
- Tempo adicional para refatoracao de codigo legado
- Excecoes ocasionais que requerem justificativa documentada

## Regras para Validacao
- PROIBIDO: Metodos com complexidade ciclomatica acima de 15
- PROIBIDO: Profundidade de aninhamento acima de 4 niveis
- PROIBIDO: Metodos com mais de 50 linhas
- PROIBIDO: Classes com mais de 300 linhas
- PROIBIDO: Metodos com mais de 6 parametros
- OBRIGATORIO: Complexidade ciclomatica maxima 10 por metodo
- OBRIGATORIO: Profundidade de aninhamento maxima 3 niveis
- OBRIGATORIO: Metodos com no maximo 30 linhas
- OBRIGATORIO: Classes com no maximo 200 linhas
- OBRIGATORIO: Maximo 4 parametros por metodo
- PREFERIDO: Guard clauses e early returns sobre aninhamento profundo
- PREFERIDO: Metodos com complexidade ciclomatica entre 1-5
- PREFERIDO: Parameter objects quando ha 3+ parametros relacionados
