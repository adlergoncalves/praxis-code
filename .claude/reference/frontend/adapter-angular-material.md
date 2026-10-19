# Adapter — Angular + Angular Material

> Adapter de stack para o modulo de front. Materializa "como esta stack faz X".
> **Lido por**: `@ds-foundation`, `@ds-component`, `@check-ai-cliches`, `@design`, `@paper-prototype` — quando o projeto e detectado como esta stack.
> **Materializado** em `docs/design-system/stack-profile.json` durante `/ds-init`.

---

## Identificacao

**Detectar este adapter quando**:
- `angular.json` na raiz do projeto.
- `package.json` lista `@angular/core` e `@angular/material`.
- Estrutura `src/app/` com `*.component.ts`, `*.component.html`, `*.component.scss`.

---

## stack-profile.json (seed deste adapter)

```json
{
  "version": 1,
  "framework": "angular",
  "uiLibrary": "angular-material",
  "styling": "scss",
  "tokens": {
    "format": "scss-theme",
    "location": "src/styles.scss",
    "patterns": {
      "valid": [
        "mat\\.(?:get-color|define-palette|define-theme|m2-define|m3-theme)",
        "var\\(--mat-[\\w-]+\\)",
        "var\\(--[\\w-]+\\)",
        "color\\s*=\\s*[\"'](?:primary|accent|warn)[\"']",
        "\\[color\\]\\s*=\\s*[\"'][^\"']+[\"']",
        "mat-(?:button|icon|card|toolbar|sidenav|fab|raised-button|stroked-button|flat-button|menu|tabs|chip|table|tooltip)"
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
    "location": "src/app/components",
    "importPath": "@angular/material/{name}",
    "install": {
      "command": "ng add @angular/material",
      "perComponent": false,
      "perComponentImport": "ng generate @angular/material:{name}",
      "notes": "Angular Material e instalado uma unica vez (ng add). Componentes vem como modulos importaveis. Showcase no design-system se faz importando MatXxxModule em AppModule."
    }
  }
}
```

---

## Convencoes especificas

### Rota do design-system
- Modulo Angular: `src/app/design-system/design-system.module.ts`.
- Component pages: `src/app/design-system/tokens/tokens.component.{ts,html,scss}`.
- Roteamento via `AppRoutingModule`:
  ```ts
  { path: 'design-system', loadChildren: () => import('./design-system/design-system.module').then(m => m.DesignSystemModule) }
  ```

### Templates separados
- Logica em `.component.ts`.
- Template em `.component.html` (binding com `[]`, `()`, `*ngFor`, `*ngIf`).
- Estilos em `.component.scss` (encapsulamento Angular default).

### Componentes Material
- Importar modulos: `MatButtonModule`, `MatIconModule`, `MatCardModule`, etc.
- Usar com atributo `color`:
  ```html
  <button mat-raised-button color="primary">Salvar</button>
  ```

### Tema
- `src/styles.scss` (global) configura theme:
  ```scss
  @use '@angular/material' as mat;
  @include mat.core();

  $primary: mat.define-palette(mat.$indigo-palette);
  $accent: mat.define-palette(mat.$pink-palette);
  $theme: mat.define-light-theme((color: (primary: $primary, accent: $accent)));
  @include mat.all-component-themes($theme);
  ```
- Dark mode: criar `$dark-theme` e aplicar via `.dark-mode { @include mat.all-component-colors($dark-theme); }`.

### Install
- Inicializacao: `ng add @angular/material` (responde tema + typography + animations).
- Componentes ja vem disponiveis via import de modulo — nao precisa "adicionar" um por um.

---

## Como o `@check-ai-cliches` aplica regras nesta stack

Quando `stack-profile.json` desta stack esta presente:
- Regra `tokens/hardcoded-color` dispara em `#hex`, `rgb()`, `hsl()` em arquivos `.scss`, `.css`, `.ts`, `.html`, EXCETO em definicao de paleta/tema (linhas com `mat.define-palette`, `:root`, `--var:`).
- Tokens validos: variaveis CSS do Material (`var(--mat-*)`), funcoes de tema do Material (`mat.get-color-config`), atributos `color="primary|accent|warn"` em templates.
- Cor inline em `[style.background]="..."` com hex e flag.

---

## Como `@ds-foundation` usa este adapter

1. Detecta `angular.json` → carrega este arquivo.
2. Phase 2 (Lib): roda `ng add @angular/material` (interativo — usuario responde tema + animations).
3. Phase 3 (Tokens): configura paleta em `src/styles.scss` via `mat.define-palette` + `mat.define-light-theme`.
4. Phase 4 (Font): adicionar `<link>` no `index.html` (Google Fonts) ou usar `@import` no `styles.scss`.
5. Phase 5 (Components Base): nao instala um por um — orienta o usuario sobre quais modulos importar em `AppModule` (ex.: MatButtonModule, MatCardModule).
6. Phase 6.0: cria `DesignSystemModule` + roteamento via `AppRoutingModule`.
7. Phase 6.2/6.3: components Angular com template separado.
8. Phase 7 (ADR): gera ADR do DS.
9. **Phase 7b do `@ds-foundation`: emite `docs/design-system/stack-profile.json`** com o JSON acima.
