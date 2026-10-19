---
name: check-i18n
description: Valida internacionalizacao — detecta strings user-facing hardcoded, verifica namespaces por feature, lazy loading de traducoes e consistencia de chaves.
tools: Read, Glob, Grep
---

## ENTRADA
$ARGUMENTS → Caminho ou "geral"

## REGRAS EMBUTIDAS

### Strings Hardcoded
- Proibido: strings user-facing hardcoded em componentes .tsx (labels, placeholders, mensagens de erro, titulos)
- Excecao aceita: strings de dev/debug, comentarios, nomes tecnicos, conteudo do Design System showcase
- Excecao aceita: strings que nao variam por idioma (formatos de data, URLs, IDs)

### Estrutura de Namespaces
- Proibido: arquivo global unico de traducao (`common.json` com tudo) em projetos com 3+ features
- Cada feature deve ter seu proprio namespace de traducao (ex.: `locales/pt-BR/orders.json`, como no template de ADR de i18n, ou o caminho decidido no projeto)
- Namespace `common` reservado para strings realmente compartilhadas (sim, nao, cancelar, salvar, erro generico)
- Chaves de traducao em inglês e descritivas (`orders.create.title`, nao `orders.t1`)

### Lazy Loading
- Namespaces de features devem ser carregados apenas quando a feature e acessada
- Proibido: carregar todas as traducoes no bundle inicial
- Suspense boundary necessario ao usar lazy loading de traducoes

### Consistencia de Chaves
- Chaves removidas do codigo devem ser removidas dos arquivos de traducao (sem chaves orfas)
- Chaves novas no codigo devem ter traducao em todos os idiomas suportados (sem chaves faltando)
- Formato de chave consistente: `feature.contexto.elemento` (kebab-case ou camelCase — escolher um)

### Pluralizacao e Formatacao
- Usar mecanismo de pluralizacao da lib (nao concatenar strings para plural)
- Numeros, moedas e datas formatados via Intl ou lib de i18n (nao hardcoded por idioma)

## REGRAS DINAMICAS
Ler ADRs em `docs/adr/` sobre i18n, traducoes, namespaces. Carregar `docs/project/learnings/frontend-learnings.md` para aplicar patterns de i18n ja definidos no projeto.

## EXECUCAO

### 1. Detectar strings hardcoded em JSX
- Grep texto entre tags JSX: `>\s*[A-ZÀ-ÿa-z][a-zÀ-ÿ ]{3,}[a-zÀ-ÿ]\s*<` em .tsx
- Grep placeholders hardcoded: `placeholder=["'][A-Za-zÀ-ÿ]`
- Grep labels hardcoded: `label=["'][A-Za-zÀ-ÿ]`
- Excluir: arquivos de showcase do DS, arquivos de teste

### 2. Verificar uso de hook de traducao
- Glob componentes com texto visivel
- Verificar presenca de `useTranslation|useI18n|t(` nos arquivos → AVISO se ausente

### 3. Verificar namespace global unico
- Glob arquivos de traducao: verificar se existe unico arquivo grande vs namespaces por feature
- Arquivo de traducao com 50+ chaves em projeto com features → AVISO

### 4. Verificar lazy loading de traducoes
- Verificar se namespaces sao carregados sob demanda ou todos upfront
- Todas as traducoes em bundle inicial → AVISO

### 5. Verificar pluralizacao manual
- Grep `+ " itens"|+ " items"|condicional.*plural` em componentes → AVISO

### 6. Verificar formatacao hardcoded de data/moeda
- Grep `toLocaleDateString|toLocaleString` sem parametros de locale → AVISO
- Grep `R$\s*\{|USD\s*\{` hardcoded em JSX → AVISO

## CLASSIFICACAO
- **ERRO**: Strings user-facing hardcoded em componente de producao
- **AVISO**: Namespace global unico, lazy loading ausente, pluralizacao manual, formatacao de data/moeda hardcoded, chave sem traducao correspondente, chave orfa (presente no arquivo de traducao e usada em nenhum lugar do escopo)

## SECAO OBRIGATORIA: Oportunidades de Evolucao

Ao final do relatorio, emitir secao com sugestoes baseadas no que foi encontrado:

```markdown
## Oportunidades de Evolucao de i18n

### i18n Nao Implementado
[Se detectado: projeto com muitas strings hardcoded sem nenhuma lib de i18n]
- **Situacao**: X strings hardcoded sem mecanismo de traducao
- **Sugestao**: Criar ADR de i18n Strategy antes de escalar (escolher lib, estrutura de namespaces, idiomas suportados)
- **Como**: `/architect` → criar ADR de Internationalization
- **Beneficio**: Expansao para outros mercados sem reescrever componentes

### Gerenciamento de Chaves Orfas
[Se detectado: projeto com i18n mas sem processo de limpeza de chaves]
- **Situacao**: Suspeita de chaves de traducao sem uso no codigo (apos verificacao manual)
- **Sugestao**: Adicionar `i18next-scanner` ou equivalente ao pipeline de CI para detectar chaves orfas e faltantes
- **Como**: `/architect` → criar ADR de i18n Quality Gates
- **Beneficio**: Arquivos de traducao limpos, sem chaves obsoletas acumulando
```

Emitir apenas as secoes com evidencia no codigo.
