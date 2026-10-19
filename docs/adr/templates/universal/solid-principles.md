# ADR-NNNN: SOLID Principles

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Codigo orientado a objetos tende a se degradar ao longo do tempo sem diretrizes claras de design. Classes acumulam responsabilidades, hierarquias de heranca se tornam frageis, e dependencias concretas dificultam testes e evolucao. Os principios SOLID fornecem um conjunto coeso de regras que previnem esses problemas e promovem codigo extensivel, testavel e de facil manutencao.

## Decisao
Adotar os cinco principios SOLID como diretrizes obrigatorias para todo codigo orientado a objetos do projeto.

### Single Responsibility Principle (SRP)
Cada classe deve ter uma unica razao para mudar. Classes com multiplas responsabilidades devem ser divididas.
- Classes: maximo 200 linhas (alerta em 300)
- Metodos: maximo 30 linhas (alerta em 50)
- Se uma classe precisa de mais de 5 dependencias injetadas, provavelmente viola SRP

### Open/Closed Principle (OCP)
Entidades de software devem ser abertas para extensao e fechadas para modificacao.
- Preferir composicao sobre heranca
- Usar interfaces e abstractions para pontos de extensao
- Novos comportamentos devem ser adicionados via novas classes, nao alterando classes existentes

### Liskov Substitution Principle (LSP)
Subtipos devem ser substituiveis por seus tipos base sem alterar o comportamento correto do programa.
- Subclasses nao devem lancar excecoes inesperadas
- Subclasses nao devem restringir pre-condicoes ou relaxar pos-condicoes
- Evitar heranca quando o subtipo nao e genuinamente um "tipo de" da classe base

### Interface Segregation Principle (ISP)
Clientes nao devem depender de interfaces que nao utilizam.
- Interfaces: maximo 5 metodos
- Interfaces grandes devem ser divididas em interfaces menores e coesas
- Preferir interfaces role-based sobre header interfaces

### Dependency Inversion Principle (DIP)
Modulos de alto nivel nao devem depender de modulos de baixo nivel. Ambos devem depender de abstracoes.
- Camadas de dominio e aplicacao dependem apenas de interfaces
- Implementacoes concretas ficam nas camadas de infraestrutura
- Injecao de dependencia como mecanismo padrao

### Complexidade Ciclomatica
- Metodos: maximo 10 (refatorar obrigatoriamente acima de 15)
- Profundidade de aninhamento: maximo 3 niveis
- Utilizar early returns e guard clauses para reduzir aninhamento

## Alternativas Consideradas

### Sem diretrizes formais de design
- **Pro:** Liberdade total para desenvolvedores
- **Contra:** Degradacao progressiva da base de codigo, inconsistencia entre equipes

### Apenas code reviews subjetivos
- **Pro:** Flexibilidade caso a caso
- **Contra:** Criterios variam entre revisores, dificil automatizar

### SOLID + metricas automatizadas (escolhida)
- **Pro:** Regras claras, verificaveis por ferramentas, consistencia
- **Contra:** Curva de aprendizado inicial, pode parecer restritivo

## Consequencias
### Positivas
- Codigo mais testavel (classes pequenas com dependencias injetadas)
- Facilidade de extensao sem regressoes
- Onboarding mais rapido com regras claras
- Metricas automatizaveis via linters e analyzers

### Negativas
- Maior numero de arquivos e classes (mais indirection)
- Curva de aprendizado para desenvolvedores nao familiarizados com SOLID
- Risco de over-engineering em cenarios simples

## Regras para Validacao
- PROIBIDO: Classes com mais de 300 linhas
- PROIBIDO: Metodos com mais de 50 linhas
- PROIBIDO: Interfaces com mais de 5 metodos
- PROIBIDO: Profundidade de aninhamento acima de 4 niveis (alvo: 3 — ver `cyclomatic-complexity.md`)
- PROIBIDO: Complexidade ciclomatica acima de 15 por metodo
- PROIBIDO: Dependencia direta de implementacoes concretas em camadas de dominio/aplicacao
- OBRIGATORIO: Classes com no maximo 200 linhas
- OBRIGATORIO: Metodos com no maximo 30 linhas
- OBRIGATORIO: Complexidade ciclomatica maxima 10 por metodo
- OBRIGATORIO: Injecao de dependencia via construtor para todas as dependencias externas
- PREFERIDO: Composicao sobre heranca
- PREFERIDO: Maximo 5 dependencias injetadas por classe
- PREFERIDO: Guard clauses e early returns para reduzir aninhamento
