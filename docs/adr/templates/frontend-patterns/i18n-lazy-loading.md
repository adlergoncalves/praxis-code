# ADR-NNNN: i18n with Lazy Namespace Loading

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
Aplicacoes que suportam multiplos idiomas frequentemente colocam todas as traducoes em um unico arquivo JSON gigante, carregado no startup. Isso aumenta o tempo de carregamento inicial e dificulta a manutencao — qualquer desenvolvedor editando qualquer feature precisa mexer no mesmo arquivo.

Namespaces por feature com lazy loading resolvem ambos os problemas.

## Decisao
Adotar i18n com lazy loading de namespaces por feature:

### Estrutura de arquivos
```
public/locales/
  pt-BR/
    common.json          # Termos globais (botoes, erros genericos)
    users.json           # Namespace da feature users
    products.json        # Namespace da feature products
  en-US/
    common.json
    users.json
    products.json
```

### Regras
1. **Idioma primario** definido na configuracao + **idioma fallback** para chaves ausentes
2. **Namespace por feature:** Cada feature carrega apenas seu namespace quando acessada
3. **Namespace `common`:** Termos reutilizaveis (botoes, labels genericos) — carregado globalmente
4. **Sem strings hardcoded:** Todo texto visivel ao usuario deve vir do sistema de i18n

```tsx
// Correto
const { t } = useTranslation('users');
return <h1>{t('page.title')}</h1>;

// Incorreto
return <h1>Lista de Usuarios</h1>;
```

## Alternativas Consideradas
1. **Arquivo unico global:** Simples, mas nao escala. Bundle inicial pesado, conflitos de merge frequentes.
2. **Traducoes inline (template literals):** Zero overhead, mas impossibilita suporte a multiplos idiomas.
3. **Compilacao em build-time (linguijs):** Melhor performance em runtime, mas mais complexo no build pipeline.
4. **Server-side i18n:** Traducoes vem da API. Flexivel, mas adiciona latencia e dependencia do backend.

## Consequencias
### Positivas
- Bundle inicial menor: apenas `common` carregado no startup
- Manutencao distribuida: cada feature cuida das suas traducoes
- Menos conflitos de merge: arquivos menores e isolados por feature
- Facil adicionar novos idiomas: copiar a estrutura de pastas

### Negativas
- Mais arquivos para gerenciar
- Risco de chaves duplicadas entre namespaces (precisa de convencao)
- Flash de texto nao traduzido se o namespace ainda nao carregou (mitigado com Suspense)
- Exige disciplina para nao hardcodar strings

## Regras para Validacao
- PROIBIDO: Strings hardcoded visiveis ao usuario em arquivos `.tsx`/`.jsx`
- PROIBIDO: Arquivo global unico com todas as traducoes
- OBRIGATORIO: Namespace por feature em `locales/{lang}/{feature}.json`
- OBRIGATORIO: Lazy loading de namespaces (carregar sob demanda, nao no startup)
- OBRIGATORIO: Idioma primario + idioma fallback configurados
- PREFERIDO: Namespace `common` para termos compartilhados entre 3+ features
