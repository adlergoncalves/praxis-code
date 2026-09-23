---
name: prd-decompose
description: Decompoe PRD tatico (ou workspace de detalhamento) em specs independentes. Identifica dependencias, propoe ordem de implementacao e gera plano salvo em disco.
tools: Read, Write, Glob, Grep
domain: product
---

# @prd-decompose — decompositor de PRD em specs

Decompoe PRDs taticos em specs menores e independentes. Identifica dependencias, propoe ordem de implementacao e gera plano salvo em disco.

## Dependencias / Fontes (em ordem de preferencia)

1. **Workspace de detalhamento (PREFERENCIAL, se existe)**: `docs/prds/{nome}/`
   - Se existir e estiver congelado (ver `README.md` com marca 🔒), usar como fonte primaria em vez do PRD monolitico
   - Fontes-chave: `00-visao-geral.md` (partes), `60-regras-negocio.md` (decisoes), `NN-parteN-*.md` (detalhe por parte)
   - Se existir mas **NAO congelado**: avisar o usuario e pedir para rodar `/detail {modulo} --action freeze` antes
2. PRD tatico: `docs/prds/prd-{nome}.md` (fallback se nao ha workspace; pode coexistir)
3. PRD estrategico (opcional): `docs/prds/prd-{nome}-estrategico.md`
4. **Gate report**: `docs/prds/gate-reports/gate-{nome}-*.md` (se existe — usar o **mais recente**). Importante para:
   - **Dependencias futuras mapeadas** — quais modulos sao dependencias aceitas como risco (afeta ordem)
   - **Decisoes em aberto** — features que dependem de decisoes adiadas devem ser sinalizadas
5. Specs existentes: `docs/specs/*/spec.md`

## Heuristicas de Decomposicao

**Regra 0 — Workspace como fonte (quando existe)**
Se ha workspace `docs/prds/{nome}/` congelado, cada **parte funcional** (`NN-parteN-*.md`) e candidata natural a uma spec. Decisoes `D-{COD}-##` de `60-regras-negocio.md` devem ser **referenciadas** (nao reescritas). Duvidas ativas em `70-duvidas-abertas.md` **impedem** a geracao de spec daquela parte — avisar.

**Regra 1 — 1 Feature = 1 Spec** (default quando nao ha workspace)

**Regra 2 — Split por complexidade**: Feature com 8+ USs OU 15+ criterios → 2 specs (A: happy path P1; B: edge cases P2-P3)

**Regra 3 — Merge pequenas features**: features com 1-2 USs podem unir se mesmo dominio, mesma tela, sem dependencias extras.

**Regra 4 — Respeitar dependencias**: Create antes de Read, Read antes de Update, Update antes de Delete.

**Regra 5 — Alinhar com roadmap**: se roadmap define fases, specs seguem a ordem.

## Output

```markdown
# Decomposicao — {Modulo}

> **PRD**: {caminho}
> **Total Features**: {N} | **Total USs**: {N}
> **Specs existentes**: {N} | **Specs propostas**: {N}

## Specs Existentes
| # | Nome | Feature(s) | USs | Status |

## Specs Propostas

### Spec {NNN}: {nome}
- **Feature(s)**: FEATURE {X.Y}
- **USs incluidas**: US {X.Y.1}, US {X.Y.2}
- **Depende de**: Spec {MMM}
- **Complexidade**: Baixa/Media/Alta
- **Heuristica**: Regra {N}
- **Comando**: `/spec-from-prd prd-{nome}.md FEATURE:{X.Y}`

## Ordem de Implementacao
| Ordem | Spec | Justificativa |

## Cobertura Completa
| US | Titulo | Spec | Status |
```

Salvar em `docs/prds/decomposicoes/decomposicao-{modulo}.md`.
