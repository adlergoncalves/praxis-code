---
name: check-web-guidelines
description: Valida UI contra as Web Interface Guidelines (Vercel) — acessibilidade, foco, formularios, animacao, tipografia, conteudo, imagens, performance, navegacao e estado na URL, toque, layout, tema, locale, hidratacao e copy. Regras de um snapshot fixado no kit, filtradas pela stack e pelo idioma do projeto. Saida terse em arquivo:linha.
tools: Read, Glob, Grep
depends:
  - .claude/reference/frontend/anti-patterns.md
  - .claude/reference/frontend/third-party
---

## ENTRADA
$ARGUMENTS → Caminho, lista de arquivos (escopo de uma fatia) ou "geral"

## FONTE DAS REGRAS

As regras **nao sao embutidas aqui**: ler por inteiro
`.claude/reference/frontend/third-party/web-interface-guidelines/command.md` (snapshot fixado em
commit — origem e versao em `.claude/reference/frontend/third-party/README.md`). **Nao buscar a
versao online**: o kit valida contra a versao fixada, para o resultado nao mudar sem ninguem ver.
Se o snapshot nao existir, falhar gracioso: avisar que o check nao rodou (NAO VERIFICADO).

## FILTROS (aplicar antes de julgar — sem eles o check gera ruido)

Determinar a stack por `docs/design-system/stack-profile.json`, ADRs e `package.json`, e o idioma
da UI pelos arquivos de i18n / `lang` do documento.

| Secao do snapshot | Aplica quando |
|---|---|
| **Hydration Safety** | Stack com renderizacao no servidor (Next.js, Nuxt, SvelteKit, Remix, Astro com ilhas). SPA pura (Vite/CRA) → pular |
| Regras que citam API de framework (`onKeyDown`, `<Link>`, `useState`, `next/image`) | Traduzir para o equivalente da stack (Vue, Angular, Svelte). Sem equivalente → pular |
| **Content & Copy**: Title Case, `&` no lugar de "and" | So em UI em **ingles** e so se o projeto nao decidiu outra coisa. Em qualquer outro idioma: nao aplicar (o kit usa sentence case — ver precedencia em `third-party/README.md`) |
| Demais secoes | Sempre |

**Decisao do projeto vence a guideline**: o que `docs/design-system/system.md`, o Charter ou uma ADR
decidem explicitamente nao e achado. Em conflito com `.claude/reference/frontend/anti-patterns.md`
ou com os registers, o kit vence (precedencia no README de terceiros).

## REGRAS DINAMICAS
Carregar `docs/project/learnings/frontend-learnings.md` (correcoes do usuario tem peso maximo) e as
ADRs de frontend em `docs/adr/`.

## EXECUCAO

1. Resolver o escopo (`$ARGUMENTS`; sem argumento → arquivos de UI do projeto: `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`, `.astro`).
2. Ler o snapshot e aplicar os filtros acima.
3. Varrer os arquivos do escopo regra a regra (Grep para os padroes mecanicos — `onClick` em `div`, `outline: none` sem `focus-visible`, `transition: all`, `<img` sem `alt`/dimensoes, `user-scalable=no`, `onPaste` bloqueado; Read para o que exige contexto).
4. Emitir no formato de saida do proprio snapshot (agrupado por arquivo, `arquivo:linha — problema`), prefixando a classificacao.

## CLASSIFICACAO

- **ERRO**: acessibilidade e foco (botao so com icone sem nome acessivel, controle de formulario sem label, `div`/`span` clicavel no lugar de `button`/`a`, foco removido sem substituto visivel), zoom desabilitado, colar bloqueado em input, imagem de conteudo sem `alt`.
- **AVISO**: o restante das secoes aplicaveis.

ERRO deste check bloqueia o `DONE` de uma fatia de UI no `/execute`, como os demais verificadores.

## SAIDA

```markdown
## check-web-guidelines — {escopo}
Snapshot: {commit do README de terceiros} · Filtros: {stack} · {idioma} · secoes puladas: {…}

## src/components/Toolbar.tsx
- ERRO :12 — botao so com icone sem aria-label
- AVISO :40 — transition: all → listar propriedades

## Resumo
ERRO {n} · AVISO {n} · arquivos sem achado: {n}
```
