# ADR-{NNNN}: Design System

## Status
Template (nao adotada — personalizar via /architect)

## Contexto
{Por que o projeto precisa de um design system — consistencia visual, produtividade, manutencao}

## Decisao

### Component Library
- **Biblioteca**: {shadcn/ui | Vuetify | Angular Material | outra}
- **Motivo**: {por que esta lib foi escolhida}

### Token Format
- **Formato**: CSS variables em `globals.css`
- **Temas**: Light + Dark mode
- **Tailwind**: Integrado via `@theme inline`

### Design System
- **Localizacao**: {app/design-system/ | src/design-system/}
- **Proposito**: Documentacao viva de tokens e componentes — artefato interno, nao vai pra producao

## Alternativas Consideradas

### {Alternativa 1}
- **Pros**: ...
- **Contras**: ...

### {Alternativa 2}
- **Pros**: ...
- **Contras**: ...

## Consequencias

### Positivas
- Consistencia visual garantida via tokens
- Componentes reutilizaveis documentados
- Dark mode como first-class citizen
- Validacao automatica via `@check-design`

### Negativas
- Overhead de manter o design-system sincronizado
- Curva de aprendizado dos tokens

## Regras para Validacao

### Cores e Tokens
- PROIBIDO: cores hardcoded (hex/rgb/hsl direto em componentes)
- PROIBIDO: spacing magic numbers (usar scale do Tailwind)
- OBRIGATORIO: todas as cores via CSS variables (`bg-primary`, `text-muted-foreground`, etc)
- OBRIGATORIO: dark mode suportado via `.dark` class

### Componentes e DS
- OBRIGATORIO: componentes usados no app devem ter showcase no design-system
- PREFERIDO: usar componentes da lib base ({shadcn/ui | outra}) em vez de criar do zero
- PREFERIDO: customizar via wrapper em vez de modificar componente base
- PREFERIDO: manter design-system sincronizado com o app (componentes removidos = showcase removido)
