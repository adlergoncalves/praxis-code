# Learnings do Projeto

> **Memoria evolutiva do kit.** Quanto mais o projeto avanca, mais inteligente o kit fica.
> Agents registram aqui o que descobrem durante o trabalho. Cada arquivo cobre um dominio especifico
> para que futuras skills carreguem apenas o que e relevante — economizando tokens e contexto.

---

## Arquivos de Learnings

| Arquivo | Quando escrever | Quem le |
|---------|----------------|---------|
| `frontend-learnings.md` | Patterns de UI, componentes, estado, rotas, DS | `@check-*` frontend, `/execute` (team front) |
| `backend-learnings.md` | Patterns de API, dominio, testes, infra | `@check-*` backend, `/execute` (team back) |
| `business-learnings.md` | Regras de negocio, decisoes de produto, personas | `@strategy`, `/prd-create`, `/spec-from-prd`, `@spec-review` |
| `architecture-learnings.md` | Decisoes arquiteturais recorrentes, ADR patterns | `@adr-creator`, `@adr-validator`, `@planner` |
| `process-learnings.md` | O que funciona (ou nao) no processo do kit | Todas as skills ao iniciar |

---

## Dois tipos de learning

### Tipo 1 — Descoberta durante execucao
Algo nao previsto encontrado durante o trabalho:

```markdown
### {data} — {agent} durante {contexto}
- **Descoberta**: {o que foi encontrado}
- **Decisao**: {o que foi feito a respeito}
- **Impacto**: {quem/o que e afetado}
- **Acao sugerida**: criar ADR? atualizar spec? ajustar DS? nenhuma?
- **Status**: pendente | aplicado | descartado
```

### Tipo 2 — Correcao do usuario `[CORRECAO DO USUARIO]`
Quando o usuario corrige uma decisao de implementacao, nomeacao, padrao ou comportamento do kit.
Este tipo tem **peso maximo** — o mesmo erro nao deve se repetir em nenhuma implementacao futura.

```markdown
### {data} — [CORRECAO DO USUARIO] durante {contexto}
- **O que foi feito errado**: {descricao do que foi implementado ou proposto}
- **Correcao aplicada**: {o que o usuario pediu para mudar}
- **Motivo**: {justificativa do usuario, se fornecida}
- **Regra derivada**: {regra clara e objetiva — ex: "NUNCA usar X, SEMPRE usar Y em contexto Z"}
- **Escopo**: {afeta todo o projeto? so backend? so frontend? so uma feature?}
- **Status**: resolvido
```

---

## Regra de leitura — OBRIGATORIO

**Antes de executar qualquer task**, o agent carrega o arquivo do seu dominio e:
1. Le todos os learnings do tipo Descoberta com status `pendente`
2. **Le TODOS os learnings marcados `[CORRECAO DO USUARIO]` sem excecao**
3. Aplica as regras derivadas como restricoes antes de escrever qualquer codigo ou proposta

Agents carregam **apenas o arquivo relevante ao seu escopo** + sempre `process-learnings.md`:

| Agent / Skill | Learnings a carregar |
|---|---|
| `/execute` (qualquer `--team`) | **todos** os arquivos de learning — tasks de uma camada tem implicacao na outra |
| `@check-*` frontend | `frontend-learnings.md` |
| `@check-*` backend | `backend-learnings.md` |
| `@adr-creator` | `architecture-learnings.md` + `process-learnings.md` |
| `@adr-validator` | `architecture-learnings.md` + `process-learnings.md` |
| `@planner` | `architecture-learnings.md` + `process-learnings.md` |
| `@spec-review` | arquivo do dominio da spec + `process-learnings.md` |
| `@strategy`, `/prd-create`, `/spec-from-prd` | `business-learnings.md` |

**Regra**: `process-learnings.md` e obrigatorio para skills e agents que executam ou planejam codigo (`/execute`, planner, adr-creator, adr-validator, spec-review). Agents de validacao de codigo carregam apenas o arquivo do dominio.

---

## Ledger — a linha do tempo

Alem dos arquivos por dominio, dois ledgers registram **quando** cada coisa aconteceu:

| Arquivo | Versionado? | Quem grava | O que entra |
|---|---|---|---|
| `ledger.md` | sim | o assistente, no instante | linhas `(llm)`: decisao, correcao, descoberta |
| `ledger-auto.md` | nao (gitignored) | hook `capture.mjs`, a cada turno | linhas `(auto)`: arquivos alterados no turno |

Formato (uma linha por evento, abaixo da marca `<!-- LEDGER:START -->`):

```
<timestamp ISO> | <tipo> | domain:<dominio> | "<resumo>" | (llm)
```

- Descoberta → entrada Tipo 1 no arquivo do dominio **e** linha `descoberta` no `ledger.md`.
- Correcao do usuario → entrada `[CORRECAO DO USUARIO]` **e** linha `correcao` com a regra derivada.
- O hook `reconcile.mjs` le os dois ledgers numa linha do tempo so (inicio de sessao e cada
  prompt): injeta correcoes e pendencias como contexto e avisa quando ha turno com arquivo
  alterado sem linha `(llm)` correspondente. Os hooks sao rede; a fonte primaria e a gravacao
  no instante.
- Detalhe do formato e dos tipos: o cabecalho de `ledger.md`.

---

## Ciclo de vida de um learning

```
Descoberta/Correcao
    → Registrada no arquivo correto
        → Agents carregam antes de executar
            → Erro nao se repete
                → Learning marcado como "aplicado"
                    → Se vira padrao → sugerir ADR via /architect
```
