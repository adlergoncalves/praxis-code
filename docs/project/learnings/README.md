# Learnings do Projeto — a evidencia da memoria

> **A memoria do projeto tem duas camadas (ADR-0010).** A **regra ativa** vive em `.claude/rules/learned/`
> e e o que muda a implementacao: o Claude Code a carrega sozinho — por `paths`, quando um arquivo da area
> e lido, escrito ou editado — na sessao principal, nos subagentes e nas sessoes do driver. Os arquivos
> desta pasta sao a **evidencia**: o historico de cada descoberta e correcao, por que a regra existe,
> quando mudou ou caiu. Ninguem carrega esta pasta por obrigacao; abre-se a entrada que uma regra cita
> (`origem`) ou o arquivo quando se investiga.

---

## O que vai onde

| Aconteceu | Regra ativa (`.claude/rules/learned/`) | Evidencia (aqui) | `ledger.md` |
|---|---|---|---|
| Usuario corrigiu decisao, nome, padrao, comportamento | **sim, na 1a vez, no mesmo turno** (molde `docs/templates/rule-template.md`) | entrada `[CORRECAO DO USUARIO]` | linha `correcao` |
| Descoberta nao prevista (divergencia, pattern, edge case) | so se mudar a implementacao (ao virar `aplicado`) | entrada Tipo 1 | linha `descoberta` |
| Decisao, risco aceito, brief aprovado, escopo alterado | nao — nao e regra | nota na secao do dominio | linha `decisao` |
| Regra derrubada (fonte mudou, premissa caiu, `derruba_com` provou) | **arquivo removido** (o git guarda) | data e motivo na entrada de origem | linha `decisao` |
| Regra consolidada em ADR | **arquivo removido** — a ADR e a fonte, o `@adr-validator` cobra | entrada marcada `aplicado (ADR-NNNN)` | linha `decisao` |

## Arquivos de evidencia

| Arquivo | O que guarda |
|---------|--------------|
| `frontend-learnings.md` | UI, componentes, estado, rotas, Design System |
| `backend-learnings.md` | API, dominio, testes, infra |
| `business-learnings.md` | regras de negocio, decisoes de produto, personas |
| `architecture-learnings.md` | decisoes arquiteturais recorrentes, ADR patterns |
| `process-learnings.md` | o que funciona (ou nao) no processo do kit; riscos aceitos |

Mesmo prefixo das regras: `.claude/rules/learned/frontend-<slug>.md` aponta `origem` para `frontend-learnings.md#<data da entrada>`.

---

## Dois tipos de entrada

### Tipo 1 — Descoberta durante execucao
Algo nao previsto encontrado durante o trabalho:

```markdown
### {data} — {agent} durante {contexto}
- **Descoberta**: {o que foi encontrado}
- **Decisao**: {o que foi feito a respeito}
- **Impacto**: {quem/o que e afetado}
- **Acao sugerida**: criar regra ativa? criar ADR? atualizar spec? ajustar DS? nenhuma?
- **Status**: pendente | aplicado | descartado
```

### Tipo 2 — Correcao do usuario `[CORRECAO DO USUARIO]`
Quando o usuario corrige uma decisao de implementacao, nomeacao, padrao ou comportamento do kit. Peso maximo:
o mesmo erro nao se repete. **A entrada e a evidencia; a regra e o arquivo em `.claude/rules/learned/`,
gravado no mesmo turno** por quem recebeu a correcao (Praxis ou a skill em curso).

```markdown
### {data} — [CORRECAO DO USUARIO] durante {contexto}
- **O que foi feito errado**: {descricao do que foi implementado ou proposto}
- **Correcao aplicada**: {o que o usuario pediu para mudar}
- **Motivo**: {justificativa do usuario, se fornecida}
- **Regra derivada**: {a mesma linha `**Regra**` do arquivo da regra}
- **Escopo**: {onde mais se aplica — nunca "neste componente"}
- **Regra ativa**: `.claude/rules/learned/{dominio}-{slug}.md`
- **Status**: resolvido | invalidada em {data}: {motivo} | aplicado (ADR-NNNN)
```

---

## Regra ativa — forma, validade e cobranca

