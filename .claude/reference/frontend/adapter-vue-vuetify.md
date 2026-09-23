# Adapter — Vue 3 + Vuetify

> Adapter de stack para o modulo de front. Materializa "como esta stack faz X".
> **Lido por**: `@ds-foundation`, `@ds-component`, `@check-ai-cliches`, `@design`, `@paper-prototype` — quando o projeto e detectado como esta stack.
> **Materializado** em `docs/design-system/stack-profile.json` durante `/ds-init`.

---

## Identificacao

**Detectar este adapter quando**:
- `vite.config.{ts,js}` na raiz (Vue moderno tipicamente usa Vite).
- `package.json` lista `vue` (3.x) e `vuetify`.
- Arquivos `.vue` (single file components) em `src/`.

---

## stack-profile.json (seed deste adapter)

```json
{
  "version": 1,
  "framework": "vue-vite",
  "uiLibrary": "vuetify",
  "styling": "scss",
  "tokens": {
    "format": "vuetify-theme",
    "location": "src/plugins/vuetify.ts",
    "patterns": {
      "valid": [
        "var\\(--v-theme-[\\w-]+\\)",
        "var\\(--[\\w-]+\\)",
        "(?::?color|:?bg-color)\\s*=\\s*[\"'](?:primary|secondary|accent|info|success|warning|error|surface|on-surface)[\"']",
        "(?:bg|text)-(?:primary|secondary|accent|info|success|warning|error|surface|on-surface)\\b",
        "\\$(?:primary|secondary|accent|info|success|warning|error|surface)\\b"
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
    "location": "src/components",
    "importPath": "vuetify/components",
    "install": {
      "command": "npm install vuetify",
      "perComponent": false,
      "perComponentImport": "import { VBtn, VCard, ... } from 'vuetify/components'",
      "notes": "Vuetify e instalado via plugin (`src/plugins/vuetify.ts`). Componentes sao importados conforme necessidade (auto-import via vite-plugin-vuetify ou manual)."
    }
  }
}
```

---

## Convencoes especificas

### Rota do design-system
- Pasta: `src/design-system/`.
- Roteamento via `vue-router` em `src/router/index.ts`:
  ```ts
  import { createRouter, createWebHistory } from 'vue-router'
  import DesignSystem from '@/design-system/index.vue'

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/design-system', component: DesignSystem }],
  })
  ```

### Single File Components
- `.vue` com `<template>`, `<script setup>`, `<style scoped>`.
- Composition API (`<script setup>`) preferida em Vue 3 moderno.

### Componentes Vuetify
- Importar do `vuetify/components`. Auto-import recomendado via `vite-plugin-vuetify`:
  ```ts
  // vite.config.ts
  import vuetify from 'vite-plugin-vuetify'
  export default defineConfig({ plugins: [vue(), vuetify({ autoImport: true })] })
  ```
- Usar com prop `color`:
  ```vue
  <v-btn color="primary">Salvar</v-btn>
  <v-card color="surface">...</v-card>
  ```

### Tema
- `src/plugins/vuetify.ts` configura o theme:
  ```ts
  import { createVuetify } from 'vuetify'
  export default createVuetify({
    theme: {
      defaultTheme: 'light',
      themes: {
        light: { colors: { primary: '#...', secondary: '#...', ... } },
        dark: { colors: { primary: '#...', ... } },
      },
    },
  })
  ```
- Dark mode: `useTheme().global.name.value = 'dark'`.

### Tokens via CSS vars
- Vuetify expoe automaticamente `var(--v-theme-primary)`, `var(--v-theme-surface)`, etc. em runtime.
- Pode-se usar em CSS escopo:
  ```vue
  <style scoped>
  .my-card { background: rgb(var(--v-theme-surface)); }
  </style>
  ```

---

## Como o `@check-ai-cliches` aplica regras nesta stack

Quando `stack-profile.json` desta stack esta presente:
- Regra `tokens/hardcoded-color` dispara em `#hex`, `rgb()`, `hsl()` em `.vue`, `.scss`, `.ts`, EXCETO em:
  - Definicao do theme (`src/plugins/vuetify.ts` — onde a paleta nasce).
  - Linhas com `:root`, `--var:`.
- Tokens validos: props `color="primary|accent|...|surface|on-surface|error|warning|info|success"`, vars `var(--v-theme-*)`.

---

## Como `@ds-foundation` usa este adapter

1. Detecta `vite.config.*` + `vue` + `vuetify` → carrega este arquivo.
2. Phase 2 (Lib): instala `vuetify` + `vite-plugin-vuetify`; registra plugin em `vite.config.ts`.
3. Phase 3 (Tokens): cria `src/plugins/vuetify.ts` com `createVuetify({ theme: {...} })` — paleta light + dark.
4. Phase 4 (Font): via `<link>` em `index.html` ou `@import` no estilo global.
5. Phase 5 (Components Base): nao instala um por um — Vuetify ja vem com todos; documenta no design-system os usados no projeto.
6. Phase 6.0: registra rota `/design-system` via `vue-router`.
7. Phase 6.2/6.3: `.vue` com `<script setup>`, `<v-app-bar>`, `<v-navigation-drawer>`, etc.
8. Phase 7 (ADR): gera ADR do DS.
9. **Phase 8 (Passo 4): emite `docs/design-system/stack-profile.json`** com o JSON acima.
