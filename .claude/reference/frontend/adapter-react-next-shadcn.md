# Adapter — React + Next.js (app router) + shadcn/ui (+ Tailwind)

> Adapter de stack para o modulo de front. Materializa "como esta stack faz X".
> **Lido por**: `@ds-foundation`, `@ds-component`, `@check-ai-cliches`, `@design`, `@paper-prototype` — quando o projeto e detectado como esta stack.
> **Materializado** em `docs/design-system/stack-profile.json` durante `/ds-init`.

---

## Identificacao

**Detectar este adapter quando**:
- `next.config.{js,mjs,ts}` na raiz do projeto.
- `package.json` lista `next` e `react`.
- Pasta `app/` na raiz (app router) — diferente de `pages/` (pages router, nao coberto aqui).
- `components.json` na raiz (gerado por `npx shadcn init`) — opcional.

---

## stack-profile.json (seed deste adapter)

```json
{
  "version": 1,
  "framework": "react-next",
  "uiLibrary": "shadcn",
  "styling": "tailwind",
  "tokens": {
    "format": "css-variables",
    "location": "app/globals.css",
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
    "location": "components/ui",
    "importPath": "@/components/ui/{name}",
    "install": {
      "command": "npx shadcn@latest add {name}",
      "perComponent": true
    }
  }
}
```

---

## Convencoes especificas

### Rota do design-system
- Pasta: `app/design-system/`.
- Roteamento **por convencao** (zero codigo de registro):
  ```
  app/design-system/
    ├── layout.tsx       ← shell visual
    ├── navigation.ts    ← lista de nav sections
    └── page.tsx         ← Design Tokens Page
  ```
- Subrotas de componente: `app/design-system/components/{nome}/page.tsx`.

### Diretivas
- **`"use client"`** no topo de TODA pagina/componente que usa `useState`, `useEffect`, event handlers, `usePathname`, hooks de cliente.
- O componente `DesignSystemLayout` (com hooks) PRECISA de `"use client"`.

### Imports especificos do Next
- `import Link from "next/link"`, `import { usePathname } from "next/navigation"`.
- **NAO** usar `react-router-dom` — conflita com Next routing.

### Fontes
- Via `next/font/google`:
  ```tsx
  import { Inter } from "next/font/google"
  const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
  ```
- Aplicar no `<html>` ou `<body>`: `className={inter.variable}`.

### Metadata (SEO)
- Permitido:
  ```tsx
  import type { Metadata } from "next"
  export const metadata: Metadata = { title: "Design System" }
  ```

### Install de componentes shadcn
- Mesmo que Vite: `npx shadcn@latest add {component}`, saida em `components/ui/`.

### Tokens em globals.css
- Idem Vite: `:root { ... }`, `.dark { ... }`, `@theme inline` (Tailwind v4).
- Arquivo: `app/globals.css`, importado em `app/layout.tsx`.

---

## Como o `@check-ai-cliches` aplica regras nesta stack

Identico ao react-vite-shadcn — Tailwind classes sao iguais. A diferenca esta apenas na deteccao de "diretiva proibida" (no Vite e `"use client"`; no Next e `react-router-dom`).

---

## Como `@ds-foundation` usa este adapter

1. Detecta `next.config.*` + pasta `app/` → carrega este arquivo.
2. Phase 3 (Design Tokens): gera `app/globals.css`.
3. Phase 4 (Font): aplica `next/font/google` em `app/layout.tsx`.
4. Phase 5 (Components Base): instala via `npx shadcn@latest add {lista}`.
5. Phase 6.0: rota emerge por convencao (zero codigo extra). Cria `app/design-system/{layout.tsx, navigation.ts, page.tsx}`.
6. Phase 6.2: `DesignSystemLayout` recebe `"use client"` (usa `usePathname`).
7. Phase 6.3: `page.tsx` recebe `"use client"` se usar `useState` (toggle dark mode).
8. Phase 7 (ADR): gera ADR do DS.
9. **Phase 8 (Passo 4): emite `docs/design-system/stack-profile.json`** com o JSON acima.
