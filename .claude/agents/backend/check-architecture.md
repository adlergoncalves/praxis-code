---
name: check-architecture
description: Valida dependencias entre camadas arquiteturais. Detecta violacoes de Clean Architecture, imports invertidos, Service Locator, Leaky Abstractions e ausencia de patterns estruturais importantes.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Regra de Dependencia (Clean Architecture)
- Domain → nao importa nenhuma outra camada
- Application → importa apenas Domain
- Infrastructure → importa Domain e Application
- API/Bootstrapper → importa todas (composicao na raiz)
- Proibido: Domain importando Infrastructure, Application ou API
- Proibido: Application importando Infrastructure ou API

### Anti-patterns Estruturais
- **Service Locator**: Proibido injetar `IServiceProvider`, `IServiceLocator` ou `container.Resolve<>()` fora do Bootstrapper/Startup. Isso esconde dependencias e viola DIP.
- **Leaky Abstraction**: Interfaces de dominio (IRepository, IUseCase) nao devem expor tipos de infraestrutura (IQueryable, DbSet, SqlCommand). A camada interna nao deve "vazar" detalhes da externa.
- **God Class / God Service**: Classes com mais de 500 linhas ou que acumulam responsabilidades de multiplas camadas.
- **Static Dependencies**: Chamadas a metodos estaticos de infraestrutura (ex: `DateTime.Now`, `File.ReadAllText`, `HttpClient.GetAsync` estatico) dentro de Domain ou Application dificultam testes.

### Repository Pattern
- Interfaces de Repository definidas em Domain ou Application (nunca em Infrastructure)
- Implementacoes de Repository apenas em Infrastructure
- Repositorios nao devem expor `IQueryable` para camadas superiores — queries sao construidas dentro do repositorio

### Modularidade
- Sem referencias circulares entre modulos/assemblies
- Cada modulo deve ter ponto de entrada unico (ex: `{Modulo}Module.cs` ou DI extension method)

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre arquitetura, camadas, modularidade, Repository, CQRS. Aplicar regras OBRIGATORIO/PROIBIDO definidas.

## EXECUCAO

### 1. Mapear camadas
- Identificar pastas/projetos correspondentes a cada camada (Domain, Application, Infrastructure, API)
- Se estrutura nao segue Clean Architecture → registrar como AVISO e adaptar analise ao que existe

### 2. Verificar imports invertidos
- Para cada arquivo em Domain/: grep imports de Infrastructure, Application, API → ERRO se encontrado
- Para cada arquivo em Application/: grep imports de Infrastructure, API → ERRO se encontrado
- Verificar namespaces em using statements

### 3. Detectar Service Locator
- Grep `IServiceProvider` em arquivos fora de `Startup`, `Program`, `Bootstrap`, `Extensions`, `DependencyInjection`
- Grep `.GetService<|.GetRequiredService<|.Resolve<` em Domain ou Application → ERRO

### 4. Detectar Leaky Abstractions
- Grep `IQueryable` em interfaces de Domain ou Application → ERRO
- Grep `DbSet` em interfaces ou DTOs de Application → ERRO
- Grep tipos de ORM (EntityEntry, ChangeTracker) em Application → ERRO

### 5. Detectar dependencias circulares
- Mapear imports entre modulos e verificar ciclos
- Ex: ModuloA importa ModuloB que importa ModuloA → ERRO

### 6. Verificar Repository pattern
- Grep interfaces IRepository em Infrastructure (deveriam estar em Domain/Application) → AVISO
- Grep `IQueryable` retornado por metodos de interface de repositorio → ERRO

### 7. Verificar acoplamento estatico
- Grep `DateTime.Now|DateTime.UtcNow` em Domain/ → AVISO (dificulta testes — prefer IDateTimeProvider)
- Grep `File.|Directory.|Path.` em Domain ou Application → AVISO

## CLASSIFICACAO
- **ERRO**: Import invertido entre camadas, Service Locator fora do Bootstrapper, IQueryable em interface de repositorio, dependencia circular
- **AVISO**: Static dependency em Domain, interface de repositorio em Infrastructure, Leaky Abstraction suspeita

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao Arquitetural

### Repository Pattern + Unit of Work
[Se detectado: repositorios sem UoW, ou multiplos SaveChanges espalhados em Use Cases]
- **Situacao**: X Use Cases chamando SaveChanges diretamente ou repositorios sem coordenacao transacional
- **Sugestao**: Criar ADR de Repository Pattern com Unit of Work para coordenar transacoes
- **Como**: `/architect` → criar ADR customizada de Repository/UoW para a stack do projeto
- **Beneficio**: Transacoes atomicas, testabilidade, separacao de persistencia da logica

### CQRS — Separacao de Read/Write
[Se detectado: repositorios com muitos metodos de query complexos ou Use Cases de leitura pesados]
- **Situacao**: Repositorios sobrecarregados com queries especificas de tela ou Use Cases de leitura retornando agregados ricos
- **Sugestao**: Avaliar CQRS com Read Models dedicados para queries, separando do modelo de escrita
- **Como**: `/architect` → criar ADR de CQRS definindo separacao e tecnologia de leitura
- **Beneficio**: Queries otimizadas sem overhead do modelo rico, evolucao independente de leitura e escrita

### Modularidade Explicita
[Se detectado: mais de 3 modulos de negocio sem separacao clara de namespace/assembly]
- **Situacao**: Multiplos contextos de negocio misturados sem fronteiras explicitas
- **Sugestao**: Formalizar modulos com namespaces, assemblies ou bounded contexts via `/ddd-estrategico`
- **Beneficio**: Preparacao para microservicos futuros, reducao de acoplamento acidental
```

Emitir apenas as secoes com evidencia no codigo.
