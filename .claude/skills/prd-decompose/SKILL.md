---
description: "Decompoe PRD tatico em specs independentes. Identifica dependencias e propoe ordem de implementacao."
user-invocable: true
---

# /prd-decompose

Decompoe PRDs taticos em specs menores e independentes. Identifica dependencias, propoe ordem de implementacao e gera plano salvo em disco.

## Input

`/prd-decompose {modulo}` ou `/prd-decompose {modulo} FEATURE:1.1-1.3`

## Dependencias / Fontes

Em ordem de preferencia:

1. **Workspace de detalhamento (PREFERENCIAL, se existe)**: `docs/prds/{nome}/`
   - Se existir e estiver congelado (ver `README.md` com marca 🔒), usar como fonte primaria em vez do PRD monolitico
   - Fontes-chave do workspace: `00-visao-geral.md` (partes), `60-regras-negocio.md` (decisoes), `NN-parteN-*.md` (detalhe por parte)
   - Se existir mas **NAO congelado**: avisar o usuario e pedir para rodar `/detail {modulo} --action freeze` antes
2. PRD tatico: `docs/prds/prd-{nome}.md` (fallback se nao ha workspace; pode coexistir com workspace)
3. PRD estrategico (opcional): `docs/prds/prd-{nome}-estrategico.md`
4. **Gate report**: `docs/prds/gate-reports/gate-{nome}-*.md` (se existe — usar o **mais recente**). Importante para:
   - **Dependencias futuras mapeadas** — saber quais modulos sao dependencias aceitas como risco (ex: "Vendas depende de Estoque aceito como risco" afeta ordem de implementacao)
   - **Decisoes em aberto** — features que dependem de decisoes adiadas devem ser sinalizadas na decomposicao
5. Specs existentes: `docs/specs/*/spec.md`

## Heuristicas de Decomposicao

**Regra 0 — Workspace como fonte (quando existe)**

Se ha workspace `docs/prds/{nome}/` congelado, cada **parte funcional** (arquivos `NN-parteN-*.md`) e candidata natural a uma spec. Decisoes `D-{COD}-##` de `60-regras-negocio.md` devem ser **referenciadas** nas specs (nao reescritas). Duvidas ativas em `70-duvidas-abertas.md` devem **impedir** a geracao de spec daquela parte — avisar o usuario.

**Regra 1 — 1 Feature = 1 Spec** (default quando nao ha workspace)

**Regra 2 — Split por complexidade**

Se Feature tem 8+ USs OU 15+ criterios → 2 specs:
- Spec A: happy path (P1)
- Spec B: edge cases (P2-P3)

**Regra 3 — Merge pequenas features**

Features com 1-2 USs podem unir se: mesmo dominio, mesma tela, sem dependencias extras.

**Regra 4 — Respeitar dependencias**

Create antes de Read, Read antes de Update, Update antes de Delete.

**Regra 5 — Alinhar com roadmap**

Se roadmap define fases, specs seguem a ordem.

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

## Handoffs

- → `/detail {modulo}` (se detectar modulo ambiguo/grande sem workspace)
- → `/spec-from-prd` (para criar cada spec)
- → `/prd-coverage` (para acompanhar progresso)
