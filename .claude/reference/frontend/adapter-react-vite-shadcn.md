# Adapter — React + Vite + shadcn/ui (+ Tailwind)

> Adapter de stack para o modulo de front. Materializa "como esta stack faz X".
> **Lido por**: `@ds-foundation`, `@ds-component`, `@check-ai-cliches`, `@design`, `@paper-prototype` — quando o projeto e detectado como esta stack.
> **Materializado** em `docs/design-system/stack-profile.json` durante `/ds-init`.

---

## Identificacao

**Detectar este adapter quando**:
- `vite.config.{ts,js}` na raiz do projeto.
- `package.json` lista `react` e `vite`.
- `components.json` na raiz (gerado por `npx shadcn init`) — opcional, indica shadcn.
- `tailwind.config.{ts,js}` na raiz (ou `@tailwindcss/vite` plugin) — indica Tailwind.

---

## stack-profile.json (seed deste adapter)

```json
{
  "version": 1,
  "framework": "react-vite",
  "uiLibrary": "shadcn",
  "styling": "tailwind",
  "tokens": {
    "format": "css-variables",
    "location": "src/globals.css",
    "patterns": {
      "valid": [
        "var\\(--[\\w-]+\\)",
        "(?:^|[\\s\"'`])(?:bg|text|border|fill|ring|stroke|outline|from|to|via)-(?!\\[)[\\w-]+"
      ],
      "hardcoded": [
        "#[0-9a-fA-F]{3,8}\\b",
        "rgba?\\([^)]+\\)",
        "hsla?\\([^)]+\\)",
        "oklch\\([^)]+\\)"
      ]
    }
  },
  "components": {
    "location": "src/components/ui",
    "importPath": "@/components/ui/{name}",
    "install": {
      "command": "npx shadcn@latest add {name}",
      "perComponent": true
    }
  }
}
```

> `@ds-foundation` materializa este JSON em `docs/design-system/stack-profile.json` na execucao de `/ds-init`. O usuario pode editar (ajustar regex, adicionar excecoes).

---

## Convencoes especificas

### Rota do design-system
- Pasta: `src/design-system/`
- Roteamento **explicito** via `react-router-dom` em `src/App.tsx`:
  ```tsx
  import { BrowserRouter, Route, Routes } from "react-router-dom"
  import DesignSystemLayout from "./design-system/layout"
  import DesignSystemPage from "./design-system/page"

  // <Route path="/design-system" element={<DesignSystemLayout><DesignSystemPage /></DesignSystemLayout>} />
  ```
- O nome `page.tsx` e apenas convencao para manter estrutura mental similar ao Next. Vite nao reconhece convencao de nome.

### Diretivas / imports proibidos
- **NUNCA** usar `"use client"` — Vite nao reconhece, gera warning.
- **NUNCA** `import type { Metadata }` ou `import` de `next/*` — quebra o build.
- **NUNCA** `next/font` — pacote so funciona em Next.js.

### Fontes
- Via `<link>` em `index.html` (preferido, mais rapido) **OU** `@import` no topo do `globals.css`.
- Aplicar em `body { font-family: "{Fonte}", sans-serif; }`.

### Install de componentes shadcn
- Inicializacao: `npx shadcn@latest init` (responde Style Default, Base color Neutral, CSS variables Yes).
- Adicao: `npx shadcn@latest add {component}`.
- Saida em `src/components/ui/`.

### Tokens em globals.css
- Bloco `:root { --primary: ... --foreground: ... }` (light).
- Bloco `.dark { --primary: ... }` (dark).
- `@theme inline` mapeia para Tailwind v4.

---

## Como o `@check-ai-cliches` aplica regras nesta stack

Quando `stack-profile.json` desta stack esta presente:
- Regra `tokens/hardcoded-color` dispara em `#hex`, `rgb()`, `hsl()`, `oklch()` em qualquer arquivo, EXCETO em linhas de definicao de token (`--xxx: ...`, dentro de `:root`).
- Tokens validos: `var(--xxx)`, classes Tailwind do tipo `bg-primary`, `text-foreground`, `border-input`, `ring-ring`, `fill-current`, `from-blue-500`, etc.
- Cor em `style={{ backgroundColor: "..."}}` inline e flag (precisa pular para token).

---

## Como `@ds-foundation` usa este adapter

1. Detecta `vite.config.*` na raiz → carrega este arquivo.
2. Phase 3 (Design Tokens): gera `src/globals.css` com `:root { ... }` + `.dark { ... }` + `@theme inline`.
3. Phase 4 (Font): aplica `<link>` no `index.html` OU `@import` no `globals.css`. Nunca `next/font`.
4. Phase 5 (Components Base): instala via `npx shadcn@latest add {lista}`.
5. Phase 6.0: registra rota `/design-system` em `src/App.tsx` via `react-router`.
6. Phase 6.2/6.3: componentes sem `"use client"`, sem `Metadata`.
7. Phase 7 (ADR): gera ADR do DS.
8. **Phase 7b do `@ds-foundation`: emite `docs/design-system/stack-profile.json`** com o JSON acima.