- **Molde**: `docs/templates/rule-template.md`. Frontmatter com `paths` (globs da **area** em que vale; omitir
  so quando vale em qualquer trabalho — custa contexto em toda sessao), `dominio`, `medido_em`, `derruba_com`,
  `vale_enquanto`, `check`, `origem`. Corpo de 2 a 5 linhas: `**Regra**`, `**Escopo**`, `**Fonte**`
  (`arquivo:linha`), `**Por que**`. O Claude Code remove o frontmatter antes de carregar; o agente le so o corpo.
- **Validade na leitura**: regra com `Fonte` e conferida antes de ser aplicada. Codigo contradiz a fonte → a
  regra nao se aplica e e **derrubada** (arquivo sai; a origem registra). Sessao nao interativa (fatia do
  driver) nao derruba: registra no relatorio e a sessao principal derruba no fechamento.
- **Cobranca**: `node .claude/scripts/memory-check.mjs` — ERRO (exit 1) para frontmatter quebrado (a regra
  passaria a carregar em toda sessao, em silencio), campo obrigatorio ausente, corpo sem `Regra` ou com mais
  de 8 linhas, `Fonte` morta; AVISO para `medido_em` vencido (`PRAXIS_RULE_MAX_DIAS`, padrao 90), `check`
  ou `origem` inexistentes, regras sem `paths` acima do orcamento (`PRAXIS_RULES_SEMPRE_MAX`, padrao 10) e
  `[CORRECAO DO USUARIO]` sem regra (migracao). Roda no inicio da sessao (hook `reconcile.mjs`: uma linha;
  problemas no maximo 1x/dia), no fechamento do `/execute` e no `/verify-all`.
- **Nada alem de regra em `.claude/rules/`**: todo `.md` ali e carregado. Sem README, indice ou rascunho.

## Escada — quem promove

| Ocorrencia | Acao | Quem |
|---|---|---|
| 1a correcao | regra ativa + evidencia + ledger, no mesmo turno | quem recebeu a correcao |
| regressao (correcao que ja tem regra) | ampliar `paths`/`Escopo`; se verificavel por maquina, `/forge` cria o check e preenche `check:` | Praxis (LOOP DE MELHORIA) |
| 3a+ ocorrencia ou `Acao sugerida: criar ADR` | `/architect`; a regra sai e a ADR vira a fonte | Praxis → `/architect` |

---

## Ledger — a linha do tempo

Dois ledgers registram **quando** cada coisa aconteceu:

| Arquivo | Versionado? | Quem grava | O que entra |
|---|---|---|---|
| `ledger.md` | sim | o assistente, no instante | linhas `(llm)`: decisao, correcao, descoberta |
| `ledger-auto.md` | nao (gitignored) | hook `capture.mjs`, a cada turno | linhas `(auto)`: arquivos alterados no turno |

Formato (uma linha por evento, abaixo da marca `<!-- LEDGER:START -->`):

```
<timestamp ISO> | <tipo> | domain:<dominio> | "<resumo>" | (llm)
```

- Correcao do usuario → regra ativa + entrada `[CORRECAO DO USUARIO]` + linha `correcao` com a regra.
- Descoberta → entrada Tipo 1 + linha `descoberta`.
- Regra derrubada ou consolidada em ADR → linha `decisao`.
- O hook `reconcile.mjs` le os dois ledgers numa linha do tempo so: no inicio da sessao injeta o estado, a
  atividade recente e a cobranca do `memory-check`; a cada prompt avisa quando ha turno com arquivo alterado
  sem linha `(llm)` correspondente. **Nao injeta regras**: elas carregam pelo Claude Code. Os hooks sao rede;
  a fonte primaria e a gravacao no instante.
- Detalhe do formato e dos tipos: o cabecalho de `ledger.md`.

---

## Ciclo de vida

```
Correcao / Descoberta
    → regra ativa (.claude/rules/learned/) + evidencia aqui + linha no ledger — no instante
        → carrega sozinha ao tocar a area (paths) → o erro nao se repete
            → regrediu?      amplia a regra + check (/forge)
            → fonte mudou?   derruba (arquivo sai; a evidencia registra data e motivo)
            → virou padrao?  ADR (/architect) — a regra sai; a ADR cobra
```
